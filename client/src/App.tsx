import { useEffect, useState } from 'react'
import {
  App as AntApp,
  Button,
  Card,
  Col,
  Empty,
  Form,
  Input,
  Layout,
  Modal,
  Popconfirm,
  Row,
  Select,
  Space,
  Statistic,
  Table,
  Tabs,
  Tag,
  Typography,
} from 'antd'
import type { TableColumnsType } from 'antd'
import {
  DeleteOutlined,
  EditOutlined,
  LockOutlined,
  LogoutOutlined,
  MedicineBoxOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  UserOutlined,
} from '@ant-design/icons'
import {
  createProduct,
  deleteProduct,
  getApiErrorMessage,
  getCategories,
  getProductSummary,
  getProducts,
  login,
  updateProduct,
} from './api'
import type {
  Category,
  LoginResponse,
  LoginUser,
  Product,
  ProductSummaryReport,
  ProductWriteRequest,
} from './api'
import './App.css'

const { Content, Header } = Layout
const { Paragraph, Text, Title } = Typography

type ProductFormValues = ProductWriteRequest

interface Session {
  token: string
  user: LoginUser
}

function App() {
  const [session, setSession] = useState<Session | null>(() => {
    const token = localStorage.getItem('lloyd_access_token')
    const userJson = localStorage.getItem('lloyd_user')

    if (!token || !userJson) {
      return null
    }

    try {
      return { token, user: JSON.parse(userJson) as LoginUser }
    } catch {
      localStorage.removeItem('lloyd_access_token')
      localStorage.removeItem('lloyd_user')
      return null
    }
  })

  const handleLogin = (response: LoginResponse) => {
    localStorage.setItem('lloyd_access_token', response.accessToken)
    localStorage.setItem('lloyd_user', JSON.stringify(response.user))
    setSession({ token: response.accessToken, user: response.user })
  }

  const handleLogout = () => {
    localStorage.removeItem('lloyd_access_token')
    localStorage.removeItem('lloyd_user')
    setSession(null)
  }

  return (
    <AntApp>
      {session ? (
        <Dashboard user={session.user} onLogout={handleLogout} />
      ) : (
        <LoginScreen onLogin={handleLogin} />
      )}
    </AntApp>
  )
}

