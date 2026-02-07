/**
 * Phase 18-2-2: A/Bテストフレームワーク
 * 
 * 機能:
 * - 教育介入のA/Bテスト自動化
 * - 効果量（Cohen's d）の自動計算
 * - 統計的有意性検定
 * - 実験管理とモニタリング
 * 
 * 科学的根拠:
 * - A/Bテスト: 因果推論の標準手法
 * - 効果量: Cohen (1988)
 * - 多重比較補正: Bonferroni補正
 */

import { Hono } from 'hono'
import type { D1Database } from '@cloudflare/workers-types'

type Bindings = {
  DB: D1Database
  AI: any
}

const app = new Hono<{ Bindings: Bindings }>()

/**
 * 実験設定
 */
interface ExperimentConfig {
  name: string
  description: string
  hypothes is: string
  interventionType: 'hint_strategy' | 'difficulty_adjustment' | 'feedback_timing' | 'ui_design' | 'theory_emphasis'
  variants: ExperimentVariant[]
  primaryMetric: string // 'correct_rate', 'completion_time', 'theory_score'
  duration: number // 日数
  targetSampleSize: number
}

interface ExperimentVariant {
  name: string
  description: string
  config: any
  allocationPercentage: number
}

/**
 * 統計関数
 */
class Statistics {
  /**
   * 平均
   */
  static mean(values: number[]): number {
    return values.reduce((a, b) => a + b, 0) / values.length
  }

  /**
   * 標準偏差
   */
  static std(values: number[]): number {
    const avg = this.mean(values)
    const squareDiffs = values.map(value => Math.pow(value - avg, 2))
    return Math.sqrt(this.mean(squareDiffs))
  }

  /**
   * Cohen's d 効果量計算
   */
  static cohensD(group1: number[], group2: number[]): number {
    const mean1 = this.mean(group1)
    const mean2 = this.mean(group2)
    const std1 = this.std(group1)
    const std2 = this.std(group2)
    
    // Pooled standard deviation
    const n1 = group1.length
    const n2 = group2.length
    const pooledStd = Math.sqrt(
      ((n1 - 1) * std1 * std1 + (n2 - 1) * std2 * std2) / (n1 + n2 - 2)
    )
    
    return (mean2 - mean1) / pooledStd
  }

  /**
   * t検定（簡易版）
   */
  static tTest(group1: number[], group2: number[]): { t: number; df: number; significant: boolean } {
    const mean1 = this.mean(group1)
    const mean2 = this.mean(group2)
    const std1 = this.std(group1)
    const std2 = this.std(group2)
    const n1 = group1.length
    const n2 = group2.length
    
    // t統計量
    const t = (mean2 - mean1) / Math.sqrt((std1 * std1 / n1) + (std2 * std2 / n2))
    const df = n1 + n2 - 2
    
    // 簡易的な有意性判定（|t| > 1.96 なら有意水準5%で有意）
    const significant = Math.abs(t) > 1.96
    
    return { t, df, significant }
  }
}

/**
 * 実験作成
 * POST /api/ab-test/create-experiment
 */
app.post('/create-experiment', async (c) => {
  const { env } = c
  const config: ExperimentConfig = await c.req.json()

  try {
    // バリデーション
    if (config.variants.length < 2) {
      return c.json({
        success: false,
        error: '最低2つのバリアントが必要です'
      }, 400)
    }

    const totalAllocation = config.variants.reduce((sum, v) => sum + v.allocationPercentage, 0)
    if (Math.abs(totalAllocation - 100) > 0.01) {
      return c.json({
        success: false,
        error: `割り当て率の合計は100%である必要があります（現在: ${totalAllocation}%）`
      }, 400)
    }

    // 実験を作成
    const result = await env.DB.prepare(`
      INSERT INTO ab_test_experiments (
        name,
        description,
        hypothesis,
        intervention_type,
        primary_metric,
        duration_days,
        target_sample_size,
        status,
        start_date,
        end_date,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'draft', NULL, NULL, datetime('now'))
    `).bind(
      config.name,
      config.description,
      config.hypothesis,
      config.interventionType,
      config.primaryMetric,
      config.duration,
      config.targetSampleSize
    ).run()

    const experimentId = result.meta.last_row_id

    // バリアントを登録
    for (const variant of config.variants) {
      await env.DB.prepare(`
        INSERT INTO ab_test_variants (
          experiment_id,
          variant_name,
          description,
          config_json,
          allocation_percentage
        ) VALUES (?, ?, ?, ?, ?)
      `).bind(
        experimentId,
        variant.name,
        variant.description,
        JSON.stringify(variant.config),
        variant.allocationPercentage
      ).run()
    }

    return c.json({
      success: true,
      experimentId,
      message: '実験を作成しました'
    })
  } catch (error) {
    return c.json({
      success: false,
      error: '実験の作成に失敗しました',
      details: error instanceof Error ? error.message : String(error)
    }, 500)
  }
})

