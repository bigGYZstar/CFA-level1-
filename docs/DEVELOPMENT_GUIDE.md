# 開発ガイド

## 開発環境のセットアップ

### 必要な環境

- Node.js 22.x
- pnpm 9.x
- Expo Go アプリ（モバイルデバイス）

### インストール手順

```bash
# リポジトリのクローン
git clone https://github.com/bigGYZstar/CFA-level1-.git
cd CFA-level1-

# 依存関係のインストール
pnpm install

# 開発サーバーの起動
pnpm dev
```

### 開発サーバー

```bash
# Metro bundlerとAPIサーバーを同時起動
pnpm dev

# Metro bundlerのみ
pnpm dev:metro

# APIサーバーのみ
pnpm dev:server
```

### モバイルデバイスでの確認

1. Expo Goアプリをインストール
2. QRコードを生成: `pnpm qr`
3. Expo GoでQRコードをスキャン

## プロジェクト構造

### 画面の追加

新しい画面を追加する場合は、`app/`ディレクトリに配置します。

```typescript
// app/new-screen.tsx
import { ScreenContainer } from '@/components/screen-container';
import { Text } from 'react-native';

export default function NewScreen() {
  return (
    <ScreenContainer className="p-4">
      <Text className="text-2xl text-foreground">新しい画面</Text>
    </ScreenContainer>
  );
}
```

### コンポーネントの作成

再利用可能なコンポーネントは`components/`に配置します。

```typescript
// components/my-component.tsx
import { View, Text } from 'react-native';

interface MyComponentProps {
  title: string;
}

export function MyComponent({ title }: MyComponentProps) {
  return (
    <View className="p-4 bg-surface rounded-lg">
      <Text className="text-lg font-bold text-foreground">{title}</Text>
    </View>
  );
}
```

### カスタムフックの作成

カスタムフックは`hooks/`に配置します。

```typescript
// hooks/use-my-hook.ts
import { useState, useEffect } from 'react';

export function useMyHook() {
  const [data, setData] = useState<string | null>(null);

  useEffect(() => {
    // データ取得ロジック
  }, []);

  return { data };
}
```

## スタイリング

### NativeWind（Tailwind CSS）

```typescript
import { View, Text } from 'react-native';

export function StyledComponent() {
  return (
    <View className="flex-1 items-center justify-center bg-background">
      <Text className="text-2xl font-bold text-foreground">
        Hello World
      </Text>
    </View>
  );
}
```

### テーマカラー

`theme.config.js`でカラーパレットを定義:

```javascript
const themeColors = {
  primary: { light: '#0a7ea4', dark: '#0a7ea4' },
  background: { light: '#ffffff', dark: '#151718' },
  foreground: { light: '#11181C', dark: '#ECEDEE' },
  // ...
};
```

### useColorsフック

```typescript
import { useColors } from '@/hooks/use-colors';

export function MyComponent() {
  const colors = useColors();
  
  return (
    <View style={{ backgroundColor: colors.background }}>
      <Text style={{ color: colors.foreground }}>Text</Text>
    </View>
  );
}
```

## データ管理

### データの読み込み

```typescript
import { loadTerms, loadExamples, loadProgress } from '@/lib/data-store';

async function loadData() {
  const terms = await loadTerms();
  const examples = await loadExamples();
  const progress = await loadProgress();
  
  console.log(`Loaded ${terms.length} terms`);
}
```

### データの保存

```typescript
import { saveProgress } from '@/lib/data-store';

async function updateProgress(termId: string) {
  const progress = await loadProgress();
  progress[termId] = {
    ...progress[termId],
    review_count: (progress[termId]?.review_count || 0) + 1,
  };
  await saveProgress(progress);
}
```

### SRSアルゴリズムの使用

```typescript
import { calculateNextReview } from '@/lib/srs-algorithms';

const progress = {
  term_id: 'TERM0001',
  review_count: 5,
  correct_count: 4,
  ease_factor: 2.5,
  interval_days: 7,
  learning_step: 4,
  lapses: 0,
};

const result = calculateNextReview(progress, true, 'sm2-anki');
console.log('Next review:', result.next_review);
console.log('Interval:', result.interval_days, 'days');
```

