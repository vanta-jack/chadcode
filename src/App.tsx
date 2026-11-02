import React, { useCallback, useEffect, useState } from 'react';
import { useGameEngine } from './hooks/useGameEngine';
import { useSound } from './hooks/useSound';
import { SensoryStage } from './components/SensoryStage';
import { ArcadeHUD } from './components/ArcadeHUD';
import { TerminalBuffer } from './components/TerminalBuffer';
import { ActionDeck } from './components/ActionDeck';
import { ByokModal } from './components/ByokModal';
import { MobileTabBar, type ActiveMobileTab } from './components/MobileTabBar';
import { StatusHudOverlay } from './components/StatusHudOverlay';

export const App: React.FC = () => {
  const engine = useGameEngine('scenario-1');
  const sound = useSound();
  const [byokOpen, setByokOpen] = useState<boolean>(false);
  const [statusHudOpen, setStatusHudOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<ActiveMobileTab>('situation');

  const handleOpenByok = useCallback(() => {
    setByokOpen(true);
    engine.setIsPaused(true);
  }, [engine]);

  const handleCloseByok = useCallback(() => {
    setByokOpen(false);
    engine.setIsPaused(false);
  }, [engine]);

  const handleToggleStatusHud = useCallback(() => {
    sound.playHoverTick();
    setStatusHudOpen((prev) => !prev);
  }, [sound]);

  // When game starts from READY -> ACTIVE, switch to action view on mobile
  const handleStartGame = useCallback(() => {
    engine.startGame();
    setActiveTab('action');
  }, [engine]);

  // When turn advances or choice commits, switch to situation so operator sees the outcome
  useEffect(() => {
    if (engine.phase === 'SLAM' || engine.phase === 'RESOLVING') {
      setActiveTab('situation');
    }
  }, [engine.phase]);

  // When ending occurs, switch to situation tab to view the final dossier
  useEffect(() => {
    if (engine.phase === 'ENDED') {
      setActiveTab('situation');
    }
  }, [engine.phase]);

  return (
    <SensoryStage
      sensoryEvent={engine.sensoryEvent}
      timerSec={engine.timerSec}
      phase={engine.phase}
    >
      <div className="chadcode-matrix-shell">
        {/* Floating Top-Middle Pill: Toggleable Overlay HUD for Mobile */}
        <StatusHudOverlay
          isOpen={statusHudOpen}
          onToggle={handleToggleStatusHud}
          scenario={engine.scenario}
          turnNumber={engine.currentTurn.turnNumber}
          totalTurns={engine.totalTurns}
          nodeIndex={engine.currentTurn.nodeIndex}
          timerSec={engine.timerSec}
          maxTimerSec={engine.maxTimerSec}
          phase={engine.phase}
          metrics={engine.metrics}
        />

        <main className="chadcode-tri-layout" data-active-tab={activeTab}>
          {/* Column 1 / Tab 1: Menu & Mission Operations */}
          <section
            className={`tri-column tri-column-menu ${activeTab === 'menu' ? 'tab-visible' : 'tab-hidden'}`}
            aria-label="Menu and Mission Operations"
          >
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
          </section>

          {/* Column 2 / Tab 2: Situation (Diegetic Terminal Buffer) */}
          <section
            className={`tri-column tri-column-situation ${activeTab === 'situation' ? 'tab-visible' : 'tab-hidden'}`}
            aria-label="Current Situation and Terminal Buffer"
          >
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
          </section>

          {/* Column 3 / Tab 3: Choose Answer / Action Deck */}
          <section
            className={`tri-column tri-column-action ${activeTab === 'action' ? 'tab-visible' : 'tab-hidden'}`}
            aria-label="Choose Tactical Vector"
          >
            <ActionDeck
              choices={engine.currentTurn.choices}
              phase={engine.phase}
              selectedChoiceKey={engine.selectedChoiceKey}
              disabled={byokOpen}
              onStartGame={handleStartGame}
              onCommitChoice={engine.commitChoice}
              onHoverTick={sound.playHoverTick}
              onRestart={engine.restartScenario}
            />
          </section>
        </main>

        {/* Mobile Viewport Floating Bottom-Center Pill Tab Bar */}
        <MobileTabBar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          onHoverTick={sound.playHoverTick}
          timerSec={engine.timerSec}
          isReady={engine.phase === 'READY'}
          selectedChoiceKey={engine.selectedChoiceKey}
        />

        <ByokModal isOpen={byokOpen} onClose={handleCloseByok} />
      </div>
    </SensoryStage>
  );
};

export default App;
