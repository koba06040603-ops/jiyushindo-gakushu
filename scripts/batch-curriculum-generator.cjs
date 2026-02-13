/**
 * 堅牢なカリキュラムデータバッチ生成システム
 * 
 * 戦略:
 * - 1組み合わせずつ順次生成（レート制限回避）
 * - 出版社ごとにSQLファイル分割保存
 * - 既存実データはスキップ
 * - リトライ + 指数バックオフ
 * - 中断復帰可能（完了分はSQLに保存済み）
 */

const fs = require('fs');
const path = require('path');

const GEMINI_API_KEY = 'AIzaSyA9XZlvZxX80n3UGIziXsTKtClch0WIp3M';
const RETRY_LIMIT = 3;
const BASE_DELAY_MS = 1500; // API呼び出し間のベース遅延
const MODEL = 'gemini-3-flash-preview';

const PUBLISHERS = ['東京書籍', '大日本図書', '学校図書', '教育出版', '啓林館'];
const GRADES = ['小学1年', '小学2年', '小学3年', '小学4年', '小学5年', '小学6年', '中学1年', '中学2年', '中学3年'];

const SUBJECTS_BY_GRADE = {
  '小学1年': ['算数', '国語', '生活'],
  '小学2年': ['算数', '国語', '生活'],
  '小学3年': ['算数', '国語', '理科', '社会'],
  '小学4年': ['算数', '国語', '理科', '社会'],
  '小学5年': ['算数', '国語', '理科', '社会', '英語'],
  '小学6年': ['算数', '国語', '理科', '社会', '英語'],
  '中学1年': ['数学', '国語', '理科', '社会', '英語'],
  '中学2年': ['数学', '国語', '理科', '社会', '英語'],
  '中学3年': ['数学', '国語', '理科', '社会', '英語']
};

// 既存の実データがある組み合わせ（スキップ対象）
const EXISTING_REAL_DATA = [
  { grade: '小学5年', subject: '算数', publisher: '東京書籍' },
  { grade: '小学6年', subject: '社会', publisher: '東京書籍' }
];

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function isExistingRealData(grade, subject, publisher) {
  return EXISTING_REAL_DATA.some(d => 
    d.grade === grade && d.subject === subject && d.publisher === publisher
  );
}

/**
 * Gemini APIで単元名リストを生成
 */
async function generateUnits(publisher, grade, subject, retryCount = 0) {
  const prompt = `あなたは日本の教育課程に精通した専門家です。以下の条件で、実際の教科書に記載されている単元名のリストをJSON配列で出力してください。

条件: 出版社=${publisher}, 学年=${grade}, 教科=${subject}

要求:
1. 実際の${publisher}の${grade}${subject}教科書に記載されている単元名を正確に列挙
2. 学習指導要領に準拠した実際の教科書の章立てに基づく
3. 年間を通して学習する順序で並べる
4. 10〜15個程度

出力形式: ["単元名1", "単元名2", ...] のJSON配列のみ。説明文や補足は一切不要。`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000); // 30秒タイムアウト

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 1500,
            responseMimeType: 'application/json'
          }
        }),
        signal: controller.signal
      }
    );

    clearTimeout(timeout);

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`API error ${response.status}: ${errText.substring(0, 200)}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    if (!text) {
      throw new Error('Empty response from API');
    }

    // JSON配列を抽出（応答がそのまま配列か、テキスト中に含まれるか）
    let units;
    try {
      units = JSON.parse(text);
    } catch {
      const jsonMatch = text.match(/\[[\s\S]*?\]/);
      if (!jsonMatch) throw new Error('JSON extraction failed');
      units = JSON.parse(jsonMatch[0]);
    }

    if (!Array.isArray(units) || units.length === 0) {
      throw new Error('Empty or invalid units array');
    }

    // 文字列配列を正規化
    const unitNames = units.map(u => typeof u === 'string' ? u : (u.unit_name || u.name || String(u)));

    return unitNames;
  } catch (error) {
    if (retryCount < RETRY_LIMIT) {
      const backoff = BASE_DELAY_MS * Math.pow(2, retryCount);
      console.warn(`  ⚠️ リトライ ${retryCount + 1}/${RETRY_LIMIT} (${backoff}ms後): ${error.message}`);
      await delay(backoff);
      return generateUnits(publisher, grade, subject, retryCount + 1);
    }
    throw error;
  }
}

/**
 * SQL INSERT文を生成
 */
function unitToSQL(grade, subject, publisher, unitName) {
  const escapedName = unitName.replace(/'/g, "''");
  const escapedGrade = grade.replace(/'/g, "''");
  const escapedSubject = subject.replace(/'/g, "''");
  const escapedPublisher = publisher.replace(/'/g, "''");
  return `INSERT INTO curriculum (grade, subject, textbook_company, unit_name) VALUES ('${escapedGrade}', '${escapedSubject}', '${escapedPublisher}', '${escapedName}');`;
}

/**
 * 出版社ごとにデータ生成・保存
 */
async function generateForPublisher(publisher, publisherIndex) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📚 出版社 ${publisherIndex + 1}/5: ${publisher}`);
  console.log('='.repeat(60));

  const allSQL = [];
  let successCount = 0;
  let failCount = 0;
  let totalUnits = 0;

  for (const grade of GRADES) {
    const subjects = SUBJECTS_BY_GRADE[grade] || [];
    for (const subject of subjects) {
      // 既存実データはスキップ
      if (isExistingRealData(grade, subject, publisher)) {
        console.log(`  ⏭️  スキップ（実データ既存）: ${grade} ${subject} ${publisher}`);
        continue;
      }

      try {
        const units = await generateUnits(publisher, grade, subject);
        const sqls = units.map(u => unitToSQL(grade, subject, publisher, u));
        allSQL.push(...sqls);
        successCount++;
        totalUnits += units.length;
        console.log(`  ✅ ${grade} ${subject}: ${units.length}単元`);

        // レート制限対策
        await delay(BASE_DELAY_MS);
      } catch (error) {
        failCount++;
        console.error(`  ❌ ${grade} ${subject}: ${error.message}`);
      }
    }
  }

  // SQLファイル保存
  const publisherSlug = {
    '東京書籍': 'tokyo_shoseki',
    '大日本図書': 'dainippon_tosho',
    '学校図書': 'gakko_tosho',
    '教育出版': 'kyoiku_shuppan',
    '啓林館': 'keirinkan'
  }[publisher] || 'unknown';

  const sqlContent = `-- ${publisher} カリキュラムデータ（Gemini API生成）
-- 生成日時: ${new Date().toISOString()}
-- 成功: ${successCount}組, 失敗: ${failCount}組, 総単元数: ${totalUnits}

${allSQL.join('\n')}
`;

  const sqlPath = path.join(__dirname, '..', 'migrations', `curriculum_${publisherSlug}.sql`);
  fs.writeFileSync(sqlPath, sqlContent, 'utf8');

  console.log(`\n  📄 SQL保存: ${sqlPath}`);
  console.log(`  📊 成功: ${successCount}, 失敗: ${failCount}, 単元数: ${totalUnits}`);

  return { publisher, successCount, failCount, totalUnits, sqlPath };
}

