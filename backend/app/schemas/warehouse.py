from datetime import date
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field, model_validator


class WarehouseBase(BaseModel):
    warehouse_name: str
    warehouse_location: str
    warehouse_capacity: Decimal = Field(gt=0)
    temperature_type: str


class WarehouseCreate(WarehouseBase):
    pass


class WarehouseUpdate(BaseModel):
    warehouse_name: str | None = None
    warehouse_location: str | None = None
    warehouse_capacity: Decimal | None = Field(default=None, gt=0)
    temperature_type: str | None = None


class WarehouseOut(WarehouseBase):
    model_config = ConfigDict(from_attributes=True)

    warehouse_id: str


class InventoryBase(BaseModel):
    warehouse_id: str
    ingredient_id: str
    stock_qty: Decimal = Field(ge=0)
    production_date: date
    expiry_date: date
    safety_stock: Decimal = Field(ge=0)


class InventoryCreate(InventoryBase):
    @model_validator(mode="after")
    def validate_dates(self) -> InventoryCreate:
        if self.expiry_date < self.production_date:
            raise ValueError("expiry_date must be on or after production_date")
        return self


class InventoryUpdate(BaseModel):
    warehouse_id: str | None = None
    ingredient_id: str | None = None
    stock_qty: Decimal | None = Field(default=None, ge=0)
    production_date: date | None = None
    expiry_date: date | None = None
    safety_stock: Decimal | None = Field(default=None, ge=0)


class InventoryOut(InventoryBase):
    model_config = ConfigDict(from_attributes=True)

    inventory_id: str


class TransferDetailBase(BaseModel):
    ingredient_id: str
    transfer_qty: Decimal = Field(gt=0)


class TransferDetailCreate(TransferDetailBase):
    pass


class TransferDetailOut(TransferDetailBase):
    model_config = ConfigDict(from_attributes=True)

    transfer_detail_id: str
    transfer_order_id: str


class TransferOrderBase(BaseModel):
    source_warehouse_id: str
    target_warehouse_id: str
    transfer_date: date
    transfer_type: str


class TransferOrderCreate(TransferOrderBase):
    details: list[TransferDetailCreate] = Field(min_length=1)

    @model_validator(mode="after")
    def validate_different_warehouses(self) -> TransferOrderCreate:
        if self.source_warehouse_id == self.target_warehouse_id:
            raise ValueError("source_warehouse_id and target_warehouse_id must differ")
        return self


class TransferOrderUpdate(BaseModel):
    source_warehouse_id: str | None = None
    target_warehouse_id: str | None = None
    transfer_date: date | None = None
    transfer_type: str | None = None
    details: list[TransferDetailCreate] | None = None


class TransferOrderOut(TransferOrderBase):
    model_config = ConfigDict(from_attributes=True)

    transfer_order_id: str
    details: list[TransferDetailOut] = []
