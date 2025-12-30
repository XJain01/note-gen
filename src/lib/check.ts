import { isTauriEnvironment } from "@/lib/tauri-utils";

// 异步检查是否为移动设备的函数
export function isMobileDevice() {
  // 如果不在 Tauri 环境中，返回 false
  if (!isTauriEnvironment()) {
    return false
  }

  try {
    // 使用同步 require 避免异步问题
    // 在 Tauri 环境中，Node.js API 可用
    const os = (globalThis as any).__TAURI__?.os
    if (os && os.platform) {
      const platformName = os.platform()
      return platformName === 'android' || platformName === 'ios'
    }
    return false
  } catch (error) {
    console.error('Error detecting platform:', error);
    return false;
  }
}
