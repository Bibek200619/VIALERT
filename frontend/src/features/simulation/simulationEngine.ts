import { findRoute } from '../ambulance/ambulanceData';
import type { CityData, RoutePlan, Signal } from '../ambulance/types';
import { buildDynamicGraph, calculateRoadCost, explainRouteChange, getHazardAffectedRoadIds } from '../routing/dynamicRouting';
import { defaultVehicleConfiguration, getScenarioTemplates } from './simulationData';
import type {
  Scenario,
  ScenarioRoadEffects,
  SimulationAction,
  SimulationEvent,
  SimulationEventType,
  SimulationState,
  VehicleConfiguration,
} from './simulationTypes';

function defaultVehicle(city: CityData): VehicleConfiguration {
  const base = city.bases.find((candidate) => candidate.id === defaultVehicleConfiguration.baseId) ?? city.bases[0];
  const destination = city.hospitals.find((candidate) => candidate.id === defaultVehicleConfiguration.destinationId)
    ?? city.hospitals.at(-1);
  return {
    ...defaultVehicleConfiguration,
    baseId: base?.id ?? '',
    destinationId: destination?.id ?? '',
  };
}

export function getScenarioAffectedRoadIds(city: CityData, scenario: Pick<Scenario, 'type' | 'roadId' | 'nodeId'>): Set<string> {
  return getHazardAffectedRoadIds(city, scenario);
}

export function applyScenarioEffects(city: CityData, scenarios: readonly Scenario[]): ScenarioRoadEffects {
  return buildDynamicGraph(city, scenarios);
}

function computeRoute(city: CityData, vehicle: VehicleConfiguration, scenarios: readonly Scenario[]): RoutePlan | null {
  const effects = applyScenarioEffects(city, scenarios);
  const base = city.bases.find((candidate) => candidate.id === vehicle.baseId);
  const destination = city.hospitals.find((candidate) => candidate.id === vehicle.destinationId);
  if (!base || !destination) return null;
  return findRoute(effects.city, base.nodeId, destination.nodeId, { roadCostMultipliers: effects.roadCostMultipliers });
}

function eventTypeForScenario(type: Scenario['type']): SimulationEventType {
  return `${type}_activated` as SimulationEventType;
}

function appendEvent(
  state: SimulationState,
  event: Omit<SimulationEvent, 'id' | 'timestampSeconds'>,
  timestampSeconds = state.simulationTimeSeconds,
): SimulationState {
  const eventSequence = state.eventSequence + 1;
  return {
    ...state,
    eventSequence,
    events: [...state.events, {
      ...event,
      id: `event-${String(eventSequence).padStart(4, '0')}`,
      timestampSeconds,
    }],
  };
}

function setRoute(state: SimulationState, route: RoutePlan | null, startNodeId: string): SimulationState {
  return {
    ...state,
    currentNodeId: startNodeId,
    segmentProgressMeters: 0,
    currentSpeedKph: 0,
    signalWaitSeconds: 0,
    routeNodeIds: route?.nodeIds ?? [],
    routeRoadIds: route?.roadIds ?? [],
    previousRouteNodeIds: [],
    previousRouteRoadIds: [],
    distanceRemainingMeters: route?.totalDistanceMeters ?? 0,
    etaSeconds: route?.etaSeconds ?? 0,
    routeStatus: route ? 'clear' : 'unavailable',
    routeMessage: route ? 'Default demo route ready.' : 'No route is available. Check the selected base and hospital.',
  };
}

