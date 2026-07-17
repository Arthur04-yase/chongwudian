import { useState, useRef, useEffect, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Search, Plus, ChevronRight, Clock, UserRound, ShieldAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
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

// ─── 类型 ───────────────────────
interface Customer {
  id: number
  name: string
  phone: string
  source: string | null
  petCount: number
  lastVisitDate: string | null
  totalSpent: number
}
interface Pet {
  id: number
  name: string
  species: string
  breed: string | null
  avatarUrl: string | null
  gender: string | null
  isAggressive?: boolean
}
interface Service {
  id: number
  name: string
  category: string
  sizeCategory: string
  price: number
  memberPrice: number | null
  durationMinutes: number
  commissionAmount: number
  commissionType: string
  coverImage: string | null
  description: string | null
}
interface Staff {
  id: number
  name: string
  role: string
}

const SPECIES_EMOJI: Record<string, string> = { dog: '🐕', cat: '🐈', other: '🐾' }

export default function NewBookingPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const searchRef = useRef<HTMLInputElement>(null)

  // ── 步骤状态 ──
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null)
  const [selectedServices, setSelectedServices] = useState<number[]>([])
  const [bookDate, setBookDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [bookTime, setBookTime] = useState('09:00')
  const [staffId, setStaffId] = useState<number | undefined>(undefined)
  const [source, setSource] = useState('phone')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  // ── 搜索 ──
  const [search, setSearch] = useState('')
  const [showResults, setShowResults] = useState(false)
  const { data: searchData } = useQuery({
    queryKey: ['customer-search', search],
    queryFn: async () => {
      if (search.length < 2) return []
      const res = await apiClient.get(`/api/customers?search=${search}&pageSize=6`)
      return res.data.data as Customer[]
    },
    enabled: search.length >= 2,
  })

  // ── 客户宠物 ──
  const { data: customerPets } = useQuery({
    queryKey: ['customer-pets', customer?.id],
    queryFn: async () =>
      (await apiClient.get(`/api/pets/customer/${customer!.id}`)).data.data as Pet[],
    enabled: !!customer,
  })

  // ── 服务列表 ──
  const { data: servicesData } = useQuery({
    queryKey: ['services-active'],
    queryFn: async () =>
      (await apiClient.get('/api/services?pageSize=50&isActive=true')).data.data as Service[],
  })

  // ── 美容师 ──
  const { data: staffList } = useQuery({
    queryKey: ['staff-active-groomers'],
    queryFn: async () =>
      (await apiClient.get('/api/staff?role=groomer&isActive=true&pageSize=20')).data
        .data as Staff[],
  })

  // ── 自动聚焦 ──
  useEffect(() => {
    searchRef.current?.focus()
  }, [])

  // ── URL 参数预填 ──
  useEffect(() => {
    const petId = searchParams.get('petId')
    const custId = searchParams.get('customerId')
    if (custId && petId && customerPets) {
      const pet = customerPets.find((p) => p.id === Number(petId))
      if (pet) setSelectedPet(pet)
    }
  }, [customerPets, searchParams])

  // ── 计算 ──
  const selectedServiceDetails = useMemo(() => {
    if (!servicesData) return []
    return servicesData.filter((s) => selectedServices.includes(s.id))
  }, [servicesData, selectedServices])

  const totalPrice = selectedServiceDetails.reduce((sum, s) => sum + s.price, 0)
  const totalMinutes = selectedServiceDetails.reduce((sum, s) => sum + s.durationMinutes, 0)

  // ── 按分类分组的服务 ──
  const servicesByCategory = useMemo(() => {
    if (!servicesData) return {}
    const cats: Record<string, Service[]> = {}
    for (const s of servicesData) {
      if (!cats[s.category]) cats[s.category] = []
      cats[s.category].push(s)
    }
    return cats
  }, [servicesData])

  const catLabels: Record<string, { label: string; emoji: string }> = {
    bath: { label: '洗澡', emoji: '🛁' },
    groom: { label: '美容', emoji: '✂️' },
    care: { label: '护理', emoji: '💆' },
    medicated: { label: '药浴', emoji: '💊' },
    other: { label: '其他', emoji: '📦' },
    boarding: { label: '寄养', emoji: '🏨' },
  }

  // ── 提交 ──
  const createMutation = useMutation({
    mutationFn: () =>
      apiClient.post('/api/appointments', {
        customerId: customer!.id,
        petId: selectedPet!.id,
        staffId: staffId || null,
        appointmentDate: bookDate,
        startTime: bookTime,
        source,
        notes: notes || undefined,
        items: selectedServiceDetails.map((s) => ({
          serviceId: s.id,
          price: s.price,
          commissionAmount: s.commissionAmount,
        })),
      }),
    onSuccess: (res) => {
      toast.success('预约已创建')
      navigate(`/appointments/${res.data.data.id}`)
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { error?: { message?: string } } } }
      toast.error(e?.response?.data?.error?.message || '创建失败')
    },
  })

  const canSubmit = customer && selectedPet && selectedServices.length > 0

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <h1 className="text-xl font-bold">新增预约</h1>
        <p className="text-sm text-muted-foreground">选择客户 → 宠物 → 服务 → 时间</p>
      </div>

      {/* ════ 步骤1: 找客户 ════ */}
      <Card className={cn(customer && 'border-primary/50 bg-primary-50/10')}>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Badge
              variant="default"
              className="h-5 w-5 rounded-full p-0 text-[10px] flex items-center justify-center"
            >
              1
            </Badge>
            <span className="text-sm font-semibold">{customer ? '✅ 客户已选择' : '选择客户'}</span>
          </div>

          {customer ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                  {customer.name.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold">{customer.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {customer.phone} · {customer.petCount}只宠物
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setCustomer(null)
                  setSelectedPet(null)
                }}
              >
                更换
              </Button>
            </div>
          ) : (
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                ref={searchRef}
                placeholder="输入手机号快速查找..."
                className="pl-9"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setShowResults(true)
                }}
                onFocus={() => setShowResults(true)}
                onBlur={() => setTimeout(() => setShowResults(false), 200)}
              />
              {showResults && searchData && searchData.length > 0 && (
                <div className="absolute z-20 mt-1 w-full rounded-lg border bg-card shadow-lg">
                  {searchData.map((c) => (
                    <button
                      key={c.id}
                      className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-muted transition-colors"
                      onClick={() => {
                        setCustomer(c)
                        setSearch('')
                        setShowResults(false)
                        setSelectedPet(null)
                      }}
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-xs font-bold">
                        {c.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{c.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {c.phone} · {c.petCount}只宠物 · 上次 {c.lastVisitDate || '—'}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground/30" />
                    </button>
                  ))}
                </div>
              )}
              {search.length >= 2 && searchData?.length === 0 && showResults && (
                <div className="absolute z-20 mt-1 w-full rounded-lg border bg-card p-4 text-center shadow-lg">
                  <p className="text-sm text-muted-foreground mb-2">未找到客户</p>
                  <Button size="sm" variant="outline" onClick={() => navigate('/customers')}>
                    <Plus className="mr-1 h-3 w-3" />
                    先去添加客户
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ════ 步骤2: 选宠物 + 选服务 ════ */}
      {customer && (
        <>
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Badge
                  variant="default"
                  className="h-5 w-5 rounded-full p-0 text-[10px] flex items-center justify-center"
                >
                  2
                </Badge>
                <span className="text-sm font-semibold">
                  {selectedPet ? '✅ 宠物已选择' : '选择宠物'}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {customerPets?.map((p) => (
                  <button
                    key={p.id}
                    className={cn(
                      'flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors',
                      selectedPet?.id === p.id
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'hover:bg-muted'
                    )}
                    onClick={() => setSelectedPet(p)}
                  >
                    {SPECIES_EMOJI[p.species] || '🐾'} {p.name}
                    {p.isAggressive && <ShieldAlert className="h-3 w-3 text-destructive" />}
                  </button>
                ))}
                {(!customerPets || customerPets.length === 0) && (
                  <p className="text-sm text-muted-foreground">
                    该客户还没有宠物，请先去
                    <Button
                      variant="link"
                      size="sm"
                      className="h-auto px-1 text-sm"
                      onClick={() => navigate(`/customers/${customer.id}`)}
                    >
                      添加宠物
                    </Button>
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">
                  选择服务 {selectedServices.length > 0 && `(${selectedServices.length}项)`}
                </span>
              </div>
              {Object.entries(catLabels).map(([key, cat]) => {
                const items = servicesByCategory[key]
                if (!items?.length) return null
                return (
                  <div key={key}>
                    <p className="mb-1.5 text-xs font-medium text-muted-foreground">
                      {cat.emoji} {cat.label}
                    </p>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {items.map((s) => {
                        const selected = selectedServices.includes(s.id)
                        return (
                          <button
                            key={s.id}
                            className={cn(
                              'rounded-lg border px-3 py-2.5 text-left text-sm transition-colors',
                              selected
                                ? 'border-primary bg-primary/10 ring-1 ring-primary'
                                : 'hover:bg-muted'
                            )}
                            onClick={() =>
                              setSelectedServices((prev) =>
                                prev.includes(s.id)
                                  ? prev.filter((id) => id !== s.id)
                                  : [...prev, s.id]
                              )
                            }
                          >
                            <p className="font-medium">{s.name}</p>
                            <p className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                              <span className="text-primary font-semibold">¥{s.price}</span>
                              <Clock className="h-3 w-3" />
                              {s.durationMinutes}min
                            </p>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </>
      )}

      {/* ════ 步骤3: 时间 + 美容师 ════ */}
      {selectedPet && selectedServices.length > 0 && (
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center gap-2">
              <Badge
                variant="default"
                className="h-5 w-5 rounded-full p-0 text-[10px] flex items-center justify-center"
              >
                3
              </Badge>
              <span className="text-sm font-semibold">选择时间</span>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div>
                <Label>日期 *</Label>
                <Input type="date" value={bookDate} onChange={(e) => setBookDate(e.target.value)} />
              </div>
              <div>
                <Label>时间 *</Label>
                <Select value={bookTime} onValueChange={(v) => setBookTime(v ?? '09:00')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 18 }, (_, i) => {
                      const h = Math.floor(i / 2) + 9
                      const m = i % 2 === 0 ? '00' : '30'
                      const t = `${String(h).padStart(2, '0')}:${m}`
                      return (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>来源</Label>
                <Select value={source} onValueChange={(v) => setSource(v ?? 'phone')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="phone">📞 电话</SelectItem>
                    <SelectItem value="wechat">💬 微信</SelectItem>
                    <SelectItem value="walk_in">🚶 到店</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>指派美容师</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  className={cn(
                    'rounded-lg border px-3 py-1.5 text-sm transition-colors',
                    !staffId ? 'border-primary bg-primary/10 text-primary' : 'hover:bg-muted'
                  )}
                  onClick={() => setStaffId(undefined)}
                >
                  不指定（到店分配）
                </button>
                {staffList?.map((s) => (
                  <button
                    key={s.id}
                    className={cn(
                      'rounded-lg border px-3 py-1.5 text-sm transition-colors',
                      staffId === s.id
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'hover:bg-muted'
                    )}
                    onClick={() => setStaffId(s.id)}
                  >
                    <UserRound className="mr-1 inline h-3 w-3" />
                    {s.name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label>备注</Label>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="客户特殊要求..."
              />
            </div>

            {/* 实时汇总 */}
            <div className="rounded-lg bg-muted/50 px-4 py-3 flex items-center justify-between">
              <div className="text-sm">
                <span className="text-muted-foreground">预估时长 </span>
                <span className="font-semibold">{totalMinutes} 分钟</span>
                <span className="text-muted-foreground mx-2">|</span>
                <span className="text-muted-foreground">合计 </span>
                <span className="text-lg font-bold text-primary">¥{totalPrice}</span>
              </div>
              <Button
                size="lg"
                disabled={!canSubmit || saving}
                onClick={() => {
                  setSaving(true)
                  createMutation.mutateAsync().finally(() => setSaving(false))
                }}
              >
                {saving ? '创建中...' : '✅ 确认预约'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
