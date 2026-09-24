import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = (name) => JSON.parse(readFileSync(new URL(`../shared-data/${name}.json`, import.meta.url), 'utf8'));
const [nodes, roads, signals, hospitals, bases, scenarios, adjacency] =
  ['nodes', 'roads', 'signals', 'hospitals', 'bases', 'scenarios', 'adjacency'].map(read);
const nodeIds = new Set(nodes.map(({ id }) => id));
const roadById = new Map(roads.map((road) => [road.id, road]));

test('all fixture IDs are unique and location coordinates are valid', () => {
  for (const collection of [nodes, roads, signals, hospitals, bases, scenarios]) {
    assert.equal(new Set(collection.map(({ id }) => id)).size, collection.length);
    assert.ok(collection.every(({ id }) => typeof id === 'string' && id.length > 0));
  }
  for (const node of nodes) {
    assert.ok(Number.isFinite(node.lat) && node.lat >= -90 && node.lat <= 90);
    assert.ok(Number.isFinite(node.lng) && node.lng >= -180 && node.lng <= 180);
    assert.ok(['base', 'hospital', 'junction'].includes(node.type));
  }
});

test('roads and adjacency reference the same bidirectional graph', () => {
  assert.deepEqual(Object.keys(adjacency).sort(), [...nodeIds].sort());
  for (const road of roads) {
    assert.ok(nodeIds.has(road.from) && nodeIds.has(road.to));
    assert.notEqual(road.from, road.to);
    assert.ok(Number.isFinite(road.distanceMeters) && road.distanceMeters > 0);
    assert.ok(Number.isFinite(road.baseTimeSeconds) && road.baseTimeSeconds > 0);
    assert.ok(['low', 'medium', 'high'].includes(road.congestion));
    assert.equal(typeof road.blocked, 'boolean');
    for (const [from, to] of [[road.from, road.to], [road.to, road.from]]) {
      assert.equal(adjacency[from].filter((edge) => edge.to === to && edge.roadId === road.id).length, 1);
    }
  }
  assert.equal(Object.values(adjacency).flat().length, roads.length * 2);
  for (const [from, edges] of Object.entries(adjacency)) {
    for (const edge of edges) {
      const road = roadById.get(edge.roadId);
      assert.ok(road, `Unknown road ${edge.roadId}`);
      assert.ok((road.from === from && road.to === edge.to) || (road.to === from && road.from === edge.to));
    }
  }
});

test('base reaches every demo location and hospital through the graph', () => {
  assert.ok(bases.length >= 1);
  assert.ok(hospitals.length >= 2);
  const visited = new Set();
  const pending = [bases[0].nodeId];
  while (pending.length) {
    const node = pending.pop();
    if (visited.has(node)) continue;
    visited.add(node);
    pending.push(...adjacency[node].map(({ to }) => to));
  }
  assert.deepEqual([...visited].sort(), [...nodeIds].sort());
  for (const [collection, type] of [[bases, 'base'], [hospitals, 'hospital']]) {
    for (const item of collection) assert.equal(nodes.find(({ id }) => id === item.nodeId)?.type, type);
  }
});

test('signal references and all six scenario presets use the valid simulation schema', () => {
  for (const signal of signals) {
    assert.ok(nodeIds.has(signal.nodeId));
    assert.ok(['red', 'yellow', 'green'].includes(signal.state));
    assert.ok(['normal', 'manual', 'emergency'].includes(signal.mode));
  }
  assert.deepEqual(scenarios.map(({ type }) => type).sort(), ['accident', 'construction', 'rain', 'flood', 'congestion', 'blockage'].sort());
  assert.equal(scenarios.length, 6);
  for (const scenario of scenarios) {
    assert.ok(scenario.roadId || scenario.nodeId, `${scenario.id} must identify a map location`);
    if (scenario.roadId) assert.ok(roadById.has(scenario.roadId));
    if (scenario.nodeId) assert.ok(nodeIds.has(scenario.nodeId));
    assert.ok(['low', 'medium', 'high'].includes(scenario.severity));
    assert.equal(typeof scenario.active, 'boolean');
    assert.equal(typeof scenario.blocked, 'boolean');
    assert.equal(typeof scenario.description, 'string');
  }
});
