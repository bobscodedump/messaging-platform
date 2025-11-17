#!/bin/bash

# ========================================
# Docker Compose Startup Script
# ========================================

set -e

echo "🐳 Starting Messaging Platform with Docker Compose..."

# Check if .env.production exists
if [ ! -f .env.production ]; then
    echo "❌ Error: .env.production file not found!"
    echo "📝 Please create .env.production from .env.docker.example:"
    echo "   cp .env.docker.example .env.production"
    echo "   nano .env.production  # Edit with your values"
    exit 1
fi

# Load environment variables to check required values
export $(grep -v '^#' .env.production | xargs)

# Validate required environment variables
REQUIRED_VARS=("POSTGRES_PASSWORD" "JWT_SECRET" "N8N_PASSWORD")
MISSING_VARS=()

for VAR in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!VAR}" ]; then
        MISSING_VARS+=("$VAR")
    fi
done

if [ ${#MISSING_VARS[@]} -ne 0 ]; then
    echo "❌ Error: Missing required environment variables:"
    for VAR in "${MISSING_VARS[@]}"; do
        echo "   - $VAR"
    done
    echo ""
    echo "📝 Please edit .env.production and set all required values"
    exit 1
fi

echo "✅ Environment variables validated"
echo ""

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker compose -f docker-compose.prod.yml down

# Build and start services
echo "🏗️  Building and starting services..."
docker compose -f docker-compose.prod.yml --env-file .env.production up --build -d

echo ""
echo "⏳ Waiting for services to become healthy..."

# Wait for PostgreSQL to be healthy
echo "   Waiting for PostgreSQL..."
until docker compose -f docker-compose.prod.yml ps postgres | grep -q "healthy"; do
    sleep 2
done
echo "   ✅ PostgreSQL is ready"

# Run database migrations
echo "🗄️  Running database migrations..."
docker compose -f docker-compose.prod.yml exec -T backend sh -c "cd /app/apps/backend && npx prisma migrate deploy" || echo "⚠️  Migrations may have already been applied"

# Wait for backend to be healthy
echo "   Waiting for Backend API..."
until docker compose -f docker-compose.prod.yml ps backend | grep -q "healthy"; do
    sleep 2
done
echo "   ✅ Backend API is ready"

# Wait for frontend to be healthy
echo "   Waiting for Frontend..."
until docker compose -f docker-compose.prod.yml ps frontend | grep -q "healthy"; do
    sleep 2
done
echo "   ✅ Frontend is ready"

echo ""
echo "=========================================="
echo "✅ Deployment Complete!"
echo "=========================================="
echo ""
echo "📍 Service URLs:"
echo "   Frontend:       http://${EC2_PUBLIC_IP:-localhost}:3000"
echo "   Backend API:    http://${EC2_PUBLIC_IP:-localhost}:5001"
echo "   n8n:            http://${EC2_PUBLIC_IP:-localhost}:5678"
echo "   PostgreSQL:     localhost:5432"
echo ""
echo "🔐 n8n Credentials:"
echo "   Username: ${N8N_USER:-admin}"
echo "   Password: ${N8N_PASSWORD}"
echo ""
echo "📊 View logs:"
echo "   All services:   docker compose -f docker-compose.prod.yml logs -f"
echo "   Backend only:   docker compose -f docker-compose.prod.yml logs -f backend"
echo "   Frontend only:  docker compose -f docker-compose.prod.yml logs -f frontend"
echo ""
echo "🛑 Stop services:"
echo "   docker compose -f docker-compose.prod.yml down"
echo ""
echo "📝 Next Steps:"
echo "   1. Open frontend: http://${EC2_PUBLIC_IP:-localhost}:3000"
echo "   2. Login to n8n: http://${EC2_PUBLIC_IP:-localhost}:5678"
echo "   3. Import workflow from: ./n8n-templates/appointment-reminder-workflow.json"
echo ""
