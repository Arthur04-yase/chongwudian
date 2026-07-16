import { PrismaClient } from '@prisma/client'

import { env } from '../config/env.js'

/**
 * Prisma 客户端单例
 *
 * - 开发环境：全局缓存避免热重载重复创建
 * - 生产环境：标准实例
 * - 日志级别根据 NODE_ENV 自动切换
 */
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: env.isDev ? ['warn', 'error'] : ['warn', 'error'],
  })

if (!env.isProd) {
  globalForPrisma.prisma = prisma
}

export default prisma
