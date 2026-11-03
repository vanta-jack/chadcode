import React from 'react';
import type { OperatorMetrics, Scenario } from '../types/scenario';
import type { GamePhase } from '../hooks/useGameEngine';

interface ArcadeHUDProps {
  scenario: Scenario;
  scenarios: Scenario[];
  turnNumber: number;
  totalTurns: number;
  nodeIndex: number; // 1..5
  timerSec: number;
  maxTimerSec: number;
  phase: GamePhase;
  metrics: OperatorMetrics;
  isMuted: boolean;
  unlockedConceptIds?: string[];
  runUnlockedConceptIds?: string[];
  onToggleMute: () => void;
  onSelectScenario: (scenarioId: string) => void;
  onRestart: () => void;
  onOpenByokModal: () => void;
  onHoverTick: () => void;
}

export const ArcadeHUD: React.FC<ArcadeHUDProps> = ({
  scenario,
  scenarios,
  turnNumber,
  totalTurns,
  nodeIndex,
  timerSec,
  maxTimerSec,
  phase,
  metrics,
  isMuted,
  unlockedConceptIds = [],
  runUnlockedConceptIds = [],
  onToggleMute,
  onSelectScenario,
  onRestart,
  onOpenByokModal,
  onHoverTick,
}) => {
  const isCriticalTime = phase === 'ACTIVE' && timerSec <= 5;
  const formattedTime = `00:${String(Math.max(0, timerSec)).padStart(2, '0')}`;

  // Circular SVG gauge geometry
  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const ratio = maxTimerSec > 0 ? Math.max(0, timerSec) / maxTimerSec : 0;
  const dashOffset = circumference * (1 - ratio);

  return (
    <header className="arcade-hud" aria-label="Non-diegetic operator HUD">
      {/* Top Bar: Sacred Brand + Mission Metadata */}
      <div className="hud-top-row">
        <div className="hud-brand-block">
          <div className="hud-emblem" aria-hidden="true">
            <svg viewBox="0 0 36 36" width="32" height="32">
              <polygon
                points="18,2 34,18 18,34 2,18"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <rect
                x="9"
                y="9"
                width="18"
                height="18"
                fill="none"
                stroke="#E5A93C"
                strokeWidth="1.2"
              />
              <circle cx="18" cy="18" r="3" fill="#E5A93C" />
            </svg>
          </div>
          <div>
            <h1 className="hud-title">ChadCode</h1>
            <p className="hud-subtitle">
              Target: {scenario.targetSystem} · Persona: {metrics.persona}
            </p>
          </div>
        </div>

        {/* Scenario Selector (1-5) */}
        <div className="hud-scenario-selector">
          <label htmlFor="scenario-select" className="hud-field-label">
            Scenario:
          </label>
          <select
            id="scenario-select"
            className="hud-select"
            value={scenario.id}
            onMouseEnter={onHoverTick}
            onChange={(e) => onSelectScenario(e.target.value)}
          >
            {scenarios.map((s) => (
              <option key={s.id} value={s.id}>
                0{s.number}: {s.title}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="hud-btn"
            onMouseEnter={onHoverTick}
            onClick={onRestart}
            title="Reset current mission to Turn 01"
          >
            Reset mission
          </button>
        </div>

        {/* Utility Controls + BYOK Badge */}
        <div className="hud-utility-controls">
          <button
            type="button"
            className="hud-btn hud-byok-trigger"
            onMouseEnter={onHoverTick}
            onClick={onOpenByokModal}
          >
            <span className="byok-lock-glyph" aria-hidden="true">
              ◆
            </span>
            <span>Custom Scenario Generator (BYOK) — Coming Soon...</span>
          </button>

          <button
            type="button"
            className={`hud-btn ${isMuted ? 'hud-btn-muted' : 'hud-btn-active'}`}
            onMouseEnter={onHoverTick}
            onClick={onToggleMute}
            aria-pressed={!isMuted}
          >
            {isMuted ? 'Audio: Muted' : 'Audio: Synth On'}
          </button>
        </div>

        {/* Hyperforma Circular SVG Countdown Timer (Desktop Viewport) */}
        <div
          className={`hud-timer-module ${
            isCriticalTime ? 'hud-timer-critical' : ''
          }`}
          role="timer"
          aria-live="off"
          aria-label={`Time remaining ${timerSec} seconds`}
        >
          <svg
            className="hud-timer-svg"
            viewBox="0 0 60 60"
            width="56"
            height="56"
            aria-hidden="true"
          >
            {/* Sacred outer wireframe octagon */}
            <polygon
              points="18,3 42,3 57,18 57,42 42,57 18,57 3,42 3,18"
              fill="none"
              stroke="rgba(245, 245, 240, 0.22)"
              strokeWidth="1"
            />
            <circle
              cx="30"
              cy="30"
              r={radius}
              fill="none"
              stroke="rgba(245, 245, 240, 0.16)"
              strokeWidth="3"
            />
            <circle
              cx="30"
              cy="30"
              r={radius}
              fill="none"
              stroke={isCriticalTime ? '#D9383A' : '#E5A93C'}
              strokeWidth="3"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              strokeLinecap="butt"
              transform="rotate(-90 30 30)"
              style={{ transition: 'stroke-dashoffset 0.25s linear' }}
            />
          </svg>
          <div className="hud-timer-readout">
            <span className="hud-timer-caption">
              {phase === 'READY' ? 'Timer (Armed)' : 'Time remaining'}
            </span>
            <span className="hud-timer-digits">{formattedTime}</span>
          </div>
        </div>
      </div>

      {/* Bottom Row: 5-Node Sacred Constellation + Turn Counter + Cosmetic Metrics (Desktop Viewport) */}
      <div className="hud-constellation-row">
        <div
          className="hud-constellation-track"
          aria-label={`Mission turn ${turnNumber} of ${totalTurns}`}
        >
          <span className="hud-turn-badge">
            Turn {String(turnNumber).padStart(2, '0')} / {totalTurns}
          </span>

          <div className="constellation-nodes">
            {scenario.constellationNodes.map((nodeLabel, idx) => {
              const currentNodeNum = idx + 1;
              const isCompleted =
                phase === 'ENDED' || currentNodeNum < nodeIndex;
              const isCurrent =
                phase !== 'ENDED' && currentNodeNum === nodeIndex;

              return (
                <div
                  key={nodeLabel}
                  className={`constellation-node ${
                    isCompleted
                      ? 'node-complete'
                      : isCurrent
                      ? 'node-active'
                      : 'node-pending'
                  }`}
                >
                  <svg
                    viewBox="0 0 24 24"
                    width="16"
                    height="16"
                    aria-hidden="true"
                  >
                    <polygon
                      points="12,2 22,12 12,22 2,12"
                      fill={
                        isCompleted
                          ? '#E5A93C'
                          : isCurrent
                          ? 'rgba(229, 169, 60, 0.28)'
                          : 'none'
                      }
                      stroke={
                        isCompleted || isCurrent
                          ? '#E5A93C'
                          : 'rgba(245, 245, 240, 0.4)'
                      }
                      strokeWidth="1.5"
                    />
                    {(isCompleted || isCurrent) && (
                      <circle cx="12" cy="12" r="2.5" fill="#F5F5F0" />
                    )}
                  </svg>
                  <span className="constellation-node-label">{nodeLabel}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Cosmetic Diegetic Telemetry Readout */}
        <div className="hud-metrics-strip" aria-label="Diegetic operator metrics">
          <div className="metric-item">
            <span className="metric-label">Stealth:</span>
            <span className="metric-value">{metrics.stealth}%</span>
          </div>
          <div
            className={`metric-item ${
              metrics.heat >= 60 ? 'metric-danger' : ''
            }`}
          >
            <span className="metric-label">Heat:</span>
            <span className="metric-value">{metrics.heat}%</span>
          </div>
          <div className="metric-item">
            <span className="metric-label">Code quality:</span>
            <span className="metric-value">{metrics.codeQuality}%</span>
          </div>

          {/* Steam-Style Concept Badges Rack */}
          {scenario.concepts && scenario.concepts.length > 0 && (
            <div className="hud-concept-rack" aria-label="Classified operational concept achievements">
              <span className="concept-rack-label">
                Badges: {scenario.concepts.filter(c => runUnlockedConceptIds.includes(c.id)).length}/{scenario.concepts.length}
              </span>
              <div className="concept-rack-badges">
                {scenario.concepts.map((concept) => {
                  const isUnlockedRun = runUnlockedConceptIds.includes(concept.id);
                  const isUnlockedAny = unlockedConceptIds.includes(concept.id);
                  return (
                    <span
                      key={concept.id}
                      className={`concept-badge-slot ${
                        isUnlockedRun
                          ? 'badge-slot-unlocked'
                          : isUnlockedAny
                          ? 'badge-slot-archived'
                          : 'badge-slot-locked'
                      }`}
                      title={
                        isUnlockedRun
                          ? `${concept.code}: [ACQUIRED] — Classified intel (Decrypted at debrief)`
                          : isUnlockedAny
                          ? `${concept.code}: [ARCHIVED] — Previously unlocked in dossier`
                          : `${concept.code}: [ENCRYPTED] — ${concept.hint}`
                      }
                    >
                      {isUnlockedRun ? concept.iconGlyph : isUnlockedAny ? '◈' : '◇'}
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
