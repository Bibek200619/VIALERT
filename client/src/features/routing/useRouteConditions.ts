import { useEffect, useMemo, useState } from 'react';
import type { CityData, IncidentRecord } from '../../services/apiClient';
import { apiClient } from '../../services/apiClient';
import { demoCityData } from '../ambulance/ambulanceData';
import { readSimulationSnapshot, type SimulationSnapshot } from '../simulation/simulationSnapshot';
import { buildDynamicGraph } from './dynamicRouting';
import { incidentToHazard, readLocalIncidents, sameIncidents } from './incidentFeed';

function currentSnapshot(): SimulationSnapshot | null {
  try {
    const snapshot = readSimulationSnapshot(window.localStorage);
    return snapshot && Date.now() - snapshot.publishedAt <= 600_000 ? snapshot : null;
  }
  catch { return null; }
}

export function useRouteConditions(city: CityData) {
  const [remoteIncidents, setRemoteIncidents] = useState<IncidentRecord[]>([]);
  const [localIncidents, setLocalIncidents] = useState<IncidentRecord[]>(() => readLocalIncidents(window.localStorage));
  const [snapshot, setSnapshot] = useState(currentSnapshot);
  const [signals, setSignals] = useState(city.signals);

  useEffect(() => {
    const controller = new AbortController();
    const refresh = async () => {
      const [incidentsResult, signalsResult] = await Promise.allSettled([apiClient.getIncidents(controller.signal), apiClient.getSignals(controller.signal)]);
      if (controller.signal.aborted) return;
      if (incidentsResult.status === 'fulfilled') setRemoteIncidents((previous) => sameIncidents(previous, incidentsResult.value.incidents) ? previous : incidentsResult.value.incidents);
      if (signalsResult.status === 'fulfilled') setSignals(signalsResult.value.signals);
    };
    void refresh();
    const timer = window.setInterval(() => void refresh(), 3000);
    return () => { controller.abort(); window.clearInterval(timer); };
  }, []);

  useEffect(() => {
    const refresh = () => {
      setSnapshot((previous) => { const next = currentSnapshot(); return previous?.publishedAt === next?.publishedAt ? previous : next; });
      setLocalIncidents((previous) => { const next = readLocalIncidents(window.localStorage); return sameIncidents(previous, next) ? previous : next; });
    };
    const timer = window.setInterval(refresh, 1000);
    window.addEventListener('storage', refresh);
    return () => { window.clearInterval(timer); window.removeEventListener('storage', refresh); };
  }, []);

  const baselineCity = useMemo(() => ({ ...city, roads: city.roads.map((road) => demoCityData.roads.find((baseline) => baseline.id === road.id) ?? road), signals }), [city, signals]);
  const hazards = useMemo(() => [
    ...(snapshot?.state.scenarios.filter((scenario) => scenario.active) ?? []),
    ...[...remoteIncidents, ...localIncidents.filter((local) => !remoteIncidents.some((remote) => remote.id === local.id))]
      .filter((incident) => incident.origin !== 'simulation')
      .map((incident) => incidentToHazard(baselineCity, incident)),
  ], [baselineCity, localIncidents, remoteIncidents, snapshot]);
  const graph = useMemo(() => buildDynamicGraph(baselineCity, hazards), [baselineCity, hazards]);
  return { baselineCity, ...graph, hazards, snapshot };
}