/**
 * メイン処理
 */
async function main() {
  // コマンドライン引数で出版社指定可能
  const targetPublisher = process.argv[2]; // 例: node script.cjs 東京書籍
  const startIndex = process.argv[3] ? parseInt(process.argv[3]) : 0;

  console.log('🚀 カリキュラムデータ バッチ生成システム');
  console.log(`📅 ${new Date().toISOString()}`);
  
  if (targetPublisher) {
    console.log(`🎯 対象出版社: ${targetPublisher}`);
  } else {
    console.log(`🎯 全出版社を順次生成（開始インデックス: ${startIndex}）`);
  }
  console.log('');

  const results = [];
  const publishers = targetPublisher 
    ? [targetPublisher] 
    : PUBLISHERS.slice(startIndex);

  for (let i = 0; i < publishers.length; i++) {
    const pubIndex = targetPublisher ? PUBLISHERS.indexOf(targetPublisher) : startIndex + i;
    const result = await generateForPublisher(publishers[i], pubIndex);
    results.push(result);
    
    // 出版社間に追加待機
    if (i < publishers.length - 1) {
      console.log(`\n⏳ 次の出版社まで3秒待機...`);
      await delay(3000);
    }
  }

  // 最終レポート
  console.log('\n' + '='.repeat(60));
  console.log('📊 最終レポート');
  console.log('='.repeat(60));
  
  let totalSuccess = 0, totalFail = 0, totalUnits = 0;
  for (const r of results) {
    console.log(`  ${r.publisher}: 成功${r.successCount}, 失敗${r.failCount}, ${r.totalUnits}単元`);
    totalSuccess += r.successCount;
    totalFail += r.failCount;
    totalUnits += r.totalUnits;
  }
  
  console.log(`\n  合計: 成功${totalSuccess}, 失敗${totalFail}, 総単元数${totalUnits}`);
  console.log('');
  console.log('次のステップ:');
  console.log('  1. ダミーデータ削除:');
  console.log("     npx wrangler d1 execute jiyushindo-gakushu-production --local --command=\"DELETE FROM curriculum WHERE unit_name LIKE '%・単元%'\"");
  console.log('  2. 生成データ投入:');
  for (const r of results) {
    console.log(`     npx wrangler d1 execute jiyushindo-gakushu-production --local --file=${r.sqlPath}`);
  }
  console.log('  3. ビルド & デプロイ:');
  console.log('     npm run build && npx wrangler pages deploy dist --project-name jiyushindo-gakushu');
}

main().catch(error => {
  console.error('❌ 致命的エラー:', error);
  process.exit(1);
});
