import type { Scenario } from '../types/scenario.ts';
import { scenario1VibeCoder } from './scenarios/scenario1VibeCoder.ts';
import { scenario2Junior } from './scenarios/scenario2Junior.ts';
import { scenario3Senior } from './scenarios/scenario3Senior.ts';
import { scenario4Founder } from './scenarios/scenario4Founder.ts';
import { scenario5Alignment } from './scenarios/scenario5Alignment.ts';

export const FALLBACK_SCENARIOS: Record<string, Scenario> = {
  'scenario-1': scenario1VibeCoder,
  'scenario-2': scenario2Junior,
  'scenario-3': scenario3Senior,
  'scenario-4': scenario4Founder,
  'scenario-5': scenario5Alignment,
};

export const SCENARIO_LIST = Object.values(FALLBACK_SCENARIOS);
