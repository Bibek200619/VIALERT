import assert from 'node:assert/strict';
import { once } from 'node:events';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { createApp } from '../src/app.js';
import { createStore } from '../src/data/store.js';

async function withApi(run) {
  const store = createStore();
  const server = createApp({ store }).listen(0, '127.0.0.1');
  await once(server, 'listening');
  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  const request = async (path, { method = 'GET', body, raw } = {}) => {
    const response = await fetch(`${baseUrl}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: raw ?? (body === undefined ? undefined : JSON.stringify(body)),
    });
    return { status: response.status, body: await response.json(), headers: response.headers };
  };
  try {
    await run(request, store);
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
}

const emergency = { ambulanceId: 'AMB-07', baseNodeId: 'BASE-1', destinationNodeId: 'HOSP-1' };
const incident = { roadId: 'R4', type: 'accident', severity: 'high', blocked: true };

test('health and complete mock state lifecycle; reset preserves fixture files', async () => {
  const roadsFile = new URL('../../shared-data/roads.json', import.meta.url);
  const signalsFile = new URL('../../shared-data/signals.json', import.meta.url);
  const fixtureRoads = readFileSync(roadsFile, 'utf8');
  const fixtureSignals = readFileSync(signalsFile, 'utf8');

  await withApi(async (request, store) => {
    const health = await request('/api/health');
    assert.equal(health.status, 200);
    assert.deepEqual(health.body, { status: 'ok', service: 'vialert-node', phase: 1, demo: true });
    assert.equal(health.headers.get('access-control-allow-origin'), 'http://localhost:5173');
    const baseline = (await request('/api/city')).body;
    assert.equal(baseline.demo, true);
    assert.deepEqual((await request('/api/emergencies')).body, { emergencies: [], demo: true });
    assert.deepEqual((await request('/api/simulation/state')).body, {
      simulation: { status: 'ready', simulationTimeSeconds: 0, incidentCount: 0, demo: true },
      demo: true,
    });
    assert.equal((await request('/api/simulation/start', { method: 'POST' })).body.simulation.status, 'running');
    assert.equal((await request('/api/simulation/pause', { method: 'POST' })).body.simulation.status, 'paused');

    const created = await request('/api/emergencies', { method: 'POST', body: emergency });
    assert.equal(created.status, 201);
    assert.equal(created.body.emergency.status, 'pending');
    assert.equal(created.body.emergency.ambulanceId, 'AMB-07');
    assert.equal(created.body.emergency.demo, true);
    assert.equal(Object.hasOwn(created.body.emergency, 'route'), false);
    assert.equal((await request('/api/emergencies')).body.emergencies.length, 1);
    assert.equal((await request('/api/emergencies', { method: 'POST', body: emergency })).status, 409);

    const signal = await request('/api/signals/S1', { method: 'PATCH', body: { state: 'green', mode: 'manual' } });
    assert.equal(signal.status, 200);
    assert.equal(signal.body.signal.state, 'green');
    assert.equal(signal.body.signal.mode, 'manual');
    const createdIncident = await request('/api/incidents', { method: 'POST', body: incident });
    assert.equal(createdIncident.status, 201);
    assert.equal((await request('/api/simulation/state')).body.simulation.incidentCount, 1);
    const modifiedCity = (await request('/api/city')).body;
    assert.equal(modifiedCity.roads.find((road) => road.id === 'R4').blocked, true);
    assert.equal(modifiedCity.roads.find((road) => road.id === 'R4').congestion, 'high');
    assert.equal(modifiedCity.signals.find((item) => item.id === 'S1').mode, 'manual');

    await request('/api/incidents', { method: 'POST', body: { ...incident, severity: 'low', blocked: false } });
    assert.equal(store.city.roads.find((road) => road.id === 'R4').blocked, true);
    assert.equal(store.city.roads.find((road) => road.id === 'R4').congestion, 'high');
    assert.equal(store.incidents.length, 2);

    const removed = await request(`/api/incidents/${createdIncident.body.incident.id}`, { method: 'DELETE' });
    assert.equal(removed.status, 200);
    assert.equal(removed.body.incident.id, createdIncident.body.incident.id);
    assert.equal((await request('/api/simulation/state')).body.simulation.incidentCount, 1);
    assert.equal(store.city.roads.find((road) => road.id === 'R4').blocked, false);
    assert.equal(store.city.roads.find((road) => road.id === 'R4').congestion, 'medium');

    const reset = await request('/api/simulation/reset', { method: 'POST' });
    assert.equal(reset.status, 200);
    assert.deepEqual(reset.body, { status: 'reset', emergencies: [], incidents: [], demo: true });
    assert.equal(store.incidents.length, 0);
    assert.deepEqual((await request('/api/city')).body, baseline);
    assert.equal((await request('/api/emergencies')).body.emergencies.length, 0);
    assert.equal((await request('/api/emergencies', { method: 'POST', body: emergency })).status, 201);
  });

  assert.equal(readFileSync(roadsFile, 'utf8'), fixtureRoads);
  assert.equal(readFileSync(signalsFile, 'utf8'), fixtureSignals);
});

test('invalid and unknown references return JSON errors without partial mutations', async () => {
  await withApi(async (request, store) => {
    const baseline = structuredClone(store.city);
    const cases = [
      ['/api/emergencies', 'POST', [], 400],
      ['/api/emergencies', 'POST', {}, 400],
      ['/api/emergencies', 'POST', { ...emergency, ambulanceId: '  ' }, 400],
      ['/api/emergencies', 'POST', { ...emergency, baseNodeId: 'missing' }, 404],
      ['/api/emergencies', 'POST', { ...emergency, destinationNodeId: 'MG-ROAD' }, 404],
      ['/api/emergencies', 'POST', { ...emergency, unexpected: true }, 400],
      ['/api/signals/S1', 'PATCH', { state: 'green', mode: 'invalid' }, 400],
      ['/api/signals/S1', 'PATCH', {}, 400],
      ['/api/signals/missing', 'PATCH', { state: 'green' }, 404],
      ['/api/incidents', 'POST', { ...incident, blocked: 'true' }, 400],
      ['/api/incidents', 'POST', { ...incident, severity: 'critical' }, 400],
      ['/api/incidents', 'POST', { ...incident, type: 'invalid' }, 400],
      ['/api/incidents', 'POST', { ...incident, roadId: 'missing' }, 404],
      ['/api/incidents/missing', 'DELETE', undefined, 404],
      ['/api/simulation/tick', 'POST', {}, 404],
    ];
    for (const [path, method, body, expectedStatus] of cases) {
      const result = await request(path, { method, body });
      assert.equal(result.status, expectedStatus, `${method} ${path} ${JSON.stringify(body)}`);
      assert.equal(result.body.demo, true);
      assert.equal(typeof result.body.error.code, 'string');
      assert.equal(typeof result.body.error.message, 'string');
    }
    const malformed = await request('/api/emergencies', { method: 'POST', raw: '{broken' });
    assert.equal(malformed.status, 400);
    assert.equal(malformed.body.error.code, 'INVALID_JSON');
    assert.deepEqual(store.city, baseline);
    assert.deepEqual(store.emergencies, []);
    assert.deepEqual(store.incidents, []);
  });
});

test('traffic operations endpoints expose fleet, mock signals, alerts, events, and reset-safe state', async () => {
  await withApi(async (request) => {
    const fleet = await request('/api/vehicles');
    assert.equal(fleet.status, 200);
    assert.equal(fleet.body.vehicles.length, 2);
    assert.equal(fleet.body.vehicles[0].id, 'AMB-07');
    assert.equal((await request('/api/signals')).body.signals.length, 6);
    assert.deepEqual((await request('/api/incidents')).body, { incidents: [], demo: true });
    assert.deepEqual((await request('/api/alerts')).body, { alerts: [], demo: true });
    assert.equal((await request('/api/operations/summary')).body.summary.activeVehicles, 2);

    const priority = await request('/api/signals/S2', { method: 'PATCH', body: { state: 'green', mode: 'emergency' } });
    assert.equal(priority.body.signal.mode, 'emergency');
    assert.equal((await request('/api/signals')).body.signals.find((signal) => signal.id === 'S2').state, 'green');
    assert.equal((await request('/api/operations/summary')).body.summary.signalsInPriorityMode, 1);
    const signalAlert = (await request('/api/alerts')).body.alerts[0];
    assert.equal(signalAlert.acknowledged, false);
    assert.equal(signalAlert.type, 'signal');
    const ack = await request(`/api/alerts/${signalAlert.id}`, { method: 'PATCH', body: { acknowledged: true } });
    assert.equal(ack.body.alert.acknowledged, true);
    assert.equal((await request('/api/alerts')).body.alerts[0].acknowledged, true);
    assert.equal((await request(`/api/alerts/${signalAlert.id}`, { method: 'PATCH', body: { acknowledged: false } })).status, 400);
    assert.equal((await request('/api/alerts/missing', { method: 'PATCH', body: { acknowledged: true } })).status, 404);

    const created = await request('/api/incidents', { method: 'POST', body: incident });
    assert.equal(created.status, 201);
    assert.equal((await request('/api/incidents')).body.incidents.length, 1);
    assert.equal((await request('/api/alerts')).body.alerts.some((alert) => alert.type === 'incident' && alert.severity === 'critical'), true);
    assert.ok((await request('/api/operations/events')).body.events.length >= 3);
    assert.equal((await request('/api/operations/summary')).body.summary.incidentsToday, 1);

    await request('/api/simulation/reset', { method: 'POST' });
    assert.deepEqual((await request('/api/alerts')).body.alerts, []);
    assert.deepEqual((await request('/api/operations/events')).body.events, []);
    assert.equal((await request('/api/signals')).body.signals.find((signal) => signal.id === 'S2').mode, 'normal');
    assert.equal((await request('/api/vehicles')).body.vehicles.length, 2);
  });
});
