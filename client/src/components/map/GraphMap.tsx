import type { CityData, RoutePlan, RoutePosition } from '../../features/ambulance/types';

interface GraphMapProps {
  city: CityData;
  route: RoutePlan;
  ambulance: RoutePosition | null;
  destinationName: string;
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

export function GraphMap({ city, route, ambulance, destinationName }: GraphMapProps) {
  const nodeById = new Map(city.nodes.map((node) => [node.id, node]));
  const routeNodes = route.nodeIds.map((id) => nodeById.get(id)).filter((node) => node !== undefined);
  const routePoints = routeNodes.map((node) => project(city, node.lat, node.lng).join(',')).join(' ');
  const base = city.bases[0] ? nodeById.get(city.bases[0].nodeId) : undefined;
  const cautionRoads = city.roads.filter((road) => road.blocked || road.congestion === 'high').flatMap((road) => {
    const from = nodeById.get(road.from);
    const to = nodeById.get(road.to);
    if (!from || !to) return [];
    return [{ road, point: project(city, (from.lat + to.lat) / 2, (from.lng + to.lng) / 2) }];
  });

  return <div className="graph-map" role="img" aria-label={`Bengaluru demo road graph. Green route from ${base?.name ?? 'base'} to ${destinationName}. Ambulance marker shows current simulated position.`}>
    <svg viewBox="0 0 840 480" aria-hidden="true" focusable="false">
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
      <polyline points={routePoints} className="graph-route-shadow" />
      <polyline points={routePoints} className="graph-route-line" filter="url(#route-glow)" />
      {cautionRoads.map(({ road, point: [x, y] }) => <g key={road.id} className="graph-warning">
        <path d={`M ${x} ${y - 15} l 14 26 h -28 z`} />
        <text x={x} y={y + 7} textAnchor="middle">!</text>
        <title>{road.blocked ? 'Road blocked' : 'High congestion'} · {road.name}</title>
      </g>)}
      {city.signals.map((signal) => {
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
        return <g key={node.id} className={`graph-node ${node.type}`}>
          <circle cx={x} cy={y} r={node.type === 'junction' ? 5 : 9} />
          <text x={x + 12} y={y - 11}>{node.name.replace(' (demo)', '')}</text>
        </g>;
      })}
      {ambulance && (() => {
        const [x, y] = project(city, ambulance.lat, ambulance.lng);
        return <g className="graph-ambulance"><circle cx={x} cy={y} r="19" /><circle cx={x} cy={y} r="9" /><text x={x} y={y + 4} textAnchor="middle">A</text><title>Ambulance 07 simulated location</title></g>;
      })()}
    </svg>
    <div className="graph-map-label"><span className="live-dot" />ROUTE GRAPH · BENGALURU DEMO</div>
    <div className="graph-map-legend" aria-label="Map legend"><span><i className="legend-route" />Emergency route</span><span><i className="legend-signal" />Signals</span><span><i className="legend-warning" />Road caution</span></div>
  </div>;
}
