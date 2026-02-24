#!/bin/bash
echo "🔥 Starting in DEVELOPMENT mode with hot reload..."
echo ""
echo "Frontend and Backend will auto-reload when you change code!"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build
#!/bin/bash
# Enable BuildKit for faster builds
export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1

echo "🚀 Starting services with BuildKit optimization..."
docker-compose up -d --build

echo ""
echo "✅ Services started!"
echo ""
echo "Frontend: http://localhost:3000"
echo "Backend:  http://localhost:8080"
echo "Database: localhost:5433"
echo ""
echo "View logs: docker-compose logs -f"

