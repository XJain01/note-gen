'use client'

import { useEffect } from 'react'
import { safeSetToStore } from '@/lib/tauri-utils'

export default function TodoPage() {
  useEffect(() => {
    async function saveCurrentPage() {
      await safeSetToStore('currentPage', '/core/todo')
    }
    saveCurrentPage()
  }, [])

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <h1 className="text-2xl font-bold text-muted-foreground">待办</h1>
      <p className="text-muted-foreground mt-4">即将推出...</p>
    </div>
  )
}
