// 多言語対応 (i18n) システム
// 科学的根拠: Cummins (1979) 言語相互依存理論、Thomas & Collier (1997) 二言語教育研究

const translations = {
  ja: {
    // 共通
    common: {
      app_name: '自由進度学習支援システム',
      loading: '読み込み中...',
      error: 'エラーが発生しました',
      success: '成功しました',
      cancel: 'キャンセル',
      save: '保存',
      delete: '削除',
      edit: '編集',
      close: '閉じる',
      back: '戻る',
      next: '次へ',
      previous: '前へ',
      submit: '送信',
      search: '検索',
      filter: 'フィルター',
      sort: '並び替え',
      select: '選択',
      all: 'すべて',
      none: 'なし'
    },

    // ナビゲーション
    nav: {
      dashboard: 'ダッシュボード',
      learning: '学習',
      review: '復習',
      progress: '進捗',
      reports: 'レポート',
      settings: '設定',
      logout: 'ログアウト'
    },

    // 学習
    learning: {
      title: '学習',
      cards: '学習カード',
      review_today: '今日の復習',
      mastery_level: '習熟度',
      study_time: '学習時間',
      correct_rate: '正答率',
      streak: '連続学習',
      start_learning: '学習を開始',
      continue_learning: '学習を続ける',
      complete: '完了'
    },

    // ゲーミフィケーション
    gamification: {
      level: 'レベル',
      points: 'ポイント',
      experience: '経験値',
      badges: 'バッジ',
      achievements: 'アチーブメント',
      ranking: 'ランキング',
      streak: '連続日数',
      quests: 'クエスト',
      rewards: '報酬'
    },

    // レポート
    reports: {
      weekly: '週次レポート',
      monthly: '月次レポート',
      generate: 'レポート生成',
      download_pdf: 'PDFをダウンロード',
      progress_trend: '進捗推移',
      mastery_trend: '習熟度推移',
      learning_strategy: '学習方略',
      recommendations: '推奨事項'
    },

    // 不登校支援
    truancy_support: {
      title: '不登校児童生徒支援',
      flexible_schedule: '柔軟なスケジュール',
      self_paced: '自分のペースで',
      mental_health: 'メンタルヘルス',
      counselor_chat: 'カウンセラーチャット',
      parent_communication: '保護者連絡',
      progress_sharing: '進捗共有',
      return_support: '復学支援'
    }
  },

  en: {
    // Common
    common: {
      app_name: 'Self-Paced Learning Support System',
      loading: 'Loading...',
      error: 'An error occurred',
      success: 'Success',
      cancel: 'Cancel',
      save: 'Save',
      delete: 'Delete',
      edit: 'Edit',
      close: 'Close',
      back: 'Back',
      next: 'Next',
      previous: 'Previous',
      submit: 'Submit',
      search: 'Search',
      filter: 'Filter',
      sort: 'Sort',
      select: 'Select',
      all: 'All',
      none: 'None'
    },

    // Navigation
    nav: {
      dashboard: 'Dashboard',
      learning: 'Learning',
      review: 'Review',
      progress: 'Progress',
      reports: 'Reports',
      settings: 'Settings',
      logout: 'Logout'
    },

    // Learning
    learning: {
      title: 'Learning',
      cards: 'Learning Cards',
      review_today: "Today's Review",
      mastery_level: 'Mastery Level',
      study_time: 'Study Time',
      correct_rate: 'Correct Rate',
      streak: 'Streak',
      start_learning: 'Start Learning',
      continue_learning: 'Continue Learning',
      complete: 'Complete'
    },

    // Gamification
    gamification: {
      level: 'Level',
      points: 'Points',
      experience: 'Experience',
      badges: 'Badges',
      achievements: 'Achievements',
      ranking: 'Ranking',
      streak: 'Streak Days',
      quests: 'Quests',
      rewards: 'Rewards'
    },

    // Reports
    reports: {
      weekly: 'Weekly Report',
      monthly: 'Monthly Report',
      generate: 'Generate Report',
      download_pdf: 'Download PDF',
      progress_trend: 'Progress Trend',
      mastery_trend: 'Mastery Trend',
      learning_strategy: 'Learning Strategy',
      recommendations: 'Recommendations'
    },

    // Truancy Support
    truancy_support: {
      title: 'Truancy Support',
      flexible_schedule: 'Flexible Schedule',
      self_paced: 'Self-Paced',
      mental_health: 'Mental Health',
      counselor_chat: 'Counselor Chat',
      parent_communication: 'Parent Communication',
      progress_sharing: 'Progress Sharing',
      return_support: 'Return Support'
    }
  },

  zh: {
    // 通用
    common: {
      app_name: '自主进度学习支援系统',
      loading: '加载中...',
      error: '发生错误',
      success: '成功',
      cancel: '取消',
      save: '保存',
      delete: '删除',
      edit: '编辑',
      close: '关闭',
      back: '返回',
      next: '下一步',
      previous: '上一步',
      submit: '提交',
      search: '搜索',
      filter: '筛选',
      sort: '排序',
      select: '选择',
      all: '全部',
      none: '无'
    },

    // 导航
    nav: {
      dashboard: '仪表板',
      learning: '学习',
      review: '复习',
      progress: '进度',
      reports: '报告',
      settings: '设置',
      logout: '退出登录'
    },

    // 学习
    learning: {
      title: '学习',
      cards: '学习卡片',
      review_today: '今日复习',
      mastery_level: '掌握程度',
      study_time: '学习时间',
      correct_rate: '正确率',
      streak: '连续学习',
      start_learning: '开始学习',
      continue_learning: '继续学习',
      complete: '完成'
    },

    // 游戏化
    gamification: {
      level: '等级',
      points: '积分',
      experience: '经验值',
      badges: '徽章',
      achievements: '成就',
      ranking: '排名',
      streak: '连续天数',
      quests: '任务',
      rewards: '奖励'
    },

    // 报告
    reports: {
      weekly: '周报',
      monthly: '月报',
      generate: '生成报告',
      download_pdf: '下载PDF',
      progress_trend: '进度趋势',
      mastery_trend: '掌握度趋势',
      learning_strategy: '学习策略',
      recommendations: '建议'
    },

    // 辍学支援
    truancy_support: {
      title: '辍学学生支援',
      flexible_schedule: '灵活的时间表',
      self_paced: '自主进度',
      mental_health: '心理健康',
      counselor_chat: '辅导员聊天',
      parent_communication: '家长沟通',
      progress_sharing: '进度分享',
      return_support: '复学支援'
    }
  },

  ko: {
    // 공통
    common: {
      app_name: '자율 진도 학습 지원 시스템',
      loading: '로딩 중...',
      error: '오류가 발생했습니다',
      success: '성공',
      cancel: '취소',
      save: '저장',
      delete: '삭제',
      edit: '편집',
      close: '닫기',
      back: '뒤로',
      next: '다음',
      previous: '이전',
      submit: '제출',
      search: '검색',
      filter: '필터',
      sort: '정렬',
      select: '선택',
      all: '모두',
      none: '없음'
    },

    // 내비게이션
    nav: {
      dashboard: '대시보드',
      learning: '학습',
      review: '복습',
      progress: '진도',
      reports: '보고서',
      settings: '설정',
      logout: '로그아웃'
    },

    // 학습
    learning: {
      title: '학습',
      cards: '학습 카드',
      review_today: '오늘의 복습',
      mastery_level: '숙달도',
      study_time: '학습 시간',
      correct_rate: '정답률',
      streak: '연속 학습',
      start_learning: '학습 시작',
      continue_learning: '학습 계속',
      complete: '완료'
    },

    // 게임화
    gamification: {
      level: '레벨',
      points: '포인트',
      experience: '경험치',
      badges: '배지',
      achievements: '업적',
      ranking: '순위',
      streak: '연속 일수',
      quests: '퀘스트',
      rewards: '보상'
    },

    // 보고서
    reports: {
      weekly: '주간 보고서',
      monthly: '월간 보고서',
      generate: '보고서 생성',
      download_pdf: 'PDF 다운로드',
      progress_trend: '진도 추세',
      mastery_trend: '숙달도 추세',
      learning_strategy: '학습 전략',
      recommendations: '권장 사항'
    },

    // 부등교 지원
    truancy_support: {
      title: '부등교 학생 지원',
      flexible_schedule: '유연한 일정',
      self_paced: '자율 진도',
      mental_health: '정신 건강',
      counselor_chat: '상담사 채팅',
      parent_communication: '학부모 소통',
      progress_sharing: '진도 공유',
      return_support: '복교 지원'
    }
  }
};

