# Codebase Analysis - Nbaurum ERP System

## Executive Summary

**Nbaurum** is a full-stack Enterprise Resource Planning (ERP) system built with:
- **Frontend**: React 19 + Vite + Tailwind CSS
- **Backend**: Node.js + Express + MySQL
- **Real-time**: Socket.IO for WebSocket communication
- **Architecture**: RESTful API with MVC pattern

The system provides comprehensive financial management, including invoice processing, payment tracking, collection planning, master data management, and real-time notifications.

---

## 1. Project Structure

### 1.1 Directory Organization

```
Nbaurum/
├── client/              # React frontend application
│   ├── src/
│   │   ├── api/        # API client functions
│   │   ├── components/  # Reusable UI components
│   │   ├── contexts/   # React contexts (state management)
│   │   ├── hooks/      # Custom React hooks
│   │   ├── layouts/    # Layout components
│   │   ├── pages/      # Page components
│   │   ├── services/   # Business logic services
│   │   ├── styles/     # CSS stylesheets
│   │   └── utils/      # Utility functions
│   └── public/         # Static assets
│
└── server/             # Node.js backend application
    ├── src/
    │   ├── config/     # Configuration files
    │   ├── controllers/ # Request handlers
    │   ├── db/         # Database utilities & migrations
    │   ├── middleware/ # Express middleware
    │   ├── routes/     # API route definitions
    │   ├── services/   # Business logic layer
    │   ├── utils/      # Utility functions
    │   └── validators/ # Request validation schemas
    └── uploads/        # File upload storage
```

### 1.2 Technology Stack

#### Frontend
- **React 19.2.0** - UI framework
- **Vite 7.2.4** - Build tool and dev server
- **React Router 7.1.4** - Client-side routing
- **Tailwind CSS 4.1.18** - Utility-first CSS framework
- **Axios 1.7.2** - HTTP client
- **Socket.IO Client 4.8.3** - WebSocket client
- **Recharts 3.7.0** - Chart library
- **ExcelJS 4.4.0** - Excel file handling
- **jsPDF 4.0.0** - PDF generation

#### Backend
- **Node.js** - Runtime environment
- **Express 4.22.1** - Web framework
- **MySQL2 3.16.1** - Database driver
- **Socket.IO 4.8.3** - WebSocket server
- **JWT (jsonwebtoken 9.0.3)** - Authentication
- **bcrypt 6.0.0** - Password hashing
- **Zod 4.3.5** - Schema validation
- **Helmet 8.1.0** - Security headers
- **express-rate-limit 8.2.1** - Rate limiting
- **Multer 2.0.2** - File upload handling
- **Morgan 1.10.1** - HTTP request logger

---

## 2. Backend Architecture

### 2.1 Application Entry Point

**File**: `server/index.js`
- Initializes HTTP server
- Establishes database connection with retry logic
- Initializes WebSocket server
- Handles graceful shutdown (SIGTERM, SIGINT)
- Health check integration

**Key Features**:
- Database connection retry with exponential backoff
- Server continues even if DB connection fails initially
- Health endpoint for monitoring

### 2.2 Express Application Setup

**File**: `server/src/app.js`

**Security Features**:
- Helmet.js for security headers
- CORS with configurable allowed origins
- Trust proxy for accurate IP detection
- Rate limiting (general + auth-specific)
- JSON body parsing with size limits (10MB)
- Malformed JSON error handling

**Middleware Stack**:
1. Helmet (security headers)
2. CORS (cross-origin requests)
3. JSON body parser
4. URL-encoded body parser
5. Morgan (logging)
6. General rate limiter
7. Static file serving (`/uploads`)
8. Health check routes
9. API routes (`/api/v1`)
10. 404 handler
11. Error handler

### 2.3 Database Layer

#### Connection Pool (`server/src/db/pool.js`)

**Features**:
- Connection pooling with configurable limits
- Automatic retry with exponential backoff
- Health state tracking
- Transient error detection
- Connection lifecycle management
- Pool statistics monitoring