export function createInitialSimulationState(city: CityData): SimulationState {
  const vehicle = defaultVehicle(city);
  const base = city.bases.find((candidate) => candidate.id === vehicle.baseId);
  const scenarios = getScenarioTemplates(city);
  const route = computeRoute(city, vehicle, scenarios);
  const initial: SimulationState = {
    status: 'ready',
    simulationTimeSeconds: 0,
    speedMultiplier: 1,
    selectedVehicleId: vehicle.ambulanceId,
    selectedScenarioId: null,
    activeScenarioIds: [],
    currentNodeId: base?.nodeId ?? '',
    routeNodeIds: [],
    routeRoadIds: [],
    previousRouteNodeIds: [],
    previousRouteRoadIds: [],
    distanceTravelledMeters: 0,
    segmentProgressMeters: 0,
    currentSpeedKph: 0,
    signalWaitSeconds: 0,
    distanceRemainingMeters: 0,
    etaSeconds: 0,
    events: [],
    vehicle,
    scenarios,
    externalScenarios: [],
    routeStatus: 'unavailable',
    routeMessage: '',
    eventSequence: 0,
    scenarioSequence: 1,
  };
  return setRoute(initial, route, base?.nodeId ?? '');
}

/** Signals run a deterministic 60-second cycle, seeded by the city state. */
export function getSimulationSignalState(signal: Signal, timeSeconds: number): { state: Signal['state']; remainingSeconds: number } {
  if (signal.mode === 'emergency') return { state: 'green', remainingSeconds: 0 };
  const offset = signal.state === 'green' ? 0 : signal.state === 'yellow' ? 30 : 34;
  const phase = ((Math.max(0, timeSeconds) + offset) % 60 + 60) % 60;
  if (phase < 30) return { state: 'green', remainingSeconds: 30 - phase };
  if (phase < 34) return { state: 'yellow', remainingSeconds: 60 - phase };
  return { state: 'red', remainingSeconds: 60 - phase };
}

function roadTravelSeconds(effects: ScenarioRoadEffects, roadId: string): number {
  const road = effects.city.roads.find((candidate) => candidate.id === roadId);
  if (!road) return Infinity;
  // Priority opens a junction; it does not make a vehicle exceed the road speed.
  return calculateRoadCost(road, effects.roadCostMultipliers[roadId] ?? 1);
}

function remainingRoute(state: SimulationState, city: CityData, effects: ScenarioRoadEffects): RoutePlan | null {
  const destination = city.hospitals.find((hospital) => hospital.id === state.vehicle.destinationId);
  if (!destination) return null;
  const movingRoad = city.roads.find((road) => road.id === state.routeRoadIds[0]);
  const inSegment = state.segmentProgressMeters > 0 && movingRoad && state.routeNodeIds[1];
  const fromNodeId = inSegment ? state.routeNodeIds[1] : state.currentNodeId;
  const tail = findRoute(effects.city, fromNodeId, destination.nodeId, { roadCostMultipliers: effects.roadCostMultipliers });
  if (!tail) return null;
  if (!inSegment) return tail;
  const cost = roadTravelSeconds(effects, movingRoad.id);
  if (!Number.isFinite(cost)) return null;
  const remainingFraction = Math.max(0, 1 - state.segmentProgressMeters / movingRoad.distanceMeters);
  return {
    nodeIds: [state.currentNodeId, ...tail.nodeIds],
    roadIds: [movingRoad.id, ...tail.roadIds],
    totalDistanceMeters: movingRoad.distanceMeters * remainingFraction + tail.totalDistanceMeters,
    etaSeconds: cost * remainingFraction + tail.etaSeconds,
  };
}

function updateRouteForCurrentNode(state: SimulationState, city: CityData): SimulationState {
  const effects = applyScenarioEffects(city, [...state.scenarios, ...state.externalScenarios]);
  const route = remainingRoute(state, city, effects);
  const keepPosition = !route && state.segmentProgressMeters > 0;
  return {
    ...state,
    routeNodeIds: route?.nodeIds ?? (keepPosition ? state.routeNodeIds : []),
    routeRoadIds: route?.roadIds ?? (keepPosition ? state.routeRoadIds : []),
    distanceRemainingMeters: route?.totalDistanceMeters ?? (keepPosition ? state.distanceRemainingMeters : 0),
    etaSeconds: route?.etaSeconds ?? 0,
    routeStatus: route ? effects.affectedRoadIds.size ? 'impacted' : 'clear' : 'unavailable',
    currentSpeedKph: route ? state.currentSpeedKph : 0,
    routeMessage: route ? state.routeMessage : explainRouteChange({ city, destinationName: city.hospitals.find((hospital) => hospital.id === state.vehicle.destinationId)?.name ?? 'the destination', previous: null, next: null, blockedRoadIds: effects.blockedRoadIds }),
  };
}

