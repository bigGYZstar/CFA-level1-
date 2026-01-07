/**
 * SRS (Spaced Repetition System) アルゴリズムモジュール
 * 
 * 3つのアルゴリズムを提供:
 * 1. SM2 (SuperMemo 2) - 従来のシンプルなアルゴリズム
 * 2. SM2-Anki - Ankiの学習ステップを追加した改良版（推奨）
 * 3. FSRS - ユーザーデータに適応する機械学習風アルゴリズム
 * 
 * 参考: Anki Manual, FSRS Algorithm Documentation
 */

import type { LearningProgress, LearningPhase, SRSAlgorithm } from './types';

// 回答ボタンタイプ
export type AnswerButton = 'again' | 'hard' | 'good' | 'easy';

// 次回復習までの間隔情報
export interface IntervalInfo {
  label: string; // 表示用ラベル（例: "1分", "10分", "1日"）
  minutes: number; // 分単位の間隔
  days: number; // 日単位の間隔（分単位の場合は小数）
}

// アルゴリズム情報
export interface AlgorithmInfo {
  id: SRSAlgorithm;
  name: string;
  nameJp: string;
  description: string;
  descriptionJp: string;
}

// アルゴリズム一覧
export const ALGORITHMS: AlgorithmInfo[] = [
  {
    id: 'sm2',
    name: 'SM2 (SuperMemo 2)',
    nameJp: 'SM2（従来版）',
    description: 'Classic algorithm from 1987. I(1)=1day, I(2)=6days, I(n)=I(n-1)×EF. Simple and predictable.',
    descriptionJp: '1987年開発の従来アルゴリズム。I(1)=1日, I(2)=6日, I(n)=I(n-1)×EF。シンプルで予測しやすい。',
  },
  {
    id: 'sm2_anki',
    name: 'SM2-Anki (Recommended)',
    nameJp: 'SM2-Anki（推奨）',
    description: 'Enhanced SM2 with learning steps (1min→10min→1day). Lapse handling with interval reduction.',
    descriptionJp: 'Ankiの学習ステップ（1分→10分→1日）を追加。失敗時は間隔減少とEase低下。初期学習に最適。',
  },
  {
    id: 'fsrs',
    name: 'FSRS (Adaptive)',
    nameJp: 'FSRS（適応型）',
    description: 'Uses S(Stability) and D(Difficulty). Forgetting curve: R=0.9^(t/S). Interval: I=S×ln(r)/ln(0.9).',
    descriptionJp: 'S（安定性）とD（難易度）で記憶状態を管理。忘却曲線R=0.9^(t/S)。目標保持率から間隔を逆算。',
  },
];

// ============================================
// SM2-Anki 設定（Ankiのデフォルト値に準拠）
// ============================================

// 学習ステップ（分単位）
const LEARNING_STEPS = [1, 10]; // 1分、10分
const RELEARNING_STEPS = [10]; // 10分

// 卒業間隔（学習完了後の最初の復習間隔）
const GRADUATING_INTERVAL = 1; // 1日
const EASY_INTERVAL = 4; // Easyボタンで即卒業時の間隔

// Ease係数の設定
const STARTING_EASE = 2.5; // 初期Ease
const MINIMUM_EASE = 1.3; // 最小Ease
const EASY_BONUS = 1.3; // Easyボタンの倍率
const HARD_INTERVAL_MULTIPLIER = 1.2; // Hardボタンの倍率

// Lapse（失敗）時の設定
const NEW_INTERVAL_AFTER_LAPSE = 0.0; // 失敗後の間隔（0=最小に戻す）
const MINIMUM_INTERVAL = 1; // 最小間隔（日）
const LAPSE_EASE_DECREASE = 0.2; // 失敗時のEase減少量

// ============================================
// FSRS 設定
// ============================================

