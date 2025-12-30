import React from 'react';
import { ChevronDown, Check, FileText, Clock, BookMarked, Smile, Image, Paperclip, Hash, Bold, Underline, AtSign, List, ListOrdered, CheckSquare } from 'lucide-react';

interface BottomInputProps {
  onSendMessage: (content: string, type: '笔记' | '待办' | '备忘' | string, title?: string) => void;
}

export function BottomInput({ onSendMessage }: BottomInputProps) {
  const [showSendOptions, setShowSendOptions] = React.useState(false);
  const [sendMode, setSendMode] = React.useState<'enter' | 'shift-enter'>('enter');
  const [showTypeOptions, setShowTypeOptions] = React.useState(false);
  const [contentType, setContentType] = React.useState<'笔记' | '待办' | '备忘'>('笔记');
  const [inputValue, setInputValue] = React.useState('');

  const typeIcons = {
    '笔记': FileText,
    '待办': Clock,
    '备忘': BookMarked,
  };

  const TypeIcon = typeIcons[contentType];

  const handleSend = () => {
    if (inputValue.trim()) {
      onSendMessage(inputValue, contentType);
      setInputValue('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (sendMode === 'enter' && e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    } else if (sendMode === 'shift-enter' && e.key === 'Enter' && e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="bg-white border-t border-gray-200 px-4 pt-2 pb-4">
      <div className="max-w-4xl mx-auto">
        {/* Toolbar */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1">
            <button className="p-1.5 text-gray-600 hover:bg-gray-100 rounded">
              <Smile className="w-4 h-4" />
            </button>
            <button className="p-1.5 text-gray-600 hover:bg-gray-100 rounded">
              <Image className="w-4 h-4" />
            </button>
            <button className="p-1.5 text-gray-600 hover:bg-gray-100 rounded">
              <Paperclip className="w-4 h-4" />
            </button>
            <div className="w-px h-4 bg-gray-300 mx-1"></div>
            <button className="p-1.5 text-gray-600 hover:bg-gray-100 rounded">
              <Hash className="w-4 h-4" />
            </button>
            <button className="p-1.5 text-gray-600 hover:bg-gray-100 rounded">
              <Bold className="w-4 h-4" />
            </button>
            <button className="p-1.5 text-gray-600 hover:bg-gray-100 rounded">
              <Underline className="w-4 h-4" />
            </button>
            <button className="p-1.5 text-gray-600 hover:bg-gray-100 rounded">
              <AtSign className="w-4 h-4" />
            </button>
            <button className="p-1.5 text-gray-600 hover:bg-gray-100 rounded">
              <List className="w-4 h-4" />
            </button>
            <button className="p-1.5 text-gray-600 hover:bg-gray-100 rounded">
              <ListOrdered className="w-4 h-4" />
            </button>
            <button className="p-1.5 text-gray-600 hover:bg-gray-100 rounded">
              <CheckSquare className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Content Type Selector */}
            <div className="relative">
              <button 
                onClick={() => setShowTypeOptions(!showTypeOptions)}
                className="border border-gray-300 hover:border-gray-400 bg-white text-gray-700 px-3 py-1.5 rounded-lg flex items-center gap-2 transition-colors text-[14px]"
              >
                <TypeIcon className="w-4 h-4" />
                <span>{contentType}</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>

              {/* Type Options Dropdown */}
              {showTypeOptions && (
                <div className="absolute bottom-full left-0 mb-2 bg-white rounded-lg shadow-lg border border-gray-200 py-1 w-32">
                  {(['笔记', '待办', '备忘'] as const).map((type) => {
                    const Icon = typeIcons[type];
                    return (
                      <button
                        key={type}
                        onClick={() => {
                          setContentType(type);
                          setShowTypeOptions(false);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 text-sm text-gray-700 transition-colors"
                      >
                        <Icon className="w-4 h-4" />
                        <span>{type}</span>
                        {contentType === type && <Check className="w-4 h-4 text-emerald-500 ml-auto" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Send Button */}
            <div className="relative">
              <button 
                onClick={handleSend}
                className="bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-1.5 rounded-lg flex items-center gap-2 transition-colors text-[14px]"
              >
                <span>发送</span>
                <ChevronDown 
                  className="w-4 h-4" 
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowSendOptions(!showSendOptions);
                  }}
                />
              </button>

              {/* Send Options Dropdown */}
              {showSendOptions && (
                <div className="absolute bottom-full right-0 mb-2 bg-white rounded-lg shadow-lg border border-gray-200 p-4 w-64">
                  <div className="mb-3 text-sm text-gray-600">快捷发送方式</div>
                  
                  <button
                    onClick={() => {
                      setSendMode('enter');
                      setShowSendOptions(false);
                    }}
                    className="w-full flex items-center gap-3 px-2 py-2.5 hover:bg-gray-50 rounded text-sm text-gray-700 transition-colors"
                  >
                    <div className="w-4 h-4 flex items-center justify-center">
                      {sendMode === 'enter' && <Check className="w-4 h-4 text-emerald-500" />}
                    </div>
                    <span>按 Enter 键发送</span>
                  </button>

                  <button
                    onClick={() => {
                      setSendMode('shift-enter');
                      setShowSendOptions(false);
                    }}
                    className="w-full flex items-center gap-3 px-2 py-2.5 hover:bg-gray-50 rounded text-sm text-gray-700 transition-colors"
                  >
                    <div className="w-4 h-4 flex items-center justify-center">
                      {sendMode === 'shift-enter' && <Check className="w-4 h-4 text-emerald-500" />}
                    </div>
                    <span>按 Shift + Enter 键发送</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Input Area */}
        <div className="bg-gray-50 rounded-lg">
          <textarea
            placeholder="输入消息..."
            className="w-full px-4 py-3 bg-transparent resize-none focus:outline-none text-sm"
            rows={5}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>
      </div>
    </div>
  );
}