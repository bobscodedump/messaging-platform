# ============================================
# Stage 1: Base - Install pnpm
# ============================================
FROM node:18-alpine AS base

# Install pnpm globally
RUN corepack enable && corepack prepare pnpm@8.15.6 --activate

# ============================================
# Stage 2: Dependencies - Install all dependencies
# ============================================
FROM base AS dependencies

WORKDIR /app

# Copy workspace configuration files
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml .npmrc ./

# Copy all package.json files from workspace
COPY apps/frontend/package.json apps/frontend/
COPY packages/shared-types/package.json packages/shared-types/
COPY packages/ui/package.json packages/ui/
COPY packages/config-typescript/package.json packages/config-typescript/
COPY packages/config-eslint/package.json packages/config-eslint/

# Install all dependencies (including dev dependencies for build)
RUN pnpm install --frozen-lockfile

# ============================================
# Stage 3: Builder - Build the application
# ============================================
FROM dependencies AS builder

WORKDIR /app

# Copy workspace source code
COPY turbo.json ./
COPY apps/frontend apps/frontend/
COPY packages/shared-types packages/shared-types/
COPY packages/ui packages/ui/
COPY packages/config-typescript packages/config-typescript/
COPY packages/config-eslint packages/config-eslint/

# Build argument for API URL
ARG VITE_API_URL=http://localhost:5001
ENV VITE_API_URL=$VITE_API_URL

# Build the application using turbo (builds shared-types and ui first, then frontend)
RUN pnpm turbo run build --filter=frontend

# ============================================
# Stage 4: Production - Nginx to serve static files
# ============================================
FROM nginx:alpine AS production

# Copy custom nginx configuration
COPY apps/frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Copy built application from builder
COPY --from=builder /app/apps/frontend/dist /usr/share/nginx/html

# Create non-root user
RUN addgroup -g 1001 -S nginx-user && \
    adduser -S nginx-user -u 1001 -G nginx-user && \
    chown -R nginx-user:nginx-user /usr/share/nginx/html && \
    chown -R nginx-user:nginx-user /var/cache/nginx && \
    chown -R nginx-user:nginx-user /var/log/nginx && \
    touch /var/run/nginx.pid && \
    chown -R nginx-user:nginx-user /var/run/nginx.pid

USER nginx-user

# Expose frontend port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000 || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
