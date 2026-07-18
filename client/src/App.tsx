import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Toaster } from '@/components/ui/sonner'
import { AppLayout } from '@/components/layout/app-layout'
import { AuthProvider } from '@/hooks/use-auth'
import { GlobalSearch } from '@/components/shared/global-search'

// Lazy-loaded pages
import { lazy, Suspense } from 'react'

const LoginPage = lazy(() => import('@/pages/auth/login-page'))
const DashboardPage = lazy(() => import('@/pages/dashboard/dashboard-page'))
const BookingListPage = lazy(() => import('@/pages/bookings/booking-list-page'))
const BookingDetailPage = lazy(() => import('@/pages/bookings/booking-detail-page'))
const NewBookingPage = lazy(() => import('@/pages/bookings/new-booking-page'))
const CustomerListPage = lazy(() => import('@/pages/customers/customer-list-page'))
const CustomerDetailPage = lazy(() => import('@/pages/customers/customer-detail-page'))
const PetProfilePage = lazy(() => import('@/pages/pets/pet-profile-page'))
const CashierPage = lazy(() => import('@/pages/cashier/cashier-page'))
const BoardingPage = lazy(() => import('@/pages/boarding/boarding-page'))
const ServiceListPage = lazy(() => import('@/pages/services/service-list-page'))
const StaffListPage = lazy(() => import('@/pages/staff/staff-list-page'))
const InventoryPage = lazy(() => import('@/pages/inventory/inventory-page'))
const ReportsPage = lazy(() => import('@/pages/reports/reports-page'))
const SettingsPage = lazy(() => import('@/pages/settings/settings-page'))
const NotFoundPage = lazy(() => import('@/pages/not-found-page'))

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000, // 30 秒内不重新请求
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

function PageLoader() {
  return (
    <div className="flex h-64 items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  )
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          <AuthProvider>
            <Toaster richColors closeButton />
            <GlobalSearch />
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* 公开路由 */}
                <Route path="/login" element={<LoginPage />} />

                {/* 受保护路由 — 包裹在 AppLayout 内 */}
                <Route element={<AppLayout />}>
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/appointments" element={<BookingListPage />} />
                  <Route path="/appointments/new" element={<NewBookingPage />} />
                  <Route path="/appointments/:id" element={<BookingDetailPage />} />
                  <Route path="/customers" element={<CustomerListPage />} />
                  <Route path="/customers/:id" element={<CustomerDetailPage />} />
                  <Route path="/pets/:id" element={<PetProfilePage />} />
                  <Route path="/cashier" element={<CashierPage />} />
                  <Route path="/cashier/:appointmentId" element={<CashierPage />} />
                  <Route path="/boarding" element={<BoardingPage />} />
                  <Route path="/services" element={<ServiceListPage />} />
                  <Route path="/staff" element={<StaffListPage />} />
                  <Route path="/inventory" element={<InventoryPage />} />
                  <Route path="/reports" element={<ReportsPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                </Route>

                {/* 404 */}
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </Suspense>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  )
}

export default App
