import { formatDistance, formatDuration } from '../../ambulance/ambulanceData';
import type { CityData } from '../../../services/apiClient';
import type { OperationsAlert, OperationsVehicle } from '../trafficTypes';
import { locationName } from '../trafficUtils';

export function VehicleDetailPanel({ city, vehicle, alerts }: { city: CityData; vehicle: OperationsVehicle | null; alerts: OperationsAlert[] }) {
  return <section className="panel traffic-detail-panel" aria-labelledby="traffic-detail-title">
    <div className="traffic-panel-heading"><span className="eyebrow">Selected unit</span><h2 id="traffic-detail-title">Vehicle profile</h2></div>
    {!vehicle ? <p className="traffic-empty">No vehicle selected. Choose a unit from Fleet watch.</p> : <>
      {vehicle.type === 'ambulance' && <div className="traffic-emergency-banner">EMERGENCY PRIORITY · {vehicle.id}</div>}
      <div className="traffic-detail-identity"><span className={`traffic-vehicle-icon ${vehicle.type}`}>{vehicle.type === 'ambulance' ? '✚' : '▣'}</span><div><strong>{vehicle.vehicleNumber}</strong><small>{vehicle.type.toUpperCase()} · {vehicle.status} · {vehicle.priority}</small></div></div>
      <div className="traffic-origin-destination"><div><span>FROM</span><strong>{locationName(city, vehicle.originNodeId)}</strong></div><i aria-hidden="true">↓</i><div><span>TO</span><strong>{locationName(city, vehicle.destinationNodeId)}</strong></div></div>
      {vehicle.type === 'ambulance' && <p className={`route-impact-message traffic-route-impact ${vehicle.routeStatus}`} role="status"><strong>{vehicle.routeStatus === 'rerouted' ? 'REROUTED' : vehicle.routeStatus === 'unavailable' ? 'NO ROUTE' : vehicle.routeStatus === 'impacted' ? 'TRAFFIC IMPACT' : 'CLEAR CORRIDOR'}</strong> · {vehicle.routeMessage}</p>}
      <dl className="traffic-detail-grid">
        <div><dt>Current location</dt><dd>{locationName(city, vehicle.currentNodeId)}</dd></div>
        <div><dt>Current road</dt><dd>{vehicle.currentRoad}</dd></div>
        <div><dt>Next junction</dt><dd>{vehicle.nextJunction}</dd></div>
        <div><dt>Next signal</dt><dd>{vehicle.nextSignalId ?? 'None ahead'}</dd></div>
        <div><dt>Route distance</dt><dd>{formatDistance(vehicle.routeDistanceMeters)}</dd></div>
        <div><dt>Remaining</dt><dd>{formatDistance(vehicle.distanceRemainingMeters)}</dd></div>
        <div><dt>ETA</dt><dd>{formatDuration(vehicle.etaSeconds)}</dd></div>
        <div><dt>Current speed</dt><dd>{vehicle.speedKph} km/h <small>demo</small></dd></div>
      </dl>
      <div className="traffic-detail-foot"><span>{vehicle.emergencyType} · {vehicle.crew}</span><strong>{alerts.filter((alert) => !alert.acknowledged && alert.vehicleId === vehicle.id).length} open alerts</strong><small>Source: {vehicle.source === 'simulation' ? 'Phase 3 same-browser simulation' : 'shared fixture'}</small></div>
    </>}
  </section>;
}
