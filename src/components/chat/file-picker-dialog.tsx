'use client'

import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { FileText, Search } from 'lucide-react'
import { readDir, BaseDirectory } from '@tauri-apps/plugin-fs'
import { isTauriEnvironment } from '@/lib/tauri-utils'

interface NoteFile {
  id: number
  name: string
  path: string
}

interface FilePickerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onFileSelect: (file: NoteFile) => void
}

export function FilePickerDialog({ open, onOpenChange, onFileSelect }: FilePickerDialogProps) {
  const [files, setFiles] = React.useState<NoteFile[]>([])
  const [filteredFiles, setFilteredFiles] = React.useState<NoteFile[]>([])
  const [searchQuery, setSearchQuery] = React.useState('')

  // 加载笔记文件列表
  React.useEffect(() => {
    if (open && isTauriEnvironment()) {
      loadNoteFiles()
    }
  }, [open])

  // 过滤文件
  React.useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredFiles(files)
    } else {
      const query = searchQuery.toLowerCase()
      setFilteredFiles(
        files.filter(file => 
          file.name.toLowerCase().includes(query) ||
          file.path.toLowerCase().includes(query)
        )
      )
    }
  }, [searchQuery, files])

  const loadNoteFiles = async () => {
    try {
      const mdFiles: NoteFile[] = []
      let id = 1
      
      // 递归读取子目录
      const processEntries = async (dirPath: string = 'article') => {
        try {
          const entries = await readDir(dirPath, { baseDir: BaseDirectory.AppData })
          
          for (const entry of entries) {
            const fullPath = dirPath === 'article' ? entry.name : `${dirPath.replace('article/', '')}/${entry.name}`
            
            if (entry.isFile && entry.name.endsWith('.md')) {
              mdFiles.push({
                id: id++,
                name: entry.name.replace('.md', ''),
                path: fullPath
              })
            } else if (entry.isDirectory) {
              await processEntries(`${dirPath}/${entry.name}`)
            }
          }
        } catch (err) {
          // 忽略无法访问的目录
          console.log('Cannot read directory:', dirPath, err)
        }
      }
      
      await processEntries()
      setFiles(mdFiles)
      setFilteredFiles(mdFiles)
    } catch (error) {
      console.error('Failed to load note files:', error)
    }
  }

  const handleFileClick = (file: NoteFile) => {
    onFileSelect(file)
    onOpenChange(false)
    setSearchQuery('')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[600px]">
        <DialogHeader>
          <DialogTitle>选择笔记文件</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* 搜索框 */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="搜索笔记..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* 文件列表 */}
          <ScrollArea className="h-[400px] rounded-md border">
            <div className="p-2 space-y-1">
              {filteredFiles.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <FileText className="w-12 h-12 mb-2" />
                  <p className="text-sm">
                    {searchQuery ? '未找到匹配的笔记' : '暂无笔记文件'}
                  </p>
                </div>
              ) : (
                filteredFiles.map((file) => (
                  <button
                    key={file.id}
                    onClick={() => handleFileClick(file)}
                    className="w-full flex items-center gap-3 px-3 py-2 hover:bg-accent rounded-lg transition-colors text-left"
                  >
                    <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {file.name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {file.path}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  )
}
