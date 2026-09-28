import { formatSimulationTime } from '../../ambulance/ambulanceData';
import type { ApiConnection } from '../hooks/useSimulation';
import type { SimulationState } from '../simulationTypes';
export function SimulationHeader({ state, connection }: { state: SimulationState; connection: ApiConnection }) {
  return <header className="page-heading"><div><span className="eyebrow">THE SCENARIO LAB</span><h1>Every second, simulated.</h1><p>Explore the journey. Change the conditions. Find a clear path.</p></div><div className="page-heading-meta"><span className={`connection ${connection}`}><i />{connection === 'online' ? 'Services connected' : connection === 'checking' ? 'Connecting…' : 'Local simulation'}</span><span className="sim-clock">{formatSimulationTime(state.simulationTimeSeconds)} <small>SIM TIME</small></span></div></header>;
}
