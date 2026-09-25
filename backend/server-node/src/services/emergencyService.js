import { randomUUID } from 'node:crypto';
import { ApiError, requireEntity, requireRecord, requireString } from './validation.js';

export function listEmergencies(store) {
  return store.emergencies;
}

export function createEmergency(store, body) {
  requireRecord(body, ['ambulanceId', 'baseNodeId', 'destinationNodeId']);
  const ambulanceId = requireString(body.ambulanceId, 'ambulanceId');
  const baseNodeId = requireString(body.baseNodeId, 'baseNodeId');
  const destinationNodeId = requireString(body.destinationNodeId, 'destinationNodeId');
  requireEntity(store.city.bases.find((base) => base.nodeId === baseNodeId), 'Base node', baseNodeId);
  requireEntity(store.city.hospitals.find((hospital) => hospital.nodeId === destinationNodeId), 'Hospital node', destinationNodeId);

  if (store.emergencies.some((emergency) => emergency.ambulanceId === ambulanceId)) {
    throw new ApiError(409, 'DUPLICATE_EMERGENCY', `Ambulance '${ambulanceId}' already has a pending demo emergency.`);
  }

  const emergency = {
    id: `EMG-${randomUUID()}`,
    ambulanceId,
    baseNodeId,
    destinationNodeId,
    status: 'pending',
    createdAt: new Date().toISOString(),
    demo: true,
  };
  store.emergencies.push(emergency);
  return emergency;
}
