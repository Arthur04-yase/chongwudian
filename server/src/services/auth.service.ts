import bcrypt from 'bcryptjs'

import prisma from '../lib/prisma.js'
import { signTokens, verifyRefreshToken } from '../lib/jwt.js'
import { AppError } from '../utils/app-error.js'
import { ErrorCode } from '../constants/error-codes.js'
import type { LoginResponse, JwtPayload } from '../types/index.js'

/**
 * 员工注册
 */
export async function register(dto: {
  name: string
  phone: string
  password: string
  role: string
}): Promise<{ id: number; name: string; phone: string; role: string }> {
  // 检查手机号是否已注册
  const existing = await prisma.staff.findUnique({ where: { phone: dto.phone } })
  if (existing) {
    throw AppError.conflict('该手机号已注册', ErrorCode.AUTH_PHONE_ALREADY_EXISTS)
  }

  const passwordHash = await bcrypt.hash(dto.password, 10)

  const staff = await prisma.staff.create({
    data: {
      name: dto.name,
      phone: dto.phone,
      password: passwordHash,
      role: dto.role,
    },
    select: { id: true, name: true, phone: true, role: true },
  })

  return staff
}

/**
 * 员工登录
 */
export async function login(phone: string, password: string): Promise<LoginResponse> {
  const staff = await prisma.staff.findUnique({ where: { phone } })

  if (!staff) {
    throw new AppError(401, ErrorCode.AUTH_INVALID_CREDENTIALS, '手机号或密码错误')
  }

  if (!staff.isActive) {
    throw AppError.forbidden('账号已被禁用，请联系管理员')
  }

  const isPasswordValid = await bcrypt.compare(password, staff.password)
  if (!isPasswordValid) {
    throw new AppError(401, ErrorCode.AUTH_INVALID_CREDENTIALS, '手机号或密码错误')
  }

  const payload: JwtPayload = {
    staffId: staff.id,
    role: staff.role as JwtPayload['role'],
  }

  const tokens = signTokens(payload)

  return {
    user: {
      id: staff.id,
      name: staff.name,
      phone: staff.phone,
      role: staff.role as JwtPayload['role'],
      avatarUrl: staff.avatarUrl,
    },
    ...tokens,
  }
}

/**
 * 刷新 Token
 */
export async function refreshToken(
  token: string
): Promise<{ accessToken: string; refreshToken: string }> {
  let payload: JwtPayload

  try {
    payload = verifyRefreshToken(token)
  } catch {
    throw new AppError(401, ErrorCode.AUTH_TOKEN_INVALID, 'Refresh Token 无效或已过期')
  }

  // 验证用户仍然存在且活跃
  const staff = await prisma.staff.findUnique({
    where: { id: payload.staffId },
    select: { id: true, isActive: true, role: true },
  })

  if (!staff || !staff.isActive) {
    throw AppError.forbidden('账号已被禁用或不存在')
  }

  const newPayload: JwtPayload = {
    staffId: staff.id,
    role: staff.role as JwtPayload['role'],
  }

  return signTokens(newPayload)
}

/**
 * 获取当前登录用户信息
 */
export async function getMe(staffId: number) {
  const staff = await prisma.staff.findUnique({
    where: { id: staffId },
    select: {
      id: true,
      name: true,
      phone: true,
      role: true,
      avatarUrl: true,
      commissionType: true,
      commissionValue: true,
      hiredDate: true,
      isActive: true,
      createdAt: true,
    },
  })

  if (!staff) {
    throw AppError.unauthorized('用户不存在')
  }

  return staff
}
