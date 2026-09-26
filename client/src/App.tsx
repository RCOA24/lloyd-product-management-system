import { useState } from 'react'
import { App as AntApp } from 'antd'
import type { LoginResponse } from './api'
import { LoginScreen } from './features/auth/LoginScreen'
import { Dashboard } from './layout/Dashboard'
import { clearSession, restoreSession, storeSession } from './utils/session'
import type { Session } from './utils/session'
import './App.css'

function App() {
  const [session, setSession] = useState<Session | null>(restoreSession)

  const handleLogin = (response: LoginResponse) => {
    setSession(storeSession(response))
  }

  const handleLogout = () => {
    clearSession()
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

export default App
