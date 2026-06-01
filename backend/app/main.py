import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.core.exceptions import AppException
from app.database.session import engine, Base
from app.api import api_router

# Import models so Alembic/SQLAlchemy can discover them
import app.models  # noqa: F401

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Ensure DB tables exist on startup (Alembic is the primary migration tool)."""
    logger.info("Starting up — checking database tables...")
    try:
        Base.metadata.create_all(bind=engine, checkfirst=True)
        logger.info("Database tables ready.")
    except Exception as e:
        # Tables/types may already exist from Alembic migrations — this is fine
        logger.warning(f"create_all skipped (likely already managed by Alembic): {e}")
    yield
    logger.info("Shutting down.")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description=(
        "A production-ready Inventory & Order Management REST API. "
        "Manage products, customers, and orders with full business logic."
    ),
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# ---------------------------------------------------------------------------
# CORS
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Global exception handlers
# ---------------------------------------------------------------------------
@app.exception_handler(AppException)
async def app_exception_handler(request: Request, exc: AppException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail, "status_code": exc.status_code},
    )


@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "An unexpected error occurred.", "status_code": 500},
    )


# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------
app.include_router(api_router, prefix="/api/v1")


# ---------------------------------------------------------------------------
# Health check & stats
# ---------------------------------------------------------------------------
@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "ok", "version": settings.APP_VERSION}


@app.get("/api/v1/stats", tags=["Stats"])
def dashboard_stats(db=None):
    """Aggregate stats for the dashboard — total products, customers, orders, low stock."""
    from sqlalchemy.orm import Session
    from app.database.session import SessionLocal
    from app.models.product import Product
    from app.models.customer import Customer
    from app.models.order import Order

    session = SessionLocal()
    try:
        total_products = session.query(Product).count()
        total_customers = session.query(Customer).count()
        total_orders = session.query(Order).count()
        low_stock_products = (
            session.query(Product)
            .filter(Product.quantity_in_stock <= 10)
            .order_by(Product.quantity_in_stock.asc())
            .all()
        )
    finally:
        session.close()

    return {
        "total_products": total_products,
        "total_customers": total_customers,
        "total_orders": total_orders,
        "low_stock_count": len(low_stock_products),
        "low_stock_products": [
            {
                "id": str(p.id),
                "name": p.name,
                "sku": p.sku,
                "quantity_in_stock": p.quantity_in_stock,
            }
            for p in low_stock_products
        ],
    }
