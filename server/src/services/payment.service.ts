import { paymentRepo } from '../repositories/payment.repo.js'
import prisma from '../lib/prisma.js'
import { AppError } from '../utils/app-error.js'

const VALID_METHODS = ['wechat', 'alipay', 'cash', 'card_balance', 'card_times']

export const paymentService = {
  /** 结账 — 收款+改状态+更新客户消费 */
  async checkout(dto: {
    appointmentId: number
    amount: number
    method: string
    transactionNo?: string
    createdBy: number
    notes?: string
  }) {
    if (!VALID_METHODS.includes(dto.method)) throw AppError.badRequest('支付方式无效')
    if (typeof dto.amount !== 'number' || dto.amount <= 0)
      throw AppError.badRequest('金额必须大于0')

    // 校验预约单状态
    const appt = await prisma.appointment.findFirst({
      where: { id: dto.appointmentId, isDeleted: false },
    })
    if (!appt) throw AppError.notFound('预约单')
    if (appt.status !== 'completed') {
      throw AppError.badRequest(`当前状态「${appt.status}」不支持结账，请先完成服务`)
    }

    // 校验金额不低于服务总价
    const items = await prisma.appointmentItem.findMany({
      where: { appointmentId: dto.appointmentId, isDeleted: false, status: { not: 'cancelled' } },
    })
    const expectedAmount = items.reduce((sum, i) => sum + i.price, 0)
    if (dto.amount < expectedAmount) {
      throw AppError.badRequest(`收款金额 ¥${dto.amount} 低于应付 ¥${expectedAmount}`)
    }

    return paymentRepo.checkout(dto)
  },

  /** 支付记录列表 */
  async listByDate(date: string) {
    return paymentRepo.findByDate(date)
  },

  /** 日结单 */
  async dailySummary(date: string) {
    return paymentRepo.dailySummary(date)
  },

  /** 待结账预约 */
  async pendingCheckout() {
    return paymentRepo.findPendingCheckout()
  },
}
