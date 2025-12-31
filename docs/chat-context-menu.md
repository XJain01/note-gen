# 闲聊页面右键菜单使用指南

## 概述

闲聊页面已配置为默认禁用右键菜单。只有在特定元素上才会允许右键菜单显示。

## 实现原理

在 `src/app/core/chat/page.tsx` 中，整个页面容器添加了 `onContextMenu` 事件处理器：

```tsx
<div 
  className="flex h-full"
  onContextMenu={(e) => {
    // 禁用默认右键菜单，除非点击的是特定元素
    const target = e.target as HTMLElement
    // 允许在特定元素上显示自定义右键菜单
    // 可以通过 data-allow-context-menu 属性标记允许右键菜单的元素
    if (!target.closest('[data-allow-context-menu]')) {
      e.preventDefault()
    }
  }}
>
  {/* 页面内容 */}
</div>
```

## 如何在特定按钮上添加右键菜单

### 方法1：使用 data-allow-context-menu 属性

在需要支持右键菜单的元素上添加 `data-allow-context-menu="true"` 属性：

```tsx
<button 
  data-allow-context-menu="true"
  onClick={handleClick}
  onContextMenu={(e) => {
    e.stopPropagation()
    // 自定义右键菜单逻辑
    showCustomMenu()
  }}
>
  按钮文字
</button>
```

### 方法2：使用 ContextMenu 组件

如果需要使用 Radix UI 的 ContextMenu 组件，可以这样做：

```tsx
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"

<ContextMenu>
  <ContextMenuTrigger asChild>
    <button data-allow-context-menu="true">
      右键我试试
    </button>
  </ContextMenuTrigger>
  <ContextMenuContent>
    <ContextMenuItem>菜单项1</ContextMenuItem>
    <ContextMenuItem>菜单项2</ContextMenuItem>
    <ContextMenuItem>菜单项3</ContextMenuItem>
  </ContextMenuContent>
</ContextMenu>
```

## 示例：消息卡片上的更多按钮

在 `src/components/chat/main-content.tsx` 中，更多按钮已经配置了右键菜单支持：

```tsx
<button 
  className="text-muted-foreground hover:text-foreground transition-colors"
  title="更多"
  data-allow-context-menu="true"
  onClick={(e) => {
    e.stopPropagation()
    setOpenMenuId(openMenuId === message.id ? null : message.id)
  }}
  onContextMenu={(e) => {
    // 右键点击时也显示菜单
    e.stopPropagation()
    setOpenMenuId(openMenuId === message.id ? null : message.id)
  }}
>
  <MoreHorizontal className="w-3.5 h-3.5" />
</button>
```

这样，用户既可以左键点击，也可以右键点击来打开菜单。

## 注意事项

1. **必须添加 data-allow-context-menu 属性**：没有这个属性的元素，右键菜单会被禁用
2. **事件传播**：记得使用 `e.stopPropagation()` 阻止事件冒泡到父容器
3. **事件顺序**：`onContextMenu` 事件会在右键点击时触发，在这里可以显示自定义菜单
4. **兼容性**：这个方案对左键和右键都有效，提供更好的用户体验

## 扩展应用

你可以在以下场景应用这个模式：

- 消息卡片上的操作按钮
- 分类标签
- 附件文件
- 图片预览
- 任何需要右键菜单的交互元素

只需要记住：
1. 在元素上添加 `data-allow-context-menu="true"`
2. 在 `onContextMenu` 事件中实现自定义逻辑
3. 使用 `e.stopPropagation()` 和 `e.preventDefault()` 控制事件行为
