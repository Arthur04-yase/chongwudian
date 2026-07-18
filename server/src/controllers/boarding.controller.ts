import type { Response, NextFunction } from 'express'
import { boardingService } from '../services/boarding.service.js'
import { success, created } from '../utils/response.js'
import type { AuthenticatedRequest } from '../types/index.js'

export async function list(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const status = req.query.status as string | undefined
    const data = await boardingService.list(status)
    success(res, data)
  } catch (err) {
    next(err)
  }
}

export async function cages(
  _req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const data = await boardingService.cages()
    success(res, data)
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
    const b = await boardingService.getById(parseInt(String(req.params.id)))
    success(res, b)
  } catch (err) {
    next(err)
  }
}

export async function checkin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const b = await boardingService.checkin(req.body)
    created(res, b)
  } catch (err) {
    next(err)
  }
}

export async function checkout(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const b = await boardingService.checkout(
      parseInt(String(req.params.id)),
      req.body.actualCheckOut || new Date().toISOString().slice(0, 16).replace('T', ' ')
    )
    success(res, b)
  } catch (err) {
    next(err)
  }
}

export async function addCareLog(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const log = await boardingService.addCareLog(
      parseInt(String(req.params.id)),
      req.staff!.id,
      req.body.logType,
      req.body.content
    )
    created(res, log)
  } catch (err) {
    next(err)
  }
}

export async function deleteCareLog(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    await boardingService.deleteCareLog(parseInt(String(req.params.logId)))
    success(res, null, 204)
  } catch (err) {
    next(err)
  }
}
