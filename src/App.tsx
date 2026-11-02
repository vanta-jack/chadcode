import React, { useCallback, useState } from 'react';
import { useGameEngine } from './hooks/useGameEngine';
import { useSound } from './hooks/useSound';
import { SensoryStage } from './components/SensoryStage';
import { ArcadeHUD } from './components/ArcadeHUD';
import { TerminalBuffer } from './components/TerminalBuffer';
import { ActionDeck } from './components/ActionDeck';
import { ByokModal } from './components/ByokModal';

export const App: React.FC = () => {
  const engine = useGameEngine('scenario-1');
  const sound = useSound();
  const [byokOpen, setByokOpen] = useState<boolean>(false);

  const handleOpenByok = useCallback(() => {
    setByokOpen(true);
    engine.setIsPaused(true);
  }, [engine]);

  const handleCloseByok = useCallback(() => {
    setByokOpen(false);
    engine.setIsPaused(false);
  }, [engine]);

  return (
    <SensoryStage
      sensoryEvent={engine.sensoryEvent}
      timerSec={engine.timerSec}
      phase={engine.phase}
    >
      <div className="chadcode-matrix-shell">
        <ArcadeHUD
          scenario={engine.scenario}
          scenarios={engine.scenarios}
          turnNumber={engine.currentTurn.turnNumber}
          totalTurns={engine.totalTurns}
          nodeIndex={engine.currentTurn.nodeIndex}
          timerSec={engine.timerSec}
          maxTimerSec={engine.maxTimerSec}
          phase={engine.phase}
          metrics={engine.metrics}
          isMuted={sound.isMuted}
          onToggleMute={sound.toggleMute}
          onSelectScenario={engine.selectScenario}
          onRestart={engine.restartScenario}
          onOpenByokModal={handleOpenByok}
          onHoverTick={sound.playHoverTick}
        />

        <main className="chadcode-dual-layer">
          <TerminalBuffer
            scenario={engine.scenario}
            turn={engine.currentTurn}
            phase={engine.phase}
            history={engine.history}
            activeOutcome={engine.activeOutcome}
            ending={engine.ending}
            onKeyClick={sound.playKeyClick}
            onRestart={engine.restartScenario}
            onSelectScenario={engine.selectScenario}
          />

          <ActionDeck
            choices={engine.currentTurn.choices}
            phase={engine.phase}
            selectedChoiceKey={engine.selectedChoiceKey}
            disabled={byokOpen}
            onCommitChoice={engine.commitChoice}
            onHoverTick={sound.playHoverTick}
            onRestart={engine.restartScenario}
          />
        </main>

        <ByokModal isOpen={byokOpen} onClose={handleCloseByok} />
      </div>
    </SensoryStage>
  );
};

export default App;
