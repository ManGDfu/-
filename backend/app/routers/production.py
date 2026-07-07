from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.deps import get_current_user, get_db
from app.models.security import SysUser
from app.schemas.common import PaginatedResponse
from app.schemas.production import (
    FactoryCreate,
    FactoryOut,
    FactoryUpdate,
    MaterialRequirementOut,
    ProductCreate,
    ProductOut,
    ProductUpdate,
    RecipeCreate,
    RecipeOut,
    RecipeUpdate,
    WorkOrderCreate,
    WorkOrderOut,
    WorkOrderUpdate,
)
from app.services import production_service

router = APIRouter(tags=["production"])


@router.get("/factories", response_model=PaginatedResponse)
def list_factories(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    keyword: str = Query(default=""),
    db: Session = Depends(get_db),
    _: SysUser = Depends(get_current_user),
) -> PaginatedResponse:
    items, total = production_service.list_factories(
        db, page=page, page_size=page_size, keyword=keyword
    )
    return PaginatedResponse(items=items, total=total, page=page, page_size=page_size)


@router.get("/factories/{factory_id}", response_model=FactoryOut)
def get_factory(
    factory_id: str,
    db: Session = Depends(get_db),
    _: SysUser = Depends(get_current_user),
) -> FactoryOut:
    return production_service.get_factory(db, factory_id)


@router.post("/factories", response_model=FactoryOut, status_code=201)
def create_factory(
    payload: FactoryCreate,
    db: Session = Depends(get_db),
    _: SysUser = Depends(get_current_user),
) -> FactoryOut:
    return production_service.create_factory(db, payload)


@router.put("/factories/{factory_id}", response_model=FactoryOut)
def update_factory(
    factory_id: str,
    payload: FactoryUpdate,
    db: Session = Depends(get_db),
    _: SysUser = Depends(get_current_user),
) -> FactoryOut:
    return production_service.update_factory(db, factory_id, payload)


@router.delete("/factories/{factory_id}", status_code=204)
def delete_factory(
    factory_id: str,
    db: Session = Depends(get_db),
    _: SysUser = Depends(get_current_user),
) -> None:
    production_service.delete_factory(db, factory_id)


@router.get("/products", response_model=PaginatedResponse)
def list_products(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    keyword: str = Query(default=""),
    db: Session = Depends(get_db),
    _: SysUser = Depends(get_current_user),
) -> PaginatedResponse:
    items, total = production_service.list_products(
        db, page=page, page_size=page_size, keyword=keyword
    )
    return PaginatedResponse(items=items, total=total, page=page, page_size=page_size)


@router.get("/products/{product_id}", response_model=ProductOut)
def get_product(
    product_id: str,
    db: Session = Depends(get_db),
    _: SysUser = Depends(get_current_user),
) -> ProductOut:
    return production_service.get_product(db, product_id)


@router.post("/products", response_model=ProductOut, status_code=201)
def create_product(
    payload: ProductCreate,
    db: Session = Depends(get_db),
    _: SysUser = Depends(get_current_user),
) -> ProductOut:
    return production_service.create_product(db, payload)


@router.put("/products/{product_id}", response_model=ProductOut)
def update_product(
    product_id: str,
    payload: ProductUpdate,
    db: Session = Depends(get_db),
    _: SysUser = Depends(get_current_user),
) -> ProductOut:
    return production_service.update_product(db, product_id, payload)


@router.delete("/products/{product_id}", status_code=204)
def delete_product(
    product_id: str,
    db: Session = Depends(get_db),
    _: SysUser = Depends(get_current_user),
) -> None:
    production_service.delete_product(db, product_id)


@router.get("/recipes", response_model=PaginatedResponse)
def list_recipes(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    keyword: str = Query(default=""),
    product_id: str | None = Query(default=None),
    db: Session = Depends(get_db),
    _: SysUser = Depends(get_current_user),
) -> PaginatedResponse:
    items, total = production_service.list_recipes(
        db, page=page, page_size=page_size, keyword=keyword, product_id=product_id
    )
    return PaginatedResponse(items=items, total=total, page=page, page_size=page_size)


@router.get("/recipes/{recipe_id}", response_model=RecipeOut)
def get_recipe(
    recipe_id: str,
    db: Session = Depends(get_db),
    _: SysUser = Depends(get_current_user),
) -> RecipeOut:
    return production_service.get_recipe(db, recipe_id)


@router.post("/recipes", response_model=RecipeOut, status_code=201)
def create_recipe(
    payload: RecipeCreate,
    db: Session = Depends(get_db),
    _: SysUser = Depends(get_current_user),
) -> RecipeOut:
    return production_service.create_recipe(db, payload)


@router.put("/recipes/{recipe_id}", response_model=RecipeOut)
def update_recipe(
    recipe_id: str,
    payload: RecipeUpdate,
    db: Session = Depends(get_db),
    _: SysUser = Depends(get_current_user),
) -> RecipeOut:
    return production_service.update_recipe(db, recipe_id, payload)


@router.delete("/recipes/{recipe_id}", status_code=204)
def delete_recipe(
    recipe_id: str,
    db: Session = Depends(get_db),
    _: SysUser = Depends(get_current_user),
) -> None:
    production_service.delete_recipe(db, recipe_id)


@router.get("/work-orders", response_model=PaginatedResponse)
def list_work_orders(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    keyword: str = Query(default=""),
    factory_id: str | None = Query(default=None),
    product_id: str | None = Query(default=None),
    db: Session = Depends(get_db),
    _: SysUser = Depends(get_current_user),
) -> PaginatedResponse:
    items, total = production_service.list_work_orders(
        db,
        page=page,
        page_size=page_size,
        keyword=keyword,
        factory_id=factory_id,
        product_id=product_id,
    )
    return PaginatedResponse(items=items, total=total, page=page, page_size=page_size)


@router.get("/work-orders/{work_order_id}", response_model=WorkOrderOut)
def get_work_order(
    work_order_id: str,
    db: Session = Depends(get_db),
    _: SysUser = Depends(get_current_user),
) -> WorkOrderOut:
    return production_service.get_work_order(db, work_order_id)


@router.get("/work-orders/{work_order_id}/material-requirement", response_model=MaterialRequirementOut)
def get_material_requirement(
    work_order_id: str,
    db: Session = Depends(get_db),
    _: SysUser = Depends(get_current_user),
) -> MaterialRequirementOut:
    return production_service.get_material_requirement(db, work_order_id)


@router.post("/work-orders", response_model=WorkOrderOut, status_code=201)
def create_work_order(
    payload: WorkOrderCreate,
    db: Session = Depends(get_db),
    _: SysUser = Depends(get_current_user),
) -> WorkOrderOut:
    return production_service.create_work_order(db, payload)


@router.put("/work-orders/{work_order_id}", response_model=WorkOrderOut)
def update_work_order(
    work_order_id: str,
    payload: WorkOrderUpdate,
    db: Session = Depends(get_db),
    _: SysUser = Depends(get_current_user),
) -> WorkOrderOut:
    return production_service.update_work_order(db, work_order_id, payload)


@router.delete("/work-orders/{work_order_id}", status_code=204)
def delete_work_order(
    work_order_id: str,
    db: Session = Depends(get_db),
    _: SysUser = Depends(get_current_user),
) -> None:
    production_service.delete_work_order(db, work_order_id)
