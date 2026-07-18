import { Router } from 'express'
import * as cardController from '../controllers/card.controller.js'
import { authenticate, authorize } from '../middleware/auth.js'
import { StaffRole } from '../constants/enums.js'

const router = Router()
router.use(authenticate)

router.get('/customer/:customerId', cardController.listByCustomer)
router.get('/:id', cardController.getById)
router.post('/', authorize(StaffRole.OWNER, StaffRole.RECEPTIONIST), cardController.create)
router.post(
  '/:id/recharge',
  authorize(StaffRole.OWNER, StaffRole.RECEPTIONIST),
  cardController.recharge
)
router.post('/:id/deduct', cardController.deduct)
router.patch('/:id/deactivate', authorize(StaffRole.OWNER), cardController.deactivate)

export default router