// FSRSパラメータ（デフォルト値 - 実際は学習データから最適化される）
const FSRS_PARAMS = {
  // 初期安定性（グレード別）
  w0: 0.4, // Again
  w1: 0.6, // Hard
  w2: 2.4, // Good
  w3: 5.8, // Easy
  // Difficulty関連
  w4: 4.93, // 初期難易度
  w5: 0.94, // 難易度更新係数
  w6: 0.86, // 難易度更新係数
  w7: 0.01, // 難易度更新係数
  // Stability更新（成功時）
  w8: 1.49,
  w9: 0.14,
  w10: 0.94,
  w11: 2.18,
  w12: 0.05,
  w13: 0.34,
  w14: 1.26,
  // Stability更新（失敗時）
  w15: 0.29,
  w16: 2.61,
};

// 目標保持率（デフォルト90%）
const DEFAULT_TARGET_RETENTION = 0.9;
const MAXIMUM_INTERVAL = 36500; // 最大間隔（100年）

/**
 * 進捗の初期化
 */
export function createInitialProgress(term_id: string): LearningProgress {
  return {
    term_id,
    ease_factor: STARTING_EASE,
    interval: 0,
    repetitions: 0,
    next_review: new Date().toISOString().split('T')[0],
    correct_count: 0,
    incorrect_count: 0,
    is_bookmarked: false,
    is_difficult: false,
    phase: 'new',
    learning_step: 0,
    stability: 0,
    difficulty: 5, // FSRS: 1-10の中央値
  };
}

/**
 * 次回復習間隔を計算（メインエントリポイント）
 */
export function calculateNextReview(
  progress: LearningProgress,
  answer: AnswerButton,
  algorithm: SRSAlgorithm = 'sm2_anki'
): LearningProgress {
  switch (algorithm) {
    case 'sm2':
      return calculateSM2(progress, answer);
    case 'sm2_anki':
      return calculateSM2Anki(progress, answer);
    case 'fsrs':
      return calculateFSRS(progress, answer);
    default:
      return calculateSM2Anki(progress, answer);
  }
}

/**
 * 各ボタンの次回間隔をプレビュー
 */
export function previewIntervals(
  progress: LearningProgress,
  algorithm: SRSAlgorithm = 'sm2_anki'
): Record<AnswerButton, IntervalInfo> {
  const buttons: AnswerButton[] = ['again', 'hard', 'good', 'easy'];
  const result: Record<AnswerButton, IntervalInfo> = {} as Record<AnswerButton, IntervalInfo>;

  for (const button of buttons) {
    const nextProgress = calculateNextReview({ ...progress }, button, algorithm);
    result[button] = formatInterval(nextProgress.interval);
  }

  return result;
}

/**
 * 間隔を表示用にフォーマット
 */
export function formatInterval(days: number): IntervalInfo {
  const minutes = Math.round(days * 24 * 60);
  
  if (minutes < 60) {
    return { label: `${Math.max(1, minutes)}分`, minutes: Math.max(1, minutes), days };
  } else if (minutes < 24 * 60) {
    const hours = Math.round(minutes / 60);
    return { label: `${hours}時間`, minutes, days };
  } else if (days < 30) {
    const d = Math.round(days);
    return { label: `${d}日`, minutes, days };
  } else if (days < 365) {
    const months = Math.round(days / 30 * 10) / 10;
    return { label: `${months}ヶ月`, minutes, days };
  } else {
    const years = Math.round(days / 365 * 10) / 10;
    return { label: `${years}年`, minutes, days };
  }
}

// ============================================
// SM2 アルゴリズム（従来版）
// I(1)=1, I(2)=6, I(n)=I(n-1)×EF
// ============================================

