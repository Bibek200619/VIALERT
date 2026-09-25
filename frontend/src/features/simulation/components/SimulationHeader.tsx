import { formatSimulationTime } from '../../ambulance/ambulanceData';
import type { ApiConnection } from '../hooks/useSimulation';
import type { SimulationState } from '../simulationTypes';

interface SimulationHeaderProps {
  state: SimulationState;
  connection: ApiConnection;
  onReset: () => void;
}

const statusLabels = {
  ready: 'Ready',
  running: 'Running',
  paused: 'Paused',
  completed: 'Completed',
} as const;

const connectionLabels: Record<ApiConnection, string> = {
  checking: 'Checking Node API',
  online: 'Node API connected',
  degraded: 'Node API limited · local demo active',
  offline: 'Node API offline · local demo active',
};

export function SimulationHeader({ state, connection, onReset }: SimulationHeaderProps) {
  return <>
    <div className="page-heading dashboard-title-row simulation-title-row">
      <div><span className="eyebrow">Emergency mobility · scenario lab</span><h1>Simulation Control Center</h1><p>Run a deterministic ambulance journey, introduce local scenarios, and replay the route.</p></div>
      <span className="outline-label">BENGALURU · DEMO CITY</span>
    </div>
    <section className="simulation-header panel" aria-label="Simulation status">
      <div className="simulation-brand-lockup">
        <span className="simulation-brand-mark" aria-hidden="true">V<span>+</span></span>
        <div><span className="eyebrow">VIALERT · SIMULATION</span><strong>Control center</strong></div>
      </div>
      <div className="simulation-header-status">
        <span className={`simulation-status status-${state.status}`}><i aria-hidden="true" />{statusLabels[state.status]}</span>
        <span className="demo-chip">DEMO MODE</span>
        <div className="sim-clock"><span className="eyebrow">Simulation time</span><strong>{formatSimulationTime(state.simulationTimeSeconds)}</strong></div>
        <span className={`api-connection ${connection === 'offline' ? 'offline' : connection === 'checking' ? 'checking' : ''}`}><i aria-hidden="true" />{connectionLabels[connection]}</span>
        <button className="button button-secondary simulation-header-reset" type="button" onClick={onReset} aria-label="Reset the simulation to the default route">Reset simulation</button>
      </div>
    </section>
  </>;
}
