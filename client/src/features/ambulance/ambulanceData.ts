import rawAdjacency from '../../../../shared-data/adjacency.json';
import rawBases from '../../../../shared-data/bases.json';
import rawHospitals from '../../../../shared-data/hospitals.json';
import rawNodes from '../../../../shared-data/nodes.json';
import rawRoads from '../../../../shared-data/roads.json';
import rawScenarios from '../../../../shared-data/scenarios.json';
import rawSignals from '../../../../shared-data/signals.json';
import rawVehicles from '../../../../shared-data/vehicles.json';
import type { CityData, JourneyState, Road, RoutePlan, RoutePosition, Signal, TurnGuidance, UpcomingSignal } from './types';
import type { ScenarioPreset } from '../../services/apiClient';
import { calculateRoadCost } from '../routing/dynamicRouting';

export const demoCityData: CityData = {
  nodes: rawNodes,
  roads: rawRoads.map((road) => ({ ...road, congestion: road.congestion as Road['congestion'] })),
  signals: rawSignals.map((signal) => ({ ...signal, state: signal.state as Signal['state'], mode: signal.mode as Signal['mode'] })),
  hospitals: rawHospitals,
  bases: rawBases,
  adjacency: rawAdjacency,
  scenarios: rawScenarios.map((scenario) => ({
    ...scenario,
    severity: scenario.severity as ScenarioPreset['severity'],
    active: false as const,
  })),
  vehicles: rawVehicles.map((vehicle) => ({
    ...vehicle,
    type: vehicle.type as 'ambulance' | 'bus' | 'police' | 'response',
    status: vehicle.status as 'active' | 'paused' | 'offline' | 'completed',
    priority: vehicle.priority as 'critical' | 'high' | 'normal',
  })),
  demo: true,
};

function distanceBetweenNodes(city: CityData, fromId: string, toId: string): number {
  const from = city.nodes.find((node) => node.id === fromId);
  const to = city.nodes.find((node) => node.id === toId);
  if (!from || !to) return Number.POSITIVE_INFINITY;

  const radians = (value: number) => (value * Math.PI) / 180;
  const lat1 = radians(from.lat);
  const lat2 = radians(to.lat);
  const deltaLat = lat2 - lat1;
  const deltaLng = radians(to.lng - from.lng);
  const value = Math.sin(deltaLat / 2) ** 2
    + Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) ** 2;
  return 6_371_000 * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

function heuristicSeconds(city: CityData, fromId: string, targetId: string): number {
  // The deliberately conservative 100 m/s lower bound keeps the straight-line
  // heuristic admissible for this small, weighted demo graph.
  return distanceBetweenNodes(city, fromId, targetId) / 100;
}

export function findRoute(
  city: CityData,
  startId: string,
  targetId: string,
  options: { roadCostMultipliers?: Readonly<Record<string, number>> } = {},
): RoutePlan | null {
  const startExists = city.nodes.some((node) => node.id === startId);
  const targetExists = city.nodes.some((node) => node.id === targetId);
  if (!startExists || !targetExists) return null;
  if (startId === targetId) return { nodeIds: [startId], roadIds: [], totalDistanceMeters: 0, etaSeconds: 0 };

  const roadById = new Map(city.roads.map((road) => [road.id, road]));
  const prioritySignalNodes = new Set(city.signals.filter((signal) => signal.mode === 'emergency').map((signal) => signal.nodeId));
  const open = new Set([startId]);
  const cameFrom = new Map<string, { nodeId: string; roadId: string }>();
  const costTo = new Map([[startId, 0]]);
  const estimate = new Map([[startId, heuristicSeconds(city, startId, targetId)]]);

  while (open.size > 0) {
    let currentId = '';
    let bestScore = Number.POSITIVE_INFINITY;
    for (const candidate of open) {
      const score = estimate.get(candidate) ?? Number.POSITIVE_INFINITY;
      if (score < bestScore) {
        bestScore = score;
        currentId = candidate;
      }
    }

    if (!currentId) return null;
    if (currentId === targetId) {
      const nodeIds = [targetId];
      const roadIds: string[] = [];
      let cursor = targetId;
      while (cursor !== startId) {
        const previous = cameFrom.get(cursor);
        if (!previous) return null;
        roadIds.unshift(previous.roadId);
        nodeIds.unshift(previous.nodeId);
        cursor = previous.nodeId;
      }
      const roads = roadIds.map((id) => roadById.get(id)).filter((road) => road !== undefined);
      return {
        nodeIds,
        roadIds,
        totalDistanceMeters: roads.reduce((total, road) => total + road.distanceMeters, 0),
        etaSeconds: costTo.get(targetId) ?? 0,
      };
    }

    open.delete(currentId);
    for (const edge of city.adjacency[currentId] ?? []) {
      const road = roadById.get(edge.roadId);
      const joinsNodes = road && ((road.from === currentId && road.to === edge.to)
        || (road.to === currentId && road.from === edge.to));
      if (!road || road.blocked || !joinsNodes || !city.nodes.some((node) => node.id === edge.to)) continue;

      const multiplier = options.roadCostMultipliers?.[road.id] ?? 1;
      const nextCost = (costTo.get(currentId) ?? Number.POSITIVE_INFINITY)
        + calculateRoadCost(road, multiplier, prioritySignalNodes.has(edge.to));
      if (nextCost >= (costTo.get(edge.to) ?? Number.POSITIVE_INFINITY)) continue;

      cameFrom.set(edge.to, { nodeId: currentId, roadId: road.id });
      costTo.set(edge.to, nextCost);
      estimate.set(edge.to, nextCost + heuristicSeconds(city, edge.to, targetId));
      open.add(edge.to);
    }
  }

  return null;
}

