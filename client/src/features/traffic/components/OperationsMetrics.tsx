import { formatDuration } from '../../ambulance/ambulanceData';
import type { OperationsMetricsData } from '../trafficTypes';

export function OperationsMetrics({ metrics }: { metrics: OperationsMetricsData }) {
  const items = [
    ['Active vehicles', metrics.activeVehicles], ['Active ambulances', metrics.activeAmbulances],
    ['Critical alerts', metrics.criticalAlerts], ['Emergency routes', metrics.emergencyRoutes],
    ['Priority signals', metrics.signalsInPriorityMode], ['Average ETA', formatDuration(metrics.averageEtaSeconds)],
    ['Incidents today', metrics.incidentsToday], ['Routes protected', metrics.responseRoutesProtected],
  ] as const;
  return <section className="panel traffic-metrics-panel" aria-labelledby="traffic-metrics-title"><div className="traffic-panel-heading"><span className="eyebrow">Demo metrics</span><h2 id="traffic-metrics-title">Operations at a glance</h2></div><div className="traffic-metrics-grid">{items.map(([label, value]) => <div key={label}><span>{label}</span><strong>{value}</strong></div>)}</div></section>;
}
