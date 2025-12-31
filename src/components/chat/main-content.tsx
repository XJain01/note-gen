'use client'

import React from 'react'
import { Clock, Edit2, Heart, MoreHorizontal, FileText, BookMarked, Download, ExternalLink, Check, ZoomIn, X, Trash2, ArrowDown } from 'lucide-react'
import { useRouter } from 'next/navigation'
import useArticleStore from '@/stores/article'
import { useSidebarStore } from '@/stores/sidebar'

// 富文本内容块类型
export type ContentBlock = 
  | { type: 'text'; content: string; format?: TextFormat[] }
  | { type: 'emoji'; emoji: string }
  | { type: 'image'; url: string; name: string; size?: number }
  | { type: 'file'; url: string; name: string; size: number }
  | { type: 'link'; url: string; title?: string; description?: string }
  | { type: 'mention'; fileId: number; fileName: string; filePath: string }
  | { type: 'list'; listType: 'unordered' | 'ordered' | 'task'; items: ListItem[] }

export type TextFormat = 'bold' | 'underline'

export interface ListItem {
  text: string
  checked?: boolean // 仅用于任务列表
  format?: TextFormat[]
}

export interface Message {
  id: string
  content: string | ContentBlock[] // 支持纯文本或富文本块数组
  type: '笔记' | '待办' | '备忘' | string
  timestamp: string
  isNew: boolean
  title?: string
  isFavorite?: boolean
}

interface MainContentProps {
  messages: Message[]
  onToggleFavorite: (id: string) => void
  onDeleteMessage: (id: string) => void
}