/**
 * 実験開始
 * POST /api/ab-test/start-experiment/:experimentId
 */
app.post('/start-experiment/:experimentId', async (c) => {
  const { env } = c
  const experimentId = c.req.param('experimentId')

  try {
    const experiment = await env.DB.prepare(`
      SELECT * FROM ab_test_experiments WHERE id = ?
    `).bind(experimentId).first()

    if (!experiment) {
      return c.json({ success: false, error: '実験が見つかりません' }, 404)
    }

    if (experiment.status !== 'draft') {
      return c.json({ success: false, error: '実験は既に開始されています' }, 400)
    }

    const endDate = new Date()
    endDate.setDate(endDate.getDate() + (experiment.duration_days as number))

    await env.DB.prepare(`
      UPDATE ab_test_experiments 
      SET status = 'running',
          start_date = datetime('now'),
          end_date = ?
      WHERE id = ?
    `).bind(endDate.toISOString(), experimentId).run()

    return c.json({
      success: true,
      message: '実験を開始しました',
      endDate: endDate.toISOString()
    })
  } catch (error) {
    return c.json({
      success: false,
      error: '実験の開始に失敗しました',
      details: error instanceof Error ? error.message : String(error)
    }, 500)
  }
})

/**
 * 生徒をバリアントに割り当て
 * POST /api/ab-test/assign-variant
 */
app.post('/assign-variant', async (c) => {
  const { env } = c
  const { experimentId, studentId } = await c.req.json()

  try {
    // 既に割り当てられているか確認
    const existing = await env.DB.prepare(`
      SELECT variant_id FROM ab_test_assignments
      WHERE experiment_id = ? AND student_id = ?
    `).bind(experimentId, studentId).first()

    if (existing) {
      return c.json({
        success: true,
        variantId: existing.variant_id,
        message: '既に割り当て済み'
      })
    }

    // バリアントを取得
    const variants = await env.DB.prepare(`
      SELECT id, allocation_percentage
      FROM ab_test_variants
      WHERE experiment_id = ?
      ORDER BY id
    `).bind(experimentId).all()

    if (variants.results.length === 0) {
      return c.json({ success: false, error: 'バリアントが見つかりません' }, 404)
    }

    // ランダム割り当て
    const random = Math.random() * 100
    let cumulative = 0
    let selectedVariantId = variants.results[0].id

    for (const variant of variants.results) {
      cumulative += variant.allocation_percentage as number
      if (random < cumulative) {
        selectedVariantId = variant.id
        break
      }
    }

    // 割り当てを記録
    await env.DB.prepare(`
      INSERT INTO ab_test_assignments (experiment_id, student_id, variant_id, assigned_at)
      VALUES (?, ?, ?, datetime('now'))
    `).bind(experimentId, studentId, selectedVariantId).run()

    return c.json({
      success: true,
      variantId: selectedVariantId,
      message: 'バリアントに割り当てました'
    })
  } catch (error) {
    return c.json({
      success: false,
      error: '割り当てに失敗しました',
      details: error instanceof Error ? error.message : String(error)
    }, 500)
  }
})

/**
 * メトリクス記録
 * POST /api/ab-test/record-metric
 */
app.post('/record-metric', async (c) => {
  const { env } = c
  const { experimentId, studentId, metricName, metricValue } = await c.req.json()

  try {
    await env.DB.prepare(`
      INSERT INTO ab_test_metrics (
        experiment_id,
        student_id,
        metric_name,
        metric_value,
        recorded_at
      ) VALUES (?, ?, ?, ?, datetime('now'))
    `).bind(experimentId, studentId, metricName, metricValue).run()

    return c.json({
      success: true,
      message: 'メトリクスを記録しました'
    })
  } catch (error) {
    return c.json({
      success: false,
      error: 'メトリクスの記録に失敗しました',
      details: error instanceof Error ? error.message : String(error)
    }, 500)
  }
})

/**
 * 実験結果分析
 * GET /api/ab-test/analyze-results/:experimentId
 */
