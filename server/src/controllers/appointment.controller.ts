import type { Response, NextFunction } from 'express'
import { appointmentService } from '../services/appointment.service.js'
import { success, created } from '../utils/response.js'
import { AppError } from '../utils/app-error.js'
import { AppointmentStatus } from '../constants/enums.js'
import type { AuthenticatedRequest } from '../types/index.js'

export async function create(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { customerId, petId, staffId, appointmentDate, startTime, source, notes, items } =
      req.body

    if (!customerId || !petId) throw AppError.badRequest('请选择客户和宠物')
    if (!appointmentDate || !startTime) throw AppError.badRequest('请选择预约日期和时间')
    if (!items?.length) throw AppError.badRequest('请至少选择一个服务项目')
    if (!/^\d{2}:\d{2}$/.test(startTime)) throw AppError.badRequest('时间格式不正确（HH:mm）')

    const appt = await appointmentService.create({
      customerId,
      petId,
      staffId: staffId || null,
      appointmentDate,
      startTime,
      source: source || 'phone',
      notes,
      createdBy: req.staff!.id,
      items,
    })
    created(res, appt)
  } catch (err) {
    next(err)
  }
}

export async function listByDate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const date = (req.query.date as string) || new Date().toISOString().slice(0, 10)
    const appointments = await appointmentService.listByDate(date)
    success(res, appointments)
  } catch (err) {
    next(err)
  }
}

export async function getById(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const appt = await appointmentService.getById(parseInt(String(req.params.id)))
    success(res, appt)
  } catch (err) {
    next(err)
  }
}

export async function changeStatus(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { status } = req.body
    const validStatuses: string[] = Object.values(AppointmentStatus)
    if (!validStatuses.includes(status)) throw AppError.badRequest('状态值无效')
    const result = await appointmentService.changeStatus(parseInt(String(req.params.id)), status)
    success(res, result)
  } catch (err) {
    next(err)
  }
}
