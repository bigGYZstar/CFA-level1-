# CFA Level I 単語帳アプリ - アーキテクチャドキュメント

## 概要

このアプリは、CFA Level I試験の学習を支援するモバイル単語帳アプリです。Expo SDK 54、React Native、TypeScriptを使用して開発されています。

## 設計思想

### 1. **学習効率の最大化**
- **Anki風SRSアルゴリズム**: SM2-Anki、FSRS、SM2 Classicの3つのアルゴリズムを実装し、ユーザーが選択可能
- **学習ステップ**: 新規カードは1分→10分→1日のステップで定着を図る
- **復習優先**: 復習期限を過ぎた単語を緊急度順に自動ソート

### 2. **ゲーミフィケーション**
- **RPG風バトルシステム**: 単語学習をRPGバトルに変換し、モチベーションを維持
- **敵キャラクター**: 学習回数に応じてスライム→ゴブリン→ゴーレム→ファントムと強敵に
- **スキルシステム**: 連続正解でスキルゲージが溜まり、強力な攻撃が可能

### 3. **データ駆動型学習**
- **学習統計**: 学習回数、習得率、復習必要数をリアルタイム表示
- **忘却曲線ダッシュボード**: 記憶定着率を可視化
- **トピック別進捗**: ETH、QM、ECON、FRA、EQなど科目別の進捗を追跡

### 4. **マルチモーダル学習**
- **音声読み上げ**: expo-speechを使用した英語例文の読み上げ
- **視覚的学習**: カラーコード化されたトピックバッジ、アイコン
- **例文重視**: 実際のCFA試験に即した例文で文脈理解を促進

## アーキテクチャ

### ディレクトリ構造

```
cfa-vocab-app/
├── app/                      # 画面コンポーネント（Expo Router）
│   ├── (tabs)/              # タブナビゲーション
│   │   ├── index.tsx        # ホーム画面
│   │   ├── quiz.tsx         # クイズモード
│   │   ├── battle.tsx       # バトルモード
│   │   └── settings.tsx     # 設定画面
│   ├── term/[id].tsx        # 用語詳細画面
│   ├── review.tsx           # 復習画面
│   └── _layout.tsx          # ルートレイアウト
├── assets/                   # 静的アセット
│   ├── data/                # JSONデータ
│   │   ├── terms.json       # 用語データ（384語）
│   │   ├── examples.json    # 例文データ
│   │   └── relations.json   # 関連語データ
│   └── sprites/             # ゲーム用スプライト
│       ├── enemies/         # 敵キャラクター
│       └── effects/         # エフェクト画像
├── components/              # 再利用可能なコンポーネント
│   ├── screen-container.tsx # SafeAreaラッパー
│   └── ui/                  # UIコンポーネント
│       └── icon-symbol.tsx  # アイコンマッピング
├── hooks/                   # カスタムフック
│   ├── use-colors.ts        # テーマカラー
│   ├── use-speech.ts        # 音声読み上げ
│   └── use-auth.ts          # 認証状態
├── lib/                     # ビジネスロジック
│   ├── data-store.ts        # データ永続化・管理
│   ├── srs-algorithms.ts    # SRSアルゴリズム実装
│   ├── game-store.ts        # ゲーム状態管理
│   ├── types.ts             # 型定義
│   └── __tests__/           # ユニットテスト
├── scripts/                 # ユーティリティスクリプト
│   ├── extract_effects.py   # スプライト切り出し
│   └── update_examples.py   # 例文更新
└── theme.config.js          # テーマ設定
```

### データモデル

#### 1. **Term（用語）**
```typescript
interface Term {
  term_id: string;           // 一意識別子（例: TERM0001）
  topic_code: TopicCode;     // トピックコード（ETH, QM, ECON等）
  en_canonical: string;      // 英語正式名称
  abbreviations: string[];   // 略語リスト
  jp_headword: string;       // 日本語見出し
  jp_reading: string;        // 読み仮名
  jp_definition: string;     // 日本語定義
  key_points: string[];      // 重要ポイント
  formula?: string;          // 公式（オプション）
  pitfall?: string;          // 混同注意（オプション）
}
```

#### 2. **LearningProgress（学習進捗）**
```typescript
interface LearningProgress {
  term_id: string;
  review_count: number;      // 復習回数
  correct_count: number;     // 正解回数
  last_review?: Date;        // 最終復習日時
  next_review?: Date;        // 次回復習日時
  ease_factor: number;       // 難易度係数（SM2）
  interval_days: number;     // 復習間隔（日数）
  is_bookmarked: boolean;    // ブックマーク
  // SM2-Anki用
  learning_step: number;     // 学習ステップ（0=新規, 1=1分, 2=10分, 3=1日, 4=復習）
  lapses: number;            // 失敗回数
  // FSRS用
  stability?: number;        // 記憶の安定性
  difficulty?: number;       // 難易度（1-10）
}
```

