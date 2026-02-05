/**
 * Phase 12-3: 学習経路の動的最適化
 * 適応的カリキュラム・苦手分野の自動補強・習得度予測
 */

import { D1Database } from '@cloudflare/workers-types'

/**
 * ========================================
 * 1. 学習グラフエンジン
 * ========================================
 */

// 学習単元ノード
export interface LearningNode {
  unit_id: number
  subject: string
  grade: number
  unit_name: string
  prerequisites: number[] // 前提となる単元ID
  difficulty: number // 1-10
  estimated_hours: number
}

// 学習グラフ
export class LearningGraph {
  private nodes: Map<number, LearningNode>
  private adjacencyList: Map<number, number[]> // unit_id -> [dependent unit_ids]

  constructor() {
    this.nodes = new Map()
    this.adjacencyList = new Map()
  }

  // ノードを追加
  addNode(node: LearningNode): void {
    this.nodes.set(node.unit_id, node)
    if (!this.adjacencyList.has(node.unit_id)) {
      this.adjacencyList.set(node.unit_id, [])
    }

    // 前提単元との関係を設定
    node.prerequisites.forEach((prereqId) => {
      if (!this.adjacencyList.has(prereqId)) {
        this.adjacencyList.set(prereqId, [])
      }
      this.adjacencyList.get(prereqId)!.push(node.unit_id)
    })
  }

  // トポロジカルソート（学習順序の決定）
  topologicalSort(): number[] {
    const inDegree = new Map<number, number>()
    const result: number[] = []

    // 各ノードの入次数を計算
    this.nodes.forEach((_, unitId) => {
      inDegree.set(unitId, 0)
    })
    this.nodes.forEach((node) => {
      node.prerequisites.forEach((prereqId) => {
        inDegree.set(prereqId, (inDegree.get(prereqId) || 0) + 1)
      })
    })

    // 入次数0のノードをキューに追加
    const queue: number[] = []
    inDegree.forEach((degree, unitId) => {
      if (degree === 0) {
        queue.push(unitId)
      }
    })

    // BFS
    while (queue.length > 0) {
      const current = queue.shift()!
      result.push(current)

      const dependents = this.adjacencyList.get(current) || []
      dependents.forEach((depId) => {
        const newDegree = (inDegree.get(depId) || 0) - 1
        inDegree.set(depId, newDegree)
        if (newDegree === 0) {
          queue.push(depId)
        }
      })
    }

    return result
  }

  // 最短学習経路を計算
  shortestPath(startUnitId: number, endUnitId: number): number[] {
    const queue: number[][] = [[startUnitId]]
    const visited = new Set<number>([startUnitId])

    while (queue.length > 0) {
      const path = queue.shift()!
      const current = path[path.length - 1]

      if (current === endUnitId) {
        return path
      }

      const dependents = this.adjacencyList.get(current) || []
      dependents.forEach((nextId) => {
        if (!visited.has(nextId)) {
          visited.add(nextId)
          queue.push([...path, nextId])
        }
      })
    }

    return []
  }

  // ノード取得
  getNode(unitId: number): LearningNode | undefined {
    return this.nodes.get(unitId)
  }

  // 全ノード取得
  getAllNodes(): LearningNode[] {
    return Array.from(this.nodes.values())
  }
}

/**
 * ========================================
 * 2. 習熟度スコアリングシステム
 * ========================================
 */

export interface MasteryScore {
  unit_id: number
  student_id: number
  mastery_level: number // 0-100
  confidence: number // 0-1
  last_practiced: Date
  practice_count: number
  correct_rate: number
}

/**
 * 習熟度を計算
 */
export async function calculateMasteryScore(
  db: D1Database,
  studentId: number,
  unitId: number
): Promise<MasteryScore> {
  // 学習履歴を取得
  const history = await db
    .prepare(
      `
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) as correct,
      MAX(created_at) as last_practiced
    FROM answer_history ah
    JOIN generated_problems gp ON ah.problem_id = gp.id
    JOIN curriculum c ON gp.subject = c.subject
    WHERE ah.student_id = ? AND c.id = ?
  `
    )
    .bind(studentId, unitId)
    .first()

  if (!history || history.total === 0) {
    return {
      unit_id: unitId,
      student_id: studentId,
      mastery_level: 0,
      confidence: 0,
      last_practiced: new Date(),
      practice_count: 0,
      correct_rate: 0,
    }
  }

  const total = history.total as number
  const correct = history.correct as number
  const correctRate = correct / total

  // 習熟度スコア計算
  // 正答率 × 練習回数の影響 × 時間減衰
  const practiceBonus = Math.min(total / 20, 1) // 20問で最大ボーナス
  const lastPracticed = new Date(history.last_practiced as string)
  const daysSince = (Date.now() - lastPracticed.getTime()) / (1000 * 60 * 60 * 24)
  const timeDecay = Math.exp(-daysSince / 30) // 30日で減衰

  const masteryLevel = Math.round(correctRate * practiceBonus * timeDecay * 100)

  // 信頼度（サンプル数に基づく）
  const confidence = Math.min(total / 10, 1) // 10問で信頼度1.0

  return {
    unit_id: unitId,
    student_id: studentId,
    mastery_level: masteryLevel,
    confidence,
    last_practiced: lastPracticed,
    practice_count: total,
    correct_rate: correctRate,
  }
}