function calculateSM2(progress: LearningProgress, answer: AnswerButton): LearningProgress {
  const quality = answerToQuality(answer);
  let { ease_factor, interval, repetitions } = progress;

  if (quality < 3) {
    // 失敗: リセット
    repetitions = 0;
    interval = 1;
  } else {
    // 成功: SM-2の基本式
    if (repetitions === 0) {
      interval = 1; // I(1) = 1
    } else if (repetitions === 1) {
      interval = 6; // I(2) = 6
    } else {
      interval = Math.round(interval * ease_factor); // I(n) = I(n-1) × EF
    }
    repetitions += 1;
  }

  // Ease Factor更新（SM-2の原典式）
  // EF' = EF + (0.1 - (5-q) × (0.08 + (5-q) × 0.02))
  ease_factor = ease_factor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (ease_factor < MINIMUM_EASE) ease_factor = MINIMUM_EASE;

  const next_review = new Date();
  next_review.setDate(next_review.getDate() + interval);

  return {
    ...progress,
    ease_factor,
    interval,
    repetitions,
    next_review: next_review.toISOString().split('T')[0],
    last_review: new Date().toISOString().split('T')[0],
    correct_count: quality >= 3 ? progress.correct_count + 1 : progress.correct_count,
    incorrect_count: quality < 3 ? progress.incorrect_count + 1 : progress.incorrect_count,
    phase: 'review',
  };
}

// ============================================
// SM2-Anki アルゴリズム（学習ステップ付き）
// ============================================

