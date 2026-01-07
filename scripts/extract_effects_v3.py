#!/usr/bin/env python3
"""
エフェクトスプライトシートから個別のエフェクト画像を切り出す
検出されたグリッド線の位置を使用
"""

from PIL import Image
import os

def extract_effects_v3():
    sheet_path = '/home/ubuntu/cfa-vocab-app/assets/sprites/effects/effects_spritesheet.png'
    output_dir = '/home/ubuntu/cfa-vocab-app/assets/sprites/effects'
    
    img = Image.open(sheet_path)
    width, height = img.size
    print(f"スプライトシートサイズ: {width}x{height}")
    
    # 検出されたグリッド線の位置から、セルの境界を特定
    # 縦線位置: [48, 191, 335, 466, 559, 703, 846, 978, 1071, 1215, 1358, 1489]
    # 横線位置: [121, 232, 340, 451, 575, 689, 804, 914]
    
    # グループ1 (Physical Effects): x=0-466, セル境界 x=[48, 191, 335]
    # グループ2 (Elemental Effects): x=466-978, セル境界 x=[559, 703, 846]
    # グループ3 (Status Effects): x=978-1489, セル境界 x=[1071, 1215, 1358]
    
    # 各グループの行境界（上段）: y=[0, 121, 232, 340]
    # 下段: y=[451, 575, 689, 804]
    
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
            # グレー（グリッド線）を透明に
            elif abs(r - g) < 20 and abs(g - b) < 20 and 80 < r < 200:
                new_data.append((255, 255, 255, 0))
            else:
                new_data.append(item)
        image.putdata(new_data)
        return image
    
    # セルの境界を直接指定（グリッド線の内側）
    # Physical Effects (グループ1, 上段)
    physical_cells = [
        # 1行目 (hit)
        [(55, 10, 185, 115), (198, 10, 328, 115), (342, 10, 460, 115)],
        # 2行目 (slash)
        [(55, 128, 185, 225), (198, 128, 328, 225), (342, 128, 460, 225)],
        # 3行目 (explosion)
        [(55, 238, 185, 333), (198, 238, 328, 333), (342, 238, 460, 333)],
    ]
    
    # Elemental Effects (グループ2, 上段)
    elemental_cells = [
        # 1行目 (fire)
        [(566, 10, 696, 115), (710, 10, 840, 115), (853, 10, 971, 115)],
        # 2行目 (unused)
        [],
        # 3行目 (ice)
        [(566, 238, 696, 333), (710, 238, 840, 333), (853, 238, 971, 333)],
    ]
    
    # Status Effects (グループ3, 上段)
    status_cells = [
        # 1行目 (spark)
        [(1078, 10, 1208, 115), (1222, 10, 1352, 115), (1365, 10, 1483, 115)],
    ]
    
    effects_to_extract = [
        ('hit', physical_cells[0]),
        ('slash', physical_cells[1]),
        ('explosion', physical_cells[2]),
        ('fire', elemental_cells[0]),
        ('ice', elemental_cells[2]),
        ('spark', status_cells[0]),
    ]
    
    for effect_name, cells in effects_to_extract:
        for i, (x1, y1, x2, y2) in enumerate(cells):
            # 切り出し
            cropped = img.crop((x1, y1, x2, y2))
            
            # 透過処理
            cropped = make_transparent(cropped)
            
            # 保存
            output_path = os.path.join(output_dir, f'{effect_name}_{i+1}.png')
            cropped.save(output_path)
            print(f"保存: {output_path} ({x2-x1}x{y2-y1})")

if __name__ == '__main__':
    extract_effects_v3()
