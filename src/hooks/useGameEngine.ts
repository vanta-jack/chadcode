import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  Choice,
  Ending,
  ImpactSeverity,
  OperatorMetrics,
  Outcome,
  Scenario,
  TerminalHistoryEntry,
  Turn,
} from '../types/scenario';
import { FALLBACK_SCENARIOS, SCENARIO_LIST } from '../data/fallbackScenarios';
import {
  playCommitSlam,
  playCountdownTick,
  playDamageShake,
  playTimeoutBuzzer,
} from '../audio/sound';

export type GamePhase = 'LOADING' | 'ACTIVE' | 'SLAM' | 'RESOLVING' | 'ENDED';

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
  const [phase, setPhase] = useState<GamePhase>('ACTIVE');
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

  const timersRef = useRef<number[]>([]);

  const clearScheduledTimers = useCallback(() => {
    timersRef.current.forEach((id) => window.clearTimeout(id));
    timersRef.current = [];
  }, []);

  // Load scenario JSON asynchronously from ./scenarios/scenario-X.json with fallback
  const loadScenario = useCallback(
    async (targetId: string) => {
      clearScheduledTimers();
      setPhase('LOADING');
      setSelectedChoiceKey(null);
      setActiveOutcome(null);
      setEnding(null);
      setHistory([]);
      setTimeoutCount(0);

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
      setPhase('ACTIVE');
    },
    [clearScheduledTimers]
  );

  useEffect(() => {
    loadScenario(initialScenarioId);
    return () => clearScheduledTimers();
  }, [initialScenarioId, loadScenario, clearScheduledTimers]);

  const currentTurn: Turn = scenario.turns[turnIndex] ?? scenario.turns[0];

  const applyOutcomeAndAdvance = useCallback(
    (
      choiceKey: string,
      choiceLabel: string,
      commandPreview: string,
      outcome: Outcome,
      isTimeout: boolean = false
    ) => {
      // Update cosmetic diegetic metrics
      setMetrics((prev) => ({
        stealth: clampMetric(prev.stealth + outcome.metricsDelta.stealth),
        heat: clampMetric(prev.heat + outcome.metricsDelta.heat),
        codeQuality: clampMetric(
          prev.codeQuality + outcome.metricsDelta.codeQuality
        ),
        persona: outcome.metricsDelta.persona ?? prev.persona,
      }));

      setActiveOutcome({
        choiceKey,
        choiceLabel,
        commandPreview,
        outcome,
      });

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

      // Trigger outcome shake tier
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
      }

      const nextTimeouts = isTimeout ? timeoutCount + 1 : timeoutCount;
      if (isTimeout) {
        setTimeoutCount(nextTimeouts);
      }

      const resolveDelayMs = outcome.severity === 'catastrophic' ? 950 : 750;
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
        setPhase('ACTIVE');
      }, resolveDelayMs);

      timersRef.current.push(advanceTimer);
    },
    [currentTurn.turnNumber, scenario, timeoutCount, turnIndex]
  );

  // Commit choice handler with 50ms Thumper Commit Slam
  const commitChoice = useCallback(
    (choice: Choice) => {
      if (phase !== 'ACTIVE') return;
      clearScheduledTimers();

      setSelectedChoiceKey(choice.key);
      setPhase('SLAM');

      // 50ms Commit Slam: camera punch + bone white flash + audio transient
      playCommitSlam();
      setSensoryEvent({ type: 'COMMIT_SLAM', timestamp: Date.now() });

      const slamTimer = window.setTimeout(() => {
        setPhase('RESOLVING');
        applyOutcomeAndAdvance(
          choice.key,
          choice.label,
          choice.commandPreview,
          choice.outcome,
          false
        );
      }, 55);

      timersRef.current.push(slamTimer);
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

  // Single functional engine variable: timerSec countdown loop
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
      loadScenario(id);
    },
    [loadScenario]
  );

  const restartScenario = useCallback(() => {
    loadScenario(scenarioId);
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
    isPaused,
    setIsPaused,
    commitChoice,
    selectScenario,
    restartScenario,
  };
}

export type GameEngineState = ReturnType<typeof useGameEngine>;
