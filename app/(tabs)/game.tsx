import { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Image, Alert, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { gameStore, STAGES } from '@/lib/game-store';
import { PlayerState, Stage, ItemType, ITEM_DEFINITIONS, DailyMission, Enemy, WordCard, CardRarity } from '@/lib/game-types';
import { RARITY_COLORS, RARITY_NAMES } from '@/lib/game-types';

export default function GameTabScreen() {
  const router = useRouter();
  const colors = useColors();
  const [player, setPlayer] = useState<PlayerState>(gameStore.getPlayer());
  const [unlockedStages, setUnlockedStages] = useState<number[]>([1]);
  const [showShop, setShowShop] = useState(false);
  const [selectedStage, setSelectedStage] = useState<Stage | null>(null);
  const [showItemSelect, setShowItemSelect] = useState(false);
  const [showMissions, setShowMissions] = useState(false);
  const [missions, setMissions] = useState<DailyMission[]>([]);
  const [showFusion, setShowFusion] = useState(false);
  const [fusionCandidates, setFusionCandidates] = useState<{ termId: string; cards: WordCard[] }[]>([]);
  const [selectedFusionCards, setSelectedFusionCards] = useState<string[]>([]);
  const [showBossSelect, setShowBossSelect] = useState(false);
  const [selectedBoss, setSelectedBoss] = useState<{ stage: Stage; boss: Enemy } | null>(null);
  const [useFusionBoost, setUseFusionBoost] = useState(false);
  const [fusionResult, setFusionResult] = useState<{ success: boolean; upgraded: boolean; previousRarity: string; newRarity: string; chance: number } | null>(null);

  useEffect(() => {
    const init = async () => {
      await gameStore.loadState();
      await gameStore.grantStarterCards();
      const p = gameStore.getPlayer();
      setPlayer({ ...p, cards: [...(p.cards || [])], currentDeck: [...(p.currentDeck || [])], items: [...(p.items || [])] });
      setUnlockedStages([...gameStore.getState().unlockedStages]);
      setMissions(gameStore.getDailyMissions());
      setFusionCandidates(gameStore.getFusionCandidates());
    };
    init();

    const unsubscribe = gameStore.subscribe(() => {
      const p = gameStore.getPlayer();
      setPlayer({ ...p, cards: [...(p.cards || [])], currentDeck: [...(p.currentDeck || [])], items: [...(p.items || [])] });
      setUnlockedStages([...gameStore.getState().unlockedStages]);
      setMissions(gameStore.getDailyMissions());
      setFusionCandidates(gameStore.getFusionCandidates());
    });
    return unsubscribe;
  }, []);

  const handleStageSelect = useCallback((stage: Stage) => {
    if (!unlockedStages.includes(stage.id)) return;
    setSelectedStage(stage);
    setShowItemSelect(true);
  }, [unlockedStages]);

  const handleStartBattle = useCallback((useItem: boolean) => {
    if (!selectedStage) return;
    
    if (useItem) {
      const success = gameStore.useItem('schw_power');
      if (!success) {
        Alert.alert('エラー', 'アイテムがありません');
        return;
      }
    }
    
    gameStore.startBattle(selectedStage.id);
    setShowItemSelect(false);
    setSelectedStage(null);
    
    if (useItem) {
      gameStore.startCFAQuiz();
    }
    
    router.push('/game/battle');
  }, [selectedStage, router]);

  const handleBossBattle = useCallback((stage: Stage, boss: Enemy) => {
    if (gameStore.isBossDefeated(boss.id)) {
      Alert.alert('撃破済み', 'このボスは既に倒しています');
      return;
    }
    setSelectedBoss({ stage, boss });
  }, []);

  const handleStartBossBattle = useCallback((useItem: boolean) => {
    if (!selectedBoss) return;
    
    if (useItem) {
      const success = gameStore.useItem('schw_power');
      if (!success) {
        Alert.alert('エラー', 'アイテムがありません');
        return;
      }
    }
    
    const success = gameStore.startBossBattle(selectedBoss.stage.id);
    if (success) {
      setShowBossSelect(false);
      setSelectedBoss(null);
      
      if (useItem) {
        gameStore.startCFAQuiz();
      }
      
      router.push('/game/battle');
    } else {
      Alert.alert('エラー', 'ボス戦を開始できません');
    }
  }, [selectedBoss, router]);

  const handleBuyItem = useCallback((itemType: ItemType) => {
    const success = gameStore.buyItem(itemType);
    if (success) {
      Alert.alert('購入完了', `${ITEM_DEFINITIONS[itemType].name}を購入しました！`);
    } else {
      Alert.alert('購入失敗', 'ゴールドが足りません');
    }
  }, []);

  const handleClaimReward = useCallback((missionId: string) => {
    const result = gameStore.claimMissionReward(missionId);
    if (result.success) {
      Alert.alert('報酬獲得！', `${result.gold}G、${result.exp}EXPを獲得しました！`);
    }
  }, []);

  const handleFusion = useCallback(() => {
    if (selectedFusionCards.length < 2) {
      Alert.alert('エラー', '2枚以上のカードを選択してください');
      return;
    }
    
    const result = gameStore.fuseCards(selectedFusionCards);
    if (result.success && result.newCard) {
      const rarityName = RARITY_NAMES[result.newCard.rarity];
      Alert.alert('合成成功！', `${result.newCard.term}（${rarityName}）を獲得しました！`);
      setSelectedFusionCards([]);
      setFusionCandidates(gameStore.getFusionCandidates());
    } else {
      Alert.alert('合成失敗', '合成に失敗しました');
    }
  }, [selectedFusionCards]);

  const handleFusionWithResult = useCallback(() => {
    if (selectedFusionCards.length < 2) {
      Alert.alert('エラー', '2枚以上のカードを選択してください');
      return;
    }
    
    const result = gameStore.fuseCards(selectedFusionCards, useFusionBoost);
    if (result.success && result.newCard) {
      const previousRarityName = result.previousRarity ? RARITY_NAMES[result.previousRarity] : '不明';
      const newRarityName = RARITY_NAMES[result.newCard.rarity];
      const upgraded = result.rarityUpgraded ?? false;
      const chance = result.upgradeChance ?? 0;
      
      if (upgraded) {
        Alert.alert(
          '🎉 レアリティアップ成功！',
          `${result.newCard.term}\n${previousRarityName} → ${newRarityName}\n（確率: ${Math.round(chance * 100)}%）`
        );
      } else {
        Alert.alert(
          '合成完了',
          `${result.newCard.term}（${newRarityName}）\nレアリティは上がりませんでした\n（確率: ${Math.round(chance * 100)}%）`
        );
      }
      
      setSelectedFusionCards([]);
      setUseFusionBoost(false);
      setFusionCandidates(gameStore.getFusionCandidates());
    } else {
      Alert.alert('合成失敗', '合成に失敗しました');
    }
  }, [selectedFusionCards, useFusionBoost]);

  const toggleFusionCard = useCallback((cardId: string) => {
    setSelectedFusionCards(prev => {
      if (prev.includes(cardId)) {
        return prev.filter(id => id !== cardId);
      }
      return [...prev, cardId];
    });
  }, []);

  const expPercentage = (player.exp / player.expToNextLevel) * 100;
  const schwCount = gameStore.getItemCount('schw_power');
  const completedMissions = missions.filter(m => m.completed && !m.claimed).length;

  return (
    <ScreenContainer>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* ヘッダー */}
        <View style={[styles.header, { backgroundColor: colors.surface }]}>
          <Image 
            source={require('@/assets/images/icon.png')} 
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={[styles.title, { color: colors.foreground }]}>🎮 CFA Quest</Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>単語カードバトルRPG</Text>
        </View>

        {/* プレイヤーステータス */}
        <View style={[styles.statusCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.statusHeader}>
            <Text style={[styles.levelText, { color: colors.primary }]}>Lv.{player.level}</Text>
            <View style={styles.goldContainer}>
              <Text style={[styles.goldText, { color: colors.warning }]}>💰 {player.gold}G</Text>
            </View>
          </View>
          
          <View style={styles.statsRow}>
            <Text style={[styles.statsText, { color: colors.muted }]}>
              勝利: {player.totalWins} / {player.totalBattles}戦
            </Text>
          </View>
          
          <View style={styles.hpContainer}>
            <Text style={[styles.hpLabel, { color: colors.foreground }]}>HP</Text>
            <View style={[styles.hpBarBg, { backgroundColor: colors.border }]}>
              <View 
                style={[
                  styles.hpBar, 
                  { 
                    backgroundColor: colors.success,
                    width: `${(player.hp / player.maxHp) * 100}%` 
                  }
                ]} 
              />
            </View>
            <Text style={[styles.hpText, { color: colors.foreground }]}>
              {player.hp}/{player.maxHp}
            </Text>
          </View>

          <View style={styles.expContainer}>
            <Text style={[styles.expLabel, { color: colors.foreground }]}>EXP</Text>
            <View style={[styles.expBarBg, { backgroundColor: colors.border }]}>
              <View 
                style={[
                  styles.expBar, 
                  { 
                    backgroundColor: colors.primary,
                    width: `${expPercentage}%` 
                  }
                ]} 
              />
            </View>
            <Text style={[styles.expText, { color: colors.muted }]}>
              {player.exp}/{player.expToNextLevel}
            </Text>
          </View>
        </View>

        {/* アクションボタン - 上段 */}
        <View style={styles.actionRow}>
          <Pressable 
            style={({ pressed }) => [
              styles.actionButton, 
              { backgroundColor: colors.surface, borderColor: colors.border },
              pressed && { opacity: 0.7 }
            ]}
            onPress={() => router.push('/game/cards')}
          >
            <Text style={styles.actionIcon}>🃏</Text>
            <Text style={[styles.actionLabel, { color: colors.foreground }]}>カード</Text>
            <Text style={[styles.actionCount, { color: colors.primary }]}>{player.cards.length}枚</Text>
          </Pressable>

          <Pressable 
            style={({ pressed }) => [
              styles.actionButton, 
              { backgroundColor: colors.surface, borderColor: colors.primary },
              pressed && { opacity: 0.7 }
            ]}
            onPress={() => router.push('/game/deck')}
          >
            <Text style={styles.actionIcon}>📚</Text>
            <Text style={[styles.actionLabel, { color: colors.foreground }]}>デッキ</Text>
            <Text style={[styles.actionCount, { color: colors.primary }]}>{player.currentDeck.length}枚</Text>
          </Pressable>

          <Pressable 
            style={({ pressed }) => [
              styles.actionButton, 
              { backgroundColor: colors.surface, borderColor: colors.warning },
              pressed && { opacity: 0.7 }
            ]}
            onPress={() => setShowShop(true)}
          >
            <Text style={styles.actionIcon}>🛒</Text>
            <Text style={[styles.actionLabel, { color: colors.foreground }]}>ショップ</Text>
            <Text style={[styles.actionCount, { color: colors.warning }]}>アイテム</Text>
          </Pressable>
        </View>

        {/* アクションボタン - 下段 */}
        <View style={styles.actionRow}>
          <Pressable 
            style={({ pressed }) => [
              styles.actionButton, 
              { backgroundColor: colors.surface, borderColor: completedMissions > 0 ? colors.success : colors.border },
              pressed && { opacity: 0.7 }
            ]}
            onPress={() => setShowMissions(true)}
          >
            <Text style={styles.actionIcon}>📋</Text>
            <Text style={[styles.actionLabel, { color: colors.foreground }]}>ミッション</Text>
            {completedMissions > 0 && (
              <Text style={[styles.actionCount, { color: colors.success }]}>🎁{completedMissions}</Text>
            )}
          </Pressable>

          <Pressable 
            style={({ pressed }) => [
              styles.actionButton, 
              { backgroundColor: colors.surface, borderColor: fusionCandidates.length > 0 ? colors.primary : colors.border },
              pressed && { opacity: 0.7 }
            ]}
            onPress={() => setShowFusion(true)}
          >
            <Text style={styles.actionIcon}>🔮</Text>
            <Text style={[styles.actionLabel, { color: colors.foreground }]}>合成</Text>
            {fusionCandidates.length > 0 && (
              <Text style={[styles.actionCount, { color: colors.primary }]}>{fusionCandidates.length}組</Text>
            )}
          </Pressable>

          <Pressable 
            style={({ pressed }) => [
              styles.actionButton, 
              { backgroundColor: colors.surface, borderColor: colors.error },
              pressed && { opacity: 0.7 }
            ]}
            onPress={() => setShowBossSelect(true)}
          >
            <Text style={styles.actionIcon}>👹</Text>
            <Text style={[styles.actionLabel, { color: colors.foreground }]}>ボス</Text>
            <Text style={[styles.actionCount, { color: colors.error }]}>挑戦</Text>
          </Pressable>
        </View>

        {/* 所持アイテム */}
        {schwCount > 0 && (
          <View style={[styles.itemsCard, { backgroundColor: colors.surface, borderColor: colors.warning }]}>
            <Text style={[styles.itemsTitle, { color: colors.warning }]}>所持アイテム</Text>
            <View style={styles.itemRow}>
              <Text style={styles.itemIcon}>⚡</Text>
              <Text style={[styles.itemName, { color: colors.foreground }]}>Schwの力</Text>
              <Text style={[styles.itemCount, { color: colors.warning }]}>×{schwCount}</Text>
            </View>
          </View>
        )}

        {/* ステージ選択 */}
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>ステージ選択</Text>
        
        {STAGES.map((stage) => {
          const isUnlocked = unlockedStages.includes(stage.id);
          const bossDefeated = stage.boss ? gameStore.isBossDefeated(stage.boss.id) : false;
          
          return (
            <Pressable
              key={stage.id}
              style={({ pressed }) => [
                styles.stageCard,
                { 
                  backgroundColor: isUnlocked ? colors.surface : colors.background,
                  borderColor: isUnlocked ? colors.primary : colors.border,
                  opacity: isUnlocked ? (pressed ? 0.7 : 1) : 0.5
                }
              ]}
              onPress={() => handleStageSelect(stage)}
              disabled={!isUnlocked}
            >
              <View style={styles.stageHeader}>
                <Text style={[styles.stageName, { color: isUnlocked ? colors.foreground : colors.muted }]}>
                  {stage.nameJa}
                </Text>

                {!isUnlocked && (
                  <Text style={[styles.lockText, { color: colors.error }]}>
                    🔒 Lv.{stage.requiredLevel}
                  </Text>
                )}
                {stage.boss && bossDefeated && (
                  <Text style={[styles.bossDefeated, { color: colors.success }]}>✅ボス撃破</Text>
                )}
              </View>
              <Text style={[styles.stageDesc, { color: colors.muted }]}>{stage.description}</Text>
              <View style={styles.enemyPreview}>
                {stage.enemies.map((enemy) => (
                  <View key={enemy.id} style={styles.enemyInfo}>
                    <Text style={styles.enemySprite}>{enemy.sprite}</Text>
                    <Text style={[styles.enemyReward, { color: colors.muted }]}>
                      💰{enemy.goldReward}
                    </Text>
                  </View>
                ))}
              </View>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* ショップモーダル */}
      <Modal
        visible={showShop}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowShop(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>🛒 ショップ</Text>
            <Text style={[styles.goldDisplay, { color: colors.warning }]}>所持金: {player.gold}G</Text>
            
            <View style={styles.shopItems}>
              {Object.entries(ITEM_DEFINITIONS).map(([key, item]) => (
                <View key={key} style={[styles.shopItem, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <View style={styles.shopItemInfo}>
                    <Text style={styles.shopItemIcon}>⚡</Text>
                    <View style={styles.shopItemText}>
                      <Text style={[styles.shopItemName, { color: colors.foreground }]}>{item.name}</Text>
                      <Text style={[styles.shopItemDesc, { color: colors.muted }]}>{item.description}</Text>
                    </View>
                  </View>
                  <Pressable
                    style={({ pressed }) => [
                      styles.buyButton,
                      { 
                        backgroundColor: player.gold >= item.price ? colors.warning : colors.border,
                        opacity: pressed ? 0.7 : 1
                      }
                    ]}
                    onPress={() => handleBuyItem(key as ItemType)}
                    disabled={player.gold < item.price}
                  >
                    <Text style={styles.buyButtonText}>{item.price}G</Text>
                  </Pressable>
                </View>
              ))}
            </View>
            
            <Pressable
              style={[styles.closeButton, { backgroundColor: colors.primary
 }]}
              onPress={() => setShowShop(false)}
            >
              <Text style={styles.closeButtonText}>閉じる</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* アイテム使用選択モーダル */}
      <Modal
        visible={showItemSelect}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowItemSelect(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>
              {selectedStage?.nameJa}に挑戦
            </Text>
            
            <View style={styles.battleOptions}>
              <Pressable
                style={({ pressed }) => [
                  styles.battleOption,
                  { backgroundColor: colors.primary, opacity: pressed ? 0.7 : 1 }
                ]}
                onPress={() => handleStartBattle(false)}
              >
                <Text style={styles.battleOptionIcon}>⚔️</Text>
                <Text style={styles.battleOptionText}>通常バトル</Text>
              </Pressable>
              
              {schwCount > 0 && (
                <Pressable
                  style={({ pressed }) => [
                    styles.battleOption,
                    { backgroundColor: colors.warning, opacity: pressed ? 0.7 : 1 }
                  ]}
                  onPress={() => handleStartBattle(true)}
                >
                  <Text style={styles.battleOptionIcon}>⚡</Text>
                  <Text style={styles.battleOptionText}>Schwの力を使う</Text>
                  <Text style={styles.battleOptionHint}>CFA実問正解でEXP10倍！</Text>
                </Pressable>
              )}
            </View>
            
            <Pressable
              style={[styles.cancelButton, { borderColor: colors.muted }]}
              onPress={() => {
                setShowItemSelect(false);
                setSelectedStage(null);
              }}
            >
              <Text style={[styles.cancelButtonText, { color: colors.muted }]}>キャンセル</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* デイリーミッションモーダル */}
      <Modal
        visible={showMissions}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowMissions(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>📋 デイリーミッション</Text>
            
            <ScrollView style={styles.missionList}>
              {missions.map((mission) => (
                <View key={mission.id} style={[styles.missionItem, { backgroundColor: colors.surface, borderColor: mission.completed ? colors.success : colors.border }]}>
                  <View style={styles.missionInfo}>
                    <Text style={[styles.missionName, { color: colors.foreground }]}>{mission.name}</Text>
                    <Text style={[styles.missionDesc, { color: colors.muted }]}>{mission.description}</Text>
                    <View style={styles.missionProgress}>
                      <View style={[styles.progressBarBg, { backgroundColor: colors.border }]}>
                        <View style={[styles.progressBar, { backgroundColor: colors.primary, width: `${Math.min(100, (mission.current / mission.target) * 100)}%` }]} />
                      </View>
                      <Text style={[styles.progressText, { color: colors.muted }]}>{mission.current}/{mission.target}</Text>
                    </View>
                  </View>
                  <View style={styles.missionReward}>
                    <Text style={[styles.rewardText, { color: colors.warning }]}>💰{mission.rewardGold}</Text>
                    <Text style={[styles.rewardText, { color: colors.primary }]}>⭐{mission.rewardExp}</Text>
                    {mission.completed && !mission.claimed && (
                      <Pressable
                        style={[styles.claimButton, { backgroundColor: colors.success }]}
                        onPress={() => handleClaimReward(mission.id)}
                      >
                        <Text style={styles.claimButtonText}>受取</Text>
                      </Pressable>
                    )}
                    {mission.claimed && (
                      <Text style={[styles.claimedText, { color: colors.success }]}>✅</Text>
                    )}
                  </View>
                </View>
              ))}
            </ScrollView>
            
            <Pressable
              style={[styles.closeButton, { backgroundColor: colors.primary }]}
              onPress={() => setShowMissions(false)}
            >
              <Text style={styles.closeButtonText}>閉じる</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* カード合成モーダル */}
      <Modal
        visible={showFusion}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFusion(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>🔮 カード合成</Text>
            <Text style={[styles.fusionHint, { color: colors.muted }]}>同じ単語のカード2枚以上で合成可能</Text>
            
            {/* 合成確率表示 */}
            {selectedFusionCards.length >= 2 && (
              <View style={[styles.fusionChanceBox, { backgroundColor: colors.surface, borderColor: colors.primary }]}>
                <Text style={[styles.fusionChanceLabel, { color: colors.foreground }]}>
                  レアリティアップ確率
                </Text>
                <Text style={[styles.fusionChanceValue, { color: colors.primary }]}>
                  {Math.round(gameStore.calculateFusionChance(selectedFusionCards.length, useFusionBoost) * 100)}%
                </Text>
                {useFusionBoost && (
                  <Text style={[styles.fusionBoostBadge, { backgroundColor: colors.warning }]}>
                    💫 +30% ブースト中
                  </Text>
                )}
              </View>
            )}
            
            {/* 合成触媒アイテム */}
            <View style={[styles.fusionBoostSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.fusionBoostInfo}>
                <Text style={[styles.fusionBoostName, { color: colors.foreground }]}>
                  🧪 合成触媒
                </Text>
                <Text style={[styles.fusionBoostDesc, { color: colors.muted }]}>
                  レアリティアップ確率+30%
                </Text>
                <Text style={[styles.fusionBoostCount, { color: colors.foreground }]}>
                  所持: {gameStore.getFusionBoostCount()}個
                </Text>
              </View>
              <View style={styles.fusionBoostActions}>
                {gameStore.getFusionBoostCount() > 0 && (
                  <Pressable
                    style={({ pressed }) => [
                      styles.fusionBoostToggle,
                      { 
                        backgroundColor: useFusionBoost ? colors.warning : colors.border,
                        opacity: pressed ? 0.7 : 1
                      }
                    ]}
                    onPress={() => setUseFusionBoost(!useFusionBoost)}
                  >
                    <Text style={styles.fusionBoostToggleText}>
                      {useFusionBoost ? '✓ 使用中' : '使用する'}
                    </Text>
                  </Pressable>
                )}
                <Pressable
                  style={({ pressed }) => [
                    styles.fusionBoostBuy,
                    { 
                      backgroundColor: player.gold >= 300 ? colors.success : colors.muted,
                      opacity: pressed ? 0.7 : 1
                    }
                  ]}
                  onPress={() => {
                    const success = gameStore.buyItem('fusion_boost');
                    if (success) {
                      Alert.alert('購入完了', '合成触媒を購入しました！');
                    } else {
                      Alert.alert('購入失敗', 'ゴールドが足りません');
                    }
                  }}
                  disabled={player.gold < 300}
                >
                  <Text style={styles.fusionBoostBuyText}>300Gで購入</Text>
                </Pressable>
              </View>
            </View>
            
            <ScrollView style={styles.fusionList}>
              {fusionCandidates.length === 0 ? (
                <Text style={[styles.noFusionText, { color: colors.muted }]}>合成可能なカードがありません</Text>
              ) : (
                fusionCandidates.map(({ termId, cards }) => (
                  <View key={termId} style={[styles.fusionGroup, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <Text style={[styles.fusionTermName, { color: colors.foreground }]}>{cards[0].term}</Text>
                    <View style={styles.fusionCards}>
                      {cards.map((card) => (
                        <Pressable
                          key={card.id}
                          style={[
                            styles.fusionCard,
                            { 
                              borderColor: selectedFusionCards.includes(card.id) ? colors.primary : RARITY_COLORS[card.rarity],
                              backgroundColor: selectedFusionCards.includes(card.id) ? colors.primary + '20' : 'transparent'
                            }
                          ]}
                          onPress={() => toggleFusionCard(card.id)}
                        >
                          <Text style={[styles.fusionCardRarity, { color: RARITY_COLORS[card.rarity] }]}>
                            {RARITY_NAMES[card.rarity]}
                          </Text>
                          {card.upgradeLevel > 0 && (
                            <Text style={[styles.fusionCardLevel, { color: colors.warning }]}>+{card.upgradeLevel}</Text>
                          )}
                          {selectedFusionCards.includes(card.id) && (
                            <Text style={styles.selectedMark}>✓</Text>
                          )}
                        </Pressable>
                      ))}
                    </View>
                  </View>
                ))
              )}
            </ScrollView>
            
            {selectedFusionCards.length >= 2 && (
              <Pressable
                style={[styles.fusionButton, { backgroundColor: colors.primary }]}
                onPress={handleFusionWithResult}
              >
                <Text style={styles.fusionButtonText}>合成する（{selectedFusionCards.length}枚）</Text>
              </Pressable>
            )}
            
            <Pressable
              style={[styles.closeButton, { backgroundColor: colors.muted }]}
              onPress={() => {
                setShowFusion(false);
                setSelectedFusionCards([]);
                setUseFusionBoost(false);
              }}
            >
              <Text style={styles.closeButtonText}>閉じる</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* ボス選択モーダル */}
      <Modal
        visible={showBossSelect}
        animationType="slide"
        transparent={true}
        onRequestClose={() => { setShowBossSelect(false); setSelectedBoss(null); }}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>👹 ボス戦</Text>
            <Text style={[styles.bossHint, { color: colors.muted }]}>各ステージのボスに挑戦！倒すと限定報酬</Text>
            
            {!selectedBoss ? (
              <>
                <ScrollView style={styles.bossList}>
                  {STAGES.filter(s => s.boss && unlockedStages.includes(s.id)).map((stage) => {
                    const boss = stage.boss!;
                    const defeated = gameStore.isBossDefeated(boss.id);
                    
                    return (
                      <Pressable
                        key={boss.id}
                        style={({ pressed }) => [
                          styles.bossItem,
                          { 
                            backgroundColor: defeated ? colors.border : colors.surface,
                            borderColor: defeated ? colors.success : colors.error,
                            opacity: defeated ? 0.6 : (pressed ? 0.7 : 1)
                          }
                        ]}
                        onPress={() => handleBossBattle(stage, boss)}
                        disabled={defeated}
                      >
                        <Text style={styles.bossSprite}>{boss.sprite}</Text>
                        <View style={styles.bossInfo}>
                          <Text style={[styles.bossName, { color: defeated ? colors.muted : colors.foreground }]}>
                            {boss.nameJa}
                          </Text>
                          <Text style={[styles.bossStageName, { color: colors.muted }]}>{stage.nameJa}</Text>
                          <Text style={[styles.bossStats, { color: colors.muted }]}>
                            HP:{boss.hp} ATK:{boss.attack}
                          </Text>
                        </View>
                        <View style={styles.bossRewards}>
                          <Text style={[styles.bossRewardText, { color: colors.warning }]}>💰{boss.goldReward}</Text>
                          <Text style={[styles.bossRewardText, { color: colors.primary }]}>⭐{boss.expReward}</Text>
                          {defeated && <Text style={[styles.defeatedText, { color: colors.success }]}>撃破済</Text>}
                        </View>
                      </Pressable>
                    );
                  })}
                </ScrollView>
                
                <Pressable
                  style={[styles.closeButton, { backgroundColor: colors.primary }]}
                  onPress={() => setShowBossSelect(false)}
                >
                  <Text style={styles.closeButtonText}>閉じる</Text>
                </Pressable>
              </>
            ) : (
              <>
                <View style={[styles.selectedBossCard, { backgroundColor: colors.surface, borderColor: colors.error }]}>
                  <Text style={styles.bossSprite}>{selectedBoss.boss.sprite}</Text>
                  <Text style={[styles.bossName, { color: colors.foreground }]}>{selectedBoss.boss.nameJa}</Text>
                  <Text style={[styles.bossStats, { color: colors.muted }]}>HP:{selectedBoss.boss.hp} ATK:{selectedBoss.boss.attack}</Text>
                </View>
                
                <Text style={[styles.itemSelectTitle, { color: colors.foreground }]}>アイテムを使いますか？</Text>
                
                <Pressable
                  style={[styles.itemButton, { backgroundColor: colors.warning }]}
                  onPress={() => handleStartBossBattle(true)}
                >
                  <Text style={styles.itemButtonText}>⚡ Schwの力を使う（所持: {schwCount}個）</Text>
                  <Text style={[styles.itemButtonHint, { color: '#fff' }]}>CFA実問正解でEXP10倍！</Text>
                </Pressable>
                
                <Pressable
                  style={[styles.itemButton, { backgroundColor: colors.primary }]}
                  onPress={() => handleStartBossBattle(false)}
                >
                  <Text style={styles.itemButtonText}>そのまま戦う</Text>
                </Pressable>
                
                <Pressable
                  style={[styles.closeButton, { backgroundColor: colors.muted }]}
                  onPress={() => setSelectedBoss(null)}
                >
                  <Text style={styles.closeButtonText}>戻る</Text>
                </Pressable>
              </>
            )}
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 100,
  },
  header: {
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 8,
    borderRadius: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  statusCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  levelText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  goldContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  goldText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  statsRow: {
    marginBottom: 8,
  },
  statsText: {
    fontSize: 14,
  },
  hpContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  hpLabel: {
    width: 30,
    fontSize: 14,
    fontWeight: 'bold',
  },
  hpBarBg: {
    flex: 1,
    height: 12,
    borderRadius: 6,
    marginHorizontal: 8,
  },
  hpBar: {
    height: '100%',
    borderRadius: 6,
  },
  hpText: {
    width: 70,
    fontSize: 12,
    textAlign: 'right',
  },
  expContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  expLabel: {
    width: 30,
    fontSize: 14,
    fontWeight: 'bold',
  },
  expBarBg: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 8,
  },
  expBar: {
    height: '100%',
    borderRadius: 4,
  },
  expText: {
    width: 70,
    fontSize: 12,
    textAlign: 'right',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  actionButton: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  actionIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  actionCount: {
    fontSize: 11,
    marginTop: 2,
  },
  itemsCard: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  itemsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  itemName: {
    flex: 1,
    fontSize: 14,
  },
  itemCount: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  stageCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    marginBottom: 12,
  },
  stageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  stageName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  lockText: {
    fontSize: 12,
  },
  bossDefeated: {
    fontSize: 12,
  },
  stageDesc: {
    fontSize: 12,
    marginBottom: 8,
  },
  enemyPreview: {
    flexDirection: 'row',
    gap: 12,
  },
  enemyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  enemySprite: {
    fontSize: 20,
  },
  enemyReward: {
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxHeight: '80%',
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  goldDisplay: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  shopItems: {
    gap: 12,
  },
  shopItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  shopItemInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  shopItemIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  shopItemText: {
    flex: 1,
  },
  shopItemName: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  shopItemDesc: {
    fontSize: 11,
    marginTop: 2,
  },
  buyButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  buyButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  closeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  battleOptions: {
    gap: 12,
  },
  battleOption: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  battleOptionIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  battleOptionText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  battleOptionHint: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    marginTop: 4,
  },
  cancelButton: {
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
    borderWidth: 1,
  },
  cancelButtonText: {
    fontSize: 16,
  },
  missionList: {
    maxHeight: 300,
  },
  missionItem: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  missionInfo: {
    flex: 1,
  },
  missionName: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  missionDesc: {
    fontSize: 12,
    marginTop: 2,
  },
  missionProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  progressBarBg: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    width: 50,
  },
  missionReward: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  rewardText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  claimButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginTop: 4,
  },
  claimButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  claimedText: {
    fontSize: 16,
    marginTop: 4,
  },
  fusionHint: {
    textAlign: 'center',
    marginBottom: 16,
    fontSize: 12,
  },
  fusionList: {
    maxHeight: 300,
  },
  noFusionText: {
    textAlign: 'center',
    padding: 20,
  },
  fusionGroup: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  fusionTermName: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  fusionCards: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  fusionCard: {
    padding: 8,
    borderRadius: 8,
    borderWidth: 2,
    minWidth: 80,
    alignItems: 'center',
  },
  fusionCardRarity: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  fusionCardLevel: {
    fontSize: 10,
    fontWeight: 'bold',
    marginTop: 2,
  },
  fusionChanceBox: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 2,
    marginBottom: 12,
    alignItems: 'center',
  },
  fusionChanceLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  fusionChanceValue: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  fusionBoostBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 8,
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    overflow: 'hidden',
  },
  fusionBoostSection: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  fusionBoostInfo: {
    flex: 1,
  },
  fusionBoostName: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  fusionBoostDesc: {
    fontSize: 11,
    marginTop: 2,
  },
  fusionBoostCount: {
    fontSize: 12,
    marginTop: 4,
  },
  fusionBoostActions: {
    flexDirection: 'row',
    gap: 8,
  },
  fusionBoostToggle: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  fusionBoostToggleText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  fusionBoostBuy: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  fusionBoostBuyText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  selectedMark: {
    fontSize: 14,
    marginTop: 2,
  },
  fusionButton: {
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  fusionButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  bossHint: {
    textAlign: 'center',
    marginBottom: 16,
    fontSize: 12,
  },
  bossList: {
    maxHeight: 300,
  },
  bossItem: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 12,
    borderWidth: 2,
    marginBottom: 8,
    alignItems: 'center',
  },
  bossSprite: {
    fontSize: 40,
    marginRight: 12,
  },
  bossInfo: {
    flex: 1,
  },
  bossName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  bossStageName: {
    fontSize: 12,
    marginTop: 2,
  },
  bossStats: {
    fontSize: 11,
    marginTop: 4,
  },
  bossRewards: {
    alignItems: 'flex-end',
  },
  bossRewardText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  defeatedText: {
    fontSize: 12,
    marginTop: 4,
  },
  selectedBossCard: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    marginBottom: 16,
  },
  itemSelectTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  itemButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  itemButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  itemButtonHint: {
    fontSize: 12,
    marginTop: 4,
  },
});
