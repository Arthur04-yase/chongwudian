import { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
  Search,
  Plus,
  Phone,
  Calendar,
  Wallet,
  ChevronRight,
  PawPrint,
  UserRound,
} from 'lucide-react'
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
import { Skeleton } from '@/components/ui/skeleton'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet'
import { apiClient } from '@/lib/api-client'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

// ─── 类型 ──────────────────────────────
interface Customer {
  id: number
  name: string
  phone: string
  source: string | null
  totalSpent: number
  lastVisitDate: string | null
  visitCount: number
  petCount: number
  isMember: boolean
  createdAt: string
}

interface CustomerFormData {
  name: string
  phone: string
  wechatId: string
  address: string
  source: string
  notes: string
}

const SOURCES = ['朋友介绍', '大众点评', '路过', '抖音', '其他']
const emptyForm: CustomerFormData = {
  name: '',
  phone: '',
  wechatId: '',
  address: '',
  source: '',
  notes: '',
}

async function fetchCustomers(params: Record<string, string>) {
  return (await apiClient.get(`/api/customers?${new URLSearchParams(params)}`)).data
}

export default function CustomerListPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const inputRef = useRef<HTMLInputElement>(null)

  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  // Sheet
  const [sheetOpen, setSheetOpen] = useState(false)
  const [form, setForm] = useState<CustomerFormData>(emptyForm)
  const [saving, setSaving] = useState(false)

  // 自动聚焦搜索框
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const queryParams: Record<string, string> = { page: String(page), pageSize: '24' }
  if (search) queryParams.search = search

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['customers', queryParams],
    queryFn: () => fetchCustomers(queryParams),
  })

  const customers: Customer[] = data?.data ?? []
  const total = data?.pagination?.total ?? 0

  // ── 新增客户 ──
  const createMutation = useMutation({
    mutationFn: () =>
      apiClient.post('/api/customers', {
        ...form,
        wechatId: form.wechatId || undefined,
        address: form.address || undefined,
        source: form.source || undefined,
        notes: form.notes || undefined,
      }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      setSheetOpen(false)
      toast.success('客户已创建')
      // 直接跳转到新客户详情
      navigate(`/customers/${res.data.data.id}`)
    },
    onError: (err: unknown) => {
      toast.error(
        (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error
          ?.message || '创建失败'
      )
    },
  })

  const handleSave = () => {
    if (!form.name.trim()) {
      toast.error('请输入姓名')
      return
    }
    if (!/^1[3-9]\d{9}$/.test(form.phone)) {
      toast.error('手机号格式不正确')
      return
    }
    setSaving(true)
    createMutation.mutateAsync().finally(() => setSaving(false))
  }

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      {/* ── 标题 ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold">客户管理</h1>
          <p className="text-sm text-muted-foreground">{total} 位客户</p>
        </div>
        <Button
          size="sm"
          onClick={() => {
            setForm(emptyForm)
            setSheetOpen(true)
          }}
        >
          <Plus className="mr-1 h-4 w-4" />
          添加客户
        </Button>
      </div>

      {/* ── 搜索栏 — 前台最核心的操作区 ── */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={inputRef}
          placeholder="输入手机号或姓名快速查找..."
          className="h-12 pl-11 text-base shadow-sm"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(1)
          }}
        />
      </div>

      {/* ── 内容 ── */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="flex items-center gap-4 p-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : isError ? (
        <Card className="py-12 text-center">
          <p className="text-muted-foreground">加载失败</p>
          <Button variant="outline" size="sm" className="mt-2" onClick={() => refetch()}>
            重试
          </Button>
        </Card>
      ) : customers.length === 0 ? (
        <Card className="py-16 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
            <UserRound className="h-8 w-8 text-muted-foreground/40" />
          </div>
          <p className="font-medium text-muted-foreground">
            {search ? '未找到匹配的客户' : '还没有添加客户'}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {search ? '试试搜索手机号的其他位数' : '点击"添加客户"录入第一位主人吧'}
          </p>
          {!search && (
            <Button
              size="sm"
              className="mt-4"
              onClick={() => {
                setForm(emptyForm)
                setSheetOpen(true)
              }}
            >
              <Plus className="mr-1 h-4 w-4" />
              添加客户
            </Button>
          )}
        </Card>
      ) : (
        <div className="space-y-2">
          {/* ── 客户列表 — 类似聊天列表风格，前台最熟悉 ── */}
          {customers.map((c) => (
            <Card
              key={c.id}
              className="cursor-pointer transition-shadow hover:shadow-card-hover"
              onClick={() => navigate(`/customers/${c.id}`)}
            >
              <CardContent className="flex items-center gap-4 p-4">
                {/* 头像 */}
                <div
                  className={cn(
                    'flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-lg font-bold',
                    c.isMember
                      ? 'bg-amber-100 text-amber-700 ring-2 ring-amber-300'
                      : 'bg-muted text-muted-foreground'
                  )}
                >
                  {c.name.charAt(0)}
                </div>

                {/* 信息主体 */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-semibold">{c.name}</span>
                    {c.petCount > 0 && (
                      <Badge variant="secondary" className="shrink-0 gap-0.5 text-[10px]">
                        <PawPrint className="h-3 w-3" />
                        {c.petCount}只
                      </Badge>
                    )}
                    {c.isMember && (
                      <Badge className="shrink-0 bg-amber-100 text-amber-700 text-[10px]">
                        会员
                      </Badge>
                    )}
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {c.phone}
                    </span>
                    {c.lastVisitDate && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {c.lastVisitDate}
                      </span>
                    )}
                    {c.totalSpent > 0 && (
                      <span className="flex items-center gap-1">
                        <Wallet className="h-3 w-3" />¥{c.totalSpent.toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>

                <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground/40" />
              </CardContent>
            </Card>
          ))}

          {/* ── 简版分页 ── */}
          {total > 24 && (
            <div className="flex justify-center gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                上一页
              </Button>
              <span className="flex items-center text-sm text-muted-foreground">
                {page}/{Math.ceil(total / 24)}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page * 24 >= total}
                onClick={() => setPage((p) => p + 1)}
              >
                下一页
              </Button>
            </div>
          )}
        </div>
      )}

      {/* ── 新增客户 Sheet ── */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-full max-w-md overflow-y-auto p-0">
          <SheetHeader className="border-b px-6 py-4">
            <SheetTitle>添加客户</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 px-6 py-4">
            <div>
              <Label>姓名 *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="例：张先生"
                autoFocus
              />
            </div>
            <div>
              <Label>手机号 *</Label>
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="11位手机号"
                maxLength={11}
              />
              <p className="mt-1 text-[11px] text-muted-foreground">
                手机号是客户的唯一标识，用于搜索和预约
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>微信号</Label>
                <Input
                  value={form.wechatId}
                  onChange={(e) => setForm({ ...form, wechatId: e.target.value })}
                  placeholder="选填"
                />
              </div>
              <div>
                <Label>来源渠道</Label>
                <Select
                  value={form.source}
                  onValueChange={(v) => setForm({ ...form, source: v ?? '' })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择渠道" />
                  </SelectTrigger>
                  <SelectContent>
                    {SOURCES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>地址</Label>
              <Input
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="选填"
              />
            </div>
            <div>
              <Label>备注</Label>
              <Input
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="选填"
              />
            </div>
          </div>
          <SheetFooter className="border-t px-6 py-4">
            <Button variant="outline" onClick={() => setSheetOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? '保存中...' : '添加客户'}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}
