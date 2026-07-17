import { Router } from 'express'
import * as staffController from '../controllers/staff.controller.js'
import { authenticate, authorize } from '../middleware/auth.js'
import { StaffRole } from '../constants/enums.js'

const router = Router()
router.use(authenticate)

router.get('/', staffController.list)
router.get('/:id', staffController.getById)
router.post('/', authorize(StaffRole.OWNER), staffController.create)
router.put('/:id', authorize(StaffRole.OWNER), staffController.update)
router.patch('/:id/toggle', authorize(StaffRole.OWNER), staffController.toggleActive)

export default router
