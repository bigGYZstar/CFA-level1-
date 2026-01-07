// CFA Level I 単語帳アプリ - データストア
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { 
  Term, Example, Relation, Abbreviation, Topic, 
  LearningProgress, AppState, QAReport, TopicCode, SRSAlgorithm, DisplaySettings
} from './types';
import {
  calculateNextReview as calcNextReview,
  createInitialProgress as createInitProgress,
  isReviewDue,
  getReviewUrgency,
  type AnswerButton,
} from './srs-algorithms';

// JSONデータをインポート
import termsData from '@/assets/data/terms.json';
import examplesData from '@/assets/data/examples.json';
import relationsData from '@/assets/data/relations.json';

const STORAGE_KEYS = {
  TERMS: 'cfa_terms',
  EXAMPLES: 'cfa_examples',
  RELATIONS: 'cfa_relations',
  ABBREVIATIONS: 'cfa_abbreviations',
  TOPICS: 'cfa_topics',
  PROGRESS: 'cfa_progress',
  QA_REPORT: 'cfa_qa_report',
  DATA_VERSION: 'cfa_data_version',
  SRS_SETTINGS: 'cfa_srs_settings',
  DISPLAY_SETTINGS: 'cfa_display_settings',
};

const CURRENT_DATA_VERSION = '1.0.0';

// 科目マスターデータのベース情報
const TOPIC_BASE: Omit<Topic, 'term_count'>[] = [
  { code: 'ETH', name_en: 'Ethics & Professional Standards', name_jp: '倫理・職業行為基準', color: '#4A90E2' },
  { code: 'QM', name_en: 'Quantitative Methods', name_jp: '定量分析', color: '#50E3C2' },
  { code: 'ECON', name_en: 'Economics', name_jp: '経済学', color: '#F5A623' },
  { code: 'FSA', name_en: 'Financial Statement Analysis', name_jp: '財務諸表分析', color: '#D0021B' },
  { code: 'CI', name_en: 'Corporate Issuers', name_jp: 'コーポレート・イシュアーズ', color: '#9013FE' },
  { code: 'EQ', name_en: 'Equity Investments', name_jp: '株式投資', color: '#417505' },
  { code: 'FI', name_en: 'Fixed Income', name_jp: '債券', color: '#BD10E0' },
  { code: 'DER', name_en: 'Derivatives', name_jp: 'デリバティブ', color: '#8B4513' },
  { code: 'AI', name_en: 'Alternative Investments', name_jp: 'オルタナティブ投資', color: '#7ED321' },
  { code: 'PM', name_en: 'Portfolio Management', name_jp: 'ポートフォリオ管理', color: '#B8E986' },
];

// 実際のデータから単語数を動的に計算
function calculateTopicCounts(): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const term of termsData as Term[]) {
    counts[term.topic_code] = (counts[term.topic_code] || 0) + 1;
  }
  return counts;
}

const topicCounts = calculateTopicCounts();

// 科目マスターデータ（実際の単語数を含む）
export const TOPICS: Topic[] = TOPIC_BASE.map(topic => ({
  ...topic,
  term_count: topicCounts[topic.code] || 0,
}));

// 組み込みデータ（200語）
const EMBEDDED_TERMS: Term[] = termsData as Term[];
const EMBEDDED_EXAMPLES: Example[] = examplesData as Example[];
const EMBEDDED_RELATIONS: Relation[] = relationsData as Relation[];

// データ保存
export async function saveTerms(terms: Term[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.TERMS, JSON.stringify(terms));
}

export async function saveExamples(examples: Example[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.EXAMPLES, JSON.stringify(examples));
}

export async function saveRelations(relations: Relation[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.RELATIONS, JSON.stringify(relations));
}

export async function saveProgress(progress: Record<string, LearningProgress>): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.PROGRESS, JSON.stringify(progress));
}

// データ読み込み
export async function loadTerms(): Promise<Term[]> {
  // 常に組み込みデータを返す（200語）
  return EMBEDDED_TERMS;
}

export async function loadExamples(): Promise<Example[]> {
  return EMBEDDED_EXAMPLES;
}

export async function loadRelations(): Promise<Relation[]> {
  return EMBEDDED_RELATIONS;
}

export async function loadProgress(): Promise<Record<string, LearningProgress>> {
  const data = await AsyncStorage.getItem(STORAGE_KEYS.PROGRESS);
  if (data) return JSON.parse(data);
  return {};
}

// 学習進捗の初期化
export function createInitialProgress(term_id: string): LearningProgress {
  return createInitProgress(term_id);
}

