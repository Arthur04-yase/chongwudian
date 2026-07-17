import type { Response, NextFunction } from 'express'
import { paymentService } from '../services/payment.service.js'
import { success, created } from '../utils/response.js'
import type { AuthenticatedRequest } from '../types/index.js'

export async function checkout(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { appointmentId, amount, method, transactionNo, notes } = req.body
    const payment = await paymentService.checkout({
      appointmentId,
      amount,
      method,
      transactionNo,
      createdBy: req.staff!.id,
      notes,
    })
    created(res, payment)
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
    const records = await paymentService.listByDate(date)
    success(res, records)
  } catch (err) {
    next(err)
  }
}

export async function dailySummary(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const date = (req.query.date as string) || new Date().toISOString().slice(0, 10)
    const summary = await paymentService.dailySummary(date)
    success(res, summary)
  } catch (err) {
    next(err)
  }
}

export async function pendingCheckout(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const list = await paymentService.pendingCheckout()
    success(res, list)
  } catch (err) {
    next(err)
  }
}
