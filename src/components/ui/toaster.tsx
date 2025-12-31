"use client"

import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        // 确保 title 和 description 可以被 React 安全渲染
        const safeTitle = (() => {
          if (typeof title === 'string') return title;
          if (title && typeof title === 'object' && 'message' in title) {
            return String((title as any).message || '错误');
          }
          return title;
        })();

        const safeDescription = (() => {
          if (typeof description === 'string') return description;
          if (description && typeof description === 'object' && 'message' in description) {
            return String((description as any).message || '发生了一个错误');
          }
          return description;
        })();

        return (
          <Toast key={id} {...props}>
            <div className="grid gap-1">
              {safeTitle && <ToastTitle>{safeTitle}</ToastTitle>}
              {safeDescription && (
                <ToastDescription>{safeDescription}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
