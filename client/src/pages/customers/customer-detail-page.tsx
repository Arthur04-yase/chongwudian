import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  Phone,
  MapPin,
  Calendar,
  Wallet,
  Plus,
  UserRound,
  ChevronRight,
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
import { Skeleton } from '@/components/ui/skeleton'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet'
import { apiClient } from '@/lib/api-client'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface CustomerDetail {
  id: number
  name: string
  phone: string
  wechatId: string | null
  address: string | null
  source: string | null
  totalSpent: number
  lastVisitDate: string | null
  visitCount: number
  notes: string | null
  pets: {
    id: number
    name: string
    species: string
    breed: string | null
    avatarUrl: string | null
    gender: string | null
    weightKg: number | null
    vaccineExpiry: string | null
  }[]
  membershipCards: {
    id: number
    cardType: string
    cardNo: string
    balance: number
    totalTimes: number
    usedTimes: number
    discountRate: number
    expiryDate: string | null
  }[]
}

interface PetFormData {
  name: string
  species: string
  breed: string
  gender: string
  birthDate: string
  weightKg: string
  color: string
  vaccineExpiry: string
  isNeutered: boolean
}

const SPECIES: Record<string, string> = { dog: '🐕 狗狗', cat: '🐈 猫咪', other: '🐾 其他' }
const emptyPet: PetFormData = {
  name: '',
  species: 'dog',
  breed: '',
  gender: '',
  birthDate: '',
  weightKg: '',
  color: '',
  vaccineExpiry: '',
  isNeutered: false,
}

