import React from 'react';
import { MessageSquare, Notebook, CheckSquare, StickyNote, Cloud, Wrench, Trash2, Settings } from 'lucide-react';

export function Sidebar() {
  const navItems = [
    { icon: MessageSquare, label: '闲聊', active: true, bgColor: 'bg-emerald-400' },
    { icon: Notebook, label: '笔记', active: false, bgColor: 'bg-gray-400' },
    { icon: CheckSquare, label: '待办', active: false, bgColor: 'bg-gray-400' },
    { icon: StickyNote, label: '备忘', active: false, bgColor: 'bg-gray-400' },
    { icon: Cloud, label: '网盘', active: false, bgColor: 'bg-gray-400' },
    { icon: Wrench, label: '工具', active: false, bgColor: 'bg-gray-400' },
  ];

  return (
    <div className="w-20 bg-white border-r border-gray-200 flex flex-col items-center py-4">
      {/* Logo - 闲虾 */}
      <div className="w-12 h-12 rounded-lg bg-emerald-500 flex items-center justify-center mb-6">
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
        {navItems.map((item, index) => (
          <div key={index} className="flex flex-col items-center gap-1">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center cursor-pointer transition-all duration-200 ${
              item.active 
                ? 'bg-emerald-50' 
                : 'hover:bg-gray-100'
            }`}>
              <item.icon className={`w-6 h-6 ${item.active ? 'text-emerald-500' : 'text-gray-500'}`} />
            </div>
            <span className={`text-xs transition-colors ${
              item.active ? 'text-emerald-600' : 'text-gray-600'
            }`}>{item.label}</span>
          </div>
        ))}
      </div>

      {/* Bottom Icons */}
      <div className="flex flex-col items-center gap-6 mt-auto">
        <button className="w-12 h-12 rounded-xl flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-all duration-200">
          <Settings className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}