import { Column, Pie } from '@ant-design/charts'
import { useQuery } from '@tanstack/react-query'
import { Alert, Card, Col, Row, Statistic } from 'antd'
import { fetchDashboardOverview } from '../api/dashboard'
import PageHeader from '../components/common/PageHeader'
import { formatMoney, formatNumber } from '../utils/format'

export default function Dashboard() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['dashboard', 'overview'],
    queryFn: fetchDashboardOverview,
    retry: 1,
  })

  const amountChartData = data
    ? [
        { type: '近30天采购额', value: Number(data.recent_purchase_amount) || 0 },
        { type: '近30天销售额', value: Number(data.recent_sales_amount) || 0 },
      ]
    : []

  const topProducts = (data?.top_products ?? []).map((item) => ({
    name: item.product_name ?? item.product_id,
    value: Number(item.total_qty) || 0,
  }))

  return (
    <div className="page-content">
      <PageHeader title="仪表盘" subtitle="关键业务指标一览" />

      {isError && (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
          message="仪表盘数据暂不可用"
          description={
            error instanceof Error
              ? error.message
              : '后端 /api/dashboard/overview 尚未就绪，待 Agent C 完成后将自动展示。'
          }
        />
      )}

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={isLoading}>
            <Statistic title="待处理采购单" value={data?.pending_purchase_orders ?? 0} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={isLoading}>
            <Statistic title="低库存品种" value={data?.low_stock_count ?? 0} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={isLoading}>
            <Statistic title="临期批次（7天内）" value={data?.expiring_inventory_count ?? 0} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={isLoading}>
            <Statistic title="在途销售单" value={data?.in_transit_sales_orders ?? 0} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={12}>
          <Card title="近30天采购 vs 销售" loading={isLoading}>
            {amountChartData.length > 0 ? (
              <Column
                data={amountChartData}
                xField="type"
                yField="value"
                height={280}
                label={{
                  formatter: (datum: { value?: number }) => formatMoney(datum.value ?? 0),
                }}
                meta={{ value: { alias: '金额' } }}
              />
            ) : (
              <div className="chart-empty">暂无数据</div>
            )}
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="产品销量 Top" loading={isLoading}>
            {topProducts.length > 0 ? (
              <Pie
                data={topProducts}
                angleField="value"
                colorField="name"
                radius={0.8}
                height={280}
                label={{
                  text: (d: { name: string; value: number }) =>
                    `${d.name}: ${formatNumber(d.value)}`,
                }}
              />
            ) : (
              <div className="chart-empty">暂无排行数据</div>
            )}
          </Card>
        </Col>
      </Row>

      {data && (
        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          <Col span={12}>
            <Card>
              <Statistic
                title="近30天采购总额"
                value={formatMoney(data.recent_purchase_amount)}
              />
            </Card>
          </Col>
          <Col span={12}>
            <Card>
              <Statistic
                title="近30天销售总额"
                value={formatMoney(data.recent_sales_amount)}
              />
            </Card>
          </Col>
        </Row>
      )}
    </div>
  )
}
