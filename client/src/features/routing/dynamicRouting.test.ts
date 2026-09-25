import { describe, expect, it } from 'vitest';
import { demoCityData, findRoute } from '../ambulance/ambulanceData';
import { createInitialSimulationState, simulationReducer } from '../simulation/simulationEngine';
import { buildDynamicGraph, calculateRoadCost, explainRouteChange, getIncidentPenalty, getWeatherMultiplier, type RoadHazard } from './dynamicRouting';
import { incidentToHazard, readLocalIncidents } from './incidentFeed';

const hazard = (type: RoadHazard['type'], roadId: string, blocked = false): RoadHazard => ({ id: `${type}-${roadId}`, type, name: `${type} near ${roadId}`, roadId, severity: 'high', active: true, blocked });
const route = (hazards: RoadHazard[]) => {
  const effects = buildDynamicGraph(demoCityData, hazards);
  return { effects, plan: findRoute(effects.city, 'BASE-1', 'HOSP-2', { roadCostMultipliers: effects.roadCostMultipliers }) };
};

describe('dynamic incident-aware routing', () => {
  it('keeps the default A* route when no incidents exist', () => {
    const baseline = findRoute(demoCityData, 'BASE-1', 'HOSP-2');
    expect(route([]).plan).toEqual(baseline);
    expect(baseline?.roadIds).toEqual(['R1', 'R3', 'R10']);
  });

  it('calculates congestion, incident, weather, and priority-signal costs explicitly', () => {
    const road = demoCityData.roads.find((item) => item.id === 'R3')!;
    expect(getIncidentPenalty(hazard('accident', 'R3'))).toBeGreaterThan(getIncidentPenalty(hazard('construction', 'R3')));
    expect(getWeatherMultiplier(hazard('rain', 'R3'))).toBeGreaterThan(1);
    expect(calculateRoadCost(road, 1, true)).toBeLessThan(calculateRoadCost(road));
    expect(calculateRoadCost({ ...road, blocked: true })).toBe(Infinity);
  });

  it('avoids a blocked road and selects a longer but safer route under an accident penalty', () => {
    const closed = route([hazard('blockage', 'R3', true)]);
    const accident = route([hazard('accident', 'R3')]);
    expect(closed.plan?.roadIds).not.toContain('R3');
    expect(accident.plan?.roadIds).not.toContain('R3');
    expect(accident.plan?.totalDistanceMeters).toBeGreaterThan(route([]).plan!.totalDistanceMeters);
    expect(closed.effects.blockedRoadIds.has('R3')).toBe(true);
  });

  it('returns no route with actionable blocked-road detail when every hospital access is closed', () => {
    const { effects, plan } = route([hazard('flood', 'R10', true), hazard('blockage', 'R12', true)]);
    expect(plan).toBeNull();
    expect(explainRouteChange({ city: demoCityData, destinationName: 'South Care Hospital', previous: route([]).plan, next: plan, blockedRoadIds: effects.blockedRoadIds }))
      .toMatch(/No safe route.*2 blocked roads.*South Hospital Access.*Silk Board.*Remove a blocking incident/i);
  });

  it('updates ETA and explains the incident and difference after activation', () => {
    const previous = route([]).plan;
    const next = route([hazard('rain', 'R3')]).plan;
    expect(next?.etaSeconds).toBeGreaterThan(previous!.etaSeconds);
    const accident = hazard('accident', 'R3');
    const changed = route([accident]);
    expect(explainRouteChange({ city: demoCityData, destinationName: 'South Care Hospital', previous, next: changed.plan, hazard: accident, blockedRoadIds: changed.effects.blockedRoadIds }))
      .toMatch(/Rerouted to avoid accident.*ETA increased by \d+ min/i);
  });

  it('ingests operator incident records and deterministically restores the route', () => {
    const record = { id: 'INC-1', roadId: 'R3', type: 'blockage' as const, severity: 'high' as const, blocked: true, origin: 'operator' as const, createdAt: '2026-01-01T00:00:00Z', demo: true as const };
    const external = { ...incidentToHazard(demoCityData, record), description: 'Mock operator incident' };
    const initial = createInitialSimulationState(demoCityData);
    const changed = simulationReducer(initial, { type: 'external-incidents-updated', scenarios: [external] }, demoCityData);
    expect(changed.routeStatus).toBe('rerouted');
    expect(changed.routeRoadIds).not.toContain('R3');
    expect(changed.events.at(-1)?.message).toMatch(/Rerouted/);
    const restored = simulationReducer(changed, { type: 'external-incidents-updated', scenarios: [] }, demoCityData);
    expect(restored.routeRoadIds).toEqual(initial.routeRoadIds);
    expect(restored.routeMessage).toMatch(/restored/i);
    expect(readLocalIncidents({ getItem: () => '{malformed' })).toEqual([]);
  });
});
