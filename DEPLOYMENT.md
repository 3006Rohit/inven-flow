# InvenFlow — Production Deployment Guide

> Deploy InvenFlow to Docker Hub and self-hosted environments

---

## Prerequisites

- Docker installed locally
- Docker Hub account (username: `rohit3006`)
- Docker Hub authentication: `docker login`

---

## 1. Build & Push to Docker Hub

### Step 1: Authenticate with Docker Hub
```bash
docker login
# Enter your Docker Hub username: rohit3006
# Enter your password when prompted
```

### Step 2: Build Backend Image
```bash
cd backend
docker build -t rohit3006/invenflow-backend:latest -t rohit3006/invenflow-backend:v1.0.0 .
cd ..
```

### Step 3: Build Frontend Image
```bash
cd frontend
docker build -t rohit3006/invenflow-frontend:latest -t rohit3006/invenflow-frontend:v1.0.0 .
cd ..
```

### Step 4: Push Images to Docker Hub
```bash
# Push backend
docker push rohit3006/invenflow-backend:latest
docker push rohit3006/invenflow-backend:v1.0.0

# Push frontend
docker push rohit3006/invenflow-frontend:latest
docker push rohit3006/invenflow-frontend:v1.0.0
```

---

## 2. Docker Hub Image URLs

After pushing, your images will be available at:

- **Backend:** `https://hub.docker.com/r/rohit3006/invenflow-backend`
- **Frontend:** `https://hub.docker.com/r/rohit3006/invenflow-frontend`

Or pull with:
```bash
docker pull rohit3006/invenflow-backend:latest
docker pull rohit3006/invenflow-frontend:latest
```

---

## 3. Self-Hosted Deployment

### Option A: Deploy on a Linux VPS (e.g., DigitalOcean, Linode, AWS EC2)

#### 1. SSH into your server
```bash
ssh root@your_server_ip
```

#### 2. Install Docker
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
```

#### 3. Create application directory
```bash
mkdir -p /opt/invenflow
cd /opt/invenflow
```

#### 4. Create production `docker-compose.yml`
Create `/opt/invenflow/docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: invenflow_postgres
    restart: always
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-postgres}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-secure_password_here}
      POSTGRES_DB: ${POSTGRES_DB:-inventory_db}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    networks:
      - invenflow_net
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-postgres}"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    image: rohit3006/invenflow-backend:latest
    container_name: invenflow_backend
    restart: always
    env_file:
      - .env
    environment:
      DATABASE_URL: postgresql://${POSTGRES_USER:-postgres}:${POSTGRES_PASSWORD:-secure_password_here}@postgres:5432/${POSTGRES_DB:-inventory_db}
      POSTGRES_HOST: postgres
      ENVIRONMENT: production
    ports:
      - "8000:8000"
    networks:
      - invenflow_net
    depends_on:
      postgres:
        condition: service_healthy

  frontend:
    image: rohit3006/invenflow-frontend:latest
    container_name: invenflow_frontend
    restart: always
    ports:
      - "80:80"
    networks:
      - invenflow_net
    depends_on:
      - backend

volumes:
  postgres_data:
    name: invenflow_postgres_data

networks:
  invenflow_net:
    driver: bridge
```

#### 5. Create `.env` file
Create `/opt/invenflow/.env`:
```
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_secure_db_password_here
POSTGRES_DB=inventory_db
```

#### 6. Start services
```bash
docker-compose -f docker-compose.prod.yml up -d
```

#### 7. Initialize database
```bash
docker exec invenflow_backend alembic upgrade head
docker exec invenflow_backend python seed.py  # Optional: load demo data
```

#### 8. Verify services are running
```bash
docker ps
curl http://localhost:8000/health
```

---

### Option B: Deploy with Nginx Reverse Proxy

For better production setup with SSL/TLS support:

Create `/opt/invenflow/nginx.conf`:
```nginx
upstream backend {
    server backend:8000;
}

server {
    listen 80;
    server_name your-domain.com;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;

    # Frontend
    location / {
        proxy_pass http://frontend:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Backend API
    location /api/ {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # OpenAPI Docs
    location /docs {
        proxy_pass http://backend/docs;
        proxy_set_header Host $host;
    }

    location /redoc {
        proxy_pass http://backend/redoc;
        proxy_set_header Host $host;
    }
}
```

---

## 4. Environment Variables for Production

Backend needs these environment variables:

```env
# Database
DATABASE_URL=postgresql://postgres:password@postgres:5432/inventory_db
POSTGRES_HOST=postgres

# App
ENVIRONMENT=production
APP_NAME=InvenFlow
APP_VERSION=1.0.0

# CORS (adjust as needed)
ALLOWED_ORIGINS=https://your-domain.com
```

---

## 5. Database Backups

### Daily Backup Script
Create `/opt/invenflow/backup.sh`:

```bash
#!/bin/bash

BACKUP_DIR="/opt/invenflow/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

mkdir -p $BACKUP_DIR

docker exec invenflow_postgres pg_dump -U postgres inventory_db > \
  $BACKUP_DIR/inventory_db_$TIMESTAMP.sql

# Keep only last 7 days of backups
find $BACKUP_DIR -type f -mtime +7 -delete
```

Make it executable and add to crontab:
```bash
chmod +x backup.sh
crontab -e
# Add: 0 2 * * * /opt/invenflow/backup.sh
```

---

## 6. Monitoring & Logs

### View logs
```bash
docker logs invenflow_backend
docker logs invenflow_frontend
docker logs invenflow_postgres
```

### Follow logs in real-time
```bash
docker logs -f invenflow_backend
```

### Check container health
```bash
docker ps --format "table {{.Names}}\t{{.Status}}"
```

---

## 7. Updating Production

### Pull latest images
```bash
docker pull rohit3006/invenflow-backend:latest
docker pull rohit3006/invenflow-frontend:latest
```

### Restart services
```bash
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d
```

### Run migrations after update
```bash
docker exec invenflow_backend alembic upgrade head
```

---

## 8. Troubleshooting

### Backend can't connect to database
```bash
# Check database service
docker exec invenflow_postgres psql -U postgres -d inventory_db -c "SELECT 1"
```

### Frontend shows blank page
```bash
# Check frontend logs
docker logs invenflow_frontend

# Clear browser cache and hard refresh (Ctrl+Shift+R)
```

### High memory usage
```bash
# Check container stats
docker stats

# Reduce Uvicorn workers in backend Dockerfile
```

---

## Quick Deploy Script

Create `deploy.sh`:

```bash
#!/bin/bash

echo "🔨 Building and pushing to Docker Hub..."

# Backend
docker build -t rohit3006/invenflow-backend:latest backend/
docker push rohit3006/invenflow-backend:latest

# Frontend
docker build -t rohit3006/invenflow-frontend:latest frontend/
docker push rohit3006/invenflow-frontend:latest

echo "✅ Images pushed to Docker Hub!"
echo ""
echo "Next steps:"
echo "1. SSH into your server"
echo "2. cd /opt/invenflow"
echo "3. docker-compose -f docker-compose.prod.yml pull"
echo "4. docker-compose -f docker-compose.prod.yml up -d"
```

Make executable:
```bash
chmod +x deploy.sh
./deploy.sh
```

---

## Support

- **Frontend Issues:** Check browser console for errors
- **Backend Issues:** Check API logs at `/docs` endpoint
- **Database Issues:** Run `docker logs invenflow_postgres`

For more help, refer to the main [README.md](README.md)
