export interface HealthResponse {
  status: 'ok';
  service: 'vialert-node' | 'vialert-ai';
  phase: number;
  demo: true;
}

export interface CityNode {
  id: string;
  name: string;
  lat: number;
  lng: number;
  type: string;
}

export interface Road {
  id: string;
  name: string;
  from: string;
  to: string;
  distanceMeters: number;
  baseTimeSeconds: number;
  congestion: 'low' | 'medium' | 'high';
  blocked: boolean;
}

export interface Signal {
  id: string;
  nodeId: string;
  state: 'red' | 'yellow' | 'green';
  mode: 'normal' | 'manual' | 'emergency';
}

export interface CityData {
  nodes: CityNode[];
  roads: Road[];
  signals: Signal[];
  hospitals: { id: string; name: string; nodeId: string }[];
  bases: { id: string; name: string; nodeId: string }[];
  adjacency: Record<string, { to: string; roadId: string }[]>;
  scenarios: ScenarioPreset[];
  vehicles?: VehicleFixture[];
  demo: true;
}

export interface VehicleFixture {
  id: string;
  type: 'ambulance' | 'bus' | 'police' | 'response';
  vehicleNumber: string;
  status: 'active' | 'paused' | 'offline' | 'completed';
  priority: 'critical' | 'high' | 'normal';
  originNodeId: string;
  currentNodeId: string;
  destinationNodeId: string;
  emergencyType: string;
  crew: string;
  speedKph: number;
}

export interface OperationsAlertRecord {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  type: 'ambulance' | 'signal' | 'incident' | 'route' | 'system';
  title: string;
  message: string;
  vehicleId?: string;
  nodeId?: string;
  createdAt: number;
  acknowledged: boolean;
}

export interface OperationsEventRecord {
  id: string;
  timestamp: number;
  category: string;
  subject: string;
  message: string;
  severity: 'critical' | 'warning' | 'info';
}

export interface OperationsSummaryResponse {
  activeVehicles: number;
  activeAmbulances: number;
  criticalAlerts: number;
  emergencyRoutes: number;
  signalsInPriorityMode: number;
  incidentsToday: number;
  responseRoutesProtected: number;
}

export interface ScenarioPreset {
  id: string;
  name: string;
  description: string;
  type: string;
  nodeId?: string;
  roadId?: string;
  severity: 'low' | 'medium' | 'high';
  active: false;
  blocked?: boolean;
  durationSeconds?: number;
}

export interface SimulationBackendState {
  status: 'ready' | 'running' | 'paused';
  simulationTimeSeconds: number;
  incidentCount: number;
  demo: true;
}

export interface IncidentRequest {
  roadId: string;
  type: 'accident' | 'construction' | 'heavy-rain' | 'rain' | 'flood' | 'congestion' | 'blockage';
  severity: 'low' | 'medium' | 'high';
  blocked: boolean;
  origin?: 'operator' | 'simulation';
}

export interface IncidentRecord extends IncidentRequest {
  id: string;
  createdAt: string;
  demo: true;
}

export interface ForecastInput {
  areaId: string;
  roadId: string;
  timeOfDay: string;
  dayType: 'weekday' | 'weekend';
  weather: 'clear' | 'rain' | 'heavy-rain';
  rainIntensity: 'none' | 'light' | 'moderate' | 'heavy';
  isHoliday: boolean;
  officePeak: boolean;
  schoolPeak: boolean;
  activeIncidents: Array<'accident' | 'construction' | 'flood' | 'congestion' | 'blockage'>;
  roadConstruction: boolean;
  floodRisk: boolean;
  currentCongestion: Road['congestion'];
  eventNearby: boolean;
  emergencyPriorityActive: boolean;
}

export interface TrafficForecast {
  areaId: string;
  roadId: string;
  predictedCongestion: 'low' | 'medium' | 'high' | 'severe';
  riskScore: number;
  etaImpactMinutes: number;
  confidence: 'low' | 'medium' | 'high';
  predictionWindow: string;
  factors: string[];
  operatorRecommendation: string;
  routingRecommendation: string;
  disclaimer: string;
  demo: true;
  model: 'explainable-rules-v1';
}

export interface EmergencyRequest {
  ambulanceId: string;
  baseNodeId: string;
  destinationNodeId: string;
}

export interface EmergencyRecord extends EmergencyRequest {
  id: string;
  status: string;
  createdAt: string;
  demo: true;
}

export interface EmergenciesResponse {
  emergencies: EmergencyRecord[];
  demo: true;
}

export interface CityLoadResult {
  data: CityData;
  source: 'service' | 'demo-fallback';
  error?: Error;
}

const nodeBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');
const aiBaseUrl = (import.meta.env.VITE_AI_BASE_URL ?? '/ai').replace(/\/$/, '');

async function request<T>(url: string, signal?: AbortSignal, init?: RequestInit): Promise<T> {
  const timeout = AbortSignal.timeout(5000);
  const response = await fetch(url, {
    ...init,
    signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
    headers: { Accept: 'application/json', ...init?.headers },
  });
  if (!response.ok) {
    throw new Error(`Request failed (${response.status})`);
  }
  return response.json() as Promise<T>;
}

