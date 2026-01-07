#!/usr/bin/env python3
"""
エフェクトスプライトシートから個別のエフェクト画像を切り出す
グリッド線の正確な位置に基づく
"""

from PIL import Image
import os

def extract_effects_accurate():
    sheet_path = '/home/ubuntu/cfa-vocab-app/assets/sprites/effects/effects_spritesheet.png'
    output_dir = '/home/ubuntu/cfa-vocab-app/assets/sprites/effects'
    
    img = Image.open(sheet_path)
    width, height = img.size
    print(f"スプライトシートサイズ: {width}x{height}")
    
    # 分析結果に基づくグリッド線の位置:
    # 縦グリッド線グループ: [(44, 51), (188, 194), (333, 338), (463, 469)]
    # 横グリッド線グループ: [(118, 125), (230, 235), (338, 343), (450, 455)]
    
    # セルの境界（グリッド線の内側）
    # 列1: 52-187, 列2: 195-332, 列3: 339-462
    # 行1: 126-229, 行2: 236-337, 行3: 344-449
    
    # ただし、最初の行は y=0 から始まる（上部にタイトルがある）
    # 実際のセル: 行0: 0-117, 行1: 126-229, 行2: 236-337
    
    # グループ1 (Physical Effects) - 上段
    # 縦: x=52-187, 195-332, 339-462
    # 横: y=0-117 (タイトル含む), 126-229, 236-337
    
    # 実際のエフェクトは y=50 あたりから始まる
    # セルの上部にタイトルテキストがある
    
    # グリッド線の位置から計算
    v_grids = [(44, 51), (188, 194), (333, 338), (463, 469)]  # グループ1
    v_grids2 = [(555, 561), (701, 706), (844, 849), (975, 980)]  # グループ2 (推定)
    v_grids3 = [(1069, 1075), (1212, 1218), (1341, 1347), (1482, 1488)]  # グループ3 (推定)
    
    h_grids = [(118, 125), (230, 235), (338, 343), (450, 455)]
    
    def get_cell(v_grids, h_grids, col, row):
        """セルの境界を取得"""
        x1 = v_grids[col][1] + 1
        x2 = v_grids[col + 1][0] - 1
        
        if row == 0:
            y1 = 0
            y2 = h_grids[0][0] - 1
        else:
            y1 = h_grids[row - 1][1] + 1
            y2 = h_grids[row][0] - 1
        
        return (x1, y1, x2, y2)
    
    def trim_transparent(image):
        """透明部分をトリミング"""
        bbox = image.getbbox()
        if bbox:
            return image.crop(bbox)
        return image
    
    # エフェクト定義
    effects = {
        # グループ1 (Physical Effects)
        'hit': [(v_grids, h_grids, 0, 0), (v_grids, h_grids, 1, 0), (v_grids, h_grids, 2, 0)],
        'slash': [(v_grids, h_grids, 0, 1), (v_grids, h_grids, 1, 1), (v_grids, h_grids, 2, 1)],
        'explosion': [(v_grids, h_grids, 0, 2), (v_grids, h_grids, 1, 2), (v_grids, h_grids, 2, 2)],
    }
    
    # グループ2のグリッド位置を追加
    v_grids2_full = [(555, 561), (701, 706), (844, 849), (975, 980)]
    effects['fire'] = [(v_grids2_full, h_grids, 0, 0), (v_grids2_full, h_grids, 1, 0), (v_grids2_full, h_grids, 2, 0)]
    effects['ice'] = [(v_grids2_full, h_grids, 0, 2), (v_grids2_full, h_grids, 1, 2), (v_grids2_full, h_grids, 2, 2)]
    
    # グループ3のグリッド位置を追加
    v_grids3_full = [(1069, 1075), (1212, 1218), (1341, 1347), (1482, 1488)]
    effects['spark'] = [(v_grids3_full, h_grids, 0, 0), (v_grids3_full, h_grids, 1, 0), (v_grids3_full, h_grids, 2, 0)]
    
    for effect_name, cells in effects.items():
        for i, (v_g, h_g, col, row) in enumerate(cells):
            bounds = get_cell(v_g, h_g, col, row)
            print(f"{effect_name}_{i+1}: bounds={bounds}")
            
            # 切り出し
            cropped = img.crop(bounds)
            
            # 透明部分をトリミング
            cropped = trim_transparent(cropped)
            
            if cropped:
                # 保存
                output_path = os.path.join(output_dir, f'{effect_name}_{i+1}.png')
                cropped.save(output_path)
                print(f"保存: {output_path} (サイズ: {cropped.size})")
            else:
                print(f"警告: {effect_name}_{i+1} は空です")

if __name__ == '__main__':
    extract_effects_accurate()
