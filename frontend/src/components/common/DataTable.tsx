import { Table } from 'antd'
import type { TablePaginationConfig, TableProps } from 'antd'

interface DataTableProps<T extends object> extends Omit<TableProps<T>, 'pagination'> {
  pagination?: TablePaginationConfig | false
}

export default function DataTable<T extends object>({
  pagination,
  ...rest
}: DataTableProps<T>) {
  const defaultPagination: TablePaginationConfig = {
    showSizeChanger: true,
    showTotal: (total) => `共 ${total} 条`,
    pageSizeOptions: ['10', '20', '50', '100'],
  }

  return (
    <Table<T>
      rowKey="id"
      size="middle"
      scroll={{ x: 'max-content' }}
      pagination={
        pagination === false
          ? false
          : { ...defaultPagination, ...pagination }
      }
      {...rest}
    />
  )
}
