'use client'

import { useEffect, useState, useMemo, useRef } from 'react'
import { safeSetToStore } from '@/lib/tauri-utils'
import { CategoryList, Category } from '@/components/chat/category-list'
import { MainContent, Message, ContentBlock } from '@/components/chat/main-content'
import { BottomInput } from '@/components/chat/bottom-input'
import { OrganizeChatDialog } from '@/components/chat/organize-chat-dialog'
import { FileText, Clock, BookMarked, FolderPlus } from 'lucide-react'
import { initChatsDb, getChats, insertChat, updateChat, Chat, deleteChat } from '@/db/chats'
import { isTauriEnvironment } from '@/lib/tauri-utils'

// 默认分类（移到组件外避免每次渲染重新创建）
const DEFAULT_CATEGORIES: Category[] = [
  { icon: null, label: '全部', count: 0, color: 'text-emerald-500' },
  { icon: FileText, label: '笔记', count: 0 },
  { icon: Clock, label: '待办', count: 0 },
  { icon: BookMarked, label: '备忘', count: 0 },
]

export default function ChatPage() {
  const [selectedCategory, setSelectedCategory] = useState('全部')
  const [messages, setMessages] = useState<Message[]>([])
  const [chatRecords, setChatRecords] = useState<Chat[]>([])
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null)
  const [selectedCategoryForOrganize, setSelectedCategoryForOrganize] = useState<string | null>(null)
  const [isOrganizeDialogOpen, setIsOrganizeDialogOpen] = useState(false)
  
  // 管理分类列表
  const [customCategories, setCustomCategories] = useState<Category[]>(() => {
    // 从 localStorage 加载自定义分类
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('chatCustomCategories')
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          // 恢复图标组件，并过滤掉"收藏"和默认分类
          return parsed
            .filter((cat: any) => cat.label !== '收藏' && cat.label !== '全部' && cat.label !== '笔记' && cat.label !== '待办' && cat.label !== '备忘')
            .map((cat: any) => ({
              ...cat,
              icon: FolderPlus // 自定义分类默认使用 FolderPlus 图标
            }))
        } catch {
          return []
        }
      }
    }
    return []
  })
  
  // 保存自定义分类到 localStorage
  const handleCategoriesChange = (categories: Category[]) => {
    // 过滤掉"收藏"和默认分类，只保留自定义分类
    const filteredCategories = categories.filter(cat => 
      cat.label !== '收藏' && 
      cat.label !== '全部' && 
      cat.label !== '笔记' && 
      cat.label !== '待办' && 
      cat.label !== '备忘'
    )
    
    // 移除计数信息，只保留基本字段
    const categoriesWithoutCount = filteredCategories.map(cat => ({
      icon: cat.icon,
      label: cat.label,
      count: 0,
      color: cat.color
    }))
    setCustomCategories(categoriesWithoutCount)
    
    if (typeof window !== 'undefined') {
      // 只保存必要的字段，不保存图标组件
      const toSave = filteredCategories.map(cat => ({
        label: cat.label,
        count: 0,
        color: cat.color
      }))
      localStorage.setItem('chatCustomCategories', JSON.stringify(toSave))
    }
  }
  
  // 计算每个分类的数量
  const { defaultCategoriesWithCount, customCategoriesWithCount, favoriteCount } = useMemo(() => {
    const counts: Record<string, number> = {}
    let totalCount = 0
    let favoriteCount = 0
    
    chatRecords.forEach(chat => {
      if (chat.category) {
        counts[chat.category] = (counts[chat.category] || 0) + 1
        totalCount++
      }
      if (chat.isFavorite) {
        favoriteCount++
      }
    })
    
    const updatedDefaults = DEFAULT_CATEGORIES.map(cat => {
      if (cat.label === '全部') {
        return { ...cat, count: totalCount }
      }
      return { ...cat, count: counts[cat.label] || 0 }
    })
    
    const updatedCustom = customCategories.map(cat => ({
      ...cat,
      count: counts[cat.label] || 0
    }))
    
    return { 
      defaultCategoriesWithCount: updatedDefaults, 
      customCategoriesWithCount: updatedCustom,
      favoriteCount 
    }
  }, [chatRecords, customCategories])
  
  // 合并默认和自定义分类
  const allCategories = [...defaultCategoriesWithCount, ...customCategoriesWithCount]

  // 初始化数据库并加载数据
  useEffect(() => {
    async function initData() {
      if (isTauriEnvironment()) {
        try {
          await initChatsDb()
          // 使用 tagId = 0 作为聊天页面的标识
          const chats = await getChats(0)
          setChatRecords(chats)
          
          // 转换为 Message 格式
          const msgs: Message[] = chats.map(chat => {
            // 尝试解析富文本内容
            let parsedContent: string | ContentBlock[] = chat.content || ''
            try {
              const parsed = JSON.parse(chat.content || '')
              if (Array.isArray(parsed)) {
                parsedContent = parsed
              }
            } catch {
              // 如果解析失败，保持为字符串
            }
            
            return {
              id: chat.id.toString(),
              content: parsedContent,
              type: chat.category || '笔记',
              timestamp: formatTimestamp(chat.createdAt),
              isNew: false,
              title: chat.title,
              isFavorite: chat.isFavorite || false
            }
          })
          setMessages(msgs)
        } catch (error) {
          console.error('Failed to load chat data:', error)
        }
      }
    }
    initData()
  }, [])

  useEffect(() => {
    async function saveCurrentPage() {
      await safeSetToStore('currentPage', '/core/chat')
    }
    saveCurrentPage()
  }, [])
  
  // 格式化时间戳
  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp)
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`
  }

  const addMessage = async (content: string | ContentBlock[], type: '笔记' | '待办' | '备忘' | string, title?: string) => {
    const now = Date.now()
    const timestamp = formatTimestamp(now)
    
    const newMessage: Message = {
      id: now.toString(),
      content,
      type,
      timestamp,
      isNew: true,
      title,
      isFavorite: false
    }

    setMessages(prev => [...prev, newMessage])
    
    // 将富文本内容转换为 JSON 字符串存储
    const contentToStore = typeof content === 'string' ? content : JSON.stringify(content)
    
    // 创建聊天记录数据
    const chatData: Omit<Chat, 'id' | 'createdAt'> = {
      tagId: 0,
      content: contentToStore,
      role: 'user',
      type: 'chat',
      inserted: false,
      category: type,
      title,
      isFavorite: false
    }
    
    // 保存到数据库
    if (isTauriEnvironment()) {
      try {
        const result = await insertChat(chatData)
        if (result.lastInsertId) {
          // 更新 chatRecords
          const newChat: Chat = {
            id: result.lastInsertId,
            createdAt: now,
            ...chatData
          }
          setChatRecords(prev => [...prev, newChat])
          
          // 更新 message id 为数据库 id
          setMessages(prev => prev.map(msg => 
            msg.id === now.toString() ? { ...msg, id: result.lastInsertId!.toString() } : msg
          ))
        }
      } catch (error) {
        console.error('Failed to save message:', error)
      }
    } else {
      // 非 Tauri 环境，也要更新 chatRecords 用于计数
      const newChat: Chat = {
        id: now,
        createdAt: now,
        ...chatData
      }
      setChatRecords(prev => [...prev, newChat])
    }

    // 3秒后移除高亮效果
    setTimeout(() => {
      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg.id === now.toString() || msg.id === newMessage.id ? { ...msg, isNew: false } : msg
        )
      )
    }, 3000)
  }
  
  // 切换收藏状态
  const toggleFavorite = async (id: string) => {
    setMessages(prev => prev.map(msg => 
      msg.id === id ? { ...msg, isFavorite: !msg.isFavorite } : msg
    ))
    
    // 更新数据库
    if (isTauriEnvironment()) {
      try {
        const chatId = parseInt(id)
        const chat = chatRecords.find(c => c.id === chatId)
        if (chat) {
          const updatedChat = { ...chat, isFavorite: !chat.isFavorite }
          await updateChat(updatedChat)
          setChatRecords(prev => prev.map(c => c.id === chatId ? updatedChat : c))
        }
      } catch (error) {
        console.error('Failed to toggle favorite:', error)
      }
    }
  }
  
  // 删除消息
  const deleteMessage = async (id: string) => {
    // 从状态中移除
    setMessages(prev => prev.filter(msg => msg.id !== id))
    
    // 从数据库删除
    if (isTauriEnvironment()) {
      try {
        const chatId = parseInt(id)
        await deleteChat(chatId)
        setChatRecords(prev => prev.filter(c => c.id !== chatId))
      } catch (error) {
        console.error('Failed to delete message:', error)
      }
    }
  }
  
  // 过滤消息
  const filteredMessages = messages.filter(msg => {
    if (selectedCategory === '全部') {
      return true
    } else if (selectedCategory === '收藏') {
      return msg.isFavorite
    } else {
      return msg.type === selectedCategory
    }
  })

  // 处理整理单个消息（已弃用，但保留以防其他地方调用）
  const handleOrganizeMessage = (id: string) => {
    setSelectedChatId(id)
    setSelectedCategoryForOrganize(null)
    setIsOrganizeDialogOpen(true)
  }

  // 处理整理分类
  const handleOrganizeCategory = (category: string) => {
    setSelectedCategoryForOrganize(category)
    setSelectedChatId(null)
    setIsOrganizeDialogOpen(true)
  }

  // 获取选中的聊天数据（单个或分类）
  const chatsToOrganize = useMemo(() => {
    if (selectedChatId) {
      // 单个聊天记录
      const chat = chatRecords.find(chat => chat.id.toString() === selectedChatId)
      return chat ? [chat] : []
    } else if (selectedCategoryForOrganize) {
      // 整个分类的聊天记录
      if (selectedCategoryForOrganize === '收藏') {
        return chatRecords.filter(chat => chat.isFavorite)
      } else {
        return chatRecords.filter(chat => chat.category === selectedCategoryForOrganize)
      }
    }
    return []
  }, [selectedChatId, selectedCategoryForOrganize, chatRecords])

  return (
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
      {/* 分类列表区域 */}
      <CategoryList 
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        customCategories={customCategoriesWithCount}
        onCategoriesChange={handleCategoriesChange}
        favoriteCount={favoriteCount}
        defaultCategories={defaultCategoriesWithCount}
        onOrganizeCategory={handleOrganizeCategory}
      />
      
      {/* 主内容区域 */}
      <div className="flex-1 flex flex-col">
        <MainContent 
          messages={filteredMessages} 
          onToggleFavorite={toggleFavorite}
          onDeleteMessage={deleteMessage}
        />
        <BottomInput 
          onSendMessage={addMessage}
          categories={allCategories}
        />
      </div>

      {/* 整理对话弹窗 */}
      <OrganizeChatDialog
        open={isOrganizeDialogOpen}
        onOpenChange={setIsOrganizeDialogOpen}
        chats={chatsToOrganize}
      />
    </div>
  )
}