// i18nクラス
class I18n {
  constructor() {
    this.currentLang = this.detectLanguage();
    this.translations = translations;
  }

  // ブラウザの言語を検出
  detectLanguage() {
    const browserLang = navigator.language || navigator.userLanguage;
    const langCode = browserLang.split('-')[0]; // 'en-US' -> 'en'
    
    // サポートされている言語かチェック
    if (this.translations[langCode]) {
      return langCode;
    }
    
    // デフォルトは日本語
    return 'ja';
  }

  // 言語を設定
  setLanguage(lang) {
    if (this.translations[lang]) {
      this.currentLang = lang;
      localStorage.setItem('language', lang);
      
      // ページをリロード
      window.location.reload();
    }
  }

  // 保存された言語を取得
  getLanguage() {
    return localStorage.getItem('language') || this.currentLang;
  }

  // 翻訳を取得
  t(key) {
    const keys = key.split('.');
    let value = this.translations[this.currentLang];
    
    for (const k of keys) {
      if (value && value[k]) {
        value = value[k];
      } else {
        // キーが見つからない場合は日本語にフォールバック
        value = this.translations['ja'];
        for (const k2 of keys) {
          if (value && value[k2]) {
            value = value[k2];
          } else {
            return key; // それでも見つからない場合はキーを返す
          }
        }
        break;
      }
    }
    
    return value;
  }

  // 複数形対応 (英語用)
  tn(key, count) {
    const translation = this.t(key);
    
    if (this.currentLang === 'en') {
      // 英語の複数形ルール (簡易版)
      if (count === 1) {
        return translation;
      } else {
        return translation + 's'; // 簡易的な複数形
      }
    }
    
    return translation;
  }

  // 日付フォーマット
  formatDate(date) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Intl.DateTimeFormat(this.currentLang, options).format(date);
  }

  // 数値フォーマット
  formatNumber(number) {
    return new Intl.NumberFormat(this.currentLang).format(number);
  }

  // 通貨フォーマット
  formatCurrency(amount, currency = 'JPY') {
    return new Intl.NumberFormat(this.currentLang, {
      style: 'currency',
      currency: currency
    }).format(amount);
  }
}

// グローバルインスタンス
const i18n = new I18n();

// ページ読み込み時に保存された言語を適用
window.addEventListener('DOMContentLoaded', () => {
  const savedLang = localStorage.getItem('language');
  if (savedLang && savedLang !== i18n.currentLang) {
    i18n.setLanguage(savedLang);
  }
});

// エクスポート
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { I18n, i18n, translations };
}
