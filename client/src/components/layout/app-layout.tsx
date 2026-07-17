import { Outlet, Navigate, useLocation } from 'react-router-dom'
import { Suspense } from 'react'
import { Sidebar } from './sidebar'
import { Header } from './header'
import { useAuth } from '@/hooks/use-auth'

function PageLoader() {
  return (
    <div className="flex h-64 items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  )
}

export function AppLayout() {
  const { isLoading, isAuthenticated } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-muted/30">
        <div className="text-center">
          <div className="mb-4 text-4xl animate-bounce">🐾</div>
          <p className="text-muted-foreground">加载中...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* 桌面端侧边栏 */}
      <Sidebar />

      {/* 主内容区 */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto bg-muted/30 p-4 md:p-6">
          <Suspense fallback={<PageLoader />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  )
}
