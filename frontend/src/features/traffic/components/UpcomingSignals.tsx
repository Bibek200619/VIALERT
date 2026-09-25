import type { CityData, Signal } from '../../../services/apiClient';
import { formatDistance } from '../../ambulance/ambulanceData';
import type { OperationsVehicle } from '../trafficTypes';
import { locationName } from '../trafficUtils';

function distanceToSignal(city: CityData, vehicle: OperationsVehicle, signal: Signal) {
  const currentIndex = vehicle.routeNodeIds.indexOf(vehicle.currentNodeId);
  const signalIndex = vehicle.routeNodeIds.indexOf(signal.nodeId);
  if (currentIndex < 0 || signalIndex <= currentIndex) return null;
  return vehicle.routeRoadIds.slice(currentIndex, signalIndex).reduce((total, roadId) => total + (city.roads.find((road) => road.id === roadId)?.distanceMeters ?? 0), 0);
}

export function UpcomingSignals({ city, vehicle, signals, selectedId, onSelect }: { city: CityData; vehicle: OperationsVehicle | null; signals: Signal[]; selectedId?: string; onSelect: (id: string) => void }) {
  const upcoming = vehicle ? signals.map((signal) => ({ signal, distance: distanceToSignal(city, vehicle, signal) })).filter((item): item is { signal: Signal; distance: number } => item.distance !== null).sort((a, b) => a.distance - b.distance).slice(0, 4) : [];
  return <section className="panel traffic-upcoming-signals" aria-labelledby="upcoming-signals-title">
    <div className="traffic-section-heading"><div><span className="eyebrow">Ahead on selected route</span><h2 id="upcoming-signals-title">Upcoming signals</h2></div><span className="traffic-count-label">{upcoming.length}</span></div>
    {upcoming.length === 0 ? <p className="traffic-empty">No monitored signals ahead on this route.</p> : <ul className="upcoming-signal-list">{upcoming.map(({ signal, distance }) => <li key={signal.id} className={selectedId === signal.id ? 'selected' : ''}>
      <button type="button" onClick={() => onSelect(signal.id)} aria-pressed={selectedId === signal.id}>
        <span className={`signal-light ${signal.state}`} aria-label={`Signal is ${signal.state}`}><i /><i /><i /></span>
        <span className="upcoming-signal-copy"><strong>{signal.id} · {locationName(city, signal.nodeId)}</strong><small>{formatDistance(distance)} ahead · {signal.mode === 'emergency' ? 'Priority active' : `Currently ${signal.state}`}</small></span>
        <span className={`signal-state-label ${signal.state}`}>{signal.state}</span>
      </button>
    </li>)}</ul>}
    <p className="traffic-panel-footnote">Select a signal to open its demo control panel.</p>
  </section>;
}
