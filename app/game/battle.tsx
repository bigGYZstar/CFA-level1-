import { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Alert, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { gameStore } from '@/lib/game-store';
import { BattleState, WordCard, QuizQuestion, CFAQuestion } from '@/lib/game-types';
import { RARITY_COLORS, RARITY_NAMES } from '@/lib/game-types';

export default function BattleScreen() {
  const router = useRouter();
  const colors = useColors();
  const [battle, setBattle] = useState<BattleState>(gameStore.getBattle());
  const [selectedAction, setSelectedAction] = useState<'attack' | 'heal' | 'burst' | null>(null);
  const [selectedCards, setSelectedCards] = useState<WordCard[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [quizResult, setQuizResult] = useState<{ correct: boolean; message: string } | null>(null);
  const [showFullQuestion, setShowFullQuestion] = useState(false);
  const [cfaAnswer, setCfaAnswer] = useState<string | null>(null);
  const [cfaResult, setCfaResult] = useState<boolean | null>(null);

  useEffect(() => {
    const unsubscribe = gameStore.subscribe(() => {
      setBattle(gameStore.getBattle());
    });
    return unsubscribe;
  }, []);

  // 手札を使用（デッキではなく手札から選択）
  const handCards = battle.currentHand.filter(
    card => !battle.usedCards.includes(card.id)
  );

  const handleCardSelect = useCallback((card: WordCard) => {
    // カードの選択/解除
    setSelectedCards(prev => {
      const isSelected = prev.some(c => c.id === card.id);
      if (isSelected) {
        return prev.filter(c => c.id !== card.id);
      } else if (prev.length < 2) {
        return [...prev, card];
      }
      return prev;
    });
  }, []);

  const handleAction = useCallback((action: 'attack' | 'heal' | 'burst') => {
    if (selectedCards.length === 0) return;
    
    if (action === 'burst' && selectedCards.length !== 2) {
      Alert.alert('バースト', 'バーストには2枚のカードが必要です');
      return;
    }
    
    if ((action === 'attack' || action === 'heal') && selectedCards.length !== 1) {
      Alert.alert('選択エラー', '攻撃・回復には1枚のカードを選択してください');
      return;
    }

    setSelectedAction(action);
    
    if (action === 'burst') {
      gameStore.selectBurstCards(selectedCards[0], selectedCards[1]);
    } else {
      gameStore.selectCard(selectedCards[0], action);
    }
  }, [selectedCards]);

  const handleAnswerSelect = useCallback(async (answer: string) => {
    if (!selectedAction) return;
    setSelectedAnswer(answer);
    
    const result = await gameStore.answerQuiz(answer, selectedAction === 'burst' ? 'attack' : selectedAction);
    
    let message = '';
    if (result.correct) {
      if (selectedAction === 'burst') {
        message = `バースト成功！${result.damage}ダメージ！`;
      } else if (selectedAction === 'attack') {
        message = `${result.damage}ダメージ！`;
      } else {
        message = `HP+${result.heal}回復！`;
      }
    } else {
      message = selectedAction === 'burst' 
        ? 'バースト失敗！大反動ダメージ！' 
        : '不正解！反動ダメージ！';
    }
    
    setQuizResult({ correct: result.correct, message });
  }, [selectedAction]);

  // CFA実問に回答
  const handleCFAAnswer = useCallback((answer: string) => {
    setCfaAnswer(answer);
    const isCorrect = gameStore.answerCFAQuiz(answer);
    setCfaResult(isCorrect);
    
    // 3秒後に結果をクリア
    setTimeout(() => {
      setCfaAnswer(null);
      setCfaResult(null);
    }, 2000);
  }, []);

  const handleProceed = useCallback(() => {
    setSelectedAnswer(null);
    setQuizResult(null);
    setSelectedAction(null);
    setSelectedCards([]);
    setShowFullQuestion(false);
    
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

  // 問題文を省略表示
  const truncateQuestion = (question: string, maxLength: number = 60): { text: string; isTruncated: boolean } => {
    if (question.length <= maxLength) {
      return { text: question, isTruncated: false };
    }
    return { text: question.slice(0, maxLength) + '...', isTruncated: true };
  };

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
            {/* 報酬表示 */}
            <View style={styles.rewardPreview}>
              <Text style={[styles.rewardPreviewText, { color: colors.muted }]}>
                💰{battle.enemy.goldReward}G / ⭐{battle.enemy.expReward}EXP
              </Text>
            </View>
          </View>
        )}

        {/* プレイヤーHP */}
        <View style={[styles.playerHp, { backgroundColor: colors.surface, borderColor: colors.primary }]}>
          <View style={styles.playerHeader}>
            <Text style={[styles.playerLabel, { color: colors.foreground }]}>あなた</Text>
            <Text style={[styles.goldText, { color: colors.warning }]}>
              💰 {gameStore.getPlayer().gold}G
            </Text>
          </View>
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
          {/* EXP倍率表示 */}
          {battle.expMultiplier > 1 && (
            <Text style={[styles.multiplierText, { color: colors.warning }]}>
              🔥 EXP x{battle.expMultiplier}
            </Text>
          )}
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

        {/* CFA実問クイズ（アイテム使用時） */}
        {battle.phase === 'item_quiz' && battle.cfaQuestion && (
          <View style={[styles.quizCard, { backgroundColor: colors.surface, borderColor: colors.warning }]}>
            <Text style={[styles.quizTitle, { color: colors.warning }]}>
              ⚡ Schwの力 - CFA実問
            </Text>
            <Text style={[styles.cfaHint, { color: colors.muted }]}>
              正解でEXP10倍！
            </Text>
            
            {/* 問題文 */}
            {(() => {
              const { text, isTruncated } = truncateQuestion(battle.cfaQuestion.question, 100);
              return (
                <>
                  <Text style={[styles.quizQuestion, { color: colors.foreground }]}>
                    {showFullQuestion ? battle.cfaQuestion.question : text}
                  </Text>
                  {isTruncated && (
                    <Pressable onPress={() => setShowFullQuestion(!showFullQuestion)}>
                      <Text style={[styles.seeAllText, { color: colors.primary }]}>
                        {showFullQuestion ? '(collapse)' : '(see all)'}
                      </Text>
                    </Pressable>
                  )}
                </>
              );
            })()}
            
            <View style={styles.optionsContainer}>
              {battle.cfaQuestion.options.map((option, index) => (
                <Pressable
                  key={index}
                  style={({ pressed }) => [
                    styles.optionButton,
                    { 
                      backgroundColor: cfaAnswer === option 
                        ? (cfaResult ? colors.success : colors.error)
                        : colors.background,
                      borderColor: colors.border,
                    },
                    pressed && { opacity: 0.7 }
                  ]}
                  onPress={() => handleCFAAnswer(option)}
                  disabled={cfaAnswer !== null}
                >
                  <Text style={[
                    styles.optionText, 
                    { color: cfaAnswer === option ? '#fff' : colors.foreground }
                  ]}>
                    {option}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* クイズフェーズ */}
        {battle.phase === 'quiz' && battle.quizQuestion && (
          <View style={[styles.quizCard, { backgroundColor: colors.surface, borderColor: colors.warning }]}>
            <Text style={[styles.quizTitle, { color: colors.warning }]}>
              {selectedAction === 'burst' ? '🔥 バーストクイズ！' : 'クイズ！'}
            </Text>
            {selectedAction === 'burst' && (
              <Text style={[styles.burstWarning, { color: colors.error }]}>
                高難易度！成功で2倍ダメージ、失敗で2倍反動！
              </Text>
            )}
            
            {/* 問題文（省略表示対応） */}
            {(() => {
              const { text, isTruncated } = truncateQuestion(battle.quizQuestion.question, 60);
              return (
                <>
                  <Text style={[styles.quizQuestion, { color: colors.foreground }]}>
                    {showFullQuestion ? (battle.quizQuestion.fullQuestion || battle.quizQuestion.question) : text}
                  </Text>
                  {isTruncated && (
                    <Pressable onPress={() => setShowFullQuestion(!showFullQuestion)}>
                      <Text style={[styles.seeAllText, { color: colors.primary }]}>
                        {showFullQuestion ? '(collapse)' : '(see all)'}
                      </Text>
                    </Pressable>
                  )}
                </>
              );
            })()}
            
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
        {battle.phase === 'result' && (
          <View style={[styles.resultCard, { backgroundColor: colors.surface }]}>
            <Text style={[
              styles.resultText, 
              { color: quizResult?.correct ? colors.success : colors.error }
            ]}>
              {quizResult?.correct ? '✓ 正解！' : '✗ 不正解...'}
            </Text>
            <Text style={[styles.resultMessage, { color: colors.foreground }]}>
              {quizResult?.message || '結果を確認してください'}
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
                <View style={styles.rewardsContainer}>
                  <Text style={[styles.rewardText, { color: colors.foreground }]}>
                    獲得EXP: {battle.earnedExp}
                    {battle.expMultiplier > 1 && ` (x${battle.expMultiplier})`}
                  </Text>
                  <Text style={[styles.rewardText, { color: colors.warning }]}>
                    💰 獲得ゴールド: {battle.earnedGold}G
                  </Text>
                </View>
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
              手札からカードを選択！
            </Text>
            <Text style={[styles.handInfo, { color: colors.muted }]}>
              手札: {handCards.length}枚 / 山札: {battle.remainingDeck?.length || 0}枚 / 選択中: {selectedCards.length}枚
            </Text>
            
            {handCards.length === 0 ? (
              <View style={styles.noCardsContainer}>
                <Text style={[styles.noCardsText, { color: colors.muted }]}>
                  手札がありません
                </Text>
                <Text style={[styles.noCardsHint, { color: colors.muted }]}>
                  デッキにカードを追加してください
                </Text>
              </View>
            ) : (
              <>
                <View style={styles.cardsGrid}>
                  {handCards.map((card) => {
                    const isSelected = selectedCards.some(c => c.id === card.id);
                    return (
                      <Pressable
                        key={card.id}
                        style={[
                          styles.cardContainer, 
                          { 
                            borderColor: isSelected ? colors.primary : RARITY_COLORS[card.rarity],
                            backgroundColor: isSelected ? colors.primary + '20' : colors.surface,
                          }
                        ]}
                        onPress={() => handleCardSelect(card)}
                      >
                        {isSelected && (
                          <View style={[styles.selectedBadge, { backgroundColor: colors.primary }]}>
                            <Text style={styles.selectedBadgeText}>✓</Text>
                          </View>
                        )}
                        <Text style={[styles.cardName, { color: colors.foreground }]} numberOfLines={1}>
                          {card.termJa}
                        </Text>
                        <Text style={[styles.cardTerm, { color: colors.muted }]} numberOfLines={1}>
                          {card.term}
                        </Text>
                        <Text style={[styles.cardRarity, { color: RARITY_COLORS[card.rarity] }]}>
                          {RARITY_NAMES[card.rarity]}
                          {card.upgradeLevel > 0 && ` +${card.upgradeLevel}`}
                        </Text>
                        <View style={styles.cardStats}>
                          <Text style={[styles.cardStat, { color: colors.error }]}>⚔️{card.attackPower}</Text>
                          <Text style={[styles.cardStat, { color: colors.success }]}>💚{card.healPower}</Text>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>

                {/* アクションボタン */}
                <View style={styles.actionButtons}>
                  <Pressable
                    style={[
                      styles.mainActionButton, 
                      { 
                        backgroundColor: selectedCards.length === 1 ? colors.error : colors.border,
                        opacity: selectedCards.length === 1 ? 1 : 0.5,
                      }
                    ]}
                    onPress={() => handleAction('attack')}
                    disabled={selectedCards.length !== 1}
                  >
                    <Text style={styles.mainActionButtonText}>⚔️ 攻撃</Text>
                  </Pressable>
                  
                  <Pressable
                    style={[
                      styles.mainActionButton, 
                      { 
                        backgroundColor: selectedCards.length === 1 ? colors.success : colors.border,
                        opacity: selectedCards.length === 1 ? 1 : 0.5,
                      }
                    ]}
                    onPress={() => handleAction('heal')}
                    disabled={selectedCards.length !== 1}
                  >
                    <Text style={styles.mainActionButtonText}>💚 回復</Text>
                  </Pressable>
                  
                  <Pressable
                    style={[
                      styles.burstButton, 
                      { 
                        backgroundColor: selectedCards.length === 2 ? colors.warning : colors.border,
                        opacity: selectedCards.length === 2 ? 1 : 0.5,
                      }
                    ]}
                    onPress={() => handleAction('burst')}
                    disabled={selectedCards.length !== 2}
                  >
                    <Text style={styles.burstButtonText}>🔥 バースト（2枚）</Text>
                    <Text style={[styles.burstHint, { color: selectedCards.length === 2 ? '#fff' : colors.muted }]}>
                      高難易度・高威力
                    </Text>
                  </Pressable>
                </View>
              </>
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
    marginBottom: 8,
  },
  hpContainer: {
    width: '100%',
    alignItems: 'center',
  },
  hpBarBg: {
    width: '100%',
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
  },
  hpBar: {
    height: '100%',
    borderRadius: 6,
  },
  hpText: {
    fontSize: 14,
    marginTop: 4,
  },
  rewardPreview: {
    marginTop: 8,
  },
  rewardPreviewText: {
    fontSize: 12,
  },
  playerHp: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    marginBottom: 16,
  },
  playerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  playerLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  goldText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  multiplierText: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 8,
    textAlign: 'center',
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
    marginBottom: 8,
  },
  burstWarning: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 12,
  },
  cfaHint: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 12,
  },
  quizQuestion: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 24,
  },
  seeAllText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
    textDecorationLine: 'underline',
  },
  optionsContainer: {
    gap: 10,
  },
  optionButton: {
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
  },
  optionText: {
    fontSize: 14,
    textAlign: 'center',
  },
  resultCard: {
    padding: 24,
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
    marginBottom: 20,
  },
  proceedButton: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 10,
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
  rewardsContainer: {
    marginBottom: 16,
    alignItems: 'center',
  },
  rewardText: {
    fontSize: 18,
    marginBottom: 8,
  },
  earnedCardsContainer: {
    width: '100%',
    marginBottom: 16,
  },
  earnedCardsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  earnedCard: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    marginBottom: 8,
  },
  handInfo: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  noCardsContainer: {
    padding: 40,
    alignItems: 'center',
  },
  noCardsText: {
    fontSize: 16,
    marginBottom: 8,
  },
  noCardsHint: {
    fontSize: 12,
  },
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  cardContainer: {
    width: '47%',
    padding: 12,
    borderRadius: 12,
    borderWidth: 2,
    position: 'relative',
  },
  selectedBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedBadgeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  cardName: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  cardTerm: {
    fontSize: 11,
    marginBottom: 4,
  },
  cardRarity: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  cardStats: {
    flexDirection: 'row',
    gap: 8,
  },
  cardStat: {
    fontSize: 12,
    fontWeight: '600',
  },
  actionButtons: {
    gap: 12,
    marginBottom: 16,
  },
  mainActionButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  mainActionButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  burstButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  burstButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  burstHint: {
    fontSize: 12,
    marginTop: 4,
  },
  fleeButton: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  fleeButtonText: {
    fontSize: 14,
  },
});
