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

const pageTitles: Record<string, string> = {
  '/dashboard': '工作台',
  '/appointments': '预约管理',
  '/customers': '客户管理',
  '/services': '服务管理',
  '/cashier': '收银管理',
  '/boarding': '寄养管理',
  '/inventory': '库存管理',
  '/staff': '员工管理',
  '/reports': '数据统计',
  '/settings': '系统设置',
}

export function Header() {
  const location = useLocation()
  const { user, logout } = useAuth()

  const title =
    Object.entries(pageTitles).find(([path]) => location.pathname.startsWith(path))?.[1] || ''

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b bg-card px-4 md:px-6">
      {/* 左侧 */}
      <div className="flex items-center gap-3">
        {/* 移动端菜单按钮 */}
        <Button variant="ghost" size="icon-sm" className="md:hidden">
          <Menu className="h-5 w-5" />
        </Button>
        <h1 className="text-base font-semibold">{title}</h1>
      </div>

      {/* 右侧 */}
      <div className="flex items-center gap-2">
        {/* 通知 */}
        <Button variant="ghost" size="icon-sm" className="relative">
          <Bell className="h-5 w-5" />
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white">
            3
          </span>
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
