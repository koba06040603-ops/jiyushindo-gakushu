// 学習データの匿名化エクスポート機能

interface ExportOptions {
  studentIds?: number[]
  classCode?: string
  grade?: string
  subjects?: string[]
  dateFrom?: string
  dateTo?: string
  format: 'csv' | 'json' | 'excel'
  anonymize: boolean
  anonymizationLevel?: 'basic' | 'standard' | 'full'
}

interface AnonymizedStudent {
  anonymousId: string
  originalId: number
}

// 匿名IDの生成
function generateAnonymousId(studentId: number, exportId: number): string {
  // ハッシュベースの匿名ID生成（A001, A002, ...）
  const hash = (studentId * exportId) % 10000
  return `A${hash.toString().padStart(4, '0')}`
}

// 基本匿名化: 名前を除外、IDを匿名化
export async function anonymizeBasic(
  data: any[],
  exportId: number,
  mapping: Map<number, string>
): Promise<any[]> {
  return data.map(row => {
    const { student_id, name, email, ...rest } = row
    return {
      anonymous_id: mapping.get(student_id) || generateAnonymousId(student_id, exportId),
      ...rest
    }
  })
}

// 標準匿名化: 名前、クラス、学校情報を除外/一般化
export async function anonymizeStandard(
  data: any[],
  exportId: number,
  mapping: Map<number, string>
): Promise<any[]> {
  return data.map(row => {
    const { 
      student_id, name, email, class_code, school_id, 
      ...rest 
    } = row
    
    return {
      anonymous_id: mapping.get(student_id) || generateAnonymousId(student_id, exportId),
      grade: row.grade, // 学年は保持
      ...rest
    }
  })
}

// 完全匿名化: 個人特定可能な情報をすべて除外
export async function anonymizeFull(
  data: any[],
  exportId: number,
  mapping: Map<number, string>
): Promise<any[]> {
  return data.map(row => {
    // 統計データのみを保持
    const {
      date, subject, accuracy_rate, time_spent_seconds,
      problem_type, difficulty, grade
    } = row
    
    return {
      anonymous_id: mapping.get(row.student_id) || generateAnonymousId(row.student_id, exportId),
      date,
      grade,
      subject,
      accuracy_rate,
      time_spent_seconds,
      problem_type,
      difficulty
    }
  })
}

// エクスポートデータの取得
export async function fetchExportData(
  db: D1Database,
  options: ExportOptions
): Promise<any[]> {
  let query = `
    SELECT 
      pa.student_id,
      u.name,
      u.email,
      u.grade,
      u.class_code,
      u.school_id,
      DATE(pa.answered_at) as date,
      c.subject,
      lc.card_type as problem_type,
      lc.difficulty_level as difficulty,
      pa.is_correct,
      pa.time_spent_seconds,
      pa.hint_count,
      pa.attempt_count
    FROM answer_history pa
    JOIN users u ON pa.student_id = u.id
    JOIN learning_cards lc ON pa.card_id = lc.id
    JOIN courses c ON lc.course_id = c.id
    WHERE 1=1
  `
  
  const params: any[] = []
  
  // フィルター条件
  if (options.studentIds && options.studentIds.length > 0) {
    query += ` AND pa.student_id IN (${options.studentIds.map(() => '?').join(',')})`
    params.push(...options.studentIds)
  }
  
  if (options.classCode) {
    query += ` AND u.class_code = ?`
    params.push(options.classCode)
  }
  
  if (options.grade) {
    query += ` AND u.grade = ?`
    params.push(options.grade)
  }
  
  if (options.subjects && options.subjects.length > 0) {
    query += ` AND c.subject IN (${options.subjects.map(() => '?').join(',')})`
    params.push(...options.subjects)
  }
  
  if (options.dateFrom) {
    query += ` AND DATE(pa.answered_at) >= ?`
    params.push(options.dateFrom)
  }
  
  if (options.dateTo) {
    query += ` AND DATE(pa.answered_at) <= ?`
    params.push(options.dateTo)
  }
  
  query += ` ORDER BY pa.answered_at DESC`
  
  const result = await db.prepare(query).bind(...params).all()
  return result.results as any[]
}

