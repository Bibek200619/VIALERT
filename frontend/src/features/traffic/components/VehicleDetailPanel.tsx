import { formatDistance, formatDuration } from '../../ambulance/ambulanceData';
import type { CityData, Signal } from '../../../services/apiClient';
import type { OperationsAlert, OperationsVehicle } from '../trafficTypes';
import { locationName } from '../trafficUtils';

export function VehicleDetailPanel({ city, vehicle, alerts, signals }: { city: CityData; vehicle: OperationsVehicle | null; alerts: OperationsAlert[]; signals: Signal[] }) {
  const routeSignals = vehicle ? signals.filter((signal) => vehicle.routeNodeIds.includes(signal.nodeId)) : [];
  const priorityActive = routeSignals.some((signal) => signal.mode === 'emergency');
  return <section className="panel traffic-detail-panel" aria-labelledby="traffic-detail-title">
    {!vehicle ? <p className="traffic-empty">No vehicle selected. Choose a unit from Active ambulances.</p> : <>
      <div className="traffic-detail-copy"><div><span className="eyebrow">Selected {vehicle.type}</span><h2 id="traffic-detail-title">{vehicle.vehicleNumber}</h2><p>{vehicle.type === 'ambulance' ? 'BLS Ambulance · 108 Emergency Service' : `${vehicle.type} · Demo fleet unit`} · {vehicle.crew}</p></div><span className={`traffic-status-pill ${vehicle.status}`}><i />{vehicle.status === 'active' ? 'On route' : vehicle.status}</span></div>
      <div className="traffic-detail-body"><div className="traffic-detail-journey"><div><span>Current location</span><strong>{locationName(city, vehicle.currentNodeId)}</strong><small>{vehicle.currentRoad}</small></div><span className="traffic-journey-arrow" aria-hidden="true">→</span><div><span>Destination</span><strong>{locationName(city, vehicle.destinationNodeId)}</strong><small>{vehicle.nextJunction}</small></div></div><div className="traffic-vehicle-visual" aria-label="Ambulance image placeholder"><span><b>+</b><i /><i /><i /></span><small>AMBULANCE</small></div></div>
      <dl className="traffic-detail-stats"><div><dt>Distance left</dt><dd>{formatDistance(vehicle.distanceRemainingMeters)}</dd></div><div><dt>ETA</dt><dd>{formatDuration(vehicle.etaSeconds)}</dd></div><div><dt>Current speed</dt><dd>{vehicle.speedKph} km/h</dd></div><div><dt>Next signal</dt><dd>{vehicle.nextSignalId ?? 'None ahead'}</dd></div><div><dt>Route status</dt><dd>{vehicle.routeStatus === 'clear' ? 'Clear corridor' : vehicle.routeStatus}</dd></div><div><dt>Emergency priority</dt><dd className={priorityActive ? 'active' : ''}>{priorityActive ? 'Active' : 'Standby'} <small>{priorityActive ? `${routeSignals.filter((signal) => signal.mode === 'emergency').length} signals` : 'demo'}</small></dd></div></dl>
      <div className="traffic-detail-foot"><span>{vehicle.emergencyType} · {vehicle.priority} priority</span><strong>{alerts.filter((alert) => !alert.acknowledged && alert.vehicleId === vehicle.id).length} open alerts</strong><small>Source: {vehicle.source === 'simulation' ? 'same-browser simulation' : 'shared demo fixture'}</small></div>
    </>}
  </section>;
}
