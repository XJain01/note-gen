'use client'

import React from 'react'
import { MessageSquare, Notebook, CheckSquare, StickyNote, Cloud, Wrench, Settings } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'

export function MainSidebar() {
  const pathname = usePathname()
  const router = useRouter()

  const navItems = [
    { icon: MessageSquare, label: '闲聊', path: '/core/chat', bgColor: 'bg-emerald-400' },
    { icon: Notebook, label: '笔记', path: '/core/notes', bgColor: 'bg-gray-400' },
    { icon: CheckSquare, label: '待办', path: '/core/todo', bgColor: 'bg-gray-400' },
    { icon: StickyNote, label: '备忘', path: '/core/memo', bgColor: 'bg-gray-400' },
    { icon: Cloud, label: '网盘', path: '/core/cloud', bgColor: 'bg-gray-400' },
    { icon: Wrench, label: '工具', path: '/core/tools', bgColor: 'bg-gray-400' },
  ]

  const handleNavClick = (path: string) => {
    router.push(path)
  }

  return (
    <div className="w-20 bg-background border-r border-border flex flex-col items-center py-4 fixed top-0 left-0 h-screen z-[10000]">
      {/* Logo - 闲虾 */}
      <div className="w-12 h-12 rounded-lg bg-emerald-500 flex items-center justify-center mb-6 cursor-pointer"
           onClick={() => router.push('/core/home')}>
        <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {/* 虾身 */}
          <path d="M4 12c0-1 1-2 2-2h2c1 0 2 1 2 2v2c0 1-1 2-2 2H6c-1 0-2-1-2-2v-2z" fill="currentColor" stroke="none"/>
          <path d="M8 12h3c1 0 2 1 2 2s-1 2-2 2H8" fill="currentColor" stroke="none"/>
          <path d="M11 12h2.5c1 0 1.5 1 1.5 2s-.5 2-1.5 2H11" fill="currentColor" stroke="none"/>
          <path d="M13.5 12h2c.8 0 1.5 1 1.5 2s-.7 2-1.5 2h-2" fill="currentColor" stroke="none"/>
          {/* 虾尾 */}
          <path d="M16 14c1 0 2-.5 3-1.5M16 14c1 0 2 .5 3 1.5" strokeWidth="1.5"/>
          {/* 虾须 */}
          <path d="M4 11c-.5-1-1-2-1-3M4 11c-.5-1.5-1.5-2.5-2-3" strokeWidth="1.5"/>
          {/* 虾眼 */}
          <circle cx="5.5" cy="12.5" r="0.8" fill="white"/>
          {/* 虾腿 */}
          <path d="M7 16v2M10 16v2M13 16v2" strokeWidth="1.5"/>
        </svg>
      </div>

      {/* Navigation Items */}
      <div className="flex-1 flex flex-col items-center gap-4">
        {navItems.map((item, index) => {
          const isActive = pathname === item.path
          return (
            <div key={index} className="flex flex-col items-center gap-1">
              <div 
                className={`w-12 h-12 rounded-xl flex items-center justify-center cursor-pointer transition-all duration-200 ${
                  isActive 
                    ? 'bg-emerald-50 dark:bg-emerald-950' 
                    : 'hover:bg-accent'
                }`}
                onClick={() => handleNavClick(item.path)}
              >
                <item.icon className={`w-6 h-6 ${isActive ? 'text-emerald-500' : 'text-muted-foreground'}`} />
              </div>
              <span className={`text-xs transition-colors ${
                isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'
              }`}>{item.label}</span>
            </div>
          )
        })}
      </div>

      {/* Bottom Icons */}
      <div className="flex flex-col items-center gap-6 mt-auto">
        <div className="flex flex-col items-center gap-1">
          <button 
            className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200 ${
              pathname.includes('/core/setting')
                ? 'bg-emerald-50 dark:bg-emerald-950' 
                : 'hover:bg-accent'
            }`}
            onClick={() => router.push('/core/setting')}
          >
            <Settings className={`w-5 h-5 ${pathname.includes('/core/setting') ? 'text-emerald-500' : 'text-muted-foreground'}`} />
          </button>
          <span className={`text-xs transition-colors ${
            pathname.includes('/core/setting') ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'
          }`}>设置</span>
        </div>
      </div>
    </div>
  )
}
