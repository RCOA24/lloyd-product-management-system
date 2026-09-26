import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ConfigProvider } from 'antd'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#087ca7',
          colorInfo: '#087ca7',
          colorSuccess: '#5f9828',
          colorText: '#15313f',
          colorTextSecondary: '#58727f',
          colorBgLayout: '#f2f7f8',
          borderRadius: 10,
          borderRadiusLG: 16,
          fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        },
        components: {
          Button: {
            controlHeightLG: 46,
            fontWeight: 600,
          },
          Table: {
            headerBg: '#edf5f6',
            headerColor: '#15313f',
          },
        },
      }}
    >
      <App />
    </ConfigProvider>
  </StrictMode>,
)
