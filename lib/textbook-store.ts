/**
 * テキストブックデータストア
 * テキスト理解モードと例題モードのデータ管理とSRS統合
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  TextContent,
  ExampleProblem,
  TextProgress,
  ExampleProgress,
  ReadingInfo,
  SubjectInfo,
  TextbookStatistics,
  CheckQuestion,
  TextbookProgressBase,
} from './textbook-types';
import type { SRSAlgorithm } from './types';

export interface SRSSettings {
  algorithm: SRSAlgorithm;
  targetRetention: number;
}

const STORAGE_KEYS = {
  TEXT_PROGRESS: '@cfa_text_progress',
  EXAMPLE_PROGRESS: '@cfa_example_progress',
  TEXTBOOK_DATA: '@cfa_textbook_data',
};

// 学習ステップ（分単位）
const LEARNING_STEPS = [1, 10, 1440]; // 1分、10分、1日

/**
 * テキストブック用のSRS計算
 */
function calculateTextbookNextReview(
  rating: 'again' | 'hard' | 'good' | 'easy',
  progress: TextbookProgressBase,
  algorithm: SRSAlgorithm
): Partial<TextbookProgressBase> {
  const now = new Date();
  let newInterval = progress.interval;
  let newEaseFactor = progress.easeFactor;
  let newRepetitions = progress.repetitions;
  let newLearningStep = progress.learningStep;
  let newLapseCount = progress.lapseCount;
  let newDifficulty = progress.difficulty;
  let newStability = progress.stability;

  // 学習ステップ中かどうか
  const isLearning = progress.learningStep < LEARNING_STEPS.length;

  if (algorithm === 'sm2_anki') {
    if (rating === 'again') {
      // ラプス: 学習ステップに戻る
      newLearningStep = 0;
      newLapseCount = progress.lapseCount + 1;
      newEaseFactor = Math.max(1.3, progress.easeFactor - 0.2);
      newInterval = LEARNING_STEPS[0] / 1440; // 分を日に変換
    } else if (isLearning) {
      // 学習中
      if (rating === 'easy') {
        // Easy: 学習完了、4日後
        newLearningStep = LEARNING_STEPS.length;
        newInterval = 4;
        newRepetitions = 1;
      } else if (rating === 'good') {
        // Good: 次のステップへ
        newLearningStep = progress.learningStep + 1;
        if (newLearningStep >= LEARNING_STEPS.length) {
          // 学習完了
          newInterval = 1;
          newRepetitions = 1;
        } else {
          newInterval = LEARNING_STEPS[newLearningStep] / 1440;
        }
      } else {
        // Hard: 現在のステップを繰り返し
        newInterval = LEARNING_STEPS[progress.learningStep] / 1440 * 1.2;
      }
    } else {
      // 復習中
      if (rating === 'hard') {
        newInterval = progress.interval * 1.2;
        newEaseFactor = Math.max(1.3, progress.easeFactor - 0.15);
      } else if (rating === 'good') {
        newInterval = progress.interval * progress.easeFactor;
        newRepetitions = progress.repetitions + 1;
      } else if (rating === 'easy') {
        newInterval = progress.interval * progress.easeFactor * 1.3;
        newEaseFactor = progress.easeFactor + 0.15;
        newRepetitions = progress.repetitions + 1;
      }
    }
  } else if (algorithm === 'fsrs') {
    // FSRS簡易実装
    const ratingMap = { again: 1, hard: 2, good: 3, easy: 4 };
    const grade = ratingMap[rating];
    
    // 難易度更新
    newDifficulty = Math.min(10, Math.max(1, progress.difficulty - (grade - 3) * 0.5));
    
    // 安定性更新
    if (rating === 'again') {
      newStability = progress.stability * 0.5;
      newLapseCount = progress.lapseCount + 1;
    } else {
      const stabilityIncrease = 1 + (grade - 2) * 0.3 * (11 - newDifficulty) / 10;
      newStability = progress.stability * stabilityIncrease;
    }
    
    // 間隔計算
    newInterval = newStability * Math.log(0.9) / Math.log(0.5);
    newRepetitions = progress.repetitions + 1;
  } else {
    // SM2 Classic
    if (rating === 'again') {
      newRepetitions = 0;
      newInterval = 1;
      newEaseFactor = Math.max(1.3, progress.easeFactor - 0.2);
    } else {
      newRepetitions = progress.repetitions + 1;
      if (newRepetitions === 1) {
        newInterval = 1;
      } else if (newRepetitions === 2) {
        newInterval = 6;
      } else {
        newInterval = progress.interval * progress.easeFactor;
      }
      
      if (rating === 'hard') {
        newEaseFactor = Math.max(1.3, progress.easeFactor - 0.15);
      } else if (rating === 'easy') {
        newEaseFactor = progress.easeFactor + 0.15;
      }
    }
  }

  // 次回復習日時を計算
  const nextReview = new Date(now.getTime() + newInterval * 24 * 60 * 60 * 1000);

  return {
    last_reviewed: now,
    next_review: nextReview,
    easeFactor: newEaseFactor,
    interval: newInterval,
    repetitions: newRepetitions,
    learningStep: newLearningStep,
    lapseCount: newLapseCount,
    difficulty: newDifficulty,
    stability: newStability,
    reviewHistory: [...progress.reviewHistory, now],
  };
}

