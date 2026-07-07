from datetime import date, timedelta

from sqlalchemy import or_, select
from sqlalchemy.orm import Session, joinedload, selectinload

from app.core.exceptions import BadRequestError, ConflictError, NotFoundError
from app.core.security import generate_next_id, paginate
from app.models.purchase import Ingredient
from app.models.warehouse import Inventory, TransferDetail, TransferOrder, Warehouse
from app.schemas.warehouse import (
    InventoryCreate,
    InventoryOut,
    InventoryUpdate,
    TransferDetailCreate,
    TransferOrderCreate,
    TransferOrderOut,
    TransferOrderUpdate,
    WarehouseCreate,
    WarehouseOut,
    WarehouseUpdate,
)

TEMPERATURE_TYPES = frozenset({"FROZEN", "CHILLED", "NORMAL"})
TRANSFER_TYPES = frozenset({"BALANCE", "EMERGENCY", "REPLENISH"})


def _to_warehouse_out(warehouse: Warehouse) -> WarehouseOut:
    return WarehouseOut.model_validate(warehouse)


def _to_inventory_out(inventory: Inventory) -> InventoryOut:
    return InventoryOut.model_validate(inventory)


def _to_transfer_order_out(order: TransferOrder) -> TransferOrderOut:
    return TransferOrderOut.model_validate(order)


def _load_transfer_order(db: Session, transfer_order_id: str) -> TransferOrder:
    order = (
        db.query(TransferOrder)
        .options(joinedload(TransferOrder.details))
        .filter(TransferOrder.transfer_order_id == transfer_order_id)
        .first()
    )
    if order is None:
        raise NotFoundError("Transfer order not found")
    return order


def _validate_temperature_type(value: str) -> None:
    if value not in TEMPERATURE_TYPES:
        raise BadRequestError(f"Invalid temperature_type: {value}")


def _validate_transfer_type(value: str) -> None:
    if value not in TRANSFER_TYPES:
        raise BadRequestError(f"Invalid transfer_type: {value}")


def _validate_warehouse_exists(db: Session, warehouse_id: str) -> None:
    if db.get(Warehouse, warehouse_id) is None:
        raise BadRequestError("Invalid warehouse_id")


def _validate_ingredient_exists(db: Session, ingredient_id: str) -> None:
    if db.get(Ingredient, ingredient_id) is None:
        raise BadRequestError("Invalid ingredient_id")


def _validate_ingredients_exist(db: Session, ingredient_ids: list[str]) -> None:
    unique_ids = set(ingredient_ids)
    if not unique_ids:
        raise BadRequestError("At least one detail line is required")
    found = db.scalars(select(Ingredient.ingredient_id).where(Ingredient.ingredient_id.in_(unique_ids))).all()
    if len(found) != len(unique_ids):
        raise BadRequestError("One or more ingredient_id values are invalid")


def _validate_transfer_warehouses(source_id: str, target_id: str) -> None:
    if source_id == target_id:
        raise BadRequestError("source_warehouse_id and target_warehouse_id must differ")


def _validate_inventory_dates(production_date: date, expiry_date: date) -> None:
    if expiry_date < production_date:
        raise BadRequestError("expiry_date must be on or after production_date")


def _replace_transfer_details(
    db: Session,
    transfer_order_id: str,
    details: list[TransferDetailCreate],
) -> None:
    existing = db.scalars(
        select(TransferDetail).where(TransferDetail.transfer_order_id == transfer_order_id)
    ).all()
    for detail in existing:
        db.delete(detail)
    db.flush()

    for detail in details:
        db.add(
            TransferDetail(
                transfer_detail_id=generate_next_id(db, TransferDetail, "transfer_detail_id", "TOD"),
                transfer_order_id=transfer_order_id,
                ingredient_id=detail.ingredient_id,
                transfer_qty=detail.transfer_qty,
            )
        )


def list_warehouses(
    db: Session,
    *,
    page: int,
    page_size: int,
    keyword: str = "",
) -> tuple[list[WarehouseOut], int]:
    stmt = select(Warehouse).order_by(Warehouse.warehouse_id)
    if keyword.strip():
        pattern = f"%{keyword.strip()}%"
        stmt = stmt.where(
            or_(
                Warehouse.warehouse_name.like(pattern),
                Warehouse.warehouse_location.like(pattern),
                Warehouse.temperature_type.like(pattern),
            )
        )
    warehouses, total = paginate(db, stmt, page=page, page_size=page_size)
    return [_to_warehouse_out(warehouse) for warehouse in warehouses], total


def get_warehouse(db: Session, warehouse_id: str) -> WarehouseOut:
    warehouse = db.get(Warehouse, warehouse_id)
    if warehouse is None:
        raise NotFoundError("Warehouse not found")
    return _to_warehouse_out(warehouse)


