import { useState, useEffect } from 'react';
import { Image } from 'expo-image';

// スプライト画像のパスリスト
const SPRITE_PATHS = [
  // PERスライム
  require('@/assets/sprites/enemies/pe_slime/idle_0.png'),
  require('@/assets/sprites/enemies/pe_slime/idle_1.png'),
  require('@/assets/sprites/enemies/pe_slime/idle_2.png'),
  require('@/assets/sprites/enemies/pe_slime/idle_3.png'),
  require('@/assets/sprites/enemies/pe_slime/attack_0.png'),
  require('@/assets/sprites/enemies/pe_slime/attack_1.png'),
  require('@/assets/sprites/enemies/pe_slime/attack_2.png'),
  require('@/assets/sprites/enemies/pe_slime/attack_3.png'),
  require('@/assets/sprites/enemies/pe_slime/damage_0.png'),
  require('@/assets/sprites/enemies/pe_slime/damage_1.png'),
  require('@/assets/sprites/enemies/pe_slime/damage_2.png'),
  require('@/assets/sprites/enemies/pe_slime/damage_3.png'),
  require('@/assets/sprites/enemies/pe_slime/death_0.png'),
  require('@/assets/sprites/enemies/pe_slime/death_1.png'),
  require('@/assets/sprites/enemies/pe_slime/death_2.png'),
  require('@/assets/sprites/enemies/pe_slime/death_3.png'),
  
  // 配当ゴブリン
  require('@/assets/sprites/enemies/goblin/idle_0.png'),
  require('@/assets/sprites/enemies/goblin/idle_1.png'),
  require('@/assets/sprites/enemies/goblin/idle_2.png'),
  require('@/assets/sprites/enemies/goblin/idle_3.png'),
  require('@/assets/sprites/enemies/goblin/attack_0.png'),
  require('@/assets/sprites/enemies/goblin/attack_1.png'),
  require('@/assets/sprites/enemies/goblin/attack_2.png'),
  require('@/assets/sprites/enemies/goblin/attack_3.png'),
  require('@/assets/sprites/enemies/goblin/damage_0.png'),
  require('@/assets/sprites/enemies/goblin/damage_1.png'),
  require('@/assets/sprites/enemies/goblin/damage_2.png'),
  require('@/assets/sprites/enemies/goblin/damage_3.png'),
  require('@/assets/sprites/enemies/goblin/death_0.png'),
  require('@/assets/sprites/enemies/goblin/death_1.png'),
  require('@/assets/sprites/enemies/goblin/death_2.png'),
  require('@/assets/sprites/enemies/goblin/death_3.png'),
  
  // バリュエーションゴーレム
  require('@/assets/sprites/enemies/golem/idle_0.png'),
  require('@/assets/sprites/enemies/golem/idle_1.png'),
  require('@/assets/sprites/enemies/golem/idle_2.png'),
  require('@/assets/sprites/enemies/golem/idle_3.png'),
  require('@/assets/sprites/enemies/golem/attack_0.png'),
  require('@/assets/sprites/enemies/golem/attack_1.png'),
  require('@/assets/sprites/enemies/golem/attack_2.png'),
  require('@/assets/sprites/enemies/golem/attack_3.png'),
  require('@/assets/sprites/enemies/golem/damage_0.png'),
  require('@/assets/sprites/enemies/golem/damage_1.png'),
  require('@/assets/sprites/enemies/golem/damage_2.png'),
  require('@/assets/sprites/enemies/golem/damage_3.png'),
  require('@/assets/sprites/enemies/golem/death_0.png'),
  require('@/assets/sprites/enemies/golem/death_1.png'),
  require('@/assets/sprites/enemies/golem/death_2.png'),
  require('@/assets/sprites/enemies/golem/death_3.png'),
  
  // DCFファントム
  require('@/assets/sprites/enemies/phantom/idle_0.png'),
  require('@/assets/sprites/enemies/phantom/idle_1.png'),
  require('@/assets/sprites/enemies/phantom/idle_2.png'),
  require('@/assets/sprites/enemies/phantom/idle_3.png'),
  require('@/assets/sprites/enemies/phantom/attack_0.png'),
  require('@/assets/sprites/enemies/phantom/attack_1.png'),
  require('@/assets/sprites/enemies/phantom/attack_2.png'),
  require('@/assets/sprites/enemies/phantom/attack_3.png'),
  require('@/assets/sprites/enemies/phantom/damage_0.png'),
  require('@/assets/sprites/enemies/phantom/damage_1.png'),
  require('@/assets/sprites/enemies/phantom/damage_2.png'),
  require('@/assets/sprites/enemies/phantom/damage_3.png'),
  require('@/assets/sprites/enemies/phantom/death_0.png'),
  require('@/assets/sprites/enemies/phantom/death_1.png'),
  require('@/assets/sprites/enemies/phantom/death_2.png'),
  require('@/assets/sprites/enemies/phantom/death_3.png'),
  
  // エフェクト
  require('@/assets/sprites/effects/hit_1.png'),
  require('@/assets/sprites/effects/hit_2.png'),
  require('@/assets/sprites/effects/hit_3.png'),
  require('@/assets/sprites/effects/slash_1.png'),
  require('@/assets/sprites/effects/slash_2.png'),
  require('@/assets/sprites/effects/slash_3.png'),
  require('@/assets/sprites/effects/explosion_1.png'),
  require('@/assets/sprites/effects/explosion_2.png'),
  require('@/assets/sprites/effects/explosion_3.png'),
  require('@/assets/sprites/effects/fire_1.png'),
  require('@/assets/sprites/effects/fire_2.png'),
  require('@/assets/sprites/effects/fire_3.png'),
  require('@/assets/sprites/effects/ice_1.png'),
  require('@/assets/sprites/effects/ice_2.png'),
  require('@/assets/sprites/effects/ice_3.png'),
  require('@/assets/sprites/effects/spark_1.png'),
  require('@/assets/sprites/effects/spark_2.png'),
  require('@/assets/sprites/effects/spark_3.png'),
];

/**
 * 敵スプライトとエフェクト画像を事前読み込みするフック
 * アプリ起動時に一度だけ実行し、画像をキャッシュに保存
 */
export function usePreloadSprites() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let isMounted = true;

    async function preloadImages() {
      try {
        // 画像を個別に事前読み込み
        const total = SPRITE_PATHS.length;
        let loaded = 0;
        
        for (const path of SPRITE_PATHS) {
          try {
            await Image.prefetch(path);
            loaded++;
            if (isMounted) {
              setProgress(Math.round((loaded / total) * 100));
            }
          } catch (err) {
            // 個別の画像のエラーは無視
            console.warn('Failed to prefetch image:', err);
          }
        }
        
        if (isMounted) {
          setIsLoaded(true);
          setProgress(100);
        }
      } catch (error) {
        console.error('Failed to preload sprites:', error);
        // エラーが発生してもアプリは動作するようにする
        if (isMounted) {
          setIsLoaded(true);
          setProgress(100);
        }
      }
    }

    preloadImages();

    return () => {
      isMounted = false;
    };
  }, []);

  return { isLoaded, progress };
}
