// 個別最適化学習デモのJavaScript

// 全ケースのデータ
const casesData = {
  1: {
    title: 'ケース1: 得意な児童Aさん',
    subtitle: '算数が得意、どんどん進みたい',
    course: 'どんどんコース',
    color: 'purple',
    icon: 'fa-rocket',
    features: [
      {
        name: 'AI生成動画',
        icon: 'fa-video',
        description: '「分数のかけ算」解説動画（Gemini Veo, 8秒）',
        demoType: 'video',
        demoContent: {
          title: '分数のかけ算 解説動画',
          description: 'AIが自動生成した8秒の解説動画です。視覚的にわかりやすく、短時間で要点を理解できます。',
          placeholder: '🎬 AI生成動画（Gemini Veo）<br><br>「2/3 × 3/4 = 6/12 = 1/2」<br><br>分子どうし、分母どうしをかけ算します！<br>最後に約分することを忘れずに！'
        }
      },
      {
        name: 'AI生成画像',
        icon: 'fa-image',
        description: '立体図形の展開図（Flux Pro）',
        demoType: 'image',
        demoContent: {
          title: '立体図形の展開図',
          description: 'AIが生成した立体図形の展開図。視覚的に理解しやすい図解です。',
          placeholder: '🎨 AI生成画像（Flux Pro）<br><br>[立方体の展開図]<br>┌─┬─┐<br>│ │ │<br>├─┼─┤<br>│ │ │<br>├─┼─┤<br>│ │ │<br>└─┴─┘<br><br>6つの面が繋がっているよ！'
        }
      },
      {
        name: '学習データ分析',
        icon: 'fa-chart-line',
        description: '得意分野を可視化→次の挑戦',
        demoType: 'chart',
        demoContent: {
          title: '学習データ分析',
          description: 'Aさんの学習データを分析し、得意分野と次の挑戦を提案します。',
          data: [
            { label: '計算', value: 95, color: 'bg-green-500' },
            { label: '図形', value: 88, color: 'bg-blue-500' },
            { label: '文章問題', value: 92, color: 'bg-purple-500' },
            { label: '測定', value: 85, color: 'bg-yellow-500' }
          ],
          recommendation: '計算が最も得意です！次は「速さ」の発展問題に挑戦しましょう。'
        }
      }
    ],
    result: '✅ 1週間でコース完了、選択問題もクリア。別のコースや単元にも挑戦中！'
  },
  2: {
    title: 'ケース2: 苦手な児童Bさん',
    subtitle: '算数に苦手意識、じっくり学びたい',
    course: 'ゆっくりコース',
    color: 'blue',
    icon: 'fa-seedling',
    features: [
      {
        name: 'AI生成音楽',
        icon: 'fa-music',
        description: '「九九の歌」で暗記支援（ElevenLabs）',
        demoType: 'audio',
        demoContent: {
          title: '九九の歌',
          description: 'AIが生成した覚えやすい九九の歌です。リズムに乗せて楽しく暗記できます。',
          placeholder: '🎵 AI生成音楽（ElevenLabs）<br><br>♪ に に が し<br>♪ に さん が ろく<br>♪ に し が はち<br>♪ に ご じゅう<br><br>リズムに合わせて覚えよう！'
        }
      },
      {
        name: 'AI音声読み上げ',
        icon: 'fa-volume-up',
        description: 'やさしい言葉で説明（Minimax TTS）',
        demoType: 'audio',
        demoContent: {
          title: 'やさしい音声解説',
          description: '小学2年生向けのやさしい言葉で、ゆっくり丁寧に読み上げます。',
          placeholder: '🎤 AI音声読み上げ（Minimax TTS）<br><br>「かけざんは、おなじかずをなんかいもたすことだよ。<br>たとえば、2×3は、2を3かいたすから、2+2+2=6だね。<br>わかったかな？」<br><br>※ひらがな中心、ゆっくり読み上げ'
        }
      },
      {
        name: 'AI先生対話',
        icon: 'fa-comments',
        description: '質問5回→300〜500文字で丁寧に回答',
        demoType: 'chat',
        demoContent: {
          title: 'AI先生との対話',
          description: 'どんな質問にも丁寧に答えてくれるAI先生です。',
          messages: [
            { role: 'student', text: 'かけざんがむずかしいです...' },
            { role: 'ai', text: 'だいじょうぶだよ！かけざんは、おなじかずをなんかいもたすことなんだ。たとえば、3×2は、3を2かいたすから、3+3=6だよ。りんごが3こはいったはこが2つあったら、ぜんぶで何こになるかな？そう、6こだね！こうやってかんがえると、わかりやすいよ。もっとしりたいことはある？' }
          ]
        }
      }
    ],
    result: '✅ 2週間でコース完了、苦手を克服し自信を持って学習！'
  },
  3: {
    title: 'ケース3: 欠席が多い児童Cさん',
    subtitle: '体調不良で欠席が多い',
    course: 'しっかりコース',
    color: 'yellow',
    icon: 'fa-home',
    features: [
      {
        name: 'AI解説動画',
        icon: 'fa-video',
        description: '授業の代わりに5〜8秒の要点動画（Gemini Veo）',
        demoType: 'video',
        demoContent: {
          title: '授業の要点動画',
          description: '5〜8秒で授業の要点をまとめた動画です。自宅でも授業の内容を理解できます。',
          placeholder: '🎬 AI解説動画（Gemini Veo）<br><br>【今日の授業：長方形の面積】<br>たて × よこ = めんせき<br><br>例: たて5cm、よこ3cmの長方形<br>5 × 3 = 15 cm²'
        }
      },
      {
        name: '進捗ボード',
        icon: 'fa-chart-bar',
        description: '教師がリアルタイムで見守り、励ましメッセージ',
        demoType: 'progress',
        demoContent: {
          title: '進捗ボード',
          description: '先生がリアルタイムであなたの学習を見守っています。',
          progress: 4,
          total: 6,
          teacherMessage: 'Cさん、がんばっているね！もう4枚クリアしたよ。あと2枚で今日の目標達成だね。体調に気をつけて、無理せずゆっくり進めてね。応援しているよ！📣'
        }
      },
      {
        name: '音声メモ機能',
        icon: 'fa-microphone',
        description: '気持ちを記録して孤立感を軽減',
        demoType: 'voicememo',
        demoContent: {
          title: '音声メモ',
          description: '今日の気持ちや学習の感想を音声で記録できます。',
          placeholder: '🎤 音声メモ録音中...<br><br>「今日は算数の長方形の面積を勉強しました。最初は難しかったけど、動画を見たらわかりました。明日は学校に行けるかな...」<br><br>✅ 記録完了'
        }
      }
    ],
    result: '✅ 自宅から学習継続、遅れを取り戻しクラスに追いつく。24時間いつでも学習可能！'
  },
  4: {
    title: 'ケース4: 学習スタイル別対応',
    subtitle: '視覚・聴覚・体験優位版',
    course: '認知特性に応じた個別対応',
    color: 'pink',
    icon: 'fa-brain',
    features: [
      {
        name: '視覚優位版',
        icon: 'fa-eye',
        description: 'AI生成画像・動画、図解、色分けされた説明',
        demoType: 'visual',
        demoContent: {
          title: '視覚優位版の学習カード',
          description: '図解や色分けを活用した視覚的な説明です。',
          placeholder: '👁️ 視覚優位版<br><br><span style="color: red;">■</span> 赤: 分子<br><span style="color: blue;">■</span> 青: 分母<br><br><span style="color: red;">2</span>/<span style="color: blue;">3</span> × <span style="color: red;">3</span>/<span style="color: blue;">4</span> = <span style="color: red;">6</span>/<span style="color: blue;">12</span><br><br>色で覚えよう！'
        }
      },
      {
        name: '聴覚優位版',
        icon: 'fa-ear-listen',
        description: 'AI音声読み上げ、AI生成音楽、音声解説',
        demoType: 'audio',
        demoContent: {
          title: '聴覚優位版の学習カード',
          description: '音声とリズムで覚える学習方法です。',
          placeholder: '👂 聴覚優位版<br><br>🎵 「ぶんし どうし かけて<br>ぶんぼ どうし かけて<br>やくぶん わすれず<br>こたえを だそう！」<br><br>リズムで覚えよう！'
        }
      },
      {
        name: '体験優位版',
        icon: 'fa-hand-paper',
        description: '具体物の提案、実験動画、身近な例',
        demoType: 'kinesthetic',
        demoContent: {
          title: '体験優位版の学習カード',
          description: '実際に手を動かして学ぶ方法です。',
          placeholder: '✋ 体験優位版<br><br>【準備するもの】<br>• 折り紙 2枚<br><br>1. 1枚目を3等分して2つ使う（2/3）<br>2. 2枚目を4等分して3つ使う（3/4）<br>3. 重ねて計算しよう！<br><br>実際にやってみよう！'
        }
      },
      {
        name: '自動判定',
        icon: 'fa-magic',
        description: '学習履歴から認知特性を推定',
        demoType: 'auto',
        demoContent: {
          title: '認知特性の自動判定',
          description: '学習履歴から、あなたに最適な学習スタイルを自動判定します。',
          result: {
            visual: 75,
            auditory: 60,
            kinesthetic: 80
          },
          recommendation: 'あなたは体験優位タイプです！手を動かして学ぶのが得意ですね。'
        }
      }
    ],
    result: '✅ AIが児童の特性を自動分析し、最適な表現方法を提供！'
  },
  5: {
    title: 'ケース5: AI生成コンテンツ活用',
    subtitle: '教師がAIで教材を瞬時に作成',
    course: 'AI教材作成支援',
    color: 'indigo',
    icon: 'fa-magic',
    features: [
      {
        name: '動画生成',
        icon: 'fa-video',
        description: 'Gemini Veo で5〜8秒の解説動画',
        demoType: 'generation',
        demoContent: {
          title: 'AI動画生成デモ',
          description: 'テキストから自動で解説動画を生成します。',
          input: '「分数の計算手順を5秒で説明する動画を作成」',
          output: '🎬 生成完了！<br><br>【動画内容】<br>1. 分子どうしをかける<br>2. 分母どうしをかける<br>3. 約分する<br><br>所要時間: 約30秒'
        }
      },
      {
        name: '音楽生成',
        icon: 'fa-music',
        description: 'ElevenLabs で九九の歌、集中BGM',
        demoType: 'generation',
        demoContent: {
          title: 'AI音楽生成デモ',
          description: '学習内容に合わせた音楽を自動生成します。',
          input: '「九九の歌を楽しく覚えられる曲調で作成」',
          output: '🎵 生成完了！<br><br>♪ 明るくポップな曲調<br>♪ 覚えやすいリズム<br>♪ 2分20秒<br><br>所要時間: 約45秒'
        }
      },
      {
        name: '画像生成',
        icon: 'fa-image',
        description: 'Flux で図解、イラスト',
        demoType: 'generation',
        demoContent: {
          title: 'AI画像生成デモ',
          description: '教材用の図解やイラストを自動生成します。',
          input: '「立体図形（立方体）の展開図をカラフルに作成」',
          output: '🎨 生成完了！<br><br>[カラフルな展開図]<br>• 6つの面を色分け<br>• 組み立て線を表示<br><br>所要時間: 約20秒'
        }
      },
      {
        name: '学習カード自動生成',
        icon: 'fa-file-alt',
        description: '3コース×6枚+ヒント54個を約1分で作成',
        demoType: 'generation',
        demoContent: {
          title: '学習カード自動生成デモ',
          description: '単元を入力するだけで、すべての学習カードを自動生成します。',
          input: '「小学4年生 / 算数 / 分数のかけ算」',
          output: '📝 生成完了！<br><br>✅ ゆっくりコース: 6枚<br>✅ しっかりコース: 6枚<br>✅ どんどんコース: 6枚<br>✅ ヒント: 54個<br>✅ チェックテスト: 3問<br><br>所要時間: 約1分'
        }
      }
    ],
    result: '✅ 教材作成時間を1/10に削減！従来3時間→今は20分で完成！'
  },
  6: {
    title: 'ケース6: 外国籍の児童Eさん',
    subtitle: '日本語学習中、視覚的な理解が得意',
    course: 'ゆっくりコース',
    color: 'teal',
    icon: 'fa-globe',
    features: [
      {
        name: 'AI生成画像',
        icon: 'fa-image',
        description: '視覚的に理解（文字が読めなくてもOK）',
        demoType: 'image',
        demoContent: {
          title: '視覚的な学習カード',
          description: '文字が少なく、イラストで理解できる学習カードです。',
          placeholder: '🎨 AI生成画像<br><br>[イラスト: りんご3個 + りんご2個 = りんご5個]<br><br>3 + 2 = 5<br><br>絵で見るとわかりやすい！'
        }
      },
      {
        name: 'やさしい日本語モード',
        icon: 'fa-language',
        description: 'ルビ振り機能',
        demoType: 'ruby',
        demoContent: {
          title: 'やさしい日本語＋ルビ振り',
          description: 'すべての漢字にルビ（ふりがな）が振られます。',
          placeholder: '<ruby>今日<rt>きょう</rt></ruby>は<ruby>算数<rt>さんすう</rt></ruby>の<ruby>勉強<rt>べんきょう</rt></ruby>をします。<br><br><ruby>分数<rt>ぶんすう</rt></ruby>の<ruby>計算<rt>けいさん</rt></ruby>は<ruby>簡単<rt>かんたん</rt></ruby>です。<br><br>ルビがあると読みやすい！'
        }
      },
      {
        name: 'AI音声読み上げ',
        icon: 'fa-volume-up',
        description: '聞いて学習（漢字の読みを確認）',
        demoType: 'audio',
        demoContent: {
          title: 'AI音声読み上げ',
          description: 'ゆっくり丁寧に読み上げます。漢字の読み方も確認できます。',
          placeholder: '🎤 AI音声読み上げ<br><br>「きょう は さんすう の べんきょう を します。<br>ぶんすう の けいさん は かんたん です。」<br><br>※ゆっくり、はっきり読み上げ'
        }
      }
    ],
    result: '✅ 言語の壁を超えて、すべての子どもに学びの機会を保障！'
  },
  7: {
    title: 'ケース7: 発達障害のある児童Fさん',
    subtitle: 'ADHD、集中が続きにくい',
    course: 'ゆっくりコース',
    color: 'amber',
    icon: 'fa-hand-holding-heart',
    features: [
      {
        name: '短時間動画',
        icon: 'fa-clock',
        description: 'AI生成5〜8秒で飽きずに学習',
        demoType: 'video',
        demoContent: {
          title: '短時間動画',
          description: '5〜8秒の短い動画で、集中力を持続させます。',
          placeholder: '🎬 短時間動画（5秒）<br><br>【分数の計算】<br>① 分子をかける<br>② 分母をかける<br>③ 約分する<br><br>短いから集中できる！'
        }
      },
      {
        name: '音楽BGM',
        icon: 'fa-music',
        description: 'AI生成で集中力を持続',
        demoType: 'audio',
        demoContent: {
          title: '集中BGM',
          description: 'AIが生成した集中力を高める音楽です。',
          placeholder: '🎵 集中BGM再生中...<br><br>♪ 落ち着いたピアノ曲<br>♪ α波を促進するリズム<br>♪ 学習に最適な音量<br><br>リラックスして学習できる！'
        }
      },
      {
        name: '学習時間データ分析',
        icon: 'fa-chart-line',
        description: '集中できる時間帯をAIが自動検出',
        demoType: 'chart',
        demoContent: {
          title: '集中時間分析',
          description: 'Fさんの学習データから、集中できる時間帯を分析します。',
          data: [
            { time: '9:00', concentration: 85 },
            { time: '10:00', concentration: 70 },
            { time: '14:00', concentration: 60 },
            { time: '15:00', concentration: 90 }
          ],
          recommendation: '15:00台が最も集中できています。この時間帯に重要な学習を配置しましょう。'
        }
      },
      {
        name: '小ステップ設計',
        icon: 'fa-tasks',
        description: '6枚×10分＝1時間で達成感',
        demoType: 'steps',
        demoContent: {
          title: '小ステップ設計',
          description: '小さな目標を達成しながら学習を進めます。',
          steps: [
            { step: 1, time: '10分', status: 'completed', title: 'カード1: 基本' },
            { step: 2, time: '10分', status: 'completed', title: 'カード2: 練習' },
            { step: 3, time: '10分', status: 'current', title: 'カード3: 応用' },
            { step: 4, time: '10分', status: 'pending', title: 'カード4: 発展' },
            { step: 5, time: '10分', status: 'pending', title: 'カード5: 確認' },
            { step: 6, time: '10分', status: 'pending', title: 'カード6: まとめ' }
          ]
        }
      }
    ],
    result: '✅ 発達特性に配慮し、無理なく学べる環境をAIがサポート！'
  },
  8: {
    title: 'ケース8: ギフテッド児童Gさん',
    subtitle: '高い学習能力、探究心旺盛',
    course: 'どんどんコース',
    color: 'violet',
    icon: 'fa-star',
    features: [
      {
        name: '選択問題',
        icon: 'fa-forward',
        description: 'AIが上位学年の問題も自動生成',
        demoType: 'advanced',
        demoContent: {
          title: '発展的な選択問題',
          description: '現在の学年より上の問題に挑戦できます。',
          currentGrade: '小学4年生',
          challenges: [
            { grade: '5年生', topic: '小数のかけ算' },
            { grade: '6年生', topic: '分数の割り算' },
            { grade: '中学1年', topic: '正負の数' }
          ]
        }
      },
      {
        name: '学習データ分析',
        icon: 'fa-chart-line',
        description: '得意分野を可視化→さらに伸ばす',
        demoType: 'chart',
        demoContent: {
          title: '学習データ分析',
          description: 'Gさんの得意分野を分析し、さらに伸ばす提案をします。',
          data: [
            { label: '論理思考', value: 98, color: 'bg-purple-500' },
            { label: '空間認識', value: 95, color: 'bg-blue-500' },
            { label: '計算速度', value: 92, color: 'bg-green-500' },
            { label: '問題解決', value: 96, color: 'bg-red-500' }
          ],
          recommendation: '論理思考が特に優れています！数学オリンピックの問題に挑戦してみましょう。'
        }
      },
      {
        name: '複数コース同時進行',
        icon: 'fa-layer-group',
        description: '単元内自由進度で自分のペース',
        demoType: 'multi',
        demoContent: {
          title: '複数コース同時進行',
          description: '複数の単元を同時に学習できます。',
          courses: [
            { title: '分数のかけ算', progress: 6, total: 6, status: '完了' },
            { title: '分数の割り算', progress: 4, total: 6, status: '学習中' },
            { title: '小数の計算', progress: 2, total: 6, status: '学習中' }
          ]
        }
      }
    ],
    result: '✅ 能力を最大限に引き出し、才能を開花させる！'
  },
  9: {
    title: 'ケース9: 不登校の児童Hさん',
    subtitle: '学校に行けない、自宅で学習',
    course: 'しっかりコース',
    color: 'cyan',
    icon: 'fa-heart',
    features: [
      {
        name: '24時間AI先生',
        icon: 'fa-robot',
        description: 'いつでも質問に回答（深夜でも安心）',
        demoType: 'chat',
        demoContent: {
          title: '24時間AI先生',
          description: '夜中でも、いつでも質問できます。',
          messages: [
            { role: 'student', text: '夜の11時ですが、分数の計算がわかりません...', time: '23:00' },
            { role: 'ai', text: 'こんばんは！大丈夫だよ、いつでも聞いてね。分数の計算について教えるね。まず、分数のかけ算は分子どうし、分母どうしをかけるんだよ。例えば、2/3 × 3/4 = 6/12 = 1/2 だね。わかったかな？', time: '23:01' },
            { role: 'student', text: 'わかりました！ありがとうございます。', time: '23:02' },
            { role: 'ai', text: 'どういたしまして！いつでも聞いてね。おやすみなさい😊', time: '23:02' }
          ]
        }
      },
      {
        name: '進捗ボード',
        icon: 'fa-chart-bar',
        description: '教師がリアルタイムに見守り、励ましメッセージ',
        demoType: 'progress',
        demoContent: {
          title: '進捗ボード',
          description: '先生がいつもあなたを見守っています。',
          progress: 5,
          total: 6,
          teacherMessage: 'Hさん、毎日コツコツ学習していてすごいね！もう5枚も終わったよ。学校に来られない日も、ちゃんと学習を続けているHさんを誇りに思います。いつでも応援しているよ！💙'
        }
      },
      {
        name: '音声メモ機能',
        icon: 'fa-microphone',
        description: '孤立感を軽減、気持ちを記録',
        demoType: 'voicememo',
        demoContent: {
          title: '音声メモ',
          description: '今日の気持ちを記録できます。先生も聞いてくれます。',
          placeholder: '🎤 音声メモ録音中...<br><br>「今日は分数の計算を勉強しました。難しかったけど、AI先生が優しく教えてくれました。学校には行けなかったけど、勉強できて良かったです。明日もがんばります。」<br><br>✅ 記録完了・先生に共有されました'
        }
      }
    ],
    result: '✅ 教室に行けなくても、学びと繋がりを途切れさせない！'
  },
  10: {
    title: 'ケース10: 音楽知能が高い児童Iさん',
    subtitle: '音楽を通じた学習が得意',
    course: 'しっかりコース',
    color: 'rose',
    icon: 'fa-music',
    features: [
      {
        name: 'AI生成音楽',
        icon: 'fa-music',
        description: 'ElevenLabs で「九九の歌」を自動作成',
        demoType: 'audio',
        demoContent: {
          title: 'AI生成音楽',
          description: 'あなたの好きな曲調で九九の歌を作成します。',
          placeholder: '🎵 AI生成音楽（ElevenLabs）<br><br>♪ さん いち が さん<br>♪ さん に が ろく<br>♪ さん さん が きゅう<br>♪ さん し じゅうに<br><br>明るいポップ調で覚えやすい！'
        }
      },
      {
        name: '聴覚優位版',
        icon: 'fa-ear-listen',
        description: 'Minimax TTS で音声解説',
        demoType: 'audio',
        demoContent: {
          title: '聴覚優位版の学習',
          description: '歌うように読み上げる音声解説です。',
          placeholder: '👂 聴覚優位版（Minimax TTS）<br><br>「ぶ〜んすう の け〜いさん〜は♪<br>ぶんし どうし か〜けて♪<br>ぶんぼ どうし か〜けて♪<br>やくぶん わ〜すれず♪」<br><br>リズムで覚えよう！'
        }
      },
      {
        name: '集中BGM生成',
        icon: 'fa-headphones',
        description: '学習内容に合わせた最適な音楽',
        demoType: 'audio',
        demoContent: {
          title: '集中BGM',
          description: '学習内容に合わせた集中BGMを生成します。',
          placeholder: '🎧 集中BGM生成中...<br><br>【今日の学習】分数の計算<br>【おすすめBGM】落ち着いたクラシック<br><br>♪ ショパン風のピアノ曲<br>♪ テンポ: 90BPM<br>♪ 集中力UP！'
        }
      }
    ],
    result: '✅ ガードナーの多重知能理論：音楽知能を最大限に活用！'
  },
  11: {
    title: 'ケース11: 身体運動知能が高い児童Jさん',
    subtitle: '体を動かして学ぶのが得意',
    course: 'ゆっくりコース',
    color: 'lime',
    icon: 'fa-running',
    features: [
      {
        name: '体験優位版',
        icon: 'fa-hand-paper',
        description: '具体物（積み木、お金）を使った実演提案',
        demoType: 'kinesthetic',
        demoContent: {
          title: '体験優位版の学習',
          description: '実際に手を動かして学びます。',
          placeholder: '✋ 体験優位版<br><br>【準備するもの】<br>• 10円玉 10枚<br>• 5円玉 4枚<br><br>【やってみよう】<br>1. 10円玉を3枚取る（30円）<br>2. 5円玉を2枚取る（10円）<br>3. 合わせて40円！<br><br>実際に数えてみよう！'
        }
      },
      {
        name: 'AI生成動画',
        icon: 'fa-video',
        description: 'Gemini Veo で手を動かす様子を生成',
        demoType: 'video',
        demoContent: {
          title: 'AI生成実演動画',
          description: '手を動かす様子を動画で確認できます。',
          placeholder: '🎬 AI生成動画（Gemini Veo）<br><br>[動画: 積み木で分数を作る]<br><br>1. 積み木を4つ並べる<br>2. そのうち3つを選ぶ（3/4）<br>3. 実際にやってみよう！'
        }
      },
      {
        name: '実験動画',
        icon: 'fa-flask',
        description: '実際にやってみる様子を5〜8秒で確認',
        demoType: 'video',
        demoContent: {
          title: '実験動画',
          description: '実際の実験の様子を短い動画で確認できます。',
          placeholder: '🎬 実験動画（5秒）<br><br>[ペットボトルで体積を測る実験]<br><br>① 水を入れる<br>② 目盛りを読む<br>③ 体積を確認<br><br>やってみよう！'
        }
      }
    ],
    result: '✅ 多重知能理論：身体運動知能を活かした学び！'
  },
  12: {
    title: 'ケース12: 複合的支援が必要な児童Kさん',
    subtitle: '学習障害＋家庭環境の課題',
    course: 'ゆっくりコース',
    color: 'fuchsia',
    icon: 'fa-hands-helping',
    features: [
      {
        name: '3スタイル統合',
        icon: 'fa-layer-group',
        description: '視覚・聴覚・体験を組み合わせたUDL設計',
        demoType: 'udl',
        demoContent: {
          title: 'UDL（学びのユニバーサルデザイン）',
          description: '3つの学習スタイルを統合した学習カードです。',
          styles: [
            { type: '視覚', content: '🎨 カラフルな図解とイラスト' },
            { type: '聴覚', content: '🎵 音声読み上げと音楽' },
            { type: '体験', content: '✋ 具体物を使った実演' }
          ]
        }
      },
      {
        name: 'AI先生＋教師',
        icon: 'fa-user-friends',
        description: '二重の見守りで取りこぼしゼロ',
        demoType: 'support',
        demoContent: {
          title: '二重の見守りシステム',
          description: 'AI先生と人間の先生が協力してサポートします。',
          aiSupport: '✅ 24時間質問対応<br>✅ 学習データ分析<br>✅ つまずき検出',
          teacherSupport: '✅ 個別面談<br>✅ 家庭連携<br>✅ 心のケア'
        }
      },
      {
        name: 'つまずき自動検出',
        icon: 'fa-exclamation-triangle',
        description: 'データ分析で早期発見→即座に介入',
        demoType: 'detection',
        demoContent: {
          title: 'つまずき自動検出',
          description: 'AIがつまずきを早期発見し、すぐに対策を提案します。',
          alert: '⚠️ つまずき検出<br><br>分数の約分で3回連続間違い<br><br>【提案】<br>• 基礎問題に戻る<br>• 動画解説を見る<br>• AI先生に質問する'
        }
      },
      {
        name: '週次レポート',
        icon: 'fa-file-alt',
        description: '保護者と共有、家庭連携を強化',
        demoType: 'report',
        demoContent: {
          title: '週次レポート',
          description: '1週間の学習をまとめて保護者に共有します。',
          report: '【今週の学習】<br>• 学習時間: 3時間20分<br>• 完了カード: 12枚<br>• 得意: 計算問題<br>• 苦手: 文章問題<br><br>【来週の目標】<br>文章問題を重点的に学習'
        }
      }
    ],
    result: '✅ 誰一人取り残さない！複合的な課題にもAI×教師で手厚くサポート！'
  }
};

