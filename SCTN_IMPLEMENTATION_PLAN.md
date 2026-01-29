# ScTN質問紙・全国調査統合 実装計画書

## 📋 概要

本ドキュメントは、ScTN質問紙と全国学力・学習状況調査を自由進度学習支援システムに統合する実装計画書です。

## 🎯 実装の目的

1. **エビデンスベースの教育実践**: 客観的データに基づく指導改善
2. **形成的評価の充実**: 継続的な学習支援とフィードバック
3. **研究的価値の創出**: 論文執筆の根拠データとして活用
4. **文科省方針との完全整合**: 次期学習指導要領への対応

## 🗓️ 実装スケジュール（16週間）

### Phase 1: データベース構築（Week 1-4）

#### Week 1-2: ScTN質問紙データベース

**優先度**: 🔴 最高

**実装内容**:
```sql
-- migrations/0008_sctn_assessments.sql
CREATE TABLE sctn_assessments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id TEXT NOT NULL,
  curriculum_id TEXT NOT NULL,
  
  -- 学校教育の経験（5観点、1-5段階）
  authentic_learning_score INTEGER CHECK(authentic_learning_score BETWEEN 1 AND 5),
  inquiry_learning_score INTEGER CHECK(inquiry_learning_score BETWEEN 1 AND 5),
  individual_learning_score INTEGER CHECK(individual_learning_score BETWEEN 1 AND 5),
  collaborative_learning_score INTEGER CHECK(collaborative_learning_score BETWEEN 1 AND 5),
  democratic_life_score INTEGER CHECK(democratic_life_score BETWEEN 1 AND 5),
  
  -- 学びに向かう力（1-5段階）
  self_regulation_score INTEGER CHECK(self_regulation_score BETWEEN 1 AND 5),
  mutual_regulation_score INTEGER CHECK(mutual_regulation_score BETWEEN 1 AND 5),
  persistence_score INTEGER CHECK(persistence_score BETWEEN 1 AND 5),
  
  -- 人間性（1-5段階）
  self_efficacy_score INTEGER CHECK(self_efficacy_score BETWEEN 1 AND 5),
  acceptance_to_others_score INTEGER CHECK(acceptance_to_others_score BETWEEN 1 AND 5),
  acceptance_from_others_score INTEGER CHECK(acceptance_from_others_score BETWEEN 1 AND 5),
  
  -- メタ情報
  assessment_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  assessment_type TEXT DEFAULT 'pre' CHECK(assessment_type IN ('pre', 'mid', 'post')),
  notes TEXT,
  
  INDEX idx_student_curriculum (student_id, curriculum_id),
  INDEX idx_assessment_date (assessment_date)
);
```

