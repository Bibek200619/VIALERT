export interface HealthResponse {
  status: 'ok';
  service: 'vialert-node' | 'vialert-ai';
  phase: 1;
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

const nodeBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');
const aiBaseUrl = (import.meta.env.VITE_AI_BASE_URL ?? '/ai').replace(/\/$/, '');

async function request<T>(url: string, signal?: AbortSignal): Promise<T> {
  const timeout = AbortSignal.timeout(5000);
  const response = await fetch(url, {
    signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) {
    throw new Error(`Request failed (${response.status})`);
  }
  return response.json() as Promise<T>;
}

export const apiClient = {
  getNodeHealth: (signal?: AbortSignal) =>
    request<HealthResponse>(`${nodeBaseUrl}/api/health`, signal),
  getCity: (signal?: AbortSignal) => request<CityData>(`${nodeBaseUrl}/api/city`, signal),
  getAiHealth: (signal?: AbortSignal) => request<HealthResponse>(`${aiBaseUrl}/health`, signal),
};
