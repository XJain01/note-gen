"use client"
import { useTranslations } from 'next-intl'
import { Clipboard, ClipboardX } from 'lucide-react'
import { TooltipButton } from '@/components/tooltip-button'
import { useState, useEffect } from 'react'
import { safeGetFromStore, safeSetToStore } from '@/lib/tauri-utils'

export function ClipboardMonitor() {
  const t = useTranslations('record.chat.input.clipboardMonitor')
  const [isEnabled, setIsEnabled] = useState(true)
  
  // Sync with store.json on mount
  useEffect(() => {
    const syncWithStore = async () => {
      const storedValue = await safeGetFromStore<boolean>('clipboardMonitor', true)
      if (storedValue !== isEnabled) {
        setIsEnabled(storedValue)
      }
    }
    
    syncWithStore()
  }, [])
  

  const toggleClipboardMonitor = async () => {
    const newState = !isEnabled
    setIsEnabled(newState)
    await safeSetToStore('clipboardMonitor', newState)
  }

  return (
    <div>
      <TooltipButton
        variant={"ghost"}
        size="icon"
        icon={isEnabled ? <Clipboard className="size-4" /> : <ClipboardX className="size-4" />}
        tooltipText={isEnabled ? t('enable') : t('disable')}
        side="bottom"
        onClick={toggleClipboardMonitor}
      />
    </div>
  )
}
