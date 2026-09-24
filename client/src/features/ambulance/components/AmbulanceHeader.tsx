import type { JourneyStatus } from '../types';

export type NodeConnection = 'checking' | 'online' | 'offline';

interface AmbulanceHeaderProps {
  connection: NodeConnection;
  journeyStatus: JourneyStatus;
  source: 'service' | 'demo-fallback';
  simulationTime: string;
}

export function AmbulanceHeader({ connection, journeyStatus, source, simulationTime }: AmbulanceHeaderProps) {
  return <section className="ambulance-header" aria-label="Ambulance and service status">
    <div className="ambulance-identity">
      <span className="unit-icon" aria-hidden="true">A</span>
      <div><span className="eyebrow">Driver workspace · Bengaluru</span><h2>Ambulance 07 <span className="unit-active"><i aria-hidden="true" />Unit active</span></h2></div>
    </div>
    <div className="ambulance-header-status">
      <span className="demo-chip">DEMO MODE</span>
      <span className="sim-clock"><span className="eyebrow">SIM TIME</span><strong>{simulationTime}</strong></span>
      <span className={`api-connection ${connection}`} role="status" aria-live="polite">
        <i aria-hidden="true" />
        <span>{connection === 'checking' ? 'Checking Node API' : connection === 'online' ? 'Node API online' : 'Offline · demo data'}</span>
      </span>
    </div>
    {source === 'demo-fallback' && <p className="connection-note">The Node API is unavailable. The shared Bengaluru demo graph is active.</p>}
    {journeyStatus === 'completed' && <p className="connection-note completed-note">Demo journey complete. Reset to replay the route.</p>}
  </section>;
}
