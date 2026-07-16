import type { Response, NextFunction } from 'express'

import { verifyAccessToken } from '../lib/jwt.js'
import { AppError } from '../utils/app-error.js'
import { ErrorCode } from '../constants/error-codes.js'
import { StaffRole, type StaffRoleType } from '../constants/enums.js'
import type { AuthenticatedRequest } from '../types/index.js'

/**
 * 认证中间件 — 验证请求是否携带有效 JWT
 *
 * 从 Authorization header 中提取 Bearer token，
 * 验证成功后将 staff 信息注入 req.staff
 */
export function authenticate(req: AuthenticatedRequest, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw AppError.unauthorized('未提供认证令牌')
  }

  const token = authHeader.split(' ')[1]

  try {
    const payload = verifyAccessToken(token)
    req.staff = {
      id: payload.staffId,
      role: payload.role,
    }
    next()
  } catch {
    throw new AppError(401, ErrorCode.AUTH_TOKEN_INVALID, '认证令牌无效或已过期')
  }
}

/**
 * 授权中间件工厂 — 限制接口只能由指定角色访问
 *
 * 用法：
 *   router.get('/admin-only', authenticate, authorize(StaffRole.OWNER), handler)
 *   router.get('/staff-only', authenticate, authorize(StaffRole.OWNER, StaffRole.GROOMER, StaffRole.RECEPTIONIST), handler)
 */
export function authorize(...allowedRoles: StaffRoleType[]) {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
    if (!req.staff) {
      throw AppError.unauthorized()
    }

    if (!allowedRoles.includes(req.staff.role)) {
      throw AppError.forbidden('当前角色无权执行此操作')
    }

    next()
  }
}
