import type { CityData, Signal } from '../../../services/apiClient';
import { formatDistance, formatDuration } from '../../ambulance/ambulanceData';
import type { OperationsVehicle } from '../trafficTypes';
import { locationName } from '../trafficUtils';

export function RouteSummary({ city, vehicle, signals }: { city: CityData; vehicle: OperationsVehicle | null; signals: Signal[] }) {
  const nextSignal = vehicle?.nextSignalId ? signals.find((signal) => signal.id === vehicle.nextSignalId) : null;
  const routeLabel = vehicle?.routeStatus === 'rerouted' ? 'Route recalculated' : vehicle?.routeStatus === 'impacted' ? 'Traffic impact on route' : vehicle?.routeStatus === 'unavailable' ? 'No safe route' : 'Clear response corridor';
  return <section className="panel traffic-route-summary" aria-labelledby="route-summary-title">
    <div className="traffic-section-heading"><div><span className="eyebrow">Live route</span><h2 id="route-summary-title">Route summary</h2></div><span className={`traffic-route-status ${vehicle?.routeStatus ?? 'clear'}`}>{routeLabel}</span></div>
    {!vehicle ? <p className="traffic-empty">Select an ambulance to inspect its active route.</p> : <>
      <div className="traffic-route-locations"><div><span>Current location</span><strong>{locationName(city, vehicle.currentNodeId)}</strong></div><span className="traffic-route-arrow" aria-hidden="true">→</span><div><span>Destination</span><strong>{locationName(city, vehicle.destinationNodeId)}</strong></div></div>
      <dl className="traffic-route-metrics"><div><dt>Distance left</dt><dd>{formatDistance(vehicle.distanceRemainingMeters)}</dd></div><div><dt>ETA</dt><dd>{formatDuration(vehicle.etaSeconds)}</dd></div><div><dt>Speed</dt><dd>{vehicle.speedKph} km/h</dd></div><div><dt>Next signal</dt><dd>{nextSignal ? locationName(city, nextSignal.nodeId) : 'None ahead'}</dd></div></dl>
      {vehicle.routeMessage && <p className="traffic-route-note">{vehicle.routeMessage}</p>}
    </>}
  </section>;
}