// 復習間隔計算（後方互換性のためのラッパー）
export function calculateNextReview(
  progress: LearningProgress,
  quality: 0 | 1 | 2 | 3 | 4 | 5, // 0-5: Again=0, Hard=2, Good=3, Easy=5
  algorithm: SRSAlgorithm = 'sm2_anki'
): LearningProgress {
  // qualityをAnswerButtonに変換
  const answer: AnswerButton = quality === 0 ? 'again' : quality <= 2 ? 'hard' : quality <= 3 ? 'good' : 'easy';
  return calcNextReview(progress, answer, algorithm);
}

// 新しいAPI: AnswerButtonを直接使用
export function calculateNextReviewWithButton(
  progress: LearningProgress,
  answer: AnswerButton,
  algorithm: SRSAlgorithm = 'sm2_anki'
): LearningProgress {
  return calcNextReview(progress, answer, algorithm);
}

// 今日の復習対象を取得（復習期限を過ぎた学習済み単語のみ、緊急度順）
export function getReviewDueTerms(
  terms: Term[],
  progress: Record<string, LearningProgress>
): Term[] {
  // 復習期限を過ぎた学習済み単語のみをフィルタリング
  const dueTerms = terms.filter(term => {
    const p = progress[term.term_id];
    // 未学習の単語は除外（復習ではなく新規学習が必要）
    if (!p) return false;
    // 復習期限を過ぎているかチェック（分単位も対応）
    return isReviewDue(p);
  });
  
  // 緊急度順にソート（期限超過が大きい順、次に間違い率が高い順）
  dueTerms.sort((a, b) => {
    const pA = progress[a.term_id];
    const pB = progress[b.term_id];
    
    // 緊急度を計算（分単位も対応）
    const urgencyA = getReviewUrgency(pA);
    const urgencyB = getReviewUrgency(pB);
    
    // 緊急度が高い順
    if (urgencyA !== urgencyB) {
      return urgencyB - urgencyA;
    }
    
    // 同じ緊急度の場合は間違い率が高い順
    const totalA = pA.correct_count + pA.incorrect_count;
    const totalB = pB.correct_count + pB.incorrect_count;
    const errorRateA = totalA > 0 ? pA.incorrect_count / totalA : 0;
    const errorRateB = totalB > 0 ? pB.incorrect_count / totalB : 0;
    
    return errorRateB - errorRateA;
  });
  
  return dueTerms;
}

// QA検証
export function validateData(
  terms: Term[],
  examples: Example[],
  relations: Relation[]
): QAReport {
  const report: QAReport = {
    total_terms: terms.length,
    duplicate_count: 0,
    missing_definition: [],
    missing_example: [],
    abbreviation_collisions: [],
    alias_collisions: [],
    orphan_relations: [],
    invalid_utf8: [],
    passed: true,
  };
  
  // 重複チェック
  const termIds = new Set<string>();
  for (const term of terms) {
    if (termIds.has(term.term_id)) {
      report.duplicate_count++;
    }
    termIds.add(term.term_id);
  }
  
  // 定義欠落チェック
  for (const term of terms) {
    if (!term.jp_definition || term.jp_definition.trim() === '') {
      report.missing_definition.push(term.term_id);
    }
  }
  
  // 例文欠落チェック
  const exampleTermIds = new Set(examples.map(e => e.term_id));
  for (const term of terms) {
    if (!exampleTermIds.has(term.term_id)) {
      report.missing_example.push(term.term_id);
    }
  }
  
  // 略語衝突チェック
  const abbrevMap = new Map<string, string[]>();
  for (const term of terms) {
    for (const abbrev of term.abbreviations) {
      const existing = abbrevMap.get(abbrev) || [];
      existing.push(term.term_id);
      abbrevMap.set(abbrev, existing);
    }
  }
  for (const [abbrev, ids] of abbrevMap) {
    if (ids.length > 1) {
      report.abbreviation_collisions.push(`${abbrev}: ${ids.join(', ')}`);
    }
  }
  
  // 孤立関連語チェック
  for (const rel of relations) {
    if (!termIds.has(rel.related_term_id)) {
      report.orphan_relations.push(`${rel.term_id} -> ${rel.related_term_id}`);
    }
  }
  
  // 合格判定
  report.passed = 
    report.duplicate_count === 0 &&
    report.missing_definition.length === 0 &&
    report.abbreviation_collisions.length === 0 &&
    report.orphan_relations.length === 0;
  
  return report;
}

// データエクスポート（Anki TSV形式）
export function exportToAnkiTSV(terms: Term[], examples: Example[]): string {
  const exampleMap = new Map(examples.map(e => [e.term_id, e]));
  const lines: string[] = [];
  
  for (const term of terms) {
    const example = exampleMap.get(term.term_id);
    const front = `${term.jp_headword}（${term.en_canonical}）`;
    const back = [
      term.jp_definition,
      '',
      `Key Points: ${term.key_points.join(' / ')}`,
      '',
      example ? `例文: ${example.example_en}` : '',
      example ? `訳: ${example.example_jp}` : '',
      '',
      `Pitfall: ${term.pitfall}`,
    ].filter(Boolean).join('<br>');
    
    const tags = term.topic_code;
    lines.push(`${front}\t${back}\t${tags}`);
  }
  
  return lines.join('\n');
}

