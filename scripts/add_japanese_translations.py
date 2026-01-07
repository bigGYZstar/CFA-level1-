#!/usr/bin/env python3
"""
欠落している日本語例文を追加するスクリプト
"""
import json
from pathlib import Path

EXAMPLES_FILE = Path('/home/ubuntu/cfa-vocab-app/assets/data/examples.json')

# 日本語訳を追加する例文
JAPANESE_TRANSLATIONS = {
    "TERM0203": "ブローカーは顧客に代わって売買注文を執行し、各取引ごとに手数料を得る。",
    "TERM0204": "ディーラーは有価証券の在庫を保有し、ビッド・アスク・スプレッドから利益を得る。",
    "TERM0205": "マーケットメーカーは、特定の有価証券に対してビッド価格とアスク価格を継続的に提示することで流動性を提供する。",
    "TERM0206": "狭いビッド・アスク・スプレッドは、高い流動性と投資家にとって低い取引コストを示す。",
    "TERM0209": "投資家は、株価が下落した場合の潜在的な損失を限定するために、45ドルでストップロス注文を発注する。",
    "TERM0210": "信用取引は投資家がポジションにレバレッジをかけることを可能にし、利益と損失の両方を増幅させる。",
    "TERM0211": "ダウ・ジョーンズ工業株平均は、株価の高い銘柄がより大きな影響力を持つ株価加重指数である。",
    "TERM0212": "S&P 500は、大企業がより大きなウェイトを持つ時価総額加重指数である。",
    "TERM0213": "等加重指数は、時価総額に関係なく、すべての構成銘柄に同じウェイトを与える。",
    "TERM0214": "指数のリバランスは、指数に追加または除外される銘柄に一時的な価格変動を引き起こす可能性がある。",
    "TERM0215": "純利益1億ドル、発行済株式数5,000万株の企業のEPSは2.00ドルである。",
    "TERM0216": "1株当たり純資産価値は、各株式に帰属する株主資本の会計上の価値を表す。",
    "TERM0217": "株価売上高倍率は、赤字企業の評価に有用である。",
    "TERM0218": "株価キャッシュフロー倍率は、PERよりも会計操作の影響を受けにくい。",
    "TERM0219": "EV/EBITDAは、異なる資本構成を持つ企業を比較するためにM&A分析で一般的に使用される。",
    "TERM0220": "PEGレシオが1.0未満であれば、その株式は成長見通しに対して割安である可能性を示唆する。",
    "TERM0221": "正当化PERはゴードン成長モデルから導出され、ファンダメンタル価値を反映する。",
    "TERM0222": "ターミナルバリューは、DCF分析における総価値の50%以上を占めることが多い。",
    "TERM0223": "要求収益率は、株式評価モデルにおいて割引率として使用される。",
    "TERM0224": "ROE15%、内部留保率60%の企業のサステイナブル成長率は9%である。",
    "TERM0225": "コーラブル株式は、発行者に所定の価格で株式を買い戻す権利を与える。",
    "TERM0226": "プッタブル株式は、投資家が発行者に株式を売り戻すことを可能にすることで、下値保護を提供する。",
    "TERM0227": "転換優先株式は、保有者が指定された比率で普通株式に転換することを可能にする。",
    "TERM0228": "累積優先株主は、普通株主が配当を受け取る前に、すべての未払い配当を受け取る必要がある。"
}

def add_japanese_translations():
    """日本語訳を追加"""
    # 現在の例文データを読み込み
    with open(EXAMPLES_FILE, 'r', encoding='utf-8') as f:
        examples = json.load(f)
    
    # 日本語訳を追加
    updated_count = 0
    for ex in examples:
        term_id = ex['term_id']
        if term_id in JAPANESE_TRANSLATIONS:
            if not ex.get('example_jp'):
                ex['example_jp'] = JAPANESE_TRANSLATIONS[term_id]
                updated_count += 1
                print(f"Added JP for {term_id}")
    
    # 保存
    with open(EXAMPLES_FILE, 'w', encoding='utf-8') as f:
        json.dump(examples, f, ensure_ascii=False, indent=2)
    
    print(f"\n✓ Added Japanese translations for {updated_count} examples")

if __name__ == '__main__':
    add_japanese_translations()
