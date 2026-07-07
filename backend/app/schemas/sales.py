from datetime import date
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class StoreBase(BaseModel):
    store_name: str
    store_address: str
    store_manager: str
    contact_phone: str


class StoreCreate(StoreBase):
    pass


class StoreUpdate(BaseModel):
    store_name: str | None = None
    store_address: str | None = None
    store_manager: str | None = None
    contact_phone: str | None = None


class StoreOut(StoreBase):
    model_config = ConfigDict(from_attributes=True)

    store_id: str


class SalesDetailBase(BaseModel):
    product_id: str
    sales_qty: Decimal
    sales_unit_price: Decimal


class SalesDetailOut(SalesDetailBase):
    model_config = ConfigDict(from_attributes=True)

    sales_detail_id: str
    sales_order_id: str


class SalesOrderBase(BaseModel):
    store_id: str
    order_date: date
    order_status: str


class SalesOrderCreate(BaseModel):
    store_id: str
    order_date: date
    order_status: str = "PENDING"
    details: list[SalesDetailBase] = Field(default_factory=list)


class SalesOrderUpdate(BaseModel):
    store_id: str | None = None
    order_date: date | None = None
    order_status: str | None = None
    details: list[SalesDetailBase] | None = None


class SalesOrderOut(SalesOrderBase):
    model_config = ConfigDict(from_attributes=True)

    sales_order_id: str
    order_total_amount: Decimal
    details: list[SalesDetailOut] = []


class ProductRankingItem(BaseModel):
    product_id: str
    product_name: str | None = None
    total_qty: Decimal
    total_amount: Decimal


class StoreSalesStatItem(BaseModel):
    store_id: str
    store_name: str | None = None
    order_count: int
    total_amount: Decimal
