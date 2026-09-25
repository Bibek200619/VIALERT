import { findRoute } from '../ambulance/ambulanceData';
import type { CityData, RoutePlan } from '../ambulance/types';
import { buildDynamicGraph, explainRouteChange, getHazardAffectedRoadIds } from '../routing/dynamicRouting';
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

function updateRouteForCurrentNode(state: SimulationState, city: CityData, fromNodeId: string): SimulationState {
  const effects = applyScenarioEffects(city, [...state.scenarios, ...state.externalScenarios]);
  const destination = city.hospitals.find((hospital) => hospital.id === state.vehicle.destinationId);
  const route = destination
    ? findRoute(effects.city, fromNodeId, destination.nodeId, { roadCostMultipliers: effects.roadCostMultipliers })
    : null;
  return {
    ...state,
    routeNodeIds: route?.nodeIds ?? [],
    routeRoadIds: route?.roadIds ?? [],
    distanceRemainingMeters: route?.totalDistanceMeters ?? 0,
    etaSeconds: route?.etaSeconds ?? 0,
    routeStatus: route ? state.routeStatus : 'unavailable',
    routeMessage: route ? state.routeMessage : `No route is available to ${destination?.name.replace(' (demo)', '') ?? 'the destination'}. Remove a blocking scenario or reset the route.`,
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
  const route = destination
    ? findRoute(effects.city, candidate.currentNodeId, destination.nodeId, { roadCostMultipliers: effects.roadCostMultipliers })
    : null;
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
    routeNodeIds: route?.nodeIds ?? [],
    routeRoadIds: nextRoadIds,
    previousRouteNodeIds: pathChanged ? previous.routeNodeIds : candidate.previousRouteNodeIds,
    previousRouteRoadIds: pathChanged ? previous.routeRoadIds : candidate.previousRouteRoadIds,
    distanceRemainingMeters: route?.totalDistanceMeters ?? 0,
    etaSeconds: route?.etaSeconds ?? 0,
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
  if (state.status === 'running') return state;
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
  if (state.status === 'running') return state;
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

function advanceTick(state: SimulationState, city: CityData, stepped: boolean): SimulationState {
  if ((!stepped && state.status !== 'running') || state.routeStatus === 'unavailable') return state;
  let current = state;
  if (stepped && current.status === 'ready') {
    current = { ...current, status: 'running' };
    current = appendEvent(current, { type: 'simulation_started', message: 'Simulation started by a manual step.' });
  }

  const hopCount = stepped ? 1 : current.speedMultiplier;
  for (let hop = 0; hop < hopCount; hop += 1) {
    if (current.status === 'completed') break;
    const nextNodeId = current.routeNodeIds[1];
    const nextRoadId = current.routeRoadIds[0];
    const road = city.roads.find((candidate) => candidate.id === nextRoadId);
    const node = city.nodes.find((candidate) => candidate.id === nextNodeId);
    if (!nextNodeId || !nextRoadId || !road || !node) {
      const destination = city.hospitals.find((hospital) => hospital.id === current.vehicle.destinationId);
      if (destination?.nodeId === current.currentNodeId) {
        current = { ...current, status: 'completed', routeNodeIds: [current.currentNodeId], routeRoadIds: [], distanceRemainingMeters: 0, etaSeconds: 0 };
        current = appendEvent(current, { type: 'hospital_reached', message: `Ambulance reached ${destination.name.replace(' (demo)', '')}.`, severity: 'low' });
      } else {
        current = { ...current, status: 'paused', routeStatus: 'unavailable', routeMessage: 'The current route segment is missing from the shared graph. Reset the simulation to recover.' };
        current = appendEvent(current, { type: 'route_unavailable', message: current.routeMessage, severity: 'high' });
      }
      break;
    }
    const nextTime = current.simulationTimeSeconds + 30;
    let scenarios = current.scenarios;
    const expired = scenarios.filter((scenario) => scenario.active && scenario.durationSeconds !== undefined
      && scenario.startTime !== undefined && nextTime - scenario.startTime >= scenario.durationSeconds);
    if (expired.length > 0) {
      const expiredIds = new Set(expired.map((scenario) => scenario.id));
      scenarios = scenarios.map((scenario) => expiredIds.has(scenario.id) ? { ...scenario, active: false, startTime: undefined } : scenario);
      current = { ...current, scenarios, activeScenarioIds: scenarios.filter((scenario) => scenario.active).map((scenario) => scenario.id) };
      for (const scenario of expired) {
        current = appendEvent({ ...current, simulationTimeSeconds: nextTime }, {
          type: 'scenario_expired',
          message: `${scenario.name} expired after ${scenario.durationSeconds} simulated seconds.`,
          severity: scenario.severity,
        }, nextTime);
      }
      current = updateRouteForCurrentNode({ ...current, simulationTimeSeconds: nextTime }, city, current.currentNodeId);
      current = appendEvent(current, {
        type: current.routeStatus === 'unavailable' ? 'route_unavailable' : 'route_recalculated',
        message: current.routeStatus === 'unavailable' ? current.routeMessage : 'Expired scenario effects were removed and the route was recalculated.',
        severity: current.routeStatus === 'unavailable' ? 'high' : 'low',
      }, nextTime);
      if (current.routeStatus === 'unavailable') {
        current = { ...current, status: 'paused', simulationTimeSeconds: nextTime };
        break;
      }
      hop -= 1;
      continue;
    }

    const effects = applyScenarioEffects(city, [...current.scenarios, ...current.externalScenarios]);
    const currentRoad = effects.city.roads.find((candidate) => candidate.id === current.routeRoadIds[0]);
    if (!currentRoad || currentRoad.blocked) {
      current = updateRouteForCurrentNode({ ...current, simulationTimeSeconds: nextTime }, city, current.currentNodeId);
      current = { ...current, simulationTimeSeconds: nextTime };
      current = appendEvent(current, { type: 'route_recalculated', message: 'A newly unavailable segment triggered a route recalculation.', severity: 'medium' }, nextTime);
      if (current.routeStatus === 'unavailable') {
        current = { ...current, status: 'paused' };
        break;
      }
      hop -= 1;
      continue;
    }

    current = {
      ...current,
      simulationTimeSeconds: nextTime,
      currentNodeId: node.id,
      distanceTravelledMeters: current.distanceTravelledMeters + road.distanceMeters,
    };
    current = appendEvent(current, {
      type: 'junction_passed',
      message: `Ambulance passed ${node.name.replace(' (demo)', '')}.`,
      severity: 'low',
    }, nextTime);
    const signal = city.signals.find((candidate) => candidate.nodeId === node.id);
    if (signal) {
      current = appendEvent(current, {
        type: 'signal_encountered',
        message: `Ambulance reached ${node.name.replace(' (demo)', '')} signal (${signal.state.toUpperCase()} demo state).`,
        severity: signal.state === 'red' ? 'medium' : 'low',
      }, nextTime);
    }
    const destination = city.hospitals.find((hospital) => hospital.id === current.vehicle.destinationId);
    if (destination?.nodeId === node.id) {
      current = {
        ...current,
        status: 'completed',
        routeNodeIds: [node.id],
        routeRoadIds: [],
        distanceRemainingMeters: 0,
        etaSeconds: 0,
        routeStatus: 'clear',
        routeMessage: `Hospital reached: ${destination.name.replace(' (demo)', '')}.`,
      };
      current = appendEvent(current, { type: 'hospital_reached', message: `Ambulance reached ${destination.name.replace(' (demo)', '')}.`, severity: 'low' }, nextTime);
      break;
    }
    current = updateRouteForCurrentNode(current, city, node.id);
  }

  if (stepped && current.status === 'running') current = { ...current, status: 'paused' };
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
      return appendEvent({ ...state, status: 'paused' }, { type: 'simulation_paused', message: 'Simulation paused at a graph junction.', severity: 'low' });
    case 'reset': {
      const initial = createInitialSimulationState(city);
      return appendEvent(initial, { type: 'simulation_reset', message: 'Simulation reset to the default ambulance route.', severity: 'low' });
    }
    case 'tick':
      return advanceTick(state, city, false);
    case 'step':
      if (state.status === 'running') return state;
      return advanceTick(state, city, true);
    case 'set-speed':
      return { ...state, speedMultiplier: action.speed };
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
      const effects = applyScenarioEffects(action.city, [...state.scenarios, ...state.externalScenarios]);
      const destination = action.city.hospitals.find((hospital) => hospital.id === state.vehicle.destinationId);
      const route = destination
        ? findRoute(effects.city, state.currentNodeId, destination.nodeId, { roadCostMultipliers: effects.roadCostMultipliers })
        : null;
      const hasActiveConditions = [...state.scenarios, ...state.externalScenarios].some((scenario) => scenario.active);
      return {
        ...state,
        routeNodeIds: route?.nodeIds ?? [],
        routeRoadIds: route?.roadIds ?? [],
        distanceRemainingMeters: route?.totalDistanceMeters ?? 0,
        etaSeconds: route?.etaSeconds ?? 0,
        routeStatus: route ? hasActiveConditions && state.routeStatus !== 'unavailable' ? state.routeStatus : 'clear' : 'unavailable',
        routeMessage: route ? state.routeMessage || 'City graph refreshed; current route is available.' : explainRouteChange({ city: action.city, destinationName: destination?.name ?? 'the destination', previous: null, next: null, blockedRoadIds: effects.blockedRoadIds }),
      };
    }
    case 'external-incidents-updated': {
      const before = state.externalScenarios.map((scenario) => `${scenario.id}:${scenario.roadId}:${scenario.severity}:${scenario.blocked}`).sort().join('|');
      const after = action.scenarios.map((scenario) => `${scenario.id}:${scenario.roadId}:${scenario.severity}:${scenario.blocked}`).sort().join('|');
      if (before === after) return state;
      const changed = action.scenarios.find((scenario) => !state.externalScenarios.some((old) => old.id === scenario.id))
        ?? (() => { const removed = state.externalScenarios.find((scenario) => !action.scenarios.some((next) => next.id === scenario.id)); return removed ? { ...removed, active: false } : undefined; })();
      const candidate = { ...state, externalScenarios: action.scenarios };
      const updated = scenarioRouteUpdate(state, candidate, city, changed ?? { id: 'external-change', type: 'congestion', name: 'Operator incident update', description: 'Mock operator incident feed changed.', severity: 'medium', active: false });
      return updated.routeStatus === 'unavailable' && updated.status === 'running' ? { ...updated, status: 'paused' } : updated;
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
