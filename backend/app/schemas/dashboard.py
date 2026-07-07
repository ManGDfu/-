from decimal import Decimal

from pydantic import BaseModel

from app.schemas.sales import ProductRankingItem


class DashboardOverview(BaseModel):
    pending_purchase_orders: int
    low_stock_count: int
    expiring_inventory_count: int
    in_transit_sales_orders: int
    recent_purchase_amount: Decimal
    recent_sales_amount: Decimal
    top_products: list[ProductRankingItem] = []
