from decimal import Decimal

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, joinedload

from app.core.exceptions import BadRequestError, ConflictError, NotFoundError
from app.core.security import generate_next_id, paginate
from app.models.production import Product
from app.models.sales import SalesDetail, SalesOrder, Store
from app.schemas.sales import (
    ProductRankingItem,
    SalesOrderCreate,
    SalesOrderOut,
    SalesOrderUpdate,
    StoreCreate,
    StoreOut,
    StoreSalesStatItem,
    StoreUpdate,
)

VALID_SALES_STATUSES = {"PENDING", "PAID", "SHIPPED", "COMPLETED", "CANCELLED"}

SALES_STATUS_TRANSITIONS: dict[str, str] = {
    "pay": "PAID",
    "ship": "SHIPPED",
    "complete": "COMPLETED",
    "cancel": "CANCELLED",
}


def _sales_order_to_out(order: SalesOrder) -> SalesOrderOut:
    return SalesOrderOut.model_validate(order)


def _recalc_order_total(db: Session, sales_order_id: str) -> None:
    order = _load_sales_order(db, sales_order_id)
    db.expire(order, ["details"])
    db.refresh(order, attribute_names=["details"])
    total = sum((detail.sales_qty * detail.sales_unit_price for detail in order.details), Decimal("0"))
    order.order_total_amount = total
    db.flush()


def _calc_sales_order_total(details: list) -> Decimal:
    return sum((detail.sales_qty * detail.sales_unit_price for detail in details), Decimal("0"))


def _load_sales_order(db: Session, sales_order_id: str) -> SalesOrder:
    order = (
        db.query(SalesOrder)
        .options(joinedload(SalesOrder.details))
        .filter(SalesOrder.sales_order_id == sales_order_id)
        .first()
    )
    if order is None:
        raise NotFoundError("Sales order not found")
    return order


def list_stores(
    db: Session,
    *,
    page: int,
    page_size: int,
    keyword: str = "",
) -> tuple[list[StoreOut], int]:
    stmt = select(Store).order_by(Store.store_id)
    if keyword.strip():
        pattern = f"%{keyword.strip()}%"
        stmt = stmt.where(
            or_(
                Store.store_name.like(pattern),
                Store.store_address.like(pattern),
                Store.store_manager.like(pattern),
            )
        )
    items, total = paginate(db, stmt, page=page, page_size=page_size)
    return [StoreOut.model_validate(item) for item in items], total


def get_store(db: Session, store_id: str) -> StoreOut:
    store = db.get(Store, store_id)
    if store is None:
        raise NotFoundError("Store not found")
    return StoreOut.model_validate(store)


def create_store(db: Session, payload: StoreCreate) -> StoreOut:
    existing = db.scalar(select(Store).where(Store.store_name == payload.store_name))
    if existing is not None:
        raise ConflictError("Store name already exists")
    store = Store(
        store_id=generate_next_id(db, Store, "store_id", "STO"),
        **payload.model_dump(),
    )
    db.add(store)
    db.commit()
    db.refresh(store)
    return StoreOut.model_validate(store)


def update_store(db: Session, store_id: str, payload: StoreUpdate) -> StoreOut:
    store = db.get(Store, store_id)
    if store is None:
        raise NotFoundError("Store not found")
    data = payload.model_dump(exclude_unset=True)
    if "store_name" in data and data["store_name"] != store.store_name:
        existing = db.scalar(select(Store).where(Store.store_name == data["store_name"]))
        if existing is not None:
            raise ConflictError("Store name already exists")
    for field, value in data.items():
        setattr(store, field, value)
    db.commit()
    db.refresh(store)
    return StoreOut.model_validate(store)


def delete_store(db: Session, store_id: str) -> None:
    store = db.get(Store, store_id)
    if store is None:
        raise NotFoundError("Store not found")
    if store.sales_orders:
        raise ConflictError("Store has sales orders and cannot be deleted")
    db.delete(store)
    db.commit()


