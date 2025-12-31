'use client'

import { MainSidebar } from '@/components/main-sidebar'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { safeSetToStore } from '@/lib/tauri-utils'

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    // 保存当前页面路径
    async function saveCurrentPage() {
      await safeSetToStore('currentPage', '/core/home')
    }
    saveCurrentPage()
    
    // 默认导航到笔记页面
    router.replace('/core/notes')
  }, [router])

  return null
}
