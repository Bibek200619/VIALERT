import type { CityData, Road, RoutePlan } from '../ambulance/types';

export type SimulationLatLng = [number, number];

// The demo graph stores junctions and road lengths, but not street geometry.
// These local waypoints keep the simulation route on a believable roadway when
// rendered over the street layer. Routing and distance calculations still use
// the shared graph data.
const ROAD_WAYPOINTS: Record<string, SimulationLatLng[]> = {
  R1: [[12.9850, 77.5990], [12.9828, 77.6010], [12.9792, 77.6036], [12.9756, 77.6067]],
  R2: [[12.9756, 77.6067], [12.9765, 77.6150], [12.9790, 77.6275], [12.9784, 77.6408]],
  R3: [[12.9756, 77.6067], [12.9675, 77.6125], [12.9580, 77.6185], [12.9470, 77.6225], [12.9352, 77.6245]],
  R4: [[12.9784, 77.6408], [12.9680, 77.6380], [12.9540, 77.6340], [12.9440, 77.6300], [12.9352, 77.6245]],
  R5: [[12.9352, 77.6245], [12.9290, 77.6240], [12.9230, 77.6240], [12.9177, 77.6238]],
  R6: [[12.9177, 77.6238], [12.8980, 77.6320], [12.8720, 77.6460], [12.8452, 77.6602]],
  R7: [[12.9784, 77.6408], [12.9810, 77.6580], [12.9880, 77.6810], [12.9800, 77.7140], [12.9698, 77.7500]],
  R8: [[12.9698, 77.7500], [12.9430, 77.7340], [12.9050, 77.7070], [12.8720, 77.6820], [12.8452, 77.6602]],
  R9: [[12.9756, 77.6067], [12.9730, 77.6048], [12.9700, 77.6020], [12.9670, 77.6000]],
  R10: [[12.9352, 77.6245], [12.9320, 77.6200], [12.9300, 77.6160], [12.9270, 77.6100]],
  R11: [[12.9850, 77.5990], [12.9820, 77.5995], [12.9740, 77.5998], [12.9670, 77.6000]],
  R12: [[12.9177, 77.6238], [12.9210, 77.6200], [12.9240, 77.6150], [12.9270, 77.6100]],
};

function samePoint(left: SimulationLatLng, right: SimulationLatLng): boolean {
  return left[0] === right[0] && left[1] === right[1];
}

function nodePoint(city: CityData, nodeId: string): SimulationLatLng | null {
  const node = city.nodes.find((candidate) => candidate.id === nodeId);
  return node ? [node.lat, node.lng] : null;
}

function orientedWaypoints(city: CityData, road: Road): SimulationLatLng[] {
  const from = nodePoint(city, road.from);
  const to = nodePoint(city, road.to);
  if (!from || !to) return [];

  const points = ROAD_WAYPOINTS[road.id] ?? [from, to];
  const first = points[0];
  const last = points[points.length - 1];
  if (samePoint(first, from) && samePoint(last, to)) return points;
  if (samePoint(first, to) && samePoint(last, from)) return [...points].reverse();
  return [from, ...points.slice(1, -1), to];
}

export function getSimulationRoadPath(city: CityData, road: Road): SimulationLatLng[] {
  return orientedWaypoints(city, road);
}

export function getSimulationRoutePath(city: CityData, route: RoutePlan): SimulationLatLng[] {
  const path: SimulationLatLng[] = [];
  route.roadIds.forEach((roadId, index) => {
    const road = city.roads.find((candidate) => candidate.id === roadId);
    if (!road) return;
    const segment = getSimulationRoadPath(city, road);
    const travelsForward = route.nodeIds[index] === road.from && route.nodeIds[index + 1] === road.to;
    const orientedSegment = travelsForward ? segment : [...segment].reverse();
    if (path.length > 0 && orientedSegment.length > 0 && samePoint(path[path.length - 1], orientedSegment[0])) path.push(...orientedSegment.slice(1));
    else path.push(...orientedSegment);
  });
  if (path.length > 0) return path;
  return route.nodeIds.flatMap((nodeId) => {
    const point = nodePoint(city, nodeId);
    return point ? [point] : [];
  });
}

export function getSimulationRoadPaths(city: CityData): Record<string, SimulationLatLng[]> {
  return Object.fromEntries(city.roads.map((road) => [road.id, getSimulationRoadPath(city, road)]));
}
