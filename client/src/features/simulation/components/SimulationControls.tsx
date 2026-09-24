import type { SimulationSpeed, SimulationState } from '../simulationTypes';

interface SimulationControlsProps {
  state: SimulationState;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onReset: () => void;
  onStep: () => void;
  onSetSpeed: (speed: SimulationSpeed) => void;
  onRestartScenario: () => void;
  onReturnDefaultRoute: () => void;
}

const speeds: SimulationSpeed[] = [1, 2, 5];

export function SimulationControls({
  state,
  onStart,
  onPause,
  onResume,
  onReset,
  onStep,
  onSetSpeed,
  onRestartScenario,
  onReturnDefaultRoute,
}: SimulationControlsProps) {
  const hasRoute = state.routeStatus !== 'unavailable' && state.routeRoadIds.length > 0;
  return <section className="panel simulation-controls" aria-label="Simulation playback controls">
    <div className="simulation-playback-row">
      <div className="journey-buttons">
        {state.status === 'running'
          ? <button className="button button-secondary" type="button" onClick={onPause} aria-label="Pause the ambulance simulation">Pause</button>
          : state.status === 'paused'
            ? <button className="button button-primary" type="button" onClick={onResume} disabled={!hasRoute} aria-label="Resume the ambulance simulation">Resume</button>
            : <button className="button button-primary" type="button" onClick={onStart} disabled={!hasRoute || state.status === 'completed'} aria-label="Start the ambulance simulation">Start simulation</button>}
        <button className="button button-secondary" type="button" onClick={onStep} disabled={!hasRoute || state.status === 'running' || state.status === 'completed'} aria-label="Advance one simulation tick">Step 1 tick</button>
      </div>
      <div className="speed-selector" role="group" aria-label="Simulation speed">
        <span>Speed</span>
        {speeds.map((speed) => <button key={speed} type="button" className={state.speedMultiplier === speed ? 'selected' : ''} onClick={() => onSetSpeed(speed)} aria-pressed={state.speedMultiplier === speed} aria-label={`Set simulation speed to ${speed} times`}>{speed}×</button>)}
      </div>
    </div>
    <div className="simulation-utility-actions">
      <button className="text-button" type="button" onClick={onRestartScenario} disabled={state.status === 'running'}>Restart current scenario</button>
      <button className="text-button" type="button" onClick={onReturnDefaultRoute} disabled={state.status === 'running'}>Return to default route</button>
      <button className="text-button" type="button" onClick={onReset}>Reset all</button>
    </div>
    <p className="simulation-tick-hint">One deterministic graph step per simulated tick · speed advances up to {state.speedMultiplier} junction{state.speedMultiplier === 1 ? '' : 's'} per second.</p>
  </section>;
}
