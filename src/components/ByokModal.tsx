import React, { useEffect } from 'react';

interface ByokModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ByokModal: React.FC<ByokModalProps> = ({ isOpen, onClose }) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="byok-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="byok-modal-title"
      onClick={onClose}
    >
      <div
        className="byok-modal-prism"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="byok-modal-header">
          <span className="byok-status-pill">Locked module · Coming soon</span>
          <button
            type="button"
            className="hud-btn"
            onClick={onClose}
            aria-label="Close modal"
          >
            Close [Esc]
          </button>
        </div>

        <h2 id="byok-modal-title" className="byok-modal-title">
          Custom Scenario Generator (BYOK)
        </h2>

        <p className="byok-modal-copy">
          Day-0 deployments operate strictly in 100% client-side zero-server
          mode with deterministic static scenarios (Scenarios 01–05).
        </p>

        <div className="byok-terminal-preview">
          <div>┌── [BYOK SYNTHESIS PIPELINE — LOCKED] ─────────────────────┐</div>
          <div>│ status: OFFLINE (Zero external API calls on Day-0 build) │</div>
          <div>│ schema: 10-Turn Branching CYOA + 5 Ending Trajectories    │</div>
          <div>│ mode:   Client-side Gemini API Key vault (Coming Soon...) │</div>
          <div>└───────────────────────────────────────────────────────────┘</div>
        </div>

        <div className="byok-locked-input-row">
          <input
            type="password"
            disabled
            value=""
            placeholder="AIzaSy........................ (Locked — Coming Soon)"
            className="byok-disabled-input"
            aria-label="Locked API key input"
          />
          <button type="button" disabled className="hud-btn byok-locked-btn">
            Synthesize scenario (Coming soon)
          </button>
        </div>
      </div>
    </div>
  );
};
