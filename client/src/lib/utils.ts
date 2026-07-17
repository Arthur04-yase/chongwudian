import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * 格式化金额为人民币显示
 */
export function formatPrice(price: number): string {
  return `¥${price.toLocaleString('zh-CN')}`
}
