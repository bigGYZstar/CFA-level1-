import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { textbookStore } from "@/lib/textbook-store";
import { TextContent, ExampleProblem, ReadingInfo } from "@/lib/textbook-types";
import { useColors } from "@/hooks/use-colors";

/**
 * Reading詳細画面（セクションと例題の一覧）
 */
export default function ReadingDetailScreen() {
  const colors = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [reading, setReading] = useState<ReadingInfo | null>(null);
  const [textContents, setTextContents] = useState<TextContent[]>([]);
  const [examples, setExamples] = useState<ExampleProblem[]>([]);
  const [activeTab, setActiveTab] = useState<'text' | 'example'>('text');

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    await textbookStore.initialize();
    const readingData = textbookStore.readings.get(id);
    if (readingData) {
      setReading(readingData);
      setTextContents(textbookStore.getTextContentsByReading(id));
      setExamples(textbookStore.getExamplesByReading(id));
    }
  };

  const handleTextPress = (content: TextContent) => {
    router.push(`/textbook/text/${content.id}`);
  };

  const handleExamplePress = (example: ExampleProblem) => {
    router.push(`/textbook/example/${example.id}`);
  };

  if (!reading) {
    return (
      <ScreenContainer className="p-6">
        <View className="flex-1 items-center justify-center">
          <Text className="text-lg text-foreground">読み込み中...</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="p-6">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="gap-6">
          {/* ヘッダー */}
          <View>
            <Text className="text-2xl font-bold text-foreground">{reading.titleJa}</Text>
            <Text className="text-base text-muted mt-1">{reading.title}</Text>
            {reading.descriptionJa && (
              <Text className="text-sm text-muted mt-2">{reading.descriptionJa}</Text>
            )}
          </View>

          {/* タブ切り替え */}
          <View className="flex-row gap-2">
            <TouchableOpacity
              onPress={() => setActiveTab('text')}
              style={{
                flex: 1,
                backgroundColor: activeTab === 'text' ? colors.primary : colors.surface,
                paddingVertical: 12,
                borderRadius: 8,
                alignItems: 'center',
              }}
            >
              <Text
                style={{
                  color: activeTab === 'text' ? colors.background : colors.foreground,
                  fontWeight: '600',
                }}
              >
                📖 テキスト理解 ({textContents.length})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setActiveTab('example')}
              style={{
                flex: 1,
                backgroundColor: activeTab === 'example' ? colors.primary : colors.surface,
                paddingVertical: 12,
                borderRadius: 8,
                alignItems: 'center',
              }}
            >
              <Text
                style={{
                  color: activeTab === 'example' ? colors.background : colors.foreground,
                  fontWeight: '600',
                }}
              >
                📝 例題 ({examples.length})
              </Text>
            </TouchableOpacity>
          </View>

          {/* テキストコンテンツ一覧 */}
          {activeTab === 'text' && (
            <View className="gap-3">
              {textContents.map((content) => {
                const progress = textbookStore.getTextProgress(content.id);
                return (
                  <TouchableOpacity
                    key={content.id}
                    onPress={() => handleTextPress(content)}
                    style={{
                      backgroundColor: colors.surface,
                      padding: 16,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: colors.border,
                    }}
                  >
                    <View className="flex-row items-center justify-between">
                      <View className="flex-1">
                        <Text className="text-base font-semibold text-foreground">
                          {content.section}. {content.titleJa}
                        </Text>
                        <Text className="text-sm text-muted mt-1">{content.title}</Text>
                      </View>
                      {progress && (
                        <View
                          style={{
                            backgroundColor: colors.primary,
                            paddingHorizontal: 8,
                            paddingVertical: 4,
                            borderRadius: 4,
                          }}
                        >
                          <Text style={{ color: colors.background, fontSize: 12 }}>
                            復習 {progress.repetitions}回
                          </Text>
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* 例題一覧 */}
          {activeTab === 'example' && (
            <View className="gap-3">
              {examples.map((example) => {
                const progress = textbookStore.getExampleProgress(example.id);
                const difficultyEmoji = {
                  easy: '⭐',
                  medium: '⭐⭐',
                  hard: '⭐⭐⭐',
                }[example.difficulty];

                return (
                  <TouchableOpacity
                    key={example.id}
                    onPress={() => handleExamplePress(example)}
                    style={{
                      backgroundColor: colors.surface,
                      padding: 16,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: colors.border,
                    }}
                  >
                    <View className="flex-row items-center justify-between">
                      <View className="flex-1">
                        <Text className="text-base font-semibold text-foreground">
                          例題 {example.exampleNumber}: {example.titleJa}
                        </Text>
                        <Text className="text-sm text-muted mt-1">{example.title}</Text>
                        <Text className="text-xs text-muted mt-2">{difficultyEmoji}</Text>
                      </View>
                      {progress && (
                        <View
                          style={{
                            backgroundColor: progress.lastCorrect
                              ? colors.success
                              : colors.warning,
                            paddingHorizontal: 8,
                            paddingVertical: 4,
                            borderRadius: 4,
                          }}
                        >
                          <Text style={{ color: colors.background, fontSize: 12 }}>
                            {progress.attempts}回挑戦
                          </Text>
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
