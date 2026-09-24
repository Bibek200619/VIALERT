import { randomUUID } from 'node:crypto';
import { ApiError, requireEntity, requireEnum, requireRecord, requireString } from './validation.js';
import { addOperationsAlert, addOperationsEvent } from './operationsService.js';

const severities = ['low', 'medium', 'high'];
const incidentTypes = ['accident', 'construction', 'heavy-rain', 'rain', 'flood', 'congestion', 'blockage'];
const congestionRank = { low: 0, medium: 1, high: 2 };
const congestionLevel = ['low', 'medium', 'high'];

function refreshRoadEffects(store) {
  store.city.roads = store.baselineRoads.map((baseline) => {
    const roadIncidents = store.incidents.filter((incident) => incident.roadId === baseline.id);
    const maxSeverity = Math.max(congestionRank[baseline.congestion], ...roadIncidents.map((incident) => congestionRank[incident.severity]));
    return {
      ...baseline,
      blocked: baseline.blocked || roadIncidents.some((incident) => incident.blocked),
      congestion: congestionLevel[maxSeverity],
    };
  });
}

export function createIncident(store, body) {
  requireRecord(body, ['roadId', 'type', 'severity', 'blocked', 'origin']);
  const roadId = requireString(body.roadId, 'roadId');
  const type = requireEnum(body.type, 'type', incidentTypes);
  const severity = requireEnum(body.severity, 'severity', severities);
  if (typeof body.blocked !== 'boolean') {
    throw new ApiError(400, 'INVALID_INPUT', 'blocked must be a boolean.');
  }
  const origin = body.origin === undefined ? 'operator' : requireEnum(body.origin, 'origin', ['operator', 'simulation']);
  const road = requireEntity(store.city.roads.find((item) => item.id === roadId), 'Road', roadId);
  const incident = {
    id: `INC-${randomUUID()}`,
    roadId,
    type,
    severity,
    blocked: body.blocked || type === 'flood' || type === 'blockage',
    origin,
    createdAt: new Date().toISOString(),
    demo: true,
  };
  store.incidents.push(incident);
  // These road effects are in-memory demo overlays; fixture files remain unchanged.
  refreshRoadEffects(store);
  addOperationsAlert(store, {
    severity: incident.blocked || incident.severity === 'high' ? 'critical' : 'warning',
    type: 'incident',
    title: `${type} reported`,
    message: `${road.name} has a simulated ${type} overlay.`,
    nodeId: road.from,
    incidentId: incident.id,
  });
  addOperationsEvent(store, 'incident', road.id, `Simulated ${type} activated on ${road.name}`, incident.blocked ? 'critical' : 'warning');
  addOperationsEvent(store, 'route', 'AMB-07', `Mock ambulance corridor recalculation requested for ${type} on ${road.name}`, incident.blocked ? 'critical' : 'warning');
  return incident;
}

export function removeIncident(store, incidentId) {
  const id = requireString(incidentId, 'incidentId');
  const index = store.incidents.findIndex((incident) => incident.id === id);
  const incident = requireEntity(store.incidents[index], 'Incident', id);
  store.incidents.splice(index, 1);
  refreshRoadEffects(store);
  for (const alert of store.alerts) if (alert.incidentId === incident.id) alert.acknowledged = true;
  addOperationsEvent(store, 'incident', incident.roadId, `Simulated ${incident.type} removed from ${incident.roadId}`, 'info');
  addOperationsEvent(store, 'route', 'AMB-07', `Mock ambulance corridor recalculation requested after ${incident.type} cleared on ${incident.roadId}`, 'info');
  return incident;
}
