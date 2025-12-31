'use client'

import { useEffect } from 'react'
import { safeSetToStore } from '@/lib/tauri-utils'

export default function CloudPage() {
  useEffect(() => {
    async function saveCurrentPage() {
      await safeSetToStore('currentPage', '/core/cloud')
    }
    saveCurrentPage()
  }, [])

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <h1 className="text-2xl font-bold text-muted-foreground">网盘</h1>
      <p className="text-muted-foreground mt-4">即将推出...</p>
    </div>
  )
}
