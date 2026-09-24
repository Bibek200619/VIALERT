import type { SimulationState } from './simulationTypes';

export const SIMULATION_SNAPSHOT_KEY = 'vialert-phase3-simulation-snapshot';

export interface SimulationSnapshot {
  state: SimulationState;
  publishedAt: number;
}

export function readSimulationSnapshot(storage: Pick<Storage, 'getItem'>): SimulationSnapshot | null {
  try {
    const raw = storage.getItem(SIMULATION_SNAPSHOT_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    const snapshot = parsed as Partial<SimulationSnapshot>;
    if (typeof snapshot.publishedAt !== 'number' || !Number.isFinite(snapshot.publishedAt) || !snapshot.state
      || !Array.isArray(snapshot.state.routeNodeIds) || !Array.isArray(snapshot.state.routeRoadIds)
      || !Array.isArray(snapshot.state.events) || !Array.isArray(snapshot.state.scenarios)
      || typeof snapshot.state.currentNodeId !== 'string' || !snapshot.state.vehicle
      || typeof snapshot.state.vehicle.ambulanceId !== 'string') return null;
    return snapshot as SimulationSnapshot;
  } catch {
    return null;
  }
}
