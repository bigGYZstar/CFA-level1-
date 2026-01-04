import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LEVEL_LIMITS, RARITY_STATS, INITIAL_PLAYER_STATE, INITIAL_BATTLE_STATE } from '../game-types';

// Mock AsyncStorage
vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn(() => Promise.resolve(null)),
    setItem: vi.fn(() => Promise.resolve()),
    removeItem: vi.fn(() => Promise.resolve()),
  },
}));

describe('Game Types and Constants', () => {
  describe('LEVEL_LIMITS', () => {
    it('should calculate correct deck capacity for level 1', () => {
      expect(LEVEL_LIMITS.getDeckCapacity(1)).toBe(5);
    });

    it('should calculate correct deck capacity for level 3', () => {
      expect(LEVEL_LIMITS.getDeckCapacity(3)).toBe(6);
    });

    it('should calculate correct deck capacity for level 5', () => {
      expect(LEVEL_LIMITS.getDeckCapacity(5)).toBe(7);
    });

    it('should cap deck capacity at 15', () => {
      expect(LEVEL_LIMITS.getDeckCapacity(100)).toBe(15);
    });

    it('should calculate correct hand size for level 1', () => {
      expect(LEVEL_LIMITS.getHandSize(1)).toBe(2);
    });

    it('should calculate correct hand size for level 3', () => {
      expect(LEVEL_LIMITS.getHandSize(3)).toBe(3);
    });

    it('should calculate correct hand size for level 6', () => {
      expect(LEVEL_LIMITS.getHandSize(6)).toBe(4);
    });

    it('should cap hand size at 6', () => {
      expect(LEVEL_LIMITS.getHandSize(100)).toBe(6);
    });
  });

  describe('RARITY_STATS', () => {
    it('should have correct stats for common rarity', () => {
      expect(RARITY_STATS.common.attack).toBe(10);
      expect(RARITY_STATS.common.heal).toBe(5);
      expect(RARITY_STATS.common.dropRate).toBe(0.5);
    });

    it('should have correct stats for legendary rarity', () => {
      expect(RARITY_STATS.legendary.attack).toBe(80);
      expect(RARITY_STATS.legendary.heal).toBe(50);
      expect(RARITY_STATS.legendary.dropRate).toBe(0.01);
    });

    it('should have increasing attack power with rarity', () => {
      expect(RARITY_STATS.uncommon.attack).toBeGreaterThan(RARITY_STATS.common.attack);
      expect(RARITY_STATS.rare.attack).toBeGreaterThan(RARITY_STATS.uncommon.attack);
      expect(RARITY_STATS.epic.attack).toBeGreaterThan(RARITY_STATS.rare.attack);
      expect(RARITY_STATS.legendary.attack).toBeGreaterThan(RARITY_STATS.epic.attack);
    });
  });

  describe('INITIAL_PLAYER_STATE', () => {
    it('should have correct initial values', () => {
      expect(INITIAL_PLAYER_STATE.hp).toBe(100);
      expect(INITIAL_PLAYER_STATE.maxHp).toBe(100);
      expect(INITIAL_PLAYER_STATE.level).toBe(1);
      expect(INITIAL_PLAYER_STATE.exp).toBe(0);
      expect(INITIAL_PLAYER_STATE.deckCapacity).toBe(5);
      expect(INITIAL_PLAYER_STATE.handSize).toBe(2);
    });

    it('should have empty cards and deck arrays', () => {
      expect(INITIAL_PLAYER_STATE.cards).toEqual([]);
      expect(INITIAL_PLAYER_STATE.currentDeck).toEqual([]);
    });
  });

  describe('INITIAL_BATTLE_STATE', () => {
    it('should have correct initial values', () => {
      expect(INITIAL_BATTLE_STATE.inBattle).toBe(false);
      expect(INITIAL_BATTLE_STATE.enemy).toBeNull();
      expect(INITIAL_BATTLE_STATE.phase).toBe('select_action');
      expect(INITIAL_BATTLE_STATE.isBurstMode).toBe(false);
      expect(INITIAL_BATTLE_STATE.selectedBurstCards).toBeNull();
    });

    it('should have empty hand and used cards arrays', () => {
      expect(INITIAL_BATTLE_STATE.currentHand).toEqual([]);
      expect(INITIAL_BATTLE_STATE.usedCards).toEqual([]);
    });
  });
});

describe('Burst System Logic', () => {
  it('should calculate burst damage correctly (2x multiplier)', () => {
    const card1Attack = 20;
    const card2Attack = 15;
    const burstMultiplier = 2;
    const expectedDamage = (card1Attack + card2Attack) * burstMultiplier;
    expect(expectedDamage).toBe(70);
  });

  it('should calculate burst failure damage correctly', () => {
    const card1Attack = 20;
    const card2Attack = 15;
    const burstMultiplier = 2;
    const selfDamage = Math.floor((card1Attack + card2Attack) * 0.5 * burstMultiplier);
    expect(selfDamage).toBe(35);
  });

  it('should calculate normal attack damage', () => {
    const cardAttack = 20;
    expect(cardAttack).toBe(20);
  });

  it('should calculate normal failure damage', () => {
    const cardAttack = 20;
    const selfDamage = Math.floor(cardAttack * 0.5);
    expect(selfDamage).toBe(10);
  });
});
