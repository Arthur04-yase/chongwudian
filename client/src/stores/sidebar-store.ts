import { create } from 'zustand'

interface SidebarState {
  // 桌面端：侧边栏是否折叠（仅图标）
  collapsed: boolean
  // 移动端：Sheet 是否打开
  mobileOpen: boolean

  toggle: () => void
  setMobileOpen: (open: boolean) => void
}

export const useSidebarStore = create<SidebarState>()((set) => ({
  collapsed: false,
  mobileOpen: false,

  toggle: () => set((s) => ({ collapsed: !s.collapsed })),
  setMobileOpen: (open) => set({ mobileOpen: open }),
}))
