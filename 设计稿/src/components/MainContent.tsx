import React from 'react';
import { Clock, Edit2, Heart, MessageCircle, RotateCcw, MoreHorizontal, Play, FileText, BookMarked } from 'lucide-react';
import screenshotImg from 'figma:asset/2378e8df667ea4b7c0434705d68a0fe9f732023c.png';
import { Message } from '../App';

interface MainContentProps {
  messages: Message[];
}

export function MainContent({ messages }: MainContentProps) {
  const getTypeColor = (type: string) => {
    switch (type) {
      case '笔记':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case '待办':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case '备忘':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case '笔记':
        return <FileText className="w-3.5 h-3.5" />;
      case '待办':
        return <Clock className="w-3.5 h-3.5" />;
      case '备忘':
        return <BookMarked className="w-3.5 h-3.5" />;
      default:
        return null;
    }
  };

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-4 bg-white">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 text-gray-700">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 grid grid-cols-2 gap-0.5">
                <div className="w-1 h-1 bg-gray-400 rounded-sm"></div>
                <div className="w-1 h-1 bg-gray-400 rounded-sm"></div>
                <div className="w-1 h-1 bg-gray-400 rounded-sm"></div>
                <div className="w-1 h-1 bg-gray-400 rounded-sm"></div>
              </div>
              <span>最近记录</span>
            </div>
          </div>
          <button className="text-gray-400 hover:text-gray-600">
            <Clock className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 max-w-4xl space-y-4">
        {messages.map((message) => (
          <div 
            key={message.id}
            className={`bg-white rounded-lg border p-6 shadow-sm transition-all duration-300 ${
              message.isNew 
                ? 'border-emerald-400 ring-2 ring-emerald-200 bg-emerald-50/30' 
                : 'border-gray-200'
            }`}
          >
            {/* Timestamp, Type Badge and Actions */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-500">{message.timestamp}</span>
                <span className={`px-2.5 py-1 rounded-md text-xs border flex items-center gap-1.5 ${getTypeColor(message.type)}`}>
                  {getTypeIcon(message.type)}
                  {message.type}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <button className="flex items-center gap-1 text-gray-500 hover:text-gray-700">
                  <Edit2 className="w-4 h-4" />
                  <span className="text-sm">编辑</span>
                </button>
                <button className="flex items-center gap-1 text-gray-500 hover:text-gray-700">
                  <Heart className="w-4 h-4" />
                  <span className="text-sm">收藏</span>
                </button>
                <button className="text-gray-500 hover:text-gray-700">
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Message Content */}
            <div className="space-y-2">
              {message.title && <h3 className="text-gray-900">{message.title}</h3>}
              <p className="text-gray-700">{message.content}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}