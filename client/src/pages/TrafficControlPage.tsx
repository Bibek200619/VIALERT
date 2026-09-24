import { lazy, Suspense } from 'react';
import { AlertPanel } from '../features/traffic/components/AlertPanel';
import { CityOverview } from '../features/traffic/components/CityOverview';
import { EventLog } from '../features/traffic/components/EventLog';
import { OperationsMetrics } from '../features/traffic/components/OperationsMetrics';
import { SignalControlPanel } from '../features/traffic/components/SignalControlPanel';
import { TrafficHeader } from '../features/traffic/components/TrafficHeader';
import { VehicleDetailPanel } from '../features/traffic/components/VehicleDetailPanel';
import { VehicleList } from '../features/traffic/components/VehicleList';
import { useTrafficOperations } from '../features/traffic/hooks/useTrafficOperations';

const TrafficOperationsMap = lazy(() => import('../features/traffic/components/TrafficOperationsMap').then((module) => ({ default: module.TrafficOperationsMap })));

export function TrafficControlPage() {
  const operations = useTrafficOperations();
  const selected = operations.vehicles.find((vehicle) => vehicle.id === operations.selectedVehicle?.id) ?? null;
  return <section className="traffic-page">
    <TrafficHeader connection={operations.connection} metrics={operations.metrics} lastUpdateAt={operations.lastUpdateAt} />
    {operations.loading && <p className="load-message" role="status">Loading traffic operations from the Node API. Shared demo data is ready.</p>}
    {operations.connection === 'offline' && <p className="traffic-offline-banner" role="status">Node API unavailable. Fleet, signals, and controls are using local demo data; changes in this view are not shared.</p>}
    {operations.connection === 'degraded' && <p className="traffic-offline-banner" role="status">Some mock API endpoints are unavailable. Available records and local demo data are shown together.</p>}
    {operations.notice && <p className="action-notice" role="status" aria-live="polite">{operations.notice}</p>}
    <CityOverview city={operations.city} vehicles={operations.vehicles} signals={operations.signals} incidents={operations.incidents} />
    <div className="traffic-main-grid">
      <VehicleList city={operations.city} vehicles={operations.visibleVehicles} selectedId={operations.selectedVehicleId} filter={operations.vehicleFilter} onFilter={operations.setVehicleFilter} onSelect={operations.selectVehicle} />
      <Suspense fallback={<div className="panel map-loading" role="status">Loading the operations map…</div>}><TrafficOperationsMap city={operations.city} vehicles={operations.vehicles} selected={selected} incidents={operations.incidents} focusedNodeId={operations.focusedNodeId} onClearLocation={() => operations.setFocusedNodeId(null)} /></Suspense>
      <VehicleDetailPanel city={operations.city} vehicle={selected} alerts={operations.alerts} />
    </div>
    <OperationsMetrics metrics={operations.metrics} />
    <div className="traffic-lower-grid">
      <AlertPanel alerts={operations.visibleAlerts} severity={operations.alertSeverity} type={operations.alertType} onSeverity={operations.setAlertSeverity} onType={operations.setAlertType} onAcknowledge={(alert) => void operations.acknowledge(alert)} onVehicle={operations.selectVehicle} onLocation={operations.setFocusedNodeId} />
      <SignalControlPanel city={operations.city} signals={operations.signals} vehicle={selected} onChange={operations.changeSignal} />
      <EventLog events={operations.events} onClear={operations.clearLog} />
    </div>
    <p className="demo-disclaimer">All positions, routes, alerts, signals, and controls are simulated. Same-browser Phase 3 movement is reflected when available; no government feed or real traffic light is connected.</p>
  </section>;
}
