'use client'
import { useRouter  } from 'next/navigation'
import { useEffect } from 'react'
import { isMobileDevice } from '@/lib/check'
import { isTauriEnvironment, safeLoadStore } from '@/lib/tauri-utils'

export default function Home() {
  const router = useRouter()
  async function init() {
    // 如果不在 Tauri 环境中，直接导航到默认页面
    if (!isTauriEnvironment()) {
      console.warn('Not running in Tauri environment, redirecting to default page')
      router.push('/core/notes')
      return
    }

    try {
      const store = await safeLoadStore('store.json')
      if (!store) {
        router.push('/core/notes')
        return
      }

      let currentPage = await store.get<string>('currentPage')
      
      if (isMobileDevice()) {
        // 移动端逻辑
        if (currentPage?.includes('/mobile')) {
          router.push(currentPage || '/mobile/chat')
        } else {
          router.push('/mobile/chat')
        }
      } else {
        // PC 端逻辑:将旧路径重定向到新的笔记页面
        if (currentPage === '/core/article' || currentPage === '/core/record' || currentPage === '/core/main') {
          currentPage = '/core/notes'
          await store.set('currentPage', '/core/notes')
          await store.save()
        }
        
        if (!currentPage?.includes('/mobile')) {
          router.push(currentPage || '/core/notes')
        } else {
          router.push('/core/notes')
        }
      }
    } catch (error) {
      console.error('Error initializing app:', error)
      // 发生错误时,导航到默认页面
      router.push('/core/notes')
    }
  }
  useEffect(() => {
    init()
  }, [])
}
