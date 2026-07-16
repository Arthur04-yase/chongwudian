import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore, type User } from '@/stores/auth-store'
import { apiClient } from '@/lib/api-client'

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (phone: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(true)
  const { user, isAuthenticated, accessToken, setAuth, logout: storeLogout } = useAuthStore()

  // 启动时检查 token 有效性
  useEffect(() => {
    const initAuth = async () => {
      if (!accessToken) {
        setIsLoading(false)
        return
      }
      try {
        const res = await apiClient.get('/api/auth/me')
        if (res.data.success) {
          useAuthStore.getState().updateUser(res.data.data)
        } else {
          storeLogout()
        }
      } catch {
        // Token 无效，尝试刷新
        try {
          const refreshToken = useAuthStore.getState().refreshToken
          if (refreshToken) {
            const res = await apiClient.post('/api/auth/refresh', {
              refreshToken,
            })
            if (res.data.success) {
              const { accessToken: newToken, refreshToken: newRefresh } = res.data.data
              useAuthStore.getState().setAuth(useAuthStore.getState().user!, newToken, newRefresh)
            } else {
              storeLogout()
            }
          } else {
            storeLogout()
          }
        } catch {
          storeLogout()
        }
      } finally {
        setIsLoading(false)
      }
    }
    initAuth()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const login = async (phone: string, password: string) => {
    const res = await apiClient.post('/api/auth/login', { phone, password })
    if (res.data.success) {
      const { user, accessToken, refreshToken } = res.data.data
      setAuth(user, accessToken, refreshToken)
    } else {
      throw new Error(res.data.error || '登录失败')
    }
  }

  const logout = () => {
    storeLogout()
  }

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return ctx
}

/**
 * 路由守卫 Hook — 未登录跳转到 /login
 */
export function useAuthGuard() {
  const { isAuthenticated, isLoading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/login', { state: { from: location.pathname }, replace: true })
    }
  }, [isAuthenticated, isLoading, navigate, location.pathname])

  return { isAuthenticated, isLoading }
}
