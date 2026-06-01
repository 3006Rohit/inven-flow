#!/bin/bash
# Deploy InvenFlow to self-hosted server
# Usage: ./deploy-to-server.sh <server_ip> <username>
# Example: ./deploy-to-server.sh 192.168.1.100 root

if [ $# -lt 2 ]; then
    echo "Usage: $0 <server_ip> <username>"
    echo "Example: $0 192.168.1.100 root"
    exit 1
fi

SERVER_IP=$1
USERNAME=$2
REMOTE_PATH="/opt/invenflow"

echo "🚀 Deploying InvenFlow to $USERNAME@$SERVER_IP..."
echo ""

# 1. Create directory on remote server
echo "📁 Creating application directory..."
ssh $USERNAME@$SERVER_IP "mkdir -p $REMOTE_PATH"

# 2. Copy files to server
echo "📤 Uploading files..."
scp docker-compose.yml $USERNAME@$SERVER_IP:$REMOTE_PATH/
scp .env.example $USERNAME@$SERVER_IP:$REMOTE_PATH/.env
scp -r backend $USERNAME@$SERVER_IP:$REMOTE_PATH/
scp -r frontend $USERNAME@$SERVER_IP:$REMOTE_PATH/

# 3. Create .env with instructions
echo "⚙️  Setting up environment..."
ssh $USERNAME@$SERVER_IP << EOF
cd $REMOTE_PATH

# Create production .env if doesn't exist
if [ ! -f .env ]; then
    cat > .env << 'ENVEOF'
POSTGRES_USER=postgres
POSTGRES_PASSWORD=change_me_to_secure_password
POSTGRES_DB=inventory_db
ENVIRONMENT=production
ENVEOF
    echo "⚠️  Edit .env with secure database password"
fi
EOF

# 4. Pull images from Docker Hub
echo "🐳 Pulling images from Docker Hub..."
ssh $USERNAME@$SERVER_IP << EOF
cd $REMOTE_PATH
docker pull rohit3006/invenflow-backend:latest
docker pull rohit3006/invenflow-frontend:latest
EOF

# 5. Start services
echo "▶️  Starting services..."
ssh $USERNAME@$SERVER_IP << EOF
cd $REMOTE_PATH
docker-compose up -d
EOF

# 6. Initialize database
echo "🗄️  Initializing database..."
ssh $USERNAME@$SERVER_IP << EOF
sleep 10  # Wait for services to start
docker exec invenflow_backend alembic upgrade head
docker exec invenflow_backend python seed.py
EOF

echo ""
echo "✅ Deployment complete!"
echo ""
echo "Access your application:"
echo "   Frontend: http://$SERVER_IP:3000"
echo "   Backend:  http://$SERVER_IP:8000"
echo "   API Docs: http://$SERVER_IP:8000/docs"
echo ""
echo "⚠️  Remember to:"
echo "   1. Edit .env with secure database password"
echo "   2. Configure SSL/TLS certificates"
echo "   3. Set up firewall rules"
echo "   4. Enable automatic backups"
