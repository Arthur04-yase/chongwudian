import type { Response, NextFunction } from 'express'
import { dashboardRepo } from '../repositories/dashboard.repo.js'
import { success } from '../utils/response.js'
import type { AuthenticatedRequest } from '../types/index.js'

export async function today(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const date = (req.query.date as string) || new Date().toISOString().slice(0, 10)
    const data = await dashboardRepo.getToday(date)
    success(res, data)
  } catch (err) {
    next(err)
  }
}