// データの匿名化処理
export async function anonymizeData(
  db: D1Database,
  data: any[],
  exportId: number,
  level: 'basic' | 'standard' | 'full'
): Promise<{ data: any[], mapping: AnonymizedStudent[] }> {
  // 匿名IDマッピングの作成
  const uniqueStudentIds = [...new Set(data.map(row => row.student_id))]
  const mapping = new Map<number, string>()
  const mappingRecords: AnonymizedStudent[] = []
  
  for (const studentId of uniqueStudentIds) {
    const anonymousId = generateAnonymousId(studentId, exportId)
    mapping.set(studentId, anonymousId)
    mappingRecords.push({ anonymousId, originalId: studentId })
    
    // マッピングをDBに保存
    await db.prepare(`
      INSERT INTO anonymization_mapping (export_id, original_student_id, anonymous_id)
      VALUES (?, ?, ?)
    `).bind(exportId, studentId, anonymousId).run()
  }
  
  // レベルに応じた匿名化
  let anonymizedData: any[]
  
  switch (level) {
    case 'basic':
      anonymizedData = await anonymizeBasic(data, exportId, mapping)
      break
    case 'standard':
      anonymizedData = await anonymizeStandard(data, exportId, mapping)
      break
    case 'full':
      anonymizedData = await anonymizeFull(data, exportId, mapping)
      break
    default:
      anonymizedData = data
  }
  
  return { data: anonymizedData, mapping: mappingRecords }
}

// CSV形式への変換
export function convertToCSV(data: any[]): string {
  if (data.length === 0) return ''
  
  const headers = Object.keys(data[0])
  const csvRows = [
    headers.join(','), // ヘッダー行
    ...data.map(row =>
      headers.map(header => {
        const value = row[header]
        // カンマや改行を含む場合はダブルクォートで囲む
        if (value === null || value === undefined) return ''
        const stringValue = String(value)
        if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
          return `"${stringValue.replace(/"/g, '""')}"`
        }
        return stringValue
      }).join(',')
    )
  ]
  
  return csvRows.join('\n')
}

// JSON形式への変換
export function convertToJSON(data: any[]): string {
  return JSON.stringify(data, null, 2)
}

// Excel形式への変換（簡易版 - CSVベース）
export function convertToExcel(data: any[]): string {
  // 実際のExcel形式(.xlsx)はバイナリのため、ここではCSVで代用
  // 本格的なExcel出力にはライブラリ（xlsx）が必要
  return convertToCSV(data)
}

// エクスポート履歴の記録
export async function recordExport(
  db: D1Database,
  schoolId: number,
  exportedBy: number,
  options: ExportOptions,
  recordCount: number,
  fileSize: number,
  fileUrl: string
): Promise<number> {
  const result = await db.prepare(`
    INSERT INTO export_history (
      school_id,
      exported_by,
      export_type,
      format,
      date_from,
      date_to,
      grade,
      class_code,
      subjects,
      is_anonymized,
      anonymization_level,
      record_count,
      file_size,
      file_url,
      expires_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', '+30 days'))
    RETURNING export_id
  `).bind(
    schoolId,
    exportedBy,
    options.classCode ? 'class' : options.grade ? 'grade' : 'individual',
    options.format,
    options.dateFrom || null,
    options.dateTo || null,
    options.grade || null,
    options.classCode || null,
    options.subjects ? JSON.stringify(options.subjects) : null,
    options.anonymize ? 1 : 0,
    options.anonymizationLevel || null,
    recordCount,
    fileSize,
    fileUrl
  ).run()
  
  return (result.results[0] as any).export_id
}

// 統計サマリーの生成
export function generateStatisticsSummary(data: any[]): any {
  if (data.length === 0) {
    return {
      totalRecords: 0,
      dateRange: { from: null, to: null },
      subjects: [],
      grades: [],
      statistics: {}
    }
  }
  
  const subjects = [...new Set(data.map(row => row.subject))]
  const grades = [...new Set(data.map(row => row.grade))]
  const dates = data.map(row => row.date).filter(d => d)
  
  const totalProblems = data.length
  const correctProblems = data.filter(row => row.is_correct === 1 || row.is_correct === true).length
  const totalTime = data.reduce((sum, row) => sum + (row.time_spent_seconds || 0), 0)
  
  return {
    totalRecords: data.length,
    dateRange: {
      from: dates.length > 0 ? dates[dates.length - 1] : null,
      to: dates.length > 0 ? dates[0] : null
    },
    subjects: subjects,
    grades: grades,
    statistics: {
      totalProblems,
      correctProblems,
      accuracyRate: totalProblems > 0 ? (correctProblems / totalProblems * 100).toFixed(2) : 0,
      totalTimeHours: (totalTime / 3600).toFixed(2),
      avgTimePerProblem: totalProblems > 0 ? (totalTime / totalProblems).toFixed(1) : 0
    }
  }
}
