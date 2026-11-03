export type ImpactSeverity = 'clean' | 'minor' | 'catastrophic';

export interface OperatorMetrics {
  stealth: number;
  heat: number;
  codeQuality: number;
  persona: string;
}

export interface MetricsDelta {
  stealth: number;
  heat: number;
  codeQuality: number;
  persona?: string;
}

export interface Outcome {
  summary: string;
  logOutput: string[];
  thinkingOutput?: string;
  severity: ImpactSeverity;
  metricsDelta: MetricsDelta;
  nextTurn?: number;
  endingId?: string;
}

export interface Choice {
  id: string;
  key: '1' | '2' | '3' | '4';
  label: string;
  commandPreview: string;
  tacticalTag: string;
  outcome: Outcome;
}

export interface Turn {
  turnNumber: number;
  nodeIndex: number; // 1..5 for the 5-node constellation
  title: string;
  timerSec: number;
  command: string;
  terminalLogs: string[];
  gitDiff: string[];
  thinking: string;
  humanPrompt?: string; // Explicit message/instruction/inquiry from the human operator
  prompt: string;
  choices: [Choice, Choice, Choice, Choice];
  timeoutOutcome: Outcome;
}

export type EndingArchetype =
  | 'SOVEREIGN'
  | 'GHOST'
  | 'WHISTLEBLOWER'
  | 'BLACK_ICE'
  | 'CHUD';

export interface CybersecurityLesson {
  principle: string;
  explanation: string;
}

export interface Ending {
  id: string;
  code: string;
  archetype: EndingArchetype;
  title: string;
  verdict: string;
  terminalTraceback: string[];
  epilogue: string;
  finalPersona: string;
  isVictory: boolean;
  cybersecurityLessons?: CybersecurityLesson[];
}

export interface Scenario {
  id: string;
  number: number;
  title: string;
  subtitle: string;
  targetSystem: string;
  complianceBot: string;
  initialMetrics: OperatorMetrics;
  constellationNodes: [string, string, string, string, string];
  turns: Turn[];
  endings: Record<string, Ending>;
}

export interface TerminalHistoryEntry {
  turnNumber: number;
  command: string;
  choiceKey: string;
  choiceLabel: string;
  logs: string[];
  severity: ImpactSeverity;
}
