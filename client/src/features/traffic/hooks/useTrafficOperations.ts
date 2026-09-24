import { useCallback, useEffect, useMemo, useState } from 'react';
import { demoCityData } from '../../ambulance/ambulanceData';
import { readSimulationSnapshot } from '../../simulation/simulationSnapshot';
import { apiClient, type CityData, type IncidentRecord, type IncidentRequest, type OperationsAlertRecord, type OperationsEventRecord, type Signal, type VehicleFixture } from '../../../services/apiClient';
import { buildDynamicGraph } from '../../routing/dynamicRouting';
import { incidentToHazard, readLocalIncidents, sameIncidents, writeLocalIncidents } from '../../routing/incidentFeed';
import { demoVehicles } from '../trafficData';
import { deriveReadyAlert, deriveSimulationAlerts, deriveSimulationEvents, deriveSimulationIncidents, filterVehicles, getOperationsMetrics, mapSimulationToVehicle, vehicleFromFixture } from '../trafficUtils';
import type { AlertSeverityFilter, AlertTypeFilter, OperationsAlert, VehicleFilter } from '../trafficTypes';

export type OperationsConnection = 'checking' | 'online' | 'degraded' | 'offline';

export function canApplyPriorityChange(mode: Signal['mode'], confirmed: boolean): boolean {
  return mode !== 'emergency' || confirmed;
}

function currentSnapshot() {
  try {
    const snapshot = typeof window === 'undefined' ? null : readSimulationSnapshot(window.localStorage);
    return snapshot && Date.now() - snapshot.publishedAt <= 600_000 ? snapshot : null;
  }
  catch { return null; }
}

