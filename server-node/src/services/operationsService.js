import { ApiError, requireEntity, requireRecord } from './validation.js';

export function listVehicles(store) {
  return store.city.vehicles;
}

export function listSignals(store) {
  return store.city.signals;
}

export function listIncidents(store) {
  return store.incidents;
}

export function listAlerts(store) {
  return store.alerts;
}

export function listEvents(store) {
  return store.events;
}

export function addOperationsEvent(store, category, subject, message, severity = 'info') {
  const event = {
    id: `EVT-${store.events.length + 1}`,
    timestamp: Date.now(),
    category,
    subject,
    message,
    severity,
  };
  store.events.push(event);
  return event;
}

export function addOperationsAlert(store, alert) {
  const created = {
    id: `ALT-${store.alerts.length + 1}`,
    createdAt: Date.now(),
    acknowledged: false,
    ...alert,
  };
  store.alerts.push(created);
  return created;
}

export function acknowledgeAlert(store, alertId, body) {
  requireRecord(body, ['acknowledged']);
  if (body.acknowledged !== true) {
    throw new ApiError(400, 'INVALID_INPUT', 'acknowledged must be true.');
  }
  const alert = requireEntity(store.alerts.find((item) => item.id === alertId), 'Alert', alertId);
  alert.acknowledged = true;
  addOperationsEvent(store, 'alert', alertId, `${alert.title} acknowledged`, 'info');
  return alert;
}

export function getOperationsSummary(store) {
  const vehicles = store.city.vehicles;
  const active = vehicles.filter((vehicle) => vehicle.status === 'active');
  const emergencyRoutes = active.filter((vehicle) => vehicle.type === 'ambulance');
  return {
    activeVehicles: active.length,
    activeAmbulances: emergencyRoutes.length,
    criticalAlerts: store.alerts.filter((alert) => !alert.acknowledged && alert.severity === 'critical').length,
    emergencyRoutes: emergencyRoutes.length,
    signalsInPriorityMode: store.city.signals.filter((signal) => signal.mode === 'emergency').length,
    incidentsToday: store.incidents.length,
    responseRoutesProtected: store.city.signals.filter((signal) => signal.mode === 'emergency').length,
  };
}