function scenarioRouteUpdate(
  previous: SimulationState,
  candidate: SimulationState,
  city: CityData,
  changedScenario: Scenario,
): SimulationState {
  const previousRoadIds = previous.routeRoadIds.join('|');
  const effects = applyScenarioEffects(city, [...candidate.scenarios, ...candidate.externalScenarios]);
  const destination = city.hospitals.find((hospital) => hospital.id === candidate.vehicle.destinationId);
  const route = remainingRoute(candidate, city, effects);
  const nextRoadIds = route?.roadIds ?? [];
  const pathChanged = previousRoadIds !== nextRoadIds.join('|');
  const affectedCurrentRoute = [...candidate.scenarios, ...candidate.externalScenarios].filter((scenario) => scenario.active).some((scenario) => {
    const roads = getScenarioAffectedRoadIds(city, scenario);
    return nextRoadIds.some((roadId) => roads.has(roadId)) || previous.routeRoadIds.some((roadId) => roads.has(roadId));
  });
  let routeStatus: SimulationState['routeStatus'] = route ? 'clear' : 'unavailable';
  if (route && pathChanged) routeStatus = changedScenario.active ? 'rerouted' : 'clear';
  else if (route && affectedCurrentRoute) routeStatus = 'impacted';
  const routeMessage = explainRouteChange({
    city,
    destinationName: destination?.name.replace(' (demo)', '') ?? 'the destination',
    previous: previous.routeNodeIds.length ? { nodeIds: previous.routeNodeIds, roadIds: previous.routeRoadIds, totalDistanceMeters: previous.distanceRemainingMeters, etaSeconds: previous.etaSeconds } : null,
    next: route,
    hazard: changedScenario,
    blockedRoadIds: effects.blockedRoadIds,
  });
  let updated: SimulationState = {
    ...candidate,
    routeNodeIds: route?.nodeIds ?? (candidate.segmentProgressMeters > 0 ? candidate.routeNodeIds : []),
    routeRoadIds: route?.roadIds ?? (candidate.segmentProgressMeters > 0 ? candidate.routeRoadIds : []),
    previousRouteNodeIds: pathChanged ? previous.routeNodeIds : candidate.previousRouteNodeIds,
    previousRouteRoadIds: pathChanged ? previous.routeRoadIds : candidate.previousRouteRoadIds,
    distanceRemainingMeters: route?.totalDistanceMeters ?? (candidate.segmentProgressMeters > 0 ? candidate.distanceRemainingMeters : 0),
    etaSeconds: route?.etaSeconds ?? 0,
    currentSpeedKph: route ? candidate.currentSpeedKph : 0,
    routeStatus,
    routeMessage,
  };
  updated = appendEvent(updated, {
    type: route ? 'route_recalculated' : 'route_unavailable',
    message: routeMessage,
    severity: route ? changedScenario.severity : 'high',
  });
  return updated;
}

