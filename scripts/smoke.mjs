import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// Read-only verification of running services. Start `npm run dev` first.
const nodeOrigin = process.env.NODE_ORIGIN ?? 'http://127.0.0.1:4000';
const aiOrigin = process.env.AI_ORIGIN ?? 'http://127.0.0.1:8000';
const clientOrigin = process.env.CLIENT_ORIGIN ?? 'http://localhost:5173';
async function get(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
  assert.equal(response.status, 200, `${url} must return 200`);
  return response;
}

try {
  for (const [url, service] of [
    [`${nodeOrigin}/api/health`, 'vialert-node'],
    [`${aiOrigin}/health`, 'vialert-ai'],
    [`${clientOrigin}/api/health`, 'vialert-node'],
    [`${clientOrigin}/ai/health`, 'vialert-ai'],
  ]) {
    const health = await (await get(url)).json();
    assert.equal(health.status, 'ok');
    assert.equal(health.service, service);
    assert.equal(health.demo, true);
    assert.equal(health.phase, 1);
    console.log(`PASS ${url}`);
  }
  const city = await (await get(`${nodeOrigin}/api/city`)).json();
  assert.ok(city.nodes.length > 0 && city.hospitals.length >= 2);
  assert.equal(city.demo, true);
  const emergencies = await (await get(`${nodeOrigin}/api/emergencies`)).json();
  assert.ok(Array.isArray(emergencies.emergencies));
  const predictions = await (await get(`${aiOrigin}/predictions`)).json();
  assert.ok(predictions.predictions.length > 0 && predictions.demo);
  const examples = JSON.parse(readFileSync(new URL('../shared-data/prediction_inputs.json', import.meta.url), 'utf8'));
  const forecastResponse = await fetch(`${clientOrigin}/ai/predict/batch`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ requests: examples }), signal: AbortSignal.timeout(5000),
  });
  assert.equal(forecastResponse.status, 200, 'batch forecast through Vite proxy must return 200');
  const forecast = await forecastResponse.json();
  assert.equal(forecast.predictions.length, 6);
  assert.equal(forecast.predictions[0].predictedCongestion, 'severe');
  assert.ok(forecast.predictions[0].factors.includes('weekday office peak'));
  for (const route of ['/', '/demo', '/ambulance', '/traffic', '/simulation']) {
    assert.match(await (await get(`${clientOrigin}${route}`)).text(), /VIALERT/, `${route} refresh must return the app shell`);
  }
  console.log('PASS city fixtures, emergencies, six batch forecasts, and all five browser-route refreshes');
} catch (error) {
  console.error('Smoke check failed. Start all three services with npm run dev.');
  console.error(error.message);
  process.exitCode = 1;
}
