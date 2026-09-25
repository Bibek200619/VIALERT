import { lazy, Suspense, useState } from 'react';
import { AlertPanel } from '../features/traffic/components/AlertPanel';
import { EventLog } from '../features/traffic/components/EventLog';
import { IncidentControlPanel } from '../features/traffic/components/IncidentControlPanel';
import { OperationsMetrics } from '../features/traffic/components/OperationsMetrics';
import { RouteSummary } from '../features/traffic/components/RouteSummary';
import { SignalControlPanel } from '../features/traffic/components/SignalControlPanel';
import { TrafficForecast } from '../features/traffic/components/TrafficForecast';
import { TrafficHeader } from '../features/traffic/components/TrafficHeader';
import { TrafficSidebar } from '../features/traffic/components/TrafficSidebar';
import { UpcomingSignals } from '../features/traffic/components/UpcomingSignals';
import { VehicleDetailPanel } from '../features/traffic/components/VehicleDetailPanel';
import { VehicleList } from '../features/traffic/components/VehicleList';
import { useTrafficOperations } from '../features/traffic/hooks/useTrafficOperations';

const TrafficOperationsMap = lazy(() => import('../features/traffic/components/TrafficOperationsMap').then((module) => ({ default: module.TrafficOperationsMap })));

export function TrafficControlPage() {
  const operations = useTrafficOperations();
  const [selectedSignalId, setSelectedSignalId] = useState<string | undefined>();
  const selected = operations.vehicles.find((vehicle) => vehicle.id === operations.selectedVehicle?.id) ?? null;
  return <div className="traffic-dashboard" id="traffic-dashboard">
    <TrafficSidebar />
    <section className="traffic-page">
      <TrafficHeader connection={operations.connection} metrics={operations.metrics} lastUpdateAt={operations.lastUpdateAt} />
      {operations.loading && <p className="load-message" role="status">Loading traffic operations. Shared demo data is ready.</p>}
      {operations.connection === 'offline' && <p className="traffic-offline-banner" role="status">Node API unavailable. Fleet, signals, and controls are using local demo data; changes in this view are not shared.</p>}
      {operations.connection === 'degraded' && <p className="traffic-offline-banner" role="status">Some mock API endpoints are unavailable. Available records and local demo data are shown together.</p>}
      {operations.notice && <p className="action-notice" role="status" aria-live="polite">{operations.notice}</p>}
      <OperationsMetrics metrics={operations.metrics} />
      <div className="traffic-content-grid">
        <VehicleList id="ambulance-list" city={operations.city} vehicles={operations.visibleVehicles} selectedId={operations.selectedVehicleId} filter={operations.vehicleFilter} onFilter={operations.setVehicleFilter} onSelect={operations.selectVehicle} />
        <main className="traffic-operations-column">
          <VehicleDetailPanel city={operations.city} vehicle={selected} alerts={operations.alerts} signals={operations.signals} />
          <Suspense fallback={<div className="panel map-loading" role="status">Loading the live operations map…</div>}><TrafficOperationsMap city={operations.city} vehicles={operations.vehicles} selected={selected} incidents={operations.incidents} predictions={operations.prediction.predictions} focusedNodeId={operations.focusedNodeId} onClearLocation={() => operations.setFocusedNodeId(null)} /></Suspense>
          <div className="traffic-route-grid">
            <RouteSummary city={operations.city} vehicle={selected} signals={operations.signals} />
            <UpcomingSignals city={operations.city} vehicle={selected} signals={operations.signals} selectedId={selectedSignalId} onSelect={setSelectedSignalId} />
          </div>
          <div className="traffic-ops-grid">
            <AlertPanel alerts={operations.visibleAlerts} severity={operations.alertSeverity} type={operations.alertType} onSeverity={operations.setAlertSeverity} onType={operations.setAlertType} onAcknowledge={(alert) => void operations.acknowledge(alert)} onVehicle={operations.selectVehicle} onLocation={operations.setFocusedNodeId} />
            <IncidentControlPanel id="traffic-incidents" city={operations.city} incidents={operations.incidents} selected={selected} onAdd={operations.addIncident} onRemove={operations.removeIncident} />
            <SignalControlPanel id="traffic-signals" city={operations.city} signals={operations.signals} vehicle={selected} selectedId={selectedSignalId} onSelect={setSelectedSignalId} onChange={operations.changeSignal} />
            <TrafficForecast id="traffic-predictions" predictions={operations.prediction.predictions} source={operations.prediction.source} settings={operations.prediction.settings} routeRoadIds={selected?.routeRoadIds ?? []} onSettings={operations.prediction.updateSettings} onRefresh={operations.prediction.refresh} onFocus={operations.setFocusedNodeId} />
            <EventLog events={operations.events} onClear={operations.clearLog} />
          </div>
        </main>
      </div>
      <p className="demo-disclaimer">Demo simulation — no real emergency dispatch or traffic-signal control. Map, fleet movement, incidents, alerts, and forecasts use VIALERT demo data.</p>
    </section>
  </div>;
}
