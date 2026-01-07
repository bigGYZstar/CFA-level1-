#!/usr/bin/env python3
"""
エフェクトスプライトシートから個別のエフェクト画像を切り出す
画像を詳細に分析して正確な座標を特定
"""

from PIL import Image
import os

def extract_effects_v4():
    sheet_path = '/home/ubuntu/cfa-vocab-app/assets/sprites/effects/effects_spritesheet.png'
    output_dir = '/home/ubuntu/cfa-vocab-app/assets/sprites/effects'
    
    img = Image.open(sheet_path)
    width, height = img.size
    print(f"スプライトシートサイズ: {width}x{height}")
    
    # 画像を分析: 1536x1024
    # 上段と下段に分かれている（各512px高さ）
    # 各段は3つのグループ（各約512px幅）
    # 各グループは3x3のセル
    # タイトルテキストが上部にある（約30px）
    
    # グループの正確な位置を計算
    # 上段: y=30から始まる
    # 各セルは約140x140px、グリッド線は約8px
    
    title_height = 30  # タイトルテキストの高さ
    group_gap_x = 25   # グループ間の水平ギャップ
    cell_size = 140    # セルのサイズ
    grid_line = 8      # グリッド線の幅
    
    # グループ1 (Physical Effects) の開始位置
    group1_x = 25
    group1_y = title_height + 10
    
    # グループ2 (Elemental Effects) の開始位置
    group2_x = group1_x + 3 * (cell_size + grid_line) + group_gap_x + 30
    group2_y = group1_y
    
    # グループ3 (Status Effects) の開始位置
    group3_x = group2_x + 3 * (cell_size + grid_line) + group_gap_x + 30
    group3_y = group1_y
    
    print(f"グループ1開始: ({group1_x}, {group1_y})")
    print(f"グループ2開始: ({group2_x}, {group2_y})")
    print(f"グループ3開始: ({group3_x}, {group3_y})")
    
    def get_cell_bounds(group_x, group_y, row, col):
        """セルの境界を計算"""
        x1 = group_x + col * (cell_size + grid_line) + grid_line
        y1 = group_y + row * (cell_size + grid_line) + grid_line
        x2 = x1 + cell_size - grid_line
        y2 = y1 + cell_size - grid_line
        return (x1, y1, x2, y2)
    
    def make_transparent(image):
        """白/グレー背景を透明にする"""
        image = image.convert('RGBA')
        data = list(image.getdata())
        new_data = []
        for item in data:
            r, g, b, a = item
            # 白を透明に
            if r > 240 and g > 240 and b > 240:
                new_data.append((255, 255, 255, 0))
            # グレー（グリッド線）を透明に - より広い範囲
            elif abs(r - g) < 25 and abs(g - b) < 25 and 70 < r < 210:
                new_data.append((255, 255, 255, 0))
            else:
                new_data.append(item)
        image.putdata(new_data)
        return image
    
    # エフェクト定義（グループ, 行）
    effects_config = [
        ('hit', group1_x, group1_y, 0),       # Physical Effects, 1行目
        ('slash', group1_x, group1_y, 1),     # Physical Effects, 2行目
        ('explosion', group1_x, group1_y, 2), # Physical Effects, 3行目
        ('fire', group2_x, group2_y, 0),      # Elemental Effects, 1行目
        ('ice', group2_x, group2_y, 2),       # Elemental Effects, 3行目
        ('spark', group3_x, group3_y, 0),     # Status Effects, 1行目
    ]
    
    for effect_name, gx, gy, row in effects_config:
        for col in range(3):
            bounds = get_cell_bounds(gx, gy, row, col)
            print(f"{effect_name}_{col+1}: bounds={bounds}")
            
            # 切り出し
            cropped = img.crop(bounds)
            
            # 透過処理
            cropped = make_transparent(cropped)
            
            # 保存
            output_path = os.path.join(output_dir, f'{effect_name}_{col+1}.png')
            cropped.save(output_path)
            print(f"保存: {output_path}")

if __name__ == '__main__':
    extract_effects_v4()
