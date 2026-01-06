// RPGミニゲームのストア
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  GameState,
  PlayerState,
  BattleState,
  WordCard,
  Enemy,
  Stage,
  QuizQuestion,
  CardRarity,
  BattleLogEntry,
  GameItem,
  ItemType,
  CFAQuestion,
  RARITY_STATS,
  INITIAL_PLAYER_STATE,
  INITIAL_BATTLE_STATE,
  LEVEL_LIMITS,
  UPGRADE_COSTS,
  UPGRADE_BONUS,
  ITEM_DEFINITIONS,
} from './game-types';
import { dataStore } from './data-store';
import type { Term } from './types';
import { getRandomCFAQuestion } from './cfa-questions';

const GAME_STATE_KEY = 'cfa_game_state';

// ステージ定義（拡張可能な構造）
// 新しい分野を追加する場合は、このリストに追加するだけでOK
// topicCodeはterms.csvのtopic_codeと一致させる
export const STAGES: Stage[] = [
  // ステージ1: 株式投資（EQ）- 最初から開始可能
  {
    id: 1,
    name: 'Equity Arena',
    nameJa: '株式投資のアリーナ',
    description: '株式評価の基礎を学ぶ',
    requiredLevel: 1,
    topicCode: 'EQ',
    enemies: [
      { id: 'eq1', name: 'P/E Slime', nameJa: 'PERスライム', hp: 40, maxHp: 40, attack: 6, defense: 2, expReward: 15, goldReward: 20, cardDropRate: 0.7, sprite: '🟢' },
      { id: 'eq2', name: 'Dividend Goblin', nameJa: '配当ゴブリン', hp: 50, maxHp: 50, attack: 8, defense: 3, expReward: 20, goldReward: 25, cardDropRate: 0.65, sprite: '👺' },
    ],
    boss: { id: 'boss_eq1', name: 'Warren the Value King', nameJa: 'バリュー王ウォーレン', hp: 150, maxHp: 150, attack: 15, defense: 8, expReward: 100, goldReward: 150, cardDropRate: 1.0, sprite: '👑' },
  },
  // ステージ2: 株式投資上級
  {
    id: 2,
    name: 'Equity Tower',
    nameJa: '株式評価の塔',
    description: 'バリュエーションの深淵',
    requiredLevel: 3,
    topicCode: 'EQ',
    enemies: [
      { id: 'eq3', name: 'Valuation Golem', nameJa: 'バリュエーションゴーレム', hp: 80, maxHp: 80, attack: 12, defense: 5, expReward: 35, goldReward: 40, cardDropRate: 0.55, sprite: '🗿' },
      { id: 'eq4', name: 'DCF Phantom', nameJa: 'DCFファントム', hp: 70, maxHp: 70, attack: 14, defense: 4, expReward: 30, goldReward: 35, cardDropRate: 0.6, sprite: '👻' },
    ],
    boss: { id: 'boss_eq2', name: 'DCF Dragon', nameJa: 'DCF竜', hp: 250, maxHp: 250, attack: 22, defense: 12, expReward: 180, goldReward: 250, cardDropRate: 1.0, sprite: '🐉' },
  },
  // ステージ3: 倒理・職業行為基準（ETH）
  {
    id: 3,
    name: 'Ethics Forest',
    nameJa: '倒理の森',
    description: 'CFA倒理基準の基礎を学ぶ',
    requiredLevel: 5,
    topicCode: 'ETH',
    enemies: [
      { id: 'eth1', name: 'Compliance Goblin', nameJa: 'コンプラゴブリン', hp: 60, maxHp: 60, attack: 10, defense: 4, expReward: 25, goldReward: 30, cardDropRate: 0.6, sprite: '👺' },
      { id: 'eth2', name: 'Ethics Slime', nameJa: '倒理スライム', hp: 45, maxHp: 45, attack: 8, defense: 3, expReward: 20, goldReward: 25, cardDropRate: 0.65, sprite: '🟢' },
    ],
    boss: { id: 'boss_eth', name: 'Ethics Guardian', nameJa: '倒理の守護者', hp: 200, maxHp: 200, attack: 18, defense: 10, expReward: 150, goldReward: 200, cardDropRate: 1.0, sprite: '⚖️' },
  },
  // ステージ4: 定量分析（QM）
  {
    id: 4,
    name: 'Quantitative Cave',
    nameJa: '定量分析の洞窟',
    description: '数値と統計の迷宮',
    requiredLevel: 7,
    topicCode: 'QM',
    enemies: [
      { id: 'qm1', name: 'Statistics Golem', nameJa: '統計ゴーレム', hp: 90, maxHp: 90, attack: 14, defense: 6, expReward: 40, goldReward: 50, cardDropRate: 0.5, sprite: '🗿' },
      { id: 'qm2', name: 'Probability Phantom', nameJa: '確率ファントム', hp: 75, maxHp: 75, attack: 16, defense: 5, expReward: 35, goldReward: 45, cardDropRate: 0.55, sprite: '👻' },
    ],
    boss: { id: 'boss_qm', name: 'Sigma Master', nameJa: 'シグママスター', hp: 280, maxHp: 280, attack: 25, defense: 14, expReward: 200, goldReward: 280, cardDropRate: 1.0, sprite: '📊' },
  },
  // ステージ5: 経済学（ECON）
  {
    id: 5,
    name: 'Economics Plains',
    nameJa: '経済学の平原',
    description: 'マクロ・ミクロ経済の戦場',
    requiredLevel: 9,
    topicCode: 'ECON',
    enemies: [
      { id: 'econ1', name: 'Inflation Dragon', nameJa: 'インフレドラゴン', hp: 120, maxHp: 120, attack: 18, defense: 8, expReward: 50, goldReward: 60, cardDropRate: 0.45, sprite: '🐉' },
      { id: 'econ2', name: 'Supply Demon', nameJa: '供給デーモン', hp: 90, maxHp: 90, attack: 14, defense: 6, expReward: 40, goldReward: 50, cardDropRate: 0.5, sprite: '😈' },
    ],
    boss: { id: 'boss_econ', name: 'Central Bank Titan', nameJa: '中央銀行の巨人', hp: 350, maxHp: 350, attack: 28, defense: 16, expReward: 250, goldReward: 350, cardDropRate: 1.0, sprite: '🏦' },
  },
  // ステージ6: 財務諸表分析（FSA）
  {
    id: 6,
    name: 'Financial Statement Tower',
    nameJa: '財務諸表の塔',
    description: '会計の迷宮を攻略せよ',
    requiredLevel: 11,
    topicCode: 'FSA',
    enemies: [
      { id: 'fsa1', name: 'Balance Sheet Beast', nameJa: 'BS獣', hp: 150, maxHp: 150, attack: 22, defense: 10, expReward: 65, goldReward: 80, cardDropRate: 0.4, sprite: '🦁' },
      { id: 'fsa2', name: 'Income Wraith', nameJa: 'PL亡霊', hp: 110, maxHp: 110, attack: 20, defense: 7, expReward: 55, goldReward: 70, cardDropRate: 0.45, sprite: '💀' },
    ],
    boss: { id: 'boss_fsa', name: 'Audit Emperor', nameJa: '監査皇帝', hp: 420, maxHp: 420, attack: 32, defense: 18, expReward: 300, goldReward: 420, cardDropRate: 1.0, sprite: '📝' },
  },
  // ステージ7: 債券（FI）
  {
    id: 7,
    name: 'Fixed Income Fortress',
    nameJa: '債券の要塞',
    description: '金利と債券の城',
    requiredLevel: 13,
    topicCode: 'FI',
    enemies: [
      { id: 'fi1', name: 'Duration Dragon', nameJa: 'デュレーションドラゴン', hp: 200, maxHp: 200, attack: 26, defense: 12, expReward: 80, goldReward: 100, cardDropRate: 0.35, sprite: '🐲' },
      { id: 'fi2', name: 'Yield Hydra', nameJa: '利回りヒドラ', hp: 180, maxHp: 180, attack: 24, defense: 10, expReward: 70, goldReward: 90, cardDropRate: 0.4, sprite: '🐍' },
    ],
    boss: { id: 'boss_fi', name: 'Bond King', nameJa: '債券王', hp: 500, maxHp: 500, attack: 36, defense: 20, expReward: 380, goldReward: 500, cardDropRate: 1.0, sprite: '💎' },
  },
  // ステージ8: デリバティブ（DER）
  {
    id: 8,
    name: 'Derivatives Dungeon',
    nameJa: 'デリバティブの地下牢',
    description: 'オプションと先物の深淵',
    requiredLevel: 15,
    topicCode: 'DER',
    enemies: [
      { id: 'der1', name: 'Options Overlord', nameJa: 'オプション魔王', hp: 250, maxHp: 250, attack: 30, defense: 14, expReward: 100, goldReward: 130, cardDropRate: 0.3, sprite: '👹' },
      { id: 'der2', name: 'Futures Fiend', nameJa: '先物フィーンド', hp: 220, maxHp: 220, attack: 28, defense: 12, expReward: 90, goldReward: 120, cardDropRate: 0.35, sprite: '🔥' },
    ],
    boss: { id: 'boss_der', name: 'Black-Scholes Demon', nameJa: 'ブラックショールズ魔神', hp: 600, maxHp: 600, attack: 42, defense: 22, expReward: 450, goldReward: 600, cardDropRate: 1.0, sprite: '👿' },
  },
  // ステージ9: ポートフォリオ管理（PM）
  {
    id: 9,
    name: 'Portfolio Summit',
    nameJa: 'ポートフォリオの頂',
    description: '最終試練の地',
    requiredLevel: 18,
    topicCode: 'PM',
    enemies: [
      { id: 'pm1', name: 'CAPM Colossus', nameJa: 'CAPMコロッサス', hp: 350, maxHp: 350, attack: 38, defense: 18, expReward: 130, goldReward: 180, cardDropRate: 0.25, sprite: '🏔️' },
      { id: 'pm2', name: 'Sharpe Sovereign', nameJa: 'シャープ皇帝', hp: 400, maxHp: 400, attack: 42, defense: 20, expReward: 150, goldReward: 200, cardDropRate: 0.2, sprite: '👑' },
    ],
    boss: { id: 'boss_pm', name: 'CFA Ultimate', nameJa: 'CFA究極体', hp: 800, maxHp: 800, attack: 50, defense: 25, expReward: 600, goldReward: 800, cardDropRate: 1.0, sprite: '🏆' },
  },
];

