import { useEffect, useState } from 'react';
import type { CityData } from '../../ambulance/types';
import type { VehicleConfiguration } from '../simulationTypes';

interface VehiclePanelProps {
  city: CityData;
  vehicle: VehicleConfiguration;
  routeNodeIds: string[];
  disabled: boolean;
  onApply: (vehicle: Partial<VehicleConfiguration>) => void;
}

export function VehiclePanel({ city, vehicle, routeNodeIds, disabled, onApply }: VehiclePanelProps) {
  const [draft, setDraft] = useState(vehicle);
  useEffect(() => setDraft(vehicle), [vehicle]);
  const routeNames = routeNodeIds.map((nodeId) => city.nodes.find((node) => node.id === nodeId)?.name.replace(' (demo)', '') ?? nodeId);
  const hasChanges = (Object.keys(vehicle) as (keyof VehicleConfiguration)[]).some((key) => vehicle[key] !== draft[key]);

  return <section className="panel vehicle-panel" aria-labelledby="vehicle-panel-title">
    <div className="panel-heading-row"><div><span className="eyebrow">Unit configuration</span><h2 id="vehicle-panel-title">Demo ambulance</h2></div><span className="unit-active"><i aria-hidden="true" />Single vehicle</span></div>
    <div className="vehicle-form-grid">
      <label>Ambulance ID<input value={draft.ambulanceId} maxLength={24} disabled={disabled} onChange={(event) => setDraft((current) => ({ ...current, ambulanceId: event.target.value }))} /></label>
      <label>Vehicle number<input value={draft.vehicleNumber} maxLength={24} disabled={disabled} onChange={(event) => setDraft((current) => ({ ...current, vehicleNumber: event.target.value }))} /></label>
      <label>Starting base<select value={draft.baseId} disabled={disabled} onChange={(event) => setDraft((current) => ({ ...current, baseId: event.target.value }))}>
        {city.bases.map((base) => <option value={base.id} key={base.id}>{base.name.replace(' (demo)', '')}</option>)}
      </select></label>
      <label>Destination hospital<select value={draft.destinationId} disabled={disabled} onChange={(event) => setDraft((current) => ({ ...current, destinationId: event.target.value }))}>
        {city.hospitals.map((hospital) => <option value={hospital.id} key={hospital.id}>{hospital.name.replace(' (demo)', '')}</option>)}
      </select></label>
      <label>Emergency priority<select value={draft.priority} disabled={disabled} onChange={(event) => setDraft((current) => ({ ...current, priority: event.target.value as VehicleConfiguration['priority'] }))}>
        <option value="routine">Routine</option><option value="urgent">Urgent</option><option value="critical">Critical</option>
      </select></label>
    </div>
    <div className="starting-route"><span>Starting route</span><strong>{routeNames.length ? routeNames.join('  →  ') : 'No route available for these selections.'}</strong></div>
    <button className="button button-secondary vehicle-apply" type="button" onClick={() => onApply(draft)} disabled={disabled || !hasChanges || !draft.ambulanceId.trim() || !draft.vehicleNumber.trim()}>
      Apply configuration &amp; recalculate
    </button>
    <p className="panel-footnote">Configuration and route are local demo state; the Node API does not dispatch vehicles.</p>
  </section>;
}
