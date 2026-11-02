import React from 'react';

export type ActiveMobileTab = 'menu' | 'situation' | 'action';

interface MobileTabBarProps {
  activeTab: ActiveMobileTab;
  onSelectTab: (tab: ActiveMobileTab) => void;
  onHoverTick: () => void;
  timerSec: number;
  isReady: boolean;
  selectedChoiceKey: string | null;
}

export const MobileTabBar: React.FC<MobileTabBarProps> = ({
  activeTab,
  onSelectTab,
  onHoverTick,
  timerSec,
  isReady,
  selectedChoiceKey,
}) => {
  return (
    <nav className="mobile-tab-pill-bar" aria-label="Mobile viewport tabs">
      <div className="mobile-tab-pill-container">
        {/* Tab 1: Menu / Configuration (Sliders / Settings / Mission overview icon) */}
        <button
          type="button"
          className={`mobile-tab-btn ${activeTab === 'menu' ? 'tab-btn-active' : ''}`}
          onClick={() => onSelectTab('menu')}
          onMouseEnter={onHoverTick}
          aria-label="Menu and Mission Operations"
          title="Menu / Config"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
            <line x1="4" y1="6" x2="20" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <circle cx="9" cy="6" r="2.5" fill="currentColor" />
            <line x1="4" y1="12" x2="20" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <circle cx="15" cy="12" r="2.5" fill="currentColor" />
            <line x1="4" y1="18" x2="20" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <circle cx="7" cy="18" r="2.5" fill="currentColor" />
          </svg>
          <span className="mobile-tab-label">Menu</span>
        </button>

        {/* Tab 2: Situation (Terminal Workstation / CLI / Telemetry icon) */}
        <button
          type="button"
          className={`mobile-tab-btn ${activeTab === 'situation' ? 'tab-btn-active' : ''}`}
          onClick={() => onSelectTab('situation')}
          onMouseEnter={onHoverTick}
          aria-label="Current Situation and Terminal Logs"
          title="Situation / Logs"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
            <rect x="3" y="4" width="18" height="16" fill="none" stroke="currentColor" strokeWidth="2" />
            <polyline points="7,9 11,12 7,15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <line x1="13" y1="15" x2="17" y2="15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <span className="mobile-tab-label">Situation</span>
        </button>

        {/* Tab 3: Choose Answer / Action Deck (Target / Tactical Action Grid icon) */}
        <button
          type="button"
          className={`mobile-tab-btn ${activeTab === 'action' ? 'tab-btn-active' : ''}`}
          onClick={() => onSelectTab('action')}
          onMouseEnter={onHoverTick}
          aria-label="Choose Tactical Vector"
          title="Choose Answer / Actions"
        >
          <div className="tab-icon-wrapper">
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
              <polygon points="12,2 22,12 12,22 2,12" fill="none" stroke="currentColor" strokeWidth="2" />
              <circle cx="12" cy="12" r="3" fill="currentColor" />
            </svg>
            {!isReady && timerSec <= 5 && timerSec > 0 && (
              <span className="tab-urgent-dot" aria-hidden="true" />
            )}
          </div>
          <span className="mobile-tab-label">
            {selectedChoiceKey ? `[${selectedChoiceKey}]` : 'Action'}
          </span>
        </button>
      </div>
    </nav>
  );
};
