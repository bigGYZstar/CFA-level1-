import { useEffect, useState } from 'react';
import { Text, View, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { 
  loadTerms, loadExamples, loadProgress, saveProgress, 
  getReviewDueTerms, calculateNextReview, createInitialProgress, TOPICS 
} from '@/lib/data-store';
import type { Term, Example, LearningProgress } from '@/lib/types';

type ReviewQuality = 0 | 1 | 2 | 3 | 4 | 5;

export default function ReviewScreen() {
  const router = useRouter();
  const [terms, setTerms] = useState<Term[]>([]);
  const [examples, setExamples] = useState<Example[]>([]);
  const [progress, setProgress] = useState<Record<string, LearningProgress>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const [allTerms, allExamples, allProgress] = await Promise.all([
      loadTerms(),
      loadExamples(),
      loadProgress(),
    ]);
    
    const reviewDue = getReviewDueTerms(allTerms, allProgress);
    setTerms(reviewDue);
    setExamples(allExamples);
    setProgress(allProgress);
    
    if (reviewDue.length === 0) {
      setIsComplete(true);
    }
  }

  const currentTerm = terms[currentIndex];
  const currentExample = currentTerm ? examples.find(e => e.term_id === currentTerm.term_id) : null;
  const topic = currentTerm ? TOPICS.find(t => t.code === currentTerm.topic_code) : null;

  const handleAnswer = async (quality: ReviewQuality) => {
    if (!currentTerm) return;
    
    const currentProgress = progress[currentTerm.term_id] || createInitialProgress(currentTerm.term_id);
    const updatedProgress = calculateNextReview(currentProgress, quality);
    
    const newProgress = { ...progress, [currentTerm.term_id]: updatedProgress };
    await saveProgress(newProgress);
    setProgress(newProgress);
    
    // 次のカードへ
    if (currentIndex < terms.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setShowAnswer(false);
    } else {
      setIsComplete(true);
    }
  };

  if (isComplete) {
    return (
      <ScreenContainer className="bg-background">
        <View style={styles.completeContainer}>
          <View style={styles.completeIcon}>
            <IconSymbol name="checkmark.circle.fill" size={64} color="#22C55E" />
          </View>
          <Text style={styles.completeTitle}>復習完了！</Text>
          <Text style={styles.completeSubtitle}>
            {terms.length > 0 
              ? `${terms.length}語の復習が完了しました`
              : '今日の復習はありません'}
          </Text>
          <Pressable
            style={({ pressed }) => [styles.completeButton, pressed && styles.pressed]}
            onPress={() => router.back()}
          >
            <Text style={styles.completeButtonText}>ホームに戻る</Text>
          </Pressable>
        </View>
      </ScreenContainer>
    );
  }

  if (!currentTerm) {
    return (
      <ScreenContainer className="bg-background">
        <View style={styles.loading}>
          <Text style={styles.loadingText}>読み込み中...</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="bg-background">
      {/* ヘッダー */}
      <View style={styles.header}>
        <Pressable
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
          onPress={() => router.back()}
        >
          <IconSymbol name="arrow.left" size={24} color="#1A1A1A" />
        </Pressable>
        <Text style={styles.headerTitle}>復習</Text>
        <Text style={styles.progress}>{currentIndex + 1} / {terms.length}</Text>
      </View>

      {/* プログレスバー */}
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${((currentIndex + 1) / terms.length) * 100}%` }]} />
      </View>

      {/* カード */}
      <View style={styles.cardContainer}>
        <Pressable
          style={styles.card}
          onPress={() => setShowAnswer(!showAnswer)}
        >
          {/* 表面（問題） */}
          <View style={styles.cardFront}>
            {topic && (
              <View style={[styles.topicBadge, { backgroundColor: topic.color }]}>
                <Text style={styles.topicBadgeText}>{topic.code}</Text>
              </View>
            )}
            <Text style={styles.cardQuestion}>{currentTerm.en_canonical}</Text>
            {currentTerm.abbreviations.length > 0 && (
              <Text style={styles.cardAbbrev}>({currentTerm.abbreviations.join(', ')})</Text>
            )}
          </View>

          {/* 裏面（回答） */}
          {showAnswer && (
            <View style={styles.cardBack}>
              <View style={styles.divider} />
              <Text style={styles.cardAnswer}>{currentTerm.jp_headword}</Text>
              <Text style={styles.cardReading}>{currentTerm.jp_reading}</Text>
              <Text style={styles.cardDefinition}>{currentTerm.jp_definition}</Text>
              {currentExample && (
                <View style={styles.exampleBlock}>
                  <Text style={styles.exampleEn}>{currentExample.example_en}</Text>
                  <Text style={styles.exampleJp}>{currentExample.example_jp}</Text>
                </View>
              )}
            </View>
          )}

          {!showAnswer && (
            <Text style={styles.tapHint}>タップして回答を表示</Text>
          )}
        </Pressable>
      </View>

      {/* 回答ボタン */}
      {showAnswer && (
        <View style={styles.answerButtons}>
          <Pressable
            style={({ pressed }) => [styles.answerButton, styles.againButton, pressed && styles.pressed]}
            onPress={() => handleAnswer(0)}
          >
            <Text style={styles.answerButtonText}>Again</Text>
            <Text style={styles.answerButtonHint}>1日</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.answerButton, styles.hardButton, pressed && styles.pressed]}
            onPress={() => handleAnswer(2)}
          >
            <Text style={styles.answerButtonText}>Hard</Text>
            <Text style={styles.answerButtonHint}>3日</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.answerButton, styles.goodButton, pressed && styles.pressed]}
            onPress={() => handleAnswer(3)}
          >
            <Text style={styles.answerButtonText}>Good</Text>
            <Text style={styles.answerButtonHint}>7日</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.answerButton, styles.easyButton, pressed && styles.pressed]}
            onPress={() => handleAnswer(5)}
          >
            <Text style={styles.answerButtonText}>Easy</Text>
            <Text style={styles.answerButtonHint}>14日</Text>
          </Pressable>
        </View>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#687076',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    textAlign: 'center',
  },
  progress: {
    fontSize: 14,
    color: '#687076',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 16,
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4A90E2',
    borderRadius: 2,
  },
  cardContainer: {
    flex: 1,
    padding: 16,
  },
  card: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardFront: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  topicBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 16,
  },
  topicBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  cardQuestion: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1A1A1A',
    textAlign: 'center',
  },
  cardAbbrev: {
    fontSize: 16,
    color: '#687076',
    marginTop: 8,
  },
  cardBack: {
    paddingTop: 20,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginBottom: 20,
  },
  cardAnswer: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#E74C3C',
    textAlign: 'center',
  },
  cardReading: {
    fontSize: 14,
    color: '#687076',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
  },
  cardDefinition: {
    fontSize: 16,
    color: '#1A1A1A',
    lineHeight: 24,
    textAlign: 'center',
  },
  exampleBlock: {
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  exampleEn: {
    fontSize: 14,
    color: '#1A1A1A',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  exampleJp: {
    fontSize: 13,
    color: '#687076',
  },
  tapHint: {
    fontSize: 14,
    color: '#687076',
    textAlign: 'center',
    marginTop: 'auto',
  },
  answerButtons: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 8,
  },
  answerButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  againButton: {
    backgroundColor: '#E74C3C',
  },
  hardButton: {
    backgroundColor: '#F5A623',
  },
  goodButton: {
    backgroundColor: '#22C55E',
  },
  easyButton: {
    backgroundColor: '#4A90E2',
  },
  answerButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  answerButtonHint: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  completeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  completeIcon: {
    marginBottom: 24,
  },
  completeTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  completeSubtitle: {
    fontSize: 16,
    color: '#687076',
    marginBottom: 32,
  },
  completeButton: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  completeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  pressed: {
    opacity: 0.8,
  },
});