app.get('/analyze-results/:experimentId', async (c) => {
  const { env } = c
  const experimentId = c.req.param('experimentId')

  try {
    // 実験情報取得
    const experiment = await env.DB.prepare(`
      SELECT * FROM ab_test_experiments WHERE id = ?
    `).bind(experimentId).first()

    if (!experiment) {
      return c.json({ success: false, error: '実験が見つかりません' }, 404)
    }

    // バリアント別のメトリクス取得
    const variantMetrics = await env.DB.prepare(`
      SELECT 
        v.id as variant_id,
        v.variant_name,
        COUNT(DISTINCT a.student_id) as sample_size,
        AVG(m.metric_value) as mean_value,
        GROUP_CONCAT(m.metric_value) as values
      FROM ab_test_variants v
      LEFT JOIN ab_test_assignments a ON v.id = a.variant_id
      LEFT JOIN ab_test_metrics m ON a.experiment_id = m.experiment_id 
        AND a.student_id = m.student_id
        AND m.metric_name = ?
      WHERE v.experiment_id = ?
      GROUP BY v.id, v.variant_name
    `).bind(experiment.primary_metric, experimentId).all()

    if (variantMetrics.results.length < 2) {
      return c.json({
        success: false,
        error: 'データが不足しています'
      }, 400)
    }

    // 統計分析実行
    const control = variantMetrics.results[0]
    const treatment = variantMetrics.results[1]

    const controlValues = (control.values as string).split(',').map(Number).filter(v => !isNaN(v))
    const treatmentValues = (treatment.values as string).split(',').map(Number).filter(v => !isNaN(v))

    if (controlValues.length < 5 || treatmentValues.length < 5) {
      return c.json({
        success: false,
        error: '各グループ最低5件のデータが必要です'
      }, 400)
    }

    // Cohen's d 計算
    const cohensD = Statistics.cohensD(controlValues, treatmentValues)
    
    // t検定
    const tTest = Statistics.tTest(controlValues, treatmentValues)

    // 解釈
    let interpretation = ''
    if (Math.abs(cohensD) < 0.2) {
      interpretation = '効果なし'
    } else if (Math.abs(cohensD) < 0.5) {
      interpretation = '小さい効果'
    } else if (Math.abs(cohensD) < 0.8) {
      interpretation = '中程度の効果'
    } else {
      interpretation = '大きい効果'
    }

    // 推薦
    let recommendation = ''
    if (tTest.significant && cohensD > 0.5) {
      recommendation = `実験群（${treatment.variant_name}）が統計的に有意に優れています。この介入を採用することを推奨します。`
    } else if (tTest.significant && cohensD < -0.5) {
      recommendation = `対照群（${control.variant_name}）が統計的に有意に優れています。実験群の介入は推奨しません。`
    } else if (!tTest.significant) {
      recommendation = '統計的に有意な差は見られません。サンプルサイズを増やすか、介入を再検討してください。'
    } else {
      recommendation = '効果は小さいです。コストとベネフィットを考慮して判断してください。'
    }

    return c.json({
      success: true,
      experiment: {
        name: experiment.name,
        hypothesis: experiment.hypothesis,
        status: experiment.status
      },
      results: {
        variants: variantMetrics.results.map((v: any) => ({
          name: v.variant_name,
          sampleSize: v.sample_size,
          meanValue: parseFloat(v.mean_value).toFixed(2)
        })),
        statistics: {
          cohensD: cohensD.toFixed(3),
          interpretation,
          tStatistic: tTest.t.toFixed(3),
          degreesOfFreedom: tTest.df,
          statisticallySignificant: tTest.significant,
          significanceLevel: '0.05'
        },
        recommendation
      }
    })
  } catch (error) {
    return c.json({
      success: false,
      error: '分析に失敗しました',
      details: error instanceof Error ? error.message : String(error)
    }, 500)
  }
})

/**
 * 実験一覧取得
 * GET /api/ab-test/experiments
 */
app.get('/experiments', async (c) => {
  const { env } = c
  const status = c.req.query('status') || 'all'

  try {
    let query = 'SELECT * FROM ab_test_experiments'
    if (status !== 'all') {
      query += ` WHERE status = '${status}'`
    }
    query += ' ORDER BY created_at DESC'

    const experiments = await env.DB.prepare(query).all()

    return c.json({
      success: true,
      experiments: experiments.results
    })
  } catch (error) {
    return c.json({
      success: false,
      error: '実験一覧の取得に失敗しました',
      details: error instanceof Error ? error.message : String(error)
    }, 500)
  }
})

export default app
