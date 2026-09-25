import { apiClient } from '../../services/apiClient';
import { SIMULATION_SNAPSHOT_KEY } from '../simulation/simulationSnapshot';
import { LOCAL_INCIDENTS_KEY } from '../routing/incidentFeed';
import { PREDICTION_SETTINGS_KEY } from '../prediction/predictionModel';

export const DEMO_RESET_EVENT_KEY = 'vialert-phase7-reset-token';
export const DEMO_STORAGE_KEYS = [SIMULATION_SNAPSHOT_KEY, LOCAL_INCIDENTS_KEY, PREDICTION_SETTINGS_KEY] as const;

export type DemoStorage = Pick<Storage, 'removeItem' | 'setItem'>;
export type DemoResetResult = { backend: 'reset' | 'offline'; browser: 'cleared' | 'partial' | 'unavailable' };

let resetSequence = 0;

function browserStorage(): DemoStorage | null {
  try { return typeof window === 'undefined' ? null : window.localStorage; }
  catch { return null; }
}

export function clearDemoStorage(storage: DemoStorage | null, token = `${Date.now()}-${++resetSequence}`): DemoResetResult['browser'] {
  if (!storage) return 'unavailable';
  let complete = true;
  for (const key of DEMO_STORAGE_KEYS) {
    try { storage.removeItem(key); }
    catch { complete = false; }
  }
  // Other open VIALERT tabs reload from the clean graph after this final write.
  try { storage.setItem(DEMO_RESET_EVENT_KEY, token); }
  catch { complete = false; }
  return complete ? 'cleared' : 'partial';
}

export async function resetDemo(
  storage: DemoStorage | null = browserStorage(),
  resetBackend: () => Promise<unknown> = () => apiClient.resetSimulation(AbortSignal.timeout(3000)),
): Promise<DemoResetResult> {
  let backend: DemoResetResult['backend'] = 'reset';
  try { await resetBackend(); }
  catch { backend = 'offline'; }
  return { backend, browser: clearDemoStorage(storage) };
}

export function resetMessage(result: DemoResetResult): string {
  if (result.browser !== 'cleared') return 'Browser storage could not be fully cleared. Close other demo tabs, allow site storage, and retry Reset demo.';
  return result.backend === 'reset'
    ? 'Demo reset: ambulance, scenarios, incidents, signals, alerts, and forecast settings are back at baseline.'
    : 'Browser demo reset. Node API is offline, so its in-memory records may still need a reset when it returns.';
}
