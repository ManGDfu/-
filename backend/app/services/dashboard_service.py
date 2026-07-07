import asyncio
from collections.abc import Callable
from datetime import date, timedelta
from decimal import Decimal
from typing import TypeVar

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.purchase import PurchaseOrder
from app.models.sales import SalesOrder
from app.models.warehouse import Inventory
from app.schemas.dashboard import DashboardOverview
from app.services.sales_service import get_product_ranking

T = TypeVar("T")


def _run_in_thread(fn: Callable[[Session], T]) -> T:
    db = SessionLocal()
    try:
        return fn(db)
    finally:
        db.close()


def _count_pending_purchase(db: Session) -> int:
    return (
        db.scalar(
            select(func.count())
            .select_from(PurchaseOrder)
            .where(PurchaseOrder.order_status == "PENDING")
        )
        or 0
    )


def _count_low_stock(db: Session) -> int:
    return (
        db.scalar(
            select(func.count())
            .select_from(Inventory)
            .where(Inventory.stock_qty < Inventory.safety_stock)
        )
        or 0
    )


def _count_expiring(db: Session, *, days: int = 7) -> int:
    today = date.today()
    deadline = today + timedelta(days=days)
    return (
        db.scalar(
            select(func.count())
            .select_from(Inventory)
            .where(Inventory.expiry_date >= today, Inventory.expiry_date <= deadline)
        )
        or 0
    )


def _count_in_transit_sales(db: Session) -> int:
    return (
        db.scalar(
            select(func.count())
            .select_from(SalesOrder)
            .where(SalesOrder.order_status == "SHIPPED")
        )
        or 0
    )


def _sum_recent_purchase(db: Session, *, days: int = 30) -> Decimal:
    cutoff = date.today() - timedelta(days=days)
    amount = db.scalar(
        select(func.coalesce(func.sum(PurchaseOrder.order_total_amount), 0)).where(
            PurchaseOrder.order_date >= cutoff,
            PurchaseOrder.order_status.in_(["APPROVED", "COMPLETED"]),
        )
    )
    return Decimal(str(amount or 0))


def _sum_recent_sales(db: Session, *, days: int = 30) -> Decimal:
    cutoff = date.today() - timedelta(days=days)
    amount = db.scalar(
        select(func.coalesce(func.sum(SalesOrder.order_total_amount), 0)).where(
            SalesOrder.order_date >= cutoff,
            SalesOrder.order_status.in_(["PAID", "SHIPPED", "COMPLETED"]),
        )
    )
    return Decimal(str(amount or 0))


def _top_products(db: Session, *, limit: int = 5, days: int = 30) -> list:
    return get_product_ranking(db, limit=limit, days=days)


async def get_overview(_db: Session) -> DashboardOverview:
    (
        pending,
        low_stock,
        expiring,
        in_transit,
        recent_purchase,
        recent_sales,
        top_products,
    ) = await asyncio.gather(
        asyncio.to_thread(_run_in_thread, _count_pending_purchase),
        asyncio.to_thread(_run_in_thread, _count_low_stock),
        asyncio.to_thread(_run_in_thread, _count_expiring),
        asyncio.to_thread(_run_in_thread, _count_in_transit_sales),
        asyncio.to_thread(_run_in_thread, _sum_recent_purchase),
        asyncio.to_thread(_run_in_thread, _sum_recent_sales),
        asyncio.to_thread(_run_in_thread, lambda db: _top_products(db)),
    )
    return DashboardOverview(
        pending_purchase_orders=pending,
        low_stock_count=low_stock,
        expiring_inventory_count=expiring,
        in_transit_sales_orders=in_transit,
        recent_purchase_amount=recent_purchase,
        recent_sales_amount=recent_sales,
        top_products=top_products,
    )
