import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { PawPrint } from 'lucide-react'

export default function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-4">
      <PawPrint className="h-16 w-16 text-muted-foreground/30" />
      <h1 className="text-4xl font-bold text-muted-foreground">404</h1>
      <p className="text-muted-foreground">页面未找到</p>
      <Button variant="outline" onClick={() => navigate('/dashboard')}>
        返回工作台
      </Button>
    </div>
  )
}