**Configuration**:
- Default connection limit: 10
- Retry attempts: 5 (configurable)
- Initial retry delay: 1s
- Max retry delay: 30s
- Exponential backoff with jitter

#### Query Utilities (`server/src/db/query.js`)

**Functions**:
- `query(sql, params)` - Execute queries with retry logic
- `transaction(fn)` - Execute transactions with automatic rollback

**Features**:
- Parameter sanitization (undefined → null)
- Automatic retry for transient errors
- Pool exhaustion detection
- Transaction safety with rollback on error

### 2.4 Authentication & Authorization

#### Authentication Service (`server/src/services/authService.js`)

**Features**:
- User registration with bcrypt password hashing
- Login with JWT token generation
- Password reset with secure token hashing
- User agent parsing (browser, OS, device type)
- Login attempt logging
- Session management
- Email normalization (lowercase, trim)

**Security Measures**:
- Password hashing with configurable rounds (default: 10)
- JWT tokens with expiration
- Token hashing for session tracking
- Failed login attempt logging
- Account status checking (active/disabled/locked/suspended)

#### Middleware (`server/src/middleware/requireAuth.js`)

- JWT token verification
- User payload attachment to request
- Error handling for invalid/expired tokens

#### Role-Based Access (`server/src/middleware/requireRole.js`)

- Role-based route protection
- Multiple role support per route

### 2.5 Rate Limiting

**File**: `server/src/middleware/rateLimit.js`

**Limiters**:
1. **General Limiter**: 300 requests per 15 minutes (configurable)
2. **Auth Limiter**: 
   - Development: 100 requests/minute
   - Production: 50 requests/15 minutes (configurable)
   - Uses IP + email for granular limiting
   - Skips successful requests (only counts failures)
3. **Profile Limiter**: 500 requests/15 minutes (very lenient)

**Features**:
- IP address extraction with proxy support
- Localhost detection for development
- Environment-aware limits
- Custom error messages with retry-after headers

### 2.6 API Response Format

**File**: `server/src/utils/apiResponse.js`

**Standard Format**:
```javascript
// Success
{
  success: true,
  message: "ok",
  data: {...}
}

// Error
{
  success: false,
  code: "ERROR_CODE",
  message: "Error message",
  data: {...} // optional
}
```

### 2.7 Error Handling

**File**: `server/src/middleware/errors.js`

**Error Types Handled**:
- 404 Not Found
- 429 Rate Limit Exceeded
- 400 Validation Errors (Zod)
- 409 Duplicate Entry
- 401 JWT Errors
- 500 Internal Server Errors

**Features**:
- Development vs production error messages
- Stack traces in development only
- Consistent error response format

### 2.8 WebSocket Service

**File**: `server/src/services/websocketService.js`

**Features**:
- JWT-based authentication
- User-specific rooms (`user:${userId}`)
- Role-based rooms (`role:${roleName}`)
- Real-time notifications
- Connection tracking
- Heartbeat/ping-pong

**Functions**:
- `sendNotificationToUser(userId, notification)`
- `sendNotificationToUsers(userIds, notification)`
- `sendNotificationToRole(roleName, notification)`
- `sendNotificationToAll(notification)`
- `isUserConnected(userId)`
- `getConnectedUsersCount()`

---

## 3. Frontend Architecture

### 3.1 Application Entry

**File**: `client/src/main.jsx`
- React 19 StrictMode
- Root element rendering

### 3.2 Routing

**File**: `client/src/App.jsx`

**Route Structure**:
- **Public Routes** (MarketingLayout):
  - `/` - Home
  - `/about` - About
  - `/who-we-are` - Who We Are
  - `/pricing` - Pricing
  - `/contact` - Contact

- **Auth Routes**:
  - `/login` - Login
  - `/register` - Register
  - `/forgot-password` - Password reset request
  - `/reset-password` - Password reset

