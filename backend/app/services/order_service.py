from uuid import UUID

from sqlalchemy.orm import Session, joinedload

from app.models.order import Order, OrderStatus
from app.models.product import Product
from app.models.customer import Customer
from app.schemas.order import OrderCreate, OrderResponse
from app.core.exceptions import (
    NotFoundException,
    InsufficientStockException,
    BadRequestException,
)


class OrderService:
    def __init__(self, db: Session):
        self.db = db

    def _to_response(self, order: Order) -> OrderResponse:
        """Map ORM object + relationships to the response schema."""
        return OrderResponse(
            id=order.id,
            customer_id=order.customer_id,
            product_id=order.product_id,
            quantity=order.quantity,
            total_amount=order.total_amount,
            order_status=order.order_status,
            created_at=order.created_at,
            customer_name=order.customer.full_name if order.customer else None,
            customer_email=order.customer.email if order.customer else None,
            product_name=order.product.name if order.product else None,
            product_sku=order.product.sku if order.product else None,
        )

    def get_all(
        self,
        skip: int = 0,
        limit: int = 100,
        status: OrderStatus | None = None,
    ):
        query = (
            self.db.query(Order)
            .options(joinedload(Order.customer), joinedload(Order.product))
        )
        if status:
            query = query.filter(Order.order_status == status)
        total = query.count()
        orders = (
            query.order_by(Order.created_at.desc()).offset(skip).limit(limit).all()
        )
        return total, [self._to_response(o) for o in orders]

    def get_by_id(self, order_id: UUID) -> OrderResponse:
        order = (
            self.db.query(Order)
            .options(joinedload(Order.customer), joinedload(Order.product))
            .filter(Order.id == order_id)
            .first()
        )
        if not order:
            raise NotFoundException("Order", str(order_id))
        return self._to_response(order)

    def create(self, payload: OrderCreate) -> OrderResponse:
        # Validate customer
        customer = (
            self.db.query(Customer)
            .filter(Customer.id == payload.customer_id)
            .first()
        )
        if not customer:
            raise NotFoundException("Customer", str(payload.customer_id))

        # Validate product and stock
        product = (
            self.db.query(Product)
            .filter(Product.id == payload.product_id)
            .with_for_update()  # row-level lock to prevent race conditions
            .first()
        )
        if not product:
            raise NotFoundException("Product", str(payload.product_id))

        if product.quantity_in_stock < payload.quantity:
            raise InsufficientStockException(
                available=product.quantity_in_stock,
                requested=payload.quantity,
            )

        # Deduct stock and calculate total (backend only)
        product.quantity_in_stock -= payload.quantity
        total_amount = product.price * payload.quantity

        order = Order(
            customer_id=payload.customer_id,
            product_id=payload.product_id,
            quantity=payload.quantity,
            total_amount=total_amount,
            order_status=OrderStatus.PENDING,
        )
        self.db.add(order)
        self.db.commit()
        self.db.refresh(order)

        # Reload with relationships
        return self.get_by_id(order.id)

    def delete(self, order_id: UUID) -> None:
        """Cancel/delete an order and restore stock."""
        order = (
            self.db.query(Order)
            .options(joinedload(Order.product))
            .filter(Order.id == order_id)
            .first()
        )
        if not order:
            raise NotFoundException("Order", str(order_id))

        # Restore stock on cancellation
        product = (
            self.db.query(Product)
            .filter(Product.id == order.product_id)
            .with_for_update()
            .first()
        )
        if product:
            product.quantity_in_stock += order.quantity

        self.db.delete(order)
        self.db.commit()

    def get_stats(self) -> dict:
        total = self.db.query(Order).count()
        return {"total_orders": total}
