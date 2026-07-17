import { useLocation } from 'react-router-dom'
import { Bell, LogOut, Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuth } from '@/hooks/use-auth'
import { useSidebarStore } from '@/stores/sidebar-store'
import { NAV_ITEMS } from './sidebar'

export function Header() {
  const location = useLocation()
  const { user, logout } = useAuth()
  const setMobileOpen = useSidebarStore((s) => s.setMobileOpen)

  // 根据路径匹配页面标题
  const title =
    NAV_ITEMS.find((item) =>
      item.to === '/dashboard'
        ? location.pathname === '/dashboard'
        : location.pathname.startsWith(item.to)
    )?.label || ''

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b bg-card px-4 md:px-6">
      {/* 左侧 */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon-sm"
          className="md:hidden"
          onClick={() => setMobileOpen(true)}
        >
          <Menu className="h-5 w-5" />
        </Button>
        <h1 className="text-base font-semibold">{title}</h1>
      </div>

      {/* 右侧 */}
      <div className="flex items-center gap-2">
        {/* 通知（占位，V2 实现） */}
        <Button variant="ghost" size="icon-sm" className="relative">
          <Bell className="h-5 w-5" />
        </Button>

        {/* 用户菜单 */}
        <DropdownMenu>
          <DropdownMenuTrigger className="flex h-8 cursor-pointer items-center gap-2 rounded-lg px-2 text-sm font-medium hover:bg-muted">
            <Avatar className="h-7 w-7">
              <AvatarFallback className="bg-primary/10 text-xs font-bold text-primary">
                {user?.name?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <span className="hidden text-sm font-medium md:inline">{user?.name}</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>
              <div className="flex flex-col gap-0.5">
                <span>{user?.name}</span>
                <span className="text-xs font-normal text-muted-foreground">
                  {user?.role === 'owner' ? '老板' : user?.role === 'groomer' ? '美容师' : '前台'}
                </span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout}>
              <LogOut className="mr-2 h-4 w-4" />
              退出登录
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
