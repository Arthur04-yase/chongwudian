import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  PawPrint,
  Phone,
  Calendar,
  Scissors,
  Trash2,
  Pencil,
  Syringe,
  ShieldAlert,
  ShieldCheck,
  VenusAndMars,
  Weight,
  Palette,
  Stethoscope,
  Heart,
  Star,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet'
import { apiClient } from '@/lib/api-client'
import { cn } from '@/lib/utils'

function shortDate(d: string) {
  return new Date(d).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })
}
import { toast } from 'sonner'

// ─── 类型 ─────────────────────────
interface PetProfile {
  id: number
  customerId: number
  name: string
  species: string
  breed: string | null
  gender: string | null
  isNeutered: boolean
  birthDate: string | null
  weightKg: number | null
  color: string | null
  vaccineExpiry: string | null
  avatarUrl: string | null
  coverImage: string | null
  isAggressive: boolean
  isActive: boolean
  age: string | null
  customer: { id: number; name: string; phone: string; avatarUrl: string | null }
  petNotes: {
    id: number
    category: string
    content: string
    createdAt: string
    staff: { id: number; name: string }
  }[]
  appointments: {
    id: number
    appointmentDate: string
    startTime: string
    status: string
    appointmentNo: string
    appointmentItems: { service: { id: number; name: string; category: string } }[]
    assignedStaff: { id: number; name: string } | null
  }[]
}

interface PetFormData {
  name: string
  species: string
  breed: string
  gender: string
  isNeutered: boolean
  birthDate: string
  weightKg: string
  color: string
  vaccineExpiry: string
  isAggressive: boolean
}

// ─── 常量 ─────────────────────────
const SPECIES: Record<string, string> = { dog: '🐕 狗狗', cat: '🐈 猫咪', other: '🐾 其他' }
const GENDERS: Record<string, string> = { male: '♂ 公', female: '♀ 母' }
const NOTE_CATEGORIES: Record<string, { label: string; icon: typeof Star; color: string }> = {
  behavior: { label: '行为', icon: ShieldAlert, color: 'bg-yellow-100 text-yellow-700' },
  health: { label: '健康', icon: Stethoscope, color: 'bg-red-100 text-red-700' },
  preference: { label: '偏好', icon: Heart, color: 'bg-pink-100 text-pink-700' },
  other: { label: '其他', icon: Star, color: 'bg-gray-100 text-gray-700' },
}

const STATUS_LABELS: Record<string, string> = {
  pending: '待确认',
  arrived: '已到店',
  in_progress: '进行中',
  completed: '已完成',
  picked_up: '已取走',
  cancelled: '已取消',
  no_show: '未到店',
}

// ─── API ─────────────────────────
async function fetchPet(id: string) {
  const res = await apiClient.get(`/api/pets/${id}`)
  return res.data.data as PetProfile
}

// ─── 子组件 ───────────────────────
function NoteCard({ note, onDelete }: { note: PetProfile['petNotes'][0]; onDelete: () => void }) {
  const cat = NOTE_CATEGORIES[note.category] || NOTE_CATEGORIES.other
  const Icon = cat.icon
  return (
    <div className="flex gap-3 rounded-lg border bg-card p-3 text-sm">
      <Badge className={cn('mt-0.5 shrink-0 gap-1 text-[10px]', cat.color)} variant="secondary">
        <Icon className="h-3 w-3" />
        {cat.label}
      </Badge>
      <div className="min-w-0 flex-1">
        <p className="whitespace-pre-wrap text-sm">{note.content}</p>
        <p className="mt-1 text-[11px] text-muted-foreground">
          {note.staff.name} · {shortDate(note.createdAt)}
        </p>
      </div>
      <Button
        variant="ghost"
        size="icon-sm"
        className="shrink-0 text-muted-foreground hover:text-destructive"
        onClick={onDelete}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  )
}

