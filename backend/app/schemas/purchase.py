from datetime import date
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class SupplierBase(BaseModel):
    supplier_name: str
    contact_person: str
    contact_phone: str
    address: str


class SupplierCreate(SupplierBase):
    pass


class SupplierUpdate(BaseModel):
    supplier_name: str | None = None
    contact_person: str | None = None
    contact_phone: str | None = None
    address: str | None = None


class SupplierOut(SupplierBase):
    model_config = ConfigDict(from_attributes=True)

    supplier_id: str


class IngredientBase(BaseModel):
    ingredient_name: str
    unit: str
    category: str
    shelf_life_days: int = Field(gt=0)


class IngredientCreate(IngredientBase):
    pass


class IngredientUpdate(BaseModel):
    ingredient_name: str | None = None
    unit: str | None = None
    category: str | None = None
    shelf_life_days: int | None = Field(default=None, gt=0)


class IngredientOut(IngredientBase):
    model_config = ConfigDict(from_attributes=True)

    ingredient_id: str


class PurchaseDetailBase(BaseModel):
    ingredient_id: str
    purchase_qty: Decimal = Field(gt=0)
    purchase_unit_price: Decimal = Field(gt=0)


class PurchaseDetailCreate(PurchaseDetailBase):
    pass


class PurchaseDetailOut(PurchaseDetailBase):
    model_config = ConfigDict(from_attributes=True)

    purchase_detail_id: str
    purchase_order_id: str


class PurchaseOrderBase(BaseModel):
    supplier_id: str
    order_date: date


class PurchaseOrderCreate(PurchaseOrderBase):
    order_status: str = "PENDING"
    details: list[PurchaseDetailCreate] = Field(min_length=1)


class PurchaseOrderUpdate(BaseModel):
    supplier_id: str | None = None
    order_date: date | None = None
    details: list[PurchaseDetailCreate] | None = None


class PurchaseOrderOut(PurchaseOrderBase):
    model_config = ConfigDict(from_attributes=True)

    purchase_order_id: str
    order_total_amount: Decimal
    order_status: str
    details: list[PurchaseDetailOut] = []
