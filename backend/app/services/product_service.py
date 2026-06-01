from uuid import UUID

from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.models.product import Product
from app.schemas.product import ProductCreate, ProductUpdate
from app.core.exceptions import NotFoundException, ConflictException, BadRequestException


class ProductService:
    def __init__(self, db: Session):
        self.db = db

    def get_all(self, skip: int = 0, limit: int = 100, search: str | None = None):
        query = self.db.query(Product)
        if search:
            query = query.filter(
                Product.name.ilike(f"%{search}%") | Product.sku.ilike(f"%{search}%")
            )
        total = query.count()
        items = query.order_by(Product.created_at.desc()).offset(skip).limit(limit).all()
        return total, items

    def get_by_id(self, product_id: UUID) -> Product:
        product = self.db.query(Product).filter(Product.id == product_id).first()
        if not product:
            raise NotFoundException("Product", str(product_id))
        return product

    def get_low_stock(self, threshold: int = 10) -> list[Product]:
        return (
            self.db.query(Product)
            .filter(Product.quantity_in_stock <= threshold)
            .order_by(Product.quantity_in_stock.asc())
            .all()
        )

    def create(self, payload: ProductCreate) -> Product:
        # Check SKU uniqueness
        existing = (
            self.db.query(Product).filter(Product.sku == payload.sku).first()
        )
        if existing:
            raise ConflictException(
                f"A product with SKU '{payload.sku}' already exists."
            )

        if payload.quantity_in_stock < 0:
            raise BadRequestException("quantity_in_stock cannot be negative.")

        product = Product(**payload.model_dump())
        self.db.add(product)
        try:
            self.db.commit()
            self.db.refresh(product)
        except IntegrityError:
            self.db.rollback()
            raise ConflictException(
                f"A product with SKU '{payload.sku}' already exists."
            )
        return product

    def update(self, product_id: UUID, payload: ProductUpdate) -> Product:
        product = self.get_by_id(product_id)
        data = payload.model_dump(exclude_unset=True)

        if "sku" in data and data["sku"] != product.sku:
            existing = (
                self.db.query(Product).filter(Product.sku == data["sku"]).first()
            )
            if existing:
                raise ConflictException(
                    f"A product with SKU '{data['sku']}' already exists."
                )

        if "quantity_in_stock" in data and data["quantity_in_stock"] < 0:
            raise BadRequestException("quantity_in_stock cannot be negative.")

        for field, value in data.items():
            setattr(product, field, value)

        try:
            self.db.commit()
            self.db.refresh(product)
        except IntegrityError:
            self.db.rollback()
            raise ConflictException("SKU conflict during update.")
        return product

    def delete(self, product_id: UUID) -> None:
        product = self.get_by_id(product_id)
        try:
            self.db.delete(product)
            self.db.commit()
        except IntegrityError:
            self.db.rollback()
            raise BadRequestException(
                "Cannot delete product that has existing orders."
            )

    def get_stats(self) -> dict:
        total = self.db.query(Product).count()
        low_stock = self.get_low_stock()
        return {"total_products": total, "low_stock_count": len(low_stock)}
