export function resetSimulation(store) {
  store.reset();
  return {
    status: 'reset',
    emergencies: store.emergencies,
    incidents: store.incidents,
    demo: true,
  };
}

export function getSimulationState(store) {
  return {
    ...store.simulation,
    incidentCount: store.incidents.length,
    demo: true,
  };
}

export function startSimulation(store) {
  store.simulation.status = 'running';
  return getSimulationState(store);
}

export function pauseSimulation(store) {
  store.simulation.status = store.simulation.status === 'ready' ? 'ready' : 'paused';
  return getSimulationState(store);
}
