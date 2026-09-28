import type { CityData, IncidentRecord } from '../../services/apiClient';
import type { HazardType, RoadHazard } from './dynamicRouting';

export const LOCAL_INCIDENTS_KEY = 'vialert-phase5-operator-incidents';
export const LOCAL_INCIDENTS_EVENT = 'vialert:local-incidents';

export function readBrowserIncidents(): IncidentRecord[] {
  try { return typeof window === 'undefined' ? [] : readLocalIncidents(window.localStorage); }
  catch { return []; }
}

export function writeBrowserIncidents(incidents: IncidentRecord[]): boolean {
  try {
    if (typeof window === 'undefined' || !writeLocalIncidents(window.localStorage, incidents)) return false;
    window.dispatchEvent(new Event(LOCAL_INCIDENTS_EVENT));
    return true;
  } catch { return false; }
}

export function readLocalIncidents(storage: Pick<Storage, 'getItem'>): IncidentRecord[] {
  try {
    const parsed: unknown = JSON.parse(storage.getItem(LOCAL_INCIDENTS_KEY) ?? '[]');
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is IncidentRecord => Boolean(item && typeof item === 'object'
      && typeof item.id === 'string' && typeof item.roadId === 'string'
      && typeof item.type === 'string' && ['accident', 'construction', 'rain', 'heavy-rain', 'flood', 'congestion', 'blockage'].includes(item.type)
      && ['low', 'medium', 'high'].includes(item.severity) && typeof item.blocked === 'boolean'
      && typeof item.createdAt === 'string' && Number.isFinite(Date.parse(item.createdAt))
      && (item.origin === undefined || item.origin === 'operator' || item.origin === 'simulation')));
  } catch { return []; }
}

export function writeLocalIncidents(storage: Pick<Storage, 'setItem'>, incidents: IncidentRecord[]): boolean {
  try { storage.setItem(LOCAL_INCIDENTS_KEY, JSON.stringify(incidents)); return true; }
  catch { return false; }
}

export function incidentToHazard(city: CityData, incident: IncidentRecord): RoadHazard & { type: Exclude<HazardType, 'heavy-rain'> } {
  const road = city.roads.find((item) => item.id === incident.roadId);
  const label = incident.type === 'heavy-rain' ? 'Heavy rain' : incident.type.replace('-', ' ');
  return {
    id: `incident-${incident.id}`,
    type: incident.type === 'heavy-rain' ? 'rain' : incident.type,
    name: `${label[0].toUpperCase()}${label.slice(1)}${road ? ` near ${road.name}` : ''}`,
    roadId: incident.roadId,
    severity: incident.severity,
    active: true,
    blocked: incident.blocked,
  };
}

export function sameIncidents(left: readonly IncidentRecord[], right: readonly IncidentRecord[]): boolean {
  const signature = (items: readonly IncidentRecord[]) => JSON.stringify(items.map((item) => [item.id, item.roadId, item.type, item.severity, item.blocked, item.origin, item.createdAt]).sort((a, b) => String(a[0]).localeCompare(String(b[0]))));
  return signature(left) === signature(right);
}