function calculateSM2Anki(progress: LearningProgress, answer: AnswerButton): LearningProgress {
  const phase = progress.phase || 'new';
  const learningStep = progress.learning_step || 0;
  let { ease_factor, interval, repetitions } = progress;

  let newPhase: LearningPhase = phase;
  let newStep = learningStep;
  let newInterval = interval;
  let isCorrect = answer !== 'again';

  const now = new Date();

  switch (phase) {
    case 'new':
    case 'learning':
      // 新規/学習中フェーズ
      if (answer === 'again') {
        // 最初のステップに戻る
        newStep = 0;
        newInterval = LEARNING_STEPS[0] / (24 * 60); // 1分を日数に変換
        newPhase = 'learning';
      } else if (answer === 'hard') {
        // 現在のステップの間隔を1.5倍にして繰り返す
        const currentStepMinutes = LEARNING_STEPS[Math.min(newStep, LEARNING_STEPS.length - 1)];
        const avgMinutes = newStep < LEARNING_STEPS.length - 1 
          ? (currentStepMinutes + LEARNING_STEPS[newStep + 1]) / 2
          : currentStepMinutes * 1.5;
        newInterval = avgMinutes / (24 * 60);
        newPhase = 'learning';
      } else if (answer === 'good') {
        // 次のステップへ
        if (newStep < LEARNING_STEPS.length - 1) {
          newStep++;
          newInterval = LEARNING_STEPS[newStep] / (24 * 60);
          newPhase = 'learning';
        } else {
          // 学習完了 → 復習フェーズへ（卒業）
          newInterval = GRADUATING_INTERVAL;
          newPhase = 'review';
          repetitions = 1;
        }
      } else if (answer === 'easy') {
        // 即座に復習フェーズへ（Easy卒業）
        newInterval = EASY_INTERVAL;
        newPhase = 'review';
        repetitions = 1;
        ease_factor = Math.min(ease_factor + 0.15, 2.5);
      }
      break;

    case 'review':
      // 復習フェーズ
      if (answer === 'again') {
        // Lapse（失敗）: 再学習フェーズへ
        newStep = 0;
        newInterval = RELEARNING_STEPS[0] / (24 * 60); // 10分
        newPhase = 'relearning';
        // Ease減少
        ease_factor = Math.max(ease_factor - LAPSE_EASE_DECREASE, MINIMUM_EASE);
      } else if (answer === 'hard') {
        // Hard: 間隔を少し伸ばす（現在の間隔 × 1.2）
        newInterval = Math.max(interval * HARD_INTERVAL_MULTIPLIER, interval + 1);
        // Ease少し減少
        ease_factor = Math.max(ease_factor - 0.15, MINIMUM_EASE);
        repetitions++;
      } else if (answer === 'good') {
        // Good: 通常の間隔延長（間隔 × Ease）
        newInterval = interval * ease_factor;
        repetitions++;
      } else if (answer === 'easy') {
        // Easy: 大きく間隔を伸ばす（間隔 × Ease × EasyBonus）
        newInterval = interval * ease_factor * EASY_BONUS;
        // Ease増加
        ease_factor = Math.min(ease_factor + 0.15, 2.5);
        repetitions++;
      }
      break;

    case 'relearning':
      // 再学習フェーズ（Lapse後）
      if (answer === 'again') {
        // 最初のステップに戻る
        newStep = 0;
        newInterval = RELEARNING_STEPS[0] / (24 * 60);
      } else if (answer === 'hard') {
        // 現在のステップを繰り返す
        const currentStepMinutes = RELEARNING_STEPS[Math.min(newStep, RELEARNING_STEPS.length - 1)];
        newInterval = (currentStepMinutes * 1.5) / (24 * 60);
      } else if (answer === 'good') {
        if (newStep < RELEARNING_STEPS.length - 1) {
          newStep++;
          newInterval = RELEARNING_STEPS[newStep] / (24 * 60);
        } else {
          // 復習フェーズに戻る（間隔は失敗前の一定割合）
          const lapseInterval = NEW_INTERVAL_AFTER_LAPSE > 0 
            ? Math.max(MINIMUM_INTERVAL, interval * NEW_INTERVAL_AFTER_LAPSE)
            : MINIMUM_INTERVAL;
          newInterval = lapseInterval;
          newPhase = 'review';
        }
      } else if (answer === 'easy') {
        // 即座に復習フェーズへ
        newInterval = Math.max(MINIMUM_INTERVAL, interval);
        newPhase = 'review';
      }
      break;
  }

  // 次回復習日時を計算
  let next_review: string;
  let next_review_time: string | undefined;

  if (newInterval < 1) {
    // 分単位の場合
    const nextTime = new Date(now.getTime() + newInterval * 24 * 60 * 60 * 1000);
    next_review = nextTime.toISOString().split('T')[0];
    next_review_time = nextTime.toISOString();
  } else {
    // 日単位の場合
    const nextDate = new Date(now);
    nextDate.setDate(nextDate.getDate() + Math.round(newInterval));
    next_review = nextDate.toISOString().split('T')[0];
    next_review_time = undefined;
  }

  return {
    ...progress,
    ease_factor,
    interval: newInterval,
    repetitions,
    next_review,
    next_review_time,
    last_review: now.toISOString().split('T')[0],
    correct_count: isCorrect ? progress.correct_count + 1 : progress.correct_count,
    incorrect_count: !isCorrect ? progress.incorrect_count + 1 : progress.incorrect_count,
    phase: newPhase,
    learning_step: newStep,
  };
}

// ============================================
// FSRS アルゴリズム（適応型）
// S（Stability）: 想起確率が90%に落ちるまでの日数
// D（Difficulty）: 難易度（1-10）
// R（Retrievability）: 想起確率 = 0.9^(t/S)
// I（Interval）: 次の間隔 = S × ln(r) / ln(0.9)
// ============================================

