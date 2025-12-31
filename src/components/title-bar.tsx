'use client'

import { useEffect, useState } from 'react'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { isMobileDevice } from '@/lib/check'
import { isTauriEnvironment } from '@/lib/tauri-utils'
import { Minus, Square, X } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { PinToggle } from './pin-toggle'
import AppStatus from './app-status'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Button } from '@/components/ui/button'
import React from 'react'

type Platform = 'macos' | 'windows' | 'linux' | 'unknown'

interface TitleBarProps {
  // 移除 onSearchClick，搜索功能现在在笔记页面内
}

export function TitleBar({}: TitleBarProps) {
  const [currentPlatform, setCurrentPlatform] = useState<Platform>('unknown')
  const [isMobile, setIsMobile] = useState(true)
  const pathname = usePathname()
  const router = useRouter()
  const t = useTranslations()

  useEffect(() => {
    // 检查是否为移动设备
    setIsMobile(isMobileDevice())
    
    // 只在 Tauri 环境中检测平台
    if (isTauriEnvironment()) {
      (async () => {
        try {
          const { platform } = await import('@tauri-apps/plugin-os')
          const p = platform()
          if (p === 'macos') {
            setCurrentPlatform('macos')
          } else if (p === 'windows') {
            setCurrentPlatform('windows')
          } else if (p === 'linux') {
            setCurrentPlatform('linux')
          }
        } catch (error) {
          console.error('Error detecting platform:', error)
        }
      })()
    } else {
      // 网页调试模式下，设置默认平台为 windows
      setCurrentPlatform('windows')
    }
  }, [])



  const handleMinimize = async () => {
    try {
      const window = getCurrentWindow()
      await window.minimize()
    } catch (error) {
      console.error('Error minimizing window:', error)
    }
  }

  const handleMaximize = async () => {
    try {
      const window = getCurrentWindow()
      await window.toggleMaximize()
    } catch (error) {
      console.error('Error maximizing window:', error)
    }
  }

  const handleClose = async () => {
    try {
      const window = getCurrentWindow()
      await window.close()
    } catch (error) {
      console.error('Error closing window:', error)
    }
  }

  // 移动端不显示标题栏
  if (isMobile) {
    return null
  }

  // macOS: 红绿灯按钮在左侧，拖拽区域需要避开
  // Windows/Linux: 控制按钮在右侧，拖拽区域需要避开
  const isMacOS = currentPlatform === 'macos'
  // 是否在 Tauri 环境中
  const isTauri = isTauriEnvironment()

  return (
    <TooltipProvider>
      <div
        className="h-[36px] w-full flex flex-nowrap items-center select-none shrink-0 fixed top-0 left-0 right-0 z-[9999] border-b bg-background"
        style={{
          // macOS 红绿灯按钮在左侧，需要留出空间（约 70px）
          paddingLeft: isMacOS ? '70px' : '0',
        }}
        data-tauri-drag-region
      >
        {/* 占位区域，保持拖拽功能 */}
        <div className="flex-1" data-tauri-drag-region />

        {/* 右侧按钮 */}
        <div className="flex items-center gap-0.5 px-2 shrink-0" data-tauri-drag-region="false">
          <PinToggle />
          
          <AppStatus inTitlebar />
        </div>

        {/* Windows 控制按钮 */}
        {!isMacOS && (
          <div className="flex items-center shrink-0 relative z-10" data-tauri-drag-region="false">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-12 rounded-none hover:bg-accent"
              onClick={handleMinimize}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-12 rounded-none hover:bg-accent"
              onClick={handleMaximize}
            >
              <Square className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-12 rounded-none hover:bg-destructive hover:text-destructive-foreground"
              onClick={handleClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </TooltipProvider>
  )
}
