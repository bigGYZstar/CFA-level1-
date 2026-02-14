#!/usr/bin/env python3
"""
V2 Step 2: Using pre-fetched data, calculate 3 windows, max drawdown,
regression adjustment, and create rankings.
"""
import pandas as pd
import numpy as np
import pickle
import warnings
warnings.filterwarnings('ignore')
from sklearn.linear_model import LinearRegression

# ============================================================
# 1. LOAD DATA
# ============================================================
print("Loading data...")
returns_flags = pd.read_pickle('/home/ubuntu/boj_analysis/returns_with_flags.pkl')
extended_prices = pd.read_pickle('/home/ubuntu/boj_analysis/extended_prices.pkl')
topix_ext = pd.read_pickle('/home/ubuntu/boj_analysis/topix_extended.pkl')
macro_data = pd.read_pickle('/home/ubuntu/boj_analysis/macro_data.pkl')

usdjpy = macro_data['usdjpy']
sp500 = macro_data['sp500']
jgb10 = macro_data['jgb10_etf']

print(f"Stocks: {len(returns_flags)}, Extended prices: {len(extended_prices)}")
print(f"TOPIX ext dates: {list(topix_ext.index)}")

# ============================================================
# 2. EVENT DEFINITIONS
# ============================================================
events = {
    'event1': {
        'name': '2024/7/31',
        'date': '2024-07-31',
        'actual_hike_bp': 15,
        'expected_hike_bp': 5,
        'surprise_bp': 10,
        'ois_probability': 0.32,
        'window_dates': {
            't-1': '2024-07-30', 't0': '2024-07-31',
            't+1': '2024-08-01', 't+2': '2024-08-02',
            't+3': '2024-08-05', 't+4': '2024-08-06', 't+5': '2024-08-07',
        }
    },
    'event2': {
        'name': '2025/1/24',
        'date': '2025-01-24',
        'actual_hike_bp': 25,
        'expected_hike_bp': 22.5,
        'surprise_bp': 2.5,
        'ois_probability': 0.90,
        'window_dates': {
            't-1': '2025-01-23', 't0': '2025-01-24',
            't+1': '2025-01-27', 't+2': '2025-01-28',
            't+3': '2025-01-29', 't+4': '2025-01-30', 't+5': '2025-01-31',
        }
    },
    'event3': {
        'name': '2025/12/19',
        'date': '2025-12-19',
        'actual_hike_bp': 25,
        'expected_hike_bp': 24,
        'surprise_bp': 1,
        'ois_probability': 0.97,
        'window_dates': {
            't-1': '2025-12-18', 't0': '2025-12-19',
            't+1': '2025-12-22', 't+2': '2025-12-23',
            't+3': '2025-12-24', 't+4': '2025-12-25', 't+5': '2025-12-26',
        }
    }
}

# Check available dates in extended data
print("\nChecking date availability...")
for evt_name, evt_info in events.items():
    wd = evt_info['window_dates']
    print(f"  {evt_name}:")
    for label, d in wd.items():
        in_topix = d in topix_ext.index
        print(f"    {label} ({d}): TOPIX={'Y' if in_topix else 'N'}")

# ============================================================
# 3. HELPER FUNCTIONS
# ============================================================
def calc_return(prices_df, date_from, date_to):
    try:
        c_from = prices_df.loc[date_from, 'Close']
        c_to = prices_df.loc[date_to, 'Close']
        if pd.notna(c_from) and pd.notna(c_to) and c_from > 0:
            return (c_to / c_from - 1) * 100
    except:
        pass
    return np.nan

def calc_max_drawdown(prices_df, dates_list):
    closes = []
    for d in dates_list:
        try:
            c = prices_df.loc[d, 'Close']
            if pd.notna(c):
                closes.append(float(c))
        except:
            pass
    if len(closes) < 2:
        return np.nan
    peak = closes[0]
    max_dd = 0
    for c in closes[1:]:
        if c > peak:
            peak = c
        dd = (c - peak) / peak * 100
        if dd < max_dd:
            max_dd = dd
    return max_dd