def list_sales_orders(
    db: Session,
    *,
    page: int,
    page_size: int,
    keyword: str = "",
    store_id: str | None = None,
    order_status: str | None = None,
) -> tuple[list[SalesOrderOut], int]:
    stmt = select(SalesOrder).order_by(SalesOrder.sales_order_id.desc())
    if store_id:
        stmt = stmt.where(SalesOrder.store_id == store_id)
    if order_status:
        stmt = stmt.where(SalesOrder.order_status == order_status)
    if keyword.strip():
        stmt = stmt.where(SalesOrder.sales_order_id.like(f"%{keyword.strip()}%"))
    orders, total = paginate(db, stmt, page=page, page_size=page_size)
    order_ids = [order.sales_order_id for order in orders]
    if order_ids:
        loaded = (
            db.query(SalesOrder)
            .options(joinedload(SalesOrder.details))
            .filter(SalesOrder.sales_order_id.in_(order_ids))
            .all()
        )
        loaded_map = {order.sales_order_id: order for order in loaded}
        orders = [loaded_map[oid] for oid in order_ids if oid in loaded_map]
    return [_sales_order_to_out(order) for order in orders], total


def get_sales_order(db: Session, sales_order_id: str) -> SalesOrderOut:
    return _sales_order_to_out(_load_sales_order(db, sales_order_id))


def _replace_sales_details(
    db: Session,
    sales_order_id: str,
    details: list,
) -> None:
    existing = db.scalars(
        select(SalesDetail).where(SalesDetail.sales_order_id == sales_order_id)
    ).all()
    for detail in existing:
        db.delete(detail)
    db.flush()

    for detail in details:
        product_id = detail.product_id if hasattr(detail, "product_id") else detail["product_id"]
        sales_qty = detail.sales_qty if hasattr(detail, "sales_qty") else detail["sales_qty"]
        sales_unit_price = (
            detail.sales_unit_price if hasattr(detail, "sales_unit_price") else detail["sales_unit_price"]
        )
        db.add(
            SalesDetail(
                sales_detail_id=generate_next_id(db, SalesDetail, "sales_detail_id", "SOD"),
                sales_order_id=sales_order_id,
                product_id=product_id,
                sales_qty=sales_qty,
                sales_unit_price=sales_unit_price,
            )
        )


def _validate_sales_details(db: Session, details: list) -> None:
    product_ids: list[str] = []
    for detail in details:
        product_id = detail.product_id if hasattr(detail, "product_id") else detail["product_id"]
        product_ids.append(product_id)
    if len(product_ids) != len(set(product_ids)):
        raise BadRequestError("Duplicate products in sales order details")
    for product_id in product_ids:
        if db.get(Product, product_id) is None:
            raise BadRequestError(f"Invalid product_id: {product_id}")


def create_sales_order(db: Session, payload: SalesOrderCreate) -> SalesOrderOut:
    if payload.order_status not in VALID_SALES_STATUSES:
        raise BadRequestError(f"Invalid order_status: {payload.order_status}")
    if db.get(Store, payload.store_id) is None:
        raise BadRequestError("Invalid store_id")
    if not payload.details:
        raise BadRequestError("Sales order must have at least one detail line")
    _validate_sales_details(db, payload.details)

    sales_order_id = generate_next_id(db, SalesOrder, "sales_order_id", "SO")
    order = SalesOrder(
        sales_order_id=sales_order_id,
        store_id=payload.store_id,
        order_date=payload.order_date,
        order_status=payload.order_status,
        order_total_amount=Decimal("0"),
    )
    db.add(order)
    db.flush()
    _replace_sales_details(db, sales_order_id, payload.details)
    _recalc_order_total(db, sales_order_id)
    db.commit()
    return get_sales_order(db, sales_order_id)


def update_sales_order(db: Session, sales_order_id: str, payload: SalesOrderUpdate) -> SalesOrderOut:
    order = _load_sales_order(db, sales_order_id)
    if order.order_status in {"COMPLETED", "CANCELLED"}:
        raise BadRequestError("Cannot update a completed or cancelled sales order")

    if payload.details is not None:
        if not payload.details:
            raise BadRequestError("Sales order must have at least one detail line")
        _validate_sales_details(db, payload.details)
        _replace_sales_details(db, sales_order_id, payload.details)

    data = payload.model_dump(exclude_unset=True)
    data.pop("details", None)

    if "store_id" in data and db.get(Store, data["store_id"]) is None:
        raise BadRequestError("Invalid store_id")
    if "order_status" in data and data["order_status"] not in VALID_SALES_STATUSES:
        raise BadRequestError(f"Invalid order_status: {data['order_status']}")

    for field, value in data.items():
        setattr(order, field, value)

    db.flush()
    if payload.details is not None:
        order.order_total_amount = _calc_sales_order_total(payload.details)
    else:
        _recalc_order_total(db, sales_order_id)
    db.commit()
    return get_sales_order(db, sales_order_id)


