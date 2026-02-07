# Technical Interview Guide: Authentication & Login Flow

**Purpose of this document:** A senior-level walkthrough of the authentication and login code in this codebase, suitable for interview preparation and onboarding. It explains not only *what* the code does but *why* it is written that way.

---

## Table of Contents

1. [Overall Purpose and Problem](#1-overall-purpose-and-problem)
2. [Architecture and Design Decisions](#2-architecture-and-design-decisions)
3. [Detailed Explanation by Layer](#3-detailed-explanation-by-layer)
4. [Data Flow Through the Program](#4-data-flow-through-the-program)
5. [Time and Space Complexity](#5-time-and-space-complexity)
6. [Edge Cases and Error Handling](#6-edge-cases-and-error-handling)
7. [Best Practices Used](#7-best-practices-used)
8. [Possible Improvements and Optimizations](#8-possible-improvements-and-optimizations)
9. [Interview-Style Questions](#9-interview-style-questions)

---

## 1. Overall Purpose and Problem

### What problem does this code solve?

The code implements **secure user authentication** for a full-stack ERP-style application (NB Aurum). It must:

- **Identify users** (login with email/password).
- **Authorize requests** (protect API routes so only logged-in users can access them).
- **Persist session** (JWT so the client can send the token on every request without re-login).
- **Handle failures safely** (no user enumeration, consistent error shapes, rate limiting).
- **Support password reset** (token-based, time-limited, one-time use).

### Why it matters in an interview

Interviewers use auth code to assess:

- Security awareness (hashing, tokens, validation).
- Understanding of client/server flow and state.
- Error handling and edge-case thinking.
- Code organization (separation of concerns, validation layers).

---

## 2. Architecture and Design Decisions

### High-level architecture

```
┌─────────────────┐     HTTP/JSON      ┌─────────────────┐
│  React (Vite)   │ ◄────────────────► │  Express (Node) │
│  Login.jsx      │   Bearer JWT       │  authController │
│  api/auth.js    │   in headers       │  authService    │
│  api/client.js  │                    │  requireAuth    │
└────────┬────────┘                    └────────┬────────┘
         │                                      │
         │ localStorage                         │ MySQL
         │ (token, user, rememberEmail)          │ (users, roles,
         ▼                                      │  password_resets)
┌─────────────────┐                    ┌─────────────────┐
│  Browser        │                    │  Database        │
└─────────────────┘                    └─────────────────┘
```

### Key design decisions

| Decision | Rationale |
|----------|-----------|
| **JWT in localStorage** | Simple for SPA; server validates every request. Trade-off: XSS can steal token; for higher security, httpOnly cookies are an alternative. |
| **Role from DB on each request** | `requireAuth` loads role from DB instead of trusting JWT payload alone, so role changes take effect immediately. |
| **Controller → Service → DB** | Controllers handle HTTP; services hold business logic and DB access. Keeps routes thin and testable. |
| **Centralized API client** | One axios instance with interceptors: attach token, normalize errors (401 → clear token, 429 → rate limit message). |
| **Double-submit prevention** | Refs (`isSubmittingRef`, `submitButtonClickedRef`) plus timeout so Enter and double-clicks don’t trigger multiple submissions. |

---

## 3. Detailed Explanation by Layer

### 3.1 Frontend: `Login.jsx` (React component)

**Purpose:** Render the login form, validate input, call the login API, and hand the user and redirect to the app.

#### State

```jsx
const [formData, setFormData] = useState({ email: '', password: '' })
const [showPassword, setShowPassword] = useState(false)
const [rememberMe, setRememberMe] = useState(false)
const [error, setError] = useState('')
const [loading, setLoading] = useState(false)
const [fieldErrors, setFieldErrors] = useState({})
```

- **formData:** Controlled inputs (single source of truth).
- **showPassword:** Toggle password visibility (UX).
- **rememberMe:** Required by business rule; also drives “remember email” in localStorage.
- **error:** Server or validation error message (one-shot).
- **fieldErrors:** Per-field validation (email/password).
- **loading:** Disables form and shows “Signing in...”.

#### Refs (why refs instead of state?)

```jsx
const submitTimeoutRef = useRef(null)
const isSubmittingRef = useRef(false)
const submitButtonClickedRef = useRef(false)
```

- **submitButtonClickedRef:** Set to `true` only when the button is actually clicked. Used so that **Enter** in a field does not submit unless the user has clicked Submit (avoids accidental submit).
- **isSubmittingRef:** Guards against double submission; not tied to render, so no extra re-renders.
- **submitTimeoutRef:** Holds the timeout that resets `loading` after 500 ms so the UI doesn’t flash back to enabled too quickly.

**Interview point:** Refs are used when you need a value that must persist across renders but should not trigger re-renders when it changes (e.g. timeouts, “did the user click the button?”).

#### Validation: `validateForm()`

```jsx
const validateForm = () => {
  const errors = {}
  if (!rememberMe) {
    setError('You must check "Remember me" to sign in')
    // ... scroll to error
    return false
  }
  if (!formData.email) errors.email = 'Email is required'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
    errors.email = 'Please enter a valid email address'
  if (!formData.password) errors.password = 'Password is required'
  setFieldErrors(errors)
  return Object.keys(errors).length === 0
}
```

- **Business rule:** “Remember me” is required (product decision).
- **Email:** Required + regex for basic format (matches backend).
- **Password:** Required (length/strength can be added).
- Returns `true` only when there are no errors; otherwise sets `fieldErrors` and returns `false`.

#### Submit flow: `handleSubmit`

1. **Prevent default** and stop propagation.
2. **Guard:** If the button wasn’t clicked (`!submitButtonClickedRef.current`) or already submitting, return.
3. **Clear** any previous submit timeout.
4. **Validate** with `validateForm()`; return if invalid.
5. **Set loading:** `isSubmittingRef.current = true`, `setLoading(true)`.
6. **Call API:** `login(formData.email, formData.password)`.
7. **On success:**  
   - Call `onLogin(userData)` (parent stores user and token).  
   - Persist or clear “remember email” in localStorage.  
   - `navigate(from, { replace: true })` (redirect to intended route or dashboard).
8. **On error:** Map `err.response.data` (rate limit, invalid credentials, etc.) to a user-facing message and set `error`.
9. **Finally:** After 500 ms, clear loading and reset `isSubmittingRef` via timeout (stored in `submitTimeoutRef` for cleanup).

**Interview point:** The 500 ms delay avoids the button flicking back to “Sign In” before the redirect; cleanup in `useEffect` prevents leaks if the component unmounts during that delay.

#### Effects

- **Cleanup on unmount:** Clear `submitTimeoutRef.current` so the timeout doesn’t run after unmount.
- **Remember email:** On mount, read `rememberEmail` from localStorage and prefill email and “Remember me” if present.

---

### 3.2 Frontend: `api/auth.js` (API layer)

**Purpose:** Thin wrapper over the HTTP client for auth actions.

```javascript
export const login = async (email, password) => {
  const { data } = await client.post('/auth/login', { email, password })
  localStorage.setItem('token', data.data.token)
  return data
}
```

- **Why store token here?** Login is the only place that *creates* the session; storing the token right after a successful response keeps token handling in one place. The rest of the app uses the token via the client’s request interceptor.
- **Return shape:** Returns the full `data` (e.g. `{ data: { token, user } }`) so the caller can use `response.data?.user` and the parent can call `onLogin(userData)`.

**Interview point:** The backend might return `{ success, data: { token, user } }`. The client assumes a consistent envelope and reads `data.data.token`; any change in API contract would be centralized here.

---

### 3.3 Frontend: `api/client.js` (Axios instance + interceptors)

**Purpose:** Single place for base URL, timeouts, attaching the token, and normalizing errors.

#### Request interceptor

```javascript
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  if (config.data instanceof FormData) delete config.headers['Content-Type']
  return config
})
```

- Every request gets the current token from localStorage (if any).
- FormData requests don’t set `Content-Type` so the browser can set the multipart boundary.

#### Response interceptor (success)

- If the body is a string, try to parse as JSON; on failure, reject with a structured error so the app can show “Invalid response” instead of crashing.

#### Response interceptor (error)

- **No response (e.g. network error):** Reject with a user-friendly “Network error” and a `NETWORK_ERROR` code.
- **401:** Remove `token` and `user` from localStorage, then reject with “Session expired.” so the app can redirect to login.
- **403 / 404 / 429 / 413:** Map to a clear message and a stable `code` for the UI.
- **Other:** Use server message or fallback and pass through `code` and `status`.

**Interview point:** Centralizing 401 handling in the client ensures that any endpoint returning 401 results in clearing the session and a consistent UX (e.g. “Session expired. Please log in again.”).

---

### 3.4 Backend: `authController.js` (HTTP layer)

**Purpose:** Validate request shape and body, call the service, and return HTTP status and JSON.

#### Login controller (annotated)

```javascript
const login = async (req, res, next) => {
  try {
    // 1. Guard: body must be an object (avoid body-parser edge cases)
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json(apiError('Invalid request body', 'ERR_INVALID_BODY', ...))
    }

    // 2. Normalize and validate types (defense against non-string or missing)
    const email = typeof req.body.email === 'string' ? req.body.email.trim() : null
    const password = typeof req.body.password === 'string' ? req.body.password : null

    if (!email || email === '') {
      return res.status(400).json(apiError('Email is required...', 'ERR_MISSING_FIELDS', ...))
    }
    if (!password || password === '') {
      return res.status(400).json(apiError('Password is required...', 'ERR_MISSING_FIELDS', ...))
    }

    // 3. Format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return res.status(400).json(apiError('Invalid email format', 'ERR_INVALID_EMAIL', ...))
    }

    // 4. Metadata for logging/audit (no PII in logs from controller)
    const ip_address = getClientIp(req) || null
    const user_agent = req.headers['user-agent'] || null
    const result = await authService.login(email, password, { ip_address, user_agent })

    res.json(apiSuccess(result, 'Login successful'))
  } catch (err) {
    if (err.message === 'INVALID_CREDENTIALS') {
      return res.status(401).json(apiError('Invalid email or password', 'ERR_INVALID_CREDENTIALS', ...))
    }
    next(err)
  }
}
```

**Design choices:**

- **Explicit type checks:** Ensures email/password are strings and trims email. Prevents odd behavior if the client sends numbers or arrays.
- **Single credential error message:** “Invalid email or password” for both wrong email and wrong password to avoid **user enumeration** (attackers can’t tell which is wrong).
- **Structured errors:** `apiError(message, code, details)` so the client can branch on `code` (e.g. rate limit, invalid credentials) without parsing the message.

---

### 3.5 Backend: `authService.js` (business logic)

**Purpose:** Registration, login (credential check + JWT + audit), password reset, and safe role assignment.

#### Registration: safe role

```javascript
const ALLOWED_PUBLIC_REGISTRATION_ROLE_IDS = [2]  // e.g. "user" only

const getSafeRegistrationRoleId = (roleId) => {
  const id = roleId != null ? Number(roleId) : NaN
  if (Number.isInteger(id) && ALLOWED_PUBLIC_REGISTRATION_ROLE_IDS.includes(id)) {
    return id
  }
  return DEFAULT_REGISTRATION_ROLE_ID  // 2
}
```

- Public registration cannot assign admin or other privileged roles. Even if the client sends `roleId: 1`, the service forces role `2`. This is a **security requirement**, not just validation.

#### Login: step by step

1. **Validate input:** Reject empty or non-string email/password with `INVALID_CREDENTIALS` (same message as wrong password).
2. **Normalize email:** `trim().toLowerCase()` so “User@Example.com” and “user@example.com” are the same.
3. **Sanitize metadata:** Ensure `ip_address` and `user_agent` are strings or null before DB/logging.
4. **Load user:** `SELECT` user + role by email; if none, optionally log a failed attempt (by email lookup) and throw `INVALID_CREDENTIALS`.
5. **Status check:** If user is not `active`, log failure and throw `INVALID_CREDENTIALS`.
6. **Password check:** `bcrypt.compare(password, user.password_hash)`; on failure, log and throw.
7. **Issue JWT:** `jwt.sign({ id, role, email }, JWT_SECRET, { expiresIn })`.
8. **Update user:** Set `last_login_at`, `last_login_ip`.
9. **Audit:** Log successful login and create/update session (e.g. token hash, IP, user agent, expiry).
10. **Return:** `{ token, user: { id, fullName, email, role } }`.

**Interview point:** Login intentionally uses one generic message and similar code paths for “no user” and “wrong password” to avoid leaking whether an email is registered.

#### Password reset

- **requestPasswordReset(email):** If user exists and is active, create a random token, store its hash and expiry in `password_resets`, then return a generic success. In non-production, the token may be returned for testing; in production, the token would be sent by email only.
- **resetPassword(token, newPassword):** In a **transaction**, find the reset row by token hash, check not used and not expired, update user password and set `used_at` on the reset row. This makes the link **one-time use** and avoids race conditions.

---

### 3.6 Backend: `requireAuth.js` (middleware)

**Purpose:** Protect routes by verifying the JWT and attaching the current user (and **fresh role** from DB).

```javascript
const requireAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json(apiError('Unauthorized: Missing or invalid authorization header', 'UNAUTHORIZED'))
  }
  const token = authHeader.split(' ')[1]
  try {
    const payload = jwt.verify(token, env.JWT_SECRET)
    const userId = payload.id
    if (!userId) return res.status(401).json(...)

    // Critical: load role from DB, not from JWT
    const rows = await query(
      `SELECT u.id, u.status, r.name as role FROM users u
       JOIN roles r ON r.id = u.role_id
       WHERE u.id = ? AND u.status = ? LIMIT 1`,
      [userId, 'active']
    )
    if (!rows || rows.length === 0) {
      return res.status(401).json(apiError('User not found. Please log out and log in again.', 'ERR_USER_NOT_FOUND'))
    }

    req.user = { id: payload.id, email: payload.email, role: rows[0].role }
    return next()
  } catch (err) {
    if (err.name === 'TokenExpiredError' || err.name === 'JsonWebTokenError') {
      return res.status(401).json(apiError('Unauthorized: Invalid or expired token', 'INVALID_TOKEN'))
    }
    return next(err)
  }
}
```

**Why load role from DB?**

- If an admin is demoted to “user”, the JWT might still contain the old role until it expires. Checking the DB on every request ensures **authorization is always up-to-date** (role and active status).

**Interview point:** “Where is the user’s role enforced?” Answer: both in the JWT (for quick identification) and in the DB on each request (for correct authorization).

---

## 4. Data Flow Through the Program

### Login (happy path)

1. User enters email/password, checks “Remember me”, clicks Sign In.
2. **Login.jsx:** `validateForm()` runs; then `login(email, password)` is called.
3. **api/auth.js:** `client.post('/auth/login', { email, password })`; on success, `localStorage.setItem('token', data.data.token)`; returns `data`.
4. **api/client.js:** Request has no token yet; response is 200 with `{ data: { token, user } }`.
5. **Server:** `authController.login` validates body → `authService.login` loads user, compares password, creates JWT, updates last login, logs/session → responds with `apiSuccess(result)`.
6. **Login.jsx:** Receives `response.data.user`, calls `onLogin(userData)`, stores “remember email” if needed, `navigate(from)`.
7. **App (parent):** `onLogin` sets user in state and in localStorage; next API calls go through **client.js** request interceptor, which adds `Authorization: Bearer <token>`.
8. **Protected route:** Any call to a protected endpoint sends the token; server runs `requireAuth` → verifies JWT, loads user/role from DB → `req.user` set → handler runs.

### Login (invalid credentials)

1. Same steps 1–4, but `authService.login` throws `INVALID_CREDENTIALS` after bcrypt compare (or no user / inactive).
2. **authController** catches and returns `401` with `ERR_INVALID_CREDENTIALS` and message “Invalid email or password.”
3. **client.js** sees 401, removes token and user from localStorage, rejects with a structured error.
4. **Login.jsx** catch block maps error to `errorMessage`, sets `error`, and in `finally` clears loading after 500 ms.

---

## 5. Time and Space Complexity

- **Login (service):**
  - **Time:** O(1) DB lookups (indexed on email and id), O(bcrypt) for compare (configurable work factor). Dominant cost is bcrypt.
  - **Space:** O(1) for user row and JWT.
- **requireAuth (middleware):**
  - **Time:** O(1) JWT verify + one DB query by primary key.
  - **Space:** O(1).
- **Login.jsx:**
  - **Time:** Validation is O(1) per field; one network request.
  - **Space:** O(1) state and refs; no large structures.

---

## 6. Edge Cases and Error Handling

| Scenario | Handling |
|----------|----------|
| Missing or non-object body | 400, `ERR_INVALID_BODY` |
| Email/password not strings or empty | 400, `ERR_MISSING_FIELDS` |
| Invalid email format | 400, `ERR_INVALID_EMAIL` |
| Wrong password or unknown email | 401, same message (no enumeration) |
| User inactive / disabled | 401, same message |
| Expired or invalid JWT | 401, `INVALID_TOKEN`; client clears token and user |
| Rate limit (e.g. auth) | 429; client shows “Too many attempts…” |
| Network failure | Client shows “Network error…”; no token clear |
| Double submit / Enter key | Refs and guard prevent duplicate requests |
| Component unmount during submit | Timeout cleared in useEffect cleanup |

---

## 7. Best Practices Used

- **Validation at both layers:** Client for UX, server for security and consistency.
- **Single credential error message** to avoid user enumeration.
- **Structured error codes** (`ERR_*`, `RATE_LIMIT_EXCEEDED`) for client branching.
- **Role from DB** in middleware so permission changes take effect immediately.
- **Password hashing** with bcrypt (no plaintext storage).
- **Reset tokens hashed** in DB; one-time use and expiry in a transaction.
- **Safe registration roles** so public signup cannot grant admin.
- **Controlled form state** and refs for submit guards to avoid duplicate requests and timeouts.

---

## 8. Possible Improvements and Optimizations

- **Refresh tokens:** Short-lived access token + refresh token to reduce exposure while keeping users logged in.
- **httpOnly cookie for token:** Reduces XSS risk (token not in JS/localStorage).
- **Rate limit per email** (in addition to per IP) to slow down credential stuffing.
- **Captcha or similar** after N failed attempts to mitigate bots.
- **Stronger password rules** (e.g. complexity) and client-side hints.
- **Extract validation** (e.g. Zod/Joi) shared between client and server for one schema.
- **Unit tests** for `validateForm`, authService login/reset, and requireAuth behavior.

---

## 9. Interview-Style Questions

### Beginner

- What is the difference between `useState` and `useRef` in the Login component?  
  *State drives UI and re-renders; refs hold values across renders without re-renders (e.g. timeouts, submit guard).*
- Why do we store the token in localStorage after login?  
  *So the API client can attach it to every request via the request interceptor.*
- What HTTP status is used for “wrong password”?  
  *401 Unauthorized, with a generic message.*

### Intermediate

- Why does `requireAuth` load the user’s role from the database instead of using the JWT payload?  
  *So role or status changes (e.g. admin demoted, user disabled) take effect on the next request without waiting for JWT expiry.*
- How does the code prevent user enumeration on login?  
  *Same error message and 401 for “user not found” and “wrong password”; optional logging does not expose which case it was to the client.*
- Why use both `isSubmittingRef` and `loading` state?  
  *Ref prevents double submission without causing re-renders; state drives the “Signing in...” UI and disables the button.*

### Advanced

- How would you add refresh tokens without changing the rest of the app’s API surface?  
  *Issue access + refresh token on login; store refresh in httpOnly cookie or secure storage; add middleware or client interceptor that on 401 calls a refresh endpoint and retries the request; require re-login if refresh fails or is revoked.*
- Where would you add rate limiting for login, and what would you key it on?  
  *Server-side, before calling authService.login; key by IP and optionally by email (e.g. per-email limit) to limit credential stuffing while allowing many users from one IP.*
- How does the password reset flow stay safe if the token is leaked?  
  *Token is one-time (used_at), time-limited (expires_at), and stored as hash in DB; reset is done in a transaction so the row is marked used and password updated atomically.*

---

*This guide focuses on the authentication and login flow. The same codebase uses similar patterns (controllers, services, validation, error codes) for payments, invoices, and other features.*