def safe_get_window_dates(wd, window):
    """Get list of dates for a given window"""
    if window == 't0':
        return [wd['t-1'], wd['t0']]
    elif window == 't2':
        return [wd['t-1'], wd['t0'], wd['t+1'], wd['t+2']]
    elif window == 't5':
        return [wd['t-1'], wd['t0'], wd['t+1'], wd['t+2'], wd['t+3'], wd['t+4'], wd['t+5']]

def get_end_date(wd, window):
    if window == 't0':
        return wd['t0']
    elif window == 't2':
        return wd['t+2']
    elif window == 't5':
        return wd['t+5']

# ============================================================
# 4. CALCULATE RETURNS FOR ALL STOCKS
# ============================================================
print("\nCalculating returns for all stocks...")

results = []
for idx, row in returns_flags.iterrows():
    sym = row['symbol']
    r = {
        'symbol': sym, 'code': row['code'], 'name': row['name'],
        'sector_33': row['sector_33'], 'market_cap_100m': row['market_cap_100m'],
        'is_financial': row.get('is_financial', False),
    }
    
    for evt_name in ['event1', 'event2', 'event3']:
        r[f'{evt_name}_ir_flag'] = row.get(f'{evt_name}_ir_flag', False)
    
    prices = extended_prices.get(sym)
    
    for evt_name, evt_info in events.items():
        wd = evt_info['window_dates']
        
        r[f'{evt_name}_surprise_bp'] = evt_info['surprise_bp']
        r[f'{evt_name}_actual_bp'] = evt_info['actual_hike_bp']
        r[f'{evt_name}_expected_bp'] = evt_info['expected_hike_bp']
        r[f'{evt_name}_ois_prob'] = evt_info['ois_probability']
        
        for window in ['t0', 't2', 't5']:
            end_d = get_end_date(wd, window)
            dates_list = safe_get_window_dates(wd, window)
            
            # Stock return and MDD
            if prices is not None and len(prices) > 0:
                ret = calc_return(prices, wd['t-1'], end_d)
                mdd = calc_max_drawdown(prices, dates_list)
            else:
                ret = np.nan
                mdd = np.nan
            
            r[f'{evt_name}_ret_{window}'] = ret
            r[f'{evt_name}_mdd_{window}'] = mdd
            
            # TOPIX return
            topix_ret = calc_return(topix_ext, wd['t-1'], end_d)
            r[f'{evt_name}_topix_{window}'] = topix_ret
            
            # Relative return
            if pd.notna(ret) and pd.notna(topix_ret):
                r[f'{evt_name}_rel_{window}'] = ret - topix_ret
            else:
                r[f'{evt_name}_rel_{window}'] = np.nan
            
            # Macro returns
            for macro_name, macro_df in [('usdjpy', usdjpy), ('sp500', sp500), ('jgb', jgb10)]:
                r[f'{evt_name}_{macro_name}_{window}'] = calc_return(macro_df, wd['t-1'], end_d)
    
    results.append(r)

df = pd.DataFrame(results)
print(f"Results: {df.shape}")

# Quick data check
for evt_name in ['event1', 'event2', 'event3']:
    valid = df[f'{evt_name}_ret_t0'].notna().sum()
    print(f"  {evt_name} t0 valid: {valid}")

# ============================================================
# 5. REGRESSION ADJUSTMENT
# ============================================================
print("\nRegression adjustment...")

for window in ['t0', 't2', 't5']:
    # Pool all events for cross-sectional regression
    X_all, y_all, idx_all, evt_all = [], [], [], []
    
    for evt_name in ['event1', 'event2', 'event3']:
        for i, row in df.iterrows():
            ret = row.get(f'{evt_name}_rel_{window}')
            fx = row.get(f'{evt_name}_usdjpy_{window}')
            sp = row.get(f'{evt_name}_sp500_{window}')
            jg = row.get(f'{evt_name}_jgb_{window}')
            
            if all(pd.notna(v) for v in [ret, fx, sp, jg]):
                X_all.append([fx, sp, jg])
                y_all.append(ret)
                idx_all.append(i)
                evt_all.append(evt_name)
    
    if len(X_all) < 10:
        print(f"  {window}: insufficient data ({len(X_all)})")
        for evt_name in ['event1', 'event2', 'event3']:
            df[f'{evt_name}_adj_rel_{window}'] = df[f'{evt_name}_rel_{window}']
        continue
    
    X = np.array(X_all)
    y = np.array(y_all)
    
    reg = LinearRegression()
    reg.fit(X, y)
    
    print(f"  {window}: N={len(y)}, R²={reg.score(X, y):.4f}, "
          f"β_FX={reg.coef_[0]:.3f}, β_SP={reg.coef_[1]:.3f}, β_JGB={reg.coef_[2]:.3f}")
    
    # Initialize adj columns
    for evt_name in ['event1', 'event2', 'event3']:
        df[f'{evt_name}_adj_rel_{window}'] = np.nan
    
    # Calculate residuals
    y_pred = reg.predict(X)
    residuals = y - y_pred
    
    for k, (i, evt_name) in enumerate(zip(idx_all, evt_all)):
        df.at[i, f'{evt_name}_adj_rel_{window}'] = residuals[k]

