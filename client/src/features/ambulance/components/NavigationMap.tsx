import { useEffect, useMemo, useState } from 'react';
import L from 'leaflet';
import { CircleMarker, MapContainer, Marker, Polyline, Popup, TileLayer, useMap, ZoomControl } from 'react-leaflet';
import { GraphMap } from '../../../components/map/GraphMap';
import type { CityData, RoutePlan, RoutePosition } from '../types';

interface NavigationMapProps {
  city: CityData;
  route: RoutePlan;
  ambulance: RoutePosition | null;
  destinationName: string;
  previousRouteNodeIds?: string[];
  navigationMode?: boolean;
}

function markerIcon(kind: 'ambulance' | 'base' | 'hospital' | 'signal' | 'warning', label: string) {
  return L.divIcon({
    className: `vialert-marker-host ${kind}`,
    html: `<span class="vialert-map-marker ${kind}" aria-hidden="true">${label}</span>`,
    iconSize: kind === 'ambulance' ? [48, 48] : [32, 32],
    iconAnchor: kind === 'ambulance' ? [24, 24] : [16, 16],
  });
}

function NavigationCamera({ enabled, center, routePositions, routeKey }: {
  enabled: boolean;
  center: [number, number] | null;
  routePositions: [number, number][];
  routeKey: string;
}) {
  const map = useMap();

  useEffect(() => {
    if (!enabled || !center) return;
    map.flyTo(center, 16, { animate: true, duration: 0.65 });
  }, [center?.[0], center?.[1], enabled, map]);

  useEffect(() => {
    if (enabled) return;
    if (routePositions.length > 1) {
      map.fitBounds(L.latLngBounds(routePositions), { animate: true, duration: 0.6, padding: [42, 42], maxZoom: 13 });
      return;
    }
    if (center) map.flyTo(center, 12, { animate: true, duration: 0.5 });
  }, [enabled, map, routeKey]);

  return null;
}

