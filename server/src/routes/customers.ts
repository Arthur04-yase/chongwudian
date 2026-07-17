import { Router } from 'express'
import * as customerController from '../controllers/customer.controller.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()
router.use(authenticate)

router.get('/', customerController.list)
router.get('/:id', customerController.getById)
router.post('/', customerController.create)
router.put('/:id', customerController.update)
router.delete('/:id', customerController.remove)

export default router