def create_warehouse(db: Session, payload: WarehouseCreate) -> WarehouseOut:
    _validate_temperature_type(payload.temperature_type)

    existing = db.scalar(select(Warehouse).where(Warehouse.warehouse_name == payload.warehouse_name))
    if existing is not None:
        raise ConflictError("Warehouse name already exists")

    warehouse = Warehouse(
        warehouse_id=generate_next_id(db, Warehouse, "warehouse_id", "WAR"),
        warehouse_name=payload.warehouse_name,
        warehouse_location=payload.warehouse_location,
        warehouse_capacity=payload.warehouse_capacity,
        temperature_type=payload.temperature_type,
    )
    db.add(warehouse)
    db.commit()
    db.refresh(warehouse)
    return _to_warehouse_out(warehouse)


def update_warehouse(db: Session, warehouse_id: str, payload: WarehouseUpdate) -> WarehouseOut:
    warehouse = db.get(Warehouse, warehouse_id)
    if warehouse is None:
        raise NotFoundError("Warehouse not found")

    if payload.temperature_type is not None:
        _validate_temperature_type(payload.temperature_type)
        warehouse.temperature_type = payload.temperature_type

    if payload.warehouse_name is not None and payload.warehouse_name != warehouse.warehouse_name:
        existing = db.scalar(select(Warehouse).where(Warehouse.warehouse_name == payload.warehouse_name))
        if existing is not None:
            raise ConflictError("Warehouse name already exists")
        warehouse.warehouse_name = payload.warehouse_name

    if payload.warehouse_location is not None:
        warehouse.warehouse_location = payload.warehouse_location
    if payload.warehouse_capacity is not None:
        warehouse.warehouse_capacity = payload.warehouse_capacity

    db.commit()
    db.refresh(warehouse)
    return _to_warehouse_out(warehouse)


def delete_warehouse(db: Session, warehouse_id: str) -> None:
    warehouse = db.get(Warehouse, warehouse_id)
    if warehouse is None:
        raise NotFoundError("Warehouse not found")
    db.delete(warehouse)
    db.commit()


def list_inventory(
    db: Session,
    *,
    page: int,
    page_size: int,
    keyword: str = "",
    warehouse_id: str | None = None,
    ingredient_id: str | None = None,
    low_stock: bool = False,
    expiring_in_days: int | None = None,
) -> tuple[list[InventoryOut], int]:
    stmt = select(Inventory).order_by(Inventory.inventory_id)
    if keyword.strip():
        pattern = f"%{keyword.strip()}%"
        stmt = stmt.where(Inventory.inventory_id.like(pattern))
    if warehouse_id:
        stmt = stmt.where(Inventory.warehouse_id == warehouse_id)
    if ingredient_id:
        stmt = stmt.where(Inventory.ingredient_id == ingredient_id)
    if low_stock:
        stmt = stmt.where(Inventory.stock_qty < Inventory.safety_stock)
    if expiring_in_days is not None:
        if expiring_in_days < 0:
            raise BadRequestError("expiring_in_days must be non-negative")
        cutoff = date.today() + timedelta(days=expiring_in_days)
        stmt = stmt.where(Inventory.expiry_date <= cutoff)

    inventories, total = paginate(db, stmt, page=page, page_size=page_size)
    return [_to_inventory_out(inventory) for inventory in inventories], total


def get_inventory(db: Session, inventory_id: str) -> InventoryOut:
    inventory = db.get(Inventory, inventory_id)
    if inventory is None:
        raise NotFoundError("Inventory record not found")
    return _to_inventory_out(inventory)


def create_inventory(db: Session, payload: InventoryCreate) -> InventoryOut:
    _validate_warehouse_exists(db, payload.warehouse_id)
    _validate_ingredient_exists(db, payload.ingredient_id)
    _validate_inventory_dates(payload.production_date, payload.expiry_date)

    inventory = Inventory(
        inventory_id=generate_next_id(db, Inventory, "inventory_id", "INV"),
        warehouse_id=payload.warehouse_id,
        ingredient_id=payload.ingredient_id,
        stock_qty=payload.stock_qty,
        production_date=payload.production_date,
        expiry_date=payload.expiry_date,
        safety_stock=payload.safety_stock,
    )
    db.add(inventory)
    db.commit()
    db.refresh(inventory)
    return _to_inventory_out(inventory)


def update_inventory(db: Session, inventory_id: str, payload: InventoryUpdate) -> InventoryOut:
    inventory = db.get(Inventory, inventory_id)
    if inventory is None:
        raise NotFoundError("Inventory record not found")

    if payload.warehouse_id is not None:
        _validate_warehouse_exists(db, payload.warehouse_id)
        inventory.warehouse_id = payload.warehouse_id
    if payload.ingredient_id is not None:
        _validate_ingredient_exists(db, payload.ingredient_id)
        inventory.ingredient_id = payload.ingredient_id
    if payload.stock_qty is not None:
        inventory.stock_qty = payload.stock_qty
    if payload.production_date is not None:
        inventory.production_date = payload.production_date
    if payload.expiry_date is not None:
        inventory.expiry_date = payload.expiry_date
    if payload.safety_stock is not None:
        inventory.safety_stock = payload.safety_stock

    _validate_inventory_dates(inventory.production_date, inventory.expiry_date)

    db.commit()
    db.refresh(inventory)
    return _to_inventory_out(inventory)