// モーダルを表示
function showDemo(caseNumber) {
  const caseData = casesData[caseNumber];
  const modal = document.getElementById('demoModal');
  const content = modal.querySelector('.demo-content');
  
  // モーダルの内容を生成
  content.innerHTML = `
    <div class="p-8">
      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <div>
          <h2 class="text-3xl font-bold text-${caseData.color}-700 mb-2">
            <i class="fas ${caseData.icon} mr-2"></i>
            ${caseData.title}
          </h2>
          <p class="text-gray-600">${caseData.subtitle}</p>
          <span class="inline-block mt-2 bg-${caseData.color}-100 text-${caseData.color}-700 px-3 py-1 rounded-full text-sm font-semibold">
            ${caseData.course}
          </span>
        </div>
        <button onclick="closeDemo()" class="text-gray-500 hover:text-gray-700 text-3xl">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <!-- Features -->
      <div class="space-y-6">
        ${caseData.features.map((feature, index) => `
          <div class="feature-demo bg-gray-50 rounded-lg p-6 border-2 border-${caseData.color}-200">
            <div class="flex items-center mb-4">
              <div class="bg-${caseData.color}-600 text-white rounded-full w-10 h-10 flex items-center justify-center mr-3">
                <i class="fas ${feature.icon}"></i>
              </div>
              <div>
                <h3 class="font-bold text-lg text-gray-800">${feature.name}</h3>
                <p class="text-sm text-gray-600">${feature.description}</p>
              </div>
            </div>
            <div class="bg-white rounded-lg p-6 border-2 border-gray-200">
              ${renderFeatureDemo(feature, caseData.color)}
            </div>
          </div>
        `).join('')}
      </div>

      <!-- Result -->
      <div class="mt-8 bg-${caseData.color}-50 rounded-lg p-6 border-2 border-${caseData.color}-300">
        <h3 class="font-bold text-lg text-${caseData.color}-800 mb-2">
          <i class="fas fa-check-circle mr-2"></i>
          実装結果
        </h3>
        <p class="text-gray-700">${caseData.result}</p>
      </div>

      <!-- Actions -->
      <div class="mt-6 flex gap-4">
        <button onclick="closeDemo()" class="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-3 rounded-lg transition font-semibold">
          <i class="fas fa-times mr-2"></i>閉じる
        </button>
        <button onclick="window.location.href='/'" class="flex-1 bg-${caseData.color}-600 hover:bg-${caseData.color}-700 text-white px-6 py-3 rounded-lg transition font-semibold">
          <i class="fas fa-play mr-2"></i>実際に体験する
        </button>
      </div>
    </div>
  `;
  
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

// モーダルを閉じる
function closeDemo() {
  const modal = document.getElementById('demoModal');
  modal.classList.remove('active');
  document.body.style.overflow = 'auto';
}

// 機能デモのレンダリング
function renderFeatureDemo(feature, color) {
  const content = feature.demoContent;
  
  switch (feature.demoType) {
    case 'video':
    case 'image':
    case 'audio':
      return `
        <div class="text-center">
          <h4 class="font-bold text-gray-800 mb-3">${content.title}</h4>
          <p class="text-sm text-gray-600 mb-4">${content.description}</p>
          <div class="bg-gradient-to-br from-${color}-50 to-${color}-100 rounded-lg p-8 min-h-[200px] flex items-center justify-center border-2 border-${color}-200">
            <div class="text-${color}-700">${content.placeholder}</div>
          </div>
        </div>
      `;
      
    case 'chart':
      return `
        <div>
          <h4 class="font-bold text-gray-800 mb-3">${content.title}</h4>
          <p class="text-sm text-gray-600 mb-4">${content.description}</p>
          <div class="space-y-3">
            ${content.data.map(item => `
              <div>
                <div class="flex items-center justify-between mb-1">
                  <span class="text-sm font-semibold text-gray-700">${item.label}</span>
                  <span class="text-sm font-bold text-${color}-600">${item.value}%</span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-3">
                  <div class="${item.color} rounded-full h-3 transition-all duration-500" style="width: ${item.value}%"></div>
                </div>
              </div>
            `).join('')}
          </div>
          <div class="mt-4 bg-${color}-50 rounded-lg p-4 border-l-4 border-${color}-500">
            <p class="text-sm text-${color}-800">
              <i class="fas fa-lightbulb mr-2"></i>
              <strong>AI推薦:</strong> ${content.recommendation}
            </p>
          </div>
        </div>
      `;
      
    case 'chat':
      return `
        <div>
          <h4 class="font-bold text-gray-800 mb-3">${content.title}</h4>
          <p class="text-sm text-gray-600 mb-4">${content.description}</p>
          <div class="space-y-3">
            ${content.messages.map(msg => `
              <div class="${msg.role === 'student' ? 'text-right' : 'text-left'}">
                <div class="inline-block ${msg.role === 'student' ? 'bg-blue-100' : 'bg-gray-100'} rounded-lg px-4 py-3 max-w-[80%]">
                  <p class="text-xs font-semibold ${msg.role === 'student' ? 'text-blue-600' : 'text-gray-600'} mb-1">
                    ${msg.role === 'student' ? '👦 生徒' : '🤖 AI先生'}
                    ${msg.time ? `<span class="ml-2 text-gray-500">${msg.time}</span>` : ''}
                  </p>
                  <p class="text-sm text-gray-800">${msg.text}</p>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
      
    case 'progress':
      return `
        <div>
          <h4 class="font-bold text-gray-800 mb-3">${content.title}</h4>
          <p class="text-sm text-gray-600 mb-4">${content.description}</p>
          <div class="bg-${color}-50 rounded-lg p-6">
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm font-semibold text-gray-700">学習進捗</span>
              <span class="text-sm font-bold text-${color}-600">${content.progress} / ${content.total}枚</span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-4 mb-4">
              <div class="bg-${color}-500 rounded-full h-4 transition-all duration-500" style="width: ${(content.progress / content.total * 100)}%"></div>
            </div>
            <div class="bg-white rounded-lg p-4 border-l-4 border-${color}-500">
              <p class="text-xs font-semibold text-gray-600 mb-2">
                <i class="fas fa-user-tie mr-1"></i>
                先生からのメッセージ
              </p>
              <p class="text-sm text-gray-800">${content.teacherMessage}</p>
            </div>
          </div>
        </div>
      `;
      
    case 'voicememo':
      return `
        <div>
          <h4 class="font-bold text-gray-800 mb-3">${content.title}</h4>
          <p class="text-sm text-gray-600 mb-4">${content.description}</p>
          <div class="bg-gradient-to-br from-${color}-50 to-${color}-100 rounded-lg p-8 border-2 border-${color}-200">
            <div class="text-center">
              <div class="text-5xl mb-4">🎤</div>
              <div class="text-${color}-700">${content.placeholder}</div>
            </div>
          </div>
        </div>
      `;
      
    case 'visual':
    case 'kinesthetic':
    case 'ruby':
      return `
        <div>
          <h4 class="font-bold text-gray-800 mb-3">${content.title}</h4>
          <p class="text-sm text-gray-600 mb-4">${content.description}</p>
          <div class="bg-gradient-to-br from-${color}-50 to-${color}-100 rounded-lg p-8 min-h-[150px] flex items-center justify-center border-2 border-${color}-200">
            <div class="text-${color}-700 text-lg">${content.placeholder}</div>
          </div>
        </div>
      `;
      
    case 'auto':
      return `
        <div>
          <h4 class="font-bold text-gray-800 mb-3">${content.title}</h4>
          <p class="text-sm text-gray-600 mb-4">${content.description}</p>
          <div class="space-y-3">
            <div>
              <div class="flex items-center justify-between mb-1">
                <span class="text-sm font-semibold text-gray-700">視覚優位</span>
                <span class="text-sm font-bold text-red-600">${content.result.visual}%</span>
              </div>
              <div class="w-full bg-gray-200 rounded-full h-3">
                <div class="bg-red-500 rounded-full h-3" style="width: ${content.result.visual}%"></div>
              </div>
            </div>
            <div>
              <div class="flex items-center justify-between mb-1">
                <span class="text-sm font-semibold text-gray-700">聴覚優位</span>
                <span class="text-sm font-bold text-green-600">${content.result.auditory}%</span>
              </div>
              <div class="w-full bg-gray-200 rounded-full h-3">
                <div class="bg-green-500 rounded-full h-3" style="width: ${content.result.auditory}%"></div>
              </div>
            </div>
            <div>
              <div class="flex items-center justify-between mb-1">
                <span class="text-sm font-semibold text-gray-700">体験優位</span>
                <span class="text-sm font-bold text-blue-600">${content.result.kinesthetic}%</span>
              </div>
              <div class="w-full bg-gray-200 rounded-full h-3">
                <div class="bg-blue-500 rounded-full h-3" style="width: ${content.result.kinesthetic}%"></div>
              </div>
            </div>
          </div>
          <div class="mt-4 bg-${color}-50 rounded-lg p-4 border-l-4 border-${color}-500">
            <p class="text-sm text-${color}-800">
              <i class="fas fa-lightbulb mr-2"></i>
              <strong>AI判定:</strong> ${content.recommendation}
            </p>
          </div>
        </div>
      `;
      
    case 'generation':
      return `
        <div>
          <h4 class="font-bold text-gray-800 mb-3">${content.title}</h4>
          <p class="text-sm text-gray-600 mb-4">${content.description}</p>
          <div class="space-y-4">
            <div class="bg-gray-50 rounded-lg p-4 border-2 border-gray-200">
              <p class="text-xs font-semibold text-gray-600 mb-2">
                <i class="fas fa-edit mr-1"></i>
                入力
              </p>
              <p class="text-sm text-gray-800">${content.input}</p>
            </div>
            <div class="flex justify-center">
              <div class="text-${color}-600 text-2xl">
                <i class="fas fa-arrow-down"></i>
              </div>
            </div>
            <div class="bg-${color}-50 rounded-lg p-4 border-2 border-${color}-200">
              <p class="text-xs font-semibold text-${color}-600 mb-2">
                <i class="fas fa-check-circle mr-1"></i>
                出力
              </p>
              <div class="text-sm text-gray-800">${content.output}</div>
            </div>
          </div>
        </div>
      `;
      
    case 'advanced':
      return `
        <div>
          <h4 class="font-bold text-gray-800 mb-3">${content.title}</h4>
          <p class="text-sm text-gray-600 mb-4">${content.description}</p>
          <div class="bg-gray-50 rounded-lg p-4 mb-4">
            <p class="text-sm text-gray-700">
              <i class="fas fa-user mr-2"></i>
              現在の学年: <strong>${content.currentGrade}</strong>
            </p>
          </div>
          <div class="space-y-3">
            ${content.challenges.map(challenge => `
              <div class="bg-white rounded-lg p-4 border-2 border-${color}-200 hover:border-${color}-400 transition cursor-pointer">
                <div class="flex items-center justify-between">
                  <div>
                    <span class="inline-block bg-${color}-100 text-${color}-700 text-xs px-2 py-1 rounded mb-2">${challenge.grade}</span>
                    <p class="font-semibold text-gray-800">${challenge.topic}</p>
                  </div>
                  <i class="fas fa-chevron-right text-${color}-600"></i>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
      
    case 'multi':
      return `
        <div>
          <h4 class="font-bold text-gray-800 mb-3">${content.title}</h4>
          <p class="text-sm text-gray-600 mb-4">${content.description}</p>
          <div class="space-y-3">
            ${content.courses.map(course => `
              <div class="bg-white rounded-lg p-4 border-2 border-gray-200">
                <div class="flex items-center justify-between mb-2">
                  <span class="font-semibold text-gray-800">${course.title}</span>
                  <span class="text-xs ${course.status === '完了' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'} px-2 py-1 rounded">${course.status}</span>
                </div>
                <div class="flex items-center gap-2">
                  <div class="flex-1">
                    <div class="w-full bg-gray-200 rounded-full h-2">
                      <div class="bg-${color}-500 rounded-full h-2" style="width: ${(course.progress / course.total * 100)}%"></div>
                    </div>
                  </div>
                  <span class="text-xs font-semibold text-gray-600">${course.progress}/${course.total}</span>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
      
    case 'udl':
      return `
        <div>
          <h4 class="font-bold text-gray-800 mb-3">${content.title}</h4>
          <p class="text-sm text-gray-600 mb-4">${content.description}</p>
          <div class="space-y-3">
            ${content.styles.map(style => `
              <div class="bg-gradient-to-r from-${color}-50 to-white rounded-lg p-4 border-l-4 border-${color}-500">
                <p class="font-semibold text-${color}-700 mb-2">${style.type}</p>
                <p class="text-sm text-gray-700">${style.content}</p>
              </div>
            `).join('')}
          </div>
        </div>
      `;
      
    case 'support':
      return `
        <div>
          <h4 class="font-bold text-gray-800 mb-3">${content.title}</h4>
          <p class="text-sm text-gray-600 mb-4">${content.description}</p>
          <div class="grid grid-cols-2 gap-4">
            <div class="bg-blue-50 rounded-lg p-4 border-2 border-blue-200">
              <p class="font-semibold text-blue-700 mb-3 flex items-center">
                <i class="fas fa-robot mr-2"></i>
                AI先生
              </p>
              <div class="text-sm text-gray-700">${content.aiSupport}</div>
            </div>
            <div class="bg-green-50 rounded-lg p-4 border-2 border-green-200">
              <p class="font-semibold text-green-700 mb-3 flex items-center">
                <i class="fas fa-user-tie mr-2"></i>
                人間の先生
              </p>
              <div class="text-sm text-gray-700">${content.teacherSupport}</div>
            </div>
          </div>
        </div>
      `;
      
    case 'detection':
      return `
        <div>
          <h4 class="font-bold text-gray-800 mb-3">${content.title}</h4>
          <p class="text-sm text-gray-600 mb-4">${content.description}</p>
          <div class="bg-red-50 rounded-lg p-6 border-2 border-red-200">
            <div class="text-red-700">${content.alert}</div>
          </div>
        </div>
      `;
      
    case 'report':
      return `
        <div>
          <h4 class="font-bold text-gray-800 mb-3">${content.title}</h4>
          <p class="text-sm text-gray-600 mb-4">${content.description}</p>
          <div class="bg-${color}-50 rounded-lg p-6 border-2 border-${color}-200">
            <div class="text-gray-700 whitespace-pre-line">${content.report}</div>
          </div>
        </div>
      `;
      
    case 'steps':
      return `
        <div>
          <h4 class="font-bold text-gray-800 mb-3">${content.title}</h4>
          <p class="text-sm text-gray-600 mb-4">${content.description}</p>
          <div class="space-y-3">
            ${content.steps.map(step => `
              <div class="flex items-center gap-4 bg-white rounded-lg p-4 border-2 ${
                step.status === 'completed' ? 'border-green-200 bg-green-50' : 
                step.status === 'current' ? 'border-' + color + '-200 bg-' + color + '-50' : 
                'border-gray-200'
              }">
                <div class="w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                  step.status === 'completed' ? 'bg-green-500 text-white' : 
                  step.status === 'current' ? 'bg-' + color + '-500 text-white' : 
                  'bg-gray-200 text-gray-600'
                }">
                  ${step.status === 'completed' ? '<i class="fas fa-check"></i>' : step.step}
                </div>
                <div class="flex-1">
                  <p class="font-semibold text-gray-800">${step.title}</p>
                  <p class="text-xs text-gray-600">${step.time}</p>
                </div>
                ${step.status === 'current' ? '<i class="fas fa-spinner fa-spin text-' + color + '-600"></i>' : ''}
              </div>
            `).join('')}
          </div>
        </div>
      `;
      
    default:
      return `<p class="text-gray-600">デモ準備中...</p>`;
  }
}

// モーダルの外側をクリックしたら閉じる
document.addEventListener('DOMContentLoaded', function() {
  const modal = document.getElementById('demoModal');
  modal.addEventListener('click', function(e) {
    if (e.target === modal) {
      closeDemo();
    }
  });
});
