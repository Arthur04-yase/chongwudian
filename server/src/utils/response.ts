import type { Response } from 'express'

/**
 * 统一 API 响应工具
 *
 * 格式规范：
 *   - 成功：{ success: true, data: T, message?: string }
 *   - 分页：{ success: true, data: T[], pagination: {...} }
 *   - 错误：{ success: false, error: { code: string, message: string } }
 */

interface PaginationMeta {
  total: number
  page: number
  pageSize: number
  totalPages: number
}

/** 成功响应 */
export function success<T>(res: Response, data: T, statusCode = 200): void {
  res.status(statusCode).json({ success: true, data })
}

/** 带消息的成功响应 */
export function successWithMessage<T>(
  res: Response,
  data: T,
  message: string,
  statusCode = 200
): void {
  res.status(statusCode).json({ success: true, data, message })
}

/** 创建成功（201） */
export function created<T>(res: Response, data: T): void {
  res.status(201).json({ success: true, data })
}

/** 分页响应 */
export function paginated<T>(res: Response, data: T[], pagination: PaginationMeta): void {
  res.status(200).json({ success: true, data, pagination })
}

/** 错误响应 */
export function error(res: Response, statusCode: number, code: string, message: string): void {
  res.status(statusCode).json({
    success: false,
    error: { code, message },
  })
}
