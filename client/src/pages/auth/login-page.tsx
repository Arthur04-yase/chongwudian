import { useState, type FormEvent } from 'react'
import { useNavigate, useLocation, Navigate } from 'react-router-dom'
import { PawPrint, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { useAuth } from '@/hooks/use-auth'
import { toast } from 'sonner'

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, isAuthenticated } = useAuth()

  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 如果已登录，直接跳转
  if (isAuthenticated) {
    const from = (location.state as { from?: string })?.from || '/dashboard'
    return <Navigate to={from} replace />
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()

    if (!phone.trim() || !password.trim()) {
      toast.error('请输入手机号和密码')
      return
    }

    if (!/^1[3-9]\d{9}$/.test(phone.trim())) {
      toast.error('手机号格式不正确')
      return
    }

    setIsSubmitting(true)

    try {
      await login(phone.trim(), password)
      toast.success('登录成功')
      const from = (location.state as { from?: string })?.from || '/dashboard'
      navigate(from, { replace: true })
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data
              ?.error?.message
      toast.error(message || '登录失败，请重试')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-warm-50 via-white to-primary-50/30 p-4">
      <Card className="w-full max-w-sm shadow-lg">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
            <PawPrint className="h-9 w-9 text-primary" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">宠爱有家</h1>
          <p className="text-sm text-muted-foreground">宠物店智能管理系统</p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">手机号</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="请输入手机号"
                maxLength={11}
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                disabled={isSubmitting}
                autoComplete="tel"
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">密码</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="请输入密码"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isSubmitting}
                  autoComplete="current-password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
              {isSubmitting ? '登录中...' : '登 录'}
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            演示账号：13800000001 · 密码：123456
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
