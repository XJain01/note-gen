'use client'

import React from 'react'
import { useTranslations } from 'next-intl'
import { useSidebarStore } from '@/stores/sidebar'
import useSettingStore from '@/stores/setting'
import useArticleStore from '@/stores/article'
import { PanelLeft, PanelLeftClose, PanelRight, PanelRightClose, Search } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Button } from '@/components/ui/button'
import { SyncToggle } from './title-bar-toolbars/sync-toggle'
import { ControlText } from '@/app/core/record/mark/control-text'
import { ControlRecording } from '@/app/core/record/mark/control-recording'
import { ControlScan } from '@/app/core/record/mark/control-scan'
import { ControlImage } from '@/app/core/record/mark/control-image'
import { ControlLink } from '@/app/core/record/mark/control-link'
import { ControlFile } from '@/app/core/record/mark/control-file'
import { useIsMobile } from '@/hooks/use-mobile'

interface NotesToolbarProps {
  onSearchClick?: () => void
}

export function NotesToolbar({ onSearchClick }: NotesToolbarProps) {
  const t = useTranslations()
  const { leftSidebarVisible, rightSidebarVisible, toggleLeftSidebar, toggleRightSidebar } = useSidebarStore()
  const { recordToolbarConfig } = useSettingStore()
  const { activeFilePath } = useArticleStore()
  const isMobile = useIsMobile()

  const getFileName = () => {
    if (!activeFilePath) return ''
    const parts = activeFilePath.split('/')
    return parts[parts.length - 1]
  }

  const searchPlaceholder = getFileName() || t('navigation.searchPlaceholder')

  // 移动端不显示工具条
  if (isMobile) {
    return null
  }

  return (
    <TooltipProvider>
      <div
        className="h-[36px] w-full flex flex-nowrap items-center justify-between select-none shrink-0 border-b bg-background px-2"
      >
        {/* 左侧记录工具栏按钮 */}
        <div className="flex items-center gap-0.5">
          {recordToolbarConfig
            .filter(item => item.enabled)
            .sort((a, b) => a.order - b.order)
            .map(item => {
              switch (item.id) {
                case 'text':
                  return <ControlText key={item.id} />
                case 'recording':
                  return <ControlRecording key={item.id} />
                case 'scan':
                  return <ControlScan key={item.id} />
                case 'image':
                  return <ControlImage key={item.id} />
                case 'link':
                  return <ControlLink key={item.id} />
                case 'file':
                  return <ControlFile key={item.id} />
                default:
                  return null
              }
            })}
        </div>

        {/* 中间搜索框 */}
        <div className="flex-1 flex items-center justify-center px-4 min-w-[200px] max-w-[600px] mx-auto">
          <div 
            className="relative w-full h-6 max-w-md group cursor-pointer flex justify-center items-center border rounded-sm"
            onClick={() => onSearchClick?.()}
          >
            <Search className="size-3.5 text-muted-foreground" />
            <div className="pl-2 text-xs text-muted-foreground transition-colors">
              <span className="truncate">{searchPlaceholder}</span>
            </div>
          </div>
        </div>

        {/* 右侧按钮 */}
        <div className="flex items-center gap-0.5">
          {/* 左侧边栏切换按钮 */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={toggleLeftSidebar}
              >
                {leftSidebarVisible ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeft className="h-4 w-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>{leftSidebarVisible ? t('navigation.hideLeftSidebar') : t('navigation.showLeftSidebar')}</p>
            </TooltipContent>
          </Tooltip>

          {/* 右侧边栏切换按钮 */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={toggleRightSidebar}
              >
                {rightSidebarVisible ? <PanelRightClose className="h-4 w-4" /> : <PanelRight className="h-4 w-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>{rightSidebarVisible ? t('navigation.hideRightSidebar') : t('navigation.showRightSidebar')}</p>
            </TooltipContent>
          </Tooltip>
          
          <SyncToggle />
        </div>
      </div>
    </TooltipProvider>
  )
}
