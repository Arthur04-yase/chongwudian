import { Router } from 'express'
import * as paymentController from '../controllers/payment.controller.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()
router.use(authenticate)

router.get('/', paymentController.listByDate)
router.get('/pending', paymentController.pendingCheckout)
router.get('/summary', paymentController.dailySummary)
router.post('/checkout', paymentController.checkout)

export default router
