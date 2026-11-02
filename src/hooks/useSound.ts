import { useCallback, useEffect, useState } from 'react';
import { soundEngine } from '../audio/sound';

export function useSound() {
  const [isMuted, setIsMuted] = useState<boolean>(() => soundEngine.isMuted());

  useEffect(() => {
    const unsubscribe = soundEngine.subscribe(setIsMuted);

    const handleFirstGesture = () => {
      soundEngine.unlock();
    };

    window.addEventListener('pointerdown', handleFirstGesture, { passive: true });
    window.addEventListener('keydown', handleFirstGesture, { passive: true });

    return () => {
      unsubscribe();
      window.removeEventListener('pointerdown', handleFirstGesture);
      window.removeEventListener('keydown', handleFirstGesture);
    };
  }, []);

  const toggleMute = useCallback(() => {
    soundEngine.unlock();
    return soundEngine.toggleMute();
  }, []);

  const playKeyClick = useCallback(() => {
    soundEngine.playKeyClick();
  }, []);

  const playHoverTick = useCallback(() => {
    soundEngine.playHoverTick();
  }, []);

  const playCommitSlam = useCallback(() => {
    soundEngine.playCommitSlam();
  }, []);

  const playDamageShake = useCallback((severe: boolean = false) => {
    soundEngine.playDamageShake(severe);
  }, []);

  const playTimeoutBuzzer = useCallback(() => {
    soundEngine.playTimeoutBuzzer();
  }, []);

  const playCountdownTick = useCallback((timerSec: number) => {
    soundEngine.playCountdownTick(timerSec);
  }, []);

  return {
    isMuted,
    toggleMute,
    playKeyClick,
    playHoverTick,
    playCommitSlam,
    playDamageShake,
    playTimeoutBuzzer,
    playCountdownTick,
  };
}
