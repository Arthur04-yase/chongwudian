import type { Response, NextFunction } from 'express'
import { reportRepo } from '../repositories/report.repo.js'
import { success } from '../utils/response.js'
import type { AuthenticatedRequest } from '../types/index.js'

function getDateRange(req: AuthenticatedRequest) {
  const q = req.query as Record<string, string | undefined>
  const today = new Date().toISOString().slice(0, 10)
  const firstDay = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-01`
  return {
    startDate: q.startDate || firstDay,
    endDate: q.endDate || today,
  }
}

export async function revenue(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { startDate, endDate } = getDateRange(req)
    const data = await reportRepo.revenue(startDate, endDate)
    success(res, data)
  } catch (err) {
    next(err)
  }
}

export async function services(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { startDate, endDate } = getDateRange(req)
    const data = await reportRepo.serviceRanking(startDate, endDate)
    success(res, data)
  } catch (err) {
    next(err)
  }
}

export async function staff(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { startDate, endDate } = getDateRange(req)
    const data = await reportRepo.staffPerformance(startDate, endDate)
    success(res, data)
  } catch (err) {
    next(err)
  }
}

export async function customers(
  _req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const data = await reportRepo.customerAnalysis()
    success(res, data)
  } catch (err) {
    next(err)
  }
}
