import { petRepo } from '../repositories/pet.repo.js'
import { AppError } from '../utils/app-error.js'

const VALID_SPECIES = ['dog', 'cat', 'other']
const VALID_NOTE_CATEGORIES = ['behavior', 'health', 'preference', 'other']

export const petService = {
  async getById(id: number) {
    const pet = await petRepo.findById(id)
    if (!pet) throw AppError.notFound('宠物')
    return {
      ...pet,
      age: petRepo.getAge(pet.birthDate),
    }
  },

  async create(dto: {
    customerId: number
    name: string
    species: string
    breed?: string
    gender?: string
    isNeutered?: boolean
    birthDate?: string
    weightKg?: number
    color?: string
    vaccineExpiry?: string
    isAggressive?: boolean
  }) {
    if (!dto.name?.trim()) throw AppError.badRequest('宠物名字不能为空')
    if (!dto.species || !VALID_SPECIES.includes(dto.species))
      throw AppError.badRequest('物种无效，可选：dog、cat、other')
    if (dto.weightKg !== undefined && dto.weightKg < 0) throw AppError.badRequest('体重不能为负数')
    return petRepo.create(dto)
  },

  async update(id: number, dto: Record<string, unknown>) {
    const existing = await petRepo.findById(id)
    if (!existing) throw AppError.notFound('宠物')
    if (dto.species && !VALID_SPECIES.includes(dto.species as string))
      throw AppError.badRequest('物种无效')
    if (dto.weightKg !== undefined && Number(dto.weightKg) < 0)
      throw AppError.badRequest('体重不能为负数')
    return petRepo.update(id, dto as any)
  },

  async delete(id: number) {
    if (!(await petRepo.findById(id))) throw AppError.notFound('宠物')
    return petRepo.softDelete(id)
  },

  async addNote(petId: number, staffId: number, category: string, content: string) {
    if (!content?.trim()) throw AppError.badRequest('备注内容不能为空')
    if (!VALID_NOTE_CATEGORIES.includes(category)) throw AppError.badRequest('备注分类无效')
    return petRepo.addNote(petId, staffId, category, content.trim())
  },

  async deleteNote(id: number) {
    try {
      await petRepo.deleteNote(id)
    } catch {
      throw AppError.notFound('备注')
    }
  },

  async listByCustomer(customerId: number) {
    return petRepo.findByCustomer(customerId)
  },
}
