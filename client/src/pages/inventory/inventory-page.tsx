import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Search,
  Plus,
  Package,
  AlertTriangle,
  ArrowDownToLine,
  ArrowUpToLine,
  Clock,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
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
import { formatPrice, cn } from '@/lib/utils'
import { toast } from 'sonner'

interface Product {
  id: number
  name: string
  category: string
  unit: string
  currentStock: number
  safetyStock: number
  costPrice: number
  retailPrice: number
  isActive: boolean
  isLowStock: boolean
}

interface InventoryLog {
  id: number
  type: string
  quantity: number
  notes: string | null
  createdAt: string
  staff: { id: number; name: string }
}

const CATEGORIES = [
  { value: '', label: '全部' },
  { value: 'consumable', label: '🧴 耗材' },
  { value: 'retail', label: '🛒 零售' },
  { value: 'food', label: '🍖 食品' },
  { value: 'other', label: '📦 其他' },
]

const CAT_LABELS: Record<string, string> = {
  consumable: '耗材',
  retail: '零售',
  food: '食品',
  other: '其他',
}

const LOG_TYPE_LABELS: Record<string, { label: string; emoji: string }> = {
  in: { label: '入库', emoji: '📥' },
  out: { label: '出库', emoji: '📤' },
  loss: { label: '报损', emoji: '🗑️' },
}

const emptyProduct = {
  name: '',
  category: 'consumable',
  unit: '个',
  currentStock: 0,
  safetyStock: 5,
  costPrice: 0,
  retailPrice: 0,
}