function activateScenario(state: SimulationState, action: Extract<SimulationAction, { type: 'activate-scenario' }>, city: CityData): SimulationState {
  const existing = state.scenarios.find((scenario) => scenario.id === action.template.id);
  const id = existing?.id ?? `${action.template.id}-${String(state.scenarioSequence).padStart(2, '0')}`;
  const activated: Scenario = {
    ...action.template,
    id,
    ...(action.roadId ? { roadId: action.roadId } : {}),
    ...(action.nodeId ? { nodeId: action.nodeId } : {}),
    severity: action.severity ?? action.template.severity,
    active: true,
    startTime: state.simulationTimeSeconds,
  };
  if (action.roadId) delete activated.nodeId;
  else if (action.nodeId) delete activated.roadId;

  const scenarios = existing
    ? state.scenarios.map((scenario) => scenario.id === existing.id ? activated : scenario)
    : [...state.scenarios, activated];
  const candidate: SimulationState = {
    ...state,
    scenarios,
    selectedScenarioId: id,
    activeScenarioIds: scenarios.filter((scenario) => scenario.active).map((scenario) => scenario.id),
    scenarioSequence: existing ? state.scenarioSequence : state.scenarioSequence + 1,
  };
  const activatedState = appendEvent(candidate, {
    type: eventTypeForScenario(activated.type),
    message: `${activated.name} activated on ${activated.roadId ? city.roads.find((road) => road.id === activated.roadId)?.name : city.nodes.find((node) => node.id === activated.nodeId)?.name ?? 'selected area'}. Simulated ${activated.type} effect applied.`,
    severity: activated.severity,
  });
  return scenarioRouteUpdate(state, activatedState, city, activated);
}

function changeVehicle(state: SimulationState, vehiclePatch: Partial<VehicleConfiguration>, city: CityData): SimulationState {
  if (state.status === 'running') return state;
  const vehicle = { ...state.vehicle, ...vehiclePatch };
  if (!city.bases.some((base) => base.id === vehicle.baseId)
    || !city.hospitals.some((hospital) => hospital.id === vehicle.destinationId)
    || !vehicle.ambulanceId.trim() || !vehicle.vehicleNumber.trim()) return state;
  const base = city.bases.find((candidate) => candidate.id === vehicle.baseId);
  const route = computeRoute(city, vehicle, [...state.scenarios, ...state.externalScenarios]);
  let updated: SimulationState = {
    ...state,
    status: 'ready',
    simulationTimeSeconds: 0,
    distanceTravelledMeters: 0,
    vehicle,
    scenarios: state.scenarios.map((scenario) => scenario.active ? { ...scenario, startTime: 0 } : scenario),
    selectedVehicleId: vehicle.ambulanceId,
    activeScenarioIds: state.scenarios.filter((scenario) => scenario.active).map((scenario) => scenario.id),
    eventSequence: 0,
    events: [],
  };
  updated = setRoute(updated, route, base?.nodeId ?? '');
  return appendEvent(updated, {
    type: 'vehicle_configuration_changed',
    message: `Vehicle settings updated for ${vehicle.ambulanceId}; route calculated from ${base?.name.replace(' (demo)', '') ?? 'the selected base'}.`,
  });
}

function deactivateScenario(state: SimulationState, scenarioId: string, city: CityData, remove: boolean): SimulationState {
  const target = state.scenarios.find((scenario) => scenario.id === scenarioId);
  if (!target) return state;
  const scenarios = remove
    ? state.scenarios.filter((scenario) => scenario.id !== scenarioId)
    : state.scenarios.map((scenario) => scenario.id === scenarioId ? { ...scenario, active: false, startTime: undefined } : scenario);
  const candidate: SimulationState = {
    ...state,
    scenarios,
    selectedScenarioId: state.selectedScenarioId === scenarioId ? null : state.selectedScenarioId,
    activeScenarioIds: scenarios.filter((scenario) => scenario.active).map((scenario) => scenario.id),
  };
  const changed = { ...target, active: false };
  const logged = appendEvent(candidate, {
    type: remove ? 'scenario_removed' : 'scenario_deactivated',
    message: `${target.name} ${remove ? 'removed' : 'deactivated'} from the local demo.`,
    severity: target.severity,
  });
  return scenarioRouteUpdate(state, logged, city, changed);
}

