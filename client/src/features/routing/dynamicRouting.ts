import type { CityData, Road } from '../../services/apiClient';
import type { RoutePlan } from '../ambulance/types';

export type HazardType = 'accident' | 'construction' | 'rain' | 'heavy-rain' | 'flood' | 'congestion' | 'blockage';
export type HazardSeverity = 'low' | 'medium' | 'high';

export interface RoadHazard {
  id: string;
  type: HazardType;
  name: string;
  roadId?: string;
  nodeId?: string;
  severity: HazardSeverity;
  active: boolean;
  blocked?: boolean;
}

export interface DynamicGraph {
  city: CityData;
  roadCostMultipliers: Readonly<Record<string, number>>;
  affectedRoadIds: Set<string>;
  blockedRoadIds: Set<string>;
}

const congestionRank = { low: 0, medium: 1, high: 2 } as const;
const congestionLevels = ['low', 'medium', 'high'] as const;
const congestionMultiplier = { low: 1, medium: 1.5, high: 2.5 } as const;
const severityMultiplier = { low: 1.15, medium: 1.45, high: 1.9 } as const;

export function getIncidentPenalty(hazard: Pick<RoadHazard, 'type' | 'severity'>): number {
  if (hazard.type === 'rain' || hazard.type === 'heavy-rain') return 1;
  if (hazard.type === 'accident') return severityMultiplier[hazard.severity] * 1.3;
  if (hazard.type === 'construction') return severityMultiplier[hazard.severity] * 1.1;
  if (hazard.type === 'congestion') return severityMultiplier[hazard.severity];
  return 1;
}

export function getWeatherMultiplier(hazard: Pick<RoadHazard, 'type' | 'severity'>): number {
  return hazard.type === 'rain' || hazard.type === 'heavy-rain'
    ? { low: 1.15, medium: 1.3, high: 1.55 }[hazard.severity]
    : 1;
}

export function calculateRoadCost(road: Road, incidentMultiplier = 1, emergencyPriority = false): number {
  if (road.blocked) return Number.POSITIVE_INFINITY;
  const signalBenefit = emergencyPriority ? 0.9 : 1;
  return road.baseTimeSeconds * congestionMultiplier[road.congestion] * incidentMultiplier * signalBenefit;
}

export function getHazardAffectedRoadIds(city: CityData, hazard: Pick<RoadHazard, 'type' | 'roadId' | 'nodeId'>): Set<string> {
  const affected = new Set<string>();
  if (hazard.roadId && city.roads.some((road) => road.id === hazard.roadId)) affected.add(hazard.roadId);
  if (hazard.nodeId) for (const road of city.roads) {
    if (road.from === hazard.nodeId || road.to === hazard.nodeId) affected.add(road.id);
  }
  if ((hazard.type === 'rain' || hazard.type === 'heavy-rain') && affected.size > 0) {
    const endpoints = new Set<string>();
    for (const road of city.roads) if (affected.has(road.id)) {
      endpoints.add(road.from);
      endpoints.add(road.to);
    }
    for (const road of city.roads) if (endpoints.has(road.from) || endpoints.has(road.to)) affected.add(road.id);
  }
  return affected;
}

export function buildDynamicGraph(city: CityData, hazards: readonly RoadHazard[]): DynamicGraph {
  const effects = new Map<string, { blocked: boolean; congestion: Road['congestion']; multiplier: number }>();
  const affectedRoadIds = new Set<string>();
  const active = hazards.filter((hazard) => hazard.active).slice().sort((a, b) => a.id.localeCompare(b.id));
  const roadById = new Map(city.roads.map((road) => [road.id, road]));
  for (const hazard of active) {
    for (const roadId of getHazardAffectedRoadIds(city, hazard)) {
      const road = roadById.get(roadId);
      if (!road) continue;
      affectedRoadIds.add(roadId);
      const previous = effects.get(roadId) ?? { blocked: road.blocked, congestion: road.congestion, multiplier: 1 };
      const raisesCongestion = hazard.type === 'rain' || hazard.type === 'heavy-rain'
        ? Math.min(2, congestionRank[previous.congestion] + 1)
        : hazard.type === 'accident' || hazard.type === 'construction' || hazard.type === 'congestion'
          ? Math.max(congestionRank[previous.congestion], hazard.severity === 'low' ? 1 : 2)
          : congestionRank[previous.congestion];
      effects.set(roadId, {
        blocked: previous.blocked || hazard.type === 'flood' || hazard.type === 'blockage' || Boolean(hazard.blocked),
        congestion: congestionLevels[raisesCongestion],
        multiplier: previous.multiplier * getIncidentPenalty(hazard) * getWeatherMultiplier(hazard),
      });
    }
  }
  const roadCostMultipliers: Record<string, number> = {};
  const blockedRoadIds = new Set<string>();
  const roads = city.roads.map((road) => {
    const effect = effects.get(road.id);
    if (effect) roadCostMultipliers[road.id] = effect.multiplier;
    const updated = effect ? { ...road, blocked: effect.blocked, congestion: effect.congestion } : road;
    if (updated.blocked) blockedRoadIds.add(road.id);
    return updated;
  });
  return { city: { ...city, roads }, roadCostMultipliers, affectedRoadIds, blockedRoadIds };
}

function etaDifference(previous: RoutePlan | null, next: RoutePlan | null): string {
  if (!previous || !next) return '';
  const difference = next.etaSeconds - previous.etaSeconds;
  if (Math.abs(difference) < 30) return ' ETA is nearly unchanged.';
  return ` ETA ${difference > 0 ? 'increased' : 'decreased'} by ${Math.max(1, Math.round(Math.abs(difference) / 60))} min.`;
}

export function explainRouteChange(input: {
  city: CityData;
  destinationName: string;
  previous: RoutePlan | null;
  next: RoutePlan | null;
  hazard?: RoadHazard;
  blockedRoadIds: ReadonlySet<string>;
}): string {
  const { city, destinationName, previous, next, hazard, blockedRoadIds } = input;
  const road = city.roads.find((item) => item.id === hazard?.roadId);
  const cause = hazard ? `${hazard.name}${road && !hazard.name.includes(road.name) ? ` on ${road.name}` : ''}` : 'changed road conditions';
  if (!next) {
    const blockedNames = [...blockedRoadIds].map((id) => city.roads.find((item) => item.id === id)?.name ?? id);
    return `No safe route available to ${destinationName}. ${blockedNames.length} blocked road${blockedNames.length === 1 ? '' : 's'}${blockedNames.length ? `: ${blockedNames.join(', ')}` : ''}. Remove a blocking incident or reset the demo route.`;
  }
  if (!previous) return `Route available to ${destinationName} after ${cause}.`;
  const pathChanged = previous.roadIds.join('|') !== next.roadIds.join('|');
  if (pathChanged) return hazard?.active
    ? `Rerouted to avoid ${cause}.${etaDifference(previous, next)}`
    : `Route restored after ${cause} cleared.${etaDifference(previous, next)}`;
  const onRoute = hazard && [...getHazardAffectedRoadIds(city, hazard)].some((id) => next.roadIds.includes(id));
  if (onRoute) return `${cause} changes travel cost on this corridor.${etaDifference(previous, next)}`;
  return `${cause} is ${hazard?.active ? 'active away from' : 'cleared from'} the ambulance corridor; route is unchanged.`;
}
