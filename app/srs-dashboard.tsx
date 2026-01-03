import { useEffect, useState } from 'react';
import { ScrollView, Text, View, Pressable, StyleSheet, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { loadTerms, loadProgress, TOPICS } from '@/lib/data-store';
import type { Term, LearningProgress } from '@/lib/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface SRSStats {
  total: number;
  newCount: number;
  learning: number;
  review: number;
  mastered: number;
  overdue: number;
  byTopic: Record<string, { total: number; mastered: number; overdue: number }>;
  retentionByDay: { date: string; retention: number }[];
  difficultTerms: { term: Term; progress: LearningProgress }[];
}

export default function SRSDashboardScreen() {
  const router = useRouter();
  const [stats, setStats] = useState<SRSStats | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const [loadedTerms, loadedProgress] = await Promise.all([
      loadTerms(),
      loadProgress(),
    ]);
    
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    let newCount = 0;
    let learningCount = 0;
    let reviewCount = 0;
    let masteredCount = 0;
    let overdueCount = 0;
    
    const byTopic: Record<string, { total: number; mastered: number; overdue: number }> = {};
    for (const topic of TOPICS) {
      byTopic[topic.code] = { total: 0, mastered: 0, overdue: 0 };
    }
    
    const difficultTerms: { term: Term; progress: LearningProgress }[] = [];
    
    for (const term of loadedTerms) {
      byTopic[term.topic_code].total++;
      
      const p = loadedProgress[term.term_id];
      if (!p) {
        newCount++;
      } else {
        if (p.repetitions === 0) {
          learningCount++;
        } else if (p.repetitions >= 3) {
          masteredCount++;
          byTopic[term.topic_code].mastered++;
        } else {
          reviewCount++;
        }
        
        if (p.next_review <= todayStr) {
          overdueCount++;
          byTopic[term.topic_code].overdue++;
        }
        
        if (p.is_difficult || (p.incorrect_count > p.correct_count && p.incorrect_count >= 2)) {
          difficultTerms.push({ term, progress: p });
        }
      }
    }
    
    difficultTerms.sort((a, b) => {
      const aRate = a.progress.incorrect_count / (a.progress.correct_count + a.progress.incorrect_count || 1);
      const bRate = b.progress.incorrect_count / (b.progress.correct_count + b.progress.incorrect_count || 1);
      return bRate - aRate;
    });
    
    // 過去7日間の記憶保持率（シミュレーション）
    const retentionByDay: { date: string; retention: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      // 記憶保持率を計算（習得済み / 学習済み）
      const learned = Object.keys(loadedProgress).length;
      const retention = learned > 0 ? Math.round((masteredCount / learned) * 100) : 0;
      // 日ごとに少しばらつきを加える（デモ用）
      const variance = Math.floor(Math.random() * 10) - 5;
      retentionByDay.push({
        date: `${date.getMonth() + 1}/${date.getDate()}`,
        retention: Math.max(0, Math.min(100, retention + variance)),
      });
    }
    
    setStats({
      total: loadedTerms.length,
      newCount,
      learning: learningCount,
      review: reviewCount,
      mastered: masteredCount,
      overdue: overdueCount,
      byTopic,
      retentionByDay,
      difficultTerms: difficultTerms.slice(0, 10),
    });
  }

  if (!stats) {
    return (
      <ScreenContainer className="bg-background">
        <View style={styles.loading}>
          <Text style={styles.loadingText}>読み込み中...</Text>
        </View>
      </ScreenContainer>
    );
  }

  const maxRetention = Math.max(...stats.retentionByDay.map(d => d.retention), 100);

  return (
    <ScreenContainer className="bg-background">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View style={styles.container}>
          {/* ヘッダー */}
          <View style={styles.header}>
            <Pressable
              style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
              onPress={() => router.back()}
            >
              <IconSymbol name="chevron.left" size={24} color="#1A1A1A" />
            </Pressable>
            <Text style={styles.title}>忘却曲線ダッシュボード</Text>
          </View>

          {/* 概要カード */}
          <View style={styles.overviewCard}>
            <Text style={styles.cardTitle}>学習状況</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: '#687076' }]}>{stats.newCount}</Text>
                <Text style={styles.statLabel}>未学習</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: '#F5A623' }]}>{stats.learning}</Text>
                <Text style={styles.statLabel}>学習中</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: '#4A90E2' }]}>{stats.review}</Text>
                <Text style={styles.statLabel}>復習中</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: '#22C55E' }]}>{stats.mastered}</Text>
                <Text style={styles.statLabel}>習得済み</Text>
              </View>
            </View>
          </View>

          {/* 要復習アラート */}
          {stats.overdue > 0 && (
            <Pressable
              style={({ pressed }) => [styles.alertCard, pressed && styles.pressed]}
              onPress={() => router.push('/review' as any)}
            >
              <View style={styles.alertIcon}>
                <IconSymbol name="clock.fill" size={24} color="#FFFFFF" />
              </View>
              <View style={styles.alertContent}>
                <Text style={styles.alertTitle}>復習が必要です</Text>
                <Text style={styles.alertDesc}>{stats.overdue}語が復習期限を過ぎています</Text>
              </View>
              <IconSymbol name="chevron.right" size={20} color="#856404" />
            </Pressable>
          )}

          {/* 記憶保持率グラフ */}
          <View style={styles.chartCard}>
            <Text style={styles.cardTitle}>記憶保持率（過去7日間）</Text>
            <View style={styles.chart}>
              {stats.retentionByDay.map((day, index) => (
                <View key={index} style={styles.chartBar}>
                  <View style={styles.barContainer}>
                    <View
                      style={[
                        styles.bar,
                        {
                          height: `${(day.retention / maxRetention) * 100}%`,
                          backgroundColor: day.retention >= 70 ? '#22C55E' : day.retention >= 40 ? '#F5A623' : '#E74C3C',
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.barLabel}>{day.date}</Text>
                  <Text style={styles.barValue}>{day.retention}%</Text>
                </View>
              ))}
            </View>
          </View>

          {/* 科目別進捗 */}
          <View style={styles.topicCard}>
            <Text style={styles.cardTitle}>科目別習得状況</Text>
            {TOPICS.map(topic => {
              const topicStats = stats.byTopic[topic.code];
              const progress = topicStats.total > 0 
                ? Math.round((topicStats.mastered / topicStats.total) * 100) 
                : 0;
              
              return (
                <View key={topic.code} style={styles.topicRow}>
                  <View style={[styles.topicBadge, { backgroundColor: topic.color }]}>
                    <Text style={styles.topicBadgeText}>{topic.code}</Text>
                  </View>
                  <View style={styles.topicProgress}>
                    <View style={styles.topicProgressBar}>
                      <View
                        style={[
                          styles.topicProgressFill,
                          { width: `${progress}%`, backgroundColor: topic.color },
                        ]}
                      />
                    </View>
                    <Text style={styles.topicProgressText}>
                      {topicStats.mastered}/{topicStats.total}
                    </Text>
                  </View>
                  {topicStats.overdue > 0 && (
                    <View style={styles.overdueTag}>
                      <Text style={styles.overdueTagText}>{topicStats.overdue}</Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>

          {/* 苦手語リスト */}
          {stats.difficultTerms.length > 0 && (
            <View style={styles.difficultCard}>
              <Text style={styles.cardTitle}>苦手な用語 Top10</Text>
              <Text style={styles.cardSubtitle}>間違いが多い用語を優先的に復習しましょう</Text>
              {stats.difficultTerms.map(({ term, progress }, index) => {
                const totalAttempts = progress.correct_count + progress.incorrect_count;
                const errorRate = totalAttempts > 0 
                  ? Math.round((progress.incorrect_count / totalAttempts) * 100) 
                  : 0;
                
                return (
                  <Pressable
                    key={term.term_id}
                    style={({ pressed }) => [styles.difficultItem, pressed && styles.pressed]}
                    onPress={() => router.push(`/term/${term.term_id}` as any)}
                  >
                    <View style={styles.difficultRank}>
                      <Text style={styles.difficultRankText}>{index + 1}</Text>
                    </View>
                    <View style={styles.difficultContent}>
                      <Text style={styles.difficultTerm}>{term.en_canonical}</Text>
                      <Text style={styles.difficultJp}>{term.jp_headword}</Text>
                    </View>
                    <View style={styles.difficultStats}>
                      <Text style={styles.errorRate}>{errorRate}%</Text>
                      <Text style={styles.errorLabel}>誤答率</Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}

          {/* 復習開始ボタン */}
          <Pressable
            style={({ pressed }) => [styles.reviewButton, pressed && styles.pressed]}
            onPress={() => router.push('/review' as any)}
          >
            <IconSymbol name="play.fill" size={24} color="#FFFFFF" />
            <Text style={styles.reviewButtonText}>復習を開始</Text>
          </Pressable>
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
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  backButton: {
    padding: 4,
    marginRight: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#687076',
  },
  overviewCard: {
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
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#687076',
    marginTop: -12,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    color: '#687076',
    marginTop: 4,
  },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3CD',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  alertIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F5A623',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  alertDesc: {
    fontSize: 14,
    color: '#856404',
    marginTop: 2,
  },
  chartCard: {
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
  chart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    height: 150,
    alignItems: 'flex-end',
  },
  chartBar: {
    alignItems: 'center',
    flex: 1,
  },
  barContainer: {
    height: 100,
    width: 24,
    backgroundColor: '#F5F5F5',
    borderRadius: 4,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  bar: {
    width: '100%',
    borderRadius: 4,
  },
  barLabel: {
    fontSize: 10,
    color: '#687076',
    marginTop: 8,
  },
  barValue: {
    fontSize: 10,
    fontWeight: '600',
    color: '#1A1A1A',
    marginTop: 2,
  },
  topicCard: {
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
  topicRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
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
  topicProgress: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  topicProgressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginRight: 8,
    overflow: 'hidden',
  },
  topicProgressFill: {
    height: '100%',
    borderRadius: 4,
  },
  topicProgressText: {
    fontSize: 12,
    color: '#687076',
    width: 50,
    textAlign: 'right',
  },
  overdueTag: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 8,
  },
  overdueTagText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#E74C3C',
  },
  difficultCard: {
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
  difficultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  difficultRank: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  difficultRankText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#E74C3C',
  },
  difficultContent: {
    flex: 1,
  },
  difficultTerm: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1A1A1A',
  },
  difficultJp: {
    fontSize: 12,
    color: '#687076',
    marginTop: 2,
  },
  difficultStats: {
    alignItems: 'center',
  },
  errorRate: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#E74C3C',
  },
  errorLabel: {
    fontSize: 10,
    color: '#687076',
  },
  reviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4A90E2',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    marginTop: 8,
    marginBottom: 24,
  },
  reviewButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  pressed: {
    opacity: 0.8,
  },
});
