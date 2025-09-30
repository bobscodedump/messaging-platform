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
