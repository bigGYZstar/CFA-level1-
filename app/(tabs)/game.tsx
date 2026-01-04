import { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Image, Alert, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { gameStore, STAGES } from '@/lib/game-store';
import { PlayerState, Stage, ItemType, ITEM_DEFINITIONS } from '@/lib/game-types';
import { RARITY_COLORS, RARITY_NAMES } from '@/lib/game-types';

export default function GameTabScreen() {
  const router = useRouter();
  const colors = useColors();
  const [player, setPlayer] = useState<PlayerState>(gameStore.getPlayer());
  const [unlockedStages, setUnlockedStages] = useState<number[]>([1]);
  const [showShop, setShowShop] = useState(false);
  const [selectedStage, setSelectedStage] = useState<Stage | null>(null);
  const [showItemSelect, setShowItemSelect] = useState(false);

  useEffect(() => {
    const init = async () => {
      await gameStore.loadState();
      await gameStore.grantStarterCards();
      const p = gameStore.getPlayer();
      setPlayer({ ...p, cards: [...p.cards], currentDeck: [...p.currentDeck], items: [...p.items] });
      setUnlockedStages([...gameStore.getState().unlockedStages]);
    };
    init();

    const unsubscribe = gameStore.subscribe(() => {
      const p = gameStore.getPlayer();
      setPlayer({ ...p, cards: [...p.cards], currentDeck: [...p.currentDeck], items: [...p.items] });
      setUnlockedStages([...gameStore.getState().unlockedStages]);
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
      // アイテムを使用してバトル開始
      const success = gameStore.useItem('schw_power');
      if (!success) {
        Alert.alert('エラー', 'アイテムがありません');
        return;
      }
    }
    
    gameStore.startBattle(selectedStage.id);
    setShowItemSelect(false);
    setSelectedStage(null);
    
    // アイテム使用時はCFA実問を出題
    if (useItem) {
      gameStore.startCFAQuiz();
    }
    
    router.push('/game/battle');
  }, [selectedStage, router]);

  const handleBuyItem = useCallback((itemType: ItemType) => {
    const success = gameStore.buyItem(itemType);
    if (success) {
      Alert.alert('購入完了', `${ITEM_DEFINITIONS[itemType].name}を購入しました！`);
    } else {
      Alert.alert('購入失敗', 'ゴールドが足りません');
    }
  }, []);

  const expPercentage = (player.exp / player.expToNextLevel) * 100;
  const schwCount = gameStore.getItemCount('schw_power');

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

        {/* アクションボタン */}
        <View style={styles.actionRow}>
          {/* カード枚数 */}
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

          {/* ショップ */}
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

          {/* デッキ */}
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
              style={[styles.closeButton, { backgroundColor: colors.primary }]}
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
    marginBottom: 12,
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
    width: 40,
    fontSize: 14,
    fontWeight: '600',
  },
  hpBarBg: {
    flex: 1,
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
  },
  hpBar: {
    height: '100%',
    borderRadius: 6,
  },
  hpText: {
    width: 70,
    textAlign: 'right',
    fontSize: 12,
  },
  expContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  expLabel: {
    width: 40,
    fontSize: 14,
    fontWeight: '600',
  },
  expBarBg: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  expBar: {
    height: '100%',
    borderRadius: 4,
  },
  expText: {
    width: 70,
    textAlign: 'right',
    fontSize: 12,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
  },
  actionIcon: {
    fontSize: 28,
    marginBottom: 4,
  },
  actionLabel: {
    fontSize: 12,
  },
  actionCount: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  itemsCard: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 2,
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
  },
  stageName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  lockText: {
    fontSize: 12,
  },
  stageDesc: {
    fontSize: 12,
    marginTop: 4,
  },
  enemyPreview: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 16,
  },
  enemyInfo: {
    alignItems: 'center',
  },
  enemySprite: {
    fontSize: 24,
  },
  enemyReward: {
    fontSize: 10,
    marginTop: 2,
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
    maxWidth: 400,
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  goldDisplay: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
  },
  shopItems: {
    gap: 12,
    marginBottom: 20,
  },
  shopItem: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  shopItemInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  shopItemIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  shopItemText: {
    flex: 1,
  },
  shopItemName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  shopItemDesc: {
    fontSize: 12,
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
    borderRadius: 10,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  battleOptions: {
    gap: 12,
    marginBottom: 16,
  },
  battleOption: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  battleOptionIcon: {
    fontSize: 32,
    marginBottom: 4,
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
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
  },
});
