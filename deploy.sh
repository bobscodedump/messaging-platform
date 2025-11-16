#!/bin/bash

# ========================================
# Messaging Platform EC2 Deployment Script
# ========================================

set -e  # Exit on any error

echo "🚀 Starting deployment of Messaging Platform..."

# Setup pnpm global bin directory if not configured
if [ -z "$PNPM_HOME" ]; then
    echo "📦 Setting up pnpm global bin directory..."
    pnpm setup
    export PNPM_HOME="$HOME/.local/share/pnpm"
    export PATH="$PNPM_HOME:$PATH"
    echo "✅ pnpm global bin configured at $PNPM_HOME"
fi

# Check if .env.production exists
if [ ! -f .env.production ]; then
    echo "❌ Error: .env.production file not found!"
    echo "Please create .env.production with your configuration."
    exit 1
fi

# Load environment variables
export $(grep -v '^#' .env.production | xargs)

echo "📦 Installing dependencies..."

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
    echo "⚠️  pnpm not found. Installing pnpm..."
    curl -fsSL https://get.pnpm.io/install.sh | sh -
    export PNPM_HOME="$HOME/.local/share/pnpm"
    export PATH="$PNPM_HOME:$PATH"
fi

# Install dependencies using pnpm (for monorepo)
pnpm install --frozen-lockfile

echo "✅ Dependencies installed"

# ========================================
# Database Setup
# ========================================
echo "🗄️  Setting up database..."

cd apps/backend

# Generate Prisma Client
npx prisma generate

# Run database migrations
echo "Running database migrations..."
npx prisma migrate deploy

echo "✅ Database migrations completed"

cd ../..

# ========================================
# Build Applications
# ========================================
echo "🏗️  Building applications..."

# Build all apps using Turbo
pnpm turbo run build

echo "✅ Applications built successfully"

# ========================================
# Start/Restart Backend with PM2
# ========================================
echo "🚀 Starting backend with PM2..."

cd apps/backend

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo "⚠️  PM2 not found. Installing PM2..."
    
    # Setup pnpm global bin if not configured
    if [ -z "$PNPM_HOME" ]; then
        pnpm setup
        # Source the shell configuration to get PNPM_HOME
        export PNPM_HOME="$HOME/.local/share/pnpm"
        export PATH="$PNPM_HOME:$PATH"
    fi
    
    # Install PM2 globally with pnpm
    pnpm add -g pm2
fi

# Start or restart backend (tsup builds to dist/index.cjs)
pm2 delete messaging-backend 2>/dev/null || true
pm2 start dist/index.cjs --name messaging-backend --node-args="--max-old-space-size=2048"
pm2 save

echo "✅ Backend started with PM2"

cd ../..

# ========================================
# Start/Restart Frontend with PM2
# ========================================
echo "🎨 Starting frontend with PM2..."

cd apps/frontend

# Install serve if not present (to serve the built frontend)
if ! command -v serve &> /dev/null; then
    echo "⚠️  serve not found. Installing serve..."
    
    # Ensure PNPM_HOME is set
    if [ -z "$PNPM_HOME" ]; then
        export PNPM_HOME="$HOME/.local/share/pnpm"
        export PATH="$PNPM_HOME:$PATH"
    fi
    
    pnpm add -g serve
fi

# Stop existing frontend
pm2 delete messaging-frontend 2>/dev/null || true

# Serve the built dist folder
pm2 start serve --name messaging-frontend -- dist -l 3000 --single
pm2 save

echo "✅ Frontend started with PM2"

cd ../..

# ========================================
# Start Docker Services
# ========================================
echo "🐳 Starting Docker services (PostgreSQL, pgAdmin, n8n)..."

# Stop existing containers
docker compose -f docker-compose.prod.yml down

# Start new containers
docker compose -f docker-compose.prod.yml --env-file .env.production up -d

echo "✅ Docker services started"

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 5

# ========================================
# Deployment Summary
# ========================================
echo ""
echo "=========================================="
echo "✅ Deployment Complete!"
echo "=========================================="
echo ""
echo "📍 Service URLs:"
echo "   Backend API:    http://${EC2_PUBLIC_IP}:5001"
echo "   Frontend:       http://${EC2_PUBLIC_IP}:3000"
echo "   n8n:            http://${EC2_PUBLIC_IP}:5678"
echo "   pgAdmin:        http://${EC2_PUBLIC_IP}:5050"
echo ""
echo "🔐 Service Status:"
pm2 list
echo ""
echo "🐳 Docker Status:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo ""
echo "📝 Next Steps:"
echo "   1. Test backend: curl http://${EC2_PUBLIC_IP}:5001/api/v1/auth/health || echo 'Add health endpoint'"
echo "   2. Open frontend: http://${EC2_PUBLIC_IP}:3000"
echo "   3. Login to n8n: http://${EC2_PUBLIC_IP}:5678"
echo "   4. Import n8n workflow from: ./n8n-templates/appointment-reminder-workflow.json"
echo "   5. Configure Google Calendar OAuth in n8n"
echo ""
echo "💡 Tips:"
echo "   - View backend logs: pm2 logs messaging-backend"
echo "   - View frontend logs: pm2 logs messaging-frontend"
echo "   - View n8n logs: docker logs messaging-n8n"
echo "   - Restart services: pm2 restart all"
echo "   - Stop services: pm2 stop all && docker compose -f docker-compose.prod.yml down"
echo ""
