import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Search,
  Plus,
  Pencil,
  UserRound,
  Crown,
  Scissors,
  Headphones,
  Phone,
  Calendar,
  ShieldCheck,
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
import { Separator } from '@/components/ui/separator'
import { apiClient } from '@/lib/api-client'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

// ─── 类型 ─────────────────────────────────
interface Staff {
  id: number
  name: string
  phone: string
  role: string
  avatarUrl: string | null
  commissionType: string | null
  commissionValue: number | null
  isActive: boolean
  hiredDate: string | null
  createdAt: string
}

interface StaffFormData {
  name: string
  phone: string
  password: string
  role: string
  commissionType: string
  commissionValue: number
  hiredDate: string
}

// ─── 常量 ─────────────────────────────────
const ROLE_MAP: Record<
  string,
  { label: string; icon: typeof UserRound; color: string; bg: string }
> = {
  owner: { label: '老板', icon: Crown, color: 'text-amber-600', bg: 'bg-amber-50' },
  groomer: { label: '美容师', icon: Scissors, color: 'text-blue-600', bg: 'bg-blue-50' },
  receptionist: { label: '前台', icon: Headphones, color: 'text-emerald-600', bg: 'bg-emerald-50' },
}

const ROLE_FILTERS = [
  { value: '', label: '全部', icon: UserRound },
  { value: 'owner', label: '老板', icon: Crown },
  { value: 'groomer', label: '美容师', icon: Scissors },
  { value: 'receptionist', label: '前台', icon: Headphones },
]

const emptyForm: StaffFormData = {
  name: '',
  phone: '',
  password: '',
  role: 'groomer',
  commissionType: 'fixed',
  commissionValue: 0,
  hiredDate: '',
}

async function fetchStaff(params: Record<string, string>) {
  const qs = new URLSearchParams(params).toString()
  return (await apiClient.get(`/api/staff?${qs}`)).data
}

