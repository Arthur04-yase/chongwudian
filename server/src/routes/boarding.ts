import { Router } from 'express'
import * as boardingController from '../controllers/boarding.controller.js'
import { authenticate } from '../middleware/auth.js'
import { createUploader } from '../lib/upload.js'

const router = Router()
const uploadCare = createUploader('pets')

router.use(authenticate)

// 查询
router.get('/', boardingController.list)
router.get('/cages', boardingController.cages)
router.get('/:id', boardingController.getById)

// 入住/退房
router.post('/', boardingController.checkin)
router.post('/:id/checkout', boardingController.checkout)

// 看护日志
router.post('/:id/care-logs', boardingController.addCareLog)
router.delete('/:id/care-logs/:logId', boardingController.deleteCareLog)

export default router
