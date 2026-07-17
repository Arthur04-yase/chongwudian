import type { Response, NextFunction } from 'express'
import { staffService } from '../services/staff.service.js'
import { success, created, paginated } from '../utils/response.js'
import { AppError } from '../utils/app-error.js'
import type { AuthenticatedRequest } from '../types/index.js'

export async function list(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const q = req.query as Record<string, string | undefined>
    const page = Math.max(1, parseInt(q.page || '1'))
    const pageSize = Math.min(50, Math.max(1, parseInt(q.pageSize || '20')))
    const filter = {
      search: q.search || undefined,
      role: q.role || undefined,
      isActive: q.isActive !== undefined ? q.isActive === 'true' : undefined,
    }
    const result = await staffService.list(filter, { page, pageSize })
    paginated(res, result.data, {
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
      totalPages: result.totalPages,
    })
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
    const staff = await staffService.getById(parseInt(String(req.params.id)))
    success(res, staff)
  } catch (err) {
    next(err)
  }
}

export async function create(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { name, phone, password, role, commissionType, commissionValue, hiredDate } = req.body
    const staff = await staffService.create({
      name,
      phone,
      password,
      role,
      commissionType,
      commissionValue,
      hiredDate,
    })
    created(res, staff)
  } catch (err) {
    next(err)
  }
}

export async function update(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const staff = await staffService.update(parseInt(String(req.params.id)), req.body)
    success(res, staff)
  } catch (err) {
    next(err)
  }
}

export async function toggleActive(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = parseInt(String(req.params.id))
    const { isActive } = req.body
    if (typeof isActive !== 'boolean') throw AppError.badRequest('请提供 isActive')
    const result = await staffService.toggleActive(id, isActive)
    success(res, result)
  } catch (err) {
    next(err)
  }
}
