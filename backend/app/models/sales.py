from __future__ import annotations

from datetime import date
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import CheckConstraint, Date, ForeignKey, Numeric, String, Unicode, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base

if TYPE_CHECKING:
    from app.models.production import Product


class Store(Base):
    __tablename__ = "store"

    store_id: Mapped[str] = mapped_column(String(20), primary_key=True)
    store_name: Mapped[str] = mapped_column(Unicode(100), nullable=False, unique=True)
    store_address: Mapped[str] = mapped_column(Unicode(200), nullable=False)
    store_manager: Mapped[str] = mapped_column(Unicode(50), nullable=False)
    contact_phone: Mapped[str] = mapped_column(String(20), nullable=False)

    sales_orders: Mapped[list[SalesOrder]] = relationship(back_populates="store")


class SalesOrder(Base):
    __tablename__ = "sales_order"
    __table_args__ = (
        CheckConstraint("order_total_amount >= 0", name="ck_sales_order_total"),
        CheckConstraint(
            "order_status IN ('PENDING','PAID','SHIPPED','COMPLETED','CANCELLED')",
            name="ck_sales_order_status",
        ),
    )

    sales_order_id: Mapped[str] = mapped_column(String(20), primary_key=True)
    store_id: Mapped[str] = mapped_column(String(20), ForeignKey("store.store_id"), nullable=False)
    order_date: Mapped[date] = mapped_column(Date, nullable=False)
    order_total_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, default=0)
    order_status: Mapped[str] = mapped_column(String(20), nullable=False)

    store: Mapped[Store] = relationship(back_populates="sales_orders")
    details: Mapped[list[SalesDetail]] = relationship(back_populates="sales_order")


class SalesDetail(Base):
    __tablename__ = "sales_detail"
    __table_args__ = (
        CheckConstraint("sales_qty > 0", name="ck_sales_detail_qty"),
        CheckConstraint("sales_unit_price > 0", name="ck_sales_detail_price"),
        UniqueConstraint("sales_order_id", "product_id", name="uq_sales_order_product"),
    )

    sales_detail_id: Mapped[str] = mapped_column(String(20), primary_key=True)
    sales_order_id: Mapped[str] = mapped_column(
        String(20), ForeignKey("sales_order.sales_order_id"), nullable=False
    )
    product_id: Mapped[str] = mapped_column(String(20), ForeignKey("product.product_id"), nullable=False)
    sales_qty: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    sales_unit_price: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)

    sales_order: Mapped[SalesOrder] = relationship(back_populates="details")
    product: Mapped[Product] = relationship(back_populates="sales_details")
