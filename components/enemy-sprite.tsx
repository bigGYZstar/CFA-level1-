import { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Image } from 'expo-image';

// スプライトフレームの定義 - PERスライム
const PE_SLIME_FRAMES = {
  idle: [
    require('@/assets/sprites/enemies/pe_slime/idle_0.png'),
    require('@/assets/sprites/enemies/pe_slime/idle_1.png'),
    require('@/assets/sprites/enemies/pe_slime/idle_2.png'),
    require('@/assets/sprites/enemies/pe_slime/idle_3.png'),
  ],
  attack: [
    require('@/assets/sprites/enemies/pe_slime/attack_0.png'),
    require('@/assets/sprites/enemies/pe_slime/attack_1.png'),
    require('@/assets/sprites/enemies/pe_slime/attack_2.png'),
    require('@/assets/sprites/enemies/pe_slime/attack_3.png'),
  ],
  damage: [
    require('@/assets/sprites/enemies/pe_slime/damage_0.png'),
    require('@/assets/sprites/enemies/pe_slime/damage_1.png'),
    require('@/assets/sprites/enemies/pe_slime/damage_2.png'),
    require('@/assets/sprites/enemies/pe_slime/damage_3.png'),
  ],
  death: [
    require('@/assets/sprites/enemies/pe_slime/death_0.png'),
    require('@/assets/sprites/enemies/pe_slime/death_1.png'),
    require('@/assets/sprites/enemies/pe_slime/death_2.png'),
    require('@/assets/sprites/enemies/pe_slime/death_3.png'),
  ],
};

// スプライトフレームの定義 - 配当ゴブリン
const GOBLIN_FRAMES = {
  idle: [
    require('@/assets/sprites/enemies/goblin/idle_0.png'),
    require('@/assets/sprites/enemies/goblin/idle_1.png'),
    require('@/assets/sprites/enemies/goblin/idle_2.png'),
    require('@/assets/sprites/enemies/goblin/idle_3.png'),
  ],
  attack: [
    require('@/assets/sprites/enemies/goblin/attack_0.png'),
    require('@/assets/sprites/enemies/goblin/attack_1.png'),
    require('@/assets/sprites/enemies/goblin/attack_2.png'),
    require('@/assets/sprites/enemies/goblin/attack_3.png'),
  ],
  damage: [
    require('@/assets/sprites/enemies/goblin/damage_0.png'),
    require('@/assets/sprites/enemies/goblin/damage_1.png'),
    require('@/assets/sprites/enemies/goblin/damage_2.png'),
    require('@/assets/sprites/enemies/goblin/damage_3.png'),
  ],
  death: [
    require('@/assets/sprites/enemies/goblin/death_0.png'),
    require('@/assets/sprites/enemies/goblin/death_1.png'),
    require('@/assets/sprites/enemies/goblin/death_2.png'),
    require('@/assets/sprites/enemies/goblin/death_3.png'),
  ],
};

// スプライトフレームの定義 - バリュエーションゴーレム
const GOLEM_FRAMES = {
  idle: [
    require('@/assets/sprites/enemies/golem/idle_0.png'),
    require('@/assets/sprites/enemies/golem/idle_1.png'),
    require('@/assets/sprites/enemies/golem/idle_2.png'),
    require('@/assets/sprites/enemies/golem/idle_3.png'),
  ],
  attack: [
    require('@/assets/sprites/enemies/golem/attack_0.png'),
    require('@/assets/sprites/enemies/golem/attack_1.png'),
    require('@/assets/sprites/enemies/golem/attack_2.png'),
    require('@/assets/sprites/enemies/golem/attack_3.png'),
  ],
  damage: [
    require('@/assets/sprites/enemies/golem/damage_0.png'),
    require('@/assets/sprites/enemies/golem/damage_1.png'),
    require('@/assets/sprites/enemies/golem/damage_2.png'),
    require('@/assets/sprites/enemies/golem/damage_3.png'),
  ],
  death: [
    require('@/assets/sprites/enemies/golem/death_0.png'),
    require('@/assets/sprites/enemies/golem/death_1.png'),
    require('@/assets/sprites/enemies/golem/death_2.png'),
    require('@/assets/sprites/enemies/golem/death_3.png'),
  ],
};

