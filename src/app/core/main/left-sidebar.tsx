'use client'

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Files, Highlighter, Search } from "lucide-react"
import { FileSidebar } from "../article/file"
import { NoteSidebar } from "../record/mark"
import { FileActions } from "../article/file/file-actions"
import { MarkActions } from "../record/mark/mark-actions"
import { useTranslations } from "next-intl"
import { useSidebarStore } from "@/stores/sidebar"
import { Button } from "@/components/ui/button"
import { SearchDialog } from "@/components/search-dialog"

export function LeftSidebar() {
  const { leftSidebarTab, setLeftSidebarTab } = useSidebarStore()
  const t = useTranslations()
  const [searchOpen, setSearchOpen] = useState(false)

  const handleTabChange = (value: string) => {
    if (value === 'files' || value === 'notes') {
      setLeftSidebarTab(value)
    }
  }

  return (
    <div className="w-full h-full flex flex-col">
      <Tabs value={leftSidebarTab} onValueChange={handleTabChange} className="w-full h-full flex flex-col">
        <div className="w-full h-12 border-b flex items-center justify-between px-2">
          <TabsList>
            <TabsTrigger value="files" className="gap-2">
              <Files className="h-4 w-4" />
              <span>{t('navigation.files')}</span>
            </TabsTrigger>
            <TabsTrigger value="notes" className="gap-2">
              <Highlighter className="h-4 w-4" />
              <span>{t('navigation.record')}</span>
            </TabsTrigger>
          </TabsList>
          <div className="flex items-center gap-1">
            {leftSidebarTab === "files" && <FileActions />}
            {leftSidebarTab === "notes" && <MarkActions />}
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-9 w-9 relative"
              onClick={() => setSearchOpen(true)}
            >
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <TabsContent value="files" className="flex-1 m-0 overflow-hidden">
          <FileSidebar />
        </TabsContent>
        <TabsContent value="notes" className="flex-1 m-0 overflow-hidden">
          <NoteSidebar />
        </TabsContent>
      </Tabs>
      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </div>
  )
}
