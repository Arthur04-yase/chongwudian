import axios from 'axios'
import { useAuthStore } from '@/stores/auth-store'

export const apiClient = axios.create({
  baseURL: '',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 请求拦截器：自动附加 accessToken
apiClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// 响应拦截器：401 自动刷新 token
// 注意：登录、刷新、获取当前用户接口不触发自动刷新，
// 由 AuthProvider 统一管理认证流程
let isRefreshing = false
let failedQueue: Array<{
  resolve: (value: unknown) => void
  reject: (reason?: unknown) => void
}> = []

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })
  failedQueue = []
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // 以下接口不触发自动刷新，由 AuthProvider 自行处理
    const skipRefreshUrls = ['/api/auth/login', '/api/auth/refresh', '/api/auth/me']
    const shouldSkip = skipRefreshUrls.some((url) => originalRequest.url?.includes(url))

    if (error.response?.status === 401 && !originalRequest._retry && !shouldSkip) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`
            return apiClient(originalRequest)
          })
          .catch((err) => Promise.reject(err))
      }

      originalRequest._retry = true
      isRefreshing = true

      const refreshToken = useAuthStore.getState().refreshToken
      if (!refreshToken) {
        useAuthStore.getState().logout()
        window.location.href = '/login'
        return Promise.reject(error)
      }

      try {
        const res = await axios.post('/api/auth/refresh', { refreshToken })
        if (res.data.success) {
          const { accessToken: newToken, refreshToken: newRefresh } = res.data.data
          useAuthStore.getState().setAuth(useAuthStore.getState().user!, newToken, newRefresh)
          processQueue(null, newToken)
          originalRequest.headers.Authorization = `Bearer ${newToken}`
          return apiClient(originalRequest)
        }
      } catch (refreshError) {
        processQueue(refreshError, null)
        useAuthStore.getState().logout()
        window.location.href = '/login'
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)
