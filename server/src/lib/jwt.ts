import jwt from 'jsonwebtoken'

import { env } from '../config/env.js'
import type { JwtPayload } from '../types/index.js'

/**
 * 签发 Access Token（短期有效）
 */
export function signAccessToken(payload: JwtPayload): string {
  // expiresIn 使用 any 绕过 @types/jsonwebtoken 的 StringValue 品牌类型限制
  // env 中的值均为合法的 ms 字符串（如 '2h'、'7d'），运行时完全兼容
  return jwt.sign(payload as object, env.JWT_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as any,
  })
}

/**
 * 签发 Refresh Token（长期有效）
 */
export function signRefreshToken(payload: JwtPayload): string {
  return jwt.sign(payload as object, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN as any,
  })
}

/**
 * 签发 Token 对
 */
export function signTokens(payload: JwtPayload): {
  accessToken: string
  refreshToken: string
} {
  return {
    accessToken: signAccessToken(payload),
    refreshToken: signRefreshToken(payload),
  }
}

/**
 * 验证 Access Token
 * 成功返回 payload，失败抛出 jwt 异常
 */
export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, env.JWT_SECRET) as JwtPayload
}

/**
 * 验证 Refresh Token
 */
export function verifyRefreshToken(token: string): JwtPayload {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as JwtPayload
}
