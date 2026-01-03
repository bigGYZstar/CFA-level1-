import { useEffect, useState, useMemo } from 'react';
import { FlatList, Text, View, TextInput, Pressable, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { TermCard } from '@/components/term-card';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { loadTerms, loadExamples, loadProgress, TOPICS } from '@/lib/data-store';
import type { Term, Example, LearningProgress, TopicCode } from '@/lib/types';

type SortOption = 'default' | 'topic' | 'review';
type FilterOption = 'all' | 'unlearned' | 'review' | 'bookmarked';

export default function StudyScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ topic?: string }>();
  
  const [terms, setTerms] = useState<Term[]>([]);
  const [examples, setExamples] = useState<Example[]>([]);
  const [progress, setProgress] = useState<Record<string, LearningProgress>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTopic, setSelectedTopic] = useState<TopicCode | 'all'>('all');
  const [sortBy, setSortBy] = useState<SortOption>('default');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (params.topic) {
      setSelectedTopic(params.topic as TopicCode);
    }
  }, [params.topic]);

  async function loadData() {
    const [loadedTerms, loadedExamples, loadedProgress] = await Promise.all([
      loadTerms(),
      loadExamples(),
      loadProgress(),
    ]);
    setTerms(loadedTerms);
    setExamples(loadedExamples);
    setProgress(loadedProgress);
  }

  const filteredTerms = useMemo(() => {
    let result = [...terms];
    
    // 科目フィルター
    if (selectedTopic !== 'all') {
      result = result.filter(t => t.topic_code === selectedTopic);
    }
    
    // 検索フィルター
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(t => 
        t.en_canonical.toLowerCase().includes(query) ||
        t.jp_headword.includes(query) ||
        t.jp_definition.includes(query) ||
        t.abbreviations.some(a => a.toLowerCase().includes(query))
      );
    }
    
    // 状態フィルター
    if (filterBy === 'unlearned') {
      result = result.filter(t => !progress[t.term_id]);
    } else if (filterBy === 'review') {
      const today = new Date().toISOString().split('T')[0];
      result = result.filter(t => {
        const p = progress[t.term_id];
        return p && p.next_review <= today;
      });
    } else if (filterBy === 'bookmarked') {
      result = result.filter(t => progress[t.term_id]?.is_bookmarked);
    }
    
    // ソート
    if (sortBy === 'topic') {
      result.sort((a, b) => a.topic_code.localeCompare(b.topic_code));
    } else if (sortBy === 'review') {
      result.sort((a, b) => {
        const pa = progress[a.term_id];
        const pb = progress[b.term_id];
        if (!pa && !pb) return 0;
        if (!pa) return -1;
        if (!pb) return 1;
        return pa.next_review.localeCompare(pb.next_review);
      });
    }
    
    return result;
  }, [terms, searchQuery, selectedTopic, sortBy, filterBy, progress]);

  const topicForTerm = (topicCode: TopicCode) => 
    TOPICS.find(t => t.code === topicCode);

  return (
    <ScreenContainer className="bg-background">
      <View style={styles.container}>
        {/* ヘッダー */}
        <View style={styles.header}>
          <Text style={styles.title}>学習モード</Text>
          <Text style={styles.subtitle}>{filteredTerms.length}語</Text>
        </View>

        {/* 検索バー */}
        <View style={styles.searchContainer}>
          <IconSymbol name="magnifyingglass" size={20} color="#687076" />
          <TextInput
            style={styles.searchInput}
            placeholder="用語を検索..."
            placeholderTextColor="#687076"
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          <Pressable
            onPress={() => setShowFilters(!showFilters)}
            style={({ pressed }) => [
              styles.filterButton,
              pressed && styles.pressed,
            ]}
          >
            <IconSymbol name="list.bullet" size={20} color="#4A90E2" />
          </Pressable>
        </View>

        {/* フィルターパネル */}
        {showFilters && (
          <View style={styles.filterPanel}>
            {/* 科目フィルター */}
            <Text style={styles.filterLabel}>科目</Text>
            <View style={styles.filterRow}>
              <Pressable
                style={[
                  styles.filterChip,
                  selectedTopic === 'all' && styles.filterChipActive,
                ]}
                onPress={() => setSelectedTopic('all')}
              >
                <Text style={[
                  styles.filterChipText,
                  selectedTopic === 'all' && styles.filterChipTextActive,
                ]}>すべて</Text>
              </Pressable>
              {TOPICS.map(topic => (
                <Pressable
                  key={topic.code}
                  style={[
                    styles.filterChip,
                    selectedTopic === topic.code && styles.filterChipActive,
                  ]}
                  onPress={() => setSelectedTopic(topic.code)}
                >
                  <Text style={[
                    styles.filterChipText,
                    selectedTopic === topic.code && styles.filterChipTextActive,
                  ]}>{topic.code}</Text>
                </Pressable>
              ))}
            </View>

            {/* 状態フィルター */}
            <Text style={styles.filterLabel}>状態</Text>
            <View style={styles.filterRow}>
              {[
                { key: 'all', label: 'すべて' },
                { key: 'unlearned', label: '未学習' },
                { key: 'review', label: '要復習' },
                { key: 'bookmarked', label: 'ブックマーク' },
              ].map(opt => (
                <Pressable
                  key={opt.key}
                  style={[
                    styles.filterChip,
                    filterBy === opt.key && styles.filterChipActive,
                  ]}
                  onPress={() => setFilterBy(opt.key as FilterOption)}
                >
                  <Text style={[
                    styles.filterChipText,
                    filterBy === opt.key && styles.filterChipTextActive,
                  ]}>{opt.label}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* 用語リスト */}
        <FlatList
          data={filteredTerms}
          keyExtractor={item => item.term_id}
          renderItem={({ item, index }) => (
            <TermCard
              term={item}
              topic={topicForTerm(item.topic_code)}
              index={index}
              onPress={() => router.push(`/term/${item.term_id}` as any)}
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
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
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  subtitle: {
    fontSize: 14,
    color: '#687076',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 16,
    color: '#1A1A1A',
    marginLeft: 8,
  },
  filterButton: {
    padding: 8,
  },
  filterPanel: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#687076',
    marginBottom: 8,
    marginTop: 8,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterChipActive: {
    backgroundColor: '#4A90E2',
    borderColor: '#4A90E2',
  },
  filterChipText: {
    fontSize: 12,
    color: '#687076',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    paddingBottom: 100,
  },
  pressed: {
    opacity: 0.7,
  },
});
