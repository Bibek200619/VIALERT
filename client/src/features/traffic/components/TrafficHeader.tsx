import { Link } from 'react-router';
import type { OperationsConnection } from '../hooks/useTrafficOperations';
import type { OperationsMetricsData } from '../trafficTypes';

export function TrafficHeader({ connection, metrics, lastUpdateAt }: { connection: OperationsConnection; metrics: OperationsMetricsData; lastUpdateAt: number }) {
  return <header className="traffic-header panel">
    <div><span className="eyebrow">VIALERT · forecast-enabled city command</span><h1>Traffic Operations Center</h1><p>Bengaluru · simulated fleet, corridors, and future traffic risk</p></div>
    <div className="traffic-header-right">
      <div className="traffic-head-stats"><span><strong>{metrics.activeVehicles}</strong> active vehicles</span><span><strong>{metrics.criticalAlerts}</strong> critical alerts</span><span><strong>{metrics.emergencyRoutes}</strong> emergency routes</span></div>
      <div className="traffic-head-status"><span className={`api-connection ${connection}`}><i aria-hidden="true" />{connection === 'online' ? 'Node API connected' : connection === 'checking' ? 'Connecting…' : connection === 'degraded' ? 'Partial API · demo data' : 'Node API offline · local demo'}</span><span>Updated {new Date(lastUpdateAt).toLocaleTimeString()}</span><span className="demo-chip">SIMULATED CONTROL</span></div>
      <nav className="traffic-header-links" aria-label="Other workspaces"><Link to="/ambulance">Ambulance dashboard ↗</Link><Link to="/simulation">Simulation dashboard ↗</Link></nav>
    </div>
  </header>;
}