/**
 * 全単元の習熟度を計算
 */
export async function calculateAllMasteryScores(
  db: D1Database,
  studentId: number,
  subject?: string
): Promise<MasteryScore[]> {
  let query = `SELECT id FROM curriculum`
  const params: any[] = []

  if (subject) {
    query += ` WHERE subject = ?`
    params.push(subject)
  }

  const units = await db.prepare(query).bind(...params).all()

  const scores = await Promise.all(
    units.results.map((unit: any) => calculateMasteryScore(db, studentId, unit.id))
  )

  return scores
}

/**
 * ========================================
 * 3. 適応的カリキュラム生成
 * ========================================
 */

export interface AdaptiveCurriculum {
  student_id: number
  subject: string
  recommended_path: {
    unit_id: number
    unit_name: string
    priority: number // 1-10
    reason: string
    estimated_time: string
    mastery_level: number
  }[]
  weak_areas: {
    unit_id: number
    unit_name: string
    mastery_level: number
    reinforcement_needed: boolean
  }[]
  next_milestone: {
    unit_id: number
    unit_name: string
    progress: number
  }
}

/**
 * 適応的カリキュラムを生成
 */
export async function generateAdaptiveCurriculum(
  db: D1Database,
  studentId: number,
  subject: string,
  targetGrade?: number
): Promise<AdaptiveCurriculum> {
  // 1. 全単元の習熟度を取得
  const masteryScores = await calculateAllMasteryScores(db, studentId, subject)

  // 2. カリキュラムデータを取得
  let curriculumQuery = `
    SELECT id, unit_name, grade, unit_order, total_hours, unit_goal
    FROM curriculum
    WHERE subject = ?
  `
  const params: any[] = [subject]

  if (targetGrade) {
    curriculumQuery += ` AND grade = ?`
    params.push(targetGrade)
  }

  curriculumQuery += ` ORDER BY grade, unit_order`

  const curriculum = await db.prepare(curriculumQuery).bind(...params).all()

  // 3. 学習グラフを構築
  const graph = new LearningGraph()

  curriculum.results.forEach((unit: any, index: number) => {
    // 前の単元を前提とする（簡易的な依存関係）
    const prerequisites = index > 0 ? [curriculum.results[index - 1].id] : []

    graph.addNode({
      unit_id: unit.id,
      subject: subject,
      grade: unit.grade,
      unit_name: unit.unit_name,
      prerequisites: prerequisites,
      difficulty: Math.ceil(unit.grade * 1.5), // 学年×1.5を難易度とする
      estimated_hours: unit.total_hours,
    })
  })

  // 4. 苦手分野を特定（習熟度50%未満）
  const weakAreas = masteryScores
    .filter((score) => score.mastery_level < 50)
    .map((score) => {
      const unit = curriculum.results.find((u: any) => u.id === score.unit_id)
      return {
        unit_id: score.unit_id,
        unit_name: unit?.unit_name || '不明',
        mastery_level: score.mastery_level,
        reinforcement_needed: score.mastery_level < 30,
      }
    })

  // 5. 推奨学習経路を生成
  const recommendedPath: AdaptiveCurriculum['recommended_path'] = []

  curriculum.results.forEach((unit: any) => {
    const masteryScore = masteryScores.find((s) => s.unit_id === unit.id)
    const masteryLevel = masteryScore?.mastery_level || 0

    // 優先度の計算
    // 1. 未習得の単元（習熟度 < 70%）
    // 2. 前提が満たされている単元
    // 3. 現在の学年に近い単元
    let priority = 5

    if (masteryLevel < 30) {
      priority = 10 // 最優先：未習得
    } else if (masteryLevel < 70) {
      priority = 8 // 高優先：要強化
    } else if (masteryLevel < 90) {
      priority = 5 // 中優先：復習推奨
    } else {
      priority = 2 // 低優先：習得済み
    }

    // 理由の生成
    let reason = ''
    if (masteryLevel < 30) {
      reason = '未習得のため基礎から学習が必要です'
    } else if (masteryLevel < 70) {
      reason = '理解が不十分なため復習と追加練習が必要です'
    } else if (masteryLevel < 90) {
      reason = '定着のために定期的な復習をおすすめします'
    } else {
      reason = '十分に習得済みです。応用問題に挑戦しましょう'
    }

    recommendedPath.push({
      unit_id: unit.id,
      unit_name: unit.unit_name,
      priority,
      reason,
      estimated_time: `${unit.total_hours}時間`,
      mastery_level: masteryLevel,
    })
  })

  // 優先度順にソート
  recommendedPath.sort((a, b) => b.priority - a.priority)

  // 6. 次のマイルストーンを設定
  const nextUnit = recommendedPath.find((unit) => unit.mastery_level < 80)
  const nextMilestone = nextUnit
    ? {
        unit_id: nextUnit.unit_id,
        unit_name: nextUnit.unit_name,
        progress: nextUnit.mastery_level,
      }
    : {
        unit_id: 0,
        unit_name: '全単元習得完了！',
        progress: 100,
      }

  return {
    student_id: studentId,
    subject,
    recommended_path: recommendedPath.slice(0, 10), // 上位10個
    weak_areas: weakAreas.slice(0, 5), // 上位5個
    next_milestone: nextMilestone,
  }
}