async function fetchCustomer(id: string) {
  return (await apiClient.get(`/api/customers/${id}`)).data.data as CustomerDetail
}

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [petSheet, setPetSheet] = useState(false)
  const [petForm, setPetForm] = useState<PetFormData>(emptyPet)
  const [saving, setSaving] = useState(false)

  const {
    data: customer,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['customer', id],
    queryFn: () => fetchCustomer(id!),
    enabled: !!id,
  })

  const addPetMutation = useMutation({
    mutationFn: () =>
      apiClient.post('/api/pets', {
        ...petForm,
        customerId: Number(id),
        weightKg: petForm.weightKg ? Number(petForm.weightKg) : undefined,
      }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['customer', id] })
      setPetSheet(false)
      toast.success('宠物已添加')
      navigate(`/pets/${res.data.data.id}`)
    },
    onError: () => toast.error('添加失败'),
  })

  if (isLoading)
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64" />
      </div>
    )
  if (isError || !customer)
    return (
      <Card className="mx-auto max-w-md py-16 text-center">
        <UserRound className="mx-auto h-12 w-12 text-muted-foreground/30" />
        <p className="mt-4 text-muted-foreground">客户不存在</p>
        <Button variant="outline" size="sm" className="mt-4" onClick={() => navigate('/customers')}>
          返回客户列表
        </Button>
      </Card>
    )

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      {/* 返回 */}
      <Button variant="ghost" size="icon-sm" onClick={() => navigate('/customers')}>
        <ArrowLeft className="h-4 w-4" />
      </Button>

      {/* 主人信息 */}
      <Card>
        <CardContent className="flex flex-col gap-4 p-6 sm:flex-row">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-2xl font-bold text-primary">
            {customer.name.charAt(0)}
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold">{customer.name}</h1>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Phone className="h-3.5 w-3.5" />
                {customer.phone}
              </span>
              {customer.address && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {customer.address}
                </span>
              )}
              {customer.source && (
                <span className="flex items-center gap-1">来源：{customer.source}</span>
              )}
            </div>
            <div className="mt-3 flex flex-wrap gap-3 text-sm">
              <Badge variant="secondary">
                <Wallet className="mr-1 h-3 w-3" />
                累计 ¥{customer.totalSpent.toLocaleString()}
              </Badge>
              <Badge variant="secondary">{customer.visitCount} 次到店</Badge>
              {customer.lastVisitDate && (
                <Badge variant="secondary">
                  <Calendar className="mr-1 h-3 w-3" />
                  最近 {customer.lastVisitDate}
                </Badge>
              )}
              {customer.membershipCards?.length > 0 && (
                <Badge className="bg-amber-100 text-amber-700">会员</Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 宠物列表 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base">🐾 我的宠物 ({customer.pets?.length || 0})</CardTitle>
          <Button
            size="sm"
            onClick={() => {
              setPetForm(emptyPet)
              setPetSheet(true)
            }}
          >
            <Plus className="mr-1 h-4 w-4" />
            添加宠物
          </Button>
        </CardHeader>
        <CardContent>
          {!customer.pets?.length ? (
            <p className="py-6 text-center text-sm text-muted-foreground">还没有添加宠物</p>
          ) : (
            <div className="space-y-2">
              {customer.pets.map((pet) => (
                <Link
                  key={pet.id}
                  to={`/pets/${pet.id}`}
                  className="flex items-center gap-4 rounded-lg border p-3 transition-colors hover:bg-muted/50"
                >
                  <div
                    className={cn(
                      'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl',
                      pet.avatarUrl ? 'overflow-hidden' : 'bg-muted'
                    )}
                  >
                    {pet.avatarUrl ? (
                      <img src={pet.avatarUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      SPECIES[pet.species]?.split(' ')[0] || '🐾'
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 text-sm font-semibold">
                      {pet.name}
                      <Badge variant="secondary" className="text-[10px]">
                        {pet.breed || SPECIES[pet.species]?.split(' ')[1]}
                      </Badge>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {pet.gender === 'male' ? '♂' : pet.gender === 'female' ? '♀' : ''}
                      {pet.weightKg ? ` ${pet.weightKg}kg` : ''}
                      {pet.vaccineExpiry && new Date(pet.vaccineExpiry) > new Date()
                        ? ` · 疫苗 ✅`
                        : pet.vaccineExpiry
                          ? ' · 疫苗 ⚠️'
                          : ''}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground/40" />
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 新增宠物 Sheet */}
      <Sheet open={petSheet} onOpenChange={setPetSheet}>
        <SheetContent side="right" className="w-full max-w-md overflow-y-auto p-0">
          <SheetHeader className="border-b px-6 py-4">
            <SheetTitle>添加宠物</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 px-6 py-4">
            <div>
              <Label>名字 *</Label>
              <Input
                value={petForm.name}
                onChange={(e) => setPetForm({ ...petForm, name: e.target.value })}
                placeholder="例：豆豆"
                autoFocus
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>物种</Label>
                <Select
                  value={petForm.species}
                  onValueChange={(v) => setPetForm({ ...petForm, species: v ?? 'dog' })}
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
                  value={petForm.gender}
                  onValueChange={(v) => setPetForm({ ...petForm, gender: v ?? '' })}
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
                value={petForm.breed}
                onChange={(e) => setPetForm({ ...petForm, breed: e.target.value })}
                placeholder="例：金毛"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>出生日期</Label>
                <Input
                  type="date"
                  value={petForm.birthDate}
                  onChange={(e) => setPetForm({ ...petForm, birthDate: e.target.value })}
                />
              </div>
              <div>
                <Label>体重 (kg)</Label>
                <Input
                  type="number"
                  value={petForm.weightKg}
                  onChange={(e) => setPetForm({ ...petForm, weightKg: e.target.value })}
                />
              </div>
            </div>
          </div>
          <SheetFooter className="border-t px-6 py-4">
            <Button variant="outline" onClick={() => setPetSheet(false)}>
              取消
            </Button>
            <Button
              onClick={() => {
                setSaving(true)
                addPetMutation.mutateAsync().finally(() => setSaving(false))
              }}
              disabled={saving || !petForm.name.trim()}
            >
              {saving ? '保存中...' : '添加'}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}
