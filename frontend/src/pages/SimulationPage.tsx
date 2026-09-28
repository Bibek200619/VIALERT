import { lazy, Suspense, useMemo, useState } from 'react';
import { formatDistance, formatDuration } from '../features/ambulance/ambulanceData';
import { CameraModeSelector } from '../features/simulation/components/CameraModeSelector';
import { EnvironmentPanel } from '../features/simulation/components/EnvironmentPanel';
import { EventTimeline } from '../features/simulation/components/EventTimeline';
import { ScenarioPanel } from '../features/simulation/components/ScenarioPanel';
import { ScenarioVoiceAlerts } from '../features/simulation/components/ScenarioVoiceAlerts';
import { SimulationControls } from '../features/simulation/components/SimulationControls';
import { SimulationHeader } from '../features/simulation/components/SimulationHeader';
import { VehiclePanel } from '../features/simulation/components/VehiclePanel';
import { useSimulation } from '../features/simulation/hooks/useSimulation';
import { getScenarioTemplates } from '../features/simulation/simulationData';
import { applyScenarioEffects } from '../features/simulation/simulationEngine';
import type { CameraMode } from '../features/simulation/simulationTypes';
import { PredictionInsight } from '../features/prediction/PredictionPanel';
import { usePredictions } from '../features/prediction/usePredictions';
const SimulationMap = lazy(() => import('../features/simulation/components/SimulationMap').then((module) => ({ default: module.SimulationMap })));
type InspectorTab = 'Vehicle' | 'Conditions' | 'Forecast' | 'Timeline';

