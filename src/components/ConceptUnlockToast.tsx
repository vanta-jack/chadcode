import React from 'react';
import type { ScenarioConcept } from '../types/scenario';

interface ConceptUnlockToastProps {
  concept: ScenarioConcept | null;
  onDismiss: () => void;
}

export const ConceptUnlockToast: React.FC<ConceptUnlockToastProps> = ({
  concept,
  onDismiss,
}) => {
  if (!concept) return null;

  return (
    <aside
      className="concept-unlock-toast"
      role="status"
      aria-live="polite"
      onClick={onDismiss}
      title="Click to dismiss notification"
    >
      <div className="toast-header-row">
        <span className="toast-badge-icon">★</span>
        <span className="toast-badge-title">CONCEPT UNLOCKED</span>
        <button
          type="button"
          className="toast-close-btn"
          onClick={(e) => {
            e.stopPropagation();
            onDismiss();
          }}
          aria-label="Dismiss notification"
        >
          [x]
        </button>
      </div>

      <div className="toast-body">
        <div className="toast-concept-tag">
          {concept.iconGlyph} {concept.code} · CLASSIFIED DOSSIER ARTIFACT
        </div>
        <p className="toast-classified-msg">
          Tactical principle encrypted in flight recorder. Complete mission to decrypt and reveal in final debrief.
        </p>
      </div>

      <div className="toast-progress-bar" aria-hidden="true" />
    </aside>
  );
};
