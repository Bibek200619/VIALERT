import { Router } from 'express';
import { createEmergency, listEmergencies } from '../services/emergencyService.js';
import { updateSignal } from '../services/signalService.js';
import { createIncident } from '../services/scenarioService.js';
import { resetSimulation } from '../services/simulationService.js';

export function createApiRouter(store) {
  const router = Router();

  router.get('/health', (_request, response) => {
    response.json({ status: 'ok', service: 'vialert-node', phase: 1, demo: true });
  });

  router.get('/city', (_request, response) => {
    response.json({ ...store.city, demo: true });
  });

  router.get('/emergencies', (_request, response) => {
    response.json({ emergencies: listEmergencies(store), demo: true });
  });

  router.post('/emergencies', (request, response) => {
    response.status(201).json({ emergency: createEmergency(store, request.body), demo: true });
  });

  router.patch('/signals/:signalId', (request, response) => {
    response.json({ signal: updateSignal(store, request.params.signalId, request.body), demo: true });
  });

  router.post('/incidents', (request, response) => {
    response.status(201).json({ incident: createIncident(store, request.body), demo: true });
  });

  router.post('/simulation/reset', (_request, response) => {
    response.json(resetSimulation(store));
  });

  return router;
}
