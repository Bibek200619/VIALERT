import { readFileSync } from 'node:fs';

const dataDirectory = new URL('../../../shared-data/', import.meta.url);
const collectionNames = ['nodes', 'roads', 'signals', 'hospitals', 'bases', 'adjacency', 'scenarios'];

function loadCity() {
  return Object.fromEntries(collectionNames.map((name) => [
    name,
    JSON.parse(readFileSync(new URL(`${name}.json`, dataDirectory), 'utf8')),
  ]));
}

// Each application has its own disposable state. Shared JSON files are never written.
export function createStore() {
  return {
    city: loadCity(),
    emergencies: [],
    incidents: [],
    reset() {
      this.city = loadCity();
      this.emergencies = [];
      this.incidents = [];
    },
  };
}
