import { Router } from 'express'

import * as serviceController from '../controllers/service.controller.js'
import { authenticate, authorize } from '../middleware/auth.js'
import { StaffRole } from '../constants/enums.js'
import { createUploader } from '../lib/upload.js'

const router = Router()
const uploadService = createUploader('services')

// 所有服务接口均需登录
router.use(authenticate)

// 查询
router.get('/', serviceController.list)
router.get('/:id', serviceController.getById)

// 增删改（仅老板/前台可操作）
router.post('/', authorize(StaffRole.OWNER, StaffRole.RECEPTIONIST), serviceController.create)
router.put('/:id', authorize(StaffRole.OWNER, StaffRole.RECEPTIONIST), serviceController.update)
router.delete('/:id', authorize(StaffRole.OWNER, StaffRole.RECEPTIONIST), serviceController.remove)

// 批量操作
router.patch(
  '/batch/toggle',
  authorize(StaffRole.OWNER, StaffRole.RECEPTIONIST),
  serviceController.batchToggle
)

// 封面图上传
router.post(
  '/:id/cover',
  authorize(StaffRole.OWNER, StaffRole.RECEPTIONIST),
  uploadService.single('cover'),
  serviceController.uploadCover
)

export default router
