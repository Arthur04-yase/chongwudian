import { NavLink, useLocation } from 'react-router-dom'
import {
  PawPrint,
  LayoutDashboard,
  CalendarDays,
  Users,
  Scissors,
  Banknote,
  Hotel,
  Package,
  UserRound,
  BarChart3,
  Settings,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/use-auth'

const navItems = [
  { to: '/dashboard', label: '工作台', icon: LayoutDashboard },
  { to: '/appointments', label: '预约管理', icon: CalendarDays },
  { to: '/customers', label: '客户管理', icon: Users },
  { to: '/services', label: '服务管理', icon: Scissors },
  { to: '/cashier', label: '收银管理', icon: Banknote },
  { to: '/boarding', label: '寄养管理', icon: Hotel },
  { to: '/inventory', label: '库存管理', icon: Package },
  { to: '/staff', label: '员工管理', icon: UserRound },
  { to: '/reports', label: '数据统计', icon: BarChart3 },
  { to: '/settings', label: '系统设置', icon: Settings },
]

export function Sidebar() {
  const location = useLocation()
  const { user } = useAuth()

  return (
    <>
      {/* 桌面端侧边栏 */}
      <aside className="hidden w-56 shrink-0 border-r bg-card md:flex md:flex-col">
        {/* Logo */}
        <div className="flex h-14 items-center gap-2.5 border-b px-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <PawPrint className="h-4.5 w-4.5 text-primary" />
          </div>
          <span className="text-sm font-semibold">宠爱有家</span>
        </div>

        {/* 导航 */}
        <nav className="flex-1 space-y-0.5 overflow-y-auto p-2">
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.to)
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={cn(
                  'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
              </NavLink>
            )
          })}
        </nav>

        {/* 底部用户信息 */}
        <div className="border-t p-3">
          <div className="flex items-center gap-2.5 rounded-lg px-2 py-1.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium">{user?.name}</p>
              <p className="truncate text-[10px] text-muted-foreground">
                {user?.role === 'owner' ? '老板' : user?.role === 'groomer' ? '美容师' : '前台'}
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* 移动端底部 Tab Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t bg-card md:hidden safe-area-bottom">
        {navItems.slice(0, 5).map((item) => {
          const isActive = location.pathname.startsWith(item.to)
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={cn(
                'flex flex-col items-center gap-0.5 px-2 py-1.5 text-[10px] font-medium transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </NavLink>
          )
        })}
      </nav>
    </>
  )
}
