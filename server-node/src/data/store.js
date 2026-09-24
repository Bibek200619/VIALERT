import { readFileSync } from 'node:fs';

const dataDirectory = new URL('../../../shared-data/', import.meta.url);
const collectionNames = ['nodes', 'roads', 'signals', 'hospitals', 'bases', 'adjacency', 'scenarios', 'vehicles'];

function loadCity() {
  return Object.fromEntries(collectionNames.map((name) => [
    name,
    JSON.parse(readFileSync(new URL(`${name}.json`, dataDirectory), 'utf8')),
  ]));
}

// Each application has its own disposable state. Shared JSON files are never written.
export function createStore() {
  const city = loadCity();
  return {
    city,
    baselineRoads: structuredClone(city.roads),
    emergencies: [],
    incidents: [],
    alerts: [],
    events: [],
    simulation: { status: 'ready', simulationTimeSeconds: 0 },
    reset() {
      this.city = loadCity();
      this.baselineRoads = structuredClone(this.city.roads);
      this.emergencies = [];
      this.incidents = [];
      this.alerts = [];
      this.events = [];
      this.simulation = { status: 'ready', simulationTimeSeconds: 0 };
    },
  };
}
