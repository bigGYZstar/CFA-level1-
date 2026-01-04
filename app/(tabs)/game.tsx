import { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { gameStore, STAGES } from '@/lib/game-store';
import { PlayerState, Stage } from '@/lib/game-types';
import { RARITY_COLORS, RARITY_NAMES } from '@/lib/game-types';

export default function GameTabScreen() {
  const router = useRouter();
  const colors = useColors();
  const [player, setPlayer] = useState<PlayerState>(gameStore.getPlayer());
  const [unlockedStages, setUnlockedStages] = useState<number[]>([1]);

  useEffect(() => {
    const init = async () => {
      await gameStore.loadState();
      await gameStore.grantStarterCards();
      setPlayer(gameStore.getPlayer());
      setUnlockedStages(gameStore.getState().unlockedStages);
    };
    init();

    const unsubscribe = gameStore.subscribe(() => {
      setPlayer(gameStore.getPlayer());
      setUnlockedStages(gameStore.getState().unlockedStages);
    });
    return unsubscribe;
  }, []);

  const handleStageSelect = useCallback((stage: Stage) => {
    if (!unlockedStages.includes(stage.id)) return;
    gameStore.startBattle(stage.id);
    router.push('/game/battle');
  }, [unlockedStages, router]);

  const expPercentage = (player.exp / player.expToNextLevel) * 100;

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

        {/* カード枚数 */}
        <Pressable 
          style={({ pressed }) => [
            styles.cardsButton, 
            { backgroundColor: colors.surface, borderColor: colors.border },
            pressed && { opacity: 0.7 }
          ]}
          onPress={() => router.push('/game/cards')}
        >
          <Text style={[styles.cardsIcon]}>🃏</Text>
          <View style={styles.cardsInfo}>
            <Text style={[styles.cardsLabel, { color: colors.foreground }]}>所持カード</Text>
            <Text style={[styles.cardsCount, { color: colors.primary }]}>{player.cards.length}枚</Text>
          </View>
          <Text style={[styles.chevron, { color: colors.muted }]}>›</Text>
        </Pressable>

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
                  <Text key={enemy.id} style={styles.enemySprite}>{enemy.sprite}</Text>
                ))}
              </View>
            </Pressable>
          );
        })}

        {/* デッキ編集ボタン */}
        <Pressable
          style={({ pressed }) => [
            styles.deckButton,
            { backgroundColor: colors.primary },
            pressed && { opacity: 0.8 }
          ]}
          onPress={() => router.push('/game/deck')}
        >
          <Text style={styles.deckButtonText}>デッキ編集</Text>
        </Pressable>
      </ScrollView>
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
    marginBottom: 12,
  },
  levelText: {
    fontSize: 24,
    fontWeight: 'bold',
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
  cardsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 24,
  },
  cardsIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  cardsInfo: {
    flex: 1,
  },
  cardsLabel: {
    fontSize: 14,
  },
  cardsCount: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  chevron: {
    fontSize: 24,
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
    gap: 8,
  },
  enemySprite: {
    fontSize: 24,
  },
  deckButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  deckButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
