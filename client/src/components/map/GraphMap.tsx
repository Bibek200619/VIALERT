import type { CityData, RoutePlan, RoutePosition } from '../../features/ambulance/types';

interface GraphMapProps {
  city: CityData;
  route: RoutePlan;
  ambulance: RoutePosition | null;
  destinationName: string;
  baseNodeId?: string;
  destinationNodeId?: string;
  followAmbulance?: boolean;
  scenarioMarkers?: GraphScenarioMarker[];
  otherVehicles?: { id: string; type: string; lat: number; lng: number; selected?: boolean }[];
  showSignals?: boolean;
  showIncidents?: boolean;
  showRoute?: boolean;
  routeTone?: 'emergency' | 'standard';
  focusNodeId?: string | null;
  previousRouteNodeIds?: string[];
}

export interface GraphScenarioMarker {
  id: string;
  name: string;
  type: string;
  severity: string;
  roadId?: string;
  nodeId?: string;
}

function project(city: CityData, lat: number, lng: number): [number, number] {
  const latitudes = city.nodes.map((node) => node.lat);
  const longitudes = city.nodes.map((node) => node.lng);
  const minLat = Math.min(...latitudes);
  const maxLat = Math.max(...latitudes);
  const minLng = Math.min(...longitudes);
  const maxLng = Math.max(...longitudes);
  const width = maxLng - minLng || 1;
  const height = maxLat - minLat || 1;
  const x = 70 + ((lng - minLng) / width) * 700;
  const y = 55 + ((maxLat - lat) / height) * 360;
  return [x, y];
}

