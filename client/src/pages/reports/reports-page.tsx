import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { TrendingUp, Scissors, UserRound, Users, Calendar, Wallet, BarChart3 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { apiClient } from '@/lib/api-client'
import { formatPrice, cn } from '@/lib/utils'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'

// ─── 类型 ─────────────────────────
interface RevenueData {
  daily: { date: string; total: number; count: number }[]
  byMethod: { method: string; amount: number }[]
  grandTotal: number
  totalCount: number
}
interface ServiceRank {
  name: string
  category: string
  count: number
  revenue: number
}
interface StaffPerf {
  name: string
  count: number
  revenue: number
  commission: number
}
interface CustomerAnalysis {
  total: number
  withVisit: number
  newThisMonth: number
  dormantCount: number
  returningRate: string
  bySource: { source: string; count: number }[]
}

// ─── 颜色 ─────────────────────────
const COLORS = ['#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ef4444', '#f97316', '#14b8a6']
const METHOD_LABELS: Record<string, string> = { wechat: '微信', alipay: '支付宝', cash: '现金' }
const CAT_EMOJI: Record<string, string> = {
  bath: '🛁',
  groom: '✂️',
  care: '💆',
  medicated: '💊',
  boarding: '🏨',
  other: '📦',
}

function today() {
  return new Date().toISOString().slice(0, 10)
}
function monthFirst() {
  return `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-01`
}

// ─── API ──────────────────────────
async function fetchReport(endpoint: string, params: Record<string, string>) {
  const qs = new URLSearchParams(params).toString()
  return (await apiClient.get(`/api/reports/${endpoint}?${qs}`)).data.data
}

// ─── KPI 卡片 ─────────────────────
function KpiCard({
  label,
  value,
  sub,
  icon: Icon,
  color,
}: {
  label: string
  value: string
  sub?: string
  icon: any
  color: string
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl', color)}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-xl font-bold">{value}</p>
          {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  )
}

// ─── 页面 ─────────────────────────
export default function ReportsPage() {
  const [startDate, setStartDate] = useState(monthFirst())
  const [endDate, setEndDate] = useState(today())

  // ── 营收 ──
  const { data: revenue, isLoading: revLoading } = useQuery({
    queryKey: ['report-revenue', startDate, endDate],
    queryFn: () => fetchReport('revenue', { startDate, endDate }) as Promise<RevenueData>,
  })

  // ── 服务排行 ──
  const { data: services } = useQuery({
    queryKey: ['report-services', startDate, endDate],
    queryFn: () => fetchReport('services', { startDate, endDate }) as Promise<ServiceRank[]>,
  })

  // ── 员工 ──
  const { data: staff } = useQuery({
    queryKey: ['report-staff', startDate, endDate],
    queryFn: () => fetchReport('staff', { startDate, endDate }) as Promise<StaffPerf[]>,
  })

  // ── 客户 ──
  const { data: customers } = useQuery({
    queryKey: ['report-customers'],
    queryFn: () => fetchReport('customers', {}) as Promise<CustomerAnalysis>,
  })

  const avgRevenue = revenue
    ? (revenue.grandTotal / Math.max(1, revenue.totalCount)).toFixed(0)
    : '0'
  const avgDaily = revenue
    ? (revenue.grandTotal / Math.max(1, revenue.daily.length)).toFixed(0)
    : '0'

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold">数据统计</h1>
          <p className="text-sm text-muted-foreground">经营数据分析与决策参考</p>
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-xs">从</Label>
          <Input
            type="date"
            className="w-36 h-8 text-xs"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <Label className="text-xs">到</Label>
          <Input
            type="date"
            className="w-36 h-8 text-xs"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
      </div>

      <Tabs defaultValue="revenue" className="space-y-5">
        <TabsList>
          <TabsTrigger value="revenue">
            <TrendingUp className="mr-1.5 h-4 w-4" />
            营收
          </TabsTrigger>
          <TabsTrigger value="services">
            <Scissors className="mr-1.5 h-4 w-4" />
            服务
          </TabsTrigger>
          <TabsTrigger value="staff">
            <UserRound className="mr-1.5 h-4 w-4" />
            员工
          </TabsTrigger>
          <TabsTrigger value="customers">
            <Users className="mr-1.5 h-4 w-4" />
            客户
          </TabsTrigger>
        </TabsList>

        {/* ════ 营收 Tab ════ */}
        <TabsContent value="revenue" className="space-y-5">
          {revLoading ? (
            <Skeleton className="h-64 rounded-xl" />
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <KpiCard
                  label="总营收"
                  value={formatPrice(revenue?.grandTotal || 0)}
                  sub={`${revenue?.totalCount || 0} 笔`}
                  icon={Wallet}
                  color="bg-primary/10 text-primary"
                />
                <KpiCard
                  label="日均营收"
                  value={formatPrice(Number(avgDaily))}
                  sub={`${revenue?.daily.length || 0} 天营业`}
                  icon={Calendar}
                  color="bg-blue-50 text-blue-600"
                />
                <KpiCard
                  label="客单价"
                  value={formatPrice(Number(avgRevenue))}
                  icon={BarChart3}
                  color="bg-green-50 text-green-600"
                />
                <KpiCard
                  label="支付方式"
                  value={`${revenue?.byMethod.length || 0} 种`}
                  sub={revenue?.byMethod.map((m) => METHOD_LABELS[m.method]).join('+')}
                  icon={Wallet}
                  color="bg-purple-50 text-purple-600"
                />
              </div>

              <div className="grid gap-5 lg:grid-cols-3">
                {/* 日趋势折线图 */}
                <Card className="lg:col-span-2">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">📈 每日营收趋势</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {!revenue?.daily.length ? (
                      <p className="py-12 text-center text-sm text-muted-foreground">
                        该时间段暂无数据
                      </p>
                    ) : (
                      <ResponsiveContainer width="100%" height={280}>
                        <LineChart data={revenue.daily}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis
                            dataKey="date"
                            tick={{ fontSize: 11 }}
                            tickFormatter={(v) => v.slice(5)}
                          />
                          <YAxis tick={{ fontSize: 11 }} />
                          <Tooltip formatter={(v: any) => formatPrice(Number(v) || 0)} />
                          <Line
                            type="monotone"
                            dataKey="total"
                            stroke="#f59e0b"
                            strokeWidth={2.5}
                            dot={{ r: 3 }}
                            activeDot={{ r: 5 }}
                            name="营收"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>

                {/* 支付方式饼图 */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">💳 支付方式</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {!revenue?.byMethod.length ? (
                      <p className="py-12 text-center text-sm text-muted-foreground">暂无数据</p>
                    ) : (
                      <ResponsiveContainer width="100%" height={280}>
                        <PieChart>
                          <Pie
                            data={revenue.byMethod}
                            dataKey="amount"
                            nameKey="method"
                            cx="50%"
                            cy="50%"
                            outerRadius={90}
                            innerRadius={50}
                            label={(entry: any) =>
                              `${METHOD_LABELS[entry.method] || entry.method} ¥${entry.amount}`
                            }
                          >
                            {revenue.byMethod.map((_, i) => (
                              <Cell key={i} fill={COLORS[i % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(v: any) => formatPrice(Number(v) || 0)} />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        {/* ════ 服务 Tab ════ */}
        <TabsContent value="services" className="space-y-5">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">🏆 服务项目排行</CardTitle>
            </CardHeader>
            <CardContent>
              {!services?.length ? (
                <p className="py-12 text-center text-sm text-muted-foreground">该时间段暂无数据</p>
              ) : (
                <ResponsiveContainer
                  width="100%"
                  height={Math.max(300, (services || []).length * 50)}
                >
                  <BarChart data={services || []} layout="vertical" margin={{ left: 80 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis
                      type="category"
                      dataKey="name"
                      tick={{ fontSize: 11 }}
                      width={120}
                      tickFormatter={(v) => (v.length > 8 ? v.slice(0, 8) + '...' : v)}
                    />
                    <Tooltip formatter={(v: any) => formatPrice(Number(v) || 0)} />
                    <Bar dataKey="revenue" fill="#f59e0b" radius={[0, 4, 4, 0]} name="收入">
                      {(services || []).map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* 服务表格 */}
          {(services || []).length > 0 && (
            <Card>
              <CardContent className="p-0">
                <div className="divide-y">
                  {(services || []).map((s, i) => (
                    <div key={i} className="flex items-center justify-between px-4 py-3 text-sm">
                      <div className="flex items-center gap-2">
                        <Badge className="text-xs">{i + 1}</Badge>
                        <span>
                          {CAT_EMOJI[s.category] || '📦'} {s.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-right">
                        <span className="text-xs text-muted-foreground">{s.count} 次</span>
                        <span className="font-semibold w-20 text-right">
                          {formatPrice(s.revenue)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ════ 员工 Tab ════ */}
        <TabsContent value="staff" className="space-y-5">
          {!staff?.length ? (
            <Card className="py-12 text-center text-sm text-muted-foreground">
              该时间段暂无数据
            </Card>
          ) : (
            <>
              {/* 业绩柱状图 */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">👨‍💼 美容师业绩对比</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={staff}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(v: any) => formatPrice(Number(v) || 0)} />
                      <Legend />
                      <Bar dataKey="revenue" fill="#f59e0b" name="收入" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="commission" fill="#10b981" name="提成" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* 业绩表格 */}
              <Card>
                <CardContent className="p-0">
                  <div className="divide-y">
                    {staff.map((s, i) => (
                      <div key={i} className="flex items-center px-4 py-3">
                        <span className="w-8 text-lg font-bold text-muted-foreground">
                          {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`}
                        </span>
                        <span className="flex-1 font-medium text-sm">{s.name}</span>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-muted-foreground">{s.count} 单</span>
                          <span className="w-20 text-right font-semibold">
                            {formatPrice(s.revenue)}
                          </span>
                          <span className="w-20 text-right text-green-600">
                            {formatPrice(s.commission)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* ════ 客户 Tab ════ */}
        <TabsContent value="customers" className="space-y-5">
          {!customers ? (
            <Skeleton className="h-64 rounded-xl" />
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <KpiCard
                  label="总客户数"
                  value={String(customers.total)}
                  icon={Users}
                  color="bg-blue-50 text-blue-600"
                />
                <KpiCard
                  label="有消费记录"
                  value={`${customers.withVisit} 人`}
                  sub={`回头率 ${customers.returningRate}%`}
                  icon={TrendingUp}
                  color="bg-green-50 text-green-600"
                />
                <KpiCard
                  label="本月新增"
                  value={`${customers.newThisMonth} 人`}
                  icon={Users}
                  color="bg-primary/10 text-primary"
                />
                <KpiCard
                  label="沉睡客户"
                  value={`${customers.dormantCount} 人`}
                  sub="超60天未到店"
                  icon={Calendar}
                  color="bg-red-50 text-red-600"
                />
              </div>

              <div className="grid gap-5 lg:grid-cols-2">
                {/* 来源分布 */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">📊 客户来源分布</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {!customers.bySource.length ? (
                      <p className="py-12 text-center text-sm text-muted-foreground">暂无数据</p>
                    ) : (
                      <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                          <Pie
                            data={customers.bySource}
                            dataKey="count"
                            nameKey="source"
                            cx="50%"
                            cy="50%"
                            outerRadius={90}
                            label={(entry: any) => `${entry.source} ${entry.count}人`}
                          >
                            {customers.bySource.map((_, i) => (
                              <Cell key={i} fill={COLORS[i % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>

                {/* 来源表格 */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">📋 来源详情</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y">
                      {customers.bySource.map((s, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between px-4 py-3 text-sm"
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className="h-3 w-3 rounded-full"
                              style={{ backgroundColor: COLORS[i % COLORS.length] }}
                            />
                            <span>{s.source || '未知'}</span>
                          </div>
                          <span className="font-semibold">{s.count} 人</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
