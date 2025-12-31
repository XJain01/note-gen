'use client'

import React from 'react'
import { ChevronDown, Check, FileText, Smile, Image as ImageIcon, Paperclip, Hash, Bold, Underline, AtSign, List, ListOrdered, CheckSquare, X } from 'lucide-react'
import { Category } from './category-list'
import { EmojiPicker } from './emoji-picker'
import { FilePickerDialog } from './file-picker-dialog'
import type { ContentBlock, TextFormat, ListItem } from './main-content'
import { open } from '@tauri-apps/plugin-dialog'
import { readFile } from '@tauri-apps/plugin-fs'
import { isTauriEnvironment } from '@/lib/tauri-utils'

interface BottomInputProps {
  onSendMessage: (content: string | ContentBlock[], type: '笔记' | '待办' | '备忘' | string, title?: string) => void
  categories: Category[]
}

export function BottomInput({ onSendMessage, categories }: BottomInputProps) {
  const [showSendOptions, setShowSendOptions] = React.useState(false)
  const [sendMode, setSendMode] = React.useState<'enter' | 'shift-enter'>('enter')
  const [showTypeOptions, setShowTypeOptions] = React.useState(false)
  
  // 过滤掉"全部"和"收藏"，只保留可选择的分类
  const selectableCategories = categories.filter(cat => cat.label !== '全部' && cat.label !== '收藏')
  
  // 默认选择第一个可用的分类，如果没有则为"笔记"
  const [contentType, setContentType] = React.useState<string>(
    selectableCategories.length > 0 ? selectableCategories[0].label : '笔记'
  )
  const [inputValue, setInputValue] = React.useState('')
  
  // 附件列表（图片、文件、链接、@文件）
  const [attachments, setAttachments] = React.useState<ContentBlock[]>([])
  
  // 当前文本格式
  const [currentFormat, setCurrentFormat] = React.useState<TextFormat[]>([])
  
  // 文件选择器对话框
  const [showFilePicker, setShowFilePicker] = React.useState(false)
  
  // 输入框引用
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)
  
  // 历史记录管理 - 用于撤销/重做
  const [history, setHistory] = React.useState<string[]>([''])
  const [historyIndex, setHistoryIndex] = React.useState(0)
  const isUndoRedoRef = React.useRef(false)
  const isComposingRef = React.useRef(false) // 标记是否正在使用输入法
  
  // 获取当前选中分类的图标
  const currentCategory = selectableCategories.find(cat => cat.label === contentType)
  const TypeIcon = currentCategory?.icon as React.ElementType || FileText
  
  // 监听 inputValue 变化，添加到历史记录
  React.useEffect(() => {
    if (isUndoRedoRef.current) {
      // 如果是撤销/重做操作，不记录历史
      isUndoRedoRef.current = false
      return
    }
    
    // 如果正在使用输入法，不记录历史
    if (isComposingRef.current) {
      return
    }
    
    // 添加到历史记录
    if (inputValue !== history[historyIndex]) {
      const newHistory = history.slice(0, historyIndex + 1)
      newHistory.push(inputValue)
      // 限制历史记录数量为100条
      if (newHistory.length > 100) {
        newHistory.shift()
      } else {
        setHistoryIndex(historyIndex + 1)
      }
      setHistory(newHistory)
    }
  }, [inputValue])
  
  // 撤销
  const handleUndo = () => {
    if (historyIndex > 0) {
      isUndoRedoRef.current = true
      setHistoryIndex(historyIndex - 1)
      setInputValue(history[historyIndex - 1])
    }
  }
  
  // 重做
  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      isUndoRedoRef.current = true
      setHistoryIndex(historyIndex + 1)
      setInputValue(history[historyIndex + 1])
    }
  }

  // 安全的 base64 编码函数，分块处理避免栈溢出
  const arrayBufferToBase64 = (buffer: Uint8Array): string => {
    let binary = ''
    const chunkSize = 8192 // 每次处理8KB
    
    for (let i = 0; i < buffer.length; i += chunkSize) {
      const chunk = buffer.slice(i, i + chunkSize)
      binary += String.fromCharCode.apply(null, Array.from(chunk))
    }
    
    return btoa(binary)
  }

  // 处理emoji选择 - 直接插入到光标位置
  const handleEmojiSelect = (emoji: string) => {
    const textarea = textareaRef.current
    if (!textarea) return
    
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const newValue = inputValue.substring(0, start) + emoji + inputValue.substring(end)
    
    setInputValue(newValue)
    
    // 恢复光标位置
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + emoji.length, start + emoji.length)
    }, 0)
  }

  // 添加文本块 - 不再使用
  const addTextBlock = () => {
    // 空函数，保持兼容
  }

  // 处理图片上传 - 直接插入到光标位置作为占位符
  const handleImageUpload = async () => {
    if (!isTauriEnvironment()) return
    
    try {
      const selected = await open({
        multiple: false,
        filters: [{
          name: 'Images',
          extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp']
        }]
      })
      
      if (selected && typeof selected === 'string') {
        const filePath = selected
        const fileName = filePath.split(/[\\/]/).pop() || 'image'
        
        try {
          // 读取文件并转换为 base64
          const fileData = await readFile(filePath)
          
          // 检查文件大小，如果超过1MB则提示
          if (fileData.length > 1024 * 1024) {
            alert('图片文件过大，请选择小于1MB的图片')
            return
          }
          
          const base64 = arrayBufferToBase64(new Uint8Array(fileData))
          const mimeType = fileName.endsWith('.png') ? 'image/png' 
            : fileName.endsWith('.jpg') || fileName.endsWith('.jpeg') ? 'image/jpeg'
            : fileName.endsWith('.gif') ? 'image/gif'
            : 'image/webp'
          
          // 将图片添加到附件中（用于发送），同时在输入框中插入占位符
          const imageUrl = `data:${mimeType};base64,${base64}`
          setAttachments(prev => [
            ...prev,
            { type: 'image', url: imageUrl, name: fileName }
          ])
          
          // 在光标位置插入图片占位符
          const textarea = textareaRef.current
          if (textarea) {
            const placeholder = `[图片:${fileName}]`
            const start = textarea.selectionStart
            const end = textarea.selectionEnd
            const newValue = inputValue.substring(0, start) + placeholder + inputValue.substring(end)
            setInputValue(newValue)
            
            // 恢复光标位置
            setTimeout(() => {
              textarea.focus()
              textarea.setSelectionRange(start + placeholder.length, start + placeholder.length)
            }, 0)
          }
        } catch (err) {
          console.error('Failed to read image file:', err)
          alert('读取图片失败，请重试')
        }
      }
    } catch (error) {
      console.error('Failed to upload image:', error)
    }
  }

  // 处理文件上传 - 作为附件
  const handleFileUpload = async () => {
    if (!isTauriEnvironment()) return
    
    try {
      const selected = await open({
        multiple: false
      })
      
      if (selected && typeof selected === 'string') {
        const filePath = selected
        const fileName = filePath.split(/[\\/]/).pop() || 'file'
        
        try {
          // 读取文件
          const fileData = await readFile(filePath)
          
          // 检查文件大小，如果超过5MB则提示
          if (fileData.length > 5 * 1024 * 1024) {
            alert('文件过大，请选择小于5MB的文件')
            return
          }
          
          const base64 = arrayBufferToBase64(new Uint8Array(fileData))
          
          setAttachments(prev => [
            ...prev,
            { type: 'file', url: `data:application/octet-stream;base64,${base64}`, name: fileName, size: fileData.length }
          ])
        } catch (err) {
          console.error('Failed to read file:', err)
          alert('读取文件失败，请重试')
        }
      }
    } catch (error) {
      console.error('Failed to upload file:', error)
    }
  }

  // 处理链接输入 - 直接插入 markdown 链接模板
  const handleLinkInput = () => {
    const textarea = textareaRef.current
    if (!textarea) return
    
    const linkTemplate = '[点击链接](https://www.baidu.com)'
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const newValue = inputValue.substring(0, start) + linkTemplate + inputValue.substring(end)
    
    setInputValue(newValue)
    
    // 选中 "点击链接" 文字，方便用户修改
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + 1, start + 5) // 选中 "点击链接"
    }, 0)
  }

  // 切换文本格式 - 对选中的文本应用格式
  const toggleFormat = (format: TextFormat) => {
    const textarea = textareaRef.current
    if (!textarea) return
    
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    
    // 如果没有选中文本，切换全局格式状态
    if (start === end) {
      setCurrentFormat(prev => {
        if (prev.includes(format)) {
          return prev.filter(f => f !== format)
        } else {
          return [...prev, format]
        }
      })
      return
    }
    
    // 有选中文本，包装选中的文本
    const selectedText = inputValue.substring(start, end)
    let wrappedText = selectedText
    
    if (format === 'bold') {
      wrappedText = `**${selectedText}**`
    } else if (format === 'underline') {
      wrappedText = `__${selectedText}__`
    }
    
    const newValue = inputValue.substring(0, start) + wrappedText + inputValue.substring(end)
    setInputValue(newValue)
    
    // 恢复光标位置
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + wrappedText.length, start + wrappedText.length)
    }, 0)
  }

  // 处理@文件选择 - 直接插入到光标位置
  const handleFileSelect = (file: { id: number; name: string; path: string }) => {
    const textarea = textareaRef.current
    if (!textarea) return
    
    const mention = `@${file.name}`
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const newValue = inputValue.substring(0, start) + mention + ' ' + inputValue.substring(end)
    
    setInputValue(newValue)
    
    // 恢复光标位置
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + mention.length + 1, start + mention.length + 1)
    }, 0)
  }

  // 添加列表 - 在当前行或选中行添加列表标记
  const addList = (listType: 'unordered' | 'ordered' | 'task') => {
    const textarea = textareaRef.current
    if (!textarea) return
    
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    
    // 获取光标所在行的开始位置
    const textBeforeCursor = inputValue.substring(0, start)
    const lastNewLineIndex = textBeforeCursor.lastIndexOf('\n')
    const lineStart = lastNewLineIndex === -1 ? 0 : lastNewLineIndex + 1
    
    // 如果有选中文本，处理所有选中的行
    if (start !== end) {
      const selectedText = inputValue.substring(start, end)
      const lines = selectedText.split('\n')
      let formattedText = ''
      
      lines.forEach((line, index) => {
        if (line.trim()) {
          if (listType === 'ordered') {
            formattedText += `${index + 1}. ${line.trim()}\n`
          } else if (listType === 'task') {
            formattedText += `- [ ] ${line.trim()}\n`
          } else {
            formattedText += `- ${line.trim()}\n`
          }
        } else {
          formattedText += '\n'
        }
      })
      
      const newValue = inputValue.substring(0, start) + formattedText.trimEnd() + inputValue.substring(end)
      setInputValue(newValue)
      
      // 恢复光标位置
      setTimeout(() => {
        textarea.focus()
        textarea.setSelectionRange(start, start + formattedText.length)
      }, 0)
    } else {
      // 没有选中文本，在当前行开头插入列表标记
      let prefix = ''
      if (listType === 'ordered') {
        prefix = '1. '
      } else if (listType === 'task') {
        prefix = '- [ ] '
      } else {
        prefix = '- '
      }
      
      const newValue = inputValue.substring(0, lineStart) + prefix + inputValue.substring(lineStart)
      setInputValue(newValue)
      
      // 光标移到列表标记后面
      setTimeout(() => {
        textarea.focus()
        textarea.setSelectionRange(lineStart + prefix.length, lineStart + prefix.length)
      }, 0)
    }
  }

  // 删除附件
  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index))
  }

  const handleSend = () => {
    // 发送消息
    if (!inputValue.trim() && attachments.length === 0) return
    
    // 构建消息内容
    const contentBlocks: ContentBlock[] = []
    
    // 处理文本内容，解析 markdown 格式和图片占位符
    if (inputValue.trim()) {
      // 创建图片名称到图片数据的映射
      const imageMap = new Map()
      attachments.forEach(att => {
        if (att.type === 'image') {
          imageMap.set(att.name, att)
        }
      })
      
      // 分割文本，处理图片占位符
      const parts = inputValue.split(/\[图片:([^\]]+)\]/)
      
      for (let i = 0; i < parts.length; i++) {
        if (i % 2 === 0) {
          // 文本部分，解析 markdown 格式
          const text = parts[i]
          if (text) {
            parseTextWithFormat(text, contentBlocks)
          }
        } else {
          // 图片占位符
          const imageName = parts[i]
          const imageData = imageMap.get(imageName)
          if (imageData && imageData.type === 'image') {
            contentBlocks.push(imageData)
          }
        }
      }
    }
    
    // 添加非图片、@文件和链接附件（只添加文件附件）
    attachments.forEach(att => {
      if (att.type === 'file') {
        contentBlocks.push(att)
      }
    })
    
    onSendMessage(contentBlocks, contentType)
    setInputValue('')
    setAttachments([])
    setCurrentFormat([])
  }

  // 解析文本中的格式标记
  const parseTextWithFormat = (text: string, blocks: ContentBlock[]) => {
    // 先检查是否是列表格式
    const lines = text.split('\n')
    const listLines: { type: 'unordered' | 'ordered' | 'task', text: string, checked?: boolean }[] = []
    let isInList = false
    let normalTextLines: string[] = []
    
    for (const line of lines) {
      const trimmedLine = line.trim()
      
      // 检测任务列表 - [ ] 或 - [x]
      const taskMatch = trimmedLine.match(/^-\s*\[([ xX])\]\s*(.*)$/)
      if (taskMatch) {
        // 如果之前有普通文本，先输出
        if (normalTextLines.length > 0) {
          parseInlineFormats(normalTextLines.join('\n'), blocks)
          normalTextLines = []
        }
        
        listLines.push({
          type: 'task',
          text: taskMatch[2],
          checked: taskMatch[1].toLowerCase() === 'x'
        })
        isInList = true
        continue
      }
      
      // 检测无序列表 - item
      const unorderedMatch = trimmedLine.match(/^-\s+(.+)$/)
      if (unorderedMatch) {
        // 如果之前有普通文本，先输出
        if (normalTextLines.length > 0) {
          parseInlineFormats(normalTextLines.join('\n'), blocks)
          normalTextLines = []
        }
        
        listLines.push({
          type: 'unordered',
          text: unorderedMatch[1]
        })
        isInList = true
        continue
      }
      
      // 检测有序列表 1. item
      const orderedMatch = trimmedLine.match(/^\d+\.\s+(.+)$/)
      if (orderedMatch) {
        // 如果之前有普通文本，先输出
        if (normalTextLines.length > 0) {
          parseInlineFormats(normalTextLines.join('\n'), blocks)
          normalTextLines = []
        }
        
        listLines.push({
          type: 'ordered',
          text: orderedMatch[1]
        })
        isInList = true
        continue
      }
      
      // 如果不是列表项，但前面有列表项，先输出列表
      if (isInList && listLines.length > 0) {
        // 输出列表块
        const listType = listLines[0].type
        blocks.push({
          type: 'list',
          listType,
          items: listLines.map(item => ({
            text: item.text,
            checked: item.checked
          }))
        })
        listLines.length = 0
        isInList = false
      }
      
      // 累积普通文本行（保留换行）
      normalTextLines.push(line)
    }
    
    // 如果最后还有列表项，输出它们
    if (listLines.length > 0) {
      const listType = listLines[0].type
      blocks.push({
        type: 'list',
        listType,
        items: listLines.map(item => ({
          text: item.text,
          checked: item.checked
        }))
      })
    }
    
    // 如果还有普通文本，输出它们
    if (normalTextLines.length > 0) {
      parseInlineFormats(normalTextLines.join('\n'), blocks)
    }
  }
  
  // 解析行内格式（粗体、下划线、@文件、链接）
  const parseInlineFormats = (text: string, blocks: ContentBlock[]) => {
    // 使用正则表达式匹配 **粗体**、__下划线__、@文件、Markdown链接 和 直接URL
    const regex = /(\*\*([^*]+)\*\*)|(__([^_]+)__)|((@[^\s]+))|(\[([^\]]+)\]\(([^)]+)\))|(https?:\/\/[^\s]+)|([^*_@[h]+|h(?!ttps?:\/\/))/g
    let match
    let currentText = ''
    let currentFormat: TextFormat[] = []
    
    while ((match = regex.exec(text)) !== null) {
      if (match[1]) {
        // 粗体 **text**
        if (currentText) {
          blocks.push({ type: 'text', content: currentText, format: currentFormat.length > 0 ? [...currentFormat] : undefined })
          currentText = ''
        }
        blocks.push({ type: 'text', content: match[2], format: ['bold'] })
      } else if (match[3]) {
        // 下划线 __text__
        if (currentText) {
          blocks.push({ type: 'text', content: currentText, format: currentFormat.length > 0 ? [...currentFormat] : undefined })
          currentText = ''
        }
        blocks.push({ type: 'text', content: match[4], format: ['underline'] })
      } else if (match[5]) {
        // @文件
        if (currentText) {
          blocks.push({ type: 'text', content: currentText, format: currentFormat.length > 0 ? [...currentFormat] : undefined })
          currentText = ''
        }
        const mentionText = match[6]
        const fileName = mentionText.substring(1) // 移除 @ 符号
        blocks.push({ type: 'mention', fileId: 0, fileName: fileName, filePath: '' })
      } else if (match[7]) {
        // Markdown 链接 [text](url)
        if (currentText) {
          blocks.push({ type: 'text', content: currentText, format: currentFormat.length > 0 ? [...currentFormat] : undefined })
          currentText = ''
        }
        const linkText = match[8]
        const linkUrl = match[9]
        blocks.push({ type: 'link', url: linkUrl, title: linkText })
      } else if (match[10]) {
        // 直接 URL 链接
        if (currentText) {
          blocks.push({ type: 'text', content: currentText, format: currentFormat.length > 0 ? [...currentFormat] : undefined })
          currentText = ''
        }
        blocks.push({ type: 'link', url: match[10], title: match[10] })
      } else if (match[11]) {
        // 普通文本
        currentText += match[11]
      }
    }
    
    // 添加剩余的文本
    if (currentText) {
      blocks.push({ type: 'text', content: currentText, format: currentFormat.length > 0 ? [...currentFormat] : undefined })
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Ctrl+Z 撤销
    if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
      e.preventDefault()
      handleUndo()
      return
    }
    
    // Ctrl+Y 或 Ctrl+Shift+Z 重做
    if ((e.ctrlKey && e.key === 'y') || (e.ctrlKey && e.shiftKey && e.key === 'z')) {
      e.preventDefault()
      handleRedo()
      return
    }
    
    // Enter 发送
    if (sendMode === 'enter' && e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    } else if (sendMode === 'shift-enter' && e.key === 'Enter' && e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="bg-background border-t border-border px-4 pt-2 pb-4">
      <div className="max-w-4xl mx-auto">
        {/* Toolbar */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1">
            {/* Emoji */}
            <EmojiPicker onEmojiSelect={handleEmojiSelect}>
              <button className="p-1.5 text-muted-foreground hover:bg-accent rounded">
                <Smile className="w-4 h-4" />
              </button>
            </EmojiPicker>
            
            {/* 图片 */}
            <button 
              onClick={handleImageUpload}
              className="p-1.5 text-muted-foreground hover:bg-accent rounded"
            >
              <ImageIcon className="w-4 h-4" />
            </button>
            
            {/* 文件 */}
            <button 
              onClick={handleFileUpload}
              className="p-1.5 text-muted-foreground hover:bg-accent rounded"
            >
              <Paperclip className="w-4 h-4" />
            </button>
            
            <div className="w-px h-4 bg-border mx-1"></div>
            
            {/* 链接 */}
            <button 
              onClick={handleLinkInput}
              className="p-1.5 text-muted-foreground hover:bg-accent rounded"
            >
              <Hash className="w-4 h-4" />
            </button>
            
            {/* 加粗 */}
            <button 
              onClick={() => toggleFormat('bold')}
              className={`p-1.5 rounded ${
                currentFormat.includes('bold') 
                  ? 'bg-accent text-foreground' 
                  : 'text-muted-foreground hover:bg-accent'
              }`}
            >
              <Bold className="w-4 h-4" />
            </button>
            
            {/* 下划线 */}
            <button 
              onClick={() => toggleFormat('underline')}
              className={`p-1.5 rounded ${
                currentFormat.includes('underline') 
                  ? 'bg-accent text-foreground' 
                  : 'text-muted-foreground hover:bg-accent'
              }`}
            >
              <Underline className="w-4 h-4" />
            </button>
            
            {/* @文件 */}
            <button 
              onClick={() => setShowFilePicker(true)}
              className="p-1.5 text-muted-foreground hover:bg-accent rounded"
            >
              <AtSign className="w-4 h-4" />
            </button>
            
            {/* 无序列表 */}
            <button 
              onClick={() => addList('unordered')}
              className="p-1.5 text-muted-foreground hover:bg-accent rounded"
            >
              <List className="w-4 h-4" />
            </button>
            
            {/* 有序列表 */}
            <button 
              onClick={() => addList('ordered')}
              className="p-1.5 text-muted-foreground hover:bg-accent rounded"
            >
              <ListOrdered className="w-4 h-4" />
            </button>
            
            {/* 任务列表 */}
            <button 
              onClick={() => addList('task')}
              className="p-1.5 text-muted-foreground hover:bg-accent rounded"
            >
              <CheckSquare className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Content Type Selector */}
            <div className="relative">
              <button 
                onClick={() => setShowTypeOptions(!showTypeOptions)}
                className="border border-border hover:border-muted-foreground bg-background text-foreground px-3 py-1.5 rounded-lg flex items-center gap-2 transition-colors text-[14px]"
              >
                <TypeIcon className="w-4 h-4" />
                <span>{contentType}</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>

              {/* Type Options Dropdown */}
              {showTypeOptions && (
                <div className="absolute bottom-full left-0 mb-2 bg-popover rounded-lg shadow-lg border border-border py-1 w-32 z-10">
                  {selectableCategories.map((category) => {
                    const Icon = category.icon as React.ElementType || FileText
                    return (
                      <button
                        key={category.label}
                        onClick={() => {
                          setContentType(category.label)
                          setShowTypeOptions(false)
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-accent text-sm text-foreground transition-colors"
                      >
                        <Icon className="w-4 h-4" />
                        <span>{category.label}</span>
                        {contentType === category.label && <Check className="w-4 h-4 text-emerald-500 ml-auto" />}
                      </button>
                    )
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
                    e.stopPropagation()
                    setShowSendOptions(!showSendOptions)
                  }}
                />
              </button>

              {/* Send Options Dropdown */}
              {showSendOptions && (
                <div className="absolute bottom-full right-0 mb-2 bg-popover rounded-lg shadow-lg border border-border p-4 w-64 z-10">
                  <div className="mb-3 text-sm text-muted-foreground">快捷发送方式</div>
                  
                  <button
                    onClick={() => {
                      setSendMode('enter')
                      setShowSendOptions(false)
                    }}
                    className="w-full flex items-center gap-3 px-2 py-2.5 hover:bg-accent rounded text-sm text-foreground transition-colors"
                  >
                    <div className="w-4 h-4 flex items-center justify-center">
                      {sendMode === 'enter' && <Check className="w-4 h-4 text-emerald-500" />}
                    </div>
                    <span>按 Enter 键发送</span>
                  </button>

                  <button
                    onClick={() => {
                      setSendMode('shift-enter')
                      setShowSendOptions(false)
                    }}
                    className="w-full flex items-center gap-3 px-2 py-2.5 hover:bg-accent rounded text-sm text-foreground transition-colors"
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
        <div className="bg-accent/50 rounded-lg">
          {/* 附件预览（仅显示文件） */}
          {attachments.filter(a => a.type === 'file').length > 0 && (
            <div className="px-4 pt-3 pb-2 border-b border-border space-y-2">
              {attachments.map((attachment, index) => {
                // 只显示文件附件
                if (attachment.type !== 'file') return null
                
                return (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <Paperclip className="w-4 h-4 text-muted-foreground" />
                    <span className="text-foreground flex-1 truncate">{attachment.name}</span>
                    <button
                      onClick={() => removeAttachment(index)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )
              })}
            </div>
          )}
          
          <textarea
            ref={textareaRef}
            placeholder="输入消息..."
            className="w-full px-4 py-3 bg-transparent resize-none focus:outline-none text-sm"
            rows={5}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onCompositionStart={() => {
              isComposingRef.current = true
            }}
            onCompositionEnd={() => {
              isComposingRef.current = false
              // 输入法结束后，手动触发一次历史记录
              if (inputValue !== history[historyIndex]) {
                const newHistory = history.slice(0, historyIndex + 1)
                newHistory.push(inputValue)
                if (newHistory.length > 100) {
                  newHistory.shift()
                } else {
                  setHistoryIndex(historyIndex + 1)
                }
                setHistory(newHistory)
              }
            }}
          />
        </div>
        
        {/* 文件选择对话框 */}
        <FilePickerDialog
          open={showFilePicker}
          onOpenChange={setShowFilePicker}
          onFileSelect={handleFileSelect}
        />
      </div>
    </div>
  )
}
