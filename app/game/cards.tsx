import { useEffect, useState } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { gameStore } from '@/lib/game-store';
import { WordCard, CardRarity } from '@/lib/game-types';
import { RARITY_COLORS, RARITY_NAMES } from '@/lib/game-types';

export default function CardsScreen() {
  const router = useRouter();
  const colors = useColors();
  const [cards, setCards] = useState<WordCard[]>([]);
  const [filter, setFilter] = useState<CardRarity | 'all'>('all');

  useEffect(() => {
    const loadCards = async () => {
      await gameStore.loadState();
      setCards(gameStore.getPlayer().cards);
    };
    loadCards();

    const unsubscribe = gameStore.subscribe(() => {
      setCards(gameStore.getPlayer().cards);
    });
    return unsubscribe;
  }, []);

  const filteredCards = filter === 'all' 
    ? cards 
    : cards.filter(c => c.rarity === filter);

  const rarityFilters: (CardRarity | 'all')[] = ['all', 'legendary', 'epic', 'rare', 'uncommon', 'common'];

  const renderCard = ({ item }: { item: WordCard }) => (
    <View style={[styles.card, { borderColor: RARITY_COLORS[item.rarity], backgroundColor: colors.surface }]}>
      <View style={styles.cardHeader}>
        <Text style={[styles.cardName, { color: colors.foreground }]} numberOfLines={1}>
          {item.termJa}
        </Text>
        <Text style={[styles.cardRarity, { color: RARITY_COLORS[item.rarity] }]}>
          {RARITY_NAMES[item.rarity]}
        </Text>
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
    </View>
  );

  return (
    <ScreenContainer>
      <View style={styles.container}>
        {/* ヘッダー */}
        <View style={[styles.header, { backgroundColor: colors.surface }]}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Text style={[styles.backText, { color: colors.primary }]}>← 戻る</Text>
          </Pressable>
          <Text style={[styles.title, { color: colors.foreground }]}>カード一覧</Text>
          <Text style={[styles.countText, { color: colors.muted }]}>{cards.length}枚</Text>
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
  countText: {
    fontSize: 14,
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
  cardRarity: {
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
});