function isCityData(value: unknown): value is CityData {
  if (!value || typeof value !== 'object') return false;
  const city = value as Partial<CityData>;
  return Array.isArray(city.nodes) && city.nodes.length > 0
    && Array.isArray(city.roads) && city.roads.length > 0
    && Array.isArray(city.signals)
    && Array.isArray(city.hospitals) && city.hospitals.length > 0
    && Array.isArray(city.bases) && city.bases.length > 0
    && Array.isArray(city.scenarios)
    && city.adjacency !== null && typeof city.adjacency === 'object' && Object.keys(city.adjacency).length > 0;
}

export async function requestWithFallback<T>(
  load: () => Promise<T>,
  fallback: T,
): Promise<{ data: T; source: 'service' | 'demo-fallback'; error?: Error }> {
  try {
    return { data: await load(), source: 'service' };
  } catch (cause) {
    return { data: fallback, source: 'demo-fallback', error: cause instanceof Error ? cause : new Error('Service request failed') };
  }
}

export const apiClient = {
  getNodeHealth: (signal?: AbortSignal) =>
    request<HealthResponse>(`${nodeBaseUrl}/api/health`, signal),
  getCity: async (signal?: AbortSignal) => {
    const city = await request<unknown>(`${nodeBaseUrl}/api/city`, signal);
    if (!isCityData(city)) throw new Error('The Node API returned incomplete city data.');
    return city;
  },
  getEmergencies: (signal?: AbortSignal) => request<EmergenciesResponse>(`${nodeBaseUrl}/api/emergencies`, signal),
  getVehicles: (signal?: AbortSignal) => request<{ vehicles: VehicleFixture[]; demo: true }>(`${nodeBaseUrl}/api/vehicles`, signal),
  getSignals: (signal?: AbortSignal) => request<{ signals: Signal[]; demo: true }>(`${nodeBaseUrl}/api/signals`, signal),
  updateSignal: (signalId: string, payload: Partial<Pick<Signal, 'state' | 'mode'>>, signal?: AbortSignal) =>
    request<{ signal: Signal; demo: true }>(`${nodeBaseUrl}/api/signals/${encodeURIComponent(signalId)}`, signal, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
    }),
  getIncidents: (signal?: AbortSignal) => request<{ incidents: IncidentRecord[]; demo: true }>(`${nodeBaseUrl}/api/incidents`, signal),
  getAlerts: (signal?: AbortSignal) => request<{ alerts: OperationsAlertRecord[]; demo: true }>(`${nodeBaseUrl}/api/alerts`, signal),
  acknowledgeAlert: (alertId: string, signal?: AbortSignal) =>
    request<{ alert: OperationsAlertRecord; demo: true }>(`${nodeBaseUrl}/api/alerts/${encodeURIComponent(alertId)}`, signal, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ acknowledged: true }),
    }),
  getOperationsEvents: (signal?: AbortSignal) => request<{ events: OperationsEventRecord[]; demo: true }>(`${nodeBaseUrl}/api/operations/events`, signal),
  getOperationsSummary: (signal?: AbortSignal) => request<{ summary: OperationsSummaryResponse; demo: true }>(`${nodeBaseUrl}/api/operations/summary`, signal),
  createEmergency: (payload: EmergencyRequest, signal?: AbortSignal) =>
    request<{ emergency: EmergencyRecord; demo: true }>(`${nodeBaseUrl}/api/emergencies`, signal, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),
  resetSimulation: (signal?: AbortSignal) => request<{ status: 'reset'; demo: true }>(`${nodeBaseUrl}/api/simulation/reset`, signal, {
    method: 'POST',
  }),
  getSimulationState: (signal?: AbortSignal) => request<{ simulation: SimulationBackendState; demo: true }>(`${nodeBaseUrl}/api/simulation/state`, signal),
  startSimulation: (signal?: AbortSignal) => request<{ simulation: SimulationBackendState; demo: true }>(`${nodeBaseUrl}/api/simulation/start`, signal, {
    method: 'POST',
  }),
  pauseSimulation: (signal?: AbortSignal) => request<{ simulation: SimulationBackendState; demo: true }>(`${nodeBaseUrl}/api/simulation/pause`, signal, {
    method: 'POST',
  }),
  createIncident: (payload: IncidentRequest, signal?: AbortSignal) =>
    request<{ incident: IncidentRecord; demo: true }>(`${nodeBaseUrl}/api/incidents`, signal, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),
  removeIncident: (incidentId: string, signal?: AbortSignal) =>
    request<{ incident: IncidentRecord; demo: true }>(`${nodeBaseUrl}/api/incidents/${encodeURIComponent(incidentId)}`, signal, {
      method: 'DELETE',
    }),
  getAiHealth: (signal?: AbortSignal) => request<HealthResponse>(`${aiBaseUrl}/health`, signal),
  predictForecast: (payload: ForecastInput, signal?: AbortSignal) =>
    request<TrafficForecast>(`${aiBaseUrl}/predict/forecast`, signal, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }),
  predictBatch: (requests: ForecastInput[], signal?: AbortSignal) =>
    request<{ demo: true; model: 'explainable-rules-v1'; predictions: TrafficForecast[] }>(`${aiBaseUrl}/predict/batch`, signal, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ requests }) }),
};
