/**
 * 业务枚举常量
 *
 * Prisma 不原生支持 MySQL ENUM，因此使用 String 字段存储，
 * 通过此文件统一管理可选值，避免代码中散落魔法字符串。
 */

// ─── 员工角色 ─────────────────────────────
export const StaffRole = {
  OWNER: 'owner',
  GROOMER: 'groomer',
  RECEPTIONIST: 'receptionist',
} as const
export type StaffRoleType = (typeof StaffRole)[keyof typeof StaffRole]

// ─── 宠物物种 ─────────────────────────────
export const PetSpecies = {
  DOG: 'dog',
  CAT: 'cat',
  OTHER: 'other',
} as const
export type PetSpeciesType = (typeof PetSpecies)[keyof typeof PetSpecies]

// ─── 宠物性别 ─────────────────────────────
export const Gender = {
  MALE: 'male',
  FEMALE: 'female',
} as const

// ─── 服务分类 ─────────────────────────────
export const ServiceCategory = {
  BATH: 'bath',
  GROOM: 'groom',
  BOARDING: 'boarding',
  OTHER: 'other',
} as const
export type ServiceCategoryType = (typeof ServiceCategory)[keyof typeof ServiceCategory]

// ─── 预约状态 ─────────────────────────────
export const AppointmentStatus = {
  PENDING: 'pending',
  ARRIVED: 'arrived',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  PICKED_UP: 'picked_up',
  CANCELLED: 'cancelled',
  NO_SHOW: 'no_show',
} as const
export type AppointmentStatusType = (typeof AppointmentStatus)[keyof typeof AppointmentStatus]

// ─── 预约来源 ─────────────────────────────
export const AppointmentSource = {
  PHONE: 'phone',
  WECHAT: 'wechat',
  WALK_IN: 'walk_in',
} as const

// ─── 支付方式 ─────────────────────────────
export const PaymentMethod = {
  WECHAT: 'wechat',
  ALIPAY: 'alipay',
  CASH: 'cash',
  CARD_BALANCE: 'card_balance',
  CARD_TIMES: 'card_times',
} as const
export type PaymentMethodType = (typeof PaymentMethod)[keyof typeof PaymentMethod]

// ─── 寄养状态 ─────────────────────────────
export const BoardingStatus = {
  ACTIVE: 'active',
  CHECKED_OUT: 'checked_out',
  CANCELLED: 'cancelled',
} as const

// ─── 看护日志类型 ─────────────────────────
export const CareLogType = {
  FEEDING: 'feeding',
  WALKING: 'walking',
  WATER: 'water',
  CLEANING: 'cleaning',
  MEDICAL: 'medical',
  OTHER: 'other',
} as const

// ─── 会员卡类型 ───────────────────────────
export const CardType = {
  BALANCE: 'balance',
  TIMES: 'times',
} as const

// ─── 卡交易类型 ───────────────────────────
export const CardTransactionType = {
  RECHARGE: 'recharge',
  DEDUCT: 'deduct',
  REFUND: 'refund',
} as const

// ─── 库存操作类型 ─────────────────────────
export const InventoryLogType = {
  IN: 'in',
  OUT: 'out',
  LOSS: 'loss',
} as const

// ─── 商品分类 ─────────────────────────────
export const ProductCategory = {
  CONSUMABLE: 'consumable',
  RETAIL: 'retail',
  FOOD: 'food',
  OTHER: 'other',
} as const

// ─── 宠物备注分类 ─────────────────────────
export const PetNoteCategory = {
  BEHAVIOR: 'behavior',
  HEALTH: 'health',
  PREFERENCE: 'preference',
  OTHER: 'other',
} as const

// ─── 客户来源 ─────────────────────────────
export const CustomerSource = {
  REFERRAL: '朋友介绍',
  DIANPING: '大众点评',
  WALK_IN: '路过',
  DOUYIN: '抖音',
  OTHER: '其他',
} as const

// ─── 提成方式 ─────────────────────────────
export const CommissionType = {
  FIXED: 'fixed',
  PERCENT: 'percent',
} as const

/**
 * 预约状态流转规则
 * 定义每个状态允许变更到的下一状态
 */
export const AppointmentStatusTransitions: Record<string, string[]> = {
  [AppointmentStatus.PENDING]: [
    AppointmentStatus.ARRIVED,
    AppointmentStatus.CANCELLED,
    AppointmentStatus.NO_SHOW,
  ],
  [AppointmentStatus.ARRIVED]: [AppointmentStatus.IN_PROGRESS],
  [AppointmentStatus.IN_PROGRESS]: [AppointmentStatus.COMPLETED],
  [AppointmentStatus.COMPLETED]: [AppointmentStatus.PICKED_UP],
  // 终态：picked_up, cancelled, no_show — 不可再变更
}
