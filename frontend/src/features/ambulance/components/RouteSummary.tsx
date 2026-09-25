import { formatDistance, formatDuration } from '../ambulanceData';
import type { JourneyState, RoutePlan } from '../types';
import type { RouteStatus } from '../../simulation/simulationTypes';

interface RouteSummaryProps {
  route: RoutePlan | null;
  journey: JourneyState;
  baseName: string;
  currentLocation: string;
  destinationName: string;
  routeStatus: RouteStatus;
  routeMessage: string;
}

export function RouteSummary({ route, journey, baseName, currentLocation, destinationName, routeStatus, routeMessage }: RouteSummaryProps) {
  const remainingMeters = route ? Math.max(0, route.totalDistanceMeters - journey.distanceTravelledMeters) : 0;
  const remainingSeconds = route ? Math.max(0, route.etaSeconds - journey.elapsedSeconds) : 0;
  const averageSpeed = route && route.etaSeconds > 0 ? (route.totalDistanceMeters / route.etaSeconds) * 3.6 : 0;
  const status = routeStatus === 'unavailable' ? 'No route' : routeStatus === 'rerouted' ? 'Rerouted' : routeStatus === 'impacted' ? 'Traffic impact' : journey.status === 'active' ? 'En route' : journey.status === 'paused' ? 'Paused' : journey.status === 'completed' ? 'Arrived' : 'Route preview';

  return <section className="panel route-summary" aria-labelledby="route-summary-title">
    <div className="panel-heading-row"><div><span className="eyebrow">Active route</span><h2 id="route-summary-title">Journey overview</h2></div><span className={`route-status ${journey.status}`}>{status}</span></div>
    {route ? <>
      <div className="route-locations">
        <div className="route-location"><span className="location-marker base-marker" aria-hidden="true" /><div><span>START · AMBULANCE BASE</span><strong>{baseName}</strong></div></div>
        <div className="route-location current-location"><span className="location-marker current-marker" aria-hidden="true" /><div><span>CURRENT LOCATION</span><strong>{currentLocation}</strong></div></div>
        <div className="route-location"><span className="location-marker hospital-marker" aria-hidden="true" /><div><span>DESTINATION · HOSPITAL</span><strong>{destinationName}</strong></div></div>
      </div>
      <div className="route-metrics">
        <div><span>Distance left</span><strong>{formatDistance(remainingMeters)}</strong></div>
        <div><span>Estimated arrival</span><strong>{formatDuration(remainingSeconds)}</strong></div>
        <div><span>Current speed</span><strong>{journey.status === 'active' ? `${Math.round(averageSpeed)} km/h` : '—'}<small>{journey.status === 'active' ? 'SIM' : 'PARKED'}</small></strong></div>
      </div>
      <div className="route-progress" aria-label={`Route progress ${Math.round(route.totalDistanceMeters === 0 ? 100 : (journey.distanceTravelledMeters / route.totalDistanceMeters) * 100)} percent`}>
        <span style={{ width: `${route.totalDistanceMeters === 0 ? 100 : Math.min(100, (journey.distanceTravelledMeters / route.totalDistanceMeters) * 100)}%` }} />
      </div>
      <div className="route-meta"><span>Route length <strong>{formatDistance(route.totalDistanceMeters)}</strong></span><span>Emergency priority <strong className="priority-label">P1 · Critical</strong></span></div>
      <p className={`route-impact-message ${routeStatus}`} role="status" aria-live="polite">{routeMessage}</p>
    </> : <div className="empty-route" role="status"><strong>No route available</strong><p>{routeMessage}</p></div>}
  </section>;
}
