# Deep Code Analysis — Nbaurum ERP

This document is a **deep analysis** of the Nbaurum codebase: architecture, patterns, security, data flow, and concrete findings (strengths, bugs, and improvements).

---

## 1. Project Overview

**Nbaurum** is a full-stack **ERP (Enterprise Resource Planning)** application with:

- **Backend**: Node.js, Express, MySQL2, JWT auth, Socket.IO, Zod validation.
- **Frontend**: React 19, Vite 7, React Router 7, Tailwind CSS 4, Axios, Socket.IO client.
- **Domains**: Auth, users, master data, POs, invoices, payments, collections, MoM, reports, notifications, settings, subscriptions, support tickets.

The codebase shows production-oriented hardening: role-based access, PO data isolation, rate limiting, CORS, health checks, DB retries, and structured error handling.

---

## 2. Backend Architecture

### 2.1 Entry and App Setup

- **`server/index.js`**
  - Creates HTTP server from `app.js`.
  - Calls `initializeWithRetry()` for DB before listening; server still starts if DB fails (with warning).
  - Attaches WebSocket via `initializeWebSocket(httpServer)`.
  - Graceful shutdown on SIGTERM/SIGINT (10s timeout).
  - Clear separation: bootstrap → DB → HTTP → WebSocket → listen.

- **`server/src/app.js`**
  - `trust proxy` for correct client IP behind reverse proxies.
  - Helmet, CORS (env-driven `ALLOWED_ORIGINS`), JSON/urlencoded (50MB), body `verify` storing `rawBody`.
  - Custom error middleware for JSON parse and payload-too-large (413).
  - General rate limiter; `/health` and health sub-routes not rate-limited.
  - Static `/uploads`; `/health` then `/api/v1`; 404 and global error handler last.

### 2.2 Database Layer

- **`server/src/db/pool.js`**
  - MySQL2 promise pool with env-based config.
  - Health state: `isHealthy`, `lastCheck`, `consecutiveFailures`, `lastError`, pool stats.
  - `initializeWithRetry()` with exponential backoff and jitter; only retries on transient errors (`ECONNREFUSED`, `ETIMEDOUT`, deadlock, etc.).
  - `performHealthCheck()` runs `SELECT 1` and updates health state.
  - Pool events: log on new connection; on error update health (transient vs permanent).

- **`server/src/db/query.js`**
  - `sanitizeParams()`: maps `undefined` → `null` for MySQL2.
  - `query(sql, params)`: sanitizes params, runs with `executeWithRetry()` (transient + pool exhaustion, up to 3 retries).
  - `transaction(fn)`: getConnection with retry → beginTransaction → fn(conn) → commit; on error rollback; in `finally` release connection.
  - **Bug / style**: In `transaction()`, the `finally` block has inconsistent indentation and an extra closing `}` (lines 181–190). Logic is correct (rollback + release), but the extra `}` can confuse parsers/linters; recommend normalizing indentation and brace structure.

- **`server/src/db/migrate.js`**
  - Ensures `schema_migrations` table; runs `.sql` files from `migrations` in order; each in a transaction; records filename in `schema_migrations`. No migration runner in repo (e.g. `migrations/` folder); ensure migrations exist where deploy runs `npm run migrate`.

### 2.3 Config and Env

- **`server/src/config/env.js`**
  - `required()` / `requiredProduction()` for strict env in production.
  - `JWT_SECRET` required in production (no fallback).
  - DB_*, RATE_LIMIT_*, AUTH_RATE_LIMIT_*, ALLOWED_ORIGINS (split by comma).
  - Sensible defaults for dev (e.g. BCRYPT_ROUNDS 10, JWT_EXPIRES_IN 1d).

### 2.4 Auth Flow (Backend)

- **`authService.js`**
  - Registration: `getSafeRegistrationRoleId(roleId)` restricts public signup to roles 4 (sales) and 5 (viewer); default 5.
  - Passwords hashed with bcrypt (env rounds).
  - Login: normalizes email (trim + lowercase), validates strings, rejects empty; builds sanitized `loginMetadata` (ip, user_agent); parses device; loads user + role; checks status; compares password; on failure logs via `userService.logLoginAttempt` (with failure_reason); on success JWT, token hash, last_login update, login log, session creation; returns token + user (id, fullName, email, role).
  - No credential leakage: same generic message for wrong email vs wrong password; password reset returns same response whether email exists or not.
  - `me()`: user + profile. `requestPasswordReset` / `resetPassword`: token in DB hashed, 1h TTL, single use in a transaction.

- **`requireAuth.js`**
  - Bearer token required; JWT verified with `env.JWT_SECRET`; then **fresh role from DB** (user + status active), not from JWT. This avoids stale role escalation.

