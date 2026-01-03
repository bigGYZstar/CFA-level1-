import { useEffect, useState } from 'react';
import { ScrollView, Text, View, Pressable, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { loadTerms, loadExamples, loadRelations, loadProgress, saveProgress, createInitialProgress, TOPICS } from '@/lib/data-store';
import type { Term, Example, Relation, LearningProgress } from '@/lib/types';

export default function TermDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  
  const [term, setTerm] = useState<Term | null>(null);
  const [example, setExample] = useState<Example | null>(null);
  const [relations, setRelations] = useState<Relation[]>([]);
  const [relatedTerms, setRelatedTerms] = useState<Term[]>([]);
  const [progress, setProgress] = useState<LearningProgress | null>(null);
  const [allProgress, setAllProgress] = useState<Record<string, LearningProgress>>({});

  useEffect(() => {
    if (id) loadData();
  }, [id]);

  async function loadData() {
    const [terms, examples, rels, prog] = await Promise.all([
      loadTerms(),
      loadExamples(),
      loadRelations(),
      loadProgress(),
    ]);
    
    const foundTerm = terms.find(t => t.term_id === id);
    setTerm(foundTerm || null);
    
    const foundExample = examples.find(e => e.term_id === id);
    setExample(foundExample || null);
    
    const termRelations = rels.filter(r => r.term_id === id);
    setRelations(termRelations);
    
    const relatedIds = termRelations.map(r => r.related_term_id);
    const related = terms.filter(t => relatedIds.includes(t.term_id));
    setRelatedTerms(related);
    
    setAllProgress(prog);
    setProgress(prog[id || ''] || null);
  }

  const toggleBookmark = async () => {
    if (!id) return;
    const current = allProgress[id] || createInitialProgress(id);
    const updated = { ...current, is_bookmarked: !current.is_bookmarked };
    const newProgress = { ...allProgress, [id]: updated };
    await saveProgress(newProgress);
    setProgress(updated);
    setAllProgress(newProgress);
  };

  const topic = term ? TOPICS.find(t => t.code === term.topic_code) : null;

  if (!term) {
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
        <View style={styles.headerActions}>
          <Pressable
            style={({ pressed }) => [styles.actionButton, pressed && styles.pressed]}
            onPress={toggleBookmark}
          >
            <IconSymbol 
              name={progress?.is_bookmarked ? "bookmark.fill" : "bookmark"} 
              size={24} 
              color={progress?.is_bookmarked ? "#F5A623" : "#687076"} 
            />
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View style={styles.container}>
          {/* 見出し帯 */}
          <View style={styles.headwordBand}>
            <View style={styles.headwordRow}>
              <Text style={styles.japaneseHeadword}>{term.jp_headword}</Text>
              {topic && (
                <View style={[styles.topicBadge, { backgroundColor: topic.color }]}>
                  <Text style={styles.topicBadgeText}>{topic.code}</Text>
                </View>
              )}
            </View>
            <Text style={styles.englishHeadword}>
              {term.en_canonical}
              {term.abbreviations.length > 0 && ` (${term.abbreviations.join(', ')})`}
            </Text>
            <Text style={styles.reading}>{term.jp_reading}</Text>
          </View>

          {/* 定義 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>定義</Text>
            <Text style={styles.definition}>{term.jp_definition}</Text>
          </View>

          {/* Key Points */}
          {term.key_points.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Key Points</Text>
              {term.key_points.map((point, index) => (
                <View key={index} style={styles.keyPointRow}>
                  <View style={styles.bullet} />
                  <Text style={styles.keyPointText}>{point}</Text>
                </View>
              ))}
            </View>
          )}

          {/* 例文 */}
          {example && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>例文</Text>
              <View style={styles.exampleBlock}>
                <Text style={styles.exampleEn}>{example.example_en}</Text>
                <Text style={styles.exampleJp}>{example.example_jp}</Text>
              </View>
            </View>
          )}

          {/* 公式 */}
          {term.formula && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>公式</Text>
              <View style={styles.formulaBlock}>
                <Text style={styles.formulaText}>{term.formula}</Text>
              </View>
            </View>
          )}

          {/* Pitfall */}
          {term.pitfall && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Pitfall（混同注意）</Text>
              <View style={styles.pitfallBlock}>
                <IconSymbol name="flag.fill" size={16} color="#E74C3C" />
                <Text style={styles.pitfallText}>{term.pitfall}</Text>
              </View>
            </View>
          )}

          {/* 関連語 */}
          {relatedTerms.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>関連語</Text>
              <View style={styles.relatedList}>
                {relatedTerms.map(related => {
                  const rel = relations.find(r => r.related_term_id === related.term_id);
                  return (
                    <Pressable
                      key={related.term_id}
                      style={({ pressed }) => [
                        styles.relatedChip,
                        rel?.relation_type === 'contrast' && styles.relatedChipContrast,
                        pressed && styles.pressed,
                      ]}
                      onPress={() => router.push(`/term/${related.term_id}` as any)}
                    >
                      <Text style={[
                        styles.relatedChipText,
                        rel?.relation_type === 'contrast' && styles.relatedChipTextContrast,
                      ]}>
                        {rel?.relation_type === 'contrast' ? '⇔ ' : '→ '}
                        {related.jp_headword}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}
        </View>
      </ScrollView>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
  },
  headerActions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 8,
  },
  container: {
    flex: 1,
    padding: 16,
  },
  headwordBand: {
    backgroundColor: '#FFF0F5',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  headwordRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  japaneseHeadword: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#E74C3C',
    flex: 1,
  },
  topicBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginLeft: 8,
  },
  topicBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  englishHeadword: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  reading: {
    fontSize: 14,
    color: '#687076',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#687076',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  definition: {
    fontSize: 16,
    color: '#1A1A1A',
    lineHeight: 24,
  },
  keyPointRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4A90E2',
    marginTop: 8,
    marginRight: 10,
  },
  keyPointText: {
    flex: 1,
    fontSize: 15,
    color: '#1A1A1A',
    lineHeight: 22,
  },
  exampleBlock: {
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#4A90E2',
  },
  exampleEn: {
    fontSize: 15,
    color: '#1A1A1A',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  exampleJp: {
    fontSize: 14,
    color: '#687076',
  },
  formulaBlock: {
    backgroundColor: '#F0F7FF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  formulaText: {
    fontSize: 16,
    fontFamily: 'monospace',
    color: '#1A1A1A',
  },
  pitfallBlock: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFF0F0',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFD0D0',
  },
  pitfallText: {
    flex: 1,
    fontSize: 14,
    color: '#E74C3C',
    marginLeft: 8,
    lineHeight: 20,
  },
  relatedList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  relatedChip: {
    backgroundColor: '#F0F7FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#4A90E2',
  },
  relatedChipContrast: {
    backgroundColor: '#FFF0F0',
    borderColor: '#E74C3C',
  },
  relatedChipText: {
    fontSize: 14,
    color: '#4A90E2',
  },
  relatedChipTextContrast: {
    color: '#E74C3C',
  },
  pressed: {
    opacity: 0.7,
  },
});
