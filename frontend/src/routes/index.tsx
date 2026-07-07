import { lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { Spin } from 'antd'
import AppLayout from '../components/layout/AppLayout'
import ProtectedRoute from '../components/ProtectedRoute'
import { getRouteRoles } from './routeConfig'

const Login = lazy(() => import('../pages/Login'))
const Dashboard = lazy(() => import('../pages/Dashboard'))
const Users = lazy(() => import('../pages/system/Users'))
const Roles = lazy(() => import('../pages/system/Roles'))

const Suppliers = lazy(() => import('../pages/purchase/Suppliers'))
const Ingredients = lazy(() => import('../pages/purchase/Ingredients'))
const PurchaseOrders = lazy(() => import('../pages/purchase/PurchaseOrders'))

const Warehouses = lazy(() => import('../pages/warehouse/Warehouses'))
const Inventory = lazy(() => import('../pages/warehouse/Inventory'))
const Transfers = lazy(() => import('../pages/warehouse/Transfers'))

const Factories = lazy(() => import('../pages/production/Factories'))
const Products = lazy(() => import('../pages/production/Products'))
const Recipes = lazy(() => import('../pages/production/Recipes'))
const WorkOrders = lazy(() => import('../pages/production/WorkOrders'))

const Stores = lazy(() => import('../pages/sales/Stores'))
const SalesOrders = lazy(() => import('../pages/sales/SalesOrders'))

function LazyPage({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<Spin className="page-loading" />}>{children}</Suspense>
  )
}

function guard(element: React.ReactNode, path: string) {
  const roles = getRouteRoles(path)
  return (
    <ProtectedRoute roles={roles}>
      <LazyPage>{element}</LazyPage>
    </ProtectedRoute>
  )
}

export const router = createBrowserRouter([
  {
    path: '/login',
    element: (
      <LazyPage>
        <Login />
      </LazyPage>
    ),
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: guard(<Dashboard />, '/') },
      { path: 'system/users', element: guard(<Users />, '/system/users') },
      { path: 'system/roles', element: guard(<Roles />, '/system/roles') },
      { path: 'purchase/suppliers', element: guard(<Suppliers />, '/purchase/suppliers') },
      { path: 'purchase/ingredients', element: guard(<Ingredients />, '/purchase/ingredients') },
      { path: 'purchase/orders', element: guard(<PurchaseOrders />, '/purchase/orders') },
      { path: 'warehouse/warehouses', element: guard(<Warehouses />, '/warehouse/warehouses') },
      { path: 'warehouse/inventory', element: guard(<Inventory />, '/warehouse/inventory') },
      { path: 'warehouse/transfers', element: guard(<Transfers />, '/warehouse/transfers') },
      { path: 'production/factories', element: guard(<Factories />, '/production/factories') },
      { path: 'production/products', element: guard(<Products />, '/production/products') },
      { path: 'production/recipes', element: guard(<Recipes />, '/production/recipes') },
      { path: 'production/work-orders', element: guard(<WorkOrders />, '/production/work-orders') },
      { path: 'sales/stores', element: guard(<Stores />, '/sales/stores') },
      { path: 'sales/orders', element: guard(<SalesOrders />, '/sales/orders') },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
])
