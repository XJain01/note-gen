'use client'

import React, { useState } from 'react'
import { Search, Star, FolderPlus, Sparkles, Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from '@/hooks/use-toast'
import useOrganizeStore from '@/stores/organize'

export interface Category {
  icon: React.ElementType | null
  label: string
  count: number
  color?: string
}

interface CategoryListProps {
  selectedCategory: string
  onSelectCategory: (category: string) => void
  customCategories: Category[]
  onCategoriesChange: (categories: Category[]) => void
  favoriteCount?: number
  defaultCategories: Category[]
  onOrganizeCategory?: (category: string) => void
  organizingCategory?: string | null // 保留兼容性，但优先使用全局 store
}

export function CategoryList({ selectedCategory, onSelectCategory, customCategories, onCategoriesChange, favoriteCount = 0, defaultCategories, onOrganizeCategory, organizingCategory: propOrganizingCategory }: CategoryListProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  
  // 使用全局 store 获取整理状态
  const { currentTask } = useOrganizeStore()
  const organizingCategory = currentTask?.status === 'processing' ? currentTask.categoryName : propOrganizingCategory
  
  // 合并分类,并过滤掉"收藏"(收藏在底部单独显示)
  const categories = React.useMemo(() => {
    return [...defaultCategories, ...customCategories].filter(cat => cat.label !== '收藏')
  }, [defaultCategories, customCategories])
  
  
  const handleCreateCategory = () => {
    if (!newCategoryName.trim()) {
      toast({
        title: '提示',
        description: '分类名称不能为空',
        variant: 'destructive',
      })
      return
    }
    
    const trimmedName = newCategoryName.trim()
    
    // 检查是否是保留分类名称
    const reservedNames = ['收藏', '全部', '笔记', '待办', '备忘']
    if (reservedNames.includes(trimmedName)) {
      toast({
        title: '提示',
        description: '该分类名称为系统保留，请使用其他名称',
        variant: 'destructive',
      })
      return
    }
    
    // 检查分类是否已存在
    if (categories.some(cat => cat.label === trimmedName)) {
      toast({
        title: '提示',
        description: '该分类已存在',
        variant: 'destructive',
      })
      return
    }
    
    // 创建新分类
    const newCategory: Category = {
      icon: FolderPlus,
      label: trimmedName,
      count: 0,
    }
    
    onCategoriesChange([...customCategories, newCategory])
    toast({
      title: '成功',
      description: `分类 "${trimmedName}" 创建成功`,
    })
    
    // 重置并关闭对话框
    setNewCategoryName('')
    setIsDialogOpen(false)
  }

  return (
    <div className="w-80 bg-background border-r border-border flex flex-col">
      {/* Search Bar */}
      <div className="p-4 border-b border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="搜索"
            className="w-full pl-10 pr-4 py-2 bg-accent rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Categories */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-2">
          {categories.map((category, index) => {
            // 明确跳过"收藏"分类，因为它在底部单独显示
            if (category.label === '收藏') {
              return null
            }
            
            return (
            <div
              key={index}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-accent transition-colors cursor-pointer ${
                selectedCategory === category.label ? 'bg-emerald-50 dark:bg-emerald-950' : ''
              }`}
              onClick={() => onSelectCategory(category.label)}
            >
              <div className="flex items-center gap-3">
                {category.icon ? (
                  <category.icon className={`w-4 h-4 ${category.color || (selectedCategory === category.label ? 'text-emerald-500' : 'text-muted-foreground')}`} />
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
                <span className={`text-sm ${selectedCategory === category.label ? 'text-emerald-600 dark:text-emerald-400' : 'text-foreground'}`}>
                  {category.label}
                </span>
              </div>
              <div className="flex items-center gap-1">
                {category.label === '全部' ? (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation()
                      setIsDialogOpen(true)
                    }}
                    className="w-6 h-6 flex items-center justify-center rounded hover:bg-emerald-100 dark:hover:bg-emerald-900 text-emerald-500 transition-colors"
                    title="添加分类"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                ) : (
                  <>
                    {category.count > 0 && onOrganizeCategory && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          if (!organizingCategory) {
                            onOrganizeCategory(category.label)
                          }
                        }}
                        disabled={!!organizingCategory && organizingCategory !== category.label}
                        className={`w-6 h-6 flex items-center justify-center rounded transition-colors ${
                          organizingCategory === category.label
                            ? 'text-emerald-500'
                            : organizingCategory
                              ? 'text-gray-300 cursor-not-allowed'
                              : 'hover:bg-emerald-100 dark:hover:bg-emerald-900 text-emerald-500'
                        }`}
                        title={organizingCategory === category.label ? '正在整理...' : '整理此分类'}
                      >
                        {organizingCategory === category.label ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Sparkles className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}
                    <span className="text-xs text-muted-foreground">{category.count}</span>
                  </>
                )}
              </div>
            </div>
            )
          })}
        </div>
      </div>

      {/* Bottom - Favorites */}
      <div className="border-t border-border p-2">
        <div
          onClick={() => onSelectCategory('收藏')}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-accent transition-colors cursor-pointer ${
            selectedCategory === '收藏' ? 'bg-emerald-50 dark:bg-emerald-950' : ''
          }`}
        >
          <div className="flex items-center gap-3">
            <Star className={`w-4 h-4 ${selectedCategory === '收藏' ? 'text-emerald-500' : 'text-muted-foreground'}`} />
            <span className={`text-sm ${selectedCategory === '收藏' ? 'text-emerald-600 dark:text-emerald-400' : 'text-foreground'}`}>
              收藏
            </span>
          </div>
          <div className="flex items-center gap-1">
            {favoriteCount > 0 && onOrganizeCategory && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  if (!organizingCategory) {
                    onOrganizeCategory('收藏')
                  }
                }}
                disabled={!!organizingCategory && organizingCategory !== '收藏'}
                className={`w-6 h-6 flex items-center justify-center rounded transition-colors ${
                  organizingCategory === '收藏'
                    ? 'text-emerald-500'
                    : organizingCategory
                      ? 'text-gray-300 cursor-not-allowed'
                      : 'hover:bg-emerald-100 dark:hover:bg-emerald-900 text-emerald-500'
                }`}
                title={organizingCategory === '收藏' ? '正在整理...' : '整理收藏'}
              >
                {organizingCategory === '收藏' ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" />
                )}
              </button>
            )}
            <span className="text-xs text-muted-foreground">{favoriteCount}</span>
          </div>
        </div>
      </div>
      
      {/* 创建分类对话框 */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>创建新分类</DialogTitle>
            <DialogDescription>
              为你的内容创建一个新的分类标签
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="category-name">分类名称</Label>
              <Input
                id="category-name"
                placeholder="输入分类名称"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleCreateCategory()
                  }
                }}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setNewCategoryName('')
                setIsDialogOpen(false)
              }}
            >
              取消
            </Button>
            <Button onClick={handleCreateCategory}>
              创建
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
