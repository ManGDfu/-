from __future__ import annotations

from datetime import date
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import CheckConstraint, Date, ForeignKey, Numeric, String, Unicode, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base

if TYPE_CHECKING:
    from app.models.warehouse import Inventory


class Supplier(Base):
    __tablename__ = "supplier"

    supplier_id: Mapped[str] = mapped_column(String(20), primary_key=True)
    supplier_name: Mapped[str] = mapped_column(Unicode(100), nullable=False, unique=True)
    contact_person: Mapped[str] = mapped_column(Unicode(50), nullable=False)
    contact_phone: Mapped[str] = mapped_column(String(20), nullable=False)
    address: Mapped[str] = mapped_column(Unicode(200), nullable=False)

    purchase_orders: Mapped[list[PurchaseOrder]] = relationship(back_populates="supplier")


class Ingredient(Base):
    __tablename__ = "ingredient"
    __table_args__ = (CheckConstraint("shelf_life_days > 0", name="ck_ingredient_shelf_life"),)

    ingredient_id: Mapped[str] = mapped_column(String(20), primary_key=True)
    ingredient_name: Mapped[str] = mapped_column(Unicode(100), nullable=False)
    unit: Mapped[str] = mapped_column(Unicode(20), nullable=False)
    category: Mapped[str] = mapped_column(Unicode(50), nullable=False)
    shelf_life_days: Mapped[int] = mapped_column(nullable=False)

    purchase_details: Mapped[list[PurchaseDetail]] = relationship(back_populates="ingredient")
    inventories: Mapped[list[Inventory]] = relationship(back_populates="ingredient")


class PurchaseOrder(Base):
    __tablename__ = "purchase_order"
    __table_args__ = (
        CheckConstraint("order_total_amount >= 0", name="ck_purchase_order_total"),
        CheckConstraint(
            "order_status IN ('PENDING','APPROVED','COMPLETED','CANCELLED')",
            name="ck_purchase_order_status",
        ),
    )

    purchase_order_id: Mapped[str] = mapped_column(String(20), primary_key=True)
    supplier_id: Mapped[str] = mapped_column(String(20), ForeignKey("supplier.supplier_id"), nullable=False)
    order_date: Mapped[date] = mapped_column(Date, nullable=False)
    order_total_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, default=0)
    order_status: Mapped[str] = mapped_column(String(20), nullable=False)

    supplier: Mapped[Supplier] = relationship(back_populates="purchase_orders")
    details: Mapped[list[PurchaseDetail]] = relationship(back_populates="purchase_order")


class PurchaseDetail(Base):
    __tablename__ = "purchase_detail"
    __table_args__ = (
        CheckConstraint("purchase_qty > 0", name="ck_purchase_detail_qty"),
        CheckConstraint("purchase_unit_price > 0", name="ck_purchase_detail_price"),
        UniqueConstraint("purchase_order_id", "ingredient_id", name="uq_purchase_order_ingredient"),
    )

    purchase_detail_id: Mapped[str] = mapped_column(String(20), primary_key=True)
    purchase_order_id: Mapped[str] = mapped_column(
        String(20), ForeignKey("purchase_order.purchase_order_id"), nullable=False
    )
    ingredient_id: Mapped[str] = mapped_column(String(20), ForeignKey("ingredient.ingredient_id"), nullable=False)
    purchase_qty: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    purchase_unit_price: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)

    purchase_order: Mapped[PurchaseOrder] = relationship(back_populates="details")
    ingredient: Mapped[Ingredient] = relationship(back_populates="purchase_details")
