import type { OperationsConnection } from '../hooks/useTrafficOperations';
import type { OperationsMetricsData } from '../trafficTypes';

export function TrafficHeader({ connection, metrics, lastUpdateAt }: { connection: OperationsConnection; metrics: OperationsMetricsData; lastUpdateAt: number }) {
  return <header className="traffic-header" aria-labelledby="traffic-page-title">
    <div className="traffic-breadcrumb">Traffic control <span>/</span> Live operations</div>
    <div className="traffic-header-main"><div><h1 id="traffic-page-title">Traffic Operations</h1><p>Monitor emergency vehicles, corridors, and signal conditions across Bengaluru demo routes.</p></div><div className="traffic-header-meta"><span className="traffic-header-count">{metrics.activeAmbulances} active ambulance{metrics.activeAmbulances === 1 ? '' : 's'}</span><span className={`traffic-connection ${connection}`}><i aria-hidden="true" />{connection === 'online' ? 'Connected' : connection === 'checking' ? 'Connecting' : connection === 'degraded' ? 'Degraded' : 'Offline demo'}</span><span className="traffic-updated">Updated {new Date(lastUpdateAt).toLocaleTimeString()}</span><span className="traffic-demo-badge">SIMULATION / DEMO CONTROL</span></div></div>
  </header>;
}
