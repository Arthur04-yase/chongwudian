import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function DashboardPage() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { label: '今日预约', value: '--', icon: '📅' },
          { label: '进行中', value: '--', icon: '✂️' },
          { label: '已完成', value: '--', icon: '✅' },
          { label: '待取宠', value: '--', icon: '📦' },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{stat.icon}</span>
                <div>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>工作台</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Dashboard 待 Task 5.1 实现</p>
        </CardContent>
      </Card>
    </div>
  )
}
