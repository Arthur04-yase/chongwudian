import { Router } from 'express'
import * as appointmentController from '../controllers/appointment.controller.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()
router.use(authenticate)

router.get('/', appointmentController.listByDate)
router.get('/:id', appointmentController.getById)
router.post('/', appointmentController.create)
router.patch('/:id/status', appointmentController.changeStatus)

export default router
