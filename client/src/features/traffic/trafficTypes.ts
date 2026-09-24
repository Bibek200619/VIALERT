import type { IncidentRecord, OperationsAlertRecord, OperationsEventRecord, VehicleFixture } from '../../services/apiClient';

export type VehicleFilter = 'all' | 'ambulances' | 'buses' | 'active' | 'critical' | 'alerts';
export type AlertSeverityFilter = 'all' | 'critical' | 'warning' | 'info';
export type AlertTypeFilter = 'all' | OperationsAlertRecord['type'];

export interface OperationsVehicle extends VehicleFixture {
  routeNodeIds: string[];
  routeRoadIds: string[];
  routeDistanceMeters: number;
  distanceRemainingMeters: number;
  etaSeconds: number;
  currentRoad: string;
  nextJunction: string;
  nextSignalId: string | null;
  alertCount: number;
  lastUpdateAt: number;
  source: 'fixture' | 'simulation';
}

export type OperationsAlert = OperationsAlertRecord;
export type OperationsEvent = OperationsEventRecord & { simulationTimeSeconds?: number };
export type OperationsIncident = IncidentRecord;

export interface OperationsMetricsData {
  activeVehicles: number;
  activeAmbulances: number;
  criticalAlerts: number;
  emergencyRoutes: number;
  signalsInPriorityMode: number;
  averageEtaSeconds: number;
  incidentsToday: number;
  responseRoutesProtected: number;
}
