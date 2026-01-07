#!/usr/bin/env python3
"""
提供された単語集の例文を使用して、現在のアプリの例文データを更新するスクリプト
"""
import json
import re
from pathlib import Path

# ファイルパス
PROVIDED_FILE = Path('/home/ubuntu/upload/Pasted_content.txt')
TERMS_FILE = Path('/home/ubuntu/cfa-vocab-app/assets/data/terms.json')
EXAMPLES_FILE = Path('/home/ubuntu/cfa-vocab-app/assets/data/examples.json')

def extract_examples_from_provided_file():
    """提供されたファイルから例文を抽出"""
    with open(PROVIDED_FILE, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 単語ごとに分割
    entries = re.split(r'\n---\n', content)
    
    examples_dict = {}
    for entry in entries:
        # 英語の正式名称を抽出
        en_match = re.search(r'###\s+\d+\.\s+([^（\(]+)', entry)
        if not en_match:
            continue
        
        en_term = en_match.group(1).strip()
        
        # 英語例文を抽出
        en_example_match = re.search(r'\*\*英語例文\*\*:\s+(.+)', entry)
        # 日本語例文を抽出
        jp_example_match = re.search(r'\*\*日本語例文\*\*:\s+(.+)', entry)
        
        if en_example_match and jp_example_match:
            en_example = en_example_match.group(1).strip()
            jp_example = jp_example_match.group(1).strip()
            
            # 正規化（小文字化、記号削除）
            normalized_key = re.sub(r'[^a-z0-9]', '', en_term.lower())
            examples_dict[normalized_key] = {
                'en_term': en_term,
                'en_example': en_example,
                'jp_example': jp_example
            }
    
    return examples_dict

def normalize_term(term):
    """用語を正規化（マッチング用）"""
    # 小文字化、記号削除
    return re.sub(r'[^a-z0-9]', '', term.lower())

def update_examples():
    """例文データを更新"""
    # 提供されたファイルから例文を抽出
    print("Extracting examples from provided file...")
    provided_examples = extract_examples_from_provided_file()
    print(f"Extracted {len(provided_examples)} examples from provided file")
    
    # 現在の用語データを読み込み
    print("\nLoading current terms...")
    with open(TERMS_FILE, 'r', encoding='utf-8') as f:
        terms = json.load(f)
    
    # 現在の例文データを読み込み
    print("Loading current examples...")
    with open(EXAMPLES_FILE, 'r', encoding='utf-8') as f:
        examples = json.load(f)
    
    # 用語IDと正規化された用語名のマッピングを作成
    term_mapping = {}
    for term in terms:
        normalized = normalize_term(term['en_canonical'])
        term_mapping[normalized] = term['term_id']
        
        # エイリアスもマッピング
        for alias in term.get('en_aliases', []):
            normalized_alias = normalize_term(alias)
            if normalized_alias not in term_mapping:
                term_mapping[normalized_alias] = term['term_id']
    
    # 例文を更新
    print("\nUpdating examples...")
    updated_count = 0
    added_jp_count = 0
    
    # 既存の例文を辞書化
    examples_dict = {ex['term_id']: ex for ex in examples}
    
    for normalized_key, provided_ex in provided_examples.items():
        if normalized_key in term_mapping:
            term_id = term_mapping[normalized_key]
            
            if term_id in examples_dict:
                # 既存の例文を更新
                old_ex = examples_dict[term_id]
                
                # 日本語例文が欠落している場合は追加
                if not old_ex.get('example_jp'):
                    old_ex['example_jp'] = provided_ex['jp_example']
                    added_jp_count += 1
                    print(f"  Added JP for {term_id}: {provided_ex['en_term']}")
                
                # 英語例文を更新（提供されたものの方が良質な場合）
                if len(provided_ex['en_example']) > len(old_ex.get('example_en', '')):
                    old_ex['example_en'] = provided_ex['en_example']
                    old_ex['example_jp'] = provided_ex['jp_example']
                    updated_count += 1
                    print(f"  Updated {term_id}: {provided_ex['en_term']}")
    
    # 更新された例文を保存
    updated_examples = list(examples_dict.values())
    
    print(f"\nSaving updated examples...")
    with open(EXAMPLES_FILE, 'w', encoding='utf-8') as f:
        json.dump(updated_examples, f, ensure_ascii=False, indent=2)
    
    print(f"\n✓ Updated {updated_count} examples")
    print(f"✓ Added Japanese translations for {added_jp_count} examples")
    print(f"✓ Total examples: {len(updated_examples)}")

if __name__ == '__main__':
    update_examples()
