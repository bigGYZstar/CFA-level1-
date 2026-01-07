import { useState, useEffect } from 'react';
import { ScrollView, Text, View, Pressable, StyleSheet, Alert, Modal } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { loadTerms, loadExamples, exportToAnkiTSV, loadSRSSettings, saveSRSSettings } from '@/lib/data-store';
import { ALGORITHMS, type AlgorithmInfo } from '@/lib/srs-algorithms';
import type { SRSAlgorithm } from '@/lib/types';
import * as Clipboard from 'expo-clipboard';

export default function SettingsScreen() {
  const [showEnglishFirst, setShowEnglishFirst] = useState(true);
  const [hideExample, setHideExample] = useState(false);
  const [hideTranslation, setHideTranslation] = useState(false);
  const [enableTTS, setEnableTTS] = useState(false);
  const [srsAlgorithm, setSrsAlgorithm] = useState<SRSAlgorithm>('sm2_anki');
  const [showAlgorithmModal, setShowAlgorithmModal] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const settings = await loadSRSSettings();
    setSrsAlgorithm(settings.algorithm);
  };

  const handleAlgorithmChange = async (algorithm: SRSAlgorithm) => {
    setSrsAlgorithm(algorithm);
    await saveSRSSettings({ algorithm });
    setShowAlgorithmModal(false);
    Alert.alert('設定を保存しました', `アルゴリズムを「${ALGORITHMS.find(a => a.id === algorithm)?.nameJp}」に変更しました。`);
  };

  const handleExportAnki = async () => {
    try {
      const terms = await loadTerms();
      const examples = await loadExamples();
      const tsv = exportToAnkiTSV(terms, examples);
      await Clipboard.setStringAsync(tsv);
      Alert.alert('エクスポート完了', 'Anki TSVデータをクリップボードにコピーしました。');
    } catch (error) {
      Alert.alert('エラー', 'エクスポートに失敗しました。');
    }
  };

  const handleBackup = () => {
    Alert.alert('バックアップ', 'この機能は近日公開予定です。');
  };

  const handleRestore = () => {
    Alert.alert('復元', 'この機能は近日公開予定です。');
  };

  const handleResetProgress = () => {
    Alert.alert(
      '学習進捗をリセット',
      'すべての学習進捗がリセットされます。この操作は取り消せません。',
      [
        { text: 'キャンセル', style: 'cancel' },
        { text: 'リセット', style: 'destructive', onPress: () => {
          // TODO: 実装
          Alert.alert('完了', '学習進捗をリセットしました。');
        }},
      ]
    );
  };

  const currentAlgorithm = ALGORITHMS.find(a => a.id === srsAlgorithm);

  return (
    <ScreenContainer className="bg-background">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View style={styles.container}>
          {/* ヘッダー */}
          <View style={styles.header}>
            <Text style={styles.title}>設定</Text>
          </View>

          {/* SRSアルゴリズム設定 */}
          <Text style={styles.sectionTitle}>復習アルゴリズム</Text>
          <View style={styles.section}>
            <Pressable
              style={({ pressed }) => [styles.algorithmRow, pressed && styles.pressed]}
              onPress={() => setShowAlgorithmModal(true)}
            >
              <View style={styles.algorithmIcon}>
                <IconSymbol name="brain" size={24} color="#4A90E2" />
              </View>
              <View style={styles.algorithmContent}>
                <Text style={styles.algorithmLabel}>{currentAlgorithm?.nameJp || 'SM2-Anki'}</Text>
                <Text style={styles.algorithmDesc} numberOfLines={2}>
                  {currentAlgorithm?.descriptionJp || ''}
                </Text>
              </View>
              <IconSymbol name="chevron.right" size={16} color="#687076" />
            </Pressable>
          </View>

          {/* 表示設定 */}
          <Text style={styles.sectionTitle}>表示設定</Text>
          <View style={styles.section}>
            <ToggleRow
              label="英語を先に表示"
              description="学習時に英語見出しを先に表示"
              value={showEnglishFirst}
              onToggle={() => setShowEnglishFirst(!showEnglishFirst)}
            />
            <ToggleRow
              label="例文を隠す"
              description="詳細画面で例文を初期非表示"
              value={hideExample}
              onToggle={() => setHideExample(!hideExample)}
            />
            <ToggleRow
              label="訳を隠す"
              description="詳細画面で日本語訳を初期非表示"
              value={hideTranslation}
              onToggle={() => setHideTranslation(!hideTranslation)}
            />
            <ToggleRow
              label="音声読み上げ"
              description="英語用語と例文をTTSで読み上げ"
              value={enableTTS}
              onToggle={() => setEnableTTS(!enableTTS)}
              isLast
            />
          </View>

          {/* データ管理 */}
          <Text style={styles.sectionTitle}>データ管理</Text>
          <View style={styles.section}>
            <ActionRow
              icon="paperplane.fill"
              label="Ankiエクスポート"
              description="TSV形式でクリップボードにコピー"
              onPress={handleExportAnki}
            />
            <ActionRow
              icon="arrow.clockwise"
              label="バックアップ"
              description="学習データをバックアップ"
              onPress={handleBackup}
            />
            <ActionRow
              icon="arrow.clockwise"
              label="復元"
              description="バックアップから復元"
              onPress={handleRestore}
              isLast
            />
          </View>

          {/* 危険な操作 */}
          <Text style={styles.sectionTitle}>その他</Text>
          <View style={styles.section}>
            <ActionRow
              icon="flag.fill"
              label="学習進捗をリセット"
              description="すべての学習履歴を削除"
              onPress={handleResetProgress}
              isDestructive
              isLast
            />
          </View>

          {/* アプリ情報 */}
          <View style={styles.appInfo}>
            <Text style={styles.appName}>CFA Level I 単語帳</Text>
            <Text style={styles.appVersion}>Version 1.0.0</Text>
          </View>
        </View>
      </ScrollView>

      {/* アルゴリズム選択モーダル */}
      <Modal
        visible={showAlgorithmModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAlgorithmModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>復習アルゴリズムを選択</Text>
              <Pressable
                style={({ pressed }) => [styles.modalClose, pressed && styles.pressed]}
                onPress={() => setShowAlgorithmModal(false)}
              >
                <IconSymbol name="xmark" size={24} color="#687076" />
              </Pressable>
            </View>
            
            <ScrollView style={styles.algorithmList}>
              {ALGORITHMS.map((algo) => (
                <AlgorithmOption
                  key={algo.id}
                  algorithm={algo}
                  isSelected={srsAlgorithm === algo.id}
                  onSelect={() => handleAlgorithmChange(algo.id)}
                />
              ))}
            </ScrollView>

            <View style={styles.algorithmNote}>
              <IconSymbol name="info.circle" size={16} color="#687076" />
              <Text style={styles.algorithmNoteText}>
                アルゴリズムを変更しても、既存の学習データは保持されます。
                新しいアルゴリズムは次回の復習から適用されます。
              </Text>
            </View>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

interface AlgorithmOptionProps {
  algorithm: AlgorithmInfo;
  isSelected: boolean;
  onSelect: () => void;
}

function AlgorithmOption({ algorithm, isSelected, onSelect }: AlgorithmOptionProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.algorithmOption,
        isSelected && styles.algorithmOptionSelected,
        pressed && styles.pressed,
      ]}
      onPress={onSelect}
    >
      <View style={styles.algorithmOptionContent}>
        <View style={styles.algorithmOptionHeader}>
          <Text style={[styles.algorithmOptionName, isSelected && styles.algorithmOptionNameSelected]}>
            {algorithm.nameJp}
          </Text>
          {algorithm.id === 'sm2_anki' && (
            <View style={styles.recommendedBadge}>
              <Text style={styles.recommendedBadgeText}>推奨</Text>
            </View>
          )}
        </View>
        <Text style={styles.algorithmOptionDesc}>{algorithm.descriptionJp}</Text>
      </View>
      <View style={[styles.radioOuter, isSelected && styles.radioOuterSelected]}>
        {isSelected && <View style={styles.radioInner} />}
      </View>
    </Pressable>
  );
}

