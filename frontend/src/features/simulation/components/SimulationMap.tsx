import { useEffect, useMemo, useState } from 'react';
import L from 'leaflet';
import { CircleMarker, MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from 'react-leaflet';
import { GraphMap } from '../../../components/map/GraphMap';
import { emptyRoute } from '../simulationData';
import { getSimulationRoutePlan } from '../simulationEngine';
import { getSimulationRoadPath, getSimulationRoadPaths, getSimulationRoutePath } from '../simulationRoadGeometry';
import { Simulation3DScene } from './Simulation3DScene';
import type { CityData } from '../../ambulance/types';
import type { CameraMode, Scenario, SimulationState } from '../simulationTypes';

interface SimulationMapProps {
  city: CityData;
  state: SimulationState;
  cameraMode: CameraMode;
}

function markerIcon(kind: string, label: string) {
  return L.divIcon({
    className: `vialert-marker-host ${kind}`,
    html: `<span class="vialert-map-marker ${kind}" aria-hidden="true">${label}</span>`,
    iconSize: kind === 'ambulance' ? [44, 44] : [32, 32],
    iconAnchor: kind === 'ambulance' ? [22, 22] : [16, 16],
  });
}

function markerLetter(scenario: Scenario): string {
  const letters: Record<Scenario['type'], string> = {
    accident: 'A', construction: 'C', rain: 'R', flood: 'F', congestion: 'T', blockage: 'X',
  };
  return letters[scenario.type];
}

function FollowCamera({ enabled, position }: { enabled: boolean; position: [number, number] | null }) {
  const map = useMap();
  const latitude = position?.[0];
  const longitude = position?.[1];
  useEffect(() => {
    if (enabled && latitude !== undefined && longitude !== undefined) map.panTo([latitude, longitude], { animate: true, duration: 0.55 });
  }, [enabled, latitude, longitude, map]);
  return null;
}

function incidentPosition(city: CityData, scenario: Scenario): [number, number] | null {
  const node = scenario.nodeId ? city.nodes.find((candidate) => candidate.id === scenario.nodeId) : undefined;
  if (node) return [node.lat, node.lng];
  const road = scenario.roadId ? city.roads.find((candidate) => candidate.id === scenario.roadId) : undefined;
  const from = road ? city.nodes.find((candidate) => candidate.id === road.from) : undefined;
  const to = road ? city.nodes.find((candidate) => candidate.id === road.to) : undefined;
  return from && to ? [(from.lat + to.lat) / 2, (from.lng + to.lng) / 2] : null;
}

export function SimulationMap({ city, state, cameraMode }: SimulationMapProps) {
  const [graphOnly, setGraphOnly] = useState(false);
  const [tilesLoaded, setTilesLoaded] = useState(false);
  const [tilesFailed, setTilesFailed] = useState(false);
  const activeScenarios = [...state.scenarios, ...state.externalScenarios].filter((scenario) => scenario.active);
  const nodeById = useMemo(() => new Map(city.nodes.map((node) => [node.id, node])), [city.nodes]);
  const route = getSimulationRoutePlan(state) ?? emptyRoute;
  const routePositions = getSimulationRoutePath(city, route);
  const previousRoute = state.previousRouteNodeIds.length > 1
    ? { nodeIds: state.previousRouteNodeIds, roadIds: state.previousRouteRoadIds, totalDistanceMeters: 0, etaSeconds: 0 }
    : null;
  const previousRoutePositions = previousRoute ? getSimulationRoutePath(city, previousRoute) : [];
  const roadPaths = useMemo(() => getSimulationRoadPaths(city), [city]);
  const base = city.bases.find((candidate) => candidate.id === state.vehicle.baseId);
  const destination = city.hospitals.find((hospital) => hospital.id === state.vehicle.destinationId);
  const destinationNode = destination ? nodeById.get(destination.nodeId) : undefined;
  const ambulanceNode = nodeById.get(state.currentNodeId);
  const ambulancePosition: [number, number] | null = ambulanceNode ? [ambulanceNode.lat, ambulanceNode.lng] : null;
  const center: [number, number] = ambulancePosition ?? (routePositions[0] ?? [12.96, 77.62]);
  const tileUrl = import.meta.env.VITE_OSM_TILE_URL ?? 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
  const scenarioMarkers = activeScenarios.flatMap((scenario) => {
    const position = incidentPosition(city, scenario);
    return position ? [{ scenario, position }] : [];
  });
  const followEnabled = cameraMode === 'follow';
  const perspectiveMode = cameraMode === 'driver' || cameraMode === 'third-person' || cameraMode === 'rear-view';

  useEffect(() => {
    if (tilesLoaded || tilesFailed || graphOnly) return undefined;
    const timeout = window.setTimeout(() => setTilesFailed(true), 5000);
    return () => window.clearTimeout(timeout);
  }, [graphOnly, tilesFailed, tilesLoaded]);

  const useGraph = graphOnly || tilesFailed;
  return <section className="panel simulation-map-panel" aria-labelledby="simulation-map-title">
    <div className="map-heading panel-heading-row">
      <div><span className="eyebrow">{perspectiveMode ? '3D perspective view' : 'Live demo map'}</span><h2 id="simulation-map-title">Bengaluru emergency corridor</h2></div>
      <div className="map-heading-actions">
        <span className={`map-mode ${perspectiveMode ? 'graph' : useGraph ? 'graph' : 'street'}`}><i aria-hidden="true" />{perspectiveMode ? '3D scene' : useGraph ? 'Shared graph' : 'Street layer'}</span>
        {!perspectiveMode && <button className="map-toggle" type="button" onClick={() => {
          if (useGraph) {
            setTilesFailed(false);
            setTilesLoaded(false);
            setGraphOnly(false);
          } else setGraphOnly(true);
        }}>{useGraph ? 'Retry street map' : 'Use route graph'}</button>}
      </div>
    </div>
    <div className="map-frame simulation-map-frame">
      {perspectiveMode ? <Simulation3DScene city={city} state={state} cameraMode={cameraMode} /> : useGraph ? <GraphMap
        city={city}
        route={route}
        routePath={routePositions}
        previousRoutePath={previousRoutePositions}
        roadPaths={roadPaths}
        ambulance={ambulanceNode ? { lat: ambulanceNode.lat, lng: ambulanceNode.lng, segmentIndex: 0, currentNodeId: ambulanceNode.id, currentRoadName: ambulanceNode.name } : null}
        destinationName={destination?.name.replace(' (demo)', '') ?? 'Hospital'}
        baseNodeId={base?.nodeId}
        destinationNodeId={destination?.nodeId}
        followAmbulance={followEnabled}
        scenarioMarkers={activeScenarios}
        previousRouteNodeIds={state.previousRouteNodeIds}
      /> : <MapContainer center={center} zoom={12} scrollWheelZoom={false} className="leaflet-map">
        <FollowCamera enabled={followEnabled} position={ambulancePosition} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
          url={tileUrl}
          eventHandlers={{ tileload: () => setTilesLoaded(true), tileerror: () => setTilesFailed(true) }}
        />
        {city.roads.map((road) => {
          const from = nodeById.get(road.from);
          const to = nodeById.get(road.to);
          if (!from || !to) return null;
          const color = road.blocked ? '#e77468' : road.congestion === 'high' ? '#e5a54f' : road.congestion === 'medium' ? '#a79c64' : '#617269';
          return <Polyline key={road.id} positions={roadPaths[road.id] ?? getSimulationRoadPath(city, road)} pathOptions={{ color, weight: road.blocked ? 4 : 3, opacity: 0.8, dashArray: road.blocked ? '5 7' : undefined }} />;
        })}
        {previousRoutePositions.length > 1 && <Polyline positions={previousRoutePositions} pathOptions={{ color: '#9aaca0', weight: 4, opacity: .7, dashArray: '9 10' }} />}
        {routePositions.length > 1 && <>
          <Polyline positions={routePositions} pathOptions={{ color: '#9cf37a', weight: 14, opacity: 0.2, lineCap: 'round', lineJoin: 'round' }} />
          <Polyline positions={routePositions} pathOptions={{ color: '#aaf17b', weight: 5, opacity: 0.97, lineCap: 'round', lineJoin: 'round' }} />
        </>}
        {base && nodeById.get(base.nodeId) && <Marker position={[nodeById.get(base.nodeId)!.lat, nodeById.get(base.nodeId)!.lng]} icon={markerIcon('base', 'B')} title={base.name} alt={`Ambulance base: ${base.name}`}><Popup>{base.name.replace(' (demo)', '')}</Popup></Marker>}
        {destinationNode && <Marker position={[destinationNode.lat, destinationNode.lng]} icon={markerIcon('hospital', 'H')} title={destination?.name} alt={`Hospital destination: ${destination?.name}`}><Popup>{destination?.name.replace(' (demo)', '')}</Popup></Marker>}
        {ambulanceNode && <Marker position={[ambulanceNode.lat, ambulanceNode.lng]} icon={markerIcon('ambulance', 'A')} title={`${state.vehicle.ambulanceId} simulated position`} alt={`${state.vehicle.ambulanceId} simulated position`}><Popup>{state.vehicle.ambulanceId} · simulated vehicle</Popup></Marker>}
        {city.signals.map((signal) => {
          const node = nodeById.get(signal.nodeId);
          if (!node) return null;
          return <CircleMarker key={signal.id} center={[node.lat, node.lng]} radius={7} pathOptions={{ color: signal.state === 'green' ? '#8bda73' : signal.state === 'yellow' ? '#ecb560' : '#df7668', fillColor: signal.state === 'green' ? '#8bda73' : signal.state === 'yellow' ? '#ecb560' : '#df7668', fillOpacity: 1, weight: 2 }}><Popup>{node.name.replace(' (demo)', '')} signal · {signal.state.toUpperCase()} mock state</Popup></CircleMarker>;
        })}
        {scenarioMarkers.map(({ scenario, position }) => <Marker key={scenario.id} position={position} icon={markerIcon(`incident ${scenario.type} ${scenario.severity}`, markerLetter(scenario))} title={`${scenario.name} · ${scenario.severity} severity`} alt={`Simulated ${scenario.type} incident: ${scenario.name}`}><Popup><strong>{scenario.name}</strong><br />Simulated {scenario.type} · {scenario.severity} severity</Popup></Marker>)}
      </MapContainer>}
      {tilesFailed && !graphOnly && !perspectiveMode && <p className="map-fallback-note" role="status">Street tiles unavailable; the local shared graph is shown.</p>}
    </div>
    <div className="map-footer"><span>{perspectiveMode ? 'Perspective camera · green emergency corridor · destination and signal guidance are simulated.' : 'Green route · amber congestion · red blocked road · incident markers are simulated.'}</span><span>{perspectiveMode ? 'Shared simulation state' : useGraph ? 'Shared city graph fallback' : 'Street tiles © OpenStreetMap contributors'}</span></div>
  </section>;
}