/**
 * ========================================
 * 4. 習得度予測エンジン
 * ========================================
 */

export interface MasteryPrediction {
  unit_id: number
  unit_name: string
  current_mastery: number
  predicted_mastery_7days: number
  predicted_mastery_30days: number
  recommended_practice_count: number
  estimated_time_to_master: string
  confidence: number
}

/**
 * 習得度を予測
 */
export async function predictMastery(
  db: D1Database,
  studentId: number,
  unitId: number
): Promise<MasteryPrediction> {
  // 現在の習熟度を取得
  const currentScore = await calculateMasteryScore(db, studentId, unitId)

  // 単元情報を取得
  const unit = await db
    .prepare(`SELECT id, unit_name, total_hours FROM curriculum WHERE id = ?`)
    .bind(unitId)
    .first()

  if (!unit) {
    throw new Error(`Unit ${unitId} not found`)
  }

  // 学習速度を推定（過去の正答率向上速度から）
  const recentHistory = await db
    .prepare(
      `
    SELECT 
      DATE(created_at) as date,
      COUNT(*) as count,
      SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) as correct
    FROM answer_history ah
    JOIN generated_problems gp ON ah.problem_id = gp.id
    WHERE ah.student_id = ? AND gp.subject = (SELECT subject FROM curriculum WHERE id = ?)
    AND created_at >= datetime('now', '-30 days')
    GROUP BY DATE(created_at)
    ORDER BY date DESC
  `
    )
    .bind(studentId, unitId)
    .all()

  // 学習速度（1日あたりの習熟度向上）
  let learningRate = 3 // デフォルト: 1日3%向上
  if (recentHistory.results.length >= 2) {
    const rates = recentHistory.results.map((day: any) => (day.correct / day.count) * 100)
    const avgImprovement = rates.reduce((sum: number, rate: number) => sum + rate, 0) / rates.length
    learningRate = Math.max(avgImprovement / 10, 1) // 最低1%
  }

  // 予測計算
  const currentMastery = currentScore.mastery_level
  const predicted7days = Math.min(currentMastery + learningRate * 7, 100)
  const predicted30days = Math.min(currentMastery + learningRate * 30, 100)

  // 習得までの推定時間（習熟度90%を目標）
  const remainingMastery = 90 - currentMastery
  const daysToMaster = remainingMastery > 0 ? Math.ceil(remainingMastery / learningRate) : 0

  // 推奨練習問題数（1日5問 × 日数）
  const recommendedPracticeCount = daysToMaster * 5

  return {
    unit_id: unitId,
    unit_name: unit.unit_name as string,
    current_mastery: currentMastery,
    predicted_mastery_7days: Math.round(predicted7days),
    predicted_mastery_30days: Math.round(predicted30days),
    recommended_practice_count: recommendedPracticeCount,
    estimated_time_to_master:
      daysToMaster === 0 ? '習得済み' : daysToMaster < 7 ? `約${daysToMaster}日` : `約${Math.ceil(daysToMaster / 7)}週間`,
    confidence: currentScore.confidence,
  }
}

