import type { CityData } from '../../../services/apiClient';
import type { OperationsVehicle, VehicleFilter } from '../trafficTypes';
import { vehicleFilterLabels } from '../trafficData';
import { locationName } from '../trafficUtils';
import { formatDuration } from '../../ambulance/ambulanceData';

export function VehicleList({ city, vehicles, selectedId, filter, onFilter, onSelect }: { city: CityData; vehicles: OperationsVehicle[]; selectedId: string; filter: VehicleFilter; onFilter: (value: VehicleFilter) => void; onSelect: (id: string) => void }) {
  return <section className="panel traffic-vehicle-panel" aria-labelledby="vehicle-list-title">
    <div className="traffic-panel-heading"><span className="eyebrow">Fleet watch</span><h2 id="vehicle-list-title">Vehicles <span>{vehicles.length}</span></h2><p>Select a unit to inspect its simulated route.</p></div>
    <label className="traffic-filter-label" htmlFor="vehicle-filter">Vehicle filter</label>
    <select id="vehicle-filter" value={filter} onChange={(event) => onFilter(event.target.value as VehicleFilter)}>{Object.entries(vehicleFilterLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select>
    <div className="traffic-vehicle-list">
      {vehicles.length === 0 && <p className="traffic-empty">No vehicles match this filter.</p>}
      {vehicles.map((vehicle) => <button type="button" key={vehicle.id} className={`traffic-vehicle-row ${selectedId === vehicle.id ? 'selected' : ''}`} onClick={() => onSelect(vehicle.id)} aria-pressed={selectedId === vehicle.id}>
        <span className={`traffic-vehicle-icon ${vehicle.type}`} aria-hidden="true">{vehicle.type === 'ambulance' ? '✚' : '▣'}</span>
        <span className="traffic-vehicle-copy"><strong>{vehicle.id}<em className={`traffic-status ${vehicle.status}`}>{vehicle.status}</em></strong><small>{vehicle.vehicleNumber} · {vehicle.type}</small><small>{locationName(city, vehicle.currentNodeId)} → {locationName(city, vehicle.destinationNodeId)}</small><small>Priority {vehicle.priority} · ETA {formatDuration(vehicle.etaSeconds)}</small><small>Updated {new Date(vehicle.lastUpdateAt).toLocaleTimeString()}</small></span>
        {vehicle.alertCount > 0 && <span className="traffic-alert-count" aria-label={`${vehicle.alertCount} active alerts`}>{vehicle.alertCount}</span>}
      </button>)}
    </div>
  </section>;
}
