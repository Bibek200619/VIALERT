import { useState } from 'react';
import type { CityData, IncidentRecord, IncidentRequest } from '../../../services/apiClient';
import type { OperationsVehicle } from '../trafficTypes';

const types: { value: IncidentRequest['type']; label: string }[] = [
  { value: 'accident', label: 'Accident' },
  { value: 'construction', label: 'Construction' },
  { value: 'rain', label: 'Heavy rain' },
  { value: 'flood', label: 'Flood' },
  { value: 'congestion', label: 'Heavy congestion' },
  { value: 'blockage', label: 'Manual road block' },
];

export function IncidentControlPanel({ id, city, incidents, selected, onAdd, onRemove }: {
  id?: string;
  city: CityData;
  incidents: IncidentRecord[];
  selected: OperationsVehicle | null;
  onAdd: (payload: IncidentRequest) => Promise<boolean>;
  onRemove: (id: string) => Promise<boolean>;
}) {
  const [roadId, setRoadId] = useState('R3');
  const [type, setType] = useState<IncidentRequest['type']>('accident');
  const [severity, setSeverity] = useState<IncidentRequest['severity']>('high');
  const [manualClosure, setManualClosure] = useState(false);
  const [busy, setBusy] = useState(false);
  const forcedClosure = type === 'flood' || type === 'blockage';
  const selectedRoad = city.roads.find((road) => road.id === roadId);
  const onCorridor = selected?.routeRoadIds.includes(roadId);

  return <section className="panel traffic-incident-panel" id={id} aria-labelledby="traffic-incident-title">
    <div className="traffic-panel-heading"><span className="eyebrow">Demo incident desk</span><h2 id="traffic-incident-title">Change road conditions</h2><p>Create mock incidents; A* recalculates the ambulance corridor.</p></div>
    <div className="traffic-incident-form">
      <label>Road segment<select value={roadId} onChange={(event) => setRoadId(event.target.value)}>{city.roads.map((road) => <option key={road.id} value={road.id}>{road.id} · {road.name}</option>)}</select></label>
      <label>Condition<select value={type} onChange={(event) => setType(event.target.value as IncidentRequest['type'])}>{types.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
      <label>Severity<select value={severity} onChange={(event) => setSeverity(event.target.value as IncidentRequest['severity'])}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></label>
      <label className="traffic-incident-checkbox"><input type="checkbox" checked={forcedClosure || manualClosure} disabled={forcedClosure} onChange={(event) => setManualClosure(event.target.checked)} />Close this road in the demo</label>
      <p className="traffic-incident-context">{selectedRoad?.name ?? 'Choose a road'} · {onCorridor ? 'currently on selected vehicle route' : 'away from selected route'}</p>
      <button className="button button-primary" type="button" disabled={busy || !selectedRoad} onClick={() => { setBusy(true); void onAdd({ roadId, type, severity, blocked: forcedClosure || manualClosure }).finally(() => setBusy(false)); }}>Activate simulated incident</button>
    </div>
    <div className="traffic-incident-active" aria-live="polite">
      <h3>Active incident overlays <span>{incidents.length}</span></h3>
      {incidents.length === 0 ? <p className="traffic-empty">No incidents. The baseline road graph is available.</p> : <ul>{incidents.map((incident) => {
        const road = city.roads.find((item) => item.id === incident.roadId);
        return <li key={incident.id}><div><strong>{incident.type.replace('-', ' ')} · {road?.name ?? incident.roadId}</strong><small>{incident.severity} · {incident.blocked ? 'road closed' : 'travel cost increased'} · {incident.origin === 'simulation' ? 'Simulation' : incident.id.startsWith('LOCAL-') ? 'Local browser' : 'Node mock API'}</small></div>{incident.origin !== 'simulation' && <button type="button" disabled={busy} onClick={() => { setBusy(true); void onRemove(incident.id).finally(() => setBusy(false)); }} aria-label={`Clear simulated ${incident.type} on ${road?.name ?? incident.roadId}`}>Clear</button>}</li>;
      })}</ul>}
    </div>
  </section>;
}
