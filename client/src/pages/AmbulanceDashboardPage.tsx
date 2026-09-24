import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { apiClient, requestWithFallback } from '../services/apiClient';
import { AmbulanceHeader } from '../features/ambulance/components/AmbulanceHeader';
import type { NodeConnection } from '../features/ambulance/components/AmbulanceHeader';
import { EmergencyStatus } from '../features/ambulance/components/EmergencyStatus';
import { NextTurnCard } from '../features/ambulance/components/NextTurnCard';
import { RouteSummary } from '../features/ambulance/components/RouteSummary';
import { SignalAwareness } from '../features/ambulance/components/SignalAwareness';
import { VoiceGuidance } from '../features/ambulance/components/VoiceGuidance';
import {
  demoCityData,
  findRoute,
  formatSimulationTime,
  generateVoiceGuidance,
  getNextTurn,
  getRoutePosition,
  getUpcomingSignals,
} from '../features/ambulance/ambulanceData';
import { useJourney } from '../features/ambulance/hooks/useJourney';
import type { CitySource } from '../features/ambulance/types';
import type { CityData } from '../services/apiClient';

const NavigationMap = lazy(() => import('../features/ambulance/components/NavigationMap').then((module) => ({ default: module.NavigationMap })));

export function AmbulanceDashboardPage() {
  const [city, setCity] = useState<CityData>(demoCityData);
  const [citySource, setCitySource] = useState<CitySource>('demo-fallback');
  const [connection, setConnection] = useState<NodeConnection>('checking');
  const [isLoading, setIsLoading] = useState(true);
  const [requestedDestinationId, setRequestedDestinationId] = useState('HOSP-2');
  const [pendingDispatches, setPendingDispatches] = useState(0);
  const [actionNotice, setActionNotice] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    async function loadDashboard() {
      const [healthResult, cityResult, emergenciesResult] = await Promise.allSettled([
        apiClient.getNodeHealth(controller.signal),
        requestWithFallback(() => apiClient.getCity(controller.signal), demoCityData),
        apiClient.getEmergencies(controller.signal),
      ]);
      if (controller.signal.aborted) return;
      setConnection(healthResult.status === 'fulfilled' ? 'online' : 'offline');
      if (cityResult.status === 'fulfilled') {
        setCity(cityResult.value.data);
        setCitySource(cityResult.value.source);
      } else {
        setCity(demoCityData);
        setCitySource('demo-fallback');
      }
      if (emergenciesResult.status === 'fulfilled') setPendingDispatches(emergenciesResult.value.emergencies.length);
      setIsLoading(false);
    }
    void loadDashboard();
    return () => controller.abort();
  }, []);

  const base = city.bases[0];
  const destinationId = city.hospitals.some((hospital) => hospital.id === requestedDestinationId)
    ? requestedDestinationId
    : city.hospitals[0]?.id ?? '';
  const destination = city.hospitals.find((hospital) => hospital.id === destinationId);
  const route = useMemo(() => base && destination ? findRoute(city, base.nodeId, destination.nodeId) : null, [base, city, destination]);
  const { journey, start, pause, reset } = useJourney(route);
  const ambulancePosition = route ? getRoutePosition(city, route, journey.distanceTravelledMeters) : null;
  const baseNode = base ? city.nodes.find((node) => node.id === base.nodeId) : undefined;
  const destinationNode = destination ? city.nodes.find((node) => node.id === destination.nodeId) : undefined;
  const destinationName = destination?.name.replace(' (demo)', '') ?? 'Hospital';
  const currentLocation = journey.status === 'ready' ? (base?.name.replace(' (demo)', '') ?? 'Ambulance base')
    : journey.status === 'completed' ? destinationName
      : ambulancePosition?.currentRoadName ?? 'On route';
  const turn = route ? getNextTurn(city, route, journey.distanceTravelledMeters) : null;
  const instruction = turn ? generateVoiceGuidance(turn, destinationName) : 'Select a connected hospital to see route guidance.';
  const messageKey = turn ? `${turn.segmentIndex}:${turn.direction}:${turn.roadName}` : 'no-route';
  const upcomingSignals = route ? getUpcomingSignals(city, route, journey.distanceTravelledMeters) : [];

  function startJourney() {
    if (!route || journey.status === 'completed') return;
    setActionNotice('');
    if (journey.status === 'ready' && base && destination) {
      void apiClient.createEmergency({ ambulanceId: 'AMB-07', baseNodeId: base.nodeId, destinationNodeId: destination.nodeId })
        .then(() => {
          setPendingDispatches((count) => count + 1);
          setActionNotice('Mock emergency record created. Vehicle movement remains simulated in this browser.');
        })
        .catch(() => setActionNotice('The route started locally. The Node API could not record this demo dispatch.'));
    }
    start();
  }

  async function resetJourney() {
    reset();
    setActionNotice('Local journey reset.');
    try {
      await apiClient.resetSimulation();
      setPendingDispatches(0);
      setActionNotice('Journey and mock API state reset.');
    } catch {
      setActionNotice('Local journey reset. The Node API was unavailable, so its mock records may remain.');
    }
  }

  return <section className="ambulance-page">
    <div className="page-heading dashboard-title-row">
      <div><span className="eyebrow">Emergency mobility · Phase 2</span><h1>Ambulance Driver Dashboard</h1><p>One clear route, upcoming signals, and a replayable demo journey.</p></div>
      <span className="outline-label">SIMULATED JOURNEY</span>
    </div>

    <AmbulanceHeader connection={connection} journeyStatus={journey.status} source={citySource} simulationTime={formatSimulationTime(journey.elapsedSeconds)} />

    {isLoading && <p className="load-message" role="status">Connecting to the Node API. The shared demo graph is ready meanwhile.</p>}

    <section className="journey-toolbar panel" aria-label="Journey setup and controls">
      <div className="destination-control">
        <label htmlFor="hospital-destination">Destination hospital</label>
        <select id="hospital-destination" value={destinationId} onChange={(event) => setRequestedDestinationId(event.target.value)} disabled={journey.status === 'active' || journey.status === 'paused'}>
          {city.hospitals.map((hospital) => <option value={hospital.id} key={hospital.id}>{hospital.name.replace(' (demo)', '')}</option>)}
        </select>
      </div>
      <div className="journey-action-group">
        <span className="journey-mode-label"><i aria-hidden="true" />Deterministic demo route</span>
        <div className="journey-buttons">
          {journey.status === 'active'
            ? <button className="button button-secondary" type="button" onClick={pause} aria-label="Pause ambulance journey">Pause journey</button>
            : <button className="button button-primary" type="button" onClick={() => void startJourney()} disabled={!route || journey.status === 'completed'} aria-label={journey.status === 'paused' ? 'Resume ambulance journey' : 'Start ambulance journey'}>{journey.status === 'paused' ? 'Resume journey' : 'Start journey'}</button>}
          <button className="button button-secondary" type="button" onClick={() => void resetJourney()} aria-label="Reset ambulance journey and demo API state">Reset journey</button>
        </div>
      </div>
    </section>

    {actionNotice && <p className="action-notice" role="status" aria-live="polite">{actionNotice}</p>}

    <div className="ambulance-grid">
      <div className="ambulance-primary-column">
        {route ? <Suspense fallback={<div className="map-loading panel" role="status">Loading the navigation map…</div>}><NavigationMap city={city} route={route} ambulance={ambulancePosition} destinationName={destinationName} /></Suspense>
          : <section className="panel map-unavailable" aria-label="Navigation map unavailable"><span className="eyebrow">Navigation map</span><h2>Route unavailable</h2><p>The shared graph does not contain a connected path for this destination.</p></section>}
        <RouteSummary route={route} journey={journey} baseName={base?.name.replace(' (demo)', '') ?? 'Ambulance base unavailable'} currentLocation={currentLocation} destinationName={destinationName} />
      </div>
      <aside className="ambulance-side-column" aria-label="Route guidance and emergency information">
        <EmergencyStatus journeyStatus={journey.status} pendingDispatches={pendingDispatches} />
        <NextTurnCard turn={turn} instruction={instruction} />
        <SignalAwareness signals={upcomingSignals} />
        <VoiceGuidance message={instruction} messageKey={messageKey} />
      </aside>
    </div>

    {(!baseNode || !destinationNode || !route) && <p className="route-error" role="alert">A route could not be calculated for this destination. Check the selected city nodes and road connections.</p>}
    <p className="demo-disclaimer">Bengaluru-inspired hardcoded graph · mock signal awareness · no real emergency dispatch, GPS tracking, or traffic-signal control.</p>
  </section>;
}
