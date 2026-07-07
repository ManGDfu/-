from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.deps import get_current_user, get_db
from app.models.security import SysUser
from app.schemas.common import PaginatedResponse
from app.schemas.warehouse import (
    InventoryCreate,
    InventoryOut,
    InventoryUpdate,
    TransferOrderCreate,
    TransferOrderOut,
    TransferOrderUpdate,
    WarehouseCreate,
    WarehouseOut,
    WarehouseUpdate,
)
from app.services import warehouse_service

warehouses_router = APIRouter(prefix="/warehouses", tags=["warehouses"])
inventory_router = APIRouter(prefix="/inventory", tags=["inventory"])
transfer_orders_router = APIRouter(prefix="/transfer-orders", tags=["transfer-orders"])


@warehouses_router.get("", response_model=PaginatedResponse)
def list_warehouses(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    keyword: str = Query(default=""),
    db: Session = Depends(get_db),
    _: SysUser = Depends(get_current_user),
) -> PaginatedResponse:
    items, total = warehouse_service.list_warehouses(db, page=page, page_size=page_size, keyword=keyword)
    return PaginatedResponse(items=items, total=total, page=page, page_size=page_size)


@warehouses_router.get("/{warehouse_id}", response_model=WarehouseOut)
def get_warehouse(
    warehouse_id: str,
    db: Session = Depends(get_db),
    _: SysUser = Depends(get_current_user),
) -> WarehouseOut:
    return warehouse_service.get_warehouse(db, warehouse_id)


@warehouses_router.post("", response_model=WarehouseOut, status_code=201)
def create_warehouse(
    payload: WarehouseCreate,
    db: Session = Depends(get_db),
    _: SysUser = Depends(get_current_user),
) -> WarehouseOut:
    return warehouse_service.create_warehouse(db, payload)


@warehouses_router.put("/{warehouse_id}", response_model=WarehouseOut)
def update_warehouse(
    warehouse_id: str,
    payload: WarehouseUpdate,
    db: Session = Depends(get_db),
    _: SysUser = Depends(get_current_user),
) -> WarehouseOut:
    return warehouse_service.update_warehouse(db, warehouse_id, payload)


@warehouses_router.delete("/{warehouse_id}", status_code=204)
def delete_warehouse(
    warehouse_id: str,
    db: Session = Depends(get_db),
    _: SysUser = Depends(get_current_user),
) -> None:
    warehouse_service.delete_warehouse(db, warehouse_id)


@inventory_router.get("", response_model=PaginatedResponse)
def list_inventory(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    keyword: str = Query(default=""),
    warehouse_id: str | None = Query(default=None),
    ingredient_id: str | None = Query(default=None),
    low_stock: bool = Query(default=False),
    expiring_in_days: int | None = Query(default=None, ge=0),
    db: Session = Depends(get_db),
    _: SysUser = Depends(get_current_user),
) -> PaginatedResponse:
    items, total = warehouse_service.list_inventory(
        db,
        page=page,
        page_size=page_size,
        keyword=keyword,
        warehouse_id=warehouse_id,
        ingredient_id=ingredient_id,
        low_stock=low_stock,
        expiring_in_days=expiring_in_days,
    )
    return PaginatedResponse(items=items, total=total, page=page, page_size=page_size)


@inventory_router.get("/{inventory_id}", response_model=InventoryOut)
def get_inventory(
    inventory_id: str,
    db: Session = Depends(get_db),
    _: SysUser = Depends(get_current_user),
) -> InventoryOut:
    return warehouse_service.get_inventory(db, inventory_id)


@inventory_router.post("", response_model=InventoryOut, status_code=201)
def create_inventory(
    payload: InventoryCreate,
    db: Session = Depends(get_db),
    _: SysUser = Depends(get_current_user),
) -> InventoryOut:
    return warehouse_service.create_inventory(db, payload)


@inventory_router.put("/{inventory_id}", response_model=InventoryOut)
def update_inventory(
    inventory_id: str,
    payload: InventoryUpdate,
    db: Session = Depends(get_db),
    _: SysUser = Depends(get_current_user),
) -> InventoryOut:
    return warehouse_service.update_inventory(db, inventory_id, payload)


@inventory_router.delete("/{inventory_id}", status_code=204)
def delete_inventory(
    inventory_id: str,
    db: Session = Depends(get_db),
    _: SysUser = Depends(get_current_user),
) -> None:
    warehouse_service.delete_inventory(db, inventory_id)


@transfer_orders_router.get("", response_model=PaginatedResponse)
def list_transfer_orders(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    keyword: str = Query(default=""),
    source_warehouse_id: str | None = Query(default=None),
    target_warehouse_id: str | None = Query(default=None),
    transfer_type: str | None = Query(default=None),
    db: Session = Depends(get_db),
    _: SysUser = Depends(get_current_user),
) -> PaginatedResponse:
    items, total = warehouse_service.list_transfer_orders(
        db,
        page=page,
        page_size=page_size,
        keyword=keyword,
        source_warehouse_id=source_warehouse_id,
        target_warehouse_id=target_warehouse_id,
        transfer_type=transfer_type,
    )
    return PaginatedResponse(items=items, total=total, page=page, page_size=page_size)


@transfer_orders_router.get("/{transfer_order_id}", response_model=TransferOrderOut)
def get_transfer_order(
    transfer_order_id: str,
    db: Session = Depends(get_db),
    _: SysUser = Depends(get_current_user),
) -> TransferOrderOut:
    return warehouse_service.get_transfer_order(db, transfer_order_id)


@transfer_orders_router.post("", response_model=TransferOrderOut, status_code=201)
def create_transfer_order(
    payload: TransferOrderCreate,
    db: Session = Depends(get_db),
    _: SysUser = Depends(get_current_user),
) -> TransferOrderOut:
    return warehouse_service.create_transfer_order(db, payload)


@transfer_orders_router.put("/{transfer_order_id}", response_model=TransferOrderOut)
def update_transfer_order(
    transfer_order_id: str,
    payload: TransferOrderUpdate,
    db: Session = Depends(get_db),
    _: SysUser = Depends(get_current_user),
) -> TransferOrderOut:
    return warehouse_service.update_transfer_order(db, transfer_order_id, payload)


@transfer_orders_router.delete("/{transfer_order_id}", status_code=204)
def delete_transfer_order(
    transfer_order_id: str,
    db: Session = Depends(get_db),
    _: SysUser = Depends(get_current_user),
) -> None:
    warehouse_service.delete_transfer_order(db, transfer_order_id)


router = APIRouter()
router.include_router(warehouses_router)
router.include_router(inventory_router)
router.include_router(transfer_orders_router)