/**
 * 復習が必要かどうかを判定
 */
function isTextbookReviewDue(progress: TextbookProgressBase, now: Date): boolean {
  return progress.next_review <= now;
}

/**
 * テキストブックデータストアクラス
 */
export class TextbookStore {
  private textContents: Map<string, TextContent> = new Map();
  private examples: Map<string, ExampleProblem> = new Map();
  public readings: Map<string, ReadingInfo> = new Map();
  private subjects: Map<string, SubjectInfo> = new Map();
  private textProgress: Map<string, TextProgress> = new Map();
  private exampleProgress: Map<string, ExampleProgress> = new Map();

  /**
   * 初期化：ストレージからデータを読み込む
   */
  async initialize(): Promise<void> {
    await Promise.all([
      this.loadTextbookData(),
      this.loadTextProgress(),
      this.loadExampleProgress(),
    ]);
  }

  /**
   * テキストブックデータを読み込む
   */
  private async loadTextbookData(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.TEXTBOOK_DATA);
      if (data) {
        const parsed = JSON.parse(data);
        
        // Subjects
        if (parsed.subjects) {
          parsed.subjects.forEach((subject: SubjectInfo) => {
            this.subjects.set(subject.code, subject);
          });
        }
        
        // Readings
        if (parsed.readings) {
          parsed.readings.forEach((reading: ReadingInfo) => {
            this.readings.set(reading.id, reading);
          });
        }
        
        // Text Contents
        if (parsed.textContents) {
          parsed.textContents.forEach((content: TextContent) => {
            this.textContents.set(content.id, {
              ...content,
              createdAt: new Date(content.createdAt),
              updatedAt: new Date(content.updatedAt),
            });
          });
        }
        
        // Examples
        if (parsed.examples) {
          parsed.examples.forEach((example: ExampleProblem) => {
            this.examples.set(example.id, {
              ...example,
              createdAt: new Date(example.createdAt),
              updatedAt: new Date(example.updatedAt),
            });
          });
        }
      } else {
        // 初回起動時：サンプルデータを読み込む
        await this.loadSampleData();
      }
    } catch (error) {
      console.error('Failed to load textbook data:', error);
      await this.loadSampleData();
    }
  }

  /**
   * サンプルデータを読み込む
   */
  private async loadSampleData(): Promise<void> {
    try {
      const sampleData = require('../data/textbook-sample.json');
      await AsyncStorage.setItem(STORAGE_KEYS.TEXTBOOK_DATA, JSON.stringify(sampleData));
      await this.loadTextbookData();
    } catch (error) {
      console.error('Failed to load sample data:', error);
    }
  }

  /**
   * テキスト進捗を読み込む
   */
  private async loadTextProgress(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.TEXT_PROGRESS);
      if (data) {
        const parsed = JSON.parse(data);
        Object.entries(parsed).forEach(([id, progress]: [string, any]) => {
          this.textProgress.set(id, {
            ...progress,
            last_reviewed: new Date(progress.last_reviewed),
            next_review: new Date(progress.next_review),
            reviewHistory: (progress.reviewHistory || []).map((d: string) => new Date(d)),
          });
        });
      }
    } catch (error) {
      console.error('Failed to load text progress:', error);
    }
  }

  /**
   * 例題進捗を読み込む
   */
  private async loadExampleProgress(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.EXAMPLE_PROGRESS);
      if (data) {
        const parsed = JSON.parse(data);
        Object.entries(parsed).forEach(([id, progress]: [string, any]) => {
          this.exampleProgress.set(id, {
            ...progress,
            last_reviewed: new Date(progress.last_reviewed),
            next_review: new Date(progress.next_review),
            reviewHistory: (progress.reviewHistory || []).map((d: string) => new Date(d)),
          });
        });
      }
    } catch (error) {
      console.error('Failed to load example progress:', error);
    }
  }

  /**
   * テキスト進捗を保存
   */
  private async saveTextProgress(): Promise<void> {
    const data: Record<string, TextProgress> = {};
    this.textProgress.forEach((progress, id) => {
      data[id] = progress;
    });
    await AsyncStorage.setItem(STORAGE_KEYS.TEXT_PROGRESS, JSON.stringify(data));
  }

  /**
   * 例題進捗を保存
   */
  private async saveExampleProgress(): Promise<void> {
    const data: Record<string, ExampleProgress> = {};
    this.exampleProgress.forEach((progress, id) => {
      data[id] = progress;
    });
    await AsyncStorage.setItem(STORAGE_KEYS.EXAMPLE_PROGRESS, JSON.stringify(data));
  }

  /**
   * 全科目を取得
   */
  getSubjects(): SubjectInfo[] {
    return Array.from(this.subjects.values()).sort((a, b) => a.order - b.order);
  }

  /**
   * 科目別のReadingを取得
   */
  getReadingsBySubject(subjectCode: string): ReadingInfo[] {
    return Array.from(this.readings.values())
      .filter(r => r.subject === subjectCode)
      .sort((a, b) => a.order - b.order);
  }

  /**
   * Reading別のテキストコンテンツを取得
   */
  getTextContentsByReading(readingId: string): TextContent[] {
    return Array.from(this.textContents.values())
      .filter(c => `${c.subject}_${c.reading}` === readingId)
      .sort((a, b) => a.order - b.order);
  }

  /**
   * Reading別の例題を取得
   */
  getExamplesByReading(readingId: string): ExampleProblem[] {
    return Array.from(this.examples.values())
      .filter(e => `${e.subject}_${e.reading}` === readingId)
      .sort((a, b) => a.order - b.order);
  }

  /**
   * テキストコンテンツを取得
   */
  getTextContent(id: string): TextContent | undefined {
    return this.textContents.get(id);
  }

  /**
   * 例題を取得
   */
  getExample(id: string): ExampleProblem | undefined {
    return this.examples.get(id);
  }

  /**
   * テキスト進捗を取得
   */
  getTextProgress(contentId: string): TextProgress | undefined {
    return this.textProgress.get(contentId);
  }

  /**
   * 例題進捗を取得
   */
  getExampleProgress(exampleId: string): ExampleProgress | undefined {
    return this.exampleProgress.get(exampleId);
  }

  /**
   * 復習が必要なテキストを取得
   */
  getReviewDueTexts(srsSettings: SRSSettings): TextContent[] {
    const now = new Date();
    return Array.from(this.textContents.values()).filter(content => {
      const progress = this.textProgress.get(content.id);
      return progress && isTextbookReviewDue(progress, now);
    }).sort((a, b) => {
      const progressA = this.textProgress.get(a.id)!;
      const progressB = this.textProgress.get(b.id)!;
      return progressA.next_review.getTime() - progressB.next_review.getTime();
    });
  }

  /**
   * 復習が必要な例題を取得
   */
  getReviewDueExamples(srsSettings: SRSSettings): ExampleProblem[] {
    const now = new Date();
    return Array.from(this.examples.values()).filter(example => {
      const progress = this.exampleProgress.get(example.id);
      return progress && isTextbookReviewDue(progress, now);
    }).sort((a, b) => {
      const progressA = this.exampleProgress.get(a.id)!;
      const progressB = this.exampleProgress.get(b.id)!;
      return progressA.next_review.getTime() - progressB.next_review.getTime();
    });
  }

  /**
   * テキスト理解の学習を記録
   */
  async recordTextReview(
    contentId: string,
    rating: 'again' | 'hard' | 'good' | 'easy',
    srsSettings: SRSSettings
  ): Promise<void> {
    const content = this.textContents.get(contentId);
    if (!content) return;

    let progress = this.textProgress.get(contentId);
    if (!progress) {
      progress = {
        contentId,
        type: 'text',
        last_reviewed: new Date(),
        next_review: new Date(),
        easeFactor: 2.5,
        interval: 0,
        repetitions: 0,
        difficulty: 5,
        stability: 1,
        learningStep: 0,
        lapseCount: 0,
        reviewHistory: [],
        checkQuestionResults: {},
      };
    }

    const result = calculateTextbookNextReview(rating, progress, srsSettings.algorithm);
    this.textProgress.set(contentId, { ...progress, ...result } as TextProgress);
    await this.saveTextProgress();
  }

  /**
   * 例題の学習を記録
   */
  async recordExampleReview(
    exampleId: string,
    rating: 'again' | 'hard' | 'good' | 'easy',
    srsSettings: SRSSettings
  ): Promise<void> {
    const example = this.examples.get(exampleId);
    if (!example) return;

    let progress = this.exampleProgress.get(exampleId);
    if (!progress) {
      progress = {
        exampleId,
        type: 'example',
        last_reviewed: new Date(),
        next_review: new Date(),
        easeFactor: 2.5,
        interval: 0,
        repetitions: 0,
        difficulty: 5,
        stability: 1,
        learningStep: 0,
        lapseCount: 0,
        reviewHistory: [],
        attempts: 0,
        lastCorrect: false,
      };
    }

    const result = calculateTextbookNextReview(rating, progress, srsSettings.algorithm);
    this.exampleProgress.set(exampleId, {
      ...progress,
      ...result,
      attempts: progress.attempts + 1,
      lastCorrect: rating === 'good' || rating === 'easy',
    } as ExampleProgress);
    await this.saveExampleProgress();
  }

  /**
   * 統計情報を取得
   */
  getStatistics(srsSettings: SRSSettings): TextbookStatistics {
    const totalTexts = this.textContents.size;
    const totalExamples = this.examples.size;
    
    const reviewDueTexts = this.getReviewDueTexts(srsSettings).length;
    const reviewDueExamples = this.getReviewDueExamples(srsSettings).length;
    
    let masteredTexts = 0;
    let masteredExamples = 0;
    
    this.textProgress.forEach(progress => {
      if (progress.repetitions >= 3 && progress.interval >= 21) {
        masteredTexts++;
      }
    });
    
    this.exampleProgress.forEach(progress => {
      if (progress.repetitions >= 3 && progress.interval >= 21) {
        masteredExamples++;
      }
    });
    
    return {
      totalTexts,
      totalExamples,
      masteredTexts,
      masteredExamples,
      reviewDueTexts,
      reviewDueExamples,
      averageTextAccuracy: 0, // TODO: 実装
      averageExampleAccuracy: 0, // TODO: 実装
    };
  }
}

// シングルトンインスタンス
export const textbookStore = new TextbookStore();