- **Protected Routes** (AppLayout):
  - `/dashboard` - Dashboard
  - `/finance` - Finance overview
  - `/master-data/*` - Master data management
  - `/po-entry/*` - Purchase order entry
  - `/invoices/*` - Invoice management
  - `/payments/*` - Payment management
  - `/collection` - Collection planning
  - `/subscription` - Subscription management
  - `/profile` - User profile
  - `/support` - Support tickets
  - `/alerts` - Alerts
  - `/notifications` - Notifications
  - `/settings` - Settings
  - `/meetings` - Meetings
  - `/reports` - Reports
  - `/mom/*` - Minutes of Meeting

**Authentication State**:
- Stored in localStorage
- Redirects logged-in users from auth pages
- Redirects logged-out users to login

### 3.3 Layout System

**AppLayout** (`client/src/layouts/AppLayout.jsx`):
- Navbar (top navigation)
- Sidebar (collapsible, responsive)
- Main content area
- Mobile overlay for sidebar
- Persistent sidebar state (localStorage)

**MarketingLayout** (`client/src/layouts/MarketingLayout.jsx`):
- Marketing site layout
- Footer and navigation

### 3.4 API Client

**File**: `client/src/api/client.js`
- Axios instance configuration
- JWT token injection from localStorage
- Base URL configuration
- Error handling

**File**: `client/src/config/api.js`
- Environment-aware API URL configuration
- Uses `VITE_API_BASE_URL` environment variable
- Fallback to `http://localhost:4000` in development

### 3.5 State Management

**Contexts**:
- `MasterDataContext` - Master data state management

**Hooks**:
- `useNotifications` - Real-time notifications
- `useAlerts` - Alert management

**Local State**:
- React hooks (useState, useEffect)
- localStorage for persistence

### 3.6 Dashboard

**File**: `client/src/pages/Dashboard.jsx`

**Features**:
- Financial KPIs (outstanding, collected, overdue, etc.)
- Analytics charts (Recharts)
- Recent invoices table
- Upcoming follow-ups
- Overdue highlights
- Alerts and notifications
- Subscription & storage usage
- Date range filtering
- Search and filter functionality
- Role-based quick actions

**Data Sources**:
- Dashboard API endpoints
- Real-time notifications (WebSocket)
- Master data context

---

## 4. Database Schema

### 4.1 Core Tables

**Roles** (`001_core.sql`):
- id (INT, PK)
- name (VARCHAR(50), UNIQUE)
- Default roles: admin, finance, operations, sales, viewer

**Users**:
- id (CHAR(36), UUID)
- full_name, email (UNIQUE), password_hash
- role_id (FK to roles)
- status (ENUM: active, disabled, locked, suspended)
- last_login_at, last_login_ip
- email_verified, phone_verified
- created_by, updated_by (FK to users)
- created_at, updated_at

**Password Resets**:
- id (CHAR(36), UUID)
- user_id (FK to users)
- token_hash (CHAR(64), UNIQUE)
- expires_at, used_at
- created_at

### 4.2 Additional Modules

Based on migration files:
- **Master Data** (002_master_data.sql)
- **Purchase Orders** (003_po.sql)
- **Invoices** (004_invoice.sql, 010_invoice_comprehensive.sql)
- **Payments** (005_payments.sql)
- **Collections** (006_collection.sql)
- **Misc** (007_misc.sql)
- **User Management** (008_user_management.sql)
- **Storage** (009_storage.sql)
- **MoM** (010_mom_enhancement.sql)
- **Notifications** (011_notifications_enhanced.sql)
- **Settings** (012_settings_enhanced.sql)
- **Alerts** (013_alerts_enhanced.sql)
- **Support Tickets** (013_support_tickets.sql)
- **User Columns Fix** (014_fix_users_columns.sql)

---

## 5. API Endpoints

### 5.1 Route Structure

All API routes are prefixed with `/api/v1`

**Main Routes**:
- `/auth` - Authentication
- `/dashboard` - Dashboard data
- `/master-data` - Master data CRUD
- `/pos` - Purchase orders
- `/invoices` - Invoice management
- `/payments` - Payment processing
- `/collections` - Collection planning
- `/mom` - Minutes of Meeting
- `/alerts` - Alert management
- `/alert-generation` - Alert generation
- `/notifications` - Notifications
- `/settings` - Application settings
- `/subscription` - Subscription management
- `/user` - User management
- `/reports` - Reports
- `/support-tickets` - Support ticket system

