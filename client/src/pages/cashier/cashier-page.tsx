import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  Phone,
  Banknote,
  Smartphone,
  Wallet,
  Check,
  PawPrint,
  UserRound,
  CreditCard,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { apiClient } from '@/lib/api-client'
import { formatPrice, cn } from '@/lib/utils'
import { toast } from 'sonner'

interface PendingAppointment {
  id: number
  appointmentNo: string
  appointmentDate: string
  startTime: string
  customer: { id: number; name: string; phone: string }
  pet: { id: number; name: string; species: string }
  appointmentItems: {
    id: number
    price: number
    commissionAmount: number
    status: string
    service: { id: number; name: string }
  }[]
}

interface DailySummary {
  total: number
  count: number
  byMethod: Record<string, { count: number; total: number }>
}

const METHOD_OPTIONS = [
  {
    value: 'wechat',
    label: '微信支付',
    icon: Smartphone,
    color: 'border-green-400 bg-green-50 hover:bg-green-100',
  },
  {
    value: 'alipay',
    label: '支付宝',
    icon: Smartphone,
    color: 'border-blue-400 bg-blue-50 hover:bg-blue-100',
  },
  {
    value: 'cash',
    label: '现金',
    icon: Banknote,
    color: 'border-amber-400 bg-amber-50 hover:bg-amber-100',
  },
  {
    value: 'card_balance',
    label: '会员卡余额',
    icon: CreditCard,
    color: 'border-purple-400 bg-purple-50 hover:bg-purple-100',
  },
]

const METHOD_LABELS: Record<string, string> = {
  wechat: '💰 微信',
  alipay: '💰 支付宝',
  cash: '💰 现金',
  card_balance: '💳 会员卡',
}

async function fetchPending() {
  return (await apiClient.get('/api/payments/pending')).data.data as PendingAppointment[]
}

