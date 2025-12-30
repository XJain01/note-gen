import { safeLoadStore, safeGetFromStore, safeSetToStore } from '@/lib/tauri-utils'
import { create } from 'zustand'

export interface SidebarState {
  fileSidebarVisible: boolean
  toggleFileSidebar: () => Promise<void>
  showFileSidebar: () => Promise<void>
  noteSidebarVisible: boolean
  toggleNoteSidebar: () => Promise<void>
  showNoteSidebar: () => Promise<void>
  leftSidebarVisible: boolean
  toggleLeftSidebar: () => Promise<void>
  rightSidebarVisible: boolean
  toggleRightSidebar: () => Promise<void>
  leftSidebarTab: 'files' | 'notes'
  setLeftSidebarTab: (tab: 'files' | 'notes') => Promise<void>
  initSidebarState: () => Promise<void>
}

// 从 localStorage 获取初始状态
const getInitialState = () => {
  if (typeof window === 'undefined') return { left: true, right: true }
  
  const leftState = localStorage.getItem('leftSidebarVisible')
  const rightState = localStorage.getItem('rightSidebarVisible')
  
  return {
    left: leftState !== null ? leftState === 'true' : true,
    right: rightState !== null ? rightState === 'true' : true
  }
}

const initialState = getInitialState()

export const useSidebarStore = create<SidebarState>((set, get) => ({
  fileSidebarVisible: true,
  toggleFileSidebar: async () => {
    const newState = !get().fileSidebarVisible
    set({ fileSidebarVisible: newState })
    await safeSetToStore('fileSidebarVisible', newState)
  },
  showFileSidebar: async () => {
    set({ fileSidebarVisible: true })
    await safeSetToStore('fileSidebarVisible', true)
  },
  noteSidebarVisible: true,
  toggleNoteSidebar: async () => {
    const newState = !get().noteSidebarVisible
    set({ noteSidebarVisible: newState })
    await safeSetToStore('noteSidebarVisible', newState)
  },
  showNoteSidebar: async () => {
    set({ noteSidebarVisible: true })
    await safeSetToStore('noteSidebarVisible', true)
  },
  leftSidebarVisible: initialState.left,
  toggleLeftSidebar: async () => {
    const newState = !get().leftSidebarVisible
    set({ leftSidebarVisible: newState })
    localStorage.setItem('leftSidebarVisible', String(newState))
    await safeSetToStore('leftSidebarVisible', newState)
  },
  rightSidebarVisible: initialState.right,
  toggleRightSidebar: async () => {
    const newState = !get().rightSidebarVisible
    set({ rightSidebarVisible: newState })
    localStorage.setItem('rightSidebarVisible', String(newState))
    await safeSetToStore('rightSidebarVisible', newState)
  },
  leftSidebarTab: 'files',
  setLeftSidebarTab: async (tab: 'files' | 'notes') => {
    set({ leftSidebarTab: tab })
    localStorage.setItem('leftSidebarTab', tab)
    await safeSetToStore('leftSidebarTab', tab)
  },
  initSidebarState: async () => {
    const leftState = await safeGetFromStore<boolean | null>('leftSidebarVisible', null)
    const rightState = await safeGetFromStore<boolean | null>('rightSidebarVisible', null)
    const leftTab = await safeGetFromStore<'files' | 'notes' | null>('leftSidebarTab', null)
    
    if (leftState !== null && leftState !== undefined) {
      set({ leftSidebarVisible: leftState })
      localStorage.setItem('leftSidebarVisible', String(leftState))
    }
    if (rightState !== null && rightState !== undefined) {
      set({ rightSidebarVisible: rightState })
      localStorage.setItem('rightSidebarVisible', String(rightState))
    }
    if (leftTab) {
      set({ leftSidebarTab: leftTab })
      localStorage.setItem('leftSidebarTab', leftTab)
    }
  },
}))