- **`requireRole.js`**
  - Simple: `req.user.role` must be in the allowed list; 403 otherwise.

- **`authValidators.js`**
  - Zod: register (fullName, email, password, optional roleId), login (email trimmed/lowercased, password min 8), requestPasswordReset (email), resetPassword (token, newPassword).

- **`authController.js`**
  - Duplicates some validation (email regex, password length) already in Zod; could rely solely on schema to avoid drift. Passes IP and user-agent into authService.login.

### 2.5 PO and Data Isolation

- **`poService.js`**
  - `canViewAllPOs(role)`: admin, operations, finance see all POs; others only own.
  - `listPOs`: for non–view-all, **requires** `userId`; adds `created_by = ?`; throws 403 if userId missing (prevents “list all” by omitting user).
  - `getPO`, `getPOByNumber`, `getPONumbers`, `getPODraft`, `upsertPODraft`, `deletePO`: all enforce same rule (userId + role); 403 if non-admin and no userId or not owner.
  - PO number: `PO-{BU}-{FY}-{NNNN}`; counter table with transaction and `FOR UPDATE`; financial year April–March.
  - Draft: `draft_data` JSON on `purchase_orders`; upsert by id / poNumber; BOQ lines synced; validation (e.g. customer required for new PO).
  - Notifications (e.g. PO created/approved) triggered after commit via `setImmediate` and notificationService + websocketService.

### 2.6 Other Services (Patterns)

- **`userService.js`**
  - Profiles, login history, sessions, preferences, activity log, security settings. Uses `query()`; converts undefined to null for MySQL; handles missing tables (e.g. `user_profiles`) with graceful fallback where appropriate.

- **`invoiceService` / `paymentService`**
  - Use `query` + `transaction`; follow same parameter sanitization and error propagation patterns.

- **`notificationService` + `websocketService.js`**
  - Notifications created in DB; WebSocket used to push to user(s). Socket.IO auth via JWT; userId/role attached to socket; room per user for targeted push.

### 2.7 Middleware and Errors

- **`validate.js`**
  - Generic Zod middleware: `schema.safeParse(req[property])`; 400 with issues on failure; `req[property] = result.data`.

- **`rateLimit.js`**
  - General limiter: by IP; skips `/health`, auth, user profile, master-data (auth has its own limiter). Auth limiter: by IP+email in production; skip successful requests; 429 handler with retry-after. Development/localhost can skip or use relaxed limits.

- **`errors.js`**
  - 404 → NOT_FOUND. 429 → RATE_LIMIT_EXCEEDED. Zod → 400 ERR_VALIDATION. MySQL ER_DUP_ENTRY → 409. ER_NO_REFERENCED_ROW_2 / 1452 → specific messages for FK (customer, PO, created_by). ER_BAD_FIELD_ERROR → schema outdated. JWT errors → 401. Generic 500 with message hidden in production unless known code. Ensures JSON response; handles headersSent and serialization failures.

### 2.8 API Response and Routes

- **`apiResponse.js`**
  - `apiSuccess(data, message)`, `apiError(message, code, data)`. Ensures JSON-serializable payloads; large response warning; safe fallback for non-serializable data.

