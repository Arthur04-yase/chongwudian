import { appointmentRepo } from '../repositories/appointment.repo.js'
import prisma from '../lib/prisma.js'
import { AppError } from '../utils/app-error.js'
import { AppointmentStatus, AppointmentStatusTransitions } from '../constants/enums.js'

export const appointmentService = {
  /** 创建预约 */
  async create(dto: {
    customerId: number
    petId: number
    staffId?: number | null
    appointmentDate: string
    startTime: string
    source: string
    notes?: string
    createdBy: number
    items: { serviceId: number; price: number; commissionAmount: number }[]
  }) {
    // 校验客户存在
    const customer = await prisma.customer.findFirst({
      where: { id: dto.customerId, isDeleted: false },
    })
    if (!customer) throw AppError.notFound('客户')

    // 校验宠物属于该客户
    const pet = await prisma.pet.findFirst({
      where: { id: dto.petId, customerId: dto.customerId, isDeleted: false },
    })
    if (!pet) throw AppError.badRequest('宠物不属于该客户或不存在')

    // 校验服务项目
    if (!dto.items.length) throw AppError.badRequest('请至少选择一个服务项目')
    const serviceIds = dto.items.map((i) => i.serviceId)
    const services = await prisma.service.findMany({
      where: { id: { in: serviceIds }, isActive: true, isDeleted: false },
    })
    if (services.length !== serviceIds.length)
      throw AppError.badRequest('部分服务项目不存在或已下架')

    // 计算结束时间
    const totalMinutes = services.reduce((sum, s) => sum + (s.durationMinutes || 0), 0)
    const [h, m] = dto.startTime.split(':').map(Number)
    const endDate = new Date(2026, 0, 1, h, m + totalMinutes)
    const endTime = `${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}`

    // 冲突检测（仅检测同一美容师同一时段）
    if (dto.staffId) {
      const overlaps = await appointmentRepo.findOverlaps(
        dto.appointmentDate,
        dto.staffId,
        dto.startTime,
        endTime
      )
      if (overlaps.length > 0) {
        const detail = overlaps.map((o) => `${o.pet.name}(${o.startTime}-${o.endTime})`).join('、')
        throw AppError.conflict(
          `该美容师在 ${dto.startTime}-${endTime} 时段已有预约：${detail}`,
          'APPOINTMENT_TIME_CONFLICT' as any
        )
      }
    }

    // 生成预约编号
    const appointmentNo = await appointmentRepo.generateNo(dto.appointmentDate)

    // 创建
    return appointmentRepo.create({
      ...dto,
      endTime,
      appointmentNo,
      status: AppointmentStatus.PENDING,
    })
  },

  /** 按日期查询 */
  async listByDate(date: string) {
    return appointmentRepo.findByDate(date)
  },

  /** 详情 */
  async getById(id: number) {
    const appt = await appointmentRepo.findById(id)
    if (!appt) throw AppError.notFound('预约单')
    return appt
  },

  /** 状态变更 */
  async changeStatus(id: number, targetStatus: string) {
    const appt = await appointmentRepo.findById(id)
    if (!appt) throw AppError.notFound('预约单')

    const allowed = AppointmentStatusTransitions[appt.status]
    if (!allowed || !allowed.includes(targetStatus)) {
      throw AppError.badRequest(`不允许从「${appt.status}」变更为「${targetStatus}」`)
    }
    return appointmentRepo.updateStatus(id, targetStatus)
  },
}
