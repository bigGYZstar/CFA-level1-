// CFA Level I 単語帳アプリ - データ型定義

// 科目コード
export type TopicCode = 'ETH' | 'QM' | 'ECON' | 'FSA' | 'CI' | 'EQ' | 'FI' | 'DER' | 'AI' | 'PM';

// 科目情報
export interface Topic {
  code: TopicCode;
  name_en: string;
  name_jp: string;
  color: string;
  term_count: number;
}

// 用語データ
export interface Term {
  term_id: string;
  topic_code: TopicCode;
  en_canonical: string;
  en_aliases: string[];
  abbreviations: string[];
  jp_headword: string;
  jp_reading: string;
  jp_definition: string;
  key_points: string[];
  pitfall: string;
  formula?: string;
  notes?: string;
}

// 例文データ
export interface Example {
  term_id: string;
  example_en: string;
  example_jp: string;
}

// 関連語データ
export interface Relation {
  term_id: string;
  related_term_id: string;
  relation_type: 'related' | 'contrast';
}

// 略語データ
export interface Abbreviation {
  abbreviation: string;
  full_form: string;
  term_id: string;
}

// 学習進捗データ
export interface LearningProgress {
  term_id: string;
  ease_factor: number; // SM-2: 初期値2.5
  interval: number; // 日数
  repetitions: number;
  next_review: string; // ISO date string
  last_review?: string;
  correct_count: number;
  incorrect_count: number;
  is_bookmarked: boolean;
  is_difficult: boolean;
  user_notes?: string;
}

// クイズ設定
export interface QuizSettings {
  topic_codes: TopicCode[];
  question_type: 'multiple_choice' | 'input' | 'fill_blank';
  question_count: number;
  prioritize_review: boolean;
  difficulty: 'pitfall' | 'definition' | 'example';
}

// クイズ問題
export interface QuizQuestion {
  term_id: string;
  question_type: 'multiple_choice' | 'input' | 'fill_blank';
  question_text: string;
  correct_answer: string;
  options?: string[]; // 四択用
  explanation?: string;
}

// クイズ結果
export interface QuizResult {
  question: QuizQuestion;
  user_answer: string;
  is_correct: boolean;
  time_taken: number; // seconds
}

// QAレポート
export interface QAReport {
  total_terms: number;
  duplicate_count: number;
  missing_definition: string[];
  missing_example: string[];
  abbreviation_collisions: string[];
  alias_collisions: string[];
  orphan_relations: string[];
  invalid_utf8: string[];
  passed: boolean;
}

// 完全な用語データ（結合済み）
export interface FullTerm extends Term {
  example?: Example;
  relations: Relation[];
}

// アプリ状態
export interface AppState {
  terms: Term[];
  examples: Example[];
  relations: Relation[];
  abbreviations: Abbreviation[];
  topics: Topic[];
  progress: Record<string, LearningProgress>;
  qa_report?: QAReport;
  last_sync?: string;
}

// フィルター設定
export interface FilterSettings {
  topics: TopicCode[];
  tags: ('unlearned' | 'review_due' | 'difficult' | 'bookmarked')[];
  search_query: string;
  sort_by: 'frequency' | 'added_date' | 'review_due';
}

// 表示設定
export interface DisplaySettings {
  show_english_first: boolean;
  hide_example: boolean;
  hide_translation: boolean;
  hide_definition: boolean;
  enable_tts: boolean;
}
