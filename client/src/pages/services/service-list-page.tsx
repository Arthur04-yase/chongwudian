import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  Clock,
  Scissors,
  ShoppingBag,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Upload,
  X,
  Bath,
  Hotel,
  HeartPulse,
  Stethoscope,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { apiClient } from '@/lib/api-client'
import { formatPrice, cn } from '@/lib/utils'
import { toast } from 'sonner'

// ─── 类型 ─────────────────────────────────────
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
  isActive: boolean
  sortOrder: number
}

interface ServiceFormData {
  name: string
  category: string
  sizeCategory: string
  price: number
  memberPrice: number
  durationMinutes: number
  commissionAmount: number
  commissionType: string
  description: string
}

// ─── 常量 ─────────────────────────────────────
const CATEGORIES = [
  { value: '', label: '全部分类' },
  { value: 'bath', label: '🛁 洗澡', icon: Bath },
  { value: 'groom', label: '✂️ 美容', icon: Scissors },
  { value: 'care', label: '💆 护理', icon: HeartPulse },
  { value: 'medicated', label: '💊 药浴', icon: Stethoscope },
  { value: 'boarding', label: '🏨 寄养', icon: Hotel },
  { value: 'other', label: '📦 其他', icon: ShoppingBag },
]

const SIZE_CATEGORIES = [
  { value: 'multi', label: '通用' },
  { value: 'small', label: '小型犬' },
  { value: 'medium', label: '中型犬' },
  { value: 'large', label: '大型犬' },
  { value: 'cat', label: '猫咪' },
]

const CATEGORY_MAP: Record<string, { label: string; emoji: string; color: string }> = {
  bath: { label: '洗澡', emoji: '🛁', color: 'bg-blue-100 text-blue-700' },
  groom: { label: '美容', emoji: '✂️', color: 'bg-purple-100 text-purple-700' },
  care: { label: '护理', emoji: '💆', color: 'bg-pink-100 text-pink-700' },
  medicated: { label: '药浴', emoji: '💊', color: 'bg-red-100 text-red-700' },
  boarding: { label: '寄养', emoji: '🏨', color: 'bg-green-100 text-green-700' },
  other: { label: '其他', emoji: '📦', color: 'bg-gray-100 text-gray-700' },
}

const SIZE_MAP: Record<string, string> = {
  small: '小型犬',
  medium: '中型犬',
  large: '大型犬',
  cat: '猫咪',
  multi: '通用',
}

const emptyForm: ServiceFormData = {
  name: '',
  category: 'bath',
  sizeCategory: 'multi',
  price: 0,
  memberPrice: 0,
  durationMinutes: 45,
  commissionAmount: 0,
  commissionType: 'fixed',
  description: '',
}

// ─── API ──────────────────────────────────────
async function fetchServices(params: Record<string, string>) {
  const qs = new URLSearchParams(params).toString()
  const res = await apiClient.get(`/api/services?${qs}`)
  return res.data
}

