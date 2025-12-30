
import Database from '@tauri-apps/plugin-sql';
import { isTauriEnvironment } from '@/lib/tauri-utils';

// 数据库实例缓存
let dbInstance: Database | null = null;
// Promise缓存，防止重复加载
let dbPromise: Promise<Database> | null = null;

// 获取数据库实例
export async function getDb(): Promise<Database> {
  // 如果不在 Tauri 环境中，抛出错误
  if (!isTauriEnvironment()) {
    throw new Error('Database is only available in Tauri environment');
  }
  
  // 如果已经有实例，直接返回
  if (dbInstance) {
    return dbInstance;
  }
  
  // 如果正在加载中，返回现有Promise
  if (dbPromise) {
    return dbPromise;
  }
  
  // 开始加载数据库
  dbPromise = Database.load('sqlite:note.db').then(db => {
    dbInstance = db;
    return db;
  });
  
  return dbPromise;
}

// 初始化所有数据库
export async function initAllDatabases() {
  // 如果不在 Tauri 环境中，跳过初始化
  if (!isTauriEnvironment()) {
    console.warn('Skipping database initialization: not in Tauri environment');
    return;
  }
  
  // 确保数据库已加载
  await getDb();
  
  // 引入各数据库初始化函数
  const { initChatsDb } = await import('./chats');
  const { initMarksDb } = await import('./marks');
  const { initNotesDb } = await import('./notes');
  const { initTagsDb } = await import('./tags');
  const { initVectorDb } = await import('./vector');
  
  // 执行初始化
  await initChatsDb();
  await initMarksDb();
  await initNotesDb();
  await initTagsDb();
  await initVectorDb();
}