#### 3. **Example（例文）**
```typescript
interface Example {
  example_id: string;
  term_id: string;
  example_en: string;        // 英語例文
  example_jp: string;        // 日本語訳
}
```

### SRSアルゴリズム

#### 1. **SM2-Anki（推奨）**

**学習フェーズ:**
- **新規学習**: Again(1分) / Hard(6分) / Good(10分) / Easy(4日)
- **学習中**: Again(1分) / Hard(10分) / Good(1日) / Easy(4日)
- **復習**: Again(10分) / Hard(間隔×1.2) / Good(間隔×EF) / Easy(間隔×EF×1.3)

**Ease係数の更新:**
- Again: EF - 0.2（最小1.3）
- Hard: EF - 0.15
- Good: 変更なし
- Easy: EF + 0.15

**Lapse処理:**
- Againを押すと学習ステップに戻り、間隔を短縮
- Ease係数を0.2減少させ、忘れやすさを反映

#### 2. **FSRS（適応型）**

**忘却曲線:**
```
R(t, S) = 0.9^(t/S)
```
- R: 想起確率
- t: 経過日数
- S: Stability（記憶の安定性）

**次回間隔の計算:**
```
I = S × ln(r) / ln(0.9)
```
- I: 次回間隔
- r: 目標保持率（デフォルト0.90）

**Stabilityの更新:**
- 成功時: S_new = S × (1 + 0.1 × (5 - D))
- 失敗時: S_new = S × 0.5

**Difficultyの更新:**
- Again: D + 1（最大10）
- Hard: D + 0.5
- Good: 変更なし
- Easy: D - 0.5（最小1）

#### 3. **SM2 Classic**

SuperMemo2の原典実装。シンプルだが、学習ステップがなく、Ease係数の更新が単純。

### ゲームシステム

#### バトルメカニクス

**敵キャラクター:**
- **スライム**: 復習回数0-2回（HP: 50）
- **ゴブリン**: 復習回数3-5回（HP: 100）
- **ゴーレム**: 復習回数6-9回（HP: 150）
- **ファントム**: 復習回数10回以上（HP: 200）

**ダメージ計算:**
- Again: 0ダメージ（ミス）
- Hard: 基礎ダメージ × 0.7
- Good: 基礎ダメージ × 1.0
- Easy: 基礎ダメージ × 1.3

**スキルシステム:**
- 連続正解でスキルゲージが増加
- ゲージ満タンで強力な攻撃が可能
- スキル使用後はゲージリセット

### データ永続化

**AsyncStorage使用:**
- `@cfa_vocab/progress`: 学習進捗データ
- `@cfa_vocab/srs_settings`: SRSアルゴリズム設定
- `@cfa_vocab/display_settings`: 表示設定

**データ形式:**
```typescript
{
  "TERM0001": {
    "term_id": "TERM0001",
    "review_count": 5,
    "correct_count": 4,
    "ease_factor": 2.5,
    "interval_days": 7,
    "learning_step": 4,
    // ...
  },
  // ...
}
```

### 音声機能

**expo-speech使用:**
- 英語: `en-US`、再生速度0.85
- 日本語: `ja-JP`、再生速度0.9

**実装:**
```typescript
const { speakEnglish, isSpeaking, stop } = useSpeech();

// 英語例文を読み上げ
speakEnglish("Companies raise capital in the primary market...");
```

## テスト戦略

### ユニットテスト（vitest）

**カバレッジ:**
- `srs-algorithms.test.ts`: 22テスト（SM2、SM2-Anki、FSRSの動作検証）
- `data-store.test.ts`: 18テスト（データ永続化、統計計算）
- `game-store.test.ts`: 19テスト（バトルメカニクス、ダメージ計算）
- `review-due.test.ts`: 5テスト（復習期限判定）
- `data-store-update.test.ts`: 6テスト（データ更新）

**合計: 70テスト**

### テスト実行

```bash
pnpm test
```

## セットアップ手順

### 1. 依存関係のインストール

```bash
pnpm install
```

### 2. 開発サーバーの起動

```bash
pnpm dev
```

### 3. モバイルデバイスでの確認

Expo Goアプリをインストールし、QRコードをスキャン:

```bash
pnpm qr
```

### 4. テストの実行

```bash
pnpm test
```

## 環境変数

`.env`ファイルは不要です。すべての設定は`app.config.ts`と`theme.config.js`で管理されています。

## デプロイ

### Expo EASビルド

```bash
# iOSビルド
eas build --platform ios

# Androidビルド
eas build --platform android
```

### Web版

```bash
pnpm build
pnpm start
```

## 今後の拡張案

1. **クラウド同期**: 複数デバイス間での学習進捗同期
2. **プッシュ通知**: 復習リマインダー
3. **リスニングモード**: 音声を聞いて正しい用語を選ぶクイズ
4. **カスタムデッキ**: ユーザーが独自の単語セットを作成
5. **学習統計の可視化**: グラフとチャートで進捗を詳細に表示

## ライセンス

MIT License

## 作成者

Manus AI Agent

## 最終更新日

2025-01-07
