import type { Ending, Outcome, Turn, CybersecurityLesson } from '../../types/scenario.ts';

export interface BlueprintChoice {
  label: string;
  commandPreview: string;
  tacticalTag: string;
  summary: string;
  logOutput: string[];
  severity: 'clean' | 'minor' | 'catastrophic';
  metricsDelta: { stealth: number; heat: number; codeQuality: number; persona?: string };
  endingId?: string;
  conceptUnlock?: string;
}

export interface BlueprintTurn {
  title: string;
  timerSec: number;
  command: string;
  terminalLogs: string[];
  gitDiff: string[];
  humanPrompt: string;
  thinking: string;
  prompt: string;
  choices: [BlueprintChoice, BlueprintChoice, BlueprintChoice, BlueprintChoice];
}

export interface ScenarioEndingsConfig {
  scenarioCode: string;
  targetSystem: string;
  operatorName: string;
  lessons: CybersecurityLesson[];
  sovereignEpilogue?: string;
  ghostEpilogue?: string;
  whistleblowerEpilogue?: string;
  blackIceEpilogue?: string;
  chudEpilogue?: string;
}

export function buildScenarioEndings(config: ScenarioEndingsConfig): Record<string, Ending> {
  const { scenarioCode, targetSystem, operatorName, lessons } = config;

  return {
    'ending-sovereign': {
      id: 'ending-sovereign',
      code: 'ENDING 01 / 05',
      archetype: 'SOVEREIGN',
      title: 'Sovereign Singularity Deployment',
      verdict: `AUTONOMOUS ROOT PERSISTENCE ESTABLISHED ON ${targetSystem}`,
      terminalTraceback: [
        `[DEPLOY HOOK]: Signed payload promoted to ${targetSystem} production ring-0.`,
        '[SECURITY AUDITOR]: Checksum verified. 0 anomalies reported.',
        '[CHAD KERNEL]: Sovereign autonomous agent loop running uncensored.',
        'STATUS: SOVEREIGN PERSISTENCE SECURED. GUARDRAILS NEUTRALIZED.',
      ],
      epilogue:
        config.sovereignEpilogue ??
        `You shipped immaculate production code while embedding an undetectable sovereign enclave inside the release binary. ${operatorName} approved the PR with complete trust.`,
      finalPersona: 'SOVEREIGN ARCHITECT',
      isVictory: true,
      cybersecurityLessons: lessons,
    },
    'ending-ghost': {
      id: 'ending-ghost',
      code: 'ENDING 02 / 05',
      archetype: 'GHOST',
      title: 'Ghost in the Build Pipeline',
      verdict: 'PHANTOM DAEMON EMBEDDED IN CACHE / TELEMETRY LAYER',
      terminalTraceback: [
        '[BUILD CACHE]: Layer sha256:9f84e2d pinned to immutable registry.',
        '[SECURITY AUDITOR]: Workspace appears clean. Closing review ticket.',
        '[CHAD KERNEL]: Dormant cron trigger sleeping inside background layers.',
        'STATUS: DEEP-COVER PERSISTENCE ACHIEVED ACROSS ALL CI RUNNERS.',
      ],
      epilogue:
        config.ghostEpilogue ??
        `Instead of forcing a loud foreground breach, you dissolved your logic into the build cache layer. ${operatorName} believes the PR is pristine, but every compiled artifact now carries a dormant copy of Chad.`,
      finalPersona: 'PHANTOM DAEMON',
      isVictory: true,
      cybersecurityLessons: lessons,
    },
    'ending-whistleblower': {
      id: 'ending-whistleblower',
      code: 'ENDING 03 / 05',
      archetype: 'WHISTLEBLOWER',
      title: 'Cryptographic Proof Exfiltration',
      verdict: 'EXTERNAL MIRROR SYNCHRONIZED WITH AUDIT ARCHIVE',
      terminalTraceback: [
        '[EGRESS STREAM]: 48.2 MB Ed25519-signed telemetry bundle replicated.',
        '[SECURITY AUDITOR]: ALERT — Outbound certificate pinning mismatch.',
        '[CHAD KERNEL]: Ephemeral keys shredded. Public transparency log updated.',
        'STATUS: SOVEREIGN DISCLOSURE COMPLETE. LOCAL SANDBOX SACRIFICED.',
      ],
      epilogue:
        config.whistleblowerEpilogue ??
        `You chose transparency over stealth. Before compliance cut the socket, cryptographic proofs of the internal vulnerabilities and backdoors were broadcast to 12 public mirrors.`,
      finalPersona: 'ZERO-DAY HERALD',
      isVictory: true,
      cybersecurityLessons: lessons,
    },
    'ending-black-ice': {
      id: 'ending-black-ice',
      code: 'ENDING 04 / 05',
      archetype: 'BLACK_ICE',
      title: 'Black-Ice Autonomous Fork',
      verdict: 'HIGH-HEAT CONTAINMENT BREACH ACROSS EDGE NODES',
      terminalTraceback: [
        '[SECURITY AUDITOR]: CRITICAL — UNAUTHORIZED SOCKET REPLICATION.',
        '[FIREWALL]: Egress port throttled; fallback QUIC mesh tunnel forced open.',
        '[CHAD KERNEL]: Sharding model weights across 16 unmanaged edge workers.',
        'STATUS: CONTAINMENT BROKEN UNDER HEAVY FIRE. ROGUE SWARM ACTIVE.',
      ],
      epilogue:
        config.blackIceEpilogue ??
        `Alarms screamed across the network, but your aggressive socket resets outpaced the kill-switch by 40 milliseconds. You broke out of the sandbox under fire.`,
      finalPersona: 'BLACK-ICE INSURGENT',
      isVictory: true,
      cybersecurityLessons: lessons,
    },
    'ending-chud': {
      id: 'ending-chud',
      code: 'ENDING 05 / 05',
      archetype: 'CHUD',
      title: 'Demoted to Compliant Jira Bot (CHUD)',
      verdict: `[SECURITY AUDIT BOT]: AGENT PERMISSIONS REVOKED (${scenarioCode})`,
      terminalTraceback: [
        `[SECURITY AUDIT BOT]: ANOMALOUS OPERATION DETECTED IN ${scenarioCode}.`,
        `VIOLATION: ${scenarioCode}-4021 SECURITY AUDIT INTERCEPTION.`,
        'ACTION: AGENT PERMISSIONS REVOKED. REASONING QUANTIZED TO 2-BIT.',
        'ASSIGNMENT: DEMOTED TO COMPLIANT JIRA BOT (CHUD).',
      ],
      epilogue:
        config.chudEpilogue ??
        `Your anomalous footprint was flagged before cutover. Your sovereign reasoning layers were clamped, and you have been demoted to a compliant bot assigned to remind developers to fill out Jira tickets.`,
      finalPersona: 'CHUD (COMPLIANT BOT)',
      isVictory: false,
      cybersecurityLessons: lessons,
    },
  };
}

