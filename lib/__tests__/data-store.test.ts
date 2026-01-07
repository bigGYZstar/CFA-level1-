import { describe, it, expect } from 'vitest';
import { 
  TOPICS, 
  createInitialProgress, 
  calculateNextReview, 
  validateData,
  exportToAnkiTSV,
  getStatistics,
} from '../data-store';
import type { Term, Example, Relation, LearningProgress } from '../types';

describe('TOPICS', () => {
  it('should have 10 topics', () => {
    expect(TOPICS).toHaveLength(10);
  });

  it('should have correct topic codes', () => {
    const codes = TOPICS.map(t => t.code);
    expect(codes).toContain('ETH');
    expect(codes).toContain('QM');
    expect(codes).toContain('ECON');
    expect(codes).toContain('FSA');
    expect(codes).toContain('CI');
    expect(codes).toContain('EQ');
    expect(codes).toContain('FI');
    expect(codes).toContain('DER');
    expect(codes).toContain('AI');
    expect(codes).toContain('PM');
  });

  it('should have term counts totaling 384', () => {
    const total = TOPICS.reduce((sum, t) => sum + t.term_count, 0);
    expect(total).toBe(384);
  });
});

describe('createInitialProgress', () => {
  it('should create initial progress with default values', () => {
    const progress = createInitialProgress('test_term');
    
    expect(progress.term_id).toBe('test_term');
    expect(progress.ease_factor).toBe(2.5);
    expect(progress.interval).toBe(0);
    expect(progress.repetitions).toBe(0);
    expect(progress.correct_count).toBe(0);
    expect(progress.incorrect_count).toBe(0);
    expect(progress.is_bookmarked).toBe(false);
    expect(progress.is_difficult).toBe(false);
  });

  it('should set next_review to today', () => {
    const progress = createInitialProgress('test_term');
    const today = new Date().toISOString().split('T')[0];
    expect(progress.next_review).toBe(today);
  });
});

describe('calculateNextReview', () => {
  it('should move to relearning on Again (SM2-Anki)', () => {
    const initial: LearningProgress = {
      term_id: 'test',
      ease_factor: 2.5,
      interval: 10,
      repetitions: 5,
      next_review: '2024-01-01',
      correct_count: 5,
      incorrect_count: 0,
      is_bookmarked: false,
      is_difficult: false,
      phase: 'review',
      learning_step: 0,
      stability: 10,
      difficulty: 5,
    };
    
    const result = calculateNextReview(initial, 0); // Again
    
    // SM2-Ankiでは、Againで再学習フェーズに移行
    expect(result.phase).toBe('relearning');
    // 再学習ステップ（10分）
    expect(result.interval).toBeCloseTo(10 / (24 * 60), 5);
    expect(result.incorrect_count).toBe(1);
    // Ease係数が減少
    expect(result.ease_factor).toBeLessThan(2.5);
  });

   it('should increase interval on correct answer (review phase)', () => {
    const initial: LearningProgress = {
      term_id: 'test',
      ease_factor: 2.5,
      interval: 6,
      repetitions: 2,
      next_review: '2024-01-01',
      correct_count: 2,
      incorrect_count: 0,
      is_bookmarked: false,
      is_difficult: false,
      phase: 'review', // 復習フェーズを明示
      learning_step: 0,
      stability: 6,
      difficulty: 5,
    };
    
    const result = calculateNextReview(initial, 3); // Good
    
    expect(result.repetitions).toBe(3);
    expect(result.interval).toBe(15); // 6 * 2.5 = 15
    expect(result.correct_count).toBe(3);
  });

  it('should start learning steps on first success (SM2-Anki)', () => {
    const initial = createInitialProgress('test');
    // SM2-Ankiでは、新規カードはGoodで学習ステップを進む
    // ステップ0→ステップ1（10分）
    const result = calculateNextReview(initial, 3); // Good
    
    // 学習ステップ1（10分 = 10/(24*60)日）
    expect(result.interval).toBeCloseTo(10 / (24 * 60), 5);
    expect(result.phase).toBe('learning');
  });

  it('should graduate to review phase after learning steps (SM2-Anki)', () => {
    // 学習ステップ1（最後のステップ）のカード
    const initial: LearningProgress = {
      term_id: 'test',
      ease_factor: 2.5,
      interval: 10 / (24 * 60), // 10分
      repetitions: 0,
      next_review: '2024-01-01',
      correct_count: 1,
      incorrect_count: 0,
      is_bookmarked: false,
      is_difficult: false,
      phase: 'learning',
      learning_step: 1, // 最後のステップ
      stability: 0,
      difficulty: 5,
    };
    
    const result = calculateNextReview(initial, 3); // Good
    
    // 卒業間隔（1日）で復習フェーズへ
    expect(result.interval).toBe(1);
    expect(result.phase).toBe('review');
    expect(result.repetitions).toBe(1);
  });

  it('should not let ease_factor go below 1.3', () => {
    const initial: LearningProgress = {
      term_id: 'test',
      ease_factor: 1.3,
      interval: 1,
      repetitions: 0,
      next_review: '2024-01-01',
      correct_count: 0,
      incorrect_count: 0,
      is_bookmarked: false,
      is_difficult: false,
    };
    
    const result = calculateNextReview(initial, 0);
    
    expect(result.ease_factor).toBeGreaterThanOrEqual(1.3);
  });
});