export function createInitialJourney(): JourneyState {
  return { status: 'ready', distanceTravelledMeters: 0, elapsedSeconds: 0 };
}

export function startJourney(journey: JourneyState): JourneyState {
  if (journey.status === 'completed') return journey;
  return { ...journey, status: 'active' };
}

export function pauseJourney(journey: JourneyState): JourneyState {
  return journey.status === 'active' ? { ...journey, status: 'paused' } : journey;
}

export function resetJourney(): JourneyState {
  return createInitialJourney();
}

export function advanceJourney(journey: JourneyState, route: RoutePlan, stepSeconds = 30): JourneyState {
  if (journey.status !== 'active' || route.etaSeconds <= 0) return journey;
  const elapsedSeconds = Math.min(route.etaSeconds, journey.elapsedSeconds + stepSeconds);
  const distanceTravelledMeters = Math.min(
    route.totalDistanceMeters,
    (elapsedSeconds / route.etaSeconds) * route.totalDistanceMeters,
  );
  return {
    status: elapsedSeconds >= route.etaSeconds ? 'completed' : 'active',
    distanceTravelledMeters,
    elapsedSeconds,
  };
}

export function getRoutePosition(city: CityData, route: RoutePlan, distanceTravelledMeters: number): RoutePosition | null {
  const firstNode = city.nodes.find((node) => node.id === route.nodeIds[0]);
  if (!firstNode) return null;
  if (route.roadIds.length === 0) {
    return { lat: firstNode.lat, lng: firstNode.lng, segmentIndex: 0, currentNodeId: firstNode.id, currentRoadName: 'At destination' };
  }

  let remaining = Math.max(0, distanceTravelledMeters);
  for (let index = 0; index < route.roadIds.length; index += 1) {
    const road = city.roads.find((candidate) => candidate.id === route.roadIds[index]);
    const from = city.nodes.find((candidate) => candidate.id === route.nodeIds[index]);
    const to = city.nodes.find((candidate) => candidate.id === route.nodeIds[index + 1]);
    if (!road || !from || !to) continue;
    if (remaining <= road.distanceMeters || index === route.roadIds.length - 1) {
      const progress = Math.min(1, remaining / road.distanceMeters);
      return {
        lat: from.lat + (to.lat - from.lat) * progress,
        lng: from.lng + (to.lng - from.lng) * progress,
        segmentIndex: index,
        currentNodeId: progress < 0.5 ? from.id : to.id,
        currentRoadName: progress >= 1 ? to.name : road.name,
      };
    }
    remaining -= road.distanceMeters;
  }
  return null;
}

export function getUpcomingSignals(city: CityData, route: RoutePlan, distanceTravelledMeters: number): UpcomingSignal[] {
  let signalDistance = 0;
  const alongRoute = new Map<string, number>([[route.nodeIds[0], 0]]);
  route.roadIds.forEach((roadId, index) => {
    signalDistance += city.roads.find((road) => road.id === roadId)?.distanceMeters ?? 0;
    alongRoute.set(route.nodeIds[index + 1], signalDistance);
  });

  return city.signals
    .flatMap((signal) => {
      const distance = alongRoute.get(signal.nodeId);
      const node = city.nodes.find((candidate) => candidate.id === signal.nodeId);
      if (distance === undefined || !node || distance < distanceTravelledMeters - 1) return [];
      return [{ signal, name: node.name.replace(' (demo)', ''), distanceMeters: Math.max(0, distance - distanceTravelledMeters) }];
    })
    .sort((left, right) => left.distanceMeters - right.distanceMeters);
}