// 渲染消息内容
function RenderMessageContent({ 
  content, 
  onMentionClick 
}: { 
  content: string | ContentBlock[]
  onMentionClick: (fileName: string) => void
}) {
  // 为任务列表项添加状态管理
  const [taskStates, setTaskStates] = React.useState<Record<string, boolean>>({})
  // 图片预览状态
  const [previewImage, setPreviewImage] = React.useState<{ url: string; name: string } | null>(null)
  
  // 初始化任务状态
  React.useEffect(() => {
    if (typeof content !== 'string') {
      const initialStates: Record<string, boolean> = {}
      content.forEach((block, blockIndex) => {
        if (block.type === 'list' && block.listType === 'task') {
          block.items.forEach((item, itemIndex) => {
            const key = `${blockIndex}-${itemIndex}`
            initialStates[key] = item.checked || false
          })
        }
      })
      setTaskStates(initialStates)
    }
  }, [content])
  
  // 切换任务状态
  const toggleTask = (blockIndex: number, itemIndex: number) => {
    const key = `${blockIndex}-${itemIndex}`
    setTaskStates(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }
  
  // 下载附件
  const handleDownload = (url: string, fileName: string) => {
    try {
      // 创建一个隐藏的 a 标签来触发下载
      const link = document.createElement('a')
      link.href = url
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error('Download failed:', error)
      alert('下载失败，请重试')
    }
  }
  if (typeof content === 'string') {
    // 处理纯文本，解析 markdown 样式的文本
    return <div className="text-foreground/90 whitespace-pre-wrap">{content}</div>
  }
  
  // 分离文本内容和附件
  const textBlocks: ContentBlock[] = []
  const attachments: ContentBlock[] = []
  
  content.forEach(block => {
    if (block.type === 'file') {
      attachments.push(block)
    } else {
      textBlocks.push(block)
    }
  })
  
  return (
    <div className="space-y-2">
      {/* 文本内容区域 */}
      {textBlocks.length > 0 && (
        <div className="text-foreground/90 whitespace-pre-wrap">
          {textBlocks.map((block, index) => {
            if (block.type === 'text') {
              const textClassName = block.format?.includes('bold') && block.format?.includes('underline')
                ? 'font-bold underline'
                : block.format?.includes('bold')
                ? 'font-bold'
                : block.format?.includes('underline')
                ? 'underline'
                : ''
              // 保留换行符，使用 whitespace-pre-wrap 渲染
              return <span key={index} className={textClassName} style={{ whiteSpace: 'pre-wrap' }}>{block.content}</span>
            }
            if (block.type === 'image') {
              return (
                <span key={index} className="inline-block my-1 relative group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src={block.url} 
                    alt={block.name}
                    className="max-w-xs rounded border border-border inline-block cursor-zoom-in hover:opacity-90 transition-opacity"
                    style={{ maxHeight: '200px', objectFit: 'contain' }}
                    onClick={() => setPreviewImage({ url: block.url, name: block.name })}
                  />
                  {/* 悬停显示放大镜图标 */}
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <div className="bg-black/50 rounded-full p-1.5">
                      <ZoomIn className="w-4 h-4 text-white" />
                    </div>
                  </div>
                </span>
              )
            }
            if (block.type === 'link') {
              return (
                <a 
                  key={index}
                  href={block.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline"
                >
                  {block.title || block.url}
                </a>
              )
            }
            if (block.type === 'mention') {
              return (
                <button
                  key={index}
                  onClick={() => onMentionClick(block.fileName)}
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 rounded text-sm mx-1 hover:bg-blue-200 dark:hover:bg-blue-900 cursor-pointer transition-colors"
                >
                  <FileText className="w-3 h-3" />
                  @{block.fileName}
                </button>
              )
            }
            if (block.type === 'list') {
              return (
                <div key={index} className="my-2">
                  {block.listType === 'unordered' && (
                    <ul className="list-disc list-inside space-y-1">
                      {block.items.map((item, i) => (
                        <li key={i} className="text-foreground/90">{item.text}</li>
                      ))}
                    </ul>
                  )}
                  {block.listType === 'ordered' && (
                    <ol className="list-decimal list-inside space-y-1">
                      {block.items.map((item, i) => (
                        <li key={i} className="text-foreground/90">{item.text}</li>
                      ))}
                    </ol>
                  )}
                  {block.listType === 'task' && (
                    <ul className="space-y-1">
                      {block.items.map((item, i) => {
                        const key = `${index}-${i}`
                        const isChecked = taskStates[key] !== undefined ? taskStates[key] : (item.checked || false)
                        return (
                          <li key={i} className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleTask(index, i)}
                              className="w-4 h-4 rounded border-gray-300 cursor-pointer"
                            />
                            <span className={isChecked ? 'line-through text-muted-foreground' : 'text-foreground/90'}>
                              {item.text}
                            </span>
                          </li>
                        )
                      })}
                    </ul>
                  )}
                </div>
              )
            }
            return null
          })}
        </div>
      )}
      
      {/* 附件区域 - 紧凑布局 */}
      {attachments.length > 0 && (
        <div className="space-y-1 pt-1.5 border-t border-border">
          {attachments.map((attachment, index) => {
            if (attachment.type === 'file') {
              return (
                <div key={index} className="inline-flex items-center gap-1.5 px-2 py-1 bg-accent rounded border border-border">
                  <FileText className="w-3 h-3 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-xs font-medium">{attachment.name}</p>
                  </div>
                  <button 
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => handleDownload(attachment.url, attachment.name)}
                    title="下载"
                  >
                    <Download className="w-3 h-3" />
                  </button>
                </div>
              )
            }
            return null
          })}
        </div>
      )}
      
      {/* 图片预览模态框 */}
      {previewImage && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-[90vw] max-h-[90vh]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={previewImage.url}
              alt={previewImage.name}
              className="max-w-full max-h-[90vh] object-contain"
            />
            <p className="text-white text-sm mt-2 text-center">{previewImage.name}</p>
          </div>
        </div>
      )}
    </div>
  )
}

