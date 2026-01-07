#!/usr/bin/env python3
"""
エフェクトスプライトシートから個別のエフェクト画像を切り出す
グリッド線を正確に検出して切り出す
"""

from PIL import Image
import os
import numpy as np

def find_grid_lines(img):
    """グリッド線の位置を検出"""
    data = np.array(img.convert('RGB'))
    height, width = data.shape[:2]
    
    # グレーのグリッド線を検出（RGB値が近く、100-180の範囲）
    def is_grid_color(pixel):
        r, g, b = pixel[0], pixel[1], pixel[2]
        return abs(int(r) - int(g)) < 15 and abs(int(g) - int(b)) < 15 and 80 < r < 200
    
    # 縦線の検出
    vertical_lines = []
    for x in range(width):
        col = data[:, x]
        grid_count = sum(1 for pixel in col if is_grid_color(pixel))
        if grid_count > height * 0.3:  # 30%以上がグリッド色なら線
            vertical_lines.append(x)
    
    # 横線の検出
    horizontal_lines = []
    for y in range(height):
        row = data[y, :]
        grid_count = sum(1 for pixel in row if is_grid_color(pixel))
        if grid_count > width * 0.3:
            horizontal_lines.append(y)
    
    return vertical_lines, horizontal_lines

def extract_effects_v2():
    sheet_path = '/home/ubuntu/cfa-vocab-app/assets/sprites/effects/effects_spritesheet.png'
    output_dir = '/home/ubuntu/cfa-vocab-app/assets/sprites/effects'
    
    img = Image.open(sheet_path)
    width, height = img.size
    print(f"スプライトシートサイズ: {width}x{height}")
    
    # グリッド線を検出
    v_lines, h_lines = find_grid_lines(img)
    print(f"縦線: {len(v_lines)}本, 横線: {len(h_lines)}本")
    
    # 連続する線をグループ化
    def group_lines(lines, threshold=5):
        if not lines:
            return []
        groups = [[lines[0]]]
        for line in lines[1:]:
            if line - groups[-1][-1] <= threshold:
                groups[-1].append(line)
            else:
                groups.append([line])
        # 各グループの中央値を返す
        return [int(sum(g) / len(g)) for g in groups]
    
    v_positions = group_lines(v_lines)
    h_positions = group_lines(h_lines)
    
    print(f"縦線位置: {v_positions[:10]}...")
    print(f"横線位置: {h_positions[:10]}...")
    
    # 手動で正確な位置を指定（画像分析結果に基づく）
    # スプライトシートは3列×2行のグループ構成
    # 各グループは3×3のセル
    
    # 実際のセル境界を計算
    # グループ間のギャップを考慮
    
    # Physical Effects グループ（左上）の最初のセルから開始
    # 各セルは約160x160ピクセル
    
    cell_size = 160
    gap_between_groups = 20  # グループ間のギャップ
    
    # グループの開始位置
    groups = [
        (10, 25),    # Physical Effects (左上)
        (530, 25),   # Elemental Effects (中央上)
        (1050, 25),  # Status Effects (右上)
    ]
    
    def make_transparent(image):
        """白/グレー背景を透明にする"""
        image = image.convert('RGBA')
        data = list(image.getdata())
        new_data = []
        for item in data:
            r, g, b, a = item
            # 白を透明に
            if r > 245 and g > 245 and b > 245:
                new_data.append((255, 255, 255, 0))
            # グレー（グリッド線）を透明に
            elif abs(r - g) < 15 and abs(g - b) < 15 and 80 < r < 200:
                new_data.append((255, 255, 255, 0))
            else:
                new_data.append(item)
        image.putdata(new_data)
        return image
    
    # エフェクト定義（グループインデックス, 行, 列）
    effects_config = {
        'hit': (0, 0),       # Physical Effects, 1行目
        'slash': (0, 1),     # Physical Effects, 2行目
        'explosion': (0, 2), # Physical Effects, 3行目
        'fire': (1, 0),      # Elemental Effects, 1行目
        'ice': (1, 2),       # Elemental Effects, 3行目
        'spark': (2, 0),     # Status Effects, 1行目
    }
    
    # グリッド線の幅
    grid_line_width = 6
    
    for effect_name, (group_idx, row) in effects_config.items():
        group_x, group_y = groups[group_idx]
        
        for col in range(3):
            # セルの位置を計算（グリッド線を避ける）
            x = group_x + col * (cell_size + grid_line_width) + grid_line_width
            y = group_y + row * (cell_size + grid_line_width) + grid_line_width
            
            # 切り出し
            crop_box = (x, y, x + cell_size - grid_line_width, y + cell_size - grid_line_width)
            cropped = img.crop(crop_box)
            
            # 透過処理
            cropped = make_transparent(cropped)
            
            # 保存
            output_path = os.path.join(output_dir, f'{effect_name}_{col+1}.png')
            cropped.save(output_path)
            print(f"保存: {output_path}")

if __name__ == '__main__':
    extract_effects_v2()
