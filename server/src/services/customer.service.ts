import {
  customerRepo,
  type CustomerFilter,
  type PaginationParams,
} from '../repositories/customer.repo.js'
import { AppError } from '../utils/app-error.js'

const SOURCES = ['朋友介绍', '大众点评', '路过', '抖音', '其他']

export const customerService = {
  async list(filter: CustomerFilter, pagination: PaginationParams) {
    return customerRepo.findAll(filter, pagination)
  },

  async getById(id: number) {
    const customer = await customerRepo.findById(id)
    if (!customer) throw AppError.notFound('客户')
    return customer
  },

  async create(dto: {
    name: string
    phone: string
    wechatId?: string
    address?: string
    source?: string
    notes?: string
  }) {
    if (!dto.name?.trim()) throw AppError.badRequest('姓名不能为空')
    if (!/^1[3-9]\d{9}$/.test(dto.phone)) throw AppError.badRequest('手机号格式不正确')
    if (dto.source && !SOURCES.includes(dto.source)) throw AppError.badRequest('来源渠道无效')

    const exists = await customerRepo.findByPhone(dto.phone)
    if (exists)
      throw AppError.conflict(
        '该手机号已存在（客户：' + exists.name + '）',
        'CUSTOMER_PHONE_DUPLICATE' as any
      )

    return customerRepo.create({
      name: dto.name.trim(),
      phone: dto.phone,
      wechatId: dto.wechatId || undefined,
      address: dto.address || undefined,
      source: dto.source || undefined,
      notes: dto.notes || undefined,
    })
  },

  async update(id: number, dto: Record<string, unknown>) {
    await this.getById(id)
    if (dto.phone && !/^1[3-9]\d{9}$/.test(String(dto.phone)))
      throw AppError.badRequest('手机号格式不正确')
    return customerRepo.update(id, dto as any)
  },

  async delete(id: number) {
    await this.getById(id)
    return customerRepo.softDelete(id)
  },
}
