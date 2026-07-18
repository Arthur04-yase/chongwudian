import prisma from '../lib/prisma.js'

export const inventoryRepo = {
  async findAll(category?: string, search?: string) {
    const where: Record<string, unknown> = { isActive: true }
    if (category) where.category = category
    if (search) where.name = { contains: search }

    return prisma.product.findMany({
      where,
      orderBy: [{ currentStock: 'asc' }, { name: 'asc' }],
    })
  },

  async findById(id: number) {
    return prisma.product.findUnique({ where: { id } })
  },

  async create(dto: {
    name: string
    category: string
    unit: string
    currentStock: number
    safetyStock: number
    costPrice: number
    retailPrice: number
  }) {
    return prisma.product.create({ data: dto })
  },

  async update(id: number, dto: Record<string, unknown>) {
    return prisma.product.update({ where: { id }, data: dto })
  },

  /** 入库/出库/报损 */
  async recordLog(dto: {
    productId: number
    type: string
    quantity: number
    createdBy: number
    notes?: string
  }) {
    return prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({ where: { id: dto.productId } })
      if (!product) throw new Error('PRODUCT_NOT_FOUND')

      const delta = dto.type === 'in' ? dto.quantity : -dto.quantity
      const newStock = product.currentStock + delta
      if (newStock < 0) throw new Error('STOCK_INSUFFICIENT')

      await tx.product.update({
        where: { id: dto.productId },
        data: { currentStock: newStock },
      })

      return tx.inventoryLog.create({
        data: {
          productId: dto.productId,
          type: dto.type,
          quantity: dto.quantity,
          createdBy: dto.createdBy,
          notes: dto.notes ?? null,
        },
        include: {
          product: { select: { id: true, name: true, currentStock: false } },
          staff: { select: { id: true, name: true } },
        },
      })
    })
  },

  async getLogs(productId: number) {
    return prisma.inventoryLog.findMany({
      where: { productId },
      orderBy: { createdAt: 'desc' },
      take: 30,
      include: { staff: { select: { id: true, name: true } } },
    })
  },
}
