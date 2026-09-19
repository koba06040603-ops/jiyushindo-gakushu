# AIモデル選定レポート（2026-09 実測ベンチマーク）

自由進度学習支援システムで使用する Gemini モデルを、**実際のプロダクションプロンプトで計測**し、
タスク特性に応じて再選定した記録。推測やリリースノートではなく、全て実測値に基づく。

---

## 1. 結論（採用構成）

| ティア | 定数 | 採用モデル | 主な用途 | 実測 |
|--------|------|-----------|---------|------|
| **品質重視** | `GEMINI_MODEL_QUALITY` | `gemini-3.7-flash` | カード生成・問題生成・コース生成 | 17秒 / 品質 54.9/60 |
| **バランス** | `GEMINI_MODEL_BALANCED` | `gemini-3.8-flash` | 採点・要約・レポート | 21秒 / 品質 52-58 |
| **軽量・高頻度** | `GEMINI_MODEL_LITE` | `gemini-3.5-flash-lite` | 状態分析・短文FB・チャット | 約1.0秒 / 品質 100% |

**フォールバック連鎖**（全て 200 応答を実測確認済み）

```
quality : 3.7-flash → 3.8-flash → 3.5-flash → 3-flash-preview
balanced: 3.8-flash → 3.7-flash → 3.5-flash
lite    : 3.5-flash-lite → 3.1-flash-lite → 3.5-flash
```

---

## 2. 主要タスク：学習カード / 問題生成

実運用と同一条件（10枚生成・児童プロファイル付き・`responseSchema` 適用）で
各モデル5回×2ラウンド実行。品質は教育専門家ロールの LLM-as-Judge（`gemini-3.1-pro-preview`, temperature=0）で
6観点×10点＝60点満点を厳格採点。

| モデル | 成功率 | 平均時間 | 品質(/60) | 機械検証エラー | 判定 |
|--------|--------|---------|-----------|--------------|------|
| **gemini-3.7-flash** | 10/10 | **17.2s** | **54.9** | 0.4 | ✅ **採用** |
| gemini-3.8-flash | 10/10 | 21.0s | 52.2 | 0.2 | 採用（バランス層） |
| gemini-3.5-flash | 10/10 | 49.3s | 54.6 | 0.8 | ⬇️ 降格（**2.9倍遅い**） |
| gemini-3-flash-preview | 5/5 | 34.9s | 55.0 | 2.2 | フォールバック |

**降格理由**：旧プライマリの `gemini-3.5-flash` は品質こそ同等だが、
思考トークンを 6,700〜8,400 消費して **49秒**かかる。`3.7-flash` は 730トークン・17秒で同等品質に到達する。
教師が授業準備中に待つ時間が **1/3 になる**のは、教育現場での実用性に直結する。

---

## 3. 最重要の発見：`responseSchema` なしでは JSON が壊れる

`responseMimeType: 'application/json'` だけでは、10枚カード生成時に **JSON構造が高頻度で破損**していた。

| モデル | schema なし | schema あり |
|--------|------------|------------|
| gemini-3.8-flash | 成功 **2/6** | 成功 **6/6** |
| gemini-3.7-flash | 成功 **3/6** | 成功 **6/6** |

**破損の実態**：`finishReason` は `STOP`（＝トークン切れではない）にもかかわらず、
末尾に余分な閉じ括弧が付く（`...}]}]`）、文字列が未終端になる等。
つまり `maxOutputTokens` を増やしても解決しない種類の障害であり、
**`responseSchema` による構造強制が唯一の有効な対策**だった。

→ `src/gemini-schemas.ts` に全スキーマを定義し、`buildGeminiConfig()` 経由で付与する方式に統一。

---

## 4. 軽量タスク：学習状態分析・フィードバック

| モデル | 応答時間 | 思考トークン | 品質 |
|--------|---------|------------|------|
| **gemini-3.5-flash-lite** | 1.0-1.2s | 0 | 100% ✅ 採用 |
| gemini-3.1-flash-lite | 0.9s | 0 | 100% |
| gemini-3.5-flash（参考） | 3.5-4.5s | 558-828 | 100% |

児童の解答ごとに走る高頻度タスクでは、Lite 系が品質を落とさず **3〜4倍高速**。
上位モデルを使う意味がないためコストと待ち時間の両面で Lite を採用。

---

## 5. 発見・修正した不具合

ベンチマーク過程で、**本番稼働中のコードが参照するモデルの多くが提供終了（404）**していることが判明した。

### 5-1. 404 になっていたモデル参照（6箇所）

`gemini-2.0-flash` / `gemini-2.0-flash-lite` / `gemini-omni-flash` / `gemini-2.5-flash-lite` は
いずれも現在 **404**。これにより以下の児童向け機能が動作不能だった。

