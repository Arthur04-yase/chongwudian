import prisma from '../lib/prisma.js'
import type { Prisma } from '@prisma/client'

export const petRepo = {
  /** 查询宠物完整档案：主人+备注（含员工名）+最近服务记录 */
  async findById(id: number) {
    return prisma.pet.findFirst({
      where: { id, isDeleted: false },
      include: {
        customer: { select: { id: true, name: true, phone: true, avatarUrl: true } },
        petNotes: {
          orderBy: { createdAt: 'desc' },
          include: { staff: { select: { id: true, name: true } } },
        },
        appointments: {
          where: { isDeleted: false },
          orderBy: { appointmentDate: 'desc' },
          take: 20,
          include: {
            appointmentItems: {
              include: { service: { select: { id: true, name: true, category: true } } },
            },
            assignedStaff: { select: { id: true, name: true } },
          },
        },
      },
    })
  },

  /** 计算年龄字符串 */
  getAge(birthDate: string | null): string | null {
    if (!birthDate) return null
    const bd = new Date(birthDate)
    if (isNaN(bd.getTime())) return null
    const diffMs = Date.now() - bd.getTime()
    const years = diffMs / (365.25 * 24 * 60 * 60 * 1000)
    if (years < 1) {
      const months = Math.floor(years * 12)
      return `${months}个月`
    }
    return `${years.toFixed(1)}岁`
  },

  async create(dto: {
    customerId: number
    name: string
    species: string
    breed?: string
    gender?: string
    isNeutered?: boolean
    birthDate?: string
    weightKg?: number
    color?: string
    vaccineExpiry?: string
    isAggressive?: boolean
    notes?: string
  }) {
    return prisma.pet.create({
      data: dto,
      select: {
        id: true,
        customerId: true,
        name: true,
        species: true,
        breed: true,
        gender: true,
        birthDate: true,
        weightKg: true,
        color: true,
        vaccineExpiry: true,
        isAggressive: true,
        isNeutered: true,
        avatarUrl: true,
        createdAt: true,
      },
    })
  },

  async update(id: number, dto: Prisma.PetUpdateInput) {
    return prisma.pet.update({
      where: { id },
      data: dto,
      select: {
        id: true,
        customerId: true,
        name: true,
        species: true,
        breed: true,
        gender: true,
        isNeutered: true,
        birthDate: true,
        weightKg: true,
        color: true,
        vaccineExpiry: true,
        avatarUrl: true,
        coverImage: true,
        isAggressive: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    })
  },

  async softDelete(id: number) {
    return prisma.pet.update({ where: { id }, data: { isDeleted: true } })
  },

  /** 宠物备注 CRUD */
  async addNote(petId: number, staffId: number, category: string, content: string) {
    return prisma.petNote.create({
      data: { petId, staffId, category, content },
      include: { staff: { select: { id: true, name: true } } },
    })
  },

  async deleteNote(noteId: number) {
    return prisma.petNote.delete({ where: { id: noteId } })
  },

  /** 获取宠物所属主人的所有宠物 */
  async findByCustomer(customerId: number) {
    return prisma.pet.findMany({
      where: { customerId, isDeleted: false },
      select: { id: true, name: true, species: true, breed: true, avatarUrl: true, gender: true },
    })
  },
}