// スプライトフレームの定義 - DCFファントム
const PHANTOM_FRAMES = {
  idle: [
    require('@/assets/sprites/enemies/phantom/idle_0.png'),
    require('@/assets/sprites/enemies/phantom/idle_1.png'),
    require('@/assets/sprites/enemies/phantom/idle_2.png'),
    require('@/assets/sprites/enemies/phantom/idle_3.png'),
  ],
  attack: [
    require('@/assets/sprites/enemies/phantom/attack_0.png'),
    require('@/assets/sprites/enemies/phantom/attack_1.png'),
    require('@/assets/sprites/enemies/phantom/attack_2.png'),
    require('@/assets/sprites/enemies/phantom/attack_3.png'),
  ],
  damage: [
    require('@/assets/sprites/enemies/phantom/damage_0.png'),
    require('@/assets/sprites/enemies/phantom/damage_1.png'),
    require('@/assets/sprites/enemies/phantom/damage_2.png'),
    require('@/assets/sprites/enemies/phantom/damage_3.png'),
  ],
  death: [
    require('@/assets/sprites/enemies/phantom/death_0.png'),
    require('@/assets/sprites/enemies/phantom/death_1.png'),
    require('@/assets/sprites/enemies/phantom/death_2.png'),
    require('@/assets/sprites/enemies/phantom/death_3.png'),
  ],
};

// 敵IDとスプライトのマッピング
const ENEMY_SPRITE_MAP: Record<string, typeof PE_SLIME_FRAMES | null> = {
  eq1: PE_SLIME_FRAMES,   // PERスライム
  eq2: GOBLIN_FRAMES,     // 配当ゴブリン
  eq3: GOLEM_FRAMES,      // バリュエーションゴーレム
  eq4: PHANTOM_FRAMES,    // DCFファントム
  // 他の敵は同じスプライトを再利用
  eth1: GOBLIN_FRAMES,    // コンプラゴブリン
  eth2: PE_SLIME_FRAMES,  // 倫理スライム
  qm1: GOLEM_FRAMES,      // 統計ゴーレム
  qm2: PHANTOM_FRAMES,    // 確率ファントム
};

// エフェクトフレームの定義
export const EFFECT_FRAMES = {
  hit: [
    require('@/assets/sprites/effects/hit_1.png'),
    require('@/assets/sprites/effects/hit_2.png'),
    require('@/assets/sprites/effects/hit_3.png'),
  ],
  slash: [
    require('@/assets/sprites/effects/slash_1.png'),
    require('@/assets/sprites/effects/slash_2.png'),
    require('@/assets/sprites/effects/slash_3.png'),
  ],
  explosion: [
    require('@/assets/sprites/effects/explosion_1.png'),
    require('@/assets/sprites/effects/explosion_2.png'),
    require('@/assets/sprites/effects/explosion_3.png'),
  ],
  fire: [
    require('@/assets/sprites/effects/fire_1.png'),
    require('@/assets/sprites/effects/fire_2.png'),
    require('@/assets/sprites/effects/fire_3.png'),
  ],
  ice: [
    require('@/assets/sprites/effects/ice_1.png'),
    require('@/assets/sprites/effects/ice_2.png'),
    require('@/assets/sprites/effects/ice_3.png'),
  ],
  spark: [
    require('@/assets/sprites/effects/spark_1.png'),
    require('@/assets/sprites/effects/spark_2.png'),
    require('@/assets/sprites/effects/spark_3.png'),
  ],
};

export type AnimationState = 'idle' | 'attack' | 'damage' | 'death';
export type EffectType = 'hit' | 'slash' | 'explosion' | 'fire' | 'ice' | 'spark';

interface EnemySpriteProps {
  enemyId: string;
  animation: AnimationState;
  size?: number;
  onAnimationComplete?: () => void;
}

// アニメーション速度（ミリ秒/フレーム）
const ANIMATION_SPEEDS: Record<AnimationState, number> = {
  idle: 300,
  attack: 150,
  damage: 100,
  death: 200,
};

