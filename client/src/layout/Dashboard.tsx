import { useEffect, useState } from 'react'
import { App as AntApp, Avatar, Button, Layout, Segmented, Space, Tag, Typography } from 'antd'
import {
  AppstoreOutlined,
  BarChartOutlined,
  LogoutOutlined,
  SafetyCertificateOutlined,
  UnorderedListOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { getApiErrorMessage, getCategories } from '../api'
import type { Category, LoginUser } from '../api'
import { BrandLockup } from '../components/BrandLockup'
import { CategoriesPanel } from '../features/categories/CategoriesPanel'
import { ProductsPanel } from '../features/products/ProductsPanel'
import { ReportPanel } from '../features/reports/ReportPanel'

const { Content, Footer, Header } = Layout
const { Paragraph, Text, Title } = Typography
type ViewKey = 'products' | 'categories' | 'report'

interface DashboardProps {
  user: LoginUser
  onLogout: () => void
}

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

export function Dashboard({ user, onLogout }: DashboardProps) {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <Layout className="app-shell">
      <Header className="app-header">
        <BrandLockup compact />
        <Space className="user-controls">
          <Tag className="role-tag">{user.role}</Tag>
          <Avatar icon={<UserOutlined />} />
          <span className="user-name">{user.fullName}</span>
          <Button type="text" icon={<LogoutOutlined />} onClick={onLogout}>Sign out</Button>
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