def delete_sales_order(db: Session, sales_order_id: str) -> None:
    order = db.get(SalesOrder, sales_order_id)
    if order is None:
        raise NotFoundError("Sales order not found")
    if order.order_status not in {"PENDING", "CANCELLED"}:
        raise BadRequestError("Only pending or cancelled orders can be deleted")
    db.delete(order)
    db.commit()


def _transition_sales_order(db: Session, sales_order_id: str, action: str) -> SalesOrderOut:
    order = _load_sales_order(db, sales_order_id)
    target_status = SALES_STATUS_TRANSITIONS[action]
    current = order.order_status

    allowed: dict[str, set[str]] = {
        "pay": {"PENDING"},
        "ship": {"PAID"},
        "complete": {"SHIPPED"},
        "cancel": {"PENDING", "PAID"},
    }
    if current not in allowed[action]:
        raise BadRequestError(f"Cannot {action} order in status {current}")

    order.order_status = target_status
    db.commit()
    return get_sales_order(db, sales_order_id)


def pay_sales_order(db: Session, sales_order_id: str) -> SalesOrderOut:
    return _transition_sales_order(db, sales_order_id, "pay")


def ship_sales_order(db: Session, sales_order_id: str) -> SalesOrderOut:
    return _transition_sales_order(db, sales_order_id, "ship")


def complete_sales_order(db: Session, sales_order_id: str) -> SalesOrderOut:
    return _transition_sales_order(db, sales_order_id, "complete")


def cancel_sales_order(db: Session, sales_order_id: str) -> SalesOrderOut:
    return _transition_sales_order(db, sales_order_id, "cancel")


def get_product_ranking(
    db: Session,
    *,
    limit: int = 10,
    days: int | None = None,
) -> list[ProductRankingItem]:
    stmt = (
        select(
            SalesDetail.product_id,
            Product.product_name,
            func.sum(SalesDetail.sales_qty).label("total_qty"),
            func.sum(SalesDetail.sales_qty * SalesDetail.sales_unit_price).label("total_amount"),
        )
        .join(Product, SalesDetail.product_id == Product.product_id)
        .join(SalesOrder, SalesDetail.sales_order_id == SalesOrder.sales_order_id)
        .where(SalesOrder.order_status.in_(["PAID", "SHIPPED", "COMPLETED"]))
    )
    if days is not None:
        from datetime import date, timedelta

        cutoff = date.today() - timedelta(days=days)
        stmt = stmt.where(SalesOrder.order_date >= cutoff)

    stmt = (
        stmt.group_by(SalesDetail.product_id, Product.product_name)
        .order_by(func.sum(SalesDetail.sales_qty).desc())
        .limit(limit)
    )
    rows = db.execute(stmt).all()
    return [
        ProductRankingItem(
            product_id=row.product_id,
            product_name=row.product_name,
            total_qty=row.total_qty or Decimal("0"),
            total_amount=row.total_amount or Decimal("0"),
        )
        for row in rows
    ]


def get_store_sales_stats(
    db: Session,
    *,
    days: int | None = None,
) -> list[StoreSalesStatItem]:
    stmt = (
        select(
            Store.store_id,
            Store.store_name,
            func.count(SalesOrder.sales_order_id).label("order_count"),
            func.coalesce(func.sum(SalesOrder.order_total_amount), 0).label("total_amount"),
        )
        .join(SalesOrder, Store.store_id == SalesOrder.store_id)
        .where(SalesOrder.order_status.in_(["PAID", "SHIPPED", "COMPLETED"]))
    )
    if days is not None:
        from datetime import date, timedelta

        cutoff = date.today() - timedelta(days=days)
        stmt = stmt.where(SalesOrder.order_date >= cutoff)

    stmt = stmt.group_by(Store.store_id, Store.store_name).order_by(
        func.sum(SalesOrder.order_total_amount).desc()
    )
    rows = db.execute(stmt).all()
    return [
        StoreSalesStatItem(
            store_id=row.store_id,
            store_name=row.store_name,
            order_count=row.order_count,
            total_amount=row.total_amount or Decimal("0"),
        )
        for row in rows
    ]