function bearing(from: { lat: number; lng: number }, to: { lat: number; lng: number }): number {
  const radians = (value: number) => (value * Math.PI) / 180;
  const lat1 = radians(from.lat);
  const lat2 = radians(to.lat);
  const deltaLng = radians(to.lng - from.lng);
  return (Math.atan2(
    Math.sin(deltaLng) * Math.cos(lat2),
    Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(deltaLng),
  ) * 180 / Math.PI + 360) % 360;
}

function describeTurn(city: CityData, route: RoutePlan, segmentIndex: number): TurnGuidance['direction'] {
  if (segmentIndex <= 0 || segmentIndex >= route.roadIds.length - 1) return segmentIndex >= route.roadIds.length - 1 ? 'arrive' : 'straight';
  const previous = city.nodes.find((node) => node.id === route.nodeIds[segmentIndex - 1]);
  const junction = city.nodes.find((node) => node.id === route.nodeIds[segmentIndex]);
  const next = city.nodes.find((node) => node.id === route.nodeIds[segmentIndex + 1]);
  if (!previous || !junction || !next) return 'straight';
  const delta = ((bearing(junction, next) - bearing(previous, junction) + 540) % 360) - 180;
  if (delta > 24) return 'right';
  if (delta < -24) return 'left';
  return 'straight';
}

export function getNextTurn(city: CityData, route: RoutePlan, distanceTravelledMeters: number): TurnGuidance {
  if (route.roadIds.length === 0) {
    return { direction: 'arrive', roadName: 'Hospital', targetName: 'Destination', distanceMeters: 0, secondsToTurn: 0, segmentIndex: 0 };
  }
  let travelledAlongSegments = 0;
  let currentSegment = route.roadIds.length - 1;
  for (let index = 0; index < route.roadIds.length; index += 1) {
    const segmentLength = city.roads.find((road) => road.id === route.roadIds[index])?.distanceMeters ?? 0;
    if (distanceTravelledMeters <= travelledAlongSegments + segmentLength || index === route.roadIds.length - 1) {
      currentSegment = index;
      break;
    }
    travelledAlongSegments += segmentLength;
  }
  const currentRoad = city.roads.find((road) => road.id === route.roadIds[currentSegment]);
  const nextRoad = city.roads.find((road) => road.id === route.roadIds[currentSegment + 1]);
  const target = city.nodes.find((node) => node.id === route.nodeIds[currentSegment + 2]);
  const destinationNode = city.nodes.find((node) => node.id === route.nodeIds.at(-1));
  const distanceToJunction = Math.max(0, travelledAlongSegments
    + (currentRoad?.distanceMeters ?? 0) - distanceTravelledMeters);
  const averageMetersPerSecond = route.etaSeconds > 0 ? route.totalDistanceMeters / route.etaSeconds : 0;
  return {
    direction: nextRoad ? describeTurn(city, route, currentSegment + 1) : 'arrive',
    roadName: nextRoad?.name ?? city.nodes.find((node) => node.id === route.nodeIds.at(-1))?.name ?? 'Destination',
    targetName: (target ?? destinationNode)?.name.replace(' (demo)', '') ?? 'Hospital',
    distanceMeters: distanceToJunction,
    secondsToTurn: averageMetersPerSecond > 0 ? Math.ceil(distanceToJunction / averageMetersPerSecond) : 0,
    segmentIndex: currentSegment,
  };
}

export function generateVoiceGuidance(turn: TurnGuidance, destinationName: string): string {
  if (turn.direction === 'arrive') return `You are arriving at ${destinationName}.`;
  const direction = turn.direction === 'straight' ? 'continue straight' : `turn ${turn.direction}`;
  const distance = turn.distanceMeters > 0 ? `After ${Math.max(10, Math.round(turn.distanceMeters / 10) * 10)} metres, ` : 'Now, ';
  return `${distance}${direction} onto ${turn.roadName} toward ${destinationName}.`;
}

export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.max(0, Math.round(meters / 10) * 10)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

export function formatDuration(seconds: number): string {
  const minutes = Math.max(0, Math.ceil(seconds / 60));
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  return `${hours} hr ${minutes % 60} min`;
}

export function formatSimulationTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainder = seconds % 60;
  return [hours, minutes, remainder].map((part) => String(part).padStart(2, '0')).join(':');
}
