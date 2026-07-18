import type { Response, NextFunction } from 'express'
import { inventoryService } from '../services/inventory.service.js'
import { success, created } from '../utils/response.js'
import type { AuthenticatedRequest } from '../types/index.js'

export async function list(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const q = req.query as Record<string, string | undefined>
    const data = await inventoryService.list(q.category, q.search)
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
    const p = await inventoryService.getById(parseInt(String(req.params.id)))
    success(res, p)
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
    const p = await inventoryService.create(req.body)
    created(res, p)
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
    const p = await inventoryService.update(parseInt(String(req.params.id)), req.body)
    success(res, p)
  } catch (err) {
    next(err)
  }
}

export async function recordLog(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const log = await inventoryService.recordLog({
      productId: parseInt(String(req.params.id)),
      type: req.body.type,
      quantity: req.body.quantity,
      notes: req.body.notes,
      createdBy: req.staff!.id,
    })
    created(res, log)
  } catch (err) {
    next(err)
  }
}

export async function getLogs(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const logs = await inventoryService.getLogs(parseInt(String(req.params.id)))
    success(res, logs)
  } catch (err) {
    next(err)
  }
}
