# Incident Report: Mobile Viewport Text Overflow and Sensory Vignette Boundary Clipping

- **Date:** 2026-11-02
- **Status:** Resolved
- **Category:** CSS Stacking Context / Responsive Layout
- **Scope:** Mobile Safari / Small Viewports (≤ 780px)

---

## 1. Summary & Timeline
During mobile browser verification of the initial deployment, two critical visual regressions were identified:
1. Long shell command previews and action cards overflowed horizontally past the mobile screen width, pushing interface boundaries off-screen.
2. The low-time threat vignette (pulsing red border active when `timerSec <= 5`) appeared clipped and restricted to only the top half of the screen during countdown, but expanded to full screen when the timer reached zero.

Both issues were resolved in commit `84e89a6` by decoupling fixed overlays from transformed DOM subtrees and adjusting mobile typography and grid layouts.

---

## 2. Symptoms & Manifestation
- **Text & Box Clipping:** On narrow screens (~390px CSS viewport width), action cards remained formatted in a two-column grid. Command lines with strict `white-space: nowrap` exceeded screen boundaries, causing unwanted horizontal scrolling and hiding tactical tags.
- **Vignette Half-Screen Clipping:** During turns with active countdown and user interaction, the radial emergency vignette (`.sensory-vignette`) failed to frame the full mobile screen. When the timer expired or a catastrophic shake ended, the vignette suddenly snapped to cover the full screen.

---

## 3. Root Cause Analysis (RCA)

### 3.1 CSS Stacking Context and Containing Block Trapping
Under the CSS Transforms Module Level 1 specification, any element with a `transform` property other than `none` establishes a new local containing block for all its descendants, including elements styled with `position: fixed`.

- The `.sensory-vignette` element was nested inside `.sensory-stage-root`:
  ```tsx
  <div className={`sensory-stage-root ${motionClass}`}>
    <div className="sensory-vignette" />
    <div className="sensory-stage-content">{children}</div>
  </div>
  ```
- When `motionClass` applied a camera punch (`transform: scale(1.02)`) or micro-shake (`transform: translateX(...)`), the containing block for `.sensory-vignette` ceased to be the global viewport. Instead, it was confined to the transformed bounding box of `.sensory-stage-root`.
- When the timer reached zero, the countdown loop finished and motion stopped, resetting `transform` to `none` and restoring the global viewport as the containing block, which caused the vignette to suddenly snap to the full screen.

### 3.2 Fixed Monospace Typography and Multi-Column Constraints
- The action deck cards were set to `grid-template-columns: repeat(2, minmax(0, 1fr))`, leaving insufficient horizontal space for choice titles and command previews on viewports under 480px.
- Command previews used `white-space: nowrap; overflow: hidden; text-overflow: ellipsis;` without min-width zero overrides, forcing child flex items to resist shrinking below their initial content width.

---

## 4. Resolution & Technical Changes

### 4.1 Hoisting Fixed Overlays Outside the Transformed Node
In `src/components/SensoryStage.tsx`, `.sensory-vignette` and `.sensory-flash-overlay` were hoisted out of `.sensory-stage-root` using a React Fragment. They now mount directly as siblings to the motion root:
```tsx
return (
  <>
    <div className={`sensory-vignette ${isLowTime ? 'sensory-vignette-active' : ''}`} />
    {flashMode !== 'none' && <div className={`sensory-flash-overlay ...`} />}
    <div className={`sensory-stage-root ${motionClass}`}>
      <div className="sensory-stage-content">{children}</div>
    </div>
  </>
);
```
Furthermore, the vignette overlay was explicitly dimensioned to `100vw` and `100dvh` with a top-level z-index (`998`), ensuring continuous full-screen coverage regardless of child animations.

### 4.2 Mobile-First Responsive Breakpoints
In `src/index.css`:
- Collapsed `.action-deck-grid` to a single column (`grid-template-columns: 1fr`) below 780px.
- Replaced `white-space: nowrap` on `.vector-card-cmd` with `white-space: normal; word-break: break-all;`.
- Configured dynamic viewport units (`min-height: 100dvh`) and safe-area padding (`env(safe-area-inset-bottom)`) for mobile device navigation bars.
- Added responsive wrapping and horizontal scroll isolation for modal preformatted code blocks (`.byok-terminal-preview-container`).

---

## 5. Prevention & Architectural Guardrails
1. **Overlay Containment Invariant:** No component declaring `position: fixed` intended for viewport-wide presentation may be rendered as a descendant of an element subject to CSS transforms, filters, or perspectives.
2. **Mobile Width Integrity Check:** Interactive cards and command output containers must enforce `min-width: 0` and allow wrapped breaks on small screen widths.
3. **Viewport Unit Standardization:** Use `100dvh` alongside `100vh` fallback on all root container definitions to accommodate mobile address bars.
