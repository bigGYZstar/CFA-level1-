import { useState, useCallback, useEffect } from 'react';
import * as Speech from 'expo-speech';
import { Platform } from 'react-native';

export interface SpeechOptions {
  language?: string;
  pitch?: number;
  rate?: number;
}

export function useSpeech() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isAvailable, setIsAvailable] = useState(true);

  useEffect(() => {
    // Web環境でのSpeech API対応確認
    if (Platform.OS === 'web') {
      setIsAvailable('speechSynthesis' in window);
    }
  }, []);

  const speak = useCallback(async (text: string, options: SpeechOptions = {}) => {
    if (!isAvailable || !text) return;

    // 既に再生中の場合は停止
    if (isSpeaking) {
      await Speech.stop();
    }

    setIsSpeaking(true);

    try {
      await Speech.speak(text, {
        language: options.language || 'en-US',
        pitch: options.pitch || 1.0,
        rate: options.rate || 0.9, // 少しゆっくり
        onDone: () => setIsSpeaking(false),
        onError: () => setIsSpeaking(false),
        onStopped: () => setIsSpeaking(false),
      });
    } catch (error) {
      console.error('Speech error:', error);
      setIsSpeaking(false);
    }
  }, [isSpeaking, isAvailable]);

  const stop = useCallback(async () => {
    if (isSpeaking) {
      await Speech.stop();
      setIsSpeaking(false);
    }
  }, [isSpeaking]);

  const speakEnglish = useCallback((text: string) => {
    speak(text, { language: 'en-US', rate: 0.85 });
  }, [speak]);

  const speakJapanese = useCallback((text: string) => {
    speak(text, { language: 'ja-JP', rate: 0.9 });
  }, [speak]);

  return {
    speak,
    stop,
    speakEnglish,
    speakJapanese,
    isSpeaking,
    isAvailable,
  };
}
