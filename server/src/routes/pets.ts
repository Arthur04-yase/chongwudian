import { Router } from 'express'
import * as petController from '../controllers/pet.controller.js'
import { petService } from '../services/pet.service.js'
import { authenticate } from '../middleware/auth.js'
import { createUploader } from '../lib/upload.js'

const router = Router()
const uploadPet = createUploader('pets')

router.use(authenticate)

// 档案
router.get('/:id', petController.getById)
// 按主人查询
router.get('/customer/:customerId', petController.listByCustomer)
// CRUD
router.post('/', petController.create)
router.put('/:id', petController.update)
router.delete('/:id', petController.remove)
// 备注
router.post('/:id/notes', petController.addNote)
router.delete('/:id/notes/:noteId', petController.deleteNote)
// 头像上传
router.post('/:id/avatar', uploadPet.single('avatar'), (req, res, next) => {
  if (!req.file)
    return res
      .status(400)
      .json({ success: false, error: { code: 'VALIDATION_ERROR', message: '请选择图片' } })
  petService
    .update(parseInt(String(req.params.id)), { avatarUrl: `/uploads/pets/${req.file.filename}` })
    .then((pet) => res.json({ success: true, data: pet }))
    .catch(next)
})

export default router
