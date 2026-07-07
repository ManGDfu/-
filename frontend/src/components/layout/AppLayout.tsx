import { Layout } from 'antd'
import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import HeaderBar from './HeaderBar'
import SideMenu from './SideMenu'

const { Sider, Content } = Layout

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <Layout className="app-layout">
      <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed} width={220}>
        <div className="logo">预制菜管理</div>
        <SideMenu collapsed={collapsed} />
      </Sider>
      <Layout>
        <HeaderBar
          collapsed={collapsed}
          onToggle={() => setCollapsed((v) => !v)}
        />
        <Content className="app-content">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}