export function GraphMap({
  city,
  route,
  ambulance,
  destinationName,
  baseNodeId,
  destinationNodeId,
  followAmbulance = false,
  scenarioMarkers = [],
  otherVehicles = [],
  showSignals = true,
  showIncidents = true,
  showRoute = true,
  routeTone = 'emergency',
  focusNodeId = null,
  previousRouteNodeIds = [],
}: GraphMapProps) {
  const nodeById = new Map(city.nodes.map((node) => [node.id, node]));
  const routeNodes = route.nodeIds.map((id) => nodeById.get(id)).filter((node) => node !== undefined);
  const routePoints = routeNodes.map((node) => project(city, node.lat, node.lng).join(',')).join(' ');
  const previousRoutePoints = previousRouteNodeIds.flatMap((id) => {
    const node = nodeById.get(id);
    return node ? [project(city, node.lat, node.lng).join(',')] : [];
  }).join(' ');
  const base = nodeById.get(baseNodeId ?? city.bases[0]?.nodeId ?? '');
  const destination = nodeById.get(destinationNodeId ?? city.hospitals.find((hospital) => hospital.name.replace(' (demo)', '') === destinationName)?.nodeId ?? '');
  const ambulancePoint = ambulance ? project(city, ambulance.lat, ambulance.lng) : undefined;
  const focusNode = focusNodeId ? nodeById.get(focusNodeId) : undefined;
  const focusPoint = focusNode ? project(city, focusNode.lat, focusNode.lng) : followAmbulance ? ambulancePoint : undefined;
  const viewBox = focusPoint
    ? `${focusPoint[0] - 420} ${focusPoint[1] - 240} 840 480`
    : '0 0 840 480';
  const cautionRoads = city.roads.filter((road) => road.blocked || road.congestion === 'high').flatMap((road) => {
    const from = nodeById.get(road.from);
    const to = nodeById.get(road.to);
    if (!from || !to) return [];
    return [{ road, point: project(city, (from.lat + to.lat) / 2, (from.lng + to.lng) / 2) }];
  });

  const scenarioPoints = scenarioMarkers.flatMap((scenario) => {
    if (scenario.nodeId) {
      const node = nodeById.get(scenario.nodeId);
      if (!node) return [];
      return [{ scenario, point: project(city, node.lat, node.lng) }];
    }
    const road = city.roads.find((candidate) => candidate.id === scenario.roadId);
    const from = road ? nodeById.get(road.from) : undefined;
    const to = road ? nodeById.get(road.to) : undefined;
    return from && to ? [{ scenario, point: project(city, (from.lat + to.lat) / 2, (from.lng + to.lng) / 2) }] : [];
  });
  const indicator: Record<string, string> = { accident: 'A', construction: 'C', rain: 'R', flood: 'F', congestion: 'T', blockage: 'X' };

  return <div className={`graph-map${followAmbulance ? ' follow-camera' : ''}${routeTone === 'standard' ? ' standard-route' : ''}`} role="img" aria-label={`Bengaluru demo road graph. Route from ${base?.name ?? 'base'} to ${destinationName}; simulated vehicles, signals, and incident overlays are marked.`}>
    <svg viewBox={viewBox} aria-hidden="true" focusable="false">
      <defs>
        <pattern id="map-grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M 40 0 L 0 0 0 40" fill="none" stroke="#26352e" strokeWidth="1" /></pattern>
        <filter id="route-glow"><feGaussianBlur stdDeviation="4" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
      </defs>
      <rect width="840" height="480" fill="#111a17" />
      <rect width="840" height="480" fill="url(#map-grid)" />
      <path d="M0 400 C180 350 170 230 300 205 S510 260 640 175 730 90 840 65" fill="none" stroke="#1e2c26" strokeWidth="56" />
      <path d="M0 400 C180 350 170 230 300 205 S510 260 640 175 730 90 840 65" fill="none" stroke="#25342d" strokeWidth="2" strokeDasharray="9 12" />
      {city.roads.map((road) => {
        const from = nodeById.get(road.from);
        const to = nodeById.get(road.to);
        if (!from || !to) return null;
        const [x1, y1] = project(city, from.lat, from.lng);
        const [x2, y2] = project(city, to.lat, to.lng);
        return <line key={road.id} x1={x1} y1={y1} x2={x2} y2={y2} className={`graph-road ${road.blocked ? 'blocked' : ''}`} />;
      })}
      {showRoute && previousRouteNodeIds.length > 1 && <polyline points={previousRoutePoints} fill="none" stroke="#91a99d" strokeWidth="5" strokeDasharray="10 10" opacity=".78" />}
      {showRoute && <><polyline points={routePoints} className="graph-route-shadow" /><polyline points={routePoints} className="graph-route-line" filter="url(#route-glow)" /></>}
      {showIncidents && cautionRoads.map(({ road, point: [x, y] }) => <g key={road.id} className="graph-warning">
        <path d={`M ${x} ${y - 15} l 14 26 h -28 z`} />
        <text x={x} y={y + 7} textAnchor="middle">!</text>
        <title>{road.blocked ? 'Road blocked' : 'High congestion'} · {road.name}</title>
      </g>)}
      {showIncidents && scenarioPoints.map(({ scenario, point: [x, y] }) => <g key={scenario.id} className={`graph-incident ${scenario.type} ${scenario.severity}`}>
        <circle cx={x} cy={y} r="18" />
        <text x={x} y={y + 5} textAnchor="middle">{indicator[scenario.type] ?? '!'}</text>
        <title>{scenario.name} · {scenario.severity} severity · simulated</title>
      </g>)}
      {showSignals && city.signals.map((signal) => {
        const node = nodeById.get(signal.nodeId);
        if (!node) return null;
        const [x, y] = project(city, node.lat, node.lng);
        return <g key={signal.id} className={`graph-signal ${signal.state}`}>
          <circle cx={x} cy={y} r="13" /><text x={x} y={y + 4} textAnchor="middle">{signal.state === 'green' ? 'G' : signal.state === 'yellow' ? 'Y' : 'R'}</text>
          <title>{node.name} signal · {signal.state}</title>
        </g>;
      })}
      {city.nodes.map((node) => {
        const [x, y] = project(city, node.lat, node.lng);
        return <g key={node.id} className={`graph-node ${node.type}${node.id === destination?.id ? ' destination' : ''}`}>
          <circle cx={x} cy={y} r={node.type === 'junction' ? 5 : 9} />
          <text x={x + 12} y={y - 11}>{node.name.replace(' (demo)', '')}</text>
        </g>;
      })}
      {ambulancePoint && <g className="graph-ambulance animated" transform={`translate(${ambulancePoint[0]} ${ambulancePoint[1]})`}>
        <circle cx="0" cy="0" r="19" /><circle cx="0" cy="0" r="9" /><text x="0" y="4" textAnchor="middle">A</text><title>Ambulance simulated location</title>
      </g>}
      {otherVehicles.map((vehicle) => {
        const [x, y] = project(city, vehicle.lat, vehicle.lng);
        return <g key={vehicle.id} className={`graph-other-vehicle ${vehicle.type}${vehicle.selected ? ' selected' : ''}`} transform={`translate(${x} ${y})`}>
          <circle r={vehicle.selected ? 16 : 13} /><text textAnchor="middle" y="4">{vehicle.type === 'bus' ? 'B' : vehicle.type === 'ambulance' ? 'A' : 'V'}</text><title>{vehicle.id} · simulated {vehicle.type}</title>
        </g>;
      })}
    </svg>
    <div className="graph-map-label"><span className="live-dot" />{followAmbulance ? 'FOLLOW AMBULANCE' : 'ROUTE GRAPH'} · BENGALURU DEMO</div>
    <div className="graph-map-legend" aria-label="Map legend"><span><i className="legend-route" />{routeTone === 'standard' ? 'Selected route' : 'Emergency route'}</span>{previousRouteNodeIds.length > 1 && <span>Dashed · previous route</span>}<span><i className="legend-signal" />Signals</span><span><i className="legend-warning" />Road caution</span></div>
  </div>;
}
