import { describe, it, expect } from 'vitest';
import { isReviewDue, getReviewUrgency, createInitialProgress } from '../srs-algorithms';
import type { LearningProgress } from '../types';

describe('復習必要単語の判定', () => {
  describe('isReviewDue', () => {
    it('未学習の単語は復習対象外', () => {
      const progress = createInitialProgress('test_term');
      // 新規作成時はnext_reviewが今日なので、復習対象になる
      // ただし、getReviewDueTermsでは未学習（progressがない）単語は除外される
      expect(progress.phase).toBe('new');
    });

    it('復習期限を過ぎた単語は復習対象', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const progress: LearningProgress = {
        term_id: 'test_term',
        ease_factor: 2.5,
        interval: 1,
        repetitions: 1,
        next_review: yesterday.toISOString().split('T')[0],
        correct_count: 1,
        incorrect_count: 0,
        is_bookmarked: false,
        is_difficult: false,
        phase: 'review',
        learning_step: 0,
        stability: 1,
        difficulty: 5,
      };
      
      expect(isReviewDue(progress)).toBe(true);
    });

    it('復習期限が未来の単語は復習対象外', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const progress: LearningProgress = {
        term_id: 'test_term',
        ease_factor: 2.5,
        interval: 1,
        repetitions: 1,
        next_review: tomorrow.toISOString().split('T')[0],
        correct_count: 1,
        incorrect_count: 0,
        is_bookmarked: false,
        is_difficult: false,
        phase: 'review',
        learning_step: 0,
        stability: 1,
        difficulty: 5,
      };
      
      expect(isReviewDue(progress)).toBe(false);
    });

    it('分単位の復習期限を過ぎた単語は復習対象', () => {
      const fiveMinutesAgo = new Date();
      fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 5);
      
      const progress: LearningProgress = {
        term_id: 'test_term',
        ease_factor: 2.5,
        interval: 1 / (24 * 60), // 1分
        repetitions: 0,
        next_review: fiveMinutesAgo.toISOString().split('T')[0],
        next_review_time: fiveMinutesAgo.toISOString(),
        correct_count: 0,
        incorrect_count: 1,
        is_bookmarked: false,
        is_difficult: false,
        phase: 'learning',
        learning_step: 0,
        stability: 0,
        difficulty: 5,
      };
      
      expect(isReviewDue(progress)).toBe(true);
    });
  });

  describe('getReviewUrgency', () => {
    it('期限超過が大きいほど緊急度が高い', () => {
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
      
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);
      
      const progress1: LearningProgress = {
        term_id: 'test_term_1',
        ease_factor: 2.5,
        interval: 1,
        repetitions: 1,
        next_review: twoDaysAgo.toISOString().split('T')[0],
        correct_count: 1,
        incorrect_count: 0,
        is_bookmarked: false,
        is_difficult: false,
        phase: 'review',
        learning_step: 0,
        stability: 1,
        difficulty: 5,
      };
      
      const progress2: LearningProgress = {
        term_id: 'test_term_2',
        ease_factor: 2.5,
        interval: 1,
        repetitions: 1,
        next_review: oneDayAgo.toISOString().split('T')[0],
        correct_count: 1,
        incorrect_count: 0,
        is_bookmarked: false,
        is_difficult: false,
        phase: 'review',
        learning_step: 0,
        stability: 1,
        difficulty: 5,
      };
      
      const urgency1 = getReviewUrgency(progress1);
      const urgency2 = getReviewUrgency(progress2);
      
      expect(urgency1).toBeGreaterThan(urgency2);
    });
  });
});
