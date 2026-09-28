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
  baselineRoads?: Road[];
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

export function isCityData(value: unknown): value is CityData {
  if (!value || typeof value !== 'object') return false;
  const city = value as CityData;
  const record = (item: unknown): item is Record<string, unknown> => Boolean(item && typeof item === 'object' && !Array.isArray(item));
  if (!Array.isArray(city.nodes) || !city.nodes.length || !city.nodes.every((node) => record(node)
    && typeof node.id === 'string' && typeof node.name === 'string' && typeof node.type === 'string'
    && Number.isFinite(node.lat) && Math.abs(node.lat) <= 90 && Number.isFinite(node.lng) && Math.abs(node.lng) <= 180)) return false;
  const nodeIds = new Set(city.nodes.map((node) => node.id));
  if (nodeIds.size !== city.nodes.length) return false;
  const validRoad = (road: Road) => record(road) && typeof road.id === 'string' && typeof road.name === 'string'
    && nodeIds.has(road.from) && nodeIds.has(road.to) && Number.isFinite(road.distanceMeters) && road.distanceMeters > 0
    && Number.isFinite(road.baseTimeSeconds) && road.baseTimeSeconds > 0
    && ['low', 'medium', 'high'].includes(road.congestion) && typeof road.blocked === 'boolean';
  if (!Array.isArray(city.roads) || !city.roads.length || !city.roads.every(validRoad)) return false;
  const roads = new Map(city.roads.map((road) => [road.id, road]));
  if (roads.size !== city.roads.length || (city.baselineRoads !== undefined
    && (!Array.isArray(city.baselineRoads) || city.baselineRoads.length !== city.roads.length
      || new Set(city.baselineRoads.map((road) => road?.id)).size !== roads.size
      || !city.baselineRoads.every((road) => validRoad(road) && roads.has(road.id))))) return false;
  if (!Array.isArray(city.signals) || !city.signals.every((signal) => record(signal) && typeof signal.id === 'string'
    && nodeIds.has(signal.nodeId) && ['red', 'yellow', 'green'].includes(signal.state) && ['normal', 'manual', 'emergency'].includes(signal.mode))) return false;
  const validFacilities = (items: CityData['hospitals']) => Array.isArray(items) && items.length > 0
    && items.every((facility) => record(facility) && typeof facility.id === 'string' && typeof facility.name === 'string' && nodeIds.has(facility.nodeId));
  if (!validFacilities(city.hospitals) || !validFacilities(city.bases) || !Array.isArray(city.scenarios)
    || !city.scenarios.every((scenario) => record(scenario) && typeof scenario.id === 'string' && typeof scenario.name === 'string'
      && typeof scenario.description === 'string' && ['accident', 'construction', 'rain', 'heavy-rain', 'flood', 'congestion', 'blockage'].includes(scenario.type)
      && ['low', 'medium', 'high'].includes(scenario.severity)
      && (scenario.roadId === undefined || roads.has(scenario.roadId)) && (scenario.nodeId === undefined || nodeIds.has(scenario.nodeId)))) return false;
  if (!record(city.adjacency) || !Object.keys(city.adjacency).length) return false;
  return Object.entries(city.adjacency).every(([from, edges]) => nodeIds.has(from) && Array.isArray(edges)
    && edges.every((edge) => {
      if (!record(edge) || typeof edge.roadId !== 'string' || typeof edge.to !== 'string' || !nodeIds.has(edge.to)) return false;
      const road = roads.get(edge.roadId);
      return road && ((road.from === from && road.to === edge.to) || (road.to === from && road.from === edge.to));
    }));
}

export function cityWithoutIncidentEffects(city: CityData, fallbackRoads: Road[]): CityData {
  return { ...city, roads: city.baselineRoads ?? city.roads.map((road) => {
    // Older services only expose derived road conditions. Restore those two
    // fields without discarding service geometry, names, or travel times.
    const baseline = fallbackRoads.find((item) => item.id === road.id);
    return baseline ? { ...road, blocked: baseline.blocked, congestion: baseline.congestion } : road;
  }) };
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
