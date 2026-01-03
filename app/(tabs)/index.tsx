import { useEffect, useState } from 'react';
import { ScrollView, Text, View, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { loadTerms, loadProgress, getReviewDueTerms, TOPICS } from '@/lib/data-store';
import type { Term, LearningProgress } from '@/lib/types';

export default function HomeScreen() {
  const router = useRouter();
  const [terms, setTerms] = useState<Term[]>([]);
  const [progress, setProgress] = useState<Record<string, LearningProgress>>({});
  const [reviewCount, setReviewCount] = useState(0);
  const [masteredCount, setMasteredCount] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const loadedTerms = await loadTerms();
    const loadedProgress = await loadProgress();
    setTerms(loadedTerms);
    setProgress(loadedProgress);
    
    const reviewDue = getReviewDueTerms(loadedTerms, loadedProgress);
    setReviewCount(reviewDue.length);
    
    const mastered = Object.values(loadedProgress).filter(p => p.repetitions >= 3).length;
    setMasteredCount(mastered);
  }

  const totalTerms = terms.length;
  const learnedTerms = Object.keys(progress).length;
  const progressPercent = totalTerms > 0 ? Math.round((learnedTerms / totalTerms) * 100) : 0;

  return (
    <ScreenContainer className="bg-background">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View style={styles.container}>
          {/* ヘッダー */}
          <View style={styles.header}>
            <Text style={styles.title}>CFA Level I</Text>
            <Text style={styles.subtitle}>高頻出用語 Top200</Text>
          </View>

          {/* 進捗サマリー */}
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>学習進捗</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
            </View>
            <View style={styles.statsRow}>
              <View style={styles.stat}>
                <Text style={styles.statValue}>{learnedTerms}</Text>
                <Text style={styles.statLabel}>学習済み</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statValue}>{masteredCount}</Text>
                <Text style={styles.statLabel}>習得</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statValue}>{totalTerms}</Text>
                <Text style={styles.statLabel}>総数</Text>
              </View>
            </View>
          </View>

          {/* 今日の復習 */}
          {reviewCount > 0 && (
            <Pressable
              style={({ pressed }) => [
                styles.reviewCard,
                pressed && styles.pressed,
              ]}
              onPress={() => router.push('/review' as any)}
            >
              <View style={styles.reviewIcon}>
                <IconSymbol name="clock.fill" size={24} color="#FFFFFF" />
              </View>
              <View style={styles.reviewContent}>
                <Text style={styles.reviewTitle}>今日の復習</Text>
                <Text style={styles.reviewCount}>{reviewCount}語</Text>
              </View>
              <IconSymbol name="chevron.right" size={20} color="#687076" />
            </Pressable>
          )}

          {/* クイックアクセス */}
          <Text style={styles.sectionTitle}>クイックアクセス</Text>
          <View style={styles.quickActions}>
            <Pressable
              style={({ pressed }) => [
                styles.actionCard,
                pressed && styles.pressed,
              ]}
              onPress={() => router.push('/(tabs)/study' as any)}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#4A90E2' }]}>
                <IconSymbol name="book.fill" size={28} color="#FFFFFF" />
              </View>
              <Text style={styles.actionTitle}>学習モード</Text>
              <Text style={styles.actionDesc}>用語を学習する</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.actionCard,
                pressed && styles.pressed,
              ]}
              onPress={() => router.push('/(tabs)/quiz' as any)}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#E74C3C' }]}>
                <IconSymbol name="questionmark.circle.fill" size={28} color="#FFFFFF" />
              </View>
              <Text style={styles.actionTitle}>クイズモード</Text>
              <Text style={styles.actionDesc}>理解度をテスト</Text>
            </Pressable>
          </View>

          {/* 科目一覧 */}
          <Text style={styles.sectionTitle}>科目別</Text>
          <View style={styles.topicList}>
            {TOPICS.map(topic => (
              <Pressable
                key={topic.code}
                style={({ pressed }) => [
                  styles.topicItem,
                  pressed && styles.pressed,
                ]}
                onPress={() => router.push(`/(tabs)/study?topic=${topic.code}` as any)}
              >
                <View style={[styles.topicBadge, { backgroundColor: topic.color }]}>
                  <Text style={styles.topicBadgeText}>{topic.code}</Text>
                </View>
                <View style={styles.topicContent}>
                  <Text style={styles.topicName}>{topic.name_jp}</Text>
                  <Text style={styles.topicCount}>{topic.term_count}語</Text>
                </View>
                <IconSymbol name="chevron.right" size={16} color="#687076" />
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  subtitle: {
    fontSize: 16,
    color: '#687076',
    marginTop: 4,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#687076',
    marginBottom: 12,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 16,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4A90E2',
    borderRadius: 4,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  statLabel: {
    fontSize: 12,
    color: '#687076',
    marginTop: 4,
  },
  reviewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3CD',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  reviewIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F5A623',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  reviewContent: {
    flex: 1,
  },
  reviewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  reviewCount: {
    fontSize: 14,
    color: '#856404',
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  actionCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  actionDesc: {
    fontSize: 12,
    color: '#687076',
    marginTop: 4,
  },
  topicList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
  },
  topicItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  topicBadge: {
    width: 40,
    height: 24,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  topicBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  topicContent: {
    flex: 1,
  },
  topicName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1A1A1A',
  },
  topicCount: {
    fontSize: 12,
    color: '#687076',
  },
  pressed: {
    opacity: 0.7,
  },
});
