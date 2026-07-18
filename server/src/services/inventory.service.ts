import { inventoryRepo } from '../repositories/inventory.repo.js'
import { AppError } from '../utils/app-error.js'

const VALID_TYPES = ['in', 'out', 'loss']
const VALID_CATEGORIES = ['consumable', 'retail', 'food', 'other']

export const inventoryService = {
  async list(category?: string, search?: string) {
    const products = await inventoryRepo.findAll(category, search)
    // 副作用：标注低库存
    return products.map((p) => ({
      ...p,
      isLowStock: p.safetyStock > 0 && p.currentStock <= p.safetyStock,
    }))
  },

  async getById(id: number) {
    const p = await inventoryRepo.findById(id)
    if (!p) throw AppError.notFound('商品')
    return p
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
    if (!dto.name?.trim()) throw AppError.badRequest('商品名称不能为空')
    if (!VALID_CATEGORIES.includes(dto.category)) throw AppError.badRequest('分类无效')
    return inventoryRepo.create(dto)
  },

  async update(id: number, dto: Record<string, unknown>) {
    await this.getById(id)
    return inventoryRepo.update(id, dto)
  },

  async recordLog(dto: {
    productId: number
    type: string
    quantity: number
    createdBy: number
    notes?: string
  }) {
    if (!VALID_TYPES.includes(dto.type)) throw AppError.badRequest('操作类型无效')
    if (!dto.quantity || dto.quantity <= 0) throw AppError.badRequest('数量必须大于0')

    try {
      return await inventoryRepo.recordLog(dto)
    } catch (e: unknown) {
      const msg = (e as Error).message
      if (msg === 'PRODUCT_NOT_FOUND') throw AppError.notFound('商品')
      if (msg === 'STOCK_INSUFFICIENT') throw AppError.badRequest('库存不足，无法出库')
      throw e
    }
  },

  async getLogs(productId: number) {
    return inventoryRepo.getLogs(productId)
  },
}
