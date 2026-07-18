import { cardRepo } from '../repositories/card.repo.js'
import prisma from '../lib/prisma.js'
import { AppError } from '../utils/app-error.js'

export const cardService = {
  async listByCustomer(customerId: number) {
    return cardRepo.findByCustomer(customerId)
  },

  async getById(id: number) {
    const card = await cardRepo.findById(id)
    if (!card) throw AppError.notFound('会员卡')
    return card
  },

  async create(dto: {
    customerId: number
    cardType: string
    balance?: number
    totalTimes?: number
    expiryDate?: string
  }) {
    if (!['balance', 'times'].includes(dto.cardType)) throw AppError.badRequest('卡类型无效')
    if (dto.cardType === 'balance' && (!dto.balance || dto.balance <= 0))
      throw AppError.badRequest('储值金额必须大于0')
    if (dto.cardType === 'times' && (!dto.totalTimes || dto.totalTimes <= 0))
      throw AppError.badRequest('次数必须大于0')

    const customer = await prisma.customer.findFirst({
      where: { id: dto.customerId, isDeleted: false },
    })
    if (!customer) throw AppError.notFound('客户')

    return cardRepo.create(dto)
  },

  async recharge(id: number, amount?: number, times?: number) {
    const card = await cardRepo.findById(id)
    if (!card) throw AppError.notFound('会员卡')
    if (!card.isActive) throw AppError.badRequest('该卡已停用')

    if (card.cardType === 'balance') {
      if (!amount || amount <= 0) throw AppError.badRequest('充值金额必须大于0')
    } else {
      if (!times || times <= 0) throw AppError.badRequest('充值次数必须大于0')
    }

    return cardRepo.recharge(id, amount || 0, times || 0)
  },

  async deduct(id: number, amount: number, appointmentId?: number) {
    try {
      return await cardRepo.deduct(id, amount, appointmentId)
    } catch (e: unknown) {
      const msg = (e as Error).message
      if (msg === 'BALANCE_INSUFFICIENT') throw AppError.badRequest('储值余额不足')
      if (msg === 'TIMES_INSUFFICIENT') throw AppError.badRequest('可用次数不足')
      throw e
    }
  },

  async deactivate(id: number) {
    await this.getById(id)
    return cardRepo.deactivate(id)
  },
}
