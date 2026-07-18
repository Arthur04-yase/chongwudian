import prisma from '../lib/prisma.js'

function generateCardNo(type: string): string {
  const prefix = type === 'balance' ? 'C' : 'T'
  const seq = Date.now().toString(36).toUpperCase().slice(-6)
  return `${prefix}${new Date().getFullYear()}-${seq}`
}

export const cardRepo = {
  async findByCustomer(customerId: number) {
    return prisma.membershipCard.findMany({
      where: { customerId, isActive: true },
      orderBy: { issuedDate: 'desc' },
    })
  },

  async findById(id: number) {
    return prisma.membershipCard.findUnique({
      where: { id },
      include: {
        transactions: { orderBy: { createdAt: 'desc' }, take: 50 },
        customer: { select: { id: true, name: true } },
      },
    })
  },

  async create(dto: {
    customerId: number
    cardType: string
    balance?: number
    totalTimes?: number
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
        issuedDate: new Date().toISOString().slice(0, 10),
        expiryDate: dto.expiryDate || null,
      },
    })
  },

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

  async deduct(id: number, amount: number, appointmentId?: number) {
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
            appointmentId,
          },
        })
      } else {
        const used = Math.round(amount)
        if (card.totalTimes - card.usedTimes < used) throw new Error('TIMES_INSUFFICIENT')
        await tx.membershipCard.update({
          where: { id },
          data: { usedTimes: { increment: used } },
        })
        await tx.cardTransaction.create({
          data: { cardId: id, type: 'deduct', times: used, balanceAfter: 0, appointmentId },
        })
      }
      return tx.membershipCard.findUnique({ where: { id } })
    })
  },

  async deactivate(id: number) {
    return prisma.membershipCard.update({ where: { id }, data: { isActive: false } })
  },
}
