import prisma from '../lib/prisma.js'
import type { Prisma } from '@prisma/client'

export type AppointmentFilter = {
  date?: string
  status?: string
  staffId?: number
  search?: string
}

export const appointmentRepo = {
  /** 生成预约编号：APT + YYYYMMDD + 4位序号 */
  async generateNo(date: string): Promise<string> {
    const prefix = `APT${date.replace(/-/g, '')}`
    const last = await prisma.appointment.findFirst({
      where: { appointmentNo: { startsWith: prefix } },
      orderBy: { appointmentNo: 'desc' },
      select: { appointmentNo: true },
    })
    const seq = last ? parseInt(last.appointmentNo.slice(-4)) + 1 : 1
    return `${prefix}${String(seq).padStart(4, '0')}`
  },

  /** 查询预约列表（用于列表页 + 冲突检测） */
  async findOverlaps(
    date: string,
    staffId: number,
    startTime: string,
    endTime: string,
    excludeId?: number
  ) {
    const where: Prisma.AppointmentWhereInput = {
      appointmentDate: date,
      staffId,
      isDeleted: false,
      status: { notIn: ['cancelled', 'no_show'] },
      AND: [{ startTime: { lt: endTime } }, { endTime: { gt: startTime } }],
    }
    if (excludeId) where.id = { not: excludeId }
    return prisma.appointment.findMany({
      where,
      include: {
        pet: { select: { name: true } },
        customer: { select: { name: true } },
      },
    })
  },

  /** 创建预约（含服务明细） */
  async create(dto: {
    appointmentNo: string
    customerId: number
    petId: number
    staffId?: number | null
    appointmentDate: string
    startTime: string
    endTime: string
    status: string
    source: string
    notes?: string
    createdBy: number
    items: { serviceId: number; price: number; commissionAmount: number }[]
  }) {
    return prisma.appointment.create({
      data: {
        appointmentNo: dto.appointmentNo,
        customerId: dto.customerId,
        petId: dto.petId,
        staffId: dto.staffId ?? null,
        appointmentDate: dto.appointmentDate,
        startTime: dto.startTime,
        endTime: dto.endTime,
        status: dto.status,
        source: dto.source,
        notes: dto.notes ?? null,
        createdBy: dto.createdBy,
        appointmentItems: {
          create: dto.items.map((item) => ({
            serviceId: item.serviceId,
            price: item.price,
            commissionAmount: item.commissionAmount,
            status: 'pending',
          })),
        },
      },
      include: {
        customer: { select: { id: true, name: true, phone: true } },
        pet: { select: { id: true, name: true, species: true } },
        assignedStaff: { select: { id: true, name: true } },
        appointmentItems: {
          include: { service: { select: { id: true, name: true, durationMinutes: true } } },
        },
      },
    })
  },

  /** 查询预约详情 */
  async findById(id: number) {
    return prisma.appointment.findFirst({
      where: { id, isDeleted: false },
      include: {
        customer: { select: { id: true, name: true, phone: true } },
        pet: {
          select: {
            id: true,
            name: true,
            species: true,
            breed: true,
            avatarUrl: true,
            weightKg: true,
            vaccineExpiry: true,
            isAggressive: true,
          },
        },
        assignedStaff: { select: { id: true, name: true } },
        appointmentItems: {
          include: {
            service: { select: { id: true, name: true, category: true, durationMinutes: true } },
          },
        },
      },
    })
  },

  /** 按日期查询预约列表 */
  async findByDate(date: string) {
    return prisma.appointment.findMany({
      where: {
        appointmentDate: date,
        isDeleted: false,
        status: { notIn: ['cancelled', 'no_show'] },
      },
      orderBy: { startTime: 'asc' },
      include: {
        customer: { select: { id: true, name: true, phone: true } },
        pet: { select: { id: true, name: true, species: true } },
        assignedStaff: { select: { id: true, name: true } },
        appointmentItems: {
          include: { service: { select: { id: true, name: true, category: true } } },
        },
      },
    })
  },

  /** 更新预约状态 */
  async updateStatus(id: number, status: string) {
    return prisma.appointment.update({
      where: { id },
      data: { status },
      select: { id: true, status: true, updatedAt: true },
    })
  },
}
