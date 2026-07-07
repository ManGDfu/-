from sqlalchemy import or_, select
from sqlalchemy.orm import Session, joinedload

from app.core.exceptions import BadRequestError, ConflictError, NotFoundError
from app.core.security import generate_next_id, paginate
from app.models.production import Factory, Product, Recipe, RecipeIngredient, WorkOrder
from app.models.purchase import Ingredient
from app.schemas.production import (
    FactoryCreate,
    FactoryOut,
    FactoryUpdate,
    MaterialRequirementItem,
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


def _recipe_to_out(recipe: Recipe) -> RecipeOut:
    return RecipeOut.model_validate(recipe)


def list_factories(
    db: Session,
    *,
    page: int,
    page_size: int,
    keyword: str = "",
) -> tuple[list[FactoryOut], int]:
    stmt = select(Factory).order_by(Factory.factory_id)
    if keyword.strip():
        pattern = f"%{keyword.strip()}%"
        stmt = stmt.where(
            or_(
                Factory.factory_name.like(pattern),
                Factory.factory_location.like(pattern),
                Factory.manager_name.like(pattern),
            )
        )
    items, total = paginate(db, stmt, page=page, page_size=page_size)
    return [FactoryOut.model_validate(item) for item in items], total


def get_factory(db: Session, factory_id: str) -> FactoryOut:
    factory = db.get(Factory, factory_id)
    if factory is None:
        raise NotFoundError("Factory not found")
    return FactoryOut.model_validate(factory)


def create_factory(db: Session, payload: FactoryCreate) -> FactoryOut:
    factory = Factory(
        factory_id=generate_next_id(db, Factory, "factory_id", "FAC"),
        **payload.model_dump(),
    )
    db.add(factory)
    db.commit()
    db.refresh(factory)
    return FactoryOut.model_validate(factory)


def update_factory(db: Session, factory_id: str, payload: FactoryUpdate) -> FactoryOut:
    factory = db.get(Factory, factory_id)
    if factory is None:
        raise NotFoundError("Factory not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(factory, field, value)
    db.commit()
    db.refresh(factory)
    return FactoryOut.model_validate(factory)


def delete_factory(db: Session, factory_id: str) -> None:
    factory = db.get(Factory, factory_id)
    if factory is None:
        raise NotFoundError("Factory not found")
    if factory.work_orders:
        raise ConflictError("Factory has work orders and cannot be deleted")
    db.delete(factory)
    db.commit()


def list_products(
    db: Session,
    *,
    page: int,
    page_size: int,
    keyword: str = "",
) -> tuple[list[ProductOut], int]:
    stmt = select(Product).order_by(Product.product_id)
    if keyword.strip():
        pattern = f"%{keyword.strip()}%"
        stmt = stmt.where(
            or_(
                Product.product_name.like(pattern),
                Product.product_category.like(pattern),
            )
        )
    items, total = paginate(db, stmt, page=page, page_size=page_size)
    return [ProductOut.model_validate(item) for item in items], total


def get_product(db: Session, product_id: str) -> ProductOut:
    product = db.get(Product, product_id)
    if product is None:
        raise NotFoundError("Product not found")
    return ProductOut.model_validate(product)


def create_product(db: Session, payload: ProductCreate) -> ProductOut:
    existing = db.scalar(select(Product).where(Product.product_name == payload.product_name))
    if existing is not None:
        raise ConflictError("Product name already exists")
    product = Product(
        product_id=generate_next_id(db, Product, "product_id", "PRO"),
        **payload.model_dump(),
    )
    db.add(product)
    db.commit()
    db.refresh(product)
    return ProductOut.model_validate(product)


def update_product(db: Session, product_id: str, payload: ProductUpdate) -> ProductOut:
    product = db.get(Product, product_id)
    if product is None:
        raise NotFoundError("Product not found")
    data = payload.model_dump(exclude_unset=True)
    if "product_name" in data and data["product_name"] != product.product_name:
        existing = db.scalar(select(Product).where(Product.product_name == data["product_name"]))
        if existing is not None:
            raise ConflictError("Product name already exists")
    for field, value in data.items():
        setattr(product, field, value)
    db.commit()
    db.refresh(product)
    return ProductOut.model_validate(product)


def delete_product(db: Session, product_id: str) -> None:
    product = db.get(Product, product_id)
    if product is None:
        raise NotFoundError("Product not found")
    if product.recipes or product.work_orders or product.sales_details:
        raise ConflictError("Product is referenced and cannot be deleted")
    db.delete(product)
    db.commit()


def _load_recipe(db: Session, recipe_id: str) -> Recipe:
    recipe = (
        db.query(Recipe)
        .options(joinedload(Recipe.ingredients).joinedload(RecipeIngredient.ingredient))
        .filter(Recipe.recipe_id == recipe_id)
        .first()
    )
    if recipe is None:
        raise NotFoundError("Recipe not found")
    return recipe


def list_recipes(
    db: Session,
    *,
    page: int,
    page_size: int,
    keyword: str = "",
    product_id: str | None = None,
) -> tuple[list[RecipeOut], int]:
    stmt = select(Recipe).order_by(Recipe.recipe_id)
    if product_id:
        stmt = stmt.where(Recipe.product_id == product_id)
    if keyword.strip():
        pattern = f"%{keyword.strip()}%"
        stmt = stmt.where(
            or_(
                Recipe.recipe_name.like(pattern),
                Recipe.recipe_version.like(pattern),
            )
        )
    recipes, total = paginate(db, stmt, page=page, page_size=page_size)
    recipe_ids = [recipe.recipe_id for recipe in recipes]
    if recipe_ids:
        loaded = (
            db.query(Recipe)
            .options(joinedload(Recipe.ingredients))
            .filter(Recipe.recipe_id.in_(recipe_ids))
            .all()
        )
        loaded_map = {recipe.recipe_id: recipe for recipe in loaded}
        recipes = [loaded_map[recipe_id] for recipe_id in recipe_ids if recipe_id in loaded_map]
    return [_recipe_to_out(recipe) for recipe in recipes], total


def get_recipe(db: Session, recipe_id: str) -> RecipeOut:
    return _recipe_to_out(_load_recipe(db, recipe_id))


def _validate_recipe_refs(db: Session, product_id: str, ingredient_ids: list[str]) -> None:
    product = db.get(Product, product_id)
    if product is None:
        raise BadRequestError("Invalid product_id")
    for ingredient_id in ingredient_ids:
        if db.get(Ingredient, ingredient_id) is None:
            raise BadRequestError(f"Invalid ingredient_id: {ingredient_id}")


def create_recipe(db: Session, payload: RecipeCreate) -> RecipeOut:
    ingredient_ids = [item.ingredient_id for item in payload.ingredients]
    _validate_recipe_refs(db, payload.product_id, ingredient_ids)
    if len(ingredient_ids) != len(set(ingredient_ids)):
        raise BadRequestError("Duplicate ingredients in recipe")

    existing = db.scalar(
        select(Recipe).where(
            Recipe.product_id == payload.product_id,
            Recipe.recipe_version == payload.recipe_version,
        )
    )
    if existing is not None:
        raise ConflictError("Recipe version already exists for this product")

    recipe_id = generate_next_id(db, Recipe, "recipe_id", "REC")
    recipe = Recipe(
        recipe_id=recipe_id,
        product_id=payload.product_id,
        recipe_name=payload.recipe_name,
        recipe_version=payload.recipe_version,
    )
    db.add(recipe)
    for item in payload.ingredients:
        db.add(
            RecipeIngredient(
                recipe_id=recipe_id,
                ingredient_id=item.ingredient_id,
                ingredient_qty=item.ingredient_qty,
            )
        )
    db.commit()
    return get_recipe(db, recipe_id)


def update_recipe(db: Session, recipe_id: str, payload: RecipeUpdate) -> RecipeOut:
    recipe = _load_recipe(db, recipe_id)
    data = payload.model_dump(exclude_unset=True)
    ingredients = data.pop("ingredients", None)

    new_product_id = data.get("product_id", recipe.product_id)
    new_version = data.get("recipe_version", recipe.recipe_version)
    if new_product_id != recipe.product_id or new_version != recipe.recipe_version:
        existing = db.scalar(
            select(Recipe).where(
                Recipe.product_id == new_product_id,
                Recipe.recipe_version == new_version,
                Recipe.recipe_id != recipe_id,
            )
        )
        if existing is not None:
            raise ConflictError("Recipe version already exists for this product")

    if ingredients is not None:
        ingredient_ids = [item["ingredient_id"] for item in ingredients]
        _validate_recipe_refs(db, new_product_id, ingredient_ids)
        if len(ingredient_ids) != len(set(ingredient_ids)):
            raise BadRequestError("Duplicate ingredients in recipe")
        for ri in list(recipe.ingredients):
            db.delete(ri)
        for item in ingredients:
            db.add(
                RecipeIngredient(
                    recipe_id=recipe_id,
                    ingredient_id=item["ingredient_id"],
                    ingredient_qty=item["ingredient_qty"],
                )
            )

    for field, value in data.items():
        setattr(recipe, field, value)

    db.commit()
    return get_recipe(db, recipe_id)


def delete_recipe(db: Session, recipe_id: str) -> None:
    recipe = db.get(Recipe, recipe_id)
    if recipe is None:
        raise NotFoundError("Recipe not found")
    if recipe.work_orders:
        raise ConflictError("Recipe is used by work orders and cannot be deleted")
    db.delete(recipe)
    db.commit()


def _validate_work_order_refs(
    db: Session,
    *,
    factory_id: str,
    product_id: str,
    recipe_id: str,
) -> None:
    if db.get(Factory, factory_id) is None:
        raise BadRequestError("Invalid factory_id")
    if db.get(Product, product_id) is None:
        raise BadRequestError("Invalid product_id")
    recipe = db.get(Recipe, recipe_id)
    if recipe is None:
        raise BadRequestError("Invalid recipe_id")
    if recipe.product_id != product_id:
        raise BadRequestError("Recipe does not belong to the specified product")


def list_work_orders(
    db: Session,
    *,
    page: int,
    page_size: int,
    keyword: str = "",
    factory_id: str | None = None,
    product_id: str | None = None,
) -> tuple[list[WorkOrderOut], int]:
    stmt = select(WorkOrder).order_by(WorkOrder.work_order_id)
    if factory_id:
        stmt = stmt.where(WorkOrder.factory_id == factory_id)
    if product_id:
        stmt = stmt.where(WorkOrder.product_id == product_id)
    if keyword.strip():
        stmt = stmt.where(WorkOrder.work_order_id.like(f"%{keyword.strip()}%"))
    items, total = paginate(db, stmt, page=page, page_size=page_size)
    return [WorkOrderOut.model_validate(item) for item in items], total


def get_work_order(db: Session, work_order_id: str) -> WorkOrderOut:
    work_order = db.get(WorkOrder, work_order_id)
    if work_order is None:
        raise NotFoundError("Work order not found")
    return WorkOrderOut.model_validate(work_order)


def create_work_order(db: Session, payload: WorkOrderCreate) -> WorkOrderOut:
    _validate_work_order_refs(
        db,
        factory_id=payload.factory_id,
        product_id=payload.product_id,
        recipe_id=payload.recipe_id,
    )
    work_order = WorkOrder(
        work_order_id=generate_next_id(db, WorkOrder, "work_order_id", "WO"),
        **payload.model_dump(),
    )
    db.add(work_order)
    db.commit()
    db.refresh(work_order)
    return WorkOrderOut.model_validate(work_order)


def update_work_order(db: Session, work_order_id: str, payload: WorkOrderUpdate) -> WorkOrderOut:
    work_order = db.get(WorkOrder, work_order_id)
    if work_order is None:
        raise NotFoundError("Work order not found")
    data = payload.model_dump(exclude_unset=True)
    factory_id = data.get("factory_id", work_order.factory_id)
    product_id = data.get("product_id", work_order.product_id)
    recipe_id = data.get("recipe_id", work_order.recipe_id)
    _validate_work_order_refs(
        db,
        factory_id=factory_id,
        product_id=product_id,
        recipe_id=recipe_id,
    )
    for field, value in data.items():
        setattr(work_order, field, value)
    db.commit()
    db.refresh(work_order)
    return WorkOrderOut.model_validate(work_order)


def delete_work_order(db: Session, work_order_id: str) -> None:
    work_order = db.get(WorkOrder, work_order_id)
    if work_order is None:
        raise NotFoundError("Work order not found")
    db.delete(work_order)
    db.commit()


def get_material_requirement(db: Session, work_order_id: str) -> MaterialRequirementOut:
    work_order = (
        db.query(WorkOrder)
        .options(
            joinedload(WorkOrder.recipe)
            .joinedload(Recipe.ingredients)
            .joinedload(RecipeIngredient.ingredient)
        )
        .filter(WorkOrder.work_order_id == work_order_id)
        .first()
    )
    if work_order is None:
        raise NotFoundError("Work order not found")

    items: list[MaterialRequirementItem] = []
    for ri in work_order.recipe.ingredients:
        required_qty = work_order.production_qty * ri.ingredient_qty
        items.append(
            MaterialRequirementItem(
                ingredient_id=ri.ingredient_id,
                ingredient_name=ri.ingredient.ingredient_name if ri.ingredient else None,
                unit=ri.ingredient.unit if ri.ingredient else None,
                required_qty=required_qty,
            )
        )
    return MaterialRequirementOut(
        work_order_id=work_order.work_order_id,
        production_qty=work_order.production_qty,
        items=items,
    )