// ─── 页面 ─────────────────────────────────
export default function StaffListPage() {
  const queryClient = useQueryClient()

  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')

  // Sheet
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<StaffFormData>(emptyForm)
  const [saving, setSaving] = useState(false)

  const queryParams: Record<string, string> = { page: '1', pageSize: '20' }
  if (search) queryParams.search = search
  if (roleFilter) queryParams.role = roleFilter

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['staff', queryParams],
    queryFn: () => fetchStaff(queryParams),
  })

  const staffList: Staff[] = data?.data ?? []

  // ── 打开新增 ──
  const openCreate = () => {
    setEditingId(null)
    setForm(emptyForm)
    setSheetOpen(true)
  }

  // ── 打开编辑 ──
  const openEdit = (s: Staff) => {
    setEditingId(s.id)
    setForm({
      name: s.name,
      phone: s.phone,
      password: '',
      role: s.role,
      commissionType: s.commissionType ?? 'fixed',
      commissionValue: s.commissionValue ?? 0,
      hiredDate: s.hiredDate ?? '',
    })
    setSheetOpen(true)
  }

  // ── 保存 ──
  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload: Record<string, unknown> = {
        name: form.name,
        phone: form.phone,
        role: form.role,
        commissionType: form.commissionType,
        commissionValue: form.commissionValue,
        hiredDate: form.hiredDate || null,
      }
      if (form.password) (payload as Record<string, unknown>).password = form.password

      return editingId
        ? (await apiClient.put(`/api/staff/${editingId}`, payload)).data
        : (await apiClient.post('/api/staff', payload)).data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] })
      setSheetOpen(false)
      toast.success(editingId ? '员工信息已更新' : '新员工已创建')
    },
    onError: (err: unknown) => {
      toast.error(
        (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error
          ?.message || '操作失败'
      )
    },
  })

  const handleSave = () => {
    if (!form.name.trim()) {
      toast.error('请输入姓名')
      return
    }
    if (!editingId && !form.password) {
      toast.error('请设置初始密码')
      return
    }
    if (!editingId && form.password.length < 6) {
      toast.error('密码至少6位')
      return
    }
    setSaving(true)
    saveMutation.mutateAsync().finally(() => setSaving(false))
  }

  // ── 切换启用状态 ──
  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      apiClient.patch(`/api/staff/${id}/toggle`, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] })
      toast.success('状态已更新')
    },
    onError: () => toast.error('操作失败'),
  })

  const handleToggle = (s: Staff) => {
    const label = s.isActive ? '停用' : '恢复'
    if (confirm(`确定${label}「${s.name}」？停用后该员工将无法登录系统。`)) {
      toggleMutation.mutate({ id: s.id, isActive: !s.isActive })
    }
  }

  // ── 统计 ──
  const activeCount = staffList.filter((s) => s.isActive).length
  const categories = (['groomer', 'receptionist'] as const).map((role) => {
    const list = staffList.filter((s) => s.role === role && s.isActive)
    return { role, list, label: ROLE_MAP[role].label, Icon: ROLE_MAP[role].icon }
  })

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* ── 标题 ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold">员工管理</h1>
          <p className="text-sm text-muted-foreground">{activeCount} 人在岗</p>
        </div>
        <Button size="sm" onClick={openCreate}>
          <Plus className="mr-1 h-4 w-4" />
          添加员工
        </Button>
      </div>

      {/* ── 在岗概览 — 仅老板看 ── */}
      {staffList.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Card className="bg-muted/30">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <UserRound className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{activeCount}</p>
                <p className="text-xs text-muted-foreground">在岗员工</p>
              </div>
            </CardContent>
          </Card>
          {categories.map((c) => (
            <Card key={c.role} className="bg-muted/30">
              <CardContent className="flex items-center gap-3 p-4">
                <div
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-xl',
                    ROLE_MAP[c.role].bg
                  )}
                >
                  <c.Icon className={cn('h-5 w-5', ROLE_MAP[c.role].color)} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{c.list.length}</p>
                  <p className="text-xs text-muted-foreground">在岗{c.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ── 搜索 + 筛选 ── */}
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="搜索姓名或手机号..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-1.5">
          {ROLE_FILTERS.map((r) => (
            <Badge
              key={r.value}
              variant={roleFilter === r.value ? 'default' : 'outline'}
              className="cursor-pointer text-xs"
              onClick={() => setRoleFilter(r.value)}
            >
              <r.icon className="mr-1 h-3 w-3" />
              {r.label}
            </Badge>
          ))}
        </div>
      </div>

      {/* ── 员工卡片 ── */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-5 space-y-3">
                <Skeleton className="h-12 w-12 rounded-full" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-1/2" />
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
      ) : staffList.length === 0 ? (
        <Card className="py-16 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
            <UserRound className="h-8 w-8 text-muted-foreground/40" />
          </div>
          <p className="text-muted-foreground">
            {search || roleFilter ? '未找到匹配的员工' : '还没有添加员工'}
          </p>
          {!search && !roleFilter && (
            <Button size="sm" className="mt-4" onClick={openCreate}>
              <Plus className="mr-1 h-4 w-4" />
              添加第一位员工
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {staffList.map((s) => {
            const role = ROLE_MAP[s.role] || ROLE_MAP.receptionist
            const RoleIcon = role.icon
            const commissionLabel =
              s.commissionType === 'percent'
                ? `${s.commissionValue}%/单`
                : s.commissionValue
                  ? `¥${s.commissionValue}/单`
                  : '无提成'

            return (
              <Card
                key={s.id}
                className={cn(
                  'group transition-shadow hover:shadow-card-hover',
                  !s.isActive && 'opacity-50 grayscale'
                )}
              >
                <CardContent className="p-5">
                  {/* ── 头像 + 身份 ── */}
                  <div className="mb-4 flex items-start gap-3">
                    <div
                      className={cn(
                        'flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-lg font-bold',
                        role.bg,
                        role.color
                      )}
                    >
                      {s.name.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="truncate text-base font-semibold">{s.name}</h3>
                        {!s.isActive && (
                          <Badge variant="secondary" className="text-[10px]">
                            已停用
                          </Badge>
                        )}
                      </div>
                      <Badge variant="outline" className={cn('mt-1 gap-1 text-[10px]', role.color)}>
                        <RoleIcon className="h-3 w-3" />
                        {role.label}
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                      onClick={() => openEdit(s)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  </div>

                  <Separator className="mb-4" />

                  {/* ── 信息行 ── */}
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="h-3.5 w-3.5 shrink-0" />
                      <span>{s.phone}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
                      <span>{commissionLabel}</span>
                    </div>
                    {s.hiredDate && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5 shrink-0" />
                        <span>{s.hiredDate} 入职</span>
                      </div>
                    )}
                  </div>

                  {/* ── 停用/恢复按钮 ── */}
                  <div className="mt-4">
                    <Button
                      variant={s.isActive ? 'outline' : 'default'}
                      size="sm"
                      className="w-full text-xs"
                      onClick={() => handleToggle(s)}
                    >
                      {s.isActive ? '停用账号' : '恢复账号'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* ── 侧边抽屉表单 ── */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-full max-w-md overflow-y-auto p-0">
          <SheetHeader className="border-b px-6 py-4">
            <SheetTitle>{editingId ? '编辑员工' : '添加员工'}</SheetTitle>
          </SheetHeader>

          <div className="space-y-4 px-6 py-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>姓名 *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="例：小王"
                />
              </div>
              <div>
                <Label>角色 *</Label>
                <Select
                  value={form.role}
                  onValueChange={(v) => setForm({ ...form, role: v ?? 'groomer' })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="groomer">✂️ 美容师</SelectItem>
                    <SelectItem value="receptionist">📞 前台</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>手机号 *</Label>
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="11位手机号"
                maxLength={11}
              />
            </div>

            {!editingId && (
              <div>
                <Label>初始密码 *</Label>
                <Input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="至少6位"
                />
                <p className="mt-1 text-[11px] text-muted-foreground">员工首次登录可使用此密码</p>
              </div>
            )}

            <Separator />

            <div>
              <Label className="text-xs text-muted-foreground">提成设置</Label>
              <div className="mt-2 flex gap-2">
                <Input
                  type="number"
                  min={0}
                  className="flex-1"
                  value={form.commissionValue}
                  onChange={(e) => setForm({ ...form, commissionValue: Number(e.target.value) })}
                />
                <Select
                  value={form.commissionType}
                  onValueChange={(v) => setForm({ ...form, commissionType: v ?? 'fixed' })}
                >
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed">¥ 固定</SelectItem>
                    <SelectItem value="percent">% 比例</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">
                {form.commissionType === 'percent'
                  ? `每单按服务收入的 ${form.commissionValue}% 提成`
                  : `每单固定提成 ¥${form.commissionValue}`}
              </p>
            </div>

            <div>
              <Label>入职日期</Label>
              <Input
                type="date"
                value={form.hiredDate}
                onChange={(e) => setForm({ ...form, hiredDate: e.target.value })}
              />
            </div>
          </div>

          <SheetFooter className="border-t px-6 py-4">
            <Button variant="outline" onClick={() => setSheetOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? '保存中...' : '保存'}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}
