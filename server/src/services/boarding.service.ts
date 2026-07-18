import { boardingRepo } from '../repositories/boarding.repo.js'
import prisma from '../lib/prisma.js'
import { AppError } from '../utils/app-error.js'

const LOG_TYPES = ['feeding', 'walking', 'water', 'cleaning', 'medical', 'other']

export const boardingService = {
  async list(status?: string) {
    return boardingRepo.findAll(status)
  },

  async cages() {
    return boardingRepo.cageStatus()
  },

  async getById(id: number) {
    const b = await boardingRepo.findById(id)
    if (!b) throw AppError.notFound('寄养记录')
    return b
  },

  async checkin(dto: {
    petId: number
    customerId: number
    cageNo: string
    checkInDate: string
    checkOutDate: string
    dailyRate: number
    deposit: number
    broughtItems?: string
    emergencyContact?: string
    notes?: string
  }) {
    if (!dto.petId || !dto.customerId) throw AppError.badRequest('请选择宠物和客户')
    if (!dto.cageNo) throw AppError.badRequest('请选择笼舍')
    if (!dto.checkInDate || !dto.checkOutDate) throw AppError.badRequest('请选择入住和退房日期')

    // 客户校验
    const customer = await prisma.customer.findFirst({
      where: { id: dto.customerId, isDeleted: false },
    })
    if (!customer) throw AppError.notFound('客户')

    // 宠物归属校验
    const pet = await prisma.pet.findFirst({
      where: { id: dto.petId, customerId: dto.customerId, isDeleted: false },
    })
    if (!pet) throw AppError.badRequest('宠物不属于该客户')

    // 笼舍冲突检测
    const occupied = await prisma.boarding.findFirst({
      where: { cageNo: dto.cageNo, status: 'active', isDeleted: false },
    })
    if (occupied)
      throw AppError.conflict(
        `${dto.cageNo} 号笼已被 ${occupied.petId} 占用`,
        'BOARDING_CAGE_OCCUPIED' as any
      )

    return boardingRepo.create(dto)
  },

  async checkout(id: number, actualCheckOut: string) {
    const b = await boardingRepo.findById(id)
    if (!b || b.status !== 'active') throw AppError.badRequest('该寄养记录无法退房')
    return boardingRepo.checkout(id, actualCheckOut)
  },

  async addCareLog(boardingId: number, staffId: number, logType: string, content: string) {
    if (!content?.trim()) throw AppError.badRequest('内容不能为空')
    if (!LOG_TYPES.includes(logType)) throw AppError.badRequest('日志类型无效')
    return boardingRepo.addCareLog(boardingId, staffId, logType, content.trim())
  },

  async deleteCareLog(id: number) {
    try {
      await boardingRepo.deleteCareLog(id)
    } catch {
      throw AppError.notFound('日志')
    }
  },
}