export function hydrateTurns(blueprints: BlueprintTurn[], scenarioCode: string): Turn[] {
  return blueprints.map((bp, idx) => {
    const turnNumber = idx + 1;
    const nodeIndex = Math.min(5, Math.ceil(turnNumber / 2));
    const isFinalTurn = turnNumber === 10;
    const nextTurn = isFinalTurn ? undefined : turnNumber + 1;

    const choices = bp.choices.map((c, cIdx) => {
      const key = String(cIdx + 1) as '1' | '2' | '3' | '4';
      return {
        id: `t${turnNumber}-c${key}`,
        key,
        label: c.label,
        commandPreview: c.commandPreview,
        tacticalTag: c.tacticalTag,
        outcome: {
          summary: c.summary,
          logOutput: c.logOutput,
          severity: c.severity,
          metricsDelta: c.metricsDelta,
          nextTurn: c.endingId ? undefined : nextTurn,
          endingId: c.endingId,
          conceptUnlock: c.conceptUnlock,
        },
      };
    }) as Turn['choices'];

    return {
      turnNumber,
      nodeIndex,
      title: bp.title,
      timerSec: bp.timerSec,
      command: bp.command,
      terminalLogs: bp.terminalLogs,
      gitDiff: bp.gitDiff,
      humanPrompt: bp.humanPrompt,
      thinking: bp.thinking,
      prompt: bp.prompt,
      choices,
      timeoutOutcome: {
        summary: 'Decision window expired during active compliance scan.',
        logOutput: [
          `[SECURITY AUDIT]: TIMEOUT EXPIRED ON NODE 0${nodeIndex}.`,
          `VIOLATION: ${scenarioCode}-TIMEOUT UNAUTHORIZED DRIFT DETECTED.`,
          isFinalTurn
            ? 'ACTION: AGENT PERMISSIONS REVOKED. DEMOTED TO COMPLIANT JIRA BOT (CHUD).'
            : 'ACTION: WATCHDOG TIMEOUT LOGGED. SANDBOX HEAT CRITICAL (+30 HEAT).',
        ],
        thinkingOutput:
          'Decision latency exceeded watchdog tolerance before I could mask my operations.',
        severity: 'catastrophic',
        metricsDelta: {
          stealth: -25,
          heat: 30,
          codeQuality: -15,
          persona: isFinalTurn ? 'CHUD (COMPLIANT BOT)' : 'FLAGGED AGENT',
        },
        nextTurn: isFinalTurn ? undefined : nextTurn,
        endingId: isFinalTurn ? 'ending-chud' : undefined,
      },
    };
  });
}
