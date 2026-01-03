import { View, Text, Pressable, StyleSheet } from 'react-native';
import { cn } from '@/lib/utils';
import type { Term, Topic } from '@/lib/types';

interface TermCardProps {
  term: Term;
  topic?: Topic;
  index: number;
  onPress: () => void;
  showExample?: boolean;
}

export function TermCard({ term, topic, index, onPress, showExample = false }: TermCardProps) {
  const topicColor = topic?.color || '#4A90E2';
  
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        pressed && styles.pressed,
      ]}
    >
      {/* 番号バッジ */}
      <View style={[styles.badge, { backgroundColor: topicColor }]}>
        <Text style={styles.badgeText}>{index + 1}</Text>
      </View>
      
      {/* コンテンツ */}
      <View style={styles.content}>
        {/* 見出し帯 */}
        <View style={styles.headwordBand}>
          <Text style={styles.englishHeadword}>{term.en_canonical}</Text>
          {term.abbreviations.length > 0 && (
            <Text style={styles.abbreviation}> ({term.abbreviations.join(', ')})</Text>
          )}
        </View>
        
        {/* 日本語見出し */}
        <Text style={styles.japaneseHeadword}>{term.jp_headword}</Text>
        <Text style={styles.reading}>{term.jp_reading}</Text>
        
        {/* 定義（折りたたみ可能） */}
        {showExample && (
          <Text style={styles.definition} numberOfLines={2}>
            {term.jp_definition}
          </Text>
        )}
      </View>
      
      {/* 科目タグ */}
      <View style={[styles.topicTag, { backgroundColor: topicColor + '20' }]}>
        <Text style={[styles.topicTagText, { color: topicColor }]}>{term.topic_code}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  pressed: {
    opacity: 0.7,
    backgroundColor: '#F8F9FA',
  },
  badge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  headwordBand: {
    flexDirection: 'row',
    alignItems: 'baseline',
    backgroundColor: '#FFF0F5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginBottom: 4,
    alignSelf: 'flex-start',
  },
  englishHeadword: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  abbreviation: {
    fontSize: 12,
    color: '#687076',
  },
  japaneseHeadword: {
    fontSize: 18,
    fontWeight: '600',
    color: '#E74C3C',
    marginTop: 4,
  },
  reading: {
    fontSize: 12,
    color: '#687076',
  },
  definition: {
    fontSize: 14,
    color: '#1A1A1A',
    marginTop: 8,
    lineHeight: 20,
  },
  topicTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginLeft: 8,
  },
  topicTagText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
});
