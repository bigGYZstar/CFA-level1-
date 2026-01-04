import { useEffect, useState } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { gameStore } from '@/lib/game-store';
import { WordCard } from '@/lib/game-types';
import { RARITY_COLORS, RARITY_NAMES } from '@/lib/game-types';

const MAX_DECK_SIZE = 5;

export default function DeckScreen() {
  const router = useRouter();
  const colors = useColors();
  const [allCards, setAllCards] = useState<WordCard[]>([]);
  const [deckCardIds, setDeckCardIds] = useState<string[]>([]);

  useEffect(() => {
    const loadData = async () => {
      await gameStore.loadState();
      setAllCards(gameStore.getPlayer().cards);
      setDeckCardIds(gameStore.getPlayer().currentDeck);
    };
    loadData();

    const unsubscribe = gameStore.subscribe(() => {
      setAllCards(gameStore.getPlayer().cards);
      setDeckCardIds(gameStore.getPlayer().currentDeck);
    });
    return unsubscribe;
  }, []);

  const deckCards = deckCardIds
    .map(id => allCards.find(c => c.id === id))
    .filter((c): c is WordCard => c !== undefined);

  const availableCards = allCards.filter(c => !deckCardIds.includes(c.id));

  const handleAddToDeck = (card: WordCard) => {
    if (deckCardIds.length >= MAX_DECK_SIZE) {
      Alert.alert('デッキ上限', `デッキには最大${MAX_DECK_SIZE}枚までです`);
      return;
    }
    gameStore.addToDeck(card.id);
  };

  const handleRemoveFromDeck = (cardId: string) => {
    gameStore.removeFromDeck(cardId);
  };

  const renderDeckCard = ({ item }: { item: WordCard }) => (
    <View style={[styles.deckCard, { borderColor: RARITY_COLORS[item.rarity], backgroundColor: colors.surface }]}>
      <View style={styles.cardInfo}>
        <Text style={[styles.cardName, { color: colors.foreground }]} numberOfLines={1}>
          {item.termJa}
        </Text>
        <View style={styles.cardStats}>
          <Text style={[styles.stat, { color: colors.error }]}>⚔️{item.attackPower}</Text>
          <Text style={[styles.stat, { color: colors.success }]}>💚{item.healPower}</Text>
        </View>
      </View>
      <Pressable
        style={[styles.removeButton, { backgroundColor: colors.error }]}
        onPress={() => handleRemoveFromDeck(item.id)}
      >
        <Text style={styles.buttonText}>外す</Text>
      </Pressable>
    </View>
  );

  const renderAvailableCard = ({ item }: { item: WordCard }) => (
    <View style={[styles.availableCard, { borderColor: RARITY_COLORS[item.rarity], backgroundColor: colors.surface }]}>
      <View style={styles.cardInfo}>
        <Text style={[styles.cardName, { color: colors.foreground }]} numberOfLines={1}>
          {item.termJa}
        </Text>
        <Text style={[styles.cardRarity, { color: RARITY_COLORS[item.rarity] }]}>
          {RARITY_NAMES[item.rarity]}
        </Text>
        <View style={styles.cardStats}>
          <Text style={[styles.stat, { color: colors.error }]}>⚔️{item.attackPower}</Text>
          <Text style={[styles.stat, { color: colors.success }]}>💚{item.healPower}</Text>
        </View>
      </View>
      <Pressable
        style={[styles.addButton, { backgroundColor: colors.primary }]}
        onPress={() => handleAddToDeck(item)}
      >
        <Text style={styles.buttonText}>追加</Text>
      </Pressable>
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
          <Text style={[styles.title, { color: colors.foreground }]}>デッキ編集</Text>
        </View>

        {/* 現在のデッキ */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            現在のデッキ ({deckCards.length}/{MAX_DECK_SIZE})
          </Text>
          {deckCards.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.muted }]}>
              デッキにカードがありません
            </Text>
          ) : (
            <FlatList
              data={deckCards}
              renderItem={renderDeckCard}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.deckList}
            />
          )}
        </View>

        {/* 所持カード */}
        <View style={[styles.section, { flex: 1 }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            所持カード ({availableCards.length}枚)
          </Text>
          <FlatList
            data={availableCards}
            renderItem={renderAvailableCard}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.availableList}
            ListEmptyComponent={
              <Text style={[styles.emptyText, { color: colors.muted }]}>
                追加できるカードがありません
              </Text>
            }
          />
        </View>
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
  section: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  deckList: {
    gap: 12,
  },
  deckCard: {
    width: 140,
    padding: 12,
    borderRadius: 12,
    borderWidth: 2,
  },
  availableList: {
    paddingBottom: 100,
  },
  availableCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 2,
    marginBottom: 8,
  },
  cardInfo: {
    flex: 1,
  },
  cardName: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  cardRarity: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  cardStats: {
    flexDirection: 'row',
    gap: 12,
  },
  stat: {
    fontSize: 12,
    fontWeight: '600',
  },
  addButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  removeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  buttonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 20,
  },
});
