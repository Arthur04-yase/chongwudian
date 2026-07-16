import 'dotenv/config'

/**
 * 集中管理所有环境变量
 * 提供类型安全和默认值，避免在代码中直接访问 process.env
 */
export const env = {
  /** 服务端口 */
  PORT: parseInt(process.env.PORT || '3001', 10),

  /** 运行环境 */
  NODE_ENV: (process.env.NODE_ENV || 'development') as 'development' | 'production' | 'test',

  /** 数据库连接 */
  DATABASE_URL: process.env.DATABASE_URL || 'file:./dev.db',

  /** JWT 密钥 */
  JWT_SECRET: process.env.JWT_SECRET || 'pet-store-dev-secret-change-in-production',
  JWT_REFRESH_SECRET:
    process.env.JWT_REFRESH_SECRET || 'pet-store-refresh-secret-change-in-production',

  /** JWT 有效期 */
  JWT_ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN || '2h',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',

  /** 前端地址（CORS 白名单） */
  CORS_ORIGINS: (process.env.CORS_ORIGINS || 'http://localhost:5173,http://127.0.0.1:5173').split(
    ','
  ),

  /** 上传文件配置 */
  UPLOAD_MAX_SIZE_MB: parseInt(process.env.UPLOAD_MAX_SIZE_MB || '5', 10),
  UPLOAD_ALLOWED_TYPES: (process.env.UPLOAD_ALLOWED_TYPES || 'jpg,jpeg,png,webp').split(','),

  /** 是否为开发环境 */
  get isDev() {
    return this.NODE_ENV === 'development'
  },

  /** 是否为生产环境 */
  get isProd() {
    return this.NODE_ENV === 'production'
  },
} as const
