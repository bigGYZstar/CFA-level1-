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
  RARITY_STATS,
  INITIAL_PLAYER_STATE,
  INITIAL_BATTLE_STATE,
} from './game-types';
import { dataStore } from './data-store';
import type { Term } from './types';

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
      { id: 'eq1', name: 'P/E Slime', nameJa: 'PERスライム', hp: 40, maxHp: 40, attack: 6, defense: 2, expReward: 15, cardDropRate: 0.7, sprite: '🟢' },
      { id: 'eq2', name: 'Dividend Goblin', nameJa: '配当ゴブリン', hp: 50, maxHp: 50, attack: 8, defense: 3, expReward: 20, cardDropRate: 0.65, sprite: '👺' },
    ],
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
      { id: 'eq3', name: 'Valuation Golem', nameJa: 'バリュエーションゴーレム', hp: 80, maxHp: 80, attack: 12, defense: 5, expReward: 35, cardDropRate: 0.55, sprite: '🗿' },
      { id: 'eq4', name: 'DCF Phantom', nameJa: 'DCFファントム', hp: 70, maxHp: 70, attack: 14, defense: 4, expReward: 30, cardDropRate: 0.6, sprite: '👻' },
    ],
  },
  // ステージ3: 倫理・職業行為基準（ETH）
  {
    id: 3,
    name: 'Ethics Forest',
    nameJa: '倫理の森',
    description: 'CFA倫理基準の基礎を学ぶ',
    requiredLevel: 5,
    topicCode: 'ETH',
    enemies: [
      { id: 'eth1', name: 'Compliance Goblin', nameJa: 'コンプラゴブリン', hp: 60, maxHp: 60, attack: 10, defense: 4, expReward: 25, cardDropRate: 0.6, sprite: '👺' },
      { id: 'eth2', name: 'Ethics Slime', nameJa: '倫理スライム', hp: 45, maxHp: 45, attack: 8, defense: 3, expReward: 20, cardDropRate: 0.65, sprite: '🟢' },
    ],
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
      { id: 'qm1', name: 'Statistics Golem', nameJa: '統計ゴーレム', hp: 90, maxHp: 90, attack: 14, defense: 6, expReward: 40, cardDropRate: 0.5, sprite: '🗿' },
      { id: 'qm2', name: 'Probability Phantom', nameJa: '確率ファントム', hp: 75, maxHp: 75, attack: 16, defense: 5, expReward: 35, cardDropRate: 0.55, sprite: '👻' },
    ],
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
      { id: 'econ1', name: 'Inflation Dragon', nameJa: 'インフレドラゴン', hp: 120, maxHp: 120, attack: 18, defense: 8, expReward: 50, cardDropRate: 0.45, sprite: '🐉' },
      { id: 'econ2', name: 'Supply Demon', nameJa: '供給デーモン', hp: 90, maxHp: 90, attack: 14, defense: 6, expReward: 40, cardDropRate: 0.5, sprite: '😈' },
    ],
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
      { id: 'fsa1', name: 'Balance Sheet Beast', nameJa: 'BS獣', hp: 150, maxHp: 150, attack: 22, defense: 10, expReward: 65, cardDropRate: 0.4, sprite: '🦁' },
      { id: 'fsa2', name: 'Income Wraith', nameJa: 'PL亡霊', hp: 110, maxHp: 110, attack: 20, defense: 7, expReward: 55, cardDropRate: 0.45, sprite: '💀' },
    ],
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
      { id: 'fi1', name: 'Duration Dragon', nameJa: 'デュレーションドラゴン', hp: 200, maxHp: 200, attack: 26, defense: 12, expReward: 80, cardDropRate: 0.35, sprite: '🐲' },
      { id: 'fi2', name: 'Yield Hydra', nameJa: '利回りヒドラ', hp: 180, maxHp: 180, attack: 24, defense: 10, expReward: 70, cardDropRate: 0.4, sprite: '🐍' },
    ],
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
      { id: 'der1', name: 'Options Overlord', nameJa: 'オプション魔王', hp: 250, maxHp: 250, attack: 30, defense: 14, expReward: 100, cardDropRate: 0.3, sprite: '👹' },
      { id: 'der2', name: 'Futures Fiend', nameJa: '先物フィーンド', hp: 220, maxHp: 220, attack: 28, defense: 12, expReward: 90, cardDropRate: 0.35, sprite: '🔥' },
    ],
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
      { id: 'pm1', name: 'CAPM Colossus', nameJa: 'CAPMコロッサス', hp: 350, maxHp: 350, attack: 38, defense: 18, expReward: 130, cardDropRate: 0.25, sprite: '🏔️' },
      { id: 'pm2', name: 'Sharpe Sovereign', nameJa: 'シャープ皇帝', hp: 400, maxHp: 400, attack: 42, defense: 20, expReward: 150, cardDropRate: 0.2, sprite: '👑' },
    ],
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
    };
  }

  // 状態の読み込み
  async loadState(): Promise<void> {
    try {
      const saved = await AsyncStorage.getItem(GAME_STATE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        this.state = {
          ...this.state,
          ...parsed,
          battle: { ...INITIAL_BATTLE_STATE }, // バトル状態はリセット
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
    
    this.state.battle = {
      inBattle: true,
      enemy: { ...enemy },
      playerHp: this.state.player.hp,
      enemyHp: enemy.hp,
      turn: 'player',
      phase: 'select_action',
      selectedCard: null,
      quizQuestion: null,
      battleLog: [],
      earnedCards: [],
      earnedExp: 0,
    };
    this.state.currentStage = stageId;
    this.notify();
  }

  // カード選択（攻撃または回復）
  selectCard(card: WordCard, action: 'attack' | 'heal'): void {
    if (this.state.battle.phase !== 'select_action') return;

    this.state.battle.selectedCard = card;
    this.state.battle.phase = 'quiz';
    
    // クイズ問題を生成
    const term = dataStore.getTermById(card.termId);
    if (term) {
      this.state.battle.quizQuestion = this.generateQuiz(term);
    }
    
    this.notify();
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
      // 定義の最初の50文字を表示
      const defPreview = term.jp_definition.length > 60 
        ? term.jp_definition.substring(0, 60) + '...' 
        : term.jp_definition;
      const options = [term.jp_headword, ...shuffled.map((t: Term) => t.jp_headword)].sort(() => Math.random() - 0.5);
      return {
        termId: term.term_id,
        question: `次の説明に当てはまる用語は？\n「${defPreview}」`,
        questionType: 'concept',
        correctAnswer: term.jp_headword,
        options,
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
    let damage = 0;
    let heal = 0;

    // 学習ログに記録
    await dataStore.recordStudy(card.termId, correct);

    // カードの使用回数を更新
    const cardIndex = player.cards.findIndex((c) => c.id === card.id);
    if (cardIndex >= 0) {
      player.cards[cardIndex].usageCount++;
      if (correct) {
        player.cards[cardIndex].successCount++;
      }
    }

    if (correct) {
      if (action === 'attack') {
        damage = card.attackPower;
        battle.enemyHp = Math.max(0, battle.enemyHp - damage);
        this.addBattleLog('player', 'attack', `${card.term}で攻撃！${damage}ダメージ！`, damage);
      } else {
        heal = card.healPower;
        battle.playerHp = Math.min(player.maxHp, battle.playerHp + heal);
        this.addBattleLog('player', 'heal', `${card.term}で回復！HP+${heal}！`, undefined, heal);
      }
    } else {
      // 不正解の場合、逆ダメージ
      const selfDamage = Math.floor(card.attackPower * 0.5);
      battle.playerHp = Math.max(0, battle.playerHp - selfDamage);
      this.addBattleLog('player', 'fail', `クイズ不正解！${selfDamage}の反動ダメージ！`, selfDamage);
    }

    // フェーズを結果に移行
    battle.phase = 'result';
    battle.selectedCard = null;
    battle.quizQuestion = null;

    this.notify();
    await this.saveState();

    return { correct, damage, heal };
  }

  // 結果確認後、次のターンへ
  proceedToNextTurn(): void {
    const { battle } = this.state;

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

    // 敵のターン
    this.enemyTurn();
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
      battle.earnedExp = battle.enemy.expReward;
      player.exp += battle.earnedExp;

      // レベルアップ判定
      while (player.exp >= player.expToNextLevel) {
        player.exp -= player.expToNextLevel;
        player.level++;
        player.maxHp += 10;
        player.hp = player.maxHp;
        player.expToNextLevel = Math.floor(player.expToNextLevel * 1.2);
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

      this.addBattleLog('player', 'victory', `勝利！${battle.earnedExp}EXP獲得！`);
    } else {
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
    if (this.state.player.currentDeck.length >= 5) return false;
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
    };
    await AsyncStorage.removeItem(GAME_STATE_KEY);
    this.notify();
  }
}

export const gameStore = new GameStore();
