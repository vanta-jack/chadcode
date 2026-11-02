import React, { useEffect, useState } from 'react';
import type { GamePhase, SensoryEvent } from '../hooks/useGameEngine';

interface SensoryStageProps {
  sensoryEvent: SensoryEvent;
  timerSec: number;
  phase: GamePhase;
  children: React.ReactNode;
}

export const SensoryStage: React.FC<SensoryStageProps> = ({
  sensoryEvent,
  timerSec,
  phase,
  children,
}) => {
  const [motionClass, setMotionClass] = useState<string>('');
  const [flashMode, setFlashMode] = useState<'none' | 'bone' | 'vermilion'>('none');

  useEffect(() => {
    if (sensoryEvent.type === 'NONE' || sensoryEvent.timestamp === 0) {
      return;
    }

    if (sensoryEvent.type === 'COMMIT_SLAM') {
      setMotionClass('thumper-commit-slam');
      setFlashMode('bone');
      const timer = window.setTimeout(() => {
        setMotionClass('');
        setFlashMode('none');
      }, 65);
      return () => window.clearTimeout(timer);
    }

    if (sensoryEvent.type === 'MINOR_SHAKE') {
      setMotionClass('thumper-minor-shake');
      setFlashMode('none');
      const timer = window.setTimeout(() => {
        setMotionClass('');
      }, 160);
      return () => window.clearTimeout(timer);
    }

    if (sensoryEvent.type === 'CATASTROPHIC_SHAKE') {
      setMotionClass('thumper-catastrophic-shake');
      setFlashMode('vermilion');
      const timer = window.setTimeout(() => {
        setMotionClass('');
        setFlashMode('none');
      }, 620);
      return () => window.clearTimeout(timer);
    }
  }, [sensoryEvent]);

  const isLowTime = phase === 'ACTIVE' && timerSec <= 5 && timerSec > 0;

  return (
    <>
      {/* Low-time pulsing vermilion perimeter vignette placed outside transformed root */}
      <div
        className={`sensory-vignette ${
          isLowTime ? 'sensory-vignette-active' : ''
        }`}
        aria-hidden="true"
      />

      {/* Instantaneous commit bone flash or catastrophic vermilion flash */}
      {flashMode !== 'none' && (
        <div
          className={`sensory-flash-overlay ${
            flashMode === 'bone'
              ? 'sensory-flash-bone'
              : 'sensory-flash-vermilion'
          }`}
          aria-hidden="true"
        />
      )}

      <div
        className={`sensory-stage-root ${motionClass} ${
          isLowTime ? 'sensory-low-time-jitter' : ''
        }`}
      >
        <div className="sensory-stage-content">{children}</div>
      </div>
    </>
  );
};