function calculateFSRS(progress: LearningProgress, answer: AnswerButton): LearningProgress {
  const grade = answerToGrade(answer); // 1-4
  const phase = progress.phase || 'new';
  let stability = progress.stability || 0;
  let difficulty = progress.difficulty || 5;
  let { interval, repetitions, ease_factor } = progress;

  const now = new Date();
  let newPhase: LearningPhase = phase;
  let newInterval: number;
  let isCorrect = grade >= 2; // Hard以上は成功

  // 経過日数を計算
  const lastReviewDate = progress.last_review ? new Date(progress.last_review) : now;
  const elapsedDays = Math.max(0, (now.getTime() - lastReviewDate.getTime()) / (1000 * 60 * 60 * 24));

  if (phase === 'new' || stability === 0) {
    // 新規カード: 初期安定性と難易度を設定
    stability = initialStability(grade);
    difficulty = initialDifficulty(grade);
    
    if (grade === 1) {
      // Again: 学習ステップへ
      newInterval = 1 / (24 * 60); // 1分
      newPhase = 'learning';
    } else {
      // Hard/Good/Easy: 復習フェーズへ
      newInterval = calculateIntervalFromStability(stability, DEFAULT_TARGET_RETENTION);
      if (grade === 2) newInterval *= 0.8; // Hard
      if (grade === 4) newInterval *= 1.3; // Easy
      newPhase = 'review';
      repetitions = 1;
    }
  } else if (phase === 'learning' || phase === 'relearning') {
    // 学習/再学習フェーズ
    if (grade === 1) {
      newInterval = 1 / (24 * 60); // 1分
      stability = stability * 0.5;
    } else if (grade === 2) {
      newInterval = 10 / (24 * 60); // 10分
    } else {
      // Good/Easy: 復習フェーズへ
      newInterval = calculateIntervalFromStability(stability, DEFAULT_TARGET_RETENTION);
      if (grade === 4) newInterval *= 1.3;
      newPhase = 'review';
      repetitions++;
    }
  } else {
    // 復習フェーズ
    // 現在の想起確率を計算: R = 0.9^(t/S)
    const retrievability = Math.pow(0.9, elapsedDays / Math.max(stability, 0.1));

    if (grade === 1) {
      // Again（失敗）: 再学習へ
      // 失敗後の安定性: S'_f
      stability = postLapseStability(difficulty, stability, retrievability);
      difficulty = updateDifficulty(difficulty, grade);
      newInterval = 10 / (24 * 60); // 10分
      newPhase = 'relearning';
    } else {
      // 成功: 安定性を更新
      // S'_r = S × (1 + 増加係数)
      stability = successStability(difficulty, stability, retrievability, grade);
      difficulty = updateDifficulty(difficulty, grade);
      
      // 目標保持率から間隔を計算
      newInterval = calculateIntervalFromStability(stability, DEFAULT_TARGET_RETENTION);
      
      // Hard/Easyの調整
      if (grade === 2) newInterval *= 0.8;
      if (grade === 4) newInterval *= 1.3;
      
      newInterval = Math.min(newInterval, MAXIMUM_INTERVAL);
      repetitions++;
    }
  }

  // 次回復習日時を計算
  let next_review: string;
  let next_review_time: string | undefined;

  if (newInterval < 1) {
    const nextTime = new Date(now.getTime() + newInterval * 24 * 60 * 60 * 1000);
    next_review = nextTime.toISOString().split('T')[0];
    next_review_time = nextTime.toISOString();
  } else {
    const nextDate = new Date(now);
    nextDate.setDate(nextDate.getDate() + Math.round(newInterval));
    next_review = nextDate.toISOString().split('T')[0];
  }

  // ease_factorも更新（互換性のため）
  ease_factor = 1.3 + (10 - difficulty) / 10 * 1.2;

  return {
    ...progress,
    ease_factor,
    interval: newInterval,
    repetitions,
    next_review,
    next_review_time,
    last_review: now.toISOString().split('T')[0],
    correct_count: isCorrect ? progress.correct_count + 1 : progress.correct_count,
    incorrect_count: !isCorrect ? progress.incorrect_count + 1 : progress.incorrect_count,
    phase: newPhase,
    stability,
    difficulty,
  };
}

// ============================================
// FSRS ヘルパー関数
// ============================================

/**
 * 初期安定性（グレード別）
 * S0(G) = w[G-1]
 */
function initialStability(grade: number): number {
  const w = [FSRS_PARAMS.w0, FSRS_PARAMS.w1, FSRS_PARAMS.w2, FSRS_PARAMS.w3];
  return w[grade - 1] || FSRS_PARAMS.w2;
}

