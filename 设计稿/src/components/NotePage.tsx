import React, { useState } from 'react';
import { CategoryList } from './CategoryList';
import { MainContent } from './MainContent';
import { BottomInput } from './BottomInput';
import { Message } from '../App';

export function NotePage() {
  const [selectedCategory, setSelectedCategory] = useState('全部');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: '🔔 通过话筒输入，话袋还能能记录你的想法一继续为待办提醒来一趁天下午晴去开学了试试看吧~',
      type: '待办',
      timestamp: '2025-12-30 13:19:37',
      isNew: false,
      title: '取快递',
    },
  ]);

  const addMessage = (content: string, type: '笔记' | '待办' | '备忘' | string, title?: string) => {
    const now = new Date();
    const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    
    const newMessage: Message = {
      id: Date.now().toString(),
      content,
      type,
      timestamp,
      isNew: true,
      title,
    };

    setMessages([newMessage, ...messages]);

    // 3秒后移除高亮效果
    setTimeout(() => {
      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg.id === newMessage.id ? { ...msg, isNew: false } : msg
        )
      );
    }, 3000);
  };

  return (
    <>
      {/* 分类列表区域 */}
      <CategoryList 
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
      />
      
      {/* 主内容区域 */}
      <div className="flex-1 flex flex-col">
        <MainContent messages={messages} />
        <BottomInput onSendMessage={addMessage} />
      </div>
    </>
  );
}
