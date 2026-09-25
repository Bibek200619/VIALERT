import type { OperationsMetricsData } from '../trafficTypes';

export function OperationsMetrics({ metrics }: { metrics: OperationsMetricsData }) {
  const items = [
    ['Active ambulances', metrics.activeAmbulances, 'blue'], ['Emergency routes', metrics.emergencyRoutes, 'green'],
    ['Priority signals', metrics.signalsInPriorityMode, 'amber'], ['Critical alerts', metrics.criticalAlerts, 'red'],
  ] as const;
  return <section className="traffic-metrics-panel" aria-labelledby="traffic-metrics-title"><h2 id="traffic-metrics-title" className="sr-only">Operations summary</h2><div className="traffic-metrics-grid">{items.map(([label, value, tone]) => <div key={label} className={`traffic-metric ${tone}`}><span>{label}</span><strong>{value}</strong></div>)}</div></section>;
}
