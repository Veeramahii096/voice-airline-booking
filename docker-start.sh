#!/bin/bash

echo "================================================"
echo "Voice Airline Booking - Docker Deployment"
echo "================================================"
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "ERROR: Docker is not installed!"
    echo "Please install Docker from https://www.docker.com/"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "ERROR: Docker Compose is not installed!"
    echo "Please install Docker Compose"
    exit 1
fi

# Check if Docker is running
if ! docker info &> /dev/null; then
    echo "ERROR: Docker is not running!"
    echo "Please start Docker and try again."
    exit 1
fi

echo "Docker version:"
docker --version
docker-compose --version
echo ""

echo "================================================"
echo "Building and Starting Services..."
echo "================================================"
echo ""
echo "This may take a few minutes on first run..."
echo ""

# Build and start containers
docker-compose up --build -d

if [ $? -ne 0 ]; then
    echo ""
    echo "ERROR: Failed to start containers!"
    echo "Check the error messages above."
    exit 1
fi

echo ""
echo "================================================"
echo "Services Started Successfully!"
echo "================================================"
echo ""
echo "Frontend:  http://localhost"
echo "Backend:   http://localhost:4000"
echo ""
echo "Waiting for services to be ready..."
sleep 10

echo ""
echo "================================================"
echo "Checking Service Health..."
echo "================================================"
echo ""

# Check backend health
if curl -s http://localhost:4000/api/health > /dev/null 2>&1; then
    echo "Backend:  HEALTHY ✓"
else
    echo "Backend:  Starting... (may take a moment)"
fi

# Check frontend health
if curl -s http://localhost/health > /dev/null 2>&1; then
    echo "Frontend: HEALTHY ✓"
else
    echo "Frontend: Starting... (may take a moment)"
fi

echo ""
echo "================================================"
echo "View Logs:"
echo "================================================"
echo "docker-compose logs -f"
echo ""
echo "Stop Services:"
echo "docker-compose down"
echo ""
echo "Opening browser..."

# Open browser based on OS
if [[ "$OSTYPE" == "darwin"* ]]; then
    open http://localhost
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    xdg-open http://localhost 2>/dev/null || echo "Please open http://localhost in your browser"
fi

echo ""
echo "Press Ctrl+C to exit"
echo ""

# Follow logs
docker-compose logs -f
