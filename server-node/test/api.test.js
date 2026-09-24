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
    assert.equal((await request('/api/incidents', { method: 'POST', body: incident })).status, 201);
    const modifiedCity = (await request('/api/city')).body;
    assert.equal(modifiedCity.roads.find((road) => road.id === 'R4').blocked, true);
    assert.equal(modifiedCity.roads.find((road) => road.id === 'R4').congestion, 'high');
    assert.equal(modifiedCity.signals.find((item) => item.id === 'S1').mode, 'manual');

    await request('/api/incidents', { method: 'POST', body: { ...incident, severity: 'low', blocked: false } });
    assert.equal(store.city.roads.find((road) => road.id === 'R4').blocked, true);
    assert.equal(store.city.roads.find((road) => road.id === 'R4').congestion, 'high');
    assert.equal(store.incidents.length, 2);

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
