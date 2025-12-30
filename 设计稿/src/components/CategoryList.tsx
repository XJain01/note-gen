import React from 'react';
import { Search, Star, Clock, FileText, BookMarked } from 'lucide-react';

interface CategoryListProps {
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
}

export function CategoryList({ selectedCategory, onSelectCategory }: CategoryListProps) {
  const categories = [
    { icon: null, label: '全部', count: 2, color: 'text-emerald-500' },
    { icon: FileText, label: '笔记', count: 1 },
    { icon: Clock, label: '待办', count: 1 },
    { icon: BookMarked, label: '备忘', count: 0 },
  ];

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
      {/* Search Bar */}
      <div className="p-4 border-b border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="搜索"
            className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Categories */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-2">
          {categories.map((category, index) => (
            <button
              key={index}
              onClick={() => onSelectCategory(category.label)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors ${
                selectedCategory === category.label ? 'bg-emerald-50' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                {category.icon ? (
                  <category.icon className={`w-4 h-4 ${category.color || 'text-gray-500'}`} />
                ) : (
                  <div className="w-4 h-4 flex items-center justify-center">
                    <div className="w-2 h-2 grid grid-cols-2 gap-0.5">
                      <div className="w-1 h-1 bg-emerald-500 rounded-sm"></div>
                      <div className="w-1 h-1 bg-emerald-500 rounded-sm"></div>
                      <div className="w-1 h-1 bg-emerald-500 rounded-sm"></div>
                      <div className="w-1 h-1 bg-emerald-500 rounded-sm"></div>
                    </div>
                  </div>
                )}
                <span className={`text-sm ${selectedCategory === category.label ? 'text-emerald-600' : 'text-gray-700'}`}>
                  {category.label}
                </span>
              </div>
              {category.label === '全部' ? (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    // TODO: 添加新分类的逻辑
                  }}
                  className="w-6 h-6 flex items-center justify-center rounded hover:bg-emerald-100 text-emerald-500 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              ) : (
                <span className="text-xs text-gray-400">{category.count}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Bottom - Favorites */}
      <div className="border-t border-gray-200 p-2">
        <button
          onClick={() => onSelectCategory('收藏')}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors ${
            selectedCategory === '收藏' ? 'bg-emerald-50' : ''
          }`}
        >
          <div className="flex items-center gap-3">
            <Star className={`w-4 h-4 ${selectedCategory === '收藏' ? 'text-emerald-500' : 'text-gray-500'}`} />
            <span className={`text-sm ${selectedCategory === '收藏' ? 'text-emerald-600' : 'text-gray-700'}`}>
              收藏
            </span>
          </div>
          <span className="text-xs text-gray-400">0</span>
        </button>
      </div>
    </div>
  );
}