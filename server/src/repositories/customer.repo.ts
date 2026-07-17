import prisma from '../lib/prisma.js'
import type { Prisma } from '@prisma/client'

export type CustomerFilter = { search?: string; source?: string; isMember?: boolean }
export type PaginationParams = { page: number; pageSize: number }

export const customerRepo = {
  async findAll(filter: CustomerFilter, pagination: PaginationParams) {
    const where: Prisma.CustomerWhereInput = { isDeleted: false }

    if (filter.search) {
      where.OR = [
        { name: { contains: filter.search } },
        { phone: { contains: filter.search } },
        { wechatId: { contains: filter.search } },
      ]
    }
    if (filter.source) where.source = filter.source
    // isMember 通过子查询：是否拥有至少一张有效会员卡
    if (filter.isMember !== undefined) {
      where.membershipCards = { some: { isActive: true } }
    }

    const [data, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        orderBy: { lastVisitDate: { sort: 'desc', nulls: 'last' } },
        skip: (pagination.page - 1) * pagination.pageSize,
        take: pagination.pageSize,
        include: {
          _count: { select: { pets: true, membershipCards: true } },
        },
      }),
      prisma.customer.count({ where }),
    ])

    return {
      data: data.map((c) => ({
        id: c.id,
        name: c.name,
        phone: c.phone,
        source: c.source,
        totalSpent: c.totalSpent,
        lastVisitDate: c.lastVisitDate,
        visitCount: c.visitCount,
        petCount: c._count.pets,
        isMember: c._count.membershipCards > 0,
        createdAt: c.createdAt,
      })),
      total,
      page: pagination.page,
      pageSize: pagination.pageSize,
      totalPages: Math.ceil(total / pagination.pageSize),
    }
  },

  async findById(id: number) {
    return prisma.customer.findFirst({
      where: { id, isDeleted: false },
      include: {
        pets: {
          select: {
            id: true,
            name: true,
            species: true,
            breed: true,
            avatarUrl: true,
            gender: true,
            weightKg: true,
            vaccineExpiry: true,
          },
        },
        membershipCards: {
          where: { isActive: true },
          select: {
            id: true,
            cardType: true,
            cardNo: true,
            balance: true,
            totalTimes: true,
            usedTimes: true,
            discountRate: true,
            expiryDate: true,
          },
        },
      },
    })
  },

  async create(dto: {
    name: string
    phone: string
    avatarUrl?: string
    wechatId?: string
    address?: string
    source?: string
    notes?: string
  }) {
    return prisma.customer.create({
      data: dto,
      select: { id: true, name: true, phone: true, source: true, createdAt: true },
    })
  },

  async update(id: number, dto: Prisma.CustomerUpdateInput) {
    return prisma.customer.update({
      where: { id },
      data: dto,
      select: {
        id: true,
        name: true,
        phone: true,
        avatarUrl: true,
        wechatId: true,
        address: true,
        source: true,
        totalSpent: true,
        lastVisitDate: true,
        visitCount: true,
        notes: true,
        updatedAt: true,
      },
    })
  },

  async softDelete(id: number) {
    return prisma.customer.update({ where: { id }, data: { isDeleted: true } })
  },

  /** 手机号查重 — 用于新增客户时校验 */
  async findByPhone(phone: string) {
    return prisma.customer.findFirst({ where: { phone, isDeleted: false } })
  },
}
