import prisma from '../lib/prisma.js'
import {
  serviceRepo,
  type ServiceFilter,
  type PaginationParams,
} from '../repositories/service.repo.js'
import { AppError } from '../utils/app-error.js'

export const serviceService = {
  async list(filter: ServiceFilter, pagination: PaginationParams) {
    return serviceRepo.findAll(filter, pagination)
  },

  async getById(id: number) {
    const service = await serviceRepo.findById(id)
    if (!service) {
      throw AppError.notFound('服务项目')
    }
    return service
  },

  async create(dto: {
    name: string
    category: string
    sizeCategory: string
    price: number
    memberPrice?: number | null
    durationMinutes: number
    commissionAmount: number
    commissionType: string
    description?: string | null
    coverImage?: string | null
  }) {
    const maxSort = await this.getMaxSortOrder()
    return serviceRepo.create({
      ...dto,
      sortOrder: maxSort + 1,
    })
  },

  async update(
    id: number,
    dto: {
      name?: string
      category?: string
      sizeCategory?: string
      price?: number
      memberPrice?: number | null
      durationMinutes?: number
      commissionAmount?: number
      commissionType?: string
      description?: string | null
      coverImage?: string | null
      isActive?: boolean
    }
  ) {
    await this.getById(id)
    return serviceRepo.update(id, dto)
  },

  async delete(id: number) {
    await this.getById(id)
    return serviceRepo.softDelete(id)
  },

  async batchToggleActive(ids: number[], isActive: boolean) {
    if (!ids.length) {
      throw AppError.badRequest('请至少选择一个服务项目')
    }
    return serviceRepo.batchToggleActive(ids, isActive)
  },

  async uploadCover(id: number, filename: string) {
    await this.getById(id)
    const url = `/uploads/services/${filename}`
    return serviceRepo.updateCover(id, url)
  },

  async getMaxSortOrder(): Promise<number> {
    const result = await prisma.service.findFirst({
      where: { isDeleted: false },
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    })
    return result?.sortOrder ?? 0
  },
}
