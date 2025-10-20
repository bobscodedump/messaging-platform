## Messaging Platform Monorepo

Apps

- apps/backend: Express + Prisma API
- apps/frontend: Vite + React SPA

Packages

- packages/shared-types, logger, jest-presets, eslint and tsconfig bases

### Development

- Backend: pnpm -F backend dev
- Frontend: pnpm -F frontend dev (Vite proxies /api to backend)

### Auth overview

- JWT-based auth (Bearer tokens) using Passport JWT on the backend
- Frontend stores token in localStorage and injects Authorization header using an axios interceptor
- All API routes under /api/v1 (except /auth/login, /auth/refresh and /status) require a valid JWT

Backend endpoints

- POST /api/v1/auth/login { email, password } -> { token }
- GET /api/v1/auth/me -> current user profile
- POST /api/v1/auth/refresh -> rotates refresh cookie and returns a new access token
- POST /api/v1/auth/logout -> clears refresh cookie

Company scoping

- Users belong to a company; protected routes validate companyId params against the token
- Create endpoints auto-attach companyId from the authenticated user when not provided

Environment variables

- JWT_SECRET: secret for signing tokens (required in production)
- JWT_EXPIRES_IN: token lifetime (default 2h). Examples: "2h", "1d"
- REFRESH_SECRET: secret for refresh tokens (defaults to JWT_SECRET + '\_refresh')
- REFRESH_EXPIRES_IN: refresh token lifetime (default 7d)
- DATABASE_URL: Prisma database connection string

Frontend behavior

- Unauthenticated users are redirected to /login
- On 401/403 responses, the app first calls /auth/refresh once and retries the request. If refresh fails, it logs out and redirects to /login?next=...
- After successful login, the app navigates to the requested page from the next param or to /

Testing

- Backend tests: pnpm -F backend test
- The scheduler is disabled during tests (NODE_ENV=test)

### CSV Import

The platform supports bulk imports for contacts and schedules with flexible date/time formats.

**Contacts CSV** (`/sample-contacts.csv`):
- Required headers: `firstName`, `lastName`, `phoneNumber`, `email`, `address`, `birthDate`, `note`, `groups`
- `birthDate` formats: `YYYY-MM-DD`, `M/D/YY`, `M/D/YYYY`, `MM/DD/YY`, `MM/DD/YYYY`
- `groups`: comma or semicolon-separated group names (auto-created if they don't exist)

**Schedules CSV** (`/sample-schedules.csv`):
- Required headers: `name`, `scheduleType`, `content`, `recipientContacts`, `recipientGroups`, `scheduledAt`, `recurringDay`, `recurringDayOfMonth`, `recurringMonth`, `recurringDayOfYear`
- `scheduleType`: `ONE_TIME`, `WEEKLY`, `MONTHLY`, `YEARLY`, `BIRTHDAY`
- `scheduledAt` (for ONE_TIME): flexible formats like `2025-12-01 10:00`, `12/01/2025 10:00`, or full ISO `2025-12-01T10:00:00Z`
- `recipientContacts`: comma/semicolon-separated full names like "Ada Lovelace, Grace Hopper"
- `recipientGroups`: comma/semicolon-separated group names

**Supported datetime formats** (all times assumed UTC unless timezone specified):
- `2025-12-01 10:00` or `2025-12-01 10:00:00`
- `2025/12/01 10:00`
- `12/01/2025 10:00` (US format)
- `2025-12-01T10:00:00Z` (full ISO with timezone)
