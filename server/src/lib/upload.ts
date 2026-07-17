import multer from 'multer'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { env } from '../config/env.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * 通用 Multer 上传配置工厂
 * @param subDir — 上传子目录（pets / services / staffs / customers / products）
 */
export function createUploader(subDir: string) {
  const uploadPath = path.join(__dirname, '..', '..', 'uploads', subDir)

  const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, uploadPath)
    },
    filename: (_req, file, cb) => {
      const uniqueSuffix = `${Date.now()}_${Math.round(Math.random() * 1e9)}`
      const ext = path.extname(file.originalname).toLowerCase()
      cb(null, `${uniqueSuffix}${ext}`)
    },
  })

  const fileFilter = (
    _req: Express.Request,
    file: Express.Multer.File,
    cb: multer.FileFilterCallback
  ) => {
    const ext = path.extname(file.originalname).toLowerCase().replace('.', '')
    if (env.UPLOAD_ALLOWED_TYPES.includes(ext)) {
      cb(null, true)
    } else {
      cb(new Error(`不支持的文件类型：${ext}，仅允许 ${env.UPLOAD_ALLOWED_TYPES.join('、')}`))
    }
  }

  return multer({
    storage,
    fileFilter,
    limits: {
      fileSize: env.UPLOAD_MAX_SIZE_MB * 1024 * 1024,
    },
  })
}
