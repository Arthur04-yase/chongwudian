import type { Response, NextFunction } from 'express'

import * as authService from '../services/auth.service.js'
import { success, created } from '../utils/response.js'
import { AppError } from '../utils/app-error.js'
import { ErrorCode } from '../constants/error-codes.js'
import type { AuthenticatedRequest } from '../types/index.js'

/**
 * POST /api/auth/register — 注册员工账号
 */
export async function register(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { name, phone, password, role } = req.body

    if (!name || !phone || !password || !role) {
      throw AppError.badRequest('请填写完整的注册信息（姓名、手机号、密码、角色）')
    }

    if (!/^1[3-9]\d{9}$/.test(phone)) {
      throw AppError.badRequest('手机号格式不正确')
    }

    if (password.length < 6) {
      throw AppError.badRequest('密码长度不能少于6位')
    }

    const validRoles = ['owner', 'groomer', 'receptionist']
    if (!validRoles.includes(role)) {
      throw AppError.badRequest('角色无效，可选值：owner、groomer、receptionist')
    }

    const staff = await authService.register({ name, phone, password, role })
    created(res, staff)
  } catch (err) {
    next(err)
  }
}

/**
 * POST /api/auth/login — 员工登录
 */
export async function login(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { phone, password } = req.body

    if (!phone || !password) {
      throw AppError.badRequest('请输入手机号和密码')
    }

    const result = await authService.login(phone, password)
    success(res, result)
  } catch (err) {
    next(err)
  }
}

/**
 * POST /api/auth/refresh — 刷新 Token
 */
export async function refresh(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { refreshToken } = req.body

    if (!refreshToken) {
      throw new AppError(400, ErrorCode.AUTH_TOKEN_INVALID, '请提供 Refresh Token')
    }

    const tokens = await authService.refreshToken(refreshToken)
    success(res, tokens)
  } catch (err) {
    next(err)
  }
}

/**
 * GET /api/auth/me — 获取当前登录用户信息
 * 需要认证中间件
 */
export async function getMe(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const staff = await authService.getMe(req.staff!.id)
    success(res, staff)
  } catch (err) {
    next(err)
  }
}
