import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Plus, Phone, ChevronRight, LogOut, Hotel, PawPrint, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { apiClient } from '@/lib/api-client'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

// ─── 类型 ───────────────────────────
interface Cage {
  cageNo: string
  occupied: boolean
  boarding: {
    id: number
    pet: { id: number; name: string; species: string; avatarUrl: string | null }
    customer: { name: string }
    checkInDate: string
    checkOutDate: string
  } | null
}

interface BoardingDetail {
  id: number
  cageNo: string
  checkInDate: string
  checkOutDate: string
  actualCheckOut: string | null
  dailyRate: number
  totalAmount: number
  deposit: number
  status: string
  broughtItems: string | null
  emergencyContact: string | null
  notes: string | null
  pet: {
    id: number
    name: string
    species: string
    breed: string | null
    avatarUrl: string | null
    weightKg: number | null
  }
  customer: { id: number; name: string; phone: string }
  careLogs: {
    id: number
    logType: string
    content: string
    createdAt: string
    staff: { id: number; name: string }
  }[]
}

interface Customer {
  id: number
  name: string
  phone: string
}
interface Pet {
  id: number
  name: string
  species: string
}

const LOG_TYPES: Record<string, { label: string; emoji: string }> = {
  feeding: { label: '喂食', emoji: '🍖' },
  walking: { label: '遛弯', emoji: '🏃' },
  water: { label: '换水', emoji: '💧' },
  cleaning: { label: '清洁', emoji: '🧹' },
  medical: { label: '医疗', emoji: '💊' },
  other: { label: '其他', emoji: '📝' },
}

const CAGE_ROWS = [
  ['A01', 'A02', 'A03', 'A04', 'A05'],
  ['B01', 'B02', 'B03', 'B04', 'B05'],
]

