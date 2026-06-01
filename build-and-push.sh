#!/bin/bash
# Build and push InvenFlow images to Docker Hub
# Usage: ./build-and-push.sh

set -e

DOCKER_USERNAME="rohit3006"
VERSION="1.0.0"
LATEST="latest"

echo "🔐 Authenticating with Docker Hub..."
echo "Make sure you've run 'docker login' first"
echo ""

echo "🔨 Building backend image..."
docker build -t $DOCKER_USERNAME/invenflow-backend:$LATEST \
             -t $DOCKER_USERNAME/invenflow-backend:v$VERSION \
             ./backend

echo "✅ Backend image built"
echo ""

echo "🔨 Building frontend image..."
docker build -t $DOCKER_USERNAME/invenflow-frontend:$LATEST \
             -t $DOCKER_USERNAME/invenflow-frontend:v$VERSION \
             ./frontend

echo "✅ Frontend image built"
echo ""

echo "📤 Pushing backend to Docker Hub..."
docker push $DOCKER_USERNAME/invenflow-backend:$LATEST
docker push $DOCKER_USERNAME/invenflow-backend:v$VERSION
echo "✅ Backend pushed"
echo ""

echo "📤 Pushing frontend to Docker Hub..."
docker push $DOCKER_USERNAME/invenflow-frontend:$LATEST
docker push $DOCKER_USERNAME/invenflow-frontend:v$VERSION
echo "✅ Frontend pushed"
echo ""

echo "🎉 Done! Your images are now available on Docker Hub:"
echo "   Backend:  docker.io/$DOCKER_USERNAME/invenflow-backend:$LATEST"
echo "   Frontend: docker.io/$DOCKER_USERNAME/invenflow-frontend:$LATEST"
echo ""
echo "Access them at:"
echo "   https://hub.docker.com/r/$DOCKER_USERNAME/invenflow-backend"
echo "   https://hub.docker.com/r/$DOCKER_USERNAME/invenflow-frontend"
