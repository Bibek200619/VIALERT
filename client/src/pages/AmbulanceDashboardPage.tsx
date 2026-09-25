import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
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
import type { CitySource, JourneyState } from '../features/ambulance/types';
import type { CityData } from '../services/apiClient';
import { explainRouteChange } from '../features/routing/dynamicRouting';
import { useRouteConditions } from '../features/routing/useRouteConditions';
import { PredictionInsight } from '../features/prediction/PredictionPanel';
import { combineCostMultipliers, explainForecastRouteEffect } from '../features/prediction/predictionModel';
import { usePredictions } from '../features/prediction/usePredictions';

const NavigationMap = lazy(() => import('../features/ambulance/components/NavigationMap').then((module) => ({ default: module.NavigationMap })));

export function AmbulanceDashboardPage() {
  const [city, setCity] = useState<CityData>(demoCityData);
  const [citySource, setCitySource] = useState<CitySource>('demo-fallback');
  const [connection, setConnection] = useState<NodeConnection>('checking');
  const [isLoading, setIsLoading] = useState(true);
  const [requestedDestinationId, setRequestedDestinationId] = useState('HOSP-2');
  const [pendingDispatches, setPendingDispatches] = useState(0);
  const [actionNotice, setActionNotice] = useState('');
  const conditions = useRouteConditions(city);
  const prediction = usePredictions(conditions.city, conditions.hazards);
  const combinedCosts = useMemo(() => combineCostMultipliers(conditions.roadCostMultipliers, prediction.costMultipliers), [conditions.roadCostMultipliers, prediction.costMultipliers]);

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

  const base = conditions.baselineCity.bases[0];
  const simulationState = conditions.snapshot?.state;
  const followingSimulation = Boolean(simulationState && (simulationState.status !== 'ready'
    || simulationState.scenarios.some((scenario) => scenario.active)
    || simulationState.externalScenarios?.some((scenario) => scenario.active)));
  const preferredDestinationId = followingSimulation ? simulationState?.vehicle.destinationId ?? requestedDestinationId : requestedDestinationId;
  const destinationId = city.hospitals.some((hospital) => hospital.id === preferredDestinationId)
    ? preferredDestinationId
    : city.hospitals[0]?.id ?? '';
  const destination = city.hospitals.find((hospital) => hospital.id === destinationId);
  const baselineRoute = useMemo(() => base && destination ? findRoute(conditions.baselineCity, base.nodeId, destination.nodeId) : null, [base, conditions.baselineCity, destination]);
  const incidentRoute = useMemo(() => base && destination ? findRoute(conditions.city, base.nodeId, destination.nodeId, { roadCostMultipliers: conditions.roadCostMultipliers }) : null, [base, conditions.city, conditions.roadCostMultipliers, destination]);
  const localRoute = useMemo(() => base && destination ? findRoute(conditions.city, base.nodeId, destination.nodeId, { roadCostMultipliers: combinedCosts }) : null, [base, conditions.city, combinedCosts, destination]);
  const { journey: localJourney, start, pause, reset } = useJourney(localRoute);
  const route = useMemo(() => followingSimulation && simulationState && destination
    ? findRoute(conditions.city, simulationState.currentNodeId, destination.nodeId, { roadCostMultipliers: combinedCosts })
    : localRoute, [conditions.city, combinedCosts, destination, followingSimulation, localRoute, simulationState]);
  const routeWithoutForecast = followingSimulation && simulationState && destination
    ? findRoute(conditions.city, simulationState.currentNodeId, destination.nodeId, { roadCostMultipliers: conditions.roadCostMultipliers }) : incidentRoute;
  const forecastNote = explainForecastRouteEffect(conditions.city, routeWithoutForecast, route, prediction.predictions, prediction.settings.routingEnabled);
  const journey: JourneyState = followingSimulation && simulationState
    ? { status: simulationState.status === 'running' ? 'active' : simulationState.status === 'completed' ? 'completed' : simulationState.status === 'paused' ? 'paused' : 'ready', distanceTravelledMeters: 0, elapsedSeconds: 0 }
    : localJourney;
  const ambulancePosition = followingSimulation && simulationState
    ? (() => { const node = conditions.city.nodes.find((item) => item.id === simulationState.currentNodeId); return node ? { lat: node.lat, lng: node.lng, currentNodeId: node.id, currentRoadName: node.name, segmentIndex: 0 } : null; })()
    : route ? getRoutePosition(conditions.city, route, journey.distanceTravelledMeters) : null;
  const baseNode = base ? city.nodes.find((node) => node.id === base.nodeId) : undefined;
  const destinationNode = destination ? city.nodes.find((node) => node.id === destination.nodeId) : undefined;
  const destinationName = destination?.name.replace(' (demo)', '') ?? 'Hospital';
  const currentLocation = followingSimulation && simulationState ? conditions.city.nodes.find((node) => node.id === simulationState.currentNodeId)?.name.replace(' (demo)', '') ?? 'Graph junction'
    : journey.status === 'ready' ? (base?.name.replace(' (demo)', '') ?? 'Ambulance base')
    : journey.status === 'completed' ? destinationName
      : ambulancePosition?.currentRoadName ?? 'On route';
  const turn = route ? getNextTurn(conditions.city, route, journey.distanceTravelledMeters) : null;
  const instruction = turn ? generateVoiceGuidance(turn, destinationName) : 'Select a connected hospital to see route guidance.';
  const messageKey = turn ? `${turn.segmentIndex}:${turn.direction}:${turn.roadName}` : 'no-route';
  const upcomingSignals = route ? getUpcomingSignals(conditions.city, route, journey.distanceTravelledMeters) : [];
  const routeChanged = baselineRoute?.roadIds.join('|') !== localRoute?.roadIds.join('|');
  const forecastPathChanged = routeWithoutForecast?.roadIds.join('|') !== route?.roadIds.join('|');
  const hasActiveHazards = conditions.hazards.some((hazard) => hazard.active);
  const routeStatus = !route ? 'unavailable' : (followingSimulation ? forecastPathChanged && Boolean(forecastNote) : routeChanged) ? 'rerouted' : forecastNote ? 'impacted' : !hasActiveHazards && baselineRoute?.roadIds.join('|') === localRoute?.roadIds.join('|')
    ? 'clear' : followingSimulation && simulationState && simulationState.routeRoadIds.join('|') === route.roadIds.join('|')
      ? simulationState.routeStatus : conditions.hazards.some((hazard) => hazard.active && hazard.roadId && route.roadIds.includes(hazard.roadId)) ? 'impacted' : 'clear';
  const incidentMessage = followingSimulation && simulationState && simulationState.routeRoadIds.join('|') === route?.roadIds.join('|')
    ? simulationState.routeMessage
    : conditions.hazards.some((hazard) => hazard.active) || !route
      ? explainRouteChange({ city: conditions.baselineCity, destinationName, previous: baselineRoute, next: routeWithoutForecast, hazard: conditions.hazards.find((hazard) => hazard.active), blockedRoadIds: conditions.blockedRoadIds })
      : 'Default demo corridor ready.';
  const routeMessage = forecastNote ? incidentMessage === 'Default demo corridor ready.' ? forecastNote : `${incidentMessage} ${forecastNote}` : incidentMessage;
  const previousRouteNodeIds = followingSimulation ? simulationState?.previousRouteNodeIds ?? [] : forecastNote && forecastPathChanged ? routeWithoutForecast?.nodeIds ?? [] : routeChanged ? baselineRoute?.nodeIds ?? [] : [];

  function startJourney() {
    if (followingSimulation || !localRoute || localJourney.status === 'completed') return;
    setActionNotice('');
    if (localJourney.status === 'ready' && base && destination) {
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
    if (followingSimulation) return;
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
      <div><span className="eyebrow">Emergency mobility · simulated driver view</span><h1>Ambulance Driver Dashboard</h1><p>One clear route, upcoming signals, and a replayable demo journey.</p></div>
      <span className="outline-label">SIMULATED JOURNEY</span>
    </div>

    <AmbulanceHeader connection={connection} journeyStatus={journey.status} source={citySource} simulationTime={formatSimulationTime(followingSimulation ? simulationState?.simulationTimeSeconds ?? 0 : journey.elapsedSeconds)} />

    {isLoading && <p className="load-message" role="status">Connecting to the Node API. The shared demo graph is ready meanwhile.</p>}

    <section className="journey-toolbar panel" aria-label="Journey setup and controls">
      <div className="destination-control">
        <label htmlFor="hospital-destination">Destination hospital</label>
        <select id="hospital-destination" value={destinationId} onChange={(event) => setRequestedDestinationId(event.target.value)} disabled={followingSimulation || journey.status === 'active' || journey.status === 'paused'}>
          {city.hospitals.map((hospital) => <option value={hospital.id} key={hospital.id}>{hospital.name.replace(' (demo)', '')}</option>)}
        </select>
      </div>
      <div className="journey-action-group">
        <span className="journey-mode-label"><i aria-hidden="true" />{followingSimulation ? 'Following same-browser Simulation' : 'Deterministic demo route'}</span>
        <div className="journey-buttons">
          {followingSimulation ? <Link className="button button-primary" to="/simulation">Control in Simulation</Link>
            : localJourney.status === 'active'
              ? <button className="button button-secondary" type="button" onClick={pause} aria-label="Pause ambulance journey">Pause journey</button>
              : <button className="button button-primary" type="button" onClick={() => void startJourney()} disabled={!localRoute || localJourney.status === 'completed'} aria-label={localJourney.status === 'paused' ? 'Resume ambulance journey' : 'Start ambulance journey'}>{localJourney.status === 'paused' ? 'Resume journey' : 'Start journey'}</button>}
          <button className="button button-secondary" type="button" onClick={() => void resetJourney()} disabled={followingSimulation} aria-label="Reset ambulance journey and demo API state">Reset journey</button>
        </div>
      </div>
    </section>

    {actionNotice && <p className="action-notice" role="status" aria-live="polite">{actionNotice}</p>}

    <div className="ambulance-grid">
      <div className="ambulance-primary-column">
        <Suspense fallback={<div className="map-loading panel" role="status">Loading the navigation map…</div>}><NavigationMap city={conditions.city} route={route ?? { nodeIds: [], roadIds: [], totalDistanceMeters: 0, etaSeconds: 0 }} ambulance={ambulancePosition} destinationName={destinationName} previousRouteNodeIds={previousRouteNodeIds} /></Suspense>
        <RouteSummary route={route} journey={journey} baseName={base?.name.replace(' (demo)', '') ?? 'Ambulance base unavailable'} currentLocation={currentLocation} destinationName={destinationName} routeStatus={routeStatus} routeMessage={routeMessage} />
      </div>
      <aside className="ambulance-side-column" aria-label="Route guidance and emergency information">
        <EmergencyStatus journeyStatus={journey.status} pendingDispatches={pendingDispatches} />
        <NextTurnCard turn={turn} instruction={instruction} />
        <PredictionInsight predictions={prediction.predictions} source={prediction.source} routeRoadIds={route?.roadIds ?? []} routeMessage={forecastNote} />
        <SignalAwareness signals={upcomingSignals} />
        <VoiceGuidance message={instruction} messageKey={messageKey} />
      </aside>
    </div>

    {(!baseNode || !destinationNode || !route) && <p className="route-error" role="alert">{routeMessage}</p>}
    <p className="demo-disclaimer">Bengaluru-inspired hardcoded graph · mock signal awareness · no real emergency dispatch, GPS tracking, or traffic-signal control.</p>
  </section>;
}
