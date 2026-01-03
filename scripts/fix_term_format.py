#!/usr/bin/env python3
"""新規追加用語のフィールド名を既存フォーマットに合わせて修正"""
import json

BASE_DIR = "/home/ubuntu/cfa-vocab-app/assets/data"

with open(f"{BASE_DIR}/terms.json", 'r', encoding='utf-8') as f:
    terms = json.load(f)

# 新規用語（TERM02xx）のフィールド名を変換
for term in terms:
    if term['term_id'].startswith('TERM02'):
        # フィールド名の変換
        term['en_canonical'] = term.pop('term_en', '')
        term['en_aliases'] = [term.pop('aliases', '')] if term.get('aliases') else []
        term['abbreviations'] = [term.pop('abbrev', '')] if term.get('abbrev') else []
        term['jp_headword'] = term.pop('term_ja', '')
        term['jp_reading'] = term.pop('reading', '')
        term['jp_definition'] = term.pop('definition', '')
        # key_pointsをリストに変換
        kp = term.get('key_points', '')
        term['key_points'] = [kp] if kp else []

# 保存
with open(f"{BASE_DIR}/terms.json", 'w', encoding='utf-8') as f:
    json.dump(terms, f, ensure_ascii=False, indent=2)

print("フォーマット修正完了")

# 確認
eq_terms = [t for t in terms if t['topic_code'] == 'EQ']
print(f"EQ用語数: {len(eq_terms)}")
print(f"合計用語数: {len(terms)}")
