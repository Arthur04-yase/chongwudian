import type { Response, NextFunction } from 'express'
import { petService } from '../services/pet.service.js'
import { success, created } from '../utils/response.js'
import type { AuthenticatedRequest } from '../types/index.js'

export async function getById(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const pet = await petService.getById(parseInt(String(req.params.id)))
    success(res, pet)
  } catch (err) {
    next(err)
  }
}

export async function listByCustomer(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const pets = await petService.listByCustomer(parseInt(String(req.params.customerId)))
    success(res, pets)
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
    const pet = await petService.create(req.body)
    created(res, pet)
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
    const pet = await petService.update(parseInt(String(req.params.id)), req.body)
    success(res, pet)
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
    await petService.delete(parseInt(String(req.params.id)))
    success(res, null, 204)
  } catch (err) {
    next(err)
  }
}

export async function addNote(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { category, content } = req.body
    const note = await petService.addNote(
      parseInt(String(req.params.id)),
      req.staff!.id,
      category,
      content
    )
    created(res, note)
  } catch (err) {
    next(err)
  }
}

export async function deleteNote(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    await petService.deleteNote(parseInt(String(req.params.noteId)))
    success(res, null, 204)
  } catch (err) {
    next(err)
  }
}
