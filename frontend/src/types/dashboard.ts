export interface ProductRankingItem {
  product_id: string
  product_name?: string | null
  total_qty: number | string
  total_amount: number | string
}

export interface DashboardOverview {
  pending_purchase_orders: number
  low_stock_count: number
  expiring_inventory_count: number
  in_transit_sales_orders: number
  recent_purchase_amount: number | string
  recent_sales_amount: number | string
  top_products: ProductRankingItem[]
}