function resetWithCurrentScenario(state: SimulationState, city: CityData, eventType: 'scenario_restarted' | 'default_route_restored'): SimulationState {
  let initial = createInitialSimulationState(city);
  if (eventType === 'scenario_restarted') {
    initial = { ...initial, vehicle: { ...state.vehicle }, selectedVehicleId: state.vehicle.ambulanceId, speedMultiplier: state.speedMultiplier };
    const base = city.bases.find((candidate) => candidate.id === state.vehicle.baseId);
    const scenarios = state.scenarios.map((scenario) => scenario.active ? { ...scenario, startTime: 0 } : scenario);
    initial = { ...initial, externalScenarios: state.externalScenarios };
    const route = computeRoute(city, initial.vehicle, [...scenarios, ...initial.externalScenarios]);
    initial = {
      ...initial,
      scenarios,
      activeScenarioIds: scenarios.filter((scenario) => scenario.active).map((scenario) => scenario.id),
      selectedScenarioId: state.selectedScenarioId,
      scenarioSequence: state.scenarioSequence,
    };
    initial = setRoute(initial, route, base?.nodeId ?? '');
  }
  initial = { ...initial, speedMultiplier: state.speedMultiplier };
  return appendEvent(initial, {
    type: eventType,
    message: eventType === 'scenario_restarted'
      ? 'Current scenario restarted from the configured ambulance base.'
      : 'Default base-to-hospital route restored and all scenarios deactivated.',
  });
}

function completeJourney(state: SimulationState, city: CityData): SimulationState {
  const destination = city.hospitals.find((hospital) => hospital.id === state.vehicle.destinationId);
  return appendEvent({
    ...state,
    status: 'completed',
    routeNodeIds: [state.currentNodeId],
    routeRoadIds: [],
    segmentProgressMeters: 0,
    currentSpeedKph: 0,
    signalWaitSeconds: 0,
    distanceRemainingMeters: 0,
    etaSeconds: 0,
    routeStatus: 'clear',
    routeMessage: `Hospital reached: ${destination?.name.replace(' (demo)', '') ?? 'destination'}.`,
  }, { type: 'hospital_reached', message: `Ambulance reached ${destination?.name.replace(' (demo)', '') ?? 'the destination'}.`, severity: 'low' });
}

function expireScenarios(state: SimulationState, city: CityData): SimulationState {
  const expired = state.scenarios.filter((scenario) => scenario.active && scenario.durationSeconds !== undefined
    && scenario.startTime !== undefined && state.simulationTimeSeconds - scenario.startTime >= scenario.durationSeconds - 1e-8);
  if (!expired.length) return state;
  const ids = new Set(expired.map((scenario) => scenario.id));
  const scenarios = state.scenarios.map((scenario) => ids.has(scenario.id) ? { ...scenario, active: false, startTime: undefined } : scenario);
  let next = { ...state, scenarios, activeScenarioIds: scenarios.filter((scenario) => scenario.active).map((scenario) => scenario.id) };
  for (const scenario of expired) next = appendEvent(next, { type: 'scenario_expired', message: `${scenario.name} expired after ${scenario.durationSeconds} simulated seconds.`, severity: scenario.severity });
  return scenarioRouteUpdate(state, next, city, { ...expired[0], active: false });
}

