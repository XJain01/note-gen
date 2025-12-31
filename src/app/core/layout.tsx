'use client'

import { ThemeProvider } from "@/components/theme-provider"
import useSettingStore from "@/stores/setting"
import { useEffect, useState } from "react";
import { initAllDatabases } from "@/db"
import dayjs from "dayjs"
import zh from "dayjs/locale/zh-cn";
import en from "dayjs/locale/en";
import { useI18n } from "@/hooks/useI18n"
import useVectorStore from "@/stores/vector"
import useImageStore from "@/stores/imageHosting"
import useShortcutStore from "@/stores/shortcut"
import useChatStore from "@/stores/chat"
import initQuickRecordText from "@/lib/shortcut/quick-record-text"
import { useRouter, usePathname } from "next/navigation"
import initShowWindow from "@/lib/shortcut/show-window"
import { initMcp } from "@/lib/mcp/init"
import { reportAppStart } from "@/lib/event-report"
import { TitleBar } from "@/components/title-bar"
import { safeSetToStore } from "@/lib/tauri-utils"
import { MainSidebar } from "@/components/main-sidebar"

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { initSettingData, uiScale, customCss } = useSettingStore()
  const { initMainHosting } = useImageStore()
  const { currentLocale } = useI18n()
  const { initShortcut } = useShortcutStore()
  const { initVectorDb } = useVectorStore()
  const { initIsLinkMark } = useChatStore()
  const router = useRouter()
  const pathname = usePathname()

  // 重定向旧路径到新的笔记页面
  useEffect(() => {
    async function redirectOldPaths() {
      if (pathname === '/core/article' || pathname === '/core/record' || pathname === '/core/main') {
        await safeSetToStore('currentPage', '/core/notes')
        router.replace('/core/notes')
      }
    }
    redirectOldPaths()
  }, [pathname, router])

  useEffect(() => {
    initSettingData()
    initMainHosting()
    initAllDatabases()
    initShortcut()
    initVectorDb()
    initIsLinkMark()
    initQuickRecordText()
    initShowWindow()
    initMcp()
    // 上报应用启动事件
    reportAppStart()
  }, [])

  // 应用界面缩放
  useEffect(() => {
    if (uiScale && uiScale !== 100) {
      document.documentElement.style.fontSize = `${uiScale}%`
    }
  }, [uiScale])

  // 应用自定义 CSS
  useEffect(() => {
    if (customCss) {
      let styleElement = document.getElementById('custom-css-style')
      if (!styleElement) {
        styleElement = document.createElement('style')
        styleElement.id = 'custom-css-style'
        document.head.appendChild(styleElement)
      }
      styleElement.textContent = customCss
    }
  }, [customCss])

  useEffect(() => {
    switch (currentLocale) {
      case 'zh':
        dayjs.locale(zh);
        break;
      case 'en':
        dayjs.locale(en);
        break;
      default:
        break;
    }
  }, [currentLocale])

  // 禁用浏览器后退快捷键（Backspace）
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 如果按下 Backspace 键，且不在可编辑元素中
      if (e.key === 'Backspace') {
        const target = e.target as HTMLElement
        const isEditable = 
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable ||
          target.getAttribute('contenteditable') === 'true'
        
        // 如果在可编辑元素中，允许正常删除
        if (isEditable) {
          return
        }
        
        // 否则阻止默认的后退行为
        e.preventDefault()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <TitleBar />
      <MainSidebar />
      <div className="flex h-[calc(100vh-36px)] mt-9 ml-20">
        <main className="flex flex-1 flex-col overflow-hidden w-full">
          {children}
        </main>
      </div>
    </ThemeProvider>
  );
}
