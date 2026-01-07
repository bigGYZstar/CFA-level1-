import { useState, useEffect, useRef } from 'react';
import { View, Image, StyleSheet, Animated } from 'react-native';

// スプライトフレームの定義
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

export type AnimationState = 'idle' | 'attack' | 'damage' | 'death';

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
  
  // PERスライム以外は絵文字フォールバック
  const isPESlime = enemyId === 'eq1';
  
  // フレームアニメーション
  useEffect(() => {
    if (!isPESlime) return;
    
    const frames = PE_SLIME_FRAMES[animation];
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
  }, [animation, isPESlime, onAnimationComplete]);
  
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
  
  // PERスライム以外は絵文字表示
  if (!isPESlime) {
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
  
  const frames = PE_SLIME_FRAMES[animation];
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
        resizeMode="contain"
      />
    </Animated.View>
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
});
