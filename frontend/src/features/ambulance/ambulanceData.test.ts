import { describe, expect, it } from 'vitest';
import {
  advanceJourney,
  createInitialJourney,
  demoCityData,
  findRoute,
  generateVoiceGuidance,
  getNextTurn,
  getRoutePosition,
  getUpcomingSignals,
  resetJourney,
  startJourney,
} from './ambulanceData';

describe('ambulance route planning', () => {
  it('finds a traffic-weighted route from the shared base to the south hospital', () => {
    const route = findRoute(demoCityData, 'BASE-1', 'HOSP-2');
    expect(route?.nodeIds).toEqual(['BASE-1', 'MG-ROAD', 'KORAMANGALA', 'HOSP-2']);
    expect(route?.roadIds).toEqual(['R1', 'R3', 'R10']);
    expect(route?.totalDistanceMeters).toBe(10_200);
    expect(route?.etaSeconds).toBe(1_560);
    expect(route && getNextTurn(demoCityData, route, route.totalDistanceMeters).targetName).toBe('South Care Hospital');
  });

  it('returns no route for unknown nodes or when every connection is blocked', () => {
    expect(findRoute(demoCityData, 'MISSING', 'HOSP-1')).toBeNull();
    expect(findRoute(demoCityData, 'BASE-1', 'NOT-A-HOSPITAL')).toBeNull();
    const blockedCity = structuredClone(demoCityData);
    blockedCity.roads.forEach((road) => { road.blocked = true; });
    expect(findRoute(blockedCity, 'BASE-1', 'HOSP-2')).toBeNull();
  });

  it('updates position and signal awareness as simulated distance advances', () => {
    const route = findRoute(demoCityData, 'BASE-1', 'HOSP-2');
    expect(route).not.toBeNull();
    if (!route) return;
    const start = getRoutePosition(demoCityData, route, 0);
    const progress = getRoutePosition(demoCityData, route, 2_500);
    expect(start?.currentRoadName).toBe('Central Base Link');
    expect(progress?.currentNodeId).toBe('MG-ROAD');
    expect(progress?.lat).not.toBe(start?.lat);
    expect(getUpcomingSignals(demoCityData, route, 0).map(({ signal }) => signal.id)).toEqual(['S1', 'S3']);
    expect(getUpcomingSignals(demoCityData, route, 2_500).map(({ signal }) => signal.id)).toEqual(['S3']);
  });

  it('advances, pauses, and resets a deterministic demo journey', () => {
    const route = findRoute(demoCityData, 'BASE-1', 'HOSP-2');
    expect(route).not.toBeNull();
    if (!route) return;
    const initial = createInitialJourney();
    const active = startJourney(initial);
    const progressed = advanceJourney(active, route, 45);
    expect(progressed.status).toBe('active');
    expect(progressed.elapsedSeconds).toBe(45);
    expect(progressed.distanceTravelledMeters).toBeGreaterThan(0);
    expect(resetJourney()).toEqual(initial);
    expect(advanceJourney(initial, route, 45)).toEqual(initial);
  });

  it('generates a readable, repeatable voice instruction', () => {
    const turn = getNextTurn(demoCityData, findRoute(demoCityData, 'BASE-1', 'HOSP-2')!, 0);
    const instruction = generateVoiceGuidance({
      ...turn,
      direction: 'right',
      roadName: 'MG Road',
      distanceMeters: 302,
    }, 'Central Care Hospital');
    expect(instruction).toBe('After 300 metres, turn right onto MG Road toward Central Care Hospital.');
  });
});
