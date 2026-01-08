/**
 * テキスト理解モードと例題モードのデータ型定義
 */

/**
 * 科目コード
 */
export type SubjectCode = 
  | 'EQ'  // Equity Investments
  | 'FI'  // Fixed Income
  | 'DE'  // Derivatives
  | 'AI'  // Alternative Investments
  | 'PM'  // Portfolio Management
  | 'CF'  // Corporate Finance
  | 'QM'  // Quantitative Methods
  | 'EC'  // Economics
  | 'FRA' // Financial Reporting and Analysis
  | 'ETH'; // Ethics

/**
 * テキストコンテンツ（セクション単位）
 */
export interface TextContent {
  id: string;              // "EQ_MOS_2.1.1" (科目_Reading_セクション)
  subject: SubjectCode;    // "EQ"
  reading: string;         // "MOS" (Market Organization and Structure)
  readingTitle: string;    // "Market Organization and Structure"
  readingTitleJa: string;  // "市場組織と構造"
  section: string;         // "2.1.1"
  title: string;           // "Saving"
  titleJa: string;         // "貯蓄"
  content: string;         // 英語本文（要約）
  contentJa: string;       // 日本語訳
  keyPoints: string[];     // 重要ポイント（箇条書き）
  keyPointsJa: string[];   // 重要ポイント日本語訳
  checkQuestions: CheckQuestion[];  // 確認問題
  learningOutcome?: string;         // 学習目標
  learningOutcomeJa?: string;       // 学習目標日本語訳
  order: number;           // 表示順序
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 確認問題
 */
export interface CheckQuestion {
  id: string;              // "EQ_MOS_2.1.1_Q1"
  contentId: string;       // 親のTextContent.id
  question: string;        // 確認問題（英語）
  questionJa: string;      // 確認問題（日本語）
  options?: string[];      // 選択肢（英語）
  optionsJa?: string[];    // 選択肢（日本語）
  answer: string;          // 正解（英語）
  answerJa: string;        // 正解（日本語）
  explanation?: string;    // 解説（英語）
  explanationJa?: string;  // 解説（日本語）
  order: number;           // 問題番号
}

/**
 * 例題
 */
export interface ExampleProblem {
  id: string;              // "EQ_MOS_EX1"
  subject: SubjectCode;    // "EQ"
  reading: string;         // "MOS"
  readingTitle: string;    // "Market Organization and Structure"
  readingTitleJa: string;  // "市場組織と構造"
  exampleNumber: number;   // 1
  title: string;           // "Financing Capital Projects"
  titleJa: string;         // "資本プロジェクトの資金調達"
  problem: string;         // 問題文（英語）
  problemJa: string;       // 問題文（日本語）
  solution: string;        // 解答（英語）
  solutionJa: string;      // 解答（日本語）
  explanation: string;     // 解説（英語）
  explanationJa: string;   // 解説（日本語）
  relatedSection?: string; // "2.1.3" (関連セクション)
  difficulty: 'easy' | 'medium' | 'hard';  // 難易度
  order: number;           // 表示順序
  createdAt: Date;
  updatedAt: Date;
}

/**
 * テキストブック用の学習進捗ベース型
 * (LearningProgressとは独立した型として定義)
 */
export interface TextbookProgressBase {
  last_reviewed: Date;
  next_review: Date;
  easeFactor: number;      // SM-2: 初期値2.5
  interval: number;        // 日数
  repetitions: number;
  difficulty: number;      // FSRS: 難易度 (0-10)
  stability: number;       // FSRS: 安定性
  learningStep: number;    // 学習ステップの現在位置
  lapseCount: number;      // ラプス回数
  reviewHistory: Date[];   // 復習履歴
}

/**
 * テキスト理解の学習進捗
 */
export interface TextProgress extends TextbookProgressBase {
  contentId: string;       // TextContent.id
  type: 'text';
  checkQuestionResults: {
    [questionId: string]: {
      attempts: number;
      lastCorrect: boolean;
      lastAttemptDate: Date;
    };
  };
}

/**
 * 例題の学習進捗
 */
export interface ExampleProgress extends TextbookProgressBase {
  exampleId: string;       // ExampleProblem.id
  type: 'example';
  attempts: number;
  lastCorrect: boolean;
}

/**
 * Reading（章）の情報
 */
export interface ReadingInfo {
  id: string;              // "EQ_MOS"
  subject: SubjectCode;    // "EQ"
  code: string;            // "MOS"
  title: string;           // "Market Organization and Structure"
  titleJa: string;         // "市場組織と構造"
  description?: string;    // 章の説明
  descriptionJa?: string;  // 章の説明（日本語）
  order: number;           // 表示順序
  totalSections: number;   // セクション数
  totalExamples: number;   // 例題数
}

/**
 * 科目の情報
 */
export interface SubjectInfo {
  code: SubjectCode;
  name: string;            // "Equity Investments"
  nameJa: string;          // "株式投資"
  description?: string;
  descriptionJa?: string;
  order: number;
  totalReadings: number;
}

/**
 * 学習統計（テキスト理解・例題）
 */
export interface TextbookStatistics {
  totalTexts: number;
  totalExamples: number;
  masteredTexts: number;
  masteredExamples: number;
  reviewDueTexts: number;
  reviewDueExamples: number;
  averageTextAccuracy: number;
  averageExampleAccuracy: number;
}
