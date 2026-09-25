import { findRoute } from '../ambulance/ambulanceData';
import type { RoutePlan } from '../ambulance/types';
import { explainRouteChange, type RoadHazard } from '../routing/dynamicRouting';
import type { SimulationSnapshot } from '../simulation/simulationSnapshot';
import { getScenarioAffectedRoadIds } from '../simulation/simulationEngine';
import type { CityData, IncidentRecord, Signal, VehicleFixture } from '../../services/apiClient';
import type { OperationsAlert, OperationsEvent, OperationsMetricsData, OperationsVehicle, VehicleFilter } from './trafficTypes';

export function locationName(city: CityData, nodeId: string): string {
  return city.nodes.find((node) => node.id === nodeId)?.name.replace(' (demo)', '') ?? nodeId;
}

export function nextSignalForVehicle(city: CityData, vehicle: Pick<OperationsVehicle, 'routeNodeIds' | 'currentNodeId'>): Signal | null {
  const route = vehicle.routeNodeIds;
  const currentIndex = route.indexOf(vehicle.currentNodeId);
  if (currentIndex < 0) return null;
  return city.signals.find((signal) => route.slice(currentIndex + 1).includes(signal.nodeId)) ?? null;
}

export interface RouteContext {
  baselineCity?: CityData;
  roadCostMultipliers?: Readonly<Record<string, number>>;
  hazards?: RoadHazard[];
  blockedRoadIds?: ReadonlySet<string>;
}

function routeState(city: CityData, origin: string, destination: string, route: RoutePlan | null, context: RouteContext) {
  const baseline = findRoute(context.baselineCity ?? city, origin, destination);
  const changed = baseline?.roadIds.join('|') !== route?.roadIds.join('|');
  const affected = context.hazards?.some((hazard) => hazard.active && hazard.roadId && route?.roadIds.includes(hazard.roadId));
  const destinationName = locationName(city, destination);
  return {
    routeStatus: route ? changed ? 'rerouted' as const : affected ? 'impacted' as const : 'clear' as const : 'unavailable' as const,
    routeMessage: context.hazards?.some((hazard) => hazard.active) || !route
      ? explainRouteChange({ city: context.baselineCity ?? city, destinationName, previous: baseline, next: route, hazard: context.hazards?.find((hazard) => hazard.active), blockedRoadIds: context.blockedRoadIds ?? new Set() })
      : 'Default demo corridor ready.',
  };
}

export function vehicleFromFixture(city: CityData, fixture: VehicleFixture, now: number, context: RouteContext = {}): OperationsVehicle {
  const route = findRoute(city, fixture.currentNodeId, fixture.destinationNodeId, { roadCostMultipliers: context.roadCostMultipliers });
  const firstRoad = city.roads.find((road) => road.id === route?.roadIds[0]);
  const nextNodeId = route?.nodeIds[1];
  const draft: OperationsVehicle = {
    ...fixture,
    routeNodeIds: route?.nodeIds ?? [],
    routeRoadIds: route?.roadIds ?? [],
    previousRouteNodeIds: [],
    ...routeState(city, fixture.currentNodeId, fixture.destinationNodeId, route, context),
    routeDistanceMeters: route?.totalDistanceMeters ?? 0,
    distanceRemainingMeters: route?.totalDistanceMeters ?? 0,
    etaSeconds: route?.etaSeconds ?? 0,
    currentRoad: firstRoad?.name ?? 'At destination',
    nextJunction: nextNodeId ? locationName(city, nextNodeId) : 'Destination',
    nextSignalId: null,
    alertCount: 0,
    lastUpdateAt: now,
    source: 'fixture',
  };
  return { ...draft, nextSignalId: nextSignalForVehicle(city, draft)?.id ?? null };
}

