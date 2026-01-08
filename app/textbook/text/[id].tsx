import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { textbookStore } from "@/lib/textbook-store";
import { TextContent } from "@/lib/textbook-types";
import { useColors } from "@/hooks/use-colors";
import { loadSRSSettings } from "@/lib/data-store";

/**
 * テキストコンテンツ詳細画面（学習画面）
 */
export default function TextContentScreen() {
  const colors = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [content, setContent] = useState<TextContent | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    await textbookStore.initialize();
    const contentData = textbookStore.getTextContent(id);
    if (contentData) {
      setContent(contentData);
    }
  };

  const handleRating = async (rating: 'again' | 'hard' | 'good' | 'easy') => {
    const settings = await loadSRSSettings();
    await textbookStore.recordTextReview(id, rating, settings);
    router.back();
  };

  if (!content) {
    return (
      <ScreenContainer className="p-6">
        <View className="flex-1 items-center justify-center">
          <Text className="text-lg text-foreground">読み込み中...</Text>
        </View>
      </ScreenContainer>
    );
  }

  const currentQuestion = content.checkQuestions[currentQuestionIndex];

  return (
    <ScreenContainer className="p-6">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="gap-6">
          {/* ヘッダー */}
          <View>
            <Text className="text-sm text-muted">{content.section}</Text>
            <Text className="text-2xl font-bold text-foreground mt-1">
              {content.titleJa}
            </Text>
            <Text className="text-base text-muted mt-1">{content.title}</Text>
          </View>

          {/* 学習目標 */}
          {content.learningOutcomeJa && (
            <View
              style={{
                backgroundColor: colors.surface,
                padding: 16,
                borderRadius: 12,
                borderLeftWidth: 4,
                borderLeftColor: colors.primary,
              }}
            >
              <Text className="text-sm font-semibold text-foreground mb-2">
                📌 学習目標
              </Text>
              <Text className="text-sm text-foreground">
                {content.learningOutcomeJa}
              </Text>
            </View>
          )}

          {/* 本文 */}
          <View>
            <Text className="text-base text-foreground leading-relaxed">
              {content.contentJa}
            </Text>
          </View>

          {/* 重要ポイント */}
          {content.keyPointsJa.length > 0 && (
            <View
              style={{
                backgroundColor: colors.surface,
                padding: 16,
                borderRadius: 12,
              }}
            >
              <Text className="text-sm font-semibold text-foreground mb-3">
                💡 重要ポイント
              </Text>
              {content.keyPointsJa.map((point, index) => (
                <View key={index} className="flex-row mb-2">
                  <Text className="text-sm text-foreground mr-2">•</Text>
                  <Text className="text-sm text-foreground flex-1">{point}</Text>
                </View>
              ))}
            </View>
          )}

          {/* 確認問題 */}
          {currentQuestion && (
            <View
              style={{
                backgroundColor: colors.surface,
                padding: 16,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Text className="text-sm font-semibold text-foreground mb-3">
                ✅ 確認問題 {currentQuestionIndex + 1} / {content.checkQuestions.length}
              </Text>
              <Text className="text-base text-foreground mb-4">
                {currentQuestion.questionJa}
              </Text>

              {!showAnswer ? (
                <TouchableOpacity
                  onPress={() => setShowAnswer(true)}
                  style={{
                    backgroundColor: colors.primary,
                    paddingVertical: 12,
                    borderRadius: 8,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ color: colors.background, fontWeight: '600' }}>
                    解答を表示
                  </Text>
                </TouchableOpacity>
              ) : (
                <View>
                  <View
                    style={{
                      backgroundColor: colors.success + '20',
                      padding: 12,
                      borderRadius: 8,
                      marginBottom: 12,
                    }}
                  >
                    <Text className="text-sm font-semibold text-foreground mb-1">
                      正解:
                    </Text>
                    <Text className="text-sm text-foreground">
                      {currentQuestion.answerJa}
                    </Text>
                  </View>

                  {currentQuestion.explanationJa && (
                    <View
                      style={{
                        backgroundColor: colors.surface,
                        padding: 12,
                        borderRadius: 8,
                        marginBottom: 12,
                      }}
                    >
                      <Text className="text-sm font-semibold text-foreground mb-1">
                        解説:
                      </Text>
                      <Text className="text-sm text-foreground">
                        {currentQuestion.explanationJa}
                      </Text>
                    </View>
                  )}

                  {currentQuestionIndex < content.checkQuestions.length - 1 ? (
                    <TouchableOpacity
                      onPress={() => {
                        setCurrentQuestionIndex(currentQuestionIndex + 1);
                        setShowAnswer(false);
                      }}
                      style={{
                        backgroundColor: colors.primary,
                        paddingVertical: 12,
                        borderRadius: 8,
                        alignItems: 'center',
                      }}
                    >
                      <Text style={{ color: colors.background, fontWeight: '600' }}>
                        次の問題へ
                      </Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              )}
            </View>
          )}

          {/* 復習ボタン（全問題完了後） */}
          {showAnswer && currentQuestionIndex === content.checkQuestions.length - 1 && (
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
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
