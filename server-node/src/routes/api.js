import { Router } from 'express';
import { createEmergency, listEmergencies } from '../services/emergencyService.js';
import { updateSignal } from '../services/signalService.js';
import { createIncident, removeIncident } from '../services/scenarioService.js';
import { getSimulationState, pauseSimulation, resetSimulation, startSimulation } from '../services/simulationService.js';
import { acknowledgeAlert, getOperationsSummary, listAlerts, listEvents, listIncidents, listSignals, listVehicles } from '../services/operationsService.js';

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

  router.get('/vehicles', (_request, response) => {
    response.json({ vehicles: listVehicles(store), demo: true });
  });

  router.get('/signals', (_request, response) => {
    response.json({ signals: listSignals(store), demo: true });
  });

  router.get('/incidents', (_request, response) => {
    response.json({ incidents: listIncidents(store), demo: true });
  });

  router.get('/alerts', (_request, response) => {
    response.json({ alerts: listAlerts(store), demo: true });
  });

  router.patch('/alerts/:alertId', (request, response) => {
    response.json({ alert: acknowledgeAlert(store, request.params.alertId, request.body), demo: true });
  });

  router.get('/operations/events', (_request, response) => {
    response.json({ events: listEvents(store), demo: true });
  });

  router.get('/operations/summary', (_request, response) => {
    response.json({ summary: getOperationsSummary(store), demo: true });
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

  router.delete('/incidents/:incidentId', (request, response) => {
    response.json({ incident: removeIncident(store, request.params.incidentId), demo: true });
  });

  router.get('/simulation/state', (_request, response) => {
    response.json({ simulation: getSimulationState(store), demo: true });
  });

  router.post('/simulation/start', (_request, response) => {
    response.json({ simulation: startSimulation(store), demo: true });
  });

  router.post('/simulation/pause', (_request, response) => {
    response.json({ simulation: pauseSimulation(store), demo: true });
  });

  router.post('/simulation/reset', (_request, response) => {
    response.json(resetSimulation(store));
  });

  return router;
}
