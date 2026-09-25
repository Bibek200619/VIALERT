import type { CityData } from '../ambulance/types';

export type SimulationStatus = 'ready' | 'running' | 'paused' | 'completed';
export type SimulationSpeed = 1 | 2 | 5;
export type ScenarioType = 'accident' | 'construction' | 'rain' | 'flood' | 'congestion' | 'blockage';
export type ScenarioSeverity = 'low' | 'medium' | 'high';
export type VehiclePriority = 'routine' | 'urgent' | 'critical';
export type RouteStatus = 'clear' | 'impacted' | 'rerouted' | 'unavailable';
export type CameraMode = 'map' | 'follow' | 'driver' | 'third-person' | 'rear-view';

export interface Scenario {
  id: string;
  type: ScenarioType;
  name: string;
  description: string;
  nodeId?: string;
  roadId?: string;
  severity: ScenarioSeverity;
  active: boolean;
  startTime?: number;
  durationSeconds?: number;
  blocked?: boolean;
}

export interface VehicleConfiguration {
  ambulanceId: string;
  vehicleNumber: string;
  baseId: string;
  destinationId: string;
  priority: VehiclePriority;
}

export type SimulationEventType =
  | 'simulation_started'
  | 'simulation_paused'
  | 'simulation_resumed'
  | 'simulation_reset'
  | 'scenario_restarted'
  | 'default_route_restored'
  | 'vehicle_configuration_changed'
  | 'junction_passed'
  | 'accident_activated'
  | 'construction_activated'
  | 'rain_activated'
  | 'flood_activated'
  | 'congestion_activated'
  | 'blockage_activated'
  | 'scenario_deactivated'
  | 'scenario_removed'
  | 'scenario_expired'
  | 'route_recalculated'
  | 'route_unavailable'
  | 'signal_encountered'
  | 'hospital_reached';

export interface SimulationEvent {
  id: string;
  timestampSeconds: number;
  type: SimulationEventType;
  message: string;
  severity?: ScenarioSeverity;
}

export interface SimulationState {
  status: SimulationStatus;
  simulationTimeSeconds: number;
  speedMultiplier: SimulationSpeed;
  selectedVehicleId: string;
  selectedScenarioId: string | null;
  activeScenarioIds: string[];
  currentNodeId: string;
  routeNodeIds: string[];
  routeRoadIds: string[];
  previousRouteNodeIds: string[];
  previousRouteRoadIds: string[];
  distanceTravelledMeters: number;
  distanceRemainingMeters: number;
  etaSeconds: number;
  events: SimulationEvent[];
  vehicle: VehicleConfiguration;
  scenarios: Scenario[];
  externalScenarios: Scenario[];
  routeStatus: RouteStatus;
  routeMessage: string;
  eventSequence: number;
  scenarioSequence: number;
}

export type SimulationAction =
  | { type: 'start' }
  | { type: 'pause' }
  | { type: 'resume' }
  | { type: 'reset' }
  | { type: 'tick' }
  | { type: 'step' }
  | { type: 'set-speed'; speed: SimulationSpeed }
  | { type: 'select-scenario'; scenarioId: string | null }
  | { type: 'configure-vehicle'; vehicle: Partial<VehicleConfiguration> }
  | { type: 'activate-scenario'; template: Scenario; roadId?: string; nodeId?: string; severity?: ScenarioSeverity }
  | { type: 'deactivate-scenario'; scenarioId: string }
  | { type: 'remove-scenario'; scenarioId: string }
  | { type: 'restart-scenario' }
  | { type: 'return-default-route' }
  | { type: 'city-updated'; city: CityData }
  | { type: 'external-incidents-updated'; scenarios: Scenario[] };

export interface ScenarioRoadEffects {
  city: CityData;
  roadCostMultipliers: Readonly<Record<string, number>>;
  affectedRoadIds: Set<string>;
  blockedRoadIds: Set<string>;
}