export default function InventoryPage() {
  const queryClient = useQueryClient()

  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')

  // 产品 Sheet
  const [productSheet, setProductSheet] = useState(false)
  const [productForm, setProductForm] = useState(emptyProduct)
  const [saving, setSaving] = useState(false)

  // 出入库 Sheet
  const [stockSheet, setStockSheet] = useState(false)
  const [stockProductId, setStockProductId] = useState<number | null>(null)
  const [stockType, setStockType] = useState('in')
  const [stockQuantity, setStockQuantity] = useState(1)
  const [stockNotes, setStockNotes] = useState('')

  // 日志 Sheet
  const [logSheet, setLogSheet] = useState(false)
  const [logProductId, setLogProductId] = useState<number | null>(null)
  const [logProductName, setLogProductName] = useState('')

  // 查询
  const queryParams: Record<string, string> = {}
  if (search) queryParams.search = search
  if (categoryFilter) queryParams.category = categoryFilter

  const {
    data: products,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['inventory', queryParams],
    queryFn: async () => {
      const qs = new URLSearchParams(queryParams).toString()
      return (await apiClient.get(`/api/inventory?${qs}`)).data.data as Product[]
    },
  })

  // 流水查询
  const { data: logs } = useQuery({
    queryKey: ['inventory-logs', logProductId],
    queryFn: async () =>
      (await apiClient.get(`/api/inventory/${logProductId}/logs`)).data.data as InventoryLog[],
    enabled: !!logProductId && logSheet,
  })

  // 新增/编辑产品
  const saveProductMutation = useMutation({
    mutationFn: () => apiClient.post('/api/inventory', productForm),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
      setProductSheet(false)
      toast.success('已添加')
    },
    onError: () => toast.error('保存失败'),
  })

  const stockMutation = useMutation({
    mutationFn: () =>
      apiClient.post(`/api/inventory/${stockProductId}/log`, {
        type: stockType,
        quantity: stockQuantity,
        notes: stockNotes || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
      queryClient.invalidateQueries({ queryKey: ['inventory-logs'] })
      setStockSheet(false)
      toast.success('操作成功')
    },
    onError: (err: unknown) =>
      toast.error((err as any)?.response?.data?.error?.message || '操作失败'),
  })

  const openStock = (p: Product, type: string) => {
    setStockProductId(p.id)
    setStockType(type)
    setStockQuantity(1)
    setStockNotes('')
    setStockSheet(true)
  }

  const openLogs = (p: Product) => {
    setLogProductId(p.id)
    setLogProductName(p.name)
    setLogSheet(true)
  }

  const lowStockCount = products?.filter((p) => p.isLowStock).length || 0

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold">库存管理</h1>
          <p className="text-sm text-muted-foreground">
            {products?.length || '—'} 种商品
            {lowStockCount > 0 && (
              <span className="ml-2 text-destructive font-medium">· {lowStockCount} 种低库存</span>
            )}
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => {
            setProductForm(emptyProduct)
            setProductSheet(true)
          }}
        >
          <Plus className="mr-1 h-4 w-4" />
          添加商品
        </Button>
      </div>

      {/* 搜索 */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="搜索商品名称..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-1.5">
          {CATEGORIES.map((c) => (
            <Badge
              key={c.value}
              variant={categoryFilter === c.value ? 'default' : 'outline'}
              className="cursor-pointer text-xs"
              onClick={() => setCategoryFilter(c.value)}
            >
              {c.label}
            </Badge>
          ))}
        </div>
      </div>

      {/* 库存表格 */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-lg" />
          ))}
        </div>
      ) : isError ? (
        <Card className="py-12 text-center">
          <p className="text-muted-foreground">加载失败</p>
          <Button variant="outline" size="sm" className="mt-2" onClick={() => refetch()}>
            重试
          </Button>
        </Card>
      ) : !products?.length ? (
        <Card className="py-16 text-center">
          <Package className="mx-auto h-12 w-12 text-muted-foreground/30" />
          <p className="mt-4 text-muted-foreground">
            {search || categoryFilter ? '未找到匹配的商品' : '还没有添加商品'}
          </p>
          {!search && !categoryFilter && (
            <Button
              size="sm"
              className="mt-4"
              onClick={() => {
                setProductForm(emptyProduct)
                setProductSheet(true)
              }}
            >
              <Plus className="mr-1 h-4 w-4" />
              添加商品
            </Button>
          )}
        </Card>
      ) : (
        <Card className="overflow-hidden">
          {/* 表头 */}
          <div className="hidden sm:flex items-center gap-3 bg-muted/30 px-4 py-2.5 text-xs font-semibold text-muted-foreground">
            <span className="flex-1">商品</span>
            <span className="w-16 text-right">库存</span>
            <span className="w-20 text-right">成本</span>
            <span className="w-20 text-right">零售价</span>
            <span className="w-24 text-center">操作</span>
          </div>
          <div className="divide-y">
            {products.map((p) => (
              <div
                key={p.id}
                className={cn(
                  'flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 px-4 py-3 transition-colors hover:bg-muted/20',
                  p.isLowStock && 'bg-red-50/50'
                )}
              >
                {/* 商品信息 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold truncate">{p.name}</span>
                    {p.isLowStock && (
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-destructive" />
                    )}
                    <Badge variant="secondary" className="text-[10px] shrink-0">
                      {p.unit}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {CAT_LABELS[p.category] || p.category}
                    <span className="ml-2">安全库存：{p.safetyStock}</span>
                  </p>
                </div>
                {/* 库存量 */}
                <div className="flex sm:hidden items-center gap-2 text-xs text-muted-foreground">
                  <span>库存：</span>
                  <span
                    className={cn(
                      'font-bold text-sm',
                      p.isLowStock ? 'text-destructive' : 'text-foreground'
                    )}
                  >
                    {p.currentStock}
                  </span>
                </div>
                {/* 桌面端数值列 */}
                <span
                  className={cn(
                    'hidden sm:block w-16 text-right text-sm font-bold',
                    p.isLowStock ? 'text-destructive' : ''
                  )}
                >
                  {p.currentStock}
                </span>
                <span className="hidden sm:block w-20 text-right text-sm text-muted-foreground">
                  {formatPrice(p.costPrice)}
                </span>
                <span className="hidden sm:block w-20 text-right text-sm font-medium">
                  {formatPrice(p.retailPrice)}
                </span>
                {/* 操作按钮 */}
                <div className="flex items-center gap-1 sm:w-24 sm:justify-center">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    title="入库"
                    onClick={() => openStock(p, 'in')}
                  >
                    <ArrowDownToLine className="h-3.5 w-3.5 text-green-600" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    title="出库"
                    onClick={() => openStock(p, 'out')}
                  >
                    <ArrowUpToLine className="h-3.5 w-3.5 text-amber-600" />
                  </Button>
                  <Button variant="ghost" size="icon-sm" title="流水" onClick={() => openLogs(p)}>
                    <Clock className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* 新增/编辑产品 Sheet */}
      <Sheet open={productSheet} onOpenChange={setProductSheet}>
        <SheetContent side="right" className="w-full max-w-sm overflow-y-auto p-0">
          <SheetHeader className="border-b px-6 py-4">
            <SheetTitle>添加商品</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 px-6 py-4">
            <div>
              <Label>名称 *</Label>
              <Input
                value={productForm.name}
                onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                placeholder="例：宠物专用浴液"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>分类</Label>
                <Select
                  value={productForm.category}
                  onValueChange={(v) =>
                    setProductForm({ ...productForm, category: v ?? 'consumable' })
                  }
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
                <Label>单位</Label>
                <Select
                  value={productForm.unit}
                  onValueChange={(v) => setProductForm({ ...productForm, unit: v ?? '个' })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="个">个</SelectItem>
                    <SelectItem value="瓶">瓶</SelectItem>
                    <SelectItem value="袋">袋</SelectItem>
                    <SelectItem value="包">包</SelectItem>
                    <SelectItem value="条">条</SelectItem>
                    <SelectItem value="ml">ml</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>当前库存</Label>
                <Input
                  type="number"
                  value={productForm.currentStock}
                  onChange={(e) =>
                    setProductForm({ ...productForm, currentStock: Number(e.target.value) })
                  }
                />
              </div>
              <div>
                <Label>安全库存</Label>
                <Input
                  type="number"
                  value={productForm.safetyStock}
                  onChange={(e) =>
                    setProductForm({ ...productForm, safetyStock: Number(e.target.value) })
                  }
                />
                <p className="text-[10px] text-muted-foreground mt-0.5">低于此数量将预警</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>成本价 (¥)</Label>
                <Input
                  type="number"
                  value={productForm.costPrice}
                  onChange={(e) =>
                    setProductForm({ ...productForm, costPrice: Number(e.target.value) })
                  }
                />
              </div>
              <div>
                <Label>零售价 (¥)</Label>
                <Input
                  type="number"
                  value={productForm.retailPrice}
                  onChange={(e) =>
                    setProductForm({ ...productForm, retailPrice: Number(e.target.value) })
                  }
                />
              </div>
            </div>
          </div>
          <SheetFooter className="border-t px-6 py-4">
            <Button variant="outline" onClick={() => setProductSheet(false)}>
              取消
            </Button>
            <Button
              onClick={() => {
                setSaving(true)
                saveProductMutation.mutateAsync().finally(() => setSaving(false))
              }}
              disabled={saving || !productForm.name.trim()}
            >
              {saving ? '保存中...' : '保存'}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* 出入库 Sheet */}
      <Sheet open={stockSheet} onOpenChange={setStockSheet}>
        <SheetContent side="right" className="w-full max-w-sm overflow-y-auto p-0">
          <SheetHeader className="border-b px-6 py-4">
            <SheetTitle>
              {stockType === 'in' ? '📥 入库' : stockType === 'out' ? '📤 出库' : '🗑️ 报损'}
            </SheetTitle>
          </SheetHeader>
          <div className="space-y-4 px-6 py-4">
            <div>
              <Label>数量 *</Label>
              <Input
                type="number"
                min={1}
                value={stockQuantity}
                onChange={(e) => setStockQuantity(Number(e.target.value))}
              />
            </div>
            <div>
              <Label>备注</Label>
              <Input
                value={stockNotes}
                onChange={(e) => setStockNotes(e.target.value)}
                placeholder={
                  stockType === 'in'
                    ? '例：进货补货'
                    : stockType === 'out'
                      ? '例：服务消耗'
                      : '例：过期报废'
                }
              />
            </div>
          </div>
          <SheetFooter className="border-t px-6 py-4">
            <Button variant="outline" onClick={() => setStockSheet(false)}>
              取消
            </Button>
            <Button
              onClick={() => {
                setSaving(true)
                stockMutation.mutateAsync().finally(() => setSaving(false))
              }}
              disabled={saving || stockQuantity < 1}
            >
              {stockType === 'in' ? '确认入库' : stockType === 'out' ? '确认出库' : '确认报损'}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* 流水日志 Sheet */}
      <Sheet open={logSheet} onOpenChange={setLogSheet}>
        <SheetContent side="right" className="w-full max-w-sm overflow-y-auto p-0">
          <SheetHeader className="border-b px-6 py-4">
            <SheetTitle>📋 {logProductName} 出入库记录</SheetTitle>
          </SheetHeader>
          <div className="px-6 py-4">
            {!logs?.length ? (
              <p className="py-8 text-center text-sm text-muted-foreground">暂无记录</p>
            ) : (
              <div className="space-y-2">
                {logs.map((log) => {
                  const lt = LOG_TYPE_LABELS[log.type] || LOG_TYPE_LABELS.in
                  return (
                    <div
                      key={log.id}
                      className="flex items-center gap-3 rounded-lg border p-3 text-sm"
                    >
                      <span className="text-lg shrink-0">{lt.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-[10px]">
                            {lt.label}
                          </Badge>
                          <span
                            className={cn(
                              'font-bold',
                              log.type === 'in' ? 'text-green-600' : 'text-amber-600'
                            )}
                          >
                            {log.type === 'in' ? '+' : '-'}
                            {log.quantity}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {log.staff.name} ·{' '}
                          {new Date(log.createdAt).toLocaleString('zh-CN', {
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                        {log.notes && (
                          <p className="text-xs text-muted-foreground mt-0.5">{log.notes}</p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
