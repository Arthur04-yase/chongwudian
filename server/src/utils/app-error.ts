import type { ErrorCodeType } from '../constants/error-codes.js'

/**
 * 业务异常类
 *
 * 所有业务层错误都应抛出 AppError，由全局错误处理中间件捕获并格式化响应。
 * 用法：throw new AppError(404, ErrorCode.NOT_FOUND, '客户不存在')
 */
export class AppError extends Error {
  public readonly statusCode: number
  public readonly code: ErrorCodeType

  constructor(statusCode: number, code: ErrorCodeType, message: string) {
    super(message)
    this.statusCode = statusCode
    this.code = code
    this.name = 'AppError'

    // 确保 instanceof 正确（TypeScript 编译到 ES5 时需要）
    Object.setPrototypeOf(this, AppError.prototype)
  }

  /** 400 — 请求参数校验失败 */
  static badRequest(message: string, code?: ErrorCodeType): AppError {
    return new AppError(400, code || ('VALIDATION_ERROR' as ErrorCodeType), message)
  }

  /** 401 — 未登录或 token 无效 */
  static unauthorized(message = '未登录或登录已过期'): AppError {
    return new AppError(401, 'UNAUTHORIZED' as ErrorCodeType, message)
  }

  /** 403 — 无权限 */
  static forbidden(message = '无权执行此操作'): AppError {
    return new AppError(403, 'FORBIDDEN' as ErrorCodeType, message)
  }

  /** 404 — 资源不存在 */
  static notFound(resource: string): AppError {
    return new AppError(404, 'NOT_FOUND' as ErrorCodeType, `${resource}不存在`)
  }

  /** 409 — 资源冲突（如手机号重复） */
  static conflict(message: string, code: ErrorCodeType = 'CONFLICT' as ErrorCodeType): AppError {
    return new AppError(409, code, message)
  }
}
