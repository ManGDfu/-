from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.deps import get_current_user, get_db
from app.models.security import SysUser
from app.schemas.common import PaginatedResponse
from app.schemas.purchase import (
    IngredientCreate,
    IngredientOut,
    IngredientUpdate,
    PurchaseOrderCreate,
    PurchaseOrderOut,
    PurchaseOrderUpdate,
    SupplierCreate,
    SupplierOut,
    SupplierUpdate,
)
from app.services import purchase_service

suppliers_router = APIRouter(prefix="/suppliers", tags=["suppliers"])
ingredients_router = APIRouter(prefix="/ingredients", tags=["ingredients"])
purchase_orders_router = APIRouter(prefix="/purchase-orders", tags=["purchase-orders"])


@suppliers_router.get("", response_model=PaginatedResponse)
def list_suppliers(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    keyword: str = Query(default=""),
    db: Session = Depends(get_db),
    _: SysUser = Depends(get_current_user),
) -> PaginatedResponse:
    items, total = purchase_service.list_suppliers(db, page=page, page_size=page_size, keyword=keyword)
    return PaginatedResponse(items=items, total=total, page=page, page_size=page_size)


@suppliers_router.get("/{supplier_id}", response_model=SupplierOut)
def get_supplier(
    supplier_id: str,
    db: Session = Depends(get_db),
    _: SysUser = Depends(get_current_user),
) -> SupplierOut:
    return purchase_service.get_supplier(db, supplier_id)


@suppliers_router.post("", response_model=SupplierOut, status_code=201)
def create_supplier(
    payload: SupplierCreate,
    db: Session = Depends(get_db),
    _: SysUser = Depends(get_current_user),
) -> SupplierOut:
    return purchase_service.create_supplier(db, payload)


@suppliers_router.put("/{supplier_id}", response_model=SupplierOut)
def update_supplier(
    supplier_id: str,
    payload: SupplierUpdate,
    db: Session = Depends(get_db),
    _: SysUser = Depends(get_current_user),
) -> SupplierOut:
    return purchase_service.update_supplier(db, supplier_id, payload)


@suppliers_router.delete("/{supplier_id}", status_code=204)
def delete_supplier(
    supplier_id: str,
    db: Session = Depends(get_db),
    _: SysUser = Depends(get_current_user),
) -> None:
    purchase_service.delete_supplier(db, supplier_id)


@ingredients_router.get("", response_model=PaginatedResponse)
def list_ingredients(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    keyword: str = Query(default=""),
    db: Session = Depends(get_db),
    _: SysUser = Depends(get_current_user),
) -> PaginatedResponse:
    items, total = purchase_service.list_ingredients(db, page=page, page_size=page_size, keyword=keyword)
    return PaginatedResponse(items=items, total=total, page=page, page_size=page_size)


@ingredients_router.get("/{ingredient_id}", response_model=IngredientOut)
def get_ingredient(
    ingredient_id: str,
    db: Session = Depends(get_db),
    _: SysUser = Depends(get_current_user),
) -> IngredientOut:
    return purchase_service.get_ingredient(db, ingredient_id)


@ingredients_router.post("", response_model=IngredientOut, status_code=201)
def create_ingredient(
    payload: IngredientCreate,
    db: Session = Depends(get_db),
    _: SysUser = Depends(get_current_user),
) -> IngredientOut:
    return purchase_service.create_ingredient(db, payload)


@ingredients_router.put("/{ingredient_id}", response_model=IngredientOut)
def update_ingredient(
    ingredient_id: str,
    payload: IngredientUpdate,
    db: Session = Depends(get_db),
    _: SysUser = Depends(get_current_user),
) -> IngredientOut:
    return purchase_service.update_ingredient(db, ingredient_id, payload)


@ingredients_router.delete("/{ingredient_id}", status_code=204)
def delete_ingredient(
    ingredient_id: str,
    db: Session = Depends(get_db),
    _: SysUser = Depends(get_current_user),
) -> None:
    purchase_service.delete_ingredient(db, ingredient_id)


@purchase_orders_router.get("", response_model=PaginatedResponse)
def list_purchase_orders(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    keyword: str = Query(default=""),
    order_status: str | None = Query(default=None),
    supplier_id: str | None = Query(default=None),
    db: Session = Depends(get_db),
    _: SysUser = Depends(get_current_user),
) -> PaginatedResponse:
    items, total = purchase_service.list_purchase_orders(
        db,
        page=page,
        page_size=page_size,
        keyword=keyword,
        order_status=order_status,
        supplier_id=supplier_id,
    )
    return PaginatedResponse(items=items, total=total, page=page, page_size=page_size)


@purchase_orders_router.get("/{purchase_order_id}", response_model=PurchaseOrderOut)
def get_purchase_order(
    purchase_order_id: str,
    db: Session = Depends(get_db),
    _: SysUser = Depends(get_current_user),
) -> PurchaseOrderOut:
    return purchase_service.get_purchase_order(db, purchase_order_id)


@purchase_orders_router.post("", response_model=PurchaseOrderOut, status_code=201)
def create_purchase_order(
    payload: PurchaseOrderCreate,
    db: Session = Depends(get_db),
    _: SysUser = Depends(get_current_user),
) -> PurchaseOrderOut:
    return purchase_service.create_purchase_order(db, payload)


@purchase_orders_router.put("/{purchase_order_id}", response_model=PurchaseOrderOut)
def update_purchase_order(
    purchase_order_id: str,
    payload: PurchaseOrderUpdate,
    db: Session = Depends(get_db),
    _: SysUser = Depends(get_current_user),
) -> PurchaseOrderOut:
    return purchase_service.update_purchase_order(db, purchase_order_id, payload)


@purchase_orders_router.delete("/{purchase_order_id}", status_code=204)
def delete_purchase_order(
    purchase_order_id: str,
    db: Session = Depends(get_db),
    _: SysUser = Depends(get_current_user),
) -> None:
    purchase_service.delete_purchase_order(db, purchase_order_id)


@purchase_orders_router.post("/{purchase_order_id}/approve", response_model=PurchaseOrderOut)
def approve_purchase_order(
    purchase_order_id: str,
    db: Session = Depends(get_db),
    _: SysUser = Depends(get_current_user),
) -> PurchaseOrderOut:
    return purchase_service.approve_purchase_order(db, purchase_order_id)


@purchase_orders_router.post("/{purchase_order_id}/complete", response_model=PurchaseOrderOut)
def complete_purchase_order(
    purchase_order_id: str,
    db: Session = Depends(get_db),
    _: SysUser = Depends(get_current_user),
) -> PurchaseOrderOut:
    return purchase_service.complete_purchase_order(db, purchase_order_id)


@purchase_orders_router.post("/{purchase_order_id}/cancel", response_model=PurchaseOrderOut)
def cancel_purchase_order(
    purchase_order_id: str,
    db: Session = Depends(get_db),
    _: SysUser = Depends(get_current_user),
) -> PurchaseOrderOut:
    return purchase_service.cancel_purchase_order(db, purchase_order_id)


router = APIRouter()
router.include_router(suppliers_router)
router.include_router(ingredients_router)
router.include_router(purchase_orders_router)
