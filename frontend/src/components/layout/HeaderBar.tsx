import { LogoutOutlined, UserOutlined } from '@ant-design/icons'
import { Avatar, Breadcrumb, Dropdown, Layout, Space, Typography } from 'antd'
import { useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import { flatRoutes } from '../../routes/routeConfig'

const { Header } = Layout

interface HeaderBarProps {
  collapsed: boolean
  onToggle: () => void
}

export default function HeaderBar({ collapsed, onToggle }: HeaderBarProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const user = useAuthStore((s) => s.user)
  const role = useAuthStore((s) => s.role)
  const clearAuth = useAuthStore((s) => s.clearAuth)

  const breadcrumbs = useMemo(() => {
    const matched = flatRoutes.find((r) => r.path === location.pathname)
    const items = [{ title: '首页' }]
    if (matched?.group) {
      items.push({ title: matched.group })
    }
    if (matched?.label) {
      items.push({ title: matched.label })
    }
    return items
  }, [location.pathname])

  const menuItems = [
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: () => {
        clearAuth()
        navigate('/login', { replace: true })
      },
    },
  ]

  return (
    <Header className="app-header">
      <Space>
        <Typography.Link onClick={onToggle}>
          {collapsed ? '展开' : '收起'}
        </Typography.Link>
        <Breadcrumb items={breadcrumbs} />
      </Space>
      <Dropdown menu={{ items: menuItems }} placement="bottomRight">
        <Space className="user-info" style={{ cursor: 'pointer' }}>
          <Avatar size="small" icon={<UserOutlined />} />
          <span>
            {user?.real_name ?? user?.username}
            {role ? `（${role.role_name}）` : ''}
          </span>
        </Space>
      </Dropdown>
    </Header>
  )
}
