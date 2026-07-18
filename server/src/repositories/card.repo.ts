import prisma from '../lib/prisma.js'

function generateCardNo(type: string): string {
  const prefix = type === 'balance' ? 'C' : 'T'
  const seq = Date.now().toString(36).toUpperCase().slice(-6)
  return `${prefix}${new Date().getFullYear()}-${seq}`
}

export const cardRepo = {
  /** 客户的所有会员卡 */
  async findByCustomer(customerId: number) {
    return prisma.membershipCard.findMany({
      where: { customerId, isActive: true },
      orderBy: { issuedDate: 'desc' },
    })
  },

  /** 单张卡详情+交易记录 */
  async findById(id: number) {
    return prisma.membershipCard.findUnique({
      where: { id },
      include: {
        transactions: { orderBy: { createdAt: 'desc' }, take: 50 },
        customer: { select: { id: true, name: true } },
      },
    })
  },

  /** 开卡 */
  async create(dto: {
    customerId: number
    cardType: string
    balance?: number
    totalTimes?: number
    discountRate?: number
    expiryDate?: string
  }) {
    const cardNo = generateCardNo(dto.cardType)
    return prisma.membershipCard.create({
      data: {
        customerId: dto.customerId,
        cardType: dto.cardType,
        cardNo,
        balance: dto.cardType === 'balance' ? dto.balance || 0 : 0,
        totalTimes: dto.cardType === 'times' ? dto.totalTimes || 0 : 0,
        usedTimes: 0,
        discountRate: dto.discountRate || 1.0,
        issuedDate: new Date().toISOString().slice(0, 10),
        expiryDate: dto.expiryDate || null,
      },
    })
  },

  /** 充值 */
  async recharge(id: number, amount: number, times: number) {
    return prisma.$transaction(async (tx) => {
      const card = await tx.membershipCard.findUnique({ where: { id } })
      if (!card) throw new Error('CARD_NOT_FOUND')

      if (card.cardType === 'balance') {
        await tx.membershipCard.update({
          where: { id },
          data: { balance: { increment: amount } },
        })
        await tx.cardTransaction.create({
          data: { cardId: id, type: 'recharge', amount, balanceAfter: card.balance + amount },
        })
      } else {
        await tx.membershipCard.update({
          where: { id },
          data: { totalTimes: { increment: times } },
        })
        await tx.cardTransaction.create({
          data: { cardId: id, type: 'recharge', times, balanceAfter: 0 },
        })
      }

      return tx.membershipCard.findUnique({ where: { id } })
    })
  },

  /** 扣费（收银台用） */
  async deduct(id: number, amount: number, appointmmentId?: number) {
    return prisma.$transaction(async (tx) => {
      const card = await tx.membershipCard.findUnique({ where: { id } })
      if (!card) throw new Error('CARD_NOT_FOUND')

      if (card.cardType === 'balance') {
        if (card.balance < amount) throw new Error('BALANCE_INSUFFICIENT')
        await tx.membershipCard.update({
          where: { id },
          data: { balance: { decrement: amount } },
        })
        await tx.cardTransaction.create({
          data: {
            cardId: id,
            type: 'deduct',
            amount,
            balanceAfter: card.balance - amount,
            appointmmentId,
          },
        })
      } else {
        if (card.totalTimes - card.usedTimes < amount) throw new Error('TIMES_INSUFFICIENT')
        await tx.membershipCard.update({
          where: { id },
          data: { usedTimes: { increment: Math.round(amount) } },
        })
        await tx.cardTransaction.create({
          data: {
            cardId: id,
            type: 'deduct',
            times: Math.round(amount),
            balanceAfter: 0,
            appointmmentId,
          },
        })
      }

      return tx.membershipCard.findUnique({ where: { id } })
    })
  },

  /** 停用卡 */
  async deactivate(id: number) {
    return prisma.membershipCard.update({ where: { id }, data: { isActive: false } })
  },

  /** 卡交易记录 */
  async getTransactions(cardId: number) {
    return prisma.cardTransaction.findMany({
      where: { cardId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })
  },
}
