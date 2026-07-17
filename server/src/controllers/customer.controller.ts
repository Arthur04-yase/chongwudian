import type { Response, NextFunction } from 'express'
import { customerService } from '../services/customer.service.js'
import { success, created, paginated } from '../utils/response.js'
import type { AuthenticatedRequest } from '../types/index.js'

export async function list(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const q = req.query as Record<string, string | undefined>
    const page = Math.max(1, parseInt(q.page || '1'))
    const pageSize = Math.min(100, Math.max(1, parseInt(q.pageSize || '20')))
    const filter = {
      search: q.search || undefined,
      source: q.source || undefined,
      isMember: q.isMember === 'true' ? true : undefined,
    }
    const result = await customerService.list(filter, { page, pageSize })
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
    const customer = await customerService.getById(parseInt(String(req.params.id)))
    success(res, customer)
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
    const customer = await customerService.create(req.body)
    created(res, customer)
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
    const customer = await customerService.update(parseInt(String(req.params.id)), req.body)
    success(res, customer)
  } catch (err) {
    next(err)
  }
}

export async function remove(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    await customerService.delete(parseInt(String(req.params.id)))
    success(res, null, 204)
  } catch (err) {
    next(err)
  }
}
