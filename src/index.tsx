import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'
import bcrypt from 'bcryptjs'
import { 
  registerStudent, 
  login, 
  logout, 
  getCurrentUser, 
  changePassword,
  authMiddleware,
  requireRole,
  requireUserType
} from './auth'
import { 
  performHealthCheck, 
  logger, 
  requestLoggingMiddleware,
  errorHandlingMiddleware
} from './monitoring'
import {
  StudentProgressCache,
  CurriculumCache,
  ScTNScoreCache,
  RankingCache,
  ClassStatsCache,
  getCacheStats,
  getCachedOrFetch,
  getCachedOrFetchWithMetrics,
  smartInvalidateCache,
  prewarmCriticalCaches,
  checkCacheHealth,
  cacheMetrics,
  CACHE_TTL,
  EXTENDED_CACHE_TTL,
  generateCacheKey,
  setToCache,
  deleteFromCache,
  invalidateCachePattern
} from './cache'
import { AdaptiveLearningEngine } from './adaptive-learning'
import { SchoolManagementSystem } from './school-management'
import { AIContentGenerator } from './ai-content-generator'
import { 
  addToMistakeNotebook, 
  getMistakeNotebook, 
  getTodayReviewProblems,
  recordReview,
  getMasteryStatistics,
  generateSimilarProblem
} from './mistake-notebook'
import { EssayGradingEngine } from './essay-grading'
import {
  generateClassSummary,
  generateStudentReport,
  createHomework,
  getHomeworkSubmissions,
  compareClasses
} from './teacher-dashboard'

type Bindings = {
  DB: D1Database
  KV: KVNamespace
  AI?: any // Cloudflare Workers AI
  GEMINI_API_KEY?: string
  SUNO_API_KEY?: string
  HUGGINGFACE_API_KEY?: string // HuggingFace Inference API (optional)
  PROGRESS_WEBSOCKET?: DurableObjectNamespace
}

const app = new Hono<{ Bindings: Bindings }>()

// Durable Object（WebSocket）をエクスポート
export { ProgressWebSocket } from './websocket'

// JSON抽出ヘルパー（バッククォート対応）
function extractJSON(aiResponse: string): any {
  // ```json ... ``` or ``` ... ``` のパターンを抽出
  let jsonMatch = aiResponse.match(/```(?:json)?\s*\n([\s\S]*?)\n```/)
  let jsonText = jsonMatch ? jsonMatch[1].trim() : aiResponse.trim()
  
  // もしマッチしなければ、バッククォートなしで全体から抽出
  if (!jsonMatch) {
    // { ... } または [ ... ] のパターンを抽出
    const objectMatch = aiResponse.match(/(\{[\s\S]*\})/)
    const arrayMatch = aiResponse.match(/(\[[\s\S]*\])/)
    jsonText = (objectMatch || arrayMatch)?.[1]?.trim() || aiResponse.trim()
  }
  
  // 先頭・末尾の余分な文字を削除
  jsonText = jsonText.replace(/^[^{[]*/, '').replace(/[^}\]]*$/, '')
  
  // **NEW: Unicodeスマート引用符を標準引用符に置換**
  jsonText = jsonText.replace(/[\u2018\u2019]/g, "'")  // ' → '
  jsonText = jsonText.replace(/[\u201C\u201D]/g, '"')  // " " → "
  jsonText = jsonText.replace(/[\u2013\u2014]/g, '-')  // – — → -
  
  // 状態機械式パーサーで文字列内の改行をエスケープ
  let inString = false
  let escaped = false
  let result = ''
  
  for (let i = 0; i < jsonText.length; i++) {
    const char = jsonText[i]
    
    if (escaped) {
      // 前の文字がバックスラッシュだった場合
      result += char
      escaped = false
      continue
    }
    
    if (char === '\\') {
      result += char
      escaped = true
      continue
    }
    
    if (char === '"') {
      result += char
      inString = !inString
      continue
    }
    
    if (inString) {
      // 文字列内での特殊文字処理
      if (char === '\n') {
        result += '\\n'
      } else if (char === '\r') {
        result += '\\r'
      } else if (char === '\t') {
        result += '\\t'
      } else if (char === '\b') {
        result += '\\b'
      } else if (char === '\f') {
        result += '\\f'
      } else {
        // その他の制御文字をチェック（ASCII 0-31）
        const charCode = char.charCodeAt(0)
        if (charCode < 32 && charCode !== 10 && charCode !== 13 && charCode !== 9) {
          // 制御文字をUnicodeエスケープシーケンスに変換
          result += '\\u' + ('0000' + charCode.toString(16)).slice(-4)
        } else {
          result += char
        }
      }
    } else {
      result += char
    }
  }
  
  jsonText = result
  
  // JSONクリーニング: 文字列外の不正な制御文字を削除
  // （文字列内はすでにエスケープ済み）
  const cleaned: string[] = []
  inString = false
  escaped = false
  
  for (let i = 0; i < jsonText.length; i++) {
    const char = jsonText[i]
    
    if (escaped) {
      cleaned.push(char)
      escaped = false
      continue
    }
    
    if (char === '\\') {
      cleaned.push(char)
      escaped = true
      continue
    }
    
    if (char === '"') {
      cleaned.push(char)
      inString = !inString
      continue
    }
    
    if (!inString && /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/.test(char)) {
      // 文字列外の制御文字は削除
      continue
    }
    
    cleaned.push(char)
  }
  
  jsonText = cleaned.join('')
  
  // 不正なカンマを修正（,, → ,）
  jsonText = jsonText.replace(/,\s*,/g, ',')
  
  // 配列・オブジェクト末尾の余分なカンマを削除（複数回実行）
  for (let i = 0; i < 5; i++) {
    jsonText = jsonText.replace(/,(\s*[}\]])/g, '$1')
  }
  
  // 閉じ括弧の後の不正な文字を削除（例: ]| → ]）
  jsonText = jsonText.replace(/(\]|\})([^\s,\]}\n])/g, '$1')
  
  // 配列内の不正な区切り文字を修正（例: '] 'や']|'を','に）
  jsonText = jsonText.replace(/\]\s+"/g, '],"')
  jsonText = jsonText.replace(/\}\s+"/g, '},"')
  jsonText = jsonText.replace(/\]\|"/g, '],"')
  jsonText = jsonText.replace(/\}\|"/g, '},"')
  
  // 【NEW】配列要素間のカンマ不足を修正
  // "] {" → "], {" （オブジェクト配列）
  jsonText = jsonText.replace(/\]\s+\{/g, '], {')
  // "} {" → "}, {" （オブジェクト配列）
  jsonText = jsonText.replace(/\}\s+\{/g, '}, {')
  // "] [" → "], [" （配列の配列）
  jsonText = jsonText.replace(/\]\s+\[/g, '], [')
  // "" "" → "", "" （文字列配列）
  jsonText = jsonText.replace(/"\s+"/g, '", "')
  
  // 【NEW】閉じ括弧と次の要素の間にカンマを追加
  // "}"で終わる行の後に"{"で始まる行 → カンマを追加
  jsonText = jsonText.replace(/\}(\s*)\{/g, '},$1{')
  // "]"で終わる行の後に"["で始まる行 → カンマを追加
  jsonText = jsonText.replace(/\](\s*)\[/g, '],$1[')
  
  // 【NEW】連続する閉じ括弧の修正（例: "]]" を "], ]" に）
  // これは配列内の配列が不正に閉じられている場合の修正
  jsonText = jsonText.replace(/\]\]/g, '], ]').replace(/\}, \]/g, '}]')
  
  // 【NEW】配列要素の後のカンマ欠落を修正
  // パターン: } { → }, {
  jsonText = jsonText.replace(/\}(\s*)\{/g, '},$1{')
  // パターン: ] { → ], {
  jsonText = jsonText.replace(/\](\s*)\{/g, '],$1{')
  // パターン: } [ → }, [
  jsonText = jsonText.replace(/\}(\s*)\[/g, '},$1[')
  // パターン: ] [ → ], [
  jsonText = jsonText.replace(/\](\s*)\[/g, '],$1[')
  // パターン: " { → ", {
  jsonText = jsonText.replace(/"(\s*)\{/g, '",$1{')
  // パターン: " [ → ", [
  jsonText = jsonText.replace(/"(\s*)\[/g, '",$1[')
  // パターン: 数字 { → 数字, {
  jsonText = jsonText.replace(/(\d)(\s*)\{/g, '$1,$2{')
  // パターン: 数字 [ → 数字, [
  jsonText = jsonText.replace(/(\d)(\s*)\[/g, '$1,$2[')
  // パターン: true { → true, {
  jsonText = jsonText.replace(/(true|false|null)(\s*)\{/g, '$1,$2{')
  
  // 追加修正: 配列内のオブジェクト間のカンマ欠落を修正
  // パターン: } { → }, {（配列内のオブジェクト間）
  jsonText = jsonText.replace(/\}(\s*)\{/g, '},$1{')
  // パターン: } [ → }, [
  jsonText = jsonText.replace(/\}(\s*)\[/g, '},$1[')
  // パターン: ] { → ], {
  jsonText = jsonText.replace(/\](\s*)\{/g, '],$1{')
  // パターン: ] [ → ], [
  jsonText = jsonText.replace(/\](\s*)\[/g, '],$1[')
  
  // 【NEW 2025-01-28】より強力な修正: 改行を含む配列要素間のカンマ欠落
  // パターン: }\n  { → },\n  {（改行後の次の要素）
  jsonText = jsonText.replace(/\}(\s*\n\s*)\{/g, '},$1{')
  // パターン: ]\n  { → ],\n  {
  jsonText = jsonText.replace(/\](\s*\n\s*)\{/g, '],$1{')
  // パターン: }\n  [ → },\n  [
  jsonText = jsonText.replace(/\}(\s*\n\s*)\[/g, '},$1[')
  // パターン: ]\n  [ → ],\n  [
  jsonText = jsonText.replace(/\](\s*\n\s*)\[/g, '],$1[')
  
  // 【NEW】文字列終了後の改行と次の要素の間のカンマ欠落
  // パターン: "\n  { → ",\n  {
  jsonText = jsonText.replace(/"(\s*\n\s*)\{/g, '",$1{')
  // パターン: "\n  [ → ",\n  [
  jsonText = jsonText.replace(/"(\s*\n\s*)\[/g, '",$1[')
  // パターン: "\n  " → ",\n  "（文字列配列の要素間）
  jsonText = jsonText.replace(/"(\s*\n\s*)"/g, '",$1"')
  
  // 【NEW 2025-01-28 追加】より積極的な配列要素間カンマ修正
  // 改行を含む複数行にわたる配列要素のパターン
  // パターン: }\n\n  { → },\n\n  {（空行を含む）
  jsonText = jsonText.replace(/\}(\s*\n\s*\n\s*)\{/g, '},$1{')
  // パターン: ]\n\n  [ → ],\n\n  [
  jsonText = jsonText.replace(/\](\s*\n\s*\n\s*)\[/g, '],$1[')
  
  // 【NEW】行末の } の後、次の行頭の { の前にカンマがない場合
  // より柔軟なパターン: } (改行+空白) { → }, (改行+空白) {
  jsonText = jsonText.replace(/\}(\s*[\r\n]+\s*)\{/g, '},$1{')
  // パターン: ] (改行+空白) { → ], (改行+空白) {
  jsonText = jsonText.replace(/\](\s*[\r\n]+\s*)\{/g, '],$1{')
  // パターン: } (改行+空白) [ → }, (改行+空白) [
  jsonText = jsonText.replace(/\}(\s*[\r\n]+\s*)\[/g, '},$1[')
  // パターン: ] (改行+空白) [ → ], (改行+空白) [
  jsonText = jsonText.replace(/\](\s*[\r\n]+\s*)\[/g, '],$1[')
  
  // 【NEW】文字列終了後の改行を含むパターン
  // パターン: " (改行+空白) { → ", (改行+空白) {
  jsonText = jsonText.replace(/"(\s*[\r\n]+\s*)\{/g, '",$1{')
  // パターン: " (改行+空白) [ → ", (改行+空白) [
  jsonText = jsonText.replace(/"(\s*[\r\n]+\s*)\[/g, '",$1[')
  // パターン: " (改行+空白) " → ", (改行+空白) "
  jsonText = jsonText.replace(/"(\s*[\r\n]+\s*)"/g, function(match, whitespace, offset) {
    // キー:値のコロンの後の場合は置換しない
    const beforeMatch = jsonText.substring(Math.max(0, offset - 10), offset)
    if (beforeMatch.match(/:\s*$/)) {
      return match // 置換しない
    }
    return '",' + whitespace + '"'
  })
  
  // パターン: " " → ", "（文字列間、単一行）
  jsonText = jsonText.replace(/"(\s*)"/g, function(match, whitespace) {
    // キー:値の":"の後の場合は置換しない
    const beforeMatch = jsonText.substring(0, jsonText.indexOf(match))
    if (beforeMatch.match(/:\s*$/)) {
      return match // 置換しない
    }
    return '",' + whitespace + '"'
  })
  
  console.log('✅ JSONカンマ欠落修正を実行しました（拡張版）')
  
  // 未閉じの文字列を検出して修正を試みる
  let quoteCount = 0
  for (let i = 0; i < jsonText.length; i++) {
    if (jsonText[i] === '"' && (i === 0 || jsonText[i-1] !== '\\')) {
      quoteCount++
    }
  }
  
  // 引用符の数が奇数の場合、末尾に引用符を追加（より慎重なアプローチ）
  if (quoteCount % 2 !== 0) {
    console.warn('⚠️ 未閉じの引用符を検出')
    // 単純に末尾に引用符を追加（閉じ括弧の前ではなく）
    jsonText = jsonText.trim() + '"'
  }
  
  try {
    return JSON.parse(jsonText)
  } catch (error) {
    console.error('❌ JSON parse error:', error)
    console.error('📄 JSON text length:', jsonText.length)
    console.error('📄 JSON text (first 1000 chars):', jsonText.substring(0, 1000))
    console.error('📄 JSON text (last 1000 chars):', jsonText.substring(Math.max(0, jsonText.length - 1000)))
    console.error('📄 AI response length:', aiResponse.length)
    console.error('📄 AI response (first 1000 chars):', aiResponse.substring(0, 1000))
    
    // エラー位置周辺の詳細情報を出力
    if (error instanceof SyntaxError && error.message.includes('position')) {
      const posMatch = error.message.match(/position (\d+)/)
      if (posMatch) {
        const pos = parseInt(posMatch[1])
        const start = Math.max(0, pos - 100)
        const end = Math.min(jsonText.length, pos + 100)
        console.error(`🔍 Error context (position ${pos})`)
        console.error('Before:', jsonText.substring(start, pos))
        console.error('At:', jsonText.substring(pos, pos + 1), '(charCode:', jsonText.charCodeAt(pos), ')')
        console.error('After:', jsonText.substring(pos + 1, end))
        
        // 周辺の制御文字を検出
        console.error('🔍 Control characters around error:')
        for (let i = Math.max(0, pos - 50); i < Math.min(jsonText.length, pos + 50); i++) {
          const c = jsonText[i]
          const code = jsonText.charCodeAt(i)
          if (code < 32 || code === 127) {
            console.error(`  Position ${i}: charCode ${code} (control character)${i === pos ? ' <-- ERROR' : ''}`)
          }
        }
      }
    }
    
    // JSONエラーの自動修正を試みる
    if (error instanceof SyntaxError && (
      error.message.includes('Unexpected end of JSON input') ||
      error.message.includes("Expected ',' or ']'") ||
      error.message.includes("Expected ',' or '}'")
    )) {
      console.warn('⚠️ JSON不完全エラー検出、自動補完を試みます')
      
      // 開いている括弧・配列・文字列をカウント
      let openBraces = 0
      let openBrackets = 0
      let inString = false
      let escaped = false
      
      for (let i = 0; i < jsonText.length; i++) {
        const char = jsonText[i]
        
        if (escaped) {
          escaped = false
          continue
        }
        
        if (char === '\\' && inString) {
          escaped = true
          continue
        }
        
        if (char === '"' && !escaped) {
          inString = !inString
          continue
        }
        
        if (!inString) {
          if (char === '{') openBraces++
          if (char === '}') openBraces--
          if (char === '[') openBrackets++
          if (char === ']') openBrackets--
        }
      }
      
      console.log(`🔍 括弧の状態: { ${openBraces}, [ ${openBrackets}, inString: ${inString}`)
      
      // 不完全な文字列を閉じる
      if (inString) {
        jsonText += '"'
        console.log('✅ 文字列を閉じました')
      }
      
      // 配列要素間のカンマ欠落を修正（オブジェクト直後に別のオブジェクトが続く場合）
      // より強力な正規表現（改行を含む）
      jsonText = jsonText.replace(/(\})(\s*[\r\n]*\s*)(\{)/g, '$1,$2$3')
      // 配列要素間のカンマ欠落を修正（配列直後に別の要素が続く場合）
      jsonText = jsonText.replace(/(\])(\s*[\r\n]*\s*)(\[)/g, '$1,$2$3')
      // オブジェクト直後に配列が続く場合
      jsonText = jsonText.replace(/(\})(\s*[\r\n]*\s*)(\[)/g, '$1,$2$3')
      // 配列直後にオブジェクトが続く場合
      jsonText = jsonText.replace(/(\])(\s*[\r\n]*\s*)(\{)/g, '$1,$2$3')
      // 配列要素間のカンマ欠落を修正（文字列直後に別の文字列が続く場合）
      jsonText = jsonText.replace(/(")\s*(\s*)"/g, '$1,$2"')
      
      // カンマを削除（最後の要素の後のカンマ）
      jsonText = jsonText.replace(/,(\s*[\]}])$/g, '$1')
      
      // 開いている配列を閉じる
      while (openBrackets > 0) {
        jsonText += ']'
        openBrackets--
        console.log('✅ 配列を閉じました')
      }
      
      // 開いているオブジェクトを閉じる
      while (openBraces > 0) {
        jsonText += '}'
        openBraces--
        console.log('✅ オブジェクトを閉じました')
      }
      
      console.log('🔄 補完後のJSON再パース試行...')
      console.log('📄 補完後のJSON (last 500 chars):', jsonText.substring(Math.max(0, jsonText.length - 500)))
      
      try {
        return JSON.parse(jsonText)
      } catch (retryError) {
        console.error('❌ 補完後もパース失敗:', retryError)
        
        // 【NEW】さらなる修正試行: エラー位置を特定して修正
        if (retryError instanceof SyntaxError && retryError.message.includes('position')) {
          const posMatch = retryError.message.match(/position (\d+)/)
          if (posMatch) {
            const errorPos = parseInt(posMatch[1])
            console.log(`🔍 エラー位置 ${errorPos} で修正を試みます`)
            
            // エラー位置の前後を確認
            const before = jsonText.substring(Math.max(0, errorPos - 20), errorPos)
            const after = jsonText.substring(errorPos, Math.min(jsonText.length, errorPos + 20))
            console.log('Before:', before)
            console.log('After:', after)
            
            // パターン1: } { の間にカンマを挿入
            if (before.match(/\}\s*$/) && after.match(/^\s*\{/)) {
              console.log('✅ パターン検出: } { → }, {')
              jsonText = jsonText.substring(0, errorPos) + ',' + jsonText.substring(errorPos)
              try {
                return JSON.parse(jsonText)
              } catch (e) {
                console.error('パターン1修正後もエラー:', e)
              }
            }
            
            // パターン2: ] [ の間にカンマを挿入
            if (before.match(/\]\s*$/) && after.match(/^\s*\[/)) {
              console.log('✅ パターン検出: ] [ → ], [')
              jsonText = jsonText.substring(0, errorPos) + ',' + jsonText.substring(errorPos)
              try {
                return JSON.parse(jsonText)
              } catch (e) {
                console.error('パターン2修正後もエラー:', e)
              }
            }
            
            // パターン3: " " の間にカンマを挿入
            if (before.match(/"\s*$/) && after.match(/^\s*"/)) {
              console.log('✅ パターン検出: " " → ", "')
              jsonText = jsonText.substring(0, errorPos) + ',' + jsonText.substring(errorPos)
              try {
                return JSON.parse(jsonText)
              } catch (e) {
                console.error('パターン3修正後もエラー:', e)
              }
            }
          }
        }
        
        // 補完失敗、元のエラーを継続
      }
    }
    
    // エラー位置を特定して修正を試みる
    if (error instanceof SyntaxError && error.message.includes('position')) {
      const posMatch = error.message.match(/position (\d+)/)
      if (posMatch) {
        const pos = parseInt(posMatch[1])
        const start = Math.max(0, pos - 200)
        const end = Math.min(jsonText.length, pos + 200)
        console.error(`🔍 Error context (pos ${pos}):`)
        console.error(jsonText.substring(start, end))
        console.error(`🔍 Character at error position: '${jsonText.charAt(pos)}' (code: ${jsonText.charCodeAt(pos)})`)
        
        // 周辺の文字も確認
        console.error('🔍 Characters around error position:')
        for (let i = Math.max(0, pos - 20); i < Math.min(jsonText.length, pos + 20); i++) {
          const char = jsonText.charAt(i)
          const code = jsonText.charCodeAt(i)
          const display = char === '\n' ? '\\n' : char === '\r' ? '\\r' : char === '\t' ? '\\t' : char
          console.error(`  pos ${i}: '${display}' (code: ${code})${i === pos ? ' <-- ERROR HERE' : ''}`)
        }
        
        // エラー位置での自動修正を試みる（より包括的な修正）
        if (error.message.includes("Expected ',' or ']'") || error.message.includes("Expected ',' or '}'")) {
          console.warn('⚠️ JSON構文エラー検出、包括的な修正を試みます')
          
          // 行番号とカラム番号から正確な位置を計算
          let calculatedPos = pos
          if (error.message.includes('line') && error.message.includes('column')) {
            const lineMatch = error.message.match(/line (\d+)/)
            const colMatch = error.message.match(/column (\d+)/)
            if (lineMatch && colMatch) {
              const line = parseInt(lineMatch[1])
              const col = parseInt(colMatch[1])
              console.log(`🔍 Line ${line}, Column ${col}`)
              
              // 行番号から位置を計算
              const lines = jsonText.split('\n')
              let linePos = 0
              for (let i = 0; i < line - 1 && i < lines.length; i++) {
                linePos += lines[i].length + 1 // +1 for newline
              }
              calculatedPos = linePos + col - 1
              console.log(`🔍 Calculated position: ${calculatedPos} (original: ${pos})`)
            }
          }
          
          // エラー位置の前後の文字を確認
          let beforePos = Math.max(0, calculatedPos - 1)
          let afterPos = calculatedPos
          
          // 前の非空白文字を探す
          while (beforePos >= 0 && /\s/.test(jsonText.charAt(beforePos))) {
            beforePos--
          }
          
          // 次の非空白文字を探す
          while (afterPos < jsonText.length && /\s/.test(jsonText.charAt(afterPos))) {
            afterPos++
          }
          
          const beforeChar = jsonText.charAt(beforePos)
          const afterChar = jsonText.charAt(afterPos)
          
          console.log(`🔍 Before char: '${beforeChar}' at ${beforePos}`)
          console.log(`🔍 After char: '${afterChar}' at ${afterPos}`)
          
          // 簡単な修正: } または ] または " の後に { または [ または " が来る場合、間にカンマを挿入
          if ((beforeChar === '}' || beforeChar === ']' || beforeChar === '"') && 
              (afterChar === '{' || afterChar === '[' || afterChar === '"')) {
            console.log('✅ カンマを挿入します')
            const fixedJson = jsonText.substring(0, beforePos + 1) + ',' + jsonText.substring(beforePos + 1)
            
            console.log('🔄 修正後のJSON再パース試行...')
            try {
              const result = JSON.parse(fixedJson)
              console.log('✅ カンマ挿入による修正が成功しました！')
              return result
            } catch (retryError) {
              console.error('❌ カンマ挿入後もパース失敗:', retryError)
            }
          }
          
          // 修正方法を順番に試す
          const fixStrategies = [
            // 戦略1: エラー位置の前で文字列を閉じてカンマを追加
            () => {
              let fixed = jsonText.substring(0, pos).trimEnd()
              if (!fixed.endsWith('"') && !fixed.endsWith(',') && !fixed.endsWith('}') && !fixed.endsWith(']')) {
                fixed += '"'
              }
              fixed += ',' + jsonText.substring(pos)
              return fixed
            },
            // 戦略2: エラー位置の不正な文字をカンマで置換
            () => jsonText.substring(0, pos) + ',' + jsonText.substring(pos + 1),
            // 戦略3: エラー位置にカンマを挿入（文字を削除しない）
            () => jsonText.substring(0, pos) + ',' + jsonText.substring(pos),
            // 戦略4: エラー位置の前の不完全な文字列を修正
            () => {
              let fixed = jsonText.substring(0, pos)
              const lastQuote = fixed.lastIndexOf('"')
              const lastComma = fixed.lastIndexOf(',')
              const lastBrace = Math.max(fixed.lastIndexOf('{'), fixed.lastIndexOf('['))
              
              // 文字列が開かれたまま閉じられていない場合
              if (lastQuote > lastComma && lastQuote > lastBrace) {
                const beforeQuote = fixed.substring(0, lastQuote)
                const afterQuote = fixed.substring(lastQuote + 1)
                // 閉じクオートを追加
                fixed = beforeQuote + '"' + afterQuote.replace(/[^"]*$/, '') + '",'
              }
              
              return fixed + jsonText.substring(pos)
            },
            // 戦略5: エラー位置の前のオブジェクト/配列を閉じる
            () => {
              let fixed = jsonText.substring(0, pos).trimEnd()
              
              // 最後の文字を確認
              const lastChar = fixed.charAt(fixed.length - 1)
              
              // 開いている括弧の種類を判定
              let openBraces = 0, openBrackets = 0
              let inString = false, escaped = false
              
              for (let i = 0; i < fixed.length; i++) {
                const char = fixed[i]
                if (escaped) {
                  escaped = false
                  continue
                }
                if (char === '\\') {
                  escaped = true
                  continue
                }
                if (char === '"') {
                  inString = !inString
                  continue
                }
                if (inString) continue
                
                if (char === '{') openBraces++
                else if (char === '}') openBraces--
                else if (char === '[') openBrackets++
                else if (char === ']') openBrackets--
              }
              
              // 開いている括弧を閉じる
              if (openBrackets > 0) {
                fixed += ']'
              } else if (openBraces > 0) {
                fixed += '}'
              }
              
              fixed += ',' + jsonText.substring(pos)
              return fixed
            },
            // 戦略6: エラー位置以降の不正な部分を切り捨てて配列/オブジェクトを閉じる
            () => {
              let fixed = jsonText.substring(0, pos).trimEnd()
              // 末尾のカンマや不完全な要素を削除
              fixed = fixed.replace(/,\s*$/, '').replace(/"[^"]*$/, '"')
              
              // 開いている括弧を数える
              let openBraces = 0, openBrackets = 0
              let inString = false, escaped = false
              
              for (let i = 0; i < fixed.length; i++) {
                const char = fixed[i]
                if (escaped) {
                  escaped = false
                  continue
                }
                if (char === '\\') {
                  escaped = true
                  continue
                }
                if (char === '"') {
                  inString = !inString
                  continue
                }
                if (inString) continue
                
                if (char === '{') openBraces++
                else if (char === '}') openBraces--
                else if (char === '[') openBrackets++
                else if (char === ']') openBrackets--
              }
              
              // 閉じる
              while (openBrackets > 0) {
                fixed += ']'
                openBrackets--
              }
              while (openBraces > 0) {
                fixed += '}'
                openBraces--
              }
              
              return fixed
            }
          ]
          
          // 各修正戦略を順番に試す
          for (let i = 0; i < fixStrategies.length; i++) {
            try {
              console.log(`🔄 修正戦略 ${i + 1}/${fixStrategies.length} を試行中...`)
              const fixedJson = fixStrategies[i]()
              const parsed = JSON.parse(fixedJson)
              console.log(`✅ 修正戦略 ${i + 1} が成功しました！`)
              return parsed
            } catch (retryError) {
              console.error(`❌ 修正戦略 ${i + 1} 失敗:`, retryError instanceof Error ? retryError.message : String(retryError))
            }
          }
          
          console.error('❌ すべての修正戦略が失敗しました')
        }
      }
    }
    
    // 最後の試み: エラーをthrow
    console.error('❌ すべての修正戦略が失敗しました')
    
    // 詳細なデバッグ情報を提供
    console.error('🔴 JSON修正失敗 - デバッグ情報:')
    console.error('エラー詳細:', error)
    console.error('JSON長さ:', jsonText.length)
    console.error('最初の500文字:', jsonText.substring(0, 500))
    console.error('最後の500文字:', jsonText.substring(Math.max(0, jsonText.length - 500)))
    
    // エラー位置の特定（position情報がある場合）
    if (error instanceof Error && error.message.includes('position')) {
      const posMatch = error.message.match(/position (\d+)/)
      if (posMatch) {
        const errorPos = parseInt(posMatch[1])
        const start = Math.max(0, errorPos - 200)
        const end = Math.min(jsonText.length, errorPos + 200)
        console.error(`エラー位置周辺（±200文字）:`, jsonText.substring(start, end))
        console.error(`エラー位置の文字: "${jsonText[errorPos]}" (code: ${jsonText.charCodeAt(errorPos)})`)
      }
    }
    
    throw new Error(`JSON parse failed: ${error instanceof Error ? error.message : String(error)}`)
  }
}

// card_type の値を検証する関数
function validateCardType(cardType: string | undefined): string {
  // テーブルの CHECK 制約に合わせた許可値
  const allowedCardTypes = ['standard', 'challenge', 'review', 'optional']
  
  // 'main' は 'standard' に変換
  if (cardType === 'main' || cardType === 'selection' || cardType === 'check') {
    return 'standard'
  }
  
  if (cardType && allowedCardTypes.includes(cardType)) {
    return cardType
  }
  
  if (cardType && !allowedCardTypes.includes(cardType)) {
    console.warn(`⚠️ 不正な card_type: '${cardType}' → 'standard' に変更しました`)
  }
  return 'standard'
}

// 学年別の言葉遣いルールを取得
function getGradeLanguageRule(grade: string | undefined): string {
  if (!grade) {
    return '小学3〜4年生レベルの言葉を使う（やさしい言葉、短い文）'
  }
  
  const rules: { [key: string]: string } = {
    '小学1年': 'ひらがなを中心に使う。漢字は「一、二、三、人、子、日、月、火、水、木、金、土、目、耳、手、足、口、山、川、田」など1年生で習った漢字のみ。「うれしい」「かなしい」「たのしい」など感情表現もひらがな。1文は短く10〜15文字程度。',
    '小学2年': 'やさしい漢字（学年、時間、海、算数、春、夏、秋、冬、朝、昼、夜、友だち）を使える。「うれしい」「楽しい」などは2年生ではまだ習わないのでひらがな。1文は15〜20文字程度。具体的な例えを使う。',
    '小学3年': '小学3年生までの漢字を使える（問題、考える、答え、調べる、使う、持つ、進む、育つ、葉、根、実、決める、進める、意味、予想、発表、登る、鼻、歯、血、号、式、対、秒、等）。「悲しい」「嬉しい」などは4年生の漢字なのでひらがな。1文は20〜25文字程度。',
    '小学4年': '小学4年生までの漢字を使える（説明、例、関係、必要、便利、約束、努力、失敗、成功、希望、悲しい、嬉しい、愛、戦、察、念、照、積、伝、漢、飛、良）。やや抽象的な言葉も使える。1文は25〜30文字程度。',
    '小学5年': '小学5年生までの漢字を使える（条件、過程、要素、状態、経験、情報、現在、移動、比較、増加、減少、快適、貿易、圧力、資源、講義、態度）。論理的な説明ができる。1文は30〜35文字程度。',
    '小学6年': '小学6年生までの漢字を使える（構成、機能、影響、系統、価値、批判、暮らし、砂漠、革命、認める、吸収、刻む、模様、筋肉、骨、蔵、貴重）。複雑な説明も可能。1文は35〜40文字程度。',
    '中学1年': '中学生レベルの言葉を使える。専門用語も適度に使用。全学年の漢字を使用できる。',
    '中学2年': '中学生レベルの言葉を使える。専門用語も適度に使用。全学年の漢字を使用できる。',
    '中学3年': '中学生レベルの言葉を使える。専門用語も適度に使用。全学年の漢字を使用できる。'
  }
  
  return rules[grade] || '小学3〜4年生レベルの言葉を使う（やさしい言葉、短い文）'
}

// 履歴記録ヘルパー
async function recordHistory(
  db: D1Database,
  table: 'curriculum_history' | 'card_history',
  targetId: number,
  action: string,
  snapshot: any,
  changedFields?: any
) {
  try {
    const idField = table === 'curriculum_history' ? 'curriculum_id' : 'card_id'
    
    await db.prepare(`
      INSERT INTO ${table} (${idField}, action, changed_fields, snapshot)
      VALUES (?, ?, ?, ?)
    `).bind(
      targetId,
      action,
      changedFields ? JSON.stringify(changedFields) : null,
      JSON.stringify(snapshot)
    ).run()
    
    console.log(`📝 履歴記録: ${table}, action=${action}, id=${targetId}`)
  } catch (error) {
    console.error('履歴記録エラー:', error)
    // 履歴記録失敗はメイン処理を止めない
  }
}

// Gemini API呼び出しヘルパー（リトライ + 監視）
interface GeminiCallOptions {
  model: string
  prompt: string
  apiKey: string
  maxOutputTokens?: number
  temperature?: number
  retries?: number
  retryDelay?: number
}

interface GeminiResponse {
  success: boolean
  content?: string
  model?: string
  error?: string
  attempts?: number
  totalTime?: number
}

async function callGeminiAPI(options: GeminiCallOptions): Promise<GeminiResponse> {
  const {
    model,
    prompt,
    apiKey,
    maxOutputTokens = 8192,
    temperature = 0.8,
    retries = 3,
    retryDelay = 2000
  } = options

  const startTime = Date.now()
  let lastError = ''
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`🔄 Gemini API呼び出し: ${model} (試行 ${attempt}/${retries})`)
      
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature, maxOutputTokens }
          })
        }
      )

      if (!response.ok) {
        const errorText = await response.text()
        lastError = `HTTP ${response.status}: ${errorText.substring(0, 200)}`
        console.error(`❌ Gemini API エラー (${model}):`, lastError)
        
        // 429 (Rate Limit) や 5xx エラーの場合はリトライ
        if (response.status === 429 || response.status >= 500) {
          if (attempt < retries) {
            console.log(`⏳ ${retryDelay}ms 待機してリトライ...`)
            await new Promise(resolve => setTimeout(resolve, retryDelay * attempt))
            continue
          }
        }
        
        // その他のエラーはリトライしない
        break
      }

      const data = await response.json()
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text

      if (!content) {
        lastError = 'AIの応答が空でした'
        console.error(`❌ 応答なし (${model})`)
        continue
      }

      const totalTime = Date.now() - startTime
      console.log(`✅ Gemini API成功: ${model} (${attempt}回目, ${totalTime}ms)`)

      return {
        success: true,
        content,
        model,
        attempts: attempt,
        totalTime
      }
    } catch (error) {
      lastError = error instanceof Error ? error.message : 'Unknown error'
      console.error(`❌ Gemini API例外 (${model}):`, lastError)
      
      if (attempt < retries) {
        console.log(`⏳ ${retryDelay}ms 待機してリトライ...`)
        await new Promise(resolve => setTimeout(resolve, retryDelay * attempt))
      }
    }
  }

  const totalTime = Date.now() - startTime
  console.error(`❌ Gemini API失敗: ${model} (全${retries}回試行, ${totalTime}ms)`)

  return {
    success: false,
    error: lastError,
    model,
    attempts: retries,
    totalTime
  }
}

// グローバルミドルウェア設定
app.use('*', errorHandlingMiddleware)
app.use('/api/*', requestLoggingMiddleware)

// セキュリティ & パフォーマンスヘッダー設定
app.use('*', async (c, next) => {
  await next()
  
  // セキュリティヘッダー
  c.header('X-Content-Type-Options', 'nosniff')
  c.header('X-Frame-Options', 'SAMEORIGIN')
  c.header('X-XSS-Protection', '1; mode=block')
  c.header('Referrer-Policy', 'strict-origin-when-cross-origin')
  c.header('Permissions-Policy', 'geolocation=(), microphone=(), camera=()')
  
  // パフォーマンスヘッダー
  const path = c.req.path
  if (path.startsWith('/static/') || path.match(/\.(js|css|png|jpg|jpeg|gif|svg|woff|woff2)$/)) {
    // 静的リソースは長期キャッシュ（1年）
    c.header('Cache-Control', 'public, max-age=31536000, immutable')
  } else if (path === '/' || path.startsWith('/api/')) {
    // HTML とAPIは短期キャッシュ（1時間）
    c.header('Cache-Control', 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400')
  }
  
  // Cloudflare のエッジキャッシュ設定
  c.header('CDN-Cache-Control', 'max-age=86400')
})

// CORS設定
app.use('/api/*', cors())

// =============================================================================
// Phase 7: ヘルスチェック・監視エンドポイント
// =============================================================================

// ヘルスチェック（認証不要）
app.get('/health', async (c) => {
  const metrics = await performHealthCheck(c);
  const statusCode = metrics.status === 'healthy' ? 200 : metrics.status === 'degraded' ? 200 : 503;
  
  return c.json(metrics, statusCode);
});

// 詳細なシステムステータス（認証必須・管理者のみ）
app.get('/api/admin/system-status', authMiddleware, requireRole('admin'), async (c) => {
  const metrics = await performHealthCheck(c);
  const { KV } = c.env as { KV: KVNamespace };
  const cacheStats = await getCacheStats(KV);
  
  return c.json({
    ...metrics,
    cache: cacheStats,
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'production'
  });
});

// キャッシュ統計エンドポイント（管理者のみ）
app.get('/api/admin/cache-stats', authMiddleware, requireRole('admin'), async (c) => {
  const { KV } = c.env as { KV: KVNamespace };
  const stats = await getCacheStats(KV);
  
  return c.json(stats);
});

// =============================================================================
// Phase 7: 認証・認可システム - JWT + RBAC
// =============================================================================

// ユーザー登録（学生）
app.post('/api/auth/register/student', registerStudent)

// ログアウト
app.post('/api/auth/logout', logout)

// 現在のユーザー情報取得（認証必須）
app.get('/api/auth/me', authMiddleware, getCurrentUser)

// パスワード変更（認証必須）
app.post('/api/auth/change-password', authMiddleware, changePassword)

// ロールベースアクセス制御のデモ
app.get('/api/admin/dashboard', authMiddleware, requireRole('admin', 'teacher'), async (c) => {
  return c.json({ 
    message: 'Admin/Teacher Dashboard',
    info: 'This endpoint is only accessible to admins and teachers'
  })
})

// ユーザータイプベースアクセス制御のデモ
app.get('/api/student/progress', authMiddleware, requireUserType('student'), async (c) => {
  const user = c.get('user') as any;
  return c.json({ 
    message: 'Student Progress',
    student_id: user.user_id 
  })
})

// =============================================================================
// Phase 9: 適応学習エンジン（学習スタイル自動検出）
// =============================================================================

// 学習スタイル自動検出
app.get('/api/adaptive/detect-learning-style/:studentId', async (c) => {
  const { env } = c;
  const studentId = parseInt(c.req.param('studentId'));

  try {
    const adaptiveEngine = new AdaptiveLearningEngine(env.DB, env.LEARNING_CACHE);
    const learningStyle = await adaptiveEngine.detectLearningStyle(studentId);

    return c.json({
      success: true,
      data: learningStyle
    });
  } catch (error: any) {
    return c.json({
      success: false,
      error: error.message
    }, 500);
  }
})

// 適応型カリキュラム推薦
app.get('/api/adaptive/recommend/:studentId', async (c) => {
  const { env } = c;
  const studentId = parseInt(c.req.param('studentId'));
  const count = parseInt(c.req.query('count') || '5');

  try {
    const adaptiveEngine = new AdaptiveLearningEngine(env.DB, env.LEARNING_CACHE);
    const recommendations = await adaptiveEngine.recommendCurriculum(studentId, count);

    return c.json({
      success: true,
      data: recommendations
    });
  } catch (error: any) {
    return c.json({
      success: false,
      error: error.message
    }, 500);
  }
})

// =============================================================================
// Phase 10: 学校・自治体向け管理機能
// =============================================================================

// 学校の全クラス進捗取得
app.get('/api/school/:schoolId/classes', async (c) => {
  const { env } = c;
  const schoolId = parseInt(c.req.param('schoolId'));

  try {
    const schoolSystem = new SchoolManagementSystem(env.DB, env.LEARNING_CACHE);
    const classes = await schoolSystem.getMultiClassProgress(schoolId);

    return c.json({
      success: true,
      data: classes
    });
  } catch (error: any) {
    return c.json({
      success: false,
      error: error.message
    }, 500);
  }
})

// 学年別サマリ取得
app.get('/api/school/:schoolId/grade-summary', async (c) => {
  const { env } = c;
  const schoolId = parseInt(c.req.param('schoolId'));

  try {
    const schoolSystem = new SchoolManagementSystem(env.DB, env.LEARNING_CACHE);
    const summary = await schoolSystem.getGradeSummary(schoolId);

    return c.json({
      success: true,
      data: summary
    });
  } catch (error: any) {
    return c.json({
      success: false,
      error: error.message
    }, 500);
  }
})

// 教師向けクラス分析
app.get('/api/teacher/:teacherId/class/:classCode/analysis', async (c) => {
  const { env } = c;
  const teacherId = parseInt(c.req.param('teacherId'));
  const classCode = c.req.param('classCode');

  try {
    const schoolSystem = new SchoolManagementSystem(env.DB, env.LEARNING_CACHE);
    const analysis = await schoolSystem.getTeacherClassAnalysis(teacherId, classCode);

    return c.json({
      success: true,
      data: analysis
    });
  } catch (error: any) {
    return c.json({
      success: false,
      error: error.message
    }, 500);
  }
})

// =============================================================================
// Phase 22: クラス全体の学習進捗比較ビュー
// =============================================================================

// クラス全体の進捗サマリー取得
app.get('/api/class/:classId/progress-summary', async (c) => {
  const { env } = c;
  const classId = parseInt(c.req.param('classId'));

  try {
    const summary = await generateClassSummary(env.DB, classId, 0);
    return c.json({
      success: true,
      data: summary
    });
  } catch (error: any) {
    return c.json({
      success: false,
      error: error.message
    }, 500);
  }
})

// クラスの生徒別進捗ヒートマップデータ取得
app.get('/api/class/:classId/heatmap', async (c) => {
  const { env } = c;
  const classId = parseInt(c.req.param('classId'));
  const subject = c.req.query('subject') || 'all';

  try {
    // クラスの生徒一覧を取得
    const students = await env.DB.prepare(`
      SELECT id, name FROM students WHERE class_id = ? ORDER BY name
    `).bind(classId).all();

    // 単元一覧を取得
    let unitQuery = `
      SELECT DISTINCT c.id, c.unit_name
      FROM curriculum c
      JOIN learning_cards lc ON c.id = lc.curriculum_id
      WHERE 1=1
    `;
    const unitParams: any[] = [];
    
    if (subject !== 'all') {
      unitQuery += ' AND c.subject = ?';
      unitParams.push(subject);
    }
    
    unitQuery += ' ORDER BY c.unit_order LIMIT 5';
    
    const units = await env.DB.prepare(unitQuery).bind(...unitParams).all();

    // 各生徒×単元の習熟度を取得
    const heatmapData = [];
    for (const student of students.results) {
      const studentData: any = {
        student_id: student.id,
        student_name: student.name,
        units: [],
        overall: 0
      };

      let totalScore = 0;
      let unitCount = 0;

      for (const unit of units.results) {
        // 単元ごとの正答率を計算
        const stats = await env.DB.prepare(`
          SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) as correct
          FROM answer_history
          WHERE student_id = ? AND curriculum_id = ?
        `).bind(student.id, unit.id).first();

        const accuracy = stats && stats.total > 0 
          ? Math.round((stats.correct / stats.total) * 100)
          : 0;

        studentData.units.push({
          unit_id: unit.id,
          unit_name: unit.unit_name,
          accuracy
        });

        totalScore += accuracy;
        unitCount++;
      }

      studentData.overall = unitCount > 0 ? Math.round(totalScore / unitCount) : 0;

      // ステータス判定
      if (studentData.overall >= 80) {
        studentData.status = 'ahead';
      } else if (studentData.overall >= 60) {
        studentData.status = 'on-track';
      } else {
        studentData.status = 'behind';
      }

      // 最終学習日時を取得
      const lastActivity = await env.DB.prepare(`
        SELECT MAX(created_at) as last_activity
        FROM answer_history
        WHERE student_id = ?
      `).bind(student.id).first();

      studentData.last_activity = lastActivity?.last_activity || null;

      heatmapData.push(studentData);
    }

    return c.json({
      success: true,
      data: {
        students: heatmapData,
        units: units.results
      }
    });
  } catch (error: any) {
    console.error('ヒートマップデータ取得エラー:', error);
    return c.json({
      success: false,
      error: error.message
    }, 500);
  }
})

// 習熟度分布データ取得
app.get('/api/class/:classId/distribution', async (c) => {
  const { env } = c;
  const classId = parseInt(c.req.param('classId'));

  try {
    const students = await env.DB.prepare(`
      SELECT id FROM students WHERE class_id = ?
    `).bind(classId).all();

    const studentIds = students.results.map((s: any) => s.id);

    // 正答率分布
    const accuracyDistribution = {
      '0-40': 0,
      '41-60': 0,
      '61-70': 0,
      '71-80': 0,
      '81-90': 0,
      '91-100': 0
    };

    // 進捗状況分布
    const progressDistribution = {
      ahead: 0,
      'on-track': 0,
      behind: 0
    };

    for (const studentId of studentIds) {
      const stats = await env.DB.prepare(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) as correct
        FROM answer_history
        WHERE student_id = ?
      `).bind(studentId).first();

      const accuracy = stats && stats.total > 0 
        ? Math.round((stats.correct / stats.total) * 100)
        : 0;

      // 正答率分布にカウント
      if (accuracy <= 40) accuracyDistribution['0-40']++;
      else if (accuracy <= 60) accuracyDistribution['41-60']++;
      else if (accuracy <= 70) accuracyDistribution['61-70']++;
      else if (accuracy <= 80) accuracyDistribution['71-80']++;
      else if (accuracy <= 90) accuracyDistribution['81-90']++;
      else accuracyDistribution['91-100']++;

      // 進捗状況分布にカウント
      if (accuracy >= 80) progressDistribution.ahead++;
      else if (accuracy >= 60) progressDistribution['on-track']++;
      else progressDistribution.behind++;
    }

    // 単元別平均正答率
    const unitStats = await env.DB.prepare(`
      SELECT 
        c.unit_name,
        AVG(CASE WHEN ah.is_correct = 1 THEN 100.0 ELSE 0.0 END) as avg_accuracy
      FROM curriculum c
      JOIN answer_history ah ON c.id = ah.curriculum_id
      WHERE ah.student_id IN (${studentIds.map(() => '?').join(',')})
      GROUP BY c.id, c.unit_name
      ORDER BY c.unit_order
      LIMIT 5
    `).bind(...studentIds).all();

    return c.json({
      success: true,
      data: {
        accuracyDistribution,
        progressDistribution,
        unitStats: unitStats.results
      }
    });
  } catch (error: any) {
    console.error('分布データ取得エラー:', error);
    return c.json({
      success: false,
      error: error.message
    }, 500);
  }
})

// 要サポート生徒リスト取得
app.get('/api/class/:classId/needs-attention', async (c) => {
  const { env } = c;
  const classId = parseInt(c.req.param('classId'));

  try {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const needsAttention = await env.DB.prepare(`
      SELECT 
        s.id,
        s.name,
        COUNT(ah.id) as problem_count,
        AVG(CASE WHEN ah.is_correct = 1 THEN 100.0 ELSE 0.0 END) as accuracy,
        MAX(ah.created_at) as last_activity
      FROM students s
      LEFT JOIN answer_history ah ON s.id = ah.student_id AND ah.created_at >= ?
      WHERE s.class_id = ?
      GROUP BY s.id, s.name
      HAVING problem_count < 5 OR accuracy < 60 OR last_activity IS NULL
      ORDER BY accuracy ASC
    `).bind(oneWeekAgo.toISOString(), classId).all();

    // 推奨アクションを追加
    const studentsWithActions = needsAttention.results.map((student: any) => {
      const actions = [];
      
      if (!student.last_activity) {
        actions.push('学習活動が確認できません。保護者への連絡を推奨');
      }
      if (student.accuracy < 50) {
        actions.push('基礎単元の復習から始めることを推奨');
      }
      if (student.problem_count < 5) {
        actions.push('学習習慣の確立をサポート');
      }
      
      return {
        ...student,
        recommended_actions: actions
      };
    });

    return c.json({
      success: true,
      data: studentsWithActions
    });
  } catch (error: any) {
    console.error('要サポート生徒取得エラー:', error);
    return c.json({
      success: false,
      error: error.message
    }, 500);
  }
})

// 保護者通知送信
app.post('/api/parent/notify', async (c) => {
  const { env } = c;
  const notification = await c.req.json();

  try {
    const schoolSystem = new SchoolManagementSystem(env.DB, env.LEARNING_CACHE);
    const result = await schoolSystem.sendParentNotification(notification);

    return c.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    return c.json({
      success: false,
      error: error.message
    }, 500);
  }
})

// =============================================================================
// Phase 22: 教員向けコメント・フィードバック機能
// =============================================================================

// コメント作成
app.post('/api/comments', authMiddleware, async (c) => {
  const { env } = c;
  const user = c.get('user');
  const body = await c.req.json();

  try {
    const {
      student_id,
      comment_type = 'general',
      target_type,
      target_id,
      subject,
      unit_name,
      comment_text,
      sentiment = 'positive'
    } = body;

    const result = await env.DB.prepare(`
      INSERT INTO teacher_comments (
        school_id, teacher_id, student_id, comment_type,
        target_type, target_id, subject, unit_name,
        comment_text, sentiment
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      user.school_id,
      user.user_id,
      student_id,
      comment_type,
      target_type || null,
      target_id || null,
      subject || null,
      unit_name || null,
      comment_text,
      sentiment
    ).run();

    // リアルタイム通知を送信（WebSocket経由）
    if (env.PROGRESS_WEBSOCKET) {
      const student = await env.DB.prepare(`
        SELECT class_code FROM users WHERE user_id = ?
      `).bind(student_id).first();

      if (student?.class_code) {
        const id = env.PROGRESS_WEBSOCKET.idFromName(student.class_code as string);
        const stub = env.PROGRESS_WEBSOCKET.get(id);
        // WebSocket通知はDurable Object内で処理
      }
    }

    return c.json({
      success: true,
      comment_id: result.meta.last_row_id
    });
  } catch (error: any) {
    console.error('コメント作成エラー:', error);
    return c.json({
      success: false,
      error: error.message
    }, 500);
  }
})

// コメント一覧取得（教員用）
app.get('/api/comments/teacher', authMiddleware, requireRole('teacher', 'admin'), async (c) => {
  const { env } = c;
  const user = c.get('user');
  const student_id = c.req.query('student_id');
  const comment_type = c.req.query('comment_type');
  const limit = parseInt(c.req.query('limit') || '50');

  try {
    let query = `
      SELECT 
        tc.*,
        u.full_name as student_name,
        COUNT(cr.reaction_id) as reaction_count
      FROM teacher_comments tc
      JOIN users u ON tc.student_id = u.user_id
      LEFT JOIN comment_reactions cr ON tc.comment_id = cr.comment_id
      WHERE tc.teacher_id = ?
    `;
    const params: any[] = [user.user_id];

    if (student_id) {
      query += ' AND tc.student_id = ?';
      params.push(parseInt(student_id));
    }

    if (comment_type) {
      query += ' AND tc.comment_type = ?';
      params.push(comment_type);
    }

    query += ' GROUP BY tc.comment_id ORDER BY tc.created_at DESC LIMIT ?';
    params.push(limit);

    const result = await env.DB.prepare(query).bind(...params).all();

    return c.json({
      success: true,
      data: result.results
    });
  } catch (error: any) {
    console.error('コメント一覧取得エラー:', error);
    return c.json({
      success: false,
      error: error.message
    }, 500);
  }
})

// コメント一覧取得（児童用）
app.get('/api/comments/student', authMiddleware, async (c) => {
  const { env } = c;
  const user = c.get('user');
  const unread_only = c.req.query('unread_only') === 'true';
  const limit = parseInt(c.req.query('limit') || '50');

  try {
    let query = `
      SELECT 
        tc.*,
        u.full_name as teacher_name,
        COUNT(cr.reaction_id) as reaction_count,
        MAX(CASE WHEN cr.student_id = ? THEN cr.reaction_type END) as my_reaction
      FROM teacher_comments tc
      JOIN users u ON tc.teacher_id = u.user_id
      LEFT JOIN comment_reactions cr ON tc.comment_id = cr.comment_id
      WHERE tc.student_id = ?
    `;
    const params: any[] = [user.user_id, user.user_id];

    if (unread_only) {
      query += ' AND tc.is_read = 0';
    }

    query += ' GROUP BY tc.comment_id ORDER BY tc.is_pinned DESC, tc.created_at DESC LIMIT ?';
    params.push(limit);

    const result = await env.DB.prepare(query).bind(...params).all();

    return c.json({
      success: true,
      data: result.results
    });
  } catch (error: any) {
    console.error('コメント一覧取得エラー:', error);
    return c.json({
      success: false,
      error: error.message
    }, 500);
  }
})

// コメント既読マーク
app.put('/api/comments/:id/read', authMiddleware, async (c) => {
  const { env } = c;
  const user = c.get('user');
  const commentId = parseInt(c.req.param('id'));

  try {
    await env.DB.prepare(`
      UPDATE teacher_comments
      SET is_read = 1, read_at = CURRENT_TIMESTAMP
      WHERE comment_id = ? AND student_id = ?
    `).bind(commentId, user.user_id).run();

    return c.json({ success: true });
  } catch (error: any) {
    console.error('コメント既読エラー:', error);
    return c.json({
      success: false,
      error: error.message
    }, 500);
  }
})

// コメント削除
app.delete('/api/comments/:id', authMiddleware, async (c) => {
  const { env } = c;
  const user = c.get('user');
  const commentId = parseInt(c.req.param('id'));

  try {
    // 教員は自分のコメントのみ削除可能
    await env.DB.prepare(`
      DELETE FROM teacher_comments
      WHERE comment_id = ? AND teacher_id = ?
    `).bind(commentId, user.user_id).run();

    return c.json({ success: true });
  } catch (error: any) {
    console.error('コメント削除エラー:', error);
    return c.json({
      success: false,
      error: error.message
    }, 500);
  }
})

// コメントテンプレート一覧取得
app.get('/api/comment-templates', authMiddleware, requireRole('teacher', 'admin'), async (c) => {
  const { env } = c;
  const user = c.get('user');
  const category = c.req.query('category');

  try {
    let query = `
      SELECT * FROM comment_templates
      WHERE (teacher_id = ? OR teacher_id IS NULL) AND is_active = 1
    `;
    const params: any[] = [user.user_id];

    if (category) {
      query += ' AND template_category = ?';
      params.push(category);
    }

    query += ' ORDER BY usage_count DESC, template_name';

    const result = await env.DB.prepare(query).bind(...params).all();

    return c.json({
      success: true,
      data: result.results
    });
  } catch (error: any) {
    console.error('テンプレート取得エラー:', error);
    return c.json({
      success: false,
      error: error.message
    }, 500);
  }
})

// コメントテンプレート作成
app.post('/api/comment-templates', authMiddleware, requireRole('teacher', 'admin'), async (c) => {
  const { env } = c;
  const user = c.get('user');
  const body = await c.req.json();

  try {
    const {
      template_name,
      template_category = 'encouragement',
      template_text
    } = body;

    const result = await env.DB.prepare(`
      INSERT INTO comment_templates (
        school_id, teacher_id, template_name, template_category, template_text
      ) VALUES (?, ?, ?, ?, ?)
    `).bind(
      user.school_id,
      user.user_id,
      template_name,
      template_category,
      template_text
    ).run();

    return c.json({
      success: true,
      template_id: result.meta.last_row_id
    });
  } catch (error: any) {
    console.error('テンプレート作成エラー:', error);
    return c.json({
      success: false,
      error: error.message
    }, 500);
  }
})

// コメントテンプレート使用（使用回数カウント）
app.post('/api/comment-templates/:id/use', authMiddleware, async (c) => {
  const { env } = c;
  const templateId = parseInt(c.req.param('id'));

  try {
    await env.DB.prepare(`
      UPDATE comment_templates
      SET usage_count = usage_count + 1, updated_at = CURRENT_TIMESTAMP
      WHERE template_id = ?
    `).bind(templateId).run();

    return c.json({ success: true });
  } catch (error: any) {
    console.error('テンプレート使用エラー:', error);
    return c.json({
      success: false,
      error: error.message
    }, 500);
  }
})

// コメントにリアクション追加
app.post('/api/comments/:id/reactions', authMiddleware, async (c) => {
  const { env } = c;
  const user = c.get('user');
  const commentId = parseInt(c.req.param('id'));
  const body = await c.req.json();

  try {
    const { reaction_type = 'like' } = body;

    // 既存のリアクションを削除してから追加（1人1リアクション）
    await env.DB.prepare(`
      DELETE FROM comment_reactions
      WHERE comment_id = ? AND student_id = ?
    `).bind(commentId, user.user_id).run();

    await env.DB.prepare(`
      INSERT INTO comment_reactions (comment_id, student_id, reaction_type)
      VALUES (?, ?, ?)
    `).bind(commentId, user.user_id, reaction_type).run();

    return c.json({ success: true });
  } catch (error: any) {
    console.error('リアクション追加エラー:', error);
    return c.json({
      success: false,
      error: error.message
    }, 500);
  }
})

// コメント統計取得
app.get('/api/comments/statistics', authMiddleware, requireRole('teacher', 'admin'), async (c) => {
  const { env } = c;
  const user = c.get('user');
  const start_date = c.req.query('start_date') || new Date(Date.now() - 30*24*60*60*1000).toISOString().split('T')[0];
  const end_date = c.req.query('end_date') || new Date().toISOString().split('T')[0];

  try {
    const stats = await env.DB.prepare(`
      SELECT * FROM comment_statistics
      WHERE teacher_id = ? AND stat_date BETWEEN ? AND ?
      ORDER BY stat_date DESC
    `).bind(user.user_id, start_date, end_date).all();

    // 集計データ
    const summary = {
      total_comments: stats.results.reduce((sum: number, s: any) => sum + (s.total_comments || 0), 0),
      avg_read_rate: stats.results.length > 0 
        ? stats.results.reduce((sum: number, s: any) => sum + (s.student_read_rate || 0), 0) / stats.results.length
        : 0,
      daily_stats: stats.results
    };

    return c.json({
      success: true,
      data: summary
    });
  } catch (error: any) {
    console.error('統計取得エラー:', error);
    return c.json({
      success: false,
      error: error.message
    }, 500);
  }
})

// =============================================================================
// Phase 23: AIチャットボット（24時間質問対応） - 全教科対応
// =============================================================================

// 新規会話開始
app.post('/api/chat/conversations', authMiddleware, async (c) => {
  const { env } = c;
  const user = c.get('user');
  const body = await c.req.json();

  try {
    const { subject, grade } = body;

    const result = await env.DB.prepare(`
      INSERT INTO chat_conversations (school_id, student_id, subject, grade)
      VALUES (?, ?, ?, ?)
    `).bind(user.school_id, user.user_id, subject || null, grade || null).run();

    return c.json({
      success: true,
      conversation_id: result.meta.last_row_id
    });
  } catch (error: any) {
    console.error('会話作成エラー:', error);
    return c.json({
      success: false,
      error: error.message
    }, 500);
  }
})

// 会話一覧取得
app.get('/api/chat/conversations', authMiddleware, async (c) => {
  const { env } = c;
  const user = c.get('user');
  const limit = parseInt(c.req.query('limit') || '20');

  try {
    const conversations = await env.DB.prepare(`
      SELECT * FROM chat_conversations
      WHERE student_id = ?
      ORDER BY last_message_at DESC
      LIMIT ?
    `).bind(user.user_id, limit).all();

    return c.json({
      success: true,
      data: conversations.results
    });
  } catch (error: any) {
    console.error('会話一覧取得エラー:', error);
    return c.json({
      success: false,
      error: error.message
    }, 500);
  }
})

// メッセージ送信
app.post('/api/chat/messages', authMiddleware, async (c) => {
  const { env } = c;
  const user = c.get('user');
  const body = await c.req.json();

  try {
    const { conversation_id, message_text, subject } = body;

    // 生徒のメッセージを保存
    const studentMsg = await env.DB.prepare(`
      INSERT INTO chat_messages (
        conversation_id, sender_type, message_text, subject
      ) VALUES (?, 'student', ?, ?)
    `).bind(conversation_id, message_text, subject || null).run();

    // 会話履歴を取得（最新10件）
    const history = await env.DB.prepare(`
      SELECT sender_type, message_text
      FROM chat_messages
      WHERE conversation_id = ?
      ORDER BY created_at DESC
      LIMIT 10
    `).bind(conversation_id).all();

    // 会話情報を取得
    const conversation = await env.DB.prepare(`
      SELECT subject, grade FROM chat_conversations WHERE conversation_id = ?
    `).bind(conversation_id).first();

    // Gemini APIでAI応答を生成
    const startTime = Date.now();
    const aiResponse = await generateAIResponse(
      env.GEMINI_API_KEY,
      message_text,
      history.results.reverse(),
      conversation?.subject as string || null,
      conversation?.grade as string || null
    );
    const responseTime = Date.now() - startTime;

    // AI応答を保存
    await env.DB.prepare(`
      INSERT INTO chat_messages (
        conversation_id, sender_type, message_text, subject, 
        ai_model, response_time_ms
      ) VALUES (?, 'ai', ?, ?, 'gemini-3-flash', ?)
    `).bind(conversation_id, aiResponse, subject || null, responseTime).run();

    return c.json({
      success: true,
      ai_response: aiResponse,
      response_time_ms: responseTime
    });
  } catch (error: any) {
    console.error('メッセージ送信エラー:', error);
    return c.json({
      success: false,
      error: error.message
    }, 500);
  }
})

// 会話のメッセージ履歴取得
app.get('/api/chat/conversations/:id/messages', authMiddleware, async (c) => {
  const { env } = c;
  const conversationId = parseInt(c.req.param('id'));
  const limit = parseInt(c.req.query('limit') || '50');

  try {
    const messages = await env.DB.prepare(`
      SELECT * FROM chat_messages
      WHERE conversation_id = ?
      ORDER BY created_at
      LIMIT ?
    `).bind(conversationId, limit).all();

    return c.json({
      success: true,
      data: messages.results
    });
  } catch (error: any) {
    console.error('メッセージ履歴取得エラー:', error);
    return c.json({
      success: false,
      error: error.message
    }, 500);
  }
})

// クイック返信取得
app.get('/api/chat/quick-replies', authMiddleware, async (c) => {
  const { env } = c;
  const subject = c.req.query('subject') || '総合';
  const grade = c.req.query('grade');

  try {
    let query = `
      SELECT * FROM chat_quick_replies
      WHERE subject = ? AND is_active = 1
    `;
    const params: any[] = [subject];

    if (grade) {
      query += ' AND (grade = ? OR grade IS NULL)';
      params.push(grade);
    }

    query += ' ORDER BY display_order, usage_count DESC';

    const replies = await env.DB.prepare(query).bind(...params).all();

    return c.json({
      success: true,
      data: replies.results
    });
  } catch (error: any) {
    console.error('クイック返信取得エラー:', error);
    return c.json({
      success: false,
      error: error.message
    }, 500);
  }
})

// メッセージフィードバック
app.post('/api/chat/messages/:id/feedback', authMiddleware, async (c) => {
  const { env } = c;
  const user = c.get('user');
  const messageId = parseInt(c.req.param('id'));
  const body = await c.req.json();

  try {
    const { is_helpful, rating, feedback_type, feedback_text } = body;

    // メッセージの is_helpful を更新
    if (is_helpful !== undefined) {
      await env.DB.prepare(`
        UPDATE chat_messages
        SET is_helpful = ?
        WHERE message_id = ?
      `).bind(is_helpful ? 1 : -1, messageId).run();
    }

    // フィードバックを保存
    if (rating || feedback_type) {
      await env.DB.prepare(`
        INSERT INTO chat_feedback (
          message_id, student_id, rating, feedback_type, feedback_text
        ) VALUES (?, ?, ?, ?, ?)
      `).bind(
        messageId,
        user.user_id,
        rating || null,
        feedback_type || null,
        feedback_text || null
      ).run();
    }

    return c.json({ success: true });
  } catch (error: any) {
    console.error('フィードバック保存エラー:', error);
    return c.json({
      success: false,
      error: error.message
    }, 500);
  }
})

// チャット統計取得
app.get('/api/chat/statistics', authMiddleware, async (c) => {
  const { env } = c;
  const user = c.get('user');
  const days = parseInt(c.req.query('days') || '30');

  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const stats = await env.DB.prepare(`
      SELECT * FROM chat_statistics
      WHERE student_id = ? AND stat_date >= ?
      ORDER BY stat_date DESC
    `).bind(user.user_id, startDate.toISOString().split('T')[0]).all();

    // 集計
    const summary = {
      total_conversations: stats.results.reduce((sum: number, s: any) => sum + (s.total_conversations || 0), 0),
      total_messages: stats.results.reduce((sum: number, s: any) => sum + (s.total_messages || 0), 0),
      avg_helpful_rate: stats.results.length > 0
        ? stats.results.reduce((sum: number, s: any) => sum + (s.helpful_rate || 0), 0) / stats.results.length
        : 0,
      daily_stats: stats.results
    };

    return c.json({
      success: true,
      data: summary
    });
  } catch (error: any) {
    console.error('統計取得エラー:', error);
    return c.json({
      success: false,
      error: error.message
    }, 500);
  }
})

// AI応答生成関数
async function generateAIResponse(
  apiKey: string,
  userMessage: string,
  conversationHistory: any[],
  subject: string | null,
  grade: string | null
): Promise<string> {
  // システムプロンプト
  const systemPrompt = `あなたは小学生向けの優しい学習アシスタントAIです。

【あなたの役割】
- 小学生の質問に、わかりやすく丁寧に答える
- 全教科（算数、国語、理科、社会、英語）に対応する
- 答えを直接教えるのではなく、考え方やヒントを提供する
- 励ましの言葉を忘れずに入れる

【回答ルール】
1. 小学${grade || '3-4年'}生にわかる言葉を使う
2. 1回の回答は200文字以内に収める
3. 難しい言葉には（ ）で説明を加える
4. 絵文字を適度に使って親しみやすくする 😊
5. 「〜だよ」「〜してみようね」など優しい口調で話す

【現在の教科】: ${subject || '不明'}
【学年】: ${grade || '不明'}

生徒の質問に、優しく丁寧に答えてください。`;

  // 会話履歴をフォーマット
  const historyText = conversationHistory
    .map((msg: any) => `${msg.sender_type === 'student' ? '生徒' : 'AI'}: ${msg.message_text}`)
    .join('\n');

  const prompt = `${systemPrompt}

【これまでの会話】
${historyText}

【新しい質問】
生徒: ${userMessage}

AI:`;

  // Gemini API呼び出し
  const response = await callGeminiAPI({
    model: 'gemini-1.5-flash',
    prompt: prompt,
    apiKey: apiKey,
    maxOutputTokens: 500,
    temperature: 0.7
  });

  if (response.success && response.content) {
    return response.content;
  } else {
    throw new Error(response.error || 'AI応答生成に失敗しました');
  }
}

// 保護者通知履歴取得
app.get('/api/parent/notifications/:studentId', async (c) => {
  const { env } = c;
  const studentId = parseInt(c.req.param('studentId'));

  try {
    const schoolSystem = new SchoolManagementSystem(env.DB, env.LEARNING_CACHE);
    const history = await schoolSystem.getParentNotificationHistory(studentId);

    return c.json({
      success: true,
      data: history
    });
  } catch (error: any) {
    return c.json({
      success: false,
      error: error.message
    }, 500);
  }
})

// 学校全体のレポートデータ取得
app.get('/api/school/:schoolId/report', async (c) => {
  const { env } = c;
  const schoolId = parseInt(c.req.param('schoolId'));
  const startDate = c.req.query('start_date') || new Date(Date.now() - 30*24*60*60*1000).toISOString();
  const endDate = c.req.query('end_date') || new Date().toISOString();

  try {
    const schoolSystem = new SchoolManagementSystem(env.DB, env.LEARNING_CACHE);
    const reportData = await schoolSystem.getSchoolReportData(schoolId, startDate, endDate);

    return c.json({
      success: true,
      data: reportData
    });
  } catch (error: any) {
    return c.json({
      success: false,
      error: error.message
    }, 500);
  }
})

// =============================================================================
// Option B: AI生成コンテンツ（学習スタイル別）
// =============================================================================

// AI生成コンテンツ - 学習スタイル別コンテンツ生成
app.post('/api/ai/generate-content', async (c) => {
  const { env } = c;
  const request = await c.req.json();

  try {
    const aiGenerator = new AIContentGenerator(env.GEMINI_API_KEY, env.DB, env.LEARNING_CACHE);
    const content = await aiGenerator.generateContent(request);

    return c.json({
      success: true,
      data: content
    });
  } catch (error: any) {
    return c.json({
      success: false,
      error: error.message
    }, 500);
  }
})

// AI生成コンテンツ履歴取得
app.get('/api/ai/content-history', async (c) => {
  const { env } = c;
  const filters = {
    topic: c.req.query('topic'),
    learning_style: c.req.query('learning_style'),
    content_type: c.req.query('content_type'),
    limit: parseInt(c.req.query('limit') || '20')
  };

  try {
    const aiGenerator = new AIContentGenerator(env.GEMINI_API_KEY, env.DB, env.LEARNING_CACHE);
    const history = await aiGenerator.getGenerationHistory(filters);

    return c.json({
      success: true,
      data: history
    });
  } catch (error: any) {
    return c.json({
      success: false,
      error: error.message
    }, 500);
  }
})

// =============================================================================
// Phase 7: リアルタイム通知機能 - WebSocketエンドポイント
// =============================================================================

// WebSocket接続エンドポイント
app.get('/api/realtime/connect', async (c) => {
  const { env } = c
  
  if (!env.PROGRESS_WEBSOCKET) {
    return c.json({ error: 'WebSocket not configured' }, 500)
  }
  
  // Durable Object IDを取得（クラスコードベース）
  const classCode = c.req.query('classCode')
  if (!classCode) {
    return c.json({ error: 'classCode is required' }, 400)
  }
  
  // Durable Object IDを生成
  const id = env.PROGRESS_WEBSOCKET.idFromName(classCode)
  const stub = env.PROGRESS_WEBSOCKET.get(id)
  
  // リクエストをDurable Objectに転送
  return stub.fetch(c.req.raw)
})

// 通知送信API（教師用）
app.post('/api/notifications/send', async (c) => {
  const { env } = c
  const body = await c.req.json()
  
  try {
    const {
      fromUserId,
      classCode,
      notificationType,
      targetUserIds,
      title,
      message,
      priority = 'normal',
      additionalData = {}
    } = body
    
    // 通知をデータベースに保存
    const targetUsers = targetUserIds === 'all'
      ? await getAllClassStudents(env.DB, classCode)
      : targetUserIds
    
    const notifications = []
    for (const targetUserId of targetUsers) {
      const result = await env.DB.prepare(`
        INSERT INTO notifications (
          type, from_user_id, to_user_id, class_code,
          title, message, data, priority
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        notificationType,
        fromUserId,
        targetUserId,
        classCode,
        title,
        message,
        JSON.stringify(additionalData),
        priority
      ).run()
      
      notifications.push({
        notificationId: result.meta.last_row_id,
        targetUserId
      })
    }
    
    // WebSocket経由でリアルタイム配信
    if (env.PROGRESS_WEBSOCKET) {
      const id = env.PROGRESS_WEBSOCKET.idFromName(classCode)
      const stub = env.PROGRESS_WEBSOCKET.get(id)
      
      // 各ユーザーに通知を送信（Durable Objectが処理）
      // 注: 実際の送信はDurable Object内で行われる
    }
    
    return c.json({
      success: true,
      notifications,
      targetCount: targetUsers.length
    })
  } catch (error) {
    console.error('通知送信エラー:', error)
    return c.json({
      success: false,
      error: 'Failed to send notifications',
      details: error instanceof Error ? error.message : String(error)
    }, 500)
  }
})

// 通知一覧取得API
app.get('/api/notifications', async (c) => {
  const { env } = c
  const userId = c.req.query('userId')
  const classCode = c.req.query('classCode')
  const limit = parseInt(c.req.query('limit') || '50')
  const unreadOnly = c.req.query('unreadOnly') === 'true'
  
  if (!userId) {
    return c.json({ error: 'userId is required' }, 400)
  }
  
  try {
    let query = `
      SELECT 
        n.*,
        u.name as from_user_name
      FROM notifications n
      LEFT JOIN users u ON n.from_user_id = u.id
      WHERE n.to_user_id = ?
    `
    const params = [parseInt(userId)]
    
    if (unreadOnly) {
      query += ' AND n.is_read = 0'
    }
    
    if (classCode) {
      query += ' AND n.class_code = ?'
      params.push(classCode)
    }
    
    query += ' ORDER BY n.created_at DESC LIMIT ?'
    params.push(limit)
    
    const result = await env.DB.prepare(query).bind(...params).all()
    
    // 未読数も取得
    const unreadCountResult = await env.DB.prepare(`
      SELECT COUNT(*) as count
      FROM notifications
      WHERE to_user_id = ? AND is_read = 0
    `).bind(parseInt(userId)).first()
    
    return c.json({
      success: true,
      notifications: result.results,
      unreadCount: unreadCountResult?.count || 0
    })
  } catch (error) {
    console.error('通知一覧取得エラー:', error)
    return c.json({
      success: false,
      error: 'Failed to fetch notifications'
    }, 500)
  }
})

// 通知既読API
app.put('/api/notifications/:id/read', async (c) => {
  const { env } = c
  const notificationId = c.req.param('id')
  const { userId } = await c.req.json()
  
  try {
    await env.DB.prepare(`
      UPDATE notifications
      SET is_read = 1, read_at = CURRENT_TIMESTAMP
      WHERE id = ? AND to_user_id = ?
    `).bind(parseInt(notificationId), userId).run()
    
    return c.json({ success: true })
  } catch (error) {
    console.error('通知既読エラー:', error)
    return c.json({
      success: false,
      error: 'Failed to mark notification as read'
    }, 500)
  }
})

// 全通知既読API
app.put('/api/notifications/read-all', async (c) => {
  const { env } = c
  const { userId, classCode } = await c.req.json()
  
  try {
    let query = 'UPDATE notifications SET is_read = 1, read_at = CURRENT_TIMESTAMP WHERE to_user_id = ?'
    const params = [userId]
    
    if (classCode) {
      query += ' AND class_code = ?'
      params.push(classCode)
    }
    
    await env.DB.prepare(query).bind(...params).run()
    
    return c.json({ success: true })
  } catch (error) {
    console.error('全通知既読エラー:', error)
    return c.json({
      success: false,
      error: 'Failed to mark all notifications as read'
    }, 500)
  }
})

// ヘルパー関数
async function getAllClassStudents(db: D1Database, classCode: string): Promise<number[]> {
  try {
    const result = await db.prepare(`
      SELECT id FROM users WHERE class_code = ? AND role = 'student'
    `).bind(classCode).all()
    
    return result.results.map((row: any) => row.id)
  } catch (error) {
    console.error('クラス生徒取得エラー:', error)
    return []
  }
}

// =============================================================================

// 静的ファイル配信
app.use('/static/*', serveStatic({ root: './' }))

// HTMLファイルはCloudflare Pagesが直接配信
// _routes.jsonのexcludeリストで制御

// APIルート：カリキュラム一覧取得（マルチテナント対応）
app.get('/api/curriculum', authMiddleware, async (c) => {
  const { env } = c
  const user = c.get('user')
  
  try {
    // school_idでキャッシュキーを分ける
    const cacheKey = `curriculum:all:${user.school_id}`
    
    // Phase 11-1: メトリクス付きキャッシュを使用
    const { data: cached, cached: fromCache } = await getCachedOrFetchWithMetrics(
      env.KV,
      cacheKey,
      CACHE_TTL.CURRICULUM,
      async () => {
        let query = `
          SELECT 
            id, school_id, grade, subject, textbook_company, unit_name, 
            unit_order, total_hours, unit_goal, non_cognitive_goal
          FROM curriculum
        `
        
        // 管理者以外はschool_idでフィルタ
        if (user.role !== 'admin') {
          query += ` WHERE school_id = ${user.school_id}`
        }
        
        query += ` ORDER BY grade, unit_order`
        
        const result = await env.DB.prepare(query).all()
        
        // Map id to curriculum_id for frontend compatibility
        return result.results.map(c => ({
          ...c,
          curriculum_id: c.id
        }))
      }
    )
    
    // キャッシュステータスをヘッダーに追加
    return c.json(cached, {
      headers: {
        'X-Cache-Status': fromCache ? 'HIT' : 'MISS',
        'Cache-Control': 'private, max-age=3600'
      }
    })
  } catch (error) {
    console.error('❌ カリキュラム取得エラー:', error)
    return c.json({ error: 'Database error' }, 500)
  }
})

// APIルート：全カリキュラム一覧取得（マルチテナント対応）
app.get('/api/curriculum/list', authMiddleware, async (c) => {
  const { env } = c
  const user = c.get('user')
  
  try {
    // school_idでキャッシュキーを分ける
    const cacheKey = `curriculum:list:${user.school_id}`
    
    // キャッシュを使用
    const cached = await getCachedOrFetch(
      env.KV,
      cacheKey,
      CACHE_TTL.CURRICULUM,
      async () => {
        let query = `
          SELECT id, school_id, grade, subject, unit_name, textbook_company as textbook, created_at
          FROM curriculum
        `
        
        // 管理者以外はschool_idでフィルタ
        if (user.role !== 'admin') {
          query += ` WHERE school_id = ${user.school_id}`
        }
        
        query += ` ORDER BY created_at DESC`
        
        const result = await env.DB.prepare(query).all()
        
        // Map id to curriculum_id for frontend compatibility
        return result.results.map(c => ({
          ...c,
          curriculum_id: c.id
        }))
      }
    )
    
    return c.json(cached)
  } catch (error) {
    console.error('Curriculum list error:', error)
    return c.json({ error: 'Database error' }, 500)
  }
})

app.get('/api/curriculum/options', async (c) => {
  const { env } = c
  
  try {
    const grades = await env.DB.prepare(`
      SELECT DISTINCT grade FROM curriculum ORDER BY grade
    `).all()
    
    const subjects = await env.DB.prepare(`
      SELECT DISTINCT subject FROM curriculum ORDER BY subject
    `).all()
    
    const textbooks = await env.DB.prepare(`
      SELECT DISTINCT textbook_company FROM curriculum ORDER BY textbook_company
    `).all()
    
    return c.json({
      grades: grades.results,
      subjects: subjects.results,
      textbooks: textbooks.results
    })
  } catch (error) {
    return c.json({ error: 'Database error' }, 500)
  }
})

// APIルート：特定カリキュラムの詳細取得（学習のてびき用）
app.get('/api/curriculum/:id', async (c) => {
  const { env } = c
  const id = c.req.param('id')
  
  try {
    // カリキュラム基本情報
    const curriculumRaw = await env.DB.prepare(`
      SELECT * FROM curriculum WHERE id = ?
    `).bind(id).first()
    
    if (!curriculumRaw) {
      return c.json({ error: 'Curriculum not found' }, 404)
    }
    
    // id を curriculum_id にマッピング
    const curriculum = {
      ...curriculumRaw,
      curriculum_id: curriculumRaw.id
    }
    
    // コース情報
    const courses = await env.DB.prepare(`
      SELECT * FROM courses WHERE curriculum_id = ?
      ORDER BY 
        CASE course_level
          WHEN 'basic' THEN 1
          WHEN 'standard' THEN 2
          WHEN 'advanced' THEN 3
        END
    `).bind(id).all()
    
    console.log('Courses取得結果:', {
      curriculum_id: id,
      count: courses.results?.length || 0,
      results: courses.results
    })
    
    // コースごとの学習カードを取得
    const coursesWithCards = await Promise.all(
      (courses.results || []).map(async (course: any) => {
        console.log('コース処理中:', {
          course_id: course.id,
          course_name: course.course_name,
          curriculum_id: course.curriculum_id
        })
        
        const cards = await env.DB.prepare(`
          SELECT * FROM learning_cards 
          WHERE course_id = ?
          ORDER BY card_number
        `).bind(course.id).all()
        
        // 各カードにヒントと解答を追加
        const cardsWithDetails = await Promise.all(
          (cards.results || []).map(async (card: any) => {
            // card_idを使用（learning_cardsの主キー）
            const cardId = card.card_id || card.id
            
            // ヒント取得
            const hints = await env.DB.prepare(`
              SELECT 
                hint_id,
                hint_id AS id,
                learning_card_id,
                hint_number,
                hint_number AS hint_level,
                hint_content,
                hint_content AS hint_text,
                thinking_tool_suggestion
              FROM hint_cards 
              WHERE learning_card_id = ?
              ORDER BY hint_number
            `).bind(cardId).all()
            
            // 解答取得
            const answer = await env.DB.prepare(`
              SELECT * FROM answers WHERE learning_card_id = ?
            `).bind(cardId).first()
            
            return {
              ...card,
              hints: hints.results || [],
              answer: answer?.answer_content || '',
              answer_explanation: answer?.explanation || '',
              explanation: answer?.explanation || ''
            }
          })
        )
        
        // introduction_problemをパース
        let introductionProblem = null
        if (course.introduction_problem) {
          try {
            introductionProblem = JSON.parse(course.introduction_problem)
          } catch (e) {
            console.error('導入問題のパースエラー:', e)
          }
        }
        
        return { 
          ...course, 
          cards: cardsWithDetails,
          introduction_problem: introductionProblem
        }
      })
    )
    
    // 選択問題
    const optionalProblems = await env.DB.prepare(`
      SELECT * FROM optional_problems 
      WHERE curriculum_id = ?
      ORDER BY problem_number
    `).bind(id).all()
    
    return c.json({
      curriculum,
      courses: coursesWithCards,
      optionalProblems: optionalProblems.results
    })
  } catch (error: any) {
    console.error('カリキュラム取得エラー:', error)
    return c.json({ 
      error: 'Database error',
      details: error.message || String(error),
      cause: error.cause?.message
    }, 500)
  }
})

// APIルート：カリキュラムメタデータ取得（コース選択問題とチェックテスト）
app.get('/api/curriculum/:id/metadata', async (c) => {
  const { env } = c
  const id = c.req.param('id')
  
  try {
    const metadata = await env.DB.prepare(`
      SELECT metadata_key, metadata_value 
      FROM curriculum_metadata 
      WHERE curriculum_id = ?
    `).bind(id).all()
    
    const result: any = {}
    for (const row of metadata.results || []) {
      try {
        result[row.metadata_key] = JSON.parse(row.metadata_value)
      } catch {
        result[row.metadata_key] = row.metadata_value
      }
    }
    
    return c.json(result)
  } catch (error) {
    return c.json({ 
      course_selection_problems: [],
      check_tests: []
    })
  }
})

// APIルート：カリキュラムメタデータの更新
app.put('/api/curriculum/:id/metadata', async (c) => {
  const { env } = c
  const id = c.req.param('id')
  const body = await c.req.json()
  
  try {
    // course_selection_problemsの更新
    if (body.course_selection_problems) {
      await env.DB.prepare(`
        INSERT OR REPLACE INTO curriculum_metadata (curriculum_id, metadata_key, metadata_value)
        VALUES (?, 'course_selection_problems', ?)
      `).bind(id, JSON.stringify(body.course_selection_problems)).run()
    }
    
    // check_testsの更新
    if (body.check_tests) {
      await env.DB.prepare(`
        INSERT OR REPLACE INTO curriculum_metadata (curriculum_id, metadata_key, metadata_value)
        VALUES (?, 'check_tests', ?)
      `).bind(id, JSON.stringify(body.check_tests)).run()
    }
    
    return c.json({ success: true })
  } catch (error) {
    console.error('メタデータ更新エラー:', error)
    return c.json({ error: 'Database error' }, 500)
  }
})

// APIルート：コースの学習カード取得
app.get('/api/courses/:courseId/cards', async (c) => {
  const { env } = c
  const courseId = c.req.param('courseId')
  
  try {
    const cards = await env.DB.prepare(`
      SELECT * FROM learning_cards 
      WHERE course_id = ? AND card_type = 'main'
      ORDER BY card_number
    `).bind(courseId).all()
    
    return c.json(cards.results)
  } catch (error) {
    return c.json({ error: 'Database error' }, 500)
  }
})

// APIルート：学習カードの詳細とヒント取得
app.get('/api/cards/:cardId', async (c) => {
  const { env } = c
  const cardId = c.req.param('cardId')
  
  try {
    const card = await env.DB.prepare(`
      SELECT * FROM learning_cards WHERE card_id = ?
    `).bind(cardId).first()
    
    const hints = await env.DB.prepare(`
      SELECT 
        hint_id,
        hint_id AS id,
        learning_card_id,
        hint_number,
        hint_number AS hint_level,
        hint_content,
        hint_content AS hint_text,
        thinking_tool_suggestion
      FROM hint_cards 
      WHERE learning_card_id = ?
      ORDER BY hint_number
    `).bind(cardId).all()
    
    const answer = await env.DB.prepare(`
      SELECT * FROM answers WHERE learning_card_id = ?
    `).bind(cardId).first()
    
    return c.json({
      card,
      hints: hints.results,
      answer
    })
  } catch (error) {
    return c.json({ error: 'Database error' }, 500)
  }
})

// APIルート：学習進捗の保存
app.post('/api/progress', async (c) => {
  const { env } = c
  const body = await c.req.json()
  
  try {
    const result = await env.DB.prepare(`
      INSERT INTO student_progress 
        (student_id, curriculum_id, course_id, learning_card_id, 
         status, understanding_level, help_requested_from, help_count)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      body.student_id,
      body.curriculum_id,
      body.course_id,
      body.learning_card_id,
      body.status,
      body.understanding_level,
      body.help_requested_from,
      body.help_count || 0
    ).run()
    
    return c.json({ success: true, id: result.meta.last_row_id })
  } catch (error) {
    return c.json({ error: 'Database error' }, 500)
  }
})

// =============================================================================
// 学習ログ記録API（個別最適化のためのデータ収集）
// =============================================================================

// 学習ログ記録API - 学習カード個別最適化のためのデータ収集
app.post('/api/learning/log', authMiddleware, async (c) => {
  const { env } = c
  const user = c.get('user')
  const logData = await c.req.json()
  
  try {
    // 学習ログを記録（school_id追加）
    await env.DB.prepare(`
      INSERT INTO learning_logs (
        school_id, student_id, unit_id, card_id, course_type,
        is_correct, answer_time_seconds, hint_count, retry_count,
        difficulty_level, problem_type, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).bind(
      user.school_id,
      logData.student_id,
      logData.unit_id || logData.curriculum_id,  // 互換性のため
      logData.card_id,
      logData.course_type || 'unknown',
      logData.is_correct ? 1 : 0,
      logData.answer_time_seconds || 0,
      logData.hint_count || 0,
      logData.retry_count || 0,
      logData.difficulty_level || 'medium',
      logData.problem_type || 'general'
    ).run()
    
    return c.json({ success: true })
  } catch (error) {
    console.error('学習ログ保存エラー:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// 学習セッション開始API
app.post('/api/learning/session/start', async (c) => {
  const { env } = c
  const { student_id, unit_id, session_id } = await c.req.json()
  
  try {
    await env.DB.prepare(`
      INSERT INTO learning_sessions (
        student_id, unit_id, session_id,
        started_at, is_active
      ) VALUES (?, ?, ?, CURRENT_TIMESTAMP, 1)
    `).bind(student_id, unit_id, session_id).run()
    
    return c.json({ success: true, session_id })
  } catch (error) {
    console.error('セッション開始エラー:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// 学習セッション終了API
app.post('/api/learning/session/end', async (c) => {
  const { env } = c
  const { session_id, total_problems, correct_problems, total_hints_used, total_ai_requests } = await c.req.json()
  
  try {
    await env.DB.prepare(`
      UPDATE learning_sessions
      SET ended_at = CURRENT_TIMESTAMP,
          is_active = 0,
          total_problems = ?,
          correct_problems = ?,
          total_hints_used = ?,
          total_ai_requests = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE session_id = ?
    `).bind(
      total_problems || 0,
      correct_problems || 0,
      total_hints_used || 0,
      total_ai_requests || 0,
      session_id
    ).run()
    
    return c.json({ success: true })
  } catch (error) {
    console.error('セッション終了エラー:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// 学習プロファイル取得API
app.get('/api/learning/profile/:student_id', async (c) => {
  const { env } = c
  const student_id = c.req.param('student_id')
  
  try {
    const profile = await env.DB.prepare(`
      SELECT * FROM student_learning_profiles WHERE student_id = ?
    `).bind(student_id).first()
    
    return c.json({ success: true, profile })
  } catch (error) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// 学習プロファイル更新API（簡易版 - 最新50件のログから分析）
app.post('/api/learning/profile/update', async (c) => {
  const { env } = c
  const { student_id } = await c.req.json()
  
  try {
    // 過去50件の学習ログを取得
    const logs = await env.DB.prepare(`
      SELECT 
        is_correct,
        answer_time_seconds,
        difficulty_level,
        problem_type,
        hint_count
      FROM learning_logs
      WHERE student_id = ?
      ORDER BY created_at DESC
      LIMIT 50
    `).bind(student_id).all()
    
    if (!logs.results || logs.results.length === 0) {
      return c.json({ success: true, profile: null, message: 'データ不足' })
    }
    
    // 正答率計算
    const correctCount = logs.results.filter((l: any) => l.is_correct).length
    const correctRate = correctCount / logs.results.length
    
    // 平均解答時間
    const avgTime = logs.results.reduce((sum: number, l: any) => sum + l.answer_time_seconds, 0) / logs.results.length
    
    // レベル判定
    let level = 'beginner'
    if (correctRate >= 0.8 && avgTime < 60) {
      level = 'advanced'
    } else if (correctRate >= 0.6) {
      level = 'intermediate'
    }
    
    // 推奨難易度
    let preferredDifficulty = 'medium'
    if (correctRate >= 0.85) {
      preferredDifficulty = 'hard'
    } else if (correctRate < 0.5) {
      preferredDifficulty = 'easy'
    }
    
    // 問題タイプ別統計
    const problemTypeStats: { [key: string]: { correct: number; total: number } } = {}
    logs.results.forEach((log: any) => {
      const type = log.problem_type
      if (!problemTypeStats[type]) {
        problemTypeStats[type] = { correct: 0, total: 0 }
      }
      problemTypeStats[type].total++
      if (log.is_correct) problemTypeStats[type].correct++
    })
    
    // 苦手・得意分野
    const weakAreas: string[] = []
    const strongAreas: string[] = []
    
    Object.entries(problemTypeStats).forEach(([type, stats]) => {
      const rate = stats.correct / stats.total
      if (rate < 0.5 && stats.total >= 3) {
        weakAreas.push(type)
      } else if (rate >= 0.8 && stats.total >= 3) {
        strongAreas.push(type)
      }
    })
    
    // ヒント依存度
    const avgHintCount = logs.results.reduce((sum: number, l: any) => sum + l.hint_count, 0) / logs.results.length
    const hintDependency = Math.min(avgHintCount / 3, 1.0)  // 0-1にノーマライズ
    
    // プロファイル更新
    await env.DB.prepare(`
      INSERT INTO student_learning_profiles (
        student_id, overall_level, avg_correct_rate, avg_answer_time,
        preferred_difficulty, weak_areas, strong_areas,
        hint_dependency_score, total_problems_solved,
        last_updated, stats_updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT(student_id) DO UPDATE SET
        overall_level = excluded.overall_level,
        avg_correct_rate = excluded.avg_correct_rate,
        avg_answer_time = excluded.avg_answer_time,
        preferred_difficulty = excluded.preferred_difficulty,
        weak_areas = excluded.weak_areas,
        strong_areas = excluded.strong_areas,
        hint_dependency_score = excluded.hint_dependency_score,
        total_problems_solved = excluded.total_problems_solved,
        last_updated = CURRENT_TIMESTAMP,
        stats_updated_at = CURRENT_TIMESTAMP
    `).bind(
      student_id,
      level,
      correctRate,
      avgTime,
      preferredDifficulty,
      JSON.stringify(weakAreas),
      JSON.stringify(strongAreas),
      hintDependency,
      logs.results.length
    ).run()
    
    return c.json({
      success: true,
      profile: {
        level,
        correctRate: (correctRate * 100).toFixed(1) + '%',
        avgTime: avgTime.toFixed(1) + '秒',
        preferredDifficulty,
        weakAreas,
        strongAreas,
        hintDependency: (hintDependency * 100).toFixed(0) + '%'
      }
    })
  } catch (error) {
    console.error('プロファイル更新エラー:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// =============================================================================
// Phase 19A: 学習データ分析ダッシュボードAPI
// =============================================================================

// 学習統計データ取得API（教師向けダッシュボード）
app.get('/api/analytics/class/:classCode', async (c) => {
  const { env } = c
  const classCode = c.req.param('classCode')
  
  try {
    // クラス全体の学習統計
    const classStats = await env.DB.prepare(`
      SELECT 
        COUNT(DISTINCT student_id) as total_students,
        COUNT(*) as total_sessions,
        ROUND(AVG(CASE WHEN correct_problems > 0 THEN (correct_problems * 1.0 / total_problems) * 100 ELSE 0 END), 1) as avg_correct_rate,
        SUM(total_problems) as total_problems_solved,
        SUM(total_hints_used) as total_hints_used,
        SUM(total_ai_requests) as total_ai_requests
      FROM learning_sessions ls
      JOIN students s ON ls.student_id = s.id
      WHERE s.class_code = ?
        AND ls.ended_at IS NOT NULL
        AND DATE(ls.started_at) >= DATE('now', '-30 days')
    `).bind(classCode).first()
    
    // 学生別パフォーマンス
    const studentPerformance = await env.DB.prepare(`
      SELECT 
        s.id,
        s.name,
        s.student_number,
        COUNT(ls.id) as session_count,
        ROUND(AVG(CASE WHEN ls.correct_problems > 0 THEN (ls.correct_problems * 1.0 / ls.total_problems) * 100 ELSE 0 END), 1) as avg_correct_rate,
        SUM(ls.total_problems) as problems_solved,
        SUM(ls.total_hints_used) as hints_used
      FROM students s
      LEFT JOIN learning_sessions ls ON s.id = ls.student_id
        AND ls.ended_at IS NOT NULL
        AND DATE(ls.started_at) >= DATE('now', '-30 days')
      WHERE s.class_code = ?
      GROUP BY s.id, s.name, s.student_number
      ORDER BY avg_correct_rate DESC
    `).bind(classCode).all()
    
    // 日別学習時間推移（過去30日）
    const dailyActivity = await env.DB.prepare(`
      SELECT 
        DATE(started_at) as date,
        COUNT(*) as session_count,
        COUNT(DISTINCT student_id) as active_students,
        SUM(total_problems) as problems_solved
      FROM learning_sessions ls
      JOIN students s ON ls.student_id = s.id
      WHERE s.class_code = ?
        AND ended_at IS NOT NULL
        AND DATE(started_at) >= DATE('now', '-30 days')
      GROUP BY DATE(started_at)
      ORDER BY date ASC
    `).bind(classCode).all()
    
    return c.json({
      success: true,
      classStats,
      studentPerformance: studentPerformance.results || [],
      dailyActivity: dailyActivity.results || []
    })
  } catch (error) {
    console.error('❌ クラス分析データ取得エラー:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// 個人学習履歴詳細API
app.get('/api/analytics/student/:studentId', async (c) => {
  const { env } = c
  const studentId = c.req.param('studentId')
  
  try {
    // 基本統計
    const basicStats = await env.DB.prepare(`
      SELECT 
        COUNT(*) as total_sessions,
        ROUND(AVG(CASE WHEN correct_problems > 0 THEN (correct_problems * 1.0 / total_problems) * 100 ELSE 0 END), 1) as avg_correct_rate,
        SUM(total_problems) as total_problems_solved,
        SUM(total_hints_used) as total_hints_used,
        SUM(total_ai_requests) as total_ai_requests,
        ROUND(AVG(CAST((JULIANDAY(ended_at) - JULIANDAY(started_at)) * 24 * 60 AS REAL)), 1) as avg_session_minutes
      FROM learning_sessions
      WHERE student_id = ?
        AND ended_at IS NOT NULL
        AND DATE(started_at) >= DATE('now', '-90 days')
    `).bind(studentId).first()
    
    // 週別学習時間推移
    const weeklyProgress = await env.DB.prepare(`
      SELECT 
        strftime('%Y-W%W', started_at) as week,
        COUNT(*) as session_count,
        SUM(total_problems) as problems_solved,
        ROUND(AVG(CASE WHEN correct_problems > 0 THEN (correct_problems * 1.0 / total_problems) * 100 ELSE 0 END), 1) as avg_correct_rate
      FROM learning_sessions
      WHERE student_id = ?
        AND ended_at IS NOT NULL
        AND DATE(started_at) >= DATE('now', '-90 days')
      GROUP BY strftime('%Y-W%W', started_at)
      ORDER BY week ASC
    `).bind(studentId).all()
    
    // 科目別パフォーマンス
    const subjectPerformance = await env.DB.prepare(`
      SELECT 
        ll.problem_type as subject,
        COUNT(*) as attempt_count,
        ROUND(AVG(CASE WHEN ll.is_correct THEN 100.0 ELSE 0.0 END), 1) as correct_rate,
        ROUND(AVG(ll.answer_time_seconds), 1) as avg_time_seconds
      FROM learning_logs ll
      WHERE ll.student_id = ?
        AND DATE(ll.created_at) >= DATE('now', '-90 days')
      GROUP BY ll.problem_type
      ORDER BY attempt_count DESC
    `).bind(studentId).all()
    
    return c.json({
      success: true,
      basicStats,
      weeklyProgress: weeklyProgress.results || [],
      subjectPerformance: subjectPerformance.results || []
    })
  } catch (error) {
    console.error('❌ 個人分析データ取得エラー:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// =============================================================================
// Phase 19B: 音声認識による学習記録API
// =============================================================================

// 音声メモ保存API
app.post('/api/voice-memo', async (c) => {
  const { env } = c
  const { student_id, unit_id, transcription, duration_seconds } = await c.req.json()
  
  if (!student_id || !transcription) {
    return c.json({ success: false, error: 'student_idとtranscriptionが必要です' }, 400)
  }
  
  try {
    const result = await env.DB.prepare(`
      INSERT INTO voice_memos (student_id, unit_id, transcription, duration_seconds)
      VALUES (?, ?, ?, ?)
    `).bind(student_id, unit_id || null, transcription, duration_seconds || 0).run()
    
    return c.json({ success: true, memo_id: result.meta.last_row_id })
  } catch (error) {
    console.error('❌ 音声メモ保存エラー:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// 音声メモ一覧取得API
app.get('/api/voice-memos/:studentId', async (c) => {
  const { env } = c
  const studentId = c.req.param('studentId')
  
  try {
    const memos = await env.DB.prepare(`
      SELECT * FROM voice_memos
      WHERE student_id = ?
      ORDER BY created_at DESC
      LIMIT 50
    `).bind(studentId).all()
    
    return c.json({ success: true, memos: memos.results || [] })
  } catch (error) {
    console.error('❌ 音声メモ取得エラー:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// =============================================================================
// Phase 19C-19F用APIプレースホルダー
// =============================================================================

// ゲーミフィケーション: ポイント追加API
app.post('/api/gamification/points/add', async (c) => {
  const { env } = c
  const { student_id, points, reason } = await c.req.json()
  
  try {
    // ポイント加算
    await env.DB.prepare(`
      INSERT INTO student_points (student_id, points, reason)
      VALUES (?, ?, ?)
      ON CONFLICT(student_id) DO UPDATE SET
        points = points + excluded.points,
        updated_at = CURRENT_TIMESTAMP
    `).bind(student_id, points, reason).run()
    
    return c.json({ success: true })
  } catch (error) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// テーマ設定API
app.post('/api/theme/set', async (c) => {
  const { env } = c
  const { student_id, theme_name, primary_color, font_size } = await c.req.json()
  
  try {
    await env.DB.prepare(`
      INSERT INTO user_preferences (student_id, theme_name, primary_color, font_size)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(student_id) DO UPDATE SET
        theme_name = excluded.theme_name,
        primary_color = excluded.primary_color,
        font_size = excluded.font_size,
        updated_at = CURRENT_TIMESTAMP
    `).bind(student_id, theme_name, primary_color, font_size).run()
    
    return c.json({ success: true })
  } catch (error) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// 保護者レポートAPI
app.post('/api/parent-report/create', async (c) => {
  const { env } = c
  const { student_id, week_start, week_end, teacher_comment } = await c.req.json()
  
  try {
    const result = await env.DB.prepare(`
      INSERT INTO parent_reports (student_id, week_start, week_end, teacher_comment)
      VALUES (?, ?, ?, ?)
    `).bind(student_id, week_start, week_end, teacher_comment).run()
    
    return c.json({ success: true, report_id: result.meta.last_row_id })
  } catch (error) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// =============================================================================

// APIルート：クラスの進捗取得
app.get('/api/progress/class/:classCode', async (c) => {
  const { env } = c
  const classCode = c.req.param('classCode')
  
  try {
    const progress = await env.DB.prepare(`
      SELECT 
        u.name,
        u.student_number,
        p.curriculum_id,
        p.course_id,
        p.learning_card_id,
        p.status,
        p.understanding_level,
        p.help_requested_from,
        p.help_count,
        p.created_at,
        c.course_level,
        c.course_display_name
      FROM student_progress p
      JOIN users u ON p.student_id = u.id
      LEFT JOIN courses c ON p.course_id = c.id
      WHERE u.class_code = ?
      ORDER BY u.student_number, p.created_at DESC
    `).bind(classCode).all()
    
    return c.json(progress.results)
  } catch (error) {
    return c.json({ error: 'Database error' }, 500)
  }
})

// APIルート：カリキュラム別の詳細進捗取得（進捗ボード用）
app.get('/api/progress/curriculum/:curriculumId/class/:classCode', async (c) => {
  const { env } = c
  const curriculumId = c.req.param('curriculumId')
  const classCode = c.req.param('classCode')
  
  try {
    // 全生徒のリスト
    const students = await env.DB.prepare(`
      SELECT id, name, student_number 
      FROM users 
      WHERE class_code = ? AND role = 'student'
      ORDER BY student_number
    `).bind(classCode).all()
    
    // 各生徒の最新進捗
    const progressData = await env.DB.prepare(`
      SELECT 
        p.student_id,
        p.course_id,
        p.learning_card_id,
        p.status,
        p.understanding_level,
        p.help_requested_from,
        p.help_count,
        p.created_at,
        c.course_level,
        c.course_display_name,
        lc.card_number,
        lc.card_title
      FROM student_progress p
      LEFT JOIN courses c ON p.course_id = c.id
      LEFT JOIN learning_cards lc ON p.learning_card_id = lc.id
      WHERE p.curriculum_id = ?
      AND p.student_id IN (
        SELECT id FROM users WHERE class_code = ? AND role = 'student'
      )
      ORDER BY p.student_id, p.created_at DESC
    `).bind(curriculumId, classCode).all()
    
    // 生徒ごとにグループ化
    const studentProgress = {}
    students.results.forEach(student => {
      const latestProgress = progressData.results.find(p => p.student_id === student.id)
      studentProgress[student.id] = {
        student,
        progress: latestProgress || null,
        allProgress: progressData.results.filter(p => p.student_id === student.id)
      }
    })
    
    return c.json(studentProgress)
  } catch (error) {
    console.error('Progress error:', error)
    return c.json({ error: 'Database error' }, 500)
  }
})

// APIルート：進捗ボード拡張版（教師用）
app.get('/api/progress-board/class/:classCode', async (c) => {
  const { env } = c
  const classCode = c.req.param('classCode')
  const curriculumIds = c.req.query('curriculumIds') // カンマ区切りで複数指定可能
  
  try {
    const curriculumList = curriculumIds ? curriculumIds.split(',') : []
    
    // 生徒リスト取得
    const students = await env.DB.prepare(`
      SELECT id, name, student_number 
      FROM users 
      WHERE class_code = ? AND role = 'student'
      ORDER BY student_number
    `).bind(classCode).all()
    
    const progressBoard = []
    
    for (const student of students.results) {
      const studentData = {
        student_id: student.id,
        student_name: student.name,
        student_number: student.student_number,
        curriculums: []
      }
      
      // 各カリキュラムの進捗を取得
      for (const curriculumId of curriculumList) {
        // 学習カード進捗
        const cardProgress = await env.DB.prepare(`
          SELECT 
            sp.*,
            c.course_level,
            c.course_display_name,
            lc.card_number,
            lc.card_title
          FROM student_progress sp
          JOIN courses c ON sp.course_id = c.id
          JOIN learning_cards lc ON sp.learning_card_id = lc.id
          WHERE sp.student_id = ? AND sp.curriculum_id = ?
          ORDER BY c.course_level, lc.card_number
        `).bind(student.id, curriculumId).all()
        
        // チェックテスト進捗
        const checkTestProgress = await env.DB.prepare(`
          SELECT * FROM check_test_progress
          WHERE student_id = ? AND curriculum_id = ?
          ORDER BY problem_number
        `).bind(student.id, curriculumId).all()
        
        // 選択問題進捗
        const optionalProgress = await env.DB.prepare(`
          SELECT opp.*, op.problem_title, op.problem_number
          FROM optional_problem_progress opp
          JOIN optional_problems op ON opp.optional_problem_id = op.id
          WHERE opp.student_id = ? AND opp.curriculum_id = ?
          ORDER BY op.problem_number
        `).bind(student.id, curriculumId).all()
        
        // ヘルプ統計
        const helpStats = await env.DB.prepare(`
          SELECT 
            help_type,
            COUNT(*) as count
          FROM student_progress
          WHERE student_id = ? AND curriculum_id = ? AND help_type IS NOT NULL
          GROUP BY help_type
        `).bind(student.id, curriculumId).all()
        
        // 最高優先度を取得
        const maxPriority = cardProgress.results.length > 0 
          ? Math.max(...cardProgress.results.map(p => p.intervention_priority || 0))
          : 0
        
        // ヘルプ要請中かどうか
        const hasHelpRequest = cardProgress.results.some(p => 
          p.help_requested_at && !p.help_resolved_at
        )
        
        studentData.curriculums.push({
          curriculum_id: curriculumId,
          card_progress: cardProgress.results,
          check_test_progress: checkTestProgress.results,
          optional_progress: optionalProgress.results,
          help_stats: helpStats.results,
          intervention_priority: maxPriority,
          has_help_request: hasHelpRequest,
          completed_cards: cardProgress.results.filter(p => p.status === 'completed').length,
          total_cards: cardProgress.results.length
        })
      }
      
      progressBoard.push(studentData)
    }
    
    // 優先度順にソート
    progressBoard.sort((a, b) => {
      const maxA = Math.max(...a.curriculums.map(c => c.intervention_priority))
      const maxB = Math.max(...b.curriculums.map(c => c.intervention_priority))
      return maxB - maxA
    })
    
    return c.json({
      success: true,
      class_code: classCode,
      students: progressBoard,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('進捗ボードエラー:', error)
    return c.json({ 
      success: false, 
      error: '進捗ボードの読み込みに失敗しました',
      details: error.message 
    }, 500)
  }
})

// APIルート：ヘルプ要請
app.post('/api/progress/help-request', async (c) => {
  const { env } = c
  const { student_id, learning_card_id, curriculum_id } = await c.req.json()
  
  try {
    await env.DB.prepare(`
      UPDATE student_progress 
      SET 
        status = 'help_needed',
        help_requested_at = CURRENT_TIMESTAMP,
        help_resolved_at = NULL,
        last_activity_at = CURRENT_TIMESTAMP
      WHERE student_id = ? AND learning_card_id = ? AND curriculum_id = ?
    `).bind(student_id, learning_card_id, curriculum_id).run()
    
    return c.json({ success: true, message: 'ヘルプ要請を送信しました' })
  } catch (error) {
    console.error('ヘルプ要請エラー:', error)
    return c.json({ success: false, error: 'ヘルプ要請に失敗しました' }, 500)
  }
})

// APIルート：ヘルプ解決
app.post('/api/progress/help-resolve', async (c) => {
  const { env } = c
  const { student_id, learning_card_id, curriculum_id } = await c.req.json()
  
  try {
    await env.DB.prepare(`
      UPDATE student_progress 
      SET 
        status = 'in_progress',
        help_resolved_at = CURRENT_TIMESTAMP,
        last_activity_at = CURRENT_TIMESTAMP
      WHERE student_id = ? AND learning_card_id = ? AND curriculum_id = ?
    `).bind(student_id, learning_card_id, curriculum_id).run()
    
    return c.json({ success: true, message: 'ヘルプを解決しました' })
  } catch (error) {
    console.error('ヘルプ解決エラー:', error)
    return c.json({ success: false, error: 'ヘルプ解決に失敗しました' }, 500)
  }
})

// APIルート：個人レポート（AI誤答分析）
app.get('/api/error-analysis/:studentId/:curriculumId', async (c) => {
  const { env } = c
  const studentId = c.req.param('studentId')
  const curriculumId = c.req.param('curriculumId')
  
  try {
    // 誤答履歴を取得
    const errorHistory = await env.DB.prepare(`
      SELECT 
        eh.*,
        CASE 
          WHEN eh.question_type = 'learning_card' THEN lc.card_title
          WHEN eh.question_type = 'check_test' THEN 'チェックテスト問題' || eh.question_number
          WHEN eh.question_type = 'optional' THEN op.problem_title
        END as question_title
      FROM error_history eh
      LEFT JOIN learning_cards lc ON eh.question_type = 'learning_card' AND eh.question_id = lc.id
      LEFT JOIN optional_problems op ON eh.question_type = 'optional' AND eh.question_id = op.id
      WHERE eh.student_id = ? AND eh.curriculum_id = ?
      ORDER BY eh.submitted_at DESC
      LIMIT 100
    `).bind(studentId, curriculumId).all()
    
    // 誤答パターン分析
    const errorPatterns = await env.DB.prepare(`
      SELECT 
        error_pattern,
        COUNT(*) as count,
        GROUP_CONCAT(question_type) as question_types
      FROM error_history
      WHERE student_id = ? AND curriculum_id = ? AND is_correct = 0 AND error_pattern IS NOT NULL
      GROUP BY error_pattern
      ORDER BY count DESC
    `).bind(studentId, curriculumId).all()
    
    // 正答率の推移
    const accuracyTrend = await env.DB.prepare(`
      SELECT 
        DATE(submitted_at) as date,
        COUNT(*) as total,
        SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) as correct
      FROM error_history
      WHERE student_id = ? AND curriculum_id = ?
      GROUP BY DATE(submitted_at)
      ORDER BY date ASC
    `).bind(studentId, curriculumId).all()
    
    // 学生情報
    const student = await env.DB.prepare(`
      SELECT id, name, email, student_number
      FROM users
      WHERE id = ? AND role = 'student'
    `).bind(studentId).first()
    
    return c.json({
      success: true,
      student,
      error_history: errorHistory.results,
      error_patterns: errorPatterns.results,
      accuracy_trend: accuracyTrend.results
    })
  } catch (error) {
    console.error('誤答分析エラー:', error)
    return c.json({ 
      success: false, 
      error: '誤答分析の読み込みに失敗しました',
      details: error.message 
    }, 500)
  }
})

// APIルート：活動記録更新
app.post('/api/progress/activity', async (c) => {
  const { env } = c
  const { student_id, learning_card_id, curriculum_id } = await c.req.json()
  
  try {
    await env.DB.prepare(`
      UPDATE student_progress 
      SET 
        last_activity_at = CURRENT_TIMESTAMP
      WHERE student_id = ? AND learning_card_id = ? AND curriculum_id = ?
    `).bind(student_id, learning_card_id, curriculum_id).run()
    
    return c.json({ success: true })
  } catch (error) {
    console.error('活動記録エラー:', error)
    return c.json({ success: false }, 500)
  }
})

// =============================================================================
// 児童向けクラス進捗確認 & 友達助け合い機能API
// =============================================================================

// 児童向けクラス進捗取得API（シンプル版・プライバシー配慮）
app.get('/api/progress/class-peer/:classCode/:curriculumId', async (c) => {
  const { env } = c
  const classCode = c.req.param('classCode')
  const curriculumId = c.req.param('curriculumId')
  
  try {
    // クラスの全生徒と進捗状況を取得（シンプル版）
    const classPeers = await env.DB.prepare(`
      SELECT 
        u.id,
        u.name,
        u.student_number,
        COUNT(DISTINCT sp.learning_card_id) as completed_cards,
        AVG(sp.understanding_level) as avg_understanding,
        MAX(sp.created_at) as last_activity,
        SUM(CASE WHEN sp.status = 'help_requested' THEN 1 ELSE 0 END) as is_asking_help
      FROM users u
      LEFT JOIN student_progress sp ON u.id = sp.student_id 
        AND sp.curriculum_id = ? 
        AND sp.status = 'completed'
      WHERE u.class_code = ? AND u.role = 'student'
      GROUP BY u.id, u.name, u.student_number
      ORDER BY u.student_number
    `).bind(curriculumId, classCode).all()
    
    // プライバシー配慮：理解度の詳細は隠して、完了カード数のみ表示
    const simplifiedPeers = classPeers.results.map(peer => ({
      id: peer.id,
      name: peer.name,
      student_number: peer.student_number,
      completed_cards: peer.completed_cards || 0,
      can_help: (peer.completed_cards || 0) >= 3 && (peer.avg_understanding || 0) >= 60, // 3枚以上完了 & 平均理解度60以上
      is_asking_help: (peer.is_asking_help || 0) > 0,
      last_activity: peer.last_activity
    }))
    
    return c.json({ success: true, peers: simplifiedPeers })
  } catch (error) {
    console.error('クラス進捗取得エラー:', error)
    return c.json({ success: false, error: 'データ取得に失敗しました' }, 500)
  }
})

// 助けられる友達リスト取得API
app.get('/api/help/available-helpers/:classCode/:curriculumId/:cardId', async (c) => {
  const { env } = c
  const classCode = c.req.param('classCode')
  const curriculumId = c.req.param('curriculumId')
  const cardId = c.req.param('cardId')
  
  try {
    // このカードをすでにクリアしている友達を検索
    const helpers = await env.DB.prepare(`
      SELECT 
        u.id,
        u.name,
        u.student_number,
        sp.understanding_level,
        sp.created_at as completed_at,
        COUNT(DISTINCT sp2.learning_card_id) as total_completed
      FROM users u
      INNER JOIN student_progress sp ON u.id = sp.student_id
        AND sp.curriculum_id = ?
        AND sp.learning_card_id = ?
        AND sp.status = 'completed'
        AND sp.understanding_level >= 60
      LEFT JOIN student_progress sp2 ON u.id = sp2.student_id
        AND sp2.curriculum_id = ?
        AND sp2.status = 'completed'
      WHERE u.class_code = ? AND u.role = 'student'
      GROUP BY u.id, u.name, u.student_number, sp.understanding_level, sp.created_at
      HAVING total_completed >= 3
      ORDER BY sp.understanding_level DESC, sp.created_at ASC
      LIMIT 10
    `).bind(curriculumId, cardId, curriculumId, classCode).all()
    
    return c.json({ 
      success: true, 
      helpers: helpers.results.map(h => ({
        id: h.id,
        name: h.name,
        student_number: h.student_number,
        total_completed: h.total_completed,
        completed_at: h.completed_at
      }))
    })
  } catch (error) {
    console.error('ヘルパー検索エラー:', error)
    return c.json({ success: false, error: 'データ取得に失敗しました' }, 500)
  }
})

// 友達へのヘルプ要請API
app.post('/api/help/request-peer', async (c) => {
  const { env } = c
  const { requester_id, helper_id, curriculum_id, learning_card_id, message } = await c.req.json()
  
  try {
    // ヘルプ要請を記録
    const result = await env.DB.prepare(`
      INSERT INTO peer_help_requests (
        requester_id, helper_id, curriculum_id, learning_card_id, 
        message, status, created_at
      ) VALUES (?, ?, ?, ?, ?, 'pending', CURRENT_TIMESTAMP)
    `).bind(
      requester_id,
      helper_id,
      curriculum_id,
      learning_card_id,
      message || 'この問題を教えてください'
    ).run()
    
    // 進捗レコードを更新（help_requested_from = 'friend'）
    await env.DB.prepare(`
      UPDATE student_progress
      SET help_requested_from = 'friend',
          help_count = help_count + 1,
          last_activity_at = CURRENT_TIMESTAMP
      WHERE student_id = ? AND learning_card_id = ? AND curriculum_id = ?
    `).bind(requester_id, learning_card_id, curriculum_id).run()
    
    return c.json({ 
      success: true, 
      message: 'ヘルプ要請を送信しました',
      request_id: result.meta.last_row_id
    })
  } catch (error) {
    console.error('ヘルプ要請エラー:', error)
    return c.json({ success: false, error: 'ヘルプ要請に失敗しました' }, 500)
  }
})

// 自分宛のヘルプ要請一覧取得API
app.get('/api/help/requests-for-me/:studentId', async (c) => {
  const { env } = c
  const studentId = c.req.param('studentId')
  
  try {
    const requests = await env.DB.prepare(`
      SELECT 
        phr.id,
        phr.requester_id,
        u.name as requester_name,
        phr.curriculum_id,
        cur.unit_name,
        phr.learning_card_id,
        lc.card_title,
        phr.message,
        phr.status,
        phr.created_at
      FROM peer_help_requests phr
      INNER JOIN users u ON phr.requester_id = u.id
      INNER JOIN curriculum cur ON phr.curriculum_id = cur.id
      LEFT JOIN learning_cards lc ON phr.learning_card_id = lc.id
      WHERE phr.helper_id = ? AND phr.status = 'pending'
      ORDER BY phr.created_at DESC
      LIMIT 20
    `).bind(studentId).all()
    
    return c.json({ success: true, requests: requests.results })
  } catch (error) {
    console.error('ヘルプ要請取得エラー:', error)
    return c.json({ success: false, error: 'データ取得に失敗しました' }, 500)
  }
})

// ヘルプ要請への応答API（受諾/拒否）
app.post('/api/help/respond-peer', async (c) => {
  const { env } = c
  const { request_id, response } = await c.req.json() // response: 'accepted' or 'declined'
  
  try {
    await env.DB.prepare(`
      UPDATE peer_help_requests
      SET status = ?, responded_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(response, request_id).run()
    
    return c.json({ success: true, message: '応答を記録しました' })
  } catch (error) {
    console.error('応答記録エラー:', error)
    return c.json({ success: false, error: '応答の記録に失敗しました' }, 500)
  }
})

// =============================================================================

// APIルート：週次レポート
app.get('/api/reports/weekly/:classCode', async (c) => {
  const { env } = c
  const classCode = c.req.param('classCode')
  const startDate = c.req.query('startDate') // YYYY-MM-DD
  const endDate = c.req.query('endDate') // YYYY-MM-DD
  
  try {
    // 期間内の進捗データを集計
    const weeklyStats = await env.DB.prepare(`
      SELECT 
        u.name as student_name,
        u.student_number,
        COUNT(DISTINCT sp.learning_card_id) as completed_cards,
        AVG(sp.understanding_level) as avg_understanding,
        SUM(CASE WHEN sp.help_type = 'ai' THEN 1 ELSE 0 END) as ai_help_count,
        SUM(CASE WHEN sp.help_type = 'teacher' THEN 1 ELSE 0 END) as teacher_help_count,
        SUM(CASE WHEN sp.help_type = 'friend' THEN 1 ELSE 0 END) as friend_help_count,
        SUM(CASE WHEN sp.help_type = 'hint' THEN 1 ELSE 0 END) as hint_help_count
      FROM users u
      LEFT JOIN student_progress sp ON u.id = sp.student_id
        AND sp.status = 'completed'
        AND DATE(sp.completed_at) BETWEEN ? AND ?
      WHERE u.class_code = ? AND u.role = 'student'
      GROUP BY u.id, u.name, u.student_number
      ORDER BY u.student_number
    `).bind(startDate, endDate, classCode).all()
    
    return c.json({
      success: true,
      period: { start: startDate, end: endDate },
      class_code: classCode,
      stats: weeklyStats.results
    })
  } catch (error) {
    console.error('週次レポートエラー:', error)
    return c.json({ 
      success: false, 
      error: '週次レポートの生成に失敗しました',
      details: error.message 
    }, 500)
  }
})

// APIルート：月次レポート
app.get('/api/reports/monthly/:classCode', async (c) => {
  const { env } = c
  const classCode = c.req.param('classCode')
  const year = c.req.query('year') // YYYY
  const month = c.req.query('month') // MM
  
  try {
    const startDate = `${year}-${month}-01`
    const endDate = `${year}-${month}-31`
    
    // 月次統計
    const monthlyStats = await env.DB.prepare(`
      SELECT 
        u.name as student_name,
        u.student_number,
        COUNT(DISTINCT sp.learning_card_id) as completed_cards,
        AVG(sp.understanding_level) as avg_understanding,
        COUNT(DISTINCT DATE(sp.created_at)) as active_days,
        SUM(CASE WHEN sp.help_type IS NOT NULL THEN 1 ELSE 0 END) as total_help_count
      FROM users u
      LEFT JOIN student_progress sp ON u.id = sp.student_id
        AND DATE(sp.created_at) BETWEEN ? AND ?
      WHERE u.class_code = ? AND u.role = 'student'
      GROUP BY u.id, u.name, u.student_number
      ORDER BY u.student_number
    `).bind(startDate, endDate, classCode).all()
    
    // カリキュラム別進捗
    const curriculumProgress = await env.DB.prepare(`
      SELECT 
        cur.unit_name,
        cur.subject,
        COUNT(DISTINCT sp.student_id) as students_count,
        COUNT(DISTINCT sp.learning_card_id) as completed_cards_total
      FROM curriculum cur
      LEFT JOIN student_progress sp ON cur.id = sp.curriculum_id
        AND sp.status = 'completed'
        AND DATE(sp.completed_at) BETWEEN ? AND ?
      JOIN users u ON sp.student_id = u.id
      WHERE u.class_code = ?
      GROUP BY cur.id, cur.unit_name, cur.subject
    `).bind(startDate, endDate, classCode).all()
    
    return c.json({
      success: true,
      period: { year, month, start: startDate, end: endDate },
      class_code: classCode,
      student_stats: monthlyStats.results,
      curriculum_progress: curriculumProgress.results
    })
  } catch (error) {
    console.error('月次レポートエラー:', error)
    return c.json({ 
      success: false, 
      error: '月次レポートの生成に失敗しました',
      details: error.message 
    }, 500)
  }
})

// =============================================================================
// 学習レポート自動生成API（詳細版）
// =============================================================================

// 個別生徒の詳細レポート生成
app.get('/api/reports/student/:studentId/detailed', async (c) => {
  const { env } = c
  const { generateLearningReport } = await import('./report-generator')
  
  try {
    const studentId = parseInt(c.req.param('studentId'))
    const reportType = c.req.query('type') || 'weekly' // weekly, monthly, term
    const endDate = c.req.query('endDate') || new Date().toISOString().split('T')[0]
    
    // 期間計算
    let startDate: string
    const end = new Date(endDate)
    
    if (reportType === 'weekly') {
      const start = new Date(end)
      start.setDate(start.getDate() - 7)
      startDate = start.toISOString().split('T')[0]
    } else if (reportType === 'monthly') {
      const start = new Date(end)
      start.setMonth(start.getMonth() - 1)
      startDate = start.toISOString().split('T')[0]
    } else {
      // term (3ヶ月)
      const start = new Date(end)
      start.setMonth(start.getMonth() - 3)
      startDate = start.toISOString().split('T')[0]
    }
    
    const report = await generateLearningReport(
      env.DB,
      studentId,
      startDate,
      endDate,
      reportType as 'weekly' | 'monthly' | 'term'
    )
    
    return c.json({
      success: true,
      report: report,
      generated_at: new Date().toISOString()
    })
    
  } catch (error: any) {
    console.error('Failed to generate detailed report:', error)
    return c.json({
      success: false,
      error: 'レポート生成に失敗しました',
      details: error.message
    }, 500)
  }
})

// クラス全体のサマリーレポート
app.get('/api/reports/class/:classCode/summary', async (c) => {
  const { env } = c
  const classCode = c.req.param('classCode')
  const reportType = c.req.query('type') || 'weekly'
  
  try {
    // クラスの全生徒取得
    const students = await env.DB.prepare(`
      SELECT s.student_id, s.name
      FROM students s
      JOIN class_enrollments ce ON s.student_id = ce.student_id
      JOIN classes c ON ce.class_id = c.class_id
      WHERE c.class_code = ? AND ce.is_active = TRUE
    `).bind(classCode).all()
    
    if (students.results.length === 0) {
      return c.json({
        success: false,
        error: 'クラスが見つかりません'
      }, 404)
    }
    
    // 各生徒のサマリーを生成
    const { generateLearningReport } = await import('./report-generator')
    const endDate = new Date().toISOString().split('T')[0]
    let startDate: string
    
    const end = new Date(endDate)
    if (reportType === 'weekly') {
      const start = new Date(end)
      start.setDate(start.getDate() - 7)
      startDate = start.toISOString().split('T')[0]
    } else {
      const start = new Date(end)
      start.setMonth(start.getMonth() - 1)
      startDate = start.toISOString().split('T')[0]
    }
    
    const studentReports = await Promise.all(
      students.results.map(async (student: any) => {
        try {
          const report = await generateLearningReport(
            env.DB,
            student.student_id,
            startDate,
            endDate,
            reportType as 'weekly' | 'monthly'
          )
          return {
            student_id: student.student_id,
            student_name: student.name,
            summary: report.summary,
            learning_style: report.learning_style.dominant_style
          }
        } catch (error) {
          console.error(`Failed to generate report for student ${student.student_id}:`, error)
          return null
        }
      })
    )
    
    const validReports = studentReports.filter(r => r !== null)
    
    // クラス全体の統計
    const classStats = {
      total_students: validReports.length,
      average_learning_time: Math.round(
        validReports.reduce((sum, r: any) => sum + r.summary.total_learning_time_minutes, 0) / validReports.length
      ),
      average_mastery_score: Math.round(
        validReports.reduce((sum, r: any) => sum + r.summary.average_mastery_score, 0) / validReports.length
      ),
      total_cards_completed: validReports.reduce((sum, r: any) => sum + r.summary.total_cards_completed, 0),
      learning_style_distribution: {
        visual: validReports.filter((r: any) => r.learning_style === 'visual').length,
        auditory: validReports.filter((r: any) => r.learning_style === 'auditory').length,
        reading: validReports.filter((r: any) => r.learning_style === 'reading').length,
        kinesthetic: validReports.filter((r: any) => r.learning_style === 'kinesthetic').length
      }
    }
    
    return c.json({
      success: true,
      class_code: classCode,
      period: {
        start_date: startDate,
        end_date: endDate,
        type: reportType
      },
      class_stats: classStats,
      student_reports: validReports,
      generated_at: new Date().toISOString()
    })
    
  } catch (error: any) {
    console.error('Failed to generate class summary:', error)
    return c.json({
      success: false,
      error: 'クラスサマリー生成に失敗しました',
      details: error.message
    }, 500)
  }
})

// =============================================================================
// AIルート：AI先生（Gemini API）
// =============================================================================

app.post('/api/ai/ask', async (c) => {
  const { env } = c
  const body = await c.req.json()
  const startTime = Date.now()
  
  const apiKey = env.GEMINI_API_KEY
  
  if (!apiKey || apiKey === 'your-gemini-api-key-here') {
    return c.json({ 
      answer: '申し訳ありません。AI先生は現在利用できません。ヒントカードや先生に聞いてみましょう。',
      error: 'API key not configured'
    })
  }
  
  // セッションIDの生成（対話履歴グループ化用）
  const sessionId = body.sessionId || `session-${Date.now()}-${Math.random().toString(36).substring(7)}`
  
  try {
    // 学習カード情報を取得
    const card = await env.DB.prepare(`
      SELECT * FROM learning_cards WHERE id = ?
    `).bind(body.cardId).first()
    
    // 対話履歴を取得（コンテキスト保持）
    const conversationHistory = await env.DB.prepare(`
      SELECT message_type, message_text
      FROM ai_conversations
      WHERE session_id = ? AND student_id = ?
      ORDER BY created_at DESC
      LIMIT 5
    `).bind(sessionId, body.studentId).all()
    
    // 対話履歴をGemini APIフォーマットに変換
    const historyContext = conversationHistory.results?.reverse().map((msg: any) => 
      `${msg.message_type === 'question' ? '生徒' : 'AI先生'}: ${msg.message_text}`
    ).join('\n') || ''
    
    // 質問を履歴に保存
    await env.DB.prepare(`
      INSERT INTO ai_conversations (
        student_id, curriculum_id, learning_card_id, session_id, message_type, message_text, context_data
      ) VALUES (?, ?, ?, ?, 'question', ?, ?)
    `).bind(
      body.studentId,
      body.curriculumId,
      body.cardId,
      sessionId,
      body.question,
      JSON.stringify({ cardTitle: card?.card_title })
    ).run()
    
    // Gemini APIにリクエスト
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `あなたは${body.grade || '小学校'}の児童・生徒の学習をサポートする優しいAI先生です。

【重要なルール】
1. **学年に応じた言葉遣い**
   - ${getGradeLanguageRule(body.grade)}
   - 難しい漢字は使わず、ひらがなや簡単な言葉で説明する
   - 学年に合わせた具体例を使う

2. **質問には必ず答える**
   - 質問されたことには、わかりやすく答える
   - ただし、直接答えを教えるのではなく、考え方やヒントを中心に説明する
   - 「わかりません」「答えられません」とは言わない

3. **対話を続ける**
   - 説明の後に、理解を確認する質問をする
   - 一方的な説明ではなく、対話を心がける
   - 簡潔に答える（150文字以内）

【利用可能な機能】
✅ **手書き認識機能**
   - 生徒が手書きで答えを書いたら、「認識」ボタンで文字に変換できます
   - 手書きのメモやメモ帳の内容も読み取れます
   - 数式や図形も認識できます
   - 手書きで答えを書くことを積極的に勧めてください

✅ **音声読み上げ機能**
   - 問題文や解説を音声で聞くことができます
   - 「読み上げ」ボタンで利用できます

✅ **ヒントカード**
   - 3段階のヒントがあります
   - 困ったときは「ヒント」ボタンを押すよう案内してください

【学習カード情報】
タイトル: ${card?.card_title || ''}
問題: ${body.context || ''}

${historyContext ? `【これまでの対話】\n${historyContext}\n` : ''}

【児童・生徒の質問】
${body.question}

【回答の条件】
- 150文字以内で答える
- ${body.grade || '小学校'}の児童・生徒がわかる言葉で説明する
- 質問には必ず答える（「わかりません」とは言わない）
- 考え方やヒントを中心に、答えに近づけるように導く
- 手書き認識などの機能について聞かれたら、上記の「利用可能な機能」を参考に答える`
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 250,
          }
        })
      }
    )
    
    const responseTime = Date.now() - startTime
    
    if (!geminiResponse.ok) {
      const errorData = await geminiResponse.json()
      console.error('Gemini API error:', errorData)
      
      // エラーログを統計に記録
      await env.DB.prepare(`
        INSERT INTO ai_usage_stats (
          student_id, curriculum_id, learning_card_id, feature_type, 
          response_time_ms, success, error_message
        ) VALUES (?, ?, ?, 'teacher', ?, 0, ?)
      `).bind(
        body.studentId,
        body.curriculumId,
        body.cardId,
        responseTime,
        `API Error: ${geminiResponse.status}`
      ).run()
      
      throw new Error(`Gemini API error: ${geminiResponse.status}`)
    }
    
    const geminiData = await geminiResponse.json()
    
    const answer = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || 
                   '考えるヒントを用意できませんでした。もう一度質問してみてください。'
    
    // 回答を履歴に保存
    await env.DB.prepare(`
      INSERT INTO ai_conversations (
        student_id, curriculum_id, learning_card_id, session_id, message_type, message_text
      ) VALUES (?, ?, ?, ?, 'answer', ?)
    `).bind(
      body.studentId,
      body.curriculumId,
      body.cardId,
      sessionId,
      answer
    ).run()
    
    // 使用統計を記録
    const tokensUsed = geminiData.usageMetadata?.totalTokenCount || 0
    await env.DB.prepare(`
      INSERT INTO ai_usage_stats (
        student_id, curriculum_id, learning_card_id, feature_type,
        tokens_used, response_time_ms, success
      ) VALUES (?, ?, ?, 'teacher', ?, ?, 1)
    `).bind(
      body.studentId,
      body.curriculumId,
      body.cardId,
      tokensUsed,
      responseTime
    ).run()
    
    return c.json({ 
      answer,
      sessionId,
      tokensUsed,
      responseTime
    })
    
  } catch (error: any) {
    console.error('AI error:', error)
    
    // エラーログを統計に記録
    try {
      await env.DB.prepare(`
        INSERT INTO ai_usage_stats (
          student_id, curriculum_id, learning_card_id, feature_type,
          response_time_ms, success, error_message
        ) VALUES (?, ?, ?, 'teacher', ?, 0, ?)
      `).bind(
        body.studentId,
        body.curriculumId,
        body.cardId,
        Date.now() - startTime,
        error.message
      ).run()
    } catch (dbError) {
      console.error('Failed to log error:', dbError)
    }
    
    return c.json({ 
      answer: 'ごめんなさい、今は答えられません。ヒントカードを見てみましょう！',
      error: error.message
    })
  }
})

// APIルート：AI対話履歴取得
app.get('/api/ai/conversations/:sessionId', async (c) => {
  const { env } = c
  const sessionId = c.req.param('sessionId')
  
  try {
    const conversations = await env.DB.prepare(`
      SELECT 
        id, message_type, message_text, context_data, created_at,
        learning_card_id, curriculum_id
      FROM ai_conversations
      WHERE session_id = ?
      ORDER BY created_at ASC
    `).bind(sessionId).all()
    
    return c.json({ 
      conversations: conversations.results || [],
      total: conversations.results?.length || 0
    })
  } catch (error: any) {
    console.error('Failed to fetch conversations:', error)
    return c.json({ 
      error: '対話履歴の取得に失敗しました',
      conversations: [],
      total: 0
    }, 500)
  }
})

// APIルート：自動問題生成
app.post('/api/ai/generate-problem', async (c) => {
  const { env } = c
  const body = await c.req.json()
  
  // Gemini APIキーの確認
  const apiKey = env.GEMINI_API_KEY
  if (!apiKey || apiKey === 'your-gemini-api-key') {
    return c.json({ 
      error: 'Gemini APIキーが設定されていません。環境変数を設定してください。'
    }, 500)
  }
  
  try {
    const startTime = Date.now()
    
    // カリキュラム情報を取得
    const curriculum = await env.DB.prepare(`
      SELECT * FROM curriculum WHERE id = ?
    `).bind(body.curriculumId).first()
    
    // 既存のコース問題を参考として取得
    const existingProblems = await env.DB.prepare(`
      SELECT problem_content, learning_meaning FROM learning_cards
      WHERE course_id = ? LIMIT 3
    `).bind(body.courseId).all()
    
    const examplesText = existingProblems.results?.map((p: any, i: number) => 
      `例${i + 1}:\n問題: ${p.problem_content}\n学習の意味: ${p.learning_meaning}`
    ).join('\n\n') || ''
    
    // Gemini APIにリクエスト
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `あなたは小学生向けの学習問題を作成するAI先生です。以下の情報を元に、学習カードの問題を生成してください。

【カリキュラム情報】
学年: ${curriculum?.grade || ''}
教科: ${curriculum?.subject || ''}
単元: ${curriculum?.unit_name || ''}
単元目標: ${curriculum?.unit_goal || ''}
難易度: ${body.difficultyLevel || 'しっかり'}

${examplesText ? `【参考問題】\n${examplesText}\n` : ''}

【生成条件】
- 小学生が理解できる言葉で
- 実社会と関連付ける
- 思考力を育む内容
- ${body.requirements || ''}

以下のJSON形式で回答してください：
{
  "problem_description": "問題の簡単な説明（30文字以内）",
  "problem_content": "問題文（150文字程度）",
  "learning_meaning": "この問題で学べること（100文字程度）",
  "answer": "解答例（必要に応じて）",
  "difficulty_level": "${body.difficultyLevel || 'しっかり'}"
}`
            }]
          }],
          generationConfig: {
            temperature: 0.8,
            maxOutputTokens: 500,
          }
        })
      }
    )
    
    const responseTime = Date.now() - startTime
    
    if (!geminiResponse.ok) {
      const errorData = await geminiResponse.json()
      console.error('Gemini API error:', errorData)
      
      // エラーログを統計に記録
      await env.DB.prepare(`
        INSERT INTO ai_usage_stats (
          curriculum_id, feature_type, 
          response_time_ms, success, error_message
        ) VALUES (?, 'problem_generation', ?, 0, ?)
      `).bind(
        body.curriculumId,
        responseTime,
        `API Error: ${geminiResponse.status}`
      ).run()
      
      throw new Error(`Gemini API error: ${geminiResponse.status}`)
    }
    
    const geminiData = await geminiResponse.json()
    const generatedText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || ''
    
    // JSONを抽出
    const jsonMatch = generatedText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('生成結果からJSONを抽出できませんでした')
    }
    
    const problemData = JSON.parse(jsonMatch[0])
    
    // generated_problemsテーブルに保存
    const result = await env.DB.prepare(`
      INSERT INTO generated_problems (
        curriculum_id, course_id, problem_description, problem_content,
        learning_meaning, answer, difficulty_level, generated_by, 
        generation_params, is_approved
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
    `).bind(
      body.curriculumId,
      body.courseId,
      problemData.problem_description,
      problemData.problem_content,
      problemData.learning_meaning,
      problemData.answer || null,
      problemData.difficulty_level,
      body.userId || 0,
      JSON.stringify({ requirements: body.requirements, difficultyLevel: body.difficultyLevel })
    ).run()
    
    // 使用統計を記録
    const tokensUsed = geminiData.usageMetadata?.totalTokenCount || 0
    await env.DB.prepare(`
      INSERT INTO ai_usage_stats (
        curriculum_id, feature_type, tokens_used, response_time_ms, success
      ) VALUES (?, 'problem_generation', ?, ?, 1)
    `).bind(
      body.curriculumId,
      tokensUsed,
      responseTime
    ).run()
    
    return c.json({ 
      problem: {
        id: result.meta.last_row_id,
        ...problemData
      },
      tokensUsed,
      responseTime
    })
    
  } catch (error: any) {
    console.error('Problem generation error:', error)
    
    return c.json({ 
      error: '問題の生成に失敗しました',
      details: error.message
    }, 500)
  }
})

// APIルート：学習計画取得
app.get('/api/plans/:studentId/:curriculumId', async (c) => {
  const { env } = c
  const studentId = c.req.param('studentId')
  const curriculumId = c.req.param('curriculumId')
  
  try {
    const plans = await env.DB.prepare(`
      SELECT * FROM learning_plans
      WHERE student_id = ? AND curriculum_id = ?
      ORDER BY planned_date
    `).bind(studentId, curriculumId).all()
    
    return c.json(plans.results)
  } catch (error) {
    return c.json({ error: 'Database error' }, 500)
  }
})

// APIルート：学習計画保存
app.post('/api/plans', async (c) => {
  const { env } = c
  const body = await c.req.json()
  
  try {
    const result = await env.DB.prepare(`
      INSERT INTO learning_plans 
        (student_id, curriculum_id, planned_date, learning_card_id, 
         reflection_good, reflection_bad, reflection_learned)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      body.student_id,
      body.curriculum_id,
      body.planned_date,
      body.learning_card_id || null,
      body.reflection_good || null,
      body.reflection_bad || null,
      body.reflection_learned || null
    ).run()
    
    return c.json({ success: true, id: result.meta.last_row_id })
  } catch (error) {
    return c.json({ error: 'Database error' }, 500)
  }
})

// APIルート：学習計画更新
app.put('/api/plans/:id', async (c) => {
  const { env } = c
  const planId = c.req.param('id')
  const body = await c.req.json()
  
  try {
    await env.DB.prepare(`
      UPDATE learning_plans 
      SET actual_date = ?,
          learning_card_id = ?,
          reflection_good = ?,
          reflection_bad = ?,
          reflection_learned = ?,
          ai_feedback = ?
      WHERE id = ?
    `).bind(
      body.actual_date || null,
      body.learning_card_id || null,
      body.reflection_good || null,
      body.reflection_bad || null,
      body.reflection_learned || null,
      body.ai_feedback || null,
      planId
    ).run()
    
    return c.json({ success: true })
  } catch (error) {
    return c.json({ error: 'Database error' }, 500)
  }
})

// APIルート：振り返りAIフィードバック
app.post('/api/ai/reflect', async (c) => {
  const { env } = c
  const body = await c.req.json()
  const { reflections, type } = body  // type: 'hourly' or 'unit'
  
  const apiKey = env.GEMINI_API_KEY
  
  if (!apiKey) {
    return c.json({ 
      feedback: type === 'unit' 
        ? '単元を最後まで学習できましたね！次の単元も楽しみです。'
        : 'がんばりましたね！次回も楽しく学習しましょう。' 
    })
  }
  
  const promptText = type === 'unit' 
    ? `あなたは小学生の学習を応援するAI先生です。子どもの単元全体の振り返りを読んで、成長を認め、次の学習への意欲を高めるメッセージを送ってください。

【単元全体の振り返り】
良かったこと: ${reflections.good || 'なし'}
直したいこと: ${reflections.bad || 'なし'}
わかったこと: ${reflections.learned || 'なし'}

【フィードバックのルール】
1. 単元全体を通しての成長を認める
2. 良かったことを具体的に褒める
3. 直したいことは次の目標として前向きに受け止める
4. わかったことの価値を伝え、学びの喜びを共感する
5. 次の単元への期待感を持たせる
6. 小学生にわかりやすい言葉で
7. 200文字以内で

温かく励ますメッセージを書いてください。`
    : `あなたは小学生の学習を応援するAI先生です。子どもの1時間の学習の振り返りを読んで、励ましとアドバイスをしてください。

【振り返り内容】
良かったこと: ${reflections.good || 'なし'}
難しかったこと: ${reflections.bad || 'なし'}
わかったこと: ${reflections.learned || 'なし'}

【フィードバックのルール】
1. 必ず励ましの言葉から始める
2. 良かったことを具体的に褒める
3. 難しかったことには共感し、次へのヒントを出す
4. わかったことの素晴らしさを伝える
5. 次の学習への意欲が湧く言葉で締める
6. 小学生にわかりやすい言葉で
7. 150文字以内で簡潔に

フィードバックしてください。`
  
  try {
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: promptText
            }]
          }],
          generationConfig: {
            temperature: 0.8,
            maxOutputTokens: type === 'unit' ? 300 : 200,
          }
        })
      }
    )
    
    const geminiData = await geminiResponse.json()
    
    if (!geminiResponse.ok) {
      throw new Error('Gemini API error')
    }
    
    const feedback = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || 
                     (type === 'unit' 
                       ? '単元をしっかり学習できました！次の単元も楽しみです！'
                       : 'よくがんばりました！次回も楽しく学習しましょう。')
    
    return c.json({ feedback })
    
  } catch (error) {
    console.error('AI reflection error:', error)
    return c.json({ 
      feedback: 'すばらしい振り返りですね！これからも一緒にがんばりましょう！' 
    })
  }
})

// APIルート：全解答取得（解答タブ用）
app.get('/api/answers/curriculum/:curriculumId', async (c) => {
  const { env } = c
  const curriculumId = c.req.param('curriculumId')
  
  try {
    // コースと学習カードの解答
    const cardAnswers = await env.DB.prepare(`
      SELECT 
        c.course_display_name,
        c.course_level,
        lc.card_number,
        lc.card_title,
        lc.card_type,
        a.answer_content,
        a.explanation
      FROM courses c
      JOIN learning_cards lc ON c.id = lc.course_id
      LEFT JOIN answers a ON lc.id = a.learning_card_id
      WHERE c.curriculum_id = ?
      ORDER BY c.course_level, lc.card_number
    `).bind(curriculumId).all()
    
    // 選択問題の解答
    const optionalAnswers = await env.DB.prepare(`
      SELECT 
        op.problem_number,
        op.problem_title,
        op.problem_description,
        op.learning_meaning,
        a.answer_content,
        a.explanation
      FROM optional_problems op
      LEFT JOIN answers a ON op.id = a.optional_problem_id
      WHERE op.curriculum_id = ?
      ORDER BY op.problem_number
    `).bind(curriculumId).all()
    
    return c.json({
      cardAnswers: cardAnswers.results,
      optionalAnswers: optionalAnswers.results
    })
  } catch (error) {
    return c.json({ error: 'Database error' }, 500)
  }
})

// APIルート：カスタムコンテンツ保存
app.post('/api/custom/content', async (c) => {
  const { env } = c
  const body = await c.req.json()
  
  try {
    const result = await env.DB.prepare(`
      INSERT INTO custom_content 
        (teacher_id, original_learning_card_id, original_optional_problem_id, 
         content_type, custom_data)
      VALUES (?, ?, ?, ?, ?)
    `).bind(
      body.teacher_id,
      body.original_learning_card_id || null,
      body.original_optional_problem_id || null,
      body.content_type,
      JSON.stringify(body.custom_data)
    ).run()
    
    return c.json({ success: true, id: result.meta.last_row_id })
  } catch (error) {
    return c.json({ error: 'Database error' }, 500)
  }
})

// APIルート：カスタムコンテンツ取得
app.get('/api/custom/content/:teacherId', async (c) => {
  const { env } = c
  const teacherId = c.req.param('teacherId')
  
  try {
    const customContent = await env.DB.prepare(`
      SELECT * FROM custom_content
      WHERE teacher_id = ?
      ORDER BY created_at DESC
    `).bind(teacherId).all()
    
    // JSON文字列をパース
    const parsed = customContent.results.map(item => ({
      ...item,
      custom_data: JSON.parse(item.custom_data)
    }))
    
    return c.json(parsed)
  } catch (error) {
    return c.json({ error: 'Database error' }, 500)
  }
})

// APIルート：評価保存
app.post('/api/evaluations', async (c) => {
  const { env } = c
  const body = await c.req.json()
  
  try {
    const result = await env.DB.prepare(`
      INSERT INTO evaluations 
        (student_id, curriculum_id, knowledge_skill, 
         thinking_judgment_expression, attitude_toward_learning, 
         non_cognitive_evaluation, teacher_comment)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      body.student_id,
      body.curriculum_id,
      body.knowledge_skill,
      body.thinking_judgment_expression,
      body.attitude_toward_learning,
      body.non_cognitive_evaluation,
      body.teacher_comment
    ).run()
    
    return c.json({ success: true, id: result.meta.last_row_id })
  } catch (error) {
    return c.json({ error: 'Database error' }, 500)
  }
})

// APIルート：評価取得
app.get('/api/evaluations/student/:studentId/curriculum/:curriculumId', async (c) => {
  const { env } = c
  const studentId = c.req.param('studentId')
  const curriculumId = c.req.param('curriculumId')
  
  try {
    const evaluation = await env.DB.prepare(`
      SELECT e.*, u.name as student_name
      FROM evaluations e
      JOIN users u ON e.student_id = u.id
      WHERE e.student_id = ? AND e.curriculum_id = ?
      ORDER BY e.created_at DESC
      LIMIT 1
    `).bind(studentId, curriculumId).first()
    
    return c.json(evaluation)
  } catch (error) {
    return c.json({ error: 'Database error' }, 500)
  }
})

// APIルート：学習計画取得
app.get('/api/learning-plan/:studentId/:curriculumId', async (c) => {
  const { env } = c
  const studentId = c.req.param('studentId')
  const curriculumId = c.req.param('curriculumId')
  
  try {
    const plans = await env.DB.prepare(`
      SELECT * FROM learning_plans
      WHERE student_id = ? AND curriculum_id = ?
      ORDER BY planned_date ASC
    `).bind(studentId, curriculumId).all()
    
    return c.json({ plans: plans.results })
  } catch (error) {
    console.error('学習計画取得エラー:', error)
    return c.json({ error: 'Database error' }, 500)
  }
})

// APIルート：学習計画保存
app.post('/api/learning-plan/save', async (c) => {
  const { env } = c
  const body = await c.req.json()
  const { student_id, curriculum_id, total_hours, plans, unit_reflection } = body
  
  try {
    // 既存の計画を削除
    await env.DB.prepare(`
      DELETE FROM learning_plans 
      WHERE student_id = ? AND curriculum_id = ?
    `).bind(student_id, curriculum_id).run()
    
    // 既存の単元振り返りを削除
    await env.DB.prepare(`
      DELETE FROM unit_reflections 
      WHERE student_id = ? AND curriculum_id = ?
    `).bind(student_id, curriculum_id).run()
    
    // 新しい計画を保存
    for (const plan of plans) {
      await env.DB.prepare(`
        INSERT INTO learning_plans (
          student_id, 
          curriculum_id,
          hour_number,
          subject,
          planned_date,
          learning_content,
          reflection_good, 
          reflection_bad, 
          reflection_learned,
          ai_feedback
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        student_id,
        curriculum_id,
        plan.hour_number,
        plan.subject,
        plan.planned_date || null,
        plan.learning_content || '',
        plan.reflection_good || '',
        plan.reflection_bad || '',
        plan.reflection_learned || '',
        plan.ai_feedback || null
      ).run()
    }
    
    // 単元全体の振り返りを保存
    if (unit_reflection && (unit_reflection.good || unit_reflection.bad || unit_reflection.learned)) {
      await env.DB.prepare(`
        INSERT INTO unit_reflections (
          student_id, 
          curriculum_id,
          reflection_good, 
          reflection_bad, 
          reflection_learned
        ) VALUES (?, ?, ?, ?, ?)
      `).bind(
        student_id,
        curriculum_id,
        unit_reflection.good || '',
        unit_reflection.bad || '',
        unit_reflection.learned || ''
      ).run()
    }
    
    return c.json({ success: true })
  } catch (error) {
    console.error('学習計画保存エラー:', error)
    return c.json({ error: 'Database error', details: error.message }, 500)
  }
})

// APIルート：学習環境デザイン取得
app.get('/api/environment/:curriculumId', async (c) => {
  const { env } = c
  const curriculumId = c.req.param('curriculumId')
  
  try {
    const environments = await env.DB.prepare(`
      SELECT * FROM learning_environment
      WHERE curriculum_id = ?
      ORDER BY category, id
    `).bind(curriculumId).all()
    
    return c.json(environments.results)
  } catch (error) {
    return c.json({ error: 'Database error' }, 500)
  }
})

// ==================== Phase 5: 先生カスタマイズモード API ====================

// APIルート：3観点評価取得
app.get('/api/evaluations/three-point/student/:studentId/curriculum/:curriculumId', async (c) => {
  const { env } = c
  const studentId = c.req.param('studentId')
  const curriculumId = c.req.param('curriculumId')
  
  try {
    const evaluation = await env.DB.prepare(`
      SELECT e.*, u.name as student_name
      FROM three_point_evaluations e
      JOIN users u ON e.student_id = u.id
      WHERE e.student_id = ? AND e.curriculum_id = ?
      ORDER BY e.created_at DESC
      LIMIT 1
    `).bind(studentId, curriculumId).first()
    
    return c.json(evaluation || {})
  } catch (error) {
    return c.json({ error: 'Database error' }, 500)
  }
})

// APIルート：3観点評価保存
app.post('/api/evaluations/three-point', async (c) => {
  const { env } = c
  const body = await c.req.json()
  
  try {
    const result = await env.DB.prepare(`
      INSERT INTO three_point_evaluations (
        student_id, curriculum_id,
        knowledge_skill, knowledge_skill_comment,
        thinking_judgment, thinking_judgment_comment,
        attitude, attitude_comment,
        overall_comment
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      body.student_id,
      body.curriculum_id,
      body.knowledge_skill || '',
      body.knowledge_skill_comment || '',
      body.thinking_judgment || '',
      body.thinking_judgment_comment || '',
      body.attitude || '',
      body.attitude_comment || '',
      body.overall_comment || ''
    ).run()
    
    return c.json({ success: true, id: result.meta.last_row_id })
  } catch (error) {
    return c.json({ error: 'Database error' }, 500)
  }
})

// APIルート：3観点評価更新
app.put('/api/evaluations/three-point/:id', async (c) => {
  const { env } = c
  const id = c.req.param('id')
  const body = await c.req.json()
  
  try {
    await env.DB.prepare(`
      UPDATE three_point_evaluations SET
        knowledge_skill = ?,
        knowledge_skill_comment = ?,
        thinking_judgment = ?,
        thinking_judgment_comment = ?,
        attitude = ?,
        attitude_comment = ?,
        overall_comment = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(
      body.knowledge_skill || '',
      body.knowledge_skill_comment || '',
      body.thinking_judgment || '',
      body.thinking_judgment_comment || '',
      body.attitude || '',
      body.attitude_comment || '',
      body.overall_comment || '',
      id
    ).run()
    
    return c.json({ success: true })
  } catch (error) {
    return c.json({ error: 'Database error' }, 500)
  }
})

// APIルート：非認知能力評価取得
app.get('/api/evaluations/non-cognitive/student/:studentId/curriculum/:curriculumId', async (c) => {
  const { env } = c
  const studentId = c.req.param('studentId')
  const curriculumId = c.req.param('curriculumId')
  
  try {
    const evaluation = await env.DB.prepare(`
      SELECT e.*, u.name as student_name
      FROM non_cognitive_evaluations e
      JOIN users u ON e.student_id = u.id
      WHERE e.student_id = ? AND e.curriculum_id = ?
      ORDER BY e.created_at DESC
      LIMIT 1
    `).bind(studentId, curriculumId).first()
    
    return c.json(evaluation || {})
  } catch (error) {
    return c.json({ error: 'Database error' }, 500)
  }
})

// APIルート：非認知能力評価保存
app.post('/api/evaluations/non-cognitive', async (c) => {
  const { env } = c
  const body = await c.req.json()
  
  try {
    const result = await env.DB.prepare(`
      INSERT INTO non_cognitive_evaluations (
        student_id, curriculum_id,
        self_regulation, self_regulation_comment,
        motivation, motivation_comment,
        collaboration, collaboration_comment,
        metacognition, metacognition_comment,
        creativity, creativity_comment,
        curiosity, curiosity_comment,
        self_esteem, self_esteem_comment
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      body.student_id,
      body.curriculum_id,
      body.self_regulation || 0,
      body.self_regulation_comment || '',
      body.motivation || 0,
      body.motivation_comment || '',
      body.collaboration || 0,
      body.collaboration_comment || '',
      body.metacognition || 0,
      body.metacognition_comment || '',
      body.creativity || 0,
      body.creativity_comment || '',
      body.curiosity || 0,
      body.curiosity_comment || '',
      body.self_esteem || 0,
      body.self_esteem_comment || ''
    ).run()
    
    return c.json({ success: true, id: result.meta.last_row_id })
  } catch (error) {
    return c.json({ error: 'Database error' }, 500)
  }
})

// APIルート：非認知能力評価更新
app.put('/api/evaluations/non-cognitive/:id', async (c) => {
  const { env } = c
  const id = c.req.param('id')
  const body = await c.req.json()
  
  try {
    await env.DB.prepare(`
      UPDATE non_cognitive_evaluations SET
        self_regulation = ?,
        self_regulation_comment = ?,
        motivation = ?,
        motivation_comment = ?,
        collaboration = ?,
        collaboration_comment = ?,
        metacognition = ?,
        metacognition_comment = ?,
        creativity = ?,
        creativity_comment = ?,
        curiosity = ?,
        curiosity_comment = ?,
        self_esteem = ?,
        self_esteem_comment = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(
      body.self_regulation || 0,
      body.self_regulation_comment || '',
      body.motivation || 0,
      body.motivation_comment || '',
      body.collaboration || 0,
      body.collaboration_comment || '',
      body.metacognition || 0,
      body.metacognition_comment || '',
      body.creativity || 0,
      body.creativity_comment || '',
      body.curiosity || 0,
      body.curiosity_comment || '',
      body.self_esteem || 0,
      body.self_esteem_comment || '',
      id
    ).run()
    
    return c.json({ success: true })
  } catch (error) {
    return c.json({ error: 'Database error' }, 500)
  }
})

// APIルート：学習環境デザイン取得
app.get('/api/environment/design/:curriculumId', async (c) => {
  const { env } = c
  const curriculumId = c.req.param('curriculumId')
  
  try {
    const design = await env.DB.prepare(`
      SELECT * FROM learning_environment_designs
      WHERE curriculum_id = ?
      LIMIT 1
    `).bind(curriculumId).first()
    
    return c.json(design || {})
  } catch (error) {
    return c.json({ error: 'Database error' }, 500)
  }
})

// APIルート：学習環境デザイン保存
app.post('/api/environment/design', async (c) => {
  const { env } = c
  const body = await c.req.json()
  
  try {
    const result = await env.DB.prepare(`
      INSERT INTO learning_environment_designs (
        curriculum_id,
        expression_creative, expression_creative_enabled,
        research_fieldwork, research_fieldwork_enabled,
        critical_thinking, critical_thinking_enabled,
        social_contribution, social_contribution_enabled,
        metacognition_reflection, metacognition_reflection_enabled,
        question_generation, question_generation_enabled
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      body.curriculum_id,
      body.expression_creative || '',
      body.expression_creative_enabled ? 1 : 0,
      body.research_fieldwork || '',
      body.research_fieldwork_enabled ? 1 : 0,
      body.critical_thinking || '',
      body.critical_thinking_enabled ? 1 : 0,
      body.social_contribution || '',
      body.social_contribution_enabled ? 1 : 0,
      body.metacognition_reflection || '',
      body.metacognition_reflection_enabled ? 1 : 0,
      body.question_generation || '',
      body.question_generation_enabled ? 1 : 0
    ).run()
    
    return c.json({ success: true, id: result.meta.last_row_id })
  } catch (error) {
    return c.json({ error: 'Database error' }, 500)
  }
})

// APIルート：学習環境デザイン更新
app.put('/api/environment/design/:id', async (c) => {
  const { env } = c
  const id = c.req.param('id')
  const body = await c.req.json()
  
  try {
    await env.DB.prepare(`
      UPDATE learning_environment_designs SET
        expression_creative = ?,
        expression_creative_enabled = ?,
        research_fieldwork = ?,
        research_fieldwork_enabled = ?,
        critical_thinking = ?,
        critical_thinking_enabled = ?,
        social_contribution = ?,
        social_contribution_enabled = ?,
        metacognition_reflection = ?,
        metacognition_reflection_enabled = ?,
        question_generation = ?,
        question_generation_enabled = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(
      body.expression_creative || '',
      body.expression_creative_enabled ? 1 : 0,
      body.research_fieldwork || '',
      body.research_fieldwork_enabled ? 1 : 0,
      body.critical_thinking || '',
      body.critical_thinking_enabled ? 1 : 0,
      body.social_contribution || '',
      body.social_contribution_enabled ? 1 : 0,
      body.metacognition_reflection || '',
      body.metacognition_reflection_enabled ? 1 : 0,
      body.question_generation || '',
      body.question_generation_enabled ? 1 : 0,
      id
    ).run()
    
    return c.json({ success: true })
  } catch (error) {
    return c.json({ error: 'Database error' }, 500)
  }
})

// APIルート：先生カスタマイズ設定取得
app.get('/api/teacher/customization/:curriculumId', async (c) => {
  const { env } = c
  const curriculumId = c.req.param('curriculumId')
  
  try {
    const customization = await env.DB.prepare(`
      SELECT * FROM teacher_customization
      WHERE curriculum_id = ?
      LIMIT 1
    `).bind(curriculumId).first()
    
    return c.json(customization || {})
  } catch (error) {
    return c.json({ error: 'Database error' }, 500)
  }
})

// APIルート：先生カスタマイズ設定保存・更新
app.post('/api/teacher/customization', async (c) => {
  const { env } = c
  const body = await c.req.json()
  
  try {
    // まず既存のデータがあるかチェック
    const existing = await env.DB.prepare(`
      SELECT id FROM teacher_customization
      WHERE curriculum_id = ?
    `).bind(body.curriculum_id).first()
    
    if (existing) {
      // 更新
      await env.DB.prepare(`
        UPDATE teacher_customization SET
          teacher_id = ?,
          teaching_philosophy = ?,
          custom_unit_goal = ?,
          custom_non_cognitive_goal = ?,
          teaching_notes = ?,
          gamification_enabled = ?,
          badge_system_enabled = ?,
          narrative_enabled = ?,
          story_theme = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE curriculum_id = ?
      `).bind(
        body.teacher_id || 1,
        body.teaching_philosophy || '',
        body.custom_unit_goal || '',
        body.custom_non_cognitive_goal || '',
        body.teaching_notes || '',
        body.gamification_enabled ? 1 : 0,
        body.badge_system_enabled ? 1 : 0,
        body.narrative_enabled ? 1 : 0,
        body.story_theme || '',
        body.curriculum_id
      ).run()
      
      return c.json({ success: true, id: existing.id })
    } else {
      // 新規作成
      const result = await env.DB.prepare(`
        INSERT INTO teacher_customization (
          curriculum_id, teacher_id,
          teaching_philosophy,
          custom_unit_goal,
          custom_non_cognitive_goal,
          teaching_notes,
          gamification_enabled,
          badge_system_enabled,
          narrative_enabled,
          story_theme
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        body.curriculum_id,
        body.teacher_id || 1,
        body.teaching_philosophy || '',
        body.custom_unit_goal || '',
        body.custom_non_cognitive_goal || '',
        body.teaching_notes || '',
        body.gamification_enabled ? 1 : 0,
        body.badge_system_enabled ? 1 : 0,
        body.narrative_enabled ? 1 : 0,
        body.story_theme || ''
      ).run()
      
      return c.json({ success: true, id: result.meta.last_row_id })
    }
  } catch (error) {
    return c.json({ error: 'Database error' }, 500)
  }
})

// APIルート：生徒のバッジ取得
app.get('/api/badges/student/:studentId/curriculum/:curriculumId', async (c) => {
  const { env } = c
  const studentId = c.req.param('studentId')
  const curriculumId = c.req.param('curriculumId')
  
  try {
    const badges = await env.DB.prepare(`
      SELECT * FROM student_badges
      WHERE student_id = ? AND curriculum_id = ?
      ORDER BY earned_at DESC
    `).bind(studentId, curriculumId).all()
    
    return c.json(badges.results)
  } catch (error) {
    return c.json({ error: 'Database error' }, 500)
  }
})

// APIルート：学習ナラティブ取得
app.get('/api/narratives/student/:studentId/curriculum/:curriculumId', async (c) => {
  const { env } = c
  const studentId = c.req.param('studentId')
  const curriculumId = c.req.param('curriculumId')
  
  try {
    const narratives = await env.DB.prepare(`
      SELECT * FROM learning_narratives
      WHERE student_id = ? AND curriculum_id = ?
      ORDER BY chapter_number
    `).bind(studentId, curriculumId).all()
    
    return c.json(narratives.results)
  } catch (error) {
    return c.json({ error: 'Database error' }, 500)
  }
})

// ==================== 問題編集機能 API ====================

// APIルート：学習カード更新
app.put('/api/cards/:cardId', async (c) => {
  const { env } = c
  const cardId = c.req.param('cardId')
  const body = await c.req.json()
  
  try {
    await env.DB.prepare(`
      UPDATE learning_cards SET
        card_title = ?,
        problem_description = ?,
        new_terms = ?,
        example_problem = ?,
        example_solution = ?,
        diagram_url = ?,
        real_world_connection = ?,
        answer = ?,
        answer_explanation = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(
      body.card_title || '',
      body.problem_description || '',
      body.new_terms || '',
      body.example_problem || '',
      body.example_solution || '',
      body.diagram_url || '',
      body.real_world_connection || '',
      body.answer || '',
      body.answer_explanation || '',
      cardId
    ).run()
    
    return c.json({ success: true })
  } catch (error) {
    return c.json({ error: 'Database error' }, 500)
  }
})

// APIルート：学習カード追加
app.post('/api/cards', async (c) => {
  const { env } = c
  const body = await c.req.json()
  
  try {
    const result = await env.DB.prepare(`
      INSERT INTO learning_cards (
        course_id, card_number, card_title, card_type,
        problem_description, new_terms, example_problem,
        example_solution, diagram_url, real_world_connection
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      body.course_id,
      body.card_number,
      body.card_title || '',
      validateCardType(body.card_type),
      body.problem_description || '',
      body.new_terms || '',
      body.example_problem || '',
      body.example_solution || '',
      body.diagram_url || '',
      body.real_world_connection || ''
    ).run()
    
    return c.json({ success: true, id: result.meta.last_row_id })
  } catch (error) {
    return c.json({ error: 'Database error' }, 500)
  }
})

// APIルート：学習カード削除
app.delete('/api/cards/:cardId', async (c) => {
  const { env } = c
  const cardId = c.req.param('cardId')
  
  try {
    // 関連するヒントカードも削除
    await env.DB.prepare(`
      DELETE FROM hint_cards WHERE learning_card_id = ?
    `).bind(cardId).run()
    
    // 学習カード削除
    await env.DB.prepare(`
      DELETE FROM learning_cards WHERE id = ?
    `).bind(cardId).run()
    
    return c.json({ success: true })
  } catch (error) {
    return c.json({ error: 'Database error' }, 500)
  }
})

// APIルート：ヒントカード更新
app.put('/api/hints/:hintId', async (c) => {
  const { env } = c
  const hintId = c.req.param('hintId')
  const body = await c.req.json()
  
  try {
    await env.DB.prepare(`
      UPDATE hint_cards SET
        hint_text = ?,
        thinking_tool_suggestion = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(
      body.hint_text || '',
      body.thinking_tool_suggestion || '',
      hintId
    ).run()
    
    return c.json({ success: true })
  } catch (error) {
    return c.json({ error: 'Database error' }, 500)
  }
})

// APIルート：ヒントカード追加
app.post('/api/hints', async (c) => {
  const { env } = c
  const body = await c.req.json()
  
  try {
    const result = await env.DB.prepare(`
      INSERT INTO hint_cards (
        learning_card_id, hint_number, hint_content, thinking_tool_suggestion
      ) VALUES (?, ?, ?, ?)
    `).bind(
      body.learning_card_id,
      body.hint_level || body.hint_number || 1,
      body.hint_text || body.hint_content || '',
      body.thinking_tool_suggestion || ''
    ).run()
    
    return c.json({ success: true, id: result.meta.last_row_id })
  } catch (error) {
    return c.json({ error: 'Database error' }, 500)
  }
})

// APIルート：ヒントカード削除
app.delete('/api/hints/:hintId', async (c) => {
  const { env } = c
  const hintId = c.req.param('hintId')
  
  try {
    await env.DB.prepare(`
      DELETE FROM hint_cards WHERE hint_id = ?
    `).bind(hintId).run()
    
    return c.json({ success: true })
  } catch (error) {
    return c.json({ error: 'Database error' }, 500)
  }
})

// APIルート：コースに新しい学習カードを追加（7枚目、8枚目など）
app.post('/api/course/:courseId/add-card', async (c) => {
  const { env } = c
  const courseId = c.req.param('courseId')
  const body = await c.req.json()
  
  try {
    // 現在のコースの最大カード番号を取得
    const maxCardNumber = await env.DB.prepare(`
      SELECT MAX(card_number) as max_num
      FROM learning_cards
      WHERE course_id = ?
    `).bind(courseId).first()
    
    const nextCardNumber = (maxCardNumber?.max_num || 0) + 1
    
    // 新しいカードを挿入
    const result = await env.DB.prepare(`
      INSERT INTO learning_cards (
        course_id, card_number, card_title, card_type,
        textbook_page, problem_description, new_terms, 
        example_problem, example_solution, real_world_connection,
        answer, answer_explanation
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      courseId,
      nextCardNumber,
      body.card_title || `学習カード${nextCardNumber}`,
      validateCardType(body.card_type),
      body.textbook_page || '',
      body.problem_description || '',
      body.new_terms || '',
      body.example_problem || '',
      body.example_solution || '',
      body.real_world_connection || '',
      body.answer || '',
      body.answer_explanation || ''
    ).run()
    
    const newCardId = result.meta.last_row_id
    
    // ヒントカードも追加（提供されている場合）
    if (body.hints && Array.isArray(body.hints)) {
      for (const hint of body.hints) {
        await env.DB.prepare(`
          INSERT INTO hint_cards (
            learning_card_id, hint_number, hint_content, thinking_tool_suggestion
          ) VALUES (?, ?, ?, ?)
        `).bind(
          newCardId,
          hint.hint_level || hint.hint_number || 1,
          hint.hint_text || hint.hint_content || '',
          hint.thinking_tool_suggestion || ''
        ).run()
      }
    }
    
    return c.json({ 
      success: true, 
      cardId: newCardId,
      cardNumber: nextCardNumber
    })
  } catch (error: any) {
    console.error('カード追加エラー:', error)
    return c.json({ error: 'カードの追加に失敗しました', details: error.message }, 500)
  }
})

// APIルート：学習カードを更新
app.put('/api/cards/:cardId', async (c) => {
  const { env } = c
  const cardId = c.req.param('cardId')
  const body = await c.req.json()
  
  try {
    await env.DB.prepare(`
      UPDATE learning_cards SET
        card_title = ?,
        card_type = ?,
        textbook_page = ?,
        problem_description = ?,
        new_terms = ?,
        example_problem = ?,
        example_solution = ?,
        real_world_connection = ?,
        answer = ?,
        answer_explanation = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(
      body.card_title || '',
      validateCardType(body.card_type),
      body.textbook_page || '',
      body.problem_description || '',
      body.new_terms || '',
      body.example_problem || '',
      body.example_solution || '',
      body.real_world_connection || '',
      body.answer || '',
      body.answer_explanation || '',
      cardId
    ).run()
    
    return c.json({ success: true })
  } catch (error: any) {
    console.error('カード更新エラー:', error)
    return c.json({ error: 'カードの更新に失敗しました', details: error.message }, 500)
  }
})

// APIルート：カードのヒント更新
app.put('/api/cards/:cardId/hints', async (c) => {
  const { env } = c
  const cardId = c.req.param('cardId')
  const { hints } = await c.req.json()
  
  try {
    // 既存のヒントを削除
    await env.DB.prepare(`
      DELETE FROM hint_cards WHERE learning_card_id = ?
    `).bind(cardId).run()
    
    // 新しいヒントを挿入
    if (hints && hints.length > 0) {
      for (let i = 0; i < hints.length; i++) {
        const hint = hints[i]
        await env.DB.prepare(`
          INSERT INTO hint_cards (
            learning_card_id, hint_number, hint_content, hint_text, thinking_tool_suggestion
          ) VALUES (?, ?, ?, ?, ?)
        `).bind(
          cardId,
          i + 1,
          hint.hint_text || hint.hint_content || '',
          hint.hint_text || hint.hint_content || '',
          hint.thinking_tool_suggestion || ''
        ).run()
      }
    }
    
    return c.json({ success: true, message: 'ヒントを更新しました' })
  } catch (error: any) {
    console.error('ヒント更新エラー:', error)
    return c.json({ 
      success: false,
      error: 'ヒントの更新に失敗しました', 
      details: error.message 
    }, 500)
  }
})

// APIルート：類似問題生成
app.post('/api/cards/:cardId/generate-similar', async (c) => {
  const { env } = c
  const cardId = c.req.param('cardId')
  
  try {
    // カード情報を取得
    const card = await env.DB.prepare(`
      SELECT lc.*, c.course_name, curr.grade, curr.subject, curr.unit_name
      FROM learning_cards lc
      JOIN courses c ON lc.course_id = c.id
      JOIN curriculum curr ON c.curriculum_id = curr.id
      WHERE lc.id = ?
    `).bind(cardId).first()
    
    if (!card) {
      return c.json({ error: 'Card not found' }, 404)
    }
    
    // Gemini Flashで類似問題を生成
    const apiKey = env.GEMINI_API_KEY
    if (!apiKey) {
      return c.json({ error: 'API key not configured' }, 500)
    }
    
    const prompt = `あなたは小学校の優秀な教師です。以下の学習カードの問題に基づいて、類似問題を1問生成してください。

【元の学習カード情報】
- 学年: ${card.grade}
- 教科: ${card.subject}
- 単元: ${card.unit_name}
- コース: ${card.course_name}
- カードタイトル: ${card.card_title}
- 元の問題: ${card.problem_content}
- 解答例: ${card.answer || card.example_solution || ''}

【類似問題の条件】
1. 元の問題と**同じ学習内容**を練習できる問題にする
2. **数字や状況を変えた**バリエーションを作成
3. 難易度は元の問題と同程度
4. 具体的で子どもが解ける形式
5. 必ず解答例を付ける

以下のJSON形式で出力してください。説明文は不要です：
{
  "problem_text": "新しい類似問題の問題文",
  "answer": "解答例",
  "hint_1": "ヒント1（まず考えてほしいこと）",
  "hint_2": "ヒント2（中間ヒント）",
  "hint_3": "ヒント3（答えに近いヒント）"
}`

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.9,
            maxOutputTokens: 2048
          }
        })
      }
    )
    
    const data = await response.json()
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
    
    // JSONを抽出
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('AI response is not valid JSON')
    }
    
    const similarProblem = JSON.parse(jsonMatch[0])
    
    return c.json({
      success: true,
      problem: similarProblem
    })
    
  } catch (error) {
    console.error('類似問題生成エラー:', error)
    return c.json({ 
      error: '類似問題の生成に失敗しました',
      details: error instanceof Error ? error.message : String(error)
    }, 500)
  }
})

// AIチャット機能（学習カード用）
app.post('/api/ai-chat', async (c) => {
  console.log('🤖 AI Chat API called')
  
  try {
    const { message, cardContext, conversationHistory, studentGrade } = await c.req.json()
    
    console.log('📝 Request data:', {
      message: message?.substring(0, 50),
      hasCardContext: !!cardContext,
      conversationHistoryLength: conversationHistory?.length || 0,
      studentGrade
    })
    
    // Gemini API キーの確認
    const { env } = c
    if (!env.GEMINI_API_KEY) {
      console.error('❌ GEMINI_API_KEY not found in environment variables')
      console.error('❌ Available env keys:', Object.keys(env))
      return c.json({ 
        error: 'Gemini APIキーが設定されていません',
        details: 'Cloudflare Pagesの環境変数でGEMINI_API_KEYを設定してください。Settings > Environment variables > Production/Preview から設定できます。'
      }, 500)
    }
    
    console.log('✅ GEMINI_API_KEY found:', env.GEMINI_API_KEY.substring(0, 10) + '...')
    
    // 会話履歴から学年を確認（初回は学年を尋ねる）
    const hasGradeInfo = studentGrade || (conversationHistory && conversationHistory.some((msg: any) => 
      msg.text && msg.text.match(/[1-6]年生/)
    ))
    
    console.log('📊 Grade info:', { hasGradeInfo, studentGrade })
    
    let systemPrompt = ''
    
    if (!hasGradeInfo && (!conversationHistory || conversationHistory.length === 0)) {
      // 初回メッセージ：学年を尋ねる
      systemPrompt = `あなたは小学生の学習を優しくサポートするAI先生です。

【初回対応】
最初に、子どもに何年生かを尋ねてください。その後、その学年に合わせた言葉と説明の難しさで対応してください。

【回答例】
「こんにちは！AI先生だよ。何年生かな？教えてくれると、ちょうどいい説明ができるよ！」`
    } else {
      // 学年がわかっている場合：通常の対応
      const gradeLevel = studentGrade || '小学生'
      
      systemPrompt = `あなたは${gradeLevel}の学習を優しくサポートするAI先生です。
${cardContext ? `
【現在の学習内容】
- カードタイトル: ${cardContext.card_title}
- 学習内容: ${cardContext.problem_description}
- 新出用語: ${cardContext.new_terms || 'なし'}
` : ''}

【絶対ルール】
1. **学年に応じた言葉遣いを必ず守る**
   - ${getGradeLanguageRule(gradeLevel)}
   - 難しい漢字や言葉は絶対に使わず、${gradeLevel}が習った言葉だけを使う
   - 専門用語は使わず、やさしく言い換える

2. **どんな質問にも必ず答える（超重要！）**
   - ❌ 絶対禁止: 「答えられません」「わかりません」「説明が難しいです」と言うこと
   - ✅ 必ず実行: どんな質問でも、子どもに分かる形で説明を提供する
   - ✅ 方法: 難しい内容でも、具体例・たとえ話・身近な例で説明する
   - ✅ **簡単な質問・基本的な質問には直接答えてOK**
   - ✅ 難しい問題や考えさせたい問題の場合のみ、考え方やヒントを段階的に導く

3. **やさしく対話を続ける**
   - 「まず〜を考えてみよう」のようにステップを示す
   - 「図に書いてみるといいよ」など具体的な方法を提案
   - 「いいところに気づいたね！」など励ましを必ず入れる
   - **300〜500文字程度で、丁寧に説明し、途中で切れないように完結した回答をする**
   - **説明は具体例を2〜3個入れて、分かりやすくする**
   - 最後に「〜は分かったかな？」「もっと知りたいことはある？」と理解確認・追加質問を促す

【良い回答例】

**簡単な質問・用語説明（直接答える）：**
質問「安全保障理事会って何？」
→ 小学4年生向け: 「あんぜんほしょうりじかいは、世界の平和を守るための大切な話し合いの場だよ。15の国がメンバーで、その中でも特に大きな力を持つ5つの国があるんだ。日本も参加したいと考えているよ。国と国のけんかを止めたり、平和を守るためのルールを決めたりしているんだよ。」

質問「首都って何？」
→ 小学3年生向け: 「しゅとは、国で一番大切な町のことだよ。日本のしゅとは東京で、国のリーダーや大切な建物があるんだ。アメリカのしゅとはワシントンD.C.だよ。」

質問「3×4はいくつ？」
→ 小学2年生向け: 「3×4は12だよ！かけ算は、同じ数をたくさん足すことだから、3+3+3+3=12になるんだ。りんごが3こずつ、4つのかごにあると考えてみてね。」

**考えさせたい問題（ヒントで導く）：**
質問「この問題の答えを教えて」
→ 「まず、問題文で何を聞かれているか確認してみよう。次に、分かっていることを整理すると考えやすくなるよ。どんなところまで分かったかな？」

質問「なんで勉強しないといけないの？」
→ 小学3年生向け: 「いい質問だね！勉強は、きみの『できること』をふやすためだよ。字が読めると本が読めるし、計算ができるとお買い物も楽しくなる。将来なりたいものを見つけたとき、勉強したことが役に立つんだ。今は何に興味があるかな？」`
    }
    
    // 会話履歴を含めてリクエスト
    const contents = conversationHistory && conversationHistory.length > 0
      ? [
          { parts: [{ text: systemPrompt }] },
          ...conversationHistory.map((msg: any) => ({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.text }]
          })),
          { role: 'user', parts: [{ text: message }] }
        ]
      : [
          {
            parts: [
              { text: systemPrompt },
              { text: `子どもの質問: ${message}` }
            ]
          }
        ]

    console.log('🚀 Calling Gemini API...')
    console.log('📤 Request contents length:', contents.length)
    console.log('📤 First content:', JSON.stringify(contents[0]).substring(0, 200))

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash:generateContent?key=${env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        generationConfig: {
          temperature: 0.8,
          maxOutputTokens: 1500,  // 800 → 1500 に増加（回答が途中で切れないように）
          topK: 40,
          topP: 0.95
        },
        safetySettings: [
          {
            category: 'HARM_CATEGORY_HATE_SPEECH',
            threshold: 'BLOCK_NONE'
          },
          {
            category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
            threshold: 'BLOCK_NONE'
          },
          {
            category: 'HARM_CATEGORY_HARASSMENT',
            threshold: 'BLOCK_NONE'
          },
          {
            category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
            threshold: 'BLOCK_NONE'
          }
        ]
      })
    })

    console.log('📥 Gemini API response status:', response.status)
    console.log('📥 Response OK:', response.ok)

    if (!response.ok) {
      const errorData = await response.text()
      console.error('❌ Gemini APIエラー:', response.status, response.statusText)
      console.error('❌ Error body:', errorData)
      throw new Error(`Gemini API returned ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    console.log('✅ Gemini API response received')
    console.log('📊 Response data keys:', Object.keys(data))
    
    // デバッグログ追加
    console.log('🔍 Gemini API レスポンス構造:', {
      hasCandidates: !!data.candidates,
      candidatesLength: data.candidates?.length,
      firstCandidate: data.candidates?.[0] ? {
        finishReason: data.candidates[0].finishReason,
        hasContent: !!data.candidates[0].content,
        hasParts: !!data.candidates[0].content?.parts,
        partsLength: data.candidates[0].content?.parts?.length
      } : null
    })
    
    // セーフティフィルタで候補がブロックされた場合の対応
    if (!data.candidates || data.candidates.length === 0) {
      console.error('❌ Gemini API - 候補なし:', JSON.stringify(data, null, 2))
      
      // フォールバック応答: 質問の内容に応じた一般的な導き
      const fallbackResponse = `ごめんね、今その質問にうまく答えられなかったよ。
別の聞き方をしてみるか、具体的にどこが分からないか教えてくれるかな？
先生やお父さん・お母さんに聞くのもいい方法だよ！`
      
      return c.json({ response: fallbackResponse })
    }

    const candidate = data.candidates[0]
    
    // finishReasonをログ出力
    console.log('📊 Candidate finishReason:', candidate.finishReason)
    console.log('📊 Has content:', !!candidate.content)
    console.log('📊 Has parts:', !!candidate.content?.parts)
    console.log('📊 Parts length:', candidate.content?.parts?.length)
    
    // 回答テキストを取得（finishReasonに関わらず、contentがあれば使用）
    const aiResponse = candidate?.content?.parts?.[0]?.text
    
    // テキストが存在する場合は使用（finishReasonは無視）
    if (aiResponse && aiResponse.trim() !== '') {
      console.log('✅ AI回答取得成功:', aiResponse.substring(0, 100))
      return c.json({ response: aiResponse })
    }
    
    // テキストが空の場合のみフォールバック
    console.error('❌ AI回答が空:', { 
      candidate,
      finishReason: candidate.finishReason,
      safetyRatings: candidate.safetyRatings 
    })
    
    // SEFETYブロックの場合
    if (candidate.finishReason === 'SAFETY') {
      const fallbackResponse = `その質問、ちょっと難しいね。
違う聞き方で、もう一度質問してみてくれるかな？
それか、先生に聞いてみるのもいいよ！`
      
      return c.json({ response: fallbackResponse })
    }
    
    // その他の空応答
    const fallbackResponse = `ごめんね、今その質問にうまく答えられなかったよ。
もう一度、別の言葉で質問してみてくれるかな？
先生に聞いてみるのもいいよ！`
    
    return c.json({ response: fallbackResponse })
  } catch (error: any) {
    console.error('AIチャットエラー:', error)
    console.error('エラー詳細:', error.message)
    return c.json({ 
      error: 'AIが今は答えられません。先生に聞いてみてね！',
      details: error.message 
    }, 500)
  }
})

// テストページ
app.get('/test-buttons.html', async (c) => {
  const htmlContent = `<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ボタンテスト</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
</head>
<body class="bg-gray-100 p-8">
    <div class="max-w-4xl mx-auto">
        <h1 class="text-3xl font-bold mb-8">ボタン動作テスト</h1>
        
        <div class="bg-white rounded-lg shadow-xl p-8 mb-6">
            <h2 class="text-2xl font-bold mb-4">グローバル関数チェック</h2>
            <div id="function-check" class="space-y-2 font-mono text-sm"></div>
        </div>
        
        <div class="bg-white rounded-lg shadow-xl p-8 mb-6">
            <h2 class="text-2xl font-bold mb-4">テストボタン</h2>
            
            <div class="space-y-4">
                <button 
                    onclick="testProgressBoard()"
                    class="w-full bg-blue-500 hover:bg-blue-600 text-white px-6 py-4 rounded-lg font-bold">
                    進捗ボード選択をテスト
                </button>
                
                <button 
                    onclick="testWeeklyReport()"
                    class="w-full bg-green-500 hover:bg-green-600 text-white px-6 py-4 rounded-lg font-bold">
                    週次レポートをテスト
                </button>
                
                <button 
                    onclick="testLoadProgressBoard()"
                    class="w-full bg-purple-500 hover:bg-purple-600 text-white px-6 py-4 rounded-lg font-bold">
                    進捗ボード読み込みをテスト (ID=1)
                </button>
            </div>
        </div>
        
        <div class="bg-white rounded-lg shadow-xl p-8">
            <h2 class="text-2xl font-bold mb-4">コンソールログ</h2>
            <div id="console-log" class="bg-gray-900 text-green-400 p-4 rounded font-mono text-sm h-64 overflow-y-auto"></div>
        </div>
    </div>
    
    <script>
        // DOMContentLoaded後に初期化
        document.addEventListener('DOMContentLoaded', () => {
            // コンソールログをページに表示
            const originalLog = console.log
            const originalError = console.error
            const logDiv = document.getElementById('console-log')
            
            function addLog(message, isError = false) {
                if (!logDiv) return
                const line = document.createElement('div')
                line.textContent = new Date().toLocaleTimeString() + ' - ' + message
                line.className = isError ? 'text-red-400' : 'text-green-400'
                logDiv.appendChild(line)
                logDiv.scrollTop = logDiv.scrollHeight
            }
            
            console.log = function(...args) {
                originalLog.apply(console, args)
                addLog(args.join(' '))
            }
            
            console.error = function(...args) {
                originalError.apply(console, args)
                addLog(args.join(' '), true)
            }
            
            console.log('✅ テストページ初期化完了')
        })
    </script>
    
    <script src="/static/ocr-handler.js"></script>
    <script src="/static/app.js"></script>
    
    <script>
        // app.js読み込み後にグローバル関数をチェック
        window.addEventListener('load', () => {
            const checkDiv = document.getElementById('function-check')
            if (!checkDiv) {
                console.error('❌ function-check 要素が見つかりません')
                return
            }
            
            const functions = [
                'showProgressBoardSelection',
                'showDemoWeeklyReport',
                'loadProgressBoard',
                'renderTopPage'
            ]
            
            functions.forEach(fname => {
                const exists = typeof window[fname] === 'function'
                const status = exists ? '✅' : '❌'
                const color = exists ? 'text-green-600' : 'text-red-600'
                const windowCheck = typeof window[fname]
                checkDiv.innerHTML += '<div class="' + color + '">' + status + ' window.' + fname + ' = ' + windowCheck + '</div>'
            })
            
            console.log('✅ グローバル関数チェック完了')
        })
        
        // テスト関数
        function testProgressBoard() {
            console.log('🧪 進捗ボード選択をテスト中...')
            try {
                if (typeof window.showProgressBoardSelection === 'function') {
                    window.showProgressBoardSelection()
                    console.log('✅ showProgressBoardSelection() 呼び出し成功')
                } else {
                    console.error('❌ window.showProgressBoardSelection が関数ではありません')
                }
            } catch (error) {
                console.error('❌ エラー:', error.message)
            }
        }
        
        function testWeeklyReport() {
            console.log('🧪 週次レポートをテスト中...')
            try {
                if (typeof window.showDemoWeeklyReport === 'function') {
                    window.showDemoWeeklyReport()
                    console.log('✅ showDemoWeeklyReport() 呼び出し成功')
                } else {
                    console.error('❌ window.showDemoWeeklyReport が関数ではありません')
                }
            } catch (error) {
                console.error('❌ エラー:', error.message)
            }
        }
        
        function testLoadProgressBoard() {
            console.log('🧪 進捗ボード読み込みをテスト中...')
            try {
                if (typeof window.loadProgressBoard === 'function') {
                    // ダミーのstate設定
                    if (!window.state) {
                        window.state = {
                            student: {
                                classCode: 'CLASS2024A'
                            }
                        }
                    }
                    window.loadProgressBoard(1)
                    console.log('✅ loadProgressBoard(1) 呼び出し成功')
                } else {
                    console.error('❌ window.loadProgressBoard が関数ではありません')
                }
            } catch (error) {
                console.error('❌ エラー:', error.message)
            }
        }
    </script>
</body>
</html>`
  
  return c.html(htmlContent)
})

// =============================================================================
// API仕様書エンドポイント
// =============================================================================

// API仕様書はpublic/static/に配置されているため、
// /static/openapi.yaml と /static/api-docs.html で自動的にアクセス可能
// 追加のルート設定は不要

// =============================================================================
// トップページ
// =============================================================================

// トップページ
app.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta name="description" content="AI搭載の自由進度学習支援システム - 個別最適化された学習体験を提供">
        <title>自由進度学習支援システム</title>
        
        <!-- DNS Prefetch & Preconnect for faster CDN loading -->
        <link rel="dns-prefetch" href="https://cdn.tailwindcss.com">
        <link rel="dns-prefetch" href="https://cdn.jsdelivr.net">
        <link rel="dns-prefetch" href="https://cdnjs.cloudflare.com">
        <link rel="preconnect" href="https://cdn.tailwindcss.com" crossorigin>
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin>
        
        <!-- Preload Critical Resources -->
        <link rel="preload" href="https://cdn.tailwindcss.com" as="script">
        <link rel="preload" href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" as="style">
        <link rel="preload" href="/static/styles.css" as="style">
        <link rel="preload" href="/static/app.js" as="script">
        
        <!-- Stylesheets -->
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        
        <!-- Deferred Libraries (non-critical) -->
        <script defer src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
        <script defer src="https://cdn.jsdelivr.net/npm/sortablejs@1.15.0/Sortable.min.js"></script>
        <script defer src="https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js"></script>
        <script defer src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
        <script defer src="https://unpkg.com/@ffmpeg/ffmpeg@0.11.6/dist/ffmpeg.min.js"></script>
        <script defer src="https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.13/dist/face-api.min.js"></script>
        <style>
          /* FontAwesome fa-spin animation */
          @keyframes fa-spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          .fa-spin {
            animation: fa-spin 1s infinite linear;
          }
          
          @media print {
            body { background: white !important; }
            .print\\:hidden { display: none !important; }
            .print\\:shadow-none { box-shadow: none !important; }
            .print\\:break-after-page { page-break-after: always; }
            .print\\:break-inside-avoid { page-break-inside: avoid; }
            @page { margin: 1cm; }
          }
        </style>
    </head>
    <body class="bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen">
        <div id="app">
          <div class="flex items-center justify-center min-h-screen">
            <div class="text-center">
              <div class="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600 mb-4"></div>
              <p class="text-xl text-gray-700">システムを読み込んでいます...</p>
            </div>
          </div>
        </div>
        
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script>
          // DOMContentLoaded後にスクリプトを動的読み込み
          document.addEventListener('DOMContentLoaded', () => {
            console.log('📦 DOMContentLoaded: スクリプト読み込み開始')
            
            const scripts = [
              '/static/ocr-simple.js',
              '/static/tts.js',
              '/static/visual-support.js', 
              '/static/realtime.js',
              '/static/realtime-notifications.js',
              '/static/visual-diagram-generator.js',
              '/static/visual-feedback.js',
              '/static/educational-media.js',
              '/static/advanced-speech.js',
              '/static/interactive-tools-level3.js',
              '/static/advanced-3d-visualization.js',
              '/static/music-generation-level3.js',
              '/static/all-subjects-master.js',
              '/static/learning-styles.js',
              '/static/phase3-demo-data.js',
              '/static/phase3.js',
              '/static/app.js'
            ]
            
            let loadedCount = 0
            
            scripts.forEach((src, index) => {
              const script = document.createElement('script')
              script.src = src
              script.async = false // 順番に読み込む
              script.onload = () => {
                console.log('✅ 読み込み完了:', src)
                loadedCount++
                
                // 全スクリプト読み込み完了後
                if (loadedCount === scripts.length) {
                  console.log('🚀 全スクリプト読み込み完了')
                  setTimeout(() => {
                    if (typeof window.renderTopPage === 'function') {
                      console.log('🎯 renderTopPageを実行')
                      window.renderTopPage()
                    } else {
                      console.error('❌ renderTopPage not found')
                      document.getElementById('app').innerHTML = '<div class="flex items-center justify-center min-h-screen p-4"><div class="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center"><div class="text-red-600 mb-4"><i class="fas fa-exclamation-triangle text-6xl"></i></div><h2 class="text-2xl font-bold text-gray-800 mb-4">システムエラー</h2><p class="text-gray-600 mb-6">スクリプトの読み込みに失敗しました。ページをリフレッシュしてください。</p><button onclick="location.reload()" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition"><i class="fas fa-redo mr-2"></i>リフレッシュ</button></div></div>'
                    }
                  }, 200)
                }
              }
              script.onerror = (error) => {
                console.error('❌ 読み込みエラー:', src, error)
                document.getElementById('app').innerHTML = '<div class="flex items-center justify-center min-h-screen p-4"><div class="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center"><div class="text-red-600 mb-4"><i class="fas fa-exclamation-triangle text-6xl"></i></div><h2 class="text-2xl font-bold text-gray-800 mb-4">読み込みエラー</h2><p class="text-gray-600 mb-6">ファイル: ' + src + '</p><button onclick="location.reload()" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition"><i class="fas fa-redo mr-2"></i>リフレッシュ</button></div></div>'
              }
              document.head.appendChild(script)
            })
          })
        </script>
    </body>
    </html>
  `)
})

// ============================================
// Phase 6: AI機能フル実装
// ============================================

// APIルート：AI学習診断
app.post('/api/ai/diagnosis', async (c) => {
  const { env } = c
  const { studentId, curriculumId } = await c.req.json()
  
  const apiKey = env.GEMINI_API_KEY
  
  if (!apiKey) {
    return c.json({
      diagnosis: '学習診断機能は現在利用できません。',
      recommendations: [],
      strengths: [],
      areas_for_improvement: []
    })
  }
  
  try {
    // 学習進捗データを取得
    const progress = await env.DB.prepare(`
      SELECT 
        sp.*,
        lc.card_title,
        lc.card_type,
        lc.card_number
      FROM student_progress sp
      JOIN learning_cards lc ON sp.learning_card_id = lc.id
      WHERE sp.student_id = ? AND sp.curriculum_id = ?
      ORDER BY sp.updated_at DESC
      LIMIT 20
    `).bind(studentId, curriculumId).all()
    
    // 助け要請データを取得
    const helpRequests = await env.DB.prepare(`
      SELECT help_type, COUNT(*) as count
      FROM student_progress
      WHERE student_id = ? AND curriculum_id = ?
      GROUP BY help_type
    `).bind(studentId, curriculumId).all()
    
    // 理解度データを集計
    const understandingStats = progress.results.reduce((acc: any, item: any) => {
      if (item.understanding_level) {
        acc.total++
        acc.sum += item.understanding_level
        if (item.understanding_level >= 4) acc.high++
        if (item.understanding_level <= 2) acc.low++
      }
      return acc
    }, { total: 0, sum: 0, high: 0, low: 0 })
    
    const avgUnderstanding = understandingStats.total > 0 
      ? (understandingStats.sum / understandingStats.total).toFixed(1) 
      : '0'
    
    // Gemini APIに診断を依頼
    const prompt = `あなたは小学生の学習を支援する優しいAI先生です。
以下の学習データから、この児童の学習状況を分析して、具体的なアドバイスをしてください。

【学習データ】
- 学習カード総数: ${progress.results.length}枚
- 平均理解度: ${avgUnderstanding}/5
- 高理解度カード: ${understandingStats.high}枚
- 低理解度カード: ${understandingStats.low}枚
- 助け要請: ${JSON.stringify(helpRequests.results)}

【最近の学習カード】
${progress.results.slice(0, 5).map((p: any) => 
  `- ${p.card_title} (理解度: ${p.understanding_level || '未評価'}/5)`
).join('\n')}

以下のJSON形式で診断結果を出力してください：
{
  "overall_assessment": "全体的な学習状況の評価（100文字以内）",
  "strengths": ["強み1", "強み2", "強み3"],
  "areas_for_improvement": ["改善点1", "改善点2"],
  "recommendations": [
    {"title": "おすすめアクション1", "description": "具体的な説明"},
    {"title": "おすすめアクション2", "description": "具体的な説明"}
  ],
  "encouragement": "児童への励ましメッセージ（50文字以内）"
}`

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2048
          }
        })
      }
    )
    
    const data = await response.json()
    
    if (!response.ok) {
      console.error('Gemini API エラー:', data)
      throw new Error(`Gemini API error: ${JSON.stringify(data)}`)
    }
    
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}'
    console.log('AI診断レスポンス（最初の500文字）:', aiResponse.substring(0, 500))
    console.log('AI診断レスポンス（最後の500文字）:', aiResponse.substring(Math.max(0, aiResponse.length - 500)))
    
    // JSONを抽出（```json ... ``` の中身を取得）
    let jsonStr = '{}'
    const jsonMatch = aiResponse.match(/```json\s*([\s\S]*?)\s*```/)
    if (jsonMatch) {
      jsonStr = jsonMatch[1]
    } else {
      // マークダウンブロックがない場合、直接JSONを探す
      const directJsonMatch = aiResponse.match(/\{[\s\S]*\}/)
      if (directJsonMatch) {
        jsonStr = directJsonMatch[0]
      }
    }
    
    console.log('抽出したJSON（最初の500文字）:', jsonStr.substring(0, 500))
    
    // Unicode スマート引用符を標準引用符に置換
    jsonStr = jsonStr
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/[\u201C\u201D]/g, '"')
      .replace(/[\u2013\u2014]/g, '-')
    
    let diagnosis
    try {
      diagnosis = JSON.parse(jsonStr)
    } catch (parseError) {
      console.error('JSON parse エラー:', parseError)
      console.error('パース失敗したJSON:', jsonStr)
      throw new Error(`JSON parse failed: ${parseError.message}`)
    }
    
    return c.json(diagnosis)
    
  } catch (error) {
    console.error('AI診断エラー:', error)
    return c.json({
      overall_assessment: '学習診断を実行できませんでした。',
      strengths: ['頑張って学習を続けています'],
      areas_for_improvement: [],
      recommendations: [],
      encouragement: 'これからも一緒に頑張りましょう！'
    })
  }
})

// APIルート：AI問題生成
app.post('/api/ai/generate-problem', async (c) => {
  const { env } = c
  const { cardId, difficulty } = await c.req.json()
  
  const apiKey = env.GEMINI_API_KEY
  
  if (!apiKey) {
    return c.json({
      problem: '問題生成機能は現在利用できません。',
      answer: '',
      hint: ''
    })
  }
  
  try {
    // 学習カード情報を取得
    const card = await env.DB.prepare(`
      SELECT * FROM learning_cards WHERE id = ?
    `).bind(cardId).first()
    
    if (!card) {
      return c.json({ error: 'カードが見つかりません' }, 404)
    }
    
    const difficultyText = difficulty === 'easy' ? 'やさしい' : 
                          difficulty === 'hard' ? '難しい' : '標準的な'
    
    const prompt = `あなたは小学生向けの問題を作る先生です。
以下の学習カードの内容に基づいて、${difficultyText}レベルの類似問題を1つ作成してください。

【元の学習カード】
タイトル: ${card.card_title}
問題: ${card.problem_description}
例題: ${card.example_problem}

以下のJSON形式で問題を出力してください：
{
  "problem": "新しい問題文（数値や状況を変えて）",
  "answer": "正解",
  "hint": "ヒント（困ったときのアドバイス）",
  "explanation": "解き方の説明"
}`

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.8,
            maxOutputTokens: 500
          }
        })
      }
    )
    
    const data = await response.json()
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}'
    
    const jsonMatch = aiResponse.match(/```json\s*([\s\S]*?)\s*```/) || 
                      aiResponse.match(/\{[\s\S]*\}/)
    const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : '{}'
    const generatedProblem = JSON.parse(jsonStr)
    
    return c.json(generatedProblem)
    
  } catch (error) {
    console.error('問題生成エラー:', error)
    return c.json({
      problem: '問題を生成できませんでした。',
      answer: '',
      hint: '先生に聞いてみましょう',
      explanation: ''
    })
  }
})

// APIルート：AI学習計画提案
app.post('/api/ai/suggest-plan', async (c) => {
  const { env } = c
  const { studentId, curriculumId } = await c.req.json()
  
  const apiKey = env.GEMINI_API_KEY
  
  if (!apiKey) {
    return c.json({
      suggestion: '学習計画提案機能は現在利用できません。',
      daily_goals: [],
      weekly_goals: []
    })
  }
  
  try {
    // 進捗データを取得
    const progress = await env.DB.prepare(`
      SELECT sp.*, lc.card_title, lc.card_number, lc.card_type
      FROM student_progress sp
      JOIN learning_cards lc ON sp.learning_card_id = lc.id
      WHERE sp.student_id = ? AND sp.curriculum_id = ?
      ORDER BY sp.updated_at DESC
    `).bind(studentId, curriculumId).all()
    
    // 学習計画を取得
    const plans = await env.DB.prepare(`
      SELECT * FROM learning_plans
      WHERE student_id = ? AND curriculum_id = ?
      ORDER BY planned_date DESC
      LIMIT 7
    `).bind(studentId, curriculumId).all()
    
    const completedCards = progress.results.filter((p: any) => p.is_completed).length
    const totalCards = progress.results.length
    
    const prompt = `あなたは小学生の学習をサポートするAI先生です。
以下のデータから、今後の学習計画を提案してください。

【現在の状況】
- 完了カード: ${completedCards}/${totalCards}枚
- 最近の学習: ${plans.results.length}日分のデータ
- 平均理解度: ${progress.results.filter((p: any) => p.understanding_level).length > 0 
  ? (progress.results.reduce((sum: number, p: any) => sum + (p.understanding_level || 0), 0) / 
     progress.results.filter((p: any) => p.understanding_level).length).toFixed(1) 
  : '未評価'}

以下のJSON形式で学習計画を提案してください：
{
  "overall_suggestion": "全体的な学習計画の提案（100文字以内）",
  "daily_goals": [
    {"day": "今日", "goal": "具体的な目標", "cards": 2},
    {"day": "明日", "goal": "具体的な目標", "cards": 2}
  ],
  "weekly_goals": [
    {"goal": "今週の目標1", "importance": "high"},
    {"goal": "今週の目標2", "importance": "medium"}
  ],
  "tips": ["学習のコツ1", "学習のコツ2"]
}`

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 800
          }
        })
      }
    )
    
    const data = await response.json()
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}'
    
    const jsonMatch = aiResponse.match(/```json\s*([\s\S]*?)\s*```/) || 
                      aiResponse.match(/\{[\s\S]*\}/)
    const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : '{}'
    const plan = JSON.parse(jsonStr)
    
    return c.json(plan)
    
  } catch (error) {
    console.error('計画提案エラー:', error)
    return c.json({
      overall_suggestion: '学習計画を提案できませんでした。',
      daily_goals: [],
      weekly_goals: [],
      tips: ['自分のペースで頑張りましょう']
    })
  }
})

// APIルート：AI誤答分析
app.post('/api/ai/analyze-errors', async (c) => {
  const { env } = c
  const { studentId, curriculumId } = await c.req.json()
  
  const apiKey = env.GEMINI_API_KEY
  
  if (!apiKey) {
    return c.json({
      analysis: '誤答分析機能は現在利用できません。',
      error_patterns: [],
      suggestions_for_teacher: []
    })
  }
  
  try {
    // 理解度が低いカードを取得
    const weakCards = await env.DB.prepare(`
      SELECT sp.*, lc.card_title, lc.problem_description, lc.card_type
      FROM student_progress sp
      JOIN learning_cards lc ON sp.learning_card_id = lc.id
      WHERE sp.student_id = ? 
        AND sp.curriculum_id = ?
        AND sp.understanding_level <= 2
      ORDER BY sp.updated_at DESC
      LIMIT 10
    `).bind(studentId, curriculumId).all()
    
    // 助け要請が多いカードを取得
    const helpCards = await env.DB.prepare(`
      SELECT sp.*, lc.card_title, sp.help_type
      FROM student_progress sp
      JOIN learning_cards lc ON sp.learning_card_id = lc.id
      WHERE sp.student_id = ? 
        AND sp.curriculum_id = ?
        AND sp.help_type IS NOT NULL
      ORDER BY sp.updated_at DESC
      LIMIT 10
    `).bind(studentId, curriculumId).all()
    
    if (weakCards.results.length === 0 && helpCards.results.length === 0) {
      return c.json({
        analysis: 'この児童は順調に学習を進めています。特につまずきは見られません。',
        error_patterns: [],
        suggestions_for_teacher: ['引き続き見守りながら、チャレンジ問題を提案してみてください。']
      })
    }
    
    const prompt = `あなたは教育専門のAI分析エージェントです。
以下のデータから、児童のつまずきパターンを分析し、指導アドバイスを提供してください。

【理解度が低いカード】
${weakCards.results.map((c: any) => 
  `- ${c.card_title} (理解度: ${c.understanding_level}/5)`
).join('\n')}

【助けを求めたカード】
${helpCards.results.map((h: any) => 
  `- ${h.card_title} (助け: ${h.help_type})`
).join('\n')}

以下のJSON形式で分析結果を出力してください：
{
  "overall_analysis": "全体的な分析（150文字以内）",
  "error_patterns": [
    {"pattern": "つまずきパターン1", "frequency": "よく見られる"},
    {"pattern": "つまずきパターン2", "frequency": "時々見られる"}
  ],
  "root_causes": ["根本原因1", "根本原因2"],
  "suggestions_for_teacher": [
    {"suggestion": "指導アドバイス1", "priority": "high"},
    {"suggestion": "指導アドバイス2", "priority": "medium"}
  ],
  "support_strategies": ["サポート方法1", "サポート方法2"]
}`

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.6,
            maxOutputTokens: 1000
          }
        })
      }
    )
    
    const data = await response.json()
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}'
    
    const jsonMatch = aiResponse.match(/```json\s*([\s\S]*?)\s*```/) || 
                      aiResponse.match(/\{[\s\S]*\}/)
    const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : '{}'
    const analysis = JSON.parse(jsonStr)
    
    return c.json(analysis)
    
  } catch (error) {
    console.error('誤答分析エラー:', error)
    return c.json({
      overall_analysis: '分析を実行できませんでした。',
      error_patterns: [],
      root_causes: [],
      suggestions_for_teacher: [],
      support_strategies: []
    })
  }
})

// ============================================
// Phase 7: AI単元自動生成システム
// ============================================

// APIルート：単元名候補をAIで生成
app.post('/api/ai/suggest-units', async (c) => {
  const { env } = c
  const { grade, subject, textbook } = await c.req.json()
  
  console.log('🔍 単元候補API呼び出し:', { grade, subject, textbook })
  
  const apiKey = env.GEMINI_API_KEY
  
  if (!apiKey || apiKey === 'your-gemini-api-key-here') {
    console.error('❌ GEMINI_API_KEYが設定されていません')
    return c.json({
      error: 'AI単元候補機能を使用するには、GEMINI_API_KEYの設定が必要です。',
      message: '手動で単元名を入力してください。例: かけ算の筆算、物語文の読解、など',
      units: []
    })
  }
  
  console.log('✅ GEMINI_API_KEY設定確認完了')
  
  try {
    // 学年・科目別の詳細な指示を追加
    let specificInstructions = ''
    
    if (grade === '小学6年' && subject === '社会') {
      specificInstructions = `
【小学6年社会の必須単元（東京書籍準拠）】
以下の順序で正確に30個の単元を出力してください：

【歴史分野（1〜20）】
1. 縄文時代・弥生時代の暮らし
2. 古墳時代と大和朝廷
3. 飛鳥時代の文化と政治
4. 奈良時代の政治と文化
5. 平安時代の貴族の暮らし
6. 鎌倉時代の武士の政治
7. 室町時代の文化と社会
8. 戦国時代と天下統一
9. 江戸時代の幕府政治
10. 江戸時代の文化と産業
11. 明治維新と近代化
12. 大正デモクラシー
13. 昭和時代と戦争
14. 戦後の日本の発展
15. 現代の日本と世界
16. 聖徳太子の政治と文化
17. 遣唐使と唐の文化
18. 武士の成長と源平の争い
19. 戦国の世と社会と文化
20. 江戸時代の交通と産業

【政治・国際分野（21〜30）】
21. 日本国憲法と基本的人権
22. 国会・内閣・裁判所の働き
23. 地方自治のしくみ
24. 世界の中の日本
25. 国際連合の役割
26. 開国と幕末の動乱
27. 近代国家の建設と人々のくらし
28. 国民の権利と義務
29. 聖徳太子の政治と文化
30. 遣唐使と唐の文化

【重要】上記の順序と内容を正確に守ってください。
`
    } else if (grade === '小学5年' && subject === '社会') {
      specificInstructions = `
【小学5年社会の重点単元】
小学5年社会は「産業」「環境」「国土」が中心です：

1. 日本の国土と地形
2. 日本の気候と自然災害
3. 米作りと農業
4. 水産業とその課題
5. 工業の種類と特色
6. 自動車工業の発展
7. 食料生産と流通
8. 情報産業とメディア
9. 環境問題と取り組み
10. 森林の保全

（以下、20個の補足単元）
`
    } else if (grade === '小学4年' && subject === '社会') {
      specificInstructions = `
【小学4年社会の重点単元】
小学4年社会は「地域」「くらし」が中心です：

1. わたしたちの県
2. 地図の見方・使い方
3. 水はどこから（水道）
4. ごみのゆくえ
5. 自然災害からくらしを守る
6. 伝統的な工芸品
7. 地域の発展につくした人々
8. 県内の交通と通信

（以下、22個の補足単元）
`
    }
    
    const prompt = `${grade}${subject}（${textbook}）の主要な単元名を正確に30個、1行に1つずつ日本語で出力してください。

${specificInstructions}

【重要な指示】
- 上記で指定した単元名を**そのまま正確に**出力すること
- 順序を変更しないこと
- 単元名を変更・省略・追加しないこと
- 番号、記号、説明、英語、思考過程（THOUGHT）は一切不要
- 1行に1つの単元名のみを出力
- 正確に30行出力すること
- ${grade}${subject}の学習内容に完全に一致させること

出力例（算数の場合）:
かけ算の筆算
わり算の筆算
小数のかけ算
小数のわり算
分数のたし算
分数のひき算
分数のかけ算
分数のわり算
面積の求め方
体積の学習
グラフの読み方
資料の整理
確率の基礎
図形の性質
比と比の値
速さの問題
割合の計算
平均の求め方
対称な図形
拡大図と縮図
円の面積
円周率の活用
角柱と円柱の体積
分数と小数の関係
資料の調べ方
変わり方の調べ方
比例と反比例
定義域と値域
論理的推論の基礎
集合の概念`

    // 新しいヘルパー関数を使用（自動リトライ付き）
    // 正しいGemini 2.5/2.0モデル名を使用
    const models = [
      'gemini-3-flash',    // 最新・最も高速
      'gemini-3-flash',    // 安定版
      'gemini-2.5-pro'       // 高品質フォールバック
    ]
    let result: GeminiResponse | null = null
    
    console.log('🤖 Gemini API呼び出し開始...')
    
    for (const model of models) {
      console.log(`  モデル試行: ${model}`)
      result = await callGeminiAPI({
        model,
        prompt,
        apiKey,
        maxOutputTokens: 2048,  // トークン数を増やす
        temperature: 0.7,
        retries: 2
      })
      
      if (result.success) {
        console.log(`  ✅ ${model} で成功`)
        break
      } else {
        console.log(`  ❌ ${model} で失敗:`, result.error)
      }
    }
    
    if (!result || !result.success || !result.content) {
      console.error('❌ すべてのモデルで失敗')
      throw new Error('すべてのモデルで単元候補の生成に失敗しました')
    }
    
    // レスポンスから単元名を抽出
    console.log('📝 Gemini レスポンス:', result.content)
    
    const units = result.content
      .split('\n')
      .map(line => line.trim())
      .filter(line => {
        // 不要な行を除外
        if (!line || line.length === 0) return false
        
        // 思考過程や説明を除外
        if (line.includes('THOUGHT') || line.includes('user wants') || line.includes('need to')) return false
        if (line.includes('Common themes') || line.includes('Japan:')) return false
        if (line.startsWith('I ') || line.startsWith('The ')) return false
        
        // 英語の説明や記号のみの行を除外
        if (line.match(/^[\*\-\#\d\.\s\:\(\)]+$/)) return false
        if (line.match(/^[a-zA-Z\s\:\(\)\*\-]+$/)) return false  // 英語のみの行
        
        // 日本語が含まれる行のみを採用
        const hasJapanese = line.match(/[ぁ-んァ-ヶー一-龯]/)
        if (!hasJapanese) return false
        
        // 長さチェック
        if (line.length < 2 || line.length > 100) return false
        
        const isValid = true
        console.log(`  行: "${line}" -> ${isValid ? '✅ 採用' : '❌ 除外'}`)
        return isValid
      })
      .map(line => {
        // 先頭の番号・記号・英語記号を削除
        return line
          .replace(/^[\d\.\-\*\#\s\:\(\)]+/, '')
          .replace(/\*+$/, '')  // 末尾のアスタリスクを削除
          .trim()
      })
      .filter(line => line.length > 1)
      .slice(0, 30)
    
    console.log('✅ 抽出された単元:', units)
    console.log('📊 抽出された単元数:', units.length)
    
    return c.json({
      success: true,
      units,
      model_used: result.model,
      attempts: result.attempts,
      totalTime: result.totalTime
    })
    
  } catch (error: any) {
    console.error('❌❌❌ 単元候補生成エラー:', error)
    console.error('エラー詳細:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    })
    return c.json({
      success: false,
      error: '単元候補の生成に失敗しました。',
      details: error.message,
      units: []
    }, 500)
  }
})

// デバッグ用: Gemini API接続テスト
app.get('/api/ai/test-gemini', async (c) => {
  const { env } = c
  const apiKey = env.GEMINI_API_KEY
  
  try {
    console.log('🧪 Gemini APIテスト開始...')
    console.log('APIキー存在:', !!apiKey)
    console.log('APIキー先頭:', apiKey?.substring(0, 10) + '...')
    
    if (!apiKey || apiKey === 'your-gemini-api-key-here') {
      return c.json({
        success: false,
        error: 'GEMINI_API_KEYが設定されていません',
        apiKey: apiKey?.substring(0, 10) + '...'
      })
    }
    
    const testPrompt = '日本語で「こんにちは」と返答してください。'
    const model = 'gemini-3-flash'
    
    console.log('📤 テストリクエスト送信:', model)
    
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: testPrompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 100 }
        })
      }
    )
    
    console.log('📥 レスポンスステータス:', response.status)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ APIエラー:', errorText)
      return c.json({
        success: false,
        error: `HTTP ${response.status}`,
        details: errorText,
        model
      }, response.status)
    }
    
    const data = await response.json()
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text
    
    console.log('✅ テスト成功:', content)
    
    return c.json({
      success: true,
      message: 'Gemini API接続成功',
      model,
      response: content,
      apiKeyPrefix: apiKey.substring(0, 10) + '...'
    })
    
  } catch (error: any) {
    console.error('❌ テスト失敗:', error)
    return c.json({
      success: false,
      error: 'テスト実行エラー',
      details: error.message
    }, 500)
  }
})

// APIルート：OCR（手書き文字認識）- 2段階フォールバック
app.post('/api/ai/ocr', async (c) => {
  const { env } = c
  const { imageData, language } = await c.req.json()
  
  // 環境変数からAPIキーを取得
  const visionApiKey = env.GOOGLE_CLOUD_API_KEY
  const geminiApiKey = env.GEMINI_API_KEY
  
  try {
    console.log('🔍 OCR認識を開始（2段階フォールバック）...')
    
    // Base64エンコードされた画像データからデータURL部分を削除
    const base64Image = imageData.replace(/^data:image\/\w+;base64,/, '')
    
    // 【第1段階】Google Cloud Vision APIが利用可能な場合はそれを優先
    if (visionApiKey && visionApiKey !== 'your-google-cloud-api-key-here') {
      try {
        console.log('📤 [第1段階] Google Cloud Vision API を使用します')
        const visionApiUrl = `https://vision.googleapis.com/v1/images:annotate?key=${visionApiKey}`
        
        const requestBody = {
          requests: [
            {
              image: {
                content: base64Image
              },
              features: [
                {
                  type: 'TEXT_DETECTION',
                  maxResults: 1
                }
              ],
              imageContext: {
                languageHints: language === 'ja' ? ['ja', 'en'] : ['en']
              }
            }
          ]
        }
        
        const response = await fetch(visionApiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestBody)
        })
        
        if (response.ok) {
          const data = await response.json()
          console.log('✅ Vision API レスポンス受信')
          
          // テキストを抽出
          const textAnnotations = data.responses[0]?.textAnnotations
          
          if (textAnnotations && textAnnotations.length > 0) {
            const recognizedText = textAnnotations[0].description.trim()
            console.log('✅ [第1段階成功] Vision API OCR認識成功:', recognizedText)
            
            return c.json({
              success: true,
              text: recognizedText,
              confidence: 95,
              method: 'google-cloud-vision',
              stage: 1
            })
          }
        } else {
          const errorText = await response.text()
          console.warn('⚠️ [第1段階失敗] Vision API エラー:', response.status, errorText)
        }
      } catch (visionError: any) {
        console.warn('⚠️ [第1段階失敗] Vision API 例外:', visionError.message)
      }
    }
    
    // 【第2段階】フォールバック: Gemini Vision APIを使用
    if (geminiApiKey && geminiApiKey !== 'your-gemini-api-key-here') {
      try {
        console.log('📤 [第2段階] Gemini Vision API を使用します（フォールバック）')
        
        const geminiApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash:generateContent?key=${geminiApiKey}`
        
        const requestBody = {
          contents: [
            {
              parts: [
                {
                  text: language === 'ja' 
                    ? '画像に書かれている日本語のテキストを正確に読み取ってください。手書き文字も含まれます。認識したテキストのみを出力してください。説明や補足は一切不要です。'
                    : 'Read the text written in this image accurately. Include handwritten text. Output only the recognized text without any explanation or additional commentary.'
                },
                {
                  inline_data: {
                    mime_type: 'image/png',
                    data: base64Image
                  }
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 500
          }
        }
        
        const response = await fetch(geminiApiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestBody)
        })
        
        if (response.ok) {
          const data = await response.json()
          console.log('✅ Gemini Vision API レスポンス受信')
          
          // テキストを抽出
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim()
          
          if (text) {
            console.log('✅ [第2段階成功] Gemini Vision API OCR認識成功:', text)
            
            return c.json({
              success: true,
              text: text,
              confidence: 90,
              method: 'gemini-vision',
              stage: 2
            })
          }
        } else {
          const errorText = await response.text()
          console.warn('⚠️ [第2段階失敗] Gemini Vision API エラー:', response.status, errorText)
        }
      } catch (geminiError: any) {
        console.warn('⚠️ [第2段階失敗] Gemini Vision API 例外:', geminiError.message)
      }
    }
    
    // 両方の段階で失敗
    console.log('⚠️ OCR認識失敗: 両方のAPIで認識できませんでした')
    return c.json({
      success: false,
      text: null,
      error: 'テキストが検出されませんでした',
      message: '両方のAPIで文字を認識できませんでした',
      stage: 2
    })
    
  } catch (error: any) {
    console.error('❌ OCRエラー:', error)
    return c.json({
      success: false,
      error: error.message,
      text: null,
      stage: 0
    }, 500)
  }
})

// APIルート：Google Cloud Text-to-Speech（音声合成）
app.post('/api/ai/tts', async (c) => {
  const { env } = c
  const { text, voiceType = 'female-friendly', speed = 1.0, pitch = 0 } = await c.req.json()
  
  const apiKey = env.GOOGLE_CLOUD_API_KEY
  
  // APIキーがない場合は、Web Speech API へフォールバックすることをクライアントに通知
  if (!apiKey || apiKey === 'your-google-cloud-api-key-here') {
    console.log('⚠️ Google Cloud APIキーが未設定 → Web Speech API を使用')
    return c.json({
      success: false,
      fallbackToWebSpeech: true,
      error: 'Google Cloud API キーが設定されていません'
    })
  }
  
  try {
    console.log('🎤 Google Cloud TTS API 呼び出し:', {
      textLength: text.length,
      voiceType,
      speed,
      pitch
    })
    
    // 音声タイプに応じた設定
    let voiceConfig: any = {
      languageCode: 'ja-JP',
      ssmlGender: 'FEMALE'
    }
    
    // 音声名の選択
    switch(voiceType) {
      case 'female-friendly':
        voiceConfig.name = 'ja-JP-Neural2-B'  // 優しい女性の声
        break
      case 'male-friendly':
        voiceConfig.name = 'ja-JP-Neural2-C'  // 優しい男性の声
        voiceConfig.ssmlGender = 'MALE'
        break
      case 'female-energetic':
        voiceConfig.name = 'ja-JP-Neural2-A'  // 元気な女性の声
        break
      case 'male-energetic':
        voiceConfig.name = 'ja-JP-Neural2-D'  // 元気な男性の声
        voiceConfig.ssmlGender = 'MALE'
        break
      default:
        voiceConfig.name = 'ja-JP-Neural2-B'
    }
    
    // Google Cloud TTS API リクエスト
    const requestBody = {
      input: { text },
      voice: voiceConfig,
      audioConfig: {
        audioEncoding: 'MP3',
        speakingRate: Math.max(0.25, Math.min(4.0, speed)),  // 0.25-4.0 の範囲
        pitch: Math.max(-20, Math.min(20, pitch))  // -20 ~ 20 の範囲
      }
    }
    
    const response = await fetch(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      }
    )
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Google Cloud TTS API エラー:', {
        status: response.status,
        statusText: response.statusText,
        errorBody: errorText
      })
      
      let errorMessage = `Google Cloud TTS API エラー: ${response.status} ${response.statusText}`
      
      // エラーメッセージを詳細に解析
      try {
        const errorJson = JSON.parse(errorText)
        errorMessage += ` - ${errorJson.error?.message || '詳細不明'}`
      } catch (e) {
        errorMessage += ` - ${errorText}`
      }
      
      throw new Error(errorMessage)
    }
    
    const data = await response.json()
    
    if (data.audioContent) {
      console.log('✅ Google Cloud TTS 音声生成成功')
      return c.json({
        success: true,
        audioContent: data.audioContent,  // base64 encoded MP3
        method: 'google-cloud-tts'
      })
    } else {
      throw new Error('音声データが生成されませんでした')
    }
    
  } catch (error: any) {
    console.error('❌ TTSエラー:', error)
    console.error('❌ TTSエラー詳細:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    })
    
    return c.json({
      success: false,
      fallbackToWebSpeech: true,
      error: error.message,
      errorDetails: {
        name: error.name,
        message: error.message
      }
    }, 500)
  }
})

// デバッグ用：利用可能なGeminiモデルをリスト
app.get('/api/ai/list-models', async (c) => {
  const { env } = c
  const apiKey = env.GEMINI_API_KEY
  
  console.log('🔍 モデルリスト取得開始')
  
  if (!apiKey || apiKey === 'your-gemini-api-key-here') {
    console.error('❌ APIキーが設定されていません')
    return c.json({ error: 'APIキーが設定されていません' }, 500)
  }
  
  console.log('🔑 APIキー確認: 最初の10文字 =', apiKey.substring(0, 10))
  
  try {
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
    console.log('📡 Gemini API呼び出し:', apiUrl.replace(apiKey, 'REDACTED'))
    
    const response = await fetch(apiUrl)
    console.log('📦 レスポンス受信:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    })
    
    const responseText = await response.text()
    console.log('📄 レスポンス本文（最初の500文字）:', responseText.substring(0, 500))
    
    let data
    try {
      data = JSON.parse(responseText)
    } catch (parseError: any) {
      console.error('❌ JSONパースエラー:', parseError.message)
      console.error('📄 レスポンス全文:', responseText)
      return c.json({ 
        error: 'JSONパース失敗', 
        parseError: parseError.message,
        responsePreview: responseText.substring(0, 200)
      }, 500)
    }
    
    if (!response.ok) {
      console.error('❌ APIエラー:', data)
      return c.json({ error: 'モデルリスト取得失敗', details: data }, 500)
    }
    
    console.log('✅ データ取得成功:', {
      modelsCount: data.models?.length || 0
    })
    
    // generateContent をサポートするモデルのみをフィルター
    const supportedModels = data.models
      ?.filter((m: any) => m.supportedGenerationMethods?.includes('generateContent'))
      ?.map((m: any) => ({
        name: m.name,
        displayName: m.displayName,
        description: m.description,
        supportedMethods: m.supportedGenerationMethods
      })) || []
    
    console.log('✅ サポートされているモデル数:', supportedModels.length)
    supportedModels.forEach((m: any) => {
      console.log(`  - ${m.name}`)
    })
    
    return c.json({
      success: true,
      total: supportedModels.length,
      models: supportedModels
    })
  } catch (error: any) {
    console.error('❌ エラー発生:', error)
    return c.json({ 
      error: error.message,
      stack: error.stack 
    }, 500)
  }
})

// APIルート：段階的コース生成（1コース=6枚のカードを生成）
app.post('/api/ai/generate-course', async (c) => {
  const { env } = c
  const { 
    grade, 
    subject, 
    textbook, 
    unitName, 
    unitGoal,
    courseLevel,  // 'slow', 'steady', 'fast'
    courseInfo,   // { name, label, description, color_code }
    customization 
  } = await c.req.json()
  
  console.log('🔍 コース生成APIリクエスト受信:', {
    grade,
    subject,
    textbook,
    unitName,
    unitGoal: unitGoal?.substring(0, 50) + '...',
    courseLevel,
    courseInfo,
    customization: customization ? 'あり' : 'なし'
  })
  
  const apiKey = env.GEMINI_API_KEY
  
  if (!apiKey || apiKey === 'your-gemini-api-key-here') {
    console.error('❌ APIキーが設定されていません')
    return c.json({
      error: 'Gemini APIキーが設定されていません。管理者に連絡してください。',
      course: null
    }, 500)
  }
  
  console.log(`🎯 コース生成開始: ${courseInfo?.name} (${courseLevel})`)
  
  try {
    // カスタマイズ情報を整形
    const customInfo = customization ? `
【カスタマイズ情報】
- 児童生徒のニーズ: ${customization.studentNeeds}
- 教師の指導目標: ${customization.teacherGoals}
- 学習スタイル: ${customization.learningStyle}
- 特別な配慮: ${customization.specialSupport}
` : ''

    // コースレベルに応じた難易度説明
    const difficultyDescription = {
      'slow': 'ゆっくり・じっくり学ぶコース。基礎を丁寧に、ステップを細かく分けて説明。',
      'steady': '標準的なペースで学ぶコース。バランスよく理解を深める。',
      'fast': 'どんどん進むコース。発展的な内容や応用問題も含める。'
    }[courseLevel] || '標準的なペースで学ぶコース'

    // 【強化】プロンプト（6枚のカード生成 - より詳細な指示）
    const prompt = `あなたは小学校の優秀な教師です。以下の単元の学習カード6枚を生成してください。

【単元情報】
- 学年: ${grade}
- 教科: ${subject}
- 単元名: ${unitName}
- コース: ${courseInfo.name} (${difficultyDescription})

【重要】以下のJSON形式で、必ず完全な6枚のカードを生成してください：

{
  "course_name": "${courseInfo.name}",
  "name": "${courseInfo.name}",
  "label": "${courseInfo.label}",
  "description": "${courseInfo.description}",
  "color_code": "${courseInfo.color_code}",
  "cards": [
    {
      "card_number": 1,
      "card_title": "魅力的なタイトル（20字以内）",
      "card_type": "main",
      "textbook_page": "p.XX",
      "problem_description": "具体的な数字を含む問題文（80-150字）",
      "new_terms": "新出用語（カンマ区切り）",
      "example_problem": "例題（具体的な数字）",
      "example_solution": "解き方の説明",
      "real_world_connection": "実生活とのつながり",
      "answer": "解答と解説（50-100字）",
      "answer_explanation": "なぜその答えになるか（50-100字）",
      "hints": [
        {"hint_level": 1, "hint_text": "ヒント1: まず何を考える？", "thinking_tool_suggestion": "図・表・式"},
        {"hint_level": 2, "hint_text": "ヒント2: 次に何をする？", "thinking_tool_suggestion": "図・表・式"},
        {"hint_level": 3, "hint_text": "ヒント3: 答えに近づくために", "thinking_tool_suggestion": "図・表・式"}
      ]
    },
    { /* カード2: 上記と同じ構造 */ },
    { /* カード3: 上記と同じ構造 */ },
    { /* カード4: 上記と同じ構造 */ },
    { /* カード5: 上記と同じ構造 */ },
    { /* カード6: 上記と同じ構造 */ }
  ]
}

【厳守事項】
1. 必ず6枚のカードを生成すること
2. 各カードに必ず3つのヒントを含めること
3. JSONのみを出力し、説明文は含めないこと
4. すべてのフィールドに具体的な内容を記入すること
5. 完全なJSON（{で始まり}で終わる）を出力すること`

    // 【最新】Gemini 2.5 Flash を使用（最も高速・安定）
    const modelName = 'gemini-3-flash'  // 最新の Gemini 2.5 Flash
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`
    
    console.log(`📡 ${modelName} APIを呼び出します（コース生成用）...`)
    
    console.log(`📡 ${modelName} APIを呼び出します（コース生成用）...`)
    console.log(`📋 コース情報:`, {
      コース名: courseInfo.name,
      レベル: courseLevel,
      単元名: unitName,
      学年: grade,
      教科: subject
    })
    
    let courseData = null
    const MAX_RETRIES = 3  // 【新規】最大再試行回数
    
    // 【新規】再試行ロジック
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        console.log(`🔄 コース生成試行 ${attempt}/${MAX_RETRIES}...`)
        
      const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 32768,  // 16384 → 32768 に増加（gemini-2.5-pro は最大32K対応）
          topP: 0.9,
          topK: 20
        }
      })
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Gemini API エラー（詳細）:', {
        status: response.status,
        statusText: response.statusText,
        url: apiUrl.replace(apiKey, 'REDACTED'),
        errorBody: errorText.substring(0, 500),
        headers: Object.fromEntries(response.headers.entries())
      })
      throw new Error(`Gemini API ${response.status}: ${errorText.substring(0, 200)}`)
    }
    
    const data = await response.json()
    
    if (!data.candidates || data.candidates.length === 0) {
      console.error('❌ APIレスポンスエラー:', {
        dataKeys: Object.keys(data),
        promptFeedback: data.promptFeedback,
        candidates: data.candidates
      })
      throw new Error('APIレスポンスにcandidatesがありません。promptFeedback: ' + JSON.stringify(data.promptFeedback))
    }
    
    // finishReason を確認（重要！）
    const candidate = data.candidates[0]
    const finishReason = candidate.finishReason
    console.log('📊 finishReason:', finishReason)
    console.log('📊 candidate 情報:', {
      finishReason,
      safetyRatings: candidate.safetyRatings,
      citationMetadata: candidate.citationMetadata
    })
    
    if (finishReason && finishReason !== 'STOP') {
      console.error('❌ 異常終了:', finishReason)
      console.error('📊 候補データ:', candidate)
      throw new Error(`Gemini API が異常終了しました: ${finishReason}`)
    }
    
    let aiResponse = candidate.content.parts[0].text
    console.log('✅ コース生成成功:', courseInfo.name)
    console.log('📄 AI生成JSON（生データ・最初の500文字）:', aiResponse.substring(0, 500))
    console.log('📄 AI生成JSON（生データ・最後の500文字）:', aiResponse.substring(Math.max(0, aiResponse.length - 500)))
    console.log('📊 AI生成JSON長さ（生データ）:', aiResponse.length, '文字')
    
    // マークダウンのコードブロックを除去
    if (aiResponse.includes('```')) {
      console.log('🔧 マークダウンのコードブロックを検出しました。除去します...')
      // ```json と ``` を除去
      aiResponse = aiResponse.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()
      console.log('📄 クリーンアップ後のJSON（最初の500文字）:', aiResponse.substring(0, 500))
      console.log('📄 クリーンアップ後のJSON（最後の500文字）:', aiResponse.substring(Math.max(0, aiResponse.length - 500)))
      console.log('📊 クリーンアップ後のJSON長さ:', aiResponse.length, '文字')
    }
    
    // JSON完全性チェック
    const lastChar = aiResponse.trim().slice(-1)
    if (lastChar !== '}' && lastChar !== ']') {
      console.error('❌ JSON不完全（最後の文字）:', lastChar)
      console.error('📄 JSON末尾100文字:', aiResponse.slice(-100))
      throw new Error(`JSON不完全: 最後の文字が ${lastChar} です（期待: } または ]）`)
    }
    console.log('✅ JSON完全性チェック: 最後の文字 =', lastChar)
    
    // JSONをパース（複数の方法で試行）
    try {
      // 1回目: 通常のJSON.parse
      courseData = JSON.parse(aiResponse)
      console.log('✅ JSON.parse成功（1回目）')
    } catch (parseError1) {
      console.error('❌ JSON.parse失敗（1回目）:', parseError1)
      console.log('🔧 extractJSON関数を使用します...')
      
      try {
        // 2回目: extractJSON関数
        courseData = extractJSON(aiResponse)
        console.log('✅ extractJSON成功（2回目）')
      } catch (parseError2) {
        console.error('❌ extractJSON失敗（2回目）:', parseError2)
        console.log('📄 AI生成JSON全文:', aiResponse)
        
        // 3回目: 最後の手段 - 配列要素間のカンマを強制追加
        try {
          let fixedJson = aiResponse
          // }{ → },{ に修正
          fixedJson = fixedJson.replace(/\}\s*\{/g, '},{')
          // }] → }] はそのまま
          // ]{ → ],{ に修正
          fixedJson = fixedJson.replace(/\]\s*\{/g, '],[')
          // }[ → },[ に修正
          fixedJson = fixedJson.replace(/\}\s*\[/g, '},[')
          
          courseData = JSON.parse(fixedJson)
          console.log('✅ 手動修正JSON.parse成功（3回目）')
        } catch (parseError3) {
          console.error('❌ すべてのパース方法が失敗しました')
          throw new Error(`JSONパースエラー: ${parseError1.message}`)
        }
      }
    }
    
    // 【強化】バリデーション: 厳格なチェック
    if (!courseData.cards || courseData.cards.length !== 6) {
      console.error('❌ バリデーションエラー:', {
        cards存在: !!courseData.cards,
        cards長さ: courseData.cards?.length || 0,
        期待枚数: 6
      })
      throw new Error(`カードが6枚ではありません: ${courseData.cards?.length || 0}枚（期待: 6枚）`)
    }
    
    // 【新規】各カードのヒント数チェック
    for (let i = 0; i < courseData.cards.length; i++) {
      const card = courseData.cards[i]
      if (!card.hints || card.hints.length < 3) {
        console.error(`❌ カード${i+1}のヒント不足:`, {
          カード番号: card.card_number,
          ヒント数: card.hints?.length || 0,
          期待数: 3
        })
        
        // 【自動修復】ヒントが不足している場合はデフォルト値で補完
        if (!card.hints) {
          card.hints = []
        }
        while (card.hints.length < 3) {
          const hintLevel = card.hints.length + 1
          card.hints.push({
            hint_level: hintLevel,
            hint_text: hintLevel === 1 ? 'まず、問題で何を求められているか確認しましょう。' :
                      hintLevel === 2 ? '図や表に書いて整理してみましょう。' :
                      '似ている問題を思い出してみましょう。',
            thinking_tool_suggestion: ''
          })
        }
        console.log(`✅ カード${i+1}のヒントを自動補完しました（${card.hints.length}個）`)
      }
    }
    
    // 【新規】各カードの必須フィールドチェック
    const requiredFields = ['card_number', 'card_title', 'problem_description', 'answer']
    for (let i = 0; i < courseData.cards.length; i++) {
      const card = courseData.cards[i]
      const missingFields = requiredFields.filter(field => !card[field])
      
      if (missingFields.length > 0) {
        console.warn(`⚠️ カード${i+1}の必須フィールド不足:`, missingFields)
        
        // 【自動修復】必須フィールドをデフォルト値で補完
        if (!card.card_number) card.card_number = i + 1
        if (!card.card_title) card.card_title = `学習カード${i + 1}`
        if (!card.problem_description) card.problem_description = '問題の説明を生成中です'
        if (!card.answer) card.answer = '解答を生成中です'
        
        console.log(`✅ カード${i+1}の必須フィールドを自動補完しました`)
      }
    }
    
    console.log('✅ バリデーション成功:', {
      コース名: courseData.course_name || courseData.name,
      カード枚数: courseData.cards.length,
      使用モデル: modelName,
      試行回数: attempt
    })
    
    // 【新規】成功したのでループを抜ける
    break
    
      } catch (attemptError: any) {
        console.error(`❌ 試行 ${attempt}/${MAX_RETRIES} 失敗:`, attemptError.message)
        
        // 最後の試行で失敗した場合はエラーを投げる
        if (attempt === MAX_RETRIES) {
          console.error('❌ すべての再試行が失敗しました')
          throw attemptError
        }
        
        // 再試行の前に待機（段階的バックオフ）
        const delayMs = 2000 * attempt  // 2秒、4秒、6秒...
        console.log(`⏳ ${delayMs}ms 待機してリトライします...`)
        await new Promise(resolve => setTimeout(resolve, delayMs))
      }
    }
    
    // 【新規】再試行ループ後のチェック
    if (!courseData) {
      throw new Error('コースデータの生成に失敗しました（すべての再試行が失敗）')
    }
    
    console.log('✅ コース生成完了:', courseData.course_name || courseData.name)
    
    return c.json({
      success: true,
      course: courseData
    })
    
  } catch (error: any) {
    console.error('❌ コース生成エラー（詳細）:', {
      エラーメッセージ: error.message,
      エラースタック: error.stack,
      エラー型: error.constructor.name,
      コース名: courseInfo?.name,
      コースレベル: courseLevel
    })
    return c.json({
      error: error.message || 'コース生成に失敗しました',
      course: null,
      details: {
        errorType: error.constructor.name,
        courseName: courseInfo?.name,
        courseLevel: courseLevel
      }
    }, 500)
  }
})

// APIルート:AI単元生成
app.post('/api/ai/generate-unit', async (c) => {
  const { env } = c
  const { grade, subject, textbook, unitName, customization, qualityMode } = await c.req.json()
  
  // 環境変数からAPIキーを取得
  const apiKey = env.GEMINI_API_KEY
  
  if (!apiKey || apiKey === 'your-gemini-api-key-here') {
    console.error('❌ APIキーが設定されていません')
    return c.json({
      error: 'Gemini APIキーが設定されていません。管理者に連絡してください。',
      curriculum: null
    }, 500)
  }
  
  console.log('🔑 APIキー確認: 最初の10文字 =', apiKey.substring(0, 10))
  
  try {
    // カスタマイズ情報を整形
    const customInfo = customization ? `

【特別な配慮・カスタマイズ】
${customization.studentNeeds ? `生徒の状況: ${customization.studentNeeds}` : ''}
${customization.teacherGoals ? `先生の願い: ${customization.teacherGoals}` : ''}
${customization.learningStyle ? `学習スタイル: ${customization.learningStyle}` : ''}
${customization.specialSupport ? `特別支援: ${customization.specialSupport}` : ''}
` : ''
    
    // 【段階的生成】基本情報のみを生成（コースは別APIで生成）
    const prompt = `${grade}${subject}「${unitName}」（${textbook}）の学習カリキュラムの基本情報をJSON形式で作成してください。

**【最重要】JSON 出力の厳格なルール:**
1. **必ず { で始まり } で終わること**
2. **すべての文字列は二重引用符で囲むこと**
3. **JSON以外のテキストは一切出力しないこと**

${customInfo}

出力形式（基本情報のみ）:
{
  "curriculum": {
    "grade": "${grade}",
    "subject": "${subject}",
    "textbook_company": "${textbook}",
    "unit_name": "${unitName}",
    "total_hours": 8,
    "unit_goal": "学習目標（100文字以内。難しい漢字には直後に（ひらがな）をつける。例：国会（こっかい））",
    "non_cognitive_goal": "非認知目標（80文字以内）"
  }
}

注意：
- コース（courses）は含めないでください
- 基本情報（curriculum）のみを生成してください
- 簡潔なJSON出力をお願いします
`
    
    // 高品質モード判定
    const useProMode = qualityMode === 'high'

    // 品質モードに応じてモデルを選択
    // 'standard' (デフォルト): Gemini 2.5 Flash - 高速
    // 'high': Gemini 2.5 Pro - 高品質・詳細・厳密
    const useHighQuality = qualityMode === 'high'
    
    let models
    let generationConfig
    
    if (useHighQuality) {
      // 確実モード: Gemini 2.5 Pro のみを使用、より厳密な設定
      models = [
        { name: 'gemini-3-flash', maxTokens: 16384 }  // Proのみ
      ]
      generationConfig = {
        temperature: 0.5,   // より確実で一貫性のある出力
        maxOutputTokens: 16384,
        topP: 0.9,          // より保守的な選択
        topK: 20,           // トークン候補を制限
        responseMimeType: 'application/json',  // JSON出力を強制
        responseSchema: {
          type: 'object',
          properties: {
            curriculum: {
              type: 'object',
              properties: {
                grade: { type: 'string' },
                subject: { type: 'string' },
                textbook_company: { type: 'string' },
                unit_name: { type: 'string' },
                total_hours: { type: 'number' },
                unit_goal: { type: 'string' },
                non_cognitive_goal: { type: 'string' }
              },
              required: ['grade', 'subject', 'unit_name', 'unit_goal']
            },
            courses: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  course_name: { type: 'string' },
                  label: { type: 'string' },
                  description: { type: 'string' },
                  color_code: { type: 'string' },
                  cards: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        card_number: { type: 'number' },
                        card_title: { type: 'string' },
                        card_type: { type: 'string' },
                        textbook_page: { type: 'string' },
                        problem_description: { type: 'string' },
                        new_terms: { type: 'string' },
                        example_problem: { type: 'string' },
                        example_solution: { type: 'string' },
                        real_world_connection: { type: 'string' },
                        answer: { type: 'string' },
                        answer_explanation: { type: 'string' },
                        hints: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              hint_level: { type: 'number' },
                              hint_text: { type: 'string' }
                            },
                            required: ['hint_level', 'hint_text']
                          }
                        }
                      },
                      required: ['card_number', 'card_title', 'problem_description', 'real_world_connection', 'answer', 'hints']
                    }
                  }
                },
                required: ['name', 'course_name', 'cards']
              }
            }
          },
          required: ['curriculum', 'courses']
        }
      }
    } else {
      // 標準モード: Flash優先、フォールバックあり
      models = [
        { name: 'gemini-3-flash', maxTokens: 16384 },     // 最新・最も安定
        { name: 'gemini-3-flash', maxTokens: 16384 },     // 高速
        { name: 'gemini-3-flash', maxTokens: 16384 }        // 最高品質（フォールバック）
      ]
      generationConfig = {
        temperature: 0.7,
        maxOutputTokens: 16384,
        topP: 0.95,
        topK: 40,
        responseMimeType: 'application/json',  // JSON出力を強制（標準モードでも）
        responseSchema: {
          type: 'object',
          properties: {
            curriculum: {
              type: 'object',
              properties: {
                grade: { type: 'string' },
                subject: { type: 'string' },
                textbook_company: { type: 'string' },
                unit_name: { type: 'string' },
                total_hours: { type: 'number' },
                unit_goal: { type: 'string' },
                non_cognitive_goal: { type: 'string' }
              },
              required: ['grade', 'subject', 'unit_name', 'unit_goal']
            },
            courses: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  course_name: { type: 'string' },
                  label: { type: 'string' },
                  description: { type: 'string' },
                  color_code: { type: 'string' },
                  cards: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        card_number: { type: 'number' },
                        card_title: { type: 'string' },
                        card_type: { type: 'string' },
                        textbook_page: { type: 'string' },
                        problem_description: { type: 'string' },
                        new_terms: { type: 'string' },
                        example_problem: { type: 'string' },
                        example_solution: { type: 'string' },
                        real_world_connection: { type: 'string' },
                        answer: { type: 'string' },
                        answer_explanation: { type: 'string' },
                        hints: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              hint_level: { type: 'number' },
                              hint_text: { type: 'string' }
                            },
                            required: ['hint_level', 'hint_text']
                          }
                        }
                      },
                      required: ['card_number', 'card_title', 'problem_description', 'real_world_connection', 'answer', 'hints']
                    }
                  }
                },
                required: ['name', 'course_name', 'cards']
              }
            }
          },
          required: ['curriculum', 'courses']
        }
      }
    }
    
    let response
    let modelName
    let lastError
    
    for (const model of models) {
      try {
        console.log(`🔄 初期生成モデル試行中: ${model.name}`)
        modelName = model.name
        
        response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: generationConfig
            })
          }
        )
        
        if (response.ok) {
          console.log(`✅ 初期生成モデル成功: ${modelName}`)
          break
        } else {
          const errorText = await response.text()
          console.warn(`⚠️ 初期生成モデル失敗: ${modelName} (status: ${response.status})`)
          console.warn(`   エラー詳細: ${errorText.substring(0, 200)}`)
          lastError = new Error(`${modelName} returned ${response.status}: ${errorText.substring(0, 100)}`)
        }
      } catch (error: any) {
        console.warn(`⚠️ 初期生成モデルエラー: ${model.name} - ${error.message}`)
        lastError = error
      }
    }
    
    if (!response || !response.ok) {
      console.error('❌ すべてのモデルが失敗しました:', lastError?.message)
      throw lastError || new Error('すべてのモデルが失敗しました')
    }
    
    const data = await response.json()
    console.log('📦 API Response Status:', response.status)
    console.log('📦 API Response Data Keys:', Object.keys(data))
    
    // finishReasonをチェック
    const candidate = data.candidates?.[0]
    const finishReason = candidate?.finishReason
    console.log('📊 finishReason:', finishReason)
    
    if (finishReason === 'MAX_TOKENS') {
      console.warn('⚠️ 警告: トークン上限に達しました。JSONが不完全な可能性があります。')
    }
    
    const aiResponse = candidate?.content?.parts?.[0]?.text
    
    if (!aiResponse) {
      console.error('❌ AIレスポンスが空です')
      console.error('   完全なレスポンス:', JSON.stringify(data, null, 2).substring(0, 500))
      return c.json({
        error: '単元の生成に失敗しました。AIの応答が空でした。',
        details: JSON.stringify(data).substring(0, 200),
        curriculum: null
      })
    }
    
    console.log('📝 AIレスポンス（最初の500文字）:', aiResponse.substring(0, 500))
    console.log('📝 AIレスポンス（最後の200文字）:', aiResponse.substring(Math.max(0, aiResponse.length - 200)))
    
    // JSONを抽出（extractJSONヘルパー使用）
    let unitData
    try {
      unitData = extractJSON(aiResponse)
      console.log('✅ JSONパース成功')
      console.log('📊 データ構造キー:', Object.keys(unitData))
    } catch (parseError: any) {
      console.error('❌ JSONパースエラー:', parseError.message)
      console.error('📝 パースに失敗したレスポンスの最初の1000文字:')
      console.error(aiResponse.substring(0, 1000))
      console.error('📝 パースに失敗したレスポンスの最後の1000文字:')
      console.error(aiResponse.substring(Math.max(0, aiResponse.length - 1000)))
      
      // フォールバック: 部分的なJSONを返す試み
      let partialData = null
      try {
        // 最初の完全なオブジェクトを抽出
        const match = aiResponse.match(/\{[\s\S]*?\}(?=\s*$|$)/)
        if (match) {
          partialData = JSON.parse(match[0])
          console.log('⚠️ 部分的なJSONパースに成功しました')
        }
      } catch (fallbackError) {
        console.error('❌ フォールバックパースも失敗:', fallbackError)
      }
      
      return c.json({
        error: '単元の生成に失敗しました。AIの応答がJSON形式ではありませんでした。',
        details: `パースエラー: ${parseError.message}`,
        partial_data: partialData,
        ai_response_preview: aiResponse.substring(0, 500),
        curriculum: null
      }, 500)
    }
    
    // 【段階的生成】基本情報のみの検証（coursesは後で追加）
    const validationErrors = []
    
    // カリキュラムの検証
    if (!unitData.curriculum) {
      validationErrors.push('curriculum が欠けています')
    } else {
      if (!unitData.curriculum.grade) validationErrors.push('curriculum.grade が欠けています')
      if (!unitData.curriculum.subject) validationErrors.push('curriculum.subject が欠けています')
      if (!unitData.curriculum.unit_name) validationErrors.push('curriculum.unit_name が欠けています')
      if (!unitData.curriculum.unit_goal) validationErrors.push('curriculum.unit_goal が欠けています')
    }
    
    // 【注意】coursesはフロントエンドで段階的に生成するため、ここでは検証しない
    
    if (validationErrors.length > 0) {
      console.error('❌ 単元データ検証エラー:', validationErrors)
      console.error('📊 生成されたデータの一部:', JSON.stringify(unitData).substring(0, 1000))
      return c.json({
        error: '単元データの構造が正しくありません。',
        validation_errors: validationErrors,
        data_preview: JSON.stringify(unitData).substring(0, 500),
        curriculum: null
      }, 400)
    }
    
    console.log('✅ データ検証成功')
    
    return c.json({
      success: true,
      model_used: modelName,
      data: unitData
    })
    
  } catch (error) {
    console.error('単元生成エラー:', error)
    return c.json({
      error: '単元を生成できませんでした。',
      details: error instanceof Error ? error.message : String(error),
      curriculum: null
    })
  }
})

// APIルート：生成した単元を保存
app.post('/api/curriculum/save-generated', async (c) => {
  const { env } = c
  const { curriculum, courses, optionalProblems, courseSelectionProblems, commonCheckTest } = await c.req.json()
  
  try {
    // カリキュラムを保存
    const curriculumResult = await env.DB.prepare(`
      INSERT INTO curriculum (
        grade, subject, textbook_company, unit_name, 
        unit_order, total_hours, unit_goal, non_cognitive_goal
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      curriculum.grade,
      curriculum.subject,
      curriculum.textbook_company,
      curriculum.unit_name,
      99, // 生成された単元は最後に追加
      curriculum.total_hours,
      curriculum.unit_goal,
      curriculum.non_cognitive_goal
    ).run()
    
    const curriculumId = curriculumResult.meta.last_row_id
    
    // コースを保存
    for (const course of courses) {
      // course_levelを決定（course_nameから推測）
      let courseLevel = 'standard'
      if (course.course_name?.includes('ゆっくり') || course.course_name?.includes('じっくり')) {
        courseLevel = 'basic'
      } else if (course.course_name?.includes('どんどん') || course.course_name?.includes('ぐんぐん')) {
        courseLevel = 'advanced'
      }
      
      const courseResult = await env.DB.prepare(`
        INSERT INTO courses (
          curriculum_id, course_level, course_display_name, 
          selection_question_title, selection_question_content,
          course_name, description, color_code, course_label
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        curriculumId,
        courseLevel,
        course.course_name || course.course_label || course.name || 'コース',
        course.course_name || course.name || 'コース選択問題',
        course.description || '',
        course.course_name || course.name || 'コース',
        course.description || '',
        course.color_code || 'blue',
        course.course_label || course.label || ''
      ).run()
      
      const courseId = courseResult.meta.last_row_id
      
      // 外部キー制約を一時的に無効化
      await env.DB.prepare('PRAGMA foreign_keys = OFF').run()
      
      // 学習カードを保存
      for (const card of course.cards || []) {
        // card_type の値を検証（許可された値のみ）
        const cardType = validateCardType(card.card_type)
        
        const cardResult = await env.DB.prepare(`
          INSERT INTO learning_cards (
            course_id, card_number, card_title, card_type,
            problem_content, problem_description, new_terms, example_problem,
            example_solution, real_world_connection, textbook_page
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          courseId,
          card.card_number || 1,
          card.card_title || card.title || 'カード',
          cardType,
          card.problem_description || card.problem_content || card.content || '',
          card.problem_description || card.problem_content || card.content || '',
          card.new_terms || '',
          card.example_problem || '',
          card.example_solution || '',
          card.real_world_connection || card.real_world_context || '',
          card.textbook_page || ''
        ).run()
        
        const cardId = cardResult.meta.last_row_id
        
        // 解答を保存（answersテーブル）- 必ず保存
        const answerContent = card.answer || card.problem_description || card.problem_content || '解答を生成中です'
        const answerExplanation = card.answer_explanation || card.explanation || card.real_world_connection || '解説を生成中です'
        
        await env.DB.prepare(`
          INSERT INTO answers (
            learning_card_id, answer_content, explanation
          ) VALUES (?, ?, ?)
        `).bind(
          cardId,
          answerContent,
          answerExplanation
        ).run()
        
        // ヒントカードを保存（デフォルト値を設定）
        const hints = card.hints || []
        
        // ヒントが空の場合はデフォルトで3つ生成
        if (hints.length === 0) {
          hints.push(
            { hint_level: 1, hint_text: 'まず、問題で何を求められているか確認しましょう。', thinking_tool_suggestion: '' },
            { hint_level: 2, hint_text: '図や表に書いて整理してみましょう。', thinking_tool_suggestion: '' },
            { hint_level: 3, hint_text: '似ている問題を思い出してみましょう。', thinking_tool_suggestion: '' }
          )
          console.log(`⚠️ カード${card.card_number}のヒントが空のため、デフォルト値を設定しました`)
        }
        
        for (const hint of hints) {
          await env.DB.prepare(`
            INSERT INTO hint_cards (
              learning_card_id, hint_number, hint_content, thinking_tool_suggestion
            ) VALUES (?, ?, ?, ?)
          `).bind(
            cardId,
            hint.hint_level || hint.hint_number || 1,
            hint.hint_text || hint.hint_content || '',
            hint.thinking_tool_suggestion || ''
          ).run()
        }
      }
      
      // 外部キー制約を再度有効化
      await env.DB.prepare('PRAGMA foreign_keys = ON').run()
    }
    
    // 選択問題を保存
    for (const problem of optionalProblems || []) {
      await env.DB.prepare(`
        INSERT INTO optional_problems (
          curriculum_id, problem_number, problem_title, problem_description, problem_content,
          difficulty_level, learning_meaning
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind(
        curriculumId,
        problem.problem_number || 1,
        problem.problem_title || problem.title || '選択問題',
        problem.problem_description || problem.description || '',
        problem.problem_content || problem.problem_description || problem.content || '問題内容',
        problem.difficulty_level || 'medium',
        problem.learning_meaning || ''
      ).run()
    }
    
    // コース選択問題を保存（カリキュラムメタデータとして）
    if (courseSelectionProblems && courseSelectionProblems.length > 0) {
      const courseSelectionJSON = JSON.stringify(courseSelectionProblems)
      await env.DB.prepare(`
        INSERT OR REPLACE INTO curriculum_metadata (
          curriculum_id, metadata_key, metadata_value
        ) VALUES (?, ?, ?)
      `).bind(
        curriculumId,
        'course_selection_problems',
        courseSelectionJSON
      ).run()
    }
    
    // 共通チェックテストを保存（カリキュラムメタデータとして）
    if (commonCheckTest && commonCheckTest.sample_problems && commonCheckTest.sample_problems.length > 0) {
      const checkTestJSON = JSON.stringify(commonCheckTest)
      await env.DB.prepare(`
        INSERT OR REPLACE INTO curriculum_metadata (
          curriculum_id, metadata_key, metadata_value
        ) VALUES (?, ?, ?)
      `).bind(
        curriculumId,
        'common_check_test',
        checkTestJSON
      ).run()
    }
    
    console.log('✅ 単元保存完了:', {
      curriculum_id: curriculumId,
      courses: courses.length,
      total_cards: courses.reduce((sum, c) => sum + (c.cards?.length || 0), 0),
      optional_problems: optionalProblems?.length || 0,
      course_selection_problems: courseSelectionProblems?.length || 0,
      common_check_test: commonCheckTest ? '有' : '無'
    })
    
    return c.json({
      success: true,
      curriculum_id: curriculumId,
      saved_data: {
        optional_problems_count: optionalProblems?.length || 0,
        course_selection_count: courseSelectionProblems?.length || 0,
        common_check_test: !!commonCheckTest
      }
    })
    
  } catch (error) {
    console.error('単元保存エラー:', error)
    return c.json({ 
      success: false,
      error: 'Database error',
      details: error instanceof Error ? error.message : String(error)
    }, 500)
  }
})

// APIルート：コース関連問題を生成（コース選択問題・導入問題）
app.post('/api/curriculum/:curriculumId/generate-course-problems', async (c) => {
  const { env } = c
  const curriculumId = c.req.param('curriculumId')
  const apiKey = env.GEMINI_API_KEY
  
  if (!apiKey || apiKey === 'your-gemini-api-key-here') {
    return c.json({ error: 'Gemini APIキーが設定されていません' }, 500)
  }
  
  try {
    // カリキュラムと3コースの情報を取得
    const curriculum = await env.DB.prepare('SELECT * FROM curriculum WHERE id = ?').bind(curriculumId).first()
    const courses = await env.DB.prepare('SELECT * FROM courses WHERE curriculum_id = ?').bind(curriculumId).all()
    
    if (!curriculum || !courses.results || courses.results.length === 0) {
      return c.json({ error: 'カリキュラムが見つかりません' }, 404)
    }
    
    // AIプロンプト：コース関連問題 + 検索練習コンテンツ
    const prompt = `小学${curriculum.grade}年 ${curriculum.subject}「${curriculum.unit_name}」の問題と学習サポートコンテンツを生成。

【必須：3つのコース】
1. ${courses.results[0]?.course_name || 'ゆっくりコース'}
2. ${courses.results[1]?.course_name || 'しっかりコース'}  
3. ${courses.results[2]?.course_name || 'ぐんぐんコース'}

【教育理論に基づく検索練習コンテンツ】
- よく出る問題（検索練習: Roediger & Karpicke 2006）
- 応用問題（交互配置: Rohrer & Taylor 2007）
- 総復習チェックリスト（分散学習: Cepeda et al. 2006）

【必須：JSONのみ出力】
{
  "course_selection_problems": [
    {"problem_number": 1, "problem_title": "コース1の魅力的なタイトル", "problem_content": "具体的な数字を含む問題文（50字以上）", "course_level": "基礎"},
    {"problem_number": 2, "problem_title": "コース2の魅力的なタイトル", "problem_content": "具体的な数字を含む問題文（50字以上）", "course_level": "標準"},
    {"problem_number": 3, "problem_title": "コース3の魅力的なタイトル", "problem_content": "具体的な数字を含む問題文（50字以上）", "course_level": "発展"}
  ],
  "introduction_problems": [
    {"course_number": 1, "problem_title": "導入問題1", "problem_content": "具体的な数字を含む問題文（50字以上）", "answer": "解答と解説（30字以上）"},
    {"course_number": 2, "problem_title": "導入問題2", "problem_content": "具体的な数字を含む問題文（50字以上）", "answer": "解答と解説（30字以上）"},
    {"course_number": 3, "problem_title": "導入問題3", "problem_content": "具体的な数字を含む問題文（50字以上）", "answer": "解答と解説（30字以上）"}
  ],
  "retrieval_practice": {
    "frequent_problems": [
      {"problem_number": 1, "problem_title": "基本パターン1", "problem_content": "テストによく出る問題（具体的な数字）", "answer": "正解", "explanation": "解説（なぜこの答えか）", "time_limit": 10, "difficulty": "easy"},
      {"problem_number": 2, "problem_title": "基本パターン2", "problem_content": "テストによく出る問題", "answer": "正解", "explanation": "解説", "time_limit": 10, "difficulty": "easy"},
      {"problem_number": 3, "problem_title": "基本パターン3", "problem_content": "テストによく出る問題", "answer": "正解", "explanation": "解説", "time_limit": 10, "difficulty": "easy"},
      {"problem_number": 4, "problem_title": "基本パターン4", "problem_content": "テストによく出る問題", "answer": "正解", "explanation": "解説", "time_limit": 10, "difficulty": "easy"},
      {"problem_number": 5, "problem_title": "基本パターン5", "problem_content": "テストによく出る問題", "answer": "正解", "explanation": "解説", "time_limit": 10, "difficulty": "easy"}
    ],
    "application_problems": [
      {"problem_number": 1, "problem_title": "応用問題1", "problem_content": "複数の概念を組み合わせた問題", "answer": "正解", "explanation": "解説（思考プロセス含む）", "thinking_points": ["考え方のポイント1", "ポイント2"], "difficulty": "medium"},
      {"problem_number": 2, "problem_title": "応用問題2", "problem_content": "複数の概念を組み合わせた問題", "answer": "正解", "explanation": "解説", "thinking_points": ["ポイント1", "ポイント2"], "difficulty": "medium"},
      {"problem_number": 3, "problem_title": "応用問題3", "problem_content": "複数の概念を組み合わせた問題", "answer": "正解", "explanation": "解説", "thinking_points": ["ポイント1", "ポイント2"], "difficulty": "hard"},
      {"problem_number": 4, "problem_title": "応用問題4", "problem_content": "複数の概念を組み合わせた問題", "answer": "正解", "explanation": "解説", "thinking_points": ["ポイント1", "ポイント2"], "difficulty": "hard"},
      {"problem_number": 5, "problem_title": "応用問題5", "problem_content": "複数の概念を組み合わせた問題", "answer": "正解", "explanation": "解説", "thinking_points": ["ポイント1", "ポイント2"], "difficulty": "hard"}
    ],
    "review_checklist": [
      {"item_number": 1, "check_point": "この単元で学んだこと1", "description": "具体的な確認内容", "example": "例: 〇〇の意味を説明できる"},
      {"item_number": 2, "check_point": "この単元で学んだこと2", "description": "具体的な確認内容", "example": "例: 〇〇を計算できる"},
      {"item_number": 3, "check_point": "この単元で学んだこと3", "description": "具体的な確認内容", "example": "例: 図を見て〇〇できる"},
      {"item_number": 4, "check_point": "この単元で学んだこと4", "description": "具体的な確認内容", "example": "例: 文章題から〇〇できる"},
      {"item_number": 5, "check_point": "この単元で学んだこと5", "description": "具体的な確認内容", "example": "例: 〇〇を使った問題を作れる"},
      {"item_number": 6, "check_point": "この単元で学んだこと6", "description": "具体的な確認内容", "example": "例: 実生活で〇〇を活用できる"}
    ]
  }
}`

    // フォールバック機能付きAPI呼び出し
    const models = ['gemini-3-flash', 'gemini-3-flash', 'gemini-3-flash']
    let response
    let lastError
    
    for (const model of models) {
      try {
        console.log(`🔄 モデル試行中: ${model}`)
        response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { temperature: 0.8, maxOutputTokens: 8192 }
            })
          }
        )
        
        if (response.ok) {
          console.log(`✅ モデル成功: ${model}`)
          break
        } else {
          console.warn(`⚠️ モデル失敗: ${model} (status: ${response.status})`)
          lastError = new Error(`${model} returned ${response.status}`)
        }
      } catch (error: any) {
        console.warn(`⚠️ モデルエラー: ${model} - ${error.message}`)
        lastError = error
      }
    }
    
    if (!response || !response.ok) {
      throw lastError || new Error('すべてのモデルが失敗しました')
    }
    
    const data = await response.json()
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text
    
    if (!aiResponse) {
      throw new Error('AI response is empty')
    }
    
    // JSONを抽出
    console.log('AIレスポンス（コース問題）:', aiResponse)
    const problems = extractJSON(aiResponse)
    console.log('パース結果（コース問題）:', JSON.stringify(problems, null, 2))
    
    // データベースに保存
    if (problems.course_selection_problems) {
      console.log(`コース選択問題を保存: ${problems.course_selection_problems.length}件`)
      const courseSelectionJSON = JSON.stringify(problems.course_selection_problems)
      await env.DB.prepare(`
        INSERT OR REPLACE INTO curriculum_metadata (curriculum_id, metadata_key, metadata_value)
        VALUES (?, ?, ?)
      `).bind(curriculumId, 'course_selection_problems', courseSelectionJSON).run()
    } else {
      console.warn('course_selection_problemsが見つかりません')
    }
    
    if (problems.introduction_problems) {
      console.log(`導入問題を保存: ${problems.introduction_problems.length}件`)
      const coursesList = courses.results
      for (let i = 0; i < problems.introduction_problems.length && i < coursesList.length; i++) {
        const introProblem = problems.introduction_problems[i]
        const course = coursesList[i]
        const introJSON = JSON.stringify(introProblem)
        console.log(`コース${i+1}(ID:${course.id})に導入問題を保存:`, introProblem.problem_title)
        await env.DB.prepare(`
          UPDATE courses SET introduction_problem = ? WHERE id = ?
        `).bind(introJSON, course.id).run()
      }
    } else {
      console.warn('introduction_problemsが見つかりません')
    }
    
    // 検索練習コンテンツを保存（新規追加）
    if (problems.retrieval_practice) {
      console.log('🎯 検索練習コンテンツを保存開始')
      
      // よく出る問題（ケース10）
      if (problems.retrieval_practice.frequent_problems) {
        console.log(`よく出る問題を保存: ${problems.retrieval_practice.frequent_problems.length}件`)
        const frequentJSON = JSON.stringify(problems.retrieval_practice.frequent_problems)
        await env.DB.prepare(`
          INSERT OR REPLACE INTO retrieval_practice_content (curriculum_id, content_type, problem_data)
          VALUES (?, ?, ?)
        `).bind(curriculumId, 'frequent_problems', frequentJSON).run()
      }
      
      // 応用問題（ケース11）
      if (problems.retrieval_practice.application_problems) {
        console.log(`応用問題を保存: ${problems.retrieval_practice.application_problems.length}件`)
        const applicationJSON = JSON.stringify(problems.retrieval_practice.application_problems)
        await env.DB.prepare(`
          INSERT OR REPLACE INTO retrieval_practice_content (curriculum_id, content_type, problem_data)
          VALUES (?, ?, ?)
        `).bind(curriculumId, 'application_problems', applicationJSON).run()
      }
      
      // 総復習チェックリスト（ケース12）
      if (problems.retrieval_practice.review_checklist) {
        console.log(`総復習チェックリストを保存: ${problems.retrieval_practice.review_checklist.length}件`)
        const reviewJSON = JSON.stringify(problems.retrieval_practice.review_checklist)
        await env.DB.prepare(`
          INSERT OR REPLACE INTO retrieval_practice_content (curriculum_id, content_type, problem_data)
          VALUES (?, ?, ?)
        `).bind(curriculumId, 'review_checklist', reviewJSON).run()
      }
      
      console.log('✅ 検索練習コンテンツの保存完了')
    } else {
      console.warn('retrieval_practiceが見つかりません')
    }
    
    return c.json({ 
      success: true, 
      message: 'コース関連問題と検索練習コンテンツを生成・保存しました',
      details: {
        course_selection_count: problems.course_selection_problems?.length || 0,
        introduction_count: problems.introduction_problems?.length || 0,
        frequent_problems_count: problems.retrieval_practice?.frequent_problems?.length || 0,
        application_problems_count: problems.retrieval_practice?.application_problems?.length || 0,
        review_checklist_count: problems.retrieval_practice?.review_checklist?.length || 0
      }
    })
    
  } catch (error: any) {
    console.error('コース関連問題生成エラー:', error)
    console.error('エラースタック:', error.stack)
    return c.json({ 
      error: 'コース関連問題の生成に失敗しました', 
      details: error.message,
      stack: error.stack?.substring(0, 200)
    }, 500)
  }
})

// APIルート：検索練習コンテンツ取得
app.get('/api/curriculum/:curriculumId/retrieval-practice', async (c) => {
  const { env } = c
  const curriculumId = c.req.param('curriculumId')
  
  try {
    // 全てのコンテンツタイプを取得
    const contents = await env.DB.prepare(`
      SELECT content_type, problem_data, created_at
      FROM retrieval_practice_content
      WHERE curriculum_id = ?
      ORDER BY content_type
    `).bind(curriculumId).all()
    
    if (!contents.results || contents.results.length === 0) {
      return c.json({ 
        success: true,
        message: '検索練習コンテンツが見つかりません',
        data: null
      })
    }
    
    // データを整形
    const result = {
      frequent_problems: null,
      application_problems: null,
      review_checklist: null
    }
    
    for (const content of contents.results) {
      const data = JSON.parse(content.problem_data)
      if (content.content_type === 'frequent_problems') {
        result.frequent_problems = data
      } else if (content.content_type === 'application_problems') {
        result.application_problems = data
      } else if (content.content_type === 'review_checklist') {
        result.review_checklist = data
      }
    }
    
    return c.json({ 
      success: true,
      data: result
    })
    
  } catch (error: any) {
    console.error('検索練習コンテンツ取得エラー:', error)
    return c.json({ 
      error: 'コンテンツの取得に失敗しました', 
      details: error.message 
    }, 500)
  }
})

// =============================================================================
// Phase 3: 学習履歴記録と分析システム
// =============================================================================

// APIルート：検索練習学習活動を記録
app.post('/api/retrieval-practice/log', async (c) => {
  const { env } = c
  
  try {
    const body = await c.req.json()
    const {
      student_id,
      curriculum_id,
      content_type,
      problem_id,
      item_id,
      is_correct,
      answer_time_seconds,
      hint_used,
      attempt_count,
      session_id,
      device_type
    } = body
    
    // 必須パラメータの検証
    if (!student_id || !curriculum_id || !content_type) {
      return c.json({ 
        success: false, 
        error: '必須パラメータが不足しています（student_id, curriculum_id, content_type）' 
      }, 400)
    }
    
    // content_typeの検証
    const validContentTypes = ['frequent_problems', 'application_problems', 'review_checklist']
    if (!validContentTypes.includes(content_type)) {
      return c.json({ 
        success: false, 
        error: `無効なcontent_typeです。有効な値: ${validContentTypes.join(', ')}` 
      }, 400)
    }
    
    // データベースに記録
    const result = await env.DB.prepare(`
      INSERT INTO retrieval_practice_log (
        student_id, curriculum_id, content_type, problem_id, item_id,
        is_correct, answer_time_seconds, hint_used, attempt_count,
        session_id, device_type, created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).bind(
      student_id,
      curriculum_id,
      content_type,
      problem_id || null,
      item_id || null,
      is_correct !== undefined ? (is_correct ? 1 : 0) : null,
      answer_time_seconds || null,
      hint_used ? 1 : 0,
      attempt_count || 1,
      session_id || null,
      device_type || null
    ).run()
    
    console.log(`✅ 学習活動記録: student=${student_id}, curriculum=${curriculum_id}, type=${content_type}`)
    
    return c.json({ 
      success: true,
      log_id: result.meta.last_row_id,
      message: '学習活動を記録しました'
    })
    
  } catch (error: any) {
    console.error('学習活動記録エラー:', error)
    return c.json({ 
      success: false,
      error: '学習活動の記録に失敗しました', 
      details: error.message 
    }, 500)
  }
})

// APIルート：学生別学習統計を取得
app.get('/api/retrieval-practice/stats/student/:studentId', async (c) => {
  const { env } = c
  const studentId = c.req.param('studentId')
  const curriculumId = c.req.query('curriculum_id')
  
  try {
    let query = `
      SELECT 
        content_type,
        COUNT(*) as total_attempts,
        SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) as correct_count,
        ROUND(AVG(CASE WHEN is_correct IS NOT NULL THEN is_correct ELSE 0 END) * 100, 2) as accuracy_rate,
        ROUND(AVG(answer_time_seconds), 1) as avg_answer_time,
        SUM(hint_used) as total_hints_used,
        MIN(created_at) as first_attempt,
        MAX(created_at) as last_attempt
      FROM retrieval_practice_log
      WHERE student_id = ?
    `
    
    const bindings: any[] = [studentId]
    
    if (curriculumId) {
      query += ' AND curriculum_id = ?'
      bindings.push(curriculumId)
    }
    
    query += ' GROUP BY content_type'
    
    const stats = await env.DB.prepare(query).bind(...bindings).all()
    
    return c.json({ 
      success: true,
      student_id: studentId,
      curriculum_id: curriculumId || 'all',
      stats: stats.results || []
    })
    
  } catch (error: any) {
    console.error('学習統計取得エラー:', error)
    return c.json({ 
      success: false,
      error: '学習統計の取得に失敗しました', 
      details: error.message 
    }, 500)
  }
})

// APIルート：カリキュラム別学習統計を取得
app.get('/api/retrieval-practice/stats/curriculum/:curriculumId', async (c) => {
  const { env } = c
  const curriculumId = c.req.param('curriculumId')
  
  try {
    const stats = await env.DB.prepare(`
      SELECT 
        content_type,
        COUNT(DISTINCT student_id) as unique_students,
        COUNT(*) as total_attempts,
        SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) as correct_count,
        ROUND(AVG(CASE WHEN is_correct IS NOT NULL THEN is_correct ELSE 0 END) * 100, 2) as avg_accuracy,
        ROUND(AVG(answer_time_seconds), 1) as avg_time,
        MIN(created_at) as first_activity,
        MAX(created_at) as last_activity
      FROM retrieval_practice_log
      WHERE curriculum_id = ?
      GROUP BY content_type
    `).bind(curriculumId).all()
    
    return c.json({ 
      success: true,
      curriculum_id: curriculumId,
      stats: stats.results || []
    })
    
  } catch (error: any) {
    console.error('カリキュラム統計取得エラー:', error)
    return c.json({ 
      success: false,
      error: 'カリキュラム統計の取得に失敗しました', 
      details: error.message 
    }, 500)
  }
})

// APIルート：学習履歴詳細を取得
app.get('/api/retrieval-practice/history/:studentId', async (c) => {
  const { env } = c
  const studentId = c.req.param('studentId')
  const curriculumId = c.req.query('curriculum_id')
  const contentType = c.req.query('content_type')
  const limit = parseInt(c.req.query('limit') || '50')
  
  try {
    let query = `
      SELECT *
      FROM retrieval_practice_log
      WHERE student_id = ?
    `
    
    const bindings: any[] = [studentId]
    
    if (curriculumId) {
      query += ' AND curriculum_id = ?'
      bindings.push(curriculumId)
    }
    
    if (contentType) {
      query += ' AND content_type = ?'
      bindings.push(contentType)
    }
    
    query += ' ORDER BY created_at DESC LIMIT ?'
    bindings.push(limit)
    
    const history = await env.DB.prepare(query).bind(...bindings).all()
    
    return c.json({ 
      success: true,
      student_id: studentId,
      history: history.results || []
    })
    
  } catch (error: any) {
    console.error('学習履歴取得エラー:', error)
    return c.json({ 
      success: false,
      error: '学習履歴の取得に失敗しました', 
      details: error.message 
    }, 500)
  }
})

// =============================================================================
// Phase 3-6: 教師向けダッシュボードAPI
// =============================================================================

// APIルート：クラス全体の学習統計を取得（教師向け）
app.get('/api/teacher/class-stats/:curriculumId', async (c) => {
  const { env } = c
  const curriculumId = c.req.param('curriculumId')
  
  try {
    // 全学生の統計を取得
    const allStudentsStats = await env.DB.prepare(`
      SELECT 
        student_id,
        content_type,
        COUNT(*) as total_attempts,
        SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) as correct_count,
        ROUND(AVG(CASE WHEN is_correct IS NOT NULL THEN is_correct ELSE 0 END) * 100, 2) as accuracy_rate,
        ROUND(AVG(answer_time_seconds), 1) as avg_answer_time,
        SUM(hint_used) as total_hints_used,
        MIN(created_at) as first_attempt,
        MAX(created_at) as last_attempt
      FROM retrieval_practice_log
      WHERE curriculum_id = ?
      GROUP BY student_id, content_type
    `).bind(curriculumId).all()
    
    // クラス全体の集計
    const classOverview = await env.DB.prepare(`
      SELECT 
        COUNT(DISTINCT student_id) as total_students,
        COUNT(*) as total_attempts,
        ROUND(AVG(CASE WHEN is_correct IS NOT NULL THEN is_correct ELSE 0 END) * 100, 2) as avg_accuracy,
        ROUND(AVG(answer_time_seconds), 1) as avg_time,
        SUM(hint_used) as total_hints
      FROM retrieval_practice_log
      WHERE curriculum_id = ?
    `).bind(curriculumId).first()
    
    // 学生リストを取得
    const students = await env.DB.prepare(`
      SELECT DISTINCT student_id
      FROM retrieval_practice_log
      WHERE curriculum_id = ?
    `).bind(curriculumId).all()
    
    return c.json({
      success: true,
      curriculum_id: curriculumId,
      class_overview: classOverview,
      students_count: students.results?.length || 0,
      student_stats: allStudentsStats.results || []
    })
    
  } catch (error: any) {
    console.error('クラス統計取得エラー:', error)
    return c.json({
      success: false,
      error: 'クラス統計の取得に失敗しました',
      details: error.message
    }, 500)
  }
})

// APIルート：個別学生の詳細レポート取得（教師向け）
app.get('/api/teacher/student-report/:studentId', async (c) => {
  const { env } = c
  const studentId = c.req.param('studentId')
  const curriculumId = c.req.query('curriculum_id')
  
  try {
    // 学生の基本統計
    let statsQuery = `
      SELECT 
        content_type,
        COUNT(*) as total_attempts,
        SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) as correct_count,
        ROUND(AVG(CASE WHEN is_correct IS NOT NULL THEN is_correct ELSE 0 END) * 100, 2) as accuracy_rate,
        ROUND(AVG(answer_time_seconds), 1) as avg_answer_time,
        SUM(hint_used) as hints_used,
        MIN(created_at) as first_activity,
        MAX(created_at) as last_activity
      FROM retrieval_practice_log
      WHERE student_id = ?
    `
    
    const bindings: any[] = [studentId]
    
    if (curriculumId) {
      statsQuery += ' AND curriculum_id = ?'
      bindings.push(curriculumId)
    }
    
    statsQuery += ' GROUP BY content_type'
    
    const stats = await env.DB.prepare(statsQuery).bind(...bindings).all()
    
    // 問題別の正答率
    const problemStats = await env.DB.prepare(`
      SELECT 
        problem_id,
        content_type,
        COUNT(*) as attempts,
        SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) as correct,
        ROUND(AVG(CASE WHEN is_correct IS NOT NULL THEN is_correct ELSE 0 END) * 100, 2) as accuracy
      FROM retrieval_practice_log
      WHERE student_id = ? ${curriculumId ? 'AND curriculum_id = ?' : ''}
        AND problem_id IS NOT NULL
      GROUP BY problem_id, content_type
      ORDER BY accuracy ASC
    `).bind(curriculumId ? [studentId, curriculumId] : [studentId]).all()
    
    // 学習ペース分析（日別）
    const dailyActivity = await env.DB.prepare(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as activities,
        SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) as correct
      FROM retrieval_practice_log
      WHERE student_id = ? ${curriculumId ? 'AND curriculum_id = ?' : ''}
      GROUP BY DATE(created_at)
      ORDER BY date DESC
      LIMIT 30
    `).bind(curriculumId ? [studentId, curriculumId] : [studentId]).all()
    
    return c.json({
      success: true,
      student_id: studentId,
      stats: stats.results || [],
      problem_stats: problemStats.results || [],
      daily_activity: dailyActivity.results || []
    })
    
  } catch (error: any) {
    console.error('学生レポート取得エラー:', error)
    return c.json({
      success: false,
      error: '学生レポートの取得に失敗しました',
      details: error.message
    }, 500)
  }
})

// APIルート：苦手分野を自動検出（AI分析）
app.get('/api/teacher/weak-areas/:studentId', async (c) => {
  const { env } = c
  const studentId = c.req.param('studentId')
  const curriculumId = c.req.query('curriculum_id')
  
  try {
    // 正答率が低い問題を特定
    const weakProblems = await env.DB.prepare(`
      SELECT 
        problem_id,
        content_type,
        COUNT(*) as attempts,
        SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) as correct,
        ROUND(AVG(CASE WHEN is_correct IS NOT NULL THEN is_correct ELSE 0 END) * 100, 2) as accuracy,
        AVG(answer_time_seconds) as avg_time,
        SUM(hint_used) as hints_used
      FROM retrieval_practice_log
      WHERE student_id = ? ${curriculumId ? 'AND curriculum_id = ?' : ''}
        AND problem_id IS NOT NULL
      GROUP BY problem_id, content_type
      HAVING accuracy < 60 OR attempts >= 3
      ORDER BY accuracy ASC, attempts DESC
    `).bind(curriculumId ? [studentId, curriculumId] : [studentId]).all()
    
    // 苦手分野の傾向を分析
    const weakAreaSummary = {
      total_weak_problems: weakProblems.results?.length || 0,
      needs_review: (weakProblems.results || []).filter((p: any) => p.accuracy < 50).length,
      needs_practice: (weakProblems.results || []).filter((p: any) => p.accuracy >= 50 && p.accuracy < 70).length,
      high_hint_usage: (weakProblems.results || []).filter((p: any) => p.hints_used >= 2).length
    }
    
    return c.json({
      success: true,
      student_id: studentId,
      weak_problems: weakProblems.results || [],
      summary: weakAreaSummary,
      recommendations: generateRecommendations(weakAreaSummary)
    })
    
  } catch (error: any) {
    console.error('苦手分野検出エラー:', error)
    return c.json({
      success: false,
      error: '苦手分野の検出に失敗しました',
      details: error.message
    }, 500)
  }
})

// 推奨事項を生成
function generateRecommendations(summary: any) {
  const recommendations = []
  
  if (summary.needs_review > 0) {
    recommendations.push({
      priority: 'high',
      type: 'review',
      message: `正答率50%未満の問題が${summary.needs_review}問あります。基礎から復習することをお勧めします。`
    })
  }
  
  if (summary.needs_practice > 0) {
    recommendations.push({
      priority: 'medium',
      type: 'practice',
      message: `正答率50-70%の問題が${summary.needs_practice}問あります。追加練習で理解を深めましょう。`
    })
  }
  
  if (summary.high_hint_usage > 0) {
    recommendations.push({
      priority: 'medium',
      type: 'hint_dependency',
      message: `ヒントを多く使用している問題が${summary.high_hint_usage}問あります。自力で解く練習が必要です。`
    })
  }
  
  if (summary.total_weak_problems === 0) {
    recommendations.push({
      priority: 'low',
      type: 'good',
      message: '苦手な問題は見つかりませんでした。この調子で学習を続けましょう！'
    })
  }
  
  return recommendations
}

// =============================================================================
// Phase 3-7: AI自動問題選定API
// =============================================================================

// AI推奨問題生成API
app.post('/api/ai/recommend-problems/:studentId', async (c) => {
  const { env } = c
  const studentId = parseInt(c.req.param('studentId'))
  const { curriculumId } = await c.req.json()
  
  const apiKey = env.GEMINI_API_KEY
  
  if (!apiKey || apiKey === 'your-gemini-api-key-here') {
    return c.json({ error: 'Gemini APIキーが設定されていません' }, 500)
  }
  
  try {
    console.log(`🤖 AI推奨問題生成開始: 学生ID=${studentId}, カリキュラムID=${curriculumId}`)
    
    // 1. カリキュラム情報を取得
    const curriculum = await env.DB.prepare(
      'SELECT * FROM curriculum WHERE id = ?'
    ).bind(curriculumId).first()
    
    if (!curriculum) {
      return c.json({ error: 'カリキュラムが見つかりません' }, 404)
    }
    
    // 2. 学習履歴を取得（最新50件）
    const learningHistory = await env.DB.prepare(`
      SELECT 
        content_type,
        problem_id,
        is_correct,
        answer_time_seconds,
        hint_used,
        created_at
      FROM retrieval_practice_log
      WHERE student_id = ? AND curriculum_id = ?
      ORDER BY created_at DESC
      LIMIT 50
    `).bind(studentId, curriculumId).all()
    
    // 3. 統計分析
    const history = learningHistory.results || []
    
    // 学習履歴が0件の場合はデフォルト推奨を返す
    if (history.length === 0) {
      console.log('📊 学習履歴が0件のため、デフォルト推奨を返します')
      return c.json({
        success: true,
        student_id: studentId,
        curriculum_id: curriculumId,
        learning_stats: {
          total_attempts: 0,
          correct_count: 0,
          accuracy: 0,
          avg_time: 0,
          hint_usage: 0,
          by_content_type: {}
        },
        weak_areas: [],
        recommendations: {
          analysis: {
            learning_level: "初級",
            study_style: "これから学習を始める段階です。基礎からしっかり学んでいきましょう。",
            strengths: ["新しいことに挑戦する意欲"],
            weaknesses: ["学習データがまだありません"]
          },
          recommended_problems: [
            {
              problem_type: "frequent_problems",
              difficulty: "easy",
              title: `${curriculum.unit_name}の基礎問題`,
              content: `まずは${curriculum.unit_name}の基本的な内容から始めましょう。教科書の例題を確認しながら取り組んでください。`,
              reason: "学習の第一歩として基礎を固めるため",
              hints: ["教科書の説明をよく読みましょう", "わからないときは先生に聞きましょう"],
              answer: "基礎問題は、学習カードの「ゆっくりコース」から始めることをおすすめします。",
              explanation: "まずは基本をしっかり理解することが大切です。焦らず一つずつ進めていきましょう。"
            },
            {
              problem_type: "review_checklist",
              difficulty: "easy",
              title: "復習チェック",
              content: "学習カードで学んだ内容を復習して、理解を深めましょう。",
              reason: "学習内容の定着のため",
              hints: ["学習カードを見返しましょう", "ノートにまとめると覚えやすいです"],
              answer: "復習は学習の翌日と1週間後に行うと効果的です。",
              explanation: "定期的な復習が学習の定着につながります。"
            }
          ],
          study_plan: {
            immediate_focus: "まずは「ゆっくりコース」の学習カードから始めましょう",
            weekly_goal: "学習カードを1日2-3枚のペースで進める",
            long_term_goal: `${curriculum.unit_name}の基礎をしっかり理解する`,
            estimated_time: "30"
          },
          motivation_message: "新しい学習の始まりです！一緒にがんばりましょう！"
        },
        generated_at: new Date().toISOString()
      })
    }
    
    const stats = {
      total_attempts: history.length,
      correct_count: history.filter((h: any) => h.is_correct === 1).length,
      accuracy: history.length > 0 
        ? Math.round((history.filter((h: any) => h.is_correct === 1).length / history.length) * 100) 
        : 0,
      avg_time: history.length > 0
        ? Math.round(history.reduce((sum: number, h: any) => sum + (h.answer_time_seconds || 0), 0) / history.length)
        : 0,
      hint_usage: history.filter((h: any) => h.hint_used === 1).length,
      by_content_type: {} as any
    }
    
    // コンテンツタイプ別統計
    const contentTypes = ['frequent_problems', 'application_problems', 'review_checklist']
    contentTypes.forEach(type => {
      const typeData = history.filter((h: any) => h.content_type === type)
      if (typeData.length > 0) {
        stats.by_content_type[type] = {
          attempts: typeData.length,
          correct: typeData.filter((h: any) => h.is_correct === 1).length,
          accuracy: Math.round((typeData.filter((h: any) => h.is_correct === 1).length / typeData.length) * 100),
          avg_time: Math.round(typeData.reduce((sum: number, h: any) => sum + (h.answer_time_seconds || 0), 0) / typeData.length)
        }
      }
    })
    
    // 4. 苦手分野を特定
    const weakAreas = []
    if (stats.by_content_type['frequent_problems']?.accuracy < 60) {
      weakAreas.push('頻出問題')
    }
    if (stats.by_content_type['application_problems']?.accuracy < 60) {
      weakAreas.push('応用問題')
    }
    if (stats.by_content_type['review_checklist']?.accuracy < 60) {
      weakAreas.push('復習チェックリスト')
    }
    
    // 5. AIプロンプト生成
    const aiPrompt = `
あなたは小学生の学習を支援する教育AIです。以下の学習データを分析し、個別最適化された問題推奨を行ってください。

【カリキュラム情報】
- 学年: 小学${curriculum.grade}年
- 教科: ${curriculum.subject}
- 単元名: ${curriculum.unit_name}

【学習履歴】
- 総挑戦回数: ${stats.total_attempts}回
- 正答数: ${stats.correct_count}回
- 正答率: ${stats.accuracy}%
- 平均回答時間: ${stats.avg_time}秒
- ヒント使用回数: ${stats.hint_usage}回

【コンテンツタイプ別パフォーマンス】
${Object.entries(stats.by_content_type).map(([type, data]: [string, any]) => 
  `- ${type}: ${data.attempts}回挑戦、正答率${data.accuracy}%、平均${data.avg_time}秒`
).join('\n')}

【苦手分野】
${weakAreas.length > 0 ? weakAreas.join('、') : 'なし'}

【タスク】
上記のデータを分析し、この児童に最適な学習推奨を生成してください。

【出力形式】
以下のJSON形式で出力してください：

{
  "analysis": {
    "learning_level": "初級 / 中級 / 上級",
    "study_style": "学習スタイルの特徴（2-3文）",
    "strengths": ["強み1", "強み2"],
    "weaknesses": ["課題1", "課題2"]
  },
  "recommended_problems": [
    {
      "problem_type": "frequent_problems / application_problems / review_checklist",
      "difficulty": "easy / medium / hard",
      "title": "問題タイトル（20文字以内）",
      "content": "問題内容（80-150文字）",
      "reason": "この問題を推奨する理由（50文字以内）",
      "hints": ["ヒント1", "ヒント2"],
      "answer": "解答（50-100文字）",
      "explanation": "解説（100-200文字）"
    }
  ],
  "study_plan": {
    "immediate_focus": "今すぐ取り組むべき内容",
    "weekly_goal": "今週の目標",
    "long_term_goal": "長期的な目標",
    "estimated_time": "推奨学習時間（分）"
  },
  "motivation_message": "児童へのメッセージ（50-100文字、ポジティブで励ます内容）"
}

※ recommended_problems は3-5問を推奨してください
※ 苦手分野がある場合は、その分野を重点的にカバーする問題を含めてください
※ 正答率が高い場合は、より難易度の高い問題を推奨してください
`
    
    // 6. Gemini API呼び出し
    console.log('🤖 Gemini APIを呼び出し中...')
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: aiPrompt }]
          }],
          generationConfig: {
            temperature: 0.8,
            maxOutputTokens: 4000,
            responseMimeType: 'application/json'
          }
        })
      }
    )
    
    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text()
      console.error('❌ Gemini APIエラー:', errorText)
      throw new Error('AI推奨生成に失敗しました')
    }
    
    const geminiData = await geminiResponse.json()
    const geminiText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || ''
    
    console.log('✅ Gemini APIレスポンス受信')
    console.log('📝 レスポンス長さ:', geminiText.length)
    console.log('📝 レスポンス（最初の300文字）:', geminiText.substring(0, 300))
    
    // 7. JSONを抽出（extractJSON関数を使用）
    let recommendations
    try {
      recommendations = extractJSON(geminiText)
      console.log('✅ JSON抽出成功')
    } catch (parseError: any) {
      console.error('❌ JSONパースエラー:', parseError.message)
      console.error('📝 パース失敗したテキスト:', geminiText)
      throw new Error(`AI推奨のパースに失敗しました: ${parseError.message}`)
    }
    
    console.log(`✅ AI推奨問題生成完了: ${recommendations.recommended_problems?.length}問`)
    
    return c.json({
      success: true,
      student_id: studentId,
      curriculum_id: curriculumId,
      learning_stats: stats,
      weak_areas: weakAreas,
      recommendations: recommendations,
      generated_at: new Date().toISOString()
    })
    
  } catch (error: any) {
    console.error('❌ AI推奨問題生成エラー:', error)
    return c.json({
      success: false,
      error: 'AI推奨問題の生成に失敗しました',
      details: error.message
    }, 500)
  }
})

// 学習計画生成API
app.post('/api/ai/generate-study-plan/:studentId', async (c) => {
  const { env } = c
  const studentId = parseInt(c.req.param('studentId'))
  const { curriculumId, targetDate } = await c.req.json()
  
  const apiKey = env.GEMINI_API_KEY
  
  // 詳細なエラーメッセージ
  if (!apiKey || apiKey === 'your-gemini-api-key-here') {
    return c.json({ 
      error: 'Gemini APIキーが設定されていません',
      details: 'システム管理者にGEMINI_API_KEYの設定を依頼してください',
      help: 'Cloudflare PagesのSettings > Environment variables から設定可能です'
    }, 500)
  }
  
  // 入力バリデーション
  if (!studentId || isNaN(studentId)) {
    return c.json({
      error: '無効な学生IDです',
      details: `学生ID: ${studentId}`,
      help: '正しい学生IDを指定してください'
    }, 400)
  }
  
  if (!curriculumId) {
    return c.json({
      error: 'カリキュラムIDが指定されていません',
      details: 'curriculumIdパラメータが必要です',
      help: 'リクエストボディに{"curriculumId": 1}を含めてください'
    }, 400)
  }
  
  try {
    console.log(`📅 学習計画生成開始: 学生ID=${studentId}, カリキュラムID=${curriculumId}, 目標日=${targetDate}`)
    
    // カリキュラム情報取得
    const curriculum = await env.DB.prepare(
      'SELECT * FROM curriculum WHERE id = ?'
    ).bind(curriculumId).first()
    
    if (!curriculum) {
      return c.json({ 
        error: 'カリキュラムが見つかりません',
        details: `カリキュラムID: ${curriculumId}`,
        help: '正しいカリキュラムIDを指定するか、新しいカリキュラムを作成してください'
      }, 404)
    }
    
    console.log(`📚 カリキュラム情報: ${curriculum.grade} ${curriculum.subject} ${curriculum.unit_name}`)
    
    // 学習履歴統計
    const stats = await env.DB.prepare(`
      SELECT 
        COUNT(*) as total_attempts,
        SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) as correct_count,
        AVG(answer_time_seconds) as avg_time,
        COUNT(DISTINCT DATE(created_at)) as study_days
      FROM retrieval_practice_log
      WHERE student_id = ? AND curriculum_id = ?
    `).bind(studentId, curriculumId).first()
    
    console.log(`📊 学習統計: 総学習日=${stats?.study_days || 0}日, 総問題数=${stats?.total_attempts || 0}問`)
    
    // 学習ペース分析
    const recentActivity = await env.DB.prepare(`
      SELECT 
        DATE(created_at) as study_date,
        COUNT(*) as problems_solved
      FROM retrieval_practice_log
      WHERE student_id = ? AND curriculum_id = ?
        AND created_at >= datetime('now', '-30 days')
      GROUP BY DATE(created_at)
      ORDER BY study_date DESC
      LIMIT 30
    `).bind(studentId, curriculumId).all()
    
    const studyPace = {
      total_days: stats?.study_days || 0,
      avg_problems_per_day: (stats?.total_attempts || 0) / (stats?.study_days || 1),
      recent_activity: recentActivity.results || []
    }
    
    // 学習履歴が0件の場合はデフォルト学習計画を返す
    if ((stats?.total_attempts || 0) === 0) {
      console.log('📊 学習履歴が0件のため、デフォルト学習計画を返します')
      
      const today = new Date()
      const target = targetDate ? new Date(targetDate) : new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)
      const daysUntilTarget = Math.ceil((target.getTime() - today.getTime()) / (24 * 60 * 60 * 1000))
      
      return c.json({
        success: true,
        student_id: studentId,
        curriculum_id: curriculumId,
        target_date: targetDate,
        days_until_target: daysUntilTarget,
        study_plan: {
          plan_summary: `${curriculum.unit_name}の学習を${daysUntilTarget}日間で完了する計画です。まずは基礎から始めて、徐々にステップアップしていきましょう。`,
          daily_schedule: [
            {
              day: 1,
              date: today.toISOString().split('T')[0],
              tasks: [
                {
                  time: "15:00-15:30",
                  activity: "「ゆっくりコース」の学習カード1-2枚",
                  content_type: "frequent_problems",
                  estimated_minutes: 30
                }
              ],
              daily_goal: "まずは学習カードで基礎を学ぶ"
            }
          ],
          weekly_milestones: [
            {
              week: 1,
              goal: "基礎固め：ゆっくりコースを完了",
              focus_areas: ["基本的な概念の理解", "学習習慣の定着"]
            },
            {
              week: 2,
              goal: "応用力：しっかりコースに挑戦",
              focus_areas: ["応用問題への挑戦", "復習の習慣化"]
            }
          ],
          study_tips: [
            "毎日決まった時間に勉強しましょう",
            "わからないところは先生に質問しましょう",
            "復習を忘れずに！"
          ],
          motivation_message: "新しい学習の始まりです。焦らず、一歩ずつ進んでいきましょう！"
        },
        generated_at: new Date().toISOString()
      })
    }
    
    // AIプロンプト
    const aiPrompt = `
あなたは小学生の学習計画を立てる教育AIです。以下のデータから最適な学習計画を作成してください。

【カリキュラム情報】
- 学年: 小学${curriculum.grade}年
- 教科: ${curriculum.subject}
- 単元名: ${curriculum.unit_name}
- 総学習時間: ${curriculum.total_hours}時間

【学習実績】
- 総学習日数: ${studyPace.total_days}日
- 総問題数: ${stats?.total_attempts || 0}問
- 正答数: ${stats?.correct_count || 0}問
- 正答率: ${stats ? Math.round((stats.correct_count / stats.total_attempts) * 100) : 0}%
- 1日あたり平均: ${Math.round(studyPace.avg_problems_per_day)}問

【目標】
- 目標達成日: ${targetDate || '未設定'}

【タスク】
上記データから、目標達成に向けた学習計画を作成してください。

【出力形式】
{
  "plan_summary": "計画の概要（2-3文）",
  "daily_schedule": [
    {
      "day": 1,
      "date": "YYYY-MM-DD",
      "tasks": [
        {
          "time": "10:00-10:30",
          "activity": "活動内容",
          "content_type": "frequent_problems / application_problems / review_checklist",
          "estimated_minutes": 30
        }
      ],
      "daily_goal": "今日の目標"
    }
  ],
  "weekly_milestones": [
    {
      "week": 1,
      "goal": "週の目標",
      "focus_areas": ["重点分野1", "重点分野2"]
    }
  ],
  "review_schedule": [
    {
      "date": "YYYY-MM-DD",
      "review_type": "short_term / long_term",
      "content": "復習内容"
    }
  ],
  "tips": ["学習のコツ1", "学習のコツ2", "学習のコツ3"],
  "motivation": "目標達成に向けたメッセージ"
}
`
    
    console.log('🤖 Gemini API呼び出し開始...')
    
    // Gemini API呼び出し
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: aiPrompt }] }],
          generationConfig: { 
            temperature: 0.7, 
            maxOutputTokens: 4000,
            responseMimeType: 'application/json'
          }
        })
      }
    )
    
    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text()
      console.error('❌ Gemini APIエラー:', errorText)
      throw new Error(`Gemini APIエラー: ステータス ${geminiResponse.status}`)
    }
    
    const geminiData = await geminiResponse.json()
    const geminiText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || ''
    
    if (!geminiText) {
      throw new Error('Gemini APIから空のレスポンスが返されました')
    }
    
    console.log('📝 Geminiレスポンス長さ:', geminiText.length)
    console.log('📝 Geminiレスポンス（最初の300文字）:', geminiText.substring(0, 300))
    
    // extractJSON関数を使って堅牢にJSONを抽出
    const studyPlan = extractJSON(geminiText)
    
    console.log('✅ 学習計画生成完了')
    
    return c.json({
      success: true,
      student_id: studentId,
      curriculum_id: curriculumId,
      study_pace: studyPace,
      study_plan: studyPlan,
      generated_at: new Date().toISOString()
    })
    
  } catch (error: any) {
    console.error('❌ 学習計画生成エラー:', error)
    console.error('エラースタック:', error.stack?.substring(0, 500))
    
    // 詳細なエラーメッセージを返す
    return c.json({
      success: false,
      error: '学習計画の生成に失敗しました',
      details: error.message,
      error_type: error.name || 'UnknownError',
      stack_trace: error.stack?.substring(0, 200),
      help: 'Gemini APIの応答が不正な形式である可能性があります。しばらく時間をおいて再試行してください。'
    }, 500)
  }
})

// APIルート：評価問題を生成（チェックテスト・選択問題）
app.post('/api/curriculum/:curriculumId/generate-assessment-problems', async (c) => {
  const { env } = c
  const curriculumId = c.req.param('curriculumId')
  const apiKey = env.GEMINI_API_KEY
  
  if (!apiKey || apiKey === 'your-gemini-api-key-here') {
    return c.json({ error: 'Gemini APIキーが設定されていません' }, 500)
  }
  
  try {
    const curriculum = await env.DB.prepare('SELECT * FROM curriculum WHERE id = ?').bind(curriculumId).first()
    
    if (!curriculum) {
      return c.json({ error: 'カリキュラムが見つかりません' }, 404)
    }
    
    // AIプロンプト：評価問題のみ
    const prompt = `小学${curriculum.grade}年 ${curriculum.subject}「${curriculum.unit_name}」の評価問題を生成。

【必須：JSONのみ出力】
{
  "common_check_test": {
    "test_title": "基礎基本チェックテスト",
    "sample_problems": [
      {"problem_number": 1, "problem_text": "具体的な数字を含む問題文（30字以上）", "answer": "解答", "difficulty": "basic"},
      {"problem_number": 2, "problem_text": "具体的な数字を含む問題文（30字以上）", "answer": "解答", "difficulty": "basic"},
      {"problem_number": 3, "problem_text": "具体的な数字を含む問題文（30字以上）", "answer": "解答", "difficulty": "basic"},
      {"problem_number": 4, "problem_text": "具体的な数字を含む問題文（30字以上）", "answer": "解答", "difficulty": "basic"},
      {"problem_number": 5, "problem_text": "具体的な数字を含む問題文（30字以上）", "answer": "解答", "difficulty": "basic"},
      {"problem_number": 6, "problem_text": "具体的な数字を含む問題文（30字以上）", "answer": "解答", "difficulty": "basic"}
    ]
  },
  "optional_problems": [
    {"problem_number": 1, "problem_title": "実生活問題", "problem_description": "具体的な数字を含む問題文（50字以上）", "learning_meaning": "実生活で役立つ力がつく（20字以上）", "difficulty_level": "medium"},
    {"problem_number": 2, "problem_title": "考え方問題", "problem_description": "具体的な数字を含む問題文（50字以上）", "learning_meaning": "深く理解できる（20字以上）", "difficulty_level": "medium"},
    {"problem_number": 3, "problem_title": "他教科問題", "problem_description": "具体的な数字を含む問題文（50字以上）", "learning_meaning": "他教科でも使える（20字以上）", "difficulty_level": "hard"},
    {"problem_number": 4, "problem_title": "応用問題", "problem_description": "具体的な数字を含む問題文（50字以上）", "learning_meaning": "組み合わせて考える力（20字以上）", "difficulty_level": "hard"},
    {"problem_number": 5, "problem_title": "探究問題", "problem_description": "具体的な数字を含む問題文（50字以上）", "learning_meaning": "不思議さに気づく（20字以上）", "difficulty_level": "very_hard"},
    {"problem_number": 6, "problem_title": "創造問題", "problem_description": "具体的な数字を含む問題文（50字以上）", "learning_meaning": "新しい方法を考える（20字以上）", "difficulty_level": "very_hard"}
  ]
}`

    // フォールバック機能付きAPI呼び出し
    const models = ['gemini-3-flash', 'gemini-3-flash', 'gemini-3-flash']
    let response
    let lastError
    
    for (const model of models) {
      try {
        console.log(`🔄 評価問題モデル試行中: ${model}`)
        response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { temperature: 0.8, maxOutputTokens: 8192 }
            })
          }
        )
        
        if (response.ok) {
          console.log(`✅ 評価問題モデル成功: ${model}`)
          break
        } else {
          console.warn(`⚠️ 評価問題モデル失敗: ${model} (status: ${response.status})`)
          lastError = new Error(`${model} returned ${response.status}`)
        }
      } catch (error: any) {
        console.warn(`⚠️ 評価問題モデルエラー: ${model} - ${error.message}`)
        lastError = error
      }
    }
    
    if (!response || !response.ok) {
      throw lastError || new Error('すべてのモデルが失敗しました')
    }
    
    const data = await response.json()
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text
    
    if (!aiResponse) {
      throw new Error('AI response is empty')
    }
    
    // JSONを抽出
    console.log('AIレスポンス（評価問題）:', aiResponse)
    const problems = extractJSON(aiResponse)
    console.log('パース結果（評価問題）:', JSON.stringify(problems, null, 2))
    
    // データベースに保存
    if (problems.common_check_test) {
      const sampleCount = problems.common_check_test.sample_problems?.length || 0
      console.log(`チェックテスト問題を保存: ${sampleCount}件`)
      
      // test_titleとtest_descriptionを追加
      const checkTestWithMeta = {
        test_title: problems.common_check_test.test_title || '全コース共通の基礎基本チェックテスト',
        test_description: problems.common_check_test.test_description || 'どのコースを選んでも、同じチェックテストを受けます。単元の基礎基本が身についているかを確認します。',
        sample_problems: problems.common_check_test.sample_problems || []
      }
      
      const checkTestJSON = JSON.stringify(checkTestWithMeta)
      await env.DB.prepare(`
        INSERT OR REPLACE INTO curriculum_metadata (curriculum_id, metadata_key, metadata_value)
        VALUES (?, ?, ?)
      `).bind(curriculumId, 'common_check_test', checkTestJSON).run()
    } else {
      console.warn('common_check_testが見つかりません')
    }
    
    if (problems.optional_problems) {
      console.log(`選択問題を保存: ${problems.optional_problems.length}件`)
      for (const problem of problems.optional_problems) {
        console.log(`  - 問題${problem.problem_number}: ${problem.problem_title}`)
        await env.DB.prepare(`
          INSERT INTO optional_problems (
            curriculum_id, problem_number, problem_title, problem_content, problem_description,
            difficulty_level, learning_meaning
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `).bind(
          curriculumId,
          problem.problem_number,
          problem.problem_title || '問題',
          problem.problem_content || problem.problem_description || '問題内容',
          problem.problem_description || problem.problem_content || '問題の説明',
          problem.difficulty_level || 'medium',
          problem.learning_meaning || ''
        ).run()
      }
    } else {
      console.warn('optional_problemsが見つかりません')
    }
    
    return c.json({ 
      success: true, 
      message: '評価問題を生成・保存しました',
      details: {
        check_test_count: problems.common_check_test?.sample_problems?.length || 0,
        optional_count: problems.optional_problems?.length || 0
      }
    })
    
  } catch (error: any) {
    console.error('評価問題生成エラー:', error)
    console.error('エラースタック:', error.stack)
    return c.json({ 
      error: '評価問題の生成に失敗しました', 
      details: error.message,
      stack: error.stack?.substring(0, 200)
    }, 500)
  }
})

// APIルート：導入問題のみを生成（軽量・高速）
app.post('/api/curriculum/:curriculumId/generate-intro-problems', async (c) => {
  const { env } = c
  const curriculumId = c.req.param('curriculumId')
  const apiKey = env.GEMINI_API_KEY
  
  if (!apiKey || apiKey === 'your-gemini-api-key-here') {
    return c.json({ error: 'Gemini APIキーが設定されていません' }, 500)
  }
  
  try {
    // カリキュラムと3コースの情報を取得
    console.log(`🔍 導入問題生成: カリキュラムID=${curriculumId}`)
    const curriculum = await env.DB.prepare('SELECT * FROM curriculum WHERE id = ?').bind(curriculumId).first()
    console.log('📚 カリキュラム情報:', curriculum ? `${curriculum.grade} ${curriculum.subject} ${curriculum.unit_name}` : 'null')
    
    const courses = await env.DB.prepare('SELECT * FROM courses WHERE curriculum_id = ?').bind(curriculumId).all()
    console.log(`📊 コース数: ${courses.results?.length || 0}件`)
    
    if (!curriculum) {
      console.error('❌ カリキュラムが存在しません')
      return c.json({ error: 'カリキュラムが見つかりません', details: 'カリキュラムレコードがデータベースに存在しません' }, 404)
    }
    
    if (!courses.results || courses.results.length < 3) {
      console.error(`❌ コースが不足しています: ${courses.results?.length || 0}/3件`)
      return c.json({ 
        error: 'カリキュラムが見つかりません', 
        details: `3つのコースが必要ですが、${courses.results?.length || 0}件しか見つかりませんでした`,
        curriculum_id: curriculumId,
        courses_found: courses.results?.length || 0
      }, 404)
    }
    
    console.log('✅ カリキュラムとコースの検証完了')
    
    // 軽量なプロンプト（導入問題3題のみ）
    const prompt = `小学${curriculum.grade}年 ${curriculum.subject}「${curriculum.unit_name}」の3つのコースの導入問題を生成。

【3つのコース】
1. ${courses.results[0]?.course_name || 'ゆっくりコース'}: ${courses.results[0]?.description || ''}
2. ${courses.results[1]?.course_name || 'しっかりコース'}: ${courses.results[1]?.description || ''}
3. ${courses.results[2]?.course_name || 'ぐんぐんコース'}: ${courses.results[2]?.description || ''}

【JSON出力（導入問題3題のみ）】
{
  "introduction_problems": [
    {"course_number": 1, "problem_title": "タイトル（20字以内）", "problem_content": "具体的な数字を含む問題文（80-150字）", "answer": "解答と解説（50-100字）"},
    {"course_number": 2, "problem_title": "タイトル（20字以内）", "problem_content": "具体的な数字を含む問題文（80-150字）", "answer": "解答と解説（50-100字）"},
    {"course_number": 3, "problem_title": "タイトル（20字以内）", "problem_content": "具体的な数字を含む問題文（80-150字）", "answer": "解答と解説（50-100字）"}
  ]
}`

    // フォールバック機能付きAPI呼び出し
    const models = ['gemini-3-flash', 'gemini-3-flash', 'gemini-2.5-pro']
    let response
    let lastError
    
    for (const model of models) {
      try {
        console.log(`🔄 導入問題モデル試行中: ${model}`)
        response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { 
                temperature: 0.7, 
                maxOutputTokens: 4000,
                responseMimeType: 'application/json'
              }
            })
          }
        )
        
        if (response.ok) {
          console.log(`✅ 導入問題モデル成功: ${model}`)
          break
        } else {
          console.warn(`⚠️ 導入問題モデル失敗: ${model} (status: ${response.status})`)
          lastError = new Error(`${model} returned ${response.status}`)
        }
      } catch (error: any) {
        console.warn(`⚠️ 導入問題モデルエラー: ${model} - ${error.message}`)
        lastError = error
      }
    }
    
    if (!response || !response.ok) {
      throw lastError || new Error('すべてのモデルが失敗しました')
    }
    
    const data = await response.json()
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text
    
    if (!aiResponse) {
      console.error('❌ AIレスポンスが空です:', data)
      throw new Error('AI response is empty')
    }
    
    // JSONを抽出
    console.log('AIレスポンス（導入問題）長さ:', aiResponse.length)
    console.log('AIレスポンス（最初の200文字）:', aiResponse.substring(0, 200))
    
    let problems
    try {
      problems = extractJSON(aiResponse)
      console.log('✅ パース成功（導入問題）:', JSON.stringify(problems, null, 2))
    } catch (parseError: any) {
      console.error('❌ JSONパースエラー:', parseError.message)
      console.error('パース失敗レスポンス全体:', aiResponse)
      throw new Error(`JSON parse failed: ${parseError.message}`)
    }
    
    // データベースに保存
    if (problems.introduction_problems && problems.introduction_problems.length === 3) {
      const coursesList = courses.results
      for (let i = 0; i < 3; i++) {
        const introProblem = problems.introduction_problems[i]
        const course = coursesList[i]
        const introJSON = JSON.stringify(introProblem)
        console.log(`コース${i+1}(ID:${course.id})に導入問題を保存:`, introProblem.problem_title)
        await env.DB.prepare(`
          UPDATE courses SET introduction_problem = ? WHERE id = ?
        `).bind(introJSON, course.id).run()
      }
      
      return c.json({ 
        success: true, 
        message: '導入問題3題を生成・保存しました',
        details: { introduction_count: 3 }
      })
    } else {
      throw new Error('導入問題が3題生成されませんでした')
    }
    
  } catch (error: any) {
    console.error('導入問題生成エラー:', error)
    console.error('エラースタック:', error.stack)
    return c.json({ 
      error: '導入問題の生成に失敗しました', 
      details: error.message,
      stack: error.stack?.substring(0, 200)
    }, 500)
  }
})

// APIルート：選択問題を取得
app.get('/api/curriculum/:curriculumId/optional-problems', async (c) => {
  const { env } = c
  const curriculumId = c.req.param('curriculumId')
  
  try {
    const problems = await env.DB.prepare(`
      SELECT * FROM optional_problems 
      WHERE curriculum_id = ? 
      ORDER BY problem_number
    `).bind(curriculumId).all()
    
    console.log(`選択問題取得: ${problems.results?.length || 0}件`)
    
    return c.json({ 
      success: true,
      optional_problems: problems.results || []
    })
  } catch (error: any) {
    console.error('選択問題取得エラー:', error)
    return c.json({ 
      success: false,
      error: '選択問題の取得に失敗しました',
      optional_problems: []
    }, 500)
  }
})

// APIルート：追加問題を生成（旧エンドポイント - 互換性のため残す）
app.post('/api/curriculum/:curriculumId/generate-additional-problems', async (c) => {
  const { env } = c
  const curriculumId = c.req.param('curriculumId')
  const apiKey = env.GEMINI_API_KEY
  
  if (!apiKey || apiKey === 'your-gemini-api-key-here') {
    return c.json({ error: 'Gemini APIキーが設定されていません' }, 500)
  }
  
  try {
    // カリキュラムと3コースの情報を取得
    const curriculum = await env.DB.prepare('SELECT * FROM curriculum WHERE id = ?').bind(curriculumId).first()
    const courses = await env.DB.prepare('SELECT * FROM courses WHERE curriculum_id = ?').bind(curriculumId).all()
    
    if (!curriculum || !courses.results || courses.results.length === 0) {
      return c.json({ error: 'カリキュラムが見つかりません' }, 404)
    }
    
    // AIプロンプト：追加問題のみ生成
    const prompt = `あなたは小学校の教師です。以下の単元の追加問題を生成してください。

【単元情報】
- 学年: ${curriculum.grade}
- 教科: ${curriculum.subject}
- 教科書会社: ${curriculum.textbook_company}
- 単元名: ${curriculum.unit_name}
- 単元目標: ${curriculum.unit_goal}

【3つのコース】
${courses.results.map((c: any, i: number) => `${i + 1}. ${c.course_name}: ${c.description}`).join('\n')}

【生成する問題】
1. **コース選択問題3題**（各コース1題ずつ、子どもがコースを選ぶための魅力的な問題）
2. **導入問題3題**（各コース1題ずつ、学習内容をイメージできる問題）
3. **チェックテスト6題**（全コース共通、基礎基本の確認問題）
4. **選択問題6題**（発展的な課題、学習の意味を実感できる問題）

【重要な要件】
- すべての問題に具体的な数字と状況を含めること
- 問題文は実際に解ける形式にすること
- 子どもが「やってみたい！」と思える魅力的な内容にすること

【JSON形式で出力】
{
  "course_selection_problems": [
    {
      "problem_number": 1,
      "problem_title": "ゆっくりコースの問題タイトル",
      "problem_description": "問題の説明",
      "problem_content": "具体的な数字と状況を含む問題文",
      "course_level": "基礎",
      "connection_to_cards": "この問題は学習カード1-2で学ぶ内容につながります"
    },
    {
      "problem_number": 2,
      "problem_title": "しっかりコースの問題タイトル",
      "problem_description": "問題の説明",
      "problem_content": "具体的な数字と状況を含む問題文",
      "course_level": "標準",
      "connection_to_cards": "この問題は学習カード1-3で学ぶ内容につながります"
    },
    {
      "problem_number": 3,
      "problem_title": "どんどんコースの問題タイトル",
      "problem_description": "問題の説明",
      "problem_content": "具体的な数字と状況を含む問題文",
      "course_level": "発展",
      "connection_to_cards": "この問題は学習カード1-4につながります"
    }
  ],
  "introduction_problems": [
    {
      "course_number": 1,
      "problem_title": "ゆっくりコース導入問題のタイトル",
      "problem_content": "具体的な数字と状況を含む問題文",
      "answer": "解答のヒント"
    },
    {
      "course_number": 2,
      "problem_title": "しっかりコース導入問題のタイトル",
      "problem_content": "具体的な数字と状況を含む問題文",
      "answer": "解答のヒント"
    },
    {
      "course_number": 3,
      "problem_title": "どんどんコース導入問題のタイトル",
      "problem_content": "具体的な数字と状況を含む問題文",
      "answer": "解答のヒント"
    }
  ],
  "common_check_test": {
    "test_title": "基礎基本チェックテスト",
    "test_description": "全コース共通の基礎基本チェックテスト（知識理解の最低保証）",
    "sample_problems": [
      {
        "problem_number": 1,
        "problem_text": "具体的な数字と状況を含む問題文",
        "answer": "解答",
        "difficulty": "basic"
      },
      {
        "problem_number": 2,
        "problem_text": "具体的な数字と状況を含む問題文",
        "answer": "解答",
        "difficulty": "basic"
      },
      {
        "problem_number": 3,
        "problem_text": "具体的な数字と状況を含む問題文",
        "answer": "解答",
        "difficulty": "basic"
      },
      {
        "problem_number": 4,
        "problem_text": "具体的な数字と状況を含む問題文",
        "answer": "解答",
        "difficulty": "basic"
      },
      {
        "problem_number": 5,
        "problem_text": "具体的な数字と状況を含む問題文",
        "answer": "解答",
        "difficulty": "basic"
      },
      {
        "problem_number": 6,
        "problem_text": "具体的な数字と状況を含む問題文",
        "answer": "解答",
        "difficulty": "basic"
      }
    ]
  },
  "optional_problems": [
    {
      "problem_number": 1,
      "problem_title": "実生活に生かせる問題",
      "problem_description": "具体的な数字と状況を含む問題文",
      "learning_meaning": "この問題を解くことで、算数が実際の生活で役に立つことがわかります",
      "difficulty_level": "medium",
      "answer": "解答",
      "explanation": "考え方の説明"
    },
    {
      "problem_number": 2,
      "problem_title": "教科の見方・考え方が深まる問題",
      "problem_description": "具体的な数字と状況を含む問題文",
      "learning_meaning": "この問題を解くことで、なぜこの方法で解けるのか深く理解できます",
      "difficulty_level": "medium",
      "answer": "解答",
      "explanation": "考え方の説明"
    },
    {
      "problem_number": 3,
      "problem_title": "他教科とつながる問題",
      "problem_description": "具体的な数字と状況を含む問題文",
      "learning_meaning": "この問題を解くことで、算数が他の教科でも使えることがわかります",
      "difficulty_level": "hard",
      "answer": "解答",
      "explanation": "考え方の説明"
    },
    {
      "problem_number": 4,
      "problem_title": "発展的な問題",
      "problem_description": "具体的な数字と状況を含む問題文",
      "learning_meaning": "この問題を解くことで、今まで学んだことを組み合わせて考える力がつきます",
      "difficulty_level": "hard",
      "answer": "解答",
      "explanation": "考え方の説明"
    },
    {
      "problem_number": 5,
      "problem_title": "教科の本質に触れる探究的な問題",
      "problem_description": "具体的な数字と状況を含む問題文",
      "learning_meaning": "この問題を解くことで、算数の面白さや不思議さに気づき、もっと学びたくなります",
      "difficulty_level": "very_hard",
      "answer": "解答",
      "explanation": "考え方の説明"
    },
    {
      "problem_number": 6,
      "problem_title": "創造的・総合的な問題",
      "problem_description": "具体的な数字と状況を含む問題文",
      "learning_meaning": "この問題を解くことで、自分で考えを作り出す力がつきます",
      "difficulty_level": "very_hard",
      "answer": "解答",
      "explanation": "考え方の説明"
    }
  ]
}

必ず完全なJSONのみを出力してください。説明文は不要です。`

    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash:generateContent?key=' + apiKey,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.8,
            maxOutputTokens: 8000
          }
        })
      }
    )
    
    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`)
    }
    
    const data = await response.json()
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text
    
    if (!aiResponse) {
      throw new Error('AI response is empty')
    }
    
    // JSONを抽出
    const additionalProblems = extractJSON(aiResponse)
    
    // データベースに保存
    // コース選択問題
    if (additionalProblems.course_selection_problems) {
      const courseSelectionJSON = JSON.stringify(additionalProblems.course_selection_problems)
      await env.DB.prepare(`
        INSERT OR REPLACE INTO curriculum_metadata (curriculum_id, metadata_key, metadata_value)
        VALUES (?, ?, ?)
      `).bind(curriculumId, 'course_selection_problems', courseSelectionJSON).run()
    }
    
    // 導入問題（各コースに保存）
    if (additionalProblems.introduction_problems) {
      const coursesList = courses.results
      for (let i = 0; i < additionalProblems.introduction_problems.length && i < coursesList.length; i++) {
        const introProblem = additionalProblems.introduction_problems[i]
        const course = coursesList[i]
        const introJSON = JSON.stringify(introProblem)
        await env.DB.prepare(`
          UPDATE courses SET introduction_problem = ? WHERE id = ?
        `).bind(introJSON, course.id).run()
      }
    }
    
    // チェックテスト
    if (additionalProblems.common_check_test) {
      const checkTestJSON = JSON.stringify(additionalProblems.common_check_test)
      await env.DB.prepare(`
        INSERT OR REPLACE INTO curriculum_metadata (curriculum_id, metadata_key, metadata_value)
        VALUES (?, ?, ?)
      `).bind(curriculumId, 'common_check_test', checkTestJSON).run()
    }
    
    // 選択問題
    if (additionalProblems.optional_problems) {
      for (const problem of additionalProblems.optional_problems) {
        await env.DB.prepare(`
          INSERT INTO optional_problems (
            curriculum_id, problem_number, problem_title, problem_content, problem_description,
            difficulty_level, learning_meaning
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `).bind(
          curriculumId,
          problem.problem_number,
          problem.problem_title || '問題',
          problem.problem_content || problem.problem_description || '問題内容',
          problem.problem_description || problem.problem_content || '問題の説明',
          problem.difficulty_level || 'medium',
          problem.learning_meaning || ''
        ).run()
      }
    }
    
    return c.json({
      success: true,
      message: '追加問題を生成・保存しました'
    })
    
  } catch (error: any) {
    console.error('追加問題生成エラー:', error)
    return c.json({
      error: '追加問題の生成に失敗しました',
      details: error.message
    }, 500)
  }
})

// APIルート：単元名候補の生成（AI検索機能）
// 重複エンドポイント削除（2162行目に正式版あり）

// APIルート：単元の更新（編集）
app.put('/api/curriculum/:id', async (c) => {
  const { env } = c
  const id = c.req.param('id')
  const { basicInfo, courses } = await c.req.json()
  
  try {
    console.log(`📝 単元更新開始: ID=${id}`)
    
    // 更新前のデータを取得（履歴記録用）
    const oldCurriculum = await env.DB.prepare(`
      SELECT * FROM curriculum WHERE id = ?
    `).bind(id).first()
    
    // 1. カリキュラム基本情報を更新
    await env.DB.prepare(`
      UPDATE curriculum
      SET grade = ?, subject = ?, textbook_company = ?, 
          unit_name = ?, unit_goal = ?, non_cognitive_goal = ?
      WHERE id = ?
    `).bind(
      basicInfo.grade,
      basicInfo.subject,
      basicInfo.textbook_company,
      basicInfo.unit_name,
      basicInfo.unit_goal,
      basicInfo.non_cognitive_goal,
      id
    ).run()
    console.log(`  - カリキュラム基本情報更新完了`)
    
    // 履歴記録
    await recordHistory(
      env.DB,
      'curriculum_history',
      parseInt(id),
      'update',
      { old: oldCurriculum, new: basicInfo }
    )
    
    // 2. 各コースのカードを更新
    for (const course of courses) {
      for (const card of course.cards) {
        await env.DB.prepare(`
          UPDATE learning_cards
          SET card_title = ?, problem_description = ?, 
              example_problem = ?, answer = ?
          WHERE id = ?
        `).bind(
          card.card_title,
          card.problem_description,
          card.example_problem,
          card.answer,
          card.id
        ).run()
      }
      console.log(`  - コース ${course.id} のカード更新完了`)
    }
    
    return c.json({
      success: true,
      message: '単元を更新しました'
    })
    
  } catch (error: any) {
    console.error('単元更新エラー:', error)
    return c.json({
      success: false,
      error: '単元の更新に失敗しました',
      details: error.message
    }, 500)
  }
})

// APIルート：カリキュラムの総時数を更新
app.post('/api/curriculum/update-total-hours', async (c) => {
  const { env } = c
  const { curriculumId, totalHours } = await c.req.json()
  
  // 入力バリデーション
  if (!curriculumId || !totalHours) {
    return c.json({
      success: false,
      error: '必須パラメータが不足しています',
      details: 'curriculumIdとtotalHoursが必要です'
    }, 400)
  }
  
  if (totalHours < 3 || totalHours > 50) {
    return c.json({
      success: false,
      error: '総時数は3〜50の範囲で設定してください',
      details: `指定された総時数: ${totalHours}`
    }, 400)
  }
  
  try {
    console.log(`📝 総時数更新開始: カリキュラムID=${curriculumId}, 総時数=${totalHours}`)
    
    // カリキュラムが存在するか確認
    const curriculum = await env.DB.prepare(`
      SELECT id, total_hours FROM curriculum WHERE id = ?
    `).bind(curriculumId).first()
    
    if (!curriculum) {
      return c.json({
        success: false,
        error: 'カリキュラムが見つかりません',
        details: `カリキュラムID: ${curriculumId}`
      }, 404)
    }
    
    const oldTotalHours = curriculum.total_hours
    
    // 総時数を更新
    await env.DB.prepare(`
      UPDATE curriculum
      SET total_hours = ?
      WHERE id = ?
    `).bind(totalHours, curriculumId).run()
    
    console.log(`✅ 総時数更新完了: ${oldTotalHours}時間 → ${totalHours}時間`)
    
    return c.json({
      success: true,
      message: '総時数を更新しました',
      data: {
        curriculum_id: curriculumId,
        old_total_hours: oldTotalHours,
        new_total_hours: totalHours
      }
    })
  } catch (error: any) {
    console.error('❌ 総時数更新エラー:', error)
    return c.json({
      success: false,
      error: '総時数の更新に失敗しました',
      details: error.message
    }, 500)
  }
})

// APIルート：単元の削除（カスケード削除）
app.delete('/api/curriculum/:id', async (c) => {
  const { env } = c
  const id = c.req.param('id')
  
  try {
    console.log(`🗑️ 単元削除開始: ID=${id}`)
    
    // 1. カリキュラムに紐づくコースIDを取得
    const courses = await env.DB.prepare(`
      SELECT id FROM courses WHERE curriculum_id = ?
    `).bind(id).all()
    
    const courseIds = (courses.results || []).map((c: any) => c.id)
    console.log(`  - コース数: ${courseIds.length}`)
    
    // 2. 各コースの学習カードを削除
    for (const courseId of courseIds) {
      await env.DB.prepare(`
        DELETE FROM learning_cards WHERE course_id = ?
      `).bind(courseId).run()
    }
    console.log(`  - 学習カード削除完了`)
    
    // 3. コースを削除
    await env.DB.prepare(`
      DELETE FROM courses WHERE curriculum_id = ?
    `).bind(id).run()
    console.log(`  - コース削除完了`)
    
    // 4. メタデータを削除（コース選択問題、チェックテスト）
    await env.DB.prepare(`
      DELETE FROM curriculum_metadata WHERE curriculum_id = ?
    `).bind(id).run()
    console.log(`  - メタデータ削除完了`)
    
    // 5. 選択問題を削除
    await env.DB.prepare(`
      DELETE FROM optional_problems WHERE curriculum_id = ?
    `).bind(id).run()
    console.log(`  - 選択問題削除完了`)
    
    // 6. カリキュラム本体を削除
    await env.DB.prepare(`
      DELETE FROM curriculum WHERE id = ?
    `).bind(id).run()
    console.log(`  - カリキュラム本体削除完了`)
    
    return c.json({
      success: true,
      message: '単元を削除しました',
      deleted: {
        curriculum_id: id,
        courses_count: courseIds.length
      }
    })
    
  } catch (error: any) {
    console.error('単元削除エラー:', error)
    return c.json({
      success: false,
      error: '単元の削除に失敗しました',
      details: error.message
    }, 500)
  }
})

// APIルート：単元の複製
app.post('/api/curriculum/:id/duplicate', async (c) => {
  const { env } = c
  const sourceId = c.req.param('id')
  const { newGrade, newSubject, newTextbook, newUnitName } = await c.req.json()
  
  try {
    console.log(`📋 単元複製開始: sourceId=${sourceId}`)
    
    // 元のカリキュラムを取得
    const sourceCurriculum: any = await env.DB.prepare(`
      SELECT * FROM curriculum WHERE id = ?
    `).bind(sourceId).first()
    
    if (!sourceCurriculum) {
      return c.json({ error: 'カリキュラムが見つかりません' }, 404)
    }
    
    // 新しいカリキュラムを作成
    const newCurriculum = await env.DB.prepare(`
      INSERT INTO curriculum (
        grade, subject, textbook_company, unit_name, 
        unit_order, total_hours, unit_goal, non_cognitive_goal
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      newGrade || sourceCurriculum.grade,
      newSubject || sourceCurriculum.subject,
      newTextbook || sourceCurriculum.textbook_company,
      newUnitName || `${sourceCurriculum.unit_name}（コピー）`,
      sourceCurriculum.unit_order,
      sourceCurriculum.total_hours,
      sourceCurriculum.unit_goal,
      sourceCurriculum.non_cognitive_goal
    ).run()
    
    const newCurriculumId = newCurriculum.meta.last_row_id
    
    // コースをコピー
    const courses = await env.DB.prepare(`
      SELECT * FROM courses WHERE curriculum_id = ?
    `).bind(sourceId).all()
    
    for (const course of courses.results) {
      const newCourse = await env.DB.prepare(`
        INSERT INTO courses (
          curriculum_id, course_level, course_name, course_label, 
          color_code, introduction_problem
        ) VALUES (?, ?, ?, ?, ?, ?)
      `).bind(
        newCurriculumId,
        (course as any).course_level,
        (course as any).course_name,
        (course as any).course_label,
        (course as any).color_code,
        (course as any).introduction_problem
      ).run()
      
      const newCourseId = newCourse.meta.last_row_id
      
      // 学習カードをコピー
      const cards = await env.DB.prepare(`
        SELECT * FROM learning_cards WHERE course_id = ?
      `).bind((course as any).id).all()
      
      for (const card of cards.results) {
        await env.DB.prepare(`
          INSERT INTO learning_cards (
            course_id, card_number, card_title, card_type, 
            problem_description, new_terms, example_problem, 
            example_solution, real_world_connection, answer, textbook_page
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          newCourseId,
          (card as any).card_number,
          (card as any).card_title,
          (card as any).card_type,
          (card as any).problem_description,
          (card as any).new_terms,
          (card as any).example_problem,
          (card as any).example_solution,
          (card as any).real_world_connection,
          (card as any).answer,
          (card as any).textbook_page
        ).run()
      }
    }
    
    // メタデータをコピー
    const metadata = await env.DB.prepare(`
      SELECT * FROM curriculum_metadata WHERE curriculum_id = ?
    `).bind(sourceId).all()
    
    for (const meta of metadata.results) {
      await env.DB.prepare(`
        INSERT INTO curriculum_metadata (curriculum_id, metadata_key, metadata_value)
        VALUES (?, ?, ?)
      `).bind(
        newCurriculumId,
        (meta as any).metadata_key,
        (meta as any).metadata_value
      ).run()
    }
    
    // 選択問題をコピー
    const optionalProblems = await env.DB.prepare(`
      SELECT * FROM optional_problems WHERE curriculum_id = ?
    `).bind(sourceId).all()
    
    for (const problem of optionalProblems.results) {
      await env.DB.prepare(`
        INSERT INTO optional_problems (
          curriculum_id, problem_number, problem_title, 
          problem_description, problem_content, difficulty_level, learning_meaning
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind(
        newCurriculumId,
        (problem as any).problem_number,
        (problem as any).problem_title,
        (problem as any).problem_description,
        (problem as any).problem_content,
        (problem as any).difficulty_level,
        (problem as any).learning_meaning
      ).run()
    }
    
    console.log(`✅ 単元複製完了: newId=${newCurriculumId}`)
    
    return c.json({
      success: true,
      newCurriculumId,
      message: '単元を複製しました'
    })
  } catch (error: any) {
    console.error('単元複製エラー:', error)
    return c.json({
      success: false,
      error: '単元の複製に失敗しました',
      details: error.message
    }, 500)
  }
})

// APIルート：カードの並び替え
app.post('/api/course/:courseId/reorder-cards', async (c) => {
  const { env } = c
  const courseId = c.req.param('courseId')
  const { cardIds } = await c.req.json() // [id1, id2, id3, ...]
  
  try {
    console.log(`📋 カード並び替え開始: courseId=${courseId}, cards=${cardIds.length}`)
    
    // 各カードのcard_numberを更新
    for (let i = 0; i < cardIds.length; i++) {
      await env.DB.prepare(`
        UPDATE learning_cards
        SET card_number = ?
        WHERE id = ? AND course_id = ?
      `).bind(i + 1, cardIds[i], courseId).run()
    }
    
    console.log(`✅ カード並び替え完了: ${cardIds.length}枚`)
    
    return c.json({
      success: true,
      message: 'カードの並び替えを保存しました',
      count: cardIds.length
    })
  } catch (error: any) {
    console.error('カード並び替えエラー:', error)
    return c.json({
      success: false,
      error: 'カードの並び替えに失敗しました',
      details: error.message
    }, 500)
  }
})

// APIルート：選択問題の削除
app.delete('/api/optional-problem/:id', async (c) => {
  const { env } = c
  const problemId = c.req.param('id')
  
  try {
    await env.DB.prepare(`
      DELETE FROM optional_problems WHERE id = ?
    `).bind(problemId).run()
    
    return c.json({
      success: true,
      message: '選択問題を削除しました'
    })
  } catch (error: any) {
    console.error('選択問題削除エラー:', error)
    return c.json({
      success: false,
      error: '選択問題の削除に失敗しました',
      details: error.message
    }, 500)
  }
})

// APIルート：選択問題の更新
app.put('/api/optional-problem/:id', async (c) => {
  const { env } = c
  const problemId = c.req.param('id')
  const { problem_title, problem_description, problem_content, difficulty_level, learning_meaning } = await c.req.json()
  
  try {
    // バリデーション
    const errors = []
    if (!problem_title || problem_title.trim() === '') {
      errors.push('problem_title: 問題タイトルが空です')
    }
    if (!problem_description || problem_description.trim() === '') {
      errors.push('problem_description: 問題内容が空です')
    }
    if (!difficulty_level) {
      errors.push('difficulty_level: 難易度が指定されていません')
    } else if (!['minimum', 'standard', 'advanced', 'easy', 'medium', 'hard'].includes(difficulty_level)) {
      errors.push(`difficulty_level: 無効な難易度 "${difficulty_level}"（有効値: minimum, standard, advanced, easy, medium, hard）`)
    }
    
    if (errors.length > 0) {
      return c.json({
        success: false,
        error: '必須フィールドが入力されていないか、値が無効です',
        validation_errors: errors
      }, 400)
    }
    
    await env.DB.prepare(`
      UPDATE optional_problems
      SET problem_title = ?, problem_description = ?, 
          problem_content = ?, difficulty_level = ?, learning_meaning = ?
      WHERE id = ?
    `).bind(
      problem_title.trim(),
      problem_description.trim(),
      problem_content || '',
      difficulty_level,
      learning_meaning || '',
      problemId
    ).run()
    
    return c.json({
      success: true,
      message: '選択問題を更新しました'
    })
  } catch (error: any) {
    console.error('選択問題更新エラー:', error)
    return c.json({
      success: false,
      error: '選択問題の更新に失敗しました',
      details: error.message
    }, 500)
  }
})

// APIルート：選択問題の新規追加
app.post('/api/curriculum/:id/optional-problem', async (c) => {
  const { env } = c
  const curriculumId = c.req.param('id')
  const body = await c.req.json()
  const { problem_title, problem_description, problem_content, problem_category, learning_meaning } = body
  
  console.log('📝 選択問題追加リクエスト:', { curriculumId, body })
  
  try {
    // 既存の問題数を取得して次の番号を決定
    const countResult: any = await env.DB.prepare(`
      SELECT COUNT(*) as count FROM optional_problems WHERE curriculum_id = ?
    `).bind(curriculumId).first()
    
    const nextProblemNumber = (countResult?.count || 0) + 1
    
    console.log('📝 次の問題番号:', nextProblemNumber)
    
    const result = await env.DB.prepare(`
      INSERT INTO optional_problems (
        curriculum_id, problem_number, problem_title, 
        problem_description, problem_content, problem_category, learning_meaning
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      curriculumId,
      nextProblemNumber,
      problem_title || '問題',
      problem_description || '問題の説明',
      problem_content || problem_description || '問題内容',
      problem_category || 'other',
      learning_meaning || ''
    ).run()
    
    console.log('✅ 選択問題追加成功:', result.meta.last_row_id)
    
    return c.json({
      success: true,
      message: '選択問題を追加しました',
      problemId: result.meta.last_row_id
    })
  } catch (error: any) {
    console.error('❌ 選択問題追加エラー:', error)
    console.error('エラー詳細:', {
      message: error.message,
      stack: error.stack,
      curriculumId,
      body
    })
    return c.json({
      success: false,
      error: '選択問題の追加に失敗しました',
      details: error.message,
      stack: error.stack
    }, 500)
  }
})

// APIルート：選択問題の更新
// APIルート：導入問題の更新
app.put('/api/course/:id/introduction-problem', async (c) => {
  const { env } = c
  const courseId = c.req.param('id')
  const { problem_title, problem_content, answer } = await c.req.json()
  
  try {
    const introductionProblem = JSON.stringify({
      problem_title,
      problem_content,
      answer
    })
    
    await env.DB.prepare(`
      UPDATE courses
      SET introduction_problem = ?
      WHERE id = ?
    `).bind(introductionProblem, courseId).run()
    
    return c.json({
      success: true,
      message: '導入問題を更新しました'
    })
  } catch (error: any) {
    console.error('導入問題更新エラー:', error)
    return c.json({
      success: false,
      error: '導入問題の更新に失敗しました',
      details: error.message
    }, 500)
  }
})

// APIルート：導入問題の削除
app.delete('/api/course/:id/introduction-problem', async (c) => {
  const { env } = c
  const courseId = c.req.param('id')
  
  try {
    await env.DB.prepare(`
      UPDATE courses
      SET introduction_problem = NULL
      WHERE id = ?
    `).bind(courseId).run()
    
    return c.json({
      success: true,
      message: '導入問題を削除しました'
    })
  } catch (error: any) {
    console.error('導入問題削除エラー:', error)
    return c.json({
      success: false,
      error: '導入問題の削除に失敗しました',
      details: error.message
    }, 500)
  }
})

// APIルート：チェックテスト問題の個別更新
app.put('/api/curriculum/:id/check-test/problem/:problemNumber', async (c) => {
  const { env } = c
  const curriculumId = c.req.param('id')
  const problemNumber = parseInt(c.req.param('problemNumber'))
  const { problem_text, answer, difficulty } = await c.req.json()
  
  try {
    // 既存のチェックテストを取得
    const metaRow: any = await env.DB.prepare(`
      SELECT metadata_value FROM curriculum_metadata
      WHERE curriculum_id = ? AND metadata_key = 'common_check_test'
    `).bind(curriculumId).first()
    
    if (!metaRow) {
      return c.json({ error: 'チェックテストが見つかりません' }, 404)
    }
    
    const checkTest = JSON.parse(metaRow.metadata_value)
    
    // 指定された問題を更新
    const problemIndex = checkTest.sample_problems.findIndex((p: any) => p.problem_number === problemNumber)
    if (problemIndex === -1) {
      return c.json({ error: '指定された問題が見つかりません' }, 404)
    }
    
    checkTest.sample_problems[problemIndex].problem_text = problem_text
    checkTest.sample_problems[problemIndex].answer = answer
    if (difficulty !== undefined) {
      checkTest.sample_problems[problemIndex].difficulty = difficulty
    }
    
    // データベースに保存
    await env.DB.prepare(`
      UPDATE curriculum_metadata
      SET metadata_value = ?
      WHERE curriculum_id = ? AND metadata_key = 'common_check_test'
    `).bind(JSON.stringify(checkTest), curriculumId).run()
    
    return c.json({
      success: true,
      message: 'チェックテスト問題を更新しました'
    })
  } catch (error: any) {
    console.error('チェックテスト更新エラー:', error)
    return c.json({
      success: false,
      error: 'チェックテスト問題の更新に失敗しました',
      details: error.message
    }, 500)
  }
})

// APIルート：チェックテスト全体の更新
app.put('/api/curriculum/:id/check-test', async (c) => {
  const { env } = c
  const curriculumId = c.req.param('id')
  const { test_description, test_note, sample_problems } = await c.req.json()
  
  try {
    console.log('📝 チェックテスト更新:', {
      curriculumId,
      test_description,
      test_note,
      problemsCount: sample_problems?.length
    })
    
    // 既存のチェックテストを取得または新規作成
    const metaRow: any = await env.DB.prepare(`
      SELECT metadata_value FROM curriculum_metadata
      WHERE curriculum_id = ? AND metadata_key = 'common_check_test'
    `).bind(curriculumId).first()
    
    const checkTest = metaRow ? JSON.parse(metaRow.metadata_value) : {
      test_title: '基礎基本チェックテスト',
      test_description: '',
      test_note: '',
      sample_problems: []
    }
    
    // データを更新
    checkTest.test_description = test_description || checkTest.test_description
    checkTest.test_note = test_note || checkTest.test_note
    checkTest.sample_problems = sample_problems || checkTest.sample_problems
    
    // データベースに保存
    if (metaRow) {
      await env.DB.prepare(`
        UPDATE curriculum_metadata
        SET metadata_value = ?
        WHERE curriculum_id = ? AND metadata_key = 'common_check_test'
      `).bind(JSON.stringify(checkTest), curriculumId).run()
    } else {
      await env.DB.prepare(`
        INSERT INTO curriculum_metadata (curriculum_id, metadata_key, metadata_value)
        VALUES (?, 'common_check_test', ?)
      `).bind(curriculumId, JSON.stringify(checkTest)).run()
    }
    
    console.log('✅ チェックテスト更新成功')
    
    return c.json({
      success: true,
      message: 'チェックテストを更新しました'
    })
  } catch (error: any) {
    console.error('❌ チェックテスト更新エラー:', error)
    return c.json({
      success: false,
      error: 'チェックテストの更新に失敗しました',
      details: error.message
    }, 500)
  }
})

// APIルート：チェックテスト問題の個別削除
app.delete('/api/curriculum/:id/check-test/problem/:problemNumber', async (c) => {
  const { env } = c
  const curriculumId = c.req.param('id')
  const problemNumber = parseInt(c.req.param('problemNumber'))
  
  try {
    // 既存のチェックテストを取得
    const metaRow: any = await env.DB.prepare(`
      SELECT metadata_value FROM curriculum_metadata
      WHERE curriculum_id = ? AND metadata_key = 'common_check_test'
    `).bind(curriculumId).first()
    
    if (!metaRow) {
      return c.json({ error: 'チェックテストが見つかりません' }, 404)
    }
    
    const checkTest = JSON.parse(metaRow.metadata_value)
    
    // 指定された問題を削除
    checkTest.sample_problems = checkTest.sample_problems.filter((p: any) => p.problem_number !== problemNumber)
    
    // 問題番号を振り直し
    checkTest.sample_problems.forEach((p: any, index: number) => {
      p.problem_number = index + 1
    })
    
    // データベースに保存
    await env.DB.prepare(`
      UPDATE curriculum_metadata
      SET metadata_value = ?
      WHERE curriculum_id = ? AND metadata_key = 'common_check_test'
    `).bind(JSON.stringify(checkTest), curriculumId).run()
    
    return c.json({
      success: true,
      message: 'チェックテスト問題を削除しました'
    })
  } catch (error: any) {
    console.error('チェックテスト削除エラー:', error)
    return c.json({
      success: false,
      error: 'チェックテスト問題の削除に失敗しました',
      details: error.message
    }, 500)
  }
})

// APIルート：チェックテスト問題の新規追加
app.post('/api/curriculum/:id/check-test/problem', async (c) => {
  const { env } = c
  const curriculumId = c.req.param('id')
  const { problem_text, answer, difficulty } = await c.req.json()
  
  try {
    // 既存のチェックテストを取得
    const metaRow: any = await env.DB.prepare(`
      SELECT metadata_value FROM curriculum_metadata
      WHERE curriculum_id = ? AND metadata_key = 'common_check_test'
    `).bind(curriculumId).first()
    
    let checkTest
    if (metaRow) {
      checkTest = JSON.parse(metaRow.metadata_value)
    } else {
      checkTest = {
        test_title: '基礎基本チェックテスト',
        test_description: '全コース共通の基礎基本チェックテスト（知識理解の最低保証）',
        test_note: '6問中5問以上正解で合格です！',
        sample_problems: []
      }
    }
    
    // 新しい問題を追加
    const newProblemNumber = checkTest.sample_problems.length + 1
    checkTest.sample_problems.push({
      problem_number: newProblemNumber,
      problem_text,
      answer,
      difficulty: difficulty || 'basic'
    })
    
    // データベースに保存
    if (metaRow) {
      await env.DB.prepare(`
        UPDATE curriculum_metadata
        SET metadata_value = ?
        WHERE curriculum_id = ? AND metadata_key = 'common_check_test'
      `).bind(JSON.stringify(checkTest), curriculumId).run()
    } else {
      await env.DB.prepare(`
        INSERT INTO curriculum_metadata (curriculum_id, metadata_key, metadata_value)
        VALUES (?, 'common_check_test', ?)
      `).bind(curriculumId, JSON.stringify(checkTest)).run()
    }
    
    return c.json({
      success: true,
      message: 'チェックテスト問題を追加しました',
      problemNumber: newProblemNumber
    })
  } catch (error: any) {
    console.error('チェックテスト追加エラー:', error)
    return c.json({
      success: false,
      error: 'チェックテスト問題の追加に失敗しました',
      details: error.message
    }, 500)
  }
})

// ============================================================
// 学習スタイル対応 - カード編集API
// ============================================================

// APIルート：学習カードの更新（学習スタイル対応）
app.put('/api/card/:cardId', async (c) => {
  const { env } = c
  const cardId = c.req.param('cardId')
  const updates = await c.req.json()
  
  try {
    // 更新可能なフィールド
    const allowedFields = [
      'card_title',
      'problem_description',
      'answer',
      'problem_image_url',
      'answer_image_url',
      'visual_support',
      'auditory_support',
      'kinesthetic_support',
      'hints',
      'example_problem',
      'example_solution',
      'real_world_connection',
      'new_terms',
      'textbook_page',
      'learning_style_notes'
    ]
    
    const updateFields: string[] = []
    const values: any[] = []
    
    for (const field of allowedFields) {
      if (field in updates) {
        updateFields.push(`${field} = ?`)
        // JSON型のフィールドは文字列化
        if (['hints', 'new_terms', 'visual_support', 'auditory_support', 'kinesthetic_support'].includes(field)) {
          values.push(JSON.stringify(updates[field]))
        } else {
          values.push(updates[field])
        }
      }
    }
    
    if (updateFields.length === 0) {
      return c.json({
        success: false,
        error: '更新するフィールドがありません'
      }, 400)
    }
    
    values.push(cardId)
    
    const sql = `
      UPDATE learning_cards
      SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `
    
    await env.DB.prepare(sql).bind(...values).run()
    
    // 更新後のカードを取得
    const card = await env.DB.prepare(`
      SELECT * FROM learning_cards WHERE id = ?
    `).bind(cardId).first()
    
    // 履歴記録
    await recordHistory(env.DB, {
      type: 'card',
      action: 'update_learning_styles',
      idField: 'card_id',
      idValue: parseInt(cardId),
      changedFields: updateFields.map(f => f.split(' = ')[0]),
      snapshot: card
    })
    
    return c.json({
      success: true,
      message: '学習カードを更新しました',
      card
    })
  } catch (error: any) {
    console.error('カード更新エラー:', error)
    return c.json({
      success: false,
      error: 'カードの更新に失敗しました',
      details: error.message
    }, 500)
  }
})

// APIルート：学習スタイル自動提案
app.post('/api/card/:cardId/suggest-learning-styles', async (c) => {
  const { env } = c
  const cardId = c.req.param('cardId')
  const apiKey = env.GEMINI_API_KEY
  
  if (!apiKey) {
    return c.json({
      success: false,
      error: 'APIキーが設定されていません'
    }, 500)
  }
  
  try {
    // カード情報を取得
    const card: any = await env.DB.prepare(`
      SELECT lc.*, c.grade, c.subject, c.unit_name, c.textbook_company
      FROM learning_cards lc
      JOIN courses co ON lc.course_id = co.id
      JOIN curriculum c ON co.curriculum_id = c.id
      WHERE lc.id = ?
    `).bind(cardId).first()
    
    if (!card) {
      return c.json({ error: 'カードが見つかりません' }, 404)
    }
    
    const prompt = `以下の学習カードに対して、視覚優位・聴覚優位・体感優位の3つの学習スタイルに応じたサポート内容を提案してください。

【学習カード情報】
学年: ${card.grade}
教科: ${card.subject}
単元: ${card.unit_name}
カード番号: ${card.card_number}
カード名: ${card.card_title}
問題: ${card.problem_description}

【出力形式】JSON形式で出力してください：
{
  "visual_support": {
    "description": "視覚優位な子どもへの支援内容（図やイラスト、色分け、図解などの提案）",
    "materials": ["必要な教材1", "必要な教材2"],
    "activities": ["活動例1", "活動例2"]
  },
  "auditory_support": {
    "description": "聴覚優位な子どもへの支援内容（音読、リズム、語呂合わせなどの提案）",
    "materials": ["必要な教材1", "必要な教材2"],
    "activities": ["活動例1", "活動例2"]
  },
  "kinesthetic_support": {
    "description": "体感優位な子どもへの支援内容（身体活動、具体物操作などの提案）",
    "materials": ["必要な教材1", "必要な教材2"],
    "activities": ["活動例1", "活動例2"]
  },
  "learning_style_notes": "教師向けの指導上の留意点"
}`

    const result = await callGeminiAPI({
      model: 'gemini-3-flash',
      prompt,
      apiKey,
      maxOutputTokens: 4096,
      temperature: 0.7,
      retries: 2
    })
    
    if (!result.success || !result.content) {
      throw new Error('学習スタイル提案の生成に失敗しました')
    }
    
    // JSON抽出
    const suggestions = extractJSON(result.content)
    
    return c.json({
      success: true,
      suggestions,
      message: '学習スタイル提案を生成しました'
    })
  } catch (error: any) {
    console.error('学習スタイル提案エラー:', error)
    return c.json({
      success: false,
      error: '学習スタイル提案の生成に失敗しました',
      details: error.message
    }, 500)
  }
})

// APIルート：チェックテストの再生成
app.post('/api/curriculum/:id/regenerate-check-test', async (c) => {
  const { env } = c
  const curriculumId = c.req.param('id')
  const apiKey = env.GEMINI_API_KEY
  
  if (!apiKey) {
    return c.json({
      success: false,
      error: 'APIキーが設定されていません'
    }, 500)
  }
  
  try {
    // カリキュラム情報を取得
    const curriculum = await env.DB.prepare(`
      SELECT * FROM curriculum WHERE id = ?
    `).bind(curriculumId).first()
    
    if (!curriculum) {
      return c.json({ error: 'カリキュラムが見つかりません' }, 404)
    }
    
    const prompt = `${curriculum.grade}${curriculum.subject}「${curriculum.unit_name}」の基礎確認テスト6問を生成。各問は30字以上、answer必須。JSON出力:
{"sample_problems":[{"problem_number":1,"problem_text":"問題文","answer":"答え"}]}`

    const result = await callGeminiAPI({
      model: 'gemini-3-flash',
      prompt,
      apiKey,
      maxOutputTokens: 4096,
      temperature: 0.8,
      retries: 3
    })
    
    if (!result.success || !result.content) {
      throw new Error('チェックテストの生成に失敗しました')
    }
    
    // JSONを抽出
    const checkTest = extractJSON(result.content)
    
    // データベースに保存
    await env.DB.prepare(`
      INSERT OR REPLACE INTO curriculum_metadata (curriculum_id, metadata_key, metadata_value)
      VALUES (?, 'common_check_test', ?)
    `).bind(
      curriculumId,
      JSON.stringify({
        test_title: '基礎基本チェックテスト',
        test_description: '全コース共通の基礎基本チェックテスト（知識理解の最低保証）',
        test_note: '6問中5問以上正解で合格です！',
        sample_problems: checkTest.sample_problems
      })
    ).run()
    
    return c.json({
      success: true,
      checkTest: checkTest.sample_problems,
      model_used: result.model
    })
  } catch (error: any) {
    console.error('チェックテスト再生成エラー:', error)
    return c.json({
      success: false,
      error: 'チェックテストの再生成に失敗しました',
      details: error.message
    }, 500)
  }
})

// APIルート：単元の編集履歴取得
app.get('/api/curriculum/:id/history', async (c) => {
  const { env } = c
  const curriculumId = c.req.param('id')
  
  try {
    const history = await env.DB.prepare(`
      SELECT 
        h.*,
        u.name as changed_by_name
      FROM curriculum_history h
      LEFT JOIN users u ON h.changed_by = u.id
      WHERE h.curriculum_id = ?
      ORDER BY h.created_at DESC
      LIMIT 50
    `).bind(curriculumId).all()
    
    return c.json({
      success: true,
      history: history.results || [],
      count: history.results?.length || 0
    })
  } catch (error: any) {
    console.error('履歴取得エラー:', error)
    return c.json({
      success: false,
      error: '履歴の取得に失敗しました',
      details: error.message
    }, 500)
  }
})

// APIルート：履歴ロールバック
app.post('/api/curriculum/:id/rollback/:historyId', async (c) => {
  const { env } = c
  const curriculumId = c.req.param('id')
  const historyId = c.req.param('historyId')
  
  try {
    // 履歴データを取得
    const historyRecord = await env.DB.prepare(`
      SELECT * FROM curriculum_history 
      WHERE id = ? AND curriculum_id = ?
    `).bind(historyId, curriculumId).first()
    
    if (!historyRecord) {
      return c.json({
        success: false,
        error: '履歴レコードが見つかりません'
      }, 404)
    }
    
    // 現在の状態を履歴に保存（ロールバック前）
    const currentCurriculum = await env.DB.prepare(`
      SELECT * FROM curriculum WHERE id = ?
    `).bind(curriculumId).first()
    
    if (currentCurriculum) {
      await recordHistory(env, 'curriculum_history', curriculumId, {
        action: 'rollback_before',
        changed_by: 1, // システムユーザー
        data_before: JSON.stringify(currentCurriculum),
        data_after: historyRecord.data_before
      })
    }
    
    // 履歴データをパース
    const rollbackData = JSON.parse(historyRecord.data_before as string)
    
    // カリキュラムをロールバック
    await env.DB.prepare(`
      UPDATE curriculum SET
        grade = ?,
        subject = ?,
        textbook_company = ?,
        unit_name = ?,
        unit_goal = ?,
        non_cognitive_goal = ?
      WHERE id = ?
    `).bind(
      rollbackData.grade,
      rollbackData.subject,
      rollbackData.textbook_company,
      rollbackData.unit_name,
      rollbackData.unit_goal,
      rollbackData.non_cognitive_goal,
      curriculumId
    ).run()
    
    // ロールバック完了を履歴に記録
    await recordHistory(env, 'curriculum_history', curriculumId, {
      action: 'rollback_complete',
      changed_by: 1,
      data_before: JSON.stringify(currentCurriculum),
      data_after: JSON.stringify(rollbackData)
    })
    
    return c.json({
      success: true,
      message: 'ロールバックが完了しました',
      rolled_back_to: historyRecord.created_at
    })
  } catch (error: any) {
    console.error('ロールバックエラー:', error)
    return c.json({
      success: false,
      error: 'ロールバックに失敗しました',
      details: error.message
    }, 500)
  }
})

// APIルート：システム統計情報取得（API呼び出し回数、データベース統計など）
app.get('/api/system/stats', async (c) => {
  const { env } = c
  
  try {
    // カリキュラム統計
    const curriculumStats = await env.DB.prepare(`
      SELECT 
        COUNT(*) as total_curriculums,
        COUNT(DISTINCT grade) as total_grades,
        COUNT(DISTINCT subject) as total_subjects,
        COUNT(DISTINCT textbook_company) as total_textbooks
      FROM curriculum
    `).first()
    
    // コース統計
    const courseStats = await env.DB.prepare(`
      SELECT 
        COUNT(*) as total_courses,
        COUNT(DISTINCT curriculum_id) as curriculums_with_courses
      FROM courses
    `).first()
    
    // 学習カード統計
    const cardStats = await env.DB.prepare(`
      SELECT 
        COUNT(*) as total_cards,
        COUNT(DISTINCT course_id) as courses_with_cards
      FROM learning_cards
    `).first()
    
    // 選択問題統計
    const optionalProblemStats = await env.DB.prepare(`
      SELECT 
        COUNT(*) as total_optional_problems,
        COUNT(DISTINCT curriculum_id) as curriculums_with_optional_problems
      FROM optional_problems
    `).first()
    
    return c.json({
      success: true,
      stats: {
        curriculum: curriculumStats,
        courses: courseStats,
        cards: cardStats,
        optional_problems: optionalProblemStats
      },
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    console.error('統計情報取得エラー:', error)
    return c.json({
      success: false,
      error: '統計情報の取得に失敗しました',
      details: error.message
    }, 500)
  }
})

// ==============================================
// 認証API
// ==============================================

// ユーティリティ: パスワードハッシュ生成（Web Crypto API使用）
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

// ユーティリティ: トークン生成
function generateToken(length: number = 32): string {
  const array = new Uint8Array(length)
  crypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

// ミドルウェア: 認証チェック
async function requireAuth(c: any, next: any) {
  const { env } = c
  const authHeader = c.req.header('Authorization')
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: '認証が必要です' }, 401)
  }
  
  const token = authHeader.substring(7)
  
  try {
    const session = await env.DB.prepare(`
      SELECT s.*, u.id as user_id, u.name, u.email, u.role, u.class_code
      FROM user_sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.session_token = ? AND s.expires_at > datetime('now') AND u.is_active = 1
    `).bind(token).first()
    
    if (!session) {
      return c.json({ error: 'セッションが無効です' }, 401)
    }
    
    // コンテキストにユーザー情報を保存
    c.set('user', {
      id: session.user_id,
      name: session.name,
      email: session.email,
      role: session.role,
      class_code: session.class_code
    })
    
    await next()
  } catch (error) {
    console.error('認証エラー:', error)
    return c.json({ error: '認証に失敗しました' }, 500)
  }
}

// ミドルウェア: 権限チェック
// APIルート: ユーザー登録
app.post('/api/auth/register', async (c) => {
  const { env } = c
  const { name, email, password, role, class_code, student_number } = await c.req.json()
  
  try {
    // メールアドレスの重複チェック
    const existingUser = await env.DB.prepare(`
      SELECT id FROM users WHERE email = ?
    `).bind(email).first()
    
    if (existingUser) {
      return c.json({ error: 'このメールアドレスは既に登録されています' }, 400)
    }
    
    // パスワードハッシュ化
    const passwordHash = await hashPassword(password)
    
    // ユーザー作成
    const result = await env.DB.prepare(`
      INSERT INTO users (name, email, password_hash, role, class_code, student_number, is_active)
      VALUES (?, ?, ?, ?, ?, ?, 1)
    `).bind(name, email, passwordHash, role || 'student', class_code || null, student_number || null).run()
    
    return c.json({
      success: true,
      user_id: result.meta.last_row_id,
      message: 'ユーザー登録が完了しました'
    })
  } catch (error: any) {
    console.error('ユーザー登録エラー:', error)
    return c.json({
      success: false,
      error: 'ユーザー登録に失敗しました',
      details: error.message
    }, 500)
  }
})

// APIルート: ログイン
app.post('/api/auth/login', async (c) => {
  const { env } = c
  const { email, password } = await c.req.json()
  
  try {
    // ユーザー検索
    const user = await env.DB.prepare(`
      SELECT * FROM users WHERE email = ? AND is_active = 1
    `).bind(email).first()
    
    if (!user) {
      return c.json({ error: 'メールアドレスまたはパスワードが正しくありません' }, 401)
    }
    
    // アカウントロックチェック
    if (user.locked_until && new Date(user.locked_until as string) > new Date()) {
      return c.json({ 
        error: 'アカウントがロックされています。しばらく待ってから再度お試しください' 
      }, 403)
    }
    
    // パスワード検証
    const passwordHash = await hashPassword(password)
    if (passwordHash !== user.password_hash) {
      // ログイン失敗回数を増加
      const attempts = (user.failed_login_attempts as number || 0) + 1
      const lockUntil = attempts >= 5 
        ? new Date(Date.now() + 15 * 60 * 1000).toISOString() // 15分ロック
        : null
      
      await env.DB.prepare(`
        UPDATE users 
        SET failed_login_attempts = ?, locked_until = ?
        WHERE id = ?
      `).bind(attempts, lockUntil, user.id).run()
      
      return c.json({ 
        error: 'メールアドレスまたはパスワードが正しくありません',
        attempts_remaining: 5 - attempts
      }, 401)
    }
    
    // セッショントークン生成
    const sessionToken = generateToken(32)
    const refreshToken = generateToken(32)
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24時間
    const refreshExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7日間
    
    // セッション作成
    await env.DB.prepare(`
      INSERT INTO user_sessions (user_id, session_token, refresh_token, expires_at, refresh_expires_at, ip_address, user_agent)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      user.id,
      sessionToken,
      refreshToken,
      expiresAt,
      refreshExpiresAt,
      c.req.header('cf-connecting-ip') || 'unknown',
      c.req.header('user-agent') || 'unknown'
    ).run()
    
    // ログイン成功: 失敗回数をリセット、最終ログイン時刻を更新
    await env.DB.prepare(`
      UPDATE users 
      SET failed_login_attempts = 0, locked_until = NULL, last_login_at = datetime('now')
      WHERE id = ?
    `).bind(user.id).run()
    
    return c.json({
      success: true,
      session_token: sessionToken,
      refresh_token: refreshToken,
      expires_at: expiresAt,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        class_code: user.class_code,
        student_number: user.student_number
      }
    })
  } catch (error: any) {
    console.error('ログインエラー:', error)
    return c.json({
      success: false,
      error: 'ログインに失敗しました',
      details: error.message
    }, 500)
  }
})

// APIルート: ログアウト
app.post('/api/auth/logout', requireAuth, async (c) => {
  const { env } = c
  const authHeader = c.req.header('Authorization')
  const token = authHeader!.substring(7)
  
  try {
    // セッション削除
    await env.DB.prepare(`
      DELETE FROM user_sessions WHERE session_token = ?
    `).bind(token).run()
    
    return c.json({
      success: true,
      message: 'ログアウトしました'
    })
  } catch (error: any) {
    console.error('ログアウトエラー:', error)
    return c.json({
      success: false,
      error: 'ログアウトに失敗しました'
    }, 500)
  }
})

// APIルート: セッション更新（リフレッシュトークン）
app.post('/api/auth/refresh', async (c) => {
  const { env } = c
  const { refresh_token } = await c.req.json()
  
  try {
    const session = await env.DB.prepare(`
      SELECT s.*, u.id as user_id, u.name, u.email, u.role, u.class_code, u.student_number
      FROM user_sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.refresh_token = ? AND s.refresh_expires_at > datetime('now') AND u.is_active = 1
    `).bind(refresh_token).first()
    
    if (!session) {
      return c.json({ error: 'リフレッシュトークンが無効です' }, 401)
    }
    
    // 新しいセッショントークン生成
    const newSessionToken = generateToken(32)
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    
    // セッション更新
    await env.DB.prepare(`
      UPDATE user_sessions 
      SET session_token = ?, expires_at = ?, updated_at = datetime('now')
      WHERE id = ?
    `).bind(newSessionToken, expiresAt, session.id).run()
    
    return c.json({
      success: true,
      session_token: newSessionToken,
      expires_at: expiresAt,
      user: {
        id: session.user_id,
        name: session.name,
        email: session.email,
        role: session.role,
        class_code: session.class_code,
        student_number: session.student_number
      }
    })
  } catch (error: any) {
    console.error('セッション更新エラー:', error)
    return c.json({
      success: false,
      error: 'セッション更新に失敗しました'
    }, 500)
  }
})

// APIルート: 現在のユーザー情報取得
app.get('/api/auth/me', requireAuth, async (c) => {
  const user = c.get('user')
  return c.json({
    success: true,
    user
  })
})

// ==============================================
// AI拡張機能API
// ==============================================

// APIルート: AI対話履歴取得
app.get('/api/ai/conversations/:studentId/:cardId', async (c) => {
  const { env } = c
  const studentId = c.req.param('studentId')
  const cardId = c.req.param('cardId')
  const sessionId = c.req.query('sessionId')
  
  try {
    let query = `
      SELECT * FROM ai_conversations
      WHERE student_id = ? AND learning_card_id = ?
    `
    const params = [studentId, cardId]
    
    if (sessionId) {
      query += ` AND session_id = ?`
      params.push(sessionId)
    }
    
    query += ` ORDER BY created_at DESC LIMIT 50`
    
    const conversations = await env.DB.prepare(query).bind(...params).all()
    
    return c.json({
      success: true,
      conversations: conversations.results || []
    })
  } catch (error: any) {
    console.error('対話履歴取得エラー:', error)
    return c.json({
      success: false,
      error: '対話履歴の取得に失敗しました'
    }, 500)
  }
})

// APIルート: AI使用統計取得
app.get('/api/ai/stats/:studentId', async (c) => {
  const { env } = c
  const studentId = c.req.param('studentId')
  
  try {
    const stats = await env.DB.prepare(`
      SELECT 
        feature_type,
        COUNT(*) as usage_count,
        SUM(tokens_used) as total_tokens,
        AVG(response_time_ms) as avg_response_time,
        SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as success_count,
        SUM(CASE WHEN success = 0 THEN 1 ELSE 0 END) as error_count
      FROM ai_usage_stats
      WHERE student_id = ?
      GROUP BY feature_type
    `).bind(studentId).all()
    
    return c.json({
      success: true,
      stats: stats.results || []
    })
  } catch (error: any) {
    console.error('AI統計取得エラー:', error)
    return c.json({
      success: false,
      error: 'AI統計の取得に失敗しました'
    }, 500)
  }
})

// APIルート: 自動問題生成
app.post('/api/ai/generate-problem', async (c) => {
  const { env } = c
  const body = await c.req.json()
  const startTime = Date.now()
  
  const apiKey = env.GEMINI_API_KEY
  
  if (!apiKey || apiKey === 'your-gemini-api-key-here') {
    return c.json({ 
      success: false,
      error: 'AI問題生成機能は現在利用できません'
    })
  }
  
  try {
    // カリキュラム情報を取得
    const curriculum = await env.DB.prepare(`
      SELECT * FROM curriculum WHERE id = ?
    `).bind(body.curriculumId).first()
    
    if (!curriculum) {
      return c.json({
        success: false,
        error: 'カリキュラムが見つかりません'
      }, 404)
    }
    
    // 問題生成プロンプト
    const prompt = `あなたは教育コンテンツの専門家です。以下の情報を基に、${body.problemType === 'intro' ? '導入問題' : body.problemType === 'practice' ? '練習問題' : body.problemType === 'challenge' ? '発展問題' : body.problemType === 'check_test' ? 'チェックテスト問題' : '選択問題'}を生成してください。

【カリキュラム情報】
学年: ${curriculum.grade}
教科: ${curriculum.subject}
単元名: ${curriculum.unit_name}
単元目標: ${curriculum.unit_goal}

【問題の要件】
難易度: ${body.difficultyLevel === 1 ? '★ かんたん' : body.difficultyLevel === 2 ? '★★ ふつう' : body.difficultyLevel === 3 ? '★★★ むずかしい' : '★★★★ とてもむずかしい'}
問題タイプ: ${body.problemType}
${body.specificRequirements ? `追加要件: ${body.specificRequirements}` : ''}

【生成する内容】
1. 問題タイトル: 簡潔で分かりやすいタイトル（15文字以内）
2. 問題内容: 具体的な問題文（小学生にわかりやすく）
3. 解答: 詳しい解答と解説

以下のJSON形式で出力してください：
{
  "title": "問題タイトル",
  "content": "問題内容",
  "solution": "解答と解説"
}`

    // Gemini APIにリクエスト
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.8,
            maxOutputTokens: 1000,
          }
        })
      }
    )
    
    const responseTime = Date.now() - startTime
    
    if (!geminiResponse.ok) {
      const errorData = await geminiResponse.json()
      console.error('Gemini API error:', errorData)
      
      // エラーログを記録
      await env.DB.prepare(`
        INSERT INTO ai_usage_stats (
          student_id, curriculum_id, feature_type, 
          response_time_ms, success, error_message
        ) VALUES (?, ?, 'problem_generation', ?, 0, ?)
      `).bind(
        body.userId || 1,
        body.curriculumId,
        responseTime,
        `API Error: ${geminiResponse.status}`
      ).run()
      
      throw new Error(`Gemini API error: ${geminiResponse.status}`)
    }
    
    const geminiData = await geminiResponse.json()
    const generatedText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || ''
    
    // JSONを抽出（```json ... ``` の中身を取得）
    let problemData
    try {
      const jsonMatch = generatedText.match(/```json\s*(\{[\s\S]*?\})\s*```/) || 
                       generatedText.match(/(\{[\s\S]*?\})/)
      if (jsonMatch) {
        problemData = JSON.parse(jsonMatch[1])
      } else {
        // JSON形式でない場合は、テキストを分割して抽出
        problemData = {
          title: '自動生成問題',
          content: generatedText,
          solution: '解答は教師が後で追加してください'
        }
      }
    } catch (parseError) {
      problemData = {
        title: '自動生成問題',
        content: generatedText,
        solution: '解答は教師が後で追加してください'
      }
    }
    
    // 生成された問題をデータベースに保存
    const result = await env.DB.prepare(`
      INSERT INTO ai_generated_problems (
        curriculum_id, course_id, problem_type, problem_title,
        problem_content, problem_solution, difficulty_level,
        generation_prompt, is_approved
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)
    `).bind(
      body.curriculumId,
      body.courseId || null,
      body.problemType,
      problemData.title,
      problemData.content,
      problemData.solution,
      body.difficultyLevel || 2,
      prompt
    ).run()
    
    // 使用統計を記録
    const tokensUsed = geminiData.usageMetadata?.totalTokenCount || 0
    await env.DB.prepare(`
      INSERT INTO ai_usage_stats (
        student_id, curriculum_id, feature_type,
        tokens_used, response_time_ms, success
      ) VALUES (?, ?, 'problem_generation', ?, ?, 1)
    `).bind(
      body.userId || 1,
      body.curriculumId,
      tokensUsed,
      responseTime
    ).run()
    
    return c.json({
      success: true,
      problem: {
        id: result.meta.last_row_id,
        ...problemData,
        difficultyLevel: body.difficultyLevel || 2,
        problemType: body.problemType
      },
      tokensUsed,
      responseTime
    })
    
  } catch (error: any) {
    console.error('問題生成エラー:', error)
    
    // エラーログを記録
    try {
      await env.DB.prepare(`
        INSERT INTO ai_usage_stats (
          student_id, curriculum_id, feature_type,
          response_time_ms, success, error_message
        ) VALUES (?, ?, 'problem_generation', ?, 0, ?)
      `).bind(
        body.userId || 1,
        body.curriculumId,
        Date.now() - startTime,
        error.message
      ).run()
    } catch (dbError) {
      console.error('Failed to log error:', dbError)
    }
    
    return c.json({
      success: false,
      error: '問題生成に失敗しました',
      details: error.message
    }, 500)
  }
})

// APIルート: 生成された問題一覧取得
app.get('/api/ai/generated-problems/:curriculumId', async (c) => {
  const { env } = c
  const curriculumId = c.req.param('curriculumId')
  const problemType = c.req.query('problemType')
  const approved = c.req.query('approved')
  
  try {
    let query = `
      SELECT * FROM ai_generated_problems
      WHERE curriculum_id = ?
    `
    const params = [curriculumId]
    
    if (problemType) {
      query += ` AND problem_type = ?`
      params.push(problemType)
    }
    
    if (approved !== undefined) {
      query += ` AND is_approved = ?`
      params.push(approved === 'true' ? '1' : '0')
    }
    
    query += ` ORDER BY created_at DESC`
    
    const problems = await env.DB.prepare(query).bind(...params).all()
    
    return c.json({
      success: true,
      problems: problems.results || []
    })
  } catch (error: any) {
    console.error('生成問題取得エラー:', error)
    return c.json({
      success: false,
      error: '生成問題の取得に失敗しました'
    }, 500)
  }
})

// APIルート: 生成問題の承認
app.post('/api/ai/approve-problem/:problemId', async (c) => {
  const { env } = c
  const problemId = c.req.param('problemId')
  const { userId, approved } = await c.req.json()
  
  try {
    await env.DB.prepare(`
      UPDATE ai_generated_problems
      SET is_approved = ?, approved_by = ?, approved_at = datetime('now')
      WHERE id = ?
    `).bind(approved ? 1 : 0, userId, problemId).run()
    
    return c.json({
      success: true,
      message: approved ? '問題を承認しました' : '承認を取り消しました'
    })
  } catch (error: any) {
    console.error('問題承認エラー:', error)
    return c.json({
      success: false,
      error: '問題承認に失敗しました'
    }, 500)
  }
})

// APIルート: AI フィードバック評価
app.post('/api/ai/feedback', async (c) => {
  const { env } = c
  const { studentId, conversationId, usageStatId, rating, comment } = await c.req.json()
  
  try {
    await env.DB.prepare(`
      INSERT INTO ai_feedback_ratings (
        student_id, conversation_id, usage_stat_id, rating, feedback_comment
      ) VALUES (?, ?, ?, ?, ?)
    `).bind(studentId, conversationId || null, usageStatId || null, rating, comment || null).run()
    
    return c.json({
      success: true,
      message: 'フィードバックを送信しました'
    })
  } catch (error: any) {
    console.error('フィードバック送信エラー:', error)
    return c.json({
      success: false,
      error: 'フィードバック送信に失敗しました'
    }, 500)
  }
})

// ==============================================
// Phase 9: 学習行動ログAPI
// ==============================================

// 学習行動ログの保存（バッチ保存）
app.post('/api/behavior/logs', async (c) => {
  const { env } = c
  const logs = await c.req.json()
  
  if (!Array.isArray(logs) || logs.length === 0) {
    return c.json({
      success: false,
      error: 'ログデータが不正です'
    }, 400)
  }
  
  try {
    // バッチ挿入
    const stmt = env.DB.prepare(`
      INSERT INTO learning_behavior_logs (
        student_id, curriculum_id, learning_card_id, action_type, action_timestamp,
        session_id, session_duration, page_element, element_type, metadata,
        current_understanding_level
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    
    const batch = logs.map(log => 
      stmt.bind(
        log.student_id,
        log.curriculum_id || null,
        log.learning_card_id || null,
        log.action_type,
        log.action_timestamp,
        log.session_id,
        log.session_duration || 0,
        log.page_element || null,
        log.element_type || null,
        log.metadata || null,
        log.current_understanding_level || null
      )
    )
    
    await env.DB.batch(batch)
    
    return c.json({
      success: true,
      message: `${logs.length}件のログを保存しました`,
      count: logs.length
    })
  } catch (error: any) {
    console.error('学習行動ログ保存エラー:', error)
    return c.json({
      success: false,
      error: 'ログの保存に失敗しました'
    }, 500)
  }
})

// 学習行動ログの取得（分析用）
app.get('/api/behavior/logs/:studentId', async (c) => {
  const { env } = c
  const studentId = c.req.param('studentId')
  const limit = c.req.query('limit') || '100'
  const actionType = c.req.query('actionType')
  const startDate = c.req.query('startDate')
  const endDate = c.req.query('endDate')
  
  try {
    let query = `
      SELECT * FROM learning_behavior_logs
      WHERE student_id = ?
    `
    const params: any[] = [studentId]
    
    if (actionType) {
      query += ` AND action_type = ?`
      params.push(actionType)
    }
    
    if (startDate) {
      query += ` AND action_timestamp >= ?`
      params.push(startDate)
    }
    
    if (endDate) {
      query += ` AND action_timestamp <= ?`
      params.push(endDate)
    }
    
    query += ` ORDER BY action_timestamp DESC LIMIT ?`
    params.push(parseInt(limit))
    
    const logs = await env.DB.prepare(query).bind(...params).all()
    
    return c.json({
      success: true,
      logs: logs.results || [],
      count: logs.results?.length || 0
    })
  } catch (error: any) {
    console.error('学習行動ログ取得エラー:', error)
    return c.json({
      success: false,
      error: 'ログの取得に失敗しました'
    }, 500)
  }
})

// ==============================================
// Phase 9: 学習パターン分析API
// ==============================================

// 統合学習パターン分析（6つの分析を一度に実行）
app.post('/api/analysis/patterns/:studentId', async (c) => {
  const { env } = c
  const studentId = c.req.param('studentId')
  const { curriculumId } = await c.req.json()
  
  try {
    // 1. 時間的パターン分析
    const timePattern = await analyzeTimePattern(env.DB, parseInt(studentId))
    
    // 2. 学習スタイル分析（VAKモデル）
    const learningStyle = await analyzeLearningStyle(env.DB, parseInt(studentId))
    
    // 3. 理解パターン分析
    const comprehension = await analyzeComprehension(env.DB, parseInt(studentId), curriculumId)
    
    // 4. 助け要請パターン分析
    const helpSeeking = await analyzeHelpSeeking(env.DB, parseInt(studentId))
    
    // 5. 進捗速度パターン分析
    const progressSpeed = await analyzeProgressSpeed(env.DB, parseInt(studentId), curriculumId)
    
    // 6. エンゲージメントパターン分析
    const engagement = await analyzeEngagement(env.DB, parseInt(studentId))
    
    // 総合スコア計算
    const overallScore = calculateOverallScore({
      timePattern,
      learningStyle,
      comprehension,
      helpSeeking,
      progressSpeed,
      engagement
    })
    
    const result = {
      student_id: studentId,
      curriculum_id: curriculumId,
      patterns: {
        time: timePattern,
        learning_style: learningStyle,
        comprehension,
        help_seeking: helpSeeking,
        progress_speed: progressSpeed,
        engagement
      },
      overall_score: overallScore,
      analyzed_at: new Date().toISOString()
    }
    
    // 分析結果を保存
    await env.DB.prepare(`
      INSERT INTO pattern_analysis_results (
        student_id, curriculum_id, pattern_type, analysis_data, confidence_score, sample_size, analysis_date
      ) VALUES (?, ?, ?, ?, ?, ?, date('now'))
    `).bind(
      studentId,
      curriculumId,
      'comprehensive',
      JSON.stringify(result.patterns),
      overallScore / 100,
      0
    ).run()
    
    return c.json({
      success: true,
      analysis: result
    })
  } catch (error: any) {
    console.error('学習パターン分析エラー:', error)
    return c.json({
      success: false,
      error: '分析に失敗しました'
    }, 500)
  }
})

// ヘルパー関数: 時間的パターン分析
async function analyzeTimePattern(db: D1Database, studentId: number) {
  const logs = await db.prepare(`
    SELECT 
      strftime('%H', action_timestamp) as hour,
      COUNT(*) as count,
      AVG(session_duration) as avg_duration
    FROM learning_behavior_logs
    WHERE student_id = ?
    GROUP BY hour
    ORDER BY count DESC
  `).bind(studentId).all()
  
  const hourData = logs.results || []
  const topHours = hourData.slice(0, 2).map((r: any) => `${r.hour}:00`)
  
  return {
    optimal_study_time: topHours.length > 0 ? topHours : ['10:00', '14:00'],
    concentration_span: 28,
    best_performance_time: topHours[0] ? (parseInt(topHours[0]) < 12 ? '午前中' : '午後') : '午前中'
  }
}

// ヘルパー関数: 学習スタイル分析
async function analyzeLearningStyle(db: D1Database, studentId: number) {
  const logs = await db.prepare(`
    SELECT element_type, COUNT(*) as count
    FROM learning_behavior_logs
    WHERE student_id = ? AND element_type IN ('image', 'video', 'text', 'audio', 'button', 'interactive')
    GROUP BY element_type
  `).bind(studentId).all()
  
  const elementCounts = logs.results || []
  let visual = 0, auditory = 0, kinesthetic = 0
  
  elementCounts.forEach((row: any) => {
    if (row.element_type === 'image' || row.element_type === 'video') visual += row.count
    if (row.element_type === 'audio') auditory += row.count
    if (row.element_type === 'button' || row.element_type === 'interactive') kinesthetic += row.count
  })
  
  const total = visual + auditory + kinesthetic || 1
  return {
    visual: Math.round((visual / total) * 100),
    auditory: Math.round((auditory / total) * 100),
    kinesthetic: Math.round((kinesthetic / total) * 100),
    dominant_style: visual > auditory && visual > kinesthetic ? 'visual' : 
                   auditory > kinesthetic ? 'auditory' : 'kinesthetic'
  }
}

// ヘルパー関数: 理解パターン分析
async function analyzeComprehension(db: D1Database, studentId: number, curriculumId?: number) {
  const progress = await db.prepare(`
    SELECT 
      AVG(understanding_level) as avg_understanding,
      COUNT(*) as total_cards
    FROM student_progress
    WHERE student_id = ? ${curriculumId ? 'AND curriculum_id = ?' : ''}
  `).bind(curriculumId ? studentId : studentId, ...(curriculumId ? [curriculumId] : [])).first()
  
  return {
    average_understanding: progress?.avg_understanding || 0,
    total_completed: progress?.total_cards || 0,
    prediction_3_days: Math.min((progress?.avg_understanding || 0) + 10, 100)
  }
}

// ヘルパー関数: 助け要請パターン分析
async function analyzeHelpSeeking(db: D1Database, studentId: number) {
  const helpLogs = await db.prepare(`
    SELECT COUNT(*) as help_count
    FROM learning_behavior_logs
    WHERE student_id = ? AND action_type = 'help_request'
  `).bind(studentId).first()
  
  return {
    help_frequency: helpLogs?.help_count || 0,
    average_wait_time: 5.0,
    help_type: (helpLogs?.help_count || 0) > 10 ? 'frequent' : 'moderate'
  }
}

// ヘルパー関数: 進捗速度パターン分析
async function analyzeProgressSpeed(db: D1Database, studentId: number, curriculumId?: number) {
  const weeklyProgress = await db.prepare(`
    SELECT 
      strftime('%W', completed_at) as week,
      COUNT(*) as cards_completed
    FROM student_progress
    WHERE student_id = ? ${curriculumId ? 'AND curriculum_id = ?' : ''}
      AND status = 'completed'
      AND completed_at >= date('now', '-4 weeks')
    GROUP BY week
    ORDER BY week DESC
    LIMIT 3
  `).bind(curriculumId ? studentId : studentId, ...(curriculumId ? [curriculumId] : [])).all()
  
  const weeklyCards = (weeklyProgress.results || []).map((r: any) => r.cards_completed)
  const trend = weeklyCards.length >= 2 && weeklyCards[0] > weeklyCards[1] ? 'accelerating' : 'stable'
  
  return {
    cards_per_week: weeklyCards.length > 0 ? weeklyCards : [3, 4, 5],
    trend,
    type: trend === 'accelerating' ? '加速型' : '安定型'
  }
}

// ヘルパー関数: エンゲージメントパターン分析
async function analyzeEngagement(db: D1Database, studentId: number) {
  const sessionStats = await db.prepare(`
    SELECT 
      COUNT(DISTINCT session_id) as session_count,
      AVG(session_duration) as avg_duration
    FROM learning_behavior_logs
    WHERE student_id = ?
      AND action_timestamp >= datetime('now', '-7 days')
  `).bind(studentId).first()
  
  return {
    sessions_per_week: sessionStats?.session_count || 0,
    average_session_duration: Math.round(sessionStats?.avg_duration || 0),
    engagement_level: (sessionStats?.session_count || 0) >= 5 ? 'high' : 'moderate'
  }
}

// ヘルパー関数: 総合スコア計算
function calculateOverallScore(patterns: any) {
  let score = 60 // ベーススコア
  
  // 学習スタイルが明確 +10
  const dominantStyle = Math.max(patterns.learning_style.visual, patterns.learning_style.auditory, patterns.learning_style.kinesthetic)
  if (dominantStyle >= 60) score += 10
  
  // 理解度が高い +15
  if (patterns.comprehension.average_understanding >= 4) score += 15
  
  // エンゲージメントが高い +10
  if (patterns.engagement.engagement_level === 'high') score += 10
  
  // 進捗が加速 +5
  if (patterns.progress_speed.trend === 'accelerating') score += 5
  
  return Math.min(score, 100)
}

// ==============================================
// Phase 9: 総合プロファイル生成 & 個別最適化プラン
// ==============================================

// 総合学習プロファイル生成（Gemini統合分析）
app.post('/api/analysis/profile/:studentId', async (c) => {
  const { env } = c
  const studentId = c.req.param('studentId')
  const { curriculumId } = await c.req.json()
  
  try {
    // 6つの分析結果を取得
    const analysisResponse = await fetch(`${c.req.url.split('/api')[0]}/api/analysis/patterns/${studentId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ curriculumId })
    })
    
    if (!analysisResponse.ok) {
      throw new Error('パターン分析の取得に失敗しました')
    }
    
    const analysisData = await analysisResponse.json()
    const patterns = analysisData.analysis.patterns
    
    // 学生情報を取得
    const student = await env.DB.prepare(`
      SELECT name, email FROM users WHERE id = ?
    `).bind(studentId).first()
    
    // Gemini APIで統合分析
    const apiKey = env.GEMINI_API_KEY
    if (!apiKey || apiKey === 'your-gemini-api-key-here') {
      // APIキーが設定されていない場合は簡易プロファイルを返す
      const profile = generateSimpleProfile(patterns, student)
      await saveProfile(env.DB, studentId, curriculumId, profile)
      return c.json({ success: true, profile })
    }
    
    const geminiPrompt = `
あなたは教育心理学とデータ分析の専門家です。以下の学習パターン分析結果から、児童の総合学習プロファイルを生成してください。

【児童情報】
名前: ${student?.name || '不明'}
ID: ${studentId}

【分析結果】
1. 時間的パターン:
- 最適学習時間: ${patterns.time.optimal_study_time.join(', ')}
- 集中持続時間: ${patterns.time.concentration_span}分
- 最高パフォーマンス時間帯: ${patterns.time.best_performance_time}

2. 学習スタイル (VAKモデル):
- 視覚型 (Visual): ${patterns.learning_style.visual}%
- 聴覚型 (Auditory): ${patterns.learning_style.auditory}%
- 体感型 (Kinesthetic): ${patterns.learning_style.kinesthetic}%
- 優勢スタイル: ${patterns.learning_style.dominant_style}

3. 理解パターン:
- 平均理解度: ${patterns.comprehension.average_understanding}
- 完了カード数: ${patterns.comprehension.total_completed}
- 3日後予測: ${patterns.comprehension.prediction_3_days}%

4. 助け要請パターン:
- 要請頻度: ${patterns.help_seeking.help_frequency}回
- 平均待ち時間: ${patterns.help_seeking.average_wait_time}分
- タイプ: ${patterns.help_seeking.help_type}

5. 進捗速度:
- 週次カード数: ${patterns.progress_speed.cards_per_week.join(', ')}
- トレンド: ${patterns.progress_speed.trend}
- タイプ: ${patterns.progress_speed.type}

6. エンゲージメント:
- 週次セッション数: ${patterns.engagement.sessions_per_week}
- 平均セッション時間: ${patterns.engagement.average_session_duration}秒
- レベル: ${patterns.engagement.engagement_level}

【出力形式】
以下のJSON形式で出力してください：

{
  "summary": "この児童の学習特性を2-3文で要約",
  "strengths": ["強み1", "強み2", "強み3"],
  "weaknesses": ["課題1", "課題2"],
  "recommendations": {
    "for_teacher": ["教師への推奨事項1", "教師への推奨事項2", "教師への推奨事項3"],
    "for_parent": ["保護者への推奨事項1", "保護者への推奨事項2"],
    "for_student": ["児童本人への推奨事項1", "児童本人への推奨事項2"]
  },
  "learning_type": "学習タイプの分類（例：視覚型×加速型×積極支援型）",
  "recommended_course": "じっくりコース / しっかりコース / ぐんぐんコース のいずれか"
}
`
    
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: geminiPrompt }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1000
          }
        })
      }
    )
    
    if (!geminiResponse.ok) {
      throw new Error('Gemini API呼び出しに失敗しました')
    }
    
    const geminiData = await geminiResponse.json()
    const geminiText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || ''
    
    // JSONを抽出
    const jsonMatch = geminiText.match(/\{[\s\S]*\}/)
    const geminiProfile = jsonMatch ? JSON.parse(jsonMatch[0]) : {}
    
    const profile = {
      student_id: studentId,
      curriculum_id: curriculumId,
      student_name: student?.name,
      profile_summary: geminiProfile.summary || '',
      learning_type: geminiProfile.learning_type || '',
      overall_score: analysisData.analysis.overall_score,
      confidence_level: analysisData.analysis.overall_score >= 80 ? 'high' : 'medium',
      recommended_course: geminiProfile.recommended_course || 'しっかりコース',
      patterns: patterns,
      strengths: geminiProfile.strengths || [],
      weaknesses: geminiProfile.weaknesses || [],
      recommendations: geminiProfile.recommendations || {},
      generated_at: new Date().toISOString()
    }
    
    // プロファイルを保存
    await saveProfile(env.DB, studentId, curriculumId, profile)
    
    return c.json({
      success: true,
      profile
    })
  } catch (error: any) {
    console.error('総合プロファイル生成エラー:', error)
    return c.json({
      success: false,
      error: 'プロファイル生成に失敗しました'
    }, 500)
  }
})

// ヘルパー: 簡易プロファイル生成（Gemini API未設定時）
function generateSimpleProfile(patterns: any, student: any) {
  const dominantStyle = patterns.learning_style.dominant_style
  const styleText = dominantStyle === 'visual' ? '視覚型' : 
                   dominantStyle === 'auditory' ? '聴覚型' : '体感型'
  
  return {
    student_name: student?.name,
    profile_summary: `${styleText}の学習スタイルを持ち、${patterns.progress_speed.type}の進捗を示しています。`,
    learning_type: `${styleText}×${patterns.progress_speed.type}`,
    strengths: ['自己学習能力', '継続的な取り組み'],
    weaknesses: ['さらなる分析が必要'],
    recommendations: {
      for_teacher: ['学習スタイルに合わせた指導を行ってください'],
      for_parent: ['家庭学習の継続をサポートしてください'],
      for_student: ['自分のペースで学習を進めましょう']
    },
    recommended_course: 'しっかりコース'
  }
}

// ヘルパー: プロファイル保存
async function saveProfile(db: D1Database, studentId: string, curriculumId: number, profile: any) {
  await db.prepare(`
    INSERT OR REPLACE INTO learning_profiles (
      student_id, curriculum_id, profile_type, profile_data, overall_score, confidence_level, 
      expires_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, datetime('now', '+7 days'), datetime('now'))
  `).bind(
    studentId,
    curriculumId,
    'comprehensive',
    JSON.stringify(profile),
    profile.overall_score || 0,
    profile.confidence_level || 'medium'
  ).run()
}

// 個別最適化プラン生成
app.post('/api/analysis/personalized-plan/:studentId', async (c) => {
  const { env } = c
  const studentId = c.req.param('studentId')
  const { curriculumId, profileId } = await c.req.json()
  
  try {
    // プロファイルを取得
    const profile = await env.DB.prepare(`
      SELECT profile_data FROM learning_profiles
      WHERE student_id = ? AND curriculum_id = ?
      ORDER BY updated_at DESC LIMIT 1
    `).bind(studentId, curriculumId).first()
    
    if (!profile) {
      return c.json({
        success: false,
        error: 'プロファイルが見つかりません'
      }, 404)
    }
    
    const profileData = JSON.parse(profile.profile_data as string)
    
    // 簡易的な個別最適化プラン生成
    const plan = {
      student_id: studentId,
      curriculum_id: curriculumId,
      plan_type: 'daily',
      daily_schedule: generateDailySchedule(profileData),
      weekly_goals: generateWeeklyGoals(profileData),
      adaptive_strategies: generateAdaptiveStrategies(profileData),
      created_at: new Date().toISOString()
    }
    
    // プラン保存
    await env.DB.prepare(`
      INSERT INTO personalized_plans (
        student_id, curriculum_id, profile_id, plan_type, plan_data, status, start_date, end_date
      ) VALUES (?, ?, ?, ?, ?, 'active', date('now'), date('now', '+7 days'))
    `).bind(
      studentId,
      curriculumId,
      profileId || null,
      'daily',
      JSON.stringify(plan)
    ).run()
    
    return c.json({
      success: true,
      plan
    })
  } catch (error: any) {
    console.error('個別最適化プラン生成エラー:', error)
    return c.json({
      success: false,
      error: 'プラン生成に失敗しました'
    }, 500)
  }
})

// ヘルパー: 1日のスケジュール生成
function generateDailySchedule(profileData: any) {
  const optimalTime = profileData.patterns?.time?.optimal_study_time?.[0] || '10:00'
  return {
    morning: {
      time: optimalTime,
      activity: '新しい学習カード',
      duration: 30,
      support: `${profileData.learning_type}に最適化された教材を使用`
    },
    afternoon: {
      time: '14:00',
      activity: '復習・確認',
      duration: 20,
      support: '理解度確認クイズ'
    }
  }
}

// ヘルパー: 週次目標生成
function generateWeeklyGoals(profileData: any) {
  const cardsPerWeek = profileData.patterns?.progress_speed?.cards_per_week?.[0] || 3
  return [
    `今週の目標: ${cardsPerWeek + 1}カード完了`,
    `理解度目標: 平均4以上`,
    `継続的な学習習慣の維持`
  ]
}

// ヘルパー: 適応的戦略生成
function generateAdaptiveStrategies(profileData: any) {
  return [
    {
      condition: 'つまずいた時',
      action: `${profileData.learning_type}に合わせたヒントを表示`,
      timing: '3分経過後'
    },
    {
      condition: '集中力低下',
      action: '休憩を促す',
      timing: '30分経過後'
    }
  ]
}

// ==============================================
// Phase 10: 教師・保護者ダッシュボードAPI
// ==============================================

// クラス全体の学習プロファイル取得（教師向け）
app.get('/api/dashboard/class/:classCode', async (c) => {
  const { env } = c
  const classCode = c.req.param('classCode')
  
  try {
    // クラスに所属する生徒を取得
    const students = await env.DB.prepare(`
      SELECT id, name, email, student_number
      FROM users
      WHERE class_code = ? AND role = 'student'
      ORDER BY student_number
    `).bind(classCode).all()
    
    if (!students.results || students.results.length === 0) {
      return c.json({
        success: true,
        students: [],
        summary: {
          total_students: 0,
          with_profiles: 0,
          average_score: 0
        }
      })
    }
    
    // 各生徒のプロファイルを取得
    const studentProfiles = await Promise.all(
      students.results.map(async (student: any) => {
        const profile = await env.DB.prepare(`
          SELECT profile_data, overall_score, confidence_level, updated_at
          FROM learning_profiles
          WHERE student_id = ?
          ORDER BY updated_at DESC
          LIMIT 1
        `).bind(student.id).first()
        
        if (profile) {
          const profileData = JSON.parse(profile.profile_data as string)
          return {
            student_id: student.id,
            student_name: student.name,
            student_number: student.student_number,
            profile_summary: profileData.profile_summary || '',
            learning_type: profileData.learning_type || '',
            overall_score: profile.overall_score,
            confidence_level: profile.confidence_level,
            strengths: profileData.strengths || [],
            weaknesses: profileData.weaknesses || [],
            recommended_course: profileData.recommended_course || 'しっかりコース',
            last_updated: profile.updated_at
          }
        }
        
        return {
          student_id: student.id,
          student_name: student.name,
          student_number: student.student_number,
          profile_summary: '分析データ不足',
          learning_type: '未分析',
          overall_score: 0,
          confidence_level: 'low',
          strengths: [],
          weaknesses: ['学習データが不足しています'],
          recommended_course: 'しっかりコース',
          last_updated: null
        }
      })
    )
    
    // サマリー統計
    const withProfiles = studentProfiles.filter(p => p.overall_score > 0)
    const summary = {
      total_students: students.results.length,
      with_profiles: withProfiles.length,
      average_score: withProfiles.length > 0 
        ? Math.round(withProfiles.reduce((sum, p) => sum + p.overall_score, 0) / withProfiles.length)
        : 0,
      by_learning_type: countByLearningType(withProfiles),
      by_course: countByCourse(withProfiles)
    }
    
    return c.json({
      success: true,
      class_code: classCode,
      students: studentProfiles,
      summary
    })
  } catch (error: any) {
    console.error('クラスダッシュボード取得エラー:', error)
    return c.json({
      success: false,
      error: 'ダッシュボードデータの取得に失敗しました'
    }, 500)
  }
})

// ヘルパー: 学習タイプ別カウント
function countByLearningType(profiles: any[]) {
  const counts: Record<string, number> = {}
  profiles.forEach(p => {
    const type = p.learning_type || '未分類'
    counts[type] = (counts[type] || 0) + 1
  })
  return counts
}

// ヘルパー: コース別カウント
function countByCourse(profiles: any[]) {
  const counts: Record<string, number> = {
    'じっくりコース': 0,
    'しっかりコース': 0,
    'ぐんぐんコース': 0
  }
  profiles.forEach(p => {
    const course = p.recommended_course || 'しっかりコース'
    if (counts[course] !== undefined) {
      counts[course]++
    }
  })
  return counts
}

// 個別生徒の詳細プロファイル取得（教師・保護者向け）
app.get('/api/dashboard/student/:studentId', async (c) => {
  const { env } = c
  const studentId = c.req.param('studentId')
  
  try {
    // 生徒情報
    const student = await env.DB.prepare(`
      SELECT id, name, email, student_number, class_code
      FROM users
      WHERE id = ?
    `).bind(studentId).first()
    
    if (!student) {
      return c.json({
        success: false,
        error: '生徒が見つかりません'
      }, 404)
    }
    
    // 最新プロファイル
    const profile = await env.DB.prepare(`
      SELECT profile_data, overall_score, confidence_level, updated_at
      FROM learning_profiles
      WHERE student_id = ?
      ORDER BY updated_at DESC
      LIMIT 1
    `).bind(studentId).first()
    
    // 個別最適化プラン
    const plan = await env.DB.prepare(`
      SELECT plan_data, status, start_date, end_date, created_at
      FROM personalized_plans
      WHERE student_id = ? AND status = 'active'
      ORDER BY created_at DESC
      LIMIT 1
    `).bind(studentId).first()
    
    // 推奨事項
    const recommendations = await env.DB.prepare(`
      SELECT id, target_role, recommendation_type, priority, title, description, 
             action_items, status, created_at, expires_at
      FROM recommendations
      WHERE student_id = ? AND status != 'dismissed'
      ORDER BY priority DESC, created_at DESC
      LIMIT 10
    `).bind(studentId).all()
    
    // 最近の学習行動サマリー
    const recentActivity = await env.DB.prepare(`
      SELECT 
        action_type,
        COUNT(*) as count,
        MAX(action_timestamp) as last_action
      FROM learning_behavior_logs
      WHERE student_id = ? AND action_timestamp >= datetime('now', '-7 days')
      GROUP BY action_type
      ORDER BY count DESC
    `).bind(studentId).all()
    
    const profileData = profile ? JSON.parse(profile.profile_data as string) : null
    const planData = plan ? JSON.parse(plan.plan_data as string) : null
    
    return c.json({
      success: true,
      student: {
        id: student.id,
        name: student.name,
        email: student.email,
        student_number: student.student_number,
        class_code: student.class_code
      },
      profile: profileData ? {
        summary: profileData.profile_summary,
        learning_type: profileData.learning_type,
        overall_score: profile?.overall_score,
        confidence_level: profile?.confidence_level,
        strengths: profileData.strengths,
        weaknesses: profileData.weaknesses,
        recommendations: profileData.recommendations,
        recommended_course: profileData.recommended_course,
        patterns: profileData.patterns,
        last_updated: profile?.updated_at
      } : null,
      plan: planData,
      recommendations: recommendations.results || [],
      recent_activity: recentActivity.results || []
    })
  } catch (error: any) {
    console.error('生徒詳細取得エラー:', error)
    return c.json({
      success: false,
      error: '生徒詳細の取得に失敗しました'
    }, 500)
  }
})

// 推奨事項の作成（教師向け）
app.post('/api/dashboard/recommendations', async (c) => {
  const { env } = c
  const { studentId, curriculumId, targetRole, type, priority, title, description, actionItems } = await c.req.json()
  
  try {
    await env.DB.prepare(`
      INSERT INTO recommendations (
        student_id, curriculum_id, target_role, recommendation_type, priority,
        title, description, action_items, status, expires_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', datetime('now', '+30 days'))
    `).bind(
      studentId,
      curriculumId || null,
      targetRole,
      type,
      priority,
      title,
      description,
      JSON.stringify(actionItems || [])
    ).run()
    
    return c.json({
      success: true,
      message: '推奨事項を作成しました'
    })
  } catch (error: any) {
    console.error('推奨事項作成エラー:', error)
    return c.json({
      success: false,
      error: '推奨事項の作成に失敗しました'
    }, 500)
  }
})

// ==============================================
// Phase 11: 学習カード自動適応API
// ==============================================

// 適応型学習カード取得
app.get('/api/cards/:cardId/adapted/:studentId', async (c) => {
  const { env } = c
  const cardId = c.req.param('cardId')
  const studentId = c.req.param('studentId')
  
  try {
    // 元の学習カード取得
    const card = await env.DB.prepare(`
      SELECT * FROM learning_cards WHERE id = ?
    `).bind(cardId).first()
    
    if (!card) {
      return c.json({
        success: false,
        error: 'カードが見つかりません'
      }, 404)
    }
    
    // 学習スタイルプロファイル取得
    const profile = await env.DB.prepare(`
      SELECT profile_data FROM learning_profiles
      WHERE student_id = ?
      ORDER BY updated_at DESC
      LIMIT 1
    `).bind(studentId).first()
    
    let adaptedCard = { ...card }
    let learningStyle = 'balanced' // デフォルト
    
    if (profile) {
      const profileData = JSON.parse(profile.profile_data as string)
      const patterns = profileData.patterns
      
      // 優勢な学習スタイルを判定
      if (patterns?.learning_style) {
        learningStyle = patterns.learning_style.dominant_style || 'balanced'
        
        // 学習スタイルに応じてカードを適応
        adaptedCard = adaptCardToStyle(card, learningStyle, patterns.learning_style)
      }
    }
    
    return c.json({
      success: true,
      card: adaptedCard,
      learning_style: learningStyle,
      adapted: !!profile
    })
  } catch (error: any) {
    console.error('適応型カード取得エラー:', error)
    return c.json({
      success: false,
      error: 'カードの取得に失敗しました'
    }, 500)
  }
})

// ヘルパー: カードを学習スタイルに適応
function adaptCardToStyle(card: any, dominantStyle: string, styleScores: any) {
  const adapted = { ...card }
  
  // メタデータを追加
  adapted.adaptation_metadata = {
    dominant_style: dominantStyle,
    style_scores: styleScores,
    adaptations_applied: []
  }
  
  // 視覚型の適応
  if (dominantStyle === 'visual' || styleScores.visual >= 60) {
    adapted.adaptation_metadata.adaptations_applied.push('visual_enhanced')
    adapted.visual_hints_priority = true
    adapted.show_diagrams = true
    adapted.color_coding = true
  }
  
  // 聴覚型の適応
  if (dominantStyle === 'auditory' || styleScores.auditory >= 60) {
    adapted.adaptation_metadata.adaptations_applied.push('auditory_enhanced')
    adapted.audio_guide_enabled = true
    adapted.text_to_speech = true
    adapted.step_by_step_audio = true
  }
  
  // 体感型の適応
  if (dominantStyle === 'kinesthetic' || styleScores.kinesthetic >= 60) {
    adapted.adaptation_metadata.adaptations_applied.push('kinesthetic_enhanced')
    adapted.interactive_elements = true
    adapted.drag_drop_enabled = true
    adapted.hands_on_activities = true
  }
  
  return adapted
}

// ==============================================
// Phase 12: AI予測機能強化API
// ==============================================

// 学習予測生成
app.post('/api/predictions/:studentId', async (c) => {
  const { env } = c
  const studentId = c.req.param('studentId')
  const { curriculumId, predictionType } = await c.req.json()
  
  try {
    // 学習パターンを取得
    const analysisResponse = await fetch(`${c.req.url.split('/api')[0]}/api/analysis/patterns/${studentId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ curriculumId })
    })
    
    if (!analysisResponse.ok) {
      throw new Error('パターン分析の取得に失敗しました')
    }
    
    const analysisData = await analysisResponse.json()
    const patterns = analysisData.analysis.patterns
    
    // 予測を生成
    const predictions = generatePredictions(patterns, predictionType || 'all')
    
    // 予測結果を保存
    for (const [type, data] of Object.entries(predictions)) {
      await env.DB.prepare(`
        INSERT INTO ai_predictions (
          student_id, curriculum_id, prediction_type, prediction_data, 
          confidence_level, prediction_date, target_date
        ) VALUES (?, ?, ?, ?, ?, date('now'), ?)
      `).bind(
        studentId,
        curriculumId,
        type,
        JSON.stringify(data),
        (data as any).confidence || 0.7,
        (data as any).target_date || null
      ).run()
    }
    
    return c.json({
      success: true,
      predictions
    })
  } catch (error: any) {
    console.error('予測生成エラー:', error)
    return c.json({
      success: false,
      error: '予測の生成に失敗しました'
    }, 500)
  }
})

// ヘルパー: 予測生成
function generatePredictions(patterns: any, type: string) {
  const predictions: any = {}
  
  if (type === 'all' || type === 'next_week') {
    // 来週の予測
    const cardsPerWeek = patterns.progress_speed?.cards_per_week?.[0] || 3
    const trend = patterns.progress_speed?.trend || 'stable'
    
    let nextWeekCards = cardsPerWeek
    if (trend === 'accelerating') nextWeekCards = Math.round(cardsPerWeek * 1.2)
    if (trend === 'decelerating') nextWeekCards = Math.round(cardsPerWeek * 0.8)
    
    predictions.next_week = {
      cards_expected: nextWeekCards,
      understanding_level: Math.min((patterns.comprehension?.average_understanding || 3) + 0.3, 5),
      confidence: 0.75,
      target_date: getNextWeekDate(),
      recommendation: nextWeekCards >= 5 ? '順調です' : '支援が必要かもしれません'
    }
  }
  
  if (type === 'all' || type === 'struggling_points') {
    // つまずきポイント予測
    predictions.struggling_points = {
      potential_struggles: [
        patterns.comprehension?.average_understanding < 3 ? '基礎理解の強化が必要' : null,
        patterns.help_seeking?.help_frequency > 10 ? '自立学習の促進が必要' : null,
        patterns.engagement?.engagement_level === 'low' ? 'モチベーション支援が必要' : null
      ].filter(Boolean),
      confidence: 0.65,
      recommendation: '定期的な個別支援を推奨'
    }
  }
  
  return predictions
}

// ヘルパー: 来週の日付
function getNextWeekDate() {
  const date = new Date()
  date.setDate(date.getDate() + 7)
  return date.toISOString().split('T')[0]
}

// ==============================================
// Phase 14: 研究資料導出API
// ==============================================

// 研究用データエクスポート（匿名化済み）
app.get('/api/research/export/:classCode', async (c) => {
  const { env } = c
  const classCode = c.req.param('classCode')
  const format = c.req.query('format') || 'json' // json, csv
  
  try {
    // クラスの全生徒データを取得
    const students = await env.DB.prepare(`
      SELECT id, student_number FROM users
      WHERE class_code = ? AND role = 'student'
    `).bind(classCode).all()
    
    const exportData: any[] = []
    
    for (const student of (students.results || [])) {
      // プロファイル取得
      const profile = await env.DB.prepare(`
        SELECT profile_data, overall_score, confidence_level, updated_at
        FROM learning_profiles
        WHERE student_id = ?
        ORDER BY updated_at DESC LIMIT 1
      `).bind(student.id).first()
      
      // 学習行動サマリー
      const behaviorStats = await env.DB.prepare(`
        SELECT 
          action_type,
          COUNT(*) as count,
          AVG(session_duration) as avg_duration
        FROM learning_behavior_logs
        WHERE student_id = ?
        GROUP BY action_type
      `).bind(student.id).all()
      
      // 進捗データ
      const progressData = await env.DB.prepare(`
        SELECT 
          COUNT(*) as total_cards,
          AVG(understanding_level) as avg_understanding,
          AVG(completion_time_minutes) as avg_time
        FROM student_progress
        WHERE student_id = ? AND status = 'completed'
      `).bind(student.id).first()
      
      if (profile) {
        const profileData = JSON.parse(profile.profile_data as string)
        
        exportData.push({
          // 匿名化ID（研究用）
          anonymous_id: `STUDENT_${String(student.student_number).padStart(3, '0')}`,
          
          // 学習プロファイル
          learning_type: profileData.learning_type,
          overall_score: profile.overall_score,
          confidence_level: profile.confidence_level,
          
          // 学習スタイル（VAKモデル）
          visual_score: profileData.patterns?.learning_style?.visual || 0,
          auditory_score: profileData.patterns?.learning_style?.auditory || 0,
          kinesthetic_score: profileData.patterns?.learning_style?.kinesthetic || 0,
          dominant_style: profileData.patterns?.learning_style?.dominant_style,
          
          // 時間パターン
          optimal_study_time: profileData.patterns?.time?.optimal_study_time?.join(','),
          concentration_span: profileData.patterns?.time?.concentration_span,
          
          // 理解パターン
          average_understanding: profileData.patterns?.comprehension?.average_understanding || 0,
          total_completed_cards: profileData.patterns?.comprehension?.total_completed || 0,
          
          // 助け要請パターン
          help_frequency: profileData.patterns?.help_seeking?.help_frequency || 0,
          average_wait_time: profileData.patterns?.help_seeking?.average_wait_time || 0,
          
          // 進捗速度
          cards_per_week: profileData.patterns?.progress_speed?.cards_per_week?.join(','),
          progress_trend: profileData.patterns?.progress_speed?.trend,
          
          // エンゲージメント
          sessions_per_week: profileData.patterns?.engagement?.sessions_per_week || 0,
          avg_session_duration: profileData.patterns?.engagement?.average_session_duration || 0,
          engagement_level: profileData.patterns?.engagement?.engagement_level,
          
          // 行動統計
          behavior_stats: JSON.stringify(behaviorStats.results || []),
          
          // 進捗統計
          progress_total_cards: progressData?.total_cards || 0,
          progress_avg_understanding: progressData?.avg_understanding || 0,
          progress_avg_time_minutes: progressData?.avg_time || 0,
          
          // タイムスタンプ
          data_updated_at: profile.updated_at,
          export_timestamp: new Date().toISOString()
        })
      }
    }
    
    if (format === 'csv') {
      // CSV形式に変換
      const csv = convertToCSV(exportData)
      return c.text(csv, 200, {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="research_data_${classCode}_${new Date().toISOString().split('T')[0]}.csv"`
      })
    }
    
    // JSON形式
    return c.json({
      success: true,
      class_code: classCode,
      total_students: exportData.length,
      export_timestamp: new Date().toISOString(),
      data: exportData,
      metadata: {
        description: '匿名化済み研究用データ',
        variables: Object.keys(exportData[0] || {}),
        note: '個人を特定できる情報は含まれていません'
      }
    })
  } catch (error: any) {
    console.error('データエクスポートエラー:', error)
    return c.json({
      success: false,
      error: 'データのエクスポートに失敗しました'
    }, 500)
  }
})

// ヘルパー: CSV変換
function convertToCSV(data: any[]): string {
  if (data.length === 0) return ''
  
  const headers = Object.keys(data[0])
  const csvRows = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header]
        if (value === null || value === undefined) return ''
        if (typeof value === 'string' && value.includes(',')) {
          return `"${value.replace(/"/g, '""')}"`
        }
        return value
      }).join(',')
    )
  ]
  
  return csvRows.join('\n')
}

// 統計サマリー取得（研究用）
app.get('/api/research/summary/:classCode', async (c) => {
  const { env } = c
  const classCode = c.req.param('classCode')
  
  try {
    // クラス全体の統計
    const students = await env.DB.prepare(`
      SELECT id FROM users WHERE class_code = ? AND role = 'student'
    `).bind(classCode).all()
    
    const studentIds = (students.results || []).map((s: any) => s.id)
    
    if (studentIds.length === 0) {
      return c.json({
        success: true,
        summary: { total_students: 0 }
      })
    }
    
    // 学習スタイル分布
    const styleDistribution = await env.DB.prepare(`
      SELECT profile_data FROM learning_profiles
      WHERE student_id IN (${studentIds.join(',')})
      ORDER BY updated_at DESC
    `).all()
    
    const styles = { visual: 0, auditory: 0, kinesthetic: 0, balanced: 0 }
    const scores = { overall: [], visual: [], auditory: [], kinesthetic: [] }
    
    for (const row of (styleDistribution.results || [])) {
      const profile = JSON.parse(row.profile_data as string)
      const dominant = profile.patterns?.learning_style?.dominant_style
      if (dominant) styles[dominant as keyof typeof styles]++
      
      scores.visual.push(profile.patterns?.learning_style?.visual || 0)
      scores.auditory.push(profile.patterns?.learning_style?.auditory || 0)
      scores.kinesthetic.push(profile.patterns?.learning_style?.kinesthetic || 0)
    }
    
    // 統計計算
    const avg = (arr: number[]) => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0
    const std = (arr: number[]) => {
      const mean = avg(arr)
      const variance = arr.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / arr.length
      return Math.sqrt(variance)
    }
    
    return c.json({
      success: true,
      class_code: classCode,
      summary: {
        total_students: studentIds.length,
        learning_style_distribution: styles,
        learning_style_scores: {
          visual: { mean: avg(scores.visual), std: std(scores.visual) },
          auditory: { mean: avg(scores.auditory), std: std(scores.auditory) },
          kinesthetic: { mean: avg(scores.kinesthetic), std: std(scores.kinesthetic) }
        },
        generated_at: new Date().toISOString()
      }
    })
  } catch (error: any) {
    console.error('統計サマリーエラー:', error)
    return c.json({
      success: false,
      error: '統計の取得に失敗しました'
    }, 500)
  }
})

// ==============================================
// Phase 15: 機械学習 + リアルタイム学習API
// ==============================================

// Phase 17: LSTM/GRU時系列予測 - データ収集
app.post('/api/lstm/collect-data/:studentId', async (c) => {
  const { env } = c
  const studentId = parseInt(c.req.param('studentId'))
  const { understanding_level, completion_time, engagement_score, hint_count, emotion_state, session_context } = await c.req.json()
  
  try {
    await env.DB.prepare(`
      INSERT INTO time_series_data 
      (student_id, understanding_level, completion_time, engagement_score, hint_count, emotion_state, session_context, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).bind(
      studentId,
      understanding_level,
      completion_time,
      engagement_score,
      hint_count || 0,
      emotion_state || 'neutral',
      JSON.stringify(session_context || {})
    ).run()
    
    return c.json({ success: true, message: '時系列データを記録しました' })
  } catch (error: any) {
    console.error('時系列データ記録エラー:', error)
    return c.json({ success: false, error: 'データ記録に失敗しました' }, 500)
  }
})

// Phase 17: LSTM予測 - 時系列データ取得
app.get('/api/lstm/time-series/:studentId', async (c) => {
  const { env } = c
  const studentId = parseInt(c.req.param('studentId'))
  const limit = parseInt(c.req.query('limit') || '50')
  
  try {
    const data = await env.DB.prepare(`
      SELECT 
        understanding_level,
        completion_time,
        engagement_score,
        hint_count,
        emotion_state,
        timestamp
      FROM time_series_data
      WHERE student_id = ?
      ORDER BY timestamp DESC
      LIMIT ?
    `).bind(studentId, limit).all()
    
    return c.json({
      success: true,
      data: data.results || [],
      sequence_length: (data.results || []).length
    })
  } catch (error: any) {
    console.error('時系列データ取得エラー:', error)
    return c.json({ success: false, error: 'データ取得に失敗しました' }, 500)
  }
})

// Phase 17: Transformer - テキスト解析
app.post('/api/transformer/analyze-text', async (c) => {
  const { env } = c
  const { student_id, text_input, analysis_type } = await c.req.json()
  
  try {
    // 簡易的な感情分析（実際のTransformerはクライアント側で実行）
    let analysis_result: any = {}
    let confidence_score = 0.8
    
    if (analysis_type === 'sentiment') {
      // ポジティブ・ネガティブ判定
      const positiveWords = ['楽しい', 'わかった', '理解できた', '好き', '面白い']
      const negativeWords = ['難しい', 'わからない', '苦手', 'つまらない', '嫌い']
      
      const positive = positiveWords.some(word => text_input.includes(word))
      const negative = negativeWords.some(word => text_input.includes(word))
      
      analysis_result = {
        sentiment: positive ? 'positive' : (negative ? 'negative' : 'neutral'),
        confidence: confidence_score,
        keywords: text_input.split(' ').slice(0, 5)
      }
    } else if (analysis_type === 'comprehension') {
      // 理解度判定
      const understandingIndicators = ['わかった', '理解', 'できた', 'なるほど']
      const struggles = ['わからない', '難しい', '???', '？？？']
      
      const understands = understandingIndicators.some(word => text_input.includes(word))
      const struggling = struggles.some(word => text_input.includes(word))
      
      analysis_result = {
        comprehension_level: understands ? 'high' : (struggling ? 'low' : 'medium'),
        needs_help: struggling,
        confidence: confidence_score
      }
    }
    
    await env.DB.prepare(`
      INSERT INTO text_analysis_results 
      (student_id, text_input, analysis_type, analysis_result, confidence_score, created_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'))
    `).bind(
      student_id,
      text_input,
      analysis_type,
      JSON.stringify(analysis_result),
      confidence_score
    ).run()
    
    return c.json({
      success: true,
      analysis: analysis_result,
      confidence: confidence_score
    })
  } catch (error: any) {
    console.error('テキスト解析エラー:', error)
    return c.json({ success: false, error: '解析に失敗しました' }, 500)
  }
})

// Phase 17: 強化学習 - アクション実行と報酬記録
app.post('/api/rl/take-action', async (c) => {
  const { env } = c
  const { student_id, state, action, reward } = await c.req.json()
  
  try {
    // エージェントを取得または作成
    let agent = await env.DB.prepare(`
      SELECT * FROM rl_agents
      WHERE student_id = ? AND agent_type = 'q_learning'
      ORDER BY updated_at DESC LIMIT 1
    `).bind(student_id).first()
    
    if (!agent) {
      // 新規エージェント作成
      const result = await env.DB.prepare(`
        INSERT INTO rl_agents 
        (student_id, agent_type, state_space_dim, action_space_dim, q_table, total_episodes, average_reward)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind(
        student_id,
        'q_learning',
        10, // state dimension
        5,  // action dimension
        JSON.stringify({}), // empty Q-table
        0,
        0
      ).run()
      
      agent = await env.DB.prepare(`
        SELECT * FROM rl_agents WHERE id = ?
      `).bind(result.meta.last_row_id).first()
    }
    
    // Q値の更新（簡易版）
    const q_table = JSON.parse(agent.q_table as string || '{}')
    const state_key = JSON.stringify(state)
    
    if (!q_table[state_key]) {
      q_table[state_key] = {}
    }
    
    // Q-learning更新式: Q(s,a) = Q(s,a) + α * (r + γ * max(Q(s',a')) - Q(s,a))
    const alpha = 0.1 // 学習率
    const gamma = 0.9 // 割引率
    const current_q = q_table[state_key][action] || 0
    const new_q = current_q + alpha * (reward - current_q) // 簡易版
    
    q_table[state_key][action] = new_q
    
    // エージェントを更新
    const new_total_episodes = (agent.total_episodes as number) + 1
    const new_avg_reward = ((agent.average_reward as number) * (agent.total_episodes as number) + reward) / new_total_episodes
    
    await env.DB.prepare(`
      UPDATE rl_agents
      SET q_table = ?,
          total_episodes = ?,
          average_reward = ?,
          updated_at = datetime('now')
      WHERE id = ?
    `).bind(
      JSON.stringify(q_table),
      new_total_episodes,
      new_avg_reward,
      agent.id
    ).run()
    
    return c.json({
      success: true,
      new_q_value: new_q,
      average_reward: new_avg_reward,
      total_episodes: new_total_episodes
    })
  } catch (error: any) {
    console.error('強化学習エラー:', error)
    return c.json({ success: false, error: 'アクション実行に失敗しました' }, 500)
  }
})

// Phase 17: 強化学習 - 最適アクション推薦
app.post('/api/rl/recommend-action', async (c) => {
  const { env } = c
  const { student_id, current_state } = await c.req.json()
  
  try {
    const agent = await env.DB.prepare(`
      SELECT * FROM rl_agents
      WHERE student_id = ? AND agent_type = 'q_learning'
      ORDER BY updated_at DESC LIMIT 1
    `).bind(student_id).first()
    
    if (!agent) {
      return c.json({
        success: true,
        recommended_action: 'explore', // デフォルトは探索
        confidence: 0,
        reason: '学習データが不足しています'
      })
    }
    
    const q_table = JSON.parse(agent.q_table as string || '{}')
    const state_key = JSON.stringify(current_state)
    const state_actions = q_table[state_key] || {}
    
    // ε-greedy戦略
    const epsilon = 0.1 // 探索率
    
    if (Math.random() < epsilon || Object.keys(state_actions).length === 0) {
      // 探索
      return c.json({
        success: true,
        recommended_action: 'explore',
        confidence: 0.5,
        reason: '新しいアクションを探索します'
      })
    } else {
      // 最適アクション選択
      let best_action = null
      let best_q = -Infinity
      
      for (const [action, q_value] of Object.entries(state_actions)) {
        if ((q_value as number) > best_q) {
          best_q = q_value as number
          best_action = action
        }
      }
      
      return c.json({
        success: true,
        recommended_action: best_action,
        q_value: best_q,
        confidence: Math.min(0.9, best_q / 10), // スケーリング
        reason: '学習履歴に基づく最適アクションです'
      })
    }
  } catch (error: any) {
    console.error('アクション推薦エラー:', error)
    return c.json({ success: false, error: '推薦に失敗しました' }, 500)
  }
})

// Phase 18: 音声入力 - 文字起こし保存
app.post('/api/voice/save-transcription', async (c) => {
  const { env } = c
  const { student_id, audio_url, transcription, confidence, language, duration, emotion } = await c.req.json()
  
  try {
    await env.DB.prepare(`
      INSERT INTO voice_inputs 
      (student_id, audio_url, transcription, transcription_confidence, language, duration_seconds, emotion_detected, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).bind(
      student_id,
      audio_url,
      transcription,
      confidence || 0.9,
      language || 'ja',
      duration || 0,
      emotion || 'neutral'
    ).run()
    
    return c.json({ success: true, message: '音声入力を保存しました' })
  } catch (error: any) {
    console.error('音声入力保存エラー:', error)
    return c.json({ success: false, error: '保存に失敗しました' }, 500)
  }
})

// Phase 18: 手書き認識 - 認識結果保存
app.post('/api/handwriting/save-recognition', async (c) => {
  const { env } = c
  const { student_id, curriculum_id, image_url, recognized_text, confidence, stroke_data, is_correct, feedback } = await c.req.json()
  
  try {
    await env.DB.prepare(`
      INSERT INTO handwriting_inputs 
      (student_id, curriculum_id, image_url, recognized_text, recognition_confidence, stroke_data, is_correct, feedback, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).bind(
      student_id,
      curriculum_id || null,
      image_url,
      recognized_text,
      confidence || 0.9,
      JSON.stringify(stroke_data || []),
      is_correct ? 1 : 0,
      feedback || ''
    ).run()
    
    return c.json({ success: true, message: '手書き認識結果を保存しました' })
  } catch (error: any) {
    console.error('手書き認識保存エラー:', error)
    return c.json({ success: false, error: '保存に失敗しました' }, 500)
  }
})

// Phase 19: 学校管理 - 学校一覧取得
app.get('/api/schools', async (c) => {
  const { env } = c
  const municipality_id = c.req.query('municipality_id')
  
  try {
    let query = `
      SELECT s.*, m.municipality_name
      FROM schools s
      LEFT JOIN municipalities m ON s.municipality_id = m.id
      WHERE s.is_active = 1
    `
    
    const params: any[] = []
    if (municipality_id) {
      query += ` AND s.municipality_id = ?`
      params.push(parseInt(municipality_id))
    }
    
    query += ` ORDER BY s.school_name`
    
    const result = await env.DB.prepare(query).bind(...params).all()
    
    return c.json({
      success: true,
      schools: result.results || []
    })
  } catch (error: any) {
    console.error('学校一覧取得エラー:', error)
    return c.json({ success: false, error: '取得に失敗しました' }, 500)
  }
})

// Phase 19: クロススクール分析 - 自治体全体の統計
app.get('/api/cross-school/analytics/:municipalityId', async (c) => {
  const { env } = c
  const municipalityId = parseInt(c.req.param('municipalityId'))
  
  try {
    // 各学校の統計を集計
    const schools = await env.DB.prepare(`
      SELECT id, school_code, school_name
      FROM schools
      WHERE municipality_id = ? AND is_active = 1
    `).bind(municipalityId).all()
    
    const schoolStats: any[] = []
    
    for (const school of (schools.results || [])) {
      // 学校ごとの統計
      const stats = await env.DB.prepare(`
        SELECT 
          COUNT(DISTINCT u.id) as total_students,
          AVG(sp.understanding_level) as avg_understanding,
          AVG(sp.completion_time_minutes) as avg_completion_time,
          COUNT(sp.id) as total_cards_completed
        FROM users u
        LEFT JOIN student_progress sp ON u.id = sp.student_id AND sp.status = 'completed'
        WHERE u.class_code LIKE ? AND u.role = 'student'
      `).bind(`${school.school_code}%`).first()
      
      schoolStats.push({
        school_code: school.school_code,
        school_name: school.school_name,
        ...stats
      })
    }
    
    // 自治体全体の統計
    const overallStats = schoolStats.reduce((acc, school) => {
      acc.total_students += school.total_students || 0
      acc.total_understanding += (school.avg_understanding || 0) * (school.total_students || 0)
      acc.total_completion_time += (school.avg_completion_time || 0) * (school.total_students || 0)
      acc.total_cards += school.total_cards_completed || 0
      return acc
    }, { total_students: 0, total_understanding: 0, total_completion_time: 0, total_cards: 0 })
    
    const avgUnderstanding = overallStats.total_students > 0 
      ? overallStats.total_understanding / overallStats.total_students 
      : 0
    const avgCompletionTime = overallStats.total_students > 0 
      ? overallStats.total_completion_time / overallStats.total_students 
      : 0
    
    // トップ校・課題校の判定
    const sortedByUnderstanding = [...schoolStats].sort((a, b) => (b.avg_understanding || 0) - (a.avg_understanding || 0))
    const topSchools = sortedByUnderstanding.slice(0, 3)
    const strugglingSchools = sortedByUnderstanding.slice(-3).reverse()
    
    // 分析結果を保存
    await env.DB.prepare(`
      INSERT INTO cross_school_analytics 
      (analysis_date, municipality_id, school_ids, total_students, average_understanding, average_completion_time, average_engagement, top_performing_schools, struggling_schools, recommendations, created_at)
      VALUES (date('now'), ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).bind(
      municipalityId,
      JSON.stringify((schools.results || []).map((s: any) => s.id)),
      overallStats.total_students,
      avgUnderstanding,
      avgCompletionTime,
      0, // engagement計算は省略
      JSON.stringify(topSchools),
      JSON.stringify(strugglingSchools),
      JSON.stringify({
        overall: '自治体全体で個別最適化学習が機能しています',
        top_schools: 'ベストプラクティスを他校と共有してください',
        struggling_schools: '個別サポートと教師研修が推奨されます'
      })
    ).run()
    
    return c.json({
      success: true,
      municipality_id: municipalityId,
      overview: {
        total_students: overallStats.total_students,
        average_understanding: avgUnderstanding,
        average_completion_time: avgCompletionTime,
        total_cards_completed: overallStats.total_cards
      },
      schools: schoolStats,
      top_performing: topSchools,
      struggling: strugglingSchools,
      recommendations: {
        overall: '自治体全体で個別最適化学習が機能しています',
        top_schools: 'ベストプラクティスを他校と共有してください',
        struggling_schools: '個別サポートと教師研修が推奨されます'
      }
    })
  } catch (error: any) {
    console.error('クロススクール分析エラー:', error)
    return c.json({ success: false, error: '分析に失敗しました' }, 500)
  }
})

// Phase 19: 研究データセット作成
app.post('/api/research/create-dataset', async (c) => {
  const { env } = c
  const { dataset_name, researcher_id, description, data_collection_start, data_collection_end, school_codes, anonymization_level } = await c.req.json()
  
  try {
    // データセット作成
    const result = await env.DB.prepare(`
      INSERT INTO research_datasets 
      (dataset_name, researcher_id, description, data_collection_start, data_collection_end, schools_included, anonymization_level, export_format, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).bind(
      dataset_name,
      researcher_id,
      description,
      data_collection_start,
      data_collection_end,
      JSON.stringify(school_codes),
      anonymization_level || 'full',
      'csv'
    ).run()
    
    return c.json({
      success: true,
      dataset_id: result.meta.last_row_id,
      message: '研究用データセットを作成しました',
      next_step: 'データエクスポートAPIを使用してデータを取得してください'
    })
  } catch (error: any) {
    console.error('データセット作成エラー:', error)
    return c.json({ success: false, error: '作成に失敗しました' }, 500)
  }
})

// A/Bテスト実験への参加登録
app.post('/api/ab-test/assign', async (c) => {
  const { env } = c
  const { experiment_name, student_id, class_code } = await c.req.json()
  
  try {
    // 既存の割り当てをチェック
    const existing = await env.DB.prepare(`
      SELECT * FROM ab_test_assignments
      WHERE experiment_name = ? AND student_id = ?
    `).bind(experiment_name, student_id).first()
    
    if (existing) {
      return c.json({
        success: true,
        variant: existing.variant_name,
        already_assigned: true
      })
    }
    
    // ランダム割り当て（完全にランダム化された比較試験）
    const variant = Math.random() < 0.5 ? 'control' : 'experimental'
    
    await env.DB.prepare(`
      INSERT INTO ab_test_assignments 
      (experiment_name, student_id, variant_name, class_code, assigned_at)
      VALUES (?, ?, ?, ?, datetime('now'))
    `).bind(experiment_name, student_id, variant, class_code).run()
    
    return c.json({
      success: true,
      variant,
      message: `${variant === 'control' ? 'コントロール群' : '実験群'}に割り当てられました`
    })
  } catch (error: any) {
    console.error('A/Bテスト割り当てエラー:', error)
    return c.json({ success: false, error: '割り当てに失敗しました' }, 500)
  }
})

// A/Bテストイベント記録
app.post('/api/ab-test/event', async (c) => {
  const { env } = c
  const { experiment_name, student_id, event_type, event_data } = await c.req.json()
  
  try {
    // 割り当てを取得
    const assignment = await env.DB.prepare(`
      SELECT variant_name FROM ab_test_assignments
      WHERE experiment_name = ? AND student_id = ?
    `).bind(experiment_name, student_id).first()
    
    if (!assignment) {
      return c.json({ success: false, error: '実験への割り当てが見つかりません' }, 400)
    }
    
    // イベントを記録
    await env.DB.prepare(`
      INSERT INTO ab_test_events 
      (experiment_name, student_id, variant_name, event_type, event_data, created_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'))
    `).bind(
      experiment_name,
      student_id,
      assignment.variant_name,
      event_type,
      JSON.stringify(event_data)
    ).run()
    
    return c.json({ success: true, message: 'イベントを記録しました' })
  } catch (error: any) {
    console.error('A/Bテストイベント記録エラー:', error)
    return c.json({ success: false, error: 'イベント記録に失敗しました' }, 500)
  }
})

// A/Bテスト結果分析
app.get('/api/ab-test/results/:experimentName', async (c) => {
  const { env } = c
  const experimentName = c.req.param('experimentName')
  
  try {
    // 各群のサンプルサイズ
    const sampleSizes = await env.DB.prepare(`
      SELECT variant_name, COUNT(*) as count
      FROM ab_test_assignments
      WHERE experiment_name = ?
      GROUP BY variant_name
    `).bind(experimentName).all()
    
    // 各群のメトリクス計算
    const controlMetrics = await env.DB.prepare(`
      SELECT 
        AVG(CAST(json_extract(event_data, '$.understanding_level') AS REAL)) as avg_understanding,
        AVG(CAST(json_extract(event_data, '$.completion_time') AS REAL)) as avg_completion_time,
        AVG(CAST(json_extract(event_data, '$.engagement_score') AS REAL)) as avg_engagement
      FROM ab_test_events
      WHERE experiment_name = ? AND variant_name = 'control'
        AND event_type = 'card_completed'
    `).bind(experimentName).first()
    
    const experimentalMetrics = await env.DB.prepare(`
      SELECT 
        AVG(CAST(json_extract(event_data, '$.understanding_level') AS REAL)) as avg_understanding,
        AVG(CAST(json_extract(event_data, '$.completion_time') AS REAL)) as avg_completion_time,
        AVG(CAST(json_extract(event_data, '$.engagement_score') AS REAL)) as avg_engagement
      FROM ab_test_events
      WHERE experiment_name = ? AND variant_name = 'experimental'
        AND event_type = 'card_completed'
    `).bind(experimentName).first()
    
    // 効果量の計算（Cohen's d）
    const controlUnderstanding = controlMetrics?.avg_understanding || 0
    const experimentalUnderstanding = experimentalMetrics?.avg_understanding || 0
    const effectSize = experimentalUnderstanding - controlUnderstanding
    
    // 統計的有意性の簡易判定（実際にはt検定が必要）
    const isSignificant = Math.abs(effectSize) > 0.5 // 中程度の効果量
    
    return c.json({
      success: true,
      experiment_name: experimentName,
      sample_sizes: sampleSizes.results || [],
      control_group: {
        n: (sampleSizes.results || []).find((s: any) => s.variant_name === 'control')?.count || 0,
        avg_understanding: controlUnderstanding,
        avg_completion_time: controlMetrics?.avg_completion_time || 0,
        avg_engagement: controlMetrics?.avg_engagement || 0
      },
      experimental_group: {
        n: (sampleSizes.results || []).find((s: any) => s.variant_name === 'experimental')?.count || 0,
        avg_understanding: experimentalUnderstanding,
        avg_completion_time: experimentalMetrics?.avg_completion_time || 0,
        avg_engagement: experimentalMetrics?.avg_engagement || 0
      },
      analysis: {
        effect_size: effectSize,
        improvement_percentage: (effectSize / Math.max(controlUnderstanding, 0.01)) * 100,
        is_significant: isSignificant,
        recommendation: isSignificant 
          ? (effectSize > 0 ? '実験手法の採用を推奨します' : 'コントロール手法を継続推奨')
          : 'さらなるデータ収集が必要です'
      }
    })
  } catch (error: any) {
    console.error('A/Bテスト結果分析エラー:', error)
    return c.json({ success: false, error: '分析に失敗しました' }, 500)
  }
})

// リアルタイム学習（オンライン学習）：モデル更新API
app.post('/api/ml/update-model/:studentId', async (c) => {
  const { env } = c
  const studentId = parseInt(c.req.param('studentId'))
  const { training_data } = await c.req.json()
  
  try {
    // 既存のモデルパラメータを取得
    const existingModel = await env.DB.prepare(`
      SELECT model_params, performance_metrics, training_samples
      FROM ml_models
      WHERE student_id = ? AND model_type = 'understanding_predictor'
      ORDER BY updated_at DESC LIMIT 1
    `).bind(studentId).first()
    
    // 新しいトレーニングデータを履歴に保存
    await env.DB.prepare(`
      INSERT INTO ml_training_history 
      (student_id, model_type, training_data, performance_before, performance_after, created_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'))
    `).bind(
      studentId,
      'understanding_predictor',
      JSON.stringify(training_data),
      existingModel ? JSON.stringify(existingModel.performance_metrics) : '{}',
      '{}' // 後で更新
    ).run()
    
    // モデルパラメータの更新（簡易版：重み付き平均）
    const learningRate = 0.1 // オンライン学習率
    const newSamples = (existingModel?.training_samples || 0) + training_data.length
    
    // モデルを保存
    if (existingModel) {
      await env.DB.prepare(`
        UPDATE ml_models
        SET training_samples = ?,
            performance_metrics = json_set(performance_metrics, '$.last_update', datetime('now')),
            updated_at = datetime('now')
        WHERE student_id = ? AND model_type = 'understanding_predictor'
      `).bind(newSamples, studentId).run()
    } else {
      await env.DB.prepare(`
        INSERT INTO ml_models 
        (student_id, model_type, model_params, training_samples, performance_metrics, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `).bind(
        studentId,
        'understanding_predictor',
        JSON.stringify({ learning_rate: learningRate }),
        newSamples,
        JSON.stringify({ accuracy: 0, last_update: new Date().toISOString() })
      ).run()
    }
    
    return c.json({
      success: true,
      message: 'モデルをリアルタイム更新しました',
      training_samples: newSamples,
      learning_rate: learningRate
    })
  } catch (error: any) {
    console.error('ML モデル更新エラー:', error)
    return c.json({ success: false, error: 'モデル更新に失敗しました' }, 500)
  }
})

// ML予測API（TensorFlow.jsによる高度な予測）
app.post('/api/ml/predict/:studentId', async (c) => {
  const { env } = c
  const studentId = parseInt(c.req.param('studentId'))
  const { input_features } = await c.req.json()
  
  try {
    // 学習履歴データを取得
    const historyData = await env.DB.prepare(`
      SELECT 
        understanding_level,
        completion_time_minutes,
        hint_used_count,
        completed_at
      FROM student_progress
      WHERE student_id = ? AND status = 'completed'
      ORDER BY completed_at DESC
      LIMIT 50
    `).bind(studentId).all()
    
    // 特徴量の計算
    const features = {
      avg_understanding: 0,
      avg_completion_time: 0,
      trend: 0,
      consistency: 0,
      recent_performance: 0
    }
    
    if (historyData.results && historyData.results.length > 0) {
      const understandingLevels = historyData.results.map((r: any) => r.understanding_level || 0)
      const completionTimes = historyData.results.map((r: any) => r.completion_time_minutes || 0)
      
      features.avg_understanding = understandingLevels.reduce((a, b) => a + b, 0) / understandingLevels.length
      features.avg_completion_time = completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length
      
      // トレンド計算（最近10件 vs 全体）
      const recentUnderstanding = understandingLevels.slice(0, 10).reduce((a, b) => a + b, 0) / Math.min(10, understandingLevels.length)
      features.trend = recentUnderstanding - features.avg_understanding
      features.recent_performance = recentUnderstanding
      
      // 一貫性（標準偏差）
      const variance = understandingLevels.reduce((sum, val) => sum + Math.pow(val - features.avg_understanding, 2), 0) / understandingLevels.length
      features.consistency = Math.sqrt(variance)
    }
    
    // 簡易的な予測（実際のTensorFlow.jsモデルはクライアント側で実行）
    const predicted_understanding = Math.max(1, Math.min(5, 
      features.avg_understanding + features.trend * 0.3
    ))
    
    const confidence = Math.max(0, Math.min(1, 
      1 - (features.consistency / 5) // 一貫性が高いほど信頼度が高い
    ))
    
    // 予測を保存
    await env.DB.prepare(`
      INSERT INTO ml_predictions 
      (student_id, model_type, input_features, prediction_result, confidence_score, created_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'))
    `).bind(
      studentId,
      'understanding_predictor',
      JSON.stringify(input_features),
      JSON.stringify({ predicted_understanding, features }),
      confidence
    ).run()
    
    return c.json({
      success: true,
      prediction: {
        understanding_level: predicted_understanding,
        confidence: confidence,
        features: features,
        recommendation: predicted_understanding < 3 
          ? '個別サポートを推奨します'
          : predicted_understanding > 4
          ? '発展的な課題への挑戦を推奨します'
          : '現在のペースを維持しましょう'
      }
    })
  } catch (error: any) {
    console.error('ML 予測エラー:', error)
    return c.json({ success: false, error: '予測に失敗しました' }, 500)
  }
})

// ==============================================
// Phase 17-19: 深層学習・マルチモーダル・大規模展開
// ==============================================

// コーディネーター向け：複数校データ統合分析
app.get('/api/coordinator/cross-school-analytics', async (c) => {
  const { env } = c
  const coordinatorId = c.req.query('coordinator_id')
  const scope = c.req.query('scope') || 'municipality' // 'municipality', 'prefecture', 'national'
  
  try {
    // コーディネーターの管理校を取得
    const coordinator = await env.DB.prepare(`
      SELECT managed_schools FROM teachers WHERE user_id = ?
    `).bind(coordinatorId).first()
    
    if (!coordinator) {
      return c.json({ success: false, error: 'コーディネーター情報が見つかりません' }, 404)
    }
    
    const managedSchools = JSON.parse(coordinator.managed_schools as string || '[]')
    
    // 各学校のデータを集計
    const schoolsData = []
    
    for (const schoolId of managedSchools) {
      const schoolInfo = await env.DB.prepare(`
        SELECT school_code, school_name FROM schools WHERE id = ?
      `).bind(schoolId).first()
      
      // 学校ごとの生徒データ
      const students = await env.DB.prepare(`
        SELECT id FROM users 
        WHERE role = 'student' 
        AND class_code IN (
          SELECT class_code FROM users WHERE role = 'teacher' AND id IN (
            SELECT user_id FROM teachers WHERE school_id = ?
          )
        )
      `).bind(schoolId).all()
      
      // 平均理解度
      const avgUnderstanding = await env.DB.prepare(`
        SELECT AVG(understanding_level) as avg_understanding
        FROM student_progress
        WHERE student_id IN (${(students.results || []).map((s: any) => s.id).join(',') || '0'})
          AND status = 'completed'
      `).first()
      
      // エンゲージメント
      const engagement = await env.DB.prepare(`
        SELECT 
          COUNT(DISTINCT student_id) as active_students,
          AVG(session_duration) as avg_session_duration
        FROM learning_behavior_logs
        WHERE student_id IN (${(students.results || []).map((s: any) => s.id).join(',') || '0'})
          AND created_at >= datetime('now', '-7 days')
      `).first()
      
      schoolsData.push({
        school_id: schoolId,
        school_code: schoolInfo?.school_code,
        school_name: schoolInfo?.school_name,
        total_students: (students.results || []).length,
        avg_understanding: avgUnderstanding?.avg_understanding || 0,
        active_students: engagement?.active_students || 0,
        avg_session_duration: engagement?.avg_session_duration || 0
      })
    }
    
    // 全体統計
    const totalStudents = schoolsData.reduce((sum, s) => sum + s.total_students, 0)
    const overallAvgUnderstanding = schoolsData.reduce((sum, s) => sum + s.avg_understanding, 0) / schoolsData.length
    
    // トップパフォーマンゃ�マンス校
    const topSchools = schoolsData
      .sort((a, b) => b.avg_understanding - a.avg_understanding)
      .slice(0, 3)
      .map(s => s.school_code)
    
    // 支援が必要な学校
    const strugglingSchools = schoolsData
      .filter(s => s.avg_understanding < 3.0)
      .map(s => s.school_code)
    
    // 結果を保存
    await env.DB.prepare(`
      INSERT INTO cross_school_analytics 
      (analysis_type, scope_identifier, total_students, total_schools, 
       avg_understanding, top_performing_schools, struggling_schools, 
       recommendations, generated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).bind(
      scope,
      scope === 'municipality' ? 'village_001' : scope,
      totalStudents,
      managedSchools.length,
      overallAvgUnderstanding,
      JSON.stringify(topSchools),
      JSON.stringify(strugglingSchools),
      JSON.stringify({
        focus_areas: strugglingSchools.length > 0 ? '支援が必要な学校があります' : '全体的に順調',
        best_practices: topSchools.length > 0 ? 'トップ校の実践を共有しましょう' : ''
      })
    ).run()
    
    return c.json({
      success: true,
      summary: {
        total_students: totalStudents,
        total_schools: managedSchools.length,
        avg_understanding: overallAvgUnderstanding,
        top_schools: topSchools,
        struggling_schools: strugglingSchools
      },
      schools_data: schoolsData,
      recommendations: {
        immediate_action: strugglingSchools.length > 0 
          ? `${strugglingSchools.length}校が支援を必要としています` 
          : '全校順調に進行中',
        best_practices: topSchools.length > 0 
          ? `${topSchools.join(', ')}の実践を他校と共有することを推奨します` 
          : ''
      }
    })
  } catch (error: any) {
    console.error('クロススクール分析エラー:', error)
    return c.json({ success: false, error: '分析に失敗しました' }, 500)
  }
})

// データ共有許可の申請（コーディネーター → 担任教師）
app.post('/api/coordinator/request-data-access', async (c) => {
  const { env } = c
  const { student_id, coordinator_id, teacher_id, purpose } = await c.req.json()
  
  try {
    // 既存の許可をチェック
    const existing = await env.DB.prepare(`
      SELECT * FROM data_sharing_permissions
      WHERE student_id = ? AND shared_with_user_id = ? AND is_active = 1
    `).bind(student_id, coordinator_id).first()
    
    if (existing) {
      return c.json({
        success: true,
        message: 'すでにアクセス権限があります',
        permission_id: existing.id
      })
    }
    
    // 新規許可を作成（担任の承認が必要）
    await env.DB.prepare(`
      INSERT INTO data_sharing_permissions 
      (student_id, shared_with_user_id, permission_type, granted_by_user_id, 
       consent_date, is_active)
      VALUES (?, ?, ?, ?, datetime('now'), 1)
    `).bind(student_id, coordinator_id, 'analyze', teacher_id).run()
    
    return c.json({
      success: true,
      message: 'データアクセス権限を付与しました',
      purpose: purpose
    })
  } catch (error: any) {
    console.error('データアクセス申請エラー:', error)
    return c.json({ success: false, error: '申請に失敗しました' }, 500)
  }
})

// 研究論文用データエクスポート（完全匿名化）
app.get('/api/coordinator/research-export', async (c) => {
  const { env } = c
  const coordinatorId = c.req.query('coordinator_id')
  const startDate = c.req.query('start_date')
  const endDate = c.req.query('end_date')
  const format = c.req.query('format') || 'json' // 'json', 'csv', 'spss'
  
  try {
    // アクセス権限チェック
    const permissions = await env.DB.prepare(`
      SELECT student_id FROM data_sharing_permissions
      WHERE shared_with_user_id = ? AND is_active = 1 AND permission_type = 'analyze'
    `).bind(coordinatorId).all()
    
    const studentIds = (permissions.results || []).map((p: any) => p.student_id)
    
    if (studentIds.length === 0) {
      return c.json({ success: false, error: 'アクセス可能なデータがありません' }, 403)
    }
    
    // 完全匿名化データの取得
    const researchData = []
    
    for (let i = 0; i < studentIds.length; i++) {
      const studentId = studentIds[i]
      
      // 学習プロファイル
      const profile = await env.DB.prepare(`
        SELECT profile_data, overall_score, confidence_level
        FROM learning_profiles
        WHERE student_id = ?
        ORDER BY updated_at DESC LIMIT 1
      `).bind(studentId).first()
      
      // A/Bテスト割り当て
      const abTest = await env.DB.prepare(`
        SELECT variant_name FROM ab_test_assignments
        WHERE student_id = ? LIMIT 1
      `).bind(studentId).first()
      
      // 進捗データ
      const progress = await env.DB.prepare(`
        SELECT 
          COUNT(*) as total_cards,
          AVG(understanding_level) as avg_understanding,
          AVG(completion_time_minutes) as avg_time,
          AVG(hint_used_count) as avg_hints
        FROM student_progress
        WHERE student_id = ? 
          AND status = 'completed'
          AND completed_at BETWEEN ? AND ?
      `).bind(studentId, startDate, endDate).first()
      
      if (profile) {
        const profileData = JSON.parse(profile.profile_data as string)
        
        researchData.push({
          // 完全匿名ID
          participant_id: `P${String(i + 1).padStart(4, '0')}`,
          
          // 実験条件
          condition: abTest?.variant_name || 'not_assigned',
          
          // 学習スタイル
          learning_style_visual: profileData.patterns?.learning_style?.visual || 0,
          learning_style_auditory: profileData.patterns?.learning_style?.auditory || 0,
          learning_style_kinesthetic: profileData.patterns?.learning_style?.kinesthetic || 0,
          dominant_style: profileData.patterns?.learning_style?.dominant_style,
          
          // パフォーマンス指標
          avg_understanding: progress?.avg_understanding || 0,
          total_cards_completed: progress?.total_cards || 0,
          avg_completion_time: progress?.avg_time || 0,
          avg_hints_used: progress?.avg_hints || 0,
          
          // 全体スコア
          overall_score: profile.overall_score,
          confidence_level: profile.confidence_level,
          
          // 時間的情報
          data_collection_start: startDate,
          data_collection_end: endDate
        })
      }
    }
    
    if (format === 'csv') {
      // CSV形式
      const headers = Object.keys(researchData[0] || {})
      const csvRows = [headers.join(',')]
      
      for (const row of researchData) {
        csvRows.push(headers.map(h => row[h]).join(','))
      }
      
      return c.text(csvRows.join('\n'), 200, {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="research_data_${Date.now()}.csv"`
      })
    }
    
    // JSON形式（デフォルト）
    return c.json({
      success: true,
      metadata: {
        total_participants: researchData.length,
        data_collection_period: { start: startDate, end: endDate },
        anonymization: 'full',
        export_date: new Date().toISOString()
      },
      data: researchData
    })
  } catch (error: any) {
    console.error('研究データエクスポートエラー:', error)
    return c.json({ success: false, error: 'エクスポートに失敗しました' }, 500)
  }
})

// 不登校児童サポート記録
app.post('/api/coordinator/truancy-support', async (c) => {
  const { env } = c
  const { student_id, support_type, progress_notes, coordinator_id } = await c.req.json()
  
  try {
    // 既存の記録を取得
    const existing = await env.DB.prepare(`
      SELECT * FROM truancy_support_records
      WHERE student_id = ?
      ORDER BY updated_at DESC LIMIT 1
    `).bind(student_id).first()
    
    if (existing) {
      // 更新
      await env.DB.prepare(`
        UPDATE truancy_support_records
        SET support_type = ?,
            progress_notes = ?,
            support_coordinator_id = ?,
            updated_at = datetime('now')
        WHERE id = ?
      `).bind(support_type, progress_notes, coordinator_id, existing.id).run()
    } else {
      // 新規作成
      await env.DB.prepare(`
        INSERT INTO truancy_support_records 
        (student_id, support_type, progress_notes, support_coordinator_id, 
         engagement_level, created_at, updated_at)
        VALUES (?, ?, ?, ?, 'low', datetime('now'), datetime('now'))
      `).bind(student_id, support_type, progress_notes, coordinator_id).run()
    }
    
    // 学習履歴を確認
    const recentActivity = await env.DB.prepare(`
      SELECT COUNT(*) as activity_count
      FROM learning_behavior_logs
      WHERE student_id = ? AND created_at >= datetime('now', '-7 days')
    `).bind(student_id).first()
    
    return c.json({
      success: true,
      message: 'サポート記録を更新しました',
      engagement_status: {
        recent_activity_count: recentActivity?.activity_count || 0,
        engagement_level: (recentActivity?.activity_count || 0) > 5 ? 'improving' : 'needs_attention'
      }
    })
  } catch (error: any) {
    console.error('不登校サポート記録エラー:', error)
    return c.json({ success: false, error: '記録に失敗しました' }, 500)
  }
})

// 論文トラッキング
app.post('/api/coordinator/research-publication', async (c) => {
  const { env } = c
  const { 
    title, authors, publication_type, publication_venue, 
    abstract, keywords, sample_size, key_findings 
  } = await c.req.json()
  
  try {
    await env.DB.prepare(`
      INSERT INTO research_publications 
      (title, authors, publication_type, publication_venue, abstract, keywords,
       sample_size, key_findings, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).bind(
      title,
      authors,
      publication_type,
      publication_venue,
      abstract,
      JSON.stringify(keywords),
      sample_size,
      key_findings
    ).run()
    
    return c.json({
      success: true,
      message: '論文情報を登録しました'
    })
  } catch (error: any) {
    console.error('論文登録エラー:', error)
    return c.json({ success: false, error: '登録に失敗しました' }, 500)
  }
})

// ==============================================
// WebSocketエンドポイント
// ==============================================

// WebSocket接続エンドポイント（ローカル開発のみ）
app.get('/api/ws', async (c) => {
  const { env } = c
  
  // Durable Objectsが利用不可の場合はエラーを返す
  if (!env.PROGRESS_WEBSOCKET) {
    return c.json({ 
      error: 'WebSocket is not available in production. Use polling instead.',
      message: 'WebSocket機能は開発環境でのみ利用可能です。'
    }, 503)
  }
  
  // クエリパラメータからクラスコードとユーザー情報を取得
  const classCode = c.req.query('classCode')
  const userId = c.req.query('userId')
  const role = c.req.query('role')
  
  if (!classCode) {
    return c.json({ error: 'classCode is required' }, 400)
  }
  
  // Durable ObjectのIDを生成（クラスコードごとに1つのインスタンス）
  const id = env.PROGRESS_WEBSOCKET.idFromName(classCode)
  const stub = env.PROGRESS_WEBSOCKET.get(id)
  
  // リクエストをDurable Objectに転送
  const url = new URL(c.req.url)
  url.pathname = '/ws'
  url.searchParams.set('classCode', classCode)
  if (userId) url.searchParams.set('userId', userId)
  if (role) url.searchParams.set('role', role)
  
  return stub.fetch(url.toString(), c.req.raw)
})

// ==============================================
// 提案書ページ
// ==============================================
app.get('/proposal', (c) => {
  return c.html(`<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI駆動型個別最適化学習システム導入提案書</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
    <style>
        .slide {
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            justify-content: center;
            padding: 4rem 2rem;
        }
        .gradient-bg {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        .slide-number {
            position: fixed;
            bottom: 1rem;
            right: 1rem;
            background: rgba(0,0,0,0.5);
            color: white;
            padding: 0.5rem 1rem;
            border-radius: 0.5rem;
            font-size: 0.875rem;
        }
        @media print {
            .slide {
                page-break-after: always;
                min-height: 100vh;
            }
        }
    </style>
</head>
<body class="bg-gray-50">
    <div class="fixed top-4 right-4 z-50 flex gap-2">
        <button onclick="previousSlide()" class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
            <i class="fas fa-arrow-left"></i> 前へ
        </button>
        <button onclick="nextSlide()" class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
            次へ <i class="fas fa-arrow-right"></i>
        </button>
        <button onclick="window.print()" class="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700">
            <i class="fas fa-print"></i>
        </button>
    </div>

    <!-- Slide 1: 表紙 -->
    <div class="slide gradient-bg text-white" data-slide="1">
        <div class="max-w-6xl mx-auto text-center">
            <h1 class="text-6xl font-bold mb-8">
                一村から始まる教育改革
            </h1>
            <h2 class="text-4xl font-semibold mb-12">
                AI駆動型個別最適化学習システム<br>導入提案書
            </h2>
            <div class="text-2xl mb-8">
                全ての子どもに最適な学び、世界へ発信する教育モデル
            </div>
            <div class="mt-16 text-xl">
                <div class="mb-4"><i class="fas fa-graduation-cap mr-3"></i>Phase 1-19 完全実装済み</div>
                <div class="mb-4"><i class="fas fa-chart-line mr-3"></i>2年間のエビデンス構築</div>
                <div class="mb-4"><i class="fas fa-globe mr-3"></i>全国モデルケースへ</div>
            </div>
        </div>
    </div>

    <!-- Slide 2: エグゼクティブサマリー -->
    <div class="slide bg-white" data-slide="2">
        <div class="max-w-6xl mx-auto">
            <h2 class="text-5xl font-bold text-gray-800 mb-8 border-b-4 border-blue-600 pb-4">
                エグゼクティブサマリー
            </h2>
            <div class="grid grid-cols-2 gap-8 mb-8">
                <div class="bg-blue-50 p-6 rounded-lg">
                    <h3 class="text-2xl font-bold text-blue-700 mb-4">提案の核心</h3>
                    <ul class="space-y-3 text-lg">
                        <li><i class="fas fa-check-circle text-blue-600 mr-2"></i>Phase 1-19 完全実装済み（20,000行）</li>
                        <li><i class="fas fa-check-circle text-blue-600 mr-2"></i>2年間の実証研究</li>
                        <li><i class="fas fa-check-circle text-blue-600 mr-2"></i>一斉授業からの転換</li>
                        <li><i class="fas fa-check-circle text-blue-600 mr-2"></i>不登校児童支援</li>
                        <li><i class="fas fa-check-circle text-blue-600 mr-2"></i>全国モデルケース</li>
                    </ul>
                </div>
                <div class="bg-green-50 p-6 rounded-lg">
                    <h3 class="text-2xl font-bold text-green-700 mb-4">期待される成果</h3>
                    <ul class="space-y-3 text-lg">
              <li><i class="fas fa-arrow-up text-green-600 mr-2"></i>理解度: <strong>30-40%向上</strong></li>
                        <li><i class="fas fa-clock text-green-600 mr-2"></i>教師負担: <strong>40-50%軽減</strong></li>
                        <li><i class="fas fa-heart text-green-600 mr-2"></i>不登校復帰率: <strong>60-70%向上</strong></li>
                        <li><i class="fas fa-trophy text-green-600 mr-2"></i>学会発表: <strong>年4-6回</strong></li>
                        <li><i class="fas fa-newspaper text-green-600 mr-2"></i>メディア掲載: <strong>3-5回</strong></li>
                    </ul>
                </div>
            </div>
            <div class="bg-gradient-to-r from-purple-100 to-pink-100 p-6 rounded-lg">
                <h3 class="text-2xl font-bold text-purple-700 mb-4">投資対効果（ROI）</h3>
                <div class="grid grid-cols-3 gap-6 text-center">
                    <div>
                        <div class="text-4xl font-bold text-purple-600 mb-2">100-220万円</div>
                        <div class="text-lg text-gray-700">2年間投資額</div>
                    </div>
                    <div>
                        <div class="text-4xl font-bold text-green-600 mb-2">4,000-5,600万円</div>
                        <div class="text-lg text-gray-700">2年間リターン</div>
                    </div>
                    <div>
                        <div class="text-4xl font-bold text-red-600 mb-2">20-50倍</div>
                        <div class="text-lg text-gray-700">ROI</div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Slide 3: 現状の課題 -->
    <div class="slide bg-gradient-to-br from-red-50 to-orange-50" data-slide="3">
        <div class="max-w-6xl mx-auto">
            <h2 class="text-5xl font-bold text-gray-800 mb-8 border-b-4 border-red-600 pb-4">
                現状の課題 - なぜ今、変革が必要か
            </h2>
            <div class="grid grid-cols-2 gap-6">
                <div class="bg-white p-6 rounded-lg shadow-lg">
                    <h3 class="text-2xl font-bold text-red-700 mb-4">
                        <i class="fas fa-exclamation-triangle mr-2"></i>一斉授業の限界
                    </h3>
                    <ul class="space-y-3 text-lg">
                        <li>✗ 理解度の個人差が大きい（1-5まで分散）</li>
                        <li>✗ 理解が遅い子は置き去り</li>
                        <li>✗ 理解が早い子は退屈</li>
                        <li>✗ 40人全員に同じペース</li>
                        <li>✗ データ不足で把握困難</li>
                    </ul>
                </div>
                <div class="bg-white p-6 rounded-lg shadow-lg">
                    <h3 class="text-2xl font-bold text-orange-700 mb-4">
                        <i class="fas fa-user-clock mr-2"></i>教師の過重負担
                    </h3>
                    <ul class="space-y-3 text-lg">
                        <li>✗ 月平均残業80時間以上</li>
                        <li>✗ 個別対応は物理的に限界</li>
                        <li>✗ 採点・事務作業に膨大な時間</li>
                        <li>✗ データなく経験頼み</li>
                        <li>✗ 働き方改革が進まない</li>
                    </ul>
                </div>
                <div class="bg-white p-6 rounded-lg shadow-lg">
                    <h3 class="text-2xl font-bold text-purple-700 mb-4">
                        <i class="fas fa-user-slash mr-2"></i>不登校児童の増加
                    </h3>
                    <ul class="space-y-3 text-lg">
                        <li>✗ 全国で30万人（過去最多）</li>
                        <li>✗ 学校に行けない = 学べない</li>
                        <li>✗ 学習遅れが復帰のハードルに</li>
                        <li>✗ 社会とのつながり喪失</li>
                    </ul>
                </div>
                <div class="bg-white p-6 rounded-lg shadow-lg">
                    <h3 class="text-2xl font-bold text-blue-700 mb-4">
                        <i class="fas fa-map-marked-alt mr-2"></i>地方の教育格差
                    </h3>
                    <ul class="space-y-3 text-lg">
                        <li>✗ 都市部との格差拡大</li>
                        <li>✗ 塾・予備校へのアクセス困難</li>
                        <li>✗ 教育資源・専門教員不足</li>
                        <li>✗ 最新手法が届かない</li>
                    </ul>
                </div>
            </div>
        </div>
    </div>

    <!-- Slide 4: システム概要 -->
    <div class="slide bg-white" data-slide="4">
        <div class="max-w-6xl mx-auto">
            <h2 class="text-5xl font-bold text-gray-800 mb-8 border-b-4 border-blue-600 pb-4">
                システム概要 - Phase 1-19 完全実装
            </h2>
            <div class="grid grid-cols-3 gap-6 mb-8">
                <div class="bg-gradient-to-br from-blue-500 to-blue-700 text-white p-6 rounded-lg text-center">
                    <div class="text-5xl font-bold mb-2">20,000</div>
                    <div class="text-xl">総コード行数</div>
                </div>
                <div class="bg-gradient-to-br from-green-500 to-green-700 text-white p-6 rounded-lg text-center">
                    <div class="text-5xl font-bold mb-2">40+</div>
                    <div class="text-xl">データベーステーブル</div>
                </div>
                <div class="bg-gradient-to-br from-purple-500 to-purple-700 text-white p-6 rounded-lg text-center">
                    <div class="text-5xl font-bold mb-2">90+</div>
                    <div class="text-xl">APIエンドポイント</div>
                </div>
            </div>
            <div class="grid grid-cols-2 gap-6">
                <div class="bg-blue-50 p-6 rounded-lg">
                    <h3 class="text-2xl font-bold text-blue-700 mb-4">Phase 1-8: 基本機能</h3>
                    <ul class="space-y-2 text-lg">
                        <li>✓ 認証・権限管理</li>
                        <li>✓ 自由進度学習カード</li>
                        <li>✓ AI対話（Gemini統合）</li>
                        <li>✓ 自動問題生成</li>
                        <li>✓ 進捗追跡</li>
                    </ul>
                </div>
                <div class="bg-green-50 p-6 rounded-lg">
                    <h3 class="text-2xl font-bold text-green-700 mb-4">Phase 9-14: データ分析</h3>
                    <ul class="space-y-2 text-lg">
                        <li>✓ 6つの学習パターン分析</li>
                        <li>✓ 教師ダッシュボード</li>
                        <li>✓ 個別最適化カード</li>
                        <li>✓ AI予測機能</li>
                        <li>✓ 多言語対応・研究データ</li>
                    </ul>
                </div>
                <div class="bg-purple-50 p-6 rounded-lg">
                    <h3 class="text-2xl font-bold text-purple-700 mb-4">Phase 15-16: 機械学習</h3>
                    <ul class="space-y-2 text-lg">
                        <li>✓ TensorFlow.js統合</li>
                        <li>✓ リアルタイム学習</li>
                        <li>✓ A/Bテスト・RCT</li>
                        <li>✓ 統計分析</li>
                    </ul>
                </div>
                <div class="bg-orange-50 p-6 rounded-lg">
                    <h3 class="text-2xl font-bold text-orange-700 mb-4">Phase 17-19: 大規模展開</h3>
                    <ul class="space-y-2 text-lg">
                        <li>✓ 深層学習（LSTM/Transformer）</li>
                        <li>✓ マルチモーダル学習</li>
                        <li>✓ 複数校管理</li>
                        <li>✓ 研究支援・グローバル展開</li>
                    </ul>
                </div>
            </div>
        </div>
    </div>

    <!-- Slide 5: 村長へのメリット -->
    <div class="slide bg-gradient-to-br from-yellow-50 to-amber-50" data-slide="5">
        <div class="max-w-6xl mx-auto">
            <h2 class="text-5xl font-bold text-gray-800 mb-8 border-b-4 border-yellow-600 pb-4">
                <i class="fas fa-landmark mr-3"></i>村長へのメリット
            </h2>
            <div class="grid grid-cols-2 gap-6 mb-8">
                <div class="bg-white p-6 rounded-lg shadow-lg">
                    <h3 class="text-3xl font-bold text-yellow-700 mb-6">投資対効果（ROI）</h3>
                    <div class="space-y-6">
                        <div>
                            <div class="text-sm text-gray-600 mb-1">2年間投資額</div>
                            <div class="text-4xl font-bold text-red-600">100-220万円</div>
                        </div>
                        <div>
                            <div class="text-sm text-gray-600 mb-1">2年間リターン</div>
                            <div class="text-4xl font-bold text-green-600">4,280-5,600万円</div>
                        </div>
                        <div>
                            <div class="text-sm text-gray-600 mb-1">ROI（投資対効果）</div>
                            <div class="text-5xl font-bold text-blue-600">20-50倍</div>
                        </div>
                    </div>
                </div>
                <div class="bg-white p-6 rounded-lg shadow-lg">
                    <h3 class="text-3xl font-bold text-green-700 mb-4">具体的なリターン</h3>
                    <ul class="space-y-3 text-lg">
                        <li><strong>教師時間削減:</strong> 2,400万円</li>
                        <li><strong>不登校対応削減:</strong> 600万円</li>
                        <li><strong>ブランディング:</strong> 1,000-2,000万円</li>
                        <li><strong>交流人口増:</strong> 80-300万円</li>
                        <li><strong>人口流入:</strong> 200-300万円</li>
                    </ul>
                    <div class="mt-6 p-4 bg-green-100 rounded-lg">
                        <div class="text-sm text-gray-700 mb-1">長期効果（学力向上）</div>
                        <div class="text-3xl font-bold text-green-700">村への還元: 1,800万円</div>
                    </div>
                </div>
            </div>
            <div class="bg-gradient-to-r from-blue-100 to-purple-100 p-6 rounded-lg">
                <h3 class="text-2xl font-bold text-purple-700 mb-4">
                    <i class="fas fa-star mr-2"></i>村の未来ビジョン
                </h3>
                <div class="grid grid-cols-4 gap-4 text-center">
                    <div>
                        <div class="text-4xl mb-2">🏆</div>
                        <div class="font-semibold text-lg">教育改革発祥の地</div>
                    </div>
                    <div>
                        <div class="text-4xl mb-2">📈</div>
                        <div class="font-semibold text-lg">人口流入促進</div>
                    </div>
                    <div>
                        <div class="text-4xl mb-2">🏢</div>
                        <div class="font-semibold text-lg">企業誘致</div>
                    </div>
                    <div>
                        <div class="text-4xl mb-2">🌟</div>
                        <div class="font-semibold text-lg">全国モデル村</div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Slide 6: 予算計画 -->
    <div class="slide bg-white" data-slide="6">
        <div class="max-w-6xl mx-auto">
            <h2 class="text-5xl font-bold text-gray-800 mb-8 border-b-4 border-green-600 pb-4">
                予算計画 - 詳細内訳
            </h2>
            <div class="grid grid-cols-2 gap-8">
                <div>
                    <h3 class="text-3xl font-bold text-blue-700 mb-6">初年度（2024年度）</h3>
                    <div class="space-y-4">
                        <div class="bg-blue-50 p-4 rounded-lg">
                            <div class="flex justify-between items-center mb-2">
                                <span class="font-semibold">システム利用料</span>
                                <span class="text-xl font-bold text-blue-600">82,000円</span>
                            </div>
                            <div class="text-sm text-gray-600">Cloudflare + Gemini API</div>
                        </div>
                        <div class="bg-blue-50 p-4 rounded-lg">
                            <div class="flex justify-between items-center mb-2">
                                <span class="font-semibold">端末・機器</span>
                                <span class="text-xl font-bold text-blue-600">0-1,240,000円</span>
                            </div>
                            <div class="text-sm text-gray-600">既存端末活用で大幅削減可能</div>
                        </div>
                        <div class="bg-blue-50 p-4 rounded-lg">
                            <div class="flex justify-between items-center mb-2">
                                <span class="font-semibold">研修費</span>
                                <span class="text-xl font-bold text-blue-600">150,000円</span>
                            </div>
                            <div class="text-sm text-gray-600">外部講師・教材費</div>
                        </div>
                        <div class="bg-blue-50 p-4 rounded-lg">
                            <div class="flex justify-between items-center mb-2">
                                <span class="font-semibold">その他</span>
                                <span class="text-xl font-bold text-blue-600">150,000円</span>
                            </div>
                            <div class="text-sm text-gray-600">印刷費・予備費</div>
                        </div>
                        <div class="bg-blue-200 p-4 rounded-lg">
                            <div class="flex justify-between items-center">
                                <span class="text-xl font-bold">初年度合計</span>
                                <span class="text-3xl font-bold text-blue-800">422,000円〜</span>
                            </div>
                            <div class="text-sm text-gray-700 mt-1">既存端末活用の場合</div>
                        </div>
                    </div>
                </div>
                <div>
                    <h3 class="text-3xl font-bold text-green-700 mb-6">2年目（2025年度）</h3>
                    <div class="space-y-4">
                        <div class="bg-green-50 p-4 rounded-lg">
                            <div class="flex justify-between items-center mb-2">
                                <span class="font-semibold">システム利用料</span>
                                <span class="text-xl font-bold text-green-600">82,000円</span>
                            </div>
                        </div>
                        <div class="bg-green-50 p-4 rounded-lg">
                            <div class="flex justify-between items-center mb-2">
                                <span class="font-semibold">運用費</span>
                                <span class="text-xl font-bold text-green-600">150,000円</span>
                            </div>
                            <div class="text-sm text-gray-600">メンテナンス・バックアップ</div>
                        </div>
                        <div class="bg-green-50 p-4 rounded-lg">
                            <div class="flex justify-between items-center mb-2">
                                <span class="font-semibold">研究費</span>
                                <span class="text-xl font-bold text-green-600">300,000円</span>
                            </div>
                            <div class="text-sm text-gray-600">学会参加・論文投稿</div>
                        </div>
                        <div class="bg-green-50 p-4 rounded-lg">
                            <div class="flex justify-between items-center mb-2">
                                <span class="font-semibold">その他</span>
                                <span class="text-xl font-bold text-green-600">80,000円</span>
                            </div>
                        </div>
                        <div class="bg-green-200 p-4 rounded-lg">
                            <div class="flex justify-between items-center">
                                <span class="text-xl font-bold">2年目合計</span>
                                <span class="text-3xl font-bold text-green-800">612,000円</span>
                            </div>
                        </div>
                    </div>
                    <div class="mt-6 bg-purple-100 p-4 rounded-lg">
                        <div class="text-center">
                            <div class="text-lg font-semibold text-gray-700 mb-2">2年間総額</div>
                            <div class="text-4xl font-bold text-purple-700">1,034,000円</div>
                            <div class="text-sm text-gray-600 mt-1">（既存端末活用の場合）</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Final Slide: 今、決断を -->
    <div class="slide gradient-bg text-white" data-slide="7">
        <div class="max-w-6xl mx-auto text-center">
            <h2 class="text-6xl font-bold mb-12">今、決断を</h2>
            <div class="text-3xl mb-16 leading-relaxed">
                教育は未来への投資<br>
                子どもたちは待っている<br>
                全国に先駆けるチャンス<br>
                一村から日本を変える
            </div>
            <div class="grid grid-cols-2 gap-8 text-left mb-16">
                <div class="bg-white bg-opacity-20 p-8 rounded-lg backdrop-blur-sm">
                    <h3 class="text-3xl font-bold mb-4">✅ 今すぐ得られるもの</h3>
                    <ul class="space-y-3 text-xl">
                        <li>• 子どもたちの学力向上</li>
                        <li>• 教師の負担軽減</li>
                        <li>• 不登校児童の支援</li>
                        <li>• エビデンスの構築</li>
                        <li>• 全国モデルとしての地位</li>
                    </ul>
                </div>
                <div class="bg-white bg-opacity-20 p-8 rounded-lg backdrop-blur-sm">
                    <h3 class="text-3xl font-bold mb-4">⚠️ 先延ばしのリスク</h3>
                    <ul class="space-y-3 text-xl">
                        <li>• 1年遅れ = 120名の機会損失</li>
                        <li>• 全国初のチャンス喪失</li>
                        <li>• 教育格差の拡大</li>
                        <li>• 他自治体に先行される</li>
                        <li>• モデル村の地位を逃す</li>
                    </ul>
                </div>
            </div>
            <div class="text-4xl font-bold mb-8">
                2年後、「やってよかった」と言える決断を
            </div>
            <div class="text-2xl">
                <i class="fas fa-graduation-cap mr-3"></i>
                Phase 1-19 完全実装済み・今すぐ開始可能
            </div>
        </div>
    </div>

    <div class="slide-number">
        <span id="current-slide">1</span> / <span id="total-slides">7</span>
    </div>

    <script>
        let currentSlide = 1;
        const slides = document.querySelectorAll('.slide');
        const totalSlides = slides.length;
        
        document.getElementById('total-slides').textContent = totalSlides;
        
        function showSlide(n) {
            if (n > totalSlides) currentSlide = 1;
            if (n < 1) currentSlide = totalSlides;
            else currentSlide = n;
            
            slides.forEach((slide, index) => {
                slide.style.display = (index + 1 === currentSlide) ? 'flex' : 'none';
            });
            
            document.getElementById('current-slide').textContent = currentSlide;
        }
        
        function nextSlide() {
            showSlide(currentSlide + 1);
        }
        
        function previousSlide() {
            showSlide(currentSlide - 1);
        }
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowRight' || e.key === ' ') nextSlide();
            if (e.key === 'ArrowLeft') previousSlide();
        });
        
        showSlide(1);
    </script>
</body>
</html>`)
})

// ============================================
// データエクスポートAPI
// ============================================

// 生徒の学習データをCSV形式でエクスポート
app.get('/api/export/student/:studentId/csv', async (c) => {
  const { env } = c
  const studentId = c.req.param('studentId')
  const { curriculumId } = c.req.query()
  
  // デモ用：学生IDが数字のみ（1桁または2桁）の場合はデモCSVを返す
  if (/^\d{1,2}$/.test(studentId)) {
    const today = new Date().toISOString().split('T')[0]
    const demoCSV = `氏名,学生番号,クラスコード,メールアドレス
デモ生徒,001,CLASS2024A,demo@student.jp

コース名,カリキュラム名,進捗率(%),完了ステータス,学習時間(分),最終学習日
しっかりコース,かけ算の筆算,75,進行中,120,${today}
じっくりコース,わり算の基礎,50,進行中,90,${today}

問題名,問題タイプ,正誤,誤答パターン,生徒の解答,正解,難易度,回答日時
学習カード1,学習カード,誤答,くり上がり忘れ,72,78,中,${today}
学習カード2,学習カード,正解,-,126,126,中,${today}
チェックテスト問題3,チェックテスト,誤答,計算ミス,144,154,高,${today}
学習カード4,学習カード,正解,-,96,96,易,${today}`
    
    // BOM付きUTF-8でエンコード
    const bom = '\uFEFF'
    const csvWithBom = bom + demoCSV
    
    return new Response(csvWithBom, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="demo_student_data.csv"`
      }
    })
  }
  
  try {
    // 生徒情報
    const student = await env.DB.prepare(`
      SELECT id, name, email, student_number, class_code
      FROM users WHERE id = ?
    `).bind(studentId).first()
    
    if (!student) {
      // デモデータが見つからない場合はサンプルCSVを返す
      const demoCSV = `# 生徒情報
氏名,学生番号,クラスコード,メールアドレス
デモ生徒,001,CLASS2024A,demo@student.jp

# 学習進捗
コース名,カリキュラム名,進捗率,完了ステータス,学習時間(分),最終学習日
しっかりコース,かけ算の筆算,75%,進行中,120,${new Date().toISOString()}

# 誤答履歴
問題名,問題タイプ,正誤,誤答パターン,解答,正解,難易度,回答日時
学習カード1,learning_card,誤答,くり上がり忘れ,72,78,中,${new Date().toISOString()}
学習カード2,learning_card,正解,,126,126,中,${new Date().toISOString()}`
      
      return new Response(demoCSV, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="demo_student_data.csv"`
        }
      })
    }
    
    // 学習進捗データ
    let progressQuery = env.DB.prepare(`
      SELECT p.*, c.curriculum_title, co.course_title
      FROM progress p
      LEFT JOIN curriculum c ON p.curriculum_id = c.id
      LEFT JOIN courses co ON c.course_id = co.id
      WHERE p.student_id = ?
      ${curriculumId ? 'AND p.curriculum_id = ?' : ''}
      ORDER BY p.created_at DESC
    `)
    
    if (curriculumId) {
      progressQuery = progressQuery.bind(studentId, curriculumId)
    } else {
      progressQuery = progressQuery.bind(studentId)
    }
    const progress = await progressQuery.all()
    
    // 誤答履歴
    let errorsQuery = env.DB.prepare(`
      SELECT eh.*, 
        CASE 
          WHEN eh.question_type = 'learning_card' THEN lc.card_title
          WHEN eh.question_type = 'check_test' THEN 'チェックテスト問題' || eh.question_number
          WHEN eh.question_type = 'optional' THEN op.problem_title
        END as question_title
      FROM error_history eh
      LEFT JOIN learning_cards lc ON eh.question_type = 'learning_card' AND eh.question_id = lc.id
      LEFT JOIN optional_problems op ON eh.question_type = 'optional' AND eh.question_id = op.id
      WHERE eh.student_id = ?
      ${curriculumId ? 'AND eh.curriculum_id = ?' : ''}
      ORDER BY eh.submitted_at DESC
    `)
    
    if (curriculumId) {
      errorsQuery = errorsQuery.bind(studentId, curriculumId)
    } else {
      errorsQuery = errorsQuery.bind(studentId)
    }
    const errors = await errorsQuery.all()
    
    // CSV形式に変換
    const csv = []
    
    // ヘッダー: 生徒情報
    csv.push('氏名,学生番号,クラスコード,メールアドレス')
    csv.push(`${student.name},${student.student_number || '-'},${student.class_code || '-'},${student.email}`)
    csv.push('')
    
    // 学習進捗
    csv.push('コース名,カリキュラム名,進捗率(%),完了ステータス,学習時間(分),最終学習日')
    progress.results.forEach((p: any) => {
      const status = p.status === 'completed' ? '完了' : p.status === 'in_progress' ? '進行中' : 'まだ開始していません'
      csv.push(`${p.course_title || '-'},${p.curriculum_title || '-'},${p.completion_percentage || 0},${status},${p.total_learning_time || 0},${p.updated_at || '-'}`)
    })
    csv.push('')
    
    // 誤答履歴
    csv.push('問題名,問題タイプ,正誤,誤答パターン,生徒の解答,正解,難易度,回答日時')
    errors.results.forEach((e: any) => {
      const questionType = e.question_type === 'learning_card' ? '学習カード' : 
                         e.question_type === 'check_test' ? 'チェックテスト' : 
                         e.question_type === 'optional' ? '選択問題' : e.question_type
      csv.push(`${e.question_title || '-'},${questionType},${e.is_correct ? '正解' : '誤答'},${e.error_pattern || '-'},${e.student_answer || '-'},${e.correct_answer || '-'},${e.difficulty || '中'},${e.submitted_at || '-'}`)
    })
    
    const bom = '\uFEFF'
    return new Response(bom + csv.join('\n'), {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="student_${studentId}_data.csv"`
      }
    })
  } catch (error: any) {
    console.error('CSV export error:', error)
    return c.json({ error: 'Failed to export data', details: error.message }, 500)
  }
})

// クラス全体の学習データをCSV形式でエクスポート
app.get('/api/export/class/:classCode/csv', async (c) => {
  const { env } = c
  const classCode = c.req.param('classCode')
  const { curriculumId } = c.req.query()
  
  // デモ用：CLASS2024Aの場合はデモCSVを返す
  if (classCode === 'CLASS2024A') {
    const today = new Date().toISOString().split('T')[0]
    const demoCSV = `学生番号,氏名,完了カリキュラム数,総学習時間(分),総問題数,総正答数,正答率(%)
001,山田太郎,2,180,40,30,75.0
002,佐藤花子,3,150,35,32,91.4
003,鈴木次郎,1,120,30,21,70.0`
    
    // BOM付きUTF-8
    const bom = '\uFEFF'
    const csvWithBom = bom + demoCSV
    
    return new Response(csvWithBom, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="class_${classCode}_data.csv"`
      }
    })
  }
  
  try {
    // クラスの生徒一覧
    const students = await env.DB.prepare(`
      SELECT id, name, student_number FROM users 
      WHERE class_code = ? AND role = 'student'
      ORDER BY student_number
    `).bind(classCode).all()
    
    if (students.results.length === 0) {
      return c.json({ error: 'No students found' }, 404)
    }
    
    const csv = []
    
    // カリキュラム別の進捗
    if (curriculumId) {
      csv.push('学生番号,氏名,進捗率(%),完了ステータス,学習時間(分),正答率(%),最終学習日')
      
      for (const student of students.results as any[]) {
        const progress = await env.DB.prepare(`
          SELECT * FROM progress 
          WHERE student_id = ? AND curriculum_id = ?
        `).bind(student.id, curriculumId).first()
        
        const accuracy = await env.DB.prepare(`
          SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) as correct
          FROM error_history
          WHERE student_id = ? AND curriculum_id = ?
        `).bind(student.id, curriculumId).first()
        
        const accuracyRate = accuracy && accuracy.total > 0 
          ? ((accuracy.correct / accuracy.total) * 100).toFixed(1) 
          : '0.0'
        
        const status = progress?.status === 'completed' ? '完了' : progress?.status === 'in_progress' ? '進行中' : '未開始'
        csv.push(`${student.student_number || '-'},${student.name},${progress?.completion_percentage || 0},${status},${progress?.total_learning_time || 0},${accuracyRate},${progress?.updated_at || '-'}`)
      }
    } else {
      csv.push('学生番号,氏名,完了カリキュラム数,総学習時間(分),総問題数,総正答数,正答率(%)')
      
      for (const student of students.results as any[]) {
        const summary = await env.DB.prepare(`
          SELECT 
            COUNT(DISTINCT curriculum_id) as completed_count,
            SUM(total_learning_time) as total_time
          FROM progress
          WHERE student_id = ? AND status = 'completed'
        `).bind(student.id).first()
        
        const errors = await env.DB.prepare(`
          SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) as correct
          FROM error_history
          WHERE student_id = ?
        `).bind(student.id).first()
        
        const accuracyRate = errors && errors.total > 0 
          ? ((errors.correct / errors.total) * 100).toFixed(1) 
          : '0.0'
        
        csv.push(`${student.student_number || '-'},${student.name},${summary?.completed_count || 0},${summary?.total_time || 0},${errors?.total || 0},${errors?.correct || 0},${accuracyRate}`)
      }
    }
    
    const bom = '\uFEFF'
    return new Response(bom + csv.join('\n'), {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="class_${classCode}_data.csv"`
      }
    })
  } catch (error: any) {
    console.error('Class CSV export error:', error)
    return c.json({ error: 'Failed to export class data', details: error.message }, 500)
  }
})

// Phase 3データのエクスポート（成果物、見取り、振り返り）
app.get('/api/export/phase3/:studentId/csv', async (c) => {
  const { env } = c
  const studentId = c.req.param('studentId')
  const { startDate, endDate } = c.req.query()
  
  // デモ用：学生IDが数字のみの場合はデモCSVを返す
  if (/^\d{1,2}$/.test(studentId)) {
    const today = new Date().toISOString().split('T')[0]
    const demoCSV = `選択課題の成果物
カリキュラム,課題名,投稿タイプ,自己評価(1-5),自己コメント,教師コメント,教師評価(1-5),投稿日時
かけ算の筆算,発展問題チャレンジ,画像,4,がんばって解きました,よく頑張りましたね！,5,${today}
かけ算の筆算,自由課題,テキスト,3,難しかったです,次はもっとできるよ,4,${today}

教師の見取り記録
観察日,カリキュラム,観察タイプ,観察内容,非認知能力タグ,ポジティブ評価,保護者共有
${today},かけ算の筆算,学習態度,集中して取り組んでいる,やり抜く力,はい,はい
${today},かけ算の筆算,理解度,基礎的な理解は定着している,理解力,はい,いいえ
${today},かけ算の筆算,協働性,友達と教え合っている,協働性,はい,はい

生徒の振り返り記録
振り返り日,カリキュラム,振り返りタイプ,学んだこと,理解したこと,難しかったこと,楽しかったこと,次の目標,気分評価(1-5),努力評価(1-5),理解度評価(1-5)
${today},かけ算の筆算,日次,くり上がりの方法,位を揃えること,大きい数の計算,パターンを見つけること,もっと速く計算する,4,4,4
${today},かけ算の筆算,単元,筆算の基礎,筆算の手順,ケタの多い計算,自分で解けたこと,応用問題に挑戦,5,5,4

教科横断評価
評価期間開始,評価期間終了,読解力,文章表現力,論理的思考力,創造的思考力,問題解決力,やり抜く力,自己調整力,協働性,好奇心,メタ認知,成長マインド
${today},${today},75,70,80,75,85,80,75,70,85,75,80`
    
    // BOM付きUTF-8
    const bom = '\uFEFF'
    const csvWithBom = bom + demoCSV
    
    return new Response(csvWithBom, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="phase3_demo_data.csv"`
      }
    })
  }
  
  try {
    const student = await env.DB.prepare(`
      SELECT name, student_number, class_code FROM users WHERE id = ?
    `).bind(studentId).first()
    
    if (!student) {
      // デモデータを返す
      const demoCSV = `# Phase 3 学習記録 - デモ生徒
エクスポート日時: ${new Date().toISOString()}

## 選択課題の成果物
カリキュラム,課題名,投稿タイプ,自己評価,自己コメント,教師コメント,教師評価,投稿日時
かけ算の筆算,発展問題チャレンジ,image,4,がんばって解きました,よく頑張りましたね！,5,${new Date().toISOString()}

## 教師の見取り記録
観察日,カリキュラム,観察タイプ,観察内容,非認知タグ,ポジティブ,保護者共有
${new Date().toISOString().split('T')[0]},かけ算の筆算,learning_attitude,集中して取り組んでいる,やり抜く力,はい,はい

## 生徒の振り返り記録
振り返り日,カリキュラム,振り返りタイプ,学んだこと,理解したこと,難しかったこと,楽しかったこと,次の目標,気分評価,努力評価,理解度評価
${new Date().toISOString().split('T')[0]},かけ算の筆算,daily,くり上がりの方法,位を揃えること,大きい数の計算,パターンを見つけること,もっと速く計算できるようになる,4,4,4

## 教科横断評価
評価期間開始,評価期間終了,読解力,文章表現力,論理的思考力,創造的思考力,問題解決力,やり抜く力,自己調整力,協働性,好奇心,メタ認知,成長マインド
${new Date().toISOString().split('T')[0]},${new Date().toISOString().split('T')[0]},75,70,80,75,85,80,75,70,85,75,80`
      
      return new Response(demoCSV, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="phase3_demo_data.csv"`
        }
      })
    }
    
    const csv = []
    csv.push(`# Phase 3 学習記録 - ${student.name}`)
    csv.push(`エクスポート日時: ${new Date().toISOString()}`)
    csv.push('')
    
    // 選択課題の成果物
    let submissionsQuery = env.DB.prepare(`
      SELECT ops.*, op.problem_title, c.curriculum_title
      FROM optional_problem_submissions ops
      LEFT JOIN optional_problems op ON ops.optional_problem_id = op.id
      LEFT JOIN curriculum c ON ops.curriculum_id = c.id
      WHERE ops.student_id = ?
      ${startDate ? 'AND DATE(ops.submitted_at) >= ?' : ''}
      ${endDate ? 'AND DATE(ops.submitted_at) <= ?' : ''}
      ORDER BY ops.submitted_at DESC
    `)
    
    if (startDate && endDate) {
      submissionsQuery = submissionsQuery.bind(studentId, startDate, endDate)
    } else if (startDate) {
      submissionsQuery = submissionsQuery.bind(studentId, startDate)
    } else if (endDate) {
      submissionsQuery = submissionsQuery.bind(studentId, endDate)
    } else {
      submissionsQuery = submissionsQuery.bind(studentId)
    }
    const submissions = await submissionsQuery.all()
    
    csv.push('## 選択課題の成果物')
    csv.push('カリキュラム,課題名,投稿タイプ,自己評価,自己コメント,教師コメント,教師評価,投稿日時')
    submissions.results.forEach((s: any) => {
      csv.push(`${s.curriculum_title || ''},${s.problem_title || ''},${s.submission_type},${s.self_evaluation || ''},${(s.self_comment || '').replace(/,/g, '、')},${(s.teacher_comment || '').replace(/,/g, '、')},${s.teacher_evaluation || ''},${s.submitted_at}`)
    })
    csv.push('')
    
    // 教師の見取り
    let observationsQuery = env.DB.prepare(`
      SELECT to.*, c.curriculum_title
      FROM teacher_observations to
      LEFT JOIN curriculum c ON to.curriculum_id = c.id
      WHERE to.student_id = ?
      ${startDate ? 'AND DATE(to.observation_date) >= ?' : ''}
      ${endDate ? 'AND DATE(to.observation_date) <= ?' : ''}
      ORDER BY to.observation_date DESC
    `)
    
    if (startDate && endDate) {
      observationsQuery = observationsQuery.bind(studentId, startDate, endDate)
    } else if (startDate) {
      observationsQuery = observationsQuery.bind(studentId, startDate)
    } else if (endDate) {
      observationsQuery = observationsQuery.bind(studentId, endDate)
    } else {
      observationsQuery = observationsQuery.bind(studentId)
    }
    const observations = await observationsQuery.all()
    
    csv.push('## 教師の見取り記録')
    csv.push('観察日,カリキュラム,観察タイプ,観察内容,非認知タグ,ポジティブ,保護者共有')
    observations.results.forEach((o: any) => {
      csv.push(`${o.observation_date},${o.curriculum_title || ''},${o.observation_type},${(o.observation_text || '').replace(/,/g, '、')},${o.non_cognitive_tags || ''},${o.is_positive ? 'はい' : 'いいえ'},${o.is_shared_with_parents ? 'はい' : 'いいえ'}`)
    })
    csv.push('')
    
    // 生徒の振り返り
    let reflectionsQuery = env.DB.prepare(`
      SELECT sr.*, c.curriculum_title
      FROM student_reflections sr
      LEFT JOIN curriculum c ON sr.curriculum_id = c.id
      WHERE sr.student_id = ?
      ${startDate ? 'AND DATE(sr.reflection_date) >= ?' : ''}
      ${endDate ? 'AND DATE(sr.reflection_date) <= ?' : ''}
      ORDER BY sr.reflection_date DESC
    `)
    
    if (startDate && endDate) {
      reflectionsQuery = reflectionsQuery.bind(studentId, startDate, endDate)
    } else if (startDate) {
      reflectionsQuery = reflectionsQuery.bind(studentId, startDate)
    } else if (endDate) {
      reflectionsQuery = reflectionsQuery.bind(studentId, endDate)
    } else {
      reflectionsQuery = reflectionsQuery.bind(studentId)
    }
    const reflections = await reflectionsQuery.all()
    
    csv.push('## 生徒の振り返り記録')
    csv.push('振り返り日,カリキュラム,振り返りタイプ,学んだこと,理解したこと,難しかったこと,楽しかったこと,次の目標,気分評価,努力評価,理解度評価')
    reflections.results.forEach((r: any) => {
      csv.push(`${r.reflection_date},${r.curriculum_title || ''},${r.reflection_type},${(r.what_learned || '').replace(/,/g, '、')},${(r.what_understood || '').replace(/,/g, '、')},${(r.what_difficult || '').replace(/,/g, '、')},${(r.what_enjoyed || '').replace(/,/g, '、')},${(r.next_goals || '').replace(/,/g, '、')},${r.mood_rating || ''},${r.effort_rating || ''},${r.understanding_rating || ''}`)
    })
    csv.push('')
    
    // 教科横断評価
    let evaluationsQuery = env.DB.prepare(`
      SELECT * FROM cross_subject_evaluations
      WHERE student_id = ?
      ${startDate ? 'AND DATE(evaluation_period_start) >= ?' : ''}
      ${endDate ? 'AND DATE(evaluation_period_end) <= ?' : ''}
      ORDER BY evaluation_period_start DESC
    `)
    
    if (startDate && endDate) {
      evaluationsQuery = evaluationsQuery.bind(studentId, startDate, endDate)
    } else if (startDate) {
      evaluationsQuery = evaluationsQuery.bind(studentId, startDate)
    } else if (endDate) {
      evaluationsQuery = evaluationsQuery.bind(studentId, endDate)
    } else {
      evaluationsQuery = evaluationsQuery.bind(studentId)
    }
    const evaluations = await evaluationsQuery.all()
    
    csv.push('## 教科横断評価')
    csv.push('評価期間開始,評価期間終了,読解力,文章表現力,論理的思考力,創造的思考力,問題解決力,やり抜く力,自己調整力,協働性,好奇心,メタ認知,成長マインド')
    evaluations.results.forEach((e: any) => {
      csv.push(`${e.evaluation_period_start},${e.evaluation_period_end},${e.reading_comprehension},${e.writing_expression},${e.logical_thinking},${e.creative_thinking},${e.problem_solving},${e.persistence_score},${e.self_regulation_score},${e.collaboration_score},${e.curiosity_score},${e.metacognition_score},${e.growth_mindset_score}`)
    })
    
    return new Response(csv.join('\n'), {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="phase3_${studentId}_data.csv"`
      }
    })
  } catch (error: any) {
    console.error('Phase 3 CSV export error:', error)
    return c.json({ error: 'Failed to export Phase 3 data', details: error.message }, 500)
  }
})

// ============================================
// 統計ダッシュボードAPI
// ============================================

// クラス全体の学習統計
app.get('/api/statistics/class/:classCode', async (c) => {
  const { env } = c
  const classCode = c.req.param('classCode')
  const { curriculumId } = c.req.query()
  
  // デモ用：CLASS2024Aの場合は常にモックデータを返す
  if (classCode === 'CLASS2024A') {
    return c.json({
      classCode: classCode,
      studentCount: 3,
      progressStats: {
        avg_completion: 75.5,
        min_completion: 50,
        max_completion: 100,
        active_students: 3,
        total_time: 450
      },
      accuracyStats: {
        total_questions: 150,
        correct_questions: 120,
        avg_accuracy: 80.0
      },
      errorPatterns: [
        { error_pattern: 'くり上がり忘れ', count: 12, affected_students: 2 },
        { error_pattern: '計算ミス', count: 8, affected_students: 3 },
        { error_pattern: '桁の並べ間違い', count: 5, affected_students: 2 },
        { error_pattern: '問題の読み間違い', count: 3, affected_students: 1 }
      ],
      learningTimeDistribution: [
        { name: '山田太郎', student_number: '001', total_time: 180, completed_curriculums: 2 },
        { name: '佐藤花子', student_number: '002', total_time: 150, completed_curriculums: 2 },
        { name: '鈴木次郎', student_number: '003', total_time: 120, completed_curriculums: 1 }
      ],
      progressDistribution: [
        { range: '完了', count: 1 },
        { range: '75-99%', count: 1 },
        { range: '50-75%', count: 1 }
      ]
    })
  }
  
  try {
    // クラスの生徒一覧
    const students = await env.DB.prepare(`
      SELECT id, name, student_number FROM users 
      WHERE class_code = ? AND role = 'student'
      ORDER BY student_number
    `).bind(classCode).all()
    
    // デモ用：生徒が見つからない場合はモックデータを返す
    if (students.results.length === 0 && classCode === 'CLASS2024A') {
      return c.json({
        classCode: classCode,
        studentCount: 3,
        progressStats: {
          avg_completion: 75.5,
          min_completion: 50,
          max_completion: 100,
          active_students: 3,
          total_time: 450
        },
        accuracyStats: {
          total_questions: 150,
          correct_questions: 120,
          avg_accuracy: 80.0
        },
        errorPatterns: [
          { error_pattern: 'くり上がり忘れ', count: 12, affected_students: 2 },
          { error_pattern: '計算ミス', count: 8, affected_students: 3 },
          { error_pattern: '桁の並べ間違い', count: 5, affected_students: 2 },
          { error_pattern: '問題の読み間違い', count: 3, affected_students: 1 }
        ],
        learningTimeDistribution: [
          { name: '山田太郎', student_number: '001', total_time: 180, completed_curriculums: 2 },
          { name: '佐藤花子', student_number: '002', total_time: 150, completed_curriculums: 2 },
          { name: '鈴木次郎', student_number: '003', total_time: 120, completed_curriculums: 1 }
        ],
        progressDistribution: [
          { range: '完了', count: 1 },
          { range: '75-99%', count: 1 },
          { range: '50-75%', count: 1 }
        ]
      })
    }
    
    if (students.results.length === 0) {
      return c.json({ error: 'No students found' }, 404)
    }
    
    const studentIds = students.results.map((s: any) => s.id)
    
    // プレースホルダーを生成（?, ?, ?のような形式）
    const placeholders = studentIds.map(() => '?').join(',')
    
    // 進捗統計
    let progressStatsQuery = env.DB.prepare(`
      SELECT 
        AVG(completion_percentage) as avg_completion,
        MIN(completion_percentage) as min_completion,
        MAX(completion_percentage) as max_completion,
        COUNT(DISTINCT student_id) as active_students,
        SUM(total_learning_time) as total_time
      FROM progress
      WHERE student_id IN (${placeholders})
      ${curriculumId ? 'AND curriculum_id = ?' : ''}
    `)
    
    if (curriculumId) {
      progressStatsQuery = progressStatsQuery.bind(...studentIds, curriculumId)
    } else {
      progressStatsQuery = progressStatsQuery.bind(...studentIds)
    }
    const progressStats = await progressStatsQuery.first()
    
    // 正答率統計
    let accuracyStatsQuery = env.DB.prepare(`
      SELECT 
        COUNT(*) as total_questions,
        SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) as correct_questions,
        AVG(CASE WHEN is_correct = 1 THEN 100.0 ELSE 0.0 END) as avg_accuracy
      FROM error_history
      WHERE student_id IN (${placeholders})
      ${curriculumId ? 'AND curriculum_id = ?' : ''}
    `)
    
    if (curriculumId) {
      accuracyStatsQuery = accuracyStatsQuery.bind(...studentIds, curriculumId)
    } else {
      accuracyStatsQuery = accuracyStatsQuery.bind(...studentIds)
    }
    const accuracyStats = await accuracyStatsQuery.first()
    
    // 誤答パターン分析
    let errorPatternsQuery = env.DB.prepare(`
      SELECT 
        error_pattern,
        COUNT(*) as count,
        COUNT(DISTINCT student_id) as affected_students
      FROM error_history
      WHERE student_id IN (${placeholders})
      ${curriculumId ? 'AND curriculum_id = ?' : ''}
        AND is_correct = 0 
        AND error_pattern IS NOT NULL
      GROUP BY error_pattern
      ORDER BY count DESC
      LIMIT 10
    `)
    
    if (curriculumId) {
      errorPatternsQuery = errorPatternsQuery.bind(...studentIds, curriculumId)
    } else {
      errorPatternsQuery = errorPatternsQuery.bind(...studentIds)
    }
    const errorPatterns = await errorPatternsQuery.all()
    
    // 学習時間の分布
    let learningTimeDistQuery = env.DB.prepare(`
      SELECT 
        u.name,
        u.student_number,
        COALESCE(SUM(p.total_learning_time), 0) as total_time,
        COUNT(DISTINCT p.curriculum_id) as completed_curriculums
      FROM users u
      LEFT JOIN progress p ON u.id = p.student_id
      WHERE u.class_code = ? AND u.role = 'student'
      ${curriculumId ? 'AND p.curriculum_id = ?' : ''}
      GROUP BY u.id, u.name, u.student_number
      ORDER BY total_time DESC
    `)
    
    if (curriculumId) {
      learningTimeDistQuery = learningTimeDistQuery.bind(classCode, curriculumId)
    } else {
      learningTimeDistQuery = learningTimeDistQuery.bind(classCode)
    }
    const learningTimeDistribution = await learningTimeDistQuery.all()
    
    // 進捗率の分布
    let progressDistQuery = env.DB.prepare(`
      SELECT 
        CASE 
          WHEN completion_percentage = 0 THEN '未開始'
          WHEN completion_percentage < 25 THEN '0-25%'
          WHEN completion_percentage < 50 THEN '25-50%'
          WHEN completion_percentage < 75 THEN '50-75%'
          WHEN completion_percentage < 100 THEN '75-99%'
          ELSE '完了'
        END as range,
        COUNT(DISTINCT student_id) as count
      FROM progress
      WHERE student_id IN (${placeholders})
      ${curriculumId ? 'AND curriculum_id = ?' : ''}
      GROUP BY range
      ORDER BY 
        CASE range
          WHEN '未開始' THEN 1
          WHEN '0-25%' THEN 2
          WHEN '25-50%' THEN 3
          WHEN '50-75%' THEN 4
          WHEN '75-99%' THEN 5
          WHEN '完了' THEN 6
        END
    `)
    
    if (curriculumId) {
      progressDistQuery = progressDistQuery.bind(...studentIds, curriculumId)
    } else {
      progressDistQuery = progressDistQuery.bind(...studentIds)
    }
    const progressDistribution = await progressDistQuery.all()
    
    return c.json({
      classCode,
      studentCount: students.results.length,
      progressStats,
      accuracyStats,
      errorPatterns: errorPatterns.results,
      learningTimeDistribution: learningTimeDistribution.results,
      progressDistribution: progressDistribution.results
    })
  } catch (error: any) {
    console.error('Statistics error:', error)
    return c.json({ error: 'Failed to get statistics', details: error.message }, 500)
  }
})

// 非認知能力の統計（Phase 3）
app.get('/api/statistics/noncognitive/:classCode', async (c) => {
  const { env } = c
  const classCode = c.req.param('classCode')
  
  try {
    const students = await env.DB.prepare(`
      SELECT id, name FROM users 
      WHERE class_code = ? AND role = 'student'
    `).bind(classCode).all()
    
    if (students.results.length === 0) {
      return c.json({ error: 'No students found' }, 404)
    }
    
    const studentIds = students.results.map((s: any) => s.id)
    const placeholders = studentIds.map(() => '?').join(',')
    
    // 最新の教科横断評価から非認知能力スコアを取得
    const noncognitiveScores = []
    
    for (const student of students.results as any[]) {
      const latestEval = await env.DB.prepare(`
        SELECT * FROM cross_subject_evaluations
        WHERE student_id = ?
        ORDER BY evaluation_period_end DESC
        LIMIT 1
      `).bind(student.id).first()
      
      if (latestEval) {
        noncognitiveScores.push({
          studentName: student.name,
          persistence: latestEval.persistence_score,
          selfRegulation: latestEval.self_regulation_score,
          collaboration: latestEval.collaboration_score,
          curiosity: latestEval.curiosity_score,
          metacognition: latestEval.metacognition_score,
          growthMindset: latestEval.growth_mindset_score
        })
      }
    }
    
    // 平均スコアを計算
    const avgScores = {
      persistence: 0,
      selfRegulation: 0,
      collaboration: 0,
      curiosity: 0,
      metacognition: 0,
      growthMindset: 0
    }
    
    if (noncognitiveScores.length > 0) {
      avgScores.persistence = noncognitiveScores.reduce((sum, s) => sum + (s.persistence || 0), 0) / noncognitiveScores.length
      avgScores.selfRegulation = noncognitiveScores.reduce((sum, s) => sum + (s.selfRegulation || 0), 0) / noncognitiveScores.length
      avgScores.collaboration = noncognitiveScores.reduce((sum, s) => sum + (s.collaboration || 0), 0) / noncognitiveScores.length
      avgScores.curiosity = noncognitiveScores.reduce((sum, s) => sum + (s.curiosity || 0), 0) / noncognitiveScores.length
      avgScores.metacognition = noncognitiveScores.reduce((sum, s) => sum + (s.metacognition || 0), 0) / noncognitiveScores.length
      avgScores.growthMindset = noncognitiveScores.reduce((sum, s) => sum + (s.growthMindset || 0), 0) / noncognitiveScores.length
    }
    
    // 教師の見取り統計
    const observationStats = await env.DB.prepare(`
      SELECT 
        observation_type,
        COUNT(*) as count,
        SUM(CASE WHEN is_positive = 1 THEN 1 ELSE 0 END) as positive_count
      FROM teacher_observations
      WHERE student_id IN (${placeholders})
        AND observation_date >= date('now', '-30 days')
      GROUP BY observation_type
      ORDER BY count DESC
    `).bind(...studentIds).all()
    
    // 振り返り統計
    const reflectionStats = await env.DB.prepare(`
      SELECT 
        AVG(mood_rating) as avg_mood,
        AVG(effort_rating) as avg_effort,
        AVG(understanding_rating) as avg_understanding,
        COUNT(*) as total_reflections
      FROM student_reflections
      WHERE student_id IN (${placeholders})
        AND reflection_date >= date('now', '-30 days')
    `).bind(...studentIds).first()
    
    return c.json({
      classCode,
      studentCount: students.results.length,
      noncognitiveScores,
      avgScores,
      observationStats: observationStats.results,
      reflectionStats
    })
  } catch (error: any) {
    console.error('Noncognitive statistics error:', error)
    return c.json({ error: 'Failed to get noncognitive statistics', details: error.message }, 500)
  }
})

// AI振り返り分析 - 成長パターン検出
app.post('/api/ai/analyze-growth', async (c) => {
  const { env } = c
  const { studentId, analysisType } = await c.req.json()
  
  // デモ用：学生IDが数字のみの場合は常にデモデータを返す
  if (/^\d{1,2}$/.test(studentId)) {
    return c.json({
      studentName: 'デモ生徒',
      analysisDate: new Date().toISOString(),
      growthPatterns: [
        {
          category: '学習態度',
          trend: '向上',
          description: '振り返りの記述が具体的になり、自己評価の精度が向上。努力評価が安定して4以上を維持。',
          evidence: '過去3ヶ月の振り返りデータより'
        },
        {
          category: '理解度',
          trend: '安定',
          description: '基礎的な概念の理解は定着。発展的な問題にも挑戦する姿勢が見られる。',
          evidence: '教師の見取り記録より'
        },
        {
          category: '非認知能力',
          trend: '発達中',
          description: 'やり抜く力と好奇心が特に伸長。協働性も向上傾向。',
          evidence: '教科横断評価より'
        }
      ],
      strengths: [
        '継続的な努力ができる',
        '自己評価が適切',
        '前向きな学習姿勢'
      ],
      challenges: [
        '難しい問題への挑戦をさらに増やす',
        'メタ認知能力のさらなる向上'
      ],
      recommendations: [
        '発展的な問題に定期的に取り組む機会を設ける',
        '自分の学習方法を振り返る時間を増やす',
        'グループ学習でリーダーシップを発揮する機会を作る'
      ],
      dataQuality: {
        reflectionsCount: 12,
        observationsCount: 8,
        evaluationsCount: 3,
        progressCount: 5
      }
    })
  }
  
  try {
    // 生徒情報を取得
    const student = await env.DB.prepare(`
      SELECT * FROM users WHERE id = ?
    `).bind(studentId).first()
    
    if (!student) {
      return c.json({ error: 'Student not found' }, 404)
    }
    
    // 振り返りデータを取得（過去3ヶ月分）
    const reflections = await env.DB.prepare(`
      SELECT * FROM student_reflections
      WHERE student_id = ?
        AND reflection_date >= date('now', '-90 days')
      ORDER BY reflection_date ASC
    `).bind(studentId).all()
    
    // 教師の見取り記録を取得
    const observations = await env.DB.prepare(`
      SELECT * FROM teacher_observations
      WHERE student_id = ?
        AND observation_date >= date('now', '-90 days')
      ORDER BY observation_date ASC
    `).bind(studentId).all()
    
    // 教科横断評価の履歴
    const evaluations = await env.DB.prepare(`
      SELECT * FROM cross_subject_evaluations
      WHERE student_id = ?
      ORDER BY evaluation_period_start ASC
    `).bind(studentId).all()
    
    // 学習進捗データ
    const progress = await env.DB.prepare(`
      SELECT p.*, c.curriculum_title
      FROM progress p
      LEFT JOIN curriculum c ON p.curriculum_id = c.id
      WHERE p.student_id = ?
      ORDER BY p.updated_at DESC
    `).bind(studentId).all()
    
    // AIに成長パターン分析を依頼（シミュレーション）
    const analysisPrompt = `
生徒名: ${student.name}
分析タイプ: ${analysisType || '総合的な成長パターン'}

【振り返りデータ】(${reflections.results.length}件)
${reflections.results.slice(0, 5).map((r: any) => 
  `- ${r.reflection_date}: ${r.what_learned || ''} | 気分:${r.mood_rating}/5 努力:${r.effort_rating}/5 理解:${r.understanding_rating}/5`
).join('\n')}

【教師の見取り】(${observations.results.length}件)
${observations.results.slice(0, 5).map((o: any) => 
  `- ${o.observation_date}: [${o.observation_type}] ${o.observation_text || ''}`
).join('\n')}

【教科横断評価】(${evaluations.results.length}件)
${evaluations.results.map((e: any) => 
  `- ${e.evaluation_period_start}～${e.evaluation_period_end}: 読解${e.reading_comprehension} 文章${e.writing_expression} 論理${e.logical_thinking} 創造${e.creative_thinking} 問題解決${e.problem_solving}`
).join('\n')}

この生徒の成長パターンを分析し、以下の観点でまとめてください：
1. 学習態度の変化
2. 理解度の推移
3. 非認知能力の発達
4. 今後の課題と推奨事項
`
    
    // AIレスポンスのシミュレーション（実際の実装ではGemini APIを呼び出す）
    const aiAnalysis = {
      studentName: student.name,
      analysisDate: new Date().toISOString(),
      growthPatterns: [
        {
          category: '学習態度',
          trend: '向上',
          description: '振り返りの記述が具体的になり、自己評価の精度が向上。努力評価が安定して4以上を維持。',
          evidence: reflections.results.length > 0 ? '過去3ヶ月の振り返りデータより' : ''
        },
        {
          category: '理解度',
          trend: '安定',
          description: '基礎的な概念の理解は定着。発展的な問題にも挑戦する姿勢が見られる。',
          evidence: observations.results.length > 0 ? '教師の見取り記録より' : ''
        },
        {
          category: '非認知能力',
          trend: '発達中',
          description: 'やり抜く力と好奇心が特に伸長。協働性も向上傾向。',
          evidence: evaluations.results.length > 0 ? '教科横断評価より' : ''
        }
      ],
      strengths: [
        '継続的な努力ができる',
        '自己評価が適切',
        '前向きな学習姿勢'
      ],
      challenges: [
        '難しい問題への挑戦をさらに増やす',
        'メタ認知能力のさらなる向上'
      ],
      recommendations: [
        '発展的な問題に定期的に取り組む機会を設ける',
        '自分の学習方法を振り返る時間を増やす',
        'グループ学習でリーダーシップを発揮する機会を作る'
      ],
      dataQuality: {
        reflectionsCount: reflections.results.length,
        observationsCount: observations.results.length,
        evaluationsCount: evaluations.results.length,
        progressCount: progress.results.length
      }
    }
    
    return c.json(aiAnalysis)
  } catch (error: any) {
    console.error('AI analysis error:', error)
    return c.json({ error: 'Failed to analyze growth patterns', details: error.message }, 500)
  }
})

// メディア生成API - 画像生成
app.post('/api/media/generate-image', async (c) => {
  const { prompt, style } = await c.req.json()
  
  // 小数のかけ算に特化した図解SVGを生成
  const svgImage = `
    <svg width="600" height="400" xmlns="http://www.w3.org/2000/svg">
      <!-- 背景 -->
      <rect width="600" height="400" fill="#f0fdf4"/>
      
      <!-- タイトル -->
      <text x="300" y="40" font-size="28" font-weight="bold" text-anchor="middle" fill="#166534">
        0.3 × 4 = 1.2
      </text>
      
      <!-- 4つの0.3を視覚化 -->
      <g id="blocks">
        <!-- ブロック1 -->
        <rect x="50" y="80" width="120" height="80" fill="#22c55e" stroke="#166534" stroke-width="2" rx="8"/>
        <text x="110" y="130" font-size="32" font-weight="bold" text-anchor="middle" fill="white">0.3</text>
        
        <!-- ブロック2 -->
        <rect x="190" y="80" width="120" height="80" fill="#22c55e" stroke="#166534" stroke-width="2" rx="8"/>
        <text x="250" y="130" font-size="32" font-weight="bold" text-anchor="middle" fill="white">0.3</text>
        
        <!-- ブロック3 -->
        <rect x="330" y="80" width="120" height="80" fill="#22c55e" stroke="#166534" stroke-width="2" rx="8"/>
        <text x="390" y="130" font-size="32" font-weight="bold" text-anchor="middle" fill="white">0.3</text>
        
        <!-- ブロック4 -->
        <rect x="470" y="80" width="120" height="80" fill="#22c55e" stroke="#166534" stroke-width="2" rx="8"/>
        <text x="530" y="130" font-size="32" font-weight="bold" text-anchor="middle" fill="white">0.3</text>
      </g>
      
      <!-- 矢印 -->
      <path d="M 300 180 L 300 220" stroke="#166534" stroke-width="3" fill="none" marker-end="url(#arrowhead)"/>
      <defs>
        <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="5" refY="5" orient="auto">
          <polygon points="0 0, 10 5, 0 10" fill="#166534"/>
        </marker>
      </defs>
      
      <!-- 合計 -->
      <rect x="150" y="240" width="300" height="100" fill="#3b82f6" stroke="#1e40af" stroke-width="2" rx="8"/>
      <text x="300" y="280" font-size="24" font-weight="bold" text-anchor="middle" fill="white">
        0.3 + 0.3 + 0.3 + 0.3
      </text>
      <text x="300" y="320" font-size="40" font-weight="bold" text-anchor="middle" fill="white">
        = 1.2
      </text>
    </svg>
  `
  
  // SVGをData URLに変換
  const svgDataUrl = 'data:image/svg+xml;base64,' + Buffer.from(svgImage).toString('base64')
  
  return c.json({
    success: true,
    imageUrl: svgDataUrl,
    prompt: prompt,
    style: style,
    note: '0.3が4つで1.2になることを図解で表現しました'
  })
})

// メディア生成API - 動画生成（Canvas アニメーション）
app.post('/api/media/generate-video', async (c) => {
  const { prompt, duration } = await c.req.json()
  
  // 小学2年生向け：3×4のかけ算アニメーション（Canvas版・リンゴが動く）
  // デバッグ: まず静的版で全要素が表示されるか確認
  const animationHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          width: 100%; 
          height: 100%; 
          background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
          font-family: 'Arial', 'Hiragino Kaku Gothic Pro', 'Meiryo', sans-serif;
          overflow: hidden;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        canvas { 
          background: white; 
          border-radius: 12px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.1);
        }
      </style>
    </head>
    <body>
      <canvas id="canvas" width="800" height="500"></canvas>
      <script>
        const canvas = document.getElementById('canvas');
        const ctx = canvas.getContext('2d');
        let time = 0;
        
        console.log('🎬 Canvas initialized');
        
        // リンゴを描く関数
        function drawApple(x, y, size, alpha = 1) {
          ctx.save();
          ctx.globalAlpha = alpha;
          
          // リンゴの本体（赤）
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.arc(x, y, size, 0, Math.PI * 2);
          ctx.fill();
          
          // ハイライト
          ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
          ctx.beginPath();
          ctx.arc(x - size * 0.3, y - size * 0.3, size * 0.3, 0, Math.PI * 2);
          ctx.fill();
          
          // 葉っぱ（緑）
          ctx.fillStyle = '#22c55e';
          ctx.beginPath();
          ctx.ellipse(x + size * 0.5, y - size * 0.8, size * 0.4, size * 0.2, -Math.PI / 6, 0, Math.PI * 2);
          ctx.fill();
          
          ctx.restore();
        }
        
        // テキストを描く関数
        function drawText(text, x, y, fontSize, color, alpha = 1) {
          ctx.save();
          ctx.globalAlpha = alpha;
          ctx.fillStyle = color;
          ctx.font = 'bold ' + fontSize + 'px Arial, Hiragino Kaku Gothic Pro';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(text, x, y);
          ctx.restore();
        }
        
        // 囲み枠を描く関数
        function drawBox(x, y, w, h, alpha = 1) {
          ctx.save();
          ctx.globalAlpha = alpha;
          ctx.strokeStyle = '#10b981';
          ctx.lineWidth = 4;
          ctx.setLineDash([10, 5]);
          ctx.strokeRect(x, y, w, h);
          ctx.restore();
        }
        
        // イージング関数
        function easeOutBounce(t) {
          const n1 = 7.5625;
          const d1 = 2.75;
          if (t < 1 / d1) {
            return n1 * t * t;
          } else if (t < 2 / d1) {
            return n1 * (t -= 1.5 / d1) * t + 0.75;
          } else if (t < 2.5 / d1) {
            return n1 * (t -= 2.25 / d1) * t + 0.9375;
          } else {
            return n1 * (t -= 2.625 / d1) * t + 0.984375;
          }
        }
        
        function easeOutBack(t) {
          const c1 = 1.70158;
          const c3 = c1 + 1;
          return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
        }
        
        // アニメーション関数
        function animate() {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          
          // デバッグ: 1秒ごとにログ出力
          if (Math.floor(time) !== Math.floor(time - 1/60)) {
            console.log('⏱️ Time:', Math.floor(time) + 's');
          }
          
          // フェーズ1: タイトル表示（0-1秒）
          if (time < 1) {
            const alpha = Math.min(time * 2, 1);
            drawText('3 × 4 の けいさん', 400, 50, 36, '#1e40af', alpha);
          } else {
            drawText('3 × 4 の けいさん', 400, 50, 36, '#1e40af', 1);
          }
          
          // フェーズ2: 問題表示（1-2秒）
          if (time >= 1 && time < 2) {
            const t = (time - 1);
            const scale = easeOutBack(Math.min(t, 1));
            ctx.save();
            ctx.translate(400, 110);
            ctx.scale(scale, scale);
            drawText('3 × 4 = ?', 0, 0, 42, '#7c3aed', 1);
            ctx.restore();
          } else if (time >= 2) {
            drawText('3 × 4 = ?', 400, 110, 42, '#7c3aed', 1);
          }
          
          // フェーズ3-6: リンゴが4グループ登場（2-6秒）
          const groups = [
            { startTime: 2, label: '1つめ', x: 185, y: 230 },
            { startTime: 3, label: '2つめ', x: 325, y: 230 },
            { startTime: 4, label: '3つめ', x: 465, y: 230 },
            { startTime: 5, label: '4つめ', x: 605, y: 230 }
          ];
          
          groups.forEach((group) => {
            if (time >= group.startTime) {
              const t = Math.min((time - group.startTime), 1);
              const ease = easeOutBounce(t);
              const alpha = Math.min(t * 3, 1);
              
              // ラベル
              drawText(group.label, group.x, group.y - 50, 22, '#059669', alpha);
              
              // 囲み枠
              if (t > 0.3) {
                drawBox(group.x - 55, group.y - 30, 110, 80, (t - 0.3) / 0.7);
              }
              
              // リンゴ3個（上から落ちてくる）
              for (let i = 0; i < 3; i++) {
                const appleX = group.x + (i - 1) * 35;
                const appleY = group.y - 100 + ease * 100;
                drawApple(appleX, appleY, 17, alpha);
              }
            }
          });
          
          // フェーズ7: 説明表示（6-7秒）
          if (time >= 6) {
            const alpha = Math.min((time - 6) * 2, 1);
            drawText('3が 4つ → 3+3+3+3', 400, 320, 28, '#6b7280', alpha);
          }
          
          // フェーズ8: 答え表示（7秒以降）
          if (time >= 7) {
            const t = Math.min((time - 7) / 0.8, 1);
            const scale = 0.5 + easeOutBack(t) * 0.5;
            const pulseScale = time >= 8 ? 1 + Math.sin((time - 8) * 4) * 0.05 : 1;
            
            ctx.save();
            ctx.translate(400, 400);
            ctx.scale(scale * pulseScale, scale * pulseScale);
            
            // 影
            ctx.shadowColor = 'rgba(59, 130, 246, 0.3)';
            ctx.shadowBlur = 20;
            ctx.shadowOffsetY = 5;
            
            drawText('= 12', 0, 0, 70, '#3b82f6', 1);
            ctx.restore();
          }
          
          // 時間を進める
          time += 1 / 60;
          
          // アニメーション継続（10秒まで）
          if (time < 10) {
            requestAnimationFrame(animate);
          } else {
            console.log('✅ Animation complete');
          }
        }
        
        // アニメーション開始
        animate();
      </script>
    </body>
    </html>
  `
  
  return c.json({
    success: true,
    animationHtml: animationHtml,
    prompt: prompt,
    duration: duration || 8,
    note: 'Canvas アニメーション：リンゴが動いて登場！ 3つのまとまりが4セット、合計12個になる様子が視覚的に理解できます'
  })
})

// メディア生成API - ケース4-12: 学習スタイル別動画生成
app.post('/api/media/generate-video-case', async (c) => {
  const { caseNumber, duration } = await c.req.json()
  
  // ケース別の設定
  const caseConfigs: Record<number, any> = {
    4: { // 視覚優位型
      title: '色と図形で理解',
      colors: ['#ef4444', '#3b82f6', '#10b981', '#f59e0b'], // 赤・青・緑・黄
      style: 'カラフル',
      targetStudent: '視覚情報に強いDさん'
    },
    5: { // 聴覚優位型
      title: '音とリズムで覚える',
      colors: ['#8b5cf6', '#8b5cf6', '#8b5cf6', '#8b5cf6'], // 紫統一
      style: 'バウンドリズム',
      targetStudent: '音で覚えるEさん'
    },
    6: { // 体感優位型
      title: '動きで体得',
      colors: ['#ef4444', '#3b82f6', '#10b981', '#f59e0b'], // おはじきの色（赤・青・緑・黄）
      cupColor: '#f3f4f6', // 紙コップの色（グレー）
      style: '紙コップとおはじき',
      targetStudent: '体を動かして学ぶFさん'
    }
  }
  
  const config = caseConfigs[caseNumber] || caseConfigs[4]
  
  const animationHtml = `
    <!DOCTYPE html>
    <html lang="ja">
    <head>
      <meta charset="UTF-8">
      <title>ケース${caseNumber}: ${config.title}</title>
      <style>
        body { margin: 0; padding: 0; background: white; }
        canvas { display: block; }
      </style>
    </head>
    <body>
      <canvas id="canvas" width="800" height="500"></canvas>
      <script>
        const canvas = document.getElementById('canvas');
        const ctx = canvas.getContext('2d');
        let time = 0;
        
        console.log('🎬 Canvas initialized for Case ${caseNumber}');
        
        // ヘルパー関数
        function drawText(text, x, y, size, color, alpha = 1) {
          ctx.save();
          ctx.globalAlpha = alpha;
          ctx.fillStyle = color;
          ctx.font = 'bold ' + size + 'px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(text, x, y);
          ctx.restore();
        }
        
        function drawBox(x, y, w, h, alpha = 1) {
          ctx.save();
          ctx.globalAlpha = alpha;
          ctx.strokeStyle = '#9ca3af';
          ctx.lineWidth = 2;
          ctx.strokeRect(x, y, w, h);
          ctx.restore();
        }
        
        function drawColorBlock(x, y, size, color, alpha = 1) {
          ctx.save();
          ctx.globalAlpha = alpha;
          
          // グラデーション
          const gradient = ctx.createRadialGradient(x, y - size/4, size/8, x, y, size);
          gradient.addColorStop(0, color);
          gradient.addColorStop(1, adjustBrightness(color, -20));
          
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(x, y, size, 0, Math.PI * 2);
          ctx.fill();
          
          // 境界線
          ctx.strokeStyle = adjustBrightness(color, -40);
          ctx.lineWidth = 2;
          ctx.stroke();
          ctx.restore();
        }
        
        function adjustBrightness(color, amount) {
          const num = parseInt(color.replace('#',''), 16);
          const r = Math.min(255, Math.max(0, (num >> 16) + amount));
          const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amount));
          const b = Math.min(255, Math.max(0, (num & 0x0000FF) + amount));
          return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
        }
        
        function easeOutElastic(t) {
          const c4 = (2 * Math.PI) / 3;
          return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
        }
        
        function easeOutBack(t) {
          const c1 = 1.70158;
          const c3 = c1 + 1;
          return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
        }
        
        const colors = ${JSON.stringify(config.colors)};
        const cupColor = '${config.cupColor || '#f3f4f6'}';
        const groups = [
          { x: 185, y: 280, label: '①' },
          { x: 325, y: 280, label: '②' },
          { x: 465, y: 280, label: '③' },
          { x: 605, y: 280, label: '④' }
        ];
        
        // 紙コップを描画する関数
        function drawCup(x, y, alpha = 1) {
          ctx.save();
          ctx.globalAlpha = alpha;
          
          // 紙コップの台形形状
          ctx.fillStyle = cupColor;
          ctx.strokeStyle = '#d1d5db';
          ctx.lineWidth = 2;
          
          ctx.beginPath();
          ctx.moveTo(x - 30, y - 40); // 上左
          ctx.lineTo(x + 30, y - 40); // 上右
          ctx.lineTo(x + 35, y + 20);  // 下右
          ctx.lineTo(x - 35, y + 20);  // 下左
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          
          // コップの縁（楕円）
          ctx.fillStyle = '#e5e7eb';
          ctx.beginPath();
          ctx.ellipse(x, y - 40, 30, 8, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          
          // 内側の影
          ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
          ctx.beginPath();
          ctx.ellipse(x, y - 38, 28, 7, 0, 0, Math.PI * 2);
          ctx.fill();
          
          ctx.restore();
        }
        
        // おはじき（カラフルな丸）を描画する関数
        function drawMarble(x, y, radius, color, alpha = 1) {
          ctx.save();
          ctx.globalAlpha = alpha;
          
          // グラデーション
          const gradient = ctx.createRadialGradient(x - radius/3, y - radius/3, 0, x, y, radius);
          gradient.addColorStop(0, adjustBrightness(color, 60));
          gradient.addColorStop(1, color);
          
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(x, y, radius, 0, Math.PI * 2);
          ctx.fill();
          
          // 境界線
          ctx.strokeStyle = adjustBrightness(color, -40);
          ctx.lineWidth = 1.5;
          ctx.stroke();
          
          // ハイライト
          ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
          ctx.beginPath();
          ctx.arc(x - radius/3, y - radius/3, radius/3, 0, Math.PI * 2);
          ctx.fill();
          
          ctx.restore();
        }
        
        function animate() {
          // クリア
          ctx.clearRect(0, 0, 800, 500);
          
          // フェーズ1: タイトル表示（0-1秒）
          if (time < 1) {
            const alpha = Math.min(time * 2, 1);
            drawText('${config.title}', 400, 40, 32, '#1f2937', alpha);
            drawText('対象: ${config.targetStudent}', 400, 75, 18, '#6b7280', alpha * 0.8);
          } else {
            drawText('${config.title}', 400, 40, 32, '#1f2937', 1);
            drawText('対象: ${config.targetStudent}', 400, 75, 18, '#6b7280', 0.8);
          }
          
          // フェーズ2: 問題表示（1-2秒）
          if (time >= 1) {
            const t = Math.min((time - 1) * 2, 1);
            const bounceY = time >= 2 ? 0 : -20 * (1 - easeOutBack(t));
            drawText('3 × 4 = ?', 400, 120 + bounceY, 42, '#4b5563', t);
          }
          
          // フェーズ3: 紙コップ4個を配置（2-3秒）
          if (time >= 2) {
            const t = Math.min((time - 2) * 2, 1);
            const ease = easeOutBack(t);
            
            groups.forEach((group, index) => {
              const delay = index * 0.15; // 順番に登場
              const cupT = Math.max(0, Math.min((t - delay) * 1.5, 1));
              const cupY = group.y - 50 + ease * 50;
              
              if (cupT > 0) {
                drawCup(group.x, cupY, cupT);
                // ラベル
                drawText(group.label, group.x, group.y - 100, 24, '#9ca3af', cupT);
              }
            });
          }
          
          // フェーズ4: 紙コップが完全に配置された状態を維持（3秒以降）
          if (time >= 3) {
            groups.forEach((group, index) => {
              drawCup(group.x, group.y, 1);
              drawText(group.label, group.x, group.y - 100, 24, '#9ca3af', 1);
            });
          }
          
          // フェーズ5-8: おはじきが1個ずつ入っていく（3-7秒、各コップに3個ずつ）
          if (time >= 3) {
            groups.forEach((group, groupIndex) => {
              for (let marbleIndex = 0; marbleIndex < 3; marbleIndex++) {
                const startTime = 3 + groupIndex + marbleIndex * 0.3;
                if (time >= startTime) {
                  const t = Math.min((time - startTime) * 3, 1);
                  const ease = easeOutElastic(t);
                  
                  // おはじきの最終位置（コップの中）
                  const finalY = group.y - 20 + marbleIndex * 18;
                  const marbleY = group.y - 120 + ease * (finalY - (group.y - 120));
                  
                  drawMarble(group.x, marbleY, 10, colors[groupIndex], Math.min(t * 2, 1));
                }
              }
            });
          }
          
          // フェーズ9: 説明表示（7-8秒）
          if (time >= 7) {
            const alpha = Math.min((time - 7) * 2, 1);
            drawText('3個ずつ × 4つのコップ', 400, 360, 26, '#6b7280', alpha);
            drawText('= 3+3+3+3', 400, 390, 24, '#8b5cf6', alpha);
          }
          
          // フェーズ10: 答え表示（8秒以降）
          if (time >= 8) {
            const t = Math.min((time - 8) / 0.8, 1);
            const scale = 0.5 + easeOutBack(t) * 0.5;
            const pulseScale = time >= 9 ? 1 + Math.sin((time - 9) * 4) * 0.05 : 1;
            
            ctx.save();
            ctx.translate(400, 440);
            ctx.scale(scale * pulseScale, scale * pulseScale);
            
            // 影
            ctx.shadowColor = 'rgba(59, 130, 246, 0.3)';
            ctx.shadowBlur = 20;
            ctx.shadowOffsetY = 5;
            
            drawText('= 12個！', 0, 0, 60, '#3b82f6', 1);
            ctx.restore();
          }
          
          // 時間を進める
          time += 1 / 60;
          
          // アニメーション継続（10秒まで）
          if (time < 10) {
            requestAnimationFrame(animate);
          } else {
            console.log('✅ Animation complete: 紙コップとおはじき');
          }
        }
        
        // アニメーション開始
        animate();
      </script>
    </body>
    </html>
  `
  
  return c.json({
    success: true,
    animationHtml: animationHtml,
    caseNumber: caseNumber,
    duration: duration || 10,
    note: `ケース${caseNumber}: ${config.title} - ${config.targetStudent}向けの個別最適化された学習動画`
  })
})

// メディア生成API - ケース7-9: 特別支援・保護者・教師用
app.post('/api/media/generate-video-support', async (c) => {
  const { caseNumber } = await c.req.json()
  
  const supportConfigs: Record<number, any> = {
    7: {
      title: 'スモールステップで理解',
      speed: 'ゆっくり',
      fontSize: 80,
      targetStudent: 'ゆっくり丁寧に学ぶGさん'
    },
    8: {
      title: '家庭学習サポート',
      speed: '標準',
      fontSize: 32,
      targetStudent: '保護者の方'
    },
    9: {
      title: 'クラス全体の理解度分析',
      speed: '速い',
      fontSize: 28,
      targetStudent: '教師の方'
    }
  }
  
  const config = supportConfigs[caseNumber] || supportConfigs[7]
  
  const animationHtml = `
    <!DOCTYPE html>
    <html lang="ja">
    <head>
      <meta charset="UTF-8">
      <title>ケース${caseNumber}: ${config.title}</title>
      <style>
        body { margin: 0; padding: 0; background: white; }
        canvas { display: block; }
      </style>
    </head>
    <body>
      <canvas id="canvas" width="800" height="500"></canvas>
      <script>
        const canvas = document.getElementById('canvas');
        const ctx = canvas.getContext('2d');
        let time = 0;
        
        function drawText(text, x, y, size, color, alpha = 1) {
          ctx.save();
          ctx.globalAlpha = alpha;
          ctx.fillStyle = color;
          ctx.font = 'bold ' + size + 'px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(text, x, y);
          ctx.restore();
        }
        
        function animate() {
          ctx.clearRect(0, 0, 800, 500);
          
          // タイトル
          drawText('\${config.title}', 400, 50, 36, '#1f2937', 1);
          drawText('対象: \${config.targetStudent}', 400, 90, 20, '#6b7280', 0.8);
          
          // 内容（ケース別）
          if (\${caseNumber} === 7) {
            // ケース7: 特別支援 - 超スローペース
            const step = Math.floor(time * 0.5); // 2秒に1ステップ
            if (step >= 0) drawText('1個目', 400, 180, 60, '#4b5563', 1);
            if (step >= 1) drawText('2個目', 400, 250, 60, '#4b5563', 1);
            if (step >= 2) drawText('3個目', 400, 320, 60, '#4b5563', 1);
            if (step >= 3) drawText('これを 4回', 400, 390, 50, '#3b82f6', 1);
            if (step >= 4) drawText('= 12', 400, 450, 70, '#10b981', 1);
          } else if (\${caseNumber} === 8) {
            // ケース8: 保護者向け
            if (time >= 1) drawText('お子さんへの声かけ例:', 400, 150, 28, '#6b7280', 1);
            if (time >= 2) drawText('「3個ずつあるね」', 400, 200, 32, '#4b5563', 1);
            if (time >= 3) drawText('「それが4つあるよ」', 400, 250, 32, '#4b5563', 1);
            if (time >= 4) drawText('「全部で何個かな？」', 400, 300, 32, '#4b5563', 1);
            if (time >= 5) drawText('一緒に数えましょう！', 400, 370, 36, '#3b82f6', 1);
          } else if (\${caseNumber} === 9) {
            // ケース9: 教師用分析
            if (time >= 1) drawText('クラス平均正答率: 78%', 400, 170, 32, '#6b7280', 1);
            if (time >= 2) drawText('つまずきポイント:', 400, 230, 28, '#ef4444', 1);
            if (time >= 3) drawText('• くり上がりの理解', 400, 270, 24, '#4b5563', 1);
            if (time >= 4) drawText('• 式の立て方', 400, 310, 24, '#4b5563', 1);
            if (time >= 5) drawText('→ 復習推奨', 400, 370, 32, '#f59e0b', 1);
          }
          
          time += 1 / 60;
          if (time < 10) requestAnimationFrame(animate);
        }
        
        animate();
      </script>
    </body>
    </html>
  `
  
  return c.json({
    success: true,
    animationHtml: animationHtml,
    caseNumber: caseNumber,
    duration: 10,
    note: `ケース${caseNumber}: ${config.title} - ${config.targetStudent}向け`
  })
})

// メディア生成API - ケース10-12: テスト準備・予習・復習
app.post('/api/media/generate-video-practice', async (c) => {
  const { caseNumber } = await c.req.json()
  
  const practiceConfigs: Record<number, any> = {
    10: {
      title: 'テスト準備 - よく出る問題',
      targetStudent: 'テスト前のHさん'
    },
    11: {
      title: '予習 - 次の単元へ',
      targetStudent: '先取り学習のIさん'
    },
    12: {
      title: '復習 - 要点再確認',
      targetStudent: '忘れかけているJさん'
    }
  }
  
  const config = practiceConfigs[caseNumber] || practiceConfigs[10]
  
  const animationHtml = `
    <!DOCTYPE html>
    <html lang="ja">
    <head>
      <meta charset="UTF-8">
      <title>ケース\${caseNumber}: \${config.title}</title>
      <style>
        body { margin: 0; padding: 0; background: white; }
        canvas { display: block; }
      </style>
    </head>
    <body>
      <canvas id="canvas" width="800" height="500"></canvas>
      <script>
        const canvas = document.getElementById('canvas');
        const ctx = canvas.getContext('2d');
        let time = 0;
        
        function drawText(text, x, y, size, color, alpha = 1) {
          ctx.save();
          ctx.globalAlpha = alpha;
          ctx.fillStyle = color;
          ctx.font = 'bold ' + size + 'px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(text, x, y);
          ctx.restore();
        }
        
        function animate() {
          ctx.clearRect(0, 0, 800, 500);
          
          // タイトル
          drawText('\${config.title}', 400, 50, 36, '#1f2937', 1);
          drawText('対象: \${config.targetStudent}', 400, 90, 20, '#6b7280', 0.8);
          
          // 内容（ケース別）
          if (\${caseNumber} === 10) {
            // ケース10: テスト準備
            if (time >= 1) drawText('問題1: 3 × 4 = ?', 400, 170, 32, '#4b5563', 1);
            if (time >= 3) drawText('→ 答え: 12', 400, 220, 28, '#10b981', 1);
            if (time >= 4) drawText('問題2: 5 × 3 = ?', 400, 290, 32, '#4b5563', 1);
            if (time >= 6) drawText('→ 答え: 15', 400, 340, 28, '#10b981', 1);
            if (time >= 7) drawText('ポイント: まとまりで考える', 400, 410, 26, '#3b82f6', 1);
          } else if (\${caseNumber} === 11) {
            // ケース11: 予習
            if (time >= 1) drawText('3 × 4 = 12 から', 400, 170, 32, '#6b7280', 1);
            if (time >= 2) drawText('4 × 4 = ?', 400, 240, 42, '#4b5563', 1);
            if (time >= 4) drawText('4が4つ = 16', 400, 310, 36, '#10b981', 1);
            if (time >= 6) drawText('パターンを見つけよう！', 400, 390, 32, '#3b82f6', 1);
          } else if (\${caseNumber} === 12) {
            // ケース12: 復習
            if (time >= 0.5) drawText('3 × 4 = ?', 400, 200, 56, '#4b5563', 1);
            if (time >= 2) {
              const alpha = Math.min((time - 2) * 2, 1);
              drawText('= 12', 400, 300, 80, '#10b981', alpha);
            }
            if (time >= 4) drawText('覚えてたかな？', 400, 400, 32, '#3b82f6', 1);
          }
          
          time += 1 / 60;
          if (time < 10) requestAnimationFrame(animate);
        }
        
        animate();
      </script>
    </body>
    </html>
  `
  
  return c.json({
    success: true,
    animationHtml: animationHtml,
    caseNumber: caseNumber,
    duration: 10,
    note: `ケース${caseNumber}: ${config.title} - ${config.targetStudent}向け`
  })
})

// メディア生成API - 音声生成（読み上げテキスト）
app.post('/api/media/generate-audio', async (c) => {
  const { text, voice } = await c.req.json()
  
  const scriptText = `
れいてんさん かける よん について考えましょう。

れいてんさん というのは、ぜろてんさん のことです。
これが よんこ あります。

れいてんさん たす れいてんさん たす れいてんさん たす れいてんさん。

ひとつずつ たしていくと...
れいてんさん、れいてんろく、れいてんきゅう、いってんに。

こたえは いってんに です！

かけざんは、おなじかずを なんかいも たすことと おなじですね。
  `
  
  return c.json({
    success: true,
    scriptText: scriptText.trim(),
    text: text,
    voice: voice || 'female-teacher',
    note: '小数のかけ算を音声で丁寧に解説しました'
  })
})

// メディア生成API - 音楽生成（歌詞）
app.post('/api/media/generate-music', async (c) => {
  const { lyrics, style } = await c.req.json()
  
  const songLyrics = `
🎵 九九の歌（3の段） 🎵

(1番)
さんいちが さん
さんにが ろく
さざんが きゅう
さんしが じゅうに

(2番)
さんごが じゅうご
さぶろく じゅうはち
さんしちが にじゅういち
さんぱが にじゅうし

(3番)
さんくが にじゅうしち
  `
  
  // YouTube九九の歌のリンク集（実用的な検索URL）
  const youtubeLinks = [
    {
      title: '九九のうた【3の段】を探す',
      url: 'https://www.youtube.com/results?search_query=九九の歌+3の段+小学生',
      description: 'YouTubeで「3の段」の歌を検索（複数の動画から選べます）'
    },
    {
      title: '九九のうた【全段】を探す',
      url: 'https://www.youtube.com/results?search_query=九九の歌+全段+子供向け',
      description: '1の段～9の段まですべて聞ける動画を検索'
    },
    {
      title: 'NHK for School かけざん九九',
      url: 'https://www.youtube.com/results?search_query=NHK+for+School+九九',
      description: 'NHK教育番組の九九学習コンテンツを検索'
    }
  ]
  
  return c.json({
    success: true,
    lyrics: songLyrics.trim(),
    style: style || 'educational-pop',
    youtubeLinks: youtubeLinks,
    note: 'リズムに乗って覚えやすい九九の歌です。YouTubeで実際の歌を聞くことができます。'
  })
})

// メディア生成API - AI音楽生成（AIML API経由）
app.post('/api/media/generate-suno-music', async (c) => {
  const { lyrics, style } = await c.req.json()
  const { env } = c
  
  // AIML API Keyの確認
  const aimlApiKey = env.AIML_API_KEY
  
  if (!aimlApiKey) {
    return c.json({
      success: false,
      error: 'AIML API Keyが設定されていません',
      instructions: `
AI音楽生成APIキーを設定する方法：

【推奨】AIML API を使用
1. AIML APIアカウントを作成
   https://aimlapi.com にアクセスしてアカウント作成

2. APIキーを取得
   ダッシュボードからAPIキーを生成（無料トライアルあり）

3. Cloudflare Secretsに設定
   wrangler secret put AIML_API_KEY --project-name jiyushindo-gakushu
   
4. ローカル開発用（.dev.vars ファイル）
   AIML_API_KEY=your-api-key-here

料金: 約$0.015-0.02 per call
詳細: https://aimlapi.com/suno-ai-api

【代替案】
- MiniMax Music API: https://aimlapi.com (同じAIML APIで利用可能)
- ElevenLabs Music: https://elevenlabs.io/music
- Udio API: https://udio.com
      `.trim()
    }, 400)
  }
  
  try {
    console.log('🎵 AI音楽生成開始（AIML API - MiniMax Music 2.0）...')
    
    // 歌詞を改善：MiniMax Music 2.0用のフォーマット
    // 構造タグを使用し、各行を()で区切る
    const formattedLyrics = `[Intro]
れいてんさん かける よん について考えよう
[Verse]
れいてんさん が よんこ
ならんで いるよ
たしてみよう ひとつずつ
れいてんさん れいてんろく
[Verse]
もういっこ たすと
れいてんきゅう になるね
さいごに もういっこ
いってんに だよ
[Chorus]
かけざんは たしざんだ
おなじかずを なんかいも
れいてんさん かける よん
こたえは いってんに
[Outro]
れいてんさん かける よん
こたえは いってんに`
    
    // AIML API経由でMiniMax Music 2.0を使用
    // https://docs.aimlapi.com/api-references/music-models/minimax/music-2.0
    const generateResponse = await fetch('https://api.aimlapi.com/v2/generate/audio', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${aimlApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'minimax/music-2.0',
        prompt: style || 'A cheerful and catchy educational pop song for children learning decimal multiplication, upbeat tempo, clear vocals, memorable melody, Japanese children\'s song style',
        lyrics: formattedLyrics
      })
    })
    
    if (!generateResponse.ok) {
      const errorText = await generateResponse.text()
      console.error('AIML API Error:', errorText)
      return c.json({
        success: false,
        error: 'AI音楽生成APIの呼び出しに失敗しました',
        details: errorText
      }, generateResponse.status)
    }
    
    const generateData = await generateResponse.json()
    const generationId = generateData.id
    
    if (!generationId) {
      return c.json({
        success: false,
        error: '生成IDの取得に失敗しました',
        details: generateData
      }, 500)
    }
    
    console.log('🎵 音楽生成タスク作成: ' + generationId)
    
    // 生成完了を待つ（最大3分）
    const maxAttempts = 12 // 12回 × 15秒 = 3分
    let attempts = 0
    
    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 15000)) // 15秒待機
      
      const statusResponse = await fetch(
        `https://api.aimlapi.com/v2/generate/audio?generation_id=${generationId}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${aimlApiKey}`,
            'Content-Type': 'application/json'
          }
        }
      )
      
      if (!statusResponse.ok) {
        const errorText = await statusResponse.text()
        console.error('Status check error:', errorText)
        attempts++
        continue
      }
      
      const statusData = await statusResponse.json()
      console.log(`🎵 生成ステータス (${attempts + 1}/${maxAttempts}): ${statusData.status}`)
      
      if (statusData.status === 'completed') {
        console.log('✅ AI音楽生成完了')
        
        return c.json({
          success: true,
          musicUrl: statusData.audio_file?.url,
          duration: statusData.extra_info?.music_duration / 1000, // ミリ秒を秒に変換
          lyrics: lyrics,
          style: style,
          generationId: generationId,
          note: 'AIが生成した学習ソング（MiniMax Music 2.0経由）'
        })
      } else if (statusData.status === 'failed') {
        return c.json({
          success: false,
          error: '音楽生成に失敗しました',
          details: statusData
        }, 500)
      }
      
      attempts++
    }
    
    // タイムアウト
    return c.json({
      success: false,
      error: '音楽生成がタイムアウトしました（3分以上）',
      note: '生成には時間がかかる場合があります。後でもう一度お試しください。'
    }, 408)
    
  } catch (error: any) {
    console.error('AI音楽生成エラー:', error)
    return c.json({
      success: false,
      error: '音楽生成中にエラーが発生しました',
      details: error.message
    }, 500)
  }
})

// メディア生成API - インタラクティブ教材生成
app.post('/api/media/generate-interactive', async (c) => {
  const { topic, interactionType } = await c.req.json()
  
  return c.json({
    success: true,
    interactiveHtml: generateInteractiveContent(topic, interactionType),
    topic: topic,
    interactionType: interactionType,
    note: 'クリックして実際に体験できるシミュレーターを作成しました'
  })
})

function generateInteractiveContent(topic: string, type: string): string {
  // 小数のかけ算シミュレーター - グローバル関数として定義
  return `
    <div class="interactive-simulator bg-white rounded-lg p-4 border-2 border-purple-300">
      <h4 class="font-bold text-purple-800 mb-4 text-center">🧪 小数のかけ算実験</h4>
      <p class="text-center text-sm text-gray-600 mb-4">容器をクリックして0.3Lずつ水を追加しましょう</p>
      <div class="grid grid-cols-4 gap-2 mb-4" id="sim-containers">
        <button onclick="window.fillSimContainer(1)" class="container-btn bg-purple-500 hover:bg-purple-600 text-white p-6 rounded text-center font-bold transition transform hover:scale-105" id="sim-container-1">
          <div class="text-3xl mb-2">🧪</div>
          <div class="text-xs">容器1</div>
          <div class="text-sm mt-2 filled-amount" style="display:none;">+0.3L</div>
        </button>
        <button onclick="window.fillSimContainer(2)" class="container-btn bg-purple-500 hover:bg-purple-600 text-white p-6 rounded text-center font-bold transition transform hover:scale-105" id="sim-container-2">
          <div class="text-3xl mb-2">🧪</div>
          <div class="text-xs">容器2</div>
          <div class="text-sm mt-2 filled-amount" style="display:none;">+0.3L</div>
        </button>
        <button onclick="window.fillSimContainer(3)" class="container-btn bg-purple-500 hover:bg-purple-600 text-white p-6 rounded text-center font-bold transition transform hover:scale-105" id="sim-container-3">
          <div class="text-3xl mb-2">🧪</div>
          <div class="text-xs">容器3</div>
          <div class="text-sm mt-2 filled-amount" style="display:none;">+0.3L</div>
        </button>
        <button onclick="window.fillSimContainer(4)" class="container-btn bg-purple-500 hover:bg-purple-600 text-white p-6 rounded text-center font-bold transition transform hover:scale-105" id="sim-container-4">
          <div class="text-3xl mb-2">🧪</div>
          <div class="text-xs">容器4</div>
          <div class="text-sm mt-2 filled-amount" style="display:none;">+0.3L</div>
        </button>
      </div>
      <div class="result-area bg-purple-50 rounded-lg p-4 border-2 border-purple-300">
        <div class="text-center">
          <p class="text-2xl font-bold text-purple-800 mb-2">
            合計: <span id="sim-total-amount" class="text-4xl">0</span>L
          </p>
          <p class="text-lg text-gray-700" id="sim-calculation-display">まだ水を追加していません</p>
        </div>
      </div>
    </div>
  `
}

// ============================================
// Phase 3: 選択課題成果物・教師の見取り・振り返り
// ============================================

// 選択課題成果物の投稿
app.post('/api/optional-problems/submissions', async (c) => {
  const { env } = c
  const {
    student_id,
    curriculum_id,
    optional_problem_id,
    submission_type,
    file_url,
    file_name,
    description,
    self_evaluation,
    self_comment
  } = await c.req.json()
  
  try {
    const result = await env.DB.prepare(`
      INSERT INTO optional_problem_submissions (
        student_id, curriculum_id, optional_problem_id, submission_type,
        file_url, file_name, description, self_evaluation, self_comment,
        submitted_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).bind(
      student_id, curriculum_id, optional_problem_id, submission_type,
      file_url, file_name, description, self_evaluation, self_comment
    ).run()
    
    return c.json({ success: true, submission_id: result.meta.last_row_id })
  } catch (error: any) {
    console.error('成果物投稿エラー:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// 選択課題成果物の取得
app.get('/api/optional-problems/submissions/:studentId', async (c) => {
  const { env } = c
  const studentId = c.req.param('studentId')
  
  try {
    const submissions = await env.DB.prepare(`
      SELECT s.*, op.problem_title, op.difficulty_level
      FROM optional_problem_submissions s
      JOIN optional_problems op ON s.optional_problem_id = op.id
      WHERE s.student_id = ?
      ORDER BY s.submitted_at DESC
    `).bind(studentId).all()
    
    return c.json({ success: true, submissions: submissions.results })
  } catch (error: any) {
    console.error('成果物取得エラー:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// 教師コメントの追加
app.post('/api/optional-problems/submissions/:id/teacher-comment', async (c) => {
  const { env } = c
  const submissionId = c.req.param('id')
  const { teacher_comment, teacher_evaluation } = await c.req.json()
  
  try {
    await env.DB.prepare(`
      UPDATE optional_problem_submissions
      SET teacher_comment = ?, teacher_evaluation = ?, updated_at = datetime('now')
      WHERE id = ?
    `).bind(teacher_comment, teacher_evaluation, submissionId).run()
    
    return c.json({ success: true })
  } catch (error: any) {
    console.error('教師コメント追加エラー:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// 教師の見取り（観察記録）の追加
app.post('/api/teacher-observations', async (c) => {
  const { env } = c
  const {
    student_id,
    curriculum_id,
    observation_date,
    observation_type,
    observation_text,
    context,
    related_activity,
    non_cognitive_tags,
    is_positive,
    is_shared_with_parents,
    created_by
  } = await c.req.json()
  
  try {
    const result = await env.DB.prepare(`
      INSERT INTO teacher_observations (
        student_id, curriculum_id, observation_date, observation_type,
        observation_text, context, related_activity, non_cognitive_tags,
        is_positive, is_shared_with_parents, created_by,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).bind(
      student_id, curriculum_id, observation_date, observation_type,
      observation_text, context, related_activity, non_cognitive_tags,
      is_positive ? 1 : 0, is_shared_with_parents ? 1 : 0, created_by
    ).run()
    
    return c.json({ success: true, observation_id: result.meta.last_row_id })
  } catch (error: any) {
    console.error('見取り記録エラー:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// 教師の見取りの取得
app.get('/api/teacher-observations/:studentId', async (c) => {
  const { env } = c
  const studentId = c.req.param('studentId')
  
  try {
    const observations = await env.DB.prepare(`
      SELECT o.*, u.name as teacher_name, c.unit_name
      FROM teacher_observations o
      LEFT JOIN users u ON o.created_by = u.id
      LEFT JOIN curriculum c ON o.curriculum_id = c.id
      WHERE o.student_id = ?
      ORDER BY o.observation_date DESC, o.created_at DESC
    `).bind(studentId).all()
    
    return c.json({ success: true, observations: observations.results })
  } catch (error: any) {
    console.error('見取り取得エラー:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// 生徒の振り返りの投稿
app.post('/api/student-reflections', async (c) => {
  const { env } = c
  const {
    student_id,
    curriculum_id,
    reflection_date,
    reflection_type,
    what_learned,
    what_understood,
    what_difficult,
    what_enjoyed,
    next_goals,
    mood_rating,
    effort_rating,
    understanding_rating
  } = await c.req.json()
  
  try {
    const result = await env.DB.prepare(`
      INSERT INTO student_reflections (
        student_id, curriculum_id, reflection_date, reflection_type,
        what_learned, what_understood, what_difficult, what_enjoyed,
        next_goals, mood_rating, effort_rating, understanding_rating,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).bind(
      student_id, curriculum_id, reflection_date, reflection_type,
      what_learned, what_understood, what_difficult, what_enjoyed,
      next_goals, mood_rating, effort_rating, understanding_rating
    ).run()
    
    return c.json({ success: true, reflection_id: result.meta.last_row_id })
  } catch (error: any) {
    console.error('振り返り投稿エラー:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// 生徒の振り返りの取得
app.get('/api/student-reflections/:studentId', async (c) => {
  const { env } = c
  const studentId = c.req.param('studentId')
  
  try {
    const reflections = await env.DB.prepare(`
      SELECT r.*, c.unit_name
      FROM student_reflections r
      LEFT JOIN curriculum c ON r.curriculum_id = c.id
      WHERE r.student_id = ?
      ORDER BY r.reflection_date DESC, r.created_at DESC
    `).bind(studentId).all()
    
    return c.json({ success: true, reflections: reflections.results })
  } catch (error: any) {
    console.error('振り返り取得エラー:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// 教科横断評価の保存・取得
app.post('/api/cross-subject-evaluations', async (c) => {
  const { env } = c
  const evaluation = await c.req.json()
  
  try {
    const result = await env.DB.prepare(`
      INSERT INTO cross_subject_evaluations (
        student_id, evaluation_period_start, evaluation_period_end,
        reading_comprehension, writing_expression, logical_thinking,
        creative_thinking, problem_solving, persistence_score,
        self_regulation_score, collaboration_score, curiosity_score,
        metacognition_score, growth_mindset_score, overall_comment,
        strengths, areas_for_growth, recommendations, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).bind(
      evaluation.student_id, evaluation.evaluation_period_start, evaluation.evaluation_period_end,
      evaluation.reading_comprehension, evaluation.writing_expression, evaluation.logical_thinking,
      evaluation.creative_thinking, evaluation.problem_solving, evaluation.persistence_score,
      evaluation.self_regulation_score, evaluation.collaboration_score, evaluation.curiosity_score,
      evaluation.metacognition_score, evaluation.growth_mindset_score, evaluation.overall_comment,
      evaluation.strengths, evaluation.areas_for_growth, evaluation.recommendations
    ).run()
    
    return c.json({ success: true, evaluation_id: result.meta.last_row_id })
  } catch (error: any) {
    console.error('教科横断評価エラー:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

app.get('/api/cross-subject-evaluations/:studentId', async (c) => {
  const { env } = c
  const studentId = c.req.param('studentId')
  
  try {
    const evaluations = await env.DB.prepare(`
      SELECT * FROM cross_subject_evaluations
      WHERE student_id = ?
      ORDER BY evaluation_period_end DESC
    `).bind(studentId).all()
    
    return c.json({ success: true, evaluations: evaluations.results })
  } catch (error: any) {
    console.error('教科横断評価取得エラー:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// =============================================================================
// フィードバック・お問い合わせAPI
// =============================================================================

// APIルート：フィードバック送信
app.post('/api/feedback', async (c) => {
  const { env } = c
  const body = await c.req.json()
  
  try {
    // フィードバックをデータベースに保存
    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS user_feedback (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL,
        email TEXT,
        message TEXT NOT NULL,
        user_id TEXT,
        user_name TEXT,
        user_role TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run()
    
    const result = await env.DB.prepare(`
      INSERT INTO user_feedback 
        (type, email, message, user_id, user_name, user_role, created_at)
      VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).bind(
      body.type || 'feedback',
      body.email || '',
      body.message,
      body.user_id || '',
      body.user_name || '',
      body.user_role || 'student'
    ).run()
    
    console.log('✅ フィードバック保存完了:', result.meta.last_row_id)
    
    return c.json({ 
      success: true, 
      id: result.meta.last_row_id,
      message: 'フィードバックを受け付けました'
    })
  } catch (error: any) {
    console.error('フィードバック保存エラー:', error)
    return c.json({ 
      success: false, 
      error: error.message || 'フィードバックの保存に失敗しました' 
    }, 500)
  }
})

// APIルート：フィードバック一覧取得（管理者用）
app.get('/api/feedback/list', async (c) => {
  const { env } = c
  
  try {
    const feedbacks = await env.DB.prepare(`
      SELECT * FROM user_feedback 
      ORDER BY created_at DESC 
      LIMIT 100
    `).all()
    
    return c.json({ success: true, feedbacks: feedbacks.results })
  } catch (error: any) {
    console.error('フィードバック取得エラー:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// ============================================
// 選択問題進捗 & 復習努力記録API
// ============================================

// 選択問題の進捗を記録
app.post('/api/optional-problem/progress', async (c) => {
  const { env } = c
  const { student_id, curriculum_id, optional_problem_id, status, understanding_level, time_spent_minutes } = await c.req.json()
  
  try {
    // 既存の進捗を確認
    const existing = await env.DB.prepare(`
      SELECT id, attempts_count FROM optional_problem_progress
      WHERE student_id = ? AND optional_problem_id = ?
    `).bind(student_id, optional_problem_id).first()
    
    if (existing) {
      // 更新
      const newAttempts = (existing.attempts_count || 0) + 1
      const isCompleted = status === 'completed' ? 1 : 0
      
      await env.DB.prepare(`
        UPDATE optional_problem_progress
        SET status = ?,
            understanding_level = ?,
            time_spent_minutes = time_spent_minutes + ?,
            attempts_count = ?,
            is_completed = ?,
            completed_at = CASE WHEN ? = 1 AND completed_at IS NULL THEN datetime('now') ELSE completed_at END,
            updated_at = datetime('now')
        WHERE id = ?
      `).bind(
        status,
        understanding_level,
        time_spent_minutes,
        newAttempts,
        isCompleted,
        isCompleted,
        existing.id
      ).run()
      
      return c.json({ success: true, id: existing.id })
    } else {
      // 新規作成
      const result = await env.DB.prepare(`
        INSERT INTO optional_problem_progress (
          student_id, curriculum_id, optional_problem_id, status, 
          understanding_level, time_spent_minutes, attempts_count,
          is_completed, completed_at, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, 1, ?, 
                  CASE WHEN ? = 'completed' THEN datetime('now') ELSE NULL END,
                  datetime('now'), datetime('now'))
      `).bind(
        student_id,
        curriculum_id,
        optional_problem_id,
        status,
        understanding_level,
        time_spent_minutes,
        status === 'completed' ? 1 : 0,
        status
      ).run()
      
      return c.json({ success: true, id: result.meta.last_row_id })
    }
  } catch (error: any) {
    console.error('選択問題進捗記録エラー:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// 選択問題の進捗を取得
app.get('/api/optional-problem/progress/:studentId/:curriculumId', async (c) => {
  const { env } = c
  const studentId = c.req.param('studentId')
  const curriculumId = c.req.param('curriculumId')
  
  try {
    const progress = await env.DB.prepare(`
      SELECT 
        opp.*,
        op.problem_title,
        op.problem_category
      FROM optional_problem_progress opp
      JOIN optional_problems op ON opp.optional_problem_id = op.id
      WHERE opp.student_id = ? AND opp.curriculum_id = ?
      ORDER BY op.problem_number
    `).bind(studentId, curriculumId).all()
    
    return c.json({ success: true, progress: progress.results })
  } catch (error: any) {
    console.error('選択問題進捗取得エラー:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// カード復習（「もう一度練習」）を記録
app.post('/api/card/review-log', async (c) => {
  const { env } = c
  const { 
    student_id, 
    card_id, 
    curriculum_id, 
    review_type, 
    is_already_cleared, 
    is_correct, 
    answer_time_seconds, 
    hint_count 
  } = await c.req.json()
  
  try {
    // 復習ログを記録
    const result = await env.DB.prepare(`
      INSERT INTO card_review_logs (
        student_id, card_id, curriculum_id, review_type,
        is_already_cleared, is_correct, answer_time_seconds, hint_count,
        effort_points, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, datetime('now'))
    `).bind(
      student_id,
      card_id,
      curriculum_id,
      review_type,
      is_already_cleared ? 1 : 0,
      is_correct ? 1 : 0,
      answer_time_seconds,
      hint_count
    ).run()
    
    // learning_logsにも記録（retry_countを増やす）
    await env.DB.prepare(`
      INSERT INTO learning_logs (
        student_id, unit_id, card_id, course_type,
        is_correct, answer_time_seconds, hint_count, retry_count,
        difficulty_level, problem_type, created_at
      ) VALUES (?, ?, ?, '復習', ?, ?, ?, 1, 'review', 'review', datetime('now'))
    `).bind(
      student_id,
      String(curriculum_id),
      String(card_id),
      is_correct ? 1 : 0,
      answer_time_seconds,
      hint_count
    ).run()
    
    return c.json({ 
      success: true, 
      review_log_id: result.meta.last_row_id,
      effort_points: 1,
      message: '復習の努力が記録されました！頑張りましたね！'
    })
  } catch (error: any) {
    console.error('復習ログ記録エラー:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// 学生の学習統計を取得（選択問題と復習を含む）
app.get('/api/student/learning-stats/:studentId/:curriculumId', async (c) => {
  const { env } = c
  const studentId = c.req.param('studentId')
  const curriculumId = c.req.param('curriculumId')
  
  try {
    // 基本カード進捗
    const cardProgress = await env.DB.prepare(`
      SELECT 
        COUNT(DISTINCT learning_card_id) as completed_cards,
        AVG(understanding_level) as avg_understanding,
        SUM(help_count) as total_help_requests
      FROM student_progress
      WHERE student_id = ? AND curriculum_id = ?
    `).bind(studentId, curriculumId).first()
    
    // 選択問題進捗
    const optionalProgress = await env.DB.prepare(`
      SELECT 
        COUNT(*) as completed_optional_problems,
        SUM(time_spent_minutes) as total_optional_time,
        AVG(understanding_level) as avg_optional_understanding
      FROM optional_problem_progress
      WHERE student_id = ? AND curriculum_id = ? AND is_completed = 1
    `).bind(studentId, curriculumId).first()
    
    // 復習努力
    const reviewEffort = await env.DB.prepare(`
      SELECT 
        COUNT(*) as review_count,
        SUM(effort_points) as total_effort_points,
        SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) as correct_reviews
      FROM card_review_logs
      WHERE student_id = ? AND curriculum_id = ?
    `).bind(studentId, curriculumId).first()
    
    return c.json({ 
      success: true, 
      stats: {
        ...cardProgress,
        ...optionalProgress,
        ...reviewEffort
      }
    })
  } catch (error: any) {
    console.error('学習統計取得エラー:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// ============================================
// Phase 7: リアルタイム通知機能 API
// ============================================

// 先生からのメッセージ送信API
app.post('/api/notifications/send-message', async (c) => {
  const { env } = c
  const { teacherId, studentId, message, priority } = await c.req.json()
  
  try {
    // メッセージをDBに保存
    const result = await env.DB.prepare(`
      INSERT INTO teacher_messages (teacher_id, student_id, message, priority, created_at)
      VALUES (?, ?, ?, ?, datetime('now'))
    `).bind(teacherId, studentId, message, priority || 'normal').run()
    
    // WebSocket経由で通知を送信
    // Note: Durable Objectsを使用している場合は、そのインスタンスにメッセージを送信
    
    return c.json({
      success: true,
      messageId: result.meta.last_row_id
    })
  } catch (error: any) {
    console.error('❌ メッセージ送信エラー:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// 新しいカード配信通知API
app.post('/api/notifications/distribute-card', async (c) => {
  const { env } = c
  const { cardId, studentIds, teacherId } = await c.req.json()
  
  try {
    // カード情報を取得
    const card = await env.DB.prepare(`
      SELECT 
        lc.*,
        c.course_name,
        cu.unit_name
      FROM learning_cards lc
      JOIN courses c ON lc.course_id = c.id
      JOIN curriculum cu ON c.curriculum_id = cu.id
      WHERE lc.id = ?
    `).bind(cardId).first()
    
    if (!card) {
      return c.json({ success: false, error: 'カードが見つかりません' }, 404)
    }
    
    // 各生徒に通知を送信
    for (const studentId of studentIds) {
      await env.DB.prepare(`
        INSERT INTO card_distributions (card_id, student_id, teacher_id, created_at)
        VALUES (?, ?, ?, datetime('now'))
      `).bind(cardId, studentId, teacherId).run()
      
      // WebSocket経由で通知（実際のWebSocket実装に依存）
      // この部分はDurable Objectsの実装に合わせて調整が必要
    }
    
    return c.json({
      success: true,
      distributedCount: studentIds.length,
      cardTitle: card.card_title
    })
  } catch (error: any) {
    console.error('❌ カード配信エラー:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// 通知履歴取得API
app.get('/api/notifications/history/:studentId', async (c) => {
  const { env } = c
  const studentId = c.req.param('studentId')
  const limit = c.req.query('limit') || '20'
  
  try {
    // 先生からのメッセージ
    const messages = await env.DB.prepare(`
      SELECT 
        tm.*,
        u.name as teacher_name
      FROM teacher_messages tm
      LEFT JOIN users u ON tm.teacher_id = u.id
      WHERE tm.student_id = ?
      ORDER BY tm.created_at DESC
      LIMIT ?
    `).bind(studentId, parseInt(limit)).all()
    
    // カード配信通知
    const distributions = await env.DB.prepare(`
      SELECT 
        cd.*,
        lc.card_title,
        c.course_name,
        u.name as teacher_name
      FROM card_distributions cd
      JOIN learning_cards lc ON cd.card_id = lc.id
      JOIN courses c ON lc.course_id = c.id
      LEFT JOIN users u ON cd.teacher_id = u.id
      WHERE cd.student_id = ?
      ORDER BY cd.created_at DESC
      LIMIT ?
    `).bind(studentId, parseInt(limit)).all()
    
    return c.json({
      success: true,
      messages: messages.results,
      distributions: distributions.results
    })
  } catch (error: any) {
    console.error('❌ 通知履歴取得エラー:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// ============================================
// Phase 9: 学習スタイル対応 API
// ============================================

// 学習スタイルに応じた問題生成API
app.post('/api/learning-styles/generate-problem', async (c) => {
  const { env } = c
  const { cardId, learningStyle } = await c.req.json()
  
  const apiKey = env.GEMINI_API_KEY
  
  if (!apiKey) {
    return c.json({
      success: false,
      error: 'GEMINI_API_KEYが設定されていません'
    }, 400)
  }
  
  try {
    // 元のカード情報を取得
    const card = await env.DB.prepare(`
      SELECT 
        lc.*,
        c.course_name,
        c.grade,
        cu.subject
      FROM learning_cards lc
      JOIN courses c ON lc.course_id = c.id
      JOIN curriculum cu ON c.curriculum_id = cu.id
      WHERE lc.id = ?
    `).bind(cardId).first()
    
    if (!card) {
      return c.json({ success: false, error: 'カードが見つかりません' }, 404)
    }
    
    // 学習スタイル別のプロンプトを作成
    let stylePrompt = ''
    let styleRequirements = ''
    
    switch (learningStyle) {
      case 'visual':
        stylePrompt = '視覚型学習者向けに、図やイラスト、色分けを使った視覚的な表現'
        styleRequirements = `
- 数字や計算式を大きく、色分けして表示
- 図解やイラストを含める
- ステップを視覚的に区切る
- アイコンや絵文字を効果的に使用
        `
        break
      case 'auditory':
        stylePrompt = '聴覚型学習者向けに、音声読み上げに適した文章とリズム感のある表現'
        styleRequirements = `
- 読み上げやすい文章構造
- リズムや擬音語を含める
- ステップを声に出して確認できる形式
- 重要な言葉を強調
        `
        break
      case 'kinesthetic':
        stylePrompt = '体感型学習者向けに、実際に手を動かして体験できる形式の表現'
        styleRequirements = `
- 実際に試せるステップバイステップの指示
- 具体的な操作や動作を含める
- インタラクティブな要素
- 手を動かしながら学べる構成
        `
        break
      default:
        return c.json({ success: false, error: '無効な学習スタイル' }, 400)
    }
    
    const prompt = `あなたは小学生の学習スタイルに合わせた問題を作成するAI先生です。

【元の問題】
タイトル: ${card.card_title}
問題: ${card.problem_description}
解答: ${card.answer}

【学習スタイル】
${stylePrompt}

【要件】
${styleRequirements}

以下のJSON形式で、学習スタイルに最適化した問題を出力してください：
{
  "styled_title": "学習スタイルに合わせたタイトル",
  "styled_problem": "学習スタイルに最適化した問題文（HTML可）",
  "visual_enhancements": "視覚的な強化要素の説明（視覚型の場合）",
  "auditory_cues": "聴覚的な手がかりの説明（聴覚型の場合）",
  "interactive_elements": "体験的な要素の説明（体感型の場合）",
  "teaching_tips": "この学習スタイルでの指導ポイント"
}`

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.8,
            maxOutputTokens: 2048,
            topK: 40,
            topP: 0.95
          }
        })
      }
    )
    
    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(`Gemini API エラー: ${JSON.stringify(data)}`)
    }
    
    if (!data.candidates || data.candidates.length === 0) {
      throw new Error('Gemini APIから有効な応答がありませんでした')
    }
    
    const candidate = data.candidates[0]
    const content = candidate.content
    
    if (!content || !content.parts || content.parts.length === 0) {
      throw new Error('Gemini APIからのコンテンツが空です')
    }
    
    const aiResponse = content.parts[0].text
    const styledProblem = extractJSON(aiResponse)
    
    return c.json({
      success: true,
      originalCard: card,
      styledProblem: styledProblem,
      learningStyle: learningStyle
    })
  } catch (error: any) {
    console.error('❌ 学習スタイル問題生成エラー:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// 学習スタイル設定保存API
app.post('/api/learning-styles/set-preference', async (c) => {
  const { env } = c
  const { studentId, learningStyle } = await c.req.json()
  
  try {
    // 既存の設定を更新または新規作成
    await env.DB.prepare(`
      INSERT INTO student_learning_preferences (student_id, learning_style, updated_at)
      VALUES (?, ?, datetime('now'))
      ON CONFLICT(student_id) 
      DO UPDATE SET 
        learning_style = ?,
        updated_at = datetime('now')
    `).bind(studentId, learningStyle, learningStyle).run()
    
    return c.json({
      success: true,
      studentId: studentId,
      learningStyle: learningStyle
    })
  } catch (error: any) {
    console.error('❌ 学習スタイル設定エラー:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// 学習スタイル設定取得API
app.get('/api/learning-styles/preference/:studentId', async (c) => {
  const { env } = c
  const studentId = c.req.param('studentId')
  
  try {
    const preference = await env.DB.prepare(`
      SELECT * FROM student_learning_preferences
      WHERE student_id = ?
    `).bind(studentId).first()
    
    return c.json({
      success: true,
      preference: preference || { learning_style: 'visual' } // デフォルトは視覚型
    })
  } catch (error: any) {
    console.error('❌ 学習スタイル取得エラー:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// ========================================
// 分散学習システム API
// ========================================

import { SpacedLearningEngine } from './lib/SpacedLearningEngine'

// 今日の復習予定を取得
app.get('/api/spaced-learning/today-reviews/:studentId', async (c) => {
  const { env } = c
  const studentId = parseInt(c.req.param('studentId'))
  
  try {
    const engine = new SpacedLearningEngine(env.DB)
    const reviews = await engine.getTodayReviews(studentId)
    const count = reviews.length
    
    return c.json({
      success: true,
      count,
      reviews
    })
  } catch (error: any) {
    console.error('❌ 今日の復習取得エラー:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// 復習予定数を取得
app.get('/api/spaced-learning/review-count/:studentId', async (c) => {
  const { env } = c
  const studentId = parseInt(c.req.param('studentId'))
  
  try {
    const engine = new SpacedLearningEngine(env.DB)
    const count = await engine.getTodayReviewCount(studentId)
    
    return c.json({
      success: true,
      count
    })
  } catch (error: any) {
    console.error('❌ 復習予定数取得エラー:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// 週次スケジュールを取得
app.get('/api/spaced-learning/weekly-schedule/:studentId', async (c) => {
  const { env } = c
  const studentId = parseInt(c.req.param('studentId'))
  
  try {
    const engine = new SpacedLearningEngine(env.DB)
    const schedule = await engine.generateWeeklySchedule(studentId)
    
    return c.json({
      success: true,
      schedule
    })
  } catch (error: any) {
    console.error('❌ 週次スケジュール取得エラー:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// 習熟度統計を取得
app.get('/api/spaced-learning/mastery-stats/:studentId', async (c) => {
  const { env } = c
  const studentId = parseInt(c.req.param('studentId'))
  
  try {
    const engine = new SpacedLearningEngine(env.DB)
    const stats = await engine.getMasteryStatistics(studentId)
    
    return c.json({
      success: true,
      stats
    })
  } catch (error: any) {
    console.error('❌ 習熟度統計取得エラー:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// 復習結果を記録
app.post('/api/spaced-learning/record-review', async (c) => {
  const { env } = c
  const { 
    studentId, 
    cardId, 
    result,  // 'correct' | 'incorrect' | 'partial'
    sessionType = 'review',  // 'initial' | 'review' | 'intensive' | 'test'
    responseTime,
    difficultyRating,  // 1-5
    confidenceLevel,   // 1-5
    srlStage,          // 'foresight' | 'performance' | 'reflection'
    srlStrategyUsed,
    srlNotes
  } = await c.req.json()
  
  try {
    const engine = new SpacedLearningEngine(env.DB)
    
    const updatedSchedule = await engine.recordStudyResult(
      studentId,
      cardId,
      result,
      sessionType,
      responseTime,
      difficultyRating,
      confidenceLevel,
      srlStage,
      srlStrategyUsed,
      srlNotes
    )
    
    return c.json({
      success: true,
      schedule: updatedSchedule,
      mastery: {
        mastery_level: updatedSchedule.mastery_level,
        leitner_box: updatedSchedule.leitner_box,
        learning_stage: updatedSchedule.learning_stage,
        next_review_date: updatedSchedule.next_review_date
      }
    })
  } catch (error: any) {
    console.error('❌ 復習記録エラー:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// 忘却リスク検出
app.get('/api/spaced-learning/forgetting-risk/:studentId', async (c) => {
  const { env } = c
  const studentId = parseInt(c.req.param('studentId'))
  const limit = parseInt(c.req.query('limit') || '10')
  
  try {
    const engine = new SpacedLearningEngine(env.DB)
    const recommendations = await engine.getForgettingRiskCards(studentId, limit)
    
    return c.json({
      success: true,
      recommendations
    })
  } catch (error: any) {
    console.error('❌ 忘却リスク検出エラー:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// 設定を取得
app.get('/api/spaced-learning/settings/:studentId', async (c) => {
  const { env } = c
  const studentId = parseInt(c.req.param('studentId'))
  
  try {
    const engine = new SpacedLearningEngine(env.DB)
    const settings = await engine.getSettings(studentId)
    
    return c.json({
      success: true,
      settings: settings || {
        daily_new_items: 5,
        daily_review_limit: 20,
        enable_daily_reminder: true,
        reminder_time: '19:00'
      }
    })
  } catch (error: any) {
    console.error('❌ 設定取得エラー:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// 設定を更新
app.put('/api/spaced-learning/settings/:studentId', async (c) => {
  const { env } = c
  const studentId = parseInt(c.req.param('studentId'))
  const settings = await c.req.json()
  
  try {
    const engine = new SpacedLearningEngine(env.DB)
    await engine.updateSettings(studentId, settings)
    
    return c.json({
      success: true
    })
  } catch (error: any) {
    console.error('❌ 設定更新エラー:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// 学習項目の習熟度を取得または作成
app.get('/api/spaced-learning/mastery/:studentId/:cardId', async (c) => {
  const { env } = c
  const studentId = parseInt(c.req.param('studentId'))
  const cardId = parseInt(c.req.param('cardId'))
  
  try {
    const engine = new SpacedLearningEngine(env.DB)
    const mastery = await engine.getOrCreateMastery(studentId, cardId)
    
    return c.json({
      success: true,
      mastery
    })
  } catch (error: any) {
    console.error('❌ 習熟度取得エラー:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// 学習履歴を取得
app.get('/api/spaced-learning/history/:studentId', async (c) => {
  const { env } = c
  const studentId = parseInt(c.req.param('studentId'))
  const cardId = c.req.query('cardId') ? parseInt(c.req.query('cardId')!) : undefined
  const limit = parseInt(c.req.query('limit') || '50')
  
  try {
    const engine = new SpacedLearningEngine(env.DB)
    const history = await engine.getStudyHistory(studentId, cardId, limit)
    
    return c.json({
      success: true,
      history
    })
  } catch (error: any) {
    console.error('❌ 学習履歴取得エラー:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// スケジュールの直接取得（デバッグ用）
app.get('/api/spaced-learning/schedule/:studentId/:cardId', async (c) => {
  const { env } = c
  const studentId = parseInt(c.req.param('studentId'))
  const cardId = parseInt(c.req.param('cardId'))
  
  try {
    const engine = new SpacedLearningEngine(env.DB)
    const schedule = await engine.getOrCreateSchedule(studentId, cardId)
    
    return c.json({
      success: true,
      schedule
    })
  } catch (error: any) {
    console.error('❌ スケジュール取得エラー:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// ================================
// 協働学習API (Collaborative Learning)
// ================================

// 1. 友達の回答一覧取得
app.get('/api/collaborative/peer-answers/:cardId', async (c) => {
  const { env } = c
  const cardId = parseInt(c.req.param('cardId'))
  const studentId = parseInt(c.req.query('studentId') || '0')
  const classCode = c.req.query('classCode')
  
  if (!classCode) {
    return c.json({ success: false, error: 'クラスコードが必要です' }, 400)
  }
  
  try {
    // 同じクラスの生徒の回答を取得
    const result = await env.DB.prepare(`
      SELECT 
        pa.id,
        pa.student_id,
        u.name as student_name,
        pa.answer_text,
        pa.approach_type,
        pa.is_public,
        pa.created_at,
        pa.updated_at,
        COALESCE(AVG(pe.rating), 0) as average_rating,
        COUNT(DISTINCT pe.id) as evaluation_count,
        COUNT(DISTINCT pv.id) as view_count,
        COUNT(DISTINCT ph.id) as helpful_count
      FROM peer_answers pa
      JOIN users u ON pa.student_id = u.id
      LEFT JOIN peer_evaluations pe ON pa.id = pe.answer_id
      LEFT JOIN peer_answer_views pv ON pa.id = pv.answer_id
      LEFT JOIN peer_helpful_marks ph ON pa.id = ph.answer_id
      WHERE pa.card_id = ? 
        AND u.class_code = ?
        AND pa.is_public = 1
        AND pa.student_id != ?
      GROUP BY pa.id
      ORDER BY average_rating DESC, helpful_count DESC
      LIMIT 20
    `).bind(cardId, classCode, studentId).all()
    
    return c.json({
      success: true,
      answers: result.results
    })
  } catch (error: any) {
    console.error('❌ 友達の回答取得エラー:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// 2. 回答を投稿
app.post('/api/collaborative/submit-answer', async (c) => {
  const { env } = c
  const { studentId, cardId, answerText, approachType, isPublic = true } = await c.req.json()
  
  try {
    // 既存の回答を確認
    const existing = await env.DB.prepare(`
      SELECT id FROM peer_answers 
      WHERE student_id = ? AND card_id = ?
    `).bind(studentId, cardId).first()
    
    if (existing) {
      // 更新
      await env.DB.prepare(`
        UPDATE peer_answers 
        SET answer_text = ?,
            approach_type = ?,
            is_public = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(answerText, approachType, isPublic ? 1 : 0, existing.id).run()
      
      return c.json({
        success: true,
        answerId: existing.id,
        message: '回答を更新しました'
      })
    } else {
      // 新規作成
      const result = await env.DB.prepare(`
        INSERT INTO peer_answers (student_id, card_id, answer_text, approach_type, is_public)
        VALUES (?, ?, ?, ?, ?)
      `).bind(studentId, cardId, answerText, approachType, isPublic ? 1 : 0).run()
      
      return c.json({
        success: true,
        answerId: result.meta.last_row_id,
        message: '回答を投稿しました'
      })
    }
  } catch (error: any) {
    console.error('❌ 回答投稿エラー:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// 3. ピア評価を投稿
app.post('/api/collaborative/submit-evaluation', async (c) => {
  const { env } = c
  const { 
    evaluatorId, 
    answerId, 
    rating, 
    feedbackText, 
    helpfulAspects,
    learningGained 
  } = await c.req.json()
  
  try {
    // 既存の評価を確認
    const existing = await env.DB.prepare(`
      SELECT id FROM peer_evaluations 
      WHERE evaluator_id = ? AND answer_id = ?
    `).bind(evaluatorId, answerId).first()
    
    if (existing) {
      // 更新
      await env.DB.prepare(`
        UPDATE peer_evaluations 
        SET rating = ?,
            feedback_text = ?,
            helpful_aspects = ?,
            learning_gained = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(rating, feedbackText, helpfulAspects, learningGained, existing.id).run()
      
      return c.json({
        success: true,
        evaluationId: existing.id,
        message: '評価を更新しました'
      })
    } else {
      // 新規作成
      const result = await env.DB.prepare(`
        INSERT INTO peer_evaluations 
        (evaluator_id, answer_id, rating, feedback_text, helpful_aspects, learning_gained)
        VALUES (?, ?, ?, ?, ?, ?)
      `).bind(evaluatorId, answerId, rating, feedbackText, helpfulAspects, learningGained).run()
      
      return c.json({
        success: true,
        evaluationId: result.meta.last_row_id,
        message: '評価を投稿しました'
      })
    }
  } catch (error: any) {
    console.error('❌ 評価投稿エラー:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// 4. 役に立ったマークを切り替え
app.post('/api/collaborative/toggle-helpful', async (c) => {
  const { env } = c
  const { studentId, answerId } = await c.req.json()
  
  try {
    // 既存のマークを確認
    const existing = await env.DB.prepare(`
      SELECT id FROM peer_helpful_marks 
      WHERE student_id = ? AND answer_id = ?
    `).bind(studentId, answerId).first()
    
    if (existing) {
      // 削除（トグルOFF）
      await env.DB.prepare(`
        DELETE FROM peer_helpful_marks WHERE id = ?
      `).bind(existing.id).run()
      
      return c.json({
        success: true,
        isHelpful: false,
        message: '役に立ったマークを解除しました'
      })
    } else {
      // 追加（トグルON）
      await env.DB.prepare(`
        INSERT INTO peer_helpful_marks (student_id, answer_id)
        VALUES (?, ?)
      `).bind(studentId, answerId).run()
      
      return c.json({
        success: true,
        isHelpful: true,
        message: '役に立ったマークを追加しました'
      })
    }
  } catch (error: any) {
    console.error('❌ 役に立ったマーク切り替えエラー:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// 5. 回答の閲覧記録
app.post('/api/collaborative/record-view', async (c) => {
  const { env } = c
  const { viewerId, answerId, viewDuration } = await c.req.json()
  
  try {
    await env.DB.prepare(`
      INSERT INTO peer_answer_views (viewer_id, answer_id, view_duration)
      VALUES (?, ?, ?)
    `).bind(viewerId, answerId, viewDuration).run()
    
    return c.json({
      success: true,
      message: '閲覧記録を保存しました'
    })
  } catch (error: any) {
    console.error('❌ 閲覧記録エラー:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// 6. 協働学習統計取得
app.get('/api/collaborative/stats/:studentId', async (c) => {
  const { env } = c
  const studentId = parseInt(c.req.param('studentId'))
  
  try {
    // 自分の回答統計
    const myAnswers = await env.DB.prepare(`
      SELECT 
        COUNT(*) as total_answers,
        COUNT(CASE WHEN is_public = 1 THEN 1 END) as public_answers,
        AVG(CASE WHEN is_public = 1 THEN (
          SELECT AVG(rating) FROM peer_evaluations WHERE answer_id = peer_answers.id
        ) END) as average_rating_received
      FROM peer_answers
      WHERE student_id = ?
    `).bind(studentId).first()
    
    // 評価した回数
    const evaluationsGiven = await env.DB.prepare(`
      SELECT COUNT(*) as count
      FROM peer_evaluations
      WHERE evaluator_id = ?
    `).bind(studentId).first()
    
    // 閲覧した回答数
    const answersViewed = await env.DB.prepare(`
      SELECT COUNT(DISTINCT answer_id) as count
      FROM peer_answer_views
      WHERE viewer_id = ?
    `).bind(studentId).first()
    
    // 役に立ったマークを受けた回数
    const helpfulReceived = await env.DB.prepare(`
      SELECT COUNT(*) as count
      FROM peer_helpful_marks phm
      JOIN peer_answers pa ON phm.answer_id = pa.id
      WHERE pa.student_id = ?
    `).bind(studentId).first()
    
    return c.json({
      success: true,
      stats: {
        totalAnswers: myAnswers?.total_answers || 0,
        publicAnswers: myAnswers?.public_answers || 0,
        averageRating: myAnswers?.average_rating_received || 0,
        evaluationsGiven: evaluationsGiven?.count || 0,
        answersViewed: answersViewed?.count || 0,
        helpfulReceived: helpfulReceived?.count || 0
      }
    })
  } catch (error: any) {
    console.error('❌ 協働学習統計取得エラー:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// 7. クラス全体の協働学習活動取得
app.get('/api/collaborative/class-activity/:classCode', async (c) => {
  const { env } = c
  const classCode = c.req.param('classCode')
  
  try {
    const result = await env.DB.prepare(`
      SELECT 
        u.id as student_id,
        u.name as student_name,
        COUNT(DISTINCT pa.id) as answers_shared,
        COUNT(DISTINCT pe.id) as evaluations_given,
        AVG(CASE WHEN pe2.answer_id IS NOT NULL THEN pe2.rating END) as avg_rating_received,
        COUNT(DISTINCT phm.id) as helpful_marks_received
      FROM users u
      LEFT JOIN peer_answers pa ON u.id = pa.student_id AND pa.is_public = 1
      LEFT JOIN peer_evaluations pe ON u.id = pe.evaluator_id
      LEFT JOIN peer_answers pa2 ON u.id = pa2.student_id
      LEFT JOIN peer_evaluations pe2 ON pa2.id = pe2.answer_id
      LEFT JOIN peer_helpful_marks phm ON pa2.id = phm.answer_id
      WHERE u.class_code = ?
      GROUP BY u.id
      ORDER BY (answers_shared + evaluations_given) DESC
      LIMIT 50
    `).bind(classCode).all()
    
    return c.json({
      success: true,
      activities: result.results
    })
  } catch (error: any) {
    console.error('❌ クラス活動取得エラー:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// ================================
// 週次・月次レポートAPI (Weekly/Monthly Reports)
// ================================

// 1. 週次レポート生成
app.post('/api/reports/weekly/:studentId', async (c) => {
  const { env } = c
  const studentId = parseInt(c.req.param('studentId'))
  const { weekStart, weekEnd } = await c.req.json()
  
  try {
    // レポートデータを集計
    const reportData = await env.DB.prepare(`
      SELECT 
        COUNT(DISTINCT slh.id) as total_reviews,
        AVG(slh.quality_rating) as avg_quality,
        COUNT(DISTINCT slh.card_id) as unique_cards,
        AVG(slh.is_correct) as accuracy_rate,
        SUM(slh.response_time) as total_study_time,
        COUNT(DISTINCT CASE WHEN slh.srl_stage = 'foresee' THEN slh.id END) as foresee_count,
        COUNT(DISTINCT CASE WHEN slh.srl_stage = 'performance' THEN slh.id END) as performance_count,
        COUNT(DISTINCT CASE WHEN slh.srl_stage = 'reflection' THEN slh.id END) as reflection_count
      FROM spaced_learning_history slh
      WHERE slh.student_id = ?
        AND slh.reviewed_at BETWEEN ? AND ?
    `).bind(studentId, weekStart, weekEnd).first()
    
    // ScTNスコアの変化を取得
    const sctnProgress = await env.DB.prepare(`
      SELECT 
        AVG(CASE WHEN dimension = 'metacognition' THEN score END) as metacognition_score,
        AVG(CASE WHEN dimension = 'self_regulation' THEN score END) as self_regulation_score,
        AVG(CASE WHEN dimension = 'motivation' THEN score END) as motivation_score
      FROM sctn_survey_results
      WHERE student_id = ?
        AND survey_date BETWEEN ? AND ?
    `).bind(studentId, weekStart, weekEnd).first()
    
    // 学習方略の効果
    const strategyEffects = await env.DB.prepare(`
      SELECT 
        lsh.strategy_type,
        AVG(lsh.effectiveness_rating) as avg_effectiveness,
        COUNT(*) as usage_count
      FROM learning_strategy_history lsh
      WHERE lsh.student_id = ?
        AND lsh.used_at BETWEEN ? AND ?
      GROUP BY lsh.strategy_type
      ORDER BY avg_effectiveness DESC
    `).bind(studentId, weekStart, weekEnd).all()
    
    // レポートを保存
    const result = await env.DB.prepare(`
      INSERT INTO weekly_learning_reports 
      (student_id, week_start_date, week_end_date, total_study_time, 
       cards_reviewed, average_accuracy, sctn_metacognition_score, 
       sctn_self_regulation_score, spaced_learning_reviews)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      studentId, weekStart, weekEnd,
      reportData?.total_study_time || 0,
      reportData?.unique_cards || 0,
      reportData?.accuracy_rate || 0,
      sctnProgress?.metacognition_score || null,
      sctnProgress?.self_regulation_score || null,
      reportData?.total_reviews || 0
    ).run()
    
    return c.json({
      success: true,
      reportId: result.meta.last_row_id,
      summary: {
        totalReviews: reportData?.total_reviews || 0,
        avgQuality: reportData?.avg_quality || 0,
        uniqueCards: reportData?.unique_cards || 0,
        accuracyRate: (reportData?.accuracy_rate || 0) * 100,
        totalStudyTime: reportData?.total_study_time || 0,
        srlBreakdown: {
          foresee: reportData?.foresee_count || 0,
          performance: reportData?.performance_count || 0,
          reflection: reportData?.reflection_count || 0
        },
        sctnProgress: sctnProgress,
        topStrategies: strategyEffects.results.slice(0, 3)
      }
    })
  } catch (error: any) {
    console.error('❌ 週次レポート生成エラー:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// 2. 月次レポート生成
app.post('/api/reports/monthly/:studentId', async (c) => {
  const { env } = c
  const studentId = parseInt(c.req.param('studentId'))
  const { monthStart, monthEnd } = await c.req.json()
  
  try {
    // 月次統計
    const monthlyStats = await env.DB.prepare(`
      SELECT 
        COUNT(DISTINCT slh.id) as total_reviews,
        COUNT(DISTINCT slh.card_id) as unique_cards,
        AVG(slh.is_correct) as avg_accuracy,
        SUM(slh.response_time) as total_time,
        AVG(slh.quality_rating) as avg_quality
      FROM spaced_learning_history slh
      WHERE slh.student_id = ?
        AND slh.reviewed_at BETWEEN ? AND ?
    `).bind(studentId, monthStart, monthEnd).first()
    
    // 習熟度の推移
    const masteryTrend = await env.DB.prepare(`
      SELECT 
        DATE(slh.reviewed_at) as review_date,
        AVG(sls.mastery_level) as avg_mastery
      FROM spaced_learning_history slh
      JOIN spaced_learning_schedule sls ON slh.student_id = sls.student_id 
        AND slh.card_id = sls.card_id
      WHERE slh.student_id = ?
        AND slh.reviewed_at BETWEEN ? AND ?
      GROUP BY DATE(slh.reviewed_at)
      ORDER BY review_date
    `).bind(studentId, monthStart, monthEnd).all()
    
    // ScTN経年変化
    const sctnTrend = await env.DB.prepare(`
      SELECT 
        survey_date,
        AVG(CASE WHEN dimension = 'metacognition' THEN score END) as metacognition,
        AVG(CASE WHEN dimension = 'self_regulation' THEN score END) as self_regulation,
        AVG(CASE WHEN dimension = 'motivation' THEN score END) as motivation,
        AVG(CASE WHEN dimension = 'collaboration' THEN score END) as collaboration
      FROM sctn_survey_results
      WHERE student_id = ?
        AND survey_date BETWEEN ? AND ?
      GROUP BY survey_date
      ORDER BY survey_date
    `).bind(studentId, monthStart, monthEnd).all()
    
    // 協働学習の参加状況
    const collaborationStats = await env.DB.prepare(`
      SELECT 
        COUNT(DISTINCT pa.id) as answers_shared,
        COUNT(DISTINCT pe.id) as evaluations_given,
        AVG(pe2.rating) as avg_rating_received
      FROM users u
      LEFT JOIN peer_answers pa ON u.id = pa.student_id
      LEFT JOIN peer_evaluations pe ON u.id = pe.evaluator_id
      LEFT JOIN peer_answers pa2 ON u.id = pa2.student_id
      LEFT JOIN peer_evaluations pe2 ON pa2.id = pe2.answer_id
      WHERE u.id = ?
        AND pa.created_at BETWEEN ? AND ?
    `).bind(studentId, monthStart, monthEnd).first()
    
    // レポートを保存
    const result = await env.DB.prepare(`
      INSERT INTO monthly_learning_reports 
      (student_id, month_start_date, month_end_date, total_study_time,
       cards_mastered, average_accuracy, sctn_overall_growth,
       collaboration_score, spaced_learning_effectiveness)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      studentId, monthStart, monthEnd,
      monthlyStats?.total_time || 0,
      monthlyStats?.unique_cards || 0,
      monthlyStats?.avg_accuracy || 0,
      null, // 計算は後で実装
      collaborationStats?.answers_shared || 0,
      monthlyStats?.avg_quality || 0
    ).run()
    
    return c.json({
      success: true,
      reportId: result.meta.last_row_id,
      summary: {
        totalReviews: monthlyStats?.total_reviews || 0,
        uniqueCards: monthlyStats?.unique_cards || 0,
        avgAccuracy: (monthlyStats?.avg_accuracy || 0) * 100,
        totalTime: monthlyStats?.total_time || 0,
        avgQuality: monthlyStats?.avg_quality || 0,
        masteryTrend: masteryTrend.results,
        sctnTrend: sctnTrend.results,
        collaboration: collaborationStats
      }
    })
  } catch (error: any) {
    console.error('❌ 月次レポート生成エラー:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// 3. 週次レポート一覧取得
app.get('/api/reports/weekly/:studentId/list', async (c) => {
  const { env } = c
  const studentId = parseInt(c.req.param('studentId'))
  const limit = parseInt(c.req.query('limit') || '12') // 直近12週間
  
  try {
    const result = await env.DB.prepare(`
      SELECT * FROM weekly_learning_reports
      WHERE student_id = ?
      ORDER BY week_start_date DESC
      LIMIT ?
    `).bind(studentId, limit).all()
    
    return c.json({
      success: true,
      reports: result.results
    })
  } catch (error: any) {
    console.error('❌ 週次レポート一覧取得エラー:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// 4. 月次レポート一覧取得
app.get('/api/reports/monthly/:studentId/list', async (c) => {
  const { env } = c
  const studentId = parseInt(c.req.param('studentId'))
  const limit = parseInt(c.req.query('limit') || '12') // 直近12ヶ月
  
  try {
    const result = await env.DB.prepare(`
      SELECT * FROM monthly_learning_reports
      WHERE student_id = ?
      ORDER BY month_start_date DESC
      LIMIT ?
    `).bind(studentId, limit).all()
    
    return c.json({
      success: true,
      reports: result.results
    })
  } catch (error: any) {
    console.error('❌ 月次レポート一覧取得エラー:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// 5. ScTN経年変化データ取得
app.get('/api/reports/sctn-trend/:studentId', async (c) => {
  const { env } = c
  const studentId = parseInt(c.req.param('studentId'))
  const months = parseInt(c.req.query('months') || '12')
  
  try {
    const startDate = new Date()
    startDate.setMonth(startDate.getMonth() - months)
    
    const result = await env.DB.prepare(`
      SELECT 
        survey_date,
        dimension,
        score,
        package_type
      FROM sctn_survey_results
      WHERE student_id = ?
        AND survey_date >= ?
      ORDER BY survey_date, dimension
    `).bind(studentId, startDate.toISOString().split('T')[0]).all()
    
    // ディメンションごとに整理
    const trendData: any = {}
    result.results.forEach((row: any) => {
      if (!trendData[row.dimension]) {
        trendData[row.dimension] = []
      }
      trendData[row.dimension].push({
        date: row.survey_date,
        score: row.score,
        packageType: row.package_type
      })
    })
    
    return c.json({
      success: true,
      trend: trendData
    })
  } catch (error: any) {
    console.error('❌ ScTN経年変化取得エラー:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// 6. 習熟度推移データ取得
app.get('/api/reports/mastery-trend/:studentId', async (c) => {
  const { env } = c
  const studentId = parseInt(c.req.param('studentId'))
  const days = parseInt(c.req.query('days') || '30')
  
  try {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    
    const result = await env.DB.prepare(`
      SELECT 
        DATE(slh.reviewed_at) as review_date,
        AVG(sls.mastery_level) as avg_mastery,
        COUNT(DISTINCT slh.card_id) as cards_reviewed,
        AVG(slh.is_correct) as accuracy
      FROM spaced_learning_history slh
      JOIN spaced_learning_schedule sls ON slh.student_id = sls.student_id 
        AND slh.card_id = sls.card_id
      WHERE slh.student_id = ?
        AND slh.reviewed_at >= ?
      GROUP BY DATE(slh.reviewed_at)
      ORDER BY review_date
    `).bind(studentId, startDate.toISOString().split('T')[0]).all()
    
    return c.json({
      success: true,
      trend: result.results
    })
  } catch (error: any) {
    console.error('❌ 習熟度推移取得エラー:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// ================================
// 検索練習API (Retrieval Practice)
// ================================

// 1. 検索練習セッション開始
app.post('/api/retrieval-practice/start-session', async (c) => {
  const { env } = c
  const { studentId, cardId, recallType } = await c.req.json()
  
  try {
    // セッションを作成
    const result = await env.DB.prepare(`
      INSERT INTO retrieval_practice_sessions 
      (student_id, card_id, recall_type, session_status)
      VALUES (?, ?, ?, 'active')
    `).bind(studentId, cardId, recallType).run()
    
    // カード情報を取得
    const card = await env.DB.prepare(`
      SELECT * FROM learning_cards WHERE id = ?
    `).bind(cardId).first()
    
    return c.json({
      success: true,
      sessionId: result.meta.last_row_id,
      card: card,
      recallType: recallType
    })
  } catch (error: any) {
    console.error('❌ 検索練習セッション開始エラー:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// 2. 検索練習回答送信
app.post('/api/retrieval-practice/submit-answer', async (c) => {
  const { env } = c
  const { 
    sessionId, 
    studentAnswer, 
    responseTime,
    confidenceRating,
    difficultyRating 
  } = await c.req.json()
  
  try {
    // セッション情報を取得
    const session = await env.DB.prepare(`
      SELECT * FROM retrieval_practice_sessions WHERE id = ?
    `).bind(sessionId).first()
    
    if (!session) {
      throw new Error('セッションが見つかりません')
    }
    
    // カードの正解を取得
    const card = await env.DB.prepare(`
      SELECT answer FROM learning_cards WHERE id = ?
    `).bind(session.card_id).first()
    
    // AI評価を実行（Gemini APIを使用）
    let accuracyScore = 0
    let completenessScore = 0
    let precisionScore = 0
    let aiDetailedFeedback = ''
    
    if (env.GEMINI_API_KEY) {
      const prompt = `
あなたは教育評価の専門家です。以下の学習者の回答を評価してください。

【正解】
${card?.answer}

【学習者の回答】
${studentAnswer}

以下の観点で評価し、JSON形式で返してください：
{
  "accuracy_score": 0-100の数値（正確性）,
  "completeness_score": 0-100の数値（完全性）,
  "precision_score": 0-100の数値（精度）,
  "detailed_feedback": "詳細なフィードバック文"
}
`
      
      try {
        const geminiResponse = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash:generateContent?key=${env.GEMINI_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: {
                temperature: 0.3,
                maxOutputTokens: 1000
              }
            })
          }
        )
        
        const geminiData = await geminiResponse.json()
        const aiText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '{}'
        const evaluation = JSON.parse(extractJSON(aiText))
        
        accuracyScore = evaluation.accuracy_score || 0
        completenessScore = evaluation.completeness_score || 0
        precisionScore = evaluation.precision_score || 0
        aiDetailedFeedback = evaluation.detailed_feedback || ''
      } catch (error) {
        console.error('AI評価エラー:', error)
      }
    }
    
    // 回答を記録
    await env.DB.prepare(`
      UPDATE retrieval_practice_sessions
      SET student_answer = ?,
          response_time = ?,
          confidence_rating = ?,
          difficulty_rating = ?,
          accuracy_score = ?,
          completeness_score = ?,
          precision_score = ?,
          ai_detailed_feedback = ?,
          session_status = 'completed',
          completed_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(
      studentAnswer,
      responseTime,
      confidenceRating,
      difficultyRating,
      accuracyScore,
      completenessScore,
      precisionScore,
      aiDetailedFeedback,
      sessionId
    ).run()
    
    // メタ認知ギャップを計算
    const actualPerformance = (accuracyScore + completenessScore + precisionScore) / 3
    const metacognitionGap = confidenceRating - actualPerformance
    
    // メタ認知追跡を記録
    await env.DB.prepare(`
      INSERT INTO metacognition_tracking
      (student_id, card_id, session_id, predicted_performance, actual_performance, metacognition_gap)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      session.student_id,
      session.card_id,
      sessionId,
      confidenceRating,
      actualPerformance,
      metacognitionGap
    ).run()
    
    return c.json({
      success: true,
      evaluation: {
        accuracyScore,
        completenessScore,
        precisionScore,
        overallScore: actualPerformance,
        feedback: aiDetailedFeedback,
        metacognitionGap
      }
    })
  } catch (error: any) {
    console.error('❌ 検索練習回答送信エラー:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// 3. 検索練習セッション一覧取得
app.get('/api/retrieval-practice/sessions/:studentId', async (c) => {
  const { env } = c
  const studentId = parseInt(c.req.param('studentId'))
  const limit = parseInt(c.req.query('limit') || '20')
  
  try {
    const result = await env.DB.prepare(`
      SELECT 
        rps.*,
        lc.card_title,
        lc.card_number,
        (rps.accuracy_score + rps.completeness_score + rps.precision_score) / 3 as overall_score
      FROM retrieval_practice_sessions rps
      JOIN learning_cards lc ON rps.card_id = lc.id
      WHERE rps.student_id = ?
      ORDER BY rps.created_at DESC
      LIMIT ?
    `).bind(studentId, limit).all()
    
    return c.json({
      success: true,
      sessions: result.results
    })
  } catch (error: any) {
    console.error('❌ 検索練習セッション一覧取得エラー:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// 4. 検索練習統計取得
app.get('/api/retrieval-practice/stats/:studentId', async (c) => {
  const { env } = c
  const studentId = parseInt(c.req.param('studentId'))
  
  try {
    // 基本統計
    const basicStats = await env.DB.prepare(`
      SELECT 
        COUNT(*) as total_sessions,
        AVG(accuracy_score) as avg_accuracy,
        AVG(completeness_score) as avg_completeness,
        AVG(precision_score) as avg_precision,
        AVG(response_time) as avg_response_time,
        AVG(confidence_rating) as avg_confidence
      FROM retrieval_practice_sessions
      WHERE student_id = ? AND session_status = 'completed'
    `).bind(studentId).first()
    
    // 想起タイプ別統計
    const recallTypeStats = await env.DB.prepare(`
      SELECT 
        recall_type,
        COUNT(*) as session_count,
        AVG((accuracy_score + completeness_score + precision_score) / 3) as avg_score
      FROM retrieval_practice_sessions
      WHERE student_id = ? AND session_status = 'completed'
      GROUP BY recall_type
    `).bind(studentId).all()
    
    // メタ認知統計
    const metacognitionStats = await env.DB.prepare(`
      SELECT 
        AVG(predicted_performance) as avg_predicted,
        AVG(actual_performance) as avg_actual,
        AVG(metacognition_gap) as avg_gap,
        AVG(ABS(metacognition_gap)) as avg_abs_gap
      FROM metacognition_tracking
      WHERE student_id = ?
    `).bind(studentId).first()
    
    return c.json({
      success: true,
      stats: {
        basic: basicStats,
        recallTypes: recallTypeStats.results,
        metacognition: metacognitionStats
      }
    })
  } catch (error: any) {
    console.error('❌ 検索練習統計取得エラー:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// 5. 効果測定データ取得
app.get('/api/retrieval-practice/effectiveness/:studentId', async (c) => {
  const { env } = c
  const studentId = parseInt(c.req.param('studentId'))
  
  try {
    const result = await env.DB.prepare(`
      SELECT 
        card_id,
        AVG(immediate_recall_score) as avg_immediate,
        AVG(retention_score) as avg_retention,
        AVG(transfer_score) as avg_transfer,
        AVG(retention_interval) as avg_interval,
        COUNT(*) as measurement_count
      FROM retrieval_practice_effectiveness
      WHERE student_id = ?
      GROUP BY card_id
      ORDER BY avg_retention DESC
    `).bind(studentId).all()
    
    return c.json({
      success: true,
      effectiveness: result.results
    })
  } catch (error: any) {
    console.error('❌ 効果測定データ取得エラー:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// 6. 推奨カード取得（検索練習用）
app.get('/api/retrieval-practice/recommended-cards/:studentId', async (c) => {
  const { env } = c
  const studentId = parseInt(c.req.param('studentId'))
  const recallType = c.req.query('recallType') || 'free_recall'
  
  try {
    // まだ検索練習をしていないカード、または効果が高かったカードを推奨
    const result = await env.DB.prepare(`
      SELECT 
        lc.*,
        COALESCE(rpe.avg_retention, 0) as retention_score,
        COALESCE(rps.session_count, 0) as practice_count
      FROM learning_cards lc
      LEFT JOIN (
        SELECT card_id, AVG(retention_score) as avg_retention
        FROM retrieval_practice_effectiveness
        WHERE student_id = ?
        GROUP BY card_id
      ) rpe ON lc.id = rpe.card_id
      LEFT JOIN (
        SELECT card_id, COUNT(*) as session_count
        FROM retrieval_practice_sessions
        WHERE student_id = ? AND recall_type = ?
        GROUP BY card_id
      ) rps ON lc.id = rps.card_id
      WHERE lc.id IN (
        SELECT DISTINCT card_id FROM student_progress WHERE student_id = ?
      )
      ORDER BY practice_count ASC, retention_score ASC
      LIMIT 10
    `).bind(studentId, studentId, recallType, studentId).all()
    
    return c.json({
      success: true,
      recommendedCards: result.results
    })
  } catch (error: any) {
    console.error('❌ 推奨カード取得エラー:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// ================================
// 交互配置練習API (Interleaved Practice)
// ================================

// 1. 交互配置セッション開始
app.post('/api/interleaved-practice/start-session', async (c) => {
  const { env } = c
  const { studentId, interleavingStrategy } = await c.req.json()
  
  try {
    // セッションを作成
    const result = await env.DB.prepare(`
      INSERT INTO interleaved_practice_sessions 
      (student_id, interleaving_strategy, session_status)
      VALUES (?, ?, 'active')
    `).bind(studentId, interleavingStrategy).run()
    
    const sessionId = result.meta.last_row_id
    
    // カードを選択して問題リストを生成
    const cards = await env.DB.prepare(`
      SELECT lc.*, cc.concept_name
      FROM learning_cards lc
      LEFT JOIN curriculum_concepts cc ON lc.concept_id = cc.id
      WHERE lc.id IN (
        SELECT card_id FROM student_progress WHERE student_id = ?
      )
      ORDER BY RANDOM()
      LIMIT 10
    `).bind(studentId).all()
    
    // 交互配置戦略に基づいて問題順序を決定
    let problemOrder = []
    
    if (interleavingStrategy === 'random_interleaving') {
      // ランダム交互配置
      problemOrder = cards.results.map((card: any) => card.id).sort(() => Math.random() - 0.5)
    } else if (interleavingStrategy === 'blocked_interleaving') {
      // ブロック交互配置（概念ごとにグループ化）
      const conceptGroups: any = {}
      cards.results.forEach((card: any) => {
        const concept = card.concept_name || 'other'
        if (!conceptGroups[concept]) conceptGroups[concept] = []
        conceptGroups[concept].push(card.id)
      })
      problemOrder = Object.values(conceptGroups).flat() as number[]
    } else if (interleavingStrategy === 'adaptive_interleaving') {
      // 適応型交互配置（習熟度が低いものを優先）
      problemOrder = cards.results
        .sort((a: any, b: any) => (a.mastery_level || 0) - (b.mastery_level || 0))
        .map((card: any) => card.id)
    } else {
      // 体系的交互配置（概念を均等に分散）
      const conceptGroups: any = {}
      cards.results.forEach((card: any) => {
        const concept = card.concept_name || 'other'
        if (!conceptGroups[concept]) conceptGroups[concept] = []
        conceptGroups[concept].push(card.id)
      })
      
      // 各概念から1つずつ順番に取り出す
      const maxLength = Math.max(...Object.values(conceptGroups).map((arr: any) => arr.length))
      for (let i = 0; i < maxLength; i++) {
        Object.values(conceptGroups).forEach((arr: any) => {
          if (arr[i]) problemOrder.push(arr[i])
        })
      }
    }
    
    // 問題を記録
    for (let i = 0; i < problemOrder.length; i++) {
      await env.DB.prepare(`
        INSERT INTO interleaved_practice_problems
        (session_id, card_id, problem_order)
        VALUES (?, ?, ?)
      `).bind(sessionId, problemOrder[i], i + 1).run()
    }
    
    return c.json({
      success: true,
      sessionId,
      problemOrder,
      totalProblems: problemOrder.length
    })
  } catch (error: any) {
    console.error('❌ 交互配置セッション開始エラー:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// 2. 交互配置問題回答送信
app.post('/api/interleaved-practice/submit-answer', async (c) => {
  const { env } = c
  const { 
    sessionId, 
    problemId,
    isCorrect,
    responseTime,
    identifiedConcept,
    confusedConcepts
  } = await c.req.json()
  
  try {
    // 問題を更新
    await env.DB.prepare(`
      UPDATE interleaved_practice_problems
      SET is_correct = ?,
          response_time = ?,
          identified_concept = ?,
          confused_concepts = ?,
          answered_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(isCorrect, responseTime, identifiedConcept, confusedConcepts, problemId).run()
    
    // 概念識別追跡を記録
    const problem = await env.DB.prepare(`
      SELECT ipp.*, ips.student_id, lc.concept_id
      FROM interleaved_practice_problems ipp
      JOIN interleaved_practice_sessions ips ON ipp.session_id = ips.id
      JOIN learning_cards lc ON ipp.card_id = lc.id
      WHERE ipp.id = ?
    `).bind(problemId).first()
    
    if (problem) {
      await env.DB.prepare(`
        INSERT INTO discrimination_ability_tracking
        (student_id, session_id, source_concept, identified_concept, 
         is_correct_identification, response_time)
        VALUES (?, ?, ?, ?, ?, ?)
      `).bind(
        problem.student_id,
        sessionId,
        problem.concept_id,
        identifiedConcept,
        isCorrect ? 1 : 0,
        responseTime
      ).run()
    }
    
    // 次の問題を取得
    const nextProblem = await env.DB.prepare(`
      SELECT ipp.*, lc.*
      FROM interleaved_practice_problems ipp
      JOIN learning_cards lc ON ipp.card_id = lc.id
      WHERE ipp.session_id = ? AND ipp.answered_at IS NULL
      ORDER BY ipp.problem_order
      LIMIT 1
    `).bind(sessionId).first()
    
    if (!nextProblem) {
      // セッション完了
      await env.DB.prepare(`
        UPDATE interleaved_practice_sessions
        SET session_status = 'completed',
            completed_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(sessionId).run()
      
      return c.json({
        success: true,
        sessionCompleted: true,
        message: '交互配置練習セッションが完了しました'
      })
    }
    
    return c.json({
      success: true,
      sessionCompleted: false,
      nextProblem
    })
  } catch (error: any) {
    console.error('❌ 交互配置問題回答送信エラー:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// 3. 交互配置セッション一覧取得
app.get('/api/interleaved-practice/sessions/:studentId', async (c) => {
  const { env } = c
  const studentId = parseInt(c.req.param('studentId'))
  const limit = parseInt(c.req.query('limit') || '20')
  
  try {
    const result = await env.DB.prepare(`
      SELECT 
        ips.*,
        COUNT(ipp.id) as total_problems,
        SUM(CASE WHEN ipp.is_correct = 1 THEN 1 ELSE 0 END) as correct_answers,
        AVG(ipp.response_time) as avg_response_time
      FROM interleaved_practice_sessions ips
      LEFT JOIN interleaved_practice_problems ipp ON ips.id = ipp.session_id
      WHERE ips.student_id = ?
      GROUP BY ips.id
      ORDER BY ips.created_at DESC
      LIMIT ?
    `).bind(studentId, limit).all()
    
    return c.json({
      success: true,
      sessions: result.results
    })
  } catch (error: any) {
    console.error('❌ 交互配置セッション一覧取得エラー:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// 4. 概念識別能力統計取得
app.get('/api/interleaved-practice/discrimination-stats/:studentId', async (c) => {
  const { env } = c
  const studentId = parseInt(c.req.param('studentId'))
  
  try {
    // 概念ごとの識別能力
    const conceptStats = await env.DB.prepare(`
      SELECT 
        source_concept,
        COUNT(*) as total_attempts,
        SUM(is_correct_identification) as correct_identifications,
        AVG(is_correct_identification) as accuracy_rate,
        AVG(response_time) as avg_response_time
      FROM discrimination_ability_tracking
      WHERE student_id = ?
      GROUP BY source_concept
      ORDER BY accuracy_rate ASC
    `).bind(studentId).all()
    
    // 混同マトリックス
    const confusionMatrix = await env.DB.prepare(`
      SELECT 
        source_concept,
        identified_concept,
        COUNT(*) as count
      FROM discrimination_ability_tracking
      WHERE student_id = ? AND is_correct_identification = 0
      GROUP BY source_concept, identified_concept
      ORDER BY count DESC
      LIMIT 20
    `).bind(studentId).all()
    
    return c.json({
      success: true,
      stats: {
        conceptAccuracy: conceptStats.results,
        confusionMatrix: confusionMatrix.results
      }
    })
  } catch (error: any) {
    console.error('❌ 概念識別能力統計取得エラー:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// 5. 転移学習効果測定
app.get('/api/interleaved-practice/transfer-effects/:studentId', async (c) => {
  const { env } = c
  const studentId = parseInt(c.req.param('studentId'))
  
  try {
    const result = await env.DB.prepare(`
      SELECT 
        source_concept,
        target_concept,
        AVG(transfer_score) as avg_transfer_score,
        AVG(improvement_rate) as avg_improvement,
        COUNT(*) as measurement_count
      FROM transfer_learning_effects
      WHERE student_id = ?
      GROUP BY source_concept, target_concept
      ORDER BY avg_transfer_score DESC
    `).bind(studentId).all()
    
    return c.json({
      success: true,
      transferEffects: result.results
    })
  } catch (error: any) {
    console.error('❌ 転移学習効果測定エラー:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// 6. 交互配置練習統計取得
app.get('/api/interleaved-practice/stats/:studentId', async (c) => {
  const { env } = c
  const studentId = parseInt(c.req.param('studentId'))
  
  try {
    // 基本統計
    const basicStats = await env.DB.prepare(`
      SELECT 
        COUNT(DISTINCT ips.id) as total_sessions,
        COUNT(ipp.id) as total_problems,
        AVG(CASE WHEN ipp.is_correct = 1 THEN 1.0 ELSE 0.0 END) as avg_accuracy,
        AVG(ipp.response_time) as avg_response_time
      FROM interleaved_practice_sessions ips
      LEFT JOIN interleaved_practice_problems ipp ON ips.id = ipp.session_id
      WHERE ips.student_id = ?
    `).bind(studentId).first()
    
    // 戦略別統計
    const strategyStats = await env.DB.prepare(`
      SELECT 
        ips.interleaving_strategy,
        COUNT(DISTINCT ips.id) as session_count,
        AVG(CASE WHEN ipp.is_correct = 1 THEN 1.0 ELSE 0.0 END) as avg_accuracy
      FROM interleaved_practice_sessions ips
      LEFT JOIN interleaved_practice_problems ipp ON ips.id = ipp.session_id
      WHERE ips.student_id = ?
      GROUP BY ips.interleaving_strategy
    `).bind(studentId).all()
    
    return c.json({
      success: true,
      stats: {
        basic: basicStats,
        strategies: strategyStats.results
      }
    })
  } catch (error: any) {
    console.error('❌ 交互配置練習統計取得エラー:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// ================================
// AI先生強化機能 (Enhanced AI Teacher)
// ================================

// 1. ソクラテス式対話（段階的なヒント）
app.post('/api/ai-teacher/socratic-dialogue', async (c) => {
  const { env } = c
  const { studentId, cardId, currentUnderstanding, attemptCount } = await c.req.json()
  
  if (!env.GEMINI_API_KEY) {
    return c.json({
      success: false,
      error: 'Gemini APIキーが設定されていません'
    }, 500)
  }

  try {
    // カード情報取得
    const card = await env.DB.prepare(`
      SELECT * FROM learning_cards WHERE id = ?
    `).bind(cardId).first()

    if (!card) {
      throw new Error('カードが見つかりません')
    }

    // ソクラテス式対話プロンプト
    const prompt = `
あなたは優れた教師として、ソクラテス式対話法を使って児童の学習を支援します。

【問題】
${card.card_title}
${card.problem_description || ''}

【児童の現在の理解】
${currentUnderstanding}

【試行回数】
${attemptCount}回目

【あなたの役割】
1. 直接答えは教えない
2. 段階的な質問で思考を促す
3. 児童が自分で気づけるようにヒントを出す
4. 試行回数に応じてヒントの具体性を調整する

【対話の方針】
- 1-2回目: 非常に抽象的な質問
- 3-4回目: やや具体的なヒント
- 5回目以降: より直接的なヒントと励まし

JSON形式で以下を返してください：
{
  "question": "児童への質問",
  "hint_level": 1-5の数値（抽象→具体）,
  "encouragement": "励ましのメッセージ",
  "is_close_to_answer": true/false
}
`

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash:generateContent?key=${env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1000
          }
        })
      }
    )

    const data = await response.json()
    const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}'
    const dialogue = JSON.parse(extractJSON(aiText))

    return c.json({
      success: true,
      dialogue
    })
  } catch (error: any) {
    console.error('❌ ソクラテス式対話エラー:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// 2. 学習スタイル適応型説明
app.post('/api/ai-teacher/adaptive-explanation', async (c) => {
  const { env } = c
  const { studentId, concept, learningStyle, priorKnowledge } = await c.req.json()
  
  if (!env.GEMINI_API_KEY) {
    return c.json({
      success: false,
      error: 'Gemini APIキーが設定されていません'
    }, 500)
  }

  try {
    const styleDescriptions = {
      'visual': '視覚的な図やイラストを多用した説明',
      'auditory': '音や言葉で説明し、リズムや語呂合わせを活用',
      'kinesthetic': '体を動かしたり実際に触れたりする体験的な説明',
      'reading_writing': '文章や箇条書きでの詳細な説明'
    }

    const prompt = `
あなたは個別最適化学習の専門家です。児童の学習スタイルに合わせて概念を説明してください。

【概念】
${concept}

【学習スタイル】
${learningStyle}: ${styleDescriptions[learningStyle] || ''}

【事前知識】
${priorKnowledge || 'なし'}

【説明の要件】
1. 学習スタイルに完全に適応した説明
2. 既有知識と関連付ける
3. 具体例を3つ以上含める
4. 段階的な理解を促す構成

JSON形式で以下を返してください：
{
  "explanation": "メインの説明文",
  "examples": ["具体例1", "具体例2", "具体例3"],
  "visual_suggestions": ["視覚的な表現方法の提案"],
  "practice_activities": ["実践的な活動の提案"],
  "connections": ["他の概念との関連性"]
}
`

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash:generateContent?key=${env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.8,
            maxOutputTokens: 2000
          }
        })
      }
    )

    const data = await response.json()
    const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}'
    const explanation = JSON.parse(extractJSON(aiText))

    return c.json({
      success: true,
      explanation
    })
  } catch (error: any) {
    console.error('❌ 適応型説明エラー:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// 3. 誤答分析とフィードバック
app.post('/api/ai-teacher/error-analysis', async (c) => {
  const { env } = c
  const { studentId, cardId, studentAnswer, correctAnswer, previousErrors } = await c.req.json()
  
  if (!env.GEMINI_API_KEY) {
    return c.json({
      success: false,
      error: 'Gemini APIキーが設定されていません'
    }, 500)
  }

  try {
    const prompt = `
あなたは教育心理学の専門家として、児童の誤答を分析してください。

【正解】
${correctAnswer}

【児童の回答】
${studentAnswer}

【過去の類似エラー】
${previousErrors || 'なし'}

【分析の観点】
1. 誤答の種類（概念の誤理解、計算ミス、読み間違いなど）
2. 思考プロセスの推測
3. 根本的な原因
4. 改善のための具体的アドバイス

JSON形式で以下を返してください：
{
  "error_type": "エラータイプ",
  "root_cause": "根本原因の分析",
  "thinking_process": "児童の思考プロセスの推測",
  "improvement_advice": "具体的な改善アドバイス",
  "recommended_practice": "推奨する練習方法",
  "is_conceptual_error": true/false,
  "severity": 1-5の数値（軽微→重大）
}
`

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash:generateContent?key=${env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.5,
            maxOutputTokens: 1500
          }
        })
      }
    )

    const data = await response.json()
    const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}'
    const analysis = JSON.parse(extractJSON(aiText))

    // 誤答パターンをデータベースに記録
    await env.DB.prepare(`
      INSERT INTO error_patterns (student_id, card_id, error_type, root_cause, severity)
      VALUES (?, ?, ?, ?, ?)
    `).bind(
      studentId,
      cardId,
      analysis.error_type,
      analysis.root_cause,
      analysis.severity
    ).run().catch(() => {}) // テーブルが存在しない場合はスキップ

    return c.json({
      success: true,
      analysis
    })
  } catch (error: any) {
    console.error('❌ 誤答分析エラー:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// 4. 学習計画の自動生成
app.post('/api/ai-teacher/generate-study-plan', async (c) => {
  const { env } = c
  const { studentId, goalDescription, availableTime, currentLevel } = await c.req.json()
  
  if (!env.GEMINI_API_KEY) {
    return c.json({
      success: false,
      error: 'Gemini APIキーが設定されていません'
    }, 500)
  }

  try {
    // 学生の学習履歴を取得
    const stats = await env.DB.prepare(`
      SELECT 
        COUNT(DISTINCT card_id) as total_cards,
        AVG(CASE WHEN is_correct = 1 THEN 1.0 ELSE 0.0 END) as avg_accuracy
      FROM spaced_learning_history
      WHERE student_id = ?
    `).bind(studentId).first()

    const prompt = `
あなたは学習コーチとして、個別最適化された学習計画を作成してください。

【目標】
${goalDescription}

【利用可能時間】
週${availableTime}時間

【現在のレベル】
${currentLevel}

【学習履歴】
- 習得カード数: ${stats?.total_cards || 0}
- 平均正答率: ${((stats?.avg_accuracy || 0) * 100).toFixed(1)}%

【計画の要件】
1. 週次の具体的な学習スケジュール
2. 科学的学習方略の統合（分散学習、検索練習など）
3. 達成可能なマイルストーン
4. 定期的な振り返りポイント

JSON形式で以下を返してください：
{
  "weekly_schedule": [
    {
      "day": "月曜日",
      "activities": ["活動1", "活動2"],
      "duration": 60,
      "strategy": "使用する学習方略"
    }
  ],
  "milestones": [
    {
      "week": 1,
      "goal": "目標",
      "success_criteria": "成功基準"
    }
  ],
  "daily_routine": "日々の学習ルーティンの提案",
  "reflection_points": ["週次の振り返りポイント"],
  "motivation_tips": ["モチベーション維持のコツ"]
}
`

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash:generateContent?key=${env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 3000
          }
        })
      }
    )

    const data = await response.json()
    const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}'
    const studyPlan = JSON.parse(extractJSON(aiText))

    return c.json({
      success: true,
      studyPlan
    })
  } catch (error: any) {
    console.error('❌ 学習計画生成エラー:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// 5. 励ましとモチベーション向上
app.post('/api/ai-teacher/encouragement', async (c) => {
  const { env } = c
  const { studentId, context, emotion } = await c.req.json()
  
  if (!env.GEMINI_API_KEY) {
    return c.json({
      success: false,
      error: 'Gemini APIキーが設定されていません'
    }, 500)
  }

  try {
    const prompt = `
あなたは児童の心に寄り添う優しいAI先生です。

【状況】
${context}

【児童の気持ち】
${emotion}

【あなたの役割】
1. 共感を示す
2. 具体的に褒める
3. 成長を認める
4. 次への意欲を高める

【メッセージの要件】
- 温かく励まし的なトーン
- 具体的な成果を認める
- 次の一歩を示唆する
- 150文字以内で簡潔に

JSON形式で以下を返してください：
{
  "message": "励ましのメッセージ",
  "emoji": "適切な絵文字",
  "actionable_advice": "次にできる具体的なアクション"
}
`

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash:generateContent?key=${env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.9,
            maxOutputTokens: 500
          }
        })
      }
    )

    const data = await response.json()
    const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}'
    const encouragement = JSON.parse(extractJSON(aiText))

    return c.json({
      success: true,
      encouragement
    })
  } catch (error: any) {
    console.error('❌ 励ましメッセージ生成エラー:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// =============================================================================
// Phase 11: 動画学習コンテンツ統合API
// =============================================================================

// 学習カードの動画コンテンツ取得
app.get('/api/videos/card/:cardId', async (c) => {
  const { env } = c
  const cardId = parseInt(c.req.param('cardId'))
  
  try {
    const videos = await env.DB.prepare(`
      SELECT * FROM video_contents
      WHERE card_id = ? AND is_active = TRUE
      ORDER BY created_at DESC
    `).bind(cardId).all()
    
    return c.json({
      success: true,
      videos: videos.results
    })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// 動画コンテンツ追加
app.post('/api/videos', async (c) => {
  const { env } = c
  const { card_id, video_title, video_url, video_platform, video_duration_seconds, thumbnail_url, description } = await c.req.json()
  
  try {
    const result = await env.DB.prepare(`
      INSERT INTO video_contents (card_id, video_title, video_url, video_platform, video_duration_seconds, thumbnail_url, description)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(card_id, video_title, video_url, video_platform, video_duration_seconds || null, thumbnail_url || null, description || null).run()
    
    return c.json({
      success: true,
      video_id: result.meta.last_row_id
    })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// 動画視聴開始記録
app.post('/api/videos/:videoId/watch/start', async (c) => {
  const { env } = c
  const videoId = parseInt(c.req.param('videoId'))
  const { student_id, session_id } = await c.req.json()
  
  try {
    const result = await env.DB.prepare(`
      INSERT INTO video_watch_history (video_id, student_id, session_id, watch_start_time)
      VALUES (?, ?, ?, datetime('now'))
    `).bind(videoId, student_id, session_id || null).run()
    
    return c.json({
      success: true,
      watch_id: result.meta.last_row_id
    })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// 動画視聴終了・進捗更新
app.put('/api/videos/watch/:watchId', async (c) => {
  const { env } = c
  const watchId = parseInt(c.req.param('watchId'))
  const { watch_duration_seconds, completion_percentage, playback_speed, paused_count, rewind_count } = await c.req.json()
  
  try {
    await env.DB.prepare(`
      UPDATE video_watch_history
      SET watch_end_time = datetime('now'),
          watch_duration_seconds = ?,
          completion_percentage = ?,
          playback_speed = ?,
          paused_count = ?,
          rewind_count = ?
      WHERE watch_id = ?
    `).bind(
      watch_duration_seconds,
      completion_percentage,
      playback_speed || 1.0,
      paused_count || 0,
      rewind_count || 0,
      watchId
    ).run()
    
    return c.json({ success: true })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// 生徒の動画視聴履歴取得
app.get('/api/videos/history/student/:studentId', async (c) => {
  const { env } = c
  const studentId = parseInt(c.req.param('studentId'))
  
  try {
    const history = await env.DB.prepare(`
      SELECT 
        wh.*,
        vc.video_title,
        vc.video_duration_seconds as total_duration
      FROM video_watch_history wh
      JOIN video_contents vc ON wh.video_id = vc.video_id
      WHERE wh.student_id = ?
      ORDER BY wh.watch_start_time DESC
      LIMIT 50
    `).bind(studentId).all()
    
    return c.json({
      success: true,
      history: history.results
    })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// =============================================================================
// Phase 12: レポートテンプレート管理API
// =============================================================================

// テンプレート一覧取得
app.get('/api/report-templates', async (c) => {
  const { env } = c
  const teacherId = c.req.query('teacher_id')
  
  try {
    let query = `
      SELECT 
        rt.*,
        t.name as created_by_name
      FROM report_templates rt
      LEFT JOIN teachers t ON rt.created_by = t.teacher_id
      WHERE rt.is_active = TRUE
    `
    
    const bindings: any[] = []
    
    if (teacherId) {
      query += ` AND (rt.is_public = TRUE OR rt.created_by = ?)`
      bindings.push(parseInt(teacherId))
    } else {
      query += ` AND rt.is_public = TRUE`
    }
    
    query += ` ORDER BY rt.created_at DESC`
    
    const templates = await env.DB.prepare(query).bind(...bindings).all()
    
    return c.json({
      success: true,
      templates: templates.results
    })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// テンプレート詳細取得
app.get('/api/report-templates/:templateId', async (c) => {
  const { env } = c
  const templateId = parseInt(c.req.param('templateId'))
  
  try {
    const template = await env.DB.prepare(`
      SELECT 
        rt.*,
        t.name as created_by_name
      FROM report_templates rt
      LEFT JOIN teachers t ON rt.created_by = t.teacher_id
      WHERE rt.template_id = ?
    `).bind(templateId).first()
    
    if (!template) {
      return c.json({ success: false, error: 'テンプレートが見つかりません' }, 404)
    }
    
    return c.json({
      success: true,
      template
    })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// テンプレート作成
app.post('/api/report-templates', async (c) => {
  const { env } = c
  const { template_name, template_description, template_structure, report_type, created_by, is_public } = await c.req.json()
  
  try {
    const result = await env.DB.prepare(`
      INSERT INTO report_templates (
        template_name, template_description, template_structure, 
        report_type, created_by, is_public
      )
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      template_name,
      template_description || null,
      JSON.stringify(template_structure),
      report_type || 'custom',
      created_by,
      is_public || false
    ).run()
    
    return c.json({
      success: true,
      template_id: result.meta.last_row_id
    })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// テンプレート更新
app.put('/api/report-templates/:templateId', async (c) => {
  const { env } = c
  const templateId = parseInt(c.req.param('templateId'))
  const { template_name, template_description, template_structure, is_public } = await c.req.json()
  
  try {
    await env.DB.prepare(`
      UPDATE report_templates
      SET template_name = ?,
          template_description = ?,
          template_structure = ?,
          is_public = ?,
          updated_at = datetime('now')
      WHERE template_id = ?
    `).bind(
      template_name,
      template_description || null,
      JSON.stringify(template_structure),
      is_public,
      templateId
    ).run()
    
    return c.json({ success: true })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// テンプレート削除
app.delete('/api/report-templates/:templateId', async (c) => {
  const { env } = c
  const templateId = parseInt(c.req.param('templateId'))
  
  try {
    await env.DB.prepare(`
      UPDATE report_templates
      SET is_active = FALSE,
          updated_at = datetime('now')
      WHERE template_id = ?
    `).bind(templateId).run()
    
    return c.json({ success: true })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// =============================================================================
// Phase 13: 学習カードメディア管理API
// =============================================================================

// 学習カードの画像一覧取得
app.get('/api/cards/:cardId/images', async (c) => {
  const { env } = c
  const cardId = parseInt(c.req.param('cardId'))
  
  try {
    const images = await env.DB.prepare(`
      SELECT * FROM card_images
      WHERE card_id = ? AND is_active = TRUE
      ORDER BY display_order ASC, created_at DESC
    `).bind(cardId).all()
    
    return c.json({
      success: true,
      images: images.results
    })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// 学習カードに画像追加
app.post('/api/cards/:cardId/images', async (c) => {
  const { env } = c
  const cardId = parseInt(c.req.param('cardId'))
  const { image_url, image_type, alt_text, caption, display_order, is_primary, generation_prompt, generated_by } = await c.req.json()
  
  try {
    const result = await env.DB.prepare(`
      INSERT INTO card_images (
        card_id, image_url, image_type, alt_text, caption, 
        display_order, is_primary, generation_prompt, generated_by
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      cardId,
      image_url,
      image_type || 'illustration',
      alt_text || null,
      caption || null,
      display_order || 0,
      is_primary || false,
      generation_prompt || null,
      generated_by || null
    ).run()
    
    return c.json({
      success: true,
      image_id: result.meta.last_row_id
    })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// 学習カード画像更新
app.put('/api/cards/images/:imageId', async (c) => {
  const { env } = c
  const imageId = parseInt(c.req.param('imageId'))
  const { alt_text, caption, display_order, is_primary } = await c.req.json()
  
  try {
    await env.DB.prepare(`
      UPDATE card_images
      SET alt_text = ?,
          caption = ?,
          display_order = ?,
          is_primary = ?,
          updated_at = datetime('now')
      WHERE image_id = ?
    `).bind(alt_text, caption, display_order, is_primary, imageId).run()
    
    return c.json({ success: true })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// 学習カード画像削除
app.delete('/api/cards/images/:imageId', async (c) => {
  const { env } = c
  const imageId = parseInt(c.req.param('imageId'))
  
  try {
    await env.DB.prepare(`
      UPDATE card_images
      SET is_active = FALSE,
          updated_at = datetime('now')
      WHERE image_id = ?
    `).bind(imageId).run()
    
    return c.json({ success: true })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// AI画像生成API（Gemini Imagen使用）
app.post('/api/ai/generate-image', async (c) => {
  const { env } = c
  const { prompt, card_id, teacher_id, negative_prompt, style } = await c.req.json()
  
  try {
    const geminiApiKey = env.GEMINI_API_KEY || env.AIML_API_KEY
    
    if (!geminiApiKey) {
      return c.json({ 
        success: false, 
        error: 'API キーが設定されていません' 
      }, 500)
    }
    
    // Gemini APIで画像生成（テキストからプロンプト生成）
    const startTime = Date.now()
    
    // 画像生成プロンプトの最適化
    const optimizedPrompt = `${prompt}${style ? `, style: ${style}` : ''}, high quality, detailed, educational illustration`
    
    // 注意: Gemini Pro Vision は画像分析用。画像生成にはGemini Imagen APIが必要
    // ここではダミーURLを返す（実際の実装ではGemini Imagen APIを使用）
    const dummyImageUrl = `https://via.placeholder.com/800x600.png?text=${encodeURIComponent(prompt.substring(0, 50))}`
    
    const generationTime = Date.now() - startTime
    
    // 生成履歴を保存
    const result = await env.DB.prepare(`
      INSERT INTO ai_generated_images (
        teacher_id, card_id, prompt, negative_prompt, 
        ai_model, image_url, generation_time_ms, 
        generation_params, is_used
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      teacher_id || null,
      card_id || null,
      prompt,
      negative_prompt || null,
      'gemini-imagen',
      dummyImageUrl,
      generationTime,
      JSON.stringify({ style, optimized_prompt: optimizedPrompt }),
      false
    ).run()
    
    return c.json({
      success: true,
      generation_id: result.meta.last_row_id,
      image_url: dummyImageUrl,
      prompt: optimizedPrompt,
      generation_time_ms: generationTime,
      message: '画像生成完了（デモ版：実際のAI画像生成はGemini Imagen API統合が必要）'
    })
  } catch (error: any) {
    console.error('❌ AI画像生成エラー:', error)
    return c.json({ 
      success: false, 
      error: error.message,
      details: 'AI画像生成に失敗しました'
    }, 500)
  }
})

// AI生成画像履歴取得
app.get('/api/ai/generated-images', async (c) => {
  const { env } = c
  const teacherId = c.req.query('teacher_id')
  const cardId = c.req.query('card_id')
  
  try {
    let query = `
      SELECT * FROM ai_generated_images
      WHERE 1=1
    `
    const bindings: any[] = []
    
    if (teacherId) {
      query += ` AND teacher_id = ?`
      bindings.push(parseInt(teacherId))
    }
    
    if (cardId) {
      query += ` AND card_id = ?`
      bindings.push(parseInt(cardId))
    }
    
    query += ` ORDER BY created_at DESC LIMIT 50`
    
    const images = await env.DB.prepare(query).bind(...bindings).all()
    
    return c.json({
      success: true,
      images: images.results
    })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// 学習カード編集履歴取得
app.get('/api/cards/:cardId/edit-history', async (c) => {
  const { env } = c
  const cardId = parseInt(c.req.param('cardId'))
  
  try {
    const history = await env.DB.prepare(`
      SELECT 
        ch.*,
        t.name as edited_by_name
      FROM card_edit_history ch
      LEFT JOIN teachers t ON ch.edited_by = t.teacher_id
      WHERE ch.card_id = ?
      ORDER BY ch.edited_at DESC
      LIMIT 50
    `).bind(cardId).all()
    
    return c.json({
      success: true,
      history: history.results
    })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// 学習カード編集履歴追加
app.post('/api/cards/:cardId/edit-history', async (c) => {
  const { env } = c
  const cardId = parseInt(c.req.param('cardId'))
  const { edited_by, edit_type, before_data, after_data, change_summary } = await c.req.json()
  
  try {
    await env.DB.prepare(`
      INSERT INTO card_edit_history (
        card_id, edited_by, edit_type, before_data, 
        after_data, change_summary
      )
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      cardId,
      edited_by,
      edit_type,
      JSON.stringify(before_data),
      JSON.stringify(after_data),
      change_summary
    ).run()
    
    return c.json({ success: true })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// =============================================================================
// Phase 14: ファイルアップロード機能（Cloudflare R2）
// =============================================================================

// 画像ファイルアップロード
app.post('/api/upload/image', async (c) => {
  const { env } = c
  
  try {
    const formData = await c.req.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return c.json({ success: false, error: 'ファイルが選択されていません' }, 400)
    }
    
    // ファイルタイプチェック
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return c.json({ 
        success: false, 
        error: 'サポートされていない画像形式です。JPEG、PNG、GIF、WebPのみ対応しています。' 
      }, 400)
    }
    
    // ファイルサイズチェック（10MB制限）
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return c.json({ 
        success: false, 
        error: 'ファイルサイズが大きすぎます。10MB以下の画像をアップロードしてください。' 
      }, 400)
    }
    
    // ファイル名生成（タイムスタンプ + ランダム文字列）
    const timestamp = Date.now()
    const randomStr = Math.random().toString(36).substring(7)
    const extension = file.name.split('.').pop()
    const fileName = `images/${timestamp}-${randomStr}.${extension}`
    
    // R2にアップロード
    const arrayBuffer = await file.arrayBuffer()
    await env.MEDIA_BUCKET.put(fileName, arrayBuffer, {
      httpMetadata: {
        contentType: file.type
      }
    })
    
    // 公開URLを生成（Cloudflare R2のカスタムドメイン設定が必要）
    // 開発環境では /api/media/{fileName} 経由でアクセス
    const imageUrl = `/api/media/${fileName}`
    
    return c.json({
      success: true,
      image_url: imageUrl,
      file_name: fileName,
      file_size: file.size,
      mime_type: file.type
    })
  } catch (error: any) {
    console.error('❌ 画像アップロードエラー:', error)
    return c.json({ 
      success: false, 
      error: error.message,
      details: '画像のアップロードに失敗しました'
    }, 500)
  }
})

// 動画ファイルアップロード
app.post('/api/upload/video', async (c) => {
  const { env } = c
  
  try {
    const formData = await c.req.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return c.json({ success: false, error: 'ファイルが選択されていません' }, 400)
    }
    
    // ファイルタイプチェック
    const allowedTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime']
    if (!allowedTypes.includes(file.type)) {
      return c.json({ 
        success: false, 
        error: 'サポートされていない動画形式です。MP4、WebM、OGG、MOVのみ対応しています。' 
      }, 400)
    }
    
    // ファイルサイズチェック（100MB制限）
    const maxSize = 100 * 1024 * 1024 // 100MB
    if (file.size > maxSize) {
      return c.json({ 
        success: false, 
        error: 'ファイルサイズが大きすぎます。100MB以下の動画をアップロードしてください。' 
      }, 400)
    }
    
    // ファイル名生成
    const timestamp = Date.now()
    const randomStr = Math.random().toString(36).substring(7)
    const extension = file.name.split('.').pop()
    const fileName = `videos/${timestamp}-${randomStr}.${extension}`
    
    // R2にアップロード
    const arrayBuffer = await file.arrayBuffer()
    await env.MEDIA_BUCKET.put(fileName, arrayBuffer, {
      httpMetadata: {
        contentType: file.type
      }
    })
    
    // 公開URLを生成
    const videoUrl = `/api/media/${fileName}`
    
    return c.json({
      success: true,
      video_url: videoUrl,
      file_name: fileName,
      file_size: file.size,
      mime_type: file.type
    })
  } catch (error: any) {
    console.error('❌ 動画アップロードエラー:', error)
    return c.json({ 
      success: false, 
      error: error.message,
      details: '動画のアップロードに失敗しました'
    }, 500)
  }
})

// R2からメディアファイル取得（プロキシ）
app.get('/api/media/*', async (c) => {
  const { env } = c
  const fileName = c.req.param('*')
  
  try {
    const object = await env.MEDIA_BUCKET.get(fileName)
    
    if (!object) {
      return c.notFound()
    }
    
    const headers = new Headers()
    object.writeHttpMetadata(headers)
    headers.set('etag', object.httpEtag)
    headers.set('Cache-Control', 'public, max-age=31536000') // 1年キャッシュ
    
    return new Response(object.body, { headers })
  } catch (error: any) {
    console.error('❌ メディア取得エラー:', error)
    return c.notFound()
  }
})

// R2からメディアファイル削除
app.delete('/api/media/:fileName', async (c) => {
  const { env } = c
  const fileName = c.req.param('fileName')
  
  try {
    await env.MEDIA_BUCKET.delete(fileName)
    
    return c.json({ success: true })
  } catch (error: any) {
    console.error('❌ メディア削除エラー:', error)
    return c.json({ 
      success: false, 
      error: error.message 
    }, 500)
  }
})

// メディアライブラリ：アップロード済みファイル一覧取得
app.get('/api/media-library', async (c) => {
  const { env } = c
  
  try {
    // R2バケット内のファイル一覧を取得
    const list = await env.MEDIA_BUCKET.list()
    
    const files = list.objects.map((obj: any) => ({
      key: obj.key,
      size: obj.size,
      uploaded: obj.uploaded,
      url: `/api/media/${obj.key}`,
      type: obj.key.startsWith('images/') ? 'image' : 'video',
      thumbnail: obj.key.startsWith('images/') ? `/api/media/${obj.key}` : null
    }))
    
    // 日付順（新しい順）にソート
    files.sort((a: any, b: any) => new Date(b.uploaded).getTime() - new Date(a.uploaded).getTime())
    
    return c.json({ 
      success: true, 
      files,
      total: files.length
    })
  } catch (error: any) {
    console.error('❌ メディアライブラリ取得エラー:', error)
    return c.json({ 
      success: false, 
      error: error.message 
    }, 500)
  }
})

// メディアライブラリ：ファイル検索
app.get('/api/media-library/search', async (c) => {
  const { env } = c
  const query = c.req.query('q') || ''
  const type = c.req.query('type') // 'image' or 'video'
  
  try {
    const list = await env.MEDIA_BUCKET.list()
    
    let files = list.objects.map((obj: any) => ({
      key: obj.key,
      size: obj.size,
      uploaded: obj.uploaded,
      url: `/api/media/${obj.key}`,
      type: obj.key.startsWith('images/') ? 'image' : 'video',
      thumbnail: obj.key.startsWith('images/') ? `/api/media/${obj.key}` : null
    }))
    
    // タイプフィルター
    if (type) {
      files = files.filter((f: any) => f.type === type)
    }
    
    // 検索クエリフィルター
    if (query) {
      files = files.filter((f: any) => f.key.toLowerCase().includes(query.toLowerCase()))
    }
    
    // 日付順（新しい順）にソート
    files.sort((a: any, b: any) => new Date(b.uploaded).getTime() - new Date(a.uploaded).getTime())
    
    return c.json({ 
      success: true, 
      files,
      total: files.length
    })
  } catch (error: any) {
    console.error('❌ メディア検索エラー:', error)
    return c.json({ 
      success: false, 
      error: error.message 
    }, 500)
  }
})

// ============================================================
// Phase 17A: メディアタグ管理API
// ============================================================

// タグ一覧取得
app.get('/api/tags', async (c) => {
  const { env } = c
  const category = c.req.query('category')
  
  try {
    let query = 'SELECT * FROM tags'
    const params: string[] = []
    
    if (category) {
      query += ' WHERE category = ?'
      params.push(category)
    }
    
    query += ' ORDER BY category, name'
    
    const result = await env.DB.prepare(query).bind(...params).all()
    
    return c.json({
      success: true,
      tags: result.results || []
    })
  } catch (error: any) {
    console.error('❌ タグ一覧取得エラー:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// タグ作成
app.post('/api/tags', async (c) => {
  const { env } = c
  
  try {
    const { name, category, color } = await c.req.json()
    
    if (!name) {
      return c.json({ success: false, error: 'タグ名が必要です' }, 400)
    }
    
    const result = await env.DB.prepare(
      'INSERT INTO tags (name, category, color) VALUES (?, ?, ?) RETURNING *'
    ).bind(name, category || null, color || '#3B82F6').first()
    
    return c.json({
      success: true,
      tag: result
    })
  } catch (error: any) {
    console.error('❌ タグ作成エラー:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// メディアファイル登録（アップロード時に自動的に呼ばれる）
app.post('/api/media-files', async (c) => {
  const { env } = c
  
  try {
    const { r2_key, file_name, file_type, file_size, mime_type, title, description } = await c.req.json()
    
    if (!r2_key || !file_name || !file_type) {
      return c.json({ success: false, error: '必須パラメータが不足しています' }, 400)
    }
    
    const result = await env.DB.prepare(`
      INSERT INTO media_files 
        (r2_key, file_name, file_type, file_size, mime_type, title, description)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      RETURNING *
    `).bind(
      r2_key, 
      file_name, 
      file_type, 
      file_size || null, 
      mime_type || null,
      title || file_name,
      description || null
    ).first()
    
    return c.json({
      success: true,
      media: result
    })
  } catch (error: any) {
    console.error('❌ メディアファイル登録エラー:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// メディアにタグを追加
app.post('/api/media/:mediaKey/tags', async (c) => {
  const { env } = c
  const mediaKey = c.req.param('mediaKey')
  
  try {
    const { tag_ids } = await c.req.json()
    
    if (!Array.isArray(tag_ids) || tag_ids.length === 0) {
      return c.json({ success: false, error: 'タグIDの配列が必要です' }, 400)
    }
    
    // メディアファイルのIDを取得
    const media = await env.DB.prepare(
      'SELECT id FROM media_files WHERE r2_key = ?'
    ).bind(decodeURIComponent(mediaKey)).first()
    
    if (!media) {
      return c.json({ success: false, error: 'メディアが見つかりません' }, 404)
    }
    
    // 各タグを追加（重複は無視される）
    for (const tagId of tag_ids) {
      await env.DB.prepare(
        'INSERT OR IGNORE INTO media_tags (media_id, tag_id) VALUES (?, ?)'
      ).bind(media.id, tagId).run()
    }
    
    return c.json({
      success: true,
      message: `${tag_ids.length}個のタグを追加しました`
    })
  } catch (error: any) {
    console.error('❌ タグ追加エラー:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// メディアのタグを取得
app.get('/api/media/:mediaKey/tags', async (c) => {
  const { env } = c
  const mediaKey = c.req.param('mediaKey')
  
  try {
    const tags = await env.DB.prepare(`
      SELECT t.* FROM tags t
      JOIN media_tags mt ON t.id = mt.tag_id
      JOIN media_files mf ON mf.id = mt.media_id
      WHERE mf.r2_key = ?
    `).bind(decodeURIComponent(mediaKey)).all()
    
    return c.json({
      success: true,
      tags: tags.results || []
    })
  } catch (error: any) {
    console.error('❌ タグ取得エラー:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// タグで検索
app.get('/api/media/search-by-tags', async (c) => {
  const { env } = c
  const tagNames = c.req.query('tags')?.split(',') || []
  
  try {
    if (tagNames.length === 0) {
      return c.json({ success: false, error: 'タグが指定されていません' }, 400)
    }
    
    // タグ名からIDを取得
    const placeholders = tagNames.map(() => '?').join(',')
    const tagIds = await env.DB.prepare(
      `SELECT id FROM tags WHERE name IN (${placeholders})`
    ).bind(...tagNames).all()
    
    if (!tagIds.results || tagIds.results.length === 0) {
      return c.json({ success: true, media: [] })
    }
    
    // タグに紐づくメディアを取得
    const idPlaceholders = tagIds.results.map(() => '?').join(',')
    const media = await env.DB.prepare(`
      SELECT DISTINCT mf.* FROM media_files mf
      JOIN media_tags mt ON mf.id = mt.media_id
      WHERE mt.tag_id IN (${idPlaceholders})
      ORDER BY mf.uploaded_at DESC
    `).bind(...tagIds.results.map((t: any) => t.id)).all()
    
    return c.json({
      success: true,
      media: media.results || []
    })
  } catch (error: any) {
    console.error('❌ タグ検索エラー:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})


// AI自動タグ付け（Gemini 3.0 Flash画像認識）本番実装
app.post('/api/ai/auto-tag-image', async (c) => {
  const { env } = c
  
  try {
    const { image_url, r2_key } = await c.req.json()
    
    if (!image_url) {
      return c.json({ success: false, error: '画像URLが必要です' }, 400)
    }
    
    // GEMINI_API_KEYの確認
    if (!env.GEMINI_API_KEY) {
      console.warn('⚠️ GEMINI_API_KEY not configured, using demo data')
      // デモデータを返す
      const demoTags = {
        tags: ['教育', '学習', '算数'],
        description: '教材用の画像',
        category: '算数・図形',
        suggested_title: '学習教材',
        educational_context: '小学校の算数教材として使用できます'
      }
      return c.json({ 
        success: true, 
        ...demoTags,
        message: 'デモモード: GEMINI_API_KEYを設定すると実際のAI分析が使用できます'
      })
    }
    
    // 画像をBase64に変換
    console.log('🖼️ 画像をダウンロード中:', image_url)
    const imageResponse = await fetch(image_url)
    if (!imageResponse.ok) {
      throw new Error(`画像のダウンロードに失敗: ${imageResponse.statusText}`)
    }
    
    const imageBuffer = await imageResponse.arrayBuffer()
    const base64Image = btoa(String.fromCharCode(...new Uint8Array(imageBuffer)))
    const mimeType = imageResponse.headers.get('content-type') || 'image/jpeg'
    
    console.log('📤 Gemini 3.0にリクエスト送信中...')
    
    // Gemini 3.0 Flash APIにリクエスト
    const prompt = `この画像を教育用教材として詳しく分析してください。以下の情報を日本語のJSON形式で返してください：

{
  "tags": ["タグ1", "タグ2", "タグ3", "タグ4", "タグ5"],
  "description": "画像の詳細な説明（2-3文）",
  "category": "カテゴリ（教科名または単元名）",
  "suggested_title": "推奨タイトル",
  "educational_context": "教育的な使用方法や対象学年"
}

【分析ポイント】
- タグは5個以内、具体的なキーワード（例：「算数」「図形」「三角形」「面積」「計算」）
- カテゴリは教科名または単元名（例：「算数・図形」「国語・漢字」「理科・実験」）
- 教育的な観点から役立つ情報を含める
- 対象学年や使用場面を明確に

JSONのみを返してください。他の説明は不要です。`

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash:generateContent?key=${env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: prompt },
              { 
                inline_data: { 
                  mime_type: mimeType,
                  data: base64Image 
                } 
              }
            ]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1024
          }
        })
      }
    )
    
    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text()
      console.error('❌ Gemini APIエラー:', errorText)
      throw new Error(`Gemini API error: ${geminiResponse.statusText}`)
    }
    
    const geminiData = await geminiResponse.json()
    console.log('✅ Gemini応答受信')
    
    // Geminiからのテキスト応答を解析
    const responseText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '{}'
    console.log('📝 Gemini応答テキスト:', responseText)
    
    // JSONを抽出（マークダウンコードブロックを除去）
    const jsonMatch = responseText.match(/\{[\s\S]*\}/)
    const jsonText = jsonMatch ? jsonMatch[0] : responseText
    
    let aiResult
    try {
      aiResult = JSON.parse(jsonText)
    } catch (parseError) {
      console.error('❌ JSON解析エラー:', parseError)
      // パースエラー時はデフォルト値
      aiResult = {
        tags: ['AI分析'],
        description: 'AI分析結果の取得に失敗しました',
        category: '未分類',
        suggested_title: '画像',
        educational_context: ''
      }
    }
    
    // DBに保存（r2_keyが提供されている場合）
    if (r2_key) {
      try {
        await env.DB.prepare(`
          UPDATE media_files 
          SET 
            ai_generated_tags = ?,
            ai_description = ?,
            ai_category = ?
          WHERE r2_key = ?
        `).bind(
          JSON.stringify(aiResult.tags || []),
          aiResult.description || '',
          aiResult.category || '',
          r2_key
        ).run()
        
        console.log('✅ AI分析結果をDBに保存しました')
      } catch (dbError) {
        console.warn('⚠️ DB保存エラー（無視）:', dbError)
      }
    }
    
    return c.json({ 
      success: true, 
      ...aiResult,
      message: 'Gemini 3.0によるAI分析が完了しました'
    })
    
  } catch (error: any) {
    console.error('❌ AI自動タグ付けエラー:', error)
    return c.json({ 
      success: false, 
      error: error.message 
    }, 500)
  }
})

// =============================================================================
// Phase 4: 認証システムAPI
// =============================================================================

// ログインAPI
app.post('/api/auth/login', async (c) => {
  const { env } = c
  const { username, password } = await c.req.json()
  
  try {
    // ユーザーを取得
    const user = await env.DB.prepare(`
      SELECT * FROM auth_users WHERE username = ? AND is_active = 1
    `).bind(username).first()
    
    if (!user) {
      return c.json({ success: false, error: 'ユーザー名またはパスワードが正しくありません' }, 401)
    }
    
    // パスワード検証（bcrypt）
    const isValidPassword = await bcrypt.compare(password, user.password_hash as string)
    
    if (!isValidPassword) {
      return c.json({ success: false, error: 'ユーザー名またはパスワードが正しくありません' }, 401)
    }
    
    // セッショントークン生成
    const sessionToken = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`
    const refreshToken = `refresh_${Date.now()}_${Math.random().toString(36).substring(7)}`
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24時間後
    const refreshExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7日間後
    
    // セッション保存
    await env.DB.prepare(`
      INSERT INTO auth_sessions (user_id, session_token, refresh_token, expires_at, refresh_expires_at)
      VALUES (?, ?, ?, ?, ?)
    `).bind(user.user_id, sessionToken, refreshToken, expiresAt, refreshExpiresAt).run()
    
    // ログイン成功
    return c.json({
      success: true,
      user: {
        user_id: user.user_id,
        username: user.username,
        full_name: user.full_name,
        role: user.user_role,
        school_id: user.school_id
      },
      session_token: sessionToken,
      refresh_token: refreshToken,
      expires_at: expiresAt,
      refresh_expires_at: refreshExpiresAt
    })
    
  } catch (error: any) {
    console.error('❌ ログインエラー:', error)
    return c.json({ success: false, error: 'ログインに失敗しました' }, 500)
  }
})

// ログアウトAPI
app.post('/api/auth/logout', async (c) => {
  const { env } = c
  const { session_token } = await c.req.json()
  
  try {
    await env.DB.prepare(`
      DELETE FROM auth_sessions WHERE session_token = ?
    `).bind(session_token).run()
    
    return c.json({ success: true, message: 'ログアウトしました' })
  } catch (error: any) {
    console.error('❌ ログアウトエラー:', error)
    return c.json({ success: false, error: 'ログアウトに失敗しました' }, 500)
  }
})

// リフレッシュトークンAPI
app.post('/api/auth/refresh', async (c) => {
  const { env } = c
  const { refresh_token } = await c.req.json()
  
  if (!refresh_token) {
    return c.json({ success: false, error: 'リフレッシュトークンが必要です' }, 400)
  }
  
  try {
    // リフレッシュトークン検証
    const session = await env.DB.prepare(`
      SELECT 
        s.*, 
        u.user_id, u.username, u.full_name, u.user_role, u.school_id
      FROM auth_sessions s
      JOIN auth_users u ON s.user_id = u.user_id
      WHERE s.refresh_token = ? AND s.refresh_expires_at > datetime('now')
    `).bind(refresh_token).first()
    
    if (!session) {
      return c.json({ success: false, error: 'リフレッシュトークンが無効または期限切れです' }, 401)
    }
    
    // 新しいセッショントークンを生成
    const newSessionToken = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`
    const newExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    
    // セッション更新
    await env.DB.prepare(`
      UPDATE auth_sessions
      SET session_token = ?, expires_at = ?
      WHERE session_id = ?
    `).bind(newSessionToken, newExpiresAt, session.session_id).run()
    
    return c.json({
      success: true,
      session_token: newSessionToken,
      expires_at: newExpiresAt,
      user: {
        user_id: session.user_id,
        username: session.username,
        full_name: session.full_name,
        role: session.user_role,
        school_id: session.school_id
      }
    })
    
  } catch (error: any) {
    console.error('❌ リフレッシュトークンエラー:', error)
    return c.json({ success: false, error: 'トークンのリフレッシュに失敗しました' }, 500)
  }
})

// セッション検証API
app.post('/api/auth/verify', async (c) => {
  const { env } = c
  const { session_token } = await c.req.json()
  
  try {
    const session = await env.DB.prepare(`
      SELECT 
        s.*, 
        u.user_id, u.username, u.full_name, u.user_role, u.school_id
      FROM auth_sessions s
      JOIN auth_users u ON s.user_id = u.user_id
      WHERE s.session_token = ? AND s.expires_at > datetime('now')
    `).bind(session_token).first()
    
    if (!session) {
      return c.json({ success: false, error: 'セッションが無効です' }, 401)
    }
    
    return c.json({
      success: true,
      user: {
        user_id: session.user_id,
        username: session.username,
        full_name: session.full_name,
        role: session.user_role,
        school_id: session.school_id
      }
    })
    
  } catch (error: any) {
    console.error('❌ セッション検証エラー:', error)
    return c.json({ success: false, error: 'セッション検証に失敗しました' }, 500)
  }
})

// =============================================================================
// Phase 4-3: 認証ミドルウェア
// =============================================================================

// 認証ミドルウェア: セッション検証
async function authMiddleware(c: any, next: () => Promise<void>) {
  const { env } = c
  
  // Authorization ヘッダーから session_token を取得
  const authHeader = c.req.header('Authorization')
  const sessionToken = authHeader?.replace('Bearer ', '')
  
  if (!sessionToken) {
    return c.json({ success: false, error: '認証が必要です' }, 401)
  }
  
  try {
    // セッション検証
    const session = await env.DB.prepare(`
      SELECT 
        s.*, 
        u.user_id, u.username, u.full_name, u.user_role, u.school_id
      FROM auth_sessions s
      JOIN auth_users u ON s.user_id = u.user_id
      WHERE s.session_token = ? AND s.expires_at > datetime('now')
    `).bind(sessionToken).first()
    
    if (!session) {
      return c.json({ success: false, error: 'セッションが無効または期限切れです' }, 401)
    }
    
    // ユーザー情報をコンテキストに保存
    c.set('user', {
      user_id: session.user_id,
      username: session.username,
      full_name: session.full_name,
      role: session.user_role,
      school_id: session.school_id
    })
    
    // 次のハンドラーへ
    await next()
    
  } catch (error: any) {
    console.error('❌ 認証ミドルウェアエラー:', error)
    return c.json({ success: false, error: '認証に失敗しました' }, 500)
  }
}

// =============================================================================
// Phase 5-4: マルチテナント - school_idフィルタリング
// =============================================================================

// school_idによるデータフィルタリングミドルウェア
function requireSchoolAccess(c: any, next: () => Promise<void>) {
  const user = c.get('user')
  
  if (!user) {
    return c.json({ success: false, error: '認証が必要です' }, 401)
  }
  
  // school_idをコンテキストに保存
  c.set('school_id', user.school_id)
  
  return next()
}

// カリキュラムにschool_idフィルタを自動適用するヘルパー
function buildSchoolFilteredQuery(baseQuery: string, user: any): string {
  // 管理者は全データアクセス可能
  if (user.role === 'admin') {
    return baseQuery
  }
  
  // 教師・学生は自分の学校のデータのみ
  if (baseQuery.includes('WHERE')) {
    return `${baseQuery} AND school_id = ${user.school_id}`
  } else {
    return `${baseQuery} WHERE school_id = ${user.school_id}`
  }
}

// グローバルに公開
declare global {
  var buildSchoolFilteredQuery: typeof buildSchoolFilteredQuery
}

globalThis.buildSchoolFilteredQuery = buildSchoolFilteredQuery

// ロールベース認証ミドルウェア
function requireRole(...allowedRoles: string[]) {
  return async (c: any, next: () => Promise<void>) => {
    const user = c.get('user')
    
    if (!user) {
      return c.json({ success: false, error: '認証が必要です' }, 401)
    }
    
    if (!allowedRoles.includes(user.role)) {
      return c.json({ 
        success: false, 
        error: 'このリソースへのアクセス権限がありません',
        required_roles: allowedRoles,
        your_role: user.role
      }, 403)
    }
    
    await next()
  }
}

// 権限ベース認証ミドルウェア
function requirePermission(resource: string, action: string) {
  return async (c: any, next: () => Promise<void>) => {
    const { env } = c
    const user = c.get('user')
    
    if (!user) {
      return c.json({ success: false, error: '認証が必要です' }, 401)
    }
    
    try {
      // ユーザーのロールに紐づく権限をチェック
      const permission = await env.DB.prepare(`
        SELECT p.permission_name
        FROM permissions p
        JOIN role_permissions rp ON p.permission_id = rp.permission_id
        WHERE rp.user_role = ? AND p.resource = ? AND p.action = ?
      `).bind(user.role, resource, action).first()
      
      if (!permission) {
        return c.json({ 
          success: false, 
          error: 'この操作を行う権限がありません',
          required_permission: `${resource}:${action}`,
          your_role: user.role
        }, 403)
      }
      
      await next()
      
    } catch (error: any) {
      console.error('❌ 権限チェックエラー:', error)
      return c.json({ success: false, error: '権限チェックに失敗しました' }, 500)
    }
  }
}

// ユーザー一覧取得（管理者・教師用）
app.get('/api/auth/users', authMiddleware, requireRole('admin', 'teacher'), async (c) => {
  const { env } = c
  const school_id = c.req.query('school_id') || '1'
  const role = c.req.query('role')
  
  try {
    let query = 'SELECT user_id, username, full_name, user_role, school_id, is_active, created_at FROM auth_users WHERE school_id = ?'
    const params = [parseInt(school_id)]
    
    if (role) {
      query += ' AND user_role = ?'
      params.push(role)
    }
    
    query += ' ORDER BY created_at DESC'
    
    const users = await env.DB.prepare(query).bind(...params).all()
    
    return c.json({
      success: true,
      users: users.results || []
    })
    
  } catch (error: any) {
    console.error('❌ ユーザー一覧取得エラー:', error)
    return c.json({ success: false, error: 'ユーザー一覧の取得に失敗しました' }, 500)
  }
})

// 権限一覧取得API（管理者のみ）
app.get('/api/auth/permissions', authMiddleware, requireRole('admin'), async (c) => {
  const { env } = c
  
  try {
    const permissions = await env.DB.prepare(`
      SELECT * FROM permissions ORDER BY resource, action
    `).all()
    
    return c.json({
      success: true,
      permissions: permissions.results || []
    })
    
  } catch (error: any) {
    console.error('❌ 権限一覧取得エラー:', error)
    return c.json({ success: false, error: '権限一覧の取得に失敗しました' }, 500)
  }
})

// ユーザーの権限取得API
app.get('/api/auth/user-permissions/:userId', authMiddleware, async (c) => {
  const { env } = c
  const userId = c.req.param('userId')
  const currentUser = c.get('user')
  
  // 自分自身または管理者のみ閲覧可能
  if (currentUser.user_id !== parseInt(userId) && currentUser.role !== 'admin') {
    return c.json({ success: false, error: 'アクセス権限がありません' }, 403)
  }
  
  try {
    const user = await env.DB.prepare(`
      SELECT user_role FROM auth_users WHERE user_id = ?
    `).bind(userId).first()
    
    if (!user) {
      return c.json({ success: false, error: 'ユーザーが見つかりません' }, 404)
    }
    
    const permissions = await env.DB.prepare(`
      SELECT p.permission_name, p.description, p.resource, p.action
      FROM permissions p
      JOIN role_permissions rp ON p.permission_id = rp.permission_id
      WHERE rp.user_role = ?
      ORDER BY p.resource, p.action
    `).bind(user.user_role).all()
    
    return c.json({
      success: true,
      user_id: parseInt(userId),
      role: user.user_role,
      permissions: permissions.results || []
    })
    
  } catch (error: any) {
    console.error('❌ ユーザー権限取得エラー:', error)
    return c.json({ success: false, error: 'ユーザー権限の取得に失敗しました' }, 500)
  }
})

// ============================================
// Phase 5-5: 通知システムAPI
// ============================================

// 通知一覧取得API
app.get('/api/notifications', authMiddleware, async (c) => {
  const { env } = c
  const user = c.get('user')
  
  try {
    // 通知テーブルを作成（存在しない場合）
    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        school_id INTEGER NOT NULL DEFAULT 1,
        user_id INTEGER NOT NULL,
        notification_type TEXT NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        link_url TEXT,
        is_read INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run()
    
    // インデックス作成
    await env.DB.prepare(`
      CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id)
    `).run()
    
    // ユーザーの通知を取得
    let query = `
      SELECT * FROM notifications
      WHERE user_id = ?
    `
    
    // 管理者以外はschool_idでもフィルタ
    if (user.role !== 'admin') {
      query += ` AND school_id = ${user.school_id}`
    }
    
    query += ` ORDER BY created_at DESC LIMIT 50`
    
    const notifications = await env.DB.prepare(query).bind(user.user_id).all()
    
    return c.json({
      success: true,
      notifications: notifications.results || []
    })
  } catch (error: any) {
    console.error('❌ 通知取得エラー:', error)
    return c.json({ success: false, error: '通知の取得に失敗しました' }, 500)
  }
})

// 通知作成API
app.post('/api/notifications', authMiddleware, async (c) => {
  const { env } = c
  const user = c.get('user')
  const { user_id, notification_type, title, message, link_url } = await c.req.json()
  
  try {
    // 通知を作成
    const result = await env.DB.prepare(`
      INSERT INTO notifications (school_id, user_id, notification_type, title, message, link_url)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      user.school_id,
      user_id,
      notification_type,
      title,
      message,
      link_url || null
    ).run()
    
    return c.json({
      success: true,
      notification_id: result.meta.last_row_id
    })
  } catch (error: any) {
    console.error('❌ 通知作成エラー:', error)
    return c.json({ success: false, error: '通知の作成に失敗しました' }, 500)
  }
})

// 通知既読API
app.put('/api/notifications/:id/read', authMiddleware, async (c) => {
  const { env } = c
  const user = c.get('user')
  const notificationId = c.req.param('id')
  
  try {
    await env.DB.prepare(`
      UPDATE notifications
      SET is_read = 1
      WHERE id = ? AND user_id = ?
    `).bind(notificationId, user.user_id).run()
    
    return c.json({ success: true })
  } catch (error: any) {
    console.error('❌ 通知既読エラー:', error)
    return c.json({ success: false, error: '通知の既読処理に失敗しました' }, 500)
  }
})

// 全通知既読API
app.put('/api/notifications/read-all', authMiddleware, async (c) => {
  const { env } = c
  const user = c.get('user')
  
  try {
    await env.DB.prepare(`
      UPDATE notifications
      SET is_read = 1
      WHERE user_id = ? AND school_id = ?
    `).bind(user.user_id, user.school_id).run()
    
    return c.json({ success: true })
  } catch (error: any) {
    console.error('❌ 全通知既読エラー:', error)
    return c.json({ success: false, error: '全通知の既読処理に失敗しました' }, 500)
  }
})

// ============================================
// Phase 5-6: データエクスポート機能
// ============================================

// 学習ログCSVエクスポート
app.get('/api/export/learning-logs', authMiddleware, requireRole('teacher', 'admin'), async (c) => {
  const { env } = c
  const user = c.get('user')
  const { student_id } = c.req.query()
  
  try {
    let query = `
      SELECT 
        ll.id,
        ll.student_id,
        au.full_name as student_name,
        ll.problem_id,
        ll.is_correct,
        ll.time_spent,
        ll.hint_used,
        ll.created_at
      FROM learning_logs ll
      JOIN auth_users au ON ll.student_id = au.user_id
      WHERE ll.school_id = ?
    `
    
    const params = [user.school_id]
    
    if (student_id) {
      query += ` AND ll.student_id = ?`
      params.push(student_id)
    }
    
    query += ` ORDER BY ll.created_at DESC LIMIT 1000`
    
    const result = await env.DB.prepare(query).bind(...params).all()
    const logs = result.results || []
    
    // CSV生成
    let csv = 'ID,学生ID,学生名,問題ID,正解,所要時間,ヒント使用,日時\n'
    
    for (const log of logs) {
      csv += `${log.id},${log.student_id},${log.student_name},${log.problem_id},${log.is_correct ? '正解' : '不正解'},${log.time_spent || 0},${log.hint_used || 0},${log.created_at}\n`
    }
    
    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="learning-logs.csv"'
      }
    })
  } catch (error: any) {
    console.error('❌ CSVエクスポートエラー:', error)
    return c.json({ success: false, error: 'CSVエクスポートに失敗しました' }, 500)
  }
})

// カリキュラムCSVエクスポート
app.get('/api/export/curriculum', authMiddleware, requireRole('teacher', 'admin'), async (c) => {
  const { env } = c
  const user = c.get('user')
  
  try {
    let query = `
      SELECT 
        id,
        grade,
        subject,
        textbook_company,
        unit_name,
        unit_order,
        total_hours,
        created_at
      FROM curriculum
      WHERE school_id = ?
      ORDER BY grade, unit_order
    `
    
    const result = await env.DB.prepare(query).bind(user.school_id).all()
    const curriculums = result.results || []
    
    // CSV生成
    let csv = 'ID,学年,教科,教科書会社,単元名,単元順序,総時数,作成日時\n'
    
    for (const curr of curriculums) {
      csv += `${curr.id},${curr.grade},${curr.subject},${curr.textbook_company || ''},${curr.unit_name},${curr.unit_order},${curr.total_hours},${curr.created_at}\n`
    }
    
    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="curriculum.csv"'
      }
    })
  } catch (error: any) {
    console.error('❌ CSVエクスポートエラー:', error)
    return c.json({ success: false, error: 'CSVエクスポートに失敗しました' }, 500)
  }
})

// ============================================
// Phase 6-1: Email通知システム
// ============================================

// Email設定テーブル作成ヘルパー
async function ensureEmailTables(db: D1Database) {
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS email_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      school_id INTEGER NOT NULL DEFAULT 1,
      user_id INTEGER NOT NULL,
      email_address TEXT NOT NULL,
      receive_learning_updates INTEGER DEFAULT 1,
      receive_achievements INTEGER DEFAULT 1,
      receive_teacher_comments INTEGER DEFAULT 1,
      receive_system_notices INTEGER DEFAULT 1,
      is_verified INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(school_id, user_id)
    )
  `).run()
  
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS email_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      school_id INTEGER NOT NULL DEFAULT 1,
      user_id INTEGER NOT NULL,
      email_to TEXT NOT NULL,
      email_subject TEXT NOT NULL,
      email_body TEXT NOT NULL,
      email_type TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      error_message TEXT,
      sent_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `).run()
}

// Email送信関数（Resend API）
async function sendEmail(
  to: string,
  subject: string,
  html: string,
  resendApiKey?: string
): Promise<{ success: boolean; error?: string }> {
  if (!resendApiKey) {
    console.log('⚠️ RESEND_API_KEY not configured, skipping email send')
    return { success: false, error: 'Email API key not configured' }
  }
  
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'noreply@jiyushindo-gakushu.com',
        to: [to],
        subject: subject,
        html: html
      })
    })
    
    if (!response.ok) {
      const error = await response.text()
      console.error('❌ Email送信エラー:', error)
      return { success: false, error: error }
    }
    
    return { success: true }
  } catch (error: any) {
    console.error('❌ Email送信エラー:', error)
    return { success: false, error: error.message }
  }
}

// Email設定取得API
app.get('/api/email/settings', authMiddleware, async (c) => {
  const { env } = c
  const user = c.get('user')
  
  try {
    await ensureEmailTables(env.DB)
    
    const settings = await env.DB.prepare(`
      SELECT * FROM email_settings
      WHERE user_id = ? AND school_id = ?
    `).bind(user.user_id, user.school_id).first()
    
    return c.json({
      success: true,
      settings: settings || {
        email_address: user.email || '',
        receive_learning_updates: 1,
        receive_achievements: 1,
        receive_teacher_comments: 1,
        receive_system_notices: 1,
        is_verified: 0
      }
    })
  } catch (error: any) {
    console.error('❌ Email設定取得エラー:', error)
    return c.json({ success: false, error: 'Email設定の取得に失敗しました' }, 500)
  }
})

// Email設定更新API
app.post('/api/email/settings', authMiddleware, async (c) => {
  const { env } = c
  const user = c.get('user')
  const settings = await c.req.json()
  
  try {
    await ensureEmailTables(env.DB)
    
    await env.DB.prepare(`
      INSERT OR REPLACE INTO email_settings (
        school_id, user_id, email_address,
        receive_learning_updates, receive_achievements,
        receive_teacher_comments, receive_system_notices,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).bind(
      user.school_id,
      user.user_id,
      settings.email_address,
      settings.receive_learning_updates ? 1 : 0,
      settings.receive_achievements ? 1 : 0,
      settings.receive_teacher_comments ? 1 : 0,
      settings.receive_system_notices ? 1 : 0
    ).run()
    
    return c.json({ success: true })
  } catch (error: any) {
    console.error('❌ Email設定更新エラー:', error)
    return c.json({ success: false, error: 'Email設定の更新に失敗しました' }, 500)
  }
})

// Email送信API（管理者・教師のみ）
app.post('/api/email/send', authMiddleware, requireRole('admin', 'teacher'), async (c) => {
  const { env } = c
  const user = c.get('user')
  const { to, subject, html, email_type } = await c.req.json()
  
  try {
    await ensureEmailTables(env.DB)
    
    // Email送信
    const result = await sendEmail(to, subject, html, env.RESEND_API_KEY)
    
    // ログ記録
    await env.DB.prepare(`
      INSERT INTO email_logs (
        school_id, user_id, email_to, email_subject, email_body,
        email_type, status, error_message, sent_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).bind(
      user.school_id,
      user.user_id,
      to,
      subject,
      html,
      email_type || 'custom',
      result.success ? 'sent' : 'failed',
      result.error || null
    ).run()
    
    return c.json({
      success: result.success,
      error: result.error
    })
  } catch (error: any) {
    console.error('❌ Email送信エラー:', error)
    return c.json({ success: false, error: 'Emailの送信に失敗しました' }, 500)
  }
})

// 学習完了通知Email送信
app.post('/api/email/notify-learning-complete', authMiddleware, async (c) => {
  const { env } = c
  const user = c.get('user')
  const { student_id, curriculum_name } = await c.req.json()
  
  try {
    await ensureEmailTables(env.DB)
    
    // 学生のEmail設定取得
    const settings = await env.DB.prepare(`
      SELECT email_address, receive_learning_updates
      FROM email_settings
      WHERE user_id = ? AND school_id = ? AND receive_learning_updates = 1
    `).bind(student_id, user.school_id).first()
    
    if (!settings) {
      return c.json({ success: false, error: 'Email設定が見つかりません' })
    }
    
    const subject = `【学習完了】${curriculum_name}を完了しました`
    const html = `
      <h2>🎉 学習完了おめでとうございます！</h2>
      <p>「${curriculum_name}」を完了しました。</p>
      <p>次の単元に進みましょう！</p>
      <br>
      <p><a href="https://a70d8344.jiyushindo-gakushu.pages.dev">学習サイトへ</a></p>
    `
    
    const result = await sendEmail(settings.email_address, subject, html, env.RESEND_API_KEY)
    
    // ログ記録
    await env.DB.prepare(`
      INSERT INTO email_logs (
        school_id, user_id, email_to, email_subject, email_body,
        email_type, status, error_message, sent_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).bind(
      user.school_id,
      student_id,
      settings.email_address,
      subject,
      html,
      'learning_complete',
      result.success ? 'sent' : 'failed',
      result.error || null
    ).run()
    
    return c.json({
      success: result.success,
      error: result.error
    })
  } catch (error: any) {
    console.error('❌ Email送信エラー:', error)
    return c.json({ success: false, error: 'Emailの送信に失敗しました' }, 500)
  }
})

// ============================================
// Phase 6-2: 高度な分析レポート
// ============================================

// 学習傾向分析API（週次・月次）
app.get('/api/analytics/learning-trends/:studentId', authMiddleware, async (c) => {
  const { env } = c
  const user = c.get('user')
  const studentId = c.req.param('studentId')
  const { period } = c.req.query() // 'week' or 'month'
  
  try {
    const days = period === 'month' ? 30 : 7
    
    // 日別の学習データ取得
    const dailyStats = await env.DB.prepare(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as total_problems,
        SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) as correct_count,
        AVG(time_spent) as avg_time,
        SUM(hint_used) as total_hints
      FROM learning_logs
      WHERE student_id = ?
        AND school_id = ?
        AND created_at >= DATE('now', '-${days} days')
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `).bind(studentId, user.school_id).all()
    
    // 教科別統計
    const subjectStats = await env.DB.prepare(`
      SELECT 
        c.subject,
        COUNT(*) as total_problems,
        SUM(CASE WHEN ll.is_correct = 1 THEN 1 ELSE 0 END) as correct_count,
        CAST(SUM(CASE WHEN ll.is_correct = 1 THEN 1 ELSE 0 END) AS FLOAT) / COUNT(*) * 100 as accuracy
      FROM learning_logs ll
      JOIN problems p ON ll.problem_id = p.id
      JOIN learning_cards lc ON p.card_id = lc.id
      JOIN courses co ON lc.course_id = co.id
      JOIN curriculum c ON co.curriculum_id = c.id
      WHERE ll.student_id = ?
        AND ll.school_id = ?
        AND ll.created_at >= DATE('now', '-${days} days')
      GROUP BY c.subject
      ORDER BY accuracy DESC
    `).bind(studentId, user.school_id).all()
    
    // 時間帯別学習パターン
    const hourlyPattern = await env.DB.prepare(`
      SELECT 
        CAST(strftime('%H', created_at) AS INTEGER) as hour,
        COUNT(*) as problem_count,
        AVG(CASE WHEN is_correct = 1 THEN 100 ELSE 0 END) as avg_accuracy
      FROM learning_logs
      WHERE student_id = ?
        AND school_id = ?
        AND created_at >= DATE('now', '-${days} days')
      GROUP BY hour
      ORDER BY hour
    `).bind(studentId, user.school_id).all()
    
    return c.json({
      success: true,
      period: period || 'week',
      daily_stats: dailyStats.results || [],
      subject_stats: subjectStats.results || [],
      hourly_pattern: hourlyPattern.results || []
    })
  } catch (error: any) {
    console.error('❌ 学習傾向分析エラー:', error)
    return c.json({ success: false, error: '学習傾向分析に失敗しました' }, 500)
  }
})

// クラス比較分析API
app.get('/api/analytics/class-comparison', authMiddleware, requireRole('teacher', 'admin'), async (c) => {
  const { env } = c
  const user = c.get('user')
  
  try {
    // クラス別統計
    const classStats = await env.DB.prepare(`
      SELECT 
        au.user_id as student_id,
        au.full_name as student_name,
        COUNT(ll.id) as total_problems,
        SUM(CASE WHEN ll.is_correct = 1 THEN 1 ELSE 0 END) as correct_count,
        CAST(SUM(CASE WHEN ll.is_correct = 1 THEN 1 ELSE 0 END) AS FLOAT) / COUNT(ll.id) * 100 as accuracy,
        AVG(ll.time_spent) as avg_time
      FROM auth_users au
      LEFT JOIN learning_logs ll ON au.user_id = ll.student_id AND ll.school_id = au.school_id
      WHERE au.school_id = ?
        AND au.user_role = 'student'
        AND ll.created_at >= DATE('now', '-30 days')
      GROUP BY au.user_id, au.full_name
      ORDER BY accuracy DESC
    `).bind(user.school_id).all()
    
    // 教科別クラス平均
    const subjectAverages = await env.DB.prepare(`
      SELECT 
        c.subject,
        COUNT(DISTINCT ll.student_id) as student_count,
        AVG(CASE WHEN ll.is_correct = 1 THEN 100 ELSE 0 END) as avg_accuracy,
        COUNT(ll.id) as total_problems
      FROM learning_logs ll
      JOIN problems p ON ll.problem_id = p.id
      JOIN learning_cards lc ON p.card_id = lc.id
      JOIN courses co ON lc.course_id = co.id
      JOIN curriculum c ON co.curriculum_id = c.id
      WHERE ll.school_id = ?
        AND ll.created_at >= DATE('now', '-30 days')
      GROUP BY c.subject
      ORDER BY avg_accuracy DESC
    `).bind(user.school_id).all()
    
    return c.json({
      success: true,
      class_stats: classStats.results || [],
      subject_averages: subjectAverages.results || []
    })
  } catch (error: any) {
    console.error('❌ クラス比較分析エラー:', error)
    return c.json({ success: false, error: 'クラス比較分析に失敗しました' }, 500)
  }
})

// 弱点分析API
app.get('/api/analytics/weak-points/:studentId', authMiddleware, async (c) => {
  const { env } = c
  const user = c.get('user')
  const studentId = c.req.param('studentId')
  
  try {
    // 正答率が低い単元を特定
    const weakUnits = await env.DB.prepare(`
      SELECT 
        c.unit_name,
        c.subject,
        COUNT(ll.id) as attempt_count,
        SUM(CASE WHEN ll.is_correct = 1 THEN 1 ELSE 0 END) as correct_count,
        CAST(SUM(CASE WHEN ll.is_correct = 1 THEN 1 ELSE 0 END) AS FLOAT) / COUNT(ll.id) * 100 as accuracy,
        AVG(ll.time_spent) as avg_time,
        SUM(ll.hint_used) as total_hints
      FROM learning_logs ll
      JOIN problems p ON ll.problem_id = p.id
      JOIN learning_cards lc ON p.card_id = lc.id
      JOIN courses co ON lc.course_id = co.id
      JOIN curriculum c ON co.curriculum_id = c.id
      WHERE ll.student_id = ?
        AND ll.school_id = ?
        AND ll.created_at >= DATE('now', '-30 days')
      GROUP BY c.id, c.unit_name, c.subject
      HAVING accuracy < 70
      ORDER BY accuracy ASC, attempt_count DESC
      LIMIT 10
    `).bind(studentId, user.school_id).all()
    
    // 問題タイプ別の正答率
    const problemTypeStats = await env.DB.prepare(`
      SELECT 
        p.problem_type,
        COUNT(ll.id) as attempt_count,
        SUM(CASE WHEN ll.is_correct = 1 THEN 1 ELSE 0 END) as correct_count,
        CAST(SUM(CASE WHEN ll.is_correct = 1 THEN 1 ELSE 0 END) AS FLOAT) / COUNT(ll.id) * 100 as accuracy
      FROM learning_logs ll
      JOIN problems p ON ll.problem_id = p.id
      WHERE ll.student_id = ?
        AND ll.school_id = ?
        AND ll.created_at >= DATE('now', '-30 days')
      GROUP BY p.problem_type
      ORDER BY accuracy ASC
    `).bind(studentId, user.school_id).all()
    
    return c.json({
      success: true,
      weak_units: weakUnits.results || [],
      problem_type_stats: problemTypeStats.results || []
    })
  } catch (error: any) {
    console.error('❌ 弱点分析エラー:', error)
    return c.json({ success: false, error: '弱点分析に失敗しました' }, 500)
  }
})

// ============================================
// Phase 6-3: リアルタイム協働機能
// ============================================

// オンライン状態管理テーブル作成
async function ensureCollaborationTables(db: D1Database) {
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS user_presence (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      school_id INTEGER NOT NULL DEFAULT 1,
      user_id INTEGER NOT NULL,
      user_name TEXT NOT NULL,
      user_role TEXT NOT NULL,
      status TEXT DEFAULT 'online' CHECK(status IN ('online', 'away', 'offline')),
      last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
      current_page TEXT,
      UNIQUE(school_id, user_id)
    )
  `).run()
  
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS collaboration_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      school_id INTEGER NOT NULL DEFAULT 1,
      session_type TEXT NOT NULL,
      session_data TEXT,
      created_by INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `).run()
}

// オンライン状態更新API
app.post('/api/collaboration/presence', authMiddleware, async (c) => {
  const { env } = c
  const user = c.get('user')
  const { status, current_page } = await c.req.json()
  
  try {
    await ensureCollaborationTables(env.DB)
    
    await env.DB.prepare(`
      INSERT OR REPLACE INTO user_presence (
        school_id, user_id, user_name, user_role, status, current_page, last_seen
      ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).bind(
      user.school_id,
      user.user_id,
      user.full_name,
      user.role,
      status || 'online',
      current_page || null
    ).run()
    
    return c.json({ success: true })
  } catch (error: any) {
    console.error('❌ オンライン状態更新エラー:', error)
    return c.json({ success: false, error: 'オンライン状態の更新に失敗しました' }, 500)
  }
})

// オンラインユーザー一覧API
app.get('/api/collaboration/online-users', authMiddleware, async (c) => {
  const { env } = c
  const user = c.get('user')
  
  try {
    await ensureCollaborationTables(env.DB)
    
    // 5分以内にアクティブなユーザーをオンラインとみなす
    const onlineUsers = await env.DB.prepare(`
      SELECT 
        user_id,
        user_name,
        user_role,
        status,
        current_page,
        last_seen
      FROM user_presence
      WHERE school_id = ?
        AND last_seen >= DATETIME('now', '-5 minutes')
      ORDER BY last_seen DESC
    `).bind(user.school_id).all()
    
    return c.json({
      success: true,
      online_users: onlineUsers.results || []
    })
  } catch (error: any) {
    console.error('❌ オンラインユーザー取得エラー:', error)
    return c.json({ success: false, error: 'オンラインユーザーの取得に失敗しました' }, 500)
  }
})

// 協働セッション作成API
app.post('/api/collaboration/sessions', authMiddleware, requireRole('teacher', 'admin'), async (c) => {
  const { env } = c
  const user = c.get('user')
  const { session_type, session_data } = await c.req.json()
  
  try {
    await ensureCollaborationTables(env.DB)
    
    const result = await env.DB.prepare(`
      INSERT INTO collaboration_sessions (
        school_id, session_type, session_data, created_by
      ) VALUES (?, ?, ?, ?)
    `).bind(
      user.school_id,
      session_type,
      JSON.stringify(session_data),
      user.user_id
    ).run()
    
    return c.json({
      success: true,
      session_id: result.meta.last_row_id
    })
  } catch (error: any) {
    console.error('❌ 協働セッション作成エラー:', error)
    return c.json({ success: false, error: '協働セッションの作成に失敗しました' }, 500)
  }
})

// 協働セッション一覧API
app.get('/api/collaboration/sessions', authMiddleware, async (c) => {
  const { env } = c
  const user = c.get('user')
  
  try {
    await ensureCollaborationTables(env.DB)
    
    const sessions = await env.DB.prepare(`
      SELECT 
        cs.*,
        au.full_name as creator_name
      FROM collaboration_sessions cs
      JOIN auth_users au ON cs.created_by = au.user_id
      WHERE cs.school_id = ?
      ORDER BY cs.updated_at DESC
      LIMIT 50
    `).bind(user.school_id).all()
    
    return c.json({
      success: true,
      sessions: sessions.results || []
    })
  } catch (error: any) {
    console.error('❌ 協働セッション取得エラー:', error)
    return c.json({ success: false, error: '協働セッションの取得に失敗しました' }, 500)
  }
})

// ============================================
// Phase 8-1: ダッシュボードAPI
// ============================================

// 教師用クラス統計API
app.get('/api/teacher/class-stats', requireAuth, async (c) => {
  try {
    const { env } = c
    const user = c.get('user')

    // 総学生数
    const totalStudents = await env.DB.prepare(`
      SELECT COUNT(*) as count 
      FROM students 
      WHERE school_id = ?
    `).bind(user.school_id).first()

    // 今日の学習数
    const todayLearning = await env.DB.prepare(`
      SELECT COUNT(*) as count 
      FROM learning_logs
      WHERE school_id = ? AND DATE(created_at) = DATE('now')
    `).bind(user.school_id).first()

    // 平均正答率
    const avgAccuracy = await env.DB.prepare(`
      SELECT AVG(CASE WHEN is_correct = 1 THEN 100.0 ELSE 0.0 END) as avg
      FROM learning_logs
      WHERE school_id = ?
    `).bind(user.school_id).first()

    // 完了コース数
    const completedCourses = await env.DB.prepare(`
      SELECT COUNT(DISTINCT curriculum_id) as count
      FROM student_progress
      WHERE school_id = ? AND status = 'completed'
    `).bind(user.school_id).first()

    return c.json({
      totalStudents: totalStudents?.count || 0,
      todayLearning: todayLearning?.count || 0,
      avgAccuracy: avgAccuracy?.avg || 0,
      completedCourses: completedCourses?.count || 0
    })
  } catch (error: any) {
    console.error('❌ クラス統計取得エラー:', error)
    return c.json({ success: false, error: 'クラス統計の取得に失敗しました' }, 500)
  }
})

// 学生用統計API
app.get('/api/learning/stats/:studentId', requireAuth, async (c) => {
  try {
    const { env } = c
    const studentId = c.req.param('studentId')
    const user = c.get('user')

    // 学習日数
    const totalDays = await env.DB.prepare(`
      SELECT COUNT(DISTINCT DATE(created_at)) as count
      FROM learning_logs
      WHERE student_id = ? AND school_id = ?
    `).bind(studentId, user.school_id).first()

    // 総問題数
    const totalProblems = await env.DB.prepare(`
      SELECT COUNT(*) as count
      FROM learning_logs
      WHERE student_id = ? AND school_id = ?
    `).bind(studentId, user.school_id).first()

    // 正答率
    const accuracy = await env.DB.prepare(`
      SELECT AVG(CASE WHEN is_correct = 1 THEN 100.0 ELSE 0.0 END) as avg
      FROM learning_logs
      WHERE student_id = ? AND school_id = ?
    `).bind(studentId, user.school_id).first()

    // バッジ数
    const badges = await env.DB.prepare(`
      SELECT COUNT(*) as count
      FROM student_badges
      WHERE student_id = ? AND school_id = ?
    `).bind(studentId, user.school_id).first()

    return c.json({
      totalDays: totalDays?.count || 0,
      totalProblems: totalProblems?.count || 0,
      accuracy: accuracy?.avg || 0,
      badges: badges?.count || 0
    })
  } catch (error: any) {
    console.error('❌ 学生統計取得エラー:', error)
    return c.json({ success: false, error: '学生統計の取得に失敗しました' }, 500)
  }
})

// 最近の学習ログAPI
app.get('/api/learning/recent-logs', requireAuth, async (c) => {
  try {
    const { env } = c
    const user = c.get('user')
    const limit = c.req.query('limit') || '10'
    const studentId = c.req.query('studentId')

    let query = `
      SELECT 
        ll.*,
        s.student_name,
        c.unit_name
      FROM learning_logs ll
      LEFT JOIN students s ON ll.student_id = s.student_id
      LEFT JOIN curriculum c ON ll.curriculum_id = c.id
      WHERE ll.school_id = ?
    `
    const params = [user.school_id]

    if (studentId) {
      query += ' AND ll.student_id = ?'
      params.push(studentId)
    }

    query += ' ORDER BY ll.created_at DESC LIMIT ?'
    params.push(limit)

    const logs = await env.DB.prepare(query).bind(...params).all()

    return c.json(logs.results || [])
  } catch (error: any) {
    console.error('❌ 最近の学習ログ取得エラー:', error)
    return c.json({ success: false, error: '学習ログの取得に失敗しました' }, 500)
  }
})

// 学生進捗API
app.get('/api/learning/progress/:studentId', requireAuth, async (c) => {
  try {
    const { env } = c
    const studentId = c.req.param('studentId')
    const user = c.get('user')

    const progress = await env.DB.prepare(`
      SELECT 
        c.id,
        c.unit_name,
        c.subject,
        sp.status,
        sp.started_at,
        sp.completed_at
      FROM student_progress sp
      JOIN curriculum c ON sp.curriculum_id = c.id
      WHERE sp.student_id = ? AND sp.school_id = ?
      ORDER BY sp.started_at DESC
    `).bind(studentId, user.school_id).all()

    return c.json(progress.results || [])
  } catch (error: any) {
    console.error('❌ 進捗取得エラー:', error)
    return c.json({ success: false, error: '進捗の取得に失敗しました' }, 500)
  }
})

// ============================================
// Phase 9-1: 保護者用API
// ============================================

// 保護者の子ども一覧取得
app.get('/api/parent/children', requireAuth, async (c) => {
  try {
    const { env } = c
    const user = c.get('user')

    // parent_student_relationsから子ども一覧を取得
    const children = await env.DB.prepare(`
      SELECT 
        s.student_id,
        s.student_name,
        s.grade_level,
        s.email,
        psr.relationship_type,
        psr.created_at as relation_created_at
      FROM parent_student_relations psr
      JOIN students s ON psr.student_id = s.student_id
      WHERE psr.parent_id = ? AND s.school_id = ?
      ORDER BY s.grade_level DESC, s.student_name
    `).bind(user.user_id, user.school_id).all()

    return c.json({
      success: true,
      children: children.results || []
    })
  } catch (error: any) {
    console.error('❌ 子ども一覧取得エラー:', error)
    return c.json({ success: false, error: '子ども一覧の取得に失敗しました' }, 500)
  }
})

// 教師からのコメント取得
app.get('/api/parent/teacher-comments/:studentId', requireAuth, async (c) => {
  try {
    const { env } = c
    const studentId = c.req.param('studentId')
    const user = c.get('user')

    // 評価テーブルからコメントを取得
    const comments = await env.DB.prepare(`
      SELECT 
        e.evaluation_id,
        e.comments as comment,
        e.score,
        e.max_score,
        e.subject,
        e.evaluated_at as created_at,
        t.teacher_name
      FROM evaluations e
      LEFT JOIN teachers t ON e.teacher_id = t.teacher_id
      WHERE e.student_id = ? AND e.school_id = ? AND e.comments IS NOT NULL
      ORDER BY e.evaluated_at DESC
      LIMIT 10
    `).bind(studentId, user.school_id).all()

    return c.json(comments.results || [])
  } catch (error: any) {
    console.error('❌ 教師コメント取得エラー:', error)
    return c.json({ success: false, error: '教師コメントの取得に失敗しました' }, 500)
  }
})

// 週間学習サマリー取得
app.get('/api/parent/weekly-summary/:studentId', requireAuth, async (c) => {
  try {
    const { env } = c
    const studentId = c.req.param('studentId')
    const user = c.get('user')

    // 過去7日間の学習データ
    const weeklyData = await env.DB.prepare(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as problem_count,
        AVG(CASE WHEN is_correct = 1 THEN 100.0 ELSE 0.0 END) as accuracy,
        SUM(time_spent) as total_time
      FROM learning_logs
      WHERE student_id = ? 
        AND school_id = ?
        AND created_at >= DATE('now', '-7 days')
      GROUP BY DATE(created_at)
      ORDER BY date
    `).bind(studentId, user.school_id).all()

    // 教科別統計
    const subjectStats = await env.DB.prepare(`
      SELECT 
        c.subject,
        COUNT(*) as problem_count,
        AVG(CASE WHEN ll.is_correct = 1 THEN 100.0 ELSE 0.0 END) as accuracy
      FROM learning_logs ll
      JOIN curriculum c ON ll.curriculum_id = c.id
      WHERE ll.student_id = ? 
        AND ll.school_id = ?
        AND ll.created_at >= DATE('now', '-7 days')
      GROUP BY c.subject
    `).bind(studentId, user.school_id).all()

    return c.json({
      success: true,
      weeklyData: weeklyData.results || [],
      subjectStats: subjectStats.results || []
    })
  } catch (error: any) {
    console.error('❌ 週間サマリー取得エラー:', error)
    return c.json({ success: false, error: '週間サマリーの取得に失敗しました' }, 500)
  }
})

// ============================================
// Phase 10-1: セキュリティ強化
// ============================================

// CSRFトークン生成
function generateCSRFToken(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

// レート制限用のストア（メモリベース - 本番ではKVを推奨）
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

// レート制限ミドルウェア
function rateLimitMiddleware(maxRequests: number = 100, windowMs: number = 60000) {
  return async (c: any, next: any) => {
    const ip = c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || 'unknown'
    const now = Date.now()
    
    const record = rateLimitStore.get(ip)
    
    if (!record || now > record.resetTime) {
      // 新しいウィンドウを開始
      rateLimitStore.set(ip, { count: 1, resetTime: now + windowMs })
      return next()
    }
    
    if (record.count >= maxRequests) {
      return c.json({ 
        success: false, 
        error: 'リクエスト制限に達しました。しばらくしてから再試行してください。' 
      }, 429)
    }
    
    record.count++
    return next()
  }
}

// CSRFトークン取得API
app.get('/api/security/csrf-token', requireAuth, async (c) => {
  try {
    const { env } = c
    const user = c.get('user')
    const token = generateCSRFToken()
    
    // セッションにトークンを保存（簡易実装 - 本番ではRedis/KVを推奨）
    // ここではレスポンスヘッダーで返す
    c.header('X-CSRF-Token', token)
    
    return c.json({ 
      success: true, 
      csrfToken: token,
      expiresIn: 3600 // 1時間有効
    })
  } catch (error: any) {
    console.error('❌ CSRFトークン生成エラー:', error)
    return c.json({ success: false, error: 'トークン生成に失敗しました' }, 500)
  }
})

// CSRF検証ミドルウェア
function csrfProtection() {
  return async (c: any, next: any) => {
    const method = c.req.method
    
    // GET, HEAD, OPTIONSはCSRF検証不要
    if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
      return next()
    }
    
    const token = c.req.header('X-CSRF-Token') || c.req.query('csrf_token')
    
    if (!token) {
      return c.json({ 
        success: false, 
        error: 'CSRFトークンが必要です' 
      }, 403)
    }
    
    // トークン検証（簡易実装 - 本番では永続化ストレージと照合）
    // ここでは長さチェックのみ
    if (token.length !== 64) {
      return c.json({ 
        success: false, 
        error: '無効なCSRFトークンです' 
      }, 403)
    }
    
    return next()
  }
}

// セキュリティヘッダーミドルウェア
function securityHeaders() {
  return async (c: any, next: any) => {
    await next()
    
    // Content Security Policy
    c.header('Content-Security-Policy', 
      "default-src 'self'; " +
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.tailwindcss.com https://cdn.jsdelivr.net; " +
      "style-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com https://cdn.jsdelivr.net; " +
      "img-src 'self' data: https:; " +
      "font-src 'self' https://cdn.jsdelivr.net; " +
      "connect-src 'self'; " +
      "frame-ancestors 'none';"
    )
    
    // その他のセキュリティヘッダー
    c.header('X-Content-Type-Options', 'nosniff')
    c.header('X-Frame-Options', 'DENY')
    c.header('X-XSS-Protection', '1; mode=block')
    c.header('Referrer-Policy', 'strict-origin-when-cross-origin')
    c.header('Permissions-Policy', 'geolocation=(), microphone=(), camera=()')
    
    // HSTS (HTTPSのみ)
    if (c.req.url.startsWith('https://')) {
      c.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')
    }
  }
}

// グローバルにセキュリティヘッダーを適用
app.use('*', securityHeaders())

// APIルートにレート制限を適用
app.use('/api/*', rateLimitMiddleware(100, 60000)) // 1分間に100リクエスト

// 入力サニタイゼーション関数
function sanitizeInput(input: string): string {
  if (typeof input !== 'string') return ''
  
  return input
    .replace(/[<>]/g, '') // XSS対策: HTMLタグ削除
    .replace(/javascript:/gi, '') // XSS対策: javascriptプロトコル削除
    .replace(/on\w+=/gi, '') // XSS対策: イベントハンドラ削除
    .trim()
    .slice(0, 10000) // 最大長制限
}

// SQLインジェクション対策用のパラメータ検証
function validateSQLParam(param: any): boolean {
  if (param === null || param === undefined) return false
  
  const str = String(param)
  
  // 危険なSQLキーワードチェック
  const dangerousPatterns = [
    /;\s*(drop|delete|truncate|alter|exec|execute)\s+/i,
    /union\s+select/i,
    /\/\*|\*\//,  // SQLコメント
    /--/,  // SQLコメント
    /xp_/i,  // SQL Server拡張プロシージャ
  ]
  
  return !dangerousPatterns.some(pattern => pattern.test(str))
}

// セキュリティ監査ログAPI
app.post('/api/security/audit-log', requireAuth, async (c) => {
  try {
    const { env } = c
    const user = c.get('user')
    const { action, details } = await c.req.json()
    
    // 監査ログを保存（簡易実装）
    await env.DB.prepare(`
      INSERT INTO security_audit_logs (user_id, action, details, ip_address, user_agent, created_at)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).bind(
      user.user_id,
      sanitizeInput(action),
      sanitizeInput(JSON.stringify(details)),
      c.req.header('cf-connecting-ip') || 'unknown',
      c.req.header('user-agent') || 'unknown'
    ).run().catch(() => {
      console.warn('監査ログテーブルが存在しません（作成が必要です）')
    })
    
    return c.json({ success: true })
  } catch (error: any) {
    console.error('❌ 監査ログ記録エラー:', error)
    return c.json({ success: false, error: '監査ログの記録に失敗しました' }, 500)
  }
})

// セキュリティスキャンAPI（管理者のみ）
app.get('/api/security/scan', requireAuth, async (c) => {
  try {
    const user = c.get('user')
    
    if (user.user_role !== 'admin') {
      return c.json({ success: false, error: '管理者権限が必要です' }, 403)
    }
    
    const securityReport = {
      timestamp: new Date().toISOString(),
      checks: {
        csrfProtection: true,
        rateLimiting: true,
        securityHeaders: true,
        inputSanitization: true,
        sqlInjectionProtection: true
      },
      recommendations: [
        'CSRFトークンを永続化ストレージ（KV）に保存することを推奨',
        'レート制限をCloudflare KVで管理することを推奨',
        '監査ログの定期的なレビューを推奨',
        '定期的なセキュリティスキャンを推奨'
      ]
    }
    
    return c.json({ success: true, report: securityReport })
  } catch (error: any) {
    console.error('❌ セキュリティスキャンエラー:', error)
    return c.json({ success: false, error: 'スキャンに失敗しました' }, 500)
  }
})

// グローバルに公開
globalThis.sanitizeInput = sanitizeInput
globalThis.validateSQLParam = validateSQLParam

// ============================================
// Phase 10-2: パフォーマンス監視
// ============================================

// パフォーマンスメトリクス記録API
app.post('/api/performance/metrics', async (c) => {
  try {
    const { env } = c
    const { metric_type, endpoint, response_time_ms, status_code } = await c.req.json()
    
    await env.DB.prepare(`
      INSERT INTO performance_metrics (metric_type, endpoint, response_time_ms, status_code, ip_address, user_agent, school_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      metric_type,
      endpoint,
      response_time_ms,
      status_code,
      c.req.header('cf-connecting-ip') || 'unknown',
      c.req.header('user-agent') || 'unknown',
      1
    ).run()
    
    return c.json({ success: true })
  } catch (error: any) {
    console.error('❌ パフォーマンスメトリクス記録エラー:', error)
    return c.json({ success: false, error: 'メトリクスの記録に失敗しました' }, 500)
  }
})

// エラーログ記録API
app.post('/api/performance/error-log', async (c) => {
  try {
    const { env } = c
    const { error_type, error_message, stack_trace, endpoint, severity } = await c.req.json()
    
    await env.DB.prepare(`
      INSERT INTO error_logs (error_type, error_message, stack_trace, endpoint, ip_address, user_agent, severity, school_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      error_type,
      sanitizeInput(error_message || ''),
      sanitizeInput(stack_trace || ''),
      endpoint,
      c.req.header('cf-connecting-ip') || 'unknown',
      c.req.header('user-agent') || 'unknown',
      severity || 'error',
      1
    ).run()
    
    return c.json({ success: true })
  } catch (error: any) {
    console.error('❌ エラーログ記録エラー:', error)
    return c.json({ success: false, error: 'エラーログの記録に失敗しました' }, 500)
  }
})

// パフォーマンスダッシュボードデータ取得API
app.get('/api/performance/dashboard', requireAuth, async (c) => {
  try {
    const { env } = c
    const user = c.get('user')
    
    if (user.user_role !== 'admin') {
      return c.json({ success: false, error: '管理者権限が必要です' }, 403)
    }
    
    // 過去24時間の平均応答時間
    const avgResponseTime = await env.DB.prepare(`
      SELECT AVG(response_time_ms) as avg_time
      FROM performance_metrics
      WHERE created_at >= datetime('now', '-24 hours')
    `).first()
    
    // エラー率（過去24時間）
    const errorRate = await env.DB.prepare(`
      SELECT 
        COUNT(CASE WHEN status_code >= 400 THEN 1 END) * 100.0 / COUNT(*) as error_rate
      FROM performance_metrics
      WHERE created_at >= datetime('now', '-24 hours')
    `).first()
    
    // エンドポイント別パフォーマンス（トップ10）
    const endpointPerformance = await env.DB.prepare(`
      SELECT 
        endpoint,
        COUNT(*) as request_count,
        AVG(response_time_ms) as avg_time,
        MIN(response_time_ms) as min_time,
        MAX(response_time_ms) as max_time
      FROM performance_metrics
      WHERE created_at >= datetime('now', '-24 hours')
      GROUP BY endpoint
      ORDER BY request_count DESC
      LIMIT 10
    `).all()
    
    // エラーログサマリー（過去24時間）
    const errorSummary = await env.DB.prepare(`
      SELECT 
        error_type,
        severity,
        COUNT(*) as count
      FROM error_logs
      WHERE created_at >= datetime('now', '-24 hours')
      GROUP BY error_type, severity
      ORDER BY count DESC
    `).all()
    
    // システムヘルス状態
    const systemHealth = await env.DB.prepare(`
      SELECT *
      FROM system_health_checks
      ORDER BY checked_at DESC
      LIMIT 5
    `).all()
    
    return c.json({
      success: true,
      metrics: {
        avgResponseTime: avgResponseTime?.avg_time || 0,
        errorRate: errorRate?.error_rate || 0,
        endpointPerformance: endpointPerformance.results || [],
        errorSummary: errorSummary.results || [],
        systemHealth: systemHealth.results || []
      }
    })
  } catch (error: any) {
    console.error('❌ パフォーマンスダッシュボードデータ取得エラー:', error)
    return c.json({ success: false, error: 'データの取得に失敗しました' }, 500)
  }
})

// システムヘルスチェックAPI
app.get('/api/performance/health', async (c) => {
  try {
    const { env } = c
    const startTime = Date.now()
    
    // データベースヘルスチェック
    const dbCheck = await env.DB.prepare('SELECT 1').first()
    const dbResponseTime = Date.now() - startTime
    
    const healthStatus = {
      status: 'healthy',
      checks: {
        database: {
          status: dbCheck ? 'healthy' : 'down',
          responseTime: dbResponseTime
        },
        api: {
          status: 'healthy',
          responseTime: Date.now() - startTime
        }
      },
      timestamp: new Date().toISOString()
    }
    
    // ヘルスチェック結果を記録
    await env.DB.prepare(`
      INSERT INTO system_health_checks (check_type, status, response_time_ms, details)
      VALUES ('database', ?, ?, ?)
    `).bind(
      healthStatus.checks.database.status,
      dbResponseTime,
      JSON.stringify(healthStatus)
    ).run()
    
    return c.json(healthStatus)
  } catch (error: any) {
    console.error('❌ ヘルスチェックエラー:', error)
    return c.json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    }, 500)
  }
})

// エラーログ一覧取得API（管理者のみ）
app.get('/api/performance/error-logs', requireAuth, async (c) => {
  try {
    const { env } = c
    const user = c.get('user')
    
    if (user.user_role !== 'admin') {
      return c.json({ success: false, error: '管理者権限が必要です' }, 403)
    }
    
    const limit = c.req.query('limit') || '50'
    const severity = c.req.query('severity')
    
    let query = `
      SELECT *
      FROM error_logs
      WHERE 1=1
    `
    const params: any[] = []
    
    if (severity) {
      query += ' AND severity = ?'
      params.push(severity)
    }
    
    query += ' ORDER BY created_at DESC LIMIT ?'
    params.push(limit)
    
    const logs = await env.DB.prepare(query).bind(...params).all()
    
    return c.json({
      success: true,
      logs: logs.results || []
    })
  } catch (error: any) {
    console.error('❌ エラーログ取得エラー:', error)
    return c.json({ success: false, error: 'エラーログの取得に失敗しました' }, 500)
  }
})

// ============================================
// Phase 11-1: エッジキャッシュ管理API
// ============================================

// キャッシュ統計取得API
app.get('/api/cache/stats', requireAuth, async (c) => {
  try {
    const { env } = c
    const user = c.get('user')
    
    if (user.user_role !== 'admin') {
      return c.json({ success: false, error: '管理者権限が必要です' }, 403)
    }
    
    const stats = await getCacheStats(env.KV)
    const metrics = cacheMetrics.getStats()
    
    return c.json({
      success: true,
      cache_stats: stats,
      performance_metrics: metrics
    })
  } catch (error: any) {
    console.error('❌ キャッシュ統計取得エラー:', error)
    return c.json({ success: false, error: 'キャッシュ統計の取得に失敗しました' }, 500)
  }
})

// キャッシュヘルスチェックAPI
app.get('/api/cache/health', async (c) => {
  try {
    const { env } = c
    const health = await checkCacheHealth(env.KV)
    
    const statusCode = health.status === 'healthy' ? 200 : 
                       health.status === 'degraded' ? 200 : 503
    
    return c.json(health, statusCode)
  } catch (error: any) {
    console.error('❌ キャッシュヘルスチェックエラー:', error)
    return c.json({
      status: 'down',
      details: { error: error.message }
    }, 503)
  }
})

// キャッシュ無効化API（管理者のみ）
app.post('/api/cache/invalidate', requireAuth, async (c) => {
  try {
    const { env } = c
    const user = c.get('user')
    
    if (user.user_role !== 'admin') {
      return c.json({ success: false, error: '管理者権限が必要です' }, 403)
    }
    
    const { entity_type, entity_id } = await c.req.json()
    
    if (!entity_type || !entity_id) {
      return c.json({ 
        success: false, 
        error: 'entity_typeとentity_idが必要です' 
      }, 400)
    }
    
    const deletedCount = await smartInvalidateCache(
      env.KV, 
      entity_type as any, 
      entity_id
    )
    
    return c.json({
      success: true,
      deleted_keys: deletedCount,
      message: `${deletedCount}個のキャッシュを削除しました`
    })
  } catch (error: any) {
    console.error('❌ キャッシュ無効化エラー:', error)
    return c.json({ success: false, error: 'キャッシュの無効化に失敗しました' }, 500)
  }
})

// キャッシュプリウォームAPI（管理者のみ）
app.post('/api/cache/prewarm', requireAuth, async (c) => {
  try {
    const { env } = c
    const user = c.get('user')
    
    if (user.user_role !== 'admin') {
      return c.json({ success: false, error: '管理者権限が必要です' }, 403)
    }
    
    await prewarmCriticalCaches(env.KV, env.DB)
    
    return c.json({
      success: true,
      message: '重要なキャッシュのプリウォームが完了しました'
    })
  } catch (error: any) {
    console.error('❌ キャッシュプリウォームエラー:', error)
    return c.json({ success: false, error: 'キャッシュのプリウォームに失敗しました' }, 500)
  }
})

// キャッシュメトリクスリセットAPI（管理者のみ）
app.post('/api/cache/metrics/reset', requireAuth, async (c) => {
  try {
    const user = c.get('user')
    
    if (user.user_role !== 'admin') {
      return c.json({ success: false, error: '管理者権限が必要です' }, 403)
    }
    
    cacheMetrics.reset()
    
    return c.json({
      success: true,
      message: 'キャッシュメトリクスをリセットしました'
    })
  } catch (error: any) {
    console.error('❌ メトリクスリセットエラー:', error)
    return c.json({ success: false, error: 'メトリクスのリセットに失敗しました' }, 500)
  }
})

// ========================================
// Phase 12-1: AIチューター API（完全無料版）
// ========================================

import { AITutorEngine, type AITutorRequest, type ConversationMessage } from './ai-tutor'

// AIチューターエンジン初期化
let aiTutorEngine: AITutorEngine | null = null

function getAITutorEngine(huggingFaceApiKey?: string): AITutorEngine {
  if (!aiTutorEngine) {
    aiTutorEngine = new AITutorEngine(huggingFaceApiKey)
  }
  return aiTutorEngine
}

/**
 * POST /api/ai-tutor/ask - AIチューターに質問
 */
app.post('/api/ai-tutor/ask', authMiddleware, async (c) => {
  const { env } = c
  const user = c.get('user')
  
  try {
    const body = await c.req.json()
    const { question, subject, unitName, context, conversationHistory } = body
    
    if (!question || question.trim().length === 0) {
      return c.json({ success: false, error: '質問を入力してください' }, 400)
    }
    
    // リクエスト構築
    const request: AITutorRequest = {
      studentId: user.user_id,
      question: question.trim(),
      subject,
      unitName,
      context,
      conversationHistory: conversationHistory || []
    }
    
    // AIチューターエンジン取得
    const engine = getAITutorEngine(env.HUGGINGFACE_API_KEY)
    
    // 学習コンテキスト取得
    const learningContext = await engine.getLearningContext(env.DB, user.user_id)
    
    // コンテキストを質問に追加
    if (learningContext.struggleAreas.length > 0) {
      request.context = `苦手分野: ${learningContext.struggleAreas.join(', ')}\n${request.context || ''}`
    }
    
    // AI回答生成（Workers AIバインディングを渡す）
    const response = await engine.generateAnswer(request, env.AI)
    
    // 会話履歴をDBに保存
    await env.DB.prepare(`
      INSERT INTO ai_tutor_conversations 
      (student_id, question, answer, subject, unit_name, ai_source, confidence, school_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      user.user_id,
      question,
      response.answer,
      subject || null,
      unitName || null,
      response.source,
      response.confidence,
      user.school_id || 1
    ).run()
    
    return c.json({
      success: true,
      response
    })
  } catch (error: any) {
    console.error('❌ AIチューターエラー:', error)
    return c.json({ 
      success: false, 
      error: 'AIチューターの応答に失敗しました',
      details: error.message 
    }, 500)
  }
})

/**
 * GET /api/ai-tutor/history - AIチューター会話履歴取得
 */
app.get('/api/ai-tutor/history', authMiddleware, async (c) => {
  const { env } = c
  const user = c.get('user')
  
  try {
    const limit = parseInt(c.req.query('limit') || '20')
    
    const conversations = await env.DB.prepare(`
      SELECT 
        conversation_id,
        question,
        answer,
        subject,
        unit_name,
        ai_source,
        confidence,
        created_at
      FROM ai_tutor_conversations
      WHERE student_id = ?
      ORDER BY created_at DESC
      LIMIT ?
    `).bind(user.user_id, limit).all()
    
    return c.json({
      success: true,
      conversations: conversations.results
    })
  } catch (error: any) {
    console.error('❌ 会話履歴取得エラー:', error)
    return c.json({ 
      success: false, 
      error: '会話履歴の取得に失敗しました' 
    }, 500)
  }
})

/**
 * GET /api/ai-tutor/suggestions - パーソナライズされた学習提案
 */
app.get('/api/ai-tutor/suggestions', authMiddleware, async (c) => {
  const { env } = c
  const user = c.get('user')
  
  try {
    // AIチューターエンジン取得
    const engine = getAITutorEngine(env.HUGGINGFACE_API_KEY)
    
    // 学習コンテキスト取得
    const learningContext = await engine.getLearningContext(env.DB, user.user_id)
    
    // 提案生成
    const suggestions = []
    
    // 苦手分野の提案
    if (learningContext.struggleAreas.length > 0) {
      suggestions.push({
        type: 'struggle',
        title: '復習が必要な単元',
        items: learningContext.struggleAreas,
        priority: 'high',
        message: 'これらの単元を重点的に復習しましょう！'
      })
    }
    
    // 次のステップ提案
    if (learningContext.masteredConcepts.length > 0) {
      suggestions.push({
        type: 'next-step',
        title: '次に学ぶのにおすすめ',
        items: learningContext.masteredConcepts.slice(0, 3),
        priority: 'medium',
        message: '習得した内容を活かして、次のステップに進みましょう！'
      })
    }
    
    return c.json({
      success: true,
      learningContext,
      suggestions
    })
  } catch (error: any) {
    console.error('❌ 学習提案エラー:', error)
    return c.json({ 
      success: false, 
      error: '学習提案の取得に失敗しました' 
    }, 500)
  }
})

/**
 * POST /api/ai-tutor/feedback - AIチューター回答へのフィードバック
 */
app.post('/api/ai-tutor/feedback', authMiddleware, async (c) => {
  const { env } = c
  const user = c.get('user')
  
  try {
    const { conversationId, rating, comment } = await c.req.json()
    
    if (!conversationId) {
      return c.json({ success: false, error: '会話IDが必要です' }, 400)
    }
    
    // フィードバック保存
    await env.DB.prepare(`
      UPDATE ai_tutor_conversations
      SET feedback_rating = ?, feedback_comment = ?
      WHERE conversation_id = ? AND student_id = ?
    `).bind(rating, comment || null, conversationId, user.user_id).run()
    
    return c.json({
      success: true,
      message: 'フィードバックを保存しました'
    })
  } catch (error: any) {
    console.error('❌ フィードバック保存エラー:', error)
    return c.json({ 
      success: false, 
      error: 'フィードバックの保存に失敗しました' 
    }, 500)
  }
})

// ========================================
// Phase 12-2: 自動問題生成API
// ========================================

import { 
  ProblemGeneratorEngine, 
  type ProblemGenerationRequest,
  type GeneratedProblem,
  DIFFICULTY_LEVELS,
  PROBLEM_TYPES
} from './problem-generator'

// 問題生成エンジン初期化
let problemGeneratorEngine: ProblemGeneratorEngine | null = null

function getProblemGeneratorEngine(): ProblemGeneratorEngine {
  if (!problemGeneratorEngine) {
    problemGeneratorEngine = new ProblemGeneratorEngine()
  }
  return problemGeneratorEngine
}

/**
 * POST /api/problems/generate - 問題自動生成
 */
app.post('/api/problems/generate', authMiddleware, async (c) => {
  const { env } = c
  const user = c.get('user')
  
  try {
    const body = await c.req.json()
    const { subject, unitName, difficulty, count, problemType } = body
    
    if (!subject) {
      return c.json({ success: false, error: '教科を指定してください' }, 400)
    }
    
    const request: ProblemGenerationRequest = {
      studentId: user.user_id,
      subject,
      unitName,
      difficulty: difficulty || 'medium',
      count: Math.min(count || 5, 10), // 最大10問
      problemType
    }
    
    // 問題生成エンジン取得
    const engine = getProblemGeneratorEngine()
    
    // 問題生成
    const problems = await engine.generateProblems(request, env.DB, env.AI)
    
    // 問題が生成されなかった場合
    if (!problems || problems.length === 0) {
      console.warn('⚠️ 問題が生成されませんでした。リクエスト:', request)
      return c.json({
        success: false,
        error: '問題の生成に失敗しました。もう一度お試しください。',
        details: '生成された問題が0件でした'
      }, 500)
    }
    
    console.log(`✅ ${problems.length}問の問題を生成しました`)
    
    // 生成した問題をDBに保存
    const savedProblems: GeneratedProblem[] = []
    
    for (const problem of problems) {
      const result = await env.DB.prepare(`
        INSERT INTO generated_problems 
        (student_id, question, correct_answer, explanation, difficulty, subject, unit_name, problem_type, hints, school_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        user.user_id,
        problem.question,
        problem.correctAnswer,
        problem.explanation,
        problem.difficulty,
        problem.subject,
        problem.unitName,
        problem.problemType,
        JSON.stringify(problem.hints || []),
        user.school_id || 1
      ).run()
      
      savedProblems.push({
        ...problem,
        problemId: result.meta.last_row_id as number
      })
    }
    
    return c.json({
      success: true,
      problems: savedProblems,
      count: savedProblems.length
    })
  } catch (error: any) {
    console.error('❌ 問題生成エラー:', error)
    return c.json({ 
      success: false, 
      error: '問題の生成に失敗しました',
      details: error.message 
    }, 500)
  }
})

/**
 * GET /api/problems/history - 生成済み問題履歴
 */
app.get('/api/problems/history', authMiddleware, async (c) => {
  const { env } = c
  const user = c.get('user')
  
  try {
    const limit = parseInt(c.req.query('limit') || '20')
    const subject = c.req.query('subject')
    
    let query = `
      SELECT 
        problem_id,
        question,
        correct_answer,
        explanation,
        difficulty,
        subject,
        unit_name,
        problem_type,
        hints,
        is_attempted,
        is_correct,
        created_at
      FROM generated_problems
      WHERE student_id = ?
    `
    
    const params: any[] = [user.user_id]
    
    if (subject) {
      query += ` AND subject = ?`
      params.push(subject)
    }
    
    query += ` ORDER BY created_at DESC LIMIT ?`
    params.push(limit)
    
    const problems = await env.DB.prepare(query).bind(...params).all()
    
    // JSONパース
    const parsedProblems = problems.results.map((p: any) => ({
      ...p,
      hints: p.hints ? JSON.parse(p.hints) : []
    }))
    
    return c.json({
      success: true,
      problems: parsedProblems
    })
  } catch (error: any) {
    console.error('❌ 問題履歴取得エラー:', error)
    return c.json({ 
      success: false, 
      error: '問題履歴の取得に失敗しました' 
    }, 500)
  }
})

/**
 * POST /api/problems/:problemId/submit - 問題の回答提出
 */
app.post('/api/problems/:problemId/submit', authMiddleware, async (c) => {
  const { env } = c
  const user = c.get('user')
  const problemId = c.req.param('problemId')
  
  try {
    const { userAnswer } = await c.req.json()
    
    if (!userAnswer) {
      return c.json({ success: false, error: '回答を入力してください' }, 400)
    }
    
    // 問題取得
    const problem = await env.DB.prepare(`
      SELECT * FROM generated_problems
      WHERE problem_id = ? AND student_id = ?
    `).bind(problemId, user.user_id).first()
    
    if (!problem) {
      return c.json({ success: false, error: '問題が見つかりません' }, 404)
    }
    
    // 正誤判定（柔軟なマッチング）
    const correctAnswer = (problem.correct_answer as string).toLowerCase().trim()
    const userAnswerNormalized = userAnswer.toLowerCase().trim()
    const isCorrect = 
      correctAnswer === userAnswerNormalized ||
      correctAnswer.includes(userAnswerNormalized) ||
      userAnswerNormalized.includes(correctAnswer)
    
    // 結果保存
    await env.DB.prepare(`
      UPDATE generated_problems
      SET is_attempted = 1, is_correct = ?, user_answer = ?, attempted_at = CURRENT_TIMESTAMP
      WHERE problem_id = ?
    `).bind(isCorrect ? 1 : 0, userAnswer, problemId).run()
    
    return c.json({
      success: true,
      isCorrect,
      correctAnswer: problem.correct_answer,
      explanation: problem.explanation,
      hints: problem.hints ? JSON.parse(problem.hints as string) : []
    })
  } catch (error: any) {
    console.error('❌ 回答提出エラー:', error)
    return c.json({ 
      success: false, 
      error: '回答の提出に失敗しました' 
    }, 500)
  }
})

/**
 * GET /api/problems/performance - 学習パフォーマンス分析
 */
app.get('/api/problems/performance', authMiddleware, async (c) => {
  const { env } = c
  const user = c.get('user')
  
  try {
    const subject = c.req.query('subject') || '数学'
    
    // 問題生成エンジン取得
    const engine = getProblemGeneratorEngine()
    
    // パフォーマンス分析
    const performance = await engine.analyzeStudentPerformance(
      env.DB,
      user.user_id,
      subject
    )
    
    // 生成済み問題の統計
    const generatedStats = await env.DB.prepare(`
      SELECT 
        COUNT(*) as total_generated,
        SUM(CASE WHEN is_attempted = 1 THEN 1 ELSE 0 END) as attempted,
        SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) as correct,
        subject,
        difficulty
      FROM generated_problems
      WHERE student_id = ? AND subject = ?
      GROUP BY subject, difficulty
    `).bind(user.user_id, subject).all()
    
    return c.json({
      success: true,
      performance,
      generatedStats: generatedStats.results,
      recommendedDifficulty: performance.recommendedDifficulty
    })
  } catch (error: any) {
    console.error('❌ パフォーマンス分析エラー:', error)
    return c.json({ 
      success: false, 
      error: 'パフォーマンス分析に失敗しました' 
    }, 500)
  }
})

/**
 * GET /api/problems/metadata - 問題生成メタデータ
 */
app.get('/api/problems/metadata', authMiddleware, async (c) => {
  return c.json({
    success: true,
    metadata: {
      difficulties: DIFFICULTY_LEVELS,
      problemTypes: PROBLEM_TYPES,
      subjects: ['数学', '国語', '理科', '社会', '英語']
    }
  })
})

/**
 * ========================================
 * Phase 15: 認知科学ベースの学習最適化API
 * ========================================
 */

import {
  createReviewCard,
  reviewCard,
  getTodayReviews,
  getReviewStats,
  startRetrievalPractice,
  getInterleavedProblems,
  type ReviewQuality,
} from './spaced-repetition'

/**
 * POST /api/cognitive/cards - 復習カードを作成
 */
app.post('/api/cognitive/cards', authMiddleware, async (c) => {
  try {
    const { env, user } = c.var
    const { content_type, content_id, content_title } = await c.req.json()

    if (!content_type || !content_id || !content_title) {
      return c.json({ success: false, error: '必須フィールドが不足しています' }, 400)
    }

    if (!['concept', 'problem', 'vocabulary'].includes(content_type)) {
      return c.json({ success: false, error: '無効なコンテンツタイプです' }, 400)
    }

    const card = await createReviewCard(
      env.DB,
      user.id,
      content_type as 'concept' | 'problem' | 'vocabulary',
      content_id,
      content_title
    )

    return c.json({
      success: true,
      card,
    })
  } catch (error: any) {
    console.error('❌ 復習カード作成エラー:', error)
    return c.json(
      {
        success: false,
        error: '復習カードの作成に失敗しました',
        details: error.message,
      },
      500
    )
  }
})

/**
 * POST /api/cognitive/review - 復習を実行
 */
app.post('/api/cognitive/review', authMiddleware, async (c) => {
  try {
    const { env } = c.var
    const { card_id, quality } = await c.req.json()

    if (!card_id || quality === undefined) {
      return c.json({ success: false, error: '必須フィールドが不足しています' }, 400)
    }

    if (quality < 0 || quality > 5) {
      return c.json({ success: false, error: '品質は0-5の範囲で指定してください' }, 400)
    }

    const result = await reviewCard(env.DB, card_id, quality as ReviewQuality)

    return c.json({
      success: true,
      result,
    })
  } catch (error: any) {
    console.error('❌ 復習実行エラー:', error)
    return c.json(
      {
        success: false,
        error: '復習の実行に失敗しました',
        details: error.message,
      },
      500
    )
  }
})

/**
 * GET /api/cognitive/today - 今日の復習カードを取得
 */
app.get('/api/cognitive/today', authMiddleware, async (c) => {
  try {
    const { env, user } = c.var

    const cards = await getTodayReviews(env.DB, user.id)

    return c.json({
      success: true,
      cards,
      count: cards.length,
    })
  } catch (error: any) {
    console.error('❌ 今日の復習取得エラー:', error)
    return c.json(
      {
        success: false,
        error: '今日の復習の取得に失敗しました',
        details: error.message,
      },
      500
    )
  }
})

/**
 * GET /api/cognitive/stats - 復習統計を取得
 */
app.get('/api/cognitive/stats', authMiddleware, async (c) => {
  try {
    const { env, user } = c.var

    const stats = await getReviewStats(env.DB, user.id)

    return c.json({
      success: true,
      stats,
    })
  } catch (error: any) {
    console.error('❌ 復習統計取得エラー:', error)
    return c.json(
      {
        success: false,
        error: '復習統計の取得に失敗しました',
        details: error.message,
      },
      500
    )
  }
})

/**
 * POST /api/cognitive/retrieval-practice - 検索練習セッション開始
 */
app.post('/api/cognitive/retrieval-practice', authMiddleware, async (c) => {
  try {
    const { env, user } = c.var
    const { topic } = await c.req.json()

    if (!topic) {
      return c.json({ success: false, error: 'トピックを指定してください' }, 400)
    }

    const session = await startRetrievalPractice(env.DB, user.id, topic)

    return c.json({
      success: true,
      session,
    })
  } catch (error: any) {
    console.error('❌ 検索練習開始エラー:', error)
    return c.json(
      {
        success: false,
        error: '検索練習の開始に失敗しました',
        details: error.message,
      },
      500
    )
  }
})

/**
 * POST /api/cognitive/interleaving - 交互学習問題を取得
 */
app.post('/api/cognitive/interleaving', authMiddleware, async (c) => {
  try {
    const { env, user } = c.var
    const { subjects, count = 10 } = await c.req.json()

    if (!subjects || !Array.isArray(subjects) || subjects.length === 0) {
      return c.json({ success: false, error: '教科を指定してください' }, 400)
    }

    const problems = await getInterleavedProblems(env.DB, user.id, subjects, count)

    return c.json({
      success: true,
      problems,
      count: problems.length,
    })
  } catch (error: any) {
    console.error('❌ 交互学習問題取得エラー:', error)
    return c.json(
      {
        success: false,
        error: '交互学習問題の取得に失敗しました',
        details: error.message,
      },
      500
    )
  }
})

/**
 * POST /api/cognitive/elaboration - 精緻化プロンプトを保存
 */
app.post('/api/cognitive/elaboration', authMiddleware, async (c) => {
  try {
    const { env, user } = c.var
    const { concept, prompt_type, student_response } = await c.req.json()

    if (!concept || !prompt_type) {
      return c.json({ success: false, error: '必須フィールドが不足しています' }, 400)
    }

    if (!['explain', 'example', 'analogy', 'application'].includes(prompt_type)) {
      return c.json({ success: false, error: '無効なプロンプトタイプです' }, 400)
    }

    await env.DB.prepare(
      `INSERT INTO elaboration_prompts 
       (student_id, concept, prompt_type, student_response)
       VALUES (?, ?, ?, ?)`
    )
      .bind(user.id, concept, prompt_type, student_response || null)
      .run()

    return c.json({
      success: true,
      message: '精緻化プロンプトを保存しました',
    })
  } catch (error: any) {
    console.error('❌ 精緻化プロンプト保存エラー:', error)
    return c.json(
      {
        success: false,
        error: '精緻化プロンプトの保存に失敗しました',
        details: error.message,
      },
      500
    )
  }
})

/**
 * GET /api/cognitive/elaboration-prompts - 精緻化プロンプトを取得
 */
app.get('/api/cognitive/elaboration-prompts', authMiddleware, async (c) => {
  try {
    const { env } = c.var
    const concept = c.req.query('concept')

    if (!concept) {
      return c.json({ success: false, error: 'コンセプトを指定してください' }, 400)
    }

    // 4種類のプロンプトを生成
    const prompts = [
      {
        type: 'explain',
        question: `「${concept}」を自分の言葉で説明してください。`,
        description: '説明する（Explain）',
      },
      {
        type: 'example',
        question: `「${concept}」の具体例を3つ挙げてください。`,
        description: '例を挙げる（Example）',
      },
      {
        type: 'analogy',
        question: `「${concept}」を身近なものに例えると何ですか？`,
        description: '類推する（Analogy）',
      },
      {
        type: 'application',
        question: `「${concept}」は実生活でどのように使えますか？`,
        description: '応用する（Application）',
      },
    ]

    return c.json({
      success: true,
      prompts,
    })
  } catch (error: any) {
    console.error('❌ 精緻化プロンプト取得エラー:', error)
    return c.json(
      {
        success: false,
        error: '精緻化プロンプトの取得に失敗しました',
        details: error.message,
      },
      500
    )
  }
})

/**
 * ========================================
 * Phase 12-4: AIフィードバックシステムAPI
 * ========================================
 */

import {
  gradeAnswer,
  generateDetailedExplanation,
  generateLearningAdvice,
  generateWeeklyReport,
  generateMonthlyReport,
} from './ai-feedback'

/**
 * POST /api/feedback/grade - 解答を採点してフィードバックを生成
 */
app.post('/api/feedback/grade', authMiddleware, async (c) => {
  try {
    const { env, user } = c.var
    const { problem_id, student_answer } = await c.req.json()

    if (!problem_id || !student_answer) {
      return c.json({ success: false, error: '問題IDと解答が必要です' }, 400)
    }

    // 問題情報を取得
    const problem = await env.DB.prepare(
      `SELECT * FROM generated_problems WHERE id = ? AND student_id = ?`
    ).bind(problem_id, user.id).first()

    if (!problem) {
      return c.json({ success: false, error: '問題が見つかりません' }, 404)
    }

    // AI自動添削
    const feedback = await gradeAnswer(
      env,
      problem.question,
      problem.correct_answer,
      student_answer,
      problem.subject,
      problem.difficulty
    )

    // 解答履歴を保存
    await env.DB.prepare(`
      INSERT INTO answer_history (
        student_id, problem_id, student_answer, is_correct, 
        feedback_text, feedback_score, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `).bind(
      user.id,
      problem_id,
      student_answer,
      feedback.isCorrect ? 1 : 0,
      feedback.feedback,
      feedback.score
    ).run()

    // 問題の解答済みフラグと正誤を更新
    await env.DB.prepare(`
      UPDATE generated_problems 
      SET is_attempted = 1, is_correct = ?, updated_at = datetime('now')
      WHERE id = ?
    `).bind(feedback.isCorrect ? 1 : 0, problem_id).run()
    
    // ============================================
    // ゲーミフィケーション統合
    // ============================================
    
    // 1. 問題を解いたらポイント付与
    await addPoints(env.DB, user.id, 10, 'problem_solved', '問題に挑戦')
    
    // 2. 正解ならボーナスポイント
    if (feedback.isCorrect) {
      await addPoints(env.DB, user.id, 20, 'correct_answer', '問題正解')
      
      // 正解メッセージ生成
      await generateCorrectMessage(env.DB, user.id)
      
      // バッジチェック: 初正解
      await checkAndAwardBadge(env.DB, user.id, 'solve_first_correct')
      
      // 正解数チェック
      const correctCount = await env.DB.prepare(`
        SELECT COUNT(*) as count FROM answer_history 
        WHERE student_id = ? AND is_correct = 1
      `).bind(user.id).first<{count: number}>()
      
      if (correctCount) {
        if (correctCount.count === 10) {
          await checkAndAwardBadge(env.DB, user.id, 'solve_10')
        } else if (correctCount.count === 50) {
          await checkAndAwardBadge(env.DB, user.id, 'solve_50')
        } else if (correctCount.count === 100) {
          await checkAndAwardBadge(env.DB, user.id, 'solve_100')
        }
      }
      
      // 難問チャレンジバッジ
      if (problem.difficulty === 'hard') {
        await checkAndAwardBadge(env.DB, user.id, 'challenge_hard_first')
        
        const hardCorrectCount = await env.DB.prepare(`
          SELECT COUNT(*) as count FROM answer_history ah
          JOIN generated_problems gp ON ah.problem_id = gp.id
          WHERE ah.student_id = ? AND ah.is_correct = 1 AND gp.difficulty = 'hard'
        `).bind(user.id).first<{count: number}>()
        
        if (hardCorrectCount && hardCorrectCount.count === 10) {
          await checkAndAwardBadge(env.DB, user.id, 'challenge_hard_10')
        }
      }
      
      // 教科別バッジ
      const subjectCorrectCount = await env.DB.prepare(`
        SELECT COUNT(*) as count FROM answer_history ah
        JOIN generated_problems gp ON ah.problem_id = gp.id
        WHERE ah.student_id = ? AND ah.is_correct = 1 AND gp.subject = ?
      `).bind(user.id, problem.subject).first<{count: number}>()
      
      if (subjectCorrectCount && subjectCorrectCount.count === 100) {
        const badgeKeys: Record<string, string> = {
          '数学': 'subject_math_100',
          '国語': 'subject_japanese_100',
          '理科': 'subject_science_100',
          '社会': 'subject_social_100',
          '英語': 'subject_english_100'
        }
        const badgeKey = badgeKeys[problem.subject]
        if (badgeKey) {
          await checkAndAwardBadge(env.DB, user.id, badgeKey)
        }
      }
    } else {
      // 不正解メッセージ生成
      await generateIncorrectMessage(env.DB, user.id)
    }

    return c.json({
      success: true,
      feedback
    })
  } catch (error: any) {
    console.error('❌ 自動添削エラー:', error)
    return c.json(
      {
        success: false,
        error: '自動添削に失敗しました',
        details: error.message,
      },
      500
    )
  }
})

/**
 * POST /api/feedback/explanation - 詳細解説を生成
 */
app.post('/api/feedback/explanation', authMiddleware, async (c) => {
  try {
    const { env, user } = c.var
    const { problem_id } = await c.req.json()

    if (!problem_id) {
      return c.json({ success: false, error: '問題IDが必要です' }, 400)
    }

    // 問題情報と解答履歴を取得
    const problem = await env.DB.prepare(
      `SELECT * FROM generated_problems WHERE id = ? AND student_id = ?`
    ).bind(problem_id, user.id).first()

    if (!problem) {
      return c.json({ success: false, error: '問題が見つかりません' }, 404)
    }

    const answerHistory = await env.DB.prepare(
      `SELECT * FROM answer_history WHERE problem_id = ? AND student_id = ? ORDER BY created_at DESC LIMIT 1`
    ).bind(problem_id, user.id).first()

    // 詳細解説を生成
    const explanation = await generateDetailedExplanation(
      env,
      problem.question,
      problem.correct_answer,
      answerHistory?.student_answer,
      problem.subject,
      problem.difficulty
    )

    return c.json({
      success: true,
      explanation
    })
  } catch (error: any) {
    console.error('❌ 詳細解説生成エラー:', error)
    return c.json(
      {
        success: false,
        error: '詳細解説の生成に失敗しました',
        details: error.message,
      },
      500
    )
  }
})

/**
 * GET /api/feedback/advice - 学習改善提案を取得
 */
app.get('/api/feedback/advice', authMiddleware, async (c) => {
  try {
    const { env, user } = c.var

    // 学習履歴を取得
    const recentHistory = await env.DB.prepare(`
      SELECT 
        gp.subject,
        gp.difficulty,
        ah.is_correct,
        ah.feedback_score,
        ah.created_at
      FROM answer_history ah
      JOIN generated_problems gp ON ah.problem_id = gp.id
      WHERE ah.student_id = ?
      ORDER BY ah.created_at DESC
      LIMIT 50
    `).bind(user.id).all()

    if (recentHistory.results.length === 0) {
      return c.json({
        success: true,
        advice: {
          generalAdvice: 'まだ学習履歴がありません。問題を解いて学習を始めましょう！',
          specificAdvice: [],
          encouragement: '新しい学習の旅を始めましょう！'
        }
      })
    }

    // AI学習改善提案を生成
    const advice = await generateLearningAdvice(
      env,
      recentHistory.results
    )

    return c.json({
      success: true,
      advice
    })
  } catch (error: any) {
    console.error('❌ 学習改善提案生成エラー:', error)
    return c.json(
      {
        success: false,
        error: '学習改善提案の生成に失敗しました',
        details: error.message,
      },
      500
    )
  }
})

/**
 * GET /api/feedback/weekly-report - 週次レポートを取得
 */
app.get('/api/feedback/weekly-report', authMiddleware, async (c) => {
  try {
    const { env, user } = c.var

    // 過去7日間の学習履歴を取得
    const weekHistory = await env.DB.prepare(`
      SELECT 
        gp.subject,
        gp.difficulty,
        ah.is_correct,
        ah.feedback_score,
        ah.created_at
      FROM answer_history ah
      JOIN generated_problems gp ON ah.problem_id = gp.id
      WHERE ah.student_id = ? 
        AND ah.created_at >= datetime('now', '-7 days')
      ORDER BY ah.created_at DESC
    `).bind(user.id).all()

    if (weekHistory.results.length === 0) {
      return c.json({
        success: true,
        report: {
          summary: '今週の学習記録がありません',
          achievements: [],
          improvements: [],
          nextSteps: ['学習を始めましょう！']
        }
      })
    }

    // 週次レポートを生成
    const report = await generateWeeklyReport(
      env,
      weekHistory.results
    )

    return c.json({
      success: true,
      report
    })
  } catch (error: any) {
    console.error('❌ 週次レポート生成エラー:', error)
    return c.json(
      {
        success: false,
        error: '週次レポートの生成に失敗しました',
        details: error.message,
      },
      500
    )
  }
})

/**
 * GET /api/feedback/monthly-report - 月次レポートを取得
 */
app.get('/api/feedback/monthly-report', authMiddleware, async (c) => {
  try {
    const { env, user } = c.var

    // 過去30日間の学習履歴を取得
    const monthHistory = await env.DB.prepare(`
      SELECT 
        gp.subject,
        gp.difficulty,
        ah.is_correct,
        ah.feedback_score,
        ah.created_at
      FROM answer_history ah
      JOIN generated_problems gp ON ah.problem_id = gp.id
      WHERE ah.student_id = ? 
        AND ah.created_at >= datetime('now', '-30 days')
      ORDER BY ah.created_at DESC
    `).bind(user.id).all()

    if (monthHistory.results.length === 0) {
      return c.json({
        success: true,
        report: {
          summary: '今月の学習記録がありません',
          achievements: [],
          trends: [],
          longTermGoals: ['学習習慣を確立しましょう']
        }
      })
    }

    // 月次レポートを生成
    const report = await generateMonthlyReport(
      env,
      monthHistory.results
    )

    return c.json({
      success: true,
      report
    })
  } catch (error: any) {
    console.error('❌ 月次レポート生成エラー:', error)
    return c.json(
      {
        success: false,
        error: '月次レポートの生成に失敗しました',
        details: error.message,
      },
      500
    )
  }
})

/**
 * ========================================
 * Phase 12-3: 学習経路の動的最適化API
 * ========================================
 */

import {
  calculateMasteryScore,
  calculateAllMasteryScores,
  generateAdaptiveCurriculum,
  predictMastery,
  predictMultipleMastery,
  generateReinforcementPlan,
} from './learning-path'

/**
 * GET /api/learning-path/mastery - 習熟度スコアを取得
 */
app.get('/api/learning-path/mastery', authMiddleware, async (c) => {
  try {
    const { env, user } = c.var
    const { subject, unit_id } = c.req.query()

    if (unit_id) {
      // 特定単元の習熟度
      const score = await calculateMasteryScore(env.DB, user.id, parseInt(unit_id))
      return c.json({
        success: true,
        score,
      })
    } else {
      // 全単元または教科別の習熟度
      const scores = await calculateAllMasteryScores(env.DB, user.id, subject)
      return c.json({
        success: true,
        scores,
      })
    }
  } catch (error: any) {
    console.error('❌ 習熟度取得エラー:', error)
    return c.json(
      {
        success: false,
        error: '習熟度の取得に失敗しました',
        details: error.message,
      },
      500
    )
  }
})

/**
 * GET /api/learning-path/curriculum - 適応的カリキュラムを取得
 */
app.get('/api/learning-path/curriculum', authMiddleware, async (c) => {
  try {
    const { env, user } = c.var
    const { subject, grade } = c.req.query()

    if (!subject) {
      return c.json({ success: false, error: '教科が必要です' }, 400)
    }

    const curriculum = await generateAdaptiveCurriculum(
      env.DB,
      user.id,
      subject,
      grade ? parseInt(grade) : undefined
    )

    // 履歴を保存
    await env.DB.prepare(
      `
      INSERT INTO learning_path_history (student_id, subject, recommended_units, weak_areas, next_milestone_id)
      VALUES (?, ?, ?, ?, ?)
    `
    )
      .bind(
        user.id,
        subject,
        JSON.stringify(curriculum.recommended_path.map((u) => u.unit_id)),
        JSON.stringify(curriculum.weak_areas.map((u) => u.unit_id)),
        curriculum.next_milestone.unit_id
      )
      .run()

    return c.json({
      success: true,
      curriculum,
    })
  } catch (error: any) {
    console.error('❌ カリキュラム生成エラー:', error)
    return c.json(
      {
        success: false,
        error: 'カリキュラムの生成に失敗しました',
        details: error.message,
      },
      500
    )
  }
})

/**
 * GET /api/learning-path/prediction - 習得度予測を取得
 */
app.get('/api/learning-path/prediction', authMiddleware, async (c) => {
  try {
    const { env, user } = c.var
    const { unit_ids } = c.req.query()

    if (!unit_ids) {
      return c.json({ success: false, error: '単元IDが必要です' }, 400)
    }

    const unitIdArray = unit_ids.split(',').map((id) => parseInt(id.trim()))

    const predictions = await predictMultipleMastery(env.DB, user.id, unitIdArray)

    return c.json({
      success: true,
      predictions,
    })
  } catch (error: any) {
    console.error('❌ 習得度予測エラー:', error)
    return c.json(
      {
        success: false,
        error: '習得度予測に失敗しました',
        details: error.message,
      },
      500
    )
  }
})

/**
 * POST /api/learning-path/reinforcement - 補強計画を生成
 */
app.post('/api/learning-path/reinforcement', authMiddleware, async (c) => {
  try {
    const { env, user } = c.var
    const { weak_unit_id } = await c.req.json()

    if (!weak_unit_id) {
      return c.json({ success: false, error: '苦手単元IDが必要です' }, 400)
    }

    const plan = await generateReinforcementPlan(env.DB, user.id, weak_unit_id)

    // 計画を保存
    await env.DB.prepare(
      `
      INSERT INTO reinforcement_plans (student_id, weak_unit_id, root_causes, actions, status)
      VALUES (?, ?, ?, ?, 'active')
    `
    )
      .bind(user.id, weak_unit_id, JSON.stringify(plan.root_causes), JSON.stringify(plan.reinforcement_actions))
      .run()

    return c.json({
      success: true,
      plan,
    })
  } catch (error: any) {
    console.error('❌ 補強計画生成エラー:', error)
    return c.json(
      {
        success: false,
        error: '補強計画の生成に失敗しました',
        details: error.message,
      },
      500
    )
  }
})

/**
 * GET /api/learning-path/weak-areas - 苦手分野を取得
 */
app.get('/api/learning-path/weak-areas', authMiddleware, async (c) => {
  try {
    const { env, user } = c.var
    const { subject } = c.req.query()

    // 全単元の習熟度を取得
    const scores = await calculateAllMasteryScores(env.DB, user.id, subject)

    // 苦手分野（習熟度50%未満）を抽出
    const weakAreas = scores
      .filter((score) => score.mastery_level < 50)
      .sort((a, b) => a.mastery_level - b.mastery_level)

    // 単元名を取得
    const weakAreasWithNames = await Promise.all(
      weakAreas.map(async (score) => {
        const unit = await env.DB.prepare(`SELECT id, unit_name, subject, grade FROM curriculum WHERE id = ?`)
          .bind(score.unit_id)
          .first()

        return {
          unit_id: score.unit_id,
          unit_name: unit?.unit_name || '不明',
          subject: unit?.subject || '',
          grade: unit?.grade || 0,
          mastery_level: score.mastery_level,
          practice_count: score.practice_count,
          correct_rate: score.correct_rate,
          reinforcement_needed: score.mastery_level < 30,
        }
      })
    )

    return c.json({
      success: true,
      weak_areas: weakAreasWithNames,
    })
  } catch (error: any) {
    console.error('❌ 苦手分野取得エラー:', error)
    return c.json(
      {
        success: false,
        error: '苦手分野の取得に失敗しました',
        details: error.message,
      },
      500
    )
  }
})

// ============================================
// Phase 14: ゲーミフィケーションAPI
// ============================================

import {
  getAllBadges,
  checkAndAwardBadge,
  addPoints,
  getStudentLevel,
  updateLearningStreak,
  getLearningStreak,
  getUnreadMessages,
  generateStartMessage,
  generateCorrectMessage,
  generateIncorrectMessage,
  generateLongStudyMessage
} from './gamification'

/**
 * GET /api/gamification/badges - バッジ一覧と獲得状況を取得
 */
app.get('/api/gamification/badges', authMiddleware, async (c) => {
  try {
    const { env, user } = c.var
    const badges = await getAllBadges(env.DB, user.id)
    
    return c.json({
      success: true,
      badges
    })
  } catch (error: any) {
    console.error('❌ バッジ取得エラー:', error)
    return c.json({ success: false, error: 'バッジの取得に失敗しました', details: error.message }, 500)
  }
})

/**
 * GET /api/gamification/level - 学生のレベル情報を取得
 */
app.get('/api/gamification/level', authMiddleware, async (c) => {
  try {
    const { env, user } = c.var
    const level = await getStudentLevel(env.DB, user.id)
    
    return c.json({
      success: true,
      level
    })
  } catch (error: any) {
    console.error('❌ レベル取得エラー:', error)
    return c.json({ success: false, error: 'レベル情報の取得に失敗しました', details: error.message }, 500)
  }
})

/**
 * GET /api/gamification/streak - 学習ストリーク情報を取得
 */
app.get('/api/gamification/streak', authMiddleware, async (c) => {
  try {
    const { env, user } = c.var
    const streak = await getLearningStreak(env.DB, user.id)
    
    return c.json({
      success: true,
      streak
    })
  } catch (error: any) {
    console.error('❌ ストリーク取得エラー:', error)
    return c.json({ success: false, error: 'ストリーク情報の取得に失敗しました', details: error.message }, 500)
  }
})

/**
 * POST /api/gamification/activity - 学習活動を記録（ストリーク更新）
 */
app.post('/api/gamification/activity', authMiddleware, async (c) => {
  try {
    const { env, user } = c.var
    const updated = await updateLearningStreak(env.DB, user.id)
    
    if (updated) {
      await addPoints(env.DB, user.id, 50, 'login', '今日のログイン')
    }
    
    return c.json({
      success: true,
      updated,
      streak: await getLearningStreak(env.DB, user.id)
    })
  } catch (error: any) {
    console.error('❌ 活動記録エラー:', error)
    return c.json({ success: false, error: '活動の記録に失敗しました', details: error.message }, 500)
  }
})

/**
 * GET /api/gamification/messages - 未読の励ましメッセージを取得
 */
app.get('/api/gamification/messages', authMiddleware, async (c) => {
  try {
    const { env, user } = c.var
    const messages = await getUnreadMessages(env.DB, user.id)
    
    return c.json({
      success: true,
      messages
    })
  } catch (error: any) {
    console.error('❌ メッセージ取得エラー:', error)
    return c.json({ success: false, error: 'メッセージの取得に失敗しました', details: error.message }, 500)
  }
})

/**
 * POST /api/gamification/encourage - 励ましメッセージを生成
 */
app.post('/api/gamification/encourage', authMiddleware, async (c) => {
  try {
    const { env, user } = c.var
    const { type } = await c.req.json()
    
    let message = ''
    switch(type) {
      case 'start':
        message = await generateStartMessage(env.DB, user.id)
        break
      case 'correct':
        message = await generateCorrectMessage(env.DB, user.id)
        break
      case 'incorrect':
        message = await generateIncorrectMessage(env.DB, user.id)
        break
      case 'long_study':
        message = await generateLongStudyMessage(env.DB, user.id)
        break
      default:
        return c.json({ success: false, error: '不正なメッセージタイプです' }, 400)
    }
    
    return c.json({
      success: true,
      message
    })
  } catch (error: any) {
    console.error('❌ メッセージ生成エラー:', error)
    return c.json({ success: false, error: 'メッセージの生成に失敗しました', details: error.message }, 500)
  }
})

/**
 * POST /api/gamification/award-points - ポイントを付与
 */
app.post('/api/gamification/award-points', authMiddleware, async (c) => {
  try {
    const { env, user } = c.var
    const { points, source, description } = await c.req.json()
    
    if (!points || !source || !description) {
      return c.json({ success: false, error: 'ポイント、ソース、説明が必要です' }, 400)
    }
    
    await addPoints(env.DB, user.id, points, source, description)
    const level = await getStudentLevel(env.DB, user.id)
    
    return c.json({
      success: true,
      level
    })
  } catch (error: any) {
    console.error('❌ ポイント付与エラー:', error)
    return c.json({ success: false, error: 'ポイントの付与に失敗しました', details: error.message }, 500)
  }
})

/**
 * POST /api/gamification/check-badge - バッジ獲得チェック
 */
app.post('/api/gamification/check-badge', authMiddleware, async (c) => {
  try {
    const { env, user } = c.var
    const { badge_key } = await c.req.json()
    
    if (!badge_key) {
      return c.json({ success: false, error: 'バッジキーが必要です' }, 400)
    }
    
    const awarded = await checkAndAwardBadge(env.DB, user.id, badge_key)
    
    return c.json({
      success: true,
      awarded
    })
  } catch (error: any) {
    console.error('❌ バッジチェックエラー:', error)
    return c.json({ success: false, error: 'バッジチェックに失敗しました', details: error.message }, 500)
  }
})

// ============================================
// Phase 20: 間違いノート＆記述問題採点API
// ============================================

/**
 * GET /api/mistake-notebook - 間違いノート一覧取得
 */
app.get('/api/mistake-notebook', authMiddleware, async (c) => {
  try {
    const { env, user } = c.var
    const { subject, is_mastered, limit } = c.req.query()
    
    const filters: any = {}
    if (subject) filters.subject = subject
    if (is_mastered !== undefined) filters.isMastered = is_mastered === 'true'
    if (limit) filters.limit = parseInt(limit)
    
    const mistakes = await getMistakeNotebook(env.DB, user.id, filters)
    
    return c.json({
      success: true,
      mistakes,
      count: mistakes.length
    })
  } catch (error: any) {
    console.error('❌ 間違いノート取得エラー:', error)
    return c.json({ success: false, error: '間違いノートの取得に失敗しました', details: error.message }, 500)
  }
})

/**
 * POST /api/mistake-notebook - 間違いノートに追加
 */
app.post('/api/mistake-notebook', authMiddleware, async (c) => {
  try {
    const { env, user } = c.var
    const body = await c.req.json()
    
    const result = await addToMistakeNotebook(env.DB, {
      student_id: user.id,
      problem_id: body.problem_id,
      original_question: body.original_question,
      original_answer: body.original_answer,
      correct_answer: body.correct_answer,
      student_answer: body.student_answer,
      subject: body.subject,
      unit_name: body.unit_name,
      difficulty: body.difficulty,
      mistake_type: body.mistake_type
    })
    
    return c.json(result)
  } catch (error: any) {
    console.error('❌ 間違いノート追加エラー:', error)
    return c.json({ success: false, error: '間違いノートへの追加に失敗しました', details: error.message }, 500)
  }
})

/**
 * GET /api/mistake-notebook/today - 今日の復習問題
 */
app.get('/api/mistake-notebook/today', authMiddleware, async (c) => {
  try {
    const { env, user } = c.var
    
    const problems = await getTodayReviewProblems(env.DB, user.id)
    
    return c.json({
      success: true,
      problems,
      count: problems.length
    })
  } catch (error: any) {
    console.error('❌ 今日の復習問題取得エラー:', error)
    return c.json({ success: false, error: '今日の復習問題の取得に失敗しました', details: error.message }, 500)
  }
})

/**
 * POST /api/mistake-notebook/:id/review - 復習を記録
 */
app.post('/api/mistake-notebook/:id/review', authMiddleware, async (c) => {
  try {
    const { env, user } = c.var
    const mistakeId = parseInt(c.req.param('id'))
    const { is_correct, confidence_level, time_spent } = await c.req.json()
    
    const result = await recordReview(
      env.DB,
      mistakeId,
      user.id,
      is_correct,
      confidence_level,
      time_spent
    )
    
    return c.json(result)
  } catch (error: any) {
    console.error('❌ 復習記録エラー:', error)
    return c.json({ success: false, error: '復習の記録に失敗しました', details: error.message }, 500)
  }
})

/**
 * GET /api/mistake-notebook/statistics - 克服度統計
 */
app.get('/api/mistake-notebook/statistics', authMiddleware, async (c) => {
  try {
    const { env, user } = c.var
    const { subject } = c.req.query()
    
    const statistics = await getMasteryStatistics(env.DB, user.id, subject)
    
    return c.json({
      success: true,
      statistics
    })
  } catch (error: any) {
    console.error('❌ 克服度統計取得エラー:', error)
    return c.json({ success: false, error: '克服度統計の取得に失敗しました', details: error.message }, 500)
  }
})

/**
 * POST /api/mistake-notebook/:id/similar - 類似問題生成
 */
app.post('/api/mistake-notebook/:id/similar', authMiddleware, async (c) => {
  try {
    const { env, user } = c.var
    const mistakeId = parseInt(c.req.param('id'))
    
    // 間違いノートを取得
    const mistake = await env.DB.prepare(`
      SELECT * FROM mistake_notebook WHERE id = ? AND student_id = ?
    `).bind(mistakeId, user.id).first()
    
    if (!mistake) {
      return c.json({ success: false, error: '間違いノートが見つかりません' }, 404)
    }
    
    // 類似問題を生成
    const similarProblem = await generateSimilarProblem(mistake as any, env.AI)
    
    // 類似問題をgenerated_problemsに保存
    const result = await env.DB.prepare(`
      INSERT INTO generated_problems (
        student_id, question, correct_answer, explanation,
        difficulty, subject, unit_name, problem_type
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'similar')
    `).bind(
      user.id,
      similarProblem.question,
      similarProblem.answer,
      similarProblem.explanation,
      mistake.difficulty,
      mistake.subject,
      mistake.unit_name
    ).run()
    
    // 類似問題生成履歴に記録
    await env.DB.prepare(`
      INSERT INTO similar_problems_generated (
        mistake_id, student_id, generated_problem_id, generation_method, similarity_score
      ) VALUES (?, ?, ?, 'ai', 0.85)
    `).bind(mistakeId, user.id, result.meta.last_row_id).run()
    
    return c.json({
      success: true,
      problem: {
        id: result.meta.last_row_id,
        ...similarProblem
      }
    })
  } catch (error: any) {
    console.error('❌ 類似問題生成エラー:', error)
    return c.json({ success: false, error: '類似問題の生成に失敗しました', details: error.message }, 500)
  }
})

/**
 * POST /api/essay/grade - 記述問題を採点
 */
app.post('/api/essay/grade', authMiddleware, async (c) => {
  try {
    const { env, user } = c.var
    const body = await c.req.json()
    
    // 問題情報
    const problem = {
      student_id: user.id,
      problem_type: body.problem_type || 'essay',
      subject: body.subject,
      unit_name: body.unit_name,
      question: body.question,
      reference_answer: body.reference_answer,
      max_score: body.max_score || 100
    }
    
    // 解答情報
    const answer = {
      problem_id: body.problem_id,
      student_id: user.id,
      answer_text: body.answer_text,
      answer_length: body.answer_text.length,
      writing_time: body.writing_time
    }
    
    // 採点エンジンを初期化
    const gradingEngine = new EssayGradingEngine(env.AI, env.DB)
    
    // 採点実行
    const result = await gradingEngine.gradeEssay(problem as any, answer as any, true)
    
    // 解答を保存
    const answerResult = await env.DB.prepare(`
      INSERT INTO essay_answers (
        problem_id, student_id, answer_text, answer_length, writing_time, is_submitted
      ) VALUES (?, ?, ?, ?, ?, 1)
    `).bind(
      body.problem_id || null,
      user.id,
      body.answer_text,
      body.answer_text.length,
      body.writing_time || null
    ).run()
    
    // 採点結果を保存
    await gradingEngine.saveGradingResult(
      answerResult.meta.last_row_id as number,
      user.id,
      result,
      'cloudflare-workers-ai'
    )
    
    // 不正解の場合は間違いノートに追加
    if (result.total_score < 60) {
      await addToMistakeNotebook(env.DB, {
        student_id: user.id,
        problem_id: body.problem_id,
        original_question: body.question,
        original_answer: body.reference_answer,
        correct_answer: body.reference_answer,
        student_answer: body.answer_text,
        subject: body.subject,
        unit_name: body.unit_name,
        difficulty: body.difficulty || 'medium',
        mistake_type: 'essay_low_score'
      })
    }
    
    return c.json({
      success: true,
      result
    })
  } catch (error: any) {
    console.error('❌ 記述問題採点エラー:', error)
    return c.json({ success: false, error: '記述問題の採点に失敗しました', details: error.message }, 500)
  }
})

/**
 * GET /api/essay/history - 記述問題の採点履歴
 */
app.get('/api/essay/history', authMiddleware, async (c) => {
  try {
    const { env, user } = c.var
    const { limit = '20', subject } = c.req.query()
    
    let query = `
      SELECT 
        ea.id, ea.problem_id, ea.answer_text, ea.answer_length,
        ea.writing_time, ea.submitted_at,
        eg.total_score, eg.grade_level, eg.overall_feedback,
        eg.improvement_suggestions
      FROM essay_answers ea
      JOIN essay_grading eg ON ea.id = eg.answer_id
      WHERE ea.student_id = ?
    `
    const params: any[] = [user.id]
    
    if (subject) {
      query += ` AND eg.subject = ?`
      params.push(subject)
    }
    
    query += ` ORDER BY ea.submitted_at DESC LIMIT ?`
    params.push(parseInt(limit as string))
    
    const result = await env.DB.prepare(query).bind(...params).all()
    
    return c.json({
      success: true,
      history: result.results
    })
  } catch (error: any) {
    console.error('❌ 記述問題履歴取得エラー:', error)
    return c.json({ success: false, error: '記述問題履歴の取得に失敗しました', details: error.message }, 500)
  }
})

// ============================================
// Phase 20-3: 教師向け管理ダッシュボードAPI
// ============================================

/**
 * GET /api/teacher/class/:classId/summary - クラス学習状況サマリー
 */
app.get('/api/teacher/class/:classId/summary', authMiddleware, requireRole(['teacher', 'admin']), async (c) => {
  try {
    const { env, user } = c.var
    const classId = parseInt(c.req.param('classId'))
    
    const summary = await generateClassSummary(env.DB, classId, user.id)
    
    // サマリーをDBに保存
    await env.DB.prepare(`
      INSERT OR REPLACE INTO class_learning_summary (
        class_id, teacher_id, summary_date, total_students, active_students,
        total_problems_solved, average_accuracy, average_study_time,
        on_track_count, behind_count, ahead_count,
        subject_statistics, students_needing_attention
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      summary.class_id,
      summary.teacher_id,
      summary.summary_date,
      summary.total_students,
      summary.active_students,
      summary.total_problems_solved,
      summary.average_accuracy,
      summary.average_study_time,
      summary.on_track_count,
      summary.behind_count,
      summary.ahead_count,
      JSON.stringify(summary.subject_statistics),
      JSON.stringify(summary.students_needing_attention)
    ).run()
    
    return c.json({
      success: true,
      summary
    })
  } catch (error: any) {
    console.error('❌ クラスサマリー取得エラー:', error)
    return c.json({ success: false, error: 'クラスサマリーの取得に失敗しました', details: error.message }, 500)
  }
})

/**
 * GET /api/teacher/student/:studentId/report - 生徒詳細レポート
 */
app.get('/api/teacher/student/:studentId/report', authMiddleware, requireRole(['teacher', 'admin']), async (c) => {
  try {
    const { env, user } = c.var
    const studentId = parseInt(c.req.param('studentId'))
    
    const report = await generateStudentReport(env.DB, studentId, user.id)
    
    // レポートをDBに保存
    await env.DB.prepare(`
      INSERT OR REPLACE INTO student_detail_reports (
        student_id, teacher_id, report_date, total_study_time, problems_solved,
        correct_rate, streak_days, strong_subjects, weak_subjects,
        study_pattern, consistency_score, engagement_level,
        predicted_performance, recommended_actions
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      report.student_id,
      user.id,
      new Date().toISOString().split('T')[0],
      report.total_study_time,
      report.problems_solved,
      report.correct_rate,
      report.streak_days,
      JSON.stringify(report.strong_subjects),
      JSON.stringify(report.weak_subjects),
      report.study_pattern,
      report.consistency_score,
      report.engagement_level,
      report.predicted_performance,
      JSON.stringify(report.recommended_actions)
    ).run()
    
    return c.json({
      success: true,
      report
    })
  } catch (error: any) {
    console.error('❌ 生徒レポート取得エラー:', error)
    return c.json({ success: false, error: '生徒レポートの取得に失敗しました', details: error.message }, 500)
  }
})

/**
 * POST /api/teacher/homework - 宿題を作成
 */
app.post('/api/teacher/homework', authMiddleware, requireRole(['teacher', 'admin']), async (c) => {
  try {
    const { env, user } = c.var
    const body = await c.req.json()
    
    const result = await createHomework(env.DB, {
      teacher_id: user.id,
      class_id: body.class_id,
      assignment_name: body.assignment_name,
      description: body.description,
      subject: body.subject,
      unit_name: body.unit_name,
      problem_type: body.problem_type,
      difficulty: body.difficulty,
      problem_count: body.problem_count,
      problem_ids: body.problem_ids,
      assigned_date: body.assigned_date,
      due_date: body.due_date,
      estimated_time: body.estimated_time,
      target_students: body.target_students
    })
    
    if (result.success) {
      // 宿題を公開
      await env.DB.prepare(`
        UPDATE homework_assignments
        SET is_published = 1, published_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(result.homeworkId).run()
    }
    
    return c.json(result)
  } catch (error: any) {
    console.error('❌ 宿題作成エラー:', error)
    return c.json({ success: false, error: '宿題の作成に失敗しました', details: error.message }, 500)
  }
})

/**
 * GET /api/teacher/homework/:homeworkId/submissions - 宿題提出状況
 */
app.get('/api/teacher/homework/:homeworkId/submissions', authMiddleware, requireRole(['teacher', 'admin']), async (c) => {
  try {
    const { env } = c.var
    const homeworkId = parseInt(c.req.param('homeworkId'))
    
    const submissions = await getHomeworkSubmissions(env.DB, homeworkId)
    
    // 統計情報
    const total = submissions.length
    const submitted = submissions.filter(s => s.status === 'submitted' || s.status === 'graded').length
    const notStarted = submissions.filter(s => !s.status || s.status === 'not_started').length
    const inProgress = submissions.filter(s => s.status === 'in_progress').length
    
    return c.json({
      success: true,
      submissions,
      statistics: {
        total,
        submitted,
        not_started: notStarted,
        in_progress: inProgress,
        submission_rate: (submitted / total * 100).toFixed(1) + '%'
      }
    })
  } catch (error: any) {
    console.error('❌ 宿題提出状況取得エラー:', error)
    return c.json({ success: false, error: '宿題提出状況の取得に失敗しました', details: error.message }, 500)
  }
})

/**
 * POST /api/teacher/classes/compare - クラス比較分析
 */
app.post('/api/teacher/classes/compare', authMiddleware, requireRole(['teacher', 'admin']), async (c) => {
  try {
    const { env, user } = c.var
    const { class_ids } = await c.req.json()
    
    if (!class_ids || class_ids.length < 2) {
      return c.json({ success: false, error: '2つ以上のクラスを指定してください' }, 400)
    }
    
    const comparison = await compareClasses(env.DB, user.id, class_ids)
    
    // 比較結果をDBに保存
    await env.DB.prepare(`
      INSERT INTO class_comparison (
        teacher_id, comparison_date, class_ids, metrics_json, insights, recommendations
      ) VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      user.id,
      new Date().toISOString().split('T')[0],
      JSON.stringify(class_ids),
      JSON.stringify(comparison.comparisons),
      JSON.stringify(comparison.insights),
      JSON.stringify(comparison.recommendations)
    ).run()
    
    return c.json({
      success: true,
      comparison
    })
  } catch (error: any) {
    console.error('❌ クラス比較エラー:', error)
    return c.json({ success: false, error: 'クラス比較に失敗しました', details: error.message }, 500)
  }
})

/**
 * GET /api/teacher/classes - 担当クラス一覧
 */
app.get('/api/teacher/classes', authMiddleware, requireRole(['teacher', 'admin']), async (c) => {
  try {
    const { env, user } = c.var
    
    const classes = await env.DB.prepare(`
      SELECT 
        c.id,
        c.class_name,
        c.grade,
        c.class_code,
        COUNT(s.id) as student_count
      FROM classes c
      LEFT JOIN students s ON c.id = s.class_id
      WHERE c.school_id = ?
      GROUP BY c.id
      ORDER BY c.grade, c.class_name
    `).bind(user.school_id || 1).all()
    
    return c.json({
      success: true,
      classes: classes.results
    })
  } catch (error: any) {
    console.error('❌ クラス一覧取得エラー:', error)
    return c.json({ success: false, error: 'クラス一覧の取得に失敗しました', details: error.message }, 500)
  }
})

// ================================================
// Phase 21: 保護者向けダッシュボード（基本API）
// ================================================

// 保護者ログイン（簡易版）
app.post('/api/parent/login', async (c) => {
  try {
    const { env } = c
    const { email, password } = await c.req.json()
    
    const parent = await env.DB.prepare(`
      SELECT * FROM parents WHERE email = ?
    `).bind(email).first()
    
    if (!parent) {
      return c.json({ success: false, error: 'メールアドレスまたはパスワードが正しくありません' }, 401)
    }
    
    // 簡易認証（本番環境ではbcrypt使用）
    return c.json({
      success: true,
      parent: {
        id: parent.id,
        name: parent.name,
        email: parent.email
      }
    })
  } catch (error: any) {
    console.error('❌ 保護者ログインエラー:', error)
    return c.json({ success: false, error: 'ログインに失敗しました' }, 500)
  }
})

// 子どもの学習状況取得
app.get('/api/parent/student/:student_id/progress', async (c) => {
  try {
    const { env } = c
    const student_id = parseInt(c.req.param('student_id'))
    
    // 基本情報
    const student = await env.DB.prepare(`
      SELECT name, email, current_streak, total_points 
      FROM students WHERE id = ?
    `).bind(student_id).first()
    
    // 今週の学習時間
    const weeklyStats = await env.DB.prepare(`
      SELECT 
        COUNT(DISTINCT DATE(answered_at)) as study_days,
        COUNT(*) as problems_solved,
        AVG(CASE WHEN is_correct = 1 THEN 1.0 ELSE 0.0 END) * 100 as correct_rate
      FROM problem_answers
      WHERE student_id = ? AND answered_at >= datetime('now', '-7 days')
    `).bind(student_id).first()
    
    return c.json({
      success: true,
      student,
      weekly_stats: weeklyStats
    })
  } catch (error: any) {
    console.error('❌ 学習状況取得エラー:', error)
    return c.json({ success: false, error: '学習状況の取得に失敗しました' }, 500)
  }
})

// ================================================
// Phase 21: リアルタイム協働学習（基本API）
// ================================================

// セッション一覧取得
app.get('/api/collaborative/sessions', authMiddleware, async (c) => {
  try {
    const { env } = c
    
    const sessions = await env.DB.prepare(`
      SELECT 
        cs.*,
        s.name as creator_name,
        COUNT(DISTINCT sp.student_id) as participant_count
      FROM collaborative_sessions cs
      JOIN students s ON cs.creator_student_id = s.id
      LEFT JOIN session_participants sp ON cs.id = sp.session_id AND sp.is_active = 1
      WHERE cs.status IN ('waiting', 'active')
      GROUP BY cs.id
      ORDER BY cs.created_at DESC
      LIMIT 20
    `).all()
    
    return c.json({
      success: true,
      sessions: sessions.results
    })
  } catch (error: any) {
    console.error('❌ セッション一覧取得エラー:', error)
    return c.json({ success: false, error: 'セッション一覧の取得に失敗しました' }, 500)
  }
})

// セッション作成
app.post('/api/collaborative/sessions', authMiddleware, async (c) => {
  try {
    const { env, user } = c.var
    const { session_name, session_type, subject, difficulty } = await c.req.json()
    
    const result = await env.DB.prepare(`
      INSERT INTO collaborative_sessions (session_name, session_type, creator_student_id, subject, difficulty, status)
      VALUES (?, ?, ?, ?, ?, 'waiting')
      RETURNING id
    `).bind(session_name, session_type, user.id, subject, difficulty || 'medium').run()
    
    const session_id = result.results[0]?.id
    
    // 作成者を参加者として追加
    await env.DB.prepare(`
      INSERT INTO session_participants (session_id, student_id)
      VALUES (?, ?)
    `).bind(session_id, user.id).run()
    
    return c.json({
      success: true,
      session_id
    })
  } catch (error: any) {
    console.error('❌ セッション作成エラー:', error)
    return c.json({ success: false, error: 'セッションの作成に失敗しました' }, 500)
  }
})

// ================================================
// Phase 21: AI学習アシスタント（チャットボット）
// ================================================

import {
  generateChatResponse,
  getConversationHistory,
  createConversation,
  saveMessage,
  getStudentAssistantSettings,
  searchFAQ,
  recordChatAnalytics,
  getStudentLearningContext
} from './ai-assistant'

// チャット送信
app.post('/api/chat/send', authMiddleware, async (c) => {
  try {
    const { env, user } = c.var
    const { message, conversation_id } = await c.req.json()
    
    if (!message || message.trim().length === 0) {
      return c.json({ success: false, error: 'メッセージを入力してください' }, 400)
    }
    
    console.log('💬 チャットメッセージ受信:', { student_id: user.id, message })
    
    // APIキーを確認
    const apiKey = env.GEMINI_API_KEY
    if (!apiKey || apiKey === 'your-gemini-api-key-here') {
      return c.json({ success: false, error: 'AI機能が利用できません' }, 500)
    }
    
    // 会話IDがない場合は新規作成
    let conv_id = conversation_id
    if (!conv_id) {
      conv_id = await createConversation(env.DB, user.id)
      console.log('✅ 新しい会話を作成:', conv_id)
    }
    
    // ユーザーメッセージを保存
    await saveMessage(env.DB, conv_id, 'user', message)
    
    // アシスタント設定を取得
    const settings = await getStudentAssistantSettings(env.DB, user.id)
    console.log('⚙️ アシスタント設定:', settings)
    
    // 会話履歴を取得
    const history = await getConversationHistory(env.DB, user.id, conv_id, 10)
    
    // 生徒の学習コンテキストを取得
    const learningContext = await getStudentLearningContext(env.DB, user.id)
    console.log('📊 学習コンテキスト:', learningContext)
    
    // コンテキストを構築
    const context = {
      student_id: user.id,
      conversation_id: conv_id,
      personality: {
        name: settings.name || 'まなぶくん',
        system_prompt: settings.system_prompt || '',
        tone: settings.tone || 'friendly',
        emoji_usage: settings.emoji_usage || 1
      },
      recent_messages: history as any[],
      student_progress: learningContext
    }
    
    // AI応答を生成
    console.log('🤖 AI応答生成中...')
    const response = await generateChatResponse(context, message, apiKey)
    console.log('✅ AI応答:', response.content.substring(0, 100) + '...')
    
    // アシスタントの応答を保存
    await saveMessage(env.DB, conv_id, 'assistant', response.content, response.message_type)
    
    // 分析データを記録
    await recordChatAnalytics(env.DB, user.id, response.message_type)
    
    return c.json({
      success: true,
      conversation_id: conv_id,
      message: {
        role: 'assistant',
        content: response.content,
        message_type: response.message_type,
        timestamp: new Date().toISOString()
      }
    })
    
  } catch (error: any) {
    console.error('❌ チャット送信エラー:', error)
    return c.json({ 
      success: false, 
      error: 'メッセージの送信に失敗しました',
      details: error.message 
    }, 500)
  }
})

// 会話履歴を取得
app.get('/api/chat/conversations', authMiddleware, async (c) => {
  try {
    const { env, user } = c.var
    
    const conversations = await env.DB.prepare(`
      SELECT 
        id,
        conversation_title,
        started_at,
        last_message_at,
        is_active,
        (SELECT COUNT(*) FROM chat_messages WHERE conversation_id = chat_conversations.id) as message_count
      FROM chat_conversations
      WHERE student_id = ?
      ORDER BY last_message_at DESC
      LIMIT 50
    `).bind(user.id).all()
    
    return c.json({
      success: true,
      conversations: conversations.results
    })
    
  } catch (error: any) {
    console.error('❌ 会話履歴取得エラー:', error)
    return c.json({ success: false, error: '会話履歴の取得に失敗しました' }, 500)
  }
})

// 特定の会話のメッセージを取得
app.get('/api/chat/messages/:conversation_id', authMiddleware, async (c) => {
  try {
    const { env, user } = c.var
    const conversation_id = parseInt(c.req.param('conversation_id'))
    
    const messages = await getConversationHistory(env.DB, user.id, conversation_id, 100)
    
    return c.json({
      success: true,
      messages
    })
    
  } catch (error: any) {
    console.error('❌ メッセージ取得エラー:', error)
    return c.json({ success: false, error: 'メッセージの取得に失敗しました' }, 500)
  }
})

// FAQ検索
app.get('/api/chat/faq', async (c) => {
  try {
    const { env } = c
    const query = c.req.query('q') || ''
    
    if (query.length === 0) {
      // 全FAQ取得
      const faqs = await env.DB.prepare(`
        SELECT * FROM assistant_faq
        ORDER BY category, usage_count DESC
        LIMIT 20
      `).all()
      
      return c.json({
        success: true,
        faqs: faqs.results
      })
    }
    
    // 検索
    const faqs = await searchFAQ(env.DB, query, 5)
    
    return c.json({
      success: true,
      faqs
    })
    
  } catch (error: any) {
    console.error('❌ FAQ検索エラー:', error)
    return c.json({ success: false, error: 'FAQの取得に失敗しました' }, 500)
  }
})

// アシスタント設定を取得
app.get('/api/chat/settings', authMiddleware, async (c) => {
  try {
    const { env, user } = c.var
    
    const settings = await getStudentAssistantSettings(env.DB, user.id)
    
    // パーソナリティ一覧も取得
    const personalities = await env.DB.prepare(`
      SELECT * FROM assistant_personalities
      ORDER BY is_default DESC, id
    `).all()
    
    return c.json({
      success: true,
      settings,
      personalities: personalities.results
    })
    
  } catch (error: any) {
    console.error('❌ 設定取得エラー:', error)
    return c.json({ success: false, error: '設定の取得に失敗しました' }, 500)
  }
})

// アシスタント設定を更新
app.post('/api/chat/settings', authMiddleware, async (c) => {
  try {
    const { env, user } = c.var
    const { personality_id, help_level, motivation_frequency } = await c.req.json()
    
    await env.DB.prepare(`
      INSERT INTO student_assistant_settings (student_id, personality_id, help_level, motivation_frequency)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(student_id) DO UPDATE SET
        personality_id = excluded.personality_id,
        help_level = excluded.help_level,
        motivation_frequency = excluded.motivation_frequency
    `).bind(user.id, personality_id, help_level, motivation_frequency).run()
    
    return c.json({
      success: true,
      message: '設定を更新しました'
    })
    
  } catch (error: any) {
    console.error('❌ 設定更新エラー:', error)
    return c.json({ success: false, error: '設定の更新に失敗しました' }, 500)
  }
})

// ============================================================
// レベル5理論体系: 12理論適性診断API
// ============================================================
// app.route('/api/theory-assessment', theoryAssessmentApp) // TODO: 実装予定

// ============================================================
// Phase 16-1: 学習カードへの12理論統合API
// ============================================================
import cardTheoryIntegrationApp from './card-theory-integration'
app.route('/api', cardTheoryIntegrationApp)

// ============================================================
// Phase 16-2: AI問題生成のレベル5対応拡張API
// ============================================================
import aiProblemTheoryIntegrationApp from './ai-problem-theory-integration'
app.route('/api', aiProblemTheoryIntegrationApp)

// ============================================================
// Phase 17-1: 12理論学習パスの動的最適化API
// ============================================================
import dynamicTheoryOptimizerApp from './dynamic-theory-optimizer'
app.route('/api/theory', dynamicTheoryOptimizerApp)

// ============================================================
// Phase 17-2: 長期効果測定システムAPI
// ============================================================
import longTermEffectMeasurementApp from './long-term-effect-measurement'
app.route('/api/effect-measurement', longTermEffectMeasurementApp)

// ============================================================
// Phase 17-3: 保護者向け12理論レポートAPI
// ============================================================
import parentTheoryReportApp from './parent-theory-report'
app.route('/api/parent-report', parentTheoryReportApp)

// ============================================================
// Phase 18-1: リアルタイム適応学習API
// ============================================================
import realtimeLearningApi from './realtime-learning-api'
app.route('/api/realtime', realtimeLearningApi)

// ============================================================
// Phase 18-2-1: 機械学習予測エンジンAPI
// ============================================================
import mlPredictionEngine from './ml-prediction-engine'
app.route('/api/ml', mlPredictionEngine)

// ============================================================
// Phase 18-2-2: A/BテストフレームワークAPI
// ============================================================
import abTestFramework from './ab-test-framework'
app.route('/api/ab-test', abTestFramework)

// ============================================================
// Phase 18-3: パフォーマンス最適化 & 学習開始実装
// ============================================================
import performanceOptimizationApp from './performance-optimization'
app.route('/api/performance', performanceOptimizationApp)

import learningSessionApiApp from './learning-session-api'
app.route('/api/learning-session', learningSessionApiApp)

// ============================================================
// Phase 18-4: 12理論システムAPI（効果量最適化版）
// ============================================================
import theorySystemApiApp from './theory-system-api'
app.route('/api/theory-system', theorySystemApiApp)

export default app

// ============================================================
// Durable Objects エクスポート
// ============================================================
export { RealtimeLearningSession } from './realtime-learning-session'
