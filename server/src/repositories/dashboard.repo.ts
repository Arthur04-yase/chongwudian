import prisma from '../lib/prisma.js'

export const dashboardRepo = {
  async getToday(date: string, staffId?: number) {
    const inProgressWhere: any = { appointmentDate: date, status: 'in_progress', isDeleted: false }
    if (staffId) inProgressWhere.staffId = staffId

    const [appointments, payments, boarding, inProgressServices, alerts] = await Promise.all([
      prisma.appointment.groupBy({
        by: ['status'],
        where: { appointmentDate: date, isDeleted: false },
        _count: true,
      }),
      prisma.payment.aggregate({
        where: {
          isDeleted: false,
          paidAt: { gte: new Date(`${date}T00:00:00`), lt: new Date(`${date}T23:59:59`) },
        },
        _sum: { amount: true },
        _count: true,
      }),
      Promise.all([
        prisma.boarding.count({ where: { status: 'active', isDeleted: false } }),
        prisma.boarding.count({
          where: { status: 'active', isDeleted: false, checkOutDate: date },
        }),
        prisma.boarding.count({
          where: { status: 'active', isDeleted: false, checkOutDate: { lt: date } },
        }),
      ]),
      prisma.appointment.findMany({
        where: inProgressWhere,
        include: {
          pet: { select: { id: true, name: true, species: true } },
          assignedStaff: { select: { id: true, name: true } },
          appointmentItems: { include: { service: { select: { name: true } } } },
        },
      }),
      // ── 待办提醒 ──
      Promise.all([
        // completed 待结账
        prisma.appointment.findMany({
          where: { appointmentDate: date, status: 'completed', isDeleted: false },
          select: {
            id: true,
            appointmentNo: true,
            startTime: true,
            pet: { select: { name: true } },
            customer: { select: { name: true } },
            appointmentItems: { where: { status: { not: 'cancelled' } }, select: { price: true } },
          },
        }),
        // pending 超时未到（预约时间已过 30 分钟）
        prisma.appointment.findMany({
          where: { appointmentDate: date, status: 'pending', isDeleted: false },
          select: {
            id: true,
            appointmentNo: true,
            startTime: true,
            pet: { select: { name: true } },
            customer: { select: { name: true } },
          },
        }),
        // 低库存
        prisma.product.findMany({
          where: { isActive: true },
          select: { id: true, name: true, currentStock: true, safetyStock: true },
        }),
      ]),
    ])

    const statusCounts: Record<string, number> = {}
    for (const g of appointments) statusCounts[g.status] = g._count

    const [activeBoarding, checkoutToday, overdue] = boarding
    const [completedAppts, pendingLate, lowStockProducts] = alerts

    const now = new Date()
    const pendingLateFiltered = pendingLate.filter((a) => {
      const [h, m] = a.startTime.split(':').map(Number)
      const apptTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m)
      return now.getTime() - apptTime.getTime() > 30 * 60 * 1000
    })

    return {
      todayStats: {
        total: Object.values(statusCounts).reduce((a, b) => a + b, 0),
        pending: statusCounts.pending || 0,
        arrived: statusCounts.arrived || 0,
        inProgress: statusCounts.in_progress || 0,
        completed: statusCounts.completed || 0,
        waitingPickup: statusCounts.completed || 0,
      },
      inProgressServices: inProgressServices.map((a) => ({
        id: a.id,
        petName: a.pet.name,
        petSpecies: a.pet.species,
        groomerName: a.assignedStaff?.name || '待分配',
        staffId: a.assignedStaff?.id,
        services: a.appointmentItems.map((i) => i.service.name),
        startTime: a.startTime,
      })),
      todayRevenue: {
        total: payments._sum.amount || 0,
        count: payments._count,
      },
      boarding: { active: activeBoarding, checkoutToday, overdue },
      alerts: {
        checkoutPending: completedAppts.map((a) => ({
          id: a.id,
          type: 'checkout' as const,
          message: `${a.pet.name} · 待结账 ¥${a.appointmentItems.reduce((s, i) => s + i.price, 0)}`,
          petName: a.pet.name,
          customerName: a.customer.name,
        })),
        lateArrivals: pendingLateFiltered.map((a) => ({
          id: a.id,
          type: 'late' as const,
          message: `${a.pet.name} · 预约 ${a.startTime} 未到店`,
          petName: a.pet.name,
          customerName: a.customer.name,
        })),
        lowStock: lowStockProducts
          .filter((p) => p.safetyStock > 0 && p.currentStock <= p.safetyStock)
          .map((p) => ({
            type: 'lowStock' as const,
            message: `${p.name} 仅剩 ${p.currentStock}${'库存不足'}`,
            productId: p.id,
            productName: p.name,
          })),
      },
    }
  },
}
