/**
 * Tauri 环境工具函数
 * 提供 Tauri 环境检查和安全调用包装
 */

import { Store } from '@tauri-apps/plugin-store'

/**
 * 检查是否在 Tauri 环境中运行
 */
export function isTauriEnvironment(): boolean {
  return typeof window !== 'undefined' && '__TAURI__' in window
}

/**
 * 安全地加载 Tauri Store
 * 如果不在 Tauri 环境中，返回 null
 */
export async function safeLoadStore(filename: string = 'store.json'): Promise<Store | null> {
  if (!isTauriEnvironment()) {
    // 只在开发环境显示警告，避免生产环境控制台污染
    if (process.env.NODE_ENV === 'development') {
      console.debug('Not in Tauri environment, Store.load() skipped')
    }
    return null
  }

  try {
    return await Store.load(filename)
  } catch (error) {
    console.error('Failed to load store:', error)
    return null
  }
}

/**
 * 安全地从 Store 获取值
 * 如果不在 Tauri 环境中或获取失败，返回默认值
 */
export async function safeGetFromStore<T>(
  key: string,
  defaultValue: T,
  filename: string = 'store.json'
): Promise<T> {
  const store = await safeLoadStore(filename)
  if (!store) {
    return defaultValue
  }

  try {
    const value = await store.get<T>(key)
    return value !== null && value !== undefined ? value : defaultValue
  } catch (error) {
    console.error(`Failed to get value for key "${key}":`, error)
    return defaultValue
  }
}

/**
 * 安全地向 Store 设置值
 * 如果不在 Tauri 环境中，操作会被跳过
 */
export async function safeSetToStore<T>(
  key: string,
  value: T,
  filename: string = 'store.json'
): Promise<boolean> {
  const store = await safeLoadStore(filename)
  if (!store) {
    return false
  }

  try {
    await store.set(key, value)
    await store.save()
    return true
  } catch (error) {
    console.error(`Failed to set value for key "${key}":`, error)
    return false
  }
}

/**
 * 包装 Tauri invoke 调用
 * 如果不在 Tauri 环境中，返回默认值或抛出错误
 */
export async function safeInvoke<T>(
  command: string,
  args?: Record<string, unknown>,
  defaultValue?: T
): Promise<T> {
  if (!isTauriEnvironment()) {
    if (defaultValue !== undefined) {
      if (process.env.NODE_ENV === 'development') {
        console.debug(`Not in Tauri environment, returning default value for command: ${command}`)
      }
      return defaultValue
    }
    throw new Error(`Cannot invoke Tauri command "${command}" outside Tauri environment`)
  }

  try {
    const { invoke } = await import('@tauri-apps/api/core')
    return await invoke<T>(command, args)
  } catch (error) {
    console.error(`Failed to invoke command "${command}":`, error)
    if (defaultValue !== undefined) {
      return defaultValue
    }
    throw error
  }
}
