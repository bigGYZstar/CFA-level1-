import { useState } from 'react';
import { ScrollView, Text, View, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { TOPICS } from '@/lib/data-store';
import type { TopicCode } from '@/lib/types';

type QuestionType = 'multiple_choice' | 'input' | 'fill_blank';

export default function QuizScreen() {
  const router = useRouter();
  const [selectedTopics, setSelectedTopics] = useState<TopicCode[]>([]);
  const [questionType, setQuestionType] = useState<QuestionType>('multiple_choice');
  const [questionCount, setQuestionCount] = useState(10);
  const [prioritizeReview, setPrioritizeReview] = useState(true);

  const toggleTopic = (code: TopicCode) => {
    setSelectedTopics(prev => 
      prev.includes(code) 
        ? prev.filter(t => t !== code)
        : [...prev, code]
    );
  };

  const selectAllTopics = () => {
    setSelectedTopics(TOPICS.map(t => t.code));
  };

  const clearTopics = () => {
    setSelectedTopics([]);
  };

  const startQuiz = () => {
    const params = new URLSearchParams({
      topics: selectedTopics.join(','),
      type: questionType,
      count: questionCount.toString(),
      review: prioritizeReview.toString(),
    });
    router.push(`/quiz-session?${params.toString()}` as any);
  };

  return (
    <ScreenContainer className="bg-background">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View style={styles.container}>
          {/* ヘッダー */}
          <View style={styles.header}>
            <Text style={styles.title}>クイズモード</Text>
            <Text style={styles.subtitle}>出題設定</Text>
          </View>

          {/* 科目選択 */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>科目を選択</Text>
              <View style={styles.sectionActions}>
                <Pressable onPress={selectAllTopics}>
                  <Text style={styles.actionText}>すべて選択</Text>
                </Pressable>
                <Text style={styles.actionDivider}>|</Text>
                <Pressable onPress={clearTopics}>
                  <Text style={styles.actionText}>クリア</Text>
                </Pressable>
              </View>
            </View>
            <View style={styles.topicGrid}>
              {TOPICS.map(topic => (
                <Pressable
                  key={topic.code}
                  style={[
                    styles.topicChip,
                    selectedTopics.includes(topic.code) && {
                      backgroundColor: topic.color,
                      borderColor: topic.color,
                    },
                  ]}
                  onPress={() => toggleTopic(topic.code)}
                >
                  <Text style={[
                    styles.topicChipText,
                    selectedTopics.includes(topic.code) && styles.topicChipTextActive,
                  ]}>{topic.code}</Text>
                  <Text style={[
                    styles.topicChipCount,
                    selectedTopics.includes(topic.code) && styles.topicChipTextActive,
                  ]}>{topic.term_count}語</Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* 出題形式 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>出題形式</Text>
            <View style={styles.optionList}>
              {[
                { key: 'multiple_choice', label: '四択問題', desc: '4つの選択肢から正解を選ぶ' },
                { key: 'input', label: '入力式', desc: '正解を直接入力する' },
                { key: 'fill_blank', label: '穴埋め', desc: '例文の空欄を埋める' },
              ].map(opt => (
                <Pressable
                  key={opt.key}
                  style={[
                    styles.optionItem,
                    questionType === opt.key && styles.optionItemActive,
                  ]}
                  onPress={() => setQuestionType(opt.key as QuestionType)}
                >
                  <View style={styles.optionContent}>
                    <Text style={[
                      styles.optionLabel,
                      questionType === opt.key && styles.optionLabelActive,
                    ]}>{opt.label}</Text>
                    <Text style={styles.optionDesc}>{opt.desc}</Text>
                  </View>
                  {questionType === opt.key && (
                    <IconSymbol name="checkmark.circle.fill" size={24} color="#4A90E2" />
                  )}
                </Pressable>
              ))}
            </View>
          </View>

          {/* 出題数 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>出題数</Text>
            <View style={styles.countRow}>
              {[10, 20, 50].map(count => (
                <Pressable
                  key={count}
                  style={[
                    styles.countChip,
                    questionCount === count && styles.countChipActive,
                  ]}
                  onPress={() => setQuestionCount(count)}
                >
                  <Text style={[
                    styles.countChipText,
                    questionCount === count && styles.countChipTextActive,
                  ]}>{count}問</Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* 復習優先 */}
          <View style={styles.section}>
            <Pressable
              style={styles.toggleRow}
              onPress={() => setPrioritizeReview(!prioritizeReview)}
            >
              <View style={styles.toggleContent}>
                <Text style={styles.toggleLabel}>復習キュー優先</Text>
                <Text style={styles.toggleDesc}>復習が必要な用語を優先的に出題</Text>
              </View>
              <View style={[
                styles.toggle,
                prioritizeReview && styles.toggleActive,
              ]}>
                <View style={[
                  styles.toggleKnob,
                  prioritizeReview && styles.toggleKnobActive,
                ]} />
              </View>
            </Pressable>
          </View>

          {/* 開始ボタン */}
          <Pressable
            style={({ pressed }) => [
              styles.startButton,
              pressed && styles.pressed,
              selectedTopics.length === 0 && styles.startButtonDisabled,
            ]}
            onPress={startQuiz}
            disabled={selectedTopics.length === 0}
          >
            <IconSymbol name="play.fill" size={24} color="#FFFFFF" />
            <Text style={styles.startButtonText}>クイズを開始</Text>
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
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  sectionActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionText: {
    fontSize: 14,
    color: '#4A90E2',
  },
  actionDivider: {
    marginHorizontal: 8,
    color: '#E5E7EB',
  },
  topicGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  topicChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  topicChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  topicChipCount: {
    fontSize: 10,
    color: '#687076',
    marginTop: 2,
  },
  topicChipTextActive: {
    color: '#FFFFFF',
  },
  optionList: {
    gap: 8,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  optionItemActive: {
    borderColor: '#4A90E2',
    backgroundColor: '#F0F7FF',
  },
  optionContent: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1A1A1A',
  },
  optionLabelActive: {
    color: '#4A90E2',
  },
  optionDesc: {
    fontSize: 12,
    color: '#687076',
    marginTop: 2,
  },
  countRow: {
    flexDirection: 'row',
    gap: 12,
  },
  countChip: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  countChipActive: {
    backgroundColor: '#4A90E2',
    borderColor: '#4A90E2',
  },
  countChipText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  countChipTextActive: {
    color: '#FFFFFF',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  toggleContent: {
    flex: 1,
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1A1A1A',
  },
  toggleDesc: {
    fontSize: 12,
    color: '#687076',
    marginTop: 2,
  },
  toggle: {
    width: 50,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#E5E7EB',
    padding: 2,
  },
  toggleActive: {
    backgroundColor: '#4A90E2',
  },
  toggleKnob: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
  },
  toggleKnobActive: {
    transform: [{ translateX: 20 }],
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4A90E2',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    marginTop: 8,
  },
  startButtonDisabled: {
    backgroundColor: '#E5E7EB',
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  pressed: {
    opacity: 0.8,
  },
});
