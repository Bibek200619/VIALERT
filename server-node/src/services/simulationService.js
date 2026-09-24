export function resetSimulation(store) {
  store.reset();
  return {
    status: 'reset',
    emergencies: store.emergencies,
    incidents: store.incidents,
    demo: true,
  };
}