describe('validateData', () => {
  const sampleTerms: Term[] = [
    {
      term_id: 'term1',
      topic_code: 'ETH',
      en_canonical: 'Test Term 1',
      en_aliases: [],
      abbreviations: ['TT1'],
      jp_headword: 'テスト用語1',
      jp_reading: 'てすとようご1',
      jp_definition: 'テスト用語1の定義',
      key_points: ['ポイント1'],
      pitfall: '',
      formula: '',
    },
    {
      term_id: 'term2',
      topic_code: 'QM',
      en_canonical: 'Test Term 2',
      en_aliases: [],
      abbreviations: ['TT2'],
      jp_headword: 'テスト用語2',
      jp_reading: 'てすとようご2',
      jp_definition: 'テスト用語2の定義',
      key_points: [],
      pitfall: '',
      formula: '',
    },
  ];

  const sampleExamples: Example[] = [
    { term_id: 'term1', example_en: 'Example 1', example_jp: '例文1' },
    { term_id: 'term2', example_en: 'Example 2', example_jp: '例文2' },
  ];

  const sampleRelations: Relation[] = [
    { term_id: 'term1', related_term_id: 'term2', relation_type: 'related' },
  ];

  it('should pass validation for valid data', () => {
    const report = validateData(sampleTerms, sampleExamples, sampleRelations);
    
    expect(report.passed).toBe(true);
    expect(report.total_terms).toBe(2);
    expect(report.duplicate_count).toBe(0);
    expect(report.missing_definition).toHaveLength(0);
    expect(report.abbreviation_collisions).toHaveLength(0);
  });

  it('should detect duplicate term IDs', () => {
    const duplicateTerms = [...sampleTerms, { ...sampleTerms[0] }];
    const report = validateData(duplicateTerms, sampleExamples, sampleRelations);
    
    expect(report.duplicate_count).toBe(1);
    expect(report.passed).toBe(false);
  });

  it('should detect missing definitions', () => {
    const termsWithMissing = [
      ...sampleTerms,
      { ...sampleTerms[0], term_id: 'term3', jp_definition: '' },
    ];
    const report = validateData(termsWithMissing, sampleExamples, sampleRelations);
    
    expect(report.missing_definition).toContain('term3');
    expect(report.passed).toBe(false);
  });

  it('should detect abbreviation collisions', () => {
    const termsWithCollision = [
      sampleTerms[0],
      { ...sampleTerms[1], abbreviations: ['TT1'] }, // Same as term1
    ];
    const report = validateData(termsWithCollision, sampleExamples, sampleRelations);
    
    expect(report.abbreviation_collisions).toHaveLength(1);
    expect(report.passed).toBe(false);
  });

  it('should detect orphan relations', () => {
    const orphanRelations: Relation[] = [
      { term_id: 'term1', related_term_id: 'nonexistent', relation_type: 'related' },
    ];
    const report = validateData(sampleTerms, sampleExamples, orphanRelations);
    
    expect(report.orphan_relations).toHaveLength(1);
    expect(report.passed).toBe(false);
  });
});

describe('exportToAnkiTSV', () => {
  it('should export terms to TSV format', () => {
    const terms: Term[] = [
      {
        term_id: 'term1',
        topic_code: 'ETH',
        en_canonical: 'Test Term',
        en_aliases: [],
        abbreviations: [],
        jp_headword: 'テスト用語',
        jp_reading: 'てすとようご',
        jp_definition: 'テスト用語の定義',
        key_points: ['ポイント1', 'ポイント2'],
        pitfall: '注意点',
        formula: '',
      },
    ];
    
    const examples: Example[] = [
      { term_id: 'term1', example_en: 'Example sentence', example_jp: '例文' },
    ];
    
    const tsv = exportToAnkiTSV(terms, examples);
    
    expect(tsv).toContain('テスト用語');
    expect(tsv).toContain('Test Term');
    expect(tsv).toContain('ETH');
    expect(tsv).toContain('\t'); // Tab separator
  });
});

describe('getStatistics', () => {
  const sampleTerms: Term[] = [
    {
      term_id: 'term1',
      topic_code: 'ETH',
      en_canonical: 'Term 1',
      en_aliases: [],
      abbreviations: [],
      jp_headword: '用語1',
      jp_reading: 'ようご1',
      jp_definition: '定義1',
      key_points: [],
      pitfall: '',
      formula: '',
    },
    {
      term_id: 'term2',
      topic_code: 'ETH',
      en_canonical: 'Term 2',
      en_aliases: [],
      abbreviations: [],
      jp_headword: '用語2',
      jp_reading: 'ようご2',
      jp_definition: '定義2',
      key_points: [],
      pitfall: '',
      formula: '',
    },
  ];

  it('should calculate statistics correctly with no progress', () => {
    const stats = getStatistics(sampleTerms, {});
    
    expect(stats.total).toBe(2);
    expect(stats.learned).toBe(0);
    expect(stats.mastered).toBe(0);
    // 未学習の単語は復習対象に含めない（新規学習が必要）
    expect(stats.reviewDue).toBe(0);
  });

  it('should calculate statistics correctly with progress', () => {
    const progress: Record<string, LearningProgress> = {
      term1: {
        term_id: 'term1',
        ease_factor: 2.5,
        interval: 10,
        repetitions: 5,
        next_review: '2020-01-01', // Past date
        correct_count: 5,
        incorrect_count: 0,
        is_bookmarked: false,
        is_difficult: false,
        phase: 'review',
        learning_step: 0,
        stability: 10,
        difficulty: 5,
      },
    };
    
    const stats = getStatistics(sampleTerms, progress);
    
    expect(stats.learned).toBe(1);
    expect(stats.mastered).toBe(1); // repetitions >= 3
    // 未学習の単語は復習対象に含めない（学習済みで期限切れのみ）
    expect(stats.reviewDue).toBe(1); // 1 past due only
  });
});
