import { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet, Alert, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { gameStore } from '@/lib/game-store';
import { WordCard, CardRarity, PlayerState } from '@/lib/game-types';
import { RARITY_COLORS, RARITY_NAMES } from '@/lib/game-types';

export default function CardsScreen() {
  const router = useRouter();
  const colors = useColors();
  const [cards, setCards] = useState<WordCard[]>([]);
  const [player, setPlayer] = useState<PlayerState>(gameStore.getPlayer());
  const [filter, setFilter] = useState<CardRarity | 'all'>('all');
  const [selectedCard, setSelectedCard] = useState<WordCard | null>(null);

  useEffect(() => {
    const loadCards = async () => {
      await gameStore.loadState();
      setCards(gameStore.getPlayer().cards);
      setPlayer(gameStore.getPlayer());
    };
    loadCards();

    const unsubscribe = gameStore.subscribe(() => {
      const p = gameStore.getPlayer();
      setCards([...p.cards]);
      setPlayer({ ...p });
    });
    return unsubscribe;
  }, []);

  const handleUpgrade = useCallback((card: WordCard) => {
    const cost = gameStore.getUpgradeCost(card.id);
    if (cost === null) {
      Alert.alert('強化不可', '最大強化レベルに達しています');
      return;
    }

    Alert.alert(
      'カード強化',
      `${card.termJa}を強化しますか？\n\n費用: ${cost}G\n所持金: ${player.gold}G`,
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '強化する',
          onPress: () => {
            const result = gameStore.upgradeCard(card.id);
            if (result.success) {
              Alert.alert('強化成功', result.message);
              setSelectedCard(null);
            } else {
              Alert.alert('強化失敗', result.message);
            }
          }
        }
      ]
    );
  }, [player.gold]);

  const filteredCards = filter === 'all' 
    ? cards 
    : cards.filter(c => c.rarity === filter);

  const rarityFilters: (CardRarity | 'all')[] = ['all', 'legendary', 'epic', 'rare', 'uncommon', 'common'];

  const renderCard = ({ item }: { item: WordCard }) => {
    const upgradeCost = gameStore.getUpgradeCost(item.id);
    const canUpgrade = upgradeCost !== null && player.gold >= upgradeCost;
    
    return (
      <Pressable 
        style={[styles.card, { borderColor: RARITY_COLORS[item.rarity], backgroundColor: colors.surface }]}
        onPress={() => setSelectedCard(item)}
      >
        <View style={styles.cardHeader}>
          <Text style={[styles.cardName, { color: colors.foreground }]} numberOfLines={1}>
            {item.termJa}
          </Text>
          <View style={styles.rarityContainer}>
            <Text style={[styles.cardRarity, { color: RARITY_COLORS[item.rarity] }]}>
              {RARITY_NAMES[item.rarity]}
            </Text>
            {item.upgradeLevel > 0 && (
              <Text style={[styles.upgradeLevel, { color: colors.warning }]}>
                +{item.upgradeLevel}
              </Text>
            )}
          </View>
        </View>
        <Text style={[styles.cardTerm, { color: colors.muted }]} numberOfLines={1}>
          {item.term}
        </Text>
        <View style={styles.cardStats}>
          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: colors.muted }]}>攻撃力</Text>
            <Text style={[styles.statValue, { color: colors.error }]}>⚔️ {item.attackPower}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: colors.muted }]}>回復力</Text>
            <Text style={[styles.statValue, { color: colors.success }]}>💚 {item.healPower}</Text>
          </View>
          {upgradeCost !== null && (
            <Pressable
              style={[
                styles.upgradeButton,
                { backgroundColor: canUpgrade ? colors.warning : colors.border }
              ]}
              onPress={() => handleUpgrade(item)}
            >
              <Text style={styles.upgradeButtonText}>
                強化 {upgradeCost}G
              </Text>
            </Pressable>
          )}
        </View>
        <View style={styles.cardUsage}>
          <Text style={[styles.usageText, { color: colors.muted }]}>
            使用回数: {item.usageCount} | 成功: {item.successCount}
          </Text>
          {item.usageCount > 0 && (
            <Text style={[styles.successRate, { color: colors.primary }]}>
              ({Math.round((item.successCount / item.usageCount) * 100)}%)
            </Text>
          )}
        </View>
      </Pressable>
    );
  };

  return (
    <ScreenContainer>
      <View style={styles.container}>
        {/* ヘッダー */}
        <View style={[styles.header, { backgroundColor: colors.surface }]}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Text style={[styles.backText, { color: colors.primary }]}>← 戻る</Text>
          </Pressable>
          <Text style={[styles.title, { color: colors.foreground }]}>カード一覧</Text>
          <Text style={[styles.goldText, { color: colors.warning }]}>💰{player.gold}G</Text>
        </View>

        {/* フィルター */}
        <View style={styles.filterContainer}>
          {rarityFilters.map((r) => (
            <Pressable
              key={r}
              style={[
                styles.filterButton,
                { 
                  backgroundColor: filter === r ? colors.primary : colors.surface,
                  borderColor: r === 'all' ? colors.border : RARITY_COLORS[r as CardRarity] || colors.border
                }
              ]}
              onPress={() => setFilter(r)}
            >
              <Text style={[
                styles.filterText, 
                { color: filter === r ? '#fff' : (r === 'all' ? colors.foreground : RARITY_COLORS[r as CardRarity]) }
              ]}>
                {r === 'all' ? '全て' : RARITY_NAMES[r as CardRarity]}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={[styles.countText, { color: colors.muted }]}>
          {filteredCards.length}枚 / 全{cards.length}枚
        </Text>

        {/* カードリスト */}
        <FlatList
          data={filteredCards}
          renderItem={renderCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <Text style={[styles.emptyText, { color: colors.muted }]}>
              カードがありません
            </Text>
          }
        />
      </View>

      {/* カード詳細モーダル */}
      <Modal
        visible={selectedCard !== null}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setSelectedCard(null)}
      >
        <View style={styles.modalOverlay}>
          {selectedCard && (
            <View style={[styles.modalContent, { backgroundColor: colors.background, borderColor: RARITY_COLORS[selectedCard.rarity] }]}>
              <Text style={[styles.modalTitle, { color: RARITY_COLORS[selectedCard.rarity] }]}>
                {RARITY_NAMES[selectedCard.rarity]}
                {selectedCard.upgradeLevel > 0 && ` +${selectedCard.upgradeLevel}`}
              </Text>
              <Text style={[styles.modalCardName, { color: colors.foreground }]}>
                {selectedCard.termJa}
              </Text>
              <Text style={[styles.modalCardTerm, { color: colors.muted }]}>
                {selectedCard.term}
              </Text>
              
              <View style={styles.modalStats}>
                <View style={styles.modalStatItem}>
                  <Text style={[styles.modalStatLabel, { color: colors.muted }]}>攻撃力</Text>
                  <Text style={[styles.modalStatValue, { color: colors.error }]}>⚔️ {selectedCard.attackPower}</Text>
                </View>
                <View style={styles.modalStatItem}>
                  <Text style={[styles.modalStatLabel, { color: colors.muted }]}>回復力</Text>
                  <Text style={[styles.modalStatValue, { color: colors.success }]}>💚 {selectedCard.healPower}</Text>
                </View>
              </View>

              {/* 強化履歴 */}
              <View style={[styles.upgradeHistory, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.upgradeHistoryTitle, { color: colors.foreground }]}>
                  📊 強化履歴
                </Text>
                <View style={styles.upgradeHistoryRow}>
                  <Text style={[styles.upgradeHistoryLabel, { color: colors.muted }]}>強化レベル</Text>
                  <View style={styles.upgradeHistoryValue}>
                    {[1, 2, 3, 4, 5].map((level) => (
                      <View
                        key={level}
                        style={[
                          styles.upgradeLevelDot,
                          { backgroundColor: level <= selectedCard.upgradeLevel ? colors.warning : colors.border }
                        ]}
                      />
                    ))}
                    <Text style={[styles.upgradeLevelText, { color: colors.foreground }]}>
                      {selectedCard.upgradeLevel}/5
                    </Text>
                  </View>
                </View>
                <View style={styles.upgradeHistoryRow}>
                  <Text style={[styles.upgradeHistoryLabel, { color: colors.muted }]}>基本攻撃力</Text>
                  <Text style={[styles.upgradeHistoryValue, { color: colors.foreground }]}>
                    {Math.round(selectedCard.attackPower / (1 + selectedCard.upgradeLevel * 0.1))} → {selectedCard.attackPower}
                    {selectedCard.upgradeLevel > 0 && (
                      <Text style={{ color: colors.success }}> (+{Math.round(selectedCard.attackPower - selectedCard.attackPower / (1 + selectedCard.upgradeLevel * 0.1))})</Text>
                    )}
                  </Text>
                </View>
                <View style={styles.upgradeHistoryRow}>
                  <Text style={[styles.upgradeHistoryLabel, { color: colors.muted }]}>基本回復力</Text>
                  <Text style={[styles.upgradeHistoryValue, { color: colors.foreground }]}>
                    {Math.round(selectedCard.healPower / (1 + selectedCard.upgradeLevel * 0.1))} → {selectedCard.healPower}
                    {selectedCard.upgradeLevel > 0 && (
                      <Text style={{ color: colors.success }}> (+{Math.round(selectedCard.healPower - selectedCard.healPower / (1 + selectedCard.upgradeLevel * 0.1))})</Text>
                    )}
                  </Text>
                </View>
              </View>

              {/* 使用統計 */}
              <View style={styles.modalInfo}>
                <Text style={[styles.modalInfoText, { color: colors.muted }]}>
                  使用回数: {selectedCard.usageCount}回
                </Text>
                <Text style={[styles.modalInfoText, { color: colors.muted }]}>
                  成功率: {selectedCard.usageCount > 0 ? Math.round((selectedCard.successCount / selectedCard.usageCount) * 100) : 0}%
                </Text>
              </View>

              {(() => {
                const cost = gameStore.getUpgradeCost(selectedCard.id);
                if (cost === null) {
                  return (
                    <View style={[styles.maxLevelBadge, { backgroundColor: colors.warning }]}>
                      <Text style={styles.maxLevelText}>最大強化済み</Text>
                    </View>
                  );
                }
                return (
                  <Pressable
                    style={[
                      styles.modalUpgradeButton,
                      { backgroundColor: player.gold >= cost ? colors.warning : colors.border }
                    ]}
                    onPress={() => handleUpgrade(selectedCard)}
                    disabled={player.gold < cost}
                  >
                    <Text style={styles.modalUpgradeText}>
                      強化する ({cost}G)
                    </Text>
                  </Pressable>
                );
              })()}

              <Pressable
                style={[styles.closeButton, { borderColor: colors.muted }]}
                onPress={() => setSelectedCard(null)}
              >
                <Text style={[styles.closeButtonText, { color: colors.muted }]}>閉じる</Text>
              </Pressable>
            </View>
          )}
        </View>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  backButton: {
    padding: 4,
  },
  backText: {
    fontSize: 16,
  },
  title: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
  },
  goldText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  filterContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  filterText: {
    fontSize: 12,
    fontWeight: '600',
  },
  countText: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 8,
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  card: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardName: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  rarityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cardRarity: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  upgradeLevel: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  cardTerm: {
    fontSize: 14,
    marginBottom: 12,
  },
  cardStats: {
    flexDirection: 'row',
    gap: 24,
    marginBottom: 8,
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 10,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  upgradeButton: {
    marginLeft: 'auto',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  upgradeButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  cardUsage: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  usageText: {
    fontSize: 12,
  },
  successRate: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 40,
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
    maxWidth: 350,
    borderRadius: 16,
    borderWidth: 3,
    padding: 24,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  modalCardName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'center',
  },
  modalCardTerm: {
    fontSize: 16,
    marginBottom: 20,
  },
  modalStats: {
    flexDirection: 'row',
    gap: 40,
    marginBottom: 20,
  },
  modalStatItem: {
    alignItems: 'center',
  },
  modalStatLabel: {
    fontSize: 12,
  },
  modalStatValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  upgradeHistory: {
    width: '100%',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 16,
  },
  upgradeHistoryTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  upgradeHistoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  upgradeHistoryLabel: {
    fontSize: 12,
  },
  upgradeHistoryValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  upgradeLevelDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  upgradeLevelText: {
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  modalInfo: {
    width: '100%',
    marginBottom: 20,
  },
  modalInfoText: {
    fontSize: 14,
    marginBottom: 4,
  },
  maxLevelBadge: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 16,
  },
  maxLevelText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  modalUpgradeButton: {
    width: '100%',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 12,
  },
  modalUpgradeText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  closeButton: {
    width: '100%',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 14,
  },
});
