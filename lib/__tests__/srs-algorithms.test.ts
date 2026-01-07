import { describe, it, expect } from 'vitest';
import {
  createInitialProgress,
  calculateNextReview,
  previewIntervals,
  formatInterval,
  isReviewDue,
  getReviewUrgency,
  ALGORITHMS,
  type AnswerButton,
} from '../srs-algorithms';
import type { LearningProgress } from '../types';

describe('SRS Algorithms', () => {
  describe('createInitialProgress', () => {
    it('should create initial progress with correct defaults', () => {
      const progress = createInitialProgress('test_term_1');
      
      expect(progress.term_id).toBe('test_term_1');
      expect(progress.ease_factor).toBe(2.5);
      expect(progress.interval).toBe(0);
      expect(progress.repetitions).toBe(0);
      expect(progress.phase).toBe('new');
      expect(progress.learning_step).toBe(0);
      expect(progress.stability).toBe(0);
      expect(progress.difficulty).toBe(5);
    });
  });

  describe('SM2-Anki Algorithm', () => {
    it('should handle new card with Again - return to step 0', () => {
      const progress = createInitialProgress('test_term');
      const result = calculateNextReview(progress, 'again', 'sm2_anki');
      
      expect(result.phase).toBe('learning');
      expect(result.learning_step).toBe(0);
      expect(result.interval).toBeLessThan(1); // Less than 1 day (1 minute)
    });

    it('should handle new card with Good - advance to next step', () => {
      const progress = createInitialProgress('test_term');
      const result = calculateNextReview(progress, 'good', 'sm2_anki');
      
      expect(result.phase).toBe('learning');
      expect(result.learning_step).toBe(1);
      expect(result.interval).toBeLessThan(1); // 10 minutes
    });

    it('should handle new card with Easy - graduate immediately', () => {
      const progress = createInitialProgress('test_term');
      const result = calculateNextReview(progress, 'easy', 'sm2_anki');
      
      expect(result.phase).toBe('review');
      expect(result.interval).toBe(4); // Easy interval = 4 days
      expect(result.repetitions).toBe(1);
    });

    it('should graduate from learning to review after completing steps', () => {
      let progress = createInitialProgress('test_term');
      
      // Step 1: Good (1min -> 10min)
      progress = calculateNextReview(progress, 'good', 'sm2_anki');
      expect(progress.phase).toBe('learning');
      expect(progress.learning_step).toBe(1);
      
      // Step 2: Good (10min -> graduate to review)
      progress = calculateNextReview(progress, 'good', 'sm2_anki');
      expect(progress.phase).toBe('review');
      expect(progress.interval).toBe(1); // Graduating interval = 1 day
    });

    it('should handle review card with Again - enter relearning', () => {
      const progress: LearningProgress = {
        term_id: 'test_term',
        ease_factor: 2.5,
        interval: 10,
        repetitions: 3,
        next_review: '2025-01-01',
        correct_count: 3,
        incorrect_count: 0,
        is_bookmarked: false,
        is_difficult: false,
        phase: 'review',
        learning_step: 0,
        stability: 10,
        difficulty: 5,
      };
      
      const result = calculateNextReview(progress, 'again', 'sm2_anki');
      
      expect(result.phase).toBe('relearning');
      expect(result.ease_factor).toBeLessThan(2.5); // Ease decreased
      expect(result.interval).toBeLessThan(1); // 10 minutes
    });

    it('should handle review card with Good - extend interval', () => {
      const progress: LearningProgress = {
        term_id: 'test_term',
        ease_factor: 2.5,
        interval: 10,
        repetitions: 3,
        next_review: '2025-01-01',
        correct_count: 3,
        incorrect_count: 0,
        is_bookmarked: false,
        is_difficult: false,
        phase: 'review',
        learning_step: 0,
        stability: 10,
        difficulty: 5,
      };
      
      const result = calculateNextReview(progress, 'good', 'sm2_anki');
      
      expect(result.phase).toBe('review');
      expect(result.interval).toBe(25); // 10 * 2.5 = 25
      expect(result.repetitions).toBe(4);
    });
  });

  describe('SM2 Classic Algorithm', () => {
    it('should follow SM2 formula: I(1)=1, I(2)=6, I(n)=I(n-1)*EF', () => {
      let progress = createInitialProgress('test_term');
      
      // First review: I(1) = 1
      progress = calculateNextReview(progress, 'good', 'sm2');
      expect(progress.interval).toBe(1);
      
      // Second review: I(2) = 6
      progress = calculateNextReview(progress, 'good', 'sm2');
      expect(progress.interval).toBe(6);
      
      // Third review: I(3) = I(2) * EF (EF is updated after each review)
      // EF after 2 "good" reviews: 2.5 + 0.1 - (5-3)*(0.08+(5-3)*0.02) = 2.5 - 0.14 = 2.36 (approx)
      // Then updated again, so actual EF is around 2.22
      progress = calculateNextReview(progress, 'good', 'sm2');
      expect(progress.interval).toBeGreaterThanOrEqual(12); // 6 * ~2.2
      expect(progress.interval).toBeLessThanOrEqual(16);
    });

    it('should reset on failure', () => {
      const progress: LearningProgress = {
        term_id: 'test_term',
        ease_factor: 2.5,
        interval: 15,
        repetitions: 3,
        next_review: '2025-01-01',
        correct_count: 3,
        incorrect_count: 0,
        is_bookmarked: false,
        is_difficult: false,
        phase: 'review',
        learning_step: 0,
        stability: 0,
        difficulty: 5,
      };
      
      const result = calculateNextReview(progress, 'again', 'sm2');
      
      expect(result.interval).toBe(1);
      expect(result.repetitions).toBe(0);
    });
  });

  describe('FSRS Algorithm', () => {
    it('should initialize stability and difficulty for new cards', () => {
      const progress = createInitialProgress('test_term');
      const result = calculateNextReview(progress, 'good', 'fsrs');
      
      expect(result.stability).toBeGreaterThan(0);
      expect(result.difficulty).toBeGreaterThan(0);
      expect(result.difficulty).toBeLessThanOrEqual(10);
    });

    it('should increase stability on successful review', () => {
      const progress: LearningProgress = {
        term_id: 'test_term',
        ease_factor: 2.5,
        interval: 5,
        repetitions: 2,
        next_review: '2025-01-01',
        last_review: '2024-12-27',
        correct_count: 2,
        incorrect_count: 0,
        is_bookmarked: false,
        is_difficult: false,
        phase: 'review',
        learning_step: 0,
        stability: 5,
        difficulty: 5,
      };
      
      const result = calculateNextReview(progress, 'good', 'fsrs');
      
      expect(result.stability).toBeGreaterThan(5);
    });

    it('should decrease stability on failure', () => {
      const progress: LearningProgress = {
        term_id: 'test_term',
        ease_factor: 2.5,
        interval: 10,
        repetitions: 3,
        next_review: '2025-01-01',
        last_review: '2024-12-22',
        correct_count: 3,
        incorrect_count: 0,
        is_bookmarked: false,
        is_difficult: false,
        phase: 'review',
        learning_step: 0,
        stability: 10,
        difficulty: 5,
      };
      
      const result = calculateNextReview(progress, 'again', 'fsrs');
      
      expect(result.stability).toBeLessThan(10);
      expect(result.phase).toBe('relearning');
    });
  });

  describe('previewIntervals', () => {
    it('should return intervals for all buttons', () => {
      const progress = createInitialProgress('test_term');
      const previews = previewIntervals(progress, 'sm2_anki');
      
      expect(previews).toHaveProperty('again');
      expect(previews).toHaveProperty('hard');
      expect(previews).toHaveProperty('good');
      expect(previews).toHaveProperty('easy');
      
      // Again should have shortest interval
      expect(previews.again.minutes).toBeLessThanOrEqual(previews.hard.minutes);
      expect(previews.hard.minutes).toBeLessThanOrEqual(previews.good.minutes);
      expect(previews.good.minutes).toBeLessThanOrEqual(previews.easy.minutes);
    });
  });

  describe('formatInterval', () => {
    it('should format minutes correctly', () => {
      const result = formatInterval(1 / (24 * 60)); // 1 minute
      expect(result.label).toBe('1分');
    });

    it('should format hours correctly', () => {
      const result = formatInterval(2 / 24); // 2 hours
      expect(result.label).toBe('2時間');
    });

    it('should format days correctly', () => {
      const result = formatInterval(5);
      expect(result.label).toBe('5日');
    });

    it('should format months correctly', () => {
      const result = formatInterval(45);
      expect(result.label).toBe('1.5ヶ月');
    });

    it('should format years correctly', () => {
      const result = formatInterval(400);
      expect(result.label).toBe('1.1年');
    });
  });

  describe('isReviewDue', () => {
    it('should return true for past due date', () => {
      const progress: LearningProgress = {
        term_id: 'test_term',
        ease_factor: 2.5,
        interval: 1,
        repetitions: 1,
        next_review: '2020-01-01', // Past date
        correct_count: 1,
        incorrect_count: 0,
        is_bookmarked: false,
        is_difficult: false,
        phase: 'review',
        learning_step: 0,
        stability: 0,
        difficulty: 5,
      };
      
      expect(isReviewDue(progress)).toBe(true);
    });

    it('should return false for future due date', () => {
      const progress: LearningProgress = {
        term_id: 'test_term',
        ease_factor: 2.5,
        interval: 1,
        repetitions: 1,
        next_review: '2030-01-01', // Future date
        correct_count: 1,
        incorrect_count: 0,
        is_bookmarked: false,
        is_difficult: false,
        phase: 'review',
        learning_step: 0,
        stability: 0,
        difficulty: 5,
      };
      
      expect(isReviewDue(progress)).toBe(false);
    });
  });

  describe('ALGORITHMS constant', () => {
    it('should contain all three algorithms', () => {
      expect(ALGORITHMS.length).toBe(3);
      
      const ids = ALGORITHMS.map(a => a.id);
      expect(ids).toContain('sm2');
      expect(ids).toContain('sm2_anki');
      expect(ids).toContain('fsrs');
    });

    it('should have Japanese descriptions', () => {
      for (const algo of ALGORITHMS) {
        expect(algo.nameJp).toBeTruthy();
        expect(algo.descriptionJp).toBeTruthy();
      }
    });
  });
});
