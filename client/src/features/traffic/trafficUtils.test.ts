import { describe, expect, it } from 'vitest';
import { demoCityData } from '../ambulance/ambulanceData';
import { createInitialSimulationState, simulationReducer } from '../simulation/simulationEngine';
import type { SimulationSnapshot } from '../simulation/simulationSnapshot';
import { readSimulationSnapshot } from '../simulation/simulationSnapshot';
import { canApplyPriorityChange } from './hooks/useTrafficOperations';
import { demoVehicles } from './trafficData';
import { deriveReadyAlert, deriveSimulationAlerts, deriveSimulationEvents, deriveSimulationIncidents, filterVehicles, getOperationsMetrics, mapSimulationToVehicle, nextSignalForVehicle, vehicleFromFixture } from './trafficUtils';

describe('traffic operations mapping', () => {
  const ambulance = demoVehicles[0];
  const bus = demoVehicles[1];
  const now = 1000;
  const ambulanceView = vehicleFromFixture(demoCityData, ambulance, now);
  const busView = vehicleFromFixture(demoCityData, bus, now);

  it('filters by vehicle class, state, priority, and alerts', () => {
    const withAlerts = [{ ...ambulanceView, alertCount: 1 }, busView];
    expect(filterVehicles(withAlerts, 'all')).toHaveLength(2);
    expect(filterVehicles(withAlerts, 'ambulances').map((vehicle) => vehicle.id)).toEqual(['AMB-07']);
    expect(filterVehicles(withAlerts, 'buses').map((vehicle) => vehicle.id)).toEqual(['BUS-12']);
    expect(filterVehicles(withAlerts, 'active')).toHaveLength(2);
    expect(filterVehicles(withAlerts, 'critical').map((vehicle) => vehicle.id)).toEqual(['AMB-07']);
    expect(filterVehicles(withAlerts, 'alerts').map((vehicle) => vehicle.id)).toEqual(['AMB-07']);
  });

  it('builds selected vehicle map and detail route from shared nodes', () => {
    expect(ambulanceView.routeNodeIds[0]).toBe('BASE-1');
    expect(ambulanceView.routeNodeIds.at(-1)).toBe('HOSP-2');
    expect(ambulanceView.routeDistanceMeters).toBeGreaterThan(0);
    expect(nextSignalForVehicle(demoCityData, ambulanceView)?.id).toBe('S1');
    expect(busView.routeNodeIds.at(-1)).toBe('ELECTRONIC-CITY');
    expect(deriveReadyAlert(ambulanceView, now)[0].vehicleId).toBe('AMB-07');
  });

  it('maps Phase 3 progress and events into the operator view', () => {
    const initial = createInitialSimulationState(demoCityData);
    const running = simulationReducer(initial, { type: 'start' }, demoCityData);
    const advanced = simulationReducer(running, { type: 'tick' }, demoCityData);
    const snapshot: SimulationSnapshot = { state: advanced, publishedAt: 2500 };
    const mapped = mapSimulationToVehicle(demoCityData, ambulance, snapshot);
    expect(mapped.source).toBe('simulation');
    expect(mapped.currentNodeId).toBe('MG-ROAD');
    expect(mapped.distanceRemainingMeters).toBeLessThan(ambulanceView.distanceRemainingMeters);
    expect(mapped.lastUpdateAt).toBe(2500);
    expect(deriveSimulationEvents(snapshot, mapped.id).some((event) => event.message.includes('MG Road'))).toBe(true);
  });

  it('derives route and incident alerts after a blocked scenario', () => {
    const initial = createInitialSimulationState(demoCityData);
    const template = initial.scenarios.find((scenario) => scenario.type === 'blockage')!;
    const state = simulationReducer(initial, { type: 'activate-scenario', template }, demoCityData);
    const snapshot: SimulationSnapshot = { state, publishedAt: 3000 };
    const mapped = mapSimulationToVehicle(demoCityData, ambulance, snapshot);
    expect(deriveSimulationAlerts(demoCityData, mapped, snapshot).some((alert) => alert.type === 'incident')).toBe(true);
    expect(deriveSimulationIncidents(demoCityData, snapshot).some((incident) => incident.blocked && incident.roadId === template.roadId)).toBe(true);
  });

  it('calculates metrics and requires explicit emergency priority confirmation', () => {
    const alerts = [{ id: 'a', severity: 'critical' as const, type: 'incident' as const, title: 'Blockage', message: 'Demo', createdAt: now, acknowledged: false }];
    const metrics = getOperationsMetrics([ambulanceView, busView], alerts, demoCityData.signals, []);
    expect(metrics.activeVehicles).toBe(2);
    expect(metrics.activeAmbulances).toBe(1);
    expect(metrics.criticalAlerts).toBe(1);
    expect(metrics.averageEtaSeconds).toBeGreaterThan(0);
    expect(canApplyPriorityChange('emergency', false)).toBe(false);
    expect(canApplyPriorityChange('emergency', true)).toBe(true);
    expect(canApplyPriorityChange('normal', false)).toBe(true);
  });

  it('ignores unavailable or malformed same-browser simulation data', () => {
    expect(readSimulationSnapshot({ getItem: () => null })).toBeNull();
    expect(readSimulationSnapshot({ getItem: () => '{broken' })).toBeNull();
    expect(readSimulationSnapshot({ getItem: () => JSON.stringify({ publishedAt: 1, state: { currentNodeId: 'missing' } }) })).toBeNull();
    expect(readSimulationSnapshot({ getItem: () => { throw new Error('Storage disabled'); } })).toBeNull();
    expect(vehicleFromFixture(demoCityData, ambulance, now).currentNodeId).toBe('BASE-1');
  });
});