### 5.2 Authentication Endpoints

- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `GET /api/v1/auth/me` - Get current user (protected)
- `POST /api/v1/auth/request-password-reset` - Request password reset
- `POST /api/v1/auth/reset-password` - Reset password

### 5.3 Health Check

- `GET /health` - Server health status
- `GET /health/db` - Database health status

---

## 6. Security Features

### 6.1 Backend Security

1. **Helmet.js**: Security headers (XSS protection, content security, etc.)
2. **CORS**: Configurable allowed origins
3. **Rate Limiting**: Prevents brute force attacks
4. **JWT Authentication**: Secure token-based auth
5. **Password Hashing**: bcrypt with configurable rounds
6. **Input Validation**: Zod schema validation
7. **SQL Injection Prevention**: Parameterized queries
8. **Error Handling**: No sensitive data in production errors
9. **Session Management**: Token hashing and tracking
10. **Login Attempt Logging**: Security audit trail

### 6.2 Frontend Security

1. **Token Storage**: localStorage (consider httpOnly cookies for production)
2. **Route Protection**: Authentication checks
3. **Role-Based UI**: Conditional rendering based on roles
4. **Input Validation**: Client-side validation

---

## 7. Real-Time Features

### 7.1 WebSocket Integration

- **Server**: Socket.IO with JWT authentication
- **Client**: Socket.IO client with auto-reconnection
- **Rooms**: User-specific and role-based rooms
- **Events**: 
  - `authenticated` - Connection confirmation
  - `notification` - Real-time notifications
  - `ping/pong` - Heartbeat

### 7.2 Notification System

- Real-time notifications via WebSocket
- Notification persistence in database
- Unread count tracking
- Mark as read functionality

---

## 8. File Upload System

### 8.1 Storage

- **Location**: `server/uploads/`
- **Subdirectories**:
  - `profiles/` - User profile images
  - `support-attachments/` - Support ticket attachments

### 8.2 Middleware

- **Multer**: File upload handling
- **Static Serving**: Express static middleware at `/uploads`

---

## 9. Environment Configuration

### 9.1 Backend Environment Variables

**File**: `server/src/config/env.js`

**Required Variables**:
- `JWT_SECRET` - JWT signing secret (required in production)
- `DB_HOST` - Database host (default: localhost)
- `DB_USER` - Database user (default: root)
- `DB_PASSWORD` - Database password
- `DB_NAME` - Database name (default: erp_db)
- `DB_PORT` - Database port (default: 3306)

**Optional Variables**:
- `NODE_ENV` - Environment (development/production)
- `PORT` - Server port (default: 4000)
- `JWT_EXPIRES_IN` - Token expiration (default: 1d)
- `BCRYPT_ROUNDS` - Password hashing rounds (default: 10)
- `RATE_LIMIT_WINDOW_MS` - Rate limit window (default: 15min)
- `RATE_LIMIT_MAX` - Max requests per window (default: 300)
- `AUTH_RATE_LIMIT_MAX` - Auth requests per window (default: 50)
- `ALLOWED_ORIGINS` - Comma-separated CORS origins

### 9.2 Frontend Environment Variables