/**
 * 初期難易度
 * D0(G) = w4 - (G-3) × w5
 */
function initialDifficulty(grade: number): number {
  const d = FSRS_PARAMS.w4 - (grade - 3) * FSRS_PARAMS.w5;
  return clamp(d, 1, 10);
}

/**
 * 難易度の更新
 * D' = D - w6 × (G - 3) + mean_reversion
 */
function updateDifficulty(d: number, grade: number): number {
  const delta = -FSRS_PARAMS.w6 * (grade - 3);
  // Mean reversion（平均への回帰）
  const meanReversion = FSRS_PARAMS.w7 * (FSRS_PARAMS.w4 - d);
  const newD = d + delta + meanReversion;
  return clamp(newD, 1, 10);
}

/**
 * 成功時の安定性更新
 * S'_r = S × (1 + e^(w8) × (11-D) × S^(-w9) × (e^(w10×(1-R))-1) × hardPenalty × easyBonus)
 */
function successStability(d: number, s: number, r: number, grade: number): number {
  const hardPenalty = grade === 2 ? FSRS_PARAMS.w15 : 1;
  const easyBonus = grade === 4 ? FSRS_PARAMS.w16 : 1;
  
  const factor = Math.exp(FSRS_PARAMS.w8) *
    (11 - d) *
    Math.pow(s, -FSRS_PARAMS.w9) *
    (Math.exp(FSRS_PARAMS.w10 * (1 - r)) - 1) *
    hardPenalty *
    easyBonus;
  
  return s * (1 + factor);
}

/**
 * 失敗後の安定性
 * S'_f = w11 × D^(-w12) × ((S+1)^w13 - 1) × e^(w14×(1-R))
 */
function postLapseStability(d: number, s: number, r: number): number {
  const newS = FSRS_PARAMS.w11 *
    Math.pow(d, -FSRS_PARAMS.w12) *
    (Math.pow(s + 1, FSRS_PARAMS.w13) - 1) *
    Math.exp(FSRS_PARAMS.w14 * (1 - r));
  
  return Math.max(0.1, newS); // 最小値を保証
}

/**
 * 安定性から間隔を計算
 * I = S × ln(r) / ln(0.9)
 * r = 目標保持率（デフォルト0.9）
 */
function calculateIntervalFromStability(s: number, targetRetention: number): number {
  // I = S × ln(r) / ln(0.9)
  // r = 0.9 の場合、I = S
  const interval = s * Math.log(targetRetention) / Math.log(0.9);
  return Math.max(1, interval);
}

// ============================================
// ユーティリティ関数
// ============================================

function answerToQuality(answer: AnswerButton): number {
  switch (answer) {
    case 'again': return 0;
    case 'hard': return 2;
    case 'good': return 3;
    case 'easy': return 5;
  }
}

function answerToGrade(answer: AnswerButton): number {
  switch (answer) {
    case 'again': return 1;
    case 'hard': return 2;
    case 'good': return 3;
    case 'easy': return 4;
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * 復習期限を過ぎているかチェック
 */
export function isReviewDue(progress: LearningProgress): boolean {
  const now = new Date();
  
  // 分単位の復習がある場合
  if (progress.next_review_time) {
    return new Date(progress.next_review_time) <= now;
  }
  
  // 日単位の復習
  const today = now.toISOString().split('T')[0];
  return progress.next_review <= today;
}

/**
 * 復習の緊急度を計算（ソート用）
 */
export function getReviewUrgency(progress: LearningProgress): number {
  const now = new Date();
  
  if (progress.next_review_time) {
    const dueTime = new Date(progress.next_review_time);
    return (now.getTime() - dueTime.getTime()) / (1000 * 60); // 分単位の超過
  }
  
  const today = new Date(now.toISOString().split('T')[0]);
  const dueDate = new Date(progress.next_review);
  return (today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24); // 日単位の超過
}
