'use client'

import { Sparkles, X, Loader2 } from 'lucide-react'
import useOrganizeStore from '@/stores/organize'
import { Button } from '@/components/ui/button'
import { useEffect, useState } from 'react'

export function OrganizeStatusBar() {
  const { currentTask, cancelTask, clearTask } = useOrganizeStore()
  const [show, setShow] = useState(false)
  
  useEffect(() => {
    if (currentTask) {
      setShow(true)
    } else {
      // 延迟隐藏，让用户看到完成状态
      const timer = setTimeout(() => setShow(false), 100)
      return () => clearTimeout(timer)
    }
  }, [currentTask])
  
  // 3秒后自动清除已完成/失败/取消的任务
  useEffect(() => {
    if (currentTask && ['completed', 'failed', 'cancelled'].includes(currentTask.status)) {
      const timer = setTimeout(() => {
        clearTask()
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [currentTask?.status, clearTask])
  
  if (!show || !currentTask) {
    return null
  }
  
  const isProcessing = currentTask.status === 'processing'
  const isCompleted = currentTask.status === 'completed'
  const isFailed = currentTask.status === 'failed'
  const isCancelled = currentTask.status === 'cancelled'
  
  const getStatusColor = () => {
    if (isCompleted) return 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800'
    if (isFailed) return 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800'
    if (isCancelled) return 'bg-gray-50 dark:bg-gray-950 border-gray-200 dark:border-gray-800'
    return 'bg-emerald-50 dark:bg-emerald-950 border-emerald-200 dark:border-emerald-800'
  }
  
  const getTextColor = () => {
    if (isCompleted) return 'text-green-600 dark:text-green-400'
    if (isFailed) return 'text-red-600 dark:text-red-400'
    if (isCancelled) return 'text-gray-600 dark:text-gray-400'
    return 'text-emerald-600 dark:text-emerald-400'
  }
  
  const getIconColor = () => {
    if (isCompleted) return 'text-green-500'
    if (isFailed) return 'text-red-500'
    if (isCancelled) return 'text-gray-500'
    return 'text-emerald-500'
  }
  
  return (
    <div className={`fixed top-9 left-0 right-0 z-50 border-b px-4 py-2 flex items-center justify-between ${getStatusColor()}`}>
      <div className="flex items-center gap-2">
        {isProcessing ? (
          <Loader2 className={`w-4 h-4 ${getIconColor()} animate-spin`} />
        ) : (
          <Sparkles className={`w-4 h-4 ${getIconColor()}`} />
        )}
        <span className={`text-sm ${getTextColor()}`}>
          {isProcessing && `正在整理「${currentTask.categoryName}」- ${currentTask.progress}`}
          {isCompleted && `「${currentTask.categoryName}」整理完成！`}
          {isFailed && `「${currentTask.categoryName}」整理失败：${currentTask.error || '未知错误'}`}
          {isCancelled && `「${currentTask.categoryName}」整理已停止`}
        </span>
      </div>
      <div className="flex items-center gap-2">
        {isProcessing && (
          <Button
            variant="ghost"
            size="sm"
            onClick={cancelTask}
            className="h-6 px-2 text-xs hover:bg-red-100 dark:hover:bg-red-900 text-red-600 dark:text-red-400"
          >
            <X className="w-3 h-3 mr-1" />
            停止
          </Button>
        )}
        {!isProcessing && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearTask}
            className="h-6 px-2 text-xs"
          >
            <X className="w-3 h-3" />
          </Button>
        )}
      </div>
    </div>
  )
}
