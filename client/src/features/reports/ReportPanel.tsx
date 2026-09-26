import { useEffect, useState } from 'react'
import { Alert, Button, Card, Col, Empty, Row, Space, Statistic, Typography } from 'antd'
import { DownloadOutlined, PrinterOutlined, ReloadOutlined } from '@ant-design/icons'
import { getApiErrorMessage, getProductSummary } from '../../api'
import type { ProductSummaryReport } from '../../api'
import { exportProductSummaryCsv } from '../../utils/reportExport'
import { SimpleCountTable } from './SimpleCountTable'

const { Paragraph, Text, Title } = Typography

export function ReportPanel() {
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
          <Button icon={<PrinterOutlined />} disabled={!report} onClick={() => window.print()}>Print / PDF</Button>
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
              <Card className="report-card" title="Products by category"><SimpleCountTable items={report.productsByCategory} /></Card>
            </Col>
            <Col xs={24} lg={12}>
              <Card className="report-card" title="Products by dosage form"><SimpleCountTable items={report.productsByDosageForm} /></Card>
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
