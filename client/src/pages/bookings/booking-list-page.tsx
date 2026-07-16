import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function BookingListPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>📅 预约管理</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">预约列表 — 待 Task 4.2 实现</p>
      </CardContent>
    </Card>
  )
}
