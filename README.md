# InvenFlow — Inventory & Order Management System

> A production-ready, full-stack Inventory & Order Management platform built with **FastAPI**, **React**, and **PostgreSQL**, fully containerized with Docker.

---

## Architecture

```
┌─────────────────┐       HTTP/REST        ┌──────────────────┐
│                 │ ─────────────────────► │                  │
│  React Frontend │                        │  FastAPI Backend  │
│  (Vite + TW)    │ ◄───────────────────── │  (Python 3.11)   │
│  Port 3000      │       JSON             │  Port 8000       │
└─────────────────┘                        └────────┬─────────┘
                                                    │ SQLAlchemy ORM
                                                    ▼
                                           ┌──────────────────┐
                                           │   PostgreSQL 15   │
                                           │   Port 5432       │
                                           └──────────────────┘
```

---

## Features

### Backend
- ✅ Full CRUD for Products, Customers, and Orders
- ✅ SKU uniqueness enforcement (HTTP 409)
- ✅ Email uniqueness enforcement (HTTP 409)
- ✅ Oversell prevention with row-level locking (HTTP 400)
- ✅ Automatic stock deduction on order creation
- ✅ Automatic stock restoration on order cancellation
- ✅ `total_amount = price × quantity` calculated server-side only
- ✅ Alembic DB migrations
- ✅ Pydantic v2 request/response validation
- ✅ Structured JSON error responses with correct HTTP codes
- ✅ OpenAPI docs at `/docs`

### Frontend
- ✅ Dark theme with indigo/violet gradient design system
- ✅ Dashboard with live stats (total products, customers, orders, low-stock)
- ✅ Low-stock alert table (≤ 10 units)
- ✅ Product management: create, edit, delete, search, stock badges
- ✅ Customer management: create, search, delete
- ✅ Order management: create, view, filter by status, cancel (restores stock)
- ✅ Reusable component library (Button, Modal, Toast, Badge, Card, etc.)
- ✅ Toast notifications (success/error/info)
- ✅ Loading states and empty states
- ✅ Debounced search (300ms)
- ✅ Responsive layout

---

## Project Structure

```
inventory-order-management/
├── backend/
│   ├── app/
│   │   ├── api/            # FastAPI route handlers
│   │   ├── models/         # SQLAlchemy ORM models
│   │   ├── schemas/        # Pydantic schemas
│   │   ├── services/       # Business logic layer
│   │   ├── database/       # DB session & engine
│   │   ├── core/           # Config & exceptions
│   │   └── main.py         # FastAPI app entry
│   ├── alembic/            # DB migrations
│   ├── seed.py             # Demo data seeder
│   ├── Dockerfile
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page-level components
│   │   ├── services/       # API service layer
│   │   ├── hooks/          # Custom React hooks
│   │   └── context/        # React context (Toast)
│   ├── Dockerfile
│   └── package.json
│
├── postman/                # API test collection
├── docker-compose.yml
└── README.md
```

---

## Quick Start (Docker)

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)

### 1. Clone the repository
```bash
git clone <your-repo-url>
cd inventory-order-management
```

### 2. Configure environment variables
```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

### 3. Start all services
```bash
docker-compose up --build
```

### 4. Seed demo data (optional, in a new terminal)
```bash
docker exec inventory_backend python seed.py
```

### 5. Access the application
| Service   | URL                          |
|-----------|------------------------------|
| Frontend  | http://localhost:3000        |
| Backend   | http://localhost:8000        |
| API Docs  | http://localhost:8000/docs   |
| ReDoc     | http://localhost:8000/redoc  |

---

## Local Development (without Docker)

### Backend

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your local PostgreSQL credentials

# Run migrations
alembic upgrade head

# Seed demo data
python seed.py

# Start development server
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Set VITE_API_BASE_URL=http://localhost:8000

# Start development server
npm run dev
```

---

## Docker Commands

```bash
# Build and start all services
docker-compose up --build

# Start in detached mode
docker-compose up -d --build

# Stop all services
docker-compose down

# Stop and remove volumes (resets DB)
docker-compose down -v

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Rebuild a single service
docker-compose up --build backend

# Run seed data
docker exec inventory_backend python seed.py

# Run migrations manually
docker exec inventory_backend alembic upgrade head
```

---

## API Endpoints

### Base URL: `http://localhost:8000/api/v1`

#### Health
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/api/v1/stats` | Dashboard statistics |

#### Products
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/products` | Create product (201) |
| GET | `/products` | List products (search, pagination) |
| GET | `/products/low-stock` | Low stock products |
| GET | `/products/{id}` | Get product by ID |
| PUT | `/products/{id}` | Update product |
| DELETE | `/products/{id}` | Delete product (204) |

#### Customers
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/customers` | Create customer (201) |
| GET | `/customers` | List customers (search, pagination) |
| GET | `/customers/{id}` | Get customer by ID |
| DELETE | `/customers/{id}` | Delete customer (204) |

#### Orders
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/orders` | Create order — validates stock (201) |
| GET | `/orders` | List orders (status filter, pagination) |
| GET | `/orders/{id}` | Get order with customer & product details |
| DELETE | `/orders/{id}` | Cancel order, restore stock (204) |

### Error Response Format
```json
{
  "detail": "A product with SKU 'SKU-001' already exists.",
  "status_code": 409
}
```

### HTTP Status Codes
| Code | When |
|------|------|
| 200 | Successful GET/PUT |
| 201 | Successful creation |
| 204 | Successful delete |
| 400 | Bad request (insufficient stock, etc.) |
| 404 | Resource not found |
| 409 | Conflict (duplicate SKU/email) |
| 422 | Validation error (invalid input) |
| 500 | Unexpected server error |

---

## Deployment

### Backend — Render / Railway

1. Push code to GitHub
2. Create a new **Web Service** on Render:
   - Runtime: Python 3.11
   - Build command: `pip install -r requirements.txt`
   - Start command: `alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port $PORT`
3. Add a **PostgreSQL** database addon
4. Set environment variables from `backend/.env.example`

### Frontend — Vercel / Netlify

1. Connect your GitHub repository
2. Set **Root Directory** to `frontend`
3. Build command: `npm run build`
4. Output directory: `dist`
5. Set environment variable: `VITE_API_BASE_URL=https://your-backend-url.render.com`

---

## Postman Collection

Import `postman/Inventory_API.postman_collection.json` into Postman.
Set the `base_url` variable to `http://localhost:8000/api/v1`.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, TailwindCSS 3, React Router 6, Axios |
| Backend | FastAPI, SQLAlchemy 2.0, Alembic, Pydantic v2 |
| Database | PostgreSQL 15 |
| Container | Docker, Docker Compose |

---

## License

MIT © InvenFlow
# InvenFlow
# inven-flow
