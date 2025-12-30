$content = Get-Content "src\stores\article.ts" -Raw
$content = $content -replace "const store = await Store\.load\('store\.json'\)", "const store = await safeLoadStore('store.json'); if (!store) return"
Set-Content "src\stores\article.ts" -Value $content -NoNewline
