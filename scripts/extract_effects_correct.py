#!/usr/bin/env python3
"""
エフェクトスプライトシートから個別のエフェクト画像を切り出す
分析結果: 最初の行はタイトル、エフェクトは2行目から
"""

from PIL import Image
import os

def extract_effects_correct():
    sheet_path = '/home/ubuntu/cfa-vocab-app/assets/sprites/effects/effects_spritesheet.png'
    output_dir = '/home/ubuntu/cfa-vocab-app/assets/sprites/effects'
    
    img = Image.open(sheet_path)
    width, height = img.size
    print(f"スプライトシートサイズ: {width}x{height}")
    
    # 分析結果:
    # - 最初の行（y=0-117）はタイトルテキスト
    # - エフェクトは2行目（y=126-229）から始まる
    # - 縦グリッド線: [(44, 51), (188, 194), (333, 338), (463, 469)]
    # - 横グリッド線: [(118, 125), (230, 235), (338, 343), (450, 455)]
    
    # セルの境界（グリッド線の内側）
    # グループ1 (Physical Effects): x=52-187, 195-332, 339-462
    # 行1: y=126-229 (slash)
    # 行2: y=236-337 (explosion)
    # 行3: y=344-449 (追加エフェクト)
    
    # 上段（y=0-450）と下段（y=512-）に分かれている
    # 下段のグリッド線: y=572-578, 686-692, 802-807, 912-917
    
    def trim_transparent(image):
        """透明部分をトリミング"""
        bbox = image.getbbox()
        if bbox:
            return image.crop(bbox)
        return image
    
    # グループ1 (Physical Effects) - 上段
    # 実際のエフェクトは y=126 から始まる
    effects_group1 = {
        'hit': [
            (52, 126, 187, 229),   # 行1
            (195, 126, 332, 229),
            (339, 126, 462, 229),
        ],
        'slash': [
            (52, 236, 187, 337),   # 行2
            (195, 236, 332, 337),
            (339, 236, 462, 337),
        ],
        'explosion': [
            (52, 344, 187, 449),   # 行3
            (195, 344, 332, 449),
            (339, 344, 462, 449),
        ],
    }
    
    # グループ2 (Elemental Effects) - 上段
    # x=562-700, 707-843, 850-974
    effects_group2 = {
        'fire': [
            (562, 126, 700, 229),
            (707, 126, 843, 229),
            (850, 126, 974, 229),
        ],
        'lightning': [
            (562, 236, 700, 337),
            (707, 236, 843, 337),
            (850, 236, 974, 337),
        ],
        'ice': [
            (562, 344, 700, 449),
            (707, 344, 843, 449),
            (850, 344, 974, 449),
        ],
    }
    
    # グループ3 (Status Effects) - 上段
    # x=1076-1211, 1219-1340, 1348-1481
    effects_group3 = {
        'spark': [
            (1076, 126, 1211, 229),
            (1219, 126, 1340, 229),
            (1348, 126, 1481, 229),
        ],
        'burn': [
            (1076, 236, 1211, 337),
            (1219, 236, 1340, 337),
            (1348, 236, 1481, 337),
        ],
        'freeze': [
            (1076, 344, 1211, 449),
            (1219, 344, 1340, 449),
            (1348, 344, 1481, 449),
        ],
    }
    
    all_effects = {**effects_group1, **effects_group2, **effects_group3}
    
    for effect_name, cells in all_effects.items():
        for i, bounds in enumerate(cells):
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
    extract_effects_correct()
