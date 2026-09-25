import type { OperationsAlert, AlertSeverityFilter, AlertTypeFilter } from '../trafficTypes';

export function AlertPanel({ alerts, severity, type, onSeverity, onType, onAcknowledge, onVehicle, onLocation }: {
  alerts: OperationsAlert[]; severity: AlertSeverityFilter; type: AlertTypeFilter;
  onSeverity: (value: AlertSeverityFilter) => void; onType: (value: AlertTypeFilter) => void;
  onAcknowledge: (alert: OperationsAlert) => void; onVehicle: (id: string) => void; onLocation: (id: string) => void;
}) {
  return <section className="panel traffic-alert-panel" aria-labelledby="traffic-alert-title">
    <div className="traffic-panel-heading"><span className="eyebrow">Operator inbox</span><h2 id="traffic-alert-title">Alerts <span>{alerts.filter((alert) => !alert.acknowledged).length} open</span></h2></div>
    <div className="traffic-filter-row"><label>Severity<select value={severity} onChange={(event) => onSeverity(event.target.value as AlertSeverityFilter)}><option value="all">All severities</option><option value="critical">Critical</option><option value="warning">Warning</option><option value="info">Info</option></select></label><label>Type<select value={type} onChange={(event) => onType(event.target.value as AlertTypeFilter)}><option value="all">All types</option>{['ambulance', 'signal', 'incident', 'route', 'system'].map((value) => <option key={value} value={value}>{value}</option>)}</select></label></div>
    <div className="traffic-scroll-list" aria-live="polite">{alerts.length === 0 ? <p className="traffic-empty">No alerts match these filters.</p> : alerts.map((alert) => <article className={`traffic-alert-item ${alert.severity}${alert.acknowledged ? ' acknowledged' : ''}`} key={alert.id}>
      <div className="traffic-alert-top"><span className={`traffic-severity ${alert.severity}`}>{alert.severity}</span><time dateTime={new Date(alert.createdAt).toISOString()}>{new Date(alert.createdAt).toLocaleTimeString()}</time></div>
      <h3>{alert.title}</h3><p>{alert.message}</p><div className="traffic-alert-actions">{alert.vehicleId && <button type="button" onClick={() => onVehicle(alert.vehicleId!)}>View {alert.vehicleId}</button>}{alert.nodeId && <button type="button" onClick={() => onLocation(alert.nodeId!)}>Focus location</button>}<button type="button" disabled={alert.acknowledged} onClick={() => onAcknowledge(alert)}>{alert.acknowledged ? 'Acknowledged' : 'Acknowledge'}</button></div>
    </article>)}</div>
  </section>;
}
