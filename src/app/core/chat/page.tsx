'use client'

import { useEffect } from 'react'
import { safeSetToStore } from '@/lib/tauri-utils'

export default function ChatPage() {
  console.log('ChatPage rendered')
  
  useEffect(() => {
    console.log('ChatPage mounted')
    // 保存当前页面路径
    async function saveCurrentPage() {
      await safeSetToStore('currentPage', '/core/chat')
    }
    saveCurrentPage()
  }, [])

  return (
    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950">
      <div className="text-center">
        <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center">
          <svg className="w-14 h-14 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
        </div>
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-3">闲聊模式</h2>
        <p className="text-gray-600 dark:text-gray-400 text-lg">这里将是自由对话的空间</p>
        <p className="text-gray-400 dark:text-gray-600 mt-2">功能开发中...</p>
      </div>
    </div>
  )
}
