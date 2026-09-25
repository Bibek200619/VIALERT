import { useState } from 'react';
import type { CityData, Signal } from '../../../services/apiClient';
import type { OperationsVehicle } from '../trafficTypes';
import { formatDistance } from '../../ambulance/ambulanceData';
import { locationName } from '../trafficUtils';

function signalDistance(city: CityData, vehicle: OperationsVehicle | null, signal: Signal): number | null {
  if (!vehicle) return null;
  const index = vehicle.routeNodeIds.indexOf(signal.nodeId);
  if (index < 0) return null;
  return vehicle.routeRoadIds.slice(0, index).reduce((sum, roadId) => sum + (city.roads.find((road) => road.id === roadId)?.distanceMeters ?? 0), 0);
}

export function SignalControlPanel({ id, city, signals, vehicle, selectedId: selectedIdProp, onSelect, onChange }: { id?: string; city: CityData; signals: Signal[]; vehicle: OperationsVehicle | null; selectedId?: string; onSelect?: (id: string) => void; onChange: (id: string, payload: Partial<Pick<Signal, 'state' | 'mode'>>, confirmed?: boolean) => Promise<boolean> }) {
  const [localSelectedId, setLocalSelectedId] = useState(signals[0]?.id ?? '');
  const selectedId = selectedIdProp ?? localSelectedId;
  const [confirming, setConfirming] = useState(false);
  const signal = signals.find((item) => item.id === selectedId) ?? signals[0];
  const affectedRoad = signal && city.roads.find((road) => road.from === signal.nodeId || road.to === signal.nodeId);
  const distance = signal && signalDistance(city, vehicle, signal);

  return <section className="panel traffic-signal-panel" id={id} aria-labelledby="traffic-signal-title">
    <div className="traffic-panel-heading"><span className="eyebrow">Simulated signal console</span><h2 id="traffic-signal-title">Signal controls</h2><p>Changes affect in-memory demo state only.</p></div>
    {signals.length === 0 || !signal ? <p className="traffic-empty">No signals are available.</p> : <>
      <label className="traffic-filter-label" htmlFor="signal-select">Select monitored signal</label><select id="signal-select" value={signal.id} onChange={(event) => { setLocalSelectedId(event.target.value); onSelect?.(event.target.value); setConfirming(false); }}>{signals.map((item) => <option key={item.id} value={item.id}>{item.id} · {locationName(city, item.nodeId)}</option>)}</select>
      <div className="traffic-signal-hero"><span className={`traffic-signal-lamp ${signal.state}`} aria-hidden="true" /><div><strong>{signal.id} · {locationName(city, signal.nodeId)}</strong><small>{signal.state.toUpperCase()} · {signal.mode === 'emergency' ? 'EMERGENCY PRIORITY' : signal.mode.toUpperCase()} MODE</small></div></div>
      <dl className="traffic-signal-facts"><div><dt>Affected road</dt><dd>{affectedRoad?.name ?? 'No linked road'}</dd></div><div><dt>Distance on selected route</dt><dd>{distance === null ? 'Not on route' : formatDistance(distance)}</dd></div></dl>
      <div className="traffic-signal-actions" aria-label={`Simulated controls for ${signal.id}`}>
        {(['green', 'yellow', 'red'] as const).map((state) => <button key={state} type="button" className={`traffic-set-${state}`} onClick={() => { setConfirming(false); void onChange(signal.id, { state, mode: 'manual' }); }}>Set {state}</button>)}
      </div>
      {signal.mode === 'emergency' ? <button className="button button-secondary traffic-priority-button" type="button" onClick={() => void onChange(signal.id, { mode: 'normal' })}>Disable emergency priority</button> : <button className="button button-muted traffic-priority-button" type="button" onClick={() => setConfirming(true)}>Enable emergency priority</button>}
      {confirming && <div className="traffic-confirm-box" role="group" aria-label="Confirm simulated emergency priority"><strong>Confirm demo priority for {signal.id}?</strong><p>This sets the mock signal green and enables simulated emergency priority. No real light is affected.</p><div><button className="button button-primary" type="button" onClick={() => { void onChange(signal.id, { state: 'green', mode: 'emergency' }, true).then((success) => { if (success) setConfirming(false); }); }}>Confirm simulated priority</button><button className="button button-secondary" type="button" onClick={() => setConfirming(false)}>Cancel</button></div></div>}
    </>}
  </section>;
}
