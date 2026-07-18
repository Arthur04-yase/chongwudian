import prisma from '../lib/prisma.js'

export const dashboardRepo = {
  async getToday(date: string) {
    const [appointments, payments, boarding, inProgressServices] = await Promise.all([
      // 今日预约统计
      prisma.appointment.groupBy({
        by: ['status'],
        where: { appointmentDate: date, isDeleted: false },
        _count: true,
      }),
      // 今日营收
      prisma.payment.aggregate({
        where: {
          isDeleted: false,
          paidAt: { gte: new Date(`${date}T00:00:00`), lt: new Date(`${date}T23:59:59`) },
        },
        _sum: { amount: true },
        _count: true,
      }),
      // 寄养状态
      Promise.all([
        prisma.boarding.count({ where: { status: 'active', isDeleted: false } }),
        prisma.boarding.count({
          where: { status: 'active', isDeleted: false, checkOutDate: date },
        }),
        prisma.boarding.count({
          where: { status: 'active', isDeleted: false, checkOutDate: { lt: date } },
        }),
      ]),
      // 进行中的服务
      prisma.appointment.findMany({
        where: { appointmentDate: date, status: 'in_progress', isDeleted: false },
        include: {
          pet: { select: { id: true, name: true, species: true } },
          assignedStaff: { select: { id: true, name: true } },
          appointmentItems: {
            include: { service: { select: { name: true } } },
          },
        },
      }),
    ])

    // 解析预约统计
    const statusCounts: Record<string, number> = {}
    for (const g of appointments) statusCounts[g.status] = g._count

    const [activeBoarding, checkoutToday, overdue] = boarding

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
        services: a.appointmentItems.map((i) => i.service.name),
        startTime: a.startTime,
      })),
      todayRevenue: {
        total: payments._sum.amount || 0,
        count: payments._count,
      },
      boarding: {
        active: activeBoarding,
        checkoutToday,
        overdue,
      },
    }
  },
}
