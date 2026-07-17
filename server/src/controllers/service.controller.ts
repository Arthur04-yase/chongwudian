import type { Response, NextFunction } from 'express'
import { serviceService } from '../services/service.service.js'
import { success, created, paginated } from '../utils/response.js'
import { AppError } from '../utils/app-error.js'
import type { AuthenticatedRequest } from '../types/index.js'

const VALID_CATEGORIES = ['bath', 'groom', 'care', 'medicated', 'boarding', 'other']
const VALID_SIZE_CATEGORIES = ['small', 'medium', 'large', 'cat', 'multi']
const VALID_COMMISSION_TYPES = ['fixed', 'percent']

/** GET /api/services — 服务列表 */
export async function list(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const q = req.query as Record<string, string | undefined>
    const page = Math.max(1, parseInt(q.page || '1'))
    const pageSize = Math.min(50, Math.max(1, parseInt(q.pageSize || '10')))
    const filter = {
      search: q.search || undefined,
      category: q.category || undefined,
      sizeCategory: q.sizeCategory || undefined,
      isActive: q.isActive !== undefined ? q.isActive === 'true' : undefined,
    }
    const result = await serviceService.list(filter, { page, pageSize })
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

/** GET /api/services/:id — 服务详情 */
export async function getById(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const service = await serviceService.getById(parseInt(String(req.params.id)))
    success(res, service)
  } catch (err) {
    next(err)
  }
}

/** POST /api/services — 新增服务 */
export async function create(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const {
      name,
      category,
      sizeCategory,
      price,
      memberPrice,
      durationMinutes,
      commissionAmount,
      commissionType,
      description,
    } = req.body

    if (!name?.trim()) throw AppError.badRequest('服务名称不能为空')
    if (!category || !VALID_CATEGORIES.includes(category))
      throw AppError.badRequest(`分类无效，可选值：${VALID_CATEGORIES.join('、')}`)
    if (!sizeCategory || !VALID_SIZE_CATEGORIES.includes(sizeCategory))
      throw AppError.badRequest(`适用体型无效，可选值：${VALID_SIZE_CATEGORIES.join('、')}`)
    if (typeof price !== 'number' || price < 0) throw AppError.badRequest('价格必须为非负数字')
    if (typeof durationMinutes !== 'number' || durationMinutes < 0)
      throw AppError.badRequest('服务时长必须为非负数字')
    if (typeof commissionAmount !== 'number' || commissionAmount < 0)
      throw AppError.badRequest('提成金额必须为非负数字')
    if (!VALID_COMMISSION_TYPES.includes(commissionType)) throw AppError.badRequest('提成方式无效')

    const service = await serviceService.create({
      name: name.trim(),
      category,
      sizeCategory,
      price,
      memberPrice: memberPrice ?? null,
      durationMinutes,
      commissionAmount,
      commissionType,
      description: description ?? null,
    })
    created(res, service)
  } catch (err) {
    next(err)
  }
}

/** PUT /api/services/:id — 编辑服务 */
export async function update(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = parseInt(String(req.params.id))
    const dto: Record<string, unknown> = {}

    if (req.body.name !== undefined) {
      if (!req.body.name?.trim()) throw AppError.badRequest('服务名称不能为空')
      dto.name = req.body.name.trim()
    }
    if (req.body.category !== undefined) {
      if (!VALID_CATEGORIES.includes(req.body.category)) throw AppError.badRequest(`分类无效`)
      dto.category = req.body.category
    }
    if (req.body.sizeCategory !== undefined) {
      if (!VALID_SIZE_CATEGORIES.includes(req.body.sizeCategory))
        throw AppError.badRequest(`适用体型无效`)
      dto.sizeCategory = req.body.sizeCategory
    }
    if (req.body.price !== undefined) dto.price = req.body.price
    if (req.body.memberPrice !== undefined) dto.memberPrice = req.body.memberPrice
    if (req.body.durationMinutes !== undefined) dto.durationMinutes = req.body.durationMinutes
    if (req.body.commissionAmount !== undefined) dto.commissionAmount = req.body.commissionAmount
    if (req.body.commissionType !== undefined) dto.commissionType = req.body.commissionType
    if (req.body.description !== undefined) dto.description = req.body.description
    if (req.body.isActive !== undefined) dto.isActive = req.body.isActive

    const service = await serviceService.update(id, dto as any)
    success(res, service)
  } catch (err) {
    next(err)
  }
}

/** DELETE /api/services/:id — 删除服务 */
export async function remove(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    await serviceService.delete(parseInt(String(req.params.id)))
    success(res, null, 204)
  } catch (err) {
    next(err)
  }
}

/** PATCH /api/services/batch/toggle — 批量启用/禁用 */
export async function batchToggle(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { ids, isActive } = req.body
    if (!Array.isArray(ids) || !ids.length) throw AppError.badRequest('请提供要操作的服务 ID 列表')
    await serviceService.batchToggleActive(ids, Boolean(isActive))
    success(res, { ids, isActive: Boolean(isActive) })
  } catch (err) {
    next(err)
  }
}

/** POST /api/services/:id/cover — 上传封面图 */
export async function uploadCover(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.file) {
      throw AppError.badRequest('请选择要上传的图片')
    }
    const service = await serviceService.uploadCover(
      parseInt(String(req.params.id)),
      req.file.filename
    )
    success(res, service)
  } catch (err) {
    next(err)
  }
}
