'use client'

import React from 'react'
import { useTranslations } from 'next-intl'
import { useSidebarStore } from '@/stores/sidebar'
import useSettingStore from '@/stores/setting'
import { PanelLeft, PanelLeftClose, PanelRight, PanelRightClose } from 'lucide-react'
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

export function NotesToolbar() {
  const t = useTranslations()
  const { leftSidebarVisible, rightSidebarVisible, toggleLeftSidebar, toggleRightSidebar } = useSidebarStore()
  const { recordToolbarConfig } = useSettingStore()
  const isMobile = useIsMobile()

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

        {/* 右侧按钮 */}
        <div className="flex items-center gap-0.5 ml-auto">
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
