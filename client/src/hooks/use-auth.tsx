import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
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
              const currentUser = useAuthStore.getState().user
              if (currentUser) {
                useAuthStore.getState().setAuth(currentUser, newToken, newRefresh)
              }
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const login = async (phone: string, password: string) => {
    const res = await apiClient.post('/api/auth/login', { phone, password })
    if (res.data.success) {
      const { user, accessToken, refreshToken } = res.data.data
      setAuth(user, accessToken, refreshToken)
    } else {
      // 后端返回 success: false（如参数校验失败）
      const errMsg = res.data?.error?.message || res.data?.error || '登录失败'
      throw new Error(errMsg)
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
