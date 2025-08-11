#!/bin/bash
set -e

echo "Starting deployment at $(date)"

# Navigate to backend folder
cd ~/Re-Prompt-That/backend

# Pull latest code
echo "Pulling latest code..."
git pull origin main

# Stop existing containers
echo "Stopping existing containers..."
docker-compose down

# Clean up old images
echo "Cleaning up old images..."
docker system prune -f

# Build and start new containers
echo "Building and starting new containers..."
docker-compose up --build -d

# Wait for health check
echo "Waiting for health check..."
sleep 30

# Verify deployment
echo "Verifying deployment..."
if docker ps | grep -q "re-prompt-that-backend-1"; then
    echo "Deployment successful!"
    echo "Container status:"
    docker ps
    echo "Recent logs:"
    docker-compose logs --tail=10 backend
else
    echo "Deployment failed!"
    docker-compose logs backend
    exit 1
fi

echo "Deployment completed at $(date)"
