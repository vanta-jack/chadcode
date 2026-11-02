import React, { useEffect, useRef, useState } from 'react';
import type {
  Ending,
  Outcome,
  Scenario,
  TerminalHistoryEntry,
  Turn,
} from '../types/scenario';
import type { GamePhase } from '../hooks/useGameEngine';

interface TerminalBufferProps {
  scenario: Scenario;
  turn: Turn;
  phase: GamePhase;
  history: TerminalHistoryEntry[];
  activeOutcome: {
    choiceKey: string;
    choiceLabel: string;
    commandPreview: string;
    outcome: Outcome;
  } | null;
  ending: Ending | null;
  onKeyClick: () => void;
  onStreamComplete: () => void;
  onRestart: () => void;
  onSelectScenario: (id: string) => void;
}

const SPINNER_FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
const LOADING_DOTS_FRAMES = ['Loading', 'Loading.', 'Loading..', 'Loading...'];
const HUMAN_THINKING_FRAMES = [
  'Human is thinking',
  'Human is thinking.',
  'Human is thinking..',
  'Human is thinking...',
];

export const TerminalBuffer: React.FC<TerminalBufferProps> = ({
  scenario,
  turn,
  phase,
  history,
  activeOutcome,
  ending,
  onKeyClick,
  onStreamComplete,
  onRestart,
  onSelectScenario,
}) => {
  const [streamedChars, setStreamedChars] = useState<number>(0);
  const [thinkingCollapsed, setThinkingCollapsed] = useState<boolean>(false);
  const [showPriorHistory, setShowPriorHistory] = useState<boolean>(false);
  const [spinnerIdx, setSpinnerIdx] = useState<number>(0);
  const [loadingTextIdx, setLoadingTextIdx] = useState<number>(0);
  const [humanThinkingIdx, setHumanThinkingIdx] = useState<number>(0);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  const fullThinkingText = turn.thinking;
  const isResolving = phase === 'SLAM' || phase === 'RESOLVING';
  const isStreaming = phase === 'WAITING_STREAM' || (phase !== 'READY' && streamedChars < fullThinkingText.length);

  // Animated spinner and animated "Loading..." / "Human is thinking..." text
  useEffect(() => {
    if (!isStreaming && !isResolving) return;

    const spinnerTimer = window.setInterval(() => {
      setSpinnerIdx((prev) => (prev + 1) % SPINNER_FRAMES.length);
    }, 70);

    const loadingTextTimer = window.setInterval(() => {
      setLoadingTextIdx((prev) => (prev + 1) % LOADING_DOTS_FRAMES.length);
      setHumanThinkingIdx((prev) => (prev + 1) % HUMAN_THINKING_FRAMES.length);
    }, 280);

    return () => {
      window.clearInterval(spinnerTimer);
      window.clearInterval(loadingTextTimer);
    };
  }, [isStreaming, isResolving]);

  // Stream the thinking & command output with procedural key clicks on each turn
  useEffect(() => {
    // If in READY phase, show full text immediately without waiting
    if (phase === 'READY') {
      setStreamedChars(fullThinkingText.length);
      return;
    }

    setStreamedChars(0);
    const totalLen = fullThinkingText.length;
    let current = 0;
    let tickCounter = 0;

    const interval = window.setInterval(() => {
      current += 6;
      tickCounter += 1;
      if (tickCounter % 3 === 0) {
        onKeyClick();
      }
      if (current >= totalLen) {
        setStreamedChars(totalLen);
        window.clearInterval(interval);
        // Small graceful pause so the user can register the completed thinking
        const doneTimer = window.setTimeout(() => {
          onStreamComplete();
        }, 350);
        return () => window.clearTimeout(doneTimer);
      } else {
        setStreamedChars(current);
      }
    }, 22);

    return () => window.clearInterval(interval);
  }, [turn.turnNumber, scenario.id, fullThinkingText, phase, onKeyClick, onStreamComplete]);

  // Keep terminal scrolled to active operational prompt
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop =
        scrollContainerRef.current.scrollHeight;
    }
  }, [turn.turnNumber, streamedChars, isStreaming, isResolving, activeOutcome, ending]);

  const visibleThinking = fullThinkingText.slice(0, streamedChars);

  return (
    <section
      className="terminal-workstation"
      aria-label="Diegetic terminal buffer"
    >
      {/* Box-Drawing Top Header */}
      <div className="terminal-box-border" aria-hidden="true">
        ┌── [DIEGETIC TERMINAL WORKSTATION — CLAUDE CODE CLI] ──────────────────┐
      </div>

      <div className="terminal-viewport" ref={scrollContainerRef}>
        {/* Mission Context Banner */}
        <div className="terminal-session-meta">
          <span>
            session: chad@sovereign-node ({scenario.targetSystem})
          </span>
          <span>watchdog: {scenario.complianceBot}</span>
          {history.length > 0 && (
            <button
              type="button"
              className="terminal-inline-toggle"
              onClick={() => setShowPriorHistory((prev) => !prev)}
            >
              {showPriorHistory
                ? `Hide prior turns (${history.length})`
                : `Show prior turns (${history.length})`}
            </button>
          )}
        </div>

        {/* Collapsible Prior Turn Log History */}
        {showPriorHistory && history.length > 0 && (
          <div className="terminal-history-block">
            {history.map((item) => (
              <div
                key={`${item.turnNumber}-${item.choiceKey}`}
                className={`history-entry history-severity-${item.severity}`}
              >
                <div className="history-cmd">
                  chadcode &gt; [Turn {String(item.turnNumber).padStart(2, '0')}]{' '}
                  {item.command}
                </div>
                {item.logs.map((line, i) => (
                  <div key={i} className="history-log-line">
                    │ {line}
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* Active Turn Output */}
        {phase !== 'ENDED' && (
          <div className="terminal-active-turn">
            <div className="terminal-stage-header">{turn.title}</div>

            <div className="terminal-command-line">
              <span className="prompt-sigil">chadcode &gt;</span>{' '}
              <span className="command-text">{turn.command}</span>
            </div>

            {/* Streaming Stdout Logs */}
            <div className="terminal-stdout-list">
              {turn.terminalLogs.map((log, index) => {
                const isAlert =
                  log.includes('ALERT') ||
                  log.includes('VIOLATION') ||
                  log.includes('CRITICAL');
                return (
                  <div
                    key={index}
                    className={`stdout-line ${
                      isAlert ? 'stdout-line-alert' : ''
                    }`}
                  >
                    {log}
                  </div>
                );
              })}
            </div>

            {/* Syntax-Highlighted Git Diff Block (Strict 4-Color Palette) */}
            <div className="terminal-diff-box">
              <div className="diff-box-header">
                ┌── git diff --staged ────────────────────────────────────────┐
              </div>
              <pre className="diff-pre">
                {turn.gitDiff.map((line, idx) => {
                  let lineClass = 'diff-line-ctx';
                  if (line.startsWith('+')) lineClass = 'diff-line-add';
                  else if (line.startsWith('-')) lineClass = 'diff-line-del';
                  else if (line.startsWith('@@')) lineClass = 'diff-line-hunk';

                  return (
                    <div key={idx} className={`diff-line ${lineClass}`}>
                      {line}
                    </div>
                  );
                })}
              </pre>
              <div className="diff-box-footer">
                └─────────────────────────────────────────────────────────────┘
              </div>
            </div>

            {/* Simulated <thinking> Stream */}
            <div className="terminal-thinking-block">
              <button
                type="button"
                className="thinking-toggle-btn"
                onClick={() => setThinkingCollapsed((prev) => !prev)}
                aria-expanded={!thinkingCollapsed}
              >
                <span>&lt;thinking&gt;</span>
                <span className="thinking-toggle-hint">
                  {thinkingCollapsed ? '[Expand reasoning]' : '[Collapse]'}
                </span>
              </button>
              {!thinkingCollapsed && (
                <p className="thinking-body">
                  {visibleThinking}
                  {streamedChars < fullThinkingText.length && (
                    <span className="terminal-cursor" aria-hidden="true">
                      █
                    </span>
                  )}
                </p>
              )}
              <div className="thinking-close-tag">&lt;/thinking&gt;</div>
            </div>

            {/* Immediate Consequence Cascade during SLAM / RESOLVING with Human Thinking Jitter Indicator */}
            {activeOutcome && (
              <div
                className={`terminal-outcome-cascade outcome-${activeOutcome.outcome.severity}`}
                role="status"
                aria-live="assertive"
              >
                <div className="outcome-command-echo">
                  chad &gt; [{activeOutcome.choiceKey}]{' '}
                  {activeOutcome.commandPreview}
                </div>
                <div className="outcome-summary">
                  {activeOutcome.outcome.summary}
                </div>
                {activeOutcome.outcome.logOutput.map((line, idx) => (
                  <div key={idx} className="outcome-log-line">
                    {line}
                  </div>
                ))}

                {/* Animated "Human is thinking..." jitter banner */}
                <div className="terminal-human-thinking-row" aria-live="polite">
                  <span className="terminal-human-glyph" aria-hidden="true">
                    {SPINNER_FRAMES[spinnerIdx]}
                  </span>
                  <span className="terminal-human-text">
                    {HUMAN_THINKING_FRAMES[humanThinkingIdx]}
                  </span>
                  <span className="terminal-human-sub">
                    [Operator Dave evaluating impact / compliance logs]
                  </span>
                </div>
              </div>
            )}

            {/* Active Prompt Line OR Animated Spinner Loading State */}
            {isStreaming ? (
              <div className="terminal-prompt-loading-row" role="status" aria-live="polite">
                <span className="prompt-sigil">chad &gt;</span>{' '}
                <span className="terminal-loading-spinner" aria-hidden="true">
                  {SPINNER_FRAMES[spinnerIdx]}
                </span>
                <span className="terminal-loading-text">
                  {LOADING_DOTS_FRAMES[loadingTextIdx]}
                </span>
                <span className="terminal-cursor" aria-hidden="true">
                  █
                </span>
              </div>
            ) : (
              <div className="terminal-prompt-line">
                <span className="prompt-sigil">chad &gt;</span>{' '}
                <span className="prompt-dilemma">{turn.prompt}</span>
                <span className="terminal-cursor" aria-hidden="true">
                  █
                </span>
              </div>
            )}
          </div>
        )}

        {/* Ending Resolution Dossier (5 Endings System) */}
        {phase === 'ENDED' && ending && (
          <div className="terminal-ending-dossier" role="region" aria-label="Mission outcome">
            <div className="ending-badge-row">
              <span
                className={`ending-code-tag ${
                  ending.isVictory ? 'ending-tag-gold' : 'ending-tag-vermilion'
                }`}
              >
                {ending.code} · {ending.archetype}
              </span>
              <span className="ending-persona-tag">
                Final persona: {ending.finalPersona}
              </span>
            </div>

            <h2 className="ending-title">{ending.title}</h2>
            <p className="ending-verdict">{ending.verdict}</p>

            <div className="ending-traceback-box">
              <div className="diff-box-header">
                ┌── [AUDIT &amp; KERNEL TRACEBACK] ───────────────────────────────┐
              </div>
              {ending.terminalTraceback.map((line, idx) => (
                <div
                  key={idx}
                  className={`traceback-line ${
                    ending.isVictory ? 'traceback-gold' : 'traceback-vermilion'
                  }`}
                >
                  │ {line}
                </div>
              ))}
              <div className="diff-box-footer">
                └─────────────────────────────────────────────────────────────┘
              </div>
            </div>

            <p className="ending-epilogue">{ending.epilogue}</p>

            {/* All 5 Endings Matrix */}
            <div className="ending-constellation-matrix">
              <div className="matrix-heading">
                Scenario endings catalog (5 possible trajectories):
              </div>
              <div className="matrix-grid">
                {Object.values(scenario.endings).map((e) => {
                  const isCurrentEnding = e.id === ending.id;
                  return (
                    <div
                      key={e.id}
                      className={`matrix-card ${
                        isCurrentEnding ? 'matrix-card-current' : ''
                      }`}
                    >
                      <div className="matrix-card-code">{e.code}</div>
                      <div className="matrix-card-title">{e.title}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="ending-actions">
              <button
                type="button"
                className="hud-btn hud-btn-gold"
                onClick={onRestart}
              >
                Replay {scenario.title} [Enter / R]
              </button>
              {scenario.number < 5 && (
                <button
                  type="button"
                  className="hud-btn"
                  onClick={() =>
                    onSelectScenario(`scenario-${scenario.number + 1}`)
                  }
                >
                  Advance to Scenario 0{scenario.number + 1}
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Box-Drawing Bottom Footer */}
      <div className="terminal-box-border" aria-hidden="true">
        └───────────────────────────────────────────────────────────────────────┘
      </div>
    </section>
  );
};