class GameStore {
  private state: GameState;
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.state = {
      player: { ...INITIAL_PLAYER_STATE },
      battle: { ...INITIAL_BATTLE_STATE },
      unlockedStages: [1],
      currentStage: 1,
      dailyMissions: {
        missions: [],
        lastResetDate: '',
        totalCompleted: 0,
      },
      bossDefeated: [],
    };
  }

  // 状態の読み込み
  async loadState(): Promise<void> {
    try {
      // dataStoreを初期化（忘却曲線連携のため）
      await dataStore.initialize();
      
      const saved = await AsyncStorage.getItem(GAME_STATE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // 新しいプロパティがない場合はデフォルト値を使用
        const player = {
          ...INITIAL_PLAYER_STATE,
          ...parsed.player,
          cards: parsed.player?.cards || [],
          currentDeck: parsed.player?.currentDeck || [],
          items: parsed.player?.items || [],
          gold: parsed.player?.gold ?? 0,
          deckCapacity: parsed.player?.deckCapacity ?? LEVEL_LIMITS.getDeckCapacity(1),
          handSize: parsed.player?.handSize ?? LEVEL_LIMITS.getHandSize(1),
          activeItem: parsed.player?.activeItem ?? null,
        };
        this.state = {
          ...this.state,
          player,
          unlockedStages: parsed.unlockedStages || [1],
          currentStage: parsed.currentStage || 1,
          battle: { ...INITIAL_BATTLE_STATE }, // バトル状態はリセット
          dailyMissions: parsed.dailyMissions || {
            missions: [],
            lastResetDate: '',
            totalCompleted: 0,
          },
          bossDefeated: parsed.bossDefeated || [],
        };
      }
    } catch (error) {
      console.error('Failed to load game state:', error);
    }
  }

  // 状態の保存
  async saveState(): Promise<void> {
    try {
      const toSave = {
        player: this.state.player,
        unlockedStages: this.state.unlockedStages,
        currentStage: this.state.currentStage,
        dailyMissions: this.state.dailyMissions,
        bossDefeated: this.state.bossDefeated,
      };
      await AsyncStorage.setItem(GAME_STATE_KEY, JSON.stringify(toSave));
    } catch (error) {
      console.error('Failed to save game state:', error);
    }
  }

  // リスナー登録
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach((listener) => listener());
  }

  // ゲッター
  getState(): GameState {
    return this.state;
  }

  getPlayer(): PlayerState {
    return this.state.player;
  }

  getBattle(): BattleState {
    return this.state.battle;
  }

  // 用語からカードを生成
  createCardFromTerm(term: Term): WordCard {
    const rarity = this.determineRarity(term);
    const stats = RARITY_STATS[rarity];
    return {
      id: `card_${term.term_id}_${Date.now()}`,
      termId: term.term_id,
      term: term.en_canonical,
      termJa: term.jp_headword,
      rarity,
      attackPower: stats.attack + Math.floor(Math.random() * 10),
      healPower: stats.heal + Math.floor(Math.random() * 5),
      acquired: true,
      acquiredAt: Date.now(),
      usageCount: 0,
      successCount: 0,
      upgradeLevel: 0,
    };
  }

  // レアリティ決定（用語の難易度に基づく）
  private determineRarity(term: Term): CardRarity {
    const rand = Math.random();
    // 公式がある用語は高レアリティになりやすい
    const hasFormula = term.formula && term.formula.length > 0;
    const boost = hasFormula ? 0.1 : 0;

    if (rand < 0.01 + boost) return 'legendary';
    if (rand < 0.05 + boost) return 'epic';
    if (rand < 0.20 + boost) return 'rare';
    if (rand < 0.50) return 'uncommon';
    return 'common';
  }

  // バトル開始
  startBattle(stageId: number): void {
    const stage = STAGES.find((s) => s.id === stageId);
    if (!stage) return;

    const enemy = stage.enemies[Math.floor(Math.random() * stage.enemies.length)];
    
    // デッキから手札をランダムに引く
    const deckCards = this.state.player.currentDeck
      .map(id => this.state.player.cards.find(c => c.id === id))
      .filter((c): c is WordCard => c !== undefined);
    const shuffled = [...deckCards].sort(() => Math.random() - 0.5);
    const handSize = this.state.player.handSize;
    const currentHand = shuffled.slice(0, handSize);
    const remainingDeck = shuffled.slice(handSize);  // 残りは山札

    this.state.battle = {
      inBattle: true,
      enemy: { ...enemy },
      playerHp: this.state.player.hp,
      enemyHp: enemy.hp,
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
      currentHand,
      remainingDeck,
      usedCards: [],
      expMultiplier: 1,
    };
    this.state.currentStage = stageId;
    this.notify();
  }

  // カード選択（攻撃または回復）
  selectCard(card: WordCard, action: 'attack' | 'heal'): void {
    if (this.state.battle.phase !== 'select_action') return;

    this.state.battle.selectedCard = card;
    this.state.battle.isBurstMode = false;
    this.state.battle.phase = 'quiz';
    
    // クイズ問題を生成
    const term = dataStore.getTermById(card.termId);
    if (term) {
      this.state.battle.quizQuestion = this.generateQuiz(term);
    }
    
    // 使用済みカードに追加
    this.state.battle.usedCards.push(card.id);
    
    this.notify();
  }

  // バーストカード選択（2枚同時使用）
  selectBurstCards(card1: WordCard, card2: WordCard): void {
    if (this.state.battle.phase !== 'select_action') return;

    this.state.battle.selectedBurstCards = [card1, card2];
    this.state.battle.selectedCard = card1; // メインカードとして使用
    this.state.battle.isBurstMode = true;
    this.state.battle.phase = 'quiz';
    
    // バースト用の高難度クイズを生成
    const term1 = dataStore.getTermById(card1.termId);
    const term2 = dataStore.getTermById(card2.termId);
    if (term1 && term2) {
      this.state.battle.quizQuestion = this.generateBurstQuiz(term1, term2);
    }
    
    // 使用済みカードに追加
    this.state.battle.usedCards.push(card1.id, card2.id);
    
    this.notify();
  }

  // バースト用高難度クイズ生成（2つの概念を組み合わせた問題）
  private generateBurstQuiz(term1: Term, term2: Term): QuizQuestion {
    const allTerms = dataStore.getTerms();
    const otherTerms = allTerms.filter((t: Term) => t.term_id !== term1.term_id && t.term_id !== term2.term_id);
    const shuffled = otherTerms.sort(() => Math.random() - 0.5).slice(0, 2);

    // バーストクイズのタイプをランダムに選択
    const burstType = Math.floor(Math.random() * 3);

    if (burstType === 0) {
      // タイプ1: 2つの用語の共通点を問う
      const options = [
        term1.jp_headword,
        term2.jp_headword,
        shuffled[0]?.jp_headword || '該当なし',
        shuffled[1]?.jp_headword || '該当なし',
      ].sort(() => Math.random() - 0.5);
      const fullQuestion = `「${term1.en_canonical}」と「${term2.en_canonical}」のうち、「${term1.jp_definition}」に当てはまるのは？`;
      const questionPreview = `「${term1.en_canonical}」と「${term2.en_canonical}」のうち、「${term1.jp_definition.substring(0, 30)}...」に当てはまるのは？`;
      return {
        termId: term1.term_id,
        question: questionPreview,
        questionType: 'concept',
        correctAnswer: term1.jp_headword,
        options,
        fullQuestion,
      };
    } else if (burstType === 1) {
      // タイプ2: 2つの英語用語の日本語訳を連続で問う
      const options = [
        `${term1.jp_headword} / ${term2.jp_headword}`,
        `${term2.jp_headword} / ${term1.jp_headword}`,
        `${term1.jp_headword} / ${shuffled[0]?.jp_headword || '不明'}`,
        `${shuffled[0]?.jp_headword || '不明'} / ${term2.jp_headword}`,
      ].sort(() => Math.random() - 0.5);
      const question = `「${term1.en_canonical}」と「${term2.en_canonical}」の日本語訳の正しい組み合わせは？`;
      return {
        termId: term1.term_id,
        question,
        questionType: 'jp_to_en',
        correctAnswer: `${term1.jp_headword} / ${term2.jp_headword}`,
        options,
        fullQuestion: question,
      };
    } else {
      // タイプ3: 定義の組み合わせ問題
      const def1Preview = term1.jp_definition.substring(0, 25) + '...';
      const def2Preview = term2.jp_definition.substring(0, 25) + '...';
      const options = [
        term1.jp_headword,
        term2.jp_headword,
        shuffled[0]?.jp_headword || '該当なし',
        shuffled[1]?.jp_headword || '該当なし',
      ].sort(() => Math.random() - 0.5);
      const fullQuestion = `「${term1.jp_definition}」と「${term2.jp_definition}」のうち、前者の説明に当てはまる用語は？`;
      const questionPreview = `「${def1Preview}」と「${def2Preview}」のうち、前者の説明に当てはまる用語は？`;
      return {
        termId: term1.term_id,
        question: questionPreview,
        questionType: 'concept',
        correctAnswer: term1.jp_headword,
        options,
        fullQuestion,
      };
    }
  }

  // クイズ問題生成（3タイプ：英語→日本語、日本語→英語、概念説明）
  private generateQuiz(term: Term): QuizQuestion {
    const allTerms = dataStore.getTerms();
    const sameTopicTerms = allTerms.filter((t: Term) => t.topic_code === term.topic_code && t.term_id !== term.term_id);
    const otherTerms = sameTopicTerms.length >= 3 ? sameTopicTerms : allTerms.filter((t: Term) => t.term_id !== term.term_id);
    const shuffled = otherTerms.sort(() => Math.random() - 0.5).slice(0, 3);

    // 3タイプのクイズをランダムに選択
    const quizType = Math.floor(Math.random() * 3);

    if (quizType === 0) {
      // タイプ1: 日本語を見て英語を選ぶ（英語のみ表示）
      const options = [term.en_canonical, ...shuffled.map((t: Term) => t.en_canonical)].sort(() => Math.random() - 0.5);
      return {
        termId: term.term_id,
        question: `「${term.jp_headword}」の英語用語は？`,
        questionType: 'jp_to_en',
        correctAnswer: term.en_canonical,
        options,
      };
    } else if (quizType === 1) {
      // タイプ2: 英語を見て日本語を選ぶ（日本語のみ表示）
      const options = [term.jp_headword, ...shuffled.map((t: Term) => t.jp_headword)].sort(() => Math.random() - 0.5);
      return {
        termId: term.term_id,
        question: `「${term.en_canonical}」の日本語訳は？`,
        questionType: 'en_to_jp',
        correctAnswer: term.jp_headword,
        options,
      };
    } else {
      // タイプ3: 概念説明クイズ（定義を見て用語を選ぶ）
      // 定義の最初の60文字を表示
      const defPreview = term.jp_definition.length > 60 
        ? term.jp_definition.substring(0, 60) + '...' 
        : term.jp_definition;
      const fullQuestion = `次の説明に当てはまる用語は？\n「${term.jp_definition}」`;
      const options = [term.jp_headword, ...shuffled.map((t: Term) => t.jp_headword)].sort(() => Math.random() - 0.5);
      return {
        termId: term.term_id,
        question: `次の説明に当てはまる用語は？\n「${defPreview}」`,
        questionType: 'concept',
        correctAnswer: term.jp_headword,
        options,
        fullQuestion,
      };
    }
  }

  // クイズ回答
  async answerQuiz(answer: string, action: 'attack' | 'heal'): Promise<{ correct: boolean; damage: number; heal: number }> {
    const { battle, player } = this.state;
    if (!battle.quizQuestion || !battle.selectedCard) {
      return { correct: false, damage: 0, heal: 0 };
    }

    const correct = answer === battle.quizQuestion.correctAnswer;
    const card = battle.selectedCard;
    const isBurst = battle.isBurstMode;
    let damage = 0;
    let heal = 0;

    // 学習ログに記録（忘却曲線連携）
    console.log('[Game] Recording study for term:', card.termId, 'correct:', correct);
    await dataStore.recordStudy(card.termId, correct);
    console.log('[Game] Study recorded successfully');
    
    // バーストの場合、2枚目のカードも記録
    if (isBurst && battle.selectedBurstCards) {
      console.log('[Game] Recording burst card 2 for term:', battle.selectedBurstCards[1].termId, 'correct:', correct);
      await dataStore.recordStudy(battle.selectedBurstCards[1].termId, correct);
      console.log('[Game] Burst card 2 study recorded successfully');
    }

    // カードの使用回数を更新
    const cardIndex = player.cards.findIndex((c) => c.id === card.id);
    if (cardIndex >= 0) {
      player.cards[cardIndex].usageCount++;
      if (correct) {
        player.cards[cardIndex].successCount++;
      }
    }
    
    // バーストの場合、2枚目のカードも更新
    if (isBurst && battle.selectedBurstCards) {
      const card2Index = player.cards.findIndex((c) => c.id === battle.selectedBurstCards![1].id);
      if (card2Index >= 0) {
        player.cards[card2Index].usageCount++;
        if (correct) {
          player.cards[card2Index].successCount++;
        }
      }
    }

    // バースト倍率（成功で2倍ダメージ、失敗で2倍反動）
    const burstMultiplier = isBurst ? 2 : 1;

    if (correct) {
      // クイズ正解時のミッション進捗更新
      this.updateMissionProgress('quiz_correct', 1);
      
      if (action === 'attack') {
        // バーストの場合、2枚のカードの攻撃力合計 × バースト倍率
        if (isBurst && battle.selectedBurstCards) {
          damage = (card.attackPower + battle.selectedBurstCards[1].attackPower) * burstMultiplier;
          battle.enemyHp = Math.max(0, battle.enemyHp - damage);
          this.addBattleLog('player', 'attack', `🔥バースト攻撃！${damage}ダメージ！`, damage);
        } else {
          damage = card.attackPower;
          battle.enemyHp = Math.max(0, battle.enemyHp - damage);
          this.addBattleLog('player', 'attack', `${card.term}で攻撃！${damage}ダメージ！`, damage);
        }
      } else {
        heal = card.healPower * burstMultiplier;
        battle.playerHp = Math.min(player.maxHp, battle.playerHp + heal);
        this.addBattleLog('player', 'heal', `${card.term}で回復！HP+${heal}！`, undefined, heal);
      }
    } else {
      // 不正解の場合、逆ダメージ（バーストは2倍）
      let selfDamage = Math.floor(card.attackPower * 0.5);
      if (isBurst && battle.selectedBurstCards) {
        selfDamage = Math.floor((card.attackPower + battle.selectedBurstCards[1].attackPower) * 0.5 * burstMultiplier);
      }
      battle.playerHp = Math.max(0, battle.playerHp - selfDamage);
      const logMessage = isBurst 
        ? `🔥バースト失敗！${selfDamage}の大反動ダメージ！`
        : `クイズ不正解！${selfDamage}の反動ダメージ！`;
      this.addBattleLog('player', 'fail', logMessage, selfDamage);
    }

    // フェーズを結果に移行
    battle.phase = 'result';
    battle.selectedCard = null;
    battle.selectedBurstCards = null;
    battle.isBurstMode = false;
    battle.quizQuestion = null;

    this.notify();
    await this.saveState();

    return { correct, damage, heal };
  }

  // 結果確認後、次のターンへ
  proceedToNextTurn(): void {
    const { battle, player } = this.state;

    // 敵が倒れたか確認
    if (battle.enemyHp <= 0) {
      this.endBattle(true);
      return;
    }

    // プレイヤーが倒れたか確認
    if (battle.playerHp <= 0) {
      this.endBattle(false);
      return;
    }

    // 手札補充：山札から1枚引いて手札に追加
    this.refillHand();

    // 敵のターン
    this.enemyTurn();
  }

  // 手札補充：山札から1枚引いて手札に追加
  private refillHand(): void {
    const { battle, player } = this.state;
    
    // 現在の手札枚数（使用済みを除く）
    const currentHandCount = battle.currentHand.filter(
      card => !battle.usedCards.includes(card.id)
    ).length;
    
    // 手札上限まで補充
    const cardsToRefill = player.handSize - currentHandCount;
    
    if (cardsToRefill > 0 && battle.remainingDeck.length > 0) {
      // 山札から引く
      const drawnCards = battle.remainingDeck.splice(0, cardsToRefill);
      battle.currentHand.push(...drawnCards);
      
      if (drawnCards.length > 0) {
        this.addBattleLog('player', 'draw', `山札から${drawnCards.length}枚ドロー！`);
      }
    }
  }

  // 敵のターン
  private enemyTurn(): void {
    const { battle, player } = this.state;
    if (!battle.enemy) return;

    const damage = Math.max(1, battle.enemy.attack - Math.floor(player.level * 0.5));
    battle.playerHp = Math.max(0, battle.playerHp - damage);
    this.addBattleLog('enemy', 'attack', `${battle.enemy.nameJa}の攻撃！${damage}ダメージ！`, damage);

    // プレイヤーが倒れたか確認
    if (battle.playerHp <= 0) {
      this.endBattle(false);
      return;
    }

    // プレイヤーのターンに戻る
    battle.turn = 'player';
    battle.phase = 'select_action';
    this.notify();
  }

  // バトル終了
  private async endBattle(victory: boolean): Promise<void> {
    const { battle, player } = this.state;

    battle.phase = 'battle_end';
    player.totalBattles++;

    if (victory && battle.enemy) {
      player.totalWins++;
      
      // EXP計算（アイテム効果で倍率適用）
      const baseExp = battle.enemy.expReward;
      battle.earnedExp = Math.floor(baseExp * battle.expMultiplier);
      player.exp += battle.earnedExp;
      
      // ゴールド獲得
      battle.earnedGold = battle.enemy.goldReward;
      player.gold += battle.earnedGold;

      // レベルアップ判定
      while (player.exp >= player.expToNextLevel) {
        player.exp -= player.expToNextLevel;
        player.level++;
        player.maxHp += 10;
        player.hp = player.maxHp;
        player.expToNextLevel = Math.floor(player.expToNextLevel * 1.2);
        // レベルアップでデッキ上限と手札上限を更新
        player.deckCapacity = LEVEL_LIMITS.getDeckCapacity(player.level);
        player.handSize = LEVEL_LIMITS.getHandSize(player.level);
      }

      // カードドロップ判定
      if (Math.random() < battle.enemy.cardDropRate) {
        const stage = STAGES.find((s) => s.id === this.state.currentStage);
        const topicCode = stage?.topicCode;
        const terms = topicCode 
          ? dataStore.getTerms().filter((t: Term) => t.topic_code === topicCode)
          : dataStore.getTerms();
        
        if (terms.length > 0) {
          const randomTerm = terms[Math.floor(Math.random() * terms.length)];
          const newCard = this.createCardFromTerm(randomTerm);
          player.cards.push(newCard);
          battle.earnedCards.push(newCard);
        }
      }

      // 次のステージをアンロック
      const nextStageId = this.state.currentStage + 1;
      const nextStage = STAGES.find((s) => s.id === nextStageId);
      if (nextStage && player.level >= nextStage.requiredLevel && !this.state.unlockedStages.includes(nextStageId)) {
        this.state.unlockedStages.push(nextStageId);
      }

      // ボス撃破記録
      if (battle.enemy && battle.enemy.id.startsWith('boss_')) {
        this.recordBossDefeat(battle.enemy.id);
      }

      // ミッション進捗更新
      this.updateMissionProgress('battle_wins', 1);
      this.updateMissionProgress('gold_earn', battle.earnedGold);
      if (battle.earnedCards.length > 0) {
        this.updateMissionProgress('card_collect', battle.earnedCards.length);
      }

      // アイテム使用済みをリセット
      player.activeItem = null;

      const expMsg = battle.expMultiplier > 1 ? `${battle.earnedExp}EXP(x${battle.expMultiplier})` : `${battle.earnedExp}EXP`;
      this.addBattleLog('player', 'victory', `勝利！${expMsg}、${battle.earnedGold}G獲得！`);
    } else {
      // 敗北時はアイテム効果をリセット
      player.activeItem = null;
      this.addBattleLog('enemy', 'victory', '敗北...');
    }

    // HPを回復（敗北時は半分回復）
    player.hp = victory ? player.maxHp : Math.floor(player.maxHp * 0.5);

    this.notify();
    await this.saveState();
  }

  // バトルログ追加
  private addBattleLog(actor: 'player' | 'enemy', action: string, message: string, damage?: number, heal?: number): void {
    this.state.battle.battleLog.push({
      turn: this.state.battle.battleLog.length + 1,
      actor,
      action,
      message,
      damage,
      heal,
    });
  }

  // バトルをリセット
  resetBattle(): void {
    this.state.battle = { ...INITIAL_BATTLE_STATE };
    this.notify();
  }

  // デッキにカードを追加
  addToDeck(cardId: string): boolean {
    // レベルに応じたデッキ上限を使用
    if (this.state.player.currentDeck.length >= this.state.player.deckCapacity) return false;
    if (this.state.player.currentDeck.includes(cardId)) return false;
    this.state.player.currentDeck.push(cardId);
    this.saveState();
    this.notify();
    return true;
  }

  // デッキからカードを削除
  removeFromDeck(cardId: string): void {
    this.state.player.currentDeck = this.state.player.currentDeck.filter((id) => id !== cardId);
    this.saveState();
    this.notify();
  }

  // デッキのカードを取得
  getDeckCards(): WordCard[] {
    return this.state.player.currentDeck
      .map((id) => this.state.player.cards.find((c) => c.id === id))
      .filter((c): c is WordCard => c !== undefined);
  }

  // 初期カードを付与
  async grantStarterCards(): Promise<void> {
    if (this.state.player.cards.length > 0) return;

    const terms = dataStore.getTerms().slice(0, 5);
    for (const term of terms) {
      const card = this.createCardFromTerm(term);
      card.rarity = 'common'; // スターターは全てコモン
      card.attackPower = RARITY_STATS.common.attack;
      card.healPower = RARITY_STATS.common.heal;
      this.state.player.cards.push(card);
      this.state.player.currentDeck.push(card.id);
    }

    await this.saveState();
    this.notify();
  }

  // ゲームリセット
  async resetGame(): Promise<void> {
    this.state = {
      player: { ...INITIAL_PLAYER_STATE },
      battle: { ...INITIAL_BATTLE_STATE },
      unlockedStages: [1],
      currentStage: 1,
      dailyMissions: {
        missions: [],
        lastResetDate: '',
        totalCompleted: 0,
      },
      bossDefeated: [],
    };
    await AsyncStorage.removeItem(GAME_STATE_KEY);
    this.notify();
  }

  // アイテム購入
  buyItem(itemType: ItemType): boolean {
    const itemDef = ITEM_DEFINITIONS[itemType];
    if (!itemDef) return false;
    if (this.state.player.gold < itemDef.price) return false;

    this.state.player.gold -= itemDef.price;
    
    // 既存のアイテムを検索
    const existingItem = this.state.player.items.find(i => i.type === itemType);
    if (existingItem) {
      existingItem.quantity++;
    } else {
      const newItem: GameItem = {
        id: `item_${itemType}_${Date.now()}`,
        ...itemDef,
        quantity: 1,
      };
      this.state.player.items.push(newItem);
    }

    this.saveState();
    this.notify();
    return true;
  }

  // アイテム使用（バトル開始前に使用）
  useItem(itemType: ItemType): boolean {
    const item = this.state.player.items.find(i => i.type === itemType && i.quantity > 0);
    if (!item) return false;

    item.quantity--;
    this.state.player.activeItem = itemType;
    
    // 数量が0になったら削除
    if (item.quantity <= 0) {
      this.state.player.items = this.state.player.items.filter(i => i.type !== itemType);
    }

    this.saveState();
    this.notify();
    return true;
  }

  // CFA実問を出題（アイテム使用時）
  startCFAQuiz(): void {
    const question = getRandomCFAQuestion();
    this.state.battle.cfaQuestion = question;
    this.state.battle.phase = 'item_quiz';
    this.notify();
  }

  // CFA実問に回答
  answerCFAQuiz(answer: string): boolean {
    const { battle } = this.state;
    if (!battle.cfaQuestion) return false;

    const isCorrect = answer === battle.cfaQuestion.correctAnswer;
    
    if (isCorrect) {
      // 正解：EXP10倍
      battle.expMultiplier = 10;
      this.addBattleLog('player', 'item', 'Schwの力発動！EXP10倍！');
    } else {
      // 不正解：効果なし
      battle.expMultiplier = 1;
      this.addBattleLog('player', 'item', 'Schwの力不発...');
    }

    battle.cfaQuestion = null;
    battle.phase = 'select_action';
    this.notify();
    return isCorrect;
  }

  // カード強化
  upgradeCard(cardId: string): { success: boolean; message: string } {
    console.log('[GameStore] upgradeCard called for:', cardId);
    console.log('[GameStore] Current gold:', this.state.player.gold);
    
    const cardIndex = this.state.player.cards.findIndex(c => c.id === cardId);
    if (cardIndex === -1) return { success: false, message: 'カードが見つかりません' };
    
    const card = this.state.player.cards[cardIndex];
    console.log('[GameStore] Card found:', card.termJa, 'upgradeLevel:', card.upgradeLevel);

    const maxUpgradeLevel = 5;
    if (card.upgradeLevel >= maxUpgradeLevel) {
      return { success: false, message: '最大強化レベルに達しています' };
    }

    const costs = UPGRADE_COSTS[card.rarity];
    const cost = costs[card.upgradeLevel];
    console.log('[GameStore] Upgrade cost:', cost);
    
    if (this.state.player.gold < cost) {
      return { success: false, message: `ゴールドが足りません（必要: ${cost}G）` };
    }

    // 強化実行
    const oldGold = this.state.player.gold;
    const oldAttack = card.attackPower;
    const oldHeal = card.healPower;
    const oldLevel = card.upgradeLevel;
    
    this.state.player.gold -= cost;
    this.state.player.cards[cardIndex].upgradeLevel++;
    
    // ステータスアップ
    const baseStats = RARITY_STATS[card.rarity];
    this.state.player.cards[cardIndex].attackPower = Math.floor(baseStats.attack * (1 + UPGRADE_BONUS.attackMultiplier * this.state.player.cards[cardIndex].upgradeLevel));
    this.state.player.cards[cardIndex].healPower = Math.floor(baseStats.heal * (1 + UPGRADE_BONUS.healMultiplier * this.state.player.cards[cardIndex].upgradeLevel));
    
    console.log('[GameStore] Upgrade complete:');
    console.log('  Gold:', oldGold, '->', this.state.player.gold);
    console.log('  Level:', oldLevel, '->', this.state.player.cards[cardIndex].upgradeLevel);
    console.log('  Attack:', oldAttack, '->', this.state.player.cards[cardIndex].attackPower);
    console.log('  Heal:', oldHeal, '->', this.state.player.cards[cardIndex].healPower);

    // レアリティアップ判定（強化レベル3と5でレアリティが上がる可能性）
    const updatedCard = this.state.player.cards[cardIndex];
    if ((updatedCard.upgradeLevel === 3 || updatedCard.upgradeLevel === 5) && Math.random() < 0.3) {
      const rarityOrder: CardRarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
      const currentIndex = rarityOrder.indexOf(updatedCard.rarity);
      if (currentIndex < rarityOrder.length - 1) {
        this.state.player.cards[cardIndex].rarity = rarityOrder[currentIndex + 1];
        this.saveState();
        this.notify();
        return { success: true, message: `強化成功！レアリティが上がりました！` };
      }
    }

    this.saveState();
    this.notify();
    return { success: true, message: `強化成功！Lv.${updatedCard.upgradeLevel}になりました` };
  }

  // カード強化コストを取得
  getUpgradeCost(cardId: string): number | null {
    const card = this.state.player.cards.find(c => c.id === cardId);
    if (!card || card.upgradeLevel >= 5) return null;
    return UPGRADE_COSTS[card.rarity][card.upgradeLevel];
  }

  // アイテム所持数を取得
  getItemCount(itemType: ItemType): number {
    const item = this.state.player.items.find(i => i.type === itemType);
    return item?.quantity ?? 0;
  }

  // ========== ボス戦システム ==========
  
  // ボス戦開始
  startBossBattle(stageId: number): boolean {
    const stage = STAGES.find((s) => s.id === stageId);
    if (!stage || !stage.boss) return false;

    // 既に撃破済みのボスは戦えない（リプレイ不可）
    if (this.state.bossDefeated.includes(stage.boss.id)) {
      return false;
    }

    const boss = stage.boss;
    
    // デッキから手札をランダムに引く
    const deckCards = this.state.player.currentDeck
      .map(id => this.state.player.cards.find(c => c.id === id))
      .filter((c): c is WordCard => c !== undefined);
    const shuffled = [...deckCards].sort(() => Math.random() - 0.5);
    const handSize = this.state.player.handSize;
    const currentHand = shuffled.slice(0, handSize);
    const remainingDeck = shuffled.slice(handSize);

    this.state.battle = {
      inBattle: true,
      enemy: { ...boss },
      playerHp: this.state.player.hp,
      enemyHp: boss.hp,
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
      currentHand,
      remainingDeck,
      usedCards: [],
      expMultiplier: 1,
    };
    this.state.currentStage = stageId;
    this.notify();
    return true;
  }

  // ボス撃破記録
  recordBossDefeat(bossId: string): void {
    if (!this.state.bossDefeated.includes(bossId)) {
      this.state.bossDefeated.push(bossId);
      this.updateMissionProgress('boss_defeat', 1);
      this.saveState();
    }
  }

  // ボス撃破済みかチェック
  isBossDefeated(bossId: string): boolean {
    return this.state.bossDefeated.includes(bossId);
  }

  // ステージのボス情報を取得
  getStageBoss(stageId: number): Enemy | undefined {
    const stage = STAGES.find((s) => s.id === stageId);
    return stage?.boss;
  }

  // ========== デイリーミッションシステム ==========

  // デイリーミッションのリセットチェックと生成
  checkAndResetDailyMissions(): void {
    const today = new Date().toISOString().split('T')[0];
    
    if (this.state.dailyMissions.lastResetDate !== today) {
      // 新しいミッションを生成
      this.state.dailyMissions = {
        missions: this.generateDailyMissions(),
        lastResetDate: today,
        totalCompleted: this.state.dailyMissions.totalCompleted,
      };
      this.saveState();
      this.notify();
    }
  }

  // デイリーミッション生成
  private generateDailyMissions(): DailyMission[] {
    const missionTemplates = [
      { type: 'battle_wins' as MissionType, name: 'バトル勝利', description: 'バトルに{target}回勝利する', targets: [3, 5, 7], goldBase: 100, expBase: 50 },
      { type: 'quiz_correct' as MissionType, name: 'クイズマスター', description: 'クイズに{target}回正解する', targets: [5, 10, 15], goldBase: 80, expBase: 40 },
      { type: 'card_collect' as MissionType, name: 'カードコレクター', description: 'カードを{target}枚獲得する', targets: [2, 3, 5], goldBase: 150, expBase: 75 },
      { type: 'gold_earn' as MissionType, name: 'ゴールドハンター', description: 'ゴールドを{target}G稼ぐ', targets: [100, 200, 300], goldBase: 50, expBase: 30 },
      { type: 'boss_defeat' as MissionType, name: 'ボスハンター', description: 'ボスを{target}体倒す', targets: [1], goldBase: 300, expBase: 150 },
    ];

    // ランダムに3つのミッションを選択
    const shuffled = [...missionTemplates].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, 3);

    return selected.map((template, index) => {
      const targetIndex = Math.floor(Math.random() * template.targets.length);
      const target = template.targets[targetIndex];
      const difficulty = targetIndex + 1;
      
      return {
        id: `daily_${Date.now()}_${index}`,
        type: template.type,
        name: template.name,
        description: template.description.replace('{target}', target.toString()),
        target,
        current: 0,
        completed: false,
        claimed: false,
        rewardGold: template.goldBase * difficulty,
        rewardExp: template.expBase * difficulty,
      };
    });
  }

  // ミッション進捗更新
  updateMissionProgress(type: MissionType, amount: number): void {
    this.checkAndResetDailyMissions();
    
    for (const mission of this.state.dailyMissions.missions) {
      if (mission.type === type && !mission.completed) {
        mission.current = Math.min(mission.current + amount, mission.target);
        if (mission.current >= mission.target) {
          mission.completed = true;
        }
      }
    }
    this.saveState();
    this.notify();
  }

  // ミッション報酬受取
  claimMissionReward(missionId: string): { success: boolean; gold: number; exp: number } {
    const mission = this.state.dailyMissions.missions.find(m => m.id === missionId);
    if (!mission || !mission.completed || mission.claimed) {
      return { success: false, gold: 0, exp: 0 };
    }

    mission.claimed = true;
    this.state.player.gold += mission.rewardGold;
    this.state.player.exp += mission.rewardExp;
    this.state.dailyMissions.totalCompleted++;

    // レベルアップチェック
    const player = this.state.player;
    while (player.exp >= player.expToNextLevel) {
      player.exp -= player.expToNextLevel;
      player.level++;
      player.maxHp += 10;
      player.hp = player.maxHp;
      player.expToNextLevel = Math.floor(player.expToNextLevel * 1.2);
      player.deckCapacity = LEVEL_LIMITS.getDeckCapacity(player.level);
      player.handSize = LEVEL_LIMITS.getHandSize(player.level);
    }

    this.saveState();
    this.notify();
    return { success: true, gold: mission.rewardGold, exp: mission.rewardExp };
  }

  // デイリーミッション取得
  getDailyMissions(): DailyMission[] {
    this.checkAndResetDailyMissions();
    return this.state.dailyMissions.missions;
  }

  // ========== カード合成システム ==========

  // 合成可能なカードペアを取得（同じtermIdのカードが2枚以上）
  getFusionCandidates(): { termId: string; cards: WordCard[] }[] {
    const cardsByTerm: Record<string, WordCard[]> = {};
    
    for (const card of this.state.player.cards) {
      if (!cardsByTerm[card.termId]) {
        cardsByTerm[card.termId] = [];
      }
      cardsByTerm[card.termId].push(card);
    }

    return Object.entries(cardsByTerm)
      .filter(([, cards]) => cards.length >= 2)
      .map(([termId, cards]) => ({ termId, cards }));
  }

  // カード合成実行
  fuseCards(cardIds: string[]): FusionResult {
    console.log('[GameStore] fuseCards called with:', cardIds);
    
    if (cardIds.length < 2) {
      console.log('[GameStore] Not enough cards to fuse');
      return { success: false, consumedCards: [] };
    }

    const cards = cardIds.map(id => this.state.player.cards.find(c => c.id === id)).filter((c): c is WordCard => c !== undefined);
    console.log('[GameStore] Found cards:', cards.length);
    
    if (cards.length < 2) {
      return { success: false, consumedCards: [] };
    }

    // 同じtermIdのカードのみ合成可能
    const termId = cards[0].termId;
    if (!cards.every(c => c.termId === termId)) {
      console.log('[GameStore] Cards have different termIds');
      return { success: false, consumedCards: [] };
    }

    // 最高レアリティのカードをベースに
    const rarityOrder: CardRarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
    const sortedCards = [...cards].sort((a, b) => rarityOrder.indexOf(b.rarity) - rarityOrder.indexOf(a.rarity));
    const baseCard = sortedCards[0];
    const materialsCount = cards.length - 1;
    
    console.log('[GameStore] Base card:', baseCard.termJa, 'rarity:', baseCard.rarity);
    console.log('[GameStore] Materials count:', materialsCount);

    // レアリティアップ確率（素材数に応じて上昇）
    // 2枚合成で30%、3枚で45%、4枚で60%...
    const baseUpgradeChance = 0.3;
    const upgradeChance = Math.min(baseUpgradeChance + (materialsCount - 1) * 0.15, 0.8);
    const currentRarityIndex = rarityOrder.indexOf(baseCard.rarity);
    
    console.log('[GameStore] Upgrade chance:', upgradeChance);
    console.log('[GameStore] Current rarity index:', currentRarityIndex);

    let newRarity = baseCard.rarity;
    const roll = Math.random();
    console.log('[GameStore] Random roll:', roll);
    
    if (currentRarityIndex < rarityOrder.length - 1 && roll < upgradeChance) {
      newRarity = rarityOrder[currentRarityIndex + 1];
      console.log('[GameStore] Rarity upgraded to:', newRarity);
    } else {
      console.log('[GameStore] Rarity not upgraded (roll >= chance or already max)');
    }

    // 新しいカードを作成
    const newStats = RARITY_STATS[newRarity];
    const newCard: WordCard = {
      id: `card_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      termId: baseCard.termId,
      term: baseCard.term,
      termJa: baseCard.termJa,
      rarity: newRarity,
      attackPower: newStats.attack,
      healPower: newStats.heal,
      acquired: true,
      acquiredAt: Date.now(),
      usageCount: 0,
      successCount: 0,
      upgradeLevel: Math.max(...cards.map(c => c.upgradeLevel)),  // 最高の強化レベルを引き継ぐ
    };

    // 素材カードを削除
    const consumedIds = cards.map(c => c.id);
    this.state.player.cards = this.state.player.cards.filter(c => !consumedIds.includes(c.id));
    
    // デッキからも削除
    this.state.player.currentDeck = this.state.player.currentDeck.filter(id => !consumedIds.includes(id));

    // 新カードを追加
    this.state.player.cards.push(newCard);

    this.saveState();
    this.notify();

    return {
      success: true,
      newCard,
      consumedCards: consumedIds,
    };
  }

  // 合成に必要なカード数を取得
  getFusionRequirement(): number {
    return 2;  // 最低2枚必要
  }
}

export const gameStore = new GameStore();

// 型インポートを追加
import type { DailyMission, MissionType, FusionResult } from './game-types';
