from __future__ import annotations

from datetime import date
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import CheckConstraint, Date, ForeignKey, Numeric, String, Unicode, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base

if TYPE_CHECKING:
    from app.models.purchase import Ingredient
    from app.models.sales import SalesDetail


class Factory(Base):
    __tablename__ = "factory"

    factory_id: Mapped[str] = mapped_column(String(20), primary_key=True)
    factory_name: Mapped[str] = mapped_column(Unicode(100), nullable=False)
    factory_location: Mapped[str] = mapped_column(Unicode(200), nullable=False)
    manager_name: Mapped[str] = mapped_column(Unicode(50), nullable=False)
    contact_phone: Mapped[str] = mapped_column(String(20), nullable=False)

    work_orders: Mapped[list[WorkOrder]] = relationship(back_populates="factory")


class Product(Base):
    __tablename__ = "product"
    __table_args__ = (
        CheckConstraint("sales_price > 0", name="ck_product_price"),
        CheckConstraint("shelf_life_days > 0", name="ck_product_shelf_life"),
    )

    product_id: Mapped[str] = mapped_column(String(20), primary_key=True)
    product_name: Mapped[str] = mapped_column(Unicode(100), nullable=False, unique=True)
    product_category: Mapped[str] = mapped_column(Unicode(50), nullable=False)
    sales_price: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    shelf_life_days: Mapped[int] = mapped_column(nullable=False)

    recipes: Mapped[list[Recipe]] = relationship(back_populates="product")
    work_orders: Mapped[list[WorkOrder]] = relationship(back_populates="product")
    sales_details: Mapped[list[SalesDetail]] = relationship(back_populates="product")


class Recipe(Base):
    __tablename__ = "recipe"
    __table_args__ = (UniqueConstraint("product_id", "recipe_version", name="uq_recipe_product_version"),)

    recipe_id: Mapped[str] = mapped_column(String(20), primary_key=True)
    product_id: Mapped[str] = mapped_column(String(20), ForeignKey("product.product_id"), nullable=False)
    recipe_name: Mapped[str] = mapped_column(Unicode(100), nullable=False)
    recipe_version: Mapped[str] = mapped_column(String(20), nullable=False)

    product: Mapped[Product] = relationship(back_populates="recipes")
    ingredients: Mapped[list[RecipeIngredient]] = relationship(back_populates="recipe")
    work_orders: Mapped[list[WorkOrder]] = relationship(back_populates="recipe")


class RecipeIngredient(Base):
    __tablename__ = "recipe_ingredient"
    __table_args__ = (CheckConstraint("ingredient_qty > 0", name="ck_recipe_ingredient_qty"),)

    recipe_id: Mapped[str] = mapped_column(String(20), ForeignKey("recipe.recipe_id"), primary_key=True)
    ingredient_id: Mapped[str] = mapped_column(String(20), ForeignKey("ingredient.ingredient_id"), primary_key=True)
    ingredient_qty: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)

    recipe: Mapped[Recipe] = relationship(back_populates="ingredients")
    ingredient: Mapped[Ingredient] = relationship()


class WorkOrder(Base):
    __tablename__ = "work_order"
    __table_args__ = (CheckConstraint("production_qty > 0", name="ck_work_order_qty"),)

    work_order_id: Mapped[str] = mapped_column(String(20), primary_key=True)
    factory_id: Mapped[str] = mapped_column(String(20), ForeignKey("factory.factory_id"), nullable=False)
    product_id: Mapped[str] = mapped_column(String(20), ForeignKey("product.product_id"), nullable=False)
    recipe_id: Mapped[str] = mapped_column(String(20), ForeignKey("recipe.recipe_id"), nullable=False)
    production_date: Mapped[date] = mapped_column(Date, nullable=False)
    production_qty: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)

    factory: Mapped[Factory] = relationship(back_populates="work_orders")
    product: Mapped[Product] = relationship(back_populates="work_orders")
    recipe: Mapped[Recipe] = relationship(back_populates="work_orders")
