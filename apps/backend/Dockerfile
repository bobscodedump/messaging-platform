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
COPY apps/backend/package.json apps/backend/
COPY packages/shared-types/package.json packages/shared-types/
COPY packages/logger/package.json packages/logger/
COPY packages/config-typescript/package.json packages/config-typescript/
COPY packages/config-eslint/package.json packages/config-eslint/
COPY packages/jest-presets/package.json packages/jest-presets/

# Install all dependencies (including dev dependencies for build)
RUN pnpm install --frozen-lockfile

# ============================================
# Stage 3: Builder - Build the application
# ============================================
FROM dependencies AS builder

WORKDIR /app

# Copy workspace source code
COPY turbo.json ./
COPY apps/backend apps/backend/
COPY packages/shared-types packages/shared-types/
COPY packages/logger packages/logger/
COPY packages/config-typescript packages/config-typescript/
COPY packages/config-eslint packages/config-eslint/
COPY packages/jest-presets packages/jest-presets/

# Generate Prisma client
WORKDIR /app/apps/backend
RUN pnpm exec prisma generate

# Build the application using turbo (builds shared-types first, then backend)
WORKDIR /app
RUN pnpm turbo run build --filter=backend

# ============================================
# Stage 4: Production - Minimal runtime image
# ============================================
FROM node:18-alpine AS production

# Install pnpm
RUN corepack enable && corepack prepare pnpm@8.15.6 --activate

WORKDIR /app

# Copy workspace configuration for production install
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml .npmrc ./
COPY apps/backend/package.json apps/backend/
COPY packages/shared-types/package.json packages/shared-types/
COPY packages/logger/package.json packages/logger/
COPY packages/config-typescript/package.json packages/config-typescript/
COPY packages/config-eslint/package.json packages/config-eslint/
COPY packages/jest-presets/package.json packages/jest-presets/

# Install ONLY production dependencies
RUN pnpm install --frozen-lockfile --prod

# Copy Prisma schema (needed at runtime for migrations)
COPY apps/backend/prisma apps/backend/prisma/

# Copy generated Prisma client from builder stage
# With pnpm, Prisma generates to node_modules/.pnpm/<package>/node_modules/{@prisma/client,.prisma}
COPY --from=builder /app/node_modules/.pnpm node_modules/.pnpm

# Copy built application from builder
WORKDIR /app/apps/backend
COPY --from=builder /app/apps/backend/dist ./dist

# Copy shared-types source (TypeScript files are used directly)
COPY --from=builder /app/packages/shared-types /app/packages/shared-types
COPY --from=builder /app/packages/logger /app/packages/logger
COPY --from=builder /app/packages/config-typescript /app/packages/config-typescript

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs

# Expose backend port
EXPOSE 5001

# Set environment variables
ENV NODE_ENV=production
ENV PORT=5001
ENV HOST=0.0.0.0

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5001/api/v1/auth/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Create startup script that runs migrations before starting the app
RUN echo '#!/bin/sh' > /app/start.sh && \
    echo 'set -e' >> /app/start.sh && \
    echo 'echo "Running database migrations..."' >> /app/start.sh && \
    echo 'cd /app/apps/backend && pnpm exec prisma migrate deploy' >> /app/start.sh && \
    echo 'echo "Migrations complete. Starting application..."' >> /app/start.sh && \
    echo 'exec node dist/index.cjs' >> /app/start.sh && \
    chmod +x /app/start.sh

# Start the application with migrations
CMD ["/app/start.sh"]
