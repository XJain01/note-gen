/**
 * 分类列表项右键菜单示例
 * 
 * 这个示例展示如何在分类项上添加右键菜单功能
 * 包括：编辑分类、删除分类等操作
 */

import React, { useState } from 'react'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'
import { Edit2, Trash2, FolderPlus } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface CategoryItemProps {
  category: {
    icon: React.ElementType | null
    label: string
    count: number
    color?: string
  }
  isSelected: boolean
  onClick: () => void
  onEdit?: (oldLabel: string, newLabel: string) => void
  onDelete?: (label: string) => void
  isCustom?: boolean // 是否是自定义分类（只有自定义分类可以编辑/删除）
}

export function CategoryItemWithContextMenu({
  category,
  isSelected,
  onClick,
  onEdit,
  onDelete,
  isCustom = false
}: CategoryItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(category.label)

  const handleEdit = () => {
    if (!isCustom) return
    
    setIsEditing(true)
    setEditValue(category.label)
  }

  const handleSaveEdit = () => {
    if (!editValue.trim()) {
      toast({
        title: '提示',
        description: '分类名称不能为空',
        variant: 'destructive',
      })
      return
    }
    
    if (onEdit) {
      onEdit(category.label, editValue.trim())
    }
    
    setIsEditing(false)
    toast({
      title: '成功',
      description: '分类名称已更新',
    })
  }

  const handleDelete = () => {
    if (!isCustom) return
    
    if (confirm(`确定要删除分类 "${category.label}" 吗？`)) {
      if (onDelete) {
        onDelete(category.label)
      }
      toast({
        title: '成功',
        description: `分类 "${category.label}" 已删除`,
      })
    }
  }

  // 如果是自定义分类，使用右键菜单包裹
  if (isCustom) {
    return (
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div
            data-allow-context-menu="true"
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-accent transition-colors cursor-pointer ${
              isSelected ? 'bg-emerald-50 dark:bg-emerald-950' : ''
            }`}
            onClick={onClick}
          >
            <div className="flex items-center gap-3 flex-1">
              {category.icon && (
                <category.icon className={`w-4 h-4 ${category.color || (isSelected ? 'text-emerald-500' : 'text-muted-foreground')}`} />
              )}
              {isEditing ? (
                <input
                  type="text"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={handleSaveEdit}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSaveEdit()
                    } else if (e.key === 'Escape') {
                      setIsEditing(false)
                      setEditValue(category.label)
                    }
                  }}
                  className="flex-1 text-sm bg-transparent border-b border-emerald-500 focus:outline-none"
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <span className={`text-sm ${isSelected ? 'text-emerald-600 dark:text-emerald-400' : 'text-foreground'}`}>
                  {category.label}
                </span>
              )}
            </div>
            <span className="text-xs text-muted-foreground">{category.count}</span>
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem onClick={handleEdit}>
            <Edit2 className="w-4 h-4 mr-2" />
            编辑分类
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem 
            onClick={handleDelete}
            className="text-red-600 focus:text-red-600"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            删除分类
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    )
  }

  // 默认分类不使用右键菜单
  return (
    <div
      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-accent transition-colors cursor-pointer ${
        isSelected ? 'bg-emerald-50 dark:bg-emerald-950' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex items-center gap-3">
        {category.icon && (
          <category.icon className={`w-4 h-4 ${category.color || (isSelected ? 'text-emerald-500' : 'text-muted-foreground')}`} />
        )}
        <span className={`text-sm ${isSelected ? 'text-emerald-600 dark:text-emerald-400' : 'text-foreground'}`}>
          {category.label}
        </span>
      </div>
      {category.label === '全部' ? (
        <button 
          className="w-6 h-6 flex items-center justify-center rounded hover:bg-emerald-100 dark:hover:bg-emerald-900 text-emerald-500 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      ) : (
        <span className="text-xs text-muted-foreground">{category.count}</span>
      )}
    </div>
  )
}

/**
 * 使用示例：
 * 
 * import { CategoryItemWithContextMenu } from './category-item-with-context-menu'
 * 
 * // 在分类列表中使用
 * {categories.map((category, index) => (
 *   <CategoryItemWithContextMenu
 *     key={index}
 *     category={category}
 *     isSelected={selectedCategory === category.label}
 *     onClick={() => onSelectCategory(category.label)}
 *     onEdit={handleEditCategory}
 *     onDelete={handleDeleteCategory}
 *     isCustom={index >= 4} // 前4个是默认分类，后面的是自定义分类
 *   />
 * ))}
 * 
 * // 实现编辑和删除处理函数
 * const handleEditCategory = (oldLabel: string, newLabel: string) => {
 *   const updatedCategories = customCategories.map(cat =>
 *     cat.label === oldLabel ? { ...cat, label: newLabel } : cat
 *   )
 *   onCategoriesChange(updatedCategories)
 * }
 * 
 * const handleDeleteCategory = (label: string) => {
 *   const updatedCategories = customCategories.filter(cat => cat.label !== label)
 *   onCategoriesChange(updatedCategories)
 *   // 如果删除的是当前选中的分类，切换到"全部"
 *   if (selectedCategory === label) {
 *     onSelectCategory('全部')
 *   }
 * }
 */
