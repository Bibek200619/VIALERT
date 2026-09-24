import type { OperationsVehicle } from '../trafficTypes';
import type { CityData, IncidentRecord, Signal } from '../../../services/apiClient';
import { locationName } from '../trafficUtils';

export function CityOverview({ city, vehicles, signals, incidents }: { city: CityData; vehicles: OperationsVehicle[]; signals: Signal[]; incidents: IncidentRecord[] }) {
  const activeAmbulance = vehicles.find((vehicle) => vehicle.type === 'ambulance' && vehicle.status === 'active');
  return <section className="traffic-city-strip panel" aria-label="City operations overview">
    <div><span className="eyebrow">City pulse</span><strong>Emergency corridor monitor</strong><small>Hardcoded Bengaluru-inspired graph</small></div>
    <div><span>Priority vehicle</span><strong>{activeAmbulance?.vehicleNumber ?? 'No active ambulance'}</strong><small>{activeAmbulance ? `${locationName(city, activeAmbulance.currentNodeId)} → ${locationName(city, activeAmbulance.destinationNodeId)}` : 'Select a vehicle to inspect'}</small></div>
    <div><span>Signals</span><strong>{signals.length} monitored</strong><small>{signals.filter((signal) => signal.mode === 'emergency').length} in demo priority mode</small></div>
    <div><span>Incidents</span><strong>{incidents.length} active</strong><small>{incidents.some((incident) => incident.blocked) ? 'Closure overlay present' : 'No blocked roads reported'}</small></div>
  </section>;
}
