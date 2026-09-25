import { useEffect, useMemo, useState } from 'react';
import L from 'leaflet';
import { CircleMarker, MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from 'react-leaflet';
import { GraphMap } from '../../../components/map/GraphMap';
import type { CityData, IncidentRecord, TrafficForecast } from '../../../services/apiClient';
import type { OperationsVehicle } from '../trafficTypes';

type FocusMode = 'all' | 'selected';

function MapFocus({ city, vehicles, selected, mode, focusedNodeId }: { city: CityData; vehicles: OperationsVehicle[]; selected: OperationsVehicle | null; mode: FocusMode; focusedNodeId: string | null }) {
  const map = useMap();
  const positionKey = vehicles.map((vehicle) => `${vehicle.id}:${vehicle.currentNodeId}`).join('|');
  useEffect(() => {
    const focus = focusedNodeId ? city.nodes.find((node) => node.id === focusedNodeId) : null;
    if (focus) { map.setView([focus.lat, focus.lng], 13, { animate: false }); return; }
    const selectedNode = selected && city.nodes.find((node) => node.id === selected.currentNodeId);
    if (mode === 'selected' && selectedNode) { map.setView([selectedNode.lat, selectedNode.lng], 13, { animate: false }); return; }
    const points = vehicles.flatMap((vehicle) => {
      const node = city.nodes.find((candidate) => candidate.id === vehicle.currentNodeId);
      return node ? [[node.lat, node.lng] as [number, number]] : [];
    });
    if (points.length > 0) map.fitBounds(points, { padding: [70, 70], maxZoom: 12, animate: false });
  }, [city.nodes, focusedNodeId, map, mode, selected?.currentNodeId, positionKey]);
  return null;
}

function iconFor(vehicle: OperationsVehicle, selected: boolean) {
  const label = vehicle.type === 'ambulance' ? 'A' : vehicle.type === 'bus' ? 'B' : 'V';
  return L.divIcon({ className: 'vialert-marker-host', html: `<span class="traffic-map-vehicle ${vehicle.type}${selected ? ' selected' : ''}" aria-hidden="true">${label}</span>`, iconSize: [38, 38], iconAnchor: [19, 19] });
}

export function TrafficOperationsMap({ city, vehicles, selected, incidents, predictions, focusedNodeId, onClearLocation }: { city: CityData; vehicles: OperationsVehicle[]; selected: OperationsVehicle | null; incidents: IncidentRecord[]; predictions: TrafficForecast[]; focusedNodeId: string | null; onClearLocation: () => void }) {
  const [graphOnly, setGraphOnly] = useState(false);
  const [tileLoaded, setTileLoaded] = useState(false);
  const [tileFailed, setTileFailed] = useState(false);
  const [focusMode, setFocusMode] = useState<FocusMode>('all');
  const [showSignals, setShowSignals] = useState(true);
  const [showIncidents, setShowIncidents] = useState(true);
  const [showRoutes, setShowRoutes] = useState(true);
  const [showForecast, setShowForecast] = useState(true);
  const nodeById = useMemo(() => new Map(city.nodes.map((node) => [node.id, node])), [city.nodes]);
  const selectedNode = selected && nodeById.get(selected.currentNodeId);
  const destination = selected && nodeById.get(selected.destinationNodeId);
  const base = selected && nodeById.get(selected.originNodeId);
  const route = selected ? { nodeIds: selected.routeNodeIds, roadIds: selected.routeRoadIds, totalDistanceMeters: selected.distanceRemainingMeters, etaSeconds: selected.etaSeconds } : { nodeIds: [], roadIds: [], totalDistanceMeters: 0, etaSeconds: 0 };
  const routePositions = route.nodeIds.flatMap((id) => { const node = nodeById.get(id); return node ? [[node.lat, node.lng] as [number, number]] : []; });
  const previousRoutePositions = selected?.previousRouteNodeIds.flatMap((id) => { const node = nodeById.get(id); return node ? [[node.lat, node.lng] as [number, number]] : []; }) ?? [];
  const incidentMarkers = incidents.flatMap((incident) => {
    const road = city.roads.find((item) => item.id === incident.roadId);
    const from = road && nodeById.get(road.from);
    const to = road && nodeById.get(road.to);
    return road && from && to ? [{ incident, road, position: [(from.lat + to.lat) / 2, (from.lng + to.lng) / 2] as [number, number] }] : [];
  });
  const forecastRoads = predictions.flatMap((item) => item.predictedCongestion === 'high' || item.predictedCongestion === 'severe'
    ? [{ roadId: item.roadId, level: item.predictedCongestion, riskScore: item.riskScore }] : []);
  useEffect(() => {
    if (graphOnly || tileLoaded || tileFailed) return undefined;
    const timer = window.setTimeout(() => setTileFailed(true), 5000);
    return () => window.clearTimeout(timer);
  }, [graphOnly, tileLoaded, tileFailed]);
  const useGraph = graphOnly || tileFailed;
  const tileUrl = import.meta.env.VITE_OSM_TILE_URL ?? 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

  return <section className="panel traffic-map-panel" id="traffic-map" aria-labelledby="traffic-map-title">
    <div className="traffic-panel-heading traffic-map-heading"><div><span className="eyebrow">Live position · Bengaluru demo</span><h2 id="traffic-map-title">Live route map</h2><p>Selected ambulance, route, signals, and incidents.</p></div><span className="map-mode"><i aria-hidden="true" />{useGraph ? 'Shared graph' : 'Street layer'}</span></div>
    <div className="traffic-map-toolbar" aria-label="Map controls">
      <button type="button" onClick={() => { onClearLocation(); setFocusMode('all'); }} aria-pressed={focusMode === 'all'}>Fit all vehicles</button>
      <button type="button" onClick={() => { onClearLocation(); setFocusMode('selected'); }} aria-pressed={focusMode === 'selected'} disabled={!selected}>Focus selected</button>
      <button type="button" onClick={() => setShowSignals((value) => !value)} aria-pressed={showSignals}>Signals</button>
      <button type="button" onClick={() => setShowIncidents((value) => !value)} aria-pressed={showIncidents}>Incidents</button>
      <button type="button" onClick={() => setShowRoutes((value) => !value)} aria-pressed={showRoutes}>Routes</button>
      <button type="button" onClick={() => setShowForecast((value) => !value)} aria-pressed={showForecast}>Future risk</button>
      <button type="button" onClick={() => { setGraphOnly((value) => !value); setTileFailed(false); setTileLoaded(false); }}>{useGraph ? 'Use map view' : 'Use graph fallback'}</button>
    </div>
    <div className="map-frame traffic-map-frame">
      {useGraph ? <GraphMap theme="light" city={city} route={route} ambulance={selected?.type === 'ambulance' && selectedNode ? { lat: selectedNode.lat, lng: selectedNode.lng, currentNodeId: selectedNode.id, currentRoadName: selectedNode.name, segmentIndex: 0 } : null} destinationName={destination?.name ?? 'Destination'} baseNodeId={base?.id} destinationNodeId={destination?.id} followAmbulance={focusMode === 'selected'} focusNodeId={focusedNodeId} showSignals={showSignals} showIncidents={showIncidents} showRoute={showRoutes} routeTone={selected?.type === 'ambulance' ? 'emergency' : 'standard'} previousRouteNodeIds={selected?.previousRouteNodeIds} forecastRoads={showForecast ? forecastRoads : []} scenarioMarkers={incidentMarkers.map(({ incident, road }) => ({ id: incident.id, name: road.name, type: incident.type, severity: incident.severity, roadId: incident.roadId }))} otherVehicles={vehicles.filter((vehicle) => vehicle.id !== selected?.id || vehicle.type !== 'ambulance').flatMap((vehicle) => { const node = nodeById.get(vehicle.currentNodeId); return node ? [{ id: vehicle.id, type: vehicle.type, lat: node.lat, lng: node.lng, selected: vehicle.id === selected?.id }] : []; })} />
        : <MapContainer center={[12.96, 77.62]} zoom={11} scrollWheelZoom={false} className="leaflet-map">
          <MapFocus city={city} vehicles={vehicles} selected={selected} mode={focusMode} focusedNodeId={focusedNodeId} />
          <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>' url={tileUrl} eventHandlers={{ tileload: () => setTileLoaded(true), tileerror: () => setTileFailed(true) }} />
          {city.roads.map((road) => { const from = nodeById.get(road.from); const to = nodeById.get(road.to); return from && to ? <Polyline key={road.id} positions={[[from.lat, from.lng], [to.lat, to.lng]]} pathOptions={{ color: road.blocked ? '#e36d61' : road.congestion === 'high' ? '#dcaa58' : '#6c8175', weight: road.blocked ? 5 : 3, dashArray: road.blocked ? '5 7' : undefined }}><Popup>{road.name} · {road.blocked ? 'Blocked' : `${road.congestion} congestion`} · simulated</Popup></Polyline> : null; })}
          {showForecast && forecastRoads.map((forecast) => { const road = city.roads.find((item) => item.id === forecast.roadId); const from = road && nodeById.get(road.from); const to = road && nodeById.get(road.to); return road && from && to ? <Polyline key={`forecast-${road.id}`} positions={[[from.lat, from.lng], [to.lat, to.lng]]} pathOptions={{ color: forecast.level === 'severe' ? '#e7786b' : '#f0bd6d', weight: 8, opacity: .8, dashArray: '5 9' }}><Popup>{road.name} · {forecast.level} future risk · {forecast.riskScore}/100 · heuristic demo</Popup></Polyline> : null; })}
          {showRoutes && previousRoutePositions.length > 1 && <Polyline positions={previousRoutePositions} pathOptions={{ color: '#a1b2a5', weight: 4, opacity: .7, dashArray: '9 10' }} />}
          {showRoutes && routePositions.length > 1 && <Polyline positions={routePositions} pathOptions={{ color: selected?.type === 'ambulance' ? '#2563eb' : '#64748b', weight: 6, opacity: .96 }} />}
          {city.bases.map((item) => { const node = nodeById.get(item.nodeId); return node ? <CircleMarker key={item.id} center={[node.lat, node.lng]} radius={9} pathOptions={{ color: '#d5dfdb', fillColor: '#a1b5ac', fillOpacity: 1 }}><Popup>{item.name}</Popup></CircleMarker> : null; })}
          {city.hospitals.map((item) => { const node = nodeById.get(item.nodeId); return node ? <CircleMarker key={item.id} center={[node.lat, node.lng]} radius={9} pathOptions={{ color: '#d9e7dc', fillColor: '#77b8a0', fillOpacity: 1 }}><Popup>{item.name}</Popup></CircleMarker> : null; })}
          {showSignals && city.signals.map((signal) => { const node = nodeById.get(signal.nodeId); return node ? <CircleMarker key={signal.id} center={[node.lat, node.lng]} radius={6} pathOptions={{ color: '#1e261f', fillColor: signal.state === 'green' ? '#aaf17b' : signal.state === 'yellow' ? '#f4c06b' : '#ef8274', fillOpacity: 1 }}><Popup>{signal.id} · {signal.state.toUpperCase()} · {signal.mode} · simulated</Popup></CircleMarker> : null; })}
          {showIncidents && incidentMarkers.map(({ incident, road, position }) => <CircleMarker key={incident.id} center={position} radius={11} pathOptions={{ color: '#f2b36b', fillColor: incident.blocked ? '#ec7368' : '#e5a652', fillOpacity: .92 }}><Popup>{road.name} · {incident.type} · {incident.severity} · simulated</Popup></CircleMarker>)}
          {vehicles.map((vehicle) => { const node = nodeById.get(vehicle.currentNodeId); return node ? <Marker key={vehicle.id} position={[node.lat, node.lng]} icon={iconFor(vehicle, vehicle.id === selected?.id)} title={`${vehicle.id} simulated location`} alt={`${vehicle.id} simulated ${vehicle.type} location`}><Popup>{vehicle.vehicleNumber} · {vehicle.status} · simulated</Popup></Marker> : null; })}
        </MapContainer>}
      {tileFailed && !graphOnly && <p className="map-fallback-note" role="status">Street tiles unavailable. Shared city graph shown.</p>}
    </div>
    <div className="map-footer"><span>Green route · red closure · amber congestion · dashed amber/red future risk</span><span>{useGraph ? 'Local graph fallback' : '© OpenStreetMap contributors'}</span></div>
  </section>;
}