export default function BoardingPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // 筛选
  const [statusFilter, setStatusFilter] = useState('active')

  // 选中的寄养详情
  const [selectedId, setSelectedId] = useState<number | null>(null)

  // 入住 Sheet
  const [checkinOpen, setCheckinOpen] = useState(false)
  const [checkinForm, setCheckinForm] = useState({
    customerSearch: '',
    petId: 0,
    customerId: 0,
    customerName: '',
    cageNo: 'A01',
    checkInDate: new Date().toISOString().slice(0, 10),
    checkOutDate: '',
    dailyRate: 60,
    deposit: 200,
    broughtItems: '',
    emergencyContact: '',
    notes: '',
  })
  const [customersFound, setCustomersFound] = useState<Customer[]>([])
  const [customerPets, setCustomerPets] = useState<Pet[]>([])
  const [saving, setSaving] = useState(false)

  // 看护日志
  const [logType, setLogType] = useState('feeding')
  const [logContent, setLogContent] = useState('')

  // ── 笼舍状态 ──
  const { data: cages } = useQuery({
    queryKey: ['boarding-cages'],
    queryFn: async () => (await apiClient.get('/api/boarding/cages')).data.data as Cage[],
    refetchInterval: 30000,
  })

  // ── 寄养列表 ──
  const { data: boardingList, isLoading } = useQuery({
    queryKey: ['boarding-list', statusFilter],
    queryFn: async () =>
      (await apiClient.get(`/api/boarding?status=${statusFilter}`)).data.data as BoardingDetail[],
  })

  // ── 寄养详情 ──
  const { data: detail } = useQuery({
    queryKey: ['boarding-detail', selectedId],
    queryFn: async () =>
      (await apiClient.get(`/api/boarding/${selectedId}`)).data.data as BoardingDetail,
    enabled: !!selectedId,
  })

  // ── 搜索客户 ──
  const searchCustomers = async (q: string) => {
    if (q.length < 2) {
      setCustomersFound([])
      return
    }
    const res = await apiClient.get(`/api/customers?search=${q}&pageSize=5`)
    setCustomersFound(res.data.data)
  }

  const selectCustomer = async (c: Customer) => {
    setCheckinForm({
      ...checkinForm,
      customerId: c.id,
      customerName: c.name,
      customerSearch: '',
      petId: 0,
    })
    setCustomersFound([])
    const res = await apiClient.get(`/api/pets/customer/${c.id}`)
    setCustomerPets(res.data.data)
  }

  // ── 入住 ──
  const checkinMutation = useMutation({
    mutationFn: () =>
      apiClient.post('/api/boarding', {
        ...checkinForm,
        petId: checkinForm.petId || undefined,
        customerId: checkinForm.customerId || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boarding-cages'] })
      queryClient.invalidateQueries({ queryKey: ['boarding-list'] })
      setCheckinOpen(false)
      toast.success('入住已登记')
    },
    onError: (err: unknown) =>
      toast.error((err as any)?.response?.data?.error?.message || '登记失败'),
  })

  // ── 退房 ──
  const checkoutMutation = useMutation({
    mutationFn: (id: number) =>
      apiClient.post(`/api/boarding/${id}/checkout`, {
        actualCheckOut: new Date().toISOString().slice(0, 16).replace('T', ' '),
      }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['boarding-cages'] })
      queryClient.invalidateQueries({ queryKey: ['boarding-list'] })
      queryClient.invalidateQueries({ queryKey: ['boarding-detail'] })
      const amount = res.data.data.totalAmount
      toast.success(`退房完成，费用 ¥${amount}`)
    },
    onError: () => toast.error('退房失败'),
  })

  // ── 添加看护日志 ──
  const addLogMutation = useMutation({
    mutationFn: () =>
      apiClient.post(`/api/boarding/${selectedId}/care-logs`, { logType, content: logContent }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boarding-detail', selectedId] })
      setLogContent('')
      toast.success('日志已记录')
    },
    onError: () => toast.error('添加失败'),
  })

  const deleteLogMutation = useMutation({
    mutationFn: (logId: number) =>
      apiClient.delete(`/api/boarding/${selectedId}/care-logs/${logId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['boarding-detail', selectedId] }),
  })

  // ── 统计 ──
  const activeList = (boardingList || []).filter((b) => b.status === 'active')
  const cagesOccupied = (cages || []).filter((c) => c.occupied).length

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      {/* ── 标题 ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">寄养管理</h1>
          <p className="text-sm text-muted-foreground">
            {cagesOccupied}/{cages?.length || 10} 笼舍使用中 · {activeList.length} 只宠物在住
          </p>
        </div>
        <Button size="sm" onClick={() => setCheckinOpen(true)}>
          <Plus className="mr-1 h-4 w-4" />
          入住登记
        </Button>
      </div>

      {/* ── 笼舍看板 ── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">🏠 笼舍状态</CardTitle>
        </CardHeader>
        <CardContent>
          {!cages ? (
            <div className="grid grid-cols-5 gap-3">
              {Array.from({ length: 10 }).map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {CAGE_ROWS.map((row, ri) => (
                <div key={ri} className="grid grid-cols-5 gap-3">
                  {row.map((no) => {
                    const cage = cages.find((c) => c.cageNo === no)!
                    return (
                      <button
                        key={no}
                        className={cn(
                          'rounded-xl border-2 p-3 text-center transition-all',
                          cage.occupied
                            ? 'border-primary/30 bg-primary/5 hover:bg-primary/10 cursor-pointer'
                            : 'border-dashed border-muted-foreground/20 bg-muted/30 hover:border-primary/50'
                        )}
                        onClick={() => cage.occupied && setSelectedId(cage.boarding!.id)}
                      >
                        <p className="text-xs font-bold text-muted-foreground mb-1">{no}</p>
                        {cage.occupied ? (
                          <>
                            <div className="text-3xl mb-1">
                              {cage.boarding!.pet.species === 'dog' ? '🐕' : '🐈'}
                            </div>
                            <p className="text-sm font-semibold">{cage.boarding!.pet.name}</p>
                            <p className="text-[10px] text-muted-foreground">
                              {cage.boarding!.checkInDate} → {cage.boarding!.checkOutDate}
                            </p>
                          </>
                        ) : (
                          <>
                            <div className="text-3xl mb-1 opacity-20">🏠</div>
                            <p className="text-xs text-muted-foreground">空闲</p>
                          </>
                        )}
                      </button>
                    )
                  })}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── 寄养列表 + 详情 ── */}
      <div className="grid gap-5 lg:grid-cols-3">
        {/* 左：列表 */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-muted-foreground">寄养记录</p>
            <div className="flex gap-1">
              {['active', 'checked_out', ''].map((s) => (
                <Badge
                  key={s}
                  variant={statusFilter === s ? 'default' : 'outline'}
                  className="cursor-pointer text-[10px]"
                  onClick={() => setStatusFilter(s)}
                >
                  {s === 'active' ? '在住' : s === 'checked_out' ? '已退房' : '全部'}
                </Badge>
              ))}
            </div>
          </div>

          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-xl" />
            ))
          ) : !boardingList?.length ? (
            <Card className="py-8 text-center text-sm text-muted-foreground">
              <Hotel className="mx-auto mb-2 h-8 w-8 opacity-30" />
              暂无寄养记录
            </Card>
          ) : (
            boardingList.map((b) => (
              <Card
                key={b.id}
                className={cn(
                  'cursor-pointer transition-colors',
                  selectedId === b.id ? 'ring-2 ring-primary' : 'hover:bg-muted/50'
                )}
                onClick={() => setSelectedId(b.id)}
              >
                <CardContent className="flex items-center gap-3 p-3">
                  <div className="text-2xl">{b.pet.species === 'dog' ? '🐕' : '🐈'}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">{b.pet.name}</span>
                      <Badge
                        variant={b.status === 'active' ? 'default' : 'secondary'}
                        className="text-[10px]"
                      >
                        {b.status === 'active' ? '在住' : '已退'}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {b.customer.name} · {b.cageNo}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground/30" />
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* 右：详情 + 看护日志 */}
        <div className="lg:col-span-2">
          {!detail ? (
            <Card className="py-16 text-center">
              <PawPrint className="mx-auto h-12 w-12 text-muted-foreground/30" />
              <p className="mt-4 text-muted-foreground">选择左侧寄养记录查看详情</p>
            </Card>
          ) : (
            <div className="space-y-4">
              {/* 基本信息 */}
              <Card>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-3xl">{detail.pet.species === 'dog' ? '🐕' : '🐈'}</div>
                      <div>
                        <p className="font-bold text-lg">{detail.pet.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {detail.pet.breed} · {detail.pet.weightKg}kg
                        </p>
                      </div>
                    </div>
                    <Badge variant={detail.status === 'active' ? 'default' : 'secondary'}>
                      {detail.status === 'active' ? '在住中' : '已退房'}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">主人</p>
                      <button
                        className="font-medium hover:text-primary"
                        onClick={() => navigate(`/customers/${detail.customer.id}`)}
                      >
                        {detail.customer.name}
                      </button>
                      <p className="text-xs text-muted-foreground flex items-center gap-0.5">
                        <Phone className="h-3 w-3" />
                        {detail.customer.phone}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">笼舍</p>
                      <p className="font-bold">{detail.cageNo}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">时间</p>
                      <p className="text-xs">
                        {detail.checkInDate} → {detail.checkOutDate}
                      </p>
                      <p className="text-xs text-muted-foreground">¥{detail.dailyRate}/天</p>
                    </div>
                  </div>

                  {detail.broughtItems && (
                    <div className="text-sm bg-muted/30 rounded-lg p-2">
                      <span className="text-muted-foreground">自带物品：</span>
                      {detail.broughtItems}
                    </div>
                  )}

                  {detail.notes && (
                    <div className="text-sm text-muted-foreground">📝 {detail.notes}</div>
                  )}

                  {/* 费用 + 退房 */}
                  {detail.status === 'active' && (
                    <div className="flex items-center justify-between border-t pt-3">
                      <div>
                        <span className="text-sm text-muted-foreground">
                          押金 ¥{detail.deposit}
                        </span>
                        <span className="mx-2">|</span>
                        <span className="text-sm text-muted-foreground">
                          已住{' '}
                          {(() => {
                            const d = Math.max(
                              1,
                              Math.ceil(
                                (new Date().getTime() - new Date(detail.checkInDate).getTime()) /
                                  86400000
                              ) + 1
                            )
                            return d
                          })()}{' '}
                          天
                        </span>
                        <span className="mx-2">|</span>
                        <span className="font-semibold">
                          预估 ¥
                          {detail.dailyRate *
                            Math.max(
                              1,
                              Math.ceil(
                                (new Date().getTime() - new Date(detail.checkInDate).getTime()) /
                                  86400000
                              ) + 1
                            )}
                        </span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => checkoutMutation.mutate(detail.id)}
                        disabled={checkoutMutation.isPending}
                      >
                        <LogOut className="mr-1 h-4 w-4" />
                        退房结算
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* 看护日志 */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">
                    📋 看护日志 ({detail.careLogs.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* 日志列表 */}
                  {detail.careLogs.length === 0 ? (
                    <p className="py-4 text-center text-sm text-muted-foreground">暂无看护记录</p>
                  ) : (
                    detail.careLogs.map((log) => {
                      const lt = LOG_TYPES[log.logType] || LOG_TYPES.other
                      return (
                        <div key={log.id} className="flex gap-3 rounded-lg border p-3 text-sm">
                          <span className="text-xl shrink-0">{lt.emoji}</span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="text-[10px]">
                                {lt.label}
                              </Badge>
                              <span className="text-[11px] text-muted-foreground">
                                {log.staff.name} ·{' '}
                                {new Date(log.createdAt).toLocaleString('zh-CN', {
                                  month: '2-digit',
                                  day: '2-digit',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                            <p className="mt-1 text-sm">{log.content}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="shrink-0 text-muted-foreground hover:text-destructive"
                            onClick={() => deleteLogMutation.mutate(log.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      )
                    })
                  )}

                  {/* 添加日志（仅入住中） */}
                  {detail.status === 'active' && (
                    <>
                      <Separator />
                      <div className="flex gap-2">
                        <Select value={logType} onValueChange={(v) => setLogType(v ?? 'feeding')}>
                          <SelectTrigger className="w-24 shrink-0">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(LOG_TYPES).map(([k, v]) => (
                              <SelectItem key={k} value={k}>
                                {v.emoji} {v.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input
                          placeholder="记录看护内容..."
                          value={logContent}
                          onChange={(e) => setLogContent(e.target.value)}
                          onKeyDown={(e) =>
                            e.key === 'Enter' && logContent.trim() && addLogMutation.mutate()
                          }
                        />
                        <Button
                          size="sm"
                          disabled={!logContent.trim() || addLogMutation.isPending}
                          onClick={() => addLogMutation.mutate()}
                        >
                          记录
                        </Button>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* ── 入住登记 Sheet ── */}
      <Sheet open={checkinOpen} onOpenChange={setCheckinOpen}>
        <SheetContent side="right" className="w-full max-w-md overflow-y-auto p-0">
          <SheetHeader className="border-b px-6 py-4">
            <SheetTitle>🏨 寄养入住登记</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 px-6 py-4">
            {/* 找客户 */}
            <div>
              <Label>{checkinForm.customerId ? '✅ 主人' : '搜索客户 *'}</Label>
              {checkinForm.customerId ? (
                <div className="flex items-center justify-between mt-2 p-2 rounded-lg bg-muted/30">
                  <span className="font-medium">{checkinForm.customerName}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setCheckinForm({ ...checkinForm, customerId: 0, customerName: '', petId: 0 })
                    }
                  >
                    更换
                  </Button>
                </div>
              ) : (
                <div className="relative mt-2">
                  <Input
                    placeholder="输入手机号搜索..."
                    value={checkinForm.customerSearch}
                    onChange={(e) => {
                      setCheckinForm({ ...checkinForm, customerSearch: e.target.value })
                      searchCustomers(e.target.value)
                    }}
                  />
                  {customersFound.length > 0 && (
                    <div className="absolute z-20 mt-1 w-full rounded-lg border bg-card shadow-lg">
                      {customersFound.map((c) => (
                        <button
                          key={c.id}
                          className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-muted"
                          onClick={() => selectCustomer(c)}
                        >
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-bold">
                            {c.name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{c.name}</p>
                            <p className="text-xs text-muted-foreground">{c.phone}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 选宠物 */}
            {checkinForm.customerId > 0 && (
              <div>
                <Label>选择宠物 *</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {customerPets.map((p) => (
                    <button
                      key={p.id}
                      className={cn(
                        'rounded-lg border px-3 py-1.5 text-sm transition-colors',
                        checkinForm.petId === p.id
                          ? 'border-primary bg-primary/10'
                          : 'hover:bg-muted'
                      )}
                      onClick={() => setCheckinForm({ ...checkinForm, petId: p.id })}
                    >
                      {p.species === 'dog' ? '🐕' : '🐈'} {p.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 笼舍 + 日期 */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>笼舍 *</Label>
                <Select
                  value={checkinForm.cageNo}
                  onValueChange={(v) => setCheckinForm({ ...checkinForm, cageNo: v ?? 'A01' })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CAGE_ROWS.flat().map((no) => (
                      <SelectItem key={no} value={no}>
                        {no} {(cages || []).find((c) => c.cageNo === no)?.occupied ? '🔴' : '🟢'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>每日费用 (¥)</Label>
                <Input
                  type="number"
                  value={checkinForm.dailyRate}
                  onChange={(e) =>
                    setCheckinForm({ ...checkinForm, dailyRate: Number(e.target.value) })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>入住日期 *</Label>
                <Input
                  type="date"
                  value={checkinForm.checkInDate}
                  onChange={(e) => setCheckinForm({ ...checkinForm, checkInDate: e.target.value })}
                />
              </div>
              <div>
                <Label>预计退房 *</Label>
                <Input
                  type="date"
                  value={checkinForm.checkOutDate}
                  onChange={(e) => setCheckinForm({ ...checkinForm, checkOutDate: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label>押金 (¥)</Label>
              <Input
                type="number"
                value={checkinForm.deposit}
                onChange={(e) =>
                  setCheckinForm({ ...checkinForm, deposit: Number(e.target.value) })
                }
              />
            </div>

            <div>
              <Label>自带物品</Label>
              <Input
                value={checkinForm.broughtItems}
                onChange={(e) => setCheckinForm({ ...checkinForm, broughtItems: e.target.value })}
                placeholder="例：猫粮×1袋、猫砂盆×1"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>紧急联系人电话</Label>
                <Input
                  value={checkinForm.emergencyContact}
                  onChange={(e) =>
                    setCheckinForm({ ...checkinForm, emergencyContact: e.target.value })
                  }
                  placeholder="手机号"
                  maxLength={11}
                />
              </div>
              <div>
                <Label>备注</Label>
                <Input
                  value={checkinForm.notes}
                  onChange={(e) => setCheckinForm({ ...checkinForm, notes: e.target.value })}
                  placeholder="特殊要求"
                />
              </div>
            </div>
          </div>
          <SheetFooter className="border-t px-6 py-4">
            <Button variant="outline" onClick={() => setCheckinOpen(false)}>
              取消
            </Button>
            <Button
              disabled={
                !checkinForm.customerId || !checkinForm.petId || !checkinForm.checkOutDate || saving
              }
              onClick={() => {
                setSaving(true)
                checkinMutation.mutateAsync().finally(() => setSaving(false))
              }}
            >
              {saving ? '登记中...' : '确认入住'}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}
