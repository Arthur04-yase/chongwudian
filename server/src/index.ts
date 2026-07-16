import express from 'express'
import cors from 'cors'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { env } from './config/env.js'
import { error as errorResponse } from './utils/response.js'
import { ErrorCode } from './constants/error-codes.js'
import { AppError } from './utils/app-error.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()

// ─── 信任代理（部署在 Nginx 后方时需要） ──────
app.set('trust proxy', 1)

// ─── 中间件 ──────────────────────────────────
app.use(
  cors({
    origin: env.CORS_ORIGINS,
    credentials: true,
  })
)
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// ─── 静态文件服务 ─────────────────────────────
// 上传的图片通过 /uploads 路径直接访问
// 资源 URL 示例：http://localhost:3001/uploads/pets/1_20260716.jpg
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')))

// ─── 健康检查 ────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({
    success: true,
    data: {
      status: 'ok',
      env: env.NODE_ENV,
      timestamp: new Date().toISOString(),
    },
  })
})

// ─── 路由注册（后续 Task 逐步添加）─────────────
// import authRoutes from './routes/auth.js'
// app.use('/api/auth', authRoutes)

// ─── 404 — 接口不存在 ──────────────────────────
app.use((_req, _res, next) => {
  next(new AppError(404, ErrorCode.NOT_FOUND, '接口不存在'))
})

// ─── 全局错误处理 ──────────────────────────────
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  // 业务异常 — 使用预定义的错误码和状态码
  if (err instanceof AppError) {
    errorResponse(res, err.statusCode, err.code, err.message)
    return
  }

  // 未知异常 — 记录日志，返回通用 500
  console.error(`[UNHANDLED_ERROR] ${err.message}`)
  console.error(err.stack)
  errorResponse(res, 500, ErrorCode.INTERNAL_ERROR, '服务器内部错误')
})

// ─── 启动服务 ──────────────────────────────────
app.listen(env.PORT, () => {
  console.log('🐾 宠物店管理系统 — 后端服务已启动')
  console.log(`   环境：${env.NODE_ENV}`)
  console.log(`   地址：http://localhost:${env.PORT}`)
  console.log(`   健康检查：http://localhost:${env.PORT}/api/health`)
})

export default app
