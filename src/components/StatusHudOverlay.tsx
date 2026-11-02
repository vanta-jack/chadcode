import React from 'react';
import type { OperatorMetrics, Scenario } from '../types/scenario';
import type { GamePhase } from '../hooks/useGameEngine';

interface StatusHudOverlayProps {
  isOpen: boolean;
  onToggle: () => void;
  scenario: Scenario;
  turnNumber: number;
  totalTurns: number;
  nodeIndex: number;
  timerSec: number;
  maxTimerSec: number;
  phase: GamePhase;
  metrics: OperatorMetrics;
}

export const StatusHudOverlay: React.FC<StatusHudOverlayProps> = ({
  isOpen,
  onToggle,
  scenario,
  turnNumber,
  totalTurns,
  nodeIndex,
  timerSec,
  maxTimerSec,
  phase,
  metrics,
}) => {
  const isCriticalTime = phase === 'ACTIVE' && timerSec <= 5;
  const formattedTime = `00:${String(Math.max(0, timerSec)).padStart(2, '0')}`;

  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const ratio = maxTimerSec > 0 ? Math.max(0, timerSec) / maxTimerSec : 0;
  const dashOffset = circumference * (1 - ratio);

  // Close on Escape key
  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onToggle();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onToggle]);

  return (
    <>
      {/* Floating Top-Middle Capsule Pill Button */}
      <aside className="status-pill-top-bar" aria-label="Status HUD floating pill">
        <button
          type="button"
          className={`status-pill-btn ${isCriticalTime ? 'status-pill-critical' : ''} ${isOpen ? 'status-pill-open' : ''}`}
          onClick={onToggle}
          aria-expanded={isOpen}
          aria-label="Toggle Mission Status and Telemetry HUD"
        >
          {/* Mini circular progress indicator */}
          <div className="pill-mini-timer-wrap">
            <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
              <circle cx="12" cy="12" r="9" fill="none" stroke="rgba(245, 245, 240, 0.25)" strokeWidth="2.5" />
              <circle
                cx="12"
                cy="12"
                r="9"
                fill="none"
                stroke={isCriticalTime ? '#D9383A' : '#E5A93C'}
                strokeWidth="2.5"
                strokeDasharray={2 * Math.PI * 9}
                strokeDashoffset={2 * Math.PI * 9 * (1 - ratio)}
                transform="rotate(-90 12 12)"
              />
            </svg>
          </div>

          <span className="pill-turn-text">T{String(turnNumber).padStart(2, '0')}</span>
          <span className="pill-divider">│</span>
          <span className={`pill-time-text ${isCriticalTime ? 'pill-time-critical' : ''}`}>
            {formattedTime}
          </span>
          <span className="pill-divider">│</span>
          <span className="pill-heat-text" style={{ color: metrics.heat >= 60 ? '#D9383A' : '#F5F5F0' }}>
            H:{metrics.heat}%
          </span>
          <span className="pill-chevron" aria-hidden="true">
            {isOpen ? '▲' : '▼'}
          </span>
        </button>
      </aside>

      {/* Floating Modal / Overlay HUD Panel */}
      {isOpen && (
        <div className="status-hud-modal-backdrop" onClick={onToggle} role="dialog" aria-modal="true">
          <div className="status-hud-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="status-hud-header">
              <div className="status-hud-badge-title">
                <span className="hud-status-sigil">◆</span>
                <span className="hud-status-title">MISSION STATUS // TELEMETRY OVERLAY</span>
              </div>
              <button type="button" className="hud-btn hud-btn-close-sm" onClick={onToggle}>
                Dismiss [Esc]
              </button>
            </div>

            {/* Giant Countdown Clock and Progress Ring */}
            <div className={`status-timer-showcase ${isCriticalTime ? 'showcase-critical' : ''}`}>
              <svg viewBox="0 0 80 80" width="76" height="76" aria-hidden="true">
                <polygon
                  points="24,4 56,4 76,24 76,56 56,76 24,76 4,56 4,24"
                  fill="none"
                  stroke="rgba(245, 245, 240, 0.22)"
                  strokeWidth="1.2"
                />
                <circle cx="40" cy="40" r={radius} fill="none" stroke="rgba(245, 245, 240, 0.16)" strokeWidth="4" />
                <circle
                  cx="40"
                  cy="40"
                  r={radius}
                  fill="none"
                  stroke={isCriticalTime ? '#D9383A' : '#E5A93C'}
                  strokeWidth="4"
                  strokeDasharray={circumference}
                  strokeDashoffset={dashOffset}
                  strokeLinecap="butt"
                  transform="rotate(-90 40 40)"
                  style={{ transition: 'stroke-dashoffset 0.25s linear' }}
                />
              </svg>
              <div className="showcase-readout">
                <span className="showcase-caption">
                  {phase === 'READY' ? 'Timer (Armed)' : 'Time remaining'}
                </span>
                <span className="showcase-digits">{formattedTime}</span>
                <span className="showcase-sub">
                  Turn {String(turnNumber).padStart(2, '0')} / {totalTurns} · {scenario.targetSystem}
                </span>
              </div>
            </div>

            {/* 5-Node Constellation Grid */}
            <div className="status-constellation-box">
              <div className="status-box-label">5-Node Mission Trajectory:</div>
              <div className="status-nodes-list">
                {scenario.constellationNodes.map((nodeLabel, idx) => {
                  const currentNodeNum = idx + 1;
                  const isCompleted = phase === 'ENDED' || currentNodeNum < nodeIndex;
                  const isCurrent = phase !== 'ENDED' && currentNodeNum === nodeIndex;

                  return (
                    <div
                      key={nodeLabel}
                      className={`status-node-pill ${
                        isCompleted ? 'node-pill-complete' : isCurrent ? 'node-pill-current' : 'node-pill-pending'
                      }`}
                    >
                      <span className="node-pill-bullet">
                        {isCompleted ? '✓' : isCurrent ? '◆' : '◇'}
                      </span>
                      <span className="node-pill-text">{nodeLabel}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 3 Telemetry Metrics */}
            <div className="status-metrics-row">
              <div className="status-metric-cell">
                <span className="status-metric-name">Stealth</span>
                <span className="status-metric-val">{metrics.stealth}%</span>
              </div>
              <div className={`status-metric-cell ${metrics.heat >= 60 ? 'status-cell-danger' : ''}`}>
                <span className="status-metric-name">Heat</span>
                <span className="status-metric-val">{metrics.heat}%</span>
              </div>
              <div className="status-metric-cell">
                <span className="status-metric-name">Code Quality</span>
                <span className="status-metric-val">{metrics.codeQuality}%</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
