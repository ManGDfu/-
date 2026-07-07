from datetime import date
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class FactoryBase(BaseModel):
    factory_name: str
    factory_location: str
    manager_name: str
    contact_phone: str


class FactoryCreate(FactoryBase):
    pass


class FactoryUpdate(BaseModel):
    factory_name: str | None = None
    factory_location: str | None = None
    manager_name: str | None = None
    contact_phone: str | None = None


class FactoryOut(FactoryBase):
    model_config = ConfigDict(from_attributes=True)

    factory_id: str


class ProductBase(BaseModel):
    product_name: str
    product_category: str
    sales_price: Decimal
    shelf_life_days: int


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    product_name: str | None = None
    product_category: str | None = None
    sales_price: Decimal | None = None
    shelf_life_days: int | None = None


class ProductOut(ProductBase):
    model_config = ConfigDict(from_attributes=True)

    product_id: str


class RecipeIngredientBase(BaseModel):
    ingredient_id: str
    ingredient_qty: Decimal


class RecipeIngredientOut(RecipeIngredientBase):
    model_config = ConfigDict(from_attributes=True)

    recipe_id: str


class RecipeBase(BaseModel):
    product_id: str
    recipe_name: str
    recipe_version: str


class RecipeCreate(RecipeBase):
    ingredients: list[RecipeIngredientBase] = Field(default_factory=list)


class RecipeUpdate(BaseModel):
    product_id: str | None = None
    recipe_name: str | None = None
    recipe_version: str | None = None
    ingredients: list[RecipeIngredientBase] | None = None


class RecipeOut(RecipeBase):
    model_config = ConfigDict(from_attributes=True)

    recipe_id: str
    ingredients: list[RecipeIngredientOut] = []


class WorkOrderBase(BaseModel):
    factory_id: str
    product_id: str
    recipe_id: str
    production_date: date
    production_qty: Decimal


class WorkOrderCreate(WorkOrderBase):
    pass


class WorkOrderUpdate(BaseModel):
    factory_id: str | None = None
    product_id: str | None = None
    recipe_id: str | None = None
    production_date: date | None = None
    production_qty: Decimal | None = None


class WorkOrderOut(WorkOrderBase):
    model_config = ConfigDict(from_attributes=True)

    work_order_id: str


class MaterialRequirementItem(BaseModel):
    ingredient_id: str
    ingredient_name: str | None = None
    unit: str | None = None
    required_qty: Decimal


class MaterialRequirementOut(BaseModel):
    work_order_id: str
    production_qty: Decimal
    items: list[MaterialRequirementItem] = []
