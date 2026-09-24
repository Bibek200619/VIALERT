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
  scenarios: { id: string; name: string; type: string }[];
  demo: true;
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
  return Array.isArray(city.nodes) && Array.isArray(city.roads) && Array.isArray(city.signals)
    && Array.isArray(city.hospitals) && Array.isArray(city.bases)
    && city.adjacency !== null && typeof city.adjacency === 'object';
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
  createEmergency: (payload: EmergencyRequest, signal?: AbortSignal) =>
    request<{ emergency: EmergencyRecord; demo: true }>(`${nodeBaseUrl}/api/emergencies`, signal, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),
  resetSimulation: (signal?: AbortSignal) => request<{ status: 'reset'; demo: true }>(`${nodeBaseUrl}/api/simulation/reset`, signal, {
    method: 'POST',
  }),
  getAiHealth: (signal?: AbortSignal) => request<HealthResponse>(`${aiBaseUrl}/health`, signal),
};
