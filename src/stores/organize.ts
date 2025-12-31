import { create } from 'zustand'
import { Chat } from '@/db/chats'

export interface OrganizeTask {
  id: string
  categoryName: string
  chats: Chat[]
  targetFolder: string
  fileName: string
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
  progress: string // 当前进度描述
  cacheContent: string // 缓存的内容
  error?: string
}

interface OrganizeState {
  // 当前正在进行的整理任务
  currentTask: OrganizeTask | null
  
  // AbortController 引用
  abortController: AbortController | null
  
  // 开始整理任务
  startTask: (task: Omit<OrganizeTask, 'id' | 'status' | 'progress' | 'cacheContent'>) => string
  
  // 更新任务进度
  updateProgress: (progress: string) => void
  
  // 更新缓存内容
  updateCacheContent: (content: string) => void
  
  // 追加缓存内容
  appendCacheContent: (content: string) => void
  
  // 完成任务
  completeTask: () => void
  
  // 任务失败
  failTask: (error: string) => void
  
  // 取消/停止任务
  cancelTask: () => void
  
  // 设置 AbortController
  setAbortController: (controller: AbortController | null) => void
  
  // 清除任务
  clearTask: () => void
}

const useOrganizeStore = create<OrganizeState>((set, get) => ({
  currentTask: null,
  abortController: null,
  
  startTask: (taskData) => {
    const id = `organize_${Date.now()}`
    const task: OrganizeTask = {
      ...taskData,
      id,
      status: 'processing',
      progress: '准备中...',
      cacheContent: '',
    }
    set({ currentTask: task })
    return id
  },
  
  updateProgress: (progress) => {
    const { currentTask } = get()
    if (currentTask) {
      set({ currentTask: { ...currentTask, progress } })
    }
  },
  
  updateCacheContent: (content) => {
    const { currentTask } = get()
    if (currentTask) {
      set({ currentTask: { ...currentTask, cacheContent: content } })
    }
  },
  
  appendCacheContent: (content) => {
    const { currentTask } = get()
    if (currentTask) {
      set({ currentTask: { ...currentTask, cacheContent: currentTask.cacheContent + content } })
    }
  },
  
  completeTask: () => {
    const { currentTask } = get()
    if (currentTask) {
      set({ 
        currentTask: { ...currentTask, status: 'completed', progress: '整理完成' },
        abortController: null 
      })
    }
  },
  
  failTask: (error) => {
    const { currentTask } = get()
    if (currentTask) {
      set({ 
        currentTask: { ...currentTask, status: 'failed', progress: '整理失败', error },
        abortController: null 
      })
    }
  },
  
  cancelTask: () => {
    const { currentTask, abortController } = get()
    if (abortController) {
      abortController.abort()
    }
    if (currentTask) {
      set({ 
        currentTask: { ...currentTask, status: 'cancelled', progress: '已停止' },
        abortController: null 
      })
    }
  },
  
  setAbortController: (controller) => {
    set({ abortController: controller })
  },
  
  clearTask: () => {
    set({ currentTask: null, abortController: null })
  },
}))

export default useOrganizeStore