export function mapSimulationToVehicle(city: CityData, fixture: VehicleFixture, snapshot: SimulationSnapshot, context: RouteContext = {}): OperationsVehicle {
  const { state, publishedAt } = snapshot;
  const base = city.bases.find((candidate) => candidate.id === state.vehicle.baseId);
  const hospital = city.hospitals.find((candidate) => candidate.id === state.vehicle.destinationId);
  const activeRoute = findRoute(city, state.currentNodeId, hospital?.nodeId ?? '', { roadCostMultipliers: context.roadCostMultipliers });
  const route = findRoute(context.baselineCity ?? city, base?.nodeId ?? '', hospital?.nodeId ?? '');
  const currentRoad = city.roads.find((road) => road.id === activeRoute?.roadIds[0]);
  const nextNodeId = activeRoute?.nodeIds[1];
  const currentNodeId = city.nodes.some((node) => node.id === state.currentNodeId) ? state.currentNodeId : fixture.currentNodeId;
  const draft: OperationsVehicle = {
    ...fixture,
    id: state.vehicle.ambulanceId,
    vehicleNumber: state.vehicle.vehicleNumber,
    status: state.status === 'completed' ? 'completed' : state.status === 'paused' ? 'paused' : 'active',
    priority: state.vehicle.priority === 'routine' ? 'normal' : state.vehicle.priority === 'urgent' ? 'high' : 'critical',
    originNodeId: base?.nodeId ?? fixture.originNodeId,
    currentNodeId,
    destinationNodeId: hospital?.nodeId ?? fixture.destinationNodeId,
    speedKph: state.status === 'running' ? fixture.speedKph : 0,
    routeNodeIds: activeRoute?.nodeIds ?? [],
    routeRoadIds: activeRoute?.roadIds ?? [],
    previousRouteNodeIds: state.previousRouteNodeIds,
    ...routeState(city, currentNodeId, hospital?.nodeId ?? '', activeRoute, context),
    routeDistanceMeters: Math.max(route?.totalDistanceMeters ?? 0, state.distanceTravelledMeters + (activeRoute?.totalDistanceMeters ?? 0)),
    distanceRemainingMeters: activeRoute?.totalDistanceMeters ?? 0,
    etaSeconds: activeRoute?.etaSeconds ?? 0,
    currentRoad: currentRoad?.name ?? locationName(city, currentNodeId),
    nextJunction: nextNodeId ? locationName(city, nextNodeId) : 'Destination',
    nextSignalId: null,
    alertCount: 0,
    lastUpdateAt: publishedAt,
    source: 'simulation',
  };
  const hasActiveHazards = context.hazards?.some((hazard) => hazard.active) ?? false;
  if (activeRoute && !hasActiveHazards) {
    draft.routeStatus = 'clear';
    draft.routeMessage = state.routeMessage.includes('restored') ? state.routeMessage : 'Default demo corridor ready.';
  } else if (state.routeRoadIds.join('|') === draft.routeRoadIds.join('|') && state.routeStatus !== 'clear') {
    draft.routeStatus = state.routeStatus;
    draft.routeMessage = state.routeMessage;
  }
  return { ...draft, nextSignalId: nextSignalForVehicle(city, draft)?.id ?? null };
}

export function filterVehicles(vehicles: OperationsVehicle[], filter: VehicleFilter): OperationsVehicle[] {
  return vehicles.filter((vehicle) => filter === 'all'
    || (filter === 'ambulances' && vehicle.type === 'ambulance')
    || (filter === 'buses' && vehicle.type === 'bus')
    || (filter === 'active' && vehicle.status === 'active')
    || (filter === 'critical' && vehicle.priority === 'critical')
    || (filter === 'alerts' && vehicle.alertCount > 0)
    || (filter === 'completed' && vehicle.status === 'completed'));
}

