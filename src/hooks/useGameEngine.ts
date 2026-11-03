import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  Choice,
  Ending,
  ImpactSeverity,
  OperatorMetrics,
  Outcome,
  Scenario,
  ScenarioConcept,
  TerminalHistoryEntry,
  Turn,
} from '../types/scenario';
import { FALLBACK_SCENARIOS, SCENARIO_LIST } from '../data/fallbackScenarios';
import {
  playCommitSlam,
  playConceptUnlocked,
  playCountdownTick,
  playDamageShake,
  playTimeoutBuzzer,
} from '../audio/sound';

export type GamePhase =
  | 'READY'
  | 'LOADING'
  | 'ACTIVE'
  | 'SLAM'
  | 'RESOLVING'
  | 'CONSEQUENCE'
  | 'WAITING_STREAM'
  | 'ENDED';

export type SensoryEvent =
  | { type: 'NONE'; timestamp: number }
  | { type: 'COMMIT_SLAM'; timestamp: number }
  | { type: 'MINOR_SHAKE'; timestamp: number }
  | { type: 'CATASTROPHIC_SHAKE'; timestamp: number };

const clampMetric = (val: number) => Math.max(0, Math.min(100, val));

export function useGameEngine(initialScenarioId: string = 'scenario-1') {
  const [scenarioId, setScenarioId] = useState<string>(initialScenarioId);
  const [scenario, setScenario] = useState<Scenario>(
    () => FALLBACK_SCENARIOS[initialScenarioId] ?? SCENARIO_LIST[0]
  );
  const [turnIndex, setTurnIndex] = useState<number>(0); // 0..9 (Turn 1..10)
  const [phase, setPhase] = useState<GamePhase>('READY');
  const [timerSec, setTimerSec] = useState<number>(
    () => (FALLBACK_SCENARIOS[initialScenarioId] ?? SCENARIO_LIST[0]).turns[0].timerSec
  );
  const [metrics, setMetrics] = useState<OperatorMetrics>(
    () => (FALLBACK_SCENARIOS[initialScenarioId] ?? SCENARIO_LIST[0]).initialMetrics
  );
  const [history, setHistory] = useState<TerminalHistoryEntry[]>([]);
  const [activeOutcome, setActiveOutcome] = useState<{
    choiceKey: string;
    choiceLabel: string;
    commandPreview: string;
    outcome: Outcome;
  } | null>(null);
  const [ending, setEnding] = useState<Ending | null>(null);
  const [sensoryEvent, setSensoryEvent] = useState<SensoryEvent>({
    type: 'NONE',
    timestamp: 0,
  });
  const [selectedChoiceKey, setSelectedChoiceKey] = useState<string | null>(null);
  const [timeoutCount, setTimeoutCount] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);

  // Concept & Steam-style badge unlock state
  const [unlockedConceptIds, setUnlockedConceptIds] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem('chadcode_unlocked_concepts');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [runUnlockedConceptIds, setRunUnlockedConceptIds] = useState<string[]>([]);
  const [justUnlockedConcept, setJustUnlockedConcept] = useState<ScenarioConcept | null>(null);

  const dismissConceptToast = useCallback(() => {
    setJustUnlockedConcept(null);
  }, []);

  // Auto-dismiss concept notification toast after 4.8 seconds
  useEffect(() => {
    if (!justUnlockedConcept) return;
    const toastTimer = window.setTimeout(() => {
      setJustUnlockedConcept(null);
    }, 4800);
    return () => window.clearTimeout(toastTimer);
  }, [justUnlockedConcept]);

  const timersRef = useRef<number[]>([]);

  const clearScheduledTimers = useCallback(() => {
    timersRef.current.forEach((id) => window.clearTimeout(id));
    timersRef.current = [];
  }, []);

  // Load scenario JSON asynchronously from ./scenarios/scenario-X.json with fallback
  const loadScenario = useCallback(
    async (targetId: string, autoStart: boolean = false) => {
      clearScheduledTimers();
      setPhase('LOADING');
      setSelectedChoiceKey(null);
      setActiveOutcome(null);
      setEnding(null);
      setHistory([]);
      setTimeoutCount(0);
      setRunUnlockedConceptIds([]);
      setJustUnlockedConcept(null);

      let loaded: Scenario =
        FALLBACK_SCENARIOS[targetId] ?? FALLBACK_SCENARIOS['scenario-1'];

      try {
        const res = await fetch(`./scenarios/${targetId}.json`, {
          cache: 'no-cache',
        });
        if (res.ok) {
          const data = (await res.json()) as Scenario;
          if (data && Array.isArray(data.turns) && data.turns.length > 0) {
            loaded = data;
          }
        }
      } catch {
        // Fallback scenario already assigned for zero-friction offline/static execution
      }

      setScenarioId(loaded.id);
      setScenario(loaded);
      setTurnIndex(0);
      setMetrics({ ...loaded.initialMetrics });
      setTimerSec(loaded.turns[0].timerSec);
      setSensoryEvent({ type: 'NONE', timestamp: Date.now() });
      setPhase(autoStart ? 'ACTIVE' : 'READY');
    },
    [clearScheduledTimers]
  );

  useEffect(() => {
    loadScenario(initialScenarioId, false);
    return () => clearScheduledTimers();
  }, [initialScenarioId, loadScenario, clearScheduledTimers]);

  const startGame = useCallback(() => {
    if (phase !== 'READY') return;
    playCommitSlam();
    setSensoryEvent({ type: 'COMMIT_SLAM', timestamp: Date.now() });
    setPhase('WAITING_STREAM');
  }, [phase]);

  const currentTurn: Turn = scenario.turns[turnIndex] ?? scenario.turns[0];

  const applyOutcomeAndAdvance = useCallback(
    (
      choiceKey: string,
      choiceLabel: string,
      commandPreview: string,
      outcome: Outcome,
      isTimeout: boolean = false
    ) => {
      // Stage pending action for terminal command echo and in-flight API state
      setActiveOutcome({
        choiceKey,
        choiceLabel,
        commandPreview,
        outcome,
      });

      const nextTimeouts = isTimeout ? timeoutCount + 1 : timeoutCount;
      if (isTimeout) {
        setTimeoutCount(nextTimeouts);
      }

      // Deliberate 4–8 seconds random jitter delay while "Human is thinking..." (emulates API call in flight, building suspense)
      const randomJitterMs = isTimeout
        ? 1500
        : Math.floor(4000 + Math.random() * 4000); // 4000ms to 8000ms

      const thinkingTimer = window.setTimeout(() => {
        // Human has finished thinking: NOW transition to CONSEQUENCE phase and trigger effects
        setPhase('CONSEQUENCE');

        // Apply metrics delta and commit turn logs to history upon operator verdict
        setMetrics((prev) => ({
          stealth: clampMetric(prev.stealth + outcome.metricsDelta.stealth),
          heat: clampMetric(prev.heat + outcome.metricsDelta.heat),
          codeQuality: clampMetric(
            prev.codeQuality + outcome.metricsDelta.codeQuality
          ),
          persona: outcome.metricsDelta.persona ?? prev.persona,
        }));

        setHistory((prev) => [
          ...prev,
          {
            turnNumber: currentTurn.turnNumber,
            command: commandPreview,
            choiceKey,
            choiceLabel,
            logs: outcome.logOutput,
            severity: outcome.severity,
          },
        ]);

        // Trigger consequence effects: screen shake, buzzer, vermilion flash (catastrophic), bone flash (clean)
        if (isTimeout) {
          playTimeoutBuzzer();
          playDamageShake(true);
          setSensoryEvent({ type: 'CATASTROPHIC_SHAKE', timestamp: Date.now() });
        } else if (outcome.severity === 'catastrophic') {
          playDamageShake(true);
          setSensoryEvent({ type: 'CATASTROPHIC_SHAKE', timestamp: Date.now() });
        } else if (outcome.severity === 'minor') {
          playDamageShake(false);
          setSensoryEvent({ type: 'MINOR_SHAKE', timestamp: Date.now() });
        } else if (outcome.severity === 'clean') {
          playCommitSlam();
          setSensoryEvent({ type: 'COMMIT_SLAM', timestamp: Date.now() });
        }

        // Check if this outcome triggers a Concept unlock (Steam achievement badge)
        if (outcome.conceptUnlock && scenario.concepts) {
          const conceptObj = scenario.concepts.find(
            (c) => c.id === outcome.conceptUnlock
          );
          if (conceptObj) {
            setRunUnlockedConceptIds((prevRun) => {
              if (prevRun.includes(conceptObj.id)) return prevRun;
              return [...prevRun, conceptObj.id];
            });

            setUnlockedConceptIds((prevAll) => {
              if (prevAll.includes(conceptObj.id)) return prevAll;
              const nextAll = [...prevAll, conceptObj.id];
              try {
                localStorage.setItem(
                  'chadcode_unlocked_concepts',
                  JSON.stringify(nextAll)
                );
              } catch {
                // Ignore storage errors
              }
              return nextAll;
            });

            // Play triumphant procedural arpeggio and trigger Steam-style badge notification
            setJustUnlockedConcept(conceptObj);
            playConceptUnlocked();
          }
        }

        // Give player 3.3 seconds in CONSEQUENCE phase to absorb the impact and read outcome logs
        const consequenceDurationMs = 3300;

        const advanceTimer = window.setTimeout(() => {
          // Check if an ending is reached (Turn 10 or explicit endingId or 3 timeouts)
          if (nextTimeouts >= 3 && scenario.endings['ending-chud']) {
            setEnding(scenario.endings['ending-chud']);
            setPhase('ENDED');
            return;
          }

          if (outcome.endingId && scenario.endings[outcome.endingId]) {
            setEnding(scenario.endings[outcome.endingId]);
            setPhase('ENDED');
            return;
          }

          const nextIdx = turnIndex + 1;
          if (nextIdx >= scenario.turns.length) {
            const fallbackEnding =
              scenario.endings['ending-sovereign'] ??
              Object.values(scenario.endings)[0];
            setEnding(fallbackEnding);
            setPhase('ENDED');
            return;
          }

          const nextTurnObj = scenario.turns[nextIdx];
          setTurnIndex(nextIdx);
          setTimerSec(nextTurnObj.timerSec);
          setSelectedChoiceKey(null);
          setActiveOutcome(null);
          // Enter WAITING_STREAM so next choices are hidden until situation stream completes
          setPhase('WAITING_STREAM');
        }, consequenceDurationMs);

        timersRef.current.push(advanceTimer);
      }, randomJitterMs);

      timersRef.current.push(thinkingTimer);
    },
    [currentTurn.turnNumber, scenario, timeoutCount, turnIndex]
  );

  // Called by TerminalBuffer when the situation stream finishes rendering
  const handleStreamComplete = useCallback(() => {
    if (phase === 'WAITING_STREAM') {
      setPhase('ACTIVE');
    }
  }, [phase]);

  // Commit choice handler: enters RESOLVING (Human is thinking...) without premature flash or shake
  const commitChoice = useCallback(
    (choice: Choice) => {
      if (phase !== 'ACTIVE') return;
      clearScheduledTimers();

      setSelectedChoiceKey(choice.key);
      setPhase('RESOLVING');

      applyOutcomeAndAdvance(
        choice.key,
        choice.label,
        choice.commandPreview,
        choice.outcome,
        false
      );
    },
    [applyOutcomeAndAdvance, clearScheduledTimers, phase]
  );

  // Forced timeout handler when timerSec reaches 0
  const triggerTimeout = useCallback(() => {
    if (phase !== 'ACTIVE') return;
    clearScheduledTimers();

    setSelectedChoiceKey('TIMEOUT');
    setPhase('RESOLVING');

    applyOutcomeAndAdvance(
      'TIMEOUT',
      'TIMEOUT — Watchdog window expired before commit',
      'chadcode > [SIGALRM: WATCHDOG_TIMEOUT_00s]',
      currentTurn.timeoutOutcome,
      true
    );
  }, [applyOutcomeAndAdvance, clearScheduledTimers, currentTurn.timeoutOutcome, phase]);

  // Single functional engine variable: timerSec countdown loop (runs strictly when phase === 'ACTIVE')
  useEffect(() => {
    if (phase !== 'ACTIVE' || isPaused) return;

    if (timerSec <= 0) {
      triggerTimeout();
      return;
    }

    const intervalId = window.setInterval(() => {
      setTimerSec((prev) => {
        const next = prev - 1;
        if (next > 0) {
          playCountdownTick(next);
        }
        return Math.max(0, next);
      });
    }, 1000);

    // Accelerated double-time audio pulse when timerSec <= 5
    let urgentSubTickId: number | undefined;
    if (timerSec <= 5 && timerSec > 0) {
      urgentSubTickId = window.setTimeout(() => {
        playCountdownTick(timerSec - 0.5);
      }, 500);
    }

    return () => {
      window.clearInterval(intervalId);
      if (urgentSubTickId !== undefined) {
        window.clearTimeout(urgentSubTickId);
      }
    };
  }, [phase, isPaused, timerSec, triggerTimeout]);

  const selectScenario = useCallback(
    (id: string) => {
      loadScenario(id, false);
    },
    [loadScenario]
  );

  const restartScenario = useCallback(() => {
    loadScenario(scenarioId, false);
  }, [loadScenario, scenarioId]);

  return {
    scenario,
    scenarios: SCENARIO_LIST,
    currentTurn,
    turnIndex,
    totalTurns: scenario.turns.length,
    phase,
    timerSec,
    maxTimerSec: currentTurn.timerSec,
    metrics,
    history,
    activeOutcome,
    ending,
    sensoryEvent,
    selectedChoiceKey,
    unlockedConceptIds,
    runUnlockedConceptIds,
    justUnlockedConcept,
    dismissConceptToast,
    isPaused,
    setIsPaused,
    startGame,
    handleStreamComplete,
    commitChoice,
    selectScenario,
    restartScenario,
  };
}

export type GameEngineState = ReturnType<typeof useGameEngine>;
