import React from 'react';

export function ChatPage() {
  return (
    <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50">
      <div className="text-center">
        <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-emerald-100 flex items-center justify-center">
          <svg className="w-14 h-14 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
        </div>
        <h2 className="text-2xl font-semibold text-gray-800 mb-3">闲聊模式</h2>
        <p className="text-gray-600 text-lg">这里将是自由对话的空间</p>
        <p className="text-gray-400 mt-2">功能开发中...</p>
      </div>
    </div>
  );
}