export function useTrafficOperations() {
  const [city, setCity] = useState<CityData>(demoCityData);
  const [fixtures, setFixtures] = useState<VehicleFixture[]>(demoVehicles);
  const [signals, setSignals] = useState<Signal[]>(demoCityData.signals);
  const [incidents, setIncidents] = useState<IncidentRecord[]>([]);
  const [localIncidents, setLocalIncidents] = useState<IncidentRecord[]>(() => typeof window === 'undefined' ? [] : readLocalIncidents(window.localStorage));
  const [backendAlerts, setBackendAlerts] = useState<OperationsAlertRecord[]>([]);
  const [backendEvents, setBackendEvents] = useState<OperationsEventRecord[]>([]);
  const [snapshot, setSnapshot] = useState(currentSnapshot);
  const [connection, setConnection] = useState<OperationsConnection>('checking');
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState('');
  const [selectedVehicleId, setSelectedVehicleId] = useState('AMB-07');
  const [vehicleFilter, setVehicleFilter] = useState<VehicleFilter>('all');
  const [alertSeverity, setAlertSeverity] = useState<AlertSeverityFilter>('all');
  const [alertType, setAlertType] = useState<AlertTypeFilter>('all');
  const [acknowledgedLocal, setAcknowledgedLocal] = useState<Set<string>>(() => new Set());
  const [hiddenEvents, setHiddenEvents] = useState<Set<string>>(() => new Set());
  const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null);
  const [lastUpdateAt, setLastUpdateAt] = useState(Date.now());

  const refresh = useCallback(async (signal?: AbortSignal) => {
    const results = await Promise.allSettled([
      apiClient.getNodeHealth(signal), apiClient.getCity(signal), apiClient.getVehicles(signal),
      apiClient.getSignals(signal), apiClient.getIncidents(signal), apiClient.getAlerts(signal),
      apiClient.getOperationsEvents(signal), apiClient.getOperationsSummary(signal), apiClient.getEmergencies(signal),
    ]);
    if (signal?.aborted) return;
    const [health, cityResult, vehicleResult, signalResult, incidentResult, alertResult, eventResult] = results;
    if (cityResult.status === 'fulfilled') setCity({ ...cityResult.value, roads: cityResult.value.roads.map((road) => demoCityData.roads.find((baseline) => baseline.id === road.id) ?? road) });
    if (vehicleResult.status === 'fulfilled') setFixtures(vehicleResult.value.vehicles);
    if (signalResult.status === 'fulfilled') setSignals(signalResult.value.signals);
    if (incidentResult.status === 'fulfilled') setIncidents(incidentResult.value.incidents);
    if (alertResult.status === 'fulfilled') setBackendAlerts(alertResult.value.alerts);
    if (eventResult.status === 'fulfilled') setBackendEvents(eventResult.value.events);
    setConnection(health.status === 'rejected' ? 'offline' : results.slice(1).some((item) => item.status === 'rejected') ? 'degraded' : 'online');
    if (results.some((item) => item.status === 'fulfilled')) setLastUpdateAt(Date.now());
    setLoading(false);
  }, []);

  useEffect(() => {
    const read = () => setLocalIncidents((previous) => {
      const next = readLocalIncidents(window.localStorage);
      return sameIncidents(previous, next) ? previous : next;
    });
    const timer = window.setInterval(read, 3000);
    window.addEventListener('storage', read);
    return () => { window.clearInterval(timer); window.removeEventListener('storage', read); };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void refresh(controller.signal);
    const timer = window.setInterval(() => void refresh(controller.signal), 4000);
    return () => { controller.abort(); window.clearInterval(timer); };
  }, [refresh]);

  useEffect(() => {
    const read = () => setSnapshot((previous) => {
      const next = currentSnapshot();
      return previous?.publishedAt === next?.publishedAt ? previous : next;
    });
    const timer = window.setInterval(read, 1000);
    window.addEventListener('storage', read);
    return () => { window.clearInterval(timer); window.removeEventListener('storage', read); };
  }, []);

  const operatorIncidents = useMemo(() => [...incidents, ...localIncidents.filter((local) => !incidents.some((api) => api.id === local.id))], [incidents, localIncidents]);
  const routingHazards = useMemo(() => [
    ...(snapshot?.state.scenarios.filter((scenario) => scenario.active) ?? []),
    ...operatorIncidents.filter((incident) => incident.origin !== 'simulation').map((incident) => incidentToHazard(city, incident)),
  ], [city, operatorIncidents, snapshot]);
  const effects = useMemo(() => buildDynamicGraph({ ...city, signals }, routingHazards), [city, signals, routingHazards]);
  const displayCity = effects.city;
  const simulationIncidents = deriveSimulationIncidents(displayCity, snapshot);
  const displayIncidents = [...operatorIncidents, ...simulationIncidents.filter((local) => !operatorIncidents.some((api) => api.roadId === local.roadId && api.type === local.type))];
  const vehicles = useMemo(() => {
    const now = lastUpdateAt;
    const context = { baselineCity: { ...city, signals }, roadCostMultipliers: effects.roadCostMultipliers, hazards: routingHazards, blockedRoadIds: effects.blockedRoadIds };
    return fixtures.map((fixture) => fixture.type === 'ambulance' && snapshot && snapshot.state.vehicle.ambulanceId === fixture.id
      ? mapSimulationToVehicle(displayCity, fixture, snapshot, context)
      : vehicleFromFixture(displayCity, fixture, now, context));
  }, [city, displayCity, effects, fixtures, lastUpdateAt, routingHazards, signals, snapshot]);
  const selectedVehicle = vehicles.find((vehicle) => vehicle.id === selectedVehicleId) ?? vehicles[0] ?? null;
  const simulationVehicle = vehicles.find((vehicle) => vehicle.source === 'simulation');
  const derivedAlerts = useMemo(() => simulationVehicle ? deriveSimulationAlerts(displayCity, simulationVehicle, snapshot) : [], [displayCity, simulationVehicle, snapshot]);
  const readyAlerts = deriveReadyAlert(vehicles.find((vehicle) => vehicle.type === 'ambulance'), lastUpdateAt);
  const routeAlerts = useMemo<OperationsAlert[]>(() => vehicles.filter((vehicle) => vehicle.type === 'ambulance' && vehicle.source === 'fixture' && vehicle.routeStatus !== 'clear').map((vehicle) => ({ id: `operator-route-${vehicle.routeStatus}-${vehicle.routeRoadIds.join('-')}-${Math.round(vehicle.etaSeconds / 60)}`, severity: vehicle.routeStatus === 'unavailable' ? 'critical' : 'warning', type: 'route', title: vehicle.routeStatus === 'unavailable' ? 'No safe ambulance route' : 'Ambulance corridor changed', message: vehicle.routeMessage, vehicleId: vehicle.id, nodeId: vehicle.currentNodeId, createdAt: lastUpdateAt, acknowledged: false })), [vehicles, lastUpdateAt]);
  const alerts = useMemo(() => {
    const offline: OperationsAlert[] = connection === 'offline' ? [{ id: 'offline-system', severity: 'warning', type: 'system', title: 'Node API unavailable', message: 'The control room is using checked-in demo data. Signal changes remain local to this browser.', createdAt: lastUpdateAt, acknowledged: false }] : [];
    const all = [...backendAlerts, ...derivedAlerts, ...routeAlerts, ...readyAlerts, ...offline].map((alert) => ({ ...alert, acknowledged: alert.acknowledged || acknowledgedLocal.has(alert.id) }));
    return all.sort((a, b) => b.createdAt - a.createdAt);
  }, [acknowledgedLocal, backendAlerts, connection, derivedAlerts, lastUpdateAt, readyAlerts, routeAlerts]);
  const countedVehicles = vehicles.map((vehicle) => ({ ...vehicle, alertCount: alerts.filter((alert) => !alert.acknowledged && alert.vehicleId === vehicle.id).length }));
  const visibleVehicles = filterVehicles(countedVehicles, vehicleFilter);
  const visibleAlerts = alerts.filter((alert) => (alertSeverity === 'all' || alert.severity === alertSeverity) && (alertType === 'all' || alert.type === alertType));
  const simulationEvents = deriveSimulationEvents(snapshot, simulationVehicle?.id ?? 'AMB-07');
  const eventKey = (event: { id: string; timestamp: number }) => event.id.startsWith('simulation-') || event.id.startsWith('route-') || event.id.startsWith('local-event-') ? event.id : `${event.id}:${event.timestamp}`;
  const localEvents: OperationsEventRecord[] = localIncidents.map((incident) => ({ id: `local-event-${incident.id}`, timestamp: Date.parse(incident.createdAt), category: 'incident', subject: incident.roadId, message: `Local simulated ${incident.type} activated on ${incident.roadId}`, severity: incident.blocked ? 'critical' : 'warning' }));
  const routeEvents: OperationsEventRecord[] = vehicles.filter((vehicle) => vehicle.type === 'ambulance' && vehicle.routeStatus !== 'clear').map((vehicle) => ({ id: `route-${vehicle.id}-${vehicle.routeStatus}-${vehicle.routeRoadIds.join('-')}-${Math.round(vehicle.etaSeconds / 60)}`, timestamp: lastUpdateAt, category: 'route', subject: vehicle.id, message: vehicle.routeMessage, severity: vehicle.routeStatus === 'unavailable' ? 'critical' : 'warning' }));
  const events = [...backendEvents, ...localEvents, ...simulationEvents, ...routeEvents].filter((event) => !hiddenEvents.has(eventKey(event))).sort((a, b) => b.timestamp - a.timestamp);
  const metrics = getOperationsMetrics(countedVehicles, alerts, signals, displayIncidents);

  const acknowledge = useCallback(async (alert: OperationsAlert) => {
    if (alert.id.startsWith('sim-') || alert.id.startsWith('operator-route-') || alert.id === 'offline-system' || connection === 'offline') {
      setAcknowledgedLocal((previous) => new Set(previous).add(alert.id));
      setNotice('Demo alert acknowledged locally.');
      return;
    }
    try {
      const result = await apiClient.acknowledgeAlert(alert.id);
      setBackendAlerts((previous) => previous.map((item) => item.id === alert.id ? result.alert : item));
      setNotice(`${alert.title} acknowledged in the mock API.`);
      void refresh();
    } catch {
      setNotice(`Could not acknowledge ${alert.title}. The Node API did not confirm the change.`);
    }
  }, [connection, refresh]);

  const changeSignal = useCallback(async (signalId: string, payload: Partial<Pick<Signal, 'state' | 'mode'>>, confirmed = false) => {
    if (payload.mode && !canApplyPriorityChange(payload.mode, confirmed)) {
      setNotice('Confirm simulated emergency priority before applying it.');
      return false;
    }
    const existing = signals.find((item) => item.id === signalId);
    if (!existing) { setNotice('That signal is not available in the demo city.'); return false; }
    if (connection === 'offline') {
      setSignals((previous) => previous.map((item) => item.id === signalId ? { ...item, ...payload } : item));
      setNotice(`${signalId} changed locally. Node API is unavailable; this mock change is not shared.`);
      return true;
    }
    try {
      const result = await apiClient.updateSignal(signalId, payload);
      setSignals((previous) => previous.map((item) => item.id === signalId ? result.signal : item));
      setNotice(`${signalId} updated in simulated in-memory state.`);
      void refresh();
      return true;
    } catch {
      setNotice(`Signal update failed for ${signalId}. The current state was retained.`);
      return false;
    }
  }, [connection, refresh, signals]);

  const selectVehicle = useCallback((id: string) => {
    setSelectedVehicleId(id);
    setFocusedNodeId(null);
  }, []);

  const addIncident = useCallback(async (payload: IncidentRequest) => {
    if (!city.roads.some((road) => road.id === payload.roadId)) { setNotice('Choose a valid demo road.'); return false; }
    if (connection !== 'offline') {
      try {
        const result = await apiClient.createIncident({ ...payload, origin: 'operator' });
        setIncidents((previous) => [...previous, result.incident]);
        setNotice(`Simulated ${payload.type} activated; ambulance routes are recalculating.`);
        void refresh();
        return true;
      } catch { setConnection('degraded'); }
    }
    const created: IncidentRecord = { ...payload, origin: 'operator', id: `LOCAL-${Date.now()}`, createdAt: new Date().toISOString(), demo: true };
    const next = [...localIncidents, created];
    if (!writeLocalIncidents(window.localStorage, next)) { setNotice('Local storage is unavailable; the incident was not saved.'); return false; }
    setLocalIncidents(next);
    setNotice(`Simulated ${payload.type} activated locally. Node API did not record this change.`);
    return true;
  }, [city.roads, connection, localIncidents, refresh]);

  const removeIncident = useCallback(async (incidentId: string) => {
    if (incidentId.startsWith('LOCAL-')) {
      const next = localIncidents.filter((incident) => incident.id !== incidentId);
      if (!writeLocalIncidents(window.localStorage, next)) { setNotice('Local incident could not be cleared.'); return false; }
      setLocalIncidents(next);
      setNotice('Local simulated incident cleared; routes recalculated.');
      return true;
    }
    try {
      await apiClient.removeIncident(incidentId);
      setIncidents((previous) => previous.filter((incident) => incident.id !== incidentId));
      setNotice('Simulated incident cleared; routes recalculated.');
      void refresh();
      return true;
    } catch { setNotice('Node API could not clear this incident. The current route was retained.'); return false; }
  }, [localIncidents, refresh]);

  return {
    city: displayCity, vehicles: countedVehicles, selectedVehicle, selectedVehicleId, selectVehicle,
    vehicleFilter, setVehicleFilter, visibleVehicles, alerts, visibleAlerts, alertSeverity, setAlertSeverity,
    alertType, setAlertType, acknowledge, signals, incidents: displayIncidents, events, metrics, connection, loading, notice,
    changeSignal, addIncident, removeIncident, focusedNodeId, setFocusedNodeId, lastUpdateAt, snapshot,
    clearLog: () => setHiddenEvents(new Set([...backendEvents, ...localEvents, ...simulationEvents, ...routeEvents].map(eventKey))),
  };
}
