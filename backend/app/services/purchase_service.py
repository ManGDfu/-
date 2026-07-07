from datetime import date
from decimal import Decimal

from sqlalchemy import or_, select
from sqlalchemy.orm import Session, joinedload, selectinload

from app.core.exceptions import BadRequestError, ConflictError, NotFoundError
from app.core.security import generate_next_id, paginate
from app.models.purchase import Ingredient, PurchaseDetail, PurchaseOrder, Supplier
from app.schemas.purchase import (
    IngredientCreate,
    IngredientOut,
    IngredientUpdate,
    PurchaseDetailCreate,
    PurchaseOrderCreate,
    PurchaseOrderOut,
    PurchaseOrderUpdate,
    SupplierCreate,
    SupplierOut,
    SupplierUpdate,
)

PURCHASE_STATUSES = frozenset({"PENDING", "APPROVED", "COMPLETED", "CANCELLED"})
EDITABLE_PURCHASE_STATUSES = frozenset({"PENDING"})


def _to_supplier_out(supplier: Supplier) -> SupplierOut:
    return SupplierOut.model_validate(supplier)


def _to_ingredient_out(ingredient: Ingredient) -> IngredientOut:
    return IngredientOut.model_validate(ingredient)


def _to_purchase_order_out(order: PurchaseOrder) -> PurchaseOrderOut:
    return PurchaseOrderOut.model_validate(order)


def _load_purchase_order(db: Session, purchase_order_id: str) -> PurchaseOrder:
    order = (
        db.query(PurchaseOrder)
        .options(joinedload(PurchaseOrder.details))
        .filter(PurchaseOrder.purchase_order_id == purchase_order_id)
        .first()
    )
    if order is None:
        raise NotFoundError("Purchase order not found")
    return order


def _validate_purchase_status(status: str) -> None:
    if status not in PURCHASE_STATUSES:
        raise BadRequestError(f"Invalid order_status: {status}")


def _validate_supplier_exists(db: Session, supplier_id: str) -> None:
    if db.get(Supplier, supplier_id) is None:
        raise BadRequestError("Invalid supplier_id")


def _validate_ingredients_exist(db: Session, ingredient_ids: list[str]) -> None:
    unique_ids = set(ingredient_ids)
    if not unique_ids:
        raise BadRequestError("At least one detail line is required")
    found = db.scalars(select(Ingredient.ingredient_id).where(Ingredient.ingredient_id.in_(unique_ids))).all()
    if len(found) != len(unique_ids):
        raise BadRequestError("One or more ingredient_id values are invalid")


def _calc_order_total(details: list[PurchaseDetailCreate] | list[PurchaseDetail]) -> Decimal:
    return sum((detail.purchase_qty * detail.purchase_unit_price for detail in details), Decimal("0"))


def _recalc_purchase_order_total(db: Session, purchase_order_id: str) -> None:
    order = _load_purchase_order(db, purchase_order_id)
    db.expire(order, ["details"])
    db.refresh(order, attribute_names=["details"])
    order.order_total_amount = _calc_order_total(order.details)
    db.flush()


def _replace_purchase_details(
    db: Session,
    purchase_order_id: str,
    details: list[PurchaseDetailCreate],
) -> None:
    existing = db.scalars(
        select(PurchaseDetail).where(PurchaseDetail.purchase_order_id == purchase_order_id)
    ).all()
    for detail in existing:
        db.delete(detail)
    db.flush()

    for detail in details:
        db.add(
            PurchaseDetail(
                purchase_detail_id=generate_next_id(db, PurchaseDetail, "purchase_detail_id", "POD"),
                purchase_order_id=purchase_order_id,
                ingredient_id=detail.ingredient_id,
                purchase_qty=detail.purchase_qty,
                purchase_unit_price=detail.purchase_unit_price,
            )
        )


def _ensure_editable_order(order: PurchaseOrder) -> None:
    if order.order_status not in EDITABLE_PURCHASE_STATUSES:
        raise BadRequestError("Only PENDING purchase orders can be modified")


def _transition_purchase_order(order: PurchaseOrder, *, expected: str, target: str, action: str) -> None:
    if order.order_status != expected:
        raise BadRequestError(f"Cannot {action} purchase order in status {order.order_status}")
    order.order_status = target


def list_suppliers(
    db: Session,
    *,
    page: int,
    page_size: int,
    keyword: str = "",
) -> tuple[list[SupplierOut], int]:
    stmt = select(Supplier).order_by(Supplier.supplier_id)
    if keyword.strip():
        pattern = f"%{keyword.strip()}%"
        stmt = stmt.where(
            or_(
                Supplier.supplier_name.like(pattern),
                Supplier.contact_person.like(pattern),
                Supplier.contact_phone.like(pattern),
                Supplier.address.like(pattern),
            )
        )
    suppliers, total = paginate(db, stmt, page=page, page_size=page_size)
    return [_to_supplier_out(supplier) for supplier in suppliers], total


