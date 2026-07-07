from __future__ import annotations

from datetime import date
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import CheckConstraint, Date, ForeignKey, Numeric, String, Unicode, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base

if TYPE_CHECKING:
    from app.models.purchase import Ingredient


class Warehouse(Base):
    __tablename__ = "warehouse"
    __table_args__ = (
        CheckConstraint("warehouse_capacity > 0", name="ck_warehouse_capacity"),
        CheckConstraint(
            "temperature_type IN ('FROZEN','CHILLED','NORMAL')",
            name="ck_warehouse_temp",
        ),
    )

    warehouse_id: Mapped[str] = mapped_column(String(20), primary_key=True)
    warehouse_name: Mapped[str] = mapped_column(Unicode(100), nullable=False, unique=True)
    warehouse_location: Mapped[str] = mapped_column(Unicode(200), nullable=False)
    warehouse_capacity: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    temperature_type: Mapped[str] = mapped_column(String(20), nullable=False)

    inventories: Mapped[list[Inventory]] = relationship(back_populates="warehouse")
    source_transfers: Mapped[list[TransferOrder]] = relationship(
        back_populates="source_warehouse",
        foreign_keys="TransferOrder.source_warehouse_id",
    )
    target_transfers: Mapped[list[TransferOrder]] = relationship(
        back_populates="target_warehouse",
        foreign_keys="TransferOrder.target_warehouse_id",
    )


class Inventory(Base):
    __tablename__ = "inventory"
    __table_args__ = (
        CheckConstraint("stock_qty >= 0", name="ck_inventory_stock"),
        CheckConstraint("safety_stock >= 0", name="ck_inventory_safety"),
        CheckConstraint("expiry_date >= production_date", name="ck_inventory_date"),
    )

    inventory_id: Mapped[str] = mapped_column(String(20), primary_key=True)
    warehouse_id: Mapped[str] = mapped_column(String(20), ForeignKey("warehouse.warehouse_id"), nullable=False)
    ingredient_id: Mapped[str] = mapped_column(String(20), ForeignKey("ingredient.ingredient_id"), nullable=False)
    stock_qty: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    production_date: Mapped[date] = mapped_column(Date, nullable=False)
    expiry_date: Mapped[date] = mapped_column(Date, nullable=False)
    safety_stock: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)

    warehouse: Mapped[Warehouse] = relationship(back_populates="inventories")
    ingredient: Mapped[Ingredient] = relationship(back_populates="inventories")


class TransferOrder(Base):
    __tablename__ = "transfer_order"
    __table_args__ = (
        CheckConstraint(
            "transfer_type IN ('BALANCE','EMERGENCY','REPLENISH')",
            name="ck_transfer_type",
        ),
        CheckConstraint(
            "source_warehouse_id <> target_warehouse_id",
            name="ck_transfer_diff_warehouse",
        ),
    )

    transfer_order_id: Mapped[str] = mapped_column(String(20), primary_key=True)
    source_warehouse_id: Mapped[str] = mapped_column(
        String(20), ForeignKey("warehouse.warehouse_id"), nullable=False
    )
    target_warehouse_id: Mapped[str] = mapped_column(
        String(20), ForeignKey("warehouse.warehouse_id"), nullable=False
    )
    transfer_date: Mapped[date] = mapped_column(Date, nullable=False)
    transfer_type: Mapped[str] = mapped_column(String(20), nullable=False)

    source_warehouse: Mapped[Warehouse] = relationship(
        back_populates="source_transfers",
        foreign_keys=[source_warehouse_id],
    )
    target_warehouse: Mapped[Warehouse] = relationship(
        back_populates="target_transfers",
        foreign_keys=[target_warehouse_id],
    )
    details: Mapped[list[TransferDetail]] = relationship(back_populates="transfer_order")


class TransferDetail(Base):
    __tablename__ = "transfer_detail"
    __table_args__ = (
        CheckConstraint("transfer_qty > 0", name="ck_transfer_qty"),
        UniqueConstraint("transfer_order_id", "ingredient_id", name="uq_transfer_order_ingredient"),
    )

    transfer_detail_id: Mapped[str] = mapped_column(String(20), primary_key=True)
    transfer_order_id: Mapped[str] = mapped_column(
        String(20), ForeignKey("transfer_order.transfer_order_id"), nullable=False
    )
    ingredient_id: Mapped[str] = mapped_column(String(20), ForeignKey("ingredient.ingredient_id"), nullable=False)
    transfer_qty: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)

    transfer_order: Mapped[TransferOrder] = relationship(back_populates="details")
    ingredient: Mapped["Ingredient"] = relationship()