- `VITE_API_BASE_URL` - Backend API URL (default: http://localhost:4000)

---

## 10. Code Quality & Patterns

### 10.1 Backend Patterns

- **MVC Architecture**: Controllers → Services → Database
- **Separation of Concerns**: Clear layer boundaries
- **Error Handling**: Centralized error middleware
- **Validation**: Zod schemas for request validation
- **Database**: Parameterized queries, transaction support
- **Logging**: Structured console logging

### 10.2 Frontend Patterns

- **Component-Based**: Reusable React components
- **Hooks**: Custom hooks for shared logic
- **Context API**: State management for shared data
- **Service Layer**: API calls abstracted in services
- **Responsive Design**: Mobile-first approach

### 10.3 Code Organization

- **Consistent Naming**: camelCase for variables, PascalCase for components
- **File Structure**: Feature-based organization
- **Import Organization**: Grouped imports (external, internal, relative)
- **Error Boundaries**: Error handling at component level

---

## 11. Deployment Configuration

### 11.1 Files

- `deploy.sh` - Deployment script
- `ecosystem.config.js` - PM2 configuration
- `nginx.conf.example` - Nginx reverse proxy example
- `DEPLOYMENT_GUIDE.md` - Deployment documentation
- `QUICK_START_DEPLOYMENT.md` - Quick start guide

### 11.2 Process Management

- **PM2**: Process manager for Node.js
- **Ecosystem Config**: Multi-process configuration

---

## 12. Testing & Quality Assurance

### 12.1 Current State

- **Linting**: ESLint configured
- **Type Checking**: TypeScript types for React (dev dependencies)
- **No Test Suite**: No unit/integration tests found

### 12.2 Recommendations

1. Add unit tests for services
2. Add integration tests for API endpoints
3. Add E2E tests for critical user flows
4. Add database migration tests
5. Add WebSocket connection tests

---

## 13. Performance Considerations

### 13.1 Backend

- **Connection Pooling**: MySQL connection pool
- **Query Retry**: Automatic retry for transient errors
- **Rate Limiting**: Prevents abuse
- **Caching**: Not implemented (consider Redis for production)
- **Database Indexes**: Present on key columns

### 13.2 Frontend

- **Code Splitting**: Not implemented (consider React.lazy)
- **Asset Optimization**: Vite handles this
- **Bundle Size**: Monitor with build analysis
- **Image Optimization**: Not implemented

---

## 14. Known Issues & Recommendations

### 14.1 Security

1. **Token Storage**: Consider httpOnly cookies instead of localStorage
2. **CORS**: Ensure production origins are properly configured
3. **Rate Limiting**: Monitor and adjust limits based on usage
4. **Password Policy**: Consider enforcing stronger password requirements

### 14.2 Performance

1. **Caching**: Implement Redis for session/data caching
2. **Database**: Consider read replicas for scaling
3. **CDN**: Use CDN for static assets
4. **Code Splitting**: Implement route-based code splitting

### 14.3 Code Quality

1. **Testing**: Add comprehensive test suite
2. **TypeScript**: Consider migrating to TypeScript
3. **Documentation**: Add JSDoc comments to functions
4. **Error Monitoring**: Integrate error tracking (Sentry, etc.)

### 14.4 Features

1. **Email Service**: Implement email sending for password resets
2. **File Validation**: Add file type/size validation for uploads
3. **Audit Logging**: Comprehensive audit trail
4. **Backup Strategy**: Database backup automation

---

## 15. Dependencies Analysis

### 15.1 Critical Dependencies

**Backend**:
- `express` - Core framework
- `mysql2` - Database driver
- `jsonwebtoken` - Authentication
- `bcrypt` - Password hashing
- `socket.io` - WebSocket server

**Frontend**:
- `react` - UI framework
- `react-router-dom` - Routing
- `axios` - HTTP client
- `socket.io-client` - WebSocket client

### 15.2 Security Updates

- Regularly update dependencies
- Monitor security advisories
- Use `npm audit` to check vulnerabilities

---

## 16. Conclusion

The Nbaurum ERP system is a well-structured, full-stack application with:

**Strengths**:
- Clean architecture with separation of concerns
- Comprehensive security features
- Real-time capabilities with WebSocket
- Robust error handling
- Database connection resilience
- Role-based access control
- Modern tech stack

**Areas for Improvement**:
- Test coverage
- Documentation (API docs, code comments)
- Performance optimization (caching, code splitting)
- Email service integration
- Monitoring and logging infrastructure

The codebase demonstrates good engineering practices and is production-ready with proper configuration and deployment setup.

---

**Analysis Date**: 2024
**Codebase Version**: Current
**Total Files Analyzed**: 100+ files
**Lines of Code**: ~15,000+ (estimated)