export function MainContent({ messages, onToggleFavorite, onDeleteMessage }: MainContentProps) {
  const contentRef = React.useRef<HTMLDivElement>(null)
  const router = useRouter()
  const { setActiveFilePath, readArticle, setCollapsibleList, fileTree } = useArticleStore()
  const { setLeftSidebarTab } = useSidebarStore()
  // 下拉菜单状态：记录当前打开的菜单 ID
  const [openMenuId, setOpenMenuId] = React.useState<string | null>(null)
  // 是否显示回到底部按钮
  const [showScrollButton, setShowScrollButton] = React.useState(false)
  
  // 当消息更新时，滚动到底部
  React.useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight
    }
  }, [messages])
  
  // 滚动到底部函数
  const scrollToBottom = () => {
    if (contentRef.current) {
      contentRef.current.scrollTo({
        top: contentRef.current.scrollHeight,
        behavior: 'smooth'
      })
    }
  }
  
  // 监听滚动，判断是否在底部
  React.useEffect(() => {
    const handleScroll = () => {
      if (contentRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = contentRef.current
        // 如果距离底部超过 100px，显示按钮
        const isNearBottom = scrollHeight - scrollTop - clientHeight < 100
        setShowScrollButton(!isNearBottom)
      }
    }
    
    const container = contentRef.current
    if (container) {
      container.addEventListener('scroll', handleScroll)
      // 初始化时检查一次
      handleScroll()
    }
    
    return () => {
      if (container) {
        container.removeEventListener('scroll', handleScroll)
      }
    }
  }, [messages])
  
  // 点击外部关闭菜单
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openMenuId) {
        setOpenMenuId(null)
      }
    }
    
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [openMenuId])
  
  // 处理@文件点击，跳转到笔记
  const handleMentionClick = async (fileName: string) => {
    try {
      console.log('Attempting to open file:', fileName)
      
      // 直接在文件系统中搜索文件，不依赖已加载的文件树
      const { getWorkspacePath, getFilePathOptions } = await import('@/lib/workspace')
      const { readDir, BaseDirectory, exists } = await import('@tauri-apps/plugin-fs')
      
      const workspace = await getWorkspacePath()
      
      // 递归搜索文件
      const searchFile = async (dirPath: string = ''): Promise<string | null> => {
        try {
          let entries
          if (workspace.isCustom) {
            const fullPath = dirPath ? `${workspace.path}/${dirPath}` : workspace.path
            entries = await readDir(fullPath)
          } else {
            const searchPath = dirPath ? `article/${dirPath}` : 'article'
            entries = await readDir(searchPath, { baseDir: BaseDirectory.AppData })
          }
          
          for (const entry of entries) {
            const relativePath = dirPath ? `${dirPath}/${entry.name}` : entry.name
            
            if (entry.isFile) {
              // 尝试多种匹配方式
              const nameWithoutExt = entry.name.replace(/\.md$/, '')
              if (nameWithoutExt === fileName || entry.name === fileName || entry.name === `${fileName}.md`) {
                console.log('Found file at:', relativePath)
                return relativePath
              }
            } else if (entry.isDirectory) {
              // 递归搜索子目录
              const found = await searchFile(relativePath)
              if (found) return found
            }
          }
        } catch (err) {
          console.log('Cannot read directory:', dirPath, err)
        }
        return null
      }
      
      const filePath = await searchFile()
      
      if (filePath) {
        console.log('Opening file:', filePath)
        
        // 切换到笔记标签页
        await setLeftSidebarTab('files')
        console.log('Switched to files tab')
        
        // 确保文件树已加载
        const articleStore = useArticleStore.getState()
        await articleStore.loadFileTree()
        
        // 展开文件夹路径
        const pathParts = filePath.split('/')
        pathParts.pop() // 移除文件名
        
        let currentPath = ''
        for (const part of pathParts) {
          if (currentPath) {
            currentPath += '/' + part
          } else {
            currentPath = part
          }
          
          if (currentPath) {
            await setCollapsibleList(currentPath, true)
          }
        }
        console.log('Expanded folders')
        
        // 设置活动文件路径
        await setActiveFilePath(filePath)
        console.log('Set active file path:', filePath)
        
        // 读取文件内容
        await readArticle(filePath)
        console.log('Read article content')
        
        // 跳转到主页面
        console.log('Navigating to /core/notes')
        await router.push('/core/notes')
        console.log('Navigation completed')
      } else {
        console.warn('File not found:', fileName)
        alert(`未找到文件: ${fileName}`)
      }
    } catch (error) {
      console.error('Error opening file:', error)
      alert(`打开文件失败: ${error}`)
    }
  }
  const getTypeColor = (type: string) => {
    switch (type) {
      case '笔记':
        return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800'
      case '待办':
        return 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800'
      case '备忘':
        return 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case '笔记':
        return <FileText className="w-3 h-3" />
      case '待办':
        return <Clock className="w-3 h-3" />
      case '备忘':
        return <BookMarked className="w-3 h-3" />
      default:
        return null
    }
  }

  return (
    <div ref={contentRef} className="flex-1 overflow-y-auto relative" style={{ backgroundColor: '#F6F6F6' }}>
      {/* Content */}
      <div className="p-6 max-w-4xl space-y-4 relative">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <p className="text-lg">暂无记录</p>
            <p className="text-sm mt-2">在下方输入框开始记录你的想法</p>
          </div>
        ) : (
          messages.map((message) => (
            <div 
              key={message.id}
              className={`bg-card rounded-lg border shadow-sm transition-all duration-300 ${
                message.isNew 
                  ? 'border-emerald-400 ring-2 ring-emerald-200 bg-emerald-50/30 dark:bg-emerald-950/30' 
                  : 'border-border'
              }`}
            >
              {/* Timestamp, Type Badge and Actions - 紧凑布局 */}
              <div className="flex items-center justify-between px-4 py-2 border-b border-border">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{message.timestamp}</span>
                  <span className={`px-2 py-0.5 rounded text-[11px] border flex items-center gap-1 ${getTypeColor(message.type)}`}>
                    {getTypeIcon(message.type)}
                    {message.type}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    title="编辑"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    onClick={() => onToggleFavorite(message.id)}
                    className={`hover:text-foreground transition-colors ${
                      message.isFavorite ? 'text-red-500' : 'text-muted-foreground'
                    }`}
                    title={message.isFavorite ? '取消收藏' : '收藏'}
                  >
                    <Heart className={`w-3.5 h-3.5 ${message.isFavorite ? 'fill-red-500' : ''}`} />
                  </button>
                  <div className="relative">
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
                    
                    {/* 下拉菜单 */}
                    {openMenuId === message.id && (
                      <div 
                        className="absolute right-0 top-full mt-1 bg-popover border border-border rounded-lg shadow-lg py-1 min-w-[120px] z-10"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          className="w-full px-3 py-1.5 text-left text-sm hover:bg-accent flex items-center gap-2 text-red-600 hover:text-red-700"
                          onClick={() => {
                            if (confirm('确定要删除这条消息吗？')) {
                              onDeleteMessage(message.id)
                              setOpenMenuId(null)
                            }
                          }}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          删除
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Message Content */}
              <div className="px-4 py-3">
                {message.title && <h3 className="text-foreground font-medium mb-2">{message.title}</h3>}
                <RenderMessageContent 
                  content={message.content} 
                  onMentionClick={handleMentionClick}
                />
              </div>
            </div>
          ))
        )}
      </div>
      
      {/* 悬浮按钮 - 回到底部 - 固定在滚动容器右下角 */}
      {showScrollButton && (
        <button
          onClick={scrollToBottom}
          className="fixed bottom-24 right-10 z-10 bg-card hover:bg-accent text-muted-foreground hover:text-foreground p-2 rounded-lg shadow-md border border-border transition-all hover:shadow-lg"
          title="回到底部"
        >
          <ArrowDown className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}