def get_supplier(db: Session, supplier_id: str) -> SupplierOut:
    supplier = db.get(Supplier, supplier_id)
    if supplier is None:
        raise NotFoundError("Supplier not found")
    return _to_supplier_out(supplier)


def create_supplier(db: Session, payload: SupplierCreate) -> SupplierOut:
    existing = db.scalar(select(Supplier).where(Supplier.supplier_name == payload.supplier_name))
    if existing is not None:
        raise ConflictError("Supplier name already exists")

    supplier = Supplier(
        supplier_id=generate_next_id(db, Supplier, "supplier_id", "SUP"),
        supplier_name=payload.supplier_name,
        contact_person=payload.contact_person,
        contact_phone=payload.contact_phone,
        address=payload.address,
    )
    db.add(supplier)
    db.commit()
    db.refresh(supplier)
    return _to_supplier_out(supplier)


def update_supplier(db: Session, supplier_id: str, payload: SupplierUpdate) -> SupplierOut:
    supplier = db.get(Supplier, supplier_id)
    if supplier is None:
        raise NotFoundError("Supplier not found")

    if payload.supplier_name is not None and payload.supplier_name != supplier.supplier_name:
        existing = db.scalar(select(Supplier).where(Supplier.supplier_name == payload.supplier_name))
        if existing is not None:
            raise ConflictError("Supplier name already exists")
        supplier.supplier_name = payload.supplier_name

    if payload.contact_person is not None:
        supplier.contact_person = payload.contact_person
    if payload.contact_phone is not None:
        supplier.contact_phone = payload.contact_phone
    if payload.address is not None:
        supplier.address = payload.address

    db.commit()
    db.refresh(supplier)
    return _to_supplier_out(supplier)


def delete_supplier(db: Session, supplier_id: str) -> None:
    supplier = db.get(Supplier, supplier_id)
    if supplier is None:
        raise NotFoundError("Supplier not found")

    linked = db.scalar(
        select(PurchaseOrder.purchase_order_id)
        .where(PurchaseOrder.supplier_id == supplier_id)
        .limit(1)
    )
    if linked is not None:
        raise ConflictError("Supplier is referenced by purchase orders")

    db.delete(supplier)
    db.commit()


def list_ingredients(
    db: Session,
    *,
    page: int,
    page_size: int,
    keyword: str = "",
) -> tuple[list[IngredientOut], int]:
    stmt = select(Ingredient).order_by(Ingredient.ingredient_id)
    if keyword.strip():
        pattern = f"%{keyword.strip()}%"
        stmt = stmt.where(
            or_(
                Ingredient.ingredient_name.like(pattern),
                Ingredient.unit.like(pattern),
                Ingredient.category.like(pattern),
            )
        )
    ingredients, total = paginate(db, stmt, page=page, page_size=page_size)
    return [_to_ingredient_out(ingredient) for ingredient in ingredients], total


def get_ingredient(db: Session, ingredient_id: str) -> IngredientOut:
    ingredient = db.get(Ingredient, ingredient_id)
    if ingredient is None:
        raise NotFoundError("Ingredient not found")
    return _to_ingredient_out(ingredient)


def create_ingredient(db: Session, payload: IngredientCreate) -> IngredientOut:
    ingredient = Ingredient(
        ingredient_id=generate_next_id(db, Ingredient, "ingredient_id", "ING"),
        ingredient_name=payload.ingredient_name,
        unit=payload.unit,
        category=payload.category,
        shelf_life_days=payload.shelf_life_days,
    )
    db.add(ingredient)
    db.commit()
    db.refresh(ingredient)
    return _to_ingredient_out(ingredient)


def update_ingredient(db: Session, ingredient_id: str, payload: IngredientUpdate) -> IngredientOut:
    ingredient = db.get(Ingredient, ingredient_id)
    if ingredient is None:
        raise NotFoundError("Ingredient not found")

    if payload.ingredient_name is not None:
        ingredient.ingredient_name = payload.ingredient_name
    if payload.unit is not None:
        ingredient.unit = payload.unit
    if payload.category is not None:
        ingredient.category = payload.category
    if payload.shelf_life_days is not None:
        ingredient.shelf_life_days = payload.shelf_life_days

    db.commit()
    db.refresh(ingredient)
    return _to_ingredient_out(ingredient)


def delete_ingredient(db: Session, ingredient_id: str) -> None:
    ingredient = db.get(Ingredient, ingredient_id)
    if ingredient is None:
        raise NotFoundError("Ingredient not found")
    db.delete(ingredient)
    db.commit()