// ループするアニメーション
const LOOPING_ANIMATIONS: AnimationState[] = ['idle'];

export function EnemySprite({ 
  enemyId, 
  animation, 
  size = 120,
  onAnimationComplete 
}: EnemySpriteProps) {
  const [currentFrame, setCurrentFrame] = useState(0);
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  
  // スプライトが存在するか確認
  const spriteFrames = ENEMY_SPRITE_MAP[enemyId];
  const hasSprite = spriteFrames !== undefined && spriteFrames !== null;
  
  // フレームアニメーション
  useEffect(() => {
    if (!hasSprite || !spriteFrames) return;
    
    const frames = spriteFrames[animation];
    const speed = ANIMATION_SPEEDS[animation];
    const isLooping = LOOPING_ANIMATIONS.includes(animation);
    
    setCurrentFrame(0);
    
    const interval = setInterval(() => {
      setCurrentFrame(prev => {
        const nextFrame = prev + 1;
        if (nextFrame >= frames.length) {
          if (isLooping) {
            return 0;
          } else {
            clearInterval(interval);
            onAnimationComplete?.();
            return prev;
          }
        }
        return nextFrame;
      });
    }, speed);
    
    return () => clearInterval(interval);
  }, [animation, hasSprite, spriteFrames, onAnimationComplete]);
  
  // アイドル時のバウンスアニメーション
  useEffect(() => {
    if (animation === 'idle') {
      const bounce = Animated.loop(
        Animated.sequence([
          Animated.timing(bounceAnim, {
            toValue: -8,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(bounceAnim, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      );
      bounce.start();
      return () => bounce.stop();
    } else {
      bounceAnim.setValue(0);
    }
  }, [animation, bounceAnim]);
  
  // ダメージ時のシェイクアニメーション
  useEffect(() => {
    if (animation === 'damage') {
      const shake = Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
      ]);
      shake.start();
      return () => shake.stop();
    } else {
      shakeAnim.setValue(0);
    }
  }, [animation, shakeAnim]);
  
  // 死亡時のフェードアウト
  useEffect(() => {
    if (animation === 'death') {
      fadeAnim.setValue(1);
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 800,
        delay: 400,
        useNativeDriver: true,
      }).start();
    } else {
      fadeAnim.setValue(1);
    }
  }, [animation, fadeAnim]);
  
  // スプライトがない敵は絵文字表示
  if (!hasSprite || !spriteFrames) {
    return (
      <Animated.View 
        style={[
          styles.container,
          { 
            width: size, 
            height: size,
            transform: [
              { translateY: bounceAnim },
              { translateX: shakeAnim },
            ],
            opacity: fadeAnim,
          }
        ]}
      >
        <View style={[styles.emojiContainer, { width: size, height: size }]}>
          <EnemyEmoji enemyId={enemyId} size={size * 0.6} />
        </View>
      </Animated.View>
    );
  }
  
  const frames = spriteFrames[animation];
  const frameSource = frames[Math.min(currentFrame, frames.length - 1)];
  
  return (
    <Animated.View 
      style={[
        styles.container,
        { 
          width: size, 
          height: size,
          transform: [
            { translateY: bounceAnim },
            { translateX: shakeAnim },
          ],
          opacity: fadeAnim,
        }
      ]}
    >
      <Image 
        source={frameSource}
        style={{ width: size, height: size }}
        contentFit="contain"
        cachePolicy="memory-disk"
        priority="high"
      />
    </Animated.View>
  );
}

// エフェクトアニメーションコンポーネント
interface BattleEffectProps {
  type: EffectType;
  size?: number;
  onComplete?: () => void;
}

export function BattleEffect({ type, size = 100, onComplete }: BattleEffectProps) {
  const [currentFrame, setCurrentFrame] = useState(0);
  const [visible, setVisible] = useState(true);
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;
  
  const frames = EFFECT_FRAMES[type];
  
  useEffect(() => {
    // スケールアニメーション
    Animated.timing(scaleAnim, {
      toValue: 1.2,
      duration: 200,
      useNativeDriver: true,
    }).start();
    
    // フレームアニメーション
    const interval = setInterval(() => {
      setCurrentFrame(prev => {
        const nextFrame = prev + 1;
        if (nextFrame >= frames.length) {
          clearInterval(interval);
          // フェードアウト
          Animated.timing(opacityAnim, {
            toValue: 0,
            duration: 100,
            useNativeDriver: true,
          }).start(() => {
            setVisible(false);
            onComplete?.();
          });
          return prev;
        }
        return nextFrame;
      });
    }, 80);
    
    return () => clearInterval(interval);
  }, [frames.length, onComplete, scaleAnim, opacityAnim]);
  
  if (!visible) return null;
  
  const frameSource = frames[Math.min(currentFrame, frames.length - 1)];
  
  return (
    <Animated.View 
      style={[
        styles.effectContainer,
        {
          transform: [{ scale: scaleAnim }],
          opacity: opacityAnim,
        }
      ]}
    >
      <Image 
        source={frameSource}
        style={{ width: size, height: size }}
        contentFit="contain"
        cachePolicy="memory-disk"
        priority="high"
      />
    </Animated.View>
  );
}

// プレイヤーダメージエフェクトコンポーネント
interface PlayerDamageEffectProps {
  onComplete?: () => void;
}

export function PlayerDamageEffect({ onComplete }: PlayerDamageEffectProps) {
  const flashAnim = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    // 画面フラッシュ
    const flash = Animated.sequence([
      Animated.timing(flashAnim, { toValue: 0.5, duration: 50, useNativeDriver: true }),
      Animated.timing(flashAnim, { toValue: 0, duration: 100, useNativeDriver: true }),
      Animated.timing(flashAnim, { toValue: 0.3, duration: 50, useNativeDriver: true }),
      Animated.timing(flashAnim, { toValue: 0, duration: 100, useNativeDriver: true }),
    ]);
    
    // 画面シェイク
    const shake = Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 5, duration: 30, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -5, duration: 30, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 5, duration: 30, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -5, duration: 30, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 30, useNativeDriver: true }),
    ]);
    
    Animated.parallel([flash, shake]).start(() => {
      onComplete?.();
    });
  }, [flashAnim, shakeAnim, onComplete]);
  
  return (
    <>
      <Animated.View 
        style={[
          styles.damageOverlay,
          { opacity: flashAnim }
        ]}
        pointerEvents="none"
      />
      <Animated.View 
        style={[
          styles.shakeContainer,
          { transform: [{ translateX: shakeAnim }] }
        ]}
      />
    </>
  );
}

