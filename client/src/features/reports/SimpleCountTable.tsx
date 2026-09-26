import { Empty, Table } from 'antd'

interface CountItem {
  name: string
  count: number
}

export function SimpleCountTable({ items }: { items: CountItem[] }) {
  return (
    <Table
      rowKey="name"
      size="small"
      pagination={false}
      dataSource={items}
      locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No data" /> }}
      columns={[
        { title: 'Name', dataIndex: 'name', key: 'name' },
        { title: 'Count', dataIndex: 'count', key: 'count', align: 'right', width: 90 },
      ]}
    />
  )
}
