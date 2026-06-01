from uuid import UUID

from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.models.customer import Customer
from app.schemas.customer import CustomerCreate
from app.core.exceptions import NotFoundException, ConflictException, BadRequestException


class CustomerService:
    def __init__(self, db: Session):
        self.db = db

    def get_all(self, skip: int = 0, limit: int = 100, search: str | None = None):
        query = self.db.query(Customer)
        if search:
            query = query.filter(
                Customer.full_name.ilike(f"%{search}%")
                | Customer.email.ilike(f"%{search}%")
            )
        total = query.count()
        items = (
            query.order_by(Customer.created_at.desc()).offset(skip).limit(limit).all()
        )
        return total, items

    def get_by_id(self, customer_id: UUID) -> Customer:
        customer = (
            self.db.query(Customer).filter(Customer.id == customer_id).first()
        )
        if not customer:
            raise NotFoundException("Customer", str(customer_id))
        return customer

    def create(self, payload: CustomerCreate) -> Customer:
        existing = (
            self.db.query(Customer)
            .filter(Customer.email == payload.email)
            .first()
        )
        if existing:
            raise ConflictException(
                f"A customer with email '{payload.email}' already exists."
            )

        customer = Customer(**payload.model_dump())
        self.db.add(customer)
        try:
            self.db.commit()
            self.db.refresh(customer)
        except IntegrityError:
            self.db.rollback()
            raise ConflictException(
                f"A customer with email '{payload.email}' already exists."
            )
        return customer

    def delete(self, customer_id: UUID) -> None:
        customer = self.get_by_id(customer_id)
        try:
            self.db.delete(customer)
            self.db.commit()
        except IntegrityError:
            self.db.rollback()
            raise BadRequestException(
                "Cannot delete customer that has existing orders."
            )

    def get_stats(self) -> dict:
        total = self.db.query(Customer).count()
        return {"total_customers": total}
