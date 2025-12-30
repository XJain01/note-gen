const fs = require('fs');

// 修复 article.ts
let articleContent = fs.readFileSync('src/stores/article.ts', 'utf8');
articleContent = articleContent.replace(/const store = await Store\.load\('store\.json'\)/g, "const store = await safeLoadStore('store.json'); if (!store) return");
fs.writeFileSync('src/stores/article.ts', articleContent, 'utf8');

// 修复 setting.ts  
let settingContent = fs.readFileSync('src/stores/setting.ts', 'utf8');
settingContent = settingContent.replace(/const store = await Store\.load\('store\.json'\)/g, "const store = await safeLoadStore('store.json'); if (!store) return");
fs.writeFileSync('src/stores/setting.ts', settingContent, 'utf8');

console.log('Files fixed successfully');