export function NavigationMap({ city, route, ambulance, destinationName, previousRouteNodeIds = [], navigationMode = false }: NavigationMapProps) {
  const [graphOnly, setGraphOnly] = useState(false);
  const [tilesLoaded, setTilesLoaded] = useState(false);
  const [tilesFailed, setTilesFailed] = useState(false);
  const nodeById = useMemo(() => new Map(city.nodes.map((node) => [node.id, node])), [city.nodes]);
  const routeNodes = route.nodeIds.map((id) => nodeById.get(id)).filter((node) => node !== undefined);
  const base = city.bases[0] ? nodeById.get(city.bases[0].nodeId) : undefined;
  const destination = city.hospitals.find((hospital) => hospital.name.replace(' (demo)', '') === destinationName);
  const destinationNode = destination ? nodeById.get(destination.nodeId) : undefined;
  const centerNode = ambulance ?? routeNodes[Math.floor(routeNodes.length / 2)] ?? base;
  const center: [number, number] = centerNode ? [centerNode.lat, centerNode.lng] : [12.95, 77.62];
  const cameraCenter: [number, number] | null = centerNode ? [centerNode.lat, centerNode.lng] : null;
  const tileUrl = import.meta.env.VITE_OSM_TILE_URL ?? 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
  const routePositions = routeNodes.map((node) => [node.lat, node.lng] as [number, number]);
  const routeKey = route.nodeIds.join('|');
  const previousRoutePositions = previousRouteNodeIds.flatMap((id) => { const node = nodeById.get(id); return node ? [[node.lat, node.lng] as [number, number]] : []; });
  const cautionRoads = city.roads.filter((road) => road.blocked || road.congestion === 'high').flatMap((road) => {
    const from = nodeById.get(road.from);
    const to = nodeById.get(road.to);
    return from && to ? [{ road, lat: (from.lat + to.lat) / 2, lng: (from.lng + to.lng) / 2 }] : [];
  });

  useEffect(() => {
    if (tilesLoaded || tilesFailed || graphOnly) return undefined;
    const timeout = window.setTimeout(() => setTilesFailed(true), 5000);
    return () => window.clearTimeout(timeout);
  }, [tilesFailed, tilesLoaded, graphOnly]);

  const showGraph = graphOnly || tilesFailed;
  return <section className={`navigation-map-panel ambulance-driver-map${navigationMode ? ' is-navigation' : ''}`} aria-label="Bengaluru emergency navigation map">
    <div className="map-frame">
      {showGraph ? <GraphMap city={city} route={route} ambulance={ambulance} destinationName={destinationName} previousRouteNodeIds={previousRouteNodeIds} /> : <MapContainer center={center} zoom={12} scrollWheelZoom className="leaflet-map" zoomControl={false}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
          url={tileUrl}
          eventHandlers={{ tileload: () => setTilesLoaded(true), tileerror: () => setTilesFailed(true) }}
        />
        <NavigationCamera enabled={navigationMode} center={cameraCenter} routePositions={routePositions} routeKey={routeKey} />
        <ZoomControl position="topright" />
        {city.roads.map((road) => {
          const from = nodeById.get(road.from);
          const to = nodeById.get(road.to);
          if (!from || !to) return null;
          return <Polyline key={road.id} positions={[[from.lat, from.lng], [to.lat, to.lng]]} pathOptions={{ color: road.blocked ? '#d76a60' : '#52635a', weight: road.blocked ? 3 : 2, opacity: 0.48, dashArray: road.blocked ? '5 7' : undefined }} />;
        })}
        {previousRoutePositions.length > 1 && <Polyline positions={previousRoutePositions} pathOptions={{ color: '#9caca0', weight: 4, opacity: .58, dashArray: '9 10' }} />}
        {routePositions.length > 1 && <>
          <Polyline positions={routePositions} pathOptions={{ color: '#38e77b', weight: navigationMode ? 19 : 15, opacity: 0.13, lineCap: 'round', lineJoin: 'round' }} />
          <Polyline positions={routePositions} pathOptions={{ color: '#35e67a', weight: navigationMode ? 7 : 5, opacity: 0.98, lineCap: 'round', lineJoin: 'round' }} />
        </>}
        {base && !navigationMode && <Marker position={[base.lat, base.lng]} icon={markerIcon('base', 'B')} title={base.name} alt={`Ambulance base: ${base.name}`}><Popup>{base.name}</Popup></Marker>}
        {destinationNode && <Marker position={[destinationNode.lat, destinationNode.lng]} icon={markerIcon('hospital', 'H')} title={destinationName} alt={`Hospital destination: ${destinationName}`}><Popup>{destinationName}</Popup></Marker>}
        {ambulance && <Marker position={[ambulance.lat, ambulance.lng]} icon={markerIcon('ambulance', '▲')} title="Ambulance 07 simulated location" alt="Ambulance 07 simulated location"><Popup>Ambulance 07 · simulated movement</Popup></Marker>}
        {city.signals.map((signal) => {
          const node = nodeById.get(signal.nodeId);
          if (!node) return null;
          return <CircleMarker key={signal.id} center={[node.lat, node.lng]} radius={navigationMode ? 9 : 7} pathOptions={{ color: signal.state === 'green' ? '#35e67a' : signal.state === 'yellow' ? '#ecb560' : '#df7668', fillColor: signal.state === 'green' ? '#35e67a' : signal.state === 'yellow' ? '#ecb560' : '#df7668', fillOpacity: 1, weight: 2 }}><Popup>{node.name} signal · {signal.state.toUpperCase()} · mock status</Popup></CircleMarker>;
        })}
        {cautionRoads.map(({ road, lat, lng }) => <Marker key={road.id} position={[lat, lng]} icon={markerIcon('warning', '!')} title={`${road.blocked ? 'Blocked' : 'High congestion'} · ${road.name}`} alt={`${road.blocked ? 'Blocked road' : 'High congestion'}: ${road.name}`}><Popup>{road.blocked ? 'Blocked demo road' : 'High congestion warning'} · {road.name}</Popup></Marker>)}
      </MapContainer>}

      <div className="driver-map-mode">
        <span className={`map-mode ${showGraph ? 'graph' : 'street'}`}><i aria-hidden="true" />{showGraph ? 'Route graph' : navigationMode ? 'Navigation view' : 'Route overview'}</span>
        <button className="map-toggle" type="button" onClick={() => {
          if (showGraph) {
            setTilesFailed(false);
            setTilesLoaded(false);
            setGraphOnly(false);
          } else setGraphOnly(true);
        }} aria-pressed={graphOnly}>
          {showGraph ? 'Street map' : 'Route graph'}
        </button>
      </div>

      {tilesFailed && !graphOnly && <p className="map-fallback-note" role="status">Street tiles are unavailable; the shared city graph is shown.</p>}
    </div>
  </section>;
}