function advanceTick(state: SimulationState, city: CityData, stepped: boolean, deltaSeconds = 1): SimulationState {
  if (state.status === 'completed' || (!stepped && state.status !== 'running') || !Number.isFinite(deltaSeconds) || deltaSeconds <= 0) return state;
  let current = state;
  if (stepped && current.status === 'ready') {
    current = appendEvent({ ...current, status: 'paused' }, { type: 'simulation_started', message: 'Simulation started by a manual one-second step.' });
  }
  // Integrate in small bounded slices so 5x affects simulated time, not distance per hop.
  let remainingSeconds = stepped ? 1 : Math.min(deltaSeconds, 60) * current.speedMultiplier;
  while (remainingSeconds > 1e-8 && current.status !== 'completed') {
    const step = Math.min(0.1, remainingSeconds);
    remainingSeconds -= step;
    current = { ...current, simulationTimeSeconds: Math.round((current.simulationTimeSeconds + step) * 1e8) / 1e8 };
    current = expireScenarios(current, city);
    if (current.routeStatus === 'unavailable') {
      current = { ...current, currentSpeedKph: 0, signalWaitSeconds: 0 };
      continue;
    }
    const destination = city.hospitals.find((hospital) => hospital.id === current.vehicle.destinationId);
    if (destination?.nodeId === current.currentNodeId && !current.routeRoadIds.length) {
      current = completeJourney(current, city);
      break;
    }
    const effects = applyScenarioEffects(city, [...current.scenarios, ...current.externalScenarios]);
    const road = effects.city.roads.find((candidate) => candidate.id === current.routeRoadIds[0]);
    const nextNode = city.nodes.find((node) => node.id === current.routeNodeIds[1]);
    if (!road || road.blocked || !nextNode) {
      current = updateRouteForCurrentNode(current, city);
      if (current.routeStatus === 'unavailable') current = appendEvent(current, { type: 'route_unavailable', message: current.routeMessage, severity: 'high' });
      continue;
    }
    const travelSeconds = roadTravelSeconds(effects, road.id);
    const cruiseSpeed = Math.min(60 / 3.6, road.distanceMeters / Math.max(1, travelSeconds));
    const signal = city.signals.find((candidate) => candidate.nodeId === nextNode.id);
    const phase = signal ? getSimulationSignalState(signal, current.simulationTimeSeconds) : null;
    const distanceToJunction = Math.max(0, road.distanceMeters - current.segmentProgressMeters);
    const stopAtSignal = phase && phase.state !== 'green';
    const stopDistance = stopAtSignal ? Math.max(0, distanceToJunction - 5) : distanceToJunction;
    // Brake at 2 m/s² before a stop line; depart at a comfortable 1.6 m/s².
    const targetSpeed = stopAtSignal ? Math.min(cruiseSpeed, Math.sqrt(4 * stopDistance)) : cruiseSpeed;
    const previousSpeed = current.currentSpeedKph / 3.6;
    let speed = previousSpeed < targetSpeed
      ? Math.min(targetSpeed, previousSpeed + 1.6 * step)
      : Math.max(targetSpeed, previousSpeed - 2 * step);
    let distance = Math.min(distanceToJunction, (previousSpeed + speed) * 0.5 * step);
    if (stopAtSignal && distance >= stopDistance) {
      distance = stopDistance;
      speed = 0;
    }
    const waiting = Boolean(stopAtSignal && stopDistance <= 0.02);
    current = {
      ...current,
      segmentProgressMeters: current.segmentProgressMeters + distance,
      distanceTravelledMeters: current.distanceTravelledMeters + distance,
      distanceRemainingMeters: Math.max(0, current.distanceRemainingMeters - distance),
      currentSpeedKph: speed * 3.6,
      signalWaitSeconds: waiting ? phase!.remainingSeconds : 0,
      etaSeconds: Math.max(0, current.etaSeconds - distance / Math.max(0.01, cruiseSpeed)),
    };
    if (waiting && state.signalWaitSeconds === 0 && !current.events.some((event) => event.type === 'signal_encountered' && event.timestampSeconds > current.simulationTimeSeconds - step - 0.01)) {
      current = appendEvent(current, { type: 'signal_encountered', message: `Waiting for ${nextNode.name.replace(' (demo)', '')} signal to turn green.`, severity: 'medium' });
    }
    if (current.segmentProgressMeters < road.distanceMeters - 1e-6) continue;
    current = { ...current, currentNodeId: nextNode.id, segmentProgressMeters: 0, signalWaitSeconds: 0, routeNodeIds: current.routeNodeIds.slice(1), routeRoadIds: current.routeRoadIds.slice(1) };
    current = appendEvent(current, { type: 'junction_passed', message: `Ambulance passed ${nextNode.name.replace(' (demo)', '')}.`, severity: 'low' });
    if (signal) current = appendEvent(current, { type: 'signal_encountered', message: `Ambulance crossed ${nextNode.name.replace(' (demo)', '')} on green.`, severity: 'low' });
    current = destination?.nodeId === nextNode.id ? completeJourney(current, city) : updateRouteForCurrentNode(current, city);
  }
  if (stepped && current.status !== 'completed') current = { ...current, status: 'paused' };
  return current;
}

