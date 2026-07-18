import prisma from '../lib/prisma.js'

export const reportRepo = {
  /** 营收报表：按日期范围 + 按天/周/月聚合 */
  async revenue(startDate: string, endDate: string) {
    const payments = await prisma.payment.findMany({
      where: {
        isDeleted: false,
        paidAt: { gte: new Date(`${startDate}T00:00:00`), lte: new Date(`${endDate}T23:59:59`) },
      },
      select: { amount: true, method: true, paidAt: true },
      orderBy: { paidAt: 'asc' },
    })

    // 按日汇总
    const dailyMap = new Map<string, { total: number; count: number }>()
    let grandTotal = 0
    for (const p of payments) {
      const day = p.paidAt.toISOString().slice(0, 10)
      if (!dailyMap.has(day)) dailyMap.set(day, { total: 0, count: 0 })
      const entry = dailyMap.get(day)!
      entry.total += p.amount
      entry.count++
      grandTotal += p.amount
    }

    const daily = Array.from(dailyMap.entries()).map(([date, d]) => ({ date, ...d }))

    // 按支付方式分类
    const methodMap = new Map<string, number>()
    for (const p of payments) {
      methodMap.set(p.method, (methodMap.get(p.method) || 0) + p.amount)
    }
    const byMethod = Array.from(methodMap.entries()).map(([method, amount]) => ({ method, amount }))

    return {
      daily,
      byMethod,
      grandTotal,
      totalCount: payments.length,
    }
  },

  /** 服务统计：按服务项目排行 */
  async serviceRanking(startDate: string, endDate: string) {
    const items = await prisma.appointmentItem.findMany({
      where: {
        isDeleted: false,
        status: 'completed',
        appointment: {
          isDeleted: false,
          appointmentDate: { gte: startDate, lte: endDate },
        },
      },
      include: { service: { select: { id: true, name: true, category: true } } },
    })

    const map = new Map<
      number,
      { name: string; category: string; count: number; revenue: number }
    >()
    for (const item of items) {
      if (!map.has(item.serviceId)) {
        map.set(item.serviceId, {
          name: item.service.name,
          category: item.service.category,
          count: 0,
          revenue: 0,
        })
      }
      const entry = map.get(item.serviceId)!
      entry.count++
      entry.revenue += item.price
    }

    return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue)
  },

  /** 美容师业绩排行 */
  async staffPerformance(startDate: string, endDate: string) {
    const items = await prisma.appointmentItem.findMany({
      where: {
        isDeleted: false,
        status: 'completed',
        appointment: {
          isDeleted: false,
          appointmentDate: { gte: startDate, lte: endDate },
          staffId: { not: null },
        },
      },
      include: {
        appointment: {
          select: { assignedStaff: { select: { id: true, name: true } } },
        },
      },
    })

    const map = new Map<
      number,
      { name: string; count: number; revenue: number; commission: number }
    >()
    for (const item of items) {
      const staff = item.appointment.assignedStaff
      if (!staff) continue
      if (!map.has(staff.id)) {
        map.set(staff.id, { name: staff.name, count: 0, revenue: 0, commission: 0 })
      }
      const entry = map.get(staff.id)!
      entry.count++
      entry.revenue += item.price
      entry.commission += item.commissionAmount
    }

    return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue)
  },

  /** 客户分析 */
  async customerAnalysis() {
    const [total, withVisit, newThisMonth] = await Promise.all([
      prisma.customer.count({ where: { isDeleted: false } }),
      prisma.customer.count({ where: { isDeleted: false, visitCount: { gt: 0 } } }),
      prisma.customer.count({
        where: {
          isDeleted: false,
          createdAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
        },
      }),
    ])

    // 沉睡客户（超过60天未到店）
    const sixtyDaysAgo = new Date()
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60)
    const dormantCount = await prisma.customer.count({
      where: {
        isDeleted: false,
        visitCount: { gt: 0 },
        lastVisitDate: { lt: sixtyDaysAgo.toISOString().slice(0, 10) },
      },
    })

    // 客户来源分布
    const sourceGroups = await prisma.customer.groupBy({
      by: ['source'],
      where: { isDeleted: false, source: { not: null } },
      _count: true,
    })

    return {
      total,
      withVisit,
      newThisMonth,
      dormantCount,
      returningRate:
        withVisit > 0 ? (((withVisit - dormantCount) / withVisit) * 100).toFixed(1) : '0',
      bySource: sourceGroups.map((g) => ({ source: g.source || '未知', count: g._count })),
    }
  },
}
