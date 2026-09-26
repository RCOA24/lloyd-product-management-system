import { useEffect, useState } from 'react'
import {
  Alert,
  App as AntApp,
  Avatar,
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
  Segmented,
  Select,
  Space,
  Statistic,
  Table,
  Tag,
  Typography,
} from 'antd'
import type { TableColumnsType } from 'antd'
import {
  AppstoreOutlined,
  BarChartOutlined,
  DeleteOutlined,
  DownloadOutlined,
  EditOutlined,
  GlobalOutlined,
  LockOutlined,
  LogoutOutlined,
  MedicineBoxOutlined,
  PlusOutlined,
  PrinterOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
  SearchOutlined,
  UnorderedListOutlined,
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
import { exportProductSummaryCsv } from './reportExport'
import './App.css'

const { Content, Footer, Header } = Layout
const { Paragraph, Text, Title } = Typography
const tokenKey = 'lloyd_access_token'
const userKey = 'lloyd_user'
const expiryKey = 'lloyd_token_expiry'

type ProductFormValues = ProductWriteRequest
type ViewKey = 'products' | 'categories' | 'report'

interface Session {
  token: string
  user: LoginUser
  expiresAtUtc: string
}

function clearSessionStorage() {
  sessionStorage.removeItem(tokenKey)
  sessionStorage.removeItem(userKey)
  sessionStorage.removeItem(expiryKey)
  localStorage.removeItem(tokenKey)
  localStorage.removeItem(userKey)
}

function restoreSession(): Session | null {
  const token = sessionStorage.getItem(tokenKey) ?? localStorage.getItem(tokenKey)
  const userJson = sessionStorage.getItem(userKey) ?? localStorage.getItem(userKey)
  const expiresAtUtc = sessionStorage.getItem(expiryKey)

  if (!token || !userJson || (expiresAtUtc && new Date(expiresAtUtc) <= new Date())) {
    clearSessionStorage()
    return null
  }

  try {
    return {
      token,
      user: JSON.parse(userJson) as LoginUser,
      expiresAtUtc: expiresAtUtc ?? '',
    }
  } catch {
    clearSessionStorage()
    return null
  }
}

function App() {
  const [session, setSession] = useState<Session | null>(restoreSession)

  const handleLogin = (response: LoginResponse) => {
    clearSessionStorage()
    sessionStorage.setItem(tokenKey, response.accessToken)
    sessionStorage.setItem(userKey, JSON.stringify(response.user))
    sessionStorage.setItem(expiryKey, response.expiresAtUtc)
    setSession({
      token: response.accessToken,
      user: response.user,
      expiresAtUtc: response.expiresAtUtc,
    })
  }

  const handleLogout = () => {
    clearSessionStorage()
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

function BrandLockup({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`brand-lockup${compact ? ' brand-lockup--compact' : ''}`}>
      <span className="brand-symbol" aria-hidden="true">
        <MedicineBoxOutlined />
      </span>
      <span>
        <strong>Lloyd Product Management</strong>
        <small>Technical examination system</small>
      </span>
    </div>
  )
}

function LoginScreen({ onLogin }: { onLogin: (response: LoginResponse) => void }) {
  const { message } = AntApp.useApp()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (values: { username: string; password: string }) => {
    setLoading(true)
    setError(null)

    try {
      const response = await login(values)
      onLogin(response)
      message.success('Welcome back.')
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Unable to sign in. Check your credentials and API connection.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="login-page">
      <section className="login-story" aria-label="Project introduction">
        <BrandLockup />
        <div className="login-story__content">
          <Tag color="cyan">Independent technical project</Tag>
          <Title>Quality information, clearly managed.</Title>
          <Paragraph>
            A focused workspace for maintaining pharmaceutical product records,
            monitoring categories, and generating useful inventory summaries.
          </Paragraph>
          <div className="quality-points">
            <span><SafetyCertificateOutlined /> Reliable product records</span>
            <span><GlobalOutlined /> Clear operational overview</span>
            <span><BarChartOutlined /> Exportable summary reports</span>
          </div>
        </div>
        <Text className="inspiration-note">
          Inspired by the pharmaceutical domain and quality-focused public messaging of Lloyd Laboratories.
        </Text>
      </section>

      <section className="login-form-panel">
        <Card className="login-card" bordered={false}>
          <div className="mobile-brand"><BrandLockup compact /></div>
          <Text className="eyebrow">Secure access</Text>
          <Title level={2}>Sign in to your workspace</Title>
          <Paragraph type="secondary">
            Use your authorized account to continue.
          </Paragraph>
          {error && <Alert className="login-alert" type="error" showIcon message={error} />}
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
          <Paragraph className="disclaimer">
            Demonstration software only. Not affiliated with or endorsed by Lloyd Laboratories, Inc.
          </Paragraph>
        </Card>
      </section>
    </main>
  )
}

function Dashboard({ user, onLogout }: { user: LoginUser; onLogout: () => void }) {
  const { message } = AntApp.useApp()
  const [categories, setCategories] = useState<Category[]>([])
  const [loadingCategories, setLoadingCategories] = useState(true)
  const [categoryError, setCategoryError] = useState<string | null>(null)
  const [view, setView] = useState<ViewKey>('products')

  const loadCategories = async () => {
    setLoadingCategories(true)
    setCategoryError(null)
    try {
      setCategories(await getCategories())
    } catch (error) {
      const errorMessage = getApiErrorMessage(error, 'Unable to load categories.')
      setCategoryError(errorMessage)
      message.error(errorMessage)
    } finally {
      setLoadingCategories(false)
    }
  }

  useEffect(() => {
    // Loading reference data is the intended initial synchronization for this view.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadCategories()
    // Initial reference-data load.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const viewMeta: Record<ViewKey, { eyebrow: string; title: string; description: string }> = {
    products: {
      eyebrow: 'Product operations',
      title: 'Product catalogue',
      description: 'Create, review, update, and remove active pharmaceutical product records.',
    },
    categories: {
      eyebrow: 'Reference data',
      title: 'Product categories',
      description: 'Review the active therapeutic and product classifications used by the catalogue.',
    },
    report: {
      eyebrow: 'Operational insight',
      title: 'Product summary report',
      description: 'Generate a current snapshot and export it for spreadsheet review or printing.',
    },
  }

  return (
    <Layout className="app-shell">
      <Header className="app-header">
        <BrandLockup compact />
        <Space className="user-controls">
          <Tag className="role-tag">{user.role}</Tag>
          <Avatar icon={<UserOutlined />} />
          <span className="user-name">{user.fullName}</span>
          <Button type="text" icon={<LogoutOutlined />} onClick={onLogout}>
            Sign out
          </Button>
        </Space>
      </Header>

      <nav className="section-nav" aria-label="Main sections">
        <Segmented<ViewKey>
          value={view}
          onChange={setView}
          options={[
            { value: 'products', label: 'Products', icon: <AppstoreOutlined /> },
            { value: 'categories', label: 'Categories', icon: <UnorderedListOutlined /> },
            { value: 'report', label: 'Reports', icon: <BarChartOutlined /> },
          ]}
        />
      </nav>

      <Content id="main-content" className="app-content">
        <section className="page-heading">
          <div>
            <Text className="eyebrow">{viewMeta[view].eyebrow}</Text>
            <Title level={1}>{viewMeta[view].title}</Title>
            <Paragraph type="secondary">{viewMeta[view].description}</Paragraph>
          </div>
          <div className="quality-seal" aria-label="Quality focused demonstration">
            <SafetyCertificateOutlined />
            <span><strong>Quality focused</strong><small>Technical demo</small></span>
          </div>
        </section>

        {view === 'products' && <ProductsPanel categories={categories} categoryError={categoryError} />}
        {view === 'categories' && (
          <CategoriesPanel
            categories={categories}
            loading={loadingCategories}
            error={categoryError}
            onRefresh={loadCategories}
          />
        )}
        {view === 'report' && <ReportPanel />}
      </Content>

      <Footer className="app-footer">
        <span>Independent technical examination project</span>
        <span>Not affiliated with or endorsed by Lloyd Laboratories, Inc.</span>
      </Footer>
    </Layout>
  )
}

function ProductsPanel({ categories, categoryError }: { categories: Category[]; categoryError: string | null }) {
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
    // Query controls trigger a synchronized API refresh.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId, search])

  const handleSave = async (values: ProductFormValues) => {
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
      render: (_, product) => (
        <span>{product.dosageForm}{product.strength ? ` · ${product.strength}` : ''}</span>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      responsive: ['sm'],
      render: () => <Tag color="success">Active</Tag>,
    },
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
            <Button type="link" danger icon={<DeleteOutlined />} aria-label={`Delete ${product.productName}`}>
              Delete
            </Button>
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
      {categoryError && (
        <Alert className="section-alert" type="warning" showIcon message="Category reference data is unavailable. Product creation may be limited." />
      )}
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
    form.resetFields()
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
      okButtonProps={{ disabled: categories.length === 0 }}
      onCancel={onCancel}
      onOk={() => void form.submit()}
      destroyOnHidden
      width={640}
    >
      <Paragraph type="secondary">Fields marked required are needed to maintain a complete catalogue record.</Paragraph>
      <Form form={form} layout="vertical" onFinish={onSubmit} requiredMark="optional">
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item name="productName" label="Product name" rules={[{ required: true, whitespace: true, message: 'Enter a product name.' }, { max: 150 }]}>
              <Input maxLength={150} />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="genericName" label="Generic name" rules={[{ max: 150 }]}>
              <Input maxLength={150} />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item name="categoryId" label="Category" rules={[{ required: true, message: 'Select a category.' }]}>
              <Select options={categories.map((category) => ({ label: category.name, value: category.id }))} />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="dosageForm" label="Dosage form" rules={[{ required: true, whitespace: true, message: 'Enter a dosage form.' }, { max: 100 }]}>
              <Input maxLength={100} placeholder="Tablet, capsule, syrup..." />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item name="strength" label="Strength" rules={[{ max: 100 }]}>
          <Input maxLength={100} placeholder="For example, 500 mg" />
        </Form.Item>
        <Form.Item name="description" label="Description" rules={[{ max: 1000 }]}>
          <Input.TextArea rows={4} maxLength={1000} showCount />
        </Form.Item>
      </Form>
    </Modal>
  )
}

function CategoriesPanel({
  categories,
  loading,
  error,
  onRefresh,
}: {
  categories: Category[]
  loading: boolean
  error: string | null
  onRefresh: () => Promise<void>
}) {
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

function ReportPanel() {
  const [report, setReport] = useState<ProductSummaryReport | null>(null)
  const [generatedAt, setGeneratedAt] = useState<Date | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadReport = async () => {
    setLoading(true)
    setError(null)
    try {
      setReport(await getProductSummary())
      setGeneratedAt(new Date())
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Unable to generate the report.'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Generating the initial report is the intended synchronization for this view.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadReport()
  }, [])

  return (
    <section className="report-panel" id="printable-report">
      <div className="report-toolbar no-print">
        <div>
          <Title level={3}>Current inventory snapshot</Title>
          <Text type="secondary">
            {generatedAt ? `Generated ${generatedAt.toLocaleString()}` : 'Generate the latest summary.'}
          </Text>
        </div>
        <Space wrap>
          <Button icon={<ReloadOutlined />} loading={loading} onClick={() => void loadReport()}>Refresh</Button>
          <Button
            icon={<DownloadOutlined />}
            disabled={!report || !generatedAt}
            onClick={() => report && generatedAt && exportProductSummaryCsv(report, generatedAt)}
          >
            Export CSV
          </Button>
          <Button icon={<PrinterOutlined />} disabled={!report} onClick={() => window.print()}>
            Print / PDF
          </Button>
        </Space>
      </div>

      {error && (
        <Alert
          className="section-alert no-print"
          type="error"
          showIcon
          message={error}
          action={<Button size="small" onClick={() => void loadReport()}>Retry</Button>}
        />
      )}

      {loading ? (
        <Card loading bordered={false} className="panel-card" />
      ) : report ? (
        <>
          <div className="print-heading">
            <Title level={2}>Product Summary Report</Title>
            <Text>{generatedAt?.toLocaleString()}</Text>
          </div>
          <Row gutter={[18, 18]}>
            <Col xs={24} sm={8}><Card className="metric-card metric-card--total"><Statistic title="Total products" value={report.totalProducts} /></Card></Col>
            <Col xs={24} sm={8}><Card className="metric-card metric-card--active"><Statistic title="Active products" value={report.activeProducts} /></Card></Col>
            <Col xs={24} sm={8}><Card className="metric-card"><Statistic title="Inactive products" value={report.inactiveProducts} /></Card></Col>
          </Row>
          <Paragraph className="report-note">Product listings show active records; report totals include all records currently stored.</Paragraph>
          <Row gutter={[18, 18]}>
            <Col xs={24} lg={12}>
              <Card className="report-card" title="Products by category">
                <SimpleCountTable items={report.productsByCategory} />
              </Card>
            </Col>
            <Col xs={24} lg={12}>
              <Card className="report-card" title="Products by dosage form">
                <SimpleCountTable items={report.productsByDosageForm} />
              </Card>
            </Col>
          </Row>
          <Paragraph className="print-disclaimer">Independent technical examination project. Not affiliated with Lloyd Laboratories, Inc.</Paragraph>
        </>
      ) : (
        <Empty description="Report unavailable" />
      )}
    </section>
  )
}

function SimpleCountTable({ items }: { items: { name: string; count: number }[] }) {
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

export default App
