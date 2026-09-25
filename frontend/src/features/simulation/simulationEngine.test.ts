import { describe, expect, it } from 'vitest';
import { demoCityData } from '../ambulance/ambulanceData';
import { getScenarioTemplates } from './simulationData';
import { applyScenarioEffects, createInitialSimulationState, simulationReducer } from './simulationEngine';
import type { Scenario, SimulationAction, SimulationState } from './simulationTypes';

const initial = () => createInitialSimulationState(demoCityData);
const reduce = (state: SimulationState, action: SimulationAction) => simulationReducer(state, action, demoCityData);
const template = (id: string) => getScenarioTemplates(demoCityData).find((scenario) => scenario.id === id)!;

function activate(state: SimulationState, templateId: string, roadId: string, severity?: Scenario['severity']) {
  return reduce(state, { type: 'activate-scenario', template: template(templateId), roadId, severity });
}

describe('simulation engine', () => {
  it('creates a ready, deterministic default city route and vehicle', () => {
    const state = initial();
    expect(state.status).toBe('ready');
    expect(state.speedMultiplier).toBe(1);
    expect(state.vehicle).toMatchObject({ ambulanceId: 'AMB-07', baseId: 'BASE-1', destinationId: 'HOSP-2' });
    expect(state.currentNodeId).toBe('BASE-1');
    expect(state.routeNodeIds[0]).toBe('BASE-1');
    expect(state.routeNodeIds.at(-1)).toBe('HOSP-2');
    expect(state.activeScenarioIds).toEqual([]);
    expect(state.events).toEqual([]);
  });

  it('starts, pauses, resumes, and resets with replayable event IDs', () => {
    let state = reduce(initial(), { type: 'start' });
    expect(state.status).toBe('running');
    state = reduce(state, { type: 'pause' });
    expect(state.status).toBe('paused');
    state = reduce(state, { type: 'resume' });
    expect(state.status).toBe('running');
    const firstReset = reduce(state, { type: 'reset' });
    const secondReset = reduce(initial(), { type: 'reset' });
    expect(firstReset).toEqual(secondReset);
    expect(firstReset.status).toBe('ready');
    expect(firstReset.events[0]).toMatchObject({ id: 'event-0001', type: 'simulation_reset', timestampSeconds: 0 });
  });

  it('advances one deterministic route segment and updates remaining ETA/distance', () => {
    const ready = initial();
    const firstRoad = demoCityData.roads.find((road) => road.id === ready.routeRoadIds[0])!;
    const moved = reduce(reduce(ready, { type: 'start' }), { type: 'tick' });
    expect(moved.currentNodeId).toBe(ready.routeNodeIds[1]);
    expect(moved.distanceTravelledMeters).toBe(firstRoad.distanceMeters);
    expect(moved.distanceRemainingMeters).toBeLessThan(ready.distanceRemainingMeters);
    expect(moved.etaSeconds).toBeLessThan(ready.etaSeconds);
    expect(moved.events.some((event) => event.type === 'junction_passed')).toBe(true);
  });

  it('uses speed multipliers to advance more route segments per tick', () => {
    const state = reduce(initial(), { type: 'start' });
    const oneX = reduce(state, { type: 'tick' });
    const fiveX = reduce(reduce(state, { type: 'set-speed', speed: 5 }), { type: 'tick' });
    expect(oneX.currentNodeId).toBe(oneX.routeNodeIds[0]);
    expect(fiveX.distanceTravelledMeters).toBeGreaterThan(oneX.distanceTravelledMeters);
    expect(fiveX.simulationTimeSeconds).toBeGreaterThan(oneX.simulationTimeSeconds);
  });

  it('activates and removes scenarios with a timeline record', () => {
    const active = activate(initial(), 'accident', 'R3');
    expect(active.activeScenarioIds).toHaveLength(1);
    expect(active.scenarios.find((scenario) => scenario.id === 'accident')?.active).toBe(true);
    expect(active.events.map((event) => event.type)).toContain('accident_activated');
    const removed = reduce(active, { type: 'remove-scenario', scenarioId: 'accident' });
    expect(removed.activeScenarioIds).toEqual([]);
    expect(removed.scenarios.some((scenario) => scenario.id === 'accident')).toBe(false);
    expect(removed.events.map((event) => event.type)).toContain('scenario_removed');
  });

  it('raises accident cost and reroutes around an affected active road', () => {
    const before = initial();
    expect(before.routeRoadIds).toContain('R3');
    const after = activate(before, 'accident', 'R3', 'high');
    const effects = applyScenarioEffects(demoCityData, after.scenarios);
    expect(effects.city.roads.find((road) => road.id === 'R3')?.congestion).toBe('high');
    expect(effects.roadCostMultipliers.R3).toBeGreaterThan(1);
    expect(after.routeRoadIds).not.toContain('R3');
    expect(after.routeStatus).toBe('rerouted');
    expect(after.routeMessage).toMatch(/rerouted to avoid accident.*ETA increased/i);
    expect(after.previousRouteRoadIds).toEqual(before.routeRoadIds);
  });

  it('makes construction increase the route travel time', () => {
    const before = initial();
    const after = activate(before, 'construction', 'R3', 'high');
    expect(applyScenarioEffects(demoCityData, after.scenarios).city.roads.find((road) => road.id === 'R3')?.congestion).toBe('high');
    expect(after.etaSeconds).toBeGreaterThan(before.etaSeconds);
  });

  it('spreads heavy rain cost to the selected road and its local connectors', () => {
    const after = activate(initial(), 'heavy-rain', 'R3', 'high');
    const effects = applyScenarioEffects(demoCityData, after.scenarios);
    expect(effects.affectedRoadIds.has('R3')).toBe(true);
    expect(effects.affectedRoadIds.has('R1')).toBe(true);
    expect(effects.affectedRoadIds.has('R10')).toBe(true);
    expect(after.etaSeconds).toBeGreaterThan(initial().etaSeconds);
    expect(after.events.some((event) => event.type === 'rain_activated')).toBe(true);
  });

  it('blocks flooded and closed roads so A* selects an alternate path', () => {
    for (const id of ['flood', 'blockage']) {
      const after = activate(initial(), id, 'R3');
      const effects = applyScenarioEffects(demoCityData, after.scenarios);
      expect(effects.city.roads.find((road) => road.id === 'R3')?.blocked).toBe(true);
      expect(after.routeRoadIds).not.toContain('R3');
      expect(after.routeStatus).toBe('rerouted');
    }
  });

  it('recalculates to the default route when an active incident is deactivated', () => {
    const changed = activate(initial(), 'blockage', 'R3');
    const restored = reduce(changed, { type: 'deactivate-scenario', scenarioId: 'blockage' });
    expect(restored.routeRoadIds).toContain('R3');
    expect(restored.activeScenarioIds).toEqual([]);
    expect(restored.routeStatus).toBe('clear');
    expect(restored.events.some((event) => event.type === 'route_recalculated')).toBe(true);
  });

  it('clears stale rerouted status after an external condition has been removed', () => {
    const stale = { ...initial(), routeStatus: 'rerouted' as const, routeMessage: 'A previous operator incident was cleared.' };
    const refreshed = reduce(stale, { type: 'city-updated', city: demoCityData });
    expect(refreshed.routeStatus).toBe('clear');
  });

  it('keeps a stable unavailable-route state when all hospital access roads are blocked', () => {
    let state = activate(initial(), 'flood', 'R10');
    state = activate(state, 'blockage', 'R12');
    expect(state.routeStatus).toBe('unavailable');
    expect(state.routeNodeIds).toEqual([]);
    expect(state.routeMessage).toMatch(/no safe route.*2 blocked roads/i);
    expect(reduce(state, { type: 'start' })).toEqual(state);
  });

  it('creates signal, junction, and hospital events while the ambulance moves', () => {
    let state = reduce(initial(), { type: 'start' });
    for (let count = 0; count < 5 && state.status !== 'completed'; count += 1) {
      state = reduce(state, { type: 'tick' });
    }
    expect(state.status).toBe('completed');
    expect(state.events.some((event) => event.type === 'junction_passed')).toBe(true);
    expect(state.events.some((event) => event.type === 'signal_encountered')).toBe(true);
    expect(state.events.some((event) => event.type === 'hospital_reached')).toBe(true);
  });

  it('expires timed scenarios deterministically and recalculates the route', () => {
    const shortRain = { ...template('heavy-rain'), id: 'short-rain', durationSeconds: 30 };
    let state = reduce(initial(), { type: 'activate-scenario', template: shortRain, roadId: 'R3' });
    state = reduce(state, { type: 'start' });
    state = reduce(state, { type: 'tick' });
    expect(state.activeScenarioIds).toEqual([]);
    expect(state.events.some((event) => event.type === 'scenario_expired')).toBe(true);
    expect(state.events.some((event) => event.type === 'route_recalculated')).toBe(true);
  });
});
