from fastapi import APIRouter

from app.api.products import router as products_router
from app.api.customers import router as customers_router
from app.api.orders import router as orders_router

api_router = APIRouter()
api_router.include_router(products_router)
api_router.include_router(customers_router)
api_router.include_router(orders_router)
