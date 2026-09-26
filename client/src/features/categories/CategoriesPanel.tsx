import { Alert, Button, Card, Empty, Table, Typography } from 'antd'
import { ReloadOutlined } from '@ant-design/icons'
import type { Category } from '../../api'

const { Text, Title } = Typography

interface CategoriesPanelProps {
  categories: Category[]
  loading: boolean
  error: string | null
  onRefresh: () => Promise<void>
}

export function CategoriesPanel({ categories, loading, error, onRefresh }: CategoriesPanelProps) {
  return (
    <Card bordered={false} className="panel-card">
      <div className="panel-heading">
        <div>
          <Title level={3}>Active category reference</Title>
          <Text type="secondary">Read-only classifications used when creating and updating products.</Text>
        </div>
        <Button icon={<ReloadOutlined />} onClick={() => void onRefresh()}>Refresh</Button>
      </div>
      {error && <Alert className="section-alert" type="error" showIcon message={error} />}
      <Table<Category>
        rowKey="id"
        loading={loading}
        dataSource={categories}
        columns={[
          { title: 'Category', dataIndex: 'name', key: 'name', width: '30%' },
          { title: 'Purpose', dataIndex: 'description', key: 'description', render: (value) => value || '—' },
        ]}
        locale={{ emptyText: <Empty description="No active categories" /> }}
        pagination={false}
        scroll={{ x: 560 }}
      />
    </Card>
  )
}
