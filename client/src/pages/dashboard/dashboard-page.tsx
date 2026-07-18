import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
  CalendarDays,
  Scissors,
  CheckCircle,
  Package,
  Plus,
  Banknote,
  Clock,
  UserRound,
  PawPrint,
  AlertTriangle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { apiClient } from '@/lib/api-client'
import { formatPrice, cn } from '@/lib/utils'

interface TodayData {
  todayStats: {
    total: number
    pending: number
    arrived: number
    inProgress: number
    completed: number
    waitingPickup: number
  }
  inProgressServices: {
    id: number
    petName: string
    petSpecies: string
    groomerName: string
    services: string[]
    startTime: string
  }[]
  todayRevenue: { total: number; count: number }
  boarding: { active: number; checkoutToday: number; overdue: number }
}

const SPECIES_EMOJI: Record<string, string> = { dog: '🐕', cat: '🐈', other: '🐾' }

export default function DashboardPage() {
  const navigate = useNavigate()

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['dashboard-today'],
    queryFn: async () => (await apiClient.get('/api/dashboard/today')).data.data as TodayData,
    refetchInterval: 30000,
  })

  const stats = data?.todayStats
  const services = data?.inProgressServices || []
  const revenue = data?.todayRevenue
  const boarding = data?.boarding

  if (isError) {
    return (
      <Card className="py-12 text-center">
        <p className="text-muted-foreground">加载失败</p>
        <Button variant="outline" size="sm" className="mt-2" onClick={() => refetch()}>
          重试
        </Button>
      </Card>
    )
  }

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      {/* ── 标题 ── */}
      <div>
        <h1 className="text-xl font-bold">工作台</h1>
        <p className="text-sm text-muted-foreground">
          今天{' '}
          {new Date().toLocaleDateString('zh-CN', {
            month: 'long',
            day: 'numeric',
            weekday: 'short',
          })}
        </p>
      </div>

      {/* ── 四张统计卡片 ── */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          {
            label: '今日预约',
            value: stats?.total,
            icon: CalendarDays,
            color: 'bg-blue-50 text-blue-600',
          },
          {
            label: '进行中',
            value: stats?.inProgress,
            icon: Scissors,
            color: 'bg-primary/10 text-primary',
          },
          {
            label: '已完成',
            value: stats?.completed,
            icon: CheckCircle,
            color: 'bg-green-50 text-green-600',
          },
          {
            label: '待取宠',
            value: stats?.completed,
            icon: Package,
            color: 'bg-amber-50 text-amber-600',
          },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="flex items-center gap-3 p-4">
              <div
                className={cn(
                  'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
                  stat.color
                )}
              >
                <stat.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
                {isLoading ? (
                  <Skeleton className="h-7 w-10" />
                ) : (
                  <p className="text-2xl font-bold">{stat.value ?? '—'}</p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* ── 左栏：服务队列 + 营收 ── */}
        <div className="space-y-5 lg:col-span-2">
          {/* 服务队列 */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base">📋 实时服务队列</CardTitle>
              <Badge variant="secondary">{services.length} 只进行中</Badge>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 2 }).map((_, i) => (
                    <Skeleton key={i} className="h-20 w-full rounded-lg" />
                  ))}
                </div>
              ) : services.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  <Scissors className="mx-auto mb-2 h-8 w-8 text-muted-foreground/30" />
                  当前没有正在进行的服务
                </div>
              ) : (
                <div className="space-y-3">
                  {services.map((s) => (
                    <button
                      key={s.id}
                      className="flex w-full items-center gap-4 rounded-lg border p-3 text-left transition-colors hover:bg-muted/50"
                      onClick={() => navigate(`/appointments/${s.id}`)}
                    >
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-muted text-xl">
                        {SPECIES_EMOJI[s.petSpecies] || '🐾'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{s.petName}</span>
                          <Badge variant="secondary" className="text-[10px]">
                            {s.services.join(' + ')}
                          </Badge>
                        </div>
                        <p className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                          <UserRound className="h-3 w-3" />
                          {s.groomerName}
                          <Clock className="h-3 w-3 ml-1" />
                          {s.startTime} 开始
                        </p>
                      </div>
                      <Badge variant="default" className="shrink-0 animate-pulse text-[10px]">
                        进行中
                      </Badge>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 今日营收 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">💰 今日营收</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-12 w-full" />
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-3xl font-bold text-primary">
                      {formatPrice(revenue?.total || 0)}
                    </p>
                    <p className="text-sm text-muted-foreground">{revenue?.count || 0} 笔收款</p>
                  </div>
                  <Button variant="outline" onClick={() => navigate('/cashier')}>
                    <Banknote className="mr-1 h-4 w-4" />
                    收银台
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── 右栏：寄养 + 快捷操作 ── */}
        <div className="space-y-5">
          {/* 寄养概览 */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base">🏨 寄养</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs"
                onClick={() => navigate('/boarding')}
              >
                查看 →
              </Button>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-6 w-full" />
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">在住</span>
                    <span className="text-lg font-bold">{boarding?.active || 0} 只</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">今日退房</span>
                    <span className="font-medium">{boarding?.checkoutToday || 0} 只</span>
                  </div>
                  <Separator />
                  <div
                    className={cn(
                      'flex items-center justify-between',
                      boarding?.overdue ? 'text-destructive' : ''
                    )}
                  >
                    <span className="flex items-center gap-1 text-sm">
                      {boarding?.overdue ? <AlertTriangle className="h-3.5 w-3.5" /> : null}
                      超期未取
                    </span>
                    <span className="font-bold">{boarding?.overdue || 0} 只</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 快捷入口 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">⚡ 快捷操作</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                className="w-full justify-start"
                size="lg"
                onClick={() => navigate('/appointments/new')}
              >
                <Plus className="mr-2 h-5 w-5" />
                新增预约
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => navigate('/cashier')}
              >
                <Banknote className="mr-2 h-5 w-5" />
                收银台
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => navigate('/customers')}
              >
                <PawPrint className="mr-2 h-5 w-5" />
                客户管理
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => navigate('/appointments')}
              >
                <CalendarDays className="mr-2 h-5 w-5" />
                今日预约
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
