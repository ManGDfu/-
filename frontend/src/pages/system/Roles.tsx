import { useQuery } from '@tanstack/react-query'
import type { ColumnsType } from 'antd/es/table'
import { listRoles } from '../../api/auth'
import DataTable from '../../components/common/DataTable'
import PageHeader from '../../components/common/PageHeader'
import type { Role } from '../../types/auth'

export default function Roles() {
  const { data = [], isLoading } = useQuery({
    queryKey: ['roles'],
    queryFn: listRoles,
  })

  const columns: ColumnsType<Role> = [
    { title: '角色ID', dataIndex: 'role_id', width: 100 },
    { title: '角色名称', dataIndex: 'role_name' },
    { title: '权限说明', dataIndex: 'permission_desc' },
  ]

  return (
    <div className="page-content">
      <PageHeader title="角色管理" subtitle="系统角色与权限域（只读）" />
      <DataTable<Role>
        rowKey="role_id"
        loading={isLoading}
        columns={columns}
        dataSource={data}
        pagination={false}
      />
    </div>
  )
}
