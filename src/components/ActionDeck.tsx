import React, { useEffect, useState } from 'react';
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

const ASCII_SPINNER_FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
const ASCII_BAR_FRAMES = [
  '[          ]',
  '[=         ]',
  '[==        ]',
  '[===       ]',
  '[====      ]',
  '[=====     ]',
  '[======    ]',
  '[=======   ]',
  '[========  ]',
  '[========= ]',
  '[==========]',
];
const HUMAN_THINKING_DOTS = [
  'Human is thinking',
  'Human is thinking.',
  'Human is thinking..',
  'Human is thinking...',
];

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
  const [spinnerIndex, setSpinnerIndex] = useState<number>(0);
  const [barIndex, setBarIndex] = useState<number>(0);
  const [humanDotIndex, setHumanDotIndex] = useState<number>(0);

  const isResolvingChoice = phase === 'SLAM' || phase === 'RESOLVING';

  // Animate ASCII spinner, progress bar, and Human Thinking text
  useEffect(() => {
    if (phase !== 'WAITING_STREAM' && !isResolvingChoice) {
      return;
    }

    const spinnerTimer = window.setInterval(() => {
      setSpinnerIndex((prev) => (prev + 1) % ASCII_SPINNER_FRAMES.length);
    }, 80);

    const barTimer = window.setInterval(() => {
      setBarIndex((prev) => (prev + 1) % ASCII_BAR_FRAMES.length);
    }, 120);

    const humanDotTimer = window.setInterval(() => {
      setHumanDotIndex((prev) => (prev + 1) % HUMAN_THINKING_DOTS.length);
    }, 280);

    return () => {
      window.clearInterval(spinnerTimer);
      window.clearInterval(barTimer);
      window.clearInterval(humanDotTimer);
    };
  }, [phase, isResolvingChoice]);

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

  // READY Staging Gate
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

  // RESOLVING / DELAY JITTER STATE: Human is thinking...
  if (isResolvingChoice) {
    return (
      <section
        className="action-deck-section"
        aria-label="Tactical deck awaiting human operator resolution"
      >
        <div className="action-deck-header">
          <span className="deck-instruction">
            Choice committed // Operator evaluating impact
          </span>
        </div>

        <div className="waiting-turn-panel human-eval-panel" role="status" aria-live="polite">
          <div className="waiting-spinner-row">
            <span className="waiting-ascii-glyph" aria-hidden="true">
              {ASCII_SPINNER_FRAMES[spinnerIndex]}
            </span>
            <span className="waiting-headline human-thinking-headline">
              {HUMAN_THINKING_DOTS[humanDotIndex]}
            </span>
          </div>

          <div className="waiting-ascii-progress" aria-hidden="true">
            {ASCII_BAR_FRAMES[barIndex]}
          </div>

          <p className="waiting-subtext">
            Simulating human operator code inspection and AST diff evaluation (4–8s deliberate jitter).
          </p>
        </div>
      </section>
    );
  }

  // CONSEQUENCE PHASE: Operator verdict delivered & effects active
  if (phase === 'CONSEQUENCE') {
    return (
      <section
        className="action-deck-section"
        aria-label="Tactical deck resolving operator consequence"
      >
        <div className="action-deck-header">
          <span className="deck-instruction">
            Operator verdict delivered // Consequence active
          </span>
        </div>

        <div className="waiting-turn-panel consequence-eval-panel" role="status" aria-live="polite">
          <div className="waiting-spinner-row">
            <span className="waiting-ascii-glyph" aria-hidden="true">
              {ASCII_SPINNER_FRAMES[spinnerIndex]}
            </span>
            <span className="waiting-headline">
              Verdict delivered // Processing impact
            </span>
          </div>

          <div className="waiting-ascii-progress" aria-hidden="true">
            {ASCII_BAR_FRAMES[barIndex]}
          </div>

          <p className="waiting-subtext">
            Operator Dave evaluated your PR diff. Metrics updated and audit consequences committed to terminal history.
          </p>
        </div>
      </section>
    );
  }

  // WAITING FOR NEXT TURN STATE: Situation stream streaming
  if (phase === 'WAITING_STREAM') {
    return (
      <section
        className="action-deck-section"
        aria-label="Tactical deck awaiting next turn"
      >
        <div className="action-deck-header">
          <span className="deck-instruction">
            Tactical vector locked // Synchronizing environment
          </span>
        </div>

        <div className="waiting-turn-panel" role="status" aria-live="polite">
          <div className="waiting-spinner-row">
            <span className="waiting-ascii-glyph" aria-hidden="true">
              {ASCII_SPINNER_FRAMES[spinnerIndex]}
            </span>
            <span className="waiting-headline">Waiting for next turn...</span>
          </div>

          <div className="waiting-ascii-progress" aria-hidden="true">
            {ASCII_BAR_FRAMES[barIndex]}
          </div>

          <p className="waiting-subtext">
            Streaming AST &amp; audit telemetry. Action choices will unlock once the situation analysis completes.
          </p>
        </div>
      </section>
    );
  }

  // ACTIVE 4-CHOICE GRID
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
