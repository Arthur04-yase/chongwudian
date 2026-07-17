import { staffRepo, type StaffFilter, type PaginationParams } from '../repositories/staff.repo.js'
import { AppError } from '../utils/app-error.js'
import { ErrorCode } from '../constants/error-codes.js'

const VALID_ROLES = ['owner', 'groomer', 'receptionist']

export const staffService = {
  async list(filter: StaffFilter, pagination: PaginationParams) {
    return staffRepo.findAll(filter, pagination)
  },

  async getById(id: number) {
    const staff = await staffRepo.findById(id)
    if (!staff) throw AppError.notFound('员工')
    return staff
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
    if (!dto.name?.trim()) throw AppError.badRequest('姓名不能为空')
    if (!/^1[3-9]\d{9}$/.test(dto.phone)) throw AppError.badRequest('手机号格式不正确')
    if (!dto.password || dto.password.length < 6) throw AppError.badRequest('密码至少6位')
    if (!VALID_ROLES.includes(dto.role)) throw AppError.badRequest('角色无效')
    return staffRepo.create(dto)
  },

  async update(id: number, dto: Record<string, unknown>) {
    await this.getById(id)
    // 不允许修改角色为 owner
    if (dto.role && !VALID_ROLES.includes(dto.role as string)) throw AppError.badRequest('角色无效')
    if (dto.phone && !/^1[3-9]\d{9}$/.test(String(dto.phone)))
      throw AppError.badRequest('手机号格式不正确')
    return staffRepo.update(id, dto as any)
  },

  async toggleActive(id: number, isActive: boolean) {
    await this.getById(id)
    return staffRepo.toggleActive(id, isActive)
  },
}
