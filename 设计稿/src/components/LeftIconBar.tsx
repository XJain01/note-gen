import React from 'react';
import { MessageSquare, User, FileText, Cloud, Image, Trash2, Settings } from 'lucide-react';

interface LeftIconBarProps {
  activeIcon: string;
  setActiveIcon: (icon: string) => void;
}

export function LeftIconBar({ activeIcon, setActiveIcon }: LeftIconBarProps) {
  const iconClass = (name: string) =>
    `w-14 h-14 flex items-center justify-center rounded-full cursor-pointer transition-colors ${
      activeIcon === name ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
    }`;

  return (
    <div className="w-[90px] bg-white border-r border-gray-200 flex flex-col items-center py-4 gap-3">
      {/* Logo */}
      <div className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center mb-2">
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
          <path
            d="M16 4C9.373 4 4 9.373 4 16s5.373 12 12 12 12-5.373 12-12S22.627 4 16 4zm-1 18h2v2h-2v-2zm0-10h2v8h-2v-8z"
            fill="white"
          />
        </svg>
      </div>

      {/* Icons */}
      <div
        className={iconClass('message')}
        onClick={() => setActiveIcon('message')}
      >
        <MessageSquare size={24} />
      </div>

      <div
        className={iconClass('contacts')}
        onClick={() => setActiveIcon('contacts')}
      >
        <User size={24} />
      </div>

      <div
        className={iconClass('notes')}
        onClick={() => setActiveIcon('notes')}
      >
        <FileText size={24} />
      </div>

      <div
        className={iconClass('cloud')}
        onClick={() => setActiveIcon('cloud')}
      >
        <Cloud size={24} />
      </div>

      <div
        className={iconClass('album')}
        onClick={() => setActiveIcon('album')}
      >
        <Image size={24} />
      </div>

      <div className="flex-1" />

      {/* Bottom icons */}
      <div className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-gray-600 cursor-pointer">
        <Trash2 size={20} />
      </div>

      <div className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-gray-600 cursor-pointer">
        <Settings size={20} />
      </div>
    </div>
  );
}
