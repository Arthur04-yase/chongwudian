// API 通用响应格式
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    total: number
    page: number
    pageSize: number
    totalPages: number
  }
}

// 预约状态枚举
export type AppointmentStatus =
  'pending' | 'arrived' | 'in_progress' | 'completed' | 'picked_up' | 'cancelled' | 'no_show'

// 服务分类
export type ServiceCategory = 'bath' | 'groom' | 'boarding' | 'other'

// 支付方式
export type PaymentMethod = 'wechat' | 'alipay' | 'cash' | 'card_balance' | 'card_times'

// 员工角色
export type StaffRole = 'owner' | 'groomer' | 'receptionist'
