"use client"
import useSettingStore, { GenTemplate, GenTemplateRange } from "@/stores/setting"
import useArticleStore from "@/stores/article"
import useOrganizeStore from "@/stores/organize"
import { fetchAiStream } from "@/lib/ai"
import { convertImage } from "@/lib/utils"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Store } from "@tauri-apps/plugin-store"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { useSidebarStore } from "@/stores/sidebar"
import { useRouter } from "next/navigation"
import dayjs, { Dayjs } from "dayjs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useTranslations } from "next-intl"
import { writeTextFile, writeFile, readFile, exists, readDir, BaseDirectory, remove, rename, copyFile, mkdir } from "@tauri-apps/plugin-fs"
import { appDataDir, join } from "@tauri-apps/api/path"
import { getFilePathOptions, getWorkspacePath } from "@/lib/workspace"
import { toast } from "@/hooks/use-toast"
import { Chat } from "@/db/chats"
import { ContentBlock } from "./main-content"
import { uploadImage } from "@/lib/imageHosting"
import { convertToFile } from "@/lib/utils"

interface OrganizeChatDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  chats: Chat[]
  onOrganizingChange?: (isOrganizing: boolean) => void // 通知父组件整理状态变化
}

interface FolderOption {
  label: string
  value: string
}

export function OrganizeChatDialog({ open, onOpenChange, chats, onOrganizingChange }: OrganizeChatDialogProps) {
  const { primaryModel } = useSettingStore()
  const { setActiveFilePath, loadFileTree, readArticle, setCurrentArticle, fileTree } = useArticleStore()
  const { setLeftSidebarTab } = useSidebarStore()
  const { startTask, updateProgress, updateCacheContent, appendCacheContent, completeTask, failTask, setAbortController, currentTask } = useOrganizeStore()
  const router = useRouter()
  const [tab, setTab] = useState('0')
  const [genTemplate, setGenTemplate] = useState<GenTemplate[]>([])
  const [isRemoveThinking, setIsRemoveThinking] = useState(true)
  const [imageHandling, setImageHandling] = useState<'local' | 'hosting' | 'none'>('local') // 图片处理方式
  const [fileName, setFileName] = useState('')
  const [selectedFolder, setSelectedFolder] = useState('')
  const [folderOptions, setFolderOptions] = useState<FolderOption[]>([])
  const t = useTranslations('chat.organize')
  const tRecord = useTranslations('record.chat.note')

  async function initGenTemplates() {
    const store = await Store.load('store.json')
    const template = await store.get<GenTemplate[]>('templateList') || []
    setGenTemplate(template)
  }

  // 加载文件夹列表
  async function loadFolders() {
    try {
      const workspace = await getWorkspacePath()
      const folders: FolderOption[] = [{ label: '根目录', value: '/' }]
      
      const scanDir = async (dirPath: string = ''): Promise<void> => {
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
            if (entry.isDirectory) {
              const relativePath = dirPath ? `${dirPath}/${entry.name}` : entry.name
              folders.push({ label: relativePath, value: relativePath })
              // 递归扫描子目录
              await scanDir(relativePath)
            }
          }
        } catch (err) {
          console.log('Cannot read directory:', dirPath, err)
        }
      }
      
      await scanDir()
      setFolderOptions(folders)
    } catch (error) {
      console.error('Failed to load folders:', error)
      setFolderOptions([{ label: '根目录', value: '/' }])
    }
  }

  useEffect(() => {
    if (open) {
      initGenTemplates()
      loadFolders()
      // 设置默认文件名
      const timestamp = new Date().getTime()
      setFileName(`整理笔记_${timestamp}`)
      setSelectedFolder('/')
    }
  }, [open])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open) return
      if (e.key === 'Enter' && !e.isComposing) {
        e.preventDefault()
        handleOrganize()
      } else if (e.key === 'Escape') {
        e.preventDefault()
        onOpenChange(false)
      }
    }

    setTimeout(() => {
      window.addEventListener('keydown', handleKeyDown)
    }, 500);
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open])

  // 缓存 workspace 信息，避免重复查询
  let cachedWorkspace: { path: string; isCustom: boolean } | null = null
  let assetsDirCreated: Set<string> = new Set()

  // 从 asset:// 或 http://asset.localhost URL 中提取本地文件路径
  function extractPathFromAssetUrl(assetUrl: string): string | null {
    try {
      // Tauri 2.x 使用两种格式:
      // 1. asset://localhost/C%3A%5CUsers%5C...
      // 2. http://asset.localhost/C%3A%5CUsers%5C...
      let path = ''
      
      if (assetUrl.startsWith('asset://localhost/')) {
        path = assetUrl.replace('asset://localhost/', '')
      } else if (assetUrl.startsWith('http://asset.localhost/')) {
        path = assetUrl.replace('http://asset.localhost/', '')
      } else if (assetUrl.startsWith('https://asset.localhost/')) {
        path = assetUrl.replace('https://asset.localhost/', '')
      } else {
        console.error('未知的 asset URL 格式:', assetUrl)
        return null
      }
      
      // URL 解码
      path = decodeURIComponent(path)
      // 将反斜杠转换为正斜杠（Windows 兼容）
      path = path.replace(/\\/g, '/')
      // 在 Windows 上，路径可能是 /C:/... 需要移除开头的斜杠
      if (path.startsWith('/') && path[2] === ':') {
        path = path.slice(1)
      }
      console.log('提取的图片路径:', path)
      return path
    } catch (error) {
      console.error('解析 asset URL 失败:', error)
      return null
    }
  }

  // 复制 asset:// 图片到目标 assets 目录
  async function copyAssetImageToLocal(assetUrl: string, imageName: string, targetFolder: string): Promise<string | null> {
    try {
      console.log('开始复制 asset:// 图片:', assetUrl)
      const sourcePath = extractPathFromAssetUrl(assetUrl)
      if (!sourcePath) {
        console.error('无法解析 asset:// URL:', assetUrl)
        return null
      }
      console.log('源文件路径:', sourcePath)

      // 使用缓存的 workspace 信息
      if (!cachedWorkspace) {
        cachedWorkspace = await getWorkspacePath()
      }
      const workspace = cachedWorkspace
      
      // 创建 assets 目录路径
      const assetsFolder = targetFolder ? `${targetFolder}/assets` : 'assets'
      console.log('目标 assets 目录:', assetsFolder)
      
      // 只在第一次时检查并创建目录
      if (!assetsDirCreated.has(assetsFolder)) {
        const assetsPathOptions = await getFilePathOptions(assetsFolder)
        const assetsDirExists = await exists(assetsPathOptions.path, workspace.isCustom ? undefined : { baseDir: assetsPathOptions.baseDir })
        if (!assetsDirExists) {
          await mkdir(assetsPathOptions.path, { recursive: true, baseDir: workspace.isCustom ? undefined : assetsPathOptions.baseDir } as any)
        }
        assetsDirCreated.add(assetsFolder)
      }
      
      // 生成唯一文件名
      const timestamp = Date.now()
      const randomSuffix = Math.random().toString(36).substring(2, 6)
      // 从原路径获取扩展名
      const ext = sourcePath.split('.').pop() || 'png'
      const sanitizedName = imageName.replace(/[\/\\:*?"<>|]/g, '_').replace(/\.\w+$/, '')
      const fileName = `${sanitizedName}_${timestamp}_${randomSuffix}.${ext}`
      
      // 复制文件（使用 readFile + writeFile 代替 copyFile，更可靠）
      const destPath = `${assetsFolder}/${fileName}`
      const destPathOptions = await getFilePathOptions(destPath)
      console.log('目标文件路径:', destPathOptions.path)
      
      // 读取源文件
      console.log('正在读取源文件...')
      const fileData = await readFile(sourcePath)
      console.log('源文件读取成功，大小:', fileData.length, 'bytes')
      
      // 写入目标文件
      if (workspace.isCustom) {
        await writeFile(destPathOptions.path, fileData)
      } else {
        await writeFile(destPathOptions.path, fileData, { baseDir: destPathOptions.baseDir })
      }
      console.log('图片复制成功:', `./assets/${fileName}`)
      
      // 返回相对路径
      return `./assets/${fileName}`
    } catch (error) {
      console.error('复制图片到本地失败:', error)
      return null
    }
  }

  // 保存 base64 图片到本地 assets 目录（优化版本）
  async function saveImageToLocal(base64Url: string, imageName: string, targetFolder: string): Promise<string | null> {
    try {
      console.log('saveImageToLocal 开始:', imageName, '目标文件夹:', targetFolder)
      
      // 使用缓存的 workspace 信息
      if (!cachedWorkspace) {
        cachedWorkspace = await getWorkspacePath()
      }
      const workspace = cachedWorkspace
      console.log('workspace:', workspace.path, 'isCustom:', workspace.isCustom)
      
      // 创建 assets 目录路径
      const assetsFolder = targetFolder ? `${targetFolder}/assets` : 'assets'
      console.log('assetsFolder:', assetsFolder)
      
      // 只在第一次时检查并创建目录
      if (!assetsDirCreated.has(assetsFolder)) {
        const assetsPathOptions = await getFilePathOptions(assetsFolder)
        console.log('assetsPathOptions:', assetsPathOptions)
        const assetsDirExists = await exists(assetsPathOptions.path, workspace.isCustom ? undefined : { baseDir: assetsPathOptions.baseDir })
        console.log('assets 目录存在:', assetsDirExists)
        if (!assetsDirExists) {
          console.log('创建 assets 目录...')
          await mkdir(assetsPathOptions.path, { recursive: true, baseDir: workspace.isCustom ? undefined : assetsPathOptions.baseDir } as any)
        }
        assetsDirCreated.add(assetsFolder)
      }
      
      // 解析 base64
      const matches = base64Url.match(/^data:image\/(\w+);base64,(.+)$/)
      if (!matches) {
        console.error('无效的 base64 图片格式, URL 前100字符:', base64Url.substring(0, 100))
        return null
      }
      
      const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1]
      const base64Data = matches[2]
      console.log('图片格式:', ext, 'base64 数据长度:', base64Data.length)
      
      // 生成唯一文件名
      const timestamp = Date.now()
      const randomSuffix = Math.random().toString(36).substring(2, 6)
      const sanitizedName = imageName.replace(/[\/\\:*?"<>|]/g, '_').replace(/\.\w+$/, '')
      const fileName = `${sanitizedName}_${timestamp}_${randomSuffix}.${ext}`
      console.log('生成的文件名:', fileName)
      
      // 写入文件
      const imagePath = `${assetsFolder}/${fileName}`
      const imagePathOptions = await getFilePathOptions(imagePath)
      console.log('写入路径:', imagePathOptions.path)
      
      // 将 base64 转为二进制数据
      const binaryString = atob(base64Data)
      const bytes = new Uint8Array(binaryString.length)
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }
      console.log('二进制数据大小:', bytes.length, 'bytes')
      
      // 使用 writeFile 写入二进制数据
      if (workspace.isCustom) {
        await writeFile(imagePathOptions.path, bytes)
      } else {
        await writeFile(imagePathOptions.path, bytes, { baseDir: imagePathOptions.baseDir })
      }
      console.log('图片保存成功:', `./assets/${fileName}`)
      
      // 返回相对路径（相对于 markdown 文件所在目录）
      // handleLocalImage 函数会在编辑器渲染时自动转换为 asset:// URL
      return `./assets/${fileName}`
    } catch (error) {
      console.error('保存图片到本地失败:', error)
      return null
    }
  }

  // 解析聊天内容为纯文本（异步版本，支持处理图片）
  async function parseChatContent(content: string, imageMode: 'local' | 'hosting' | 'none', targetFolder: string): Promise<string> {
    if (!content) {
      return ''
    }
    
    try {
      const parsed = JSON.parse(content)
      if (Array.isArray(parsed)) {
        // 富文本内容块
        const results = await Promise.all(parsed.map(async (block: ContentBlock) => {
          if (block.type === 'text') {
            return block.content
          } else if (block.type === 'image') {
            // 检查图片 URL 类型
            const url = block.url || ''
            console.log('处理图片块:', block.name, '模式:', imageMode, 'URL类型:', url.substring(0, 30) + '...')
            
            // 如果是 HTTP/HTTPS 图片（非 asset.localhost），直接保存链接
            if ((url.startsWith('http://') || url.startsWith('https://')) && !url.includes('asset.localhost')) {
              console.log('HTTP 图片，直接使用链接')
              return `![${block.name}](${url})`
            }
            
            // 如果是 asset 协议（Tauri 本地文件）
            // 支持: asset://localhost/... 和 http://asset.localhost/...
            if (url.startsWith('asset://') || url.includes('asset.localhost')) {
              console.log('asset 图片，开始处理...')
              if (imageMode === 'local') {
                // 复制图片到目标 assets 目录
                const localPath = await copyAssetImageToLocal(url, block.name, targetFolder)
                if (localPath) {
                  console.log('asset:// 图片复制成功:', localPath)
                  return `![${block.name}](${localPath})`
                } else {
                  console.error('asset:// 图片复制失败')
                  return `[图片: ${block.name}（复制失败）]`
                }
              } else if (imageMode === 'hosting') {
                // TODO: 从本地文件上传到图床（暂不支持）
                return `[图片: ${block.name}（asset:// 暂不支持上传图床）]`
              } else {
                // 不处理图片
                return `[图片: ${block.name}]`
              }
            }
            
            // 处理 base64 图片
            if (url.startsWith('data:image/')) {
              console.log('base64 图片，开始处理...')
              if (imageMode === 'hosting') {
                // 上传到图床
                try {
                  const file = await convertToFile(url, block.name)
                  const uploadedUrl = await uploadImage(file)
                  if (uploadedUrl) {
                    return `![${block.name}](${uploadedUrl})`
                  } else {
                    console.warn('图片上传失败:', block.name)
                    return `[图片: ${block.name}（上传失败）]`
                  }
                } catch (error) {
                  console.error('上传图片失败:', error)
                  return `[图片: ${block.name}（上传失败）]`
                }
              } else if (imageMode === 'local') {
                // 保存到本地 assets 目录
                const localPath = await saveImageToLocal(url, block.name, targetFolder)
                if (localPath) {
                  return `![${block.name}](${localPath})`
                } else {
                  return `[图片: ${block.name}（保存失败）]`
                }
              } else {
                // 不处理图片，只保留名称标记
                return `[图片: ${block.name}]`
              }
            }
            
            // 其他情况（本地路径、asset:// 等），只保留图片名称标记
            return `[图片: ${block.name}]`
          } else if (block.type === 'link') {
            const url = block.url || ''
            // 只保留 HTTP/HTTPS 链接
            if (url.startsWith('http://') || url.startsWith('https://')) {
              return `[${block.title || url}](${url})`
            }
            // 其他类型链接只保留文本
            return block.title || url
          } else if (block.type === 'file') {
            // TODO: 这里可以添加附件上传到云端的逻辑
            return `[附件: ${block.name}]`
          } else if (block.type === 'list') {
            return block.items.map(item => `- ${item.text}`).join('\n')
          }
          return ''
        }))
        
        return results.join('\n')
      }
      // 如果 JSON.parse 成功但不是数组，返回原始内容
      return content
    } catch (error) {
      // JSON.parse 失败，说明是纯文本内容
      console.log('内容为纯文本格式，不需要解析')
      return content
    }
  }

  async function handleOrganize() {
    if (!primaryModel || !chats || chats.length === 0) {
      toast({
        description: t('noPrimaryModel'),
        variant: 'destructive',
      })
      return
    }

    if (!fileName.trim()) {
      toast({
        description: t('fileNameRequired'),
        variant: 'destructive',
      })
      return
    }

    // 检查是否需要上传到图床，并验证图床配置
    if (imageHandling === 'hosting') {
      const hasImages = chats.some(chat => {
        try {
          const parsed = JSON.parse(chat.content || '')
          if (Array.isArray(parsed)) {
            return parsed.some((block: ContentBlock) => 
              block.type === 'image' && (
                block.url?.startsWith('data:image/') || 
                !(block.url?.startsWith('http://') || block.url?.startsWith('https://'))
              )
            )
          }
        } catch {
          return false
        }
        return false
      })

      if (hasImages) {
        const store = await Store.load('store.json')
        const useImageRepo = await store.get<boolean>('useImageRepo')
        const mainImageHosting = await store.get<string>('mainImageHosting')
        
        if (!useImageRepo || !mainImageHosting || mainImageHosting === 'none') {
          toast({
            title: '图床未配置',
            description: '检测到聊天中包含本地图片，但图床功能未启用或未配置。请先在设置中配置图床，或选择其他图片处理方式。',
            variant: 'destructive',
            duration: 5000,
          })
          return
        }
      }
    }

    onOpenChange(false)
    
    // 构建完整的文件路径
    const sanitizedFileName = fileName.trim().replace(/[\/\\:*?"<>|]/g, '_')
    const fullFileName = sanitizedFileName.endsWith('.md') ? sanitizedFileName : `${sanitizedFileName}.md`
    const folderPath = selectedFolder === '/' ? '' : selectedFolder
    const targetFilePath = folderPath ? `${folderPath}/${fullFileName}` : fullFileName
    
    // 获取分类名称（从第一个 chat 获取）
    const categoryName = chats[0]?.category || '未分类'
    
    // 启动全局任务
    startTask({
      categoryName,
      chats: [...chats],
      targetFolder: folderPath,
      fileName: fullFileName,
    })
    
    // 开始后台整理任务
    organizeInBackground(
      [...chats],
      targetFilePath,
      sanitizedFileName,
      folderPath,
      isRemoveThinking,
      imageHandling,
      genTemplate.find(item => item.id === tab)?.content || ''
    )
  }

  // 后台整理任务（独立运行，不依赖组件状态）
  async function organizeInBackground(
    chatsToOrganize: Chat[],
    targetFilePath: string,
    sanitizedFileName: string,
    folderPath: string,
    removeThinking: boolean,
    imageMode: 'local' | 'hosting' | 'none',
    templateContent: string
  ) {
    const organizeStore = useOrganizeStore.getState()
    
    // 重置缓存，确保使用新的工作区信息
    cachedWorkspace = null
    assetsDirCreated = new Set()
    
    try {
      const workspace = await getWorkspacePath()
      const pathOptions = await getFilePathOptions(targetFilePath)
      
      // 检查文件是否已存在
      const fileExists = await exists(pathOptions.path, workspace.isCustom ? undefined : { baseDir: pathOptions.baseDir })
      if (fileExists) {
        toast({
          description: t('fileExists'),
          variant: 'destructive',
        })
        organizeStore.failTask('文件已存在')
        return
      }
      
      organizeStore.updateProgress('正在准备内容...')
      
      // 创建缓存文件路径
      const cacheFileName = `organize_cache_${Date.now()}.md`
      const appData = await appDataDir()
      const cacheDir = await join(appData, 'cache')
      const cachePath = await join(cacheDir, cacheFileName)
      
      // 确保缓存目录存在
      const cacheDirExists = await exists(cacheDir)
      if (!cacheDirExists) {
        await mkdir(cacheDir, { recursive: true })
      }
      
      // 创建空缓存文件
      await writeTextFile(cachePath, '')
      
      organizeStore.updateProgress('正在解析聊天内容...')
      
      // 解析所有聊天内容
      const allChatsContentPromises = chatsToOrganize.map(async (chat) => {
        const chatContent = await parseChatContent(chat.content || '', imageMode, folderPath)
        const chatTitle = chat.title || '无标题'
        const chatCategory = chat.category || ''
        const chatTimestamp = dayjs(chat.createdAt).format('YYYY-MM-DD HH:mm:ss')
        
        const truncatedContent = chatContent.length > 5000 
          ? chatContent.substring(0, 5000) + '\n\n[内容过长，已截断...]'
          : chatContent
        
        return `
## ${chatTitle}

**分类**: ${chatCategory}  
**时间**: ${chatTimestamp}

${truncatedContent}

---
`
      })
      
      const allChatsContentArray = await Promise.all(allChatsContentPromises)
      const allChatsContent = allChatsContentArray.join('\n\n')
      
      const MAX_CONTENT_LENGTH = 100000
      let processedContent = allChatsContent.substring(0, MAX_CONTENT_LENGTH)
      if (removeThinking) {
        processedContent = processedContent.replace(/<thinking>[\s\S]*?<\/thinking>/g, '')
      }
      
      const store = await Store.load('store.json')
      const locale = await store.get<string>('locale') || 'zh'
      
      const request_content = `
        Here are ${chatsToOrganize.length} chat messages that need to be organized into a well-structured article:
        
        ${processedContent}
        
        Format requirements:
        - Use ${locale} language for the output.
        - Use Markdown syntax.
        - Create a level 1 heading (H1) as the overall title.
        - Organize the content from multiple conversations in a logical and coherent manner.
        - Group similar topics together.
        - If there are images, preserve the image links and add brief descriptions.
        - If there are links, you can either integrate them into the text or place them as references at the end.
        - Create a coherent narrative that synthesizes all the conversations.
        
        ${templateContent}
      `
      
      organizeStore.updateProgress('AI 正在整理...')
      
      // 创建 AbortController
      const abortController = new AbortController()
      organizeStore.setAbortController(abortController)
      const signal = abortController.signal
      
      let fullContent = ''
      
      await fetchAiStream(request_content, async (content) => {
        fullContent = content
        
        let contentToWrite = content
        
        if (removeThinking) {
          let tempContent = content
          tempContent = tempContent.replace(/<thinking>[\s\S]*?<\/thinking>/g, '')
          const thinkingStartIndex = tempContent.lastIndexOf('<thinking>')
          if (thinkingStartIndex !== -1 && tempContent.indexOf('</thinking>', thinkingStartIndex) === -1) {
            contentToWrite = tempContent.substring(0, thinkingStartIndex)
          } else {
            contentToWrite = tempContent
          }
        }
        
        // 更新缓存内容到 store
        organizeStore.updateCacheContent(contentToWrite)
        
        // 同时写入缓存文件
        await writeTextFile(cachePath, contentToWrite)
      }, signal)
      
      // 最终清理
      const cleanedContent = removeThinking
        ? fullContent.replace(/<thinking>[\s\S]*?<\/thinking>/g, '').trim()
        : fullContent
      
      organizeStore.updateProgress('正在保存到目标位置...')
      
      // 写入最终缓存
      await writeTextFile(cachePath, cleanedContent)
      organizeStore.updateCacheContent(cleanedContent)
      
      // 将缓存文件内容写入目标位置
      if (workspace.isCustom) {
        await writeTextFile(pathOptions.path, cleanedContent)
      } else {
        await writeTextFile(pathOptions.path, cleanedContent, { baseDir: pathOptions.baseDir })
      }
      
      // 删除缓存文件
      try {
        await remove(cachePath)
      } catch (e) {
        console.warn('清理缓存文件失败:', e)
      }
      
      // 刷新文件树
      await loadFileTree()
      setActiveFilePath(targetFilePath)
      await setLeftSidebarTab('files')
      
      await new Promise(resolve => setTimeout(resolve, 300))
      await readArticle(targetFilePath, '', true)
      
      organizeStore.completeTask()
      
      toast({
        description: t('organizeSuccess', { title: sanitizedFileName }),
      })
      
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('Organize error:', error)
        organizeStore.failTask(error.message || '整理失败')
        toast({
          description: t('organizeError'),
          variant: 'destructive',
        })
      } else {
        organizeStore.updateProgress('已停止')
      }
    }
  }

  function handleSetting() {
    router.push('/core/setting/template')
  }

  return (
    <AlertDialog onOpenChange={onOpenChange} open={open}>
      <AlertDialogContent className="max-w-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle>{t('title')}</AlertDialogTitle> 
          <Tabs defaultValue={tab} onValueChange={value => setTab(value)}>
            <TabsList>
              {
                genTemplate.map(item => (
                  <TabsTrigger value={item.id} key={item.id}>{item.title}</TabsTrigger>
                ))
              }
            </TabsList>
          </Tabs>
        </AlertDialogHeader>
        <div className="flex flex-col gap-4">
          {/* 文件夹选择 */}
          <div className="space-y-2">
            <Label htmlFor="folder">{t('selectFolder')}</Label>
            <Select value={selectedFolder} onValueChange={setSelectedFolder}>
              <SelectTrigger id="folder">
                <SelectValue placeholder={t('selectFolderPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                {folderOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 文件名输入 */}
          <div className="space-y-2">
            <Label htmlFor="filename">{t('fileName')}</Label>
            <Input
              id="filename"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              placeholder={t('fileNamePlaceholder')}
            />
          </div>

          {/* 模板内容 */}
          <div className="space-y-1">
            <div className="flex items-center justify-between mb-2">
              <Label htmlFor="name">{tRecord('templateContent')}</Label>
              <div className="flex items-center gap-2">
                <Label>{tRecord('recordRange')}: {genTemplate.find(item => item.id === tab)?.range || '-'}</Label>
              </div>
            </div>
            <ScrollArea className="h-32 w-full p-2 rounded-md border">
              <p className="text-xs text-muted-foreground whitespace-pre-wrap">
                {genTemplate.find(item => item.id === tab)?.content}
              </p>
            </ScrollArea>
          </div>

          {/* 选项复选框 */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Checkbox id="remove-thinking" checked={isRemoveThinking} onCheckedChange={(checked) => setIsRemoveThinking(checked === true)} />
              <Label htmlFor="remove-thinking" className="cursor-pointer">{tRecord('filterThinkingContent')}</Label>
            </div>
            
            {/* 图片处理方式 */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">图片处理方式</Label>
              <RadioGroup value={imageHandling} onValueChange={(value: 'local' | 'hosting' | 'none') => setImageHandling(value)} className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="local" id="img-local" />
                  <Label htmlFor="img-local" className="cursor-pointer text-sm font-normal">保存到本地 assets 目录</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="hosting" id="img-hosting" />
                  <Label htmlFor="img-hosting" className="cursor-pointer text-sm font-normal">上传到图床</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="none" id="img-none" />
                  <Label htmlFor="img-none" className="cursor-pointer text-sm font-normal">仅保留文字（移除图片）</Label>
                </div>
              </RadioGroup>
            </div>
          </div>
        </div>
        <AlertDialogFooter>
          <Button variant={"ghost"} disabled={!!currentTask} onClick={handleSetting}>{tRecord('manageTemplate')}</Button>
          <Button variant={"outline"} onClick={() => onOpenChange(false)}>{tRecord('cancel')}</Button>
          <Button onClick={handleOrganize} disabled={chats.length === 0 || !!currentTask}>{tRecord('startOrganize')}</Button>
        </AlertDialogFooter>
      </AlertDialogContent> 
    </AlertDialog>
  )
}
