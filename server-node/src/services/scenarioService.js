import { randomUUID } from 'node:crypto';
import { ApiError, requireEntity, requireEnum, requireRecord, requireString } from './validation.js';

const severities = ['low', 'medium', 'high'];
const incidentTypes = ['accident', 'construction', 'heavy-rain', 'flood', 'congestion'];

export function createIncident(store, body) {
  requireRecord(body, ['roadId', 'type', 'severity', 'blocked']);
  const roadId = requireString(body.roadId, 'roadId');
  const type = requireEnum(body.type, 'type', incidentTypes);
  const severity = requireEnum(body.severity, 'severity', severities);
  if (typeof body.blocked !== 'boolean') {
    throw new ApiError(400, 'INVALID_INPUT', 'blocked must be a boolean.');
  }
  const road = requireEntity(store.city.roads.find((item) => item.id === roadId), 'Road', roadId);
  const incident = {
    id: `INC-${randomUUID()}`,
    roadId,
    type,
    severity,
    blocked: body.blocked,
    createdAt: new Date().toISOString(),
    demo: true,
  };
  store.incidents.push(incident);
  // A mock incident can only raise disruption until reset. No routing is run.
  road.blocked = road.blocked || incident.blocked;
  road.congestion = severities[Math.max(severities.indexOf(road.congestion), severities.indexOf(severity))];
  return incident;
}