export function deriveSimulationAlerts(city: CityData, vehicle: OperationsVehicle, snapshot: SimulationSnapshot | null): OperationsAlert[] {
  if (!snapshot) return [];
  const { state, publishedAt } = snapshot;
  const alerts: OperationsAlert[] = [];
  if (vehicle.routeStatus === 'unavailable' || vehicle.routeStatus === 'rerouted' || vehicle.routeStatus === 'impacted') {
    alerts.push({ id: `sim-route-${vehicle.routeStatus}-${vehicle.routeRoadIds.join('-')}-${Math.round(vehicle.etaSeconds / 60)}`, severity: vehicle.routeStatus === 'unavailable' ? 'critical' : 'warning', type: 'route', title: vehicle.routeStatus === 'unavailable' ? 'Ambulance route unavailable' : 'Ambulance route changed', message: vehicle.routeMessage, vehicleId: vehicle.id, nodeId: vehicle.currentNodeId, createdAt: publishedAt, acknowledged: false });
  }
  for (const scenario of state.scenarios.filter((item) => item.active)) {
    const road = city.roads.find((item) => item.id === scenario.roadId);
    alerts.push({ id: `sim-scenario-${scenario.id}`, severity: scenario.type === 'flood' || scenario.type === 'blockage' ? 'critical' : 'warning', type: 'incident', title: scenario.name, message: `Simulated ${scenario.type} · ${road?.name ?? locationName(city, scenario.nodeId ?? '')}`, vehicleId: vehicle.id, nodeId: scenario.nodeId ?? road?.from, createdAt: publishedAt, acknowledged: false });
  }
  if (state.status === 'running' && vehicle.nextSignalId) {
    const signal = city.signals.find((item) => item.id === vehicle.nextSignalId);
    const nodeIndex = state.routeNodeIds.indexOf(signal?.nodeId ?? '');
    const currentIndex = state.routeNodeIds.indexOf(state.currentNodeId);
    const distance = state.routeRoadIds.slice(currentIndex, nodeIndex).reduce((sum, roadId) => sum + (city.roads.find((road) => road.id === roadId)?.distanceMeters ?? 0), 0);
    if (currentIndex >= 0 && nodeIndex > currentIndex && distance <= 2500) alerts.push({ id: `sim-signal-${signal?.id}`, severity: 'warning', type: 'signal', title: `${vehicle.id} approaching ${signal?.id}`, message: `Emergency vehicle approaching ${locationName(city, signal?.nodeId ?? '')}. Check the simulated signal state.`, vehicleId: vehicle.id, nodeId: signal?.nodeId, createdAt: publishedAt, acknowledged: false });
  }
  return alerts;
}

export function deriveReadyAlert(vehicle: OperationsVehicle | undefined, now: number): OperationsAlert[] {
  if (!vehicle || vehicle.status !== 'active' || vehicle.source !== 'fixture') return [];
  return [{ id: 'sim-route-ready', severity: 'info', type: 'ambulance', title: 'Emergency route ready', message: `${vehicle.id} has a simulated route to its destination. Open Simulation to start movement.`, vehicleId: vehicle.id, nodeId: vehicle.currentNodeId, createdAt: now, acknowledged: false }];
}

export function deriveSimulationEvents(snapshot: SimulationSnapshot | null, vehicleId: string): OperationsEvent[] {
  return snapshot?.state.events.map((event) => ({
    id: `simulation-${event.id}`,
    timestamp: snapshot.publishedAt,
    category: event.type.includes('signal') ? 'signal' : event.type.includes('route') ? 'route' : event.type.includes('scenario') || event.type.includes('activated') ? 'incident' : 'vehicle',
    subject: vehicleId,
    message: event.message,
    severity: event.severity === 'high' ? 'critical' : event.severity === 'medium' ? 'warning' : 'info',
    simulationTimeSeconds: event.timestampSeconds,
  })) ?? [];
}

export function deriveSimulationIncidents(city: CityData, snapshot: SimulationSnapshot | null): IncidentRecord[] {
  return snapshot?.state.scenarios.filter((scenario) => scenario.active).flatMap((scenario) =>
    [...getScenarioAffectedRoadIds(city, scenario)].map((roadId) => ({
      id: `sim-${scenario.id}-${roadId}`,
      roadId,
      type: scenario.type,
      severity: scenario.severity,
      blocked: scenario.type === 'flood' || scenario.type === 'blockage' || Boolean(scenario.blocked),
      createdAt: new Date(snapshot.publishedAt).toISOString(),
      demo: true as const,
    }))) ?? [];
}

export function getOperationsMetrics(vehicles: OperationsVehicle[], alerts: OperationsAlert[], signals: Signal[], incidents: IncidentRecord[]): OperationsMetricsData {
  const active = vehicles.filter((vehicle) => vehicle.status === 'active');
  const ambulances = active.filter((vehicle) => vehicle.type === 'ambulance');
  return {
    activeVehicles: active.length,
    activeAmbulances: ambulances.length,
    criticalAlerts: alerts.filter((alert) => !alert.acknowledged && alert.severity === 'critical').length,
    emergencyRoutes: ambulances.filter((vehicle) => vehicle.routeNodeIds.length > 1).length,
    signalsInPriorityMode: signals.filter((signal) => signal.mode === 'emergency').length,
    averageEtaSeconds: active.length ? Math.round(active.reduce((sum, vehicle) => sum + vehicle.etaSeconds, 0) / active.length) : 0,
    incidentsToday: incidents.length,
    responseRoutesProtected: signals.filter((signal) => signal.mode === 'emergency').length,
  };
}