// 統計情報を取得
export function getStatistics(
  terms: Term[],
  progress: Record<string, LearningProgress>
): {
  total: number;
  learned: number;
  mastered: number;
  reviewDue: number;
  byTopic: Record<TopicCode, { total: number; learned: number }>;
} {
  const today = new Date().toISOString().split('T')[0];
  const byTopic: Record<string, { total: number; learned: number }> = {};
  
  for (const topic of TOPICS) {
    byTopic[topic.code] = { total: 0, learned: 0 };
  }
  
  let learned = 0;
  let mastered = 0;
  let reviewDue = 0;
  
  for (const term of terms) {
    byTopic[term.topic_code].total++;
    
    const p = progress[term.term_id];
    if (p) {
      learned++;
      byTopic[term.topic_code].learned++;
      
      if (p.repetitions >= 3) {
        mastered++;
      }
      
      // 復習期限を過ぎた学習済み単語のみカウント
      if (p.next_review <= today) {
        reviewDue++;
      }
    }
    // 未学習は復習対象に含めない（新規学習が必要）
  }
  
  return {
    total: terms.length,
    learned,
    mastered,
    reviewDue,
    byTopic: byTopic as Record<TopicCode, { total: number; learned: number }>,
  };
}

// Term型を再エクスポート
export type { Term, Example, Relation, LearningProgress, TopicCode, SRSAlgorithm } from './types';
export { type AnswerButton } from './srs-algorithms';

// SRS設定の保存・読み込み
export async function saveSRSSettings(settings: { algorithm: SRSAlgorithm; targetRetention?: number }): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.SRS_SETTINGS, JSON.stringify(settings));
}

export async function loadSRSSettings(): Promise<{ algorithm: SRSAlgorithm; targetRetention: number }> {
  const data = await AsyncStorage.getItem(STORAGE_KEYS.SRS_SETTINGS);
  if (data) {
    const parsed = JSON.parse(data);
    return {
      algorithm: parsed.algorithm || 'sm2_anki',
      targetRetention: parsed.targetRetention || 0.9,
    };
  }
  return { algorithm: 'sm2_anki', targetRetention: 0.9 };
}

// dataStoreオブジェクト（ゲームストアから使用）
class DataStore {
  private terms: Term[] = termsData as Term[];
  private examples: Example[] = examplesData as Example[];
  private relations: Relation[] = relationsData as Relation[];
  private progress: Record<string, LearningProgress> = {};
  private srsAlgorithm: SRSAlgorithm = 'sm2_anki';
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;
    this.progress = await loadProgress();
    const srsSettings = await loadSRSSettings();
    this.srsAlgorithm = srsSettings.algorithm;
    this.initialized = true;
  }

  getTerms(): Term[] {
    return this.terms;
  }

  getTermById(termId: string): Term | undefined {
    return this.terms.find(t => t.term_id === termId);
  }

  getExamples(): Example[] {
    return this.examples;
  }

  getRelations(): Relation[] {
    return this.relations;
  }

  getProgress(): Record<string, LearningProgress> {
    return this.progress;
  }

  getSRSAlgorithm(): SRSAlgorithm {
    return this.srsAlgorithm;
  }

  async setSRSAlgorithm(algorithm: SRSAlgorithm): Promise<void> {
    this.srsAlgorithm = algorithm;
    await saveSRSSettings({ algorithm });
  }

  async recordStudy(termId: string, correct: boolean): Promise<void> {
    console.log('[DataStore] recordStudy called:', termId, correct);
    console.log('[DataStore] initialized:', this.initialized);
    
    // 初期化されていない場合は初期化
    if (!this.initialized) {
      await this.initialize();
    }
    
    const term = this.getTermById(termId);
    console.log('[DataStore] term found:', term?.term_id);
    if (!term) return;

    const id = term.term_id;
    let progress = this.progress[id];
    
    if (!progress) {
      progress = createInitialProgress(id);
    }

    // 選択されたアルゴリズムで次回復習日を計算
    const answer: AnswerButton = correct ? 'good' : 'again';
    const result = calculateNextReviewWithButton(progress, answer, this.srsAlgorithm);

    this.progress[id] = result;
    console.log('[DataStore] Saving progress for term:', id, 'result:', result);
    await saveProgress(this.progress);
    console.log('[DataStore] Progress saved successfully');
  }
}

export const dataStore = new DataStore();
