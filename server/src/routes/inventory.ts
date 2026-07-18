import { Router } from 'express'
import * as inventoryController from '../controllers/inventory.controller.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()
router.use(authenticate)

router.get('/', inventoryController.list)
router.get('/:id', inventoryController.getById)
router.get('/:id/logs', inventoryController.getLogs)
router.post('/', inventoryController.create)
router.put('/:id', inventoryController.update)
router.post('/:id/log', inventoryController.recordLog)

export default router
