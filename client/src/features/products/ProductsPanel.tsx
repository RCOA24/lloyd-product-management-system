import { useEffect, useState } from 'react'
import {
  Alert,
  App as AntApp,
  Button,
  Card,
  Empty,
  Input,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from 'antd'
import type { TableColumnsType } from 'antd'
import { DeleteOutlined, EditOutlined, PlusOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons'
import { createProduct, deleteProduct, getApiErrorMessage, getProducts, updateProduct } from '../../api'
import type { Category, Product, ProductWriteRequest } from '../../api'
import { ProductFormModal } from './ProductFormModal'

const { Text, Title } = Typography

interface ProductsPanelProps {
  categories: Category[]
  categoryError: string | null
}

export function ProductsPanel({ categories, categoryError }: ProductsPanelProps) {
  const { message } = AntApp.useApp()
  const [products, setProducts] = useState<Product[]>([])
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [categoryId, setCategoryId] = useState<number | undefined>()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [saving, setSaving] = useState(false)

  const loadProducts = async () => {
    setLoading(true)
    setError(null)
    try {
      setProducts(await getProducts({ search: search || undefined, categoryId }))
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Unable to load products.'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Fetching filtered products is the intended synchronization for query controls.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadProducts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId, search])

  const handleSave = async (values: ProductWriteRequest) => {
    setSaving(true)
    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, values)
        message.success('Product updated successfully.')
      } else {
        await createProduct(values)
        message.success('Product created successfully.')
      }
      setModalOpen(false)
      setEditingProduct(null)
      await loadProducts()
    } catch (requestError) {
      message.error(getApiErrorMessage(requestError, 'Unable to save product.'))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (product: Product) => {
    try {
      await deleteProduct(product.id)
      message.success('Product deleted successfully.')
      await loadProducts()
    } catch (requestError) {
      message.error(getApiErrorMessage(requestError, 'Unable to delete product.'))
    }
  }

  const columns: TableColumnsType<Product> = [
    {
      title: 'Product',
      dataIndex: 'productName',
      key: 'productName',
      render: (value: string, product) => (
        <div className="product-cell">
          <strong>{value}</strong>
          <small>{product.genericName || 'No generic name'}</small>
        </div>
      ),
    },
    { title: 'Category', dataIndex: 'categoryName', key: 'categoryName' },
    {
      title: 'Dosage',
      key: 'dosage',
      responsive: ['md'],
      render: (_, product) => <span>{product.dosageForm}{product.strength ? ` · ${product.strength}` : ''}</span>,
    },
    { title: 'Status', key: 'status', responsive: ['sm'], render: () => <Tag color="success">Active</Tag> },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 176,
      render: (_, product) => (
        <Space size={2}>
          <Button
            type="link"
            icon={<EditOutlined />}
            aria-label={`Edit ${product.productName}`}
            onClick={() => {
              setEditingProduct(product)
              setModalOpen(true)
            }}
          >
            Edit
          </Button>
          <Popconfirm
            title="Delete this product?"
            description="This action cannot be undone."
            onConfirm={() => void handleDelete(product)}
            okText="Delete"
            okButtonProps={{ danger: true }}
          >
            <Button type="link" danger icon={<DeleteOutlined />} aria-label={`Delete ${product.productName}`}>Delete</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  const clearFilters = () => {
    setSearchInput('')
    setSearch('')
    setCategoryId(undefined)
  }

  return (
    <>
      {categoryError && <Alert className="section-alert" type="warning" showIcon message="Category reference data is unavailable. Product creation may be limited." />}
      {error && (
        <Alert
          className="section-alert"
          type="error"
          showIcon
          message={error}
          action={<Button size="small" onClick={() => void loadProducts()}>Retry</Button>}
        />
      )}
      <Card bordered={false} className="panel-card">
        <div className="panel-heading">
          <div>
            <Title level={3}>Active products</Title>
            <Text type="secondary" aria-live="polite">{products.length} record{products.length === 1 ? '' : 's'} found</Text>
          </div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            disabled={categories.length === 0}
            onClick={() => {
              setEditingProduct(null)
              setModalOpen(true)
            }}
          >
            Add product
          </Button>
        </div>
        <div className="filter-bar" role="search" aria-label="Product filters">
          <Input.Search
            aria-label="Search products"
            prefix={<SearchOutlined />}
            placeholder="Search name, generic name, or dosage form"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            onSearch={(value) => setSearch(value.trim())}
            allowClear
            enterButton="Search"
          />
          <Select
            aria-label="Filter by category"
            placeholder="All categories"
            value={categoryId}
            onChange={setCategoryId}
            allowClear
            options={categories.map((category) => ({ label: category.name, value: category.id }))}
          />
          <Button onClick={clearFilters}>Clear</Button>
          <Button icon={<ReloadOutlined />} onClick={() => void loadProducts()} aria-label="Refresh products" />
        </div>
        <Table
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={products}
          scroll={{ x: 760 }}
          locale={{ emptyText: <Empty description="No products match your filters" /> }}
          pagination={{ pageSize: 8, showSizeChanger: false }}
        />
      </Card>
      <ProductFormModal
        open={modalOpen}
        product={editingProduct}
        categories={categories}
        saving={saving}
        onCancel={() => {
          setModalOpen(false)
          setEditingProduct(null)
        }}
        onSubmit={handleSave}
      />
    </>
  )
}
