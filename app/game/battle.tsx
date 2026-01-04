import { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { gameStore } from '@/lib/game-store';
import { BattleState, WordCard, QuizQuestion } from '@/lib/game-types';
import { RARITY_COLORS, RARITY_NAMES } from '@/lib/game-types';

export default function BattleScreen() {
  const router = useRouter();
  const colors = useColors();
  const [battle, setBattle] = useState<BattleState>(gameStore.getBattle());
  const [selectedAction, setSelectedAction] = useState<'attack' | 'heal' | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [quizResult, setQuizResult] = useState<{ correct: boolean; message: string } | null>(null);

  useEffect(() => {
    const unsubscribe = gameStore.subscribe(() => {
      setBattle(gameStore.getBattle());
    });
    return unsubscribe;
  }, []);

  const deckCards = gameStore.getDeckCards();

  const handleCardSelect = useCallback((card: WordCard, action: 'attack' | 'heal') => {
    setSelectedAction(action);
    gameStore.selectCard(card, action);
  }, []);

  const handleAnswerSelect = useCallback(async (answer: string) => {
    if (!selectedAction) return;
    setSelectedAnswer(answer);
    
    const result = await gameStore.answerQuiz(answer, selectedAction);
    setQuizResult({
      correct: result.correct,
      message: result.correct 
        ? (selectedAction === 'attack' ? `${result.damage}ダメージ！` : `HP+${result.heal}回復！`)
        : '不正解！反動ダメージ！'
    });
  }, [selectedAction]);

  const handleProceed = useCallback(() => {
    setSelectedAnswer(null);
    setQuizResult(null);
    setSelectedAction(null);
    
    if (battle.phase === 'battle_end') {
      gameStore.resetBattle();
      router.back();
    } else {
      gameStore.proceedToNextTurn();
    }
  }, [battle.phase, router]);

  const handleFlee = useCallback(() => {
    Alert.alert('逃げる', '戦闘から逃げますか？', [
      { text: 'キャンセル', style: 'cancel' },
      { 
        text: '逃げる', 
        style: 'destructive',
        onPress: () => {
          gameStore.resetBattle();
          router.back();
        }
      },
    ]);
  }, [router]);

  if (!battle.inBattle && battle.phase !== 'battle_end') {
    return (
      <ScreenContainer>
        <View style={styles.centerContainer}>
          <Text style={[styles.message, { color: colors.foreground }]}>バトルがありません</Text>
          <Pressable
            style={[styles.button, { backgroundColor: colors.primary }]}
            onPress={() => router.back()}
          >
            <Text style={styles.buttonText}>戻る</Text>
          </Pressable>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* 敵情報 */}
        {battle.enemy && (
          <View style={[styles.enemyCard, { backgroundColor: colors.surface, borderColor: colors.error }]}>
            <Text style={styles.enemySprite}>{battle.enemy.sprite}</Text>
            <Text style={[styles.enemyName, { color: colors.foreground }]}>{battle.enemy.nameJa}</Text>
            <View style={styles.hpContainer}>
              <View style={[styles.hpBarBg, { backgroundColor: colors.border }]}>
                <View 
                  style={[
                    styles.hpBar, 
                    { 
                      backgroundColor: colors.error,
                      width: `${(battle.enemyHp / battle.enemy.maxHp) * 100}%` 
                    }
                  ]} 
                />
              </View>
              <Text style={[styles.hpText, { color: colors.foreground }]}>
                {battle.enemyHp}/{battle.enemy.maxHp}
              </Text>
            </View>
          </View>
        )}

        {/* プレイヤーHP */}
        <View style={[styles.playerHp, { backgroundColor: colors.surface, borderColor: colors.primary }]}>
          <Text style={[styles.playerLabel, { color: colors.foreground }]}>あなた</Text>
          <View style={styles.hpContainer}>
            <View style={[styles.hpBarBg, { backgroundColor: colors.border }]}>
              <View 
                style={[
                  styles.hpBar, 
                  { 
                    backgroundColor: colors.success,
                    width: `${(battle.playerHp / gameStore.getPlayer().maxHp) * 100}%` 
                  }
                ]} 
              />
            </View>
            <Text style={[styles.hpText, { color: colors.foreground }]}>
              {battle.playerHp}/{gameStore.getPlayer().maxHp}
            </Text>
          </View>
        </View>

        {/* バトルログ */}
        {battle.battleLog.length > 0 && (
          <View style={[styles.logContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
            {battle.battleLog.slice(-3).map((log, index) => (
              <Text 
                key={index} 
                style={[
                  styles.logText, 
                  { color: log.actor === 'player' ? colors.primary : colors.error }
                ]}
              >
                {log.message}
              </Text>
            ))}
          </View>
        )}

        {/* クイズフェーズ */}
        {battle.phase === 'quiz' && battle.quizQuestion && (
          <View style={[styles.quizCard, { backgroundColor: colors.surface, borderColor: colors.warning }]}>
            <Text style={[styles.quizTitle, { color: colors.warning }]}>クイズ！</Text>
            <Text style={[styles.quizQuestion, { color: colors.foreground }]}>
              {battle.quizQuestion.question}
            </Text>
            <View style={styles.optionsContainer}>
              {battle.quizQuestion.options.map((option, index) => (
                <Pressable
                  key={index}
                  style={({ pressed }) => [
                    styles.optionButton,
                    { 
                      backgroundColor: selectedAnswer === option 
                        ? (quizResult?.correct ? colors.success : colors.error)
                        : colors.background,
                      borderColor: colors.border,
                    },
                    pressed && { opacity: 0.7 }
                  ]}
                  onPress={() => handleAnswerSelect(option)}
                  disabled={selectedAnswer !== null}
                >
                  <Text style={[
                    styles.optionText, 
                    { color: selectedAnswer === option ? '#fff' : colors.foreground }
                  ]}>
                    {option}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* 結果表示 */}
        {battle.phase === 'result' && quizResult && (
          <View style={[styles.resultCard, { backgroundColor: colors.surface }]}>
            <Text style={[
              styles.resultText, 
              { color: quizResult.correct ? colors.success : colors.error }
            ]}>
              {quizResult.correct ? '✓ 正解！' : '✗ 不正解...'}
            </Text>
            <Text style={[styles.resultMessage, { color: colors.foreground }]}>
              {quizResult.message}
            </Text>
            <Pressable
              style={[styles.proceedButton, { backgroundColor: colors.primary }]}
              onPress={handleProceed}
            >
              <Text style={styles.proceedButtonText}>続ける</Text>
            </Pressable>
          </View>
        )}

        {/* バトル終了 */}
        {battle.phase === 'battle_end' && (
          <View style={[styles.endCard, { backgroundColor: colors.surface }]}>
            <Text style={[
              styles.endTitle, 
              { color: battle.earnedExp > 0 ? colors.success : colors.error }
            ]}>
              {battle.earnedExp > 0 ? '🎉 勝利！' : '💀 敗北...'}
            </Text>
            
            {battle.earnedExp > 0 && (
              <>
                <Text style={[styles.rewardText, { color: colors.foreground }]}>
                  獲得EXP: {battle.earnedExp}
                </Text>
                {battle.earnedCards.length > 0 && (
                  <View style={styles.earnedCardsContainer}>
                    <Text style={[styles.earnedCardsTitle, { color: colors.warning }]}>
                      🃏 新しいカードを獲得！
                    </Text>
                    {battle.earnedCards.map((card) => (
                      <View 
                        key={card.id} 
                        style={[styles.earnedCard, { borderColor: RARITY_COLORS[card.rarity] }]}
                      >
                        <Text style={[styles.earnedCardName, { color: colors.foreground }]}>
                          {card.termJa}
                        </Text>
                        <Text style={[styles.earnedCardRarity, { color: RARITY_COLORS[card.rarity] }]}>
                          {RARITY_NAMES[card.rarity]}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </>
            )}
            
            <Pressable
              style={[styles.proceedButton, { backgroundColor: colors.primary }]}
              onPress={handleProceed}
            >
              <Text style={styles.proceedButtonText}>ホームに戻る</Text>
            </Pressable>
          </View>
        )}

        {/* アクション選択 */}
        {battle.phase === 'select_action' && (
          <>
            <Text style={[styles.actionTitle, { color: colors.foreground }]}>
              カードを選んでアクション！
            </Text>
            
            {deckCards.length === 0 ? (
              <Text style={[styles.noCardsText, { color: colors.muted }]}>
                デッキにカードがありません
              </Text>
            ) : (
              <View style={styles.cardsGrid}>
                {deckCards.map((card) => (
                  <View key={card.id} style={[styles.cardContainer, { borderColor: RARITY_COLORS[card.rarity] }]}>
                    <Text style={[styles.cardName, { color: colors.foreground }]} numberOfLines={1}>
                      {card.termJa}
                    </Text>
                    <Text style={[styles.cardTerm, { color: colors.muted }]} numberOfLines={1}>
                      {card.term}
                    </Text>
                    <Text style={[styles.cardRarity, { color: RARITY_COLORS[card.rarity] }]}>
                      {RARITY_NAMES[card.rarity]}
                    </Text>
                    <View style={styles.cardStats}>
                      <Text style={[styles.cardStat, { color: colors.error }]}>⚔️{card.attackPower}</Text>
                      <Text style={[styles.cardStat, { color: colors.success }]}>💚{card.healPower}</Text>
                    </View>
                    <View style={styles.cardActions}>
                      <Pressable
                        style={[styles.actionButton, { backgroundColor: colors.error }]}
                        onPress={() => handleCardSelect(card, 'attack')}
                      >
                        <Text style={styles.actionButtonText}>攻撃</Text>
                      </Pressable>
                      <Pressable
                        style={[styles.actionButton, { backgroundColor: colors.success }]}
                        onPress={() => handleCardSelect(card, 'heal')}
                      >
                        <Text style={styles.actionButtonText}>回復</Text>
                      </Pressable>
                    </View>
                  </View>
                ))}
              </View>
            )}

            <Pressable
              style={[styles.fleeButton, { borderColor: colors.muted }]}
              onPress={handleFlee}
            >
              <Text style={[styles.fleeButtonText, { color: colors.muted }]}>逃げる</Text>
            </Pressable>
          </>
        )}
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  message: {
    fontSize: 18,
    marginBottom: 20,
  },
  button: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  enemyCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
    marginBottom: 16,
  },
  enemySprite: {
    fontSize: 64,
    marginBottom: 8,
  },
  enemyName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  hpContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  hpBarBg: {
    flex: 1,
    height: 16,
    borderRadius: 8,
    overflow: 'hidden',
  },
  hpBar: {
    height: '100%',
    borderRadius: 8,
  },
  hpText: {
    width: 80,
    textAlign: 'right',
    fontSize: 14,
    fontWeight: '600',
  },
  playerHp: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 2,
    marginBottom: 16,
  },
  playerLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  logContainer: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
  },
  logText: {
    fontSize: 12,
    marginBottom: 4,
  },
  quizCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 2,
    marginBottom: 16,
  },
  quizTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  quizQuestion: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  optionsContainer: {
    gap: 8,
  },
  optionButton: {
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
  },
  optionText: {
    fontSize: 14,
    textAlign: 'center',
  },
  resultCard: {
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  resultText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  resultMessage: {
    fontSize: 16,
    marginBottom: 16,
  },
  proceedButton: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  proceedButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  endCard: {
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  endTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  rewardText: {
    fontSize: 18,
    marginBottom: 16,
  },
  earnedCardsContainer: {
    width: '100%',
    marginBottom: 16,
  },
  earnedCardsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  earnedCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    marginBottom: 8,
  },
  earnedCardName: {
    fontSize: 14,
    fontWeight: '600',
  },
  earnedCardRarity: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  actionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  noCardsText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  cardsGrid: {
    gap: 12,
  },
  cardContainer: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 2,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  cardName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  cardTerm: {
    fontSize: 12,
    marginBottom: 4,
  },
  cardRarity: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  cardStats: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 8,
  },
  cardStat: {
    fontSize: 14,
    fontWeight: '600',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  fleeButton: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    marginTop: 16,
  },
  fleeButtonText: {
    fontSize: 14,
  },
});
