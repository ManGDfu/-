import { Menu } from 'antd'
import { useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import { menuRoutes, type AppRoute } from '../../routes/routeConfig'

function filterRoutesByRole(routes: AppRoute[], roleId?: string): AppRoute[] {
  return routes
    .map((route) => {
      if (route.children) {
        const children = filterRoutesByRole(route.children, roleId)
        if (children.length === 0) {
          return null
        }
        return { ...route, children }
      }
      if (!route.roles || route.roles.length === 0) {
        return route
      }
      if (roleId && route.roles.includes(roleId)) {
        return route
      }
      return null
    })
    .filter((r): r is AppRoute => r !== null)
}

function buildMenuItems(routes: AppRoute[]): { key: string; icon?: React.ReactNode; label: string; children?: ReturnType<typeof buildMenuItems> }[] {
  return routes
    .filter((r) => !r.hideInMenu && r.label)
    .map((route) => {
      if (route.children?.length) {
        return {
          key: route.key,
          icon: route.icon,
          label: route.label!,
          children: buildMenuItems(route.children),
        }
      }
      return {
        key: route.path!,
        icon: route.icon,
        label: route.label!,
      }
    })
}

function collectOpenKeys(pathname: string, routes: AppRoute[]): string[] {
  const keys: string[] = []
  for (const route of routes) {
    if (route.children?.some((c) => c.path && pathname.startsWith(c.path))) {
      keys.push(route.key)
    }
  }
  return keys
}

interface SideMenuProps {
  collapsed: boolean
}

export default function SideMenu({ collapsed }: SideMenuProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const roleId = useAuthStore((s) => s.role?.role_id)

  const visibleRoutes = useMemo(
    () => filterRoutesByRole(menuRoutes, roleId),
    [roleId],
  )

  const items = useMemo(() => buildMenuItems(visibleRoutes), [visibleRoutes])
  const defaultOpenKeys = useMemo(
    () => collectOpenKeys(location.pathname, visibleRoutes),
    [location.pathname, visibleRoutes],
  )

  return (
    <Menu
      theme="dark"
      mode="inline"
      selectedKeys={[location.pathname]}
      defaultOpenKeys={collapsed ? [] : defaultOpenKeys}
      items={items}
      onClick={({ key }) => {
        if (key.startsWith('/')) {
          navigate(key)
        }
      }}
    />
  )
}