/**
 * 複数単元の習得度を予測
 */
export async function predictMultipleMastery(
  db: D1Database,
  studentId: number,
  unitIds: number[]
): Promise<MasteryPrediction[]> {
  return await Promise.all(unitIds.map((unitId) => predictMastery(db, studentId, unitId)))
}

/**
 * ========================================
 * 5. 苦手分野の自動補強
 * ========================================
 */

export interface ReinforcementPlan {
  student_id: number
  weak_unit: {
    unit_id: number
    unit_name: string
    mastery_level: number
  }
  root_causes: {
    prerequisite_unit_id: number
    prerequisite_unit_name: string
    mastery_level: number
    is_blocking: boolean
  }[]
  reinforcement_actions: {
    action_type: 'review' | 'practice' | 'tutorial'
    unit_id: number
    unit_name: string
    priority: number
    estimated_time: string
    description: string
  }[]
  practice_problems: {
    subject: string
    difficulty: string
    count: number
  }[]
}

/**
 * 苦手分野の補強計画を生成
 */
export async function generateReinforcementPlan(
  db: D1Database,
  studentId: number,
  weakUnitId: number
): Promise<ReinforcementPlan> {
  // 1. 苦手単元の習熟度を取得
  const weakScore = await calculateMasteryScore(db, studentId, weakUnitId)

  // 2. 単元情報を取得
  const weakUnit = await db
    .prepare(`SELECT id, unit_name, subject, grade FROM curriculum WHERE id = ?`)
    .bind(weakUnitId)
    .first()

  if (!weakUnit) {
    throw new Error(`Unit ${weakUnitId} not found`)
  }

  // 3. 前提単元を特定（同じ教科の前の単元）
  const prerequisites = await db
    .prepare(
      `
    SELECT id, unit_name, grade, unit_order
    FROM curriculum
    WHERE subject = ? AND grade <= ? AND unit_order < (
      SELECT unit_order FROM curriculum WHERE id = ?
    )
    ORDER BY grade DESC, unit_order DESC
    LIMIT 3
  `
    )
    .bind(weakUnit.subject, weakUnit.grade, weakUnitId)
    .all()

  // 4. 前提単元の習熟度を確認
  const rootCauses = await Promise.all(
    prerequisites.results.map(async (prereq: any) => {
      const prereqScore = await calculateMasteryScore(db, studentId, prereq.id)
      return {
        prerequisite_unit_id: prereq.id,
        prerequisite_unit_name: prereq.unit_name,
        mastery_level: prereqScore.mastery_level,
        is_blocking: prereqScore.mastery_level < 60, // 60%未満は障害
      }
    })
  )

  // 5. 補強アクションを生成
  const reinforcementActions: ReinforcementPlan['reinforcement_actions'] = []

  // まず前提単元で習得が不十分なものを復習
  rootCauses
    .filter((cause) => cause.is_blocking)
    .forEach((cause, index) => {
      reinforcementActions.push({
        action_type: 'review',
        unit_id: cause.prerequisite_unit_id,
        unit_name: cause.prerequisite_unit_name,
        priority: 10 - index,
        estimated_time: '30分',
        description: `基礎となる「${cause.prerequisite_unit_name}」を復習しましょう`,
      })
    })

  // 次に対象単元の練習
  reinforcementActions.push({
    action_type: 'practice',
    unit_id: weakUnitId,
    unit_name: weakUnit.unit_name as string,
    priority: 8,
    estimated_time: '45分',
    description: `「${weakUnit.unit_name}」の練習問題を解きましょう`,
  })

  // AIチューターで質問
  reinforcementActions.push({
    action_type: 'tutorial',
    unit_id: weakUnitId,
    unit_name: weakUnit.unit_name as string,
    priority: 6,
    estimated_time: '15分',
    description: `わからないことはAIチューターに質問しましょう`,
  })

  // 6. 練習問題の推奨
  const practiceProblems: ReinforcementPlan['practice_problems'] = [
    {
      subject: weakUnit.subject as string,
      difficulty: weakScore.mastery_level < 30 ? 'easy' : 'medium',
      count: weakScore.mastery_level < 30 ? 15 : 10,
    },
  ]

  return {
    student_id: studentId,
    weak_unit: {
      unit_id: weakUnitId,
      unit_name: weakUnit.unit_name as string,
      mastery_level: weakScore.mastery_level,
    },
    root_causes: rootCauses,
    reinforcement_actions: reinforcementActions,
    practice_problems: practiceProblems,
  }
}
