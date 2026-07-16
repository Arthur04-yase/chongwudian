import type { Request } from 'express'
import type { StaffRoleType } from '../constants/enums.js'

// ═══════════════════════════════════════════════════════════════
// 认证相关
// ═══════════════════════════════════════════════════════════════

/** JWT Payload */
export interface JwtPayload {
  staffId: number
  role: StaffRoleType
}

/** 扩展 Express Request，附加认证信息 */
export interface AuthenticatedRequest extends Request {
  staff?: {
    id: number
    role: StaffRoleType
  }
}

/** 登录响应 */
export interface LoginResponse {
  user: {
    id: number
    name: string
    phone: string
    role: StaffRoleType
    avatarUrl?: string | null
  }
  accessToken: string
  refreshToken: string
}

// ═══════════════════════════════════════════════════════════════
// 通用分页
// ═══════════════════════════════════════════════════════════════

export interface PaginationQuery {
  page?: number
  pageSize?: number
}

export interface PaginationMeta {
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// ═══════════════════════════════════════════════════════════════
// 工具类型
// ═══════════════════════════════════════════════════════════════

/** 令所有字段可选 */
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

/** 令指定字段必填 */
export type RequiredBy<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>