# ============================================================
# 6. APPLY IR EXCLUSION
# ============================================================
print("\nApplying IR exclusion...")

for evt_name in ['event1', 'event2', 'event3']:
    flag = f'{evt_name}_ir_flag'
    for window in ['t0', 't2', 't5']:
        for prefix in ['adj_rel', 'rel', 'ret', 'mdd']:
            col = f'{evt_name}_{prefix}_{window}'
            excl_col = f'{evt_name}_{prefix}_{window}_excl'
            if col in df.columns:
                df[excl_col] = df[col].copy()
                df.loc[df[flag] == True, excl_col] = np.nan

# ============================================================
# 7. SUMMARY STATISTICS
# ============================================================
print("\nCalculating summary statistics...")

for window in ['t0', 't2', 't5']:
    for idx, row in df.iterrows():
        vals, mdds, wins, n = [], [], 0, 0
        for evt_name in ['event1', 'event2', 'event3']:
            v = row.get(f'{evt_name}_adj_rel_{window}_excl')
            m = row.get(f'{evt_name}_mdd_{window}_excl')
            if pd.notna(v):
                n += 1
                vals.append(v)
                if v >= 0:
                    wins += 1
            if pd.notna(m):
                mdds.append(m)
        
        df.at[idx, f'valid_n_{window}'] = n
        df.at[idx, f'win_n_{window}'] = wins
        df.at[idx, f'win_rate_{window}'] = wins / n if n > 0 else 0
        df.at[idx, f'avg_adj_{window}'] = np.mean(vals) if vals else np.nan
        df.at[idx, f'worst_adj_{window}'] = np.min(vals) if vals else np.nan
        df.at[idx, f'best_adj_{window}'] = np.max(vals) if vals else np.nan
        df.at[idx, f'worst_mdd_{window}'] = np.min(mdds) if mdds else np.nan

# ============================================================
# 8. RANKINGS
# ============================================================
print("\nCreating rankings...")

def make_ranking(subset, name, window='t2'):
    valid = subset[subset[f'valid_n_{window}'] >= 1].copy()
    valid = valid.sort_values(
        by=[f'worst_adj_{window}', f'win_n_{window}', f'avg_adj_{window}'],
        ascending=[False, False, False]
    )
    valid['rank'] = range(1, len(valid) + 1)
    print(f"  {name}: {len(valid)} stocks")
    return valid

fin_rank = make_ranking(df[df['is_financial'] == True], '金融')
nonfin_rank = make_ranking(df[df['is_financial'] == False], '非金融')

# Display
cols = ['rank', 'code', 'name', 'sector_33', 'market_cap_100m',
        'valid_n_t2', 'win_n_t2', 'worst_adj_t2', 'avg_adj_t2', 'worst_mdd_t2']
print("\n非金融 TOP 20:")
print(nonfin_rank[cols].head(20).to_string())
print("\n金融 TOP 10:")
print(fin_rank[cols].head(10).to_string())

# ============================================================
# 9. SAVE
# ============================================================
df.to_pickle('/home/ubuntu/boj_analysis/v2_full_results.pkl')
fin_rank.to_pickle('/home/ubuntu/boj_analysis/v2_fin_ranking.pkl')
nonfin_rank.to_pickle('/home/ubuntu/boj_analysis/v2_nonfin_ranking.pkl')
with open('/home/ubuntu/boj_analysis/v2_events_info.pkl', 'wb') as f:
    pickle.dump(events, f)

print("\nAll V2 data saved successfully.")
