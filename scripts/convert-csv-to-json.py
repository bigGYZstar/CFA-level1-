#!/usr/bin/env python3
"""Convert CSV data to JSON for the CFA vocab app."""
import csv
import json
import os

DATA_DIR = '/home/ubuntu/cfa-vocab-app/assets/data'

def convert_terms():
    terms = []
    with open(f'{DATA_DIR}/terms.csv', 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            term = {
                'term_id': row['term_id'],
                'topic_code': row['topic_code'],
                'en_canonical': row['en_canonical'],
                'en_aliases': [a.strip() for a in row['en_aliases'].split(';') if a.strip()] if row.get('en_aliases') else [],
                'abbreviations': [a.strip() for a in row['abbreviations'].split(';') if a.strip()] if row.get('abbreviations') else [],
                'jp_headword': row['jp_headword'],
                'jp_reading': row.get('jp_reading', ''),
                'jp_definition': row['jp_definition'],
                'key_points': [p.strip() for p in row['key_points'].split(';') if p.strip()] if row.get('key_points') else [],
                'pitfall': row.get('pitfall', ''),
                'formula': row.get('formula', ''),
            }
            terms.append(term)
    
    with open(f'{DATA_DIR}/terms.json', 'w', encoding='utf-8') as f:
        json.dump(terms, f, ensure_ascii=False, indent=2)
    
    print(f'Converted {len(terms)} terms')
    return terms

def convert_examples():
    examples = []
    with open(f'{DATA_DIR}/examples.csv', 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            example = {
                'term_id': row['term_id'],
                'example_en': row['example_en'],
                'example_jp': row['example_jp'],
            }
            examples.append(example)
    
    with open(f'{DATA_DIR}/examples.json', 'w', encoding='utf-8') as f:
        json.dump(examples, f, ensure_ascii=False, indent=2)
    
    print(f'Converted {len(examples)} examples')
    return examples

def convert_relations():
    relations = []
    with open(f'{DATA_DIR}/relations.csv', 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            relation = {
                'term_id': row['term_id'],
                'related_term_id': row['related_term_id'],
                'relation_type': row['relation_type'],
            }
            relations.append(relation)
    
    with open(f'{DATA_DIR}/relations.json', 'w', encoding='utf-8') as f:
        json.dump(relations, f, ensure_ascii=False, indent=2)
    
    print(f'Converted {len(relations)} relations')
    return relations

if __name__ == '__main__':
    convert_terms()
    convert_examples()
    convert_relations()
    print('Done!')
