import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { demoCityData } from '../../ambulance/ambulanceData';
import { apiClient, type CityData, type IncidentRequest } from '../../../services/apiClient';
import {
  createInitialSimulationState,
  getScenarioAffectedRoadIds,
  simulationReducer,
} from '../simulationEngine';
import type { Scenario, ScenarioSeverity, SimulationAction, SimulationSpeed, SimulationState, VehicleConfiguration } from '../simulationTypes';
import { SIMULATION_SNAPSHOT_KEY } from '../simulationSnapshot';

export type ApiConnection = 'checking' | 'online' | 'degraded' | 'offline';

export interface SimulationController {
  city: CityData;
  state: SimulationState;
  connection: ApiConnection;
  isLoading: boolean;
  actionNotice: string;
  start: () => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
  step: () => void;
  setSpeed: (speed: SimulationSpeed) => void;
  selectScenario: (scenarioId: string | null) => void;
  configureVehicle: (vehicle: Partial<VehicleConfiguration>) => void;
  activateScenario: (template: Scenario, roadId?: string, nodeId?: string, severity?: ScenarioSeverity) => void;
  deactivateScenario: (scenarioId: string) => void;
  removeScenario: (scenarioId: string) => void;
  restartScenario: () => void;
  returnToDefaultRoute: () => void;
}

function makeIncidentRequest(scenario: Scenario, roadId: string): IncidentRequest {
  return {
    roadId,
    type: scenario.type,
    severity: scenario.severity,
    blocked: scenario.type === 'flood' || scenario.type === 'blockage' || Boolean(scenario.blocked),
  };
}

