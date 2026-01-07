#!/usr/bin/env python3
"""
エフェクトスプライトシートから個別のエフェクト画像を切り出す
スプライトシートは6つのグループに分かれている:
- Physical Effects (左上): hit, slash, explosion
- Elemental Effects (中央上): fire, ice (3x3グリッド)
- Status Effects (右上): spark等
- 下段も同様の構成
"""

from PIL import Image
import os

def extract_effects():
    # スプライトシートを読み込む
    sheet_path = '/home/ubuntu/cfa-vocab-app/assets/sprites/effects/effects_spritesheet.png'
    output_dir = '/home/ubuntu/cfa-vocab-app/assets/sprites/effects'
    
    img = Image.open(sheet_path)
    width, height = img.size
    print(f"スプライトシートサイズ: {width}x{height}")
    
    # 画像を分析してグリッド構造を特定
    # 上段の3つのグループと下段の3つのグループ
    # 各グループは3x3のグリッド
    
    # グリッドの位置を手動で指定（画像を分析した結果）
    # Physical Effects (左上グループ)
    physical_effects = {
        'hit': [(47, 47), (207, 47), (367, 47)],  # 1行目
        'slash': [(47, 207), (207, 207), (367, 207)],  # 2行目
        'explosion': [(47, 367), (207, 367), (367, 367)],  # 3行目
    }
    
    # Elemental Effects (中央上グループ)
    elemental_offset_x = 530
    elemental_effects = {
        'fire': [(elemental_offset_x + 47, 47), (elemental_offset_x + 207, 47), (elemental_offset_x + 367, 47)],
        'ice': [(elemental_offset_x + 47, 367), (elemental_offset_x + 207, 367), (elemental_offset_x + 367, 367)],
    }
    
    # Status Effects (右上グループ)
    status_offset_x = 1060
    status_effects = {
        'spark': [(status_offset_x + 47, 47), (status_offset_x + 207, 47), (status_offset_x + 367, 47)],
    }
    
    cell_size = 140  # 各セルのサイズ（グリッド線を除く）
    
    # より正確な切り出し - 画像を分析
    # スプライトシートの構造を再分析
    
    # 実際のグリッド位置を検出
    # 白/グレーの背景を透明にする
    def make_transparent(image):
        """白/グレー背景を透明にする"""
        image = image.convert('RGBA')
        data = image.getdata()
        new_data = []
        for item in data:
            # 白またはグレー（グリッド線含む）を透明に
            if item[0] > 240 and item[1] > 240 and item[2] > 240:  # 白
                new_data.append((255, 255, 255, 0))
            elif abs(item[0] - item[1]) < 10 and abs(item[1] - item[2]) < 10 and item[0] > 100 and item[0] < 180:  # グレー
                new_data.append((255, 255, 255, 0))
            else:
                new_data.append(item)
        image.putdata(new_data)
        return image
    
    # スプライトシートの実際の構造を分析
    # 6つのグループ（2行3列）
    # 各グループは3x3のセル
    
    # グループの位置（おおよそ）
    group_width = width // 3
    group_height = height // 2
    
    print(f"グループサイズ: {group_width}x{group_height}")
    
    # 各グループ内のセルサイズ
    cell_w = group_width // 3
    cell_h = group_height // 3
    
    print(f"セルサイズ: {cell_w}x{cell_h}")
    
    # エフェクト定義（グループ行, グループ列, セル行, セル列）
    effects_map = {
        # Physical Effects (グループ0,0)
        'hit': [(0, 0, 0, 0), (0, 0, 0, 1), (0, 0, 0, 2)],
        'slash': [(0, 0, 1, 0), (0, 0, 1, 1), (0, 0, 1, 2)],
        'explosion': [(0, 0, 2, 0), (0, 0, 2, 1), (0, 0, 2, 2)],
        # Elemental Effects (グループ0,1)
        'fire': [(0, 1, 0, 0), (0, 1, 0, 1), (0, 1, 0, 2)],
        'ice': [(0, 1, 2, 0), (0, 1, 2, 1), (0, 1, 2, 2)],
        # Status Effects (グループ0,2)
        'spark': [(0, 2, 0, 0), (0, 2, 0, 1), (0, 2, 0, 2)],
    }
    
    # パディング（グリッド線を避けるため）
    padding = 8
    
    for effect_name, positions in effects_map.items():
        for i, (group_row, group_col, cell_row, cell_col) in enumerate(positions):
            # 座標計算
            x = group_col * group_width + cell_col * cell_w + padding
            y = group_row * group_height + cell_row * cell_h + padding
            
            # 切り出しサイズ（パディングを考慮）
            crop_w = cell_w - padding * 2
            crop_h = cell_h - padding * 2
            
            # 切り出し
            crop_box = (x, y, x + crop_w, y + crop_h)
            cropped = img.crop(crop_box)
            
            # 透過処理
            cropped = make_transparent(cropped)
            
            # 保存
            output_path = os.path.join(output_dir, f'{effect_name}_{i+1}.png')
            cropped.save(output_path)
            print(f"保存: {output_path} ({crop_w}x{crop_h})")

if __name__ == '__main__':
    extract_effects()
