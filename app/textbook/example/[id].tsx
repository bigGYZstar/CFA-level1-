import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { textbookStore } from "@/lib/textbook-store";
import { ExampleProblem } from "@/lib/textbook-types";
import { useColors } from "@/hooks/use-colors";
import { loadSRSSettings } from "@/lib/data-store";

/**
 * 例題詳細画面（学習画面）
 */
export default function ExampleProblemScreen() {
  const colors = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [example, setExample] = useState<ExampleProblem | null>(null);
  const [showSolution, setShowSolution] = useState(false);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    await textbookStore.initialize();
    const exampleData = textbookStore.getExample(id);
    if (exampleData) {
      setExample(exampleData);
    }
  };

  const handleRating = async (rating: 'again' | 'hard' | 'good' | 'easy') => {
    const settings = await loadSRSSettings();
    await textbookStore.recordExampleReview(id, rating, settings);
    router.back();
  };

  if (!example) {
    return (
      <ScreenContainer className="p-6">
        <View className="flex-1 items-center justify-center">
          <Text className="text-lg text-foreground">読み込み中...</Text>
        </View>
      </ScreenContainer>
    );
  }

  const difficultyEmoji = {
    easy: '⭐',
    medium: '⭐⭐',
    hard: '⭐⭐⭐',
  }[example.difficulty];

  return (
    <ScreenContainer className="p-6">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="gap-6">
          {/* ヘッダー */}
          <View>
            <Text className="text-sm text-muted">
              例題 {example.exampleNumber} • {difficultyEmoji}
            </Text>
            <Text className="text-2xl font-bold text-foreground mt-1">
              {example.titleJa}
            </Text>
            <Text className="text-base text-muted mt-1">{example.title}</Text>
          </View>

          {/* 問題文 */}
          <View
            style={{
              backgroundColor: colors.surface,
              padding: 16,
              borderRadius: 12,
              borderLeftWidth: 4,
              borderLeftColor: colors.primary,
            }}
          >
            <Text className="text-sm font-semibold text-foreground mb-3">
              📝 問題
            </Text>
            <Text className="text-base text-foreground leading-relaxed mb-3">
              {example.problemJa}
            </Text>
            <View
              style={{
                backgroundColor: colors.background,
                padding: 12,
                borderRadius: 8,
                marginTop: 8,
              }}
            >
              <Text className="text-sm text-muted italic">
                {example.problem}
              </Text>
            </View>
          </View>

          {/* 解答表示ボタン */}
          {!showSolution ? (
            <TouchableOpacity
              onPress={() => setShowSolution(true)}
              style={{
                backgroundColor: colors.primary,
                paddingVertical: 16,
                borderRadius: 12,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: colors.background, fontSize: 16, fontWeight: '600' }}>
                解答を表示
              </Text>
            </TouchableOpacity>
          ) : (
            <>
              {/* 解答 */}
              <View
                style={{
                  backgroundColor: colors.success + '20',
                  padding: 16,
                  borderRadius: 12,
                  borderLeftWidth: 4,
                  borderLeftColor: colors.success,
                }}
              >
                <Text className="text-sm font-semibold text-foreground mb-3">
                  ✅ 解答
                </Text>
                <Text className="text-base text-foreground leading-relaxed mb-3">
                  {example.solutionJa}
                </Text>
                <View
                  style={{
                    backgroundColor: colors.background,
                    padding: 12,
                    borderRadius: 8,
                    marginTop: 8,
                  }}
                >
                  <Text className="text-sm text-muted italic">
                    {example.solution}
                  </Text>
                </View>
              </View>

              {/* 解説 */}
              <View
                style={{
                  backgroundColor: colors.surface,
                  padding: 16,
                  borderRadius: 12,
                }}
              >
                <Text className="text-sm font-semibold text-foreground mb-3">
                  💡 解説
                </Text>
                <Text className="text-base text-foreground leading-relaxed mb-3">
                  {example.explanationJa}
                </Text>
                <View
                  style={{
                    backgroundColor: colors.background,
                    padding: 12,
                    borderRadius: 8,
                    marginTop: 8,
                  }}
                >
                  <Text className="text-sm text-muted italic">
                    {example.explanation}
                  </Text>
                </View>
              </View>

              {/* 関連セクション */}
              {example.relatedSection && (
                <View
                  style={{
                    backgroundColor: colors.surface,
                    padding: 12,
                    borderRadius: 8,
                  }}
                >
                  <Text className="text-sm text-muted">
                    📖 関連セクション: {example.relatedSection}
                  </Text>
                </View>
              )}

              {/* 復習ボタン */}
              <View>
                <Text className="text-sm text-muted text-center mb-3">
                  理解度を評価してください
                </Text>
                <View className="gap-2">
                  <TouchableOpacity
                    onPress={() => handleRating('again')}
                    style={{
                      backgroundColor: colors.error,
                      paddingVertical: 14,
                      borderRadius: 8,
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ color: colors.background, fontWeight: '600' }}>
                      もう一度 (1分後)
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleRating('hard')}
                    style={{
                      backgroundColor: colors.warning,
                      paddingVertical: 14,
                      borderRadius: 8,
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ color: colors.background, fontWeight: '600' }}>
                      難しい (10分後)
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleRating('good')}
                    style={{
                      backgroundColor: colors.success,
                      paddingVertical: 14,
                      borderRadius: 8,
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ color: colors.background, fontWeight: '600' }}>
                      理解した (1日後)
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleRating('easy')}
                    style={{
                      backgroundColor: colors.primary,
                      paddingVertical: 14,
                      borderRadius: 8,
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ color: colors.background, fontWeight: '600' }}>
                      簡単 (4日後)
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
