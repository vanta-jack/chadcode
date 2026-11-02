import React, { useEffect } from 'react';
import type { Choice } from '../types/scenario';
import type { GamePhase } from '../hooks/useGameEngine';

interface ActionDeckProps {
  choices: [Choice, Choice, Choice, Choice];
  phase: GamePhase;
  selectedChoiceKey: string | null;
  disabled: boolean;
  onStartGame: () => void;
  onCommitChoice: (choice: Choice) => void;
  onHoverTick: () => void;
  onRestart: () => void;
}

export const ActionDeck: React.FC<ActionDeckProps> = ({
  choices,
  phase,
  selectedChoiceKey,
  disabled,
  onStartGame,
  onCommitChoice,
  onHoverTick,
  onRestart,
}) => {
  // Global keyboard bindings [1-4], [A-D], [Enter/Space to Start]
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (disabled) return;
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'SELECT' ||
          target.tagName === 'TEXTAREA')
      ) {
        return;
      }

      if (phase === 'READY') {
        if (event.key === 'Enter' || event.key === ' ' || event.key === 's' || event.key === 'S') {
          event.preventDefault();
          onStartGame();
        }
        return;
      }

      if (phase === 'ENDED') {
        if (event.key === 'r' || event.key === 'R' || event.key === 'Enter') {
          event.preventDefault();
          onRestart();
        }
        return;
      }

      if (phase !== 'ACTIVE') return;

      const keyMap: Record<string, number> = {
        '1': 0,
        '2': 1,
        '3': 2,
        '4': 3,
        a: 0,
        A: 0,
        b: 1,
        B: 1,
        c: 2,
        C: 2,
        d: 3,
        D: 3,
      };

      const choiceIdx = keyMap[event.key];
      if (choiceIdx !== undefined && choices[choiceIdx]) {
        event.preventDefault();
        onCommitChoice(choices[choiceIdx]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [choices, disabled, onCommitChoice, onRestart, onStartGame, phase]);

  if (phase === 'READY') {
    return (
      <section
        className="action-deck-section"
        aria-label="Mission staging gate"
      >
        <div className="action-deck-header">
          <span className="deck-instruction">
            Mission briefing ready [Review objectives above before initiating timer]
          </span>
        </div>

        <div className="ready-start-banner">
          <div className="ready-banner-info">
            <span className="ready-banner-sigil">◆</span>
            <span>
              Watchdog scanner is dormant. Timer initiates upon operator authorization.
            </span>
          </div>

          <button
            type="button"
            className="hud-btn-start-game"
            onClick={onStartGame}
            onMouseEnter={onHoverTick}
            autoFocus
          >
            <span className="btn-bracket">[</span>
            <span className="btn-label">INITIATE MISSION // START</span>
            <span className="btn-subtext">[Enter or Space]</span>
            <span className="btn-bracket">]</span>
          </button>
        </div>
      </section>
    );
  }

  return (
    <section
      className="action-deck-section"
      aria-label="Hyperforma vector action deck"
    >
      <div className="action-deck-header">
        <span className="deck-instruction">
          Select tactical vector [Press 1–4 or click prism to commit]
        </span>
      </div>

      <div className="action-deck-grid">
        {choices.map((choice) => {
          const isSelected = selectedChoiceKey === choice.key;
          const isInteractive = phase === 'ACTIVE' && !disabled;

          return (
            <button
              key={choice.id}
              type="button"
              className={`vector-choice-card ${
                isSelected ? 'vector-card-selected' : ''
              }`}
              disabled={!isInteractive}
              onMouseEnter={() => {
                if (isInteractive) onHoverTick();
              }}
              onClick={() => {
                if (isInteractive) onCommitChoice(choice);
              }}
            >
              {/* Sacred wireframe corner brackets */}
              <span className="vector-corner corner-tl" aria-hidden="true" />
              <span className="vector-corner corner-tr" aria-hidden="true" />
              <span className="vector-corner corner-bl" aria-hidden="true" />
              <span className="vector-corner corner-br" aria-hidden="true" />

              <div className="vector-card-top">
                <span className="vector-key-badge">[{choice.key}]</span>
                <span className="vector-tactical-tag">{choice.tacticalTag}</span>
              </div>

              <div className="vector-card-label">{choice.label}</div>

              <div className="vector-card-cmd">
                <span className="cmd-prefix">$</span> {choice.commandPreview}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
};
