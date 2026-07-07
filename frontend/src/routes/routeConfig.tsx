import {
  DashboardOutlined,
  ExperimentOutlined,
  InboxOutlined,
  SafetyOutlined,
  ShopOutlined,
  ShoppingCartOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons'
import type { ReactNode } from 'react'

export const ROLE_ADMIN = 'ROL001'
export const ROLE_PURCHASER = 'ROL002'
export const ROLE_WAREHOUSE = 'ROL003'
export const ROLE_SALES = 'ROL004'

export const ALL_ROLES = [ROLE_ADMIN, ROLE_PURCHASER, ROLE_WAREHOUSE, ROLE_SALES]
export const PURCHASE_ROLES = [ROLE_ADMIN, ROLE_PURCHASER]
export const WAREHOUSE_ROLES = [ROLE_ADMIN, ROLE_WAREHOUSE]
export const PRODUCTION_ROLES = [ROLE_ADMIN]
export const SALES_ROLES = [ROLE_ADMIN, ROLE_SALES]
export const SYSTEM_ROLES = [ROLE_ADMIN]

export interface AppRoute {
  key: string
  path?: string
  label?: string
  icon?: ReactNode
  group?: string
  roles?: string[]
  hideInMenu?: boolean
  children?: AppRoute[]
}

/** 侧栏菜单结构（与业务路由 path 对应） */
export const menuRoutes: AppRoute[] = [
  {
    key: 'dashboard',
    path: '/',
    label: '仪表盘',
    icon: <DashboardOutlined />,
    roles: ALL_ROLES,
  },
  {
    key: 'system',
    label: '系统管理',
    icon: <SafetyOutlined />,
    roles: SYSTEM_ROLES,
    children: [
      {
        key: 'users',
        path: '/system/users',
        label: '用户管理',
        icon: <UserOutlined />,
        group: '系统管理',
        roles: SYSTEM_ROLES,
      },
      {
        key: 'roles',
        path: '/system/roles',
        label: '角色管理',
        icon: <TeamOutlined />,
        group: '系统管理',
        roles: SYSTEM_ROLES,
      },
    ],
  },
  {
    key: 'purchase',
    label: '采购管理',
    icon: <ShoppingCartOutlined />,
    roles: PURCHASE_ROLES,
    children: [
      {
        key: 'suppliers',
        path: '/purchase/suppliers',
        label: '供应商',
        group: '采购管理',
        roles: PURCHASE_ROLES,
      },
      {
        key: 'ingredients',
        path: '/purchase/ingredients',
        label: '原料',
        group: '采购管理',
        roles: PURCHASE_ROLES,
      },
      {
        key: 'purchase-orders',
        path: '/purchase/orders',
        label: '采购订单',
        group: '采购管理',
        roles: PURCHASE_ROLES,
      },
    ],
  },
  {
    key: 'warehouse',
    label: '仓储管理',
    icon: <InboxOutlined />,
    roles: WAREHOUSE_ROLES,
    children: [
      {
        key: 'warehouses',
        path: '/warehouse/warehouses',
        label: '仓库',
        group: '仓储管理',
        roles: WAREHOUSE_ROLES,
      },
      {
        key: 'inventory',
        path: '/warehouse/inventory',
        label: '库存',
        group: '仓储管理',
        roles: WAREHOUSE_ROLES,
      },
      {
        key: 'transfers',
        path: '/warehouse/transfers',
        label: '调拨单',
        group: '仓储管理',
        roles: WAREHOUSE_ROLES,
      },
    ],
  },
  {
    key: 'production',
    label: '生产管理',
    icon: <ExperimentOutlined />,
    roles: PRODUCTION_ROLES,
    children: [
      {
        key: 'factories',
        path: '/production/factories',
        label: '工厂',
        group: '生产管理',
        roles: PRODUCTION_ROLES,
      },
      {
        key: 'products',
        path: '/production/products',
        label: '产品',
        group: '生产管理',
        roles: PRODUCTION_ROLES,
      },
      {
        key: 'recipes',
        path: '/production/recipes',
        label: '配方',
        group: '生产管理',
        roles: PRODUCTION_ROLES,
      },
      {
        key: 'work-orders',
        path: '/production/work-orders',
        label: '工单',
        group: '生产管理',
        roles: PRODUCTION_ROLES,
      },
    ],
  },
  {
    key: 'sales',
    label: '销售管理',
    icon: <ShopOutlined />,
    roles: SALES_ROLES,
    children: [
      {
        key: 'stores',
        path: '/sales/stores',
        label: '门店',
        group: '销售管理',
        roles: SALES_ROLES,
      },
      {
        key: 'sales-orders',
        path: '/sales/orders',
        label: '销售订单',
        group: '销售管理',
        roles: SALES_ROLES,
      },
    ],
  },
]

function flatten(routes: AppRoute[], group?: string): AppRoute[] {
  const result: AppRoute[] = []
  for (const route of routes) {
    const item = group ? { ...route, group: route.group ?? group } : route
    if (route.path) {
      result.push(item)
    }
    if (route.children) {
      result.push(...flatten(route.children, route.label))
    }
  }
  return result
}

export const flatRoutes = flatten(menuRoutes)

export function getRouteRoles(path: string): string[] | undefined {
  return flatRoutes.find((r) => r.path === path)?.roles
}
