import type { Response, NextFunction } from 'express'
import { cardService } from '../services/card.service.js'
import { success, created } from '../utils/response.js'
import type { AuthenticatedRequest } from '../types/index.js'

export async function listByCustomer(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const cards = await cardService.listByCustomer(parseInt(String(req.params.customerId)))
    success(res, cards)
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
    const card = await cardService.getById(parseInt(String(req.params.id)))
    success(res, card)
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
    const card = await cardService.create(req.body)
    created(res, card)
  } catch (err) {
    next(err)
  }
}

export async function recharge(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const card = await cardService.recharge(
      parseInt(String(req.params.id)),
      req.body.amount,
      req.body.times
    )
    success(res, card)
  } catch (err) {
    next(err)
  }
}

export async function deduct(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const card = await cardService.deduct(
      parseInt(String(req.params.id)),
      req.body.amount || req.body.times || 1,
      req.body.appointmentId
    )
    success(res, card)
  } catch (err) {
    next(err)
  }
}

export async function deactivate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    await cardService.deactivate(parseInt(String(req.params.id)))
    success(res, null, 204)
  } catch (err) {
    next(err)
  }
}