- **Routes (`v1.js` + v1/*)**
  - Auth, dashboard, master-data, pos, invoices, payments, collections, mom, notifications, settings, subscription, user, reports, support-tickets. PO routes use `requireAuth`, `requireRole('admin','operations','sales')` for create/draft, and `requireRole('admin','operations')` for status/delete; validators applied where defined.

### 2.9 Health

- **`routes/health.js`**
  - GET `/health`: runs `performHealthCheck()`, returns ok/status, env, uptime, responseTime, database (healthy, lastCheck, failures, pool, error). 200 if healthy, 503 otherwise.
  - GET `/health/db`: DB-only, same idea, 503 on failure.

---

## 3. Frontend Architecture

### 3.1 App and Routing

- **`App.jsx`**
  - User state from `localStorage.getItem('user')` on mount; `handleLogin` / `handleLogout` update state and storage.
  - Providers: ErrorBoundary, MasterDataProvider, ToastProvider, Router, AIAssistantProvider.
  - Routes: PublicRoute (marketing: Home, About, WhoWeAre, Pricing, Contact); PublicRoute (Login, ForgotPassword, ResetPassword, Register); ProtectedRoute (AppLayout with all app routes); catch-all NotFoundRoute.
  - Before unload: `flushPendingSaves()` for form persistence.
  - Protected routes wrapped in ErrorBoundary.

### 3.2 API Client

- **`config/api.js`**
  - `getApiBaseUrl()`: `VITE_API_BASE_URL`; in production replaces localhost/empty with `window.location.origin`; in dev can fix https→http for localhost.
  - `getApiUrl()`: base + `/api/v1`.

- **`api/client.js`**
  - Axios instance with baseURL from `getApiUrl()`; 30s timeout; request interceptor adds Bearer from `localStorage.getItem('token')`; FormData clears Content-Type.
  - Response: normalizes string body to JSON; on 401 clears token and user and rejects with UNAUTHORIZED; on 403/404/429 rejects with code/message; network errors get a generic message and NETWORK_ERROR.

### 3.3 Auth (Client)

- **`api/auth.js`**
  - login, register, me, requestPasswordReset, resetPassword; login stores `data.data.token` in localStorage; register uses DEFAULT_REGISTRATION_ROLE_ID 5.
  - **Style**: `import { clearAllLocalStorage } from '../utils/logout'` is in the middle of the file (after resetPassword); should be at the top with `import client from './client'`.
  - logout() calls clearAllLocalStorage() only (no server-side revoke; sessions/tokens remain valid until expiry).

### 3.4 Logout and Storage

- **`utils/logout.js`**
  - `clearAllLocalStorage()`: clears all localStorage and sessionStorage (comprehensive wipe). Fallback on error: remove user, token, rememberEmail, sessionStorage.clear().
  - `performLogout()`: clear + `window.location.href = '/login'`.

### 3.5 Pages and Features

- **Login.jsx**
  - Form state, validation, double-submit guard (ref + loading), redirect from `location.state?.from` or `/dashboard`; uses `login()` from api/auth; stores user in state and localStorage; error/field error handling.
- **Dashboard, Finance, MasterData, PO, Invoice, Payment, etc.**
  - Use api modules and contexts (MasterData, Toast, AIAssistant); role-based UI can be inferred from backend roles (admin, operations, finance, sales, viewer).

---

## 4. Security Summary

| Area | Implementation |
|------|----------------|
| Auth | JWT + bcrypt; role from DB on each request; safe registration roles (4, 5 only). |
| CORS | Env-based ALLOWED_ORIGINS; dev localhost allowed. |
| Rate limit | General + auth-specific; auth skip successful; health excluded. |
| Input | Zod on body; params sanitized (undefined→null) for DB. |
| PO/data | Strict userId + role; 403 if non-admin and no userId or not owner. |
| Errors | No stack/DB detail in production; known codes get clear messages. |
| Password reset | Token hashed, single-use, TTL; same response for existing/missing email. |

---

## 5. Findings and Recommendations

### 5.1 Bugs / Cleanups

1. **`server/src/db/query.js`**  
   - `transaction()` finally block: fix indentation and remove extra `}` so structure is clear and linters don’t complain.

2. **`client/src/api/auth.js`**  
   - Move `import { clearAllLocalStorage } from '../utils/logout'` to the top with other imports.

3. **Logout is client-only**  
   - Token and session remain valid until expiry. For “logout everywhere” or compliance, consider a server-side revoke (e.g. invalidate session/token in DB or blocklist) and call it from the client on logout.

### 5.2 Robustness

- **authController**  
  - Rely on Zod only for email/password rules to avoid duplication and drift.

- **Migrations**  
  - Confirm `migrations/` exists and is deployed with `npm run migrate` so DB schema matches code (e.g. `draft_data`, `user_profiles`, `user_login_history`, `user_sessions`).

- **JWT_EXPIRES_IN parsing**  
  - authService uses a simple `includes('d')` for day vs hour; robust but worth a small shared parser if more formats are added.

### 5.3 Strengths

- Clear separation: routes → controllers → services → db/query; validators and middleware reused.
- PO and auth security taken seriously: role from DB, data isolation by userId, no credential leakage.
- DB: retries, health, sanitized params, transaction rollback/release.
- API: consistent success/error shape, validation, rate limiting, CORS, Helmet.
- Frontend: central API config, interceptors for auth and errors, ErrorBoundary and providers.

---

## 6. File and Dependency Overview

- **Server**: Express, mysql2, bcrypt, jsonwebtoken, uuid, zod, helmet, cors, morgan, express-rate-limit, multer, socket.io, dotenv.
- **Client**: react, react-dom, react-router-dom, axios, socket.io-client, lucide-react, recharts, date-fns, exceljs, jspdf, xlsx, Tailwind, Vite.
- **Critical paths**: Auth (authService → requireAuth → requireRole), PO (poService isolation + draft_data), DB (pool → query/transaction), and frontend (client + auth + logout).

This analysis is intended to serve as a single deep reference for architecture, security, and targeted fixes/improvements.
