# データ仕様書

## 概要

このドキュメントは、CFA Level I単語帳アプリで使用されるデータ構造と仕様を詳細に説明します。

## データファイル

### 1. terms.json

**場所:** `assets/data/terms.json`

**説明:** CFA Level I試験の用語データ（384語）

**構造:**
```json
[
  {
    "term_id": "TERM0001",
    "topic_code": "ETH",
    "en_canonical": "Code of Ethics",
    "abbreviations": [],
    "jp_headword": "倫理規定",
    "jp_reading": "りんりきてい",
    "jp_definition": "CFA協会が定める、投資専門家が遵守すべき倫理的行動の基本原則",
    "key_points": [
      "7つの基本原則から構成される",
      "すべてのCFA会員とCFA受験者に適用される"
    ],
    "formula": null,
    "pitfall": null
  }
]
```

**フィールド説明:**

| フィールド | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| `term_id` | string | ✓ | 一意識別子（TERM0001〜TERM0384） |
| `topic_code` | string | ✓ | トピックコード（ETH, QM, ECON, FRA, EQ, FI, DER, ALT, PM） |
| `en_canonical` | string | ✓ | 英語正式名称 |
| `abbreviations` | string[] | ✓ | 略語リスト（空配列可） |
| `jp_headword` | string | ✓ | 日本語見出し |
| `jp_reading` | string | ✓ | 読み仮名（ひらがな） |
| `jp_definition` | string | ✓ | 日本語定義 |
| `key_points` | string[] | ✓ | 重要ポイント（空配列可） |
| `formula` | string \| null | ✓ | 公式（オプション） |
| `pitfall` | string \| null | ✓ | 混同注意（オプション） |

### 2. examples.json

**場所:** `assets/data/examples.json`

**説明:** 用語の例文データ（384件）

**構造:**
```json
[
  {
    "example_id": "EX0001",
    "term_id": "TERM0001",
    "example_en": "All CFA Institute members and candidates must comply with the Code of Ethics and Standards of Professional Conduct.",
    "example_jp": "すべてのCFA協会会員と受験者は、倫理規定と専門職行動基準を遵守しなければならない。"
  }
]
```

**フィールド説明:**

| フィールド | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| `example_id` | string | ✓ | 一意識別子（EX0001〜EX0384） |
| `term_id` | string | ✓ | 対応する用語のID |
| `example_en` | string | ✓ | 英語例文 |
| `example_jp` | string | ✓ | 日本語訳 |

### 3. relations.json

**場所:** `assets/data/relations.json`

**説明:** 用語間の関連データ

**構造:**
```json
[
  {
    "relation_id": "REL0001",
    "term_id": "TERM0001",
    "related_term_id": "TERM0002",
    "relation_type": "related"
  }
]
```

**フィールド説明:**

| フィールド | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| `relation_id` | string | ✓ | 一意識別子 |
| `term_id` | string | ✓ | 元の用語ID |
| `related_term_id` | string | ✓ | 関連する用語ID |
| `relation_type` | string | ✓ | 関連タイプ（`related` または `contrast`） |

**関連タイプ:**
- `related`: 類似・関連する用語
- `contrast`: 対比・対立する用語

## トピックコード

| コード | 名称 | 色 | 用語数 |
|--------|------|-----|--------|
| ETH | 倫理・職業行為基準 | #E74C3C | 10 |
| QM | 定量分析 | #3498DB | 20 |
| ECON | 経済学 | #2ECC71 | 20 |
| FRA | 財務報告・分析 | #F39C12 | 30 |
| EQ | 株式 | #9B59B6 | 30 |
| FI | 債券 | #1ABC9C | 30 |
| DER | デリバティブ | #E67E22 | 20 |
| ALT | オルタナティブ | #34495E | 20 |
| PM | ポートフォリオ管理 | #16A085 | 20 |

## 学習進捗データ

**保存場所:** AsyncStorage (`@cfa_vocab/progress`)

**構造:**
```json
{
  "TERM0001": {
    "term_id": "TERM0001",
    "review_count": 5,
    "correct_count": 4,
    "last_review": "2025-01-07T10:30:00.000Z",
    "next_review": "2025-01-14T10:30:00.000Z",
    "ease_factor": 2.5,
    "interval_days": 7,
    "is_bookmarked": false,
    "learning_step": 4,
    "lapses": 1,
    "stability": 7.0,
    "difficulty": 5.0
  }
}
```

**フィールド説明:**

