import prisma from '../lib/prisma.js'
import type { Prisma } from '@prisma/client'
import { hash } from 'bcryptjs'

export type StaffFilter = {
  search?: string
  role?: string
  isActive?: boolean
}

export type PaginationParams = {
  page: number
  pageSize: number
}

export const staffRepo = {
  async findAll(filter: StaffFilter, pagination: PaginationParams) {
    const where: Prisma.StaffWhereInput = {}

    if (filter.search) {
      where.OR = [{ name: { contains: filter.search } }, { phone: { contains: filter.search } }]
    }
    if (filter.role) where.role = filter.role
    if (filter.isActive !== undefined) where.isActive = filter.isActive

    const [data, total] = await Promise.all([
      prisma.staff.findMany({
        where,
        orderBy: [{ isActive: 'desc' }, { createdAt: 'asc' }],
        skip: (pagination.page - 1) * pagination.pageSize,
        take: pagination.pageSize,
        select: {
          id: true,
          name: true,
          phone: true,
          role: true,
          avatarUrl: true,
          commissionType: true,
          commissionValue: true,
          isActive: true,
          hiredDate: true,
          createdAt: true,
        },
      }),
      prisma.staff.count({ where }),
    ])

    return {
      data,
      total,
      page: pagination.page,
      pageSize: pagination.pageSize,
      totalPages: Math.ceil(total / pagination.pageSize),
    }
  },

  async findById(id: number) {
    return prisma.staff.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        phone: true,
        role: true,
        avatarUrl: true,
        commissionType: true,
        commissionValue: true,
        isActive: true,
        hiredDate: true,
        createdAt: true,
        updatedAt: true,
      },
    })
  },

  async create(dto: {
    name: string
    phone: string
    password: string
    role: string
    commissionType?: string
    commissionValue?: number
    hiredDate?: string
  }) {
    const passwordHash = await hash(dto.password, 10)
    return prisma.staff.create({
      data: { ...dto, password: passwordHash },
      select: {
        id: true,
        name: true,
        phone: true,
        role: true,
        avatarUrl: true,
        commissionType: true,
        commissionValue: true,
        isActive: true,
        hiredDate: true,
        createdAt: true,
      },
    })
  },

  async update(id: number, dto: Prisma.StaffUpdateInput) {
    return prisma.staff.update({
      where: { id },
      data: dto,
      select: {
        id: true,
        name: true,
        phone: true,
        role: true,
        avatarUrl: true,
        commissionType: true,
        commissionValue: true,
        isActive: true,
        hiredDate: true,
        createdAt: true,
        updatedAt: true,
      },
    })
  },

  async toggleActive(id: number, isActive: boolean) {
    return prisma.staff.update({
      where: { id },
      data: { isActive },
      select: { id: true, isActive: true },
    })
  },
}