## テスト

### ユニットテストの作成

```typescript
// lib/__tests__/my-function.test.ts
import { describe, it, expect } from 'vitest';
import { myFunction } from '../my-function';

describe('myFunction', () => {
  it('should return expected value', () => {
    const result = myFunction(10);
    expect(result).toBe(20);
  });
});
```

### テストの実行

```bash
# 全テストを実行
pnpm test

# ウォッチモード
pnpm test --watch

# 特定のファイルのみ
pnpm test lib/__tests__/my-function.test.ts
```

## デバッグ

### React Native Debugger

1. React Native Debuggerをインストール
2. 開発サーバー起動後、デバイスでシェイク
3. "Debug"を選択

### コンソールログ

```typescript
console.log('Debug info:', data);
console.error('Error:', error);
console.warn('Warning:', warning);
```

### TypeScriptエラーの確認

```bash
pnpm check
```

## ビルド

### 開発ビルド

```bash
# iOS
eas build --profile development --platform ios

# Android
eas build --profile development --platform android
```

### プロダクションビルド

```bash
# iOS
eas build --profile production --platform ios

# Android
eas build --profile production --platform android
```

## コーディング規約

### TypeScript

- 型定義は`lib/types.ts`に集約
- `any`型の使用は避ける
- インターフェースは`I`プレフィックスを付けない

### 命名規則

- コンポーネント: PascalCase（例: `MyComponent`）
- 関数: camelCase（例: `loadData`）
- 定数: UPPER_SNAKE_CASE（例: `MAX_RETRY_COUNT`）
- ファイル名: kebab-case（例: `my-component.tsx`）

### インポート順序

1. React関連
2. React Native関連
3. サードパーティライブラリ
4. プロジェクト内のコンポーネント
5. プロジェクト内のユーティリティ
6. 型定義

```typescript
import { useState, useEffect } from 'react';
import { View, Text } from 'react-native';
import { useRouter } from 'expo-router';

import { ScreenContainer } from '@/components/screen-container';
import { loadTerms } from '@/lib/data-store';
import type { Term } from '@/lib/types';
```

## パフォーマンス最適化

### FlatListの使用

長いリストは必ず`FlatList`を使用:

```typescript
import { FlatList } from 'react-native';

<FlatList
  data={terms}
  keyExtractor={(item) => item.term_id}
  renderItem={({ item }) => <TermCard term={item} />}
  getItemLayout={(data, index) => ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  })}
/>
```

### useMemoとuseCallback

```typescript
import { useMemo, useCallback } from 'react';

const filteredTerms = useMemo(() => {
  return terms.filter(t => t.topic_code === selectedTopic);
}, [terms, selectedTopic]);

const handlePress = useCallback(() => {
  // 処理
}, [dependency]);
```

## トラブルシューティング

### Metro bundlerのキャッシュクリア

```bash
pnpm start --clear
```

### node_modulesの再インストール

```bash
rm -rf node_modules
pnpm install
```

### TypeScriptエラーが消えない

```bash
rm -rf node_modules/.cache
pnpm check
```

### Expo Goで接続できない

1. 同じWi-Fiネットワークに接続しているか確認
2. ファイアウォールの設定を確認
3. トンネルモードを試す: `pnpm start --tunnel`

## よくある質問

### Q: 新しいアイコンを追加するには？

A: `components/ui/icon-symbol.tsx`のMAPPINGに追加:

```typescript
const MAPPING = {
  // ...
  "new.icon": "material-icon-name",
} as const;
```

### Q: 新しいトピックを追加するには？

A: `lib/data-store.ts`のTOPIC_BASEに追加:

```typescript
const TOPIC_BASE = [
  // ...
  { code: 'NEW', name: '新しいトピック', color: '#FF5733' },
];
```

### Q: AsyncStorageのデータをリセットするには？

A: 設定画面の「データをリセット」ボタンを使用するか、以下のコードを実行:

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

await AsyncStorage.removeItem('@cfa_vocab/progress');
```

## 参考リンク

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/)
- [NativeWind Documentation](https://www.nativewind.dev/)
- [TypeScript Documentation](https://www.typescriptlang.org/)