export function simulationReducer(state: SimulationState, action: SimulationAction, city: CityData): SimulationState {
  switch (action.type) {
    case 'start':
      if (state.routeStatus === 'unavailable' || state.status === 'completed' || state.status === 'running') return state;
      return appendEvent({ ...state, status: 'running' }, {
        type: state.status === 'paused' ? 'simulation_resumed' : 'simulation_started',
        message: state.status === 'paused' ? 'Simulation resumed.' : 'Simulation started; the demo ambulance is moving.',
        severity: 'low',
      });
    case 'resume':
      if (state.status !== 'paused' || state.routeStatus === 'unavailable') return state;
      return appendEvent({ ...state, status: 'running' }, { type: 'simulation_resumed', message: 'Simulation resumed.', severity: 'low' });
    case 'pause':
      if (state.status !== 'running') return state;
      return appendEvent({ ...state, status: 'paused' }, { type: 'simulation_paused', message: 'Simulation paused at the current vehicle position.', severity: 'low' });
    case 'reset': {
      const initial = createInitialSimulationState(city);
      return appendEvent(initial, { type: 'simulation_reset', message: 'Simulation reset to the default ambulance route.', severity: 'low' });
    }
    case 'tick':
      return advanceTick(state, city, false, action.deltaSeconds);
    case 'step':
      if (state.status === 'running') return state;
      return advanceTick(state, city, true);
    case 'set-speed':
      return [1, 2, 5].includes(action.speed) ? { ...state, speedMultiplier: action.speed } : state;
    case 'select-scenario':
      return { ...state, selectedScenarioId: action.scenarioId };
    case 'configure-vehicle':
      return changeVehicle(state, action.vehicle, city);
    case 'activate-scenario':
      return activateScenario(state, action, city);
    case 'deactivate-scenario':
      return deactivateScenario(state, action.scenarioId, city, false);
    case 'remove-scenario':
      return deactivateScenario(state, action.scenarioId, city, true);
    case 'restart-scenario':
      return resetWithCurrentScenario(state, city, 'scenario_restarted');
    case 'return-default-route':
      return resetWithCurrentScenario(state, city, 'default_route_restored');
    case 'city-updated': {
      return updateRouteForCurrentNode(state, action.city);
    }
    case 'external-incidents-updated': {
      const before = state.externalScenarios.map((scenario) => `${scenario.id}:${scenario.type}:${scenario.roadId}:${scenario.nodeId}:${scenario.severity}:${scenario.blocked}:${scenario.active}`).sort().join('|');
      const after = action.scenarios.map((scenario) => `${scenario.id}:${scenario.type}:${scenario.roadId}:${scenario.nodeId}:${scenario.severity}:${scenario.blocked}:${scenario.active}`).sort().join('|');
      if (before === after) return state;
      const changed = action.scenarios.find((scenario) => !state.externalScenarios.some((old) => old.id === scenario.id))
        ?? (() => { const removed = state.externalScenarios.find((scenario) => !action.scenarios.some((next) => next.id === scenario.id)); return removed ? { ...removed, active: false } : undefined; })();
      const candidate = { ...state, externalScenarios: action.scenarios };
      const updated = scenarioRouteUpdate(state, candidate, city, changed ?? { id: 'external-change', type: 'congestion', name: 'Operator incident update', description: 'Mock operator incident feed changed.', severity: 'medium', active: false });
      return updated;
    }
  }
}

export function getSimulationRoutePlan(state: SimulationState): RoutePlan | null {
  if (state.routeStatus === 'unavailable' || state.routeNodeIds.length === 0) return null;
  return {
    nodeIds: state.routeNodeIds,
    roadIds: state.routeRoadIds,
    totalDistanceMeters: state.distanceRemainingMeters,
    etaSeconds: state.etaSeconds,
  };
}