def list_purchase_orders(
    db: Session,
    *,
    page: int,
    page_size: int,
    keyword: str = "",
    order_status: str | None = None,
    supplier_id: str | None = None,
) -> tuple[list[PurchaseOrderOut], int]:
    stmt = (
        select(PurchaseOrder)
        .options(selectinload(PurchaseOrder.details))
        .order_by(PurchaseOrder.purchase_order_id.desc())
    )
    if keyword.strip():
        pattern = f"%{keyword.strip()}%"
        stmt = stmt.where(PurchaseOrder.purchase_order_id.like(pattern))
    if order_status:
        _validate_purchase_status(order_status)
        stmt = stmt.where(PurchaseOrder.order_status == order_status)
    if supplier_id:
        stmt = stmt.where(PurchaseOrder.supplier_id == supplier_id)

    orders, total = paginate(db, stmt, page=page, page_size=page_size)
    return [_to_purchase_order_out(order) for order in orders], total


def get_purchase_order(db: Session, purchase_order_id: str) -> PurchaseOrderOut:
    return _to_purchase_order_out(_load_purchase_order(db, purchase_order_id))


def create_purchase_order(db: Session, payload: PurchaseOrderCreate) -> PurchaseOrderOut:
    _validate_purchase_status(payload.order_status)
    if payload.order_status != "PENDING":
        raise BadRequestError("New purchase orders must start with PENDING status")

    _validate_supplier_exists(db, payload.supplier_id)
    ingredient_ids = [detail.ingredient_id for detail in payload.details]
    if len(ingredient_ids) != len(set(ingredient_ids)):
        raise BadRequestError("Duplicate ingredient_id in purchase details")
    _validate_ingredients_exist(db, ingredient_ids)

    order_id = generate_next_id(db, PurchaseOrder, "purchase_order_id", "PO")
    order = PurchaseOrder(
        purchase_order_id=order_id,
        supplier_id=payload.supplier_id,
        order_date=payload.order_date,
        order_total_amount=_calc_order_total(payload.details),
        order_status=payload.order_status,
    )
    db.add(order)
    db.flush()
    _replace_purchase_details(db, order_id, payload.details)
    db.commit()
    return _to_purchase_order_out(_load_purchase_order(db, order_id))


def update_purchase_order(
    db: Session,
    purchase_order_id: str,
    payload: PurchaseOrderUpdate,
) -> PurchaseOrderOut:
    order = _load_purchase_order(db, purchase_order_id)
    _ensure_editable_order(order)

    if payload.supplier_id is not None:
        _validate_supplier_exists(db, payload.supplier_id)
        order.supplier_id = payload.supplier_id
    if payload.order_date is not None:
        order.order_date = payload.order_date

    if payload.details is not None:
        ingredient_ids = [detail.ingredient_id for detail in payload.details]
        if len(ingredient_ids) != len(set(ingredient_ids)):
            raise BadRequestError("Duplicate ingredient_id in purchase details")
        _validate_ingredients_exist(db, ingredient_ids)
        _replace_purchase_details(db, purchase_order_id, payload.details)
        order.order_total_amount = _calc_order_total(payload.details)

    db.commit()
    return _to_purchase_order_out(_load_purchase_order(db, purchase_order_id))


def delete_purchase_order(db: Session, purchase_order_id: str) -> None:
    order = _load_purchase_order(db, purchase_order_id)
    if order.order_status not in {"PENDING", "CANCELLED"}:
        raise BadRequestError("Only PENDING or CANCELLED purchase orders can be deleted")

    for detail in list(order.details):
        db.delete(detail)
    db.delete(order)
    db.commit()


def approve_purchase_order(db: Session, purchase_order_id: str) -> PurchaseOrderOut:
    order = _load_purchase_order(db, purchase_order_id)
    _transition_purchase_order(order, expected="PENDING", target="APPROVED", action="approve")
    db.commit()
    return _to_purchase_order_out(_load_purchase_order(db, purchase_order_id))


def complete_purchase_order(db: Session, purchase_order_id: str) -> PurchaseOrderOut:
    order = _load_purchase_order(db, purchase_order_id)
    _transition_purchase_order(order, expected="APPROVED", target="COMPLETED", action="complete")
    db.commit()
    return _to_purchase_order_out(_load_purchase_order(db, purchase_order_id))


def cancel_purchase_order(db: Session, purchase_order_id: str) -> PurchaseOrderOut:
    order = _load_purchase_order(db, purchase_order_id)
    if order.order_status not in {"PENDING", "APPROVED"}:
        raise BadRequestError(f"Cannot cancel purchase order in status {order.order_status}")
    order.order_status = "CANCELLED"
    db.commit()
    return _to_purchase_order_out(_load_purchase_order(db, purchase_order_id))
