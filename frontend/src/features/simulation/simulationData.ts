import type { CityData, ScenarioPreset } from '../../services/apiClient';
import type { Scenario, ScenarioSeverity, ScenarioType, VehicleConfiguration } from './simulationTypes';

const scenarioTypes: ScenarioType[] = ['accident', 'construction', 'rain', 'flood', 'congestion', 'blockage'];
const severities: ScenarioSeverity[] = ['low', 'medium', 'high'];

export const defaultVehicleConfiguration: VehicleConfiguration = {
  ambulanceId: 'AMB-07',
  vehicleNumber: 'KA-01-EM-2047',
  baseId: 'BASE-1',
  destinationId: 'HOSP-2',
  priority: 'critical',
};

function isScenarioType(value: string): value is ScenarioType {
  return scenarioTypes.includes(value as ScenarioType);
}

export function scenarioFromPreset(preset: ScenarioPreset): Scenario {
  const normalizedType = preset.type === 'heavy-rain' ? 'rain' : preset.type;
  return {
    id: preset.id,
    type: isScenarioType(normalizedType) ? normalizedType : 'congestion',
    name: preset.name,
    description: preset.description,
    ...(preset.nodeId ? { nodeId: preset.nodeId } : {}),
    ...(preset.roadId ? { roadId: preset.roadId } : {}),
    severity: severities.includes(preset.severity) ? preset.severity : 'medium',
    active: false,
    ...(preset.durationSeconds ? { durationSeconds: preset.durationSeconds } : {}),
    ...(preset.blocked ? { blocked: true } : {}),
  };
}

export function getScenarioTemplates(city: CityData): Scenario[] {
  return city.scenarios.map(scenarioFromPreset);
}

export const emptyRoute = {
  nodeIds: [] as string[],
  roadIds: [] as string[],
  totalDistanceMeters: 0,
  etaSeconds: 0,
};
