import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { textbookStore } from "@/lib/textbook-store";
import { SubjectInfo, ReadingInfo, TextbookStatistics } from "@/lib/textbook-types";
import { useColors } from "@/hooks/use-colors";
import { loadSRSSettings } from "@/lib/data-store";

/**
 * テキストブック学習のメイン画面（タブ）
 */
export default function TextbookTabScreen() {
  const colors = useColors();
  const [subjects, setSubjects] = useState<SubjectInfo[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [readings, setReadings] = useState<ReadingInfo[]>([]);
  const [statistics, setStatistics] = useState<TextbookStatistics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    setIsLoading(true);
    await textbookStore.initialize();
    const subjectList = textbookStore.getSubjects();
    setSubjects(subjectList);
    
    // デフォルトで最初の科目を選択
    if (subjectList.length > 0) {
      const firstSubject = subjectList[0].code;
      setSelectedSubject(firstSubject);
      setReadings(textbookStore.getReadingsBySubject(firstSubject));
    }
    
    // 統計情報を取得
    const settings = await loadSRSSettings();
    const stats = textbookStore.getStatistics(settings);
    setStatistics(stats);
    
    setIsLoading(false);
  };

  const handleSubjectSelect = (subjectCode: string) => {
    setSelectedSubject(subjectCode);
    setReadings(textbookStore.getReadingsBySubject(subjectCode));
  };

  const handleReadingPress = (reading: ReadingInfo) => {
    router.push(`/textbook/reading/${reading.id}`);
  };

  const handleReviewPress = async () => {
    const settings = await loadSRSSettings();
    const dueTexts = textbookStore.getReviewDueTexts(settings);
    const dueExamples = textbookStore.getReviewDueExamples(settings);
    
    if (dueTexts.length > 0) {
      router.push(`/textbook/text/${dueTexts[0].id}`);
    } else if (dueExamples.length > 0) {
      router.push(`/textbook/example/${dueExamples[0].id}`);
    }
  };

  if (isLoading) {
    return (
      <ScreenContainer className="p-6">
        <View className="flex-1 items-center justify-center">
          <Text className="text-lg text-foreground">読み込み中...</Text>
        </View>
      </ScreenContainer>
    );
  }

  const totalReviewDue = (statistics?.reviewDueTexts || 0) + (statistics?.reviewDueExamples || 0);

  return (
    <ScreenContainer className="p-6">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="gap-6">
          {/* ヘッダー */}
          <View>
            <Text className="text-3xl font-bold text-foreground">テキスト学習</Text>
            <Text className="text-base text-muted mt-2">
              CFAテキストの内容を理解し、例題を解いて知識を定着させましょう
            </Text>
          </View>

          {/* 統計情報 */}
          {statistics && (
            <View className="flex-row gap-3">
              <View
                style={{
                  flex: 1,
                  backgroundColor: colors.surface,
                  padding: 16,
                  borderRadius: 12,
                }}
              >
                <Text className="text-sm text-muted mb-1">学習済み</Text>
                <Text className="text-2xl font-bold text-foreground">
                  {statistics.masteredTexts + statistics.masteredExamples}
                </Text>
                <Text className="text-xs text-muted mt-1">
                  / {statistics.totalTexts + statistics.totalExamples}
                </Text>
              </View>
              <View
                style={{
                  flex: 1,
                  backgroundColor: colors.surface,
                  padding: 16,
                  borderRadius: 12,
                }}
              >
                <Text className="text-sm text-muted mb-1">復習予定</Text>
                <Text className="text-2xl font-bold text-foreground">
                  {totalReviewDue}
                </Text>
                <Text className="text-xs text-muted mt-1">
                  テキスト {statistics.reviewDueTexts} / 例題 {statistics.reviewDueExamples}
                </Text>
              </View>
            </View>
          )}

          {/* 復習ボタン */}
          {totalReviewDue > 0 && (
            <TouchableOpacity
              onPress={handleReviewPress}
              style={{
                backgroundColor: colors.primary,
                paddingVertical: 16,
                borderRadius: 12,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: colors.background, fontSize: 16, fontWeight: '600' }}>
                📚 復習を開始 ({totalReviewDue}件)
              </Text>
            </TouchableOpacity>
          )}

          {/* 科目選択 */}
          <View>
            <Text className="text-lg font-semibold text-foreground mb-3">科目</Text>
            <View className="flex-row flex-wrap gap-2">
              {subjects.map((subject) => (
                <TouchableOpacity
                  key={subject.code}
                  onPress={() => handleSubjectSelect(subject.code)}
                  style={{
                    backgroundColor:
                      selectedSubject === subject.code
                        ? colors.primary
                        : colors.surface,
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                    borderRadius: 8,
                  }}
                >
                  <Text
                    style={{
                      color:
                        selectedSubject === subject.code
                          ? colors.background
                          : colors.foreground,
                      fontWeight: "600",
                    }}
                  >
                    {subject.nameJa}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Reading一覧 */}
          {selectedSubject && (
            <View>
              <Text className="text-lg font-semibold text-foreground mb-3">
                章（Reading）
              </Text>
              <View className="gap-3">
                {readings.map((reading) => (
                  <TouchableOpacity
                    key={reading.id}
                    onPress={() => handleReadingPress(reading)}
                    style={{
                      backgroundColor: colors.surface,
                      padding: 16,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: colors.border,
                    }}
                  >
                    <Text className="text-lg font-semibold text-foreground">
                      {reading.titleJa}
                    </Text>
                    <Text className="text-sm text-muted mt-1">
                      {reading.title}
                    </Text>
                    {reading.descriptionJa && (
                      <Text className="text-sm text-muted mt-2">
                        {reading.descriptionJa}
                      </Text>
                    )}
                    <View className="flex-row gap-4 mt-3">
                      <Text className="text-sm text-muted">
                        📖 {reading.totalSections} セクション
                      </Text>
                      <Text className="text-sm text-muted">
                        📝 {reading.totalExamples} 例題
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