// 絵文字フォールバック用コンポーネント
function EnemyEmoji({ enemyId, size }: { enemyId: string; size: number }) {
  const emojiMap: Record<string, string> = {
    eq1: '🟢',
    eq2: '👺',
    eq3: '🗿',
    eq4: '👻',
    eth1: '👺',
    eth2: '🟢',
    qm1: '🗿',
    qm2: '👻',
    econ1: '🐉',
    econ2: '😈',
    fsa1: '🦁',
    fsa2: '💀',
    fi1: '🐲',
    fi2: '🐍',
    der1: '👹',
    der2: '🔥',
    pm1: '🏔️',
    pm2: '👑',
    boss_eq1: '👑',
    boss_eq2: '🐉',
    boss_eth: '⚖️',
    boss_qm: '📊',
    boss_econ: '🏦',
    boss_fsa: '📝',
    boss_fi: '💎',
    boss_der: '👿',
    boss_pm: '🏆',
  };
  
  const emoji = emojiMap[enemyId] || '👾';
  
  return (
    <View style={[styles.emojiWrapper, { width: size, height: size }]}>
      <Animated.Text style={[styles.emoji, { fontSize: size * 0.8 }]}>
        {emoji}
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  emojiContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
  },
  emojiWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  emoji: {
    textAlign: 'center',
  },
  effectContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  damageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'red',
    zIndex: 100,
  },
  shakeContainer: {
    ...StyleSheet.absoluteFillObject,
  },
});