| フィールド | 型 | 説明 |
|-----------|-----|------|
| `term_id` | string | 用語ID |
| `review_count` | number | 復習回数 |
| `correct_count` | number | 正解回数 |
| `last_review` | string \| undefined | 最終復習日時（ISO 8601） |
| `next_review` | string \| undefined | 次回復習日時（ISO 8601） |
| `ease_factor` | number | 難易度係数（SM2、1.3〜3.0） |
| `interval_days` | number | 復習間隔（日数） |
| `is_bookmarked` | boolean | ブックマーク状態 |
| `learning_step` | number | 学習ステップ（0=新規, 1=1分, 2=10分, 3=1日, 4=復習） |
| `lapses` | number | 失敗回数 |
| `stability` | number \| undefined | 記憶の安定性（FSRS） |
| `difficulty` | number \| undefined | 難易度（FSRS、1-10） |

## SRS設定データ

**保存場所:** AsyncStorage (`@cfa_vocab/srs_settings`)

**構造:**
```json
{
  "algorithm": "sm2-anki",
  "targetRetention": 0.9
}
```

**フィールド説明:**

| フィールド | 型 | 説明 |
|-----------|-----|------|
| `algorithm` | string | SRSアルゴリズム（`sm2-anki`, `fsrs`, `sm2`） |
| `targetRetention` | number | 目標保持率（FSRS用、0.8〜0.95） |

## 表示設定データ

**保存場所:** AsyncStorage (`@cfa_vocab/display_settings`)

**構造:**
```json
{
  "show_english_first": false,
  "auto_play_audio": false
}
```

**フィールド説明:**

| フィールド | 型 | 説明 |
|-----------|-----|------|
| `show_english_first` | boolean | 英語を先に表示するか |
| `auto_play_audio` | boolean | 自動音声再生 |

## データ検証

### バリデーションルール

1. **term_id**: `TERM` + 4桁の数字（例: TERM0001）
2. **example_id**: `EX` + 4桁の数字（例: EX0001）
3. **relation_id**: `REL` + 4桁の数字（例: REL0001）
4. **topic_code**: 有効なトピックコードのみ
5. **ease_factor**: 1.3〜3.0の範囲
6. **difficulty**: 1〜10の範囲
7. **targetRetention**: 0.8〜0.95の範囲

### バリデーション関数

```typescript
import { validateData } from '@/lib/data-store';

const result = validateData(terms, examples, relations);
if (result.isValid) {
  console.log('データは有効です');
} else {
  console.error('エラー:', result.errors);
}
```

## データ更新手順

### 1. 用語データの追加

1. `assets/data/terms.json`に新しい用語を追加
2. `term_id`は連番で採番（TERM0385〜）
3. すべての必須フィールドを入力

### 2. 例文データの追加

1. `assets/data/examples.json`に対応する例文を追加
2. `example_id`と`term_id`を一致させる

### 3. 関連語データの追加

1. `assets/data/relations.json`に関連を追加
2. `relation_type`は`related`または`contrast`

### 4. データ検証

```bash
pnpm test
```

## エクスポート機能

### Anki TSV形式

```typescript
import { exportToAnkiTSV } from '@/lib/data-store';

const tsv = exportToAnkiTSV(terms, examples);
// TSV形式でエクスポート
```

**出力形式:**
```
English Term	Japanese Term	Definition	Example (EN)	Example (JP)
Code of Ethics	倫理規定	CFA協会が定める...	All CFA Institute members...	すべてのCFA協会会員と...
```

## データ統計

### 現在の統計（2025-01-07時点）

- **総用語数**: 384語
- **例文数**: 384件
- **関連語数**: 約150件
- **トピック数**: 9科目
- **日本語訳完備**: 100%

### トピック別内訳

| トピック | 用語数 | 割合 |
|---------|--------|------|
| ETH | 10 | 2.6% |
| QM | 20 | 5.2% |
| ECON | 20 | 5.2% |
| FRA | 30 | 7.8% |
| EQ | 30 | 7.8% |
| FI | 30 | 7.8% |
| DER | 20 | 5.2% |
| ALT | 20 | 5.2% |
| PM | 20 | 5.2% |

## データ更新履歴

### 2025-01-07
- 156件の例文を実際の例文に更新
- 24件の日本語訳を追加
- 全384語の例文が完備

### 2025-01-06
- 初期データセット作成（384語）
- トピック別分類完了
- 関連語データ追加

## データライセンス

このデータセットは教育目的で作成されました。CFA Institute®の商標およびコンテンツは、CFA Institute®に帰属します。