**API実装**:
```typescript
// src/index.tsx に追加

// ScTN診断結果保存API
app.post('/api/sctn/assessment', async (c) => {
  const { env } = c
  const data = await c.req.json()
  
  try {
    await env.DB.prepare(`
      INSERT INTO sctn_assessments (
        student_id, curriculum_id,
        authentic_learning_score, inquiry_learning_score,
        individual_learning_score, collaborative_learning_score,
        democratic_life_score, self_regulation_score,
        mutual_regulation_score, persistence_score,
        self_efficacy_score, acceptance_to_others_score,
        acceptance_from_others_score, assessment_type, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      data.student_id, data.curriculum_id,
      data.authentic_learning, data.inquiry_learning,
      data.individual_learning, data.collaborative_learning,
      data.democratic_life, data.self_regulation,
      data.mutual_regulation, data.persistence,
      data.self_efficacy, data.acceptance_to_others,
      data.acceptance_from_others, data.assessment_type || 'pre',
      data.notes || null
    ).run()
    
    return c.json({ success: true })
  } catch (error) {
    console.error('ScTN診断保存エラー:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// ScTN診断結果取得API
app.get('/api/sctn/assessment/:studentId/:curriculumId', async (c) => {
  const { env } = c
  const { studentId, curriculumId } = c.req.param()
  
  try {
    const results = await env.DB.prepare(`
      SELECT * FROM sctn_assessments
      WHERE student_id = ? AND curriculum_id = ?
      ORDER BY assessment_date DESC
    `).bind(studentId, curriculumId).all()
    
    return c.json({ success: true, assessments: results.results })
  } catch (error) {
    return c.json({ success: false, error: error.message }, 500)
  }
})
```

**フロントエンド実装**:
```javascript
// public/static/sctn-assessment.js

window.ScTNAssessment = {
  // ScTN診断モーダル表示
  show: function(curriculumId) {
    const modal = document.createElement('div')
    modal.id = 'sctn-assessment-modal'
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'
    modal.innerHTML = `
      <div class="bg-white rounded-lg p-8 max-w-4xl max-h-screen overflow-y-auto">
        <h2 class="text-2xl font-bold mb-6">
          📊 学びの実態調査（ScTN質問紙）
        </h2>
        
        <p class="mb-6 text-gray-600">
          この調査は、あなたの学びの様子を知るためのものです。
          成績には関係ありませんので、正直に答えてください。
        </p>
        
        <!-- 本物の学び -->
        <div class="mb-8">
          <h3 class="text-xl font-bold mb-4 text-blue-600">📖 本物の学び</h3>
          
          <div class="mb-4">
            <p class="mb-2 font-semibold">Q1. 社会の話題や身近な事例を使って学んでいますか？</p>
            <div class="flex gap-2">
              ${this.createRatingButtons('authentic_q1', 5)}
            </div>
          </div>
          
          <div class="mb-4">
            <p class="mb-2 font-semibold">Q2. 自分が授業を進めていると感じますか？</p>
            <div class="flex gap-2">
              ${this.createRatingButtons('authentic_q2', 5)}
            </div>
          </div>
        </div>
        
        <!-- 探究の学び -->
        <div class="mb-8">
          <h3 class="text-xl font-bold mb-4 text-green-600">🔍 探究の学び</h3>
          
          <div class="mb-4">
            <p class="mb-2 font-semibold">Q3. 自分で問いを立てて学んでいますか？</p>
            <div class="flex gap-2">
              ${this.createRatingButtons('inquiry_q1', 5)}
            </div>
          </div>
          
          <div class="mb-4">
            <p class="mb-2 font-semibold">Q4. 試行錯誤を繰り返していますか？</p>
            <div class="flex gap-2">
              ${this.createRatingButtons('inquiry_q2', 5)}
            </div>
          </div>
        </div>
        
        <!-- 個別の学び -->
        <div class="mb-8">
          <h3 class="text-xl font-bold mb-4 text-purple-600">👤 個別の学び</h3>
          
          <div class="mb-4">
            <p class="mb-2 font-semibold">Q5. 自分のペースで学習を選んでいますか？</p>
            <div class="flex gap-2">
              ${this.createRatingButtons('individual_q1', 5)}
            </div>
          </div>
          
          <div class="mb-4">
            <p class="mb-2 font-semibold">Q6. 先生が自分に合わせて教えてくれますか？</p>
            <div class="flex gap-2">
              ${this.createRatingButtons('individual_q2', 5)}
            </div>
          </div>
        </div>
        
        <!-- 協同の学び -->
        <div class="mb-8">
          <h3 class="text-xl font-bold mb-4 text-orange-600">👥 協同の学び</h3>
          
          <div class="mb-4">
            <p class="mb-2 font-semibold">Q7. 必要な時に仲間と協力していますか？</p>
            <div class="flex gap-2">
              ${this.createRatingButtons('collaborative_q1', 5)}
            </div>
          </div>
          
          <div class="mb-4">
            <p class="mb-2 font-semibold">Q8. 他の人の考えを学びに生かしていますか？</p>
            <div class="flex gap-2">
              ${this.createRatingButtons('collaborative_q2', 5)}
            </div>
          </div>
        </div>
        
        <!-- 学びに向かう力 -->
        <div class="mb-8">
          <h3 class="text-xl font-bold mb-4 text-red-600">🎯 学びに向かう力</h3>
          
          <div class="mb-4">
            <p class="mb-2 font-semibold">Q9. 自分で目標や計画を立てて学んでいますか？</p>
            <div class="flex gap-2">
              ${this.createRatingButtons('self_regulation', 5)}
            </div>
          </div>
          
          <div class="mb-4">
            <p class="mb-2 font-semibold">Q10. できるまでやり続けることができますか？</p>
            <div class="flex gap-2">
              ${this.createRatingButtons('persistence', 5)}
            </div>
          </div>
        </div>
        
        <div class="flex gap-4 mt-8">
          <button onclick="ScTNAssessment.submit('${curriculumId}')" 
                  class="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded font-bold flex-1">
            診断結果を保存
          </button>
          <button onclick="ScTNAssessment.close()" 
                  class="bg-gray-300 hover:bg-gray-400 text-gray-800 px-6 py-3 rounded font-bold">
            キャンセル
          </button>
        </div>
      </div>
    `
    document.body.appendChild(modal)
  },
  
  // 評価ボタン作成
  createRatingButtons: function(name, max) {
    const labels = ['全くない', 'あまりない', 'ときどき', 'よくある', 'いつも']
    let html = ''
    for (let i = 1; i <= max; i++) {
      html += `
        <button type="button" 
                class="rating-btn px-4 py-2 border-2 border-gray-300 rounded hover:bg-blue-100 focus:bg-blue-500 focus:text-white"
                data-name="${name}" data-value="${i}">
          ${i}<br><span class="text-xs">${labels[i-1]}</span>
        </button>
      `
    }
    return html
  },
  
  // 診断結果送信
  submit: async function(curriculumId) {
    const responses = {}
    
    // 全てのボタンから選択値を取得
    document.querySelectorAll('.rating-btn.bg-blue-500').forEach(btn => {
      const name = btn.getAttribute('data-name')
      const value = parseInt(btn.getAttribute('data-value'))
      responses[name] = value
    })
    
    // 平均スコア計算
    const data = {
      student_id: window.currentUser.id,
      curriculum_id: curriculumId,
      authentic_learning: Math.round((responses.authentic_q1 + responses.authentic_q2) / 2),
      inquiry_learning: Math.round((responses.inquiry_q1 + responses.inquiry_q2) / 2),
      individual_learning: Math.round((responses.individual_q1 + responses.individual_q2) / 2),
      collaborative_learning: Math.round((responses.collaborative_q1 + responses.collaborative_q2) / 2),
      democratic_life: 3, // 簡易版では省略
      self_regulation: responses.self_regulation,
      mutual_regulation: 3, // 簡易版では省略
      persistence: responses.persistence,
      self_efficacy: 3, // 簡易版では省略
      acceptance_to_others: 3, // 簡易版では省略
      acceptance_from_others: 3, // 簡易版では省略
      assessment_type: 'pre'
    }
    
    try {
      const response = await axios.post('/api/sctn/assessment', data)
      if (response.data.success) {
        window.showToast('診断結果を保存しました', 'success')
        this.close()
      } else {
        window.showToast('保存に失敗しました', 'error')
      }
    } catch (error) {
      console.error('保存エラー:', error)
      window.showToast('エラーが発生しました', 'error')
    }
  },
  
  // モーダルを閉じる
  close: function() {
    const modal = document.getElementById('sctn-assessment-modal')
    if (modal) modal.remove()
  }
}

// 評価ボタンのクリックハンドラ（イベント委譲）
document.addEventListener('click', function(e) {
  if (e.target.classList.contains('rating-btn') || e.target.closest('.rating-btn')) {
    const btn = e.target.closest('.rating-btn') || e.target
    const name = btn.getAttribute('data-name')
    
    // 同じグループの他のボタンの選択を解除
    document.querySelectorAll(`.rating-btn[data-name="${name}"]`).forEach(b => {
      b.classList.remove('bg-blue-500', 'text-white')
      b.classList.add('border-gray-300')
    })
    
    // クリックされたボタンを選択状態に
    btn.classList.add('bg-blue-500', 'text-white')
    btn.classList.remove('border-gray-300')
  }
})
```

**成果物**:
- ✅ sctn_assessments テーブル
- ✅ ScTN診断保存・取得API
- ✅ ScTN診断フロントエンドUI

**テスト項目**:
1. データベーステーブル作成確認
2. 診断結果の保存確認
3. 診断結果の取得確認
4. UI動作確認

---

#### Week 3-4: 全国調査項目データベース

**優先度**: 🔴 最高

**実装内容**:
```sql
-- migrations/0009_national_survey_responses.sql
CREATE TABLE national_survey_responses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id TEXT NOT NULL,
  card_id TEXT NOT NULL,
  curriculum_id TEXT NOT NULL,
  
  -- 自己調整学習（1-4段階：4=当てはまる, 3=やや当てはまる, 2=あまり当てはまらない, 1=当てはまらない）
  q20_learning_strategy INTEGER CHECK(q20_learning_strategy BETWEEN 1 AND 4),
  q34_reflection_adjustment INTEGER CHECK(q34_reflection_adjustment BETWEEN 1 AND 4),
  q40_goal_setting INTEGER CHECK(q40_goal_setting BETWEEN 1 AND 4),
  
  -- 主体的な学び（1-4段階）
  q30_self_initiative INTEGER CHECK(q30_self_initiative BETWEEN 1 AND 4),
  q38_inquiry_activity INTEGER CHECK(q38_inquiry_activity BETWEEN 1 AND 4),
  q55_persistence_challenge INTEGER CHECK(q55_persistence_challenge BETWEEN 1 AND 4),
  
  -- 協働的な学び（1-4段階）
  q33_collaborative_thinking INTEGER CHECK(q33_collaborative_thinking BETWEEN 1 AND 4),
  q37_cooperation INTEGER CHECK(q37_cooperation BETWEEN 1 AND 4),
  q39_democratic_participation INTEGER CHECK(q39_democratic_participation BETWEEN 1 AND 4),
  
  -- ICT活用（1-4段階）
  q28_1_self_paced INTEGER CHECK(q28_1_self_paced BETWEEN 1 AND 4),
  q28_2_instant_search INTEGER CHECK(q28_2_instant_search BETWEEN 1 AND 4),
  q28_3_enjoyment INTEGER CHECK(q28_3_enjoyment BETWEEN 1 AND 4),
  q28_4_visual_understanding INTEGER CHECK(q28_4_visual_understanding BETWEEN 1 AND 4),
  q28_5_expression INTEGER CHECK(q28_5_expression BETWEEN 1 AND 4),
  q28_6_sharing_ideas INTEGER CHECK(q28_6_sharing_ideas BETWEEN 1 AND 4),
  q28_7_cooperation_ict INTEGER CHECK(q28_7_cooperation_ict BETWEEN 1 AND 4),
  
  -- メタ情報
  response_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_student_card (student_id, card_id),
  INDEX idx_curriculum (curriculum_id),
  INDEX idx_response_date (response_date)
);
```

**API実装**: Week 1-2と同様のパターンで実装

**フロントエンド実装**: 学習カード完了時に簡易質問フォームを表示

**成果物**:
- ✅ national_survey_responses テーブル
- ✅ 全国調査項目保存・取得API
- ✅ 学習カード完了時質問フォームUI

---

### Phase 2: データ統合・分析（Week 5-8）

#### Week 5-6: 統合ビュー作成

**優先度**: 🟡 高

**実装内容**:
```sql
-- migrations/0010_integrated_views.sql

-- 統合学習分析ビュー
CREATE VIEW integrated_learning_analysis AS
SELECT 
  sp.student_id,
  sp.curriculum_id,
  sp.card_id,
  sp.understanding_level,
  sp.help_request_count,
  sp.completed_at,
  sa.authentic_learning_score,
  sa.inquiry_learning_score,
  sa.individual_learning_score,
  sa.collaborative_learning_score,
  sa.self_regulation_score,
  sa.persistence_score,
  ns.q20_learning_strategy,
  ns.q34_reflection_adjustment,
  ns.q33_collaborative_thinking,
  ns.q28_1_self_paced,
  ns.q28_6_sharing_ideas
FROM student_progress sp
LEFT JOIN sctn_assessments sa ON sp.student_id = sa.student_id 
  AND sp.curriculum_id = sa.curriculum_id
LEFT JOIN national_survey_responses ns ON sp.student_id = ns.student_id 
  AND sp.card_id = ns.card_id;

-- 自己調整学習スコアビュー
CREATE VIEW self_regulation_scores AS
SELECT 
  student_id,
  curriculum_id,
  AVG(q40_goal_setting) as forethought_score,
  AVG(q20_learning_strategy) as performance_score,
  AVG(q34_reflection_adjustment) as reflection_score,
  (AVG(q40_goal_setting) + AVG(q20_learning_strategy) + AVG(q34_reflection_adjustment)) / 3 as overall_srl_score
FROM national_survey_responses
GROUP BY student_id, curriculum_id;
```

**成果物**:
- ✅ 統合分析ビュー
- ✅ 自己調整学習スコアビュー

---

#### Week 7-8: 分析API実装

**優先度**: 🟡 高

**実装内容**: 個人プロファイルAPI、クラス分析API、傾向分析API

**成果物**:
- ✅ `/api/analytics/student-profile/:studentId/:curriculumId`
- ✅ `/api/analytics/class-analysis/:classCode/:curriculumId`
- ✅ `/api/analytics/self-regulation-support/:studentId`

---

### Phase 3: 可視化機能（Week 9-12）

#### Week 9-10: 個人ダッシュボード

**優先度**: 🟢 中

**実装内容**: レーダーチャート、推移グラフ、スコア表示

**成果物**:
- ✅ ScTN 4観点レーダーチャート
- ✅ 自己調整学習3段階推移グラフ

---

#### Week 11-12: クラスダッシュボード

**優先度**: 🟢 中

**実装内容**: クラス平均、分布グラフ、支援必要児童抽出

**成果物**:
- ✅ クラス全体ScTN平均表示
- ✅ 支援が必要な児童一覧

---

### Phase 4: 学習カード改善（Week 13-14）

**優先度**: 🟢 中

**実装内容**: ScTN対応プロンプト追加

---

### Phase 5: 評価機能（Week 15-16）

**優先度**: 🟢 中

**実装内容**: 形成的評価フォーム、評価レポート生成

---

## 📊 実装の優先順位

### 最優先（MVP）
1. Week 1-2: ScTN質問紙データベース
2. Week 3-4: 全国調査項目データベース
3. Week 5-6: 統合ビュー作成

### 高優先（Early Release）
4. Week 7-8: 分析API実装
5. Week 9-10: 個人ダッシュボード

### 中優先（継続改善）
6. Week 11-12: クラスダッシュボード
7. Week 13-14: 学習カード改善
8. Week 15-16: 評価機能

---

## 🧪 テスト計画

### ユニットテスト
- データベース操作
- API エンドポイント
- スコア計算ロジック

### 統合テスト
- ScTN診断フロー
- 全国調査項目フロー
- データ統合・分析

### ユーザーテスト
- 児童による診断操作性
- 教師によるダッシュボード使用感
- パフォーマンス確認

---

## 📈 成功指標（KPI）

### 技術指標
- データベース応答速度: < 100ms
- 診断完了率: > 90%
- データ保存成功率: > 99%

### 教育指標
- ScTN各観点の向上（単元前後比較）
- 自己調整学習スコアの向上
- 教師の授業改善実施率

### 研究指標
- データ蓄積量（n > 30児童 × 10単元）
- 相関分析の実施
- 論文執筆への活用

---

## 🔐 セキュリティ・プライバシー

### データ保護
- 個人情報の暗号化
- アクセス権限管理
- ログ記録

### 倫理的配慮
- 児童・保護者への説明と同意
- データ利用目的の明確化
- 匿名化処理

---

## 📚 参考資料

- [SCTN_NATIONAL_SURVEY_INTEGRATION.md](./SCTN_NATIONAL_SURVEY_INTEGRATION.md) - 詳細ドキュメント
- [FINAL_THEORY_INTEGRATION.md](./FINAL_THEORY_INTEGRATION.md) - 理論統合モデル
- [MOE_ALIGNMENT_REPORT.md](./MOE_ALIGNMENT_REPORT.md) - 文科省整合性レポート

---

**最終更新**: 2026年1月29日  
**バージョン**: 1.0.0  
**作成者**: システム開発チーム
