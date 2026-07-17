import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Plus, ChevronLeft, ChevronRight, Calendar, Phone, PawPrint } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { apiClient } from '@/lib/api-client'
import { cn } from '@/lib/utils'

interface ApptItem {
  service: { id: number; name: string; category: string }
}
interface Appointment {
  id: number
  appointmentNo: string
  appointmentDate: string
  startTime: string
  endTime: string
  status: string
  customer: { id: number; name: string; phone: string }
  pet: { id: number; name: string; species: string }
  assignedStaff: { id: number; name: string } | null
  appointmentItems: ApptItem[]
}

const STATUS_MAP: Record<string, { label: string; color: string; dot: string }> = {
  pending: {
    label: '待确认',
    color: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    dot: 'bg-yellow-500',
  },
  arrived: {
    label: '已到店',
    color: 'bg-blue-100 text-blue-700 border-blue-200',
    dot: 'bg-blue-500',
  },
  in_progress: {
    label: '进行中',
    color: 'bg-primary-100 text-primary-700 border-primary-200',
    dot: 'bg-primary-500',
  },
  completed: {
    label: '已完成',
    color: 'bg-green-100 text-green-700 border-green-200',
    dot: 'bg-green-500',
  },
  picked_up: {
    label: '已取走',
    color: 'bg-gray-100 text-gray-500 border-gray-200',
    dot: 'bg-gray-400',
  },
  cancelled: {
    label: '已取消',
    color: 'bg-red-100 text-red-700 border-red-200',
    dot: 'bg-red-500',
  },
  no_show: { label: '未到店', color: 'bg-red-100 text-red-700 border-red-200', dot: 'bg-red-500' },
}

function today() {
  return new Date().toISOString().slice(0, 10)
}

export default function BookingListPage() {
  const navigate = useNavigate()

  const [date, setDate] = useState(today)
  const [statusFilter, setStatusFilter] = useState('')

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['appointments', date],
    queryFn: async () =>
      (await apiClient.get(`/api/appointments?date=${date}`)).data.data as Appointment[],
  })

  const appointments = data || []
  const filtered = statusFilter
    ? appointments.filter((a) => a.status === statusFilter)
    : appointments

  const changeDate = (days: number) => {
    const d = new Date(date)
    d.setDate(d.getDate() + days)
    setDate(d.toISOString().slice(0, 10))
  }

  const isToday = date === today()

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold">预约管理</h1>
          <p className="text-sm text-muted-foreground">{filtered.length} 个预约</p>
        </div>
        <Button size="sm" onClick={() => navigate('/appointments/new')}>
          <Plus className="mr-1 h-4 w-4" />
          新增预约
        </Button>
      </div>

      {/* 日期切换器 */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon-sm" onClick={() => changeDate(-1)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Calendar className="h-4 w-4" />
          {date}
          {isToday && <Badge className="text-[10px]">今天</Badge>}
        </div>
        <Button variant="ghost" size="icon-sm" onClick={() => changeDate(1)}>
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" className="text-xs" onClick={() => setDate(today())}>
          回到今天
        </Button>
      </div>

      {/* 状态筛选 */}
      <div className="flex flex-wrap gap-1.5">
        <Badge
          variant={statusFilter === '' ? 'default' : 'outline'}
          className="cursor-pointer text-xs"
          onClick={() => setStatusFilter('')}
        >
          全部 ({appointments.length})
        </Badge>
        {Object.entries(STATUS_MAP).map(([k, v]) => {
          const count = appointments.filter((a) => a.status === k).length
          if (count === 0) return null
          return (
            <Badge
              key={k}
              variant={statusFilter === k ? 'default' : 'outline'}
              className="cursor-pointer text-xs"
              onClick={() => setStatusFilter(k)}
            >
              {v.label} ({count})
            </Badge>
          )
        })}
      </div>

      {/* 列表 */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      ) : isError ? (
        <Card className="py-12 text-center">
          <p className="text-muted-foreground">加载失败</p>
          <Button variant="outline" size="sm" className="mt-2" onClick={() => refetch()}>
            重试
          </Button>
        </Card>
      ) : filtered.length === 0 ? (
        <Card className="py-16 text-center">
          <PawPrint className="mx-auto h-12 w-12 text-muted-foreground/30" />
          <p className="mt-4 font-medium text-muted-foreground">{date} 暂无预约</p>
          <Button size="sm" className="mt-4" onClick={() => navigate('/appointments/new')}>
            <Plus className="mr-1 h-4 w-4" />
            新增预约
          </Button>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((a) => {
            const st = STATUS_MAP[a.status] || STATUS_MAP.pending
            return (
              <Card
                key={a.id}
                className="cursor-pointer transition-shadow hover:shadow-card-hover"
                onClick={() => navigate(`/appointments/${a.id}`)}
              >
                <CardContent className="flex items-center gap-4 p-4">
                  {/* 时间列 */}
                  <div className="w-16 shrink-0 text-center">
                    <p className="text-lg font-bold leading-none">{a.startTime}</p>
                    <p className="mt-1 text-[10px] text-muted-foreground">~{a.endTime}</p>
                  </div>

                  {/* 主体 */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{a.pet.name}</span>
                      <Badge className={cn('text-[10px] border', st.color)} variant="outline">
                        {st.label}
                      </Badge>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                      <span>{a.appointmentItems.map((i) => i.service.name).join('+')}</span>
                      {a.assignedStaff && (
                        <span className="flex items-center gap-0.5">· {a.assignedStaff.name}</span>
                      )}
                    </div>
                    <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-0.5">
                        <Phone className="h-3 w-3" />
                        {a.customer.name} {a.customer.phone}
                      </span>
                    </div>
                  </div>

                  <Badge variant="outline" className="shrink-0 text-[10px]">
                    {a.appointmentNo}
                  </Badge>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
