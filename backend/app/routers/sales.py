from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.deps import get_current_user, get_db
from app.models.security import SysUser
from app.schemas.common import PaginatedResponse
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
from app.services import sales_service

router = APIRouter(tags=["sales"])


@router.get("/stores", response_model=PaginatedResponse)
def list_stores(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    keyword: str = Query(default=""),
    db: Session = Depends(get_db),
    _: SysUser = Depends(get_current_user),
) -> PaginatedResponse:
    items, total = sales_service.list_stores(db, page=page, page_size=page_size, keyword=keyword)
    return PaginatedResponse(items=items, total=total, page=page, page_size=page_size)


@router.get("/stores/{store_id}", response_model=StoreOut)
def get_store(
    store_id: str,
    db: Session = Depends(get_db),
    _: SysUser = Depends(get_current_user),
) -> StoreOut:
    return sales_service.get_store(db, store_id)


@router.post("/stores", response_model=StoreOut, status_code=201)
def create_store(
    payload: StoreCreate,
    db: Session = Depends(get_db),
    _: SysUser = Depends(get_current_user),
) -> StoreOut:
    return sales_service.create_store(db, payload)


@router.put("/stores/{store_id}", response_model=StoreOut)
def update_store(
    store_id: str,
    payload: StoreUpdate,
    db: Session = Depends(get_db),
    _: SysUser = Depends(get_current_user),
) -> StoreOut:
    return sales_service.update_store(db, store_id, payload)


@router.delete("/stores/{store_id}", status_code=204)
def delete_store(
    store_id: str,
    db: Session = Depends(get_db),
    _: SysUser = Depends(get_current_user),
) -> None:
    sales_service.delete_store(db, store_id)


@router.get("/sales-orders", response_model=PaginatedResponse)
def list_sales_orders(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    keyword: str = Query(default=""),
    store_id: str | None = Query(default=None),
    order_status: str | None = Query(default=None),
    db: Session = Depends(get_db),
    _: SysUser = Depends(get_current_user),
) -> PaginatedResponse:
    items, total = sales_service.list_sales_orders(
        db,
        page=page,
        page_size=page_size,
        keyword=keyword,
        store_id=store_id,
        order_status=order_status,
    )
    return PaginatedResponse(items=items, total=total, page=page, page_size=page_size)


@router.get("/sales-orders/{sales_order_id}", response_model=SalesOrderOut)
def get_sales_order(
    sales_order_id: str,
    db: Session = Depends(get_db),
    _: SysUser = Depends(get_current_user),
) -> SalesOrderOut:
    return sales_service.get_sales_order(db, sales_order_id)


@router.post("/sales-orders", response_model=SalesOrderOut, status_code=201)
def create_sales_order(
    payload: SalesOrderCreate,
    db: Session = Depends(get_db),
    _: SysUser = Depends(get_current_user),
) -> SalesOrderOut:
    return sales_service.create_sales_order(db, payload)


@router.put("/sales-orders/{sales_order_id}", response_model=SalesOrderOut)
def update_sales_order(
    sales_order_id: str,
    payload: SalesOrderUpdate,
    db: Session = Depends(get_db),
    _: SysUser = Depends(get_current_user),
) -> SalesOrderOut:
    return sales_service.update_sales_order(db, sales_order_id, payload)


@router.delete("/sales-orders/{sales_order_id}", status_code=204)
def delete_sales_order(
    sales_order_id: str,
    db: Session = Depends(get_db),
    _: SysUser = Depends(get_current_user),
) -> None:
    sales_service.delete_sales_order(db, sales_order_id)


@router.post("/sales-orders/{sales_order_id}/pay", response_model=SalesOrderOut)
def pay_sales_order(
    sales_order_id: str,
    db: Session = Depends(get_db),
    _: SysUser = Depends(get_current_user),
) -> SalesOrderOut:
    return sales_service.pay_sales_order(db, sales_order_id)


@router.post("/sales-orders/{sales_order_id}/ship", response_model=SalesOrderOut)
def ship_sales_order(
    sales_order_id: str,
    db: Session = Depends(get_db),
    _: SysUser = Depends(get_current_user),
) -> SalesOrderOut:
    return sales_service.ship_sales_order(db, sales_order_id)


@router.post("/sales-orders/{sales_order_id}/complete", response_model=SalesOrderOut)
def complete_sales_order(
    sales_order_id: str,
    db: Session = Depends(get_db),
    _: SysUser = Depends(get_current_user),
) -> SalesOrderOut:
    return sales_service.complete_sales_order(db, sales_order_id)


@router.post("/sales-orders/{sales_order_id}/cancel", response_model=SalesOrderOut)
def cancel_sales_order(
    sales_order_id: str,
    db: Session = Depends(get_db),
    _: SysUser = Depends(get_current_user),
) -> SalesOrderOut:
    return sales_service.cancel_sales_order(db, sales_order_id)


@router.get("/sales/product-ranking", response_model=list[ProductRankingItem])
def get_product_ranking(
    limit: int = Query(default=10, ge=1, le=50),
    days: int | None = Query(default=30, ge=1),
    db: Session = Depends(get_db),
    _: SysUser = Depends(get_current_user),
) -> list[ProductRankingItem]:
    return sales_service.get_product_ranking(db, limit=limit, days=days)


@router.get("/sales/store-stats", response_model=list[StoreSalesStatItem])
def get_store_sales_stats(
    days: int | None = Query(default=30, ge=1),
    db: Session = Depends(get_db),
    _: SysUser = Depends(get_current_user),
) -> list[StoreSalesStatItem]:
    return sales_service.get_store_sales_stats(db, days=days)
