# 学習データ分析レポート自動生成ガイド

## 📋 概要

学生・クラス・学校レベルの学習データを自動分析し、週次/月次レポートをPDF形式で生成します。

---

## 🎯 レポートの種類

### 1. 学生個人レポート
- 学習時間・進捗率
- 苦手分野の特定
- 学習スタイル分析
- 次週の推奨カリキュラム

### 2. クラスレポート
- クラス全体の進捗状況
- 成績分布
- 優秀者・支援が必要な生徒
- 教師向け指導アドバイス

### 3. 学校全体レポート
- 全学年の進捗サマリ
- 科目別達成率
- 経年変化グラフ
- 保護者向け報告資料

---

## 📝 実装（簡潔版）

### src/report-generator.ts

```typescript
import { jsPDF } from 'jspdf';

export class ReportGenerator {
  async generateStudentWeeklyReport(studentId: number, startDate: Date, endDate: Date) {
    // データ収集
    const learningHistory = await this.fetchLearningHistory(studentId, startDate, endDate);
    const progress = await this.fetchProgress(studentId);
    const achievements = await this.fetchAchievements(studentId);
    
    // PDF生成
    const pdf = new jsPDF();
    
    // ヘッダー
    pdf.setFontSize(20);
    pdf.text('週次学習レポート', 20, 20);
    pdf.setFontSize(12);
    pdf.text(`期間: ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`, 20, 30);
    
    // 学習時間
    const totalHours = learningHistory.reduce((sum, h) => sum + h.time_spent_seconds / 3600, 0);
    pdf.text(`総学習時間: ${totalHours.toFixed(1)}時間`, 20, 45);
    
    // 進捗グラフ
    await this.addProgressChart(pdf, progress, 20, 60);
    
    // 苦手分野
    await this.addWeakAreasSection(pdf, learningHistory, 20, 140);
    
    // 推奨アクション
    await this.addRecommendations(pdf, studentId, 20, 200);
    
    return pdf.output('arraybuffer');
  }

  private async addProgressChart(pdf: jsPDF, progress: any[], x: number, y: number) {
    // Chart.jsでグラフ生成 → 画像化 → PDF挿入
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['未開始', '進行中', '完了', 'マスター'],
        datasets: [{
          data: [
            progress.filter(p => p.status === 'not_started').length,
            progress.filter(p => p.status === 'in_progress').length,
            progress.filter(p => p.status === 'completed').length,
            progress.filter(p => p.status === 'mastered').length,
          ]
        }]
      }
    });
    
    const imgData = canvas.toDataURL('image/png');
    pdf.addImage(imgData, 'PNG', x, y, 160, 60);
  }

  private async addWeakAreasSection(pdf: jsPDF, history: any[], x: number, y: number) {
    pdf.setFontSize(14);
    pdf.text('苦手分野の特定', x, y);
    
    // 誤答率の高いカードを特定
    const weakCards = history
      .filter(h => !h.is_correct)
      .reduce((acc, h) => {
        acc[h.card_id] = (acc[h.card_id] || 0) + 1;
        return acc;
      }, {});
    
    const sortedWeak = Object.entries(weakCards)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    
    pdf.setFontSize(10);
    let yPos = y + 10;
    sortedWeak.forEach(([cardId, count]) => {
      pdf.text(`- カード${cardId}: ${count}回誤答`, x + 5, yPos);
      yPos += 7;
    });
  }

  private async addRecommendations(pdf: jsPDF, studentId: number, x: number, y: number) {
    pdf.setFontSize(14);
    pdf.text('次週の推奨学習', x, y);
    
    // 適応学習エンジンから推奨を取得
    const recommendations = await this.getRecommendations(studentId);
    
    pdf.setFontSize(10);
    let yPos = y + 10;
    recommendations.slice(0, 5).forEach(rec => {
      pdf.text(`- ${rec.card_title} (難易度: ${rec.difficulty_level})`, x + 5, yPos);
      yPos += 7;
    });
  }
}
```

### API エンドポイント

**src/index.tsx**:
```typescript
app.get('/api/reports/student/:studentId/weekly', async (c) => {
  const studentId = parseInt(c.req.param('studentId'));
  const endDate = new Date();
  const startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  const generator = new ReportGenerator(c.env.DB);
  const pdfBuffer = await generator.generateStudentWeeklyReport(studentId, startDate, endDate);
  
  return new Response(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="weekly-report-${studentId}.pdf"`
    }
  });
});

// 自動生成スケジュール（Cloudflare Cron Triggers）
export default {
  async scheduled(event: ScheduledEvent, env: Env) {
    // 毎週日曜日23:59に全生徒のレポート生成
    if (event.cron === '59 23 * * 0') {
      const students = await env.DB.prepare('SELECT student_id FROM students WHERE is_active = TRUE').all();
      
      for (const student of students.results) {
        await generateAndEmailReport(student.student_id, env);
      }
    }
  }
};
```

### wrangler.jsonc設定

```jsonc
{
  "triggers": {
    "crons": ["59 23 * * 0"]  // 毎週日曜23:59
  }
}
```

---

## 📊 レポートサンプル

### 週次レポート内容
1. **サマリ**
   - 総学習時間
   - 完了カード数
   - マスター率

2. **詳細分析**
   - 科目別進捗グラフ
   - 日別学習時間グラフ
   - 正答率推移

3. **苦手分野**
   - 誤答の多いカード TOP5
   - 改善アドバイス

4. **推奨学習**
   - 次週の学習計画
   - 優先すべきカード

---

## 🚀 使用方法

### 手動生成
```bash
curl -H "Authorization: Bearer TOKEN" \
  https://jiyushindo-gakushu.com/api/reports/student/1/weekly \
  --output report.pdf
```

### 自動生成
- 毎週日曜23:59に自動実行
- 生徒にメール送信
- 保護者にも通知

---

**作成日**: 2026-01-30
