import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { textbookStore } from "@/lib/textbook-store";
import { SubjectInfo, ReadingInfo } from "@/lib/textbook-types";
import { useColors } from "@/hooks/use-colors";

/**
 * テキストブック学習のメイン画面
 */
export default function TextbookScreen() {
  const colors = useColors();
  const [subjects, setSubjects] = useState<SubjectInfo[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [readings, setReadings] = useState<ReadingInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    await textbookStore.initialize();
    const subjectList = textbookStore.getSubjects();
    setSubjects(subjectList);
    
    // デフォルトで最初の科目を選択
    if (subjectList.length > 0) {
      setSelectedSubject(subjectList[0].code);
      setReadings(textbookStore.getReadingsBySubject(subjectList[0].code));
    }
    setIsLoading(false);
  };

  const handleSubjectSelect = (subjectCode: string) => {
    setSelectedSubject(subjectCode);
    setReadings(textbookStore.getReadingsBySubject(subjectCode));
  };

  const handleReadingPress = (reading: ReadingInfo) => {
    router.push(`/textbook/reading/${reading.id}`);
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