// ─── 页面 ─────────────────────────
export default function PetProfilePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [noteForm, setNoteForm] = useState({ category: 'behavior', content: '' })
  const [editOpen, setEditOpen] = useState(false)
  const [editForm, setEditForm] = useState<PetFormData>({} as PetFormData)
  const [saving, setSaving] = useState(false)

  const {
    data: pet,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['pet', id],
    queryFn: () => fetchPet(id!),
    enabled: !!id,
  })

  // 添加备注
  const addNoteMutation = useMutation({
    mutationFn: () => apiClient.post(`/api/pets/${id}/notes`, noteForm),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pet', id] })
      setNoteForm({ category: 'behavior', content: '' })
    },
    onError: () => toast.error('添加失败'),
  })

  // 删除备注
  const deleteNoteMutation = useMutation({
    mutationFn: (noteId: number) => apiClient.delete(`/api/pets/${id}/notes/${noteId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['pet', id] }),
    onError: () => toast.error('删除失败'),
  })

  // 编辑宠物
  const openEdit = () => {
    if (!pet) return
    setEditForm({
      name: pet.name,
      species: pet.species,
      breed: pet.breed || '',
      gender: pet.gender || '',
      isNeutered: pet.isNeutered,
      birthDate: pet.birthDate || '',
      weightKg: String(pet.weightKg ?? ''),
      color: pet.color || '',
      vaccineExpiry: pet.vaccineExpiry || '',
      isAggressive: pet.isAggressive,
    })
    setEditOpen(true)
  }

  const updateMutation = useMutation({
    mutationFn: () =>
      apiClient.put(`/api/pets/${id}`, {
        ...editForm,
        weightKg: editForm.weightKg ? Number(editForm.weightKg) : null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pet', id] })
      setEditOpen(false)
      toast.success('已更新')
    },
    onError: () => toast.error('更新失败'),
  })

  // ── Loading ──
  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-64 md:col-span-1" />
          <Skeleton className="h-64 md:col-span-2" />
        </div>
      </div>
    )
  }

  // ── Error / Not Found ──
  if (isError || !pet) {
    return (
      <Card className="mx-auto max-w-md py-16 text-center">
        <PawPrint className="mx-auto h-12 w-12 text-muted-foreground/30" />
        <p className="mt-4 text-muted-foreground">宠物档案不存在或已删除</p>
        <Button variant="outline" size="sm" className="mt-4" onClick={() => navigate(-1)}>
          返回上一页
        </Button>
      </Card>
    )
  }

  const speciesEmoji = SPECIES[pet.species]?.charAt(0) || '🐾'

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      {/* ── 顶部导航 ── */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => navigate(`/customers/${pet.customer.id}`)}>
          <ArrowLeft className="mr-1 h-4 w-4" />{pet.customer.name}
        </Button>
        <span className="text-muted-foreground">/</span>
        <span className="text-sm font-semibold">{pet.name}</span>
        <div className="flex-1" />
        <Button size="sm" onClick={openEdit}>
          <Pencil className="mr-1 h-4 w-4" />
          编辑档案
        </Button>
      </div>

      {/* ── Hero 卡片 ── */}
      <Card className="overflow-hidden">
        {/* 背景渐变 */}
        <div className="relative h-32 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent md:h-40">
          {pet.coverImage && (
            <img src={pet.coverImage} alt="" className="h-full w-full object-cover opacity-30" />
          )}
        </div>
        <CardContent className="relative -mt-16 px-6 pb-6">
          {/* 头像 */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div
              className={cn(
                'flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl border-4 border-background text-4xl shadow-lg',
                pet.avatarUrl ? 'bg-transparent overflow-hidden' : 'bg-primary/10'
              )}
            >
              {pet.avatarUrl ? (
                <img src={pet.avatarUrl} alt={pet.name} className="h-full w-full object-cover" />
              ) : (
                speciesEmoji
              )}
            </div>
            <div className="flex-1 pt-2">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold">{pet.name}</h1>
                {pet.isAggressive && (
                  <Badge variant="destructive" className="gap-1">
                    <ShieldAlert className="h-3 w-3" />
                    有攻击性
                  </Badge>
                )}
                {!pet.isActive && <Badge variant="secondary">已归档</Badge>}
              </div>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                <span>{SPECIES[pet.species]}</span>
                {pet.breed && <span>· {pet.breed}</span>}
                {pet.age && <span>· {pet.age}</span>}
              </div>
            </div>
          </div>

          {/* 信息标签行 */}
          <div className="mt-5 flex flex-wrap gap-2">
            {pet.gender && (
              <Badge variant="outline" className="gap-1 text-xs">
                <VenusAndMars className="h-3 w-3" />
                {GENDERS[pet.gender] || pet.gender}
              </Badge>
            )}
            <Badge
              variant="outline"
              className={cn(
                'gap-1 text-xs',
                pet.isNeutered ? 'text-blue-600' : 'text-muted-foreground'
              )}
            >
              {pet.isNeutered ? (
                <ShieldCheck className="h-3 w-3" />
              ) : (
                <ShieldAlert className="h-3 w-3" />
              )}
              {pet.isNeutered ? '已绝育' : '未绝育'}
            </Badge>
            {pet.weightKg && (
              <Badge variant="outline" className="gap-1 text-xs">
                <Weight className="h-3 w-3" />
                {pet.weightKg}kg
              </Badge>
            )}
            {pet.color && (
              <Badge variant="outline" className="gap-1 text-xs">
                <Palette className="h-3 w-3" />
                {pet.color}
              </Badge>
            )}
            <Badge
              variant="outline"
              className={cn(
                'gap-1 text-xs',
                pet.vaccineExpiry && new Date(pet.vaccineExpiry) > new Date()
                  ? 'bg-green-50 text-green-700 border-green-200'
                  : 'bg-red-50 text-red-700 border-red-200'
              )}
            >
              <Syringe className="h-3 w-3" />
              {pet.vaccineExpiry ? `疫苗至 ${pet.vaccineExpiry}` : '疫苗未知'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-5 md:grid-cols-3">
        {/* ── 左侧：主人 + 备注 ── */}
        <div className="space-y-5 md:col-span-2">
          {/* 主人卡片 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">👤 主人信息</CardTitle>
            </CardHeader>
            <CardContent>
              <Link
                to={`/customers/${pet.customer.id}`}
                className="flex items-center gap-3 rounded-lg p-2 -mx-2 transition-colors hover:bg-muted"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-sm font-bold">
                  {pet.customer.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">{pet.customer.name}</p>
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Phone className="h-3 w-3" />
                    {pet.customer.phone}
                  </p>
                </div>
              </Link>
              <div className="mt-3 flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={() =>
                    navigate(`/bookings/new?petId=${pet.id}&customerId=${pet.customerId}`)
                  }
                >
                  <Calendar className="mr-1 h-4 w-4" />
                  新增预约
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 备注区 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-base">
                📝 美容师备注
                <span className="text-xs font-normal text-muted-foreground">
                  {pet.petNotes.length} 条
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {pet.petNotes.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  暂无备注，完成服务后可以留下记录
                </p>
              ) : (
                pet.petNotes.map((note) => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    onDelete={() => deleteNoteMutation.mutate(note.id)}
                  />
                ))
              )}

              <Separator />
              {/* 添加备注 */}
              <div className="space-y-2">
                <div className="flex gap-2">
                  {Object.entries(NOTE_CATEGORIES).map(([k, c]) => {
                    const Icon = c.icon
                    return (
                      <Badge
                        key={k}
                        variant={noteForm.category === k ? 'default' : 'outline'}
                        className="cursor-pointer gap-1 text-[10px]"
                        onClick={() => setNoteForm({ ...noteForm, category: k })}
                      >
                        <Icon className="h-3 w-3" />
                        {c.label}
                      </Badge>
                    )
                  })}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="记录新备注..."
                    value={noteForm.content}
                    onChange={(e) => setNoteForm({ ...noteForm, content: e.target.value })}
                    onKeyDown={(e) =>
                      e.key === 'Enter' && noteForm.content.trim() && addNoteMutation.mutate()
                    }
                  />
                  <Button
                    size="sm"
                    disabled={!noteForm.content.trim() || addNoteMutation.isPending}
                    onClick={() => addNoteMutation.mutate()}
                  >
                    添加
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── 右侧：服务历史 ── */}
        <div className="space-y-5">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">📋 服务记录</CardTitle>
            </CardHeader>
            <CardContent>
              {pet.appointments.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">暂无服务记录</p>
              ) : (
                <div className="space-y-2">
                  {pet.appointments.slice(0, 10).map((appt) => (
                    <Link
                      key={appt.id}
                      to={`/appointments/${appt.id}`}
                      className="block rounded-lg border p-3 text-sm transition-colors hover:bg-muted/50"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{appt.appointmentDate}</span>
                        <Badge variant="secondary" className="text-[10px]">
                          {STATUS_LABELS[appt.status] || appt.status}
                        </Badge>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
                        {appt.appointmentItems.map((item) => (
                          <span key={item.service.id} className="flex items-center gap-0.5">
                            <Scissors className="h-3 w-3" />
                            {item.service.name}
                          </span>
                        ))}
                      </div>
                      {appt.assignedStaff && (
                        <p className="mt-1 text-[11px] text-muted-foreground">
                          美容师：{appt.assignedStaff.name}
                        </p>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── 编辑宠物 Sheet ── */}
      <Sheet open={editOpen} onOpenChange={setEditOpen}>
        <SheetContent side="right" className="w-full max-w-md overflow-y-auto p-0">
          <SheetHeader className="border-b px-6 py-4">
            <SheetTitle>编辑宠物档案</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 px-6 py-4">
            <div>
              <Label>名字 *</Label>
              <Input
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>物种</Label>
                <Select
                  value={editForm.species}
                  onValueChange={(v) => setEditForm({ ...editForm, species: v ?? 'dog' })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dog">🐕 狗狗</SelectItem>
                    <SelectItem value="cat">🐈 猫咪</SelectItem>
                    <SelectItem value="other">🐾 其他</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>性别</Label>
                <Select
                  value={editForm.gender}
                  onValueChange={(v) => setEditForm({ ...editForm, gender: v ?? '' })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="未知" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">♂ 公</SelectItem>
                    <SelectItem value="female">♀ 母</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>品种</Label>
              <Input
                value={editForm.breed}
                onChange={(e) => setEditForm({ ...editForm, breed: e.target.value })}
                placeholder="例：金毛寻回犬"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>体重 (kg)</Label>
                <Input
                  type="number"
                  value={editForm.weightKg}
                  onChange={(e) => setEditForm({ ...editForm, weightKg: e.target.value })}
                />
              </div>
              <div>
                <Label>毛色</Label>
                <Input
                  value={editForm.color}
                  onChange={(e) => setEditForm({ ...editForm, color: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>出生日期</Label>
                <Input
                  type="date"
                  value={editForm.birthDate}
                  onChange={(e) => setEditForm({ ...editForm, birthDate: e.target.value })}
                />
              </div>
              <div>
                <Label>疫苗有效期</Label>
                <Input
                  type="date"
                  value={editForm.vaccineExpiry}
                  onChange={(e) => setEditForm({ ...editForm, vaccineExpiry: e.target.value })}
                />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={editForm.isNeutered}
                  onChange={(e) => setEditForm({ ...editForm, isNeutered: e.target.checked })}
                  className="h-4 w-4 rounded border-muted-foreground/30"
                />
                已绝育
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={editForm.isAggressive}
                  onChange={(e) => setEditForm({ ...editForm, isAggressive: e.target.checked })}
                  className="h-4 w-4 rounded border-muted-foreground/30"
                />
                ⚠️ 有攻击性
              </label>
            </div>
          </div>
          <SheetFooter className="border-t px-6 py-4">
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              取消
            </Button>
            <Button
              onClick={() => {
                setSaving(true)
                updateMutation.mutateAsync().finally(() => setSaving(false))
              }}
              disabled={saving}
            >
              {saving ? '保存中...' : '保存'}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}
