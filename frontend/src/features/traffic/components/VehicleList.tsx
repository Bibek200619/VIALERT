import { useMemo, useState } from 'react';
import { Icon } from '../../../components/Icon';
import type { CityData } from '../../../services/apiClient';
import type { OperationsVehicle, VehicleFilter } from '../trafficTypes';
import { locationName } from '../trafficUtils';
import { formatDuration } from '../../ambulance/ambulanceData';

export function VehicleList({ id, city, vehicles, selectedId, filter, onFilter, onSelect }: { id?: string; city: CityData; vehicles: OperationsVehicle[]; selectedId: string; filter: VehicleFilter; onFilter: (value: VehicleFilter) => void; onSelect: (id: string) => void }) {
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return vehicles.filter((vehicle) => !normalized || [vehicle.id, vehicle.vehicleNumber, locationName(city, vehicle.currentNodeId), locationName(city, vehicle.destinationNodeId)].some((value) => value.toLowerCase().includes(normalized)));
  }, [city, query, vehicles]);
  const filters: { label: string; value: VehicleFilter }[] = [
    { label: 'All', value: 'ambulances' }, { label: 'En route', value: 'active' }, { label: 'Priority', value: 'critical' }, { label: 'At hospital', value: 'completed' },
  ];
  return <section className="panel traffic-vehicle-panel" id={id} aria-labelledby="vehicle-list-title">
    <div className="traffic-section-heading traffic-list-heading"><div><span className="eyebrow">Fleet watch</span><h2 id="vehicle-list-title">Active ambulances</h2></div><span className="traffic-count-label">{vehicles.length}</span></div>
    <label className="traffic-search" htmlFor="vehicle-search"><Icon name="search" /><input id="vehicle-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search ambulance or vehicle number" /></label>
    <div className="traffic-filter-tabs" aria-label="Ambulance filters">{filters.map((item) => <button key={item.value} type="button" className={filter === item.value ? 'active' : ''} onClick={() => onFilter(item.value)} aria-pressed={filter === item.value}>{item.label}</button>)}</div>
    <div className="traffic-vehicle-list">
      {filtered.length === 0 && <p className="traffic-empty">No vehicles match this search or filter.</p>}
      {filtered.map((vehicle) => <button type="button" key={vehicle.id} className={`traffic-vehicle-row ${selectedId === vehicle.id ? 'selected' : ''}`} onClick={() => onSelect(vehicle.id)} aria-pressed={selectedId === vehicle.id}>
        <span className={`traffic-vehicle-thumb ${vehicle.type}`} aria-hidden="true"><Icon name="ambulance" /></span>
        <span className="traffic-vehicle-copy"><strong>{vehicle.vehicleNumber}</strong><span className="traffic-vehicle-status"><i className={vehicle.status === 'active' ? 'on' : 'off'} />{vehicle.status === 'active' ? 'On route' : vehicle.status}</span><small>{locationName(city, vehicle.currentNodeId)} <b>→</b> {locationName(city, vehicle.destinationNodeId)}</small><small className="traffic-vehicle-eta">ETA {vehicle.etaSeconds > 0 ? formatDuration(vehicle.etaSeconds) : '—'}</small></span>
        {vehicle.alertCount > 0 && <span className="traffic-alert-count" aria-label={`${vehicle.alertCount} active alerts`}>{vehicle.alertCount}</span>}
      </button>)}
    </div>
    <p className="traffic-panel-footnote">{filtered.length} of {vehicles.length} demo units shown · updates automatically</p>
  </section>;
}
