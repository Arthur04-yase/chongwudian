import { Router } from 'express'

import * as authController from '../controllers/auth.controller.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()

// 公开路由
router.post('/register', authController.register)
router.post('/login', authController.login)
router.post('/refresh', authController.refresh)

// 受保护路由（需要登录）
router.get('/me', authenticate, authController.getMe)

export default router