export default function CashierPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { appointmentId: paramApptId } = useParams<{ appointmentId?: string }>()

  const [selected, setSelected] = useState<PendingAppointment | null>(null)
  const [method, setMethod] = useState('wechat')
  const [transactionNo, setTransactionNo] = useState('')
  const [saving, setSaving] = useState(false)

  // 待结账列表
  const {
    data: pendingList,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['pending-checkout'],
    queryFn: fetchPending,
    refetchInterval: 15000,
  })

  // 今日汇总
  const today = new Date().toISOString().slice(0, 10)
  const { data: summary } = useQuery({
    queryKey: ['payment-summary', today],
    queryFn: async () =>
      (await apiClient.get(`/api/payments/summary?date=${today}`)).data.data as DailySummary,
    refetchInterval: 15000,
  })

  // 自动选中 URL 参数指定的预约
  useEffect(() => {
    if (paramApptId && pendingList) {
      const found = pendingList.find((a) => a.id === Number(paramApptId))
      if (found) setSelected(found)
    }
  }, [paramApptId, pendingList])

  // 客户会员卡
  const [selectedCardId, setSelectedCardId] = useState<number | null>(null)
  const { data: customerCards } = useQuery({
    queryKey: ['customer-cards', selected?.customer.id],
    queryFn: async () => {
      if (!selected?.customer.id) return []
      return (await apiClient.get(`/api/cards/customer/${selected.customer.id}`)).data.data as {
        id: number
        cardType: string
        cardNo: string
        balance: number
        totalTimes: number
        usedTimes: number
      }[]
    },
    enabled: !!selected?.customer.id && method === 'card_balance',
  })

  // 结账
  const checkoutMutation = useMutation({
    mutationFn: async () => {
      if (!selected) return
      const items = selected.appointmentItems.filter((i) => i.status !== 'cancelled')
      const total = items.reduce((s, i) => s + i.price, 0)

      // 会员卡支付：先扣费，再结账
      if (method === 'card_balance' && selectedCardId) {
        await apiClient.post(`/api/cards/${selectedCardId}/deduct`, {
          amount: total,
          appointmentId: selected.id,
        })
      }

      return (
        await apiClient.post('/api/payments/checkout', {
          appointmentId: selected.id,
          amount: total,
          method,
          transactionNo: transactionNo || undefined,
        })
      ).data
    },
    onSuccess: (res) => {
      if (res?.success) {
        toast.success('收款成功！')
        queryClient.invalidateQueries({ queryKey: ['pending-checkout'] })
        queryClient.invalidateQueries({ queryKey: ['payment-summary'] })
        setSelected(null)
        setTransactionNo('')
      }
    },
    onError: (err: unknown) => {
      toast.error(
        (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error
          ?.message || '收款失败'
      )
    },
  })

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex items-center gap-2 mb-4">
        <Button variant="ghost" size="icon-sm" onClick={() => navigate('/appointments')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-xl font-bold">收银台</h1>
        {summary && (
          <span className="ml-auto text-sm text-muted-foreground">
            今日已收 <span className="font-bold text-primary">{formatPrice(summary.total)}</span> ·{' '}
            {summary.count} 笔
          </span>
        )}
      </div>

      <div className="grid gap-5 lg:grid-cols-5">
        {/* ── 左侧：待结账列表 ── */}
        <div className="space-y-2 lg:col-span-2">
          <p className="text-sm font-semibold text-muted-foreground">
            待结账 ({pendingList?.length || 0})
          </p>

          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-xl" />
            ))
          ) : isError ? (
            <Card className="py-8 text-center">
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                重试
              </Button>
            </Card>
          ) : !pendingList?.length ? (
            <Card className="py-12 text-center">
              <PawPrint className="mx-auto h-10 w-10 text-muted-foreground/30" />
              <p className="mt-3 text-sm text-muted-foreground">没有待结账的订单</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => navigate('/appointments')}
              >
                去预约列表
              </Button>
            </Card>
          ) : (
            pendingList.map((a) => {
              const items = a.appointmentItems.filter((i) => i.status !== 'cancelled')
              const total = items.reduce((s, i) => s + i.price, 0)
              return (
                <Card
                  key={a.id}
                  className={cn(
                    'cursor-pointer transition-colors',
                    selected?.id === a.id ? 'ring-2 ring-primary' : 'hover:bg-muted/50'
                  )}
                  onClick={() => {
                    setSelected(a)
                    setMethod('wechat')
                    setTransactionNo('')
                  }}
                >
                  <CardContent className="flex items-center gap-3 p-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-bold">
                      {a.pet.name.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold">
                        {a.pet.name}{' '}
                        <span className="font-normal text-muted-foreground">{a.customer.name}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {items.map((i) => i.service.name).join('+')}
                      </p>
                    </div>
                    <span className="shrink-0 text-base font-bold text-primary">
                      {formatPrice(total)}
                    </span>
                  </CardContent>
                </Card>
              )
            })
          )}

          {/* 今日汇总卡片 */}
          {summary && summary.count > 0 && (
            <Card className="mt-4 bg-muted/30">
              <CardContent className="p-4">
                <p className="text-xs font-semibold text-muted-foreground mb-2">今日收款汇总</p>
                <div className="space-y-1.5">
                  {Object.entries(summary.byMethod).map(([m, d]) => (
                    <div key={m} className="flex justify-between text-sm">
                      <span>{METHOD_LABELS[m] || m}</span>
                      <span className="font-medium">
                        {d.count}笔 · {formatPrice(d.total)}
                      </span>
                    </div>
                  ))}
                  <Separator />
                  <div className="flex justify-between text-sm font-bold">
                    <span>合计</span>
                    <span className="text-primary">{formatPrice(summary.total)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* ── 右侧：结算面板 ── */}
        <div className="lg:col-span-3">
          {!selected ? (
            <Card className="py-16 text-center">
              <Wallet className="mx-auto h-12 w-12 text-muted-foreground/30" />
              <p className="mt-4 text-muted-foreground">点击左侧待结账订单开始收款</p>
            </Card>
          ) : (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-base">
                  <span>账单详情</span>
                  <Badge variant="outline">{selected.appointmentNo}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* 客户+宠物 */}
                <div className="flex items-center gap-3 rounded-lg bg-muted/30 p-3">
                  <UserRound className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-semibold">{selected.customer.name}</p>
                    <p className="text-xs text-muted-foreground">
                      <Phone className="mr-1 inline h-3 w-3" />
                      {selected.customer.phone}
                      {' · '}
                      {selected.pet.species === 'dog'
                        ? '🐕'
                        : selected.pet.species === 'cat'
                          ? '🐈'
                          : '🐾'}{' '}
                      {selected.pet.name}
                    </p>
                  </div>
                </div>

                {/* 服务明细 */}
                <div className="space-y-2">
                  {selected.appointmentItems
                    .filter((i) => i.status !== 'cancelled')
                    .map((item) => (
                      <div key={item.id} className="flex items-center justify-between text-sm">
                        <span>{item.service.name}</span>
                        <span className="font-medium">{formatPrice(item.price)}</span>
                      </div>
                    ))}
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-base font-semibold">应付金额</span>
                    <span className="text-2xl font-bold text-primary">
                      {formatPrice(
                        selected.appointmentItems
                          .filter((i) => i.status !== 'cancelled')
                          .reduce((s, i) => s + i.price, 0)
                      )}
                    </span>
                  </div>
                </div>

                <Separator />

                {/* 支付方式 */}
                <div>
                  <Label className="mb-2 block">支付方式</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {METHOD_OPTIONS.map((opt) => {
                      const Icon = opt.icon
                      return (
                        <button
                          key={opt.value}
                          className={cn(
                            'flex flex-col items-center gap-1 rounded-xl border-2 p-3 transition-colors',
                            method === opt.value ? 'ring-2 ring-primary border-primary' : opt.color
                          )}
                          onClick={() => setMethod(opt.value)}
                        >
                          <Icon
                            className={cn(
                              'h-6 w-6',
                              method === opt.value ? 'text-primary' : 'text-muted-foreground'
                            )}
                          />
                          <span className="text-xs font-medium">{opt.label}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* 会员卡选择 */}
                {method === 'card_balance' && (
                  <div>
                    <Label>选择会员卡</Label>
                    <div className="mt-2 space-y-2">
                      {!customerCards?.length ? (
                        <p className="text-xs text-muted-foreground">该客户暂无有效会员卡</p>
                      ) : (
                        customerCards.map((card) => (
                          <button
                            key={card.id}
                            className={cn(
                              'w-full rounded-lg border-2 p-3 text-left transition-colors',
                              selectedCardId === card.id
                                ? 'border-primary bg-primary/5'
                                : 'hover:bg-muted'
                            )}
                            onClick={() => setSelectedCardId(card.id)}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-semibold">
                                {card.cardType === 'balance' ? '💰' : '🎫'} {card.cardNo}
                              </span>
                              <span className="text-lg font-bold text-primary">
                                {card.cardType === 'balance'
                                  ? `¥${card.balance.toLocaleString()}`
                                  : `${card.totalTimes - card.usedTimes}/${card.totalTimes}次`}
                              </span>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* 交易号 */}
                <div>
                  <Label>交易流水号（选填）</Label>
                  <Input
                    value={transactionNo}
                    onChange={(e) => setTransactionNo(e.target.value)}
                    placeholder={
                      method === 'wechat'
                        ? '微信支付订单号...'
                        : method === 'alipay'
                          ? '支付宝交易号...'
                          : method === 'card_balance'
                            ? '会员卡支付无需填'
                            : '现金无需填'
                    }
                  />
                </div>

                {/* 收款按钮 */}
                <Button
                  size="lg"
                  className="w-full text-base"
                  disabled={saving || checkoutMutation.isPending}
                  onClick={() => {
                    setSaving(true)
                    checkoutMutation.mutateAsync().finally(() => setSaving(false))
                  }}
                >
                  <Check className="mr-2 h-5 w-5" />
                  {saving
                    ? '处理中...'
                    : `确认收款 ¥${formatPrice(selected.appointmentItems.filter((i) => i.status !== 'cancelled').reduce((s, i) => s + i.price, 0))}`}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