function LoginScreen({ onLogin }: { onLogin: (response: LoginResponse) => void }) {
  const { message } = AntApp.useApp()
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (values: { username: string; password: string }) => {
    setLoading(true)

    try {
      const response = await login(values)
      onLogin(response)
      message.success('Welcome back.')
    } catch (error) {
      message.error(getApiErrorMessage(error, 'Unable to sign in.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="login-page">
      <Card className="login-card" bordered={false}>
        <div className="brand-mark">
          <MedicineBoxOutlined />
        </div>
        <Title level={2}>Lloyd Product Management</Title>
        <Paragraph type="secondary">
          Sign in to manage pharmaceutical products.
        </Paragraph>
        <Form layout="vertical" onFinish={handleSubmit} requiredMark={false}>
          <Form.Item
            label="Username"
            name="username"
            rules={[{ required: true, message: 'Enter your username.' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="Username" size="large" autoComplete="username" />
          </Form.Item>
          <Form.Item
            label="Password"
            name="password"
            rules={[{ required: true, message: 'Enter your password.' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Password" size="large" autoComplete="current-password" />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} block size="large">
            Sign in
          </Button>
        </Form>
      </Card>
    </main>
  )
}

function Dashboard({ user, onLogout }: { user: LoginUser; onLogout: () => void }) {
  const { message } = AntApp.useApp()
  const [categories, setCategories] = useState<Category[]>([])
  const [loadingCategories, setLoadingCategories] = useState(true)

  useEffect(() => {
    let mounted = true

    const loadCategories = async () => {
      try {
        const data = await getCategories()
        if (mounted) setCategories(data)
      } catch (error) {
        if (mounted) message.error(getApiErrorMessage(error, 'Unable to load categories.'))
      } finally {
        if (mounted) setLoadingCategories(false)
      }
    }

    void loadCategories()
    return () => {
      mounted = false
    }
  }, [message])

  return (
    <Layout className="app-shell">
      <Header className="app-header">
        <div className="header-brand">
          <MedicineBoxOutlined />
          <span>Lloyd Product Management</span>
        </div>
        <Space>
          <Tag color="blue">{user.role}</Tag>
          <Text className="header-user">{user.fullName}</Text>
          <Button type="text" icon={<LogoutOutlined />} onClick={onLogout}>
            Sign out
          </Button>
        </Space>
      </Header>
      <Content className="app-content">
        <div className="page-heading">
          <div>
            <Text className="eyebrow">Operations dashboard</Text>
            <Title level={1}>Product overview</Title>
            <Paragraph type="secondary">
              Manage active pharmaceutical products, categories, and summary metrics.
            </Paragraph>
          </div>
        </div>
        <Tabs
          items={[
            {
              key: 'products',
              label: 'Products',
              children: <ProductsPanel categories={categories} />,
            },
            {
              key: 'categories',
              label: 'Categories',
              children: <CategoriesPanel categories={categories} loading={loadingCategories} />,
            },
            {
              key: 'report',
              label: 'Summary report',
              children: <ReportPanel />,
            },
          ]}
        />
      </Content>
    </Layout>
  )
}

function ProductsPanel({ categories }: { categories: Category[] }) {
  const { message } = AntApp.useApp()
  const [products, setProducts] = useState<Product[]>([])
  const [search, setSearch] = useState('')
  const [categoryId, setCategoryId] = useState<number | undefined>()
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let mounted = true

    const loadProducts = async () => {
      setLoading(true)
      try {
        const data = await getProducts({ search: search || undefined, categoryId })
        if (mounted) setProducts(data)
      } catch (error) {
        if (mounted) message.error(getApiErrorMessage(error, 'Unable to load products.'))
      } finally {
        if (mounted) setLoading(false)
      }
    }

    void loadProducts()

    return () => {
      mounted = false
    }
  }, [categoryId, message, search])

  const refreshProducts = async () => {
    setLoading(true)
    try {
      setProducts(await getProducts({ search: search || undefined, categoryId }))
    } catch (error) {
      message.error(getApiErrorMessage(error, 'Unable to load products.'))
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (values: ProductFormValues) => {
    setSaving(true)
    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, values)
        message.success('Product updated.')
      } else {
        await createProduct(values)
        message.success('Product created.')
      }
      setModalOpen(false)
      setEditingProduct(null)
      await refreshProducts()
    } catch (error) {
      message.error(getApiErrorMessage(error, 'Unable to save product.'))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (product: Product) => {
    try {
      await deleteProduct(product.id)
      message.success('Product deleted.')
      await refreshProducts()
    } catch (error) {
      message.error(getApiErrorMessage(error, 'Unable to delete product.'))
    }
  }

  const columns: TableColumnsType<Product> = [
    { title: 'Product', dataIndex: 'productName', key: 'productName' },
    { title: 'Generic name', dataIndex: 'genericName', key: 'genericName', render: (value) => value || '—' },
    { title: 'Category', dataIndex: 'categoryName', key: 'categoryName' },
    { title: 'Dosage form', dataIndex: 'dosageForm', key: 'dosageForm' },
    { title: 'Strength', dataIndex: 'strength', key: 'strength', render: (value) => value || '—' },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, product) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
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
            <Button type="link" danger icon={<DeleteOutlined />}>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <>
      <Card bordered={false} className="panel-card">
        <div className="toolbar">
          <Space.Compact className="search-controls">
            <Input
              prefix={<SearchOutlined />}
              placeholder="Search products"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              allowClear
            />
            <Select
              placeholder="All categories"
              value={categoryId}
              onChange={setCategoryId}
              allowClear
              options={categories.map((category) => ({ label: category.name, value: category.id }))}
            />
          </Space.Compact>
          <Space>
            <Button icon={<ReloadOutlined />} onClick={() => void refreshProducts()}>
              Refresh
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setEditingProduct(null)
                setModalOpen(true)
              }}
            >
              Add product
            </Button>
          </Space>
        </div>
        <Table
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={products}
          locale={{ emptyText: <Empty description="No products found" /> }}
          pagination={{ pageSize: 8 }}
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

function ProductFormModal({
  open,
  product,
  categories,
  saving,
  onCancel,
  onSubmit,
}: {
  open: boolean
  product: Product | null
  categories: Category[]
  saving: boolean
  onCancel: () => void
  onSubmit: (values: ProductFormValues) => Promise<void>
}) {
  const [form] = Form.useForm<ProductFormValues>()

  useEffect(() => {
    if (!open) return
    form.setFieldsValue(
      product
        ? {
            productName: product.productName,
            genericName: product.genericName,
            categoryId: product.categoryId,
            dosageForm: product.dosageForm,
            strength: product.strength,
            description: product.description,
          }
        : { categoryId: categories[0]?.id },
    )
  }, [categories, form, open, product])

  return (
    <Modal
      open={open}
      title={product ? 'Edit product' : 'Add product'}
      okText={product ? 'Save changes' : 'Create product'}
      confirmLoading={saving}
      onCancel={onCancel}
      onOk={() => void form.submit()}
      destroyOnHidden
    >
      <Form form={form} layout="vertical" onFinish={onSubmit}>
        <Form.Item name="productName" label="Product name" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item name="genericName" label="Generic name">
          <Input />
        </Form.Item>
        <Form.Item name="categoryId" label="Category" rules={[{ required: true }]}>
          <Select options={categories.map((category) => ({ label: category.name, value: category.id }))} />
        </Form.Item>
        <Form.Item name="dosageForm" label="Dosage form" rules={[{ required: true }]}>
          <Input placeholder="Tablet, capsule, syrup..." />
        </Form.Item>
        <Form.Item name="strength" label="Strength">
          <Input />
        </Form.Item>
        <Form.Item name="description" label="Description">
          <Input.TextArea rows={3} />
        </Form.Item>
      </Form>
    </Modal>
  )
}

function CategoriesPanel({ categories, loading }: { categories: Category[]; loading: boolean }) {
  return (
    <Card bordered={false} className="panel-card">
      <Table<Category>
        rowKey="id"
        loading={loading}
        dataSource={categories}
        columns={[
          { title: 'Name', dataIndex: 'name', key: 'name' },
          { title: 'Description', dataIndex: 'description', key: 'description' },
        ]}
        pagination={false}
      />
    </Card>
  )
}

function ReportPanel() {
  const { message } = AntApp.useApp()
  const [report, setReport] = useState<ProductSummaryReport | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    const loadReport = async () => {
      try {
        const data = await getProductSummary()
        if (mounted) setReport(data)
      } catch (error) {
        if (mounted) message.error(getApiErrorMessage(error, 'Unable to load report.'))
      } finally {
        if (mounted) setLoading(false)
      }
    }

    void loadReport()
    return () => {
      mounted = false
    }
  }, [message])

  if (loading) {
    return <Card loading bordered={false} className="panel-card" />
  }

  if (!report) {
    return <Empty description="Report unavailable" />
  }

  return (
    <Space direction="vertical" size="large" className="report-panel">
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8}><Card><Statistic title="Total products" value={report.totalProducts} /></Card></Col>
        <Col xs={24} sm={8}><Card><Statistic title="Active products" value={report.activeProducts} valueStyle={{ color: '#1677ff' }} /></Card></Col>
        <Col xs={24} sm={8}><Card><Statistic title="Inactive products" value={report.inactiveProducts} valueStyle={{ color: '#8c8c8c' }} /></Card></Col>
      </Row>
      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card title="Products by category">
            <SimpleCountTable items={report.productsByCategory} />
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="Products by dosage form">
            <SimpleCountTable items={report.productsByDosageForm} />
          </Card>
        </Col>
      </Row>
    </Space>
  )
}

function SimpleCountTable({ items }: { items: { name: string; count: number }[] }) {
  return (
    <Table
      rowKey="name"
      size="small"
      pagination={false}
      dataSource={items}
      columns={[
        { title: 'Name', dataIndex: 'name', key: 'name' },
        { title: 'Count', dataIndex: 'count', key: 'count' },
      ]}
    />
  )
}

export default App