export function SimulationPage() {
  const simulation = useSimulation();
  const { city, state } = simulation;
  const [cameraMode, setCameraMode] = useState<CameraMode>('third-person');
  const [tab, setTab] = useState<InspectorTab>('Vehicle');
  const templates = useMemo(() => getScenarioTemplates(city), [city]);
  const scenarios = [...state.scenarios, ...state.externalScenarios];
  const effectiveCity = useMemo(() => applyScenarioEffects(city, scenarios).city, [city, state.scenarios, state.externalScenarios]);
  const activeConditions = scenarios.filter((scenario) => scenario.active);
  const prediction = usePredictions(effectiveCity, activeConditions);
  const currentNode = city.nodes.find((node) => node.id === state.currentNodeId);
  const nextRoad = effectiveCity.roads.find((road) => road.id === state.routeRoadIds[0]);
  const destination = city.hospitals.find((hospital) => hospital.id === state.vehicle.destinationId);
  const totalDistance = state.distanceTravelledMeters + state.distanceRemainingMeters;
  const progress = totalDistance > 0 ? Math.min(100, Math.round(state.distanceTravelledMeters / totalDistance * 100)) : state.status === 'completed' ? 100 : 0;
  const statusLabel = state.routeStatus === 'clear' ? 'Clear corridor' : state.routeStatus === 'impacted' ? 'Traffic impact' : state.routeStatus === 'rerouted' ? 'Rerouted' : 'No route';
  const tabs: InspectorTab[] = ['Vehicle', 'Conditions', 'Forecast', 'Timeline'];

  return <section className="simulation-page">
    <SimulationHeader state={state} connection={simulation.connection} />
    {(simulation.isLoading || simulation.actionNotice) && <p className="action-notice simulation-notice" role="status" aria-live="polite">{simulation.actionNotice || 'Connecting to the operations API. Your local city map is ready.'}</p>}
    <div className="simulation-workspace-grid">
      <main className="simulation-primary-column">
        <section className="simulation-stage panel" aria-label="Ambulance simulation viewport">
          <div className="simulation-camera-row">
            <div className="stage-vehicle"><span className="stage-live-dot" /><div><strong>{state.vehicle.vehicleNumber}</strong><span>{currentNode?.name.replace(' (demo)', '') ?? 'On route'} → {destination?.name.replace(' (demo)', '') ?? 'Hospital'}</span></div></div>
            <CameraModeSelector mode={cameraMode} onChange={setCameraMode} />
          </div>
          <Suspense fallback={<div className="map-loading" role="status">Preparing the city scene…</div>}><SimulationMap city={effectiveCity} state={state} cameraMode={cameraMode} /></Suspense>
        </section>
        <SimulationControls state={state} onStart={simulation.start} onPause={simulation.pause} onResume={simulation.resume} onReset={simulation.reset} onStep={simulation.step} onSetSpeed={simulation.setSpeed} onRestartScenario={simulation.restartScenario} onReturnDefaultRoute={simulation.returnToDefaultRoute} />
        <section className="trip-strip" aria-label="Route progress and trip information">
          <div className="trip-strip-heading"><span className={`route-status ${state.routeStatus}`}>{statusLabel}</span><span>{state.vehicle.ambulanceId} · {state.vehicle.priority} priority</span></div>
          <div className="simulation-route-locations"><div><span>Current position</span><strong>{currentNode?.name.replace(' (demo)', '') ?? 'Unknown junction'}</strong></div><span className="route-direction-arrow" aria-hidden="true">→</span><div><span>Next road</span><strong>{nextRoad?.name ?? (state.status === 'completed' ? 'Hospital arrival' : 'Calculating route')}</strong></div><span className="route-direction-arrow" aria-hidden="true">→</span><div><span>Destination</span><strong>{destination?.name.replace(' (demo)', '') ?? 'Select a hospital'}</strong></div></div>
          <div className="simulation-progress-track" role="progressbar" aria-label="Ambulance route progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}><span style={{ width: `${progress}%` }} /></div>
          <div className="simulation-metrics-grid"><div><span>Remaining</span><strong>{formatDistance(state.distanceRemainingMeters)}</strong></div><div><span>Arrival estimate</span><strong>{formatDuration(state.etaSeconds)}</strong></div><div><span>Current speed</span><strong>{Math.round(state.currentSpeedKph)} <small>km/h</small></strong></div><div><span>Traffic light</span><strong>{state.signalWaitSeconds > 0 ? `Wait ${Math.ceil(state.signalWaitSeconds)}s` : 'Clear ahead'}</strong></div></div>
          <p className={`route-impact-message ${state.routeStatus}`} role={state.routeStatus === 'unavailable' ? 'alert' : 'status'} aria-live="polite">{state.routeMessage}</p>
        </section>
        {state.routeStatus === 'unavailable' && <p className="route-error" role="alert">No clear route is available. Change the conditions or reset the journey.</p>}
        <p className="demo-disclaimer">A fictional Bengaluru road network, simulated vehicle and signal states, and a rules based traffic forecast. No real dispatch or traffic control.</p>
      </main>
      <aside className="simulation-sidebar" aria-label="Journey inspector">
        <div className="inspector-heading"><div><span className="eyebrow">JOURNEY INSPECTOR</span><strong>Mission details</strong></div><span className="inspector-count">{activeConditions.length} active</span></div>
        <div className="inspector-tabs" role="tablist" aria-label="Mission details"><div>{tabs.map((item) => <button key={item} role="tab" type="button" aria-selected={tab === item} className={tab === item ? 'selected' : ''} onClick={() => setTab(item)}>{item}</button>)}</div></div>
        <div className="inspector-body" role="tabpanel">
          {tab === 'Vehicle' && <><VehiclePanel city={city} vehicle={state.vehicle} routeNodeIds={state.routeNodeIds} disabled={state.status === 'running'} onApply={simulation.configureVehicle} /><section className="inspector-note"><span className="eyebrow">ROUTE CHANGE</span><p>{state.previousRouteNodeIds.length > 1 ? 'Dashed lines mark the previous route; the green line marks the active route.' : 'Activate a road incident to see the route planner respond.'}</p></section></>}
          {tab === 'Conditions' && <ScenarioPanel city={city} templates={templates} state={state} onSelect={simulation.selectScenario} onActivate={simulation.activateScenario} onDeactivate={simulation.deactivateScenario} onRemove={simulation.removeScenario} />}
          {tab === 'Forecast' && <><EnvironmentPanel city={effectiveCity} state={state} /><PredictionInsight predictions={prediction.predictions} source={prediction.source} routeRoadIds={state.routeRoadIds} highlightedRoadIds={activeConditions.flatMap((condition) => condition.roadId ? [condition.roadId] : [])} routeMessage="Forecasts are indicative and can be applied to route choices." /></>}
          {tab === 'Timeline' && <><ScenarioVoiceAlerts state={state} /><EventTimeline events={state.events} /></>}
        </div>
      </aside>
    </div>
  </section>;
}
