#!/usr/bin/env python3
"""
V2 PNG: Create summary table images with regression-adjusted returns,
3 event windows, and max drawdown.
"""
import pandas as pd
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib import rcParams

plt.style.use('default')
rcParams['font.family'] = 'Noto Sans CJK JP'
rcParams['font.size'] = 9
rcParams['axes.unicode_minus'] = False

fin_rank = pd.read_pickle('/home/ubuntu/boj_analysis/v2_fin_ranking.pkl')
nonfin_rank = pd.read_pickle('/home/ubuntu/boj_analysis/v2_nonfin_ranking.pkl')

def fmt(val, f='%.2f'):
    return 'N/A' if pd.isna(val) else f % val

def bg(val, neg=-1, pos=1):
    if pd.isna(val): return '#F0F0F0'
    if val >= pos: return '#C6EFCE'
    if val <= neg: return '#FFC7CE'
    return '#FFFFFF'

def create_table(df, title, filename, max_rows=25):
    df = df.head(max_rows).copy()
    n = len(df)
    
    # Columns: rank, code, name, sector, mcap, valid, winrate,
    # worst_adj(t2), avg_adj(t2), worst_mdd(t2),
    # evt1_adj, evt2_adj, evt3_adj, flag
    columns = [
        ('順位', 3.5),
        ('コード', 4.5),
        ('銘柄名', 15),
        ('業種', 9),
        ('時価総額\n(億円)', 6.5),
        ('有効\nデータ', 3.5),
        ('勝率\n(t0~t+2)', 5),
        ('ワースト\n回帰調整\n(%)', 6.5),
        ('平均\n回帰調整\n(%)', 6.5),
        ('ワースト\nMDD\n(%)', 6),
        ('2024/7/31\n回帰調整\n(%)', 6.5),
        ('2025/1/24\n回帰調整\n(%)', 6.5),
        ('2025/12/19\n回帰調整\n(%)', 6.5),
        ('決算/IR\nフラグ', 6),
    ]
    
    col_names = [c[0] for c in columns]
    col_widths = [c[1] for c in columns]
    total_w = sum(col_widths)
    
    fig_w = 22
    fig_h = 1.8 + n * 0.36
    fig, ax = plt.subplots(figsize=(fig_w, fig_h))
    ax.set_xlim(0, total_w)
    ax.set_ylim(0, n + 2.5)
    ax.axis('off')
    
    fig.suptitle(title, fontsize=14, fontweight='bold', color='#2F5496', y=0.98)
    
    # Subtitle with surprise info
    sub = ('サプライズ: Event1=+10bp(大) / Event2=+2.5bp(小) / Event3=+1bp(織込済)  |  '
           '回帰調整: USD/JPY・S&P500・10Y JGB ETFの影響を除去した純利上げ耐性')
    ax.text(total_w/2, n + 1.8, sub, ha='center', va='center', fontsize=7.5, color='#555555')
    
    # Header
    x = 0
    hy = n + 1
    for cname, cw in columns:
        rect = plt.Rectangle((x, hy - 0.5), cw, 1, facecolor='#2F5496', edgecolor='white', linewidth=0.5)
        ax.add_patch(rect)
        ax.text(x + cw/2, hy, cname, ha='center', va='center', fontsize=7, fontweight='bold', color='white')
        x += cw
    
    # Data
    events_info = {'event1': '2024/7/31', 'event2': '2025/1/24', 'event3': '2025/12/19'}
    
    for i, (_, row) in enumerate(df.iterrows()):
        y = n - i
        row_bg = '#F8F9FA' if i % 2 == 0 else '#FFFFFF'
        
        rank = int(row.get('rank', i+1))
        code = str(row['code'])
        name = str(row['name'])
        if len(name) > 13: name = name[:12] + '…'
        sector = str(row['sector_33'])
        if len(sector) > 7: sector = sector[:6] + '…'
        mcap = fmt(row['market_cap_100m'], '%.0f')
        valid_n = str(int(row['valid_n_t2']))
        win_str = f"{int(row['win_n_t2'])}/{int(row['valid_n_t2'])}"
        worst_adj = row['worst_adj_t2']
        avg_adj = row['avg_adj_t2']
        worst_mdd = row['worst_mdd_t2']
        
        evt_adjs = []
        for en in ['event1', 'event2', 'event3']:
            evt_adjs.append(row.get(f'{en}_adj_rel_t2_excl'))
        
        flags = []
        for en, ei in events_info.items():
            if row.get(f'{en}_ir_flag', False):
                flags.append(ei[:7])
        flag_str = ','.join(flags) if flags else ''
        
        cells = [
            (str(rank), row_bg, 'center'),
            (code, row_bg, 'center'),
            (name, row_bg, 'left'),
            (sector, row_bg, 'left'),
            (mcap, row_bg, 'right'),
            (valid_n, row_bg, 'center'),
            (win_str, row_bg, 'center'),
            (fmt(worst_adj), bg(worst_adj, -1, 0), 'center'),
            (fmt(avg_adj), bg(avg_adj, -1, 1), 'center'),
            (fmt(worst_mdd), bg(worst_mdd, -10, -3), 'center'),
            (fmt(evt_adjs[0]), bg(evt_adjs[0], -2, 2), 'center'),
            (fmt(evt_adjs[1]), bg(evt_adjs[1], -2, 2), 'center'),
            (fmt(evt_adjs[2]), bg(evt_adjs[2], -2, 2), 'center'),
            (flag_str, '#FFEB9C' if flag_str else row_bg, 'center'),
        ]
        
        x = 0
        for j, ((text, bgc, align), (_, cw)) in enumerate(zip(cells, columns)):
            rect = plt.Rectangle((x, y - 0.5), cw, 1, facecolor=bgc, edgecolor='#D0D0D0', linewidth=0.3)
            ax.add_patch(rect)
            if align == 'left': tx, ha = x + 0.3, 'left'
            elif align == 'right': tx, ha = x + cw - 0.3, 'right'
            else: tx, ha = x + cw/2, 'center'
            fs = 7 if j in [2, 3] else 7.5
            ax.text(tx, y, text, ha=ha, va='center', fontsize=fs)
            x += cw
    
    note = ('注: 回帰調整 = 相対リターン(銘柄−TOPIX)からUSD/JPY・S&P500・10Y JGB ETFの影響を除去した残差 | '
            'MDD = 窓内Max Drawdown(ピーク→ボトム) | '
            'N/A = 決算・大型IR重複により除外 | '
            'データ出所: Yahoo Finance')
    ax.text(0, -0.7, note, fontsize=6.5, color='#666666', va='top')
    
    plt.tight_layout(rect=[0, 0.02, 1, 0.96])
    plt.savefig(filename, dpi=200, bbox_inches='tight', facecolor='white', edgecolor='none')
    plt.close()
    print(f"Saved: {filename}")

# Generate PNGs
nf50 = nonfin_rank.head(50)
create_table(nf50.head(25), '非金融セクター 利上げ耐性ランキング V2（1位〜25位）回帰調整版',
             '/home/ubuntu/boj_analysis/v2_summary_nonfin_1_25.png', 25)
create_table(nf50.tail(25), '非金融セクター 利上げ耐性ランキング V2（26位〜50位）回帰調整版',
             '/home/ubuntu/boj_analysis/v2_summary_nonfin_26_50.png', 25)
create_table(fin_rank.head(20), '金融セクター 利上げ耐性ランキング V2（上位20銘柄）回帰調整版',
             '/home/ubuntu/boj_analysis/v2_summary_financial_top20.png', min(20, len(fin_rank)))

print("\nAll V2 PNG files generated.")
