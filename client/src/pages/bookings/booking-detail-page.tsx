import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  Phone,
  Clock,
  Calendar,
  UserRound,
  Scissors,
  ShieldAlert,
  Syringe,
  Banknote,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { apiClient } from '@/lib/api-client'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface AppointmentDetail {
  id: number
  appointmentNo: string
  appointmentDate: string
  startTime: string
  endTime: string
  status: string
  source: string
  notes: string | null
  createdAt: string
  customer: { id: number; name: string; phone: string }
  pet: {
    id: number
    name: string
    species: string
    breed: string | null
    avatarUrl: string | null
    weightKg: number | null
    vaccineExpiry: string | null
    isAggressive: boolean
  }
  assignedStaff: { id: number; name: string } | null
  appointmentItems: {
    id: number
    price: number
    commissionAmount: number
    status: string
    service: { id: number; name: string; category: string; durationMinutes: number }
  }[]
}

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: '待确认', color: 'text-yellow-700', bg: 'bg-yellow-100' },
  arrived: { label: '已到店', color: 'text-blue-700', bg: 'bg-blue-100' },
  in_progress: { label: '进行中', color: 'text-primary', bg: 'bg-primary/10' },
  completed: { label: '已完成', color: 'text-green-700', bg: 'bg-green-100' },
  picked_up: { label: '已取走', color: 'text-gray-500', bg: 'bg-gray-100' },
  cancelled: { label: '已取消', color: 'text-red-700', bg: 'bg-red-100' },
  no_show: { label: '未到店', color: 'text-red-700', bg: 'bg-red-100' },
}

const NEXT_STATUS: Record<string, { label: string; status: string }[]> = {
  pending: [
    { label: '✅ 确认到店', status: 'arrived' },
    { label: '❌ 未到店', status: 'no_show' },
    { label: '取消', status: 'cancelled' },
  ],
  arrived: [{ label: '▶ 开始服务', status: 'in_progress' }],
  in_progress: [{ label: '✅ 完成服务', status: 'completed' }],
  completed: [{ label: '🏠 已取走', status: 'picked_up' }],
}

export default function BookingDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const {
    data: appt,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['appointment', id],
    queryFn: async () =>
      (await apiClient.get(`/api/appointments/${id}`)).data.data as AppointmentDetail,
    enabled: !!id,
  })

  const changeStatusMutation = useMutation({
    mutationFn: (status: string) => apiClient.patch(`/api/appointments/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointment', id] })
      toast.success('状态已更新')
    },
    onError: (err: unknown) => {
      toast.error(
        (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error
          ?.message || '操作失败'
      )
    },
  })

  if (isLoading)
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <Skeleton className="h-32" />
        <Skeleton className="h-64" />
      </div>
    )
  if (isError || !appt)
    return (
      <Card className="mx-auto max-w-md py-16 text-center">
        <p className="text-muted-foreground">预约单不存在</p>
        <Button
          variant="outline"
          size="sm"
          className="mt-4"
          onClick={() => navigate('/appointments')}
        >
          返回列表
        </Button>
      </Card>
    )

  const st = STATUS_MAP[appt.status] || STATUS_MAP.pending
  const totalPrice = appt.appointmentItems.reduce((s, i) => s + i.price, 0)
  const nextActions = NEXT_STATUS[appt.status] || []

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon-sm" onClick={() => navigate('/appointments')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-lg font-bold">{appt.appointmentNo}</h1>
        <Badge className={cn('text-xs', st.bg, st.color)} variant="outline">
          {st.label}
        </Badge>
      </div>

      {/* 状态操作 */}
      {nextActions.length > 0 && (
        <Card>
          <CardContent className="flex flex-wrap gap-2 p-4">
            {nextActions.map((a) => (
              <Button
                key={a.status}
                variant="outline"
                size="sm"
                disabled={changeStatusMutation.isPending}
                onClick={() => {
                  const label = a.label.replace(/[✅❌▶🏠]/g, '').trim()
                  if (confirm(`确定「${label}」？`)) changeStatusMutation.mutate(a.status)
                }}
              >
                {a.label}
              </Button>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {/* 宠物信息 */}
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-3">
              <Link
                to={`/pets/${appt.pet.id}`}
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-muted text-2xl hover:ring-2 ring-primary/30"
              >
                {appt.pet.species === 'dog' ? '🐕' : appt.pet.species === 'cat' ? '🐈' : '🐾'}
              </Link>
              <div>
                <p className="font-semibold flex items-center gap-1.5">
                  <Link to={`/pets/${appt.pet.id}`} className="hover:text-primary">
                    {appt.pet.name}
                  </Link>
                  {appt.pet.isAggressive && <ShieldAlert className="h-4 w-4 text-destructive" />}
                </p>
                <p className="text-xs text-muted-foreground">
                  {appt.pet.breed} · {appt.pet.weightKg ? `${appt.pet.weightKg}kg` : ''}
                </p>
                {appt.pet.vaccineExpiry && (
                  <Badge
                    variant="outline"
                    className={cn(
                      'mt-1 gap-1 text-[10px]',
                      new Date(appt.pet.vaccineExpiry) > new Date()
                        ? 'text-green-600'
                        : 'text-red-600'
                    )}
                  >
                    <Syringe className="h-3 w-3" />
                    疫苗 {appt.pet.vaccineExpiry}
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 主人 + 美容师 */}
        <Card>
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <Link
                to={`/customers/${appt.customer.id}`}
                className="font-medium hover:text-primary"
              >
                {appt.customer.name}
              </Link>
              <span className="text-muted-foreground">{appt.customer.phone}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <UserRound className="h-4 w-4 text-muted-foreground" />
              {appt.assignedStaff ? (
                <span>{appt.assignedStaff.name}</span>
              ) : (
                <span className="text-muted-foreground">未指派</span>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>{appt.appointmentDate}</span>
              <Clock className="h-4 w-4 text-muted-foreground ml-2" />
              <span>
                {appt.startTime}~{appt.endTime}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 服务明细 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">服务项目</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {appt.appointmentItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-lg border p-3 text-sm"
              >
                <div className="flex items-center gap-2">
                  <Scissors className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{item.service.name}</span>
                  <Badge variant="secondary" className="text-[10px]">
                    {item.service.durationMinutes}min
                  </Badge>
                </div>
                <span className="font-semibold">¥{item.price}</span>
              </div>
            ))}
            <Separator />
            <div className="flex items-center justify-between px-1 pt-1">
              <span className="text-sm font-semibold">合计</span>
              <span className="text-lg font-bold text-primary">¥{totalPrice}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 备注 + 操作 */}
      {appt.notes && (
        <Card>
          <CardContent className="p-4 text-sm">
            <span className="text-muted-foreground">备注：</span>
            {appt.notes}
          </CardContent>
        </Card>
      )}

      {appt.status === 'completed' && (
        <div className="flex justify-end">
          <Button size="lg" onClick={() => navigate(`/cashier/${appt.id}`)}>
            <Banknote className="mr-2 h-5 w-5" />
            去结账 ¥{totalPrice}
          </Button>
        </div>
      )}
    </div>
  )
}
