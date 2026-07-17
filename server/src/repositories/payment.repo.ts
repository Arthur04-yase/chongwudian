import prisma from '../lib/prisma.js'

export const paymentRepo = {
  /** 创建支付记录 + 同时更新预约状态为 picked_up + 更新客户消费数据 */
  async checkout(dto: {
    appointmentId: number
    amount: number
    method: string
    transactionNo?: string
    createdBy: number
    notes?: string
  }) {
    // 使用事务保证一致性
    const [payment, appointment] = await prisma.$transaction([
      prisma.payment.create({
        data: {
          appointmentId: dto.appointmentId,
          amount: dto.amount,
          method: dto.method,
          transactionNo: dto.transactionNo ?? null,
          createdBy: dto.createdBy,
          notes: dto.notes ?? null,
        },
        include: {
          appointment: {
            select: {
              id: true,
              appointmentNo: true,
              customerId: true,
              customer: { select: { id: true, name: true } },
              pet: { select: { id: true, name: true } },
            },
          },
        },
      }),
      prisma.appointment.update({
        where: { id: dto.appointmentId },
        data: { status: 'picked_up' },
      }),
    ])

    // 更新客户消费统计
    const { customerId } = appointment
    const [stats] = await Promise.all([
      prisma.payment.aggregate({
        where: {
          appointment: { customerId, isDeleted: false },
          isDeleted: false,
        },
        _sum: { amount: true },
      }),
      prisma.appointment.count({
        where: { customerId, isDeleted: false },
      }),
    ])

    await prisma.customer.update({
      where: { id: customerId },
      data: {
        totalSpent: stats._sum.amount || 0,
        lastVisitDate: new Date().toISOString().slice(0, 10),
        visitCount: { increment: 1 },
      },
    })

    return payment
  },

  /** 查询支付记录列表 */
  async findByDate(date: string) {
    return prisma.payment.findMany({
      where: {
        isDeleted: false,
        paidAt: {
          gte: new Date(`${date}T00:00:00`),
          lt: new Date(`${date}T23:59:59`),
        },
      },
      orderBy: { paidAt: 'desc' },
      include: {
        appointment: {
          select: {
            id: true,
            appointmentNo: true,
            appointmentDate: true,
            customer: { select: { id: true, name: true } },
            pet: { select: { id: true, name: true } },
          },
        },
        staff: { select: { id: true, name: true } },
      },
    })
  },

  /** 日结汇总 */
  async dailySummary(date: string) {
    const payments = await prisma.payment.findMany({
      where: {
        isDeleted: false,
        paidAt: {
          gte: new Date(`${date}T00:00:00`),
          lt: new Date(`${date}T23:59:59`),
        },
      },
      select: { amount: true, method: true },
    })

    const summary = {
      total: 0,
      byMethod: {} as Record<string, { count: number; total: number }>,
      count: payments.length,
    }

    for (const p of payments) {
      summary.total += p.amount
      if (!summary.byMethod[p.method]) {
        summary.byMethod[p.method] = { count: 0, total: 0 }
      }
      summary.byMethod[p.method].count++
      summary.byMethod[p.method].total += p.amount
    }

    return summary
  },

  /** 查询待结账的预约（completed 状态） */
  async findPendingCheckout() {
    return prisma.appointment.findMany({
      where: {
        isDeleted: false,
        status: 'completed',
      },
      orderBy: { updatedAt: 'desc' },
      take: 20,
      include: {
        customer: { select: { id: true, name: true, phone: true } },
        pet: { select: { id: true, name: true, species: true } },
        appointmentItems: {
          where: { isDeleted: false, status: { not: 'cancelled' } },
          include: { service: { select: { id: true, name: true } } },
        },
      },
    })
  },
}