// ─── 页面组件 ─────────────────────────────────
export default function ServiceListPage() {
  const queryClient = useQueryClient()

  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [sizeFilter, setSizeFilter] = useState('')
  const [page, setPage] = useState(1)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<ServiceFormData>(emptyForm)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [selectedIds, setSelectedIds] = useState<number[]>([])

  const queryParams: Record<string, string> = { page: String(page), pageSize: '12' }
  if (search) queryParams.search = search
  if (categoryFilter) queryParams.category = categoryFilter
  if (sizeFilter) queryParams.sizeCategory = sizeFilter

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['services', queryParams],
    queryFn: () => fetchServices(queryParams),
  })

  const services: Service[] = data?.data ?? []
  const totalPages: number = data?.pagination?.totalPages ?? 1
  const total: number = data?.pagination?.total ?? 0

  const openCreate = () => {
    setEditingId(null)
    setForm(emptyForm)
    setCoverFile(null)
    setCoverPreview('')
    setDialogOpen(true)
  }

  const openEdit = (svc: Service) => {
    setEditingId(svc.id)
    setForm({
      name: svc.name,
      category: svc.category,
      sizeCategory: svc.sizeCategory,
      price: svc.price,
      memberPrice: svc.memberPrice ?? 0,
      durationMinutes: svc.durationMinutes,
      commissionAmount: svc.commissionAmount,
      commissionType: svc.commissionType,
      description: svc.description ?? '',
    })
    setCoverFile(null)
    setCoverPreview(svc.coverImage ?? null)
    setDialogOpen(true)
  }

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      toast.error('图片不能超过 5MB')
      return
    }
    setCoverFile(file)
    setCoverPreview(URL.createObjectURL(file))
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload: Record<string, unknown> = { ...form }
      if (!payload.memberPrice) payload.memberPrice = null

      if (editingId) {
        const res = await apiClient.put(`/api/services/${editingId}`, payload)
        if (coverFile && res.data.success) {
          const fd = new FormData()
          fd.append('cover', coverFile)
          await apiClient.post(`/api/services/${editingId}/cover`, fd, {
            headers: { 'Content-Type': 'multipart/form-data' },
          })
        }
        return res.data
      } else {
        const res = await apiClient.post('/api/services', payload)
        if (coverFile && res.data.success) {
          const fd = new FormData()
          fd.append('cover', coverFile)
          await apiClient.post(`/api/services/${res.data.data.id}/cover`, fd, {
            headers: { 'Content-Type': 'multipart/form-data' },
          })
        }
        return res.data
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] })
      setDialogOpen(false)
      toast.success(editingId ? '服务已更新' : '服务已创建')
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })?.response
        ?.data?.error?.message
      toast.error(msg || '操作失败')
    },
  })

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error('请输入服务名称')
      return
    }
    setSaving(true)
    try {
      await saveMutation.mutateAsync()
    } finally {
      setSaving(false)
    }
  }

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiClient.delete(`/api/services/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] })
      setDeleteId(null)
      toast.success('服务已删除')
    },
    onError: () => toast.error('删除失败'),
  })

  const batchToggleMutation = useMutation({
    mutationFn: ({ ids, isActive }: { ids: number[]; isActive: boolean }) =>
      apiClient.patch('/api/services/batch/toggle', { ids, isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] })
      setSelectedIds([])
      toast.success('操作成功')
    },
    onError: () => toast.error('操作失败'),
  })

  const toggleSingle = (svc: Service) => {
    if (confirm(`确定${svc.isActive ? '禁用' : '启用'}「${svc.name}」？`)) {
      apiClient
        .patch('/api/services/batch/toggle', { ids: [svc.id], isActive: !svc.isActive })
        .then(() => {
          queryClient.invalidateQueries({ queryKey: ['services'] })
          toast.success(svc.isActive ? '已禁用' : '已启用')
        })
    }
  }

  return (
    <div className="space-y-4">
      {/* 标题栏 */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold">服务管理</h1>
          <p className="text-sm text-muted-foreground">管理门店服务项目与定价 · 共 {total} 项</p>
        </div>
        <div className="flex gap-2">
          {selectedIds.length > 0 && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => batchToggleMutation.mutate({ ids: selectedIds, isActive: true })}
              >
                启用 ({selectedIds.length})
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => batchToggleMutation.mutate({ ids: selectedIds, isActive: false })}
              >
                禁用 ({selectedIds.length})
              </Button>
            </>
          )}
          <Button size="sm" onClick={openCreate}>
            <Plus className="mr-1 h-4 w-4" />
            新增服务
          </Button>
        </div>
      </div>

      {/* 筛选栏 */}
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="搜索服务名称..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map((c) => (
            <Badge
              key={c.value}
              variant={categoryFilter === c.value ? 'default' : 'outline'}
              className="cursor-pointer text-xs"
              onClick={() => {
                setCategoryFilter(c.value)
                setPage(1)
              }}
            >
              {c.label}
            </Badge>
          ))}
        </div>
        <Select
          value={sizeFilter}
          onValueChange={(v) => {
            setSizeFilter(v === 'all' || v === null ? '' : v)
            setPage(1)
          }}
        >
          <SelectTrigger className="w-28">
            <SelectValue placeholder="体型" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部体型</SelectItem>
            {SIZE_CATEGORIES.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 卡片网格 */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-5 space-y-3">
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-1/2" />
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
      ) : services.length === 0 ? (
        <Card className="py-16 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
            <Scissors className="h-8 w-8 text-muted-foreground/40" />
          </div>
          <p className="text-muted-foreground">暂无服务项目</p>
          <Button size="sm" className="mt-4" onClick={openCreate}>
            <Plus className="mr-1 h-4 w-4" />
            添加第一个服务
          </Button>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {services.map((svc) => {
              const cat = CATEGORY_MAP[svc.category] || CATEGORY_MAP.other
              return (
                <Card
                  key={svc.id}
                  className={cn(
                    'group relative overflow-hidden transition-shadow hover:shadow-card-hover',
                    !svc.isActive && 'opacity-50',
                    selectedIds.includes(svc.id) && 'ring-2 ring-primary'
                  )}
                >
                  {/* 封面 */}
                  <div className="relative h-36 overflow-hidden bg-gradient-to-br from-warm-50 to-primary-50/30">
                    {svc.coverImage ? (
                      <img
                        src={svc.coverImage}
                        alt={svc.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-5xl">
                        {cat.emoji}
                      </div>
                    )}
                    <Badge
                      variant={svc.isActive ? 'default' : 'secondary'}
                      className="absolute left-2 top-2 text-[10px]"
                    >
                      {svc.isActive ? '启用' : '禁用'}
                    </Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        onClick={(e) => e.stopPropagation()}
                        className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded-md bg-white/80 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-white"
                      >
                        <MoreHorizontal className="h-3.5 w-3.5" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-36">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation()
                            openEdit(svc)
                          }}
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          编辑
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleSingle(svc)
                          }}
                        >
                          {svc.isActive ? '暂停' : '启用'}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={(e) => {
                            e.stopPropagation()
                            setDeleteId(svc.id)
                          }}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          删除
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <CardContent className="p-4">
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <h3 className="text-sm font-semibold leading-snug">{svc.name}</h3>
                      <Badge variant="secondary" className="shrink-0 text-[10px]">
                        {SIZE_MAP[svc.sizeCategory]}
                      </Badge>
                    </div>
                    <Badge className={cn('mb-2 text-[10px]', cat.color)} variant="secondary">
                      {cat.emoji} {cat.label}
                    </Badge>

                    <div className="flex items-baseline gap-2">
                      <span className="text-lg font-bold text-primary">
                        {formatPrice(svc.price)}
                      </span>
                      {svc.memberPrice != null && svc.memberPrice < svc.price && (
                        <span className="text-xs text-muted-foreground line-through">
                          {formatPrice(svc.price)}
                        </span>
                      )}
                    </div>
                    {svc.memberPrice != null && svc.memberPrice < svc.price && (
                      <p className="text-xs text-green-600 font-medium">
                        会员价 {formatPrice(svc.memberPrice)}
                      </p>
                    )}

                    <div className="mt-3 flex items-center gap-3 border-t pt-3 text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {svc.durationMinutes}分钟
                      </span>
                      <span>
                        提成{' '}
                        {svc.commissionType === 'percent'
                          ? `${svc.commissionAmount}%`
                          : `¥${svc.commissionAmount}`}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <Button
                variant="outline"
                size="icon-sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground">
                {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="icon-sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}

      {/* 新增/编辑弹窗 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? '编辑服务' : '新增服务'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>服务封面</Label>
              <div className="mt-2">
                {coverPreview ? (
                  <div className="relative inline-block w-full">
                    <img
                      src={coverPreview ?? ''}
                      alt="封面"
                      className="h-32 w-full rounded-lg object-cover"
                    />
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="absolute right-1 top-1 h-6 w-6 bg-black/50 text-white hover:bg-black/70"
                      onClick={() => {
                        setCoverFile(null)
                        setCoverPreview('')
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <label className="flex h-32 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 text-muted-foreground hover:border-primary/50 hover:text-primary">
                    <Upload className="mb-1 h-6 w-6" />
                    <span className="text-xs">上传封面图</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleCoverChange}
                    />
                  </label>
                )}
              </div>
            </div>
            <div>
              <Label htmlFor="svc-name">服务名称 *</Label>
              <Input
                id="svc-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="例：精品洗护（大型犬）"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>服务分类 *</Label>
                <Select
                  value={form.category}
                  onValueChange={(v) => setForm({ ...form, category: v ?? '' })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.filter((c) => c.value).map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>适用体型 *</Label>
                <Select
                  value={form.sizeCategory}
                  onValueChange={(v) => setForm({ ...form, sizeCategory: v ?? '' })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SIZE_CATEGORIES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>原价 (¥) *</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label>会员价 (¥)</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.memberPrice}
                  onChange={(e) => setForm({ ...form, memberPrice: Number(e.target.value) })}
                  placeholder="留空则无会员价"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>服务时长（分钟）*</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.durationMinutes}
                  onChange={(e) => setForm({ ...form, durationMinutes: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label>员工提成</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    min={0}
                    className="flex-1"
                    value={form.commissionAmount}
                    onChange={(e) => setForm({ ...form, commissionAmount: Number(e.target.value) })}
                  />
                  <Select
                    value={form.commissionType}
                    onValueChange={(v) => setForm({ ...form, commissionType: v ?? '' })}
                  >
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fixed">¥</SelectItem>
                      <SelectItem value="percent">%</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <div>
              <Label>服务说明</Label>
              <Input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="包含的项目、注意事项等"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? '保存中...' : '保存'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除确认弹窗 */}
      <Dialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            删除后不再展示，但已有预约记录不受影响。确定删除？
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              disabled={deleteMutation.isPending}
            >
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
