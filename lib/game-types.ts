// RPGミニゲームの型定義

// カードのレアリティ（難易度に対応）
export type CardRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

// アイテムタイプ
export type ItemType = 'schw_power';

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
  upgradeLevel: number;  // 強化レベル（0=未強化）
}

// アイテム
export interface GameItem {
  id: string;
  type: ItemType;
  name: string;
  nameJa: string;
  description: string;
  quantity: number;
  price: number;         // 購入価格（ゴールド）
}

// CFA実問（拡張可能な構造）
export interface CFAQuestion {
  id: string;
  question: string;      // 問題文
  options: string[];     // 選択肢（3択または4択）
  correctAnswer: string; // 正解
  explanation: string;   // 解説
  topic: string;         // 関連トピック
  difficulty: 'easy' | 'medium' | 'hard';
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
  gold: number;                  // ゴールド
  cards: WordCard[];             // 所持カード全て
  currentDeck: string[];         // デッキに組み込んだカードID配列
  deckCapacity: number;          // デッキ上限（レベルで増加）
  handSize: number;              // 手札上限（レベルで増加）
  items: GameItem[];             // 所持アイテム
  activeItem: ItemType | null;   // 使用中のアイテム
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
  goldReward: number;    // ゴールド報酬
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
  phase: 'select_action' | 'quiz' | 'result' | 'battle_end' | 'item_quiz';
  selectedCard: WordCard | null;
  selectedBurstCards: [WordCard, WordCard] | null;  // バースト用の2枚のカード
  isBurstMode: boolean;        // バーストモードかどうか
  quizQuestion: QuizQuestion | null;
  cfaQuestion: CFAQuestion | null;  // CFA実問（アイテム使用時）
  battleLog: BattleLogEntry[];
  earnedCards: WordCard[];
  earnedExp: number;
  earnedGold: number;          // 獲得ゴールド
  currentHand: WordCard[];     // 現在の手札（デッキからランダムに引いたカード）
  usedCards: string[];         // このバトルで使用済みのカードID
  expMultiplier: number;       // EXP倍率（アイテム効果）
}

// クイズ問題
export interface QuizQuestion {
  termId: string;
  question: string;
  questionType: 'jp_to_en' | 'en_to_jp' | 'concept';  // 日本語→英語 | 英語→日本語 | 概念説明
  correctAnswer: string;
  options: string[];
  fullQuestion?: string;  // 省略前の全文
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

// レベル別のデッキ上限と手札上限
export const LEVEL_LIMITS = {
  getDeckCapacity: (level: number): number => Math.min(5 + Math.floor(level / 2), 15),  // Lv1:5, Lv3:6, Lv5:7... 最大:15
  getHandSize: (level: number): number => Math.min(2 + Math.floor(level / 3), 6),       // Lv1:2, Lv3:3, Lv6:4... 最大:6
};

// カード強化コスト（レアリティ別）
export const UPGRADE_COSTS: Record<CardRarity, number[]> = {
  common: [50, 100, 200, 400, 800],           // レベル1→2, 2→3, ...
  uncommon: [100, 200, 400, 800, 1600],
  rare: [200, 400, 800, 1600, 3200],
  epic: [400, 800, 1600, 3200, 6400],
  legendary: [1000, 2000, 4000, 8000, 16000],
};

// 強化によるステータス上昇率
export const UPGRADE_BONUS = {
  attackMultiplier: 0.2,  // 強化レベルごとに攻撃力20%アップ
  healMultiplier: 0.15,   // 強化レベルごとに回復力15%アップ
};

// アイテム定義
export const ITEM_DEFINITIONS: Record<ItemType, Omit<GameItem, 'id' | 'quantity'>> = {
  schw_power: {
    type: 'schw_power',
    name: "Schw's Power",
    nameJa: 'Schwの力',
    description: 'CFA実問に正解すると、勝利時の獲得EXPが10倍になる',
    price: 500,
  },
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
  gold: 0,
  cards: [],
  currentDeck: [],
  deckCapacity: 5,
  handSize: 2,
  items: [],
  activeItem: null,
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
  selectedBurstCards: null,
  isBurstMode: false,
  quizQuestion: null,
  cfaQuestion: null,
  battleLog: [],
  earnedCards: [],
  earnedExp: 0,
  earnedGold: 0,
  currentHand: [],
  usedCards: [],
  expMultiplier: 1,
};
