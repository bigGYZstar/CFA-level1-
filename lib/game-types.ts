// RPGミニゲームの型定義

// カードのレアリティ（難易度に対応）
export type CardRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

// 単語カード
export interface WordCard {
  id: string;
  termId: string;        // terms.jsonのIDと紐付け
  term: string;          // 英語用語
  termJa: string;        // 日本語訳
  rarity: CardRarity;
  attackPower: number;   // 攻撃力
  healPower: number;     // 回復力
  acquired: boolean;     // 取得済みか
  acquiredAt?: number;   // 取得日時
  usageCount: number;    // 使用回数
  successCount: number;  // クイズ正解回数
}

// プレイヤー状態
export interface PlayerState {
  hp: number;
  maxHp: number;
  level: number;
  exp: number;
  expToNextLevel: number;
  totalBattles: number;
  totalWins: number;
  cards: WordCard[];
  currentDeck: string[]; // カードID配列（最大5枚）
}

// 敵キャラクター
export interface Enemy {
  id: string;
  name: string;
  nameJa: string;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  expReward: number;
  cardDropRate: number;  // カードドロップ率 0-1
  sprite: string;        // 絵文字やアイコン
}

// バトル状態
export interface BattleState {
  inBattle: boolean;
  enemy: Enemy | null;
  playerHp: number;
  enemyHp: number;
  turn: 'player' | 'enemy';
  phase: 'select_action' | 'quiz' | 'result' | 'battle_end';
  selectedCard: WordCard | null;
  quizQuestion: QuizQuestion | null;
  battleLog: BattleLogEntry[];
  earnedCards: WordCard[];
  earnedExp: number;
}

// クイズ問題
export interface QuizQuestion {
  termId: string;
  question: string;
  questionType: 'jp_to_en' | 'en_to_jp' | 'concept';  // 日本語→英語 | 英語→日本語 | 概念説明
  correctAnswer: string;
  options: string[];
}

// バトルログエントリ
export interface BattleLogEntry {
  turn: number;
  actor: 'player' | 'enemy';
  action: string;
  damage?: number;
  heal?: number;
  message: string;
}

// ゲーム全体の状態
export interface GameState {
  player: PlayerState;
  battle: BattleState;
  unlockedStages: number[];
  currentStage: number;
}

// ステージ定義
export interface Stage {
  id: number;
  name: string;
  nameJa: string;
  description: string;
  enemies: Enemy[];
  requiredLevel: number;
  topicCode?: string;  // 特定の科目に関連
}

// レアリティ別のステータス設定
export const RARITY_STATS: Record<CardRarity, { attack: number; heal: number; dropRate: number }> = {
  common: { attack: 10, heal: 5, dropRate: 0.5 },
  uncommon: { attack: 20, heal: 10, dropRate: 0.3 },
  rare: { attack: 35, heal: 20, dropRate: 0.15 },
  epic: { attack: 50, heal: 30, dropRate: 0.04 },
  legendary: { attack: 80, heal: 50, dropRate: 0.01 },
};

// レアリティの日本語表示
export const RARITY_NAMES: Record<CardRarity, string> = {
  common: 'コモン',
  uncommon: 'アンコモン',
  rare: 'レア',
  epic: 'エピック',
  legendary: 'レジェンダリー',
};

// レアリティの色
export const RARITY_COLORS: Record<CardRarity, string> = {
  common: '#9CA3AF',    // グレー
  uncommon: '#22C55E',  // 緑
  rare: '#3B82F6',      // 青
  epic: '#A855F7',      // 紫
  legendary: '#F59E0B', // 金
};

// 初期プレイヤー状態
export const INITIAL_PLAYER_STATE: PlayerState = {
  hp: 100,
  maxHp: 100,
  level: 1,
  exp: 0,
  expToNextLevel: 100,
  totalBattles: 0,
  totalWins: 0,
  cards: [],
  currentDeck: [],
};

// 初期バトル状態
export const INITIAL_BATTLE_STATE: BattleState = {
  inBattle: false,
  enemy: null,
  playerHp: 100,
  enemyHp: 0,
  turn: 'player',
  phase: 'select_action',
  selectedCard: null,
  quizQuestion: null,
  battleLog: [],
  earnedCards: [],
  earnedExp: 0,
};