interface ToggleRowProps {
  label: string;
  description: string;
  value: boolean;
  onToggle: () => void;
  isLast?: boolean;
}

function ToggleRow({ label, description, value, onToggle, isLast }: ToggleRowProps) {
  return (
    <Pressable
      style={[styles.row, !isLast && styles.rowBorder]}
      onPress={onToggle}
    >
      <View style={styles.rowContent}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowDesc}>{description}</Text>
      </View>
      <View style={[styles.toggle, value && styles.toggleActive]}>
        <View style={[styles.toggleKnob, value && styles.toggleKnobActive]} />
      </View>
    </Pressable>
  );
}

interface ActionRowProps {
  icon: any;
  label: string;
  description: string;
  onPress: () => void;
  isDestructive?: boolean;
  isLast?: boolean;
}

function ActionRow({ icon, label, description, onPress, isDestructive, isLast }: ActionRowProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.row,
        !isLast && styles.rowBorder,
        pressed && styles.pressed,
      ]}
      onPress={onPress}
    >
      <View style={[styles.rowIcon, isDestructive && styles.rowIconDestructive]}>
        <IconSymbol name={icon} size={20} color={isDestructive ? '#E74C3C' : '#4A90E2'} />
      </View>
      <View style={styles.rowContent}>
        <Text style={[styles.rowLabel, isDestructive && styles.rowLabelDestructive]}>{label}</Text>
        <Text style={styles.rowDesc}>{description}</Text>
      </View>
      <IconSymbol name="chevron.right" size={16} color="#687076" />
    </Pressable>
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
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#687076',
    marginBottom: 8,
    marginTop: 8,
    textTransform: 'uppercase',
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#F0F7FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rowIconDestructive: {
    backgroundColor: '#FFF0F0',
  },
  rowContent: {
    flex: 1,
  },
  rowLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1A1A1A',
  },
  rowLabelDestructive: {
    color: '#E74C3C',
  },
  rowDesc: {
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
  appInfo: {
    alignItems: 'center',
    marginTop: 24,
    paddingVertical: 16,
  },
  appName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  appVersion: {
    fontSize: 12,
    color: '#687076',
    marginTop: 4,
  },
  pressed: {
    opacity: 0.7,
    backgroundColor: '#F8F9FA',
  },
  // アルゴリズム選択行
  algorithmRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  algorithmIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#F0F7FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  algorithmContent: {
    flex: 1,
  },
  algorithmLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  algorithmDesc: {
    fontSize: 12,
    color: '#687076',
    marginTop: 4,
    lineHeight: 16,
  },
  // モーダル
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  modalClose: {
    padding: 4,
  },
  algorithmList: {
    padding: 16,
  },
  algorithmOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  algorithmOptionSelected: {
    borderColor: '#4A90E2',
    backgroundColor: '#F0F7FF',
  },
  algorithmOptionContent: {
    flex: 1,
  },
  algorithmOptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  algorithmOptionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  algorithmOptionNameSelected: {
    color: '#4A90E2',
  },
  algorithmOptionDesc: {
    fontSize: 13,
    color: '#687076',
    marginTop: 4,
    lineHeight: 18,
  },
  recommendedBadge: {
    backgroundColor: '#22C55E',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  recommendedBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  radioOuterSelected: {
    borderColor: '#4A90E2',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4A90E2',
  },
  algorithmNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    backgroundColor: '#F8F9FA',
    gap: 8,
  },
  algorithmNoteText: {
    flex: 1,
    fontSize: 12,
    color: '#687076',
    lineHeight: 18,
  },
});
