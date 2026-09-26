import { useState } from 'react'
import { Alert, App as AntApp, Button, Card, Form, Input, Tag, Typography } from 'antd'
import {
  BarChartOutlined,
  GlobalOutlined,
  LockOutlined,
  SafetyCertificateOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { getApiErrorMessage, login } from '../../api'
import type { LoginResponse } from '../../api'
import { BrandLockup } from '../../components/BrandLockup'

const { Paragraph, Text, Title } = Typography

interface LoginScreenProps {
  onLogin: (response: LoginResponse) => void
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
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
          <Paragraph className="login-story-description">
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
          <Paragraph type="secondary">Use your authorized account to continue.</Paragraph>
          {error && <Alert className="login-alert" type="error" showIcon message={error} />}
          <Form layout="vertical" onFinish={handleSubmit} requiredMark={false}>
            <Form.Item label="Username" name="username" rules={[{ required: true, message: 'Enter your username.' }]}>
              <Input prefix={<UserOutlined />} placeholder="Username" size="large" autoComplete="username" />
            </Form.Item>
            <Form.Item label="Password" name="password" rules={[{ required: true, message: 'Enter your password.' }]}>
              <Input.Password prefix={<LockOutlined />} placeholder="Password" size="large" autoComplete="current-password" />
            </Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block size="large">Sign in</Button>
          </Form>
          <Paragraph className="disclaimer">
            Demonstration software only. Not affiliated with or endorsed by Lloyd Laboratories, Inc.
          </Paragraph>
        </Card>
      </section>
    </main>
  )
}