export function useSimulation(): SimulationController {
  const [city, setCity] = useState<CityData>(demoCityData);
  const reducer = useCallback(
    (state: SimulationState, action: SimulationAction) => simulationReducer(state, action, city),
    [city],
  );
  const [state, dispatch] = useReducer(reducer, demoCityData, createInitialSimulationState);
  const [connection, setConnection] = useState<ApiConnection>('checking');
  const [isLoading, setIsLoading] = useState(true);
  const [actionNotice, setActionNotice] = useState('');
  const incidentIds = useRef(new Map<string, string[]>());

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      const [health, cityResult, backendState] = await Promise.allSettled([
        apiClient.getNodeHealth(controller.signal),
        apiClient.getCity(controller.signal),
        apiClient.getSimulationState(controller.signal),
      ]);
      if (controller.signal.aborted) return;
      const loadedCity = cityResult.status === 'fulfilled' ? cityResult.value : demoCityData;
      setCity(loadedCity);
      dispatch({ type: 'city-updated', city: loadedCity });
      setConnection(health.status !== 'fulfilled'
        ? 'offline'
        : cityResult.status === 'fulfilled' && backendState.status === 'fulfilled' ? 'online' : 'degraded');
      if (cityResult.status === 'rejected' || backendState.status === 'rejected') {
        setActionNotice('Node API data is unavailable or incomplete. The shared city graph is running locally.');
      }
      setIsLoading(false);
    }
    void load();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (state.status !== 'running') return undefined;
    const timer = window.setInterval(() => dispatch({ type: 'tick' }), 1000);
    return () => window.clearInterval(timer);
  }, [state.status]);

  useEffect(() => {
    try {
      window.localStorage.setItem(SIMULATION_SNAPSHOT_KEY, JSON.stringify({ state, publishedAt: Date.now() }));
    } catch {
      // Storage can be disabled; the simulation remains usable in this tab.
    }
  }, [state]);

  const reportApiAction = useCallback((successMessage: string, failureMessage: string, request: () => Promise<unknown>) => {
    void request().then(() => setActionNotice(successMessage)).catch(() => {
      setConnection((current) => current === 'online' ? 'degraded' : current);
      setActionNotice(failureMessage);
    });
  }, []);

  const start = useCallback(() => {
    dispatch({ type: 'start' });
    reportApiAction(
      'Simulation running locally; Node API start state recorded.',
      'Simulation is running locally; Node API was unavailable to record the command.',
      () => apiClient.startSimulation(),
    );
  }, [reportApiAction]);

  const pause = useCallback(() => {
    dispatch({ type: 'pause' });
    reportApiAction(
      'Simulation paused locally; Node API pause state recorded.',
      'Simulation paused locally; Node API was unavailable to record the command.',
      () => apiClient.pauseSimulation(),
    );
  }, [reportApiAction]);

  const resume = useCallback(() => {
    dispatch({ type: 'resume' });
    reportApiAction(
      'Simulation resumed locally; Node API start state recorded.',
      'Simulation resumed locally; Node API was unavailable to record the command.',
      () => apiClient.startSimulation(),
    );
  }, [reportApiAction]);

  const reset = useCallback(() => {
    dispatch({ type: 'reset' });
    incidentIds.current.clear();
    reportApiAction(
      'Simulation reset locally and in the Node demo API.',
      'Simulation reset locally. Node API records may remain until the service is available.',
      () => apiClient.resetSimulation(),
    );
  }, [reportApiAction]);

  const step = useCallback(() => dispatch({ type: 'step' }), []);
  const setSpeed = useCallback((speed: SimulationSpeed) => dispatch({ type: 'set-speed', speed }), []);
  const selectScenario = useCallback((scenarioId: string | null) => dispatch({ type: 'select-scenario', scenarioId }), []);
  const configureVehicle = useCallback((vehicle: Partial<VehicleConfiguration>) => dispatch({ type: 'configure-vehicle', vehicle }), []);

  const activateScenario = useCallback((template: Scenario, roadId?: string, nodeId?: string, severity?: ScenarioSeverity) => {
    if (state.status === 'running') return;
    const scenarioId = state.scenarios.some((scenario) => scenario.id === template.id)
      ? template.id
      : `${template.id}-${String(state.scenarioSequence).padStart(2, '0')}`;
    const activeScenario: Scenario = {
      ...template,
      id: scenarioId,
      ...(roadId ? { roadId } : {}),
      ...(nodeId ? { nodeId } : {}),
      ...(roadId ? { nodeId: undefined } : {}),
      ...(nodeId ? { roadId: undefined } : {}),
      severity: severity ?? template.severity,
      active: true,
    };
    dispatch({ type: 'activate-scenario', template, roadId, nodeId, severity });
    const affectedRoadIds = [...getScenarioAffectedRoadIds(city, activeScenario)];
    const previousIds = incidentIds.current.get(scenarioId) ?? [];
    incidentIds.current.delete(scenarioId);
    const removePrevious = () => Promise.allSettled(previousIds.map((id) => apiClient.removeIncident(id)));
    if (connection === 'offline' || affectedRoadIds.length === 0) {
      void removePrevious();
      setActionNotice(`${template.name} is active in the local simulation; no Node incident record is available.`);
      return;
    }
    void removePrevious()
      .then(() => Promise.allSettled(affectedRoadIds.map((affectedRoadId) => apiClient.createIncident(makeIncidentRequest(activeScenario, affectedRoadId)))))
      .then((results) => {
      const ids = results.flatMap((result) => result.status === 'fulfilled' ? [result.value.incident.id] : []);
      if (ids.length > 0) incidentIds.current.set(scenarioId, ids);
      const complete = ids.length === results.length;
      setActionNotice(complete
        ? `${template.name} activated locally and recorded as a simulated Node incident.`
        : `${template.name} remains active locally; the Node API recorded only part of the incident overlay.`);
      if (!complete) setConnection((current) => current === 'online' ? 'degraded' : current);
    });
  }, [city, connection, state.scenarioSequence, state.scenarios, state.status]);

  const removeBackendIncidents = useCallback((scenarioId: string, label: string) => {
    const ids = incidentIds.current.get(scenarioId) ?? [];
    incidentIds.current.delete(scenarioId);
    if (ids.length === 0) return;
    void Promise.allSettled(ids.map((id) => apiClient.removeIncident(id))).then((results) => {
      const complete = results.every((result) => result.status === 'fulfilled');
      setActionNotice(complete
        ? `${label} removed locally and its Node API incident records were cleared.`
        : `${label} was removed locally; Node API incident cleanup was incomplete.`);
    });
  }, []);

  const deactivateScenario = useCallback((scenarioId: string) => {
    dispatch({ type: 'deactivate-scenario', scenarioId });
    removeBackendIncidents(scenarioId, 'Scenario');
  }, [removeBackendIncidents]);

  const removeScenario = useCallback((scenarioId: string) => {
    const label = state.scenarios.find((scenario) => scenario.id === scenarioId)?.name ?? 'Scenario';
    dispatch({ type: 'remove-scenario', scenarioId });
    removeBackendIncidents(scenarioId, label);
  }, [removeBackendIncidents, state.scenarios]);

  const restartScenario = useCallback(() => {
    dispatch({ type: 'restart-scenario' });
    setActionNotice('Current scenario restarted from the configured ambulance base. Active local effects were preserved.');
  }, []);

  const returnToDefaultRoute = useCallback(() => {
    dispatch({ type: 'return-default-route' });
    incidentIds.current.clear();
    reportApiAction(
      'Default route restored locally and Node demo state reset.',
      'Default route restored locally. Node API state could not be reset.',
      () => apiClient.resetSimulation(),
    );
  }, [reportApiAction]);

  return {
    city,
    state,
    connection,
    isLoading,
    actionNotice,
    start,
    pause,
    resume,
    reset,
    step,
    setSpeed,
    selectScenario,
    configureVehicle,
    activateScenario,
    deactivateScenario,
    removeScenario,
    restartScenario,
    returnToDefaultRoute,
  };
}
