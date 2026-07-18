import { Router } from 'express'
import * as reportController from '../controllers/report.controller.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()
router.use(authenticate)

router.get('/revenue', reportController.revenue)
router.get('/services', reportController.services)
router.get('/staff', reportController.staff)
router.get('/customers', reportController.customers)

export default router
