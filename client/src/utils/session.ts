import type { LoginResponse, LoginUser } from '../api'

const tokenKey = 'lloyd_access_token'
const userKey = 'lloyd_user'
const expiryKey = 'lloyd_token_expiry'

export interface Session {
  token: string
  user: LoginUser
  expiresAtUtc: string
}

export function clearSession(): void {
  sessionStorage.removeItem(tokenKey)
  sessionStorage.removeItem(userKey)
  sessionStorage.removeItem(expiryKey)
  localStorage.removeItem(tokenKey)
  localStorage.removeItem(userKey)
}

export function restoreSession(): Session | null {
  const token = sessionStorage.getItem(tokenKey) ?? localStorage.getItem(tokenKey)
  const userJson = sessionStorage.getItem(userKey) ?? localStorage.getItem(userKey)
  const expiresAtUtc = sessionStorage.getItem(expiryKey)

  if (!token || !userJson || (expiresAtUtc && new Date(expiresAtUtc) <= new Date())) {
    clearSession()
    return null
  }

  try {
    return {
      token,
      user: JSON.parse(userJson) as LoginUser,
      expiresAtUtc: expiresAtUtc ?? '',
    }
  } catch {
    clearSession()
    return null
  }
}

export function storeSession(response: LoginResponse): Session {
  clearSession()
  sessionStorage.setItem(tokenKey, response.accessToken)
  sessionStorage.setItem(userKey, JSON.stringify(response.user))
  sessionStorage.setItem(expiryKey, response.expiresAtUtc)

  return {
    token: response.accessToken,
    user: response.user,
    expiresAtUtc: response.expiresAtUtc,
  }
}