| エンドポイント | 機能 | 状態 |
|--------------|------|------|
| `/api/ai/kanji-convert` | 漢字変換 | ❌→✅ 復活確認 |
| `/api/ai/why-exploration` | 「なぜ」探究 | ❌→✅ 復活確認 |
| `/api/ai/generate-mindmap` | マインドマップ生成 | ❌→✅ |
| `/api/ai/recognize-handwriting` | 手書き認識 | ❌→✅ |
| `/api/ai/generate-nb2-narration` | ナレーション生成 | ❌→✅ |
| `/api/fix-all-examples` | 例題一括修正 | ❌→✅ |

またフォールバック連鎖の末端（`GEMINI_MODEL_LEGACY = 'gemini-2.0-flash'`）も 404 だったため、
**上位モデルが失敗した際の最終防衛線が機能していなかった**。

### 5-2. テンプレートリテラルのクォートバグ

```ts
// 修正前（シングルクォート → ${} が展開されずリテラル文字列のままURLに入り必ず404）
'https://...../models/${GEMINI_MODEL_QUALITY}:generateContent?key=' + apiKey

// 修正後
`https://...../models/${GEMINI_MODEL_QUALITY}:generateContent?key=${apiKey}`
```

`/api/curriculum/:curriculumId/generate-additional-problems`（追加問題生成）が
この記述ミスにより常時失敗していた。

---

## 6. 教育品質ゲート（新規実装）

`responseSchema` は「型」は保証するが、**教育上の意味的制約は保証しない**。
実測でも、スキーマ適用後でさえ 6枚中2枚で例題の答えが本題と重複していた。
LLM-as-Judge でも全モデル共通で `scaffolding`（足場）と `leak_safety`（漏洩）だけがスコアを落としており、
これはモデル選定では解決できない課題である。

そこで `enforceCardQuality()`（`src/index.tsx`）をサーバー側に実装した。

| 検出項目 | 是正動作 | 教育上の理由 |
|---------|---------|------------|
| ヒント・AIメッセージへの**答えの漏洩** | 正解文字列を `●●` に伏字化 | 答えが見えると学習効果がゼロになる |
| `new_terms`・教師ヘルプへの答え混入 | 該当要素を除去 | 同上 |
| **例題の答えが本題と重複** | 例題をクリアし再生成フローへ | 例題を見るだけで本題が解けてしまう |
| 採点キーワード不足（3個未満） | 自動補完 | 自動採点が機能しなくなる |
| 解説100字未満 | 警告ログ | 途中式のない解説は理解につながらない |

### 適用後の実測（8枚生成 × 3回）

```
run 1: ✅ 8枚 19秒 | 答え漏洩=0 例題重複=0 解説不足=0
run 2: ✅ 8枚 18秒 | 答え漏洩=0 例題重複=0 解説不足=0
run 3: ✅ 8枚 17秒 | 答え漏洩=0 例題重複=0 解説不足=1
```

3回とも品質ゲートが違反を検出・是正している（例：`カード2: hints[2] に答え「12」が漏洩 → 伏字化`）。
**これらは従来そのまま児童に届いていた**内容である。

---

## 7. 使用状況の確認方法（運用）

モデルは提供終了が予告なく起こる（実際に 2026-09 に gemini-2.0 系が一斉終了し
6機能が無言で壊れていた）。以下2つの手段で定期的に確認すること。

### 7-1. 監査API（admin限定・本番で使える）

```
GET /api/admin/model-audit          # 構成一覧のみ（即時）
GET /api/admin/model-audit?live=1   # 実APIを叩いて生死確認（約15秒）
```

`live=1` は全モデルへ実際にリクエストを送り、`alive` 判定を返す。
画像は `responseModalities:['IMAGE']`、TTS は読み上げ指示文＋`['AUDIO']` と
**用途別の正しいパラメータで検査**する（単語だけ渡すとTTSが誤検知するため）。

```json
{ "summary": { "total": 11, "alive": 11, "dead": 0 }, "alert": "✅ 全モデル正常" }
```

### 7-2. 静的監査スクリプト（開発時）

```bash
node scripts/bench/audit-models.mjs --live
```

エンドポイント別の使用モデル一覧、ハードコード箇所、未使用定数、
**シングルクォート内 `${}` の展開バグ**を検出する。

### 現在の状態（2026-09 時点）

| 項目 | 状態 |
|------|------|
| Gemini API 呼び出し総数 | 85箇所 |
| 定数管理 | 71箇所 |
| **ハードコード** | **0箇所** ✅ |
| テンプレート展開バグ | 0箇所 ✅ |
| モデル生存 | **11/11** ✅ |

### モデル割り当て一覧

| 区分 | 定数 | モデル | 主な適用先 |
|------|------|--------|-----------|
| テキスト品質 | `GEMINI_MODEL_QUALITY` | gemini-3.7-flash | カード/問題/コース生成、単元分析、記述採点 |
| テキスト軽量 | `GEMINI_MODEL_LITE` | gemini-3.5-flash-lite | AIチャット、誤答分析、励まし、振り返り分析 |
| 画像 | `GEMINI_MODEL_IMAGE` | gemini-3.1-flash-image | ヒント画像、絵本、触覚ウィジェット、教材図版 |
| 画像(高品質) | `GEMINI_MODEL_IMAGE_PRO` | gemini-3-pro-image | `/api/ai/generate-image` の第1段 |
| 音声 | `GEMINI_MODEL_TTS` | gemini-2.5-flash-preview-tts | `/api/ai/tts` 読み上げ |

> 注: `gemini-omni-flash` 系は `generateContent` 非対応（"This model only supports
> Interactions API"）のため定数ごと廃止した。

---

## 8. 実装ファイル

| ファイル | 内容 |
|---------|------|
| `src/gemini-schemas.ts` | 構造化出力スキーマ、`buildGeminiConfig()`、堅牢JSONパーサ `parseGeminiJSON()` |
| `src/index.tsx` L118-180 | モデル定数のティア化と `getModelChain()` |
| `src/index.tsx` `enforceCardQuality()` | 教育品質ゲート |
| `scripts/bench/bench-models.mjs` | タスク別モデル比較 |
| `scripts/bench/bench-quality.mjs` | 10枚生成 + LLM-as-Judge 品質評価 |
| `scripts/bench/bench-stability.mjs` | N回並列実行による安定性・分散計測 |
| `scripts/bench/test-schema.mjs` | responseSchema 有無の A/B 検証 |
| `scripts/bench/audit-models.mjs` | モデル使用状況の静的監査＋生死確認 |
| `src/index.tsx` `GET /api/admin/model-audit` | 運用時のモデル監査API（admin限定） |

### 再検証の方法

```bash
cd /home/user/webapp
node scripts/bench/bench-models.mjs --tasks card,lite,feedback   # タスク別比較
node scripts/bench/test-schema.mjs gemini-3.7-flash              # スキーマ効果
N=5 node scripts/bench/bench-stability.mjs gemini-3.7-flash      # 安定性
```

新しいモデルが出た際は、上記を実行して本レポートの表を更新すること。
**リリースノートの性能主張ではなく、自分たちの実プロンプトでの実測値で判断する**のが本システムの方針。

---

## 9. 既知の限界

- **LLM-as-Judge のスコアには分散がある**（同一モデルで 46〜59 のばらつき）。
  単発の結果でモデルを決めず、最低5回試行の平均で判断すること。
- `scaffolding`（ヒントの足場設計）は全モデルで 7〜8点に留まる。
  「ヒント3で通分結果を直接与えてしまう」傾向はモデル横断で共通しており、
  プロンプト側の改善余地が残っている（品質ゲートは漏洩の伏字化までしか対応しない）。
- 画像・音声系モデル（`gemini-3.1-flash-image` 等）は本ベンチの対象外。

---

## 10. 本番デプロイ記録（2026-09-19）

### デプロイ先
既存の本番環境をそのまま更新（URL・D1の児童データ・R2の教材はすべて維持）。

| 項目 | 値 |
|------|-----|
| 本番URL | https://jiyushindo-gakushu.pages.dev |
| Cloudflare プロジェクト | `jiyushindo-gakushu`（ユーザー所有アカウント / BYOK） |
| ブランチ | main |
| D1 / KV / R2 | 既存バインディングを継続利用（スキーマ変更なし・マイグレーション不要） |

### デプロイで発覚した重大障害：本番APIキーの失効

デプロイ後に新設の監査API（`?live=1`）を実行したところ、**本番の全11モデルが 403** を返した。

```
Your API key was reported as leaked. Please use another API key.
```

本番の `GEMINI_API_KEY` が Google に漏洩キーとして無効化されており、
**AI機能（カード生成・チャット・画像生成など）が全面停止していた**。
デプロイ前から停止していた可能性が高いが、誰も気づいていなかった。

→ 有効な鍵で `wrangler pages secret put GEMINI_API_KEY` を実行し再デプロイ。全11モデル復旧。

**この障害は、まさに監査APIを作った目的どおりの検知だった。**
定期的に `?live=1` を実行する運用を推奨する。

### 漏洩の原因（未対応の課題）

git 履歴に `.dev.vars` が含まれていた形跡があり、GitHub リモートが設定されている。

```
origin  https://github.com/koba06040603-ops/jiyushindo-gakushu.git
7e428c0 Remove tracked .wrangler, .dev.vars, dist from git
```

- **現状**: `.dev.vars` は `.gitignore` 済み・git非追跡・`dist` にも鍵は焼き込まれていない（確認済み）
- **ただし**: 過去コミット `7e428c0^` に旧鍵（`...bnPo`）が残存。GitHub が公開リポジトリなら
  クローラが検出し Google に通報された可能性が高い
- **現行鍵（`...fVvc`）は履歴中の鍵とは別物**のため即座の危険はない

**推奨対応（要判断）**
1. GitHub リポジトリが public なら private に変更する
2. 履歴から鍵を除去する（`git filter-repo` 等）。ただし履歴改変は影響が大きいため要検討
3. 旧鍵 `...bnPo` を Google AI Studio で明示的に失効させる
4. 今後は本番鍵を `.dev.vars` に置かず、`wrangler pages secret` のみで管理する

### デプロイ後の検証結果

| 項目 | 結果 |
|------|------|
| トップページ / ログイン | ✅ 200・既存本番DBで認証成功 |
| モデル監査 `?live=1` | ✅ 11/11 alive |
| カード生成（6枚） | ✅ 18秒・答え漏洩0・例題重複0・解説不足0 |
| 復旧した機能 | ✅ 漢字変換・なぜ探究・マインドマップ |
| 静的アセット | ✅ `/static/app.js`・`/manifest.json` とも 200 |

---

## 11. 本番障害の修正記録：単元保存エラー（2026-09-19）

### 症状
本番で「この単元を保存して使用する」を押すと保存に失敗していた。

```
D1_ERROR: no such column: unit_id at offset 36: SQLITE_ERROR
```

### 原因：本番とローカルで optional_problems のスキーマが乖離

| | カラム |
|---|---|
| **本番** | problem_id, **curriculum_id**, problem_number, problem_title, problem_description, **problem_content**, difficulty_level, learning_meaning, created_at, updated_at |
| **ローカル** | problem_id, **unit_id**, problem_title, problem_type, difficulty_level, **content**, created_at, school_id |
| 共通 | problem_id, problem_title, difficulty_level, created_at |

コードはローカルスキーマ（`unit_id` / `content`）前提で書かれており、本番では列が存在せず失敗していた。

### 対応：スキーマ互換レイヤー（既存の hint_cards と同方式）

`src/index.tsx` に以下を実装。失敗したら反対スキーマで自動再試行し、成功した方を記憶する。

| 関数 | 役割 |
|------|------|
| `optExec()` | スキーマ切替つき実行（run / all 両対応） |
| `optInsert()` | 本番は正規化カラム、ローカルは content にJSON集約して保存 |
| `optSelectByCurriculum()` | 読み出し時にローカルの content(JSON) を展開し本番形式へ正規化 |
| `optDeleteByCurriculum()` | 単元IDでの削除 |

初期値は**本番スキーマ優先**（本番での失敗を最小化するため）。

### 併せて修正した潜在バグ

- 選択問題の**削除・更新が存在しない主キー `id` を参照**していた（正しくは `problem_id`）
- 選択課題取得のフォールバックが try / catch 両方とも `unit_id` で、**多段化が無意味**だった
- 解答一覧JOIN・統計クエリ・単元複製も本番非対応カラムを直接参照していた

### 検証方法

ローカルDBの `optional_problems` を**本番と同一スキーマに一時入替**して両系統を実測した
（検証後、トリガー11件を含め完全復元済み）。

| スキーマ | 保存 | 読み出し |
|---------|------|---------|
| ローカル（unit_id） | ✅ 2件 | ✅ 2件（JSON展開が正常） |
| 本番（curriculum_id） | ✅ 2件 | ✅ 2件（正規化カラムへ正しく格納） |

### 本番デプロイ後の確認

| 項目 | 結果 |
|------|------|
| 単元保存 | ✅ 成功（選択問題2件とも保存） |
| 選択問題の読み出し | ✅ desc / content / meaning すべて復元 |
| 単元削除 | ✅ 正常（テストデータは削除済み） |
| カード生成 | ✅ 6枚14秒・漏洩0・重複0 |
| モデル監査 | ✅ 11/11 正常 |

### 教訓

**ローカルDBと本番DBのスキーマが乖離していると、ローカルでどれだけテストしても本番で落ちる。**
今回のように本番のみ存在するカラム構成がある場合は、
`/api/debug/schema` で本番の実スキーマを確認してから実装すること。
