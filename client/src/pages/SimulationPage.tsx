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

const SimulationMap = lazy(() => import('../features/simulation/components/SimulationMap').then((module) => ({ default: module.SimulationMap })));

export function SimulationPage() {
  const simulation = useSimulation();
  const { city, state } = simulation;
  const [cameraMode, setCameraMode] = useState<CameraMode>('map');
  const templates = useMemo(() => getScenarioTemplates(city), [city]);
  const effectiveCity = useMemo(() => applyScenarioEffects(city, state.scenarios).city, [city, state.scenarios]);
  const currentNode = city.nodes.find((node) => node.id === state.currentNodeId);
  const nextRoad = effectiveCity.roads.find((road) => road.id === state.routeRoadIds[0]);
  const totalDistance = state.distanceTravelledMeters + state.distanceRemainingMeters;
  const progress = totalDistance > 0 ? Math.min(100, Math.round(state.distanceTravelledMeters / totalDistance * 100)) : 0;
  const statusLabel = state.routeStatus === 'clear' ? 'Clear corridor'
    : state.routeStatus === 'impacted' ? 'Traffic impact'
      : state.routeStatus === 'rerouted' ? 'Rerouted' : 'No route';

  return <section className="simulation-page">
    <SimulationHeader state={state} connection={simulation.connection} onReset={simulation.reset} />
    {simulation.isLoading && <p className="load-message" role="status">Connecting to the Node API. The shared Bengaluru graph is ready meanwhile.</p>}
    {simulation.actionNotice && <p className="action-notice simulation-notice" role="status" aria-live="polite">{simulation.actionNotice}</p>}

    <div className="simulation-workspace-grid">
      <div className="simulation-primary-column">
        <div className="simulation-camera-row">
          <div><span className="eyebrow">Map presentation</span><strong>Choose a view</strong></div>
          <CameraModeSelector mode={cameraMode} onChange={setCameraMode} />
        </div>
        <Suspense fallback={<div className="map-loading panel" role="status">Loading the simulation map…</div>}>
          <SimulationMap city={effectiveCity} state={state} cameraMode={cameraMode} />
        </Suspense>
        <SimulationControls
          state={state}
          onStart={simulation.start}
          onPause={simulation.pause}
          onResume={simulation.resume}
          onReset={simulation.reset}
          onStep={simulation.step}
          onSetSpeed={simulation.setSpeed}
          onRestartScenario={simulation.restartScenario}
          onReturnDefaultRoute={simulation.returnToDefaultRoute}
        />
        <section className="panel simulation-route-panel" aria-labelledby="simulation-route-title">
          <div className="panel-heading-row"><div><span className="eyebrow">Route monitor · A* demo</span><h2 id="simulation-route-title">Active ambulance corridor</h2></div><span className={`route-status ${state.routeStatus}`}>{statusLabel}</span></div>
          <div className="simulation-route-locations">
            <div><span>Current position</span><strong>{currentNode?.name.replace(' (demo)', '') ?? 'Unknown graph node'}</strong></div>
            <span className="route-direction-arrow" aria-hidden="true">→</span>
            <div><span>Next segment</span><strong>{nextRoad?.name ?? (state.routeStatus === 'unavailable' ? 'Route unavailable' : 'Destination reached')}</strong></div>
            <span className="route-direction-arrow" aria-hidden="true">→</span>
            <div><span>Destination</span><strong>{city.hospitals.find((hospital) => hospital.id === state.vehicle.destinationId)?.name.replace(' (demo)', '') ?? 'Select a hospital'}</strong></div>
          </div>
          <div className="simulation-progress-track" role="progressbar" aria-label="Ambulance route progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}><span style={{ width: `${progress}%` }} /></div>
          <div className="simulation-metrics-grid">
            <div><span>Travelled</span><strong>{formatDistance(state.distanceTravelledMeters)}</strong></div>
            <div><span>Distance remaining</span><strong>{formatDistance(state.distanceRemainingMeters)}</strong></div>
            <div><span>Estimated route time</span><strong>{formatDuration(state.etaSeconds)}</strong></div>
            <div><span>Emergency priority</span><strong className={`priority-${state.vehicle.priority}`}>{state.vehicle.priority}</strong></div>
          </div>
          {state.routeStatus === 'unavailable' && <p className="route-error" role="alert">{state.routeMessage} Remove or deactivate a road-blocking scenario, or restore the default route.</p>}
        </section>
      </div>

      <aside className="simulation-sidebar" aria-label="Simulation configuration and event panels">
        <VehiclePanel city={city} vehicle={state.vehicle} routeNodeIds={state.routeNodeIds} disabled={state.status === 'running'} onApply={simulation.configureVehicle} />
        <ScenarioPanel
          city={city}
          templates={templates}
          state={state}
          onSelect={simulation.selectScenario}
          onActivate={simulation.activateScenario}
          onDeactivate={simulation.deactivateScenario}
          onRemove={simulation.removeScenario}
        />
        <EnvironmentPanel city={city} state={state} />
        <ScenarioVoiceAlerts state={state} />
        <EventTimeline events={state.events} />
      </aside>
    </div>
    <p className="demo-disclaimer">Deterministic, local simulation · hardcoded Bengaluru-inspired city graph · mock scenario effects · no real emergency dispatch, vehicle tracking, traffic signals, or prediction service integration.</p>
  </section>;
}
