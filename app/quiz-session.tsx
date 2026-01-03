import { useEffect, useState } from 'react';
import { Text, View, Pressable, TextInput, StyleSheet, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { loadTerms, loadExamples, loadProgress, saveProgress, createInitialProgress, TOPICS } from '@/lib/data-store';
import type { Term, Example, LearningProgress, TopicCode, QuizQuestion, QuizResult } from '@/lib/types';

type QuizDirection = 'jp_to_en' | 'en_to_jp';

export default function QuizSessionScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ 
    topics?: string; 
    type?: string; 
    direction?: string;
    count?: string; 
    review?: string;
  }>();

  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [results, setResults] = useState<QuizResult[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [inputAnswer, setInputAnswer] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [progress, setProgress] = useState<Record<string, LearningProgress>>({});

  useEffect(() => {
    generateQuestions();
  }, []);

  async function generateQuestions() {
    const [allTerms, allExamples, allProgress] = await Promise.all([
      loadTerms(),
      loadExamples(),
      loadProgress(),
    ]);
    setProgress(allProgress);

    // パラメータ解析
    const topicCodes = params.topics?.split(',') as TopicCode[] || [];
    const questionType = params.type || 'multiple_choice';
    const quizDirection = (params.direction || 'jp_to_en') as QuizDirection;
    const questionCount = parseInt(params.count || '10', 10);
    const prioritizeReview = params.review === 'true';

    // 対象用語をフィルタリング
    let targetTerms = allTerms.filter(t => topicCodes.includes(t.topic_code));
    
    // 復習優先ならソート
    if (prioritizeReview) {
      const today = new Date().toISOString().split('T')[0];
      targetTerms.sort((a, b) => {
        const pa = allProgress[a.term_id];
        const pb = allProgress[b.term_id];
        const aReview = pa && pa.next_review <= today ? 0 : 1;
        const bReview = pb && pb.next_review <= today ? 0 : 1;
        return aReview - bReview;
      });
    } else {
      // シャッフル
      targetTerms = targetTerms.sort(() => Math.random() - 0.5);
    }

    // 出題数に制限
    targetTerms = targetTerms.slice(0, questionCount);

    // 問題生成
    const generatedQuestions: QuizQuestion[] = targetTerms.map(term => {
      const example = allExamples.find(e => e.term_id === term.term_id);
      
      if (questionType === 'multiple_choice') {
        if (quizDirection === 'jp_to_en') {
          // 日本語→英語：日本語定義から英語用語を選ぶ
          const correctAnswer = term.en_canonical;
          const otherTerms = allTerms
            .filter(t => t.term_id !== term.term_id && t.topic_code === term.topic_code)
            .sort(() => Math.random() - 0.5)
            .slice(0, 3);
          
          const options = [correctAnswer, ...otherTerms.map(t => t.en_canonical)]
            .sort(() => Math.random() - 0.5);

          return {
            term_id: term.term_id,
            question_type: 'multiple_choice',
            question_text: `「${term.jp_headword}」の英語名は？`,
            correct_answer: correctAnswer,
            options,
            explanation: term.jp_definition,
          };
        } else {
          // 英語→日本語：英語用語から日本語の意味を選ぶ
          const correctAnswer = term.jp_headword;
          const otherTerms = allTerms
            .filter(t => t.term_id !== term.term_id && t.topic_code === term.topic_code)
            .sort(() => Math.random() - 0.5)
            .slice(0, 3);
          
          const options = [correctAnswer, ...otherTerms.map(t => t.jp_headword)]
            .sort(() => Math.random() - 0.5);

          return {
            term_id: term.term_id,
            question_type: 'multiple_choice',
            question_text: `「${term.en_canonical}」の日本語名は？`,
            correct_answer: correctAnswer,
            options,
            explanation: term.jp_definition,
          };
        }
      } else if (questionType === 'input') {
        if (quizDirection === 'jp_to_en') {
          // 入力式：日本語から英語を入力
          return {
            term_id: term.term_id,
            question_type: 'input',
            question_text: `「${term.jp_headword}」の英語名を入力してください`,
            correct_answer: term.en_canonical,
            explanation: term.jp_definition,
          };
        } else {
          // 入力式：英語から日本語を入力
          return {
            term_id: term.term_id,
            question_type: 'input',
            question_text: `「${term.en_canonical}」の日本語名を入力してください`,
            correct_answer: term.jp_headword,
            explanation: term.jp_definition,
          };
        }
      } else {
        // 穴埋め：例文の空欄を埋める
        const questionText = example 
          ? example.example_en.replace(new RegExp(term.en_canonical, 'gi'), '______')
          : `The concept of ______ is important in ${term.topic_code}.`;
        
        return {
          term_id: term.term_id,
          question_type: 'fill_blank',
          question_text: questionText,
          correct_answer: term.en_canonical,
          explanation: example?.example_jp || term.jp_definition,
        };
      }
    });

    setQuestions(generatedQuestions);
  }

  const currentQuestion = questions[currentIndex];

  const handleAnswer = async () => {
    if (!currentQuestion) return;

    const userAnswer = currentQuestion.question_type === 'multiple_choice' 
      ? selectedOption || ''
      : inputAnswer;

    const isCorrect = userAnswer.toLowerCase().trim() === 
      currentQuestion.correct_answer.toLowerCase().trim();

    const result: QuizResult = {
      question: currentQuestion,
      user_answer: userAnswer,
      is_correct: isCorrect,
      time_taken: 0,
    };

    setResults([...results, result]);
    setShowResult(true);

    // 学習進捗を更新
    const termProgress = progress[currentQuestion.term_id] || createInitialProgress(currentQuestion.term_id);
    const updatedProgress = {
      ...termProgress,
      correct_count: isCorrect ? termProgress.correct_count + 1 : termProgress.correct_count,
      incorrect_count: !isCorrect ? termProgress.incorrect_count + 1 : termProgress.incorrect_count,
      is_difficult: !isCorrect ? true : termProgress.is_difficult,
    };
    const newProgress = { ...progress, [currentQuestion.term_id]: updatedProgress };
    await saveProgress(newProgress);
    setProgress(newProgress);
  };

  const nextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedOption(null);
      setInputAnswer('');
      setShowResult(false);
    } else {
      setIsComplete(true);
    }
  };

  // 結果画面
  if (isComplete) {
    const correctCount = results.filter(r => r.is_correct).length;
    const accuracy = Math.round((correctCount / results.length) * 100);
    const incorrectResults = results.filter(r => !r.is_correct);

    return (
      <ScreenContainer className="bg-background">
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          <View style={styles.resultContainer}>
            <View style={styles.resultHeader}>
              <Text style={styles.resultTitle}>クイズ完了！</Text>
              <View style={styles.scoreCircle}>
                <Text style={styles.scoreText}>{accuracy}%</Text>
              </View>
              <Text style={styles.scoreDetail}>
                {correctCount} / {results.length} 正解
              </Text>
            </View>

            {incorrectResults.length > 0 && (
              <View style={styles.incorrectSection}>
                <Text style={styles.sectionTitle}>間違えた問題</Text>
                {incorrectResults.map((result, index) => (
                  <View key={index} style={styles.incorrectItem}>
                    <Text style={styles.incorrectQuestion}>{result.question.question_text}</Text>
                    <Text style={styles.incorrectAnswer}>
                      正解: {result.question.correct_answer}
                    </Text>
                    <Text style={styles.incorrectUserAnswer}>
                      あなたの回答: {result.user_answer || '(未回答)'}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            <Pressable
              style={({ pressed }) => [styles.finishButton, pressed && styles.pressed]}
              onPress={() => router.back()}
            >
              <Text style={styles.finishButtonText}>終了</Text>
            </Pressable>
          </View>
        </ScrollView>
      </ScreenContainer>
    );
  }

  if (!currentQuestion) {
    return (
      <ScreenContainer className="bg-background">
        <View style={styles.loading}>
          <Text style={styles.loadingText}>問題を生成中...</Text>
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
          <IconSymbol name="xmark.circle.fill" size={24} color="#687076" />
        </Pressable>
        <Text style={styles.progressText}>{currentIndex + 1} / {questions.length}</Text>
      </View>

      {/* プログレスバー */}
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${((currentIndex + 1) / questions.length) * 100}%` }]} />
      </View>

      <View style={styles.questionContainer}>
        {/* 問題 */}
        <Text style={styles.questionText}>{currentQuestion.question_text}</Text>

        {/* 選択肢（四択） */}
        {currentQuestion.question_type === 'multiple_choice' && currentQuestion.options && (
          <View style={styles.optionList}>
            {currentQuestion.options.map((option, index) => {
              const isSelected = selectedOption === option;
              const isCorrect = showResult && option === currentQuestion.correct_answer;
              const isWrong = showResult && isSelected && !isCorrect;

              return (
                <Pressable
                  key={index}
                  style={[
                    styles.optionButton,
                    isSelected && styles.optionSelected,
                    isCorrect && styles.optionCorrect,
                    isWrong && styles.optionWrong,
                  ]}
                  onPress={() => !showResult && setSelectedOption(option)}
                  disabled={showResult}
                >
                  <Text style={[
                    styles.optionText,
                    (isCorrect || isWrong) && styles.optionTextResult,
                  ]}>{option}</Text>
                  {isCorrect && <IconSymbol name="checkmark.circle.fill" size={20} color="#22C55E" />}
                  {isWrong && <IconSymbol name="xmark.circle.fill" size={20} color="#E74C3C" />}
                </Pressable>
              );
            })}
          </View>
        )}

        {/* 入力欄（入力式・穴埋め） */}
        {(currentQuestion.question_type === 'input' || currentQuestion.question_type === 'fill_blank') && (
          <View style={styles.inputContainer}>
            <TextInput
              style={[
                styles.inputField,
                showResult && (inputAnswer.toLowerCase().trim() === currentQuestion.correct_answer.toLowerCase().trim()
                  ? styles.inputCorrect
                  : styles.inputWrong),
              ]}
              value={inputAnswer}
              onChangeText={setInputAnswer}
              placeholder="回答を入力..."
              placeholderTextColor="#9BA1A6"
              editable={!showResult}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {showResult && (
              <View style={styles.correctAnswerBox}>
                <Text style={styles.correctAnswerLabel}>正解:</Text>
                <Text style={styles.correctAnswerText}>{currentQuestion.correct_answer}</Text>
              </View>
            )}
          </View>
        )}

        {/* 解説（結果表示時） */}
        {showResult && (
          <View style={styles.explanationBox}>
            <Text style={styles.explanationLabel}>解説</Text>
            <Text style={styles.explanationText}>{currentQuestion.explanation}</Text>
          </View>
        )}

        {/* ボタン */}
        <View style={styles.buttonContainer}>
          {!showResult ? (
            <Pressable
              style={({ pressed }) => [
                styles.answerButton,
                pressed && styles.pressed,
                (!selectedOption && !inputAnswer) && styles.buttonDisabled,
              ]}
              onPress={handleAnswer}
              disabled={!selectedOption && !inputAnswer}
            >
              <Text style={styles.answerButtonText}>回答する</Text>
            </Pressable>
          ) : (
            <Pressable
              style={({ pressed }) => [styles.nextButton, pressed && styles.pressed]}
              onPress={nextQuestion}
            >
              <Text style={styles.nextButtonText}>
                {currentIndex < questions.length - 1 ? '次の問題' : '結果を見る'}
              </Text>
            </Pressable>
          )}
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 4,
  },
  progressText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 16,
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4A90E2',
    borderRadius: 2,
  },
  questionContainer: {
    flex: 1,
    padding: 16,
  },
  questionText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 24,
    lineHeight: 28,
  },
  optionList: {
    gap: 12,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  optionSelected: {
    borderColor: '#4A90E2',
    backgroundColor: '#F0F7FF',
  },
  optionCorrect: {
    borderColor: '#22C55E',
    backgroundColor: '#F0FDF4',
  },
  optionWrong: {
    borderColor: '#E74C3C',
    backgroundColor: '#FEF2F2',
  },
  optionText: {
    fontSize: 16,
    color: '#1A1A1A',
    flex: 1,
  },
  optionTextResult: {
    fontWeight: '600',
  },
  inputContainer: {
    gap: 12,
  },
  inputField: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    fontSize: 16,
    color: '#1A1A1A',
  },
  inputCorrect: {
    borderColor: '#22C55E',
    backgroundColor: '#F0FDF4',
  },
  inputWrong: {
    borderColor: '#E74C3C',
    backgroundColor: '#FEF2F2',
  },
  correctAnswerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F0FDF4',
    borderRadius: 8,
  },
  correctAnswerLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#22C55E',
    marginRight: 8,
  },
  correctAnswerText: {
    fontSize: 16,
    color: '#1A1A1A',
    fontWeight: '500',
  },
  explanationBox: {
    marginTop: 24,
    padding: 16,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
  },
  explanationLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#687076',
    marginBottom: 8,
  },
  explanationText: {
    fontSize: 14,
    color: '#1A1A1A',
    lineHeight: 20,
  },
  buttonContainer: {
    marginTop: 'auto',
    paddingTop: 24,
  },
  answerButton: {
    backgroundColor: '#4A90E2',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  answerButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  nextButton: {
    backgroundColor: '#22C55E',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  nextButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  buttonDisabled: {
    backgroundColor: '#E5E7EB',
  },
  pressed: {
    opacity: 0.8,
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
  resultContainer: {
    flex: 1,
    padding: 16,
  },
  resultHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  resultTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 24,
  },
  scoreCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#4A90E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  scoreText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  scoreDetail: {
    fontSize: 18,
    color: '#687076',
  },
  incorrectSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  incorrectItem: {
    backgroundColor: '#FEF2F2',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  incorrectQuestion: {
    fontSize: 14,
    color: '#1A1A1A',
    marginBottom: 8,
  },
  incorrectAnswer: {
    fontSize: 14,
    fontWeight: '600',
    color: '#22C55E',
    marginBottom: 4,
  },
  incorrectUserAnswer: {
    fontSize: 14,
    color: '#E74C3C',
  },
  finishButton: {
    backgroundColor: '#4A90E2',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  finishButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
