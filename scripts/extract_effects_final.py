#!/usr/bin/env python3
"""
エフェクトスプライトシートから個別のエフェクト画像を切り出す
分析結果に基づく正確な座標を使用
"""

from PIL import Image
import os

def extract_effects_final():
    sheet_path = '/home/ubuntu/cfa-vocab-app/assets/sprites/effects/effects_spritesheet.png'
    output_dir = '/home/ubuntu/cfa-vocab-app/assets/sprites/effects'
    
    img = Image.open(sheet_path)
    width, height = img.size
    print(f"スプライトシートサイズ: {width}x{height}")
    
    # 分析結果:
    # 縦グリッド線: x=44,50 | 188,194 | 333 | 463,469 (グループ1終了)
    #              x=555,561 | 701 | 844 | 975 (グループ2終了)
    #              x=1069,1075 | 1212,1218 | 1341,1347 | 1482,1488
    # 横グリッド線: y=118,124 | 230 | 338 | 450 (上段終了)
    #              y=572,578 | 686,692 | 802 | 912
    
    # セルの境界（グリッド線の内側）
    # グループ1 (Physical Effects)
    # 列: 51-187, 195-332, 334-462
    # 行: 0-117, 125-229, 231-337
    
    cells_group1 = {
        'hit': [
            (51, 0, 187, 117),
            (195, 0, 332, 117),
            (334, 0, 462, 117),
        ],
        'slash': [
            (51, 125, 187, 229),
            (195, 125, 332, 229),
            (334, 125, 462, 229),
        ],
        'explosion': [
            (51, 231, 187, 337),
            (195, 231, 332, 337),
            (334, 231, 462, 337),
        ],
    }
    
    # グループ2 (Elemental Effects)
    # 列: 562-700, 702-843, 845-974
    cells_group2 = {
        'fire': [
            (562, 0, 700, 117),
            (702, 0, 843, 117),
            (845, 0, 974, 117),
        ],
        'ice': [
            (562, 231, 700, 337),
            (702, 231, 843, 337),
            (845, 231, 974, 337),
        ],
    }
    
    # グループ3 (Status Effects)
    # 列: 1076-1211, 1219-1340, 1348-1481
    cells_group3 = {
        'spark': [
            (1076, 0, 1211, 117),
            (1219, 0, 1340, 117),
            (1348, 0, 1481, 117),
        ],
    }
    
    all_cells = {**cells_group1, **cells_group2, **cells_group3}
    
    def trim_transparent(image):
        """透明部分をトリミング"""
        bbox = image.getbbox()
        if bbox:
            return image.crop(bbox)
        return image
    
    for effect_name, cells in all_cells.items():
        for i, (x1, y1, x2, y2) in enumerate(cells):
            # 切り出し
            cropped = img.crop((x1, y1, x2, y2))
            
            # 透明部分をトリミング
            cropped = trim_transparent(cropped)
            
            # 保存
            output_path = os.path.join(output_dir, f'{effect_name}_{i+1}.png')
            cropped.save(output_path)
            print(f"保存: {output_path} (サイズ: {cropped.size})")

if __name__ == '__main__':
    extract_effects_final()