def delete_inventory(db: Session, inventory_id: str) -> None:
    inventory = db.get(Inventory, inventory_id)
    if inventory is None:
        raise NotFoundError("Inventory record not found")
    db.delete(inventory)
    db.commit()


def list_transfer_orders(
    db: Session,
    *,
    page: int,
    page_size: int,
    keyword: str = "",
    source_warehouse_id: str | None = None,
    target_warehouse_id: str | None = None,
    transfer_type: str | None = None,
) -> tuple[list[TransferOrderOut], int]:
    stmt = (
        select(TransferOrder)
        .options(selectinload(TransferOrder.details))
        .order_by(TransferOrder.transfer_order_id.desc())
    )
    if keyword.strip():
        pattern = f"%{keyword.strip()}%"
        stmt = stmt.where(TransferOrder.transfer_order_id.like(pattern))
    if source_warehouse_id:
        stmt = stmt.where(TransferOrder.source_warehouse_id == source_warehouse_id)
    if target_warehouse_id:
        stmt = stmt.where(TransferOrder.target_warehouse_id == target_warehouse_id)
    if transfer_type:
        _validate_transfer_type(transfer_type)
        stmt = stmt.where(TransferOrder.transfer_type == transfer_type)

    orders, total = paginate(db, stmt, page=page, page_size=page_size)
    return [_to_transfer_order_out(order) for order in orders], total


def get_transfer_order(db: Session, transfer_order_id: str) -> TransferOrderOut:
    return _to_transfer_order_out(_load_transfer_order(db, transfer_order_id))


def create_transfer_order(db: Session, payload: TransferOrderCreate) -> TransferOrderOut:
    _validate_transfer_type(payload.transfer_type)
    _validate_transfer_warehouses(payload.source_warehouse_id, payload.target_warehouse_id)
    _validate_warehouse_exists(db, payload.source_warehouse_id)
    _validate_warehouse_exists(db, payload.target_warehouse_id)

    ingredient_ids = [detail.ingredient_id for detail in payload.details]
    if len(ingredient_ids) != len(set(ingredient_ids)):
        raise BadRequestError("Duplicate ingredient_id in transfer details")
    _validate_ingredients_exist(db, ingredient_ids)

    order_id = generate_next_id(db, TransferOrder, "transfer_order_id", "TO")
    order = TransferOrder(
        transfer_order_id=order_id,
        source_warehouse_id=payload.source_warehouse_id,
        target_warehouse_id=payload.target_warehouse_id,
        transfer_date=payload.transfer_date,
        transfer_type=payload.transfer_type,
    )
    db.add(order)
    db.flush()
    _replace_transfer_details(db, order_id, payload.details)
    db.commit()
    return _to_transfer_order_out(_load_transfer_order(db, order_id))


def update_transfer_order(
    db: Session,
    transfer_order_id: str,
    payload: TransferOrderUpdate,
) -> TransferOrderOut:
    order = _load_transfer_order(db, transfer_order_id)

    source_id = payload.source_warehouse_id or order.source_warehouse_id
    target_id = payload.target_warehouse_id or order.target_warehouse_id
    _validate_transfer_warehouses(source_id, target_id)

    if payload.source_warehouse_id is not None:
        _validate_warehouse_exists(db, payload.source_warehouse_id)
        order.source_warehouse_id = payload.source_warehouse_id
    if payload.target_warehouse_id is not None:
        _validate_warehouse_exists(db, payload.target_warehouse_id)
        order.target_warehouse_id = payload.target_warehouse_id
    if payload.transfer_date is not None:
        order.transfer_date = payload.transfer_date
    if payload.transfer_type is not None:
        _validate_transfer_type(payload.transfer_type)
        order.transfer_type = payload.transfer_type

    if payload.details is not None:
        ingredient_ids = [detail.ingredient_id for detail in payload.details]
        if len(ingredient_ids) != len(set(ingredient_ids)):
            raise BadRequestError("Duplicate ingredient_id in transfer details")
        _validate_ingredients_exist(db, ingredient_ids)
        _replace_transfer_details(db, transfer_order_id, payload.details)

    db.commit()
    return _to_transfer_order_out(_load_transfer_order(db, transfer_order_id))


def delete_transfer_order(db: Session, transfer_order_id: str) -> None:
    order = _load_transfer_order(db, transfer_order_id)
    for detail in list(order.details):
        db.delete(detail)
    db.delete(order)
    db.commit()
