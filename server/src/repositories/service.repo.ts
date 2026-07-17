import prisma from '../lib/prisma.js'
import type { Prisma } from '@prisma/client'

/** 查询过滤条件 */
export interface ServiceFilter {
  search?: string
  category?: string
  sizeCategory?: string
  isActive?: boolean
}

/** 分页参数 */
export interface PaginationParams {
  page: number
  pageSize: number
}

/** 返回结果 */
export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

/**
 * 服务项目数据访问层
 * 所有对 Service 表的数据库操作集中于此
 */
export const serviceRepo = {
  /** 分页查询服务列表 */
  async findAll(
    filter: ServiceFilter,
    pagination: PaginationParams
  ): Promise<PaginatedResult<unknown>> {
    const where: Prisma.ServiceWhereInput = {
      isDeleted: false,
    }

    if (filter.search) {
      where.name = { contains: filter.search }
    }

    if (filter.category) {
      where.category = filter.category
    }

    if (filter.sizeCategory) {
      where.sizeCategory = filter.sizeCategory
    }

    if (filter.isActive !== undefined) {
      where.isActive = filter.isActive
    }

    const [data, total] = await Promise.all([
      prisma.service.findMany({
        where,
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
        skip: (pagination.page - 1) * pagination.pageSize,
        take: pagination.pageSize,
      }),
      prisma.service.count({ where }),
    ])

    return {
      data,
      total,
      page: pagination.page,
      pageSize: pagination.pageSize,
      totalPages: Math.ceil(total / pagination.pageSize),
    }
  },

  /** 根据 ID 查询单个服务 */
  async findById(id: number) {
    return prisma.service.findFirst({
      where: { id, isDeleted: false },
    })
  },

  /** 创建服务 */
  async create(dto: Prisma.ServiceCreateInput) {
    return prisma.service.create({ data: dto })
  },

  /** 更新服务 */
  async update(id: number, dto: Prisma.ServiceUpdateInput) {
    return prisma.service.update({
      where: { id },
      data: dto,
    })
  },

  /** 软删除服务 */
  async softDelete(id: number) {
    return prisma.service.update({
      where: { id },
      data: { isDeleted: true },
    })
  },

  /** 批量更新启用状态 */
  async batchToggleActive(ids: number[], isActive: boolean) {
    return prisma.service.updateMany({
      where: { id: { in: ids } },
      data: { isActive },
    })
  },

  /** 更新封面图 */
  async updateCover(id: number, coverImage: string) {
    return prisma.service.update({
      where: { id },
      data: { coverImage },
    })
  },
}
