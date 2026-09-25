import rawExamples from '../../../../shared-data/prediction_inputs.json';
import type { CityData, ForecastInput, TrafficForecast } from '../../services/apiClient';
import type { RoutePlan } from '../ambulance/types';
import { getHazardAffectedRoadIds, type RoadHazard } from '../routing/dynamicRouting';

export interface PredictionSettings {
  timeOfDay: string;
  dayType: 'weekday' | 'weekend';
  weather: 'clear' | 'rain' | 'heavy-rain';
  isHoliday: boolean;
  eventNearby: boolean;
  routingEnabled: boolean;
}

export const PREDICTION_SETTINGS_KEY = 'vialert-phase6-prediction-settings';
export const DEFAULT_PREDICTION_SETTINGS: PredictionSettings = {
  timeOfDay: '18:00', dayType: 'weekday', weather: 'clear', isHoliday: false, eventNearby: false, routingEnabled: true,
};

const areaBaseline: Record<string, number> = { 'SILK-BOARD': 15, KORAMANGALA: 8, 'MG-ROAD': 6, INDIRANAGAR: 4, 'ELECTRONIC-CITY': 7, WHITEFIELD: 6 };
const incidentWeight = { accident: 24, construction: 14, flood: 35, congestion: 14, blockage: 30 } as const;
const disclaimer = 'Demo-only heuristic prediction using mock city data, not a live traffic forecast.';
const areaName = (id: string) => id === 'MG-ROAD' ? 'MG Road' : id.replaceAll('-', ' ').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());

export function readPredictionSettings(storage: Pick<Storage, 'getItem'>): PredictionSettings {
  try {
    const raw = storage.getItem(PREDICTION_SETTINGS_KEY);
    if (!raw) return DEFAULT_PREDICTION_SETTINGS;
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== 'object') return DEFAULT_PREDICTION_SETTINGS;
    const candidate = value as Partial<PredictionSettings>;
    return {
      timeOfDay: typeof candidate.timeOfDay === 'string' && /^([01][0-9]|2[0-3]):[0-5][0-9]$/.test(candidate.timeOfDay) ? candidate.timeOfDay : DEFAULT_PREDICTION_SETTINGS.timeOfDay,
      dayType: candidate.dayType === 'weekend' ? 'weekend' : 'weekday',
      weather: candidate.weather === 'rain' || candidate.weather === 'heavy-rain' ? candidate.weather : 'clear',
      isHoliday: candidate.isHoliday === true,
      eventNearby: candidate.eventNearby === true,
      routingEnabled: candidate.routingEnabled !== false,
    };
  } catch { return DEFAULT_PREDICTION_SETTINGS; }
}

export function buildForecastInputs(city: CityData, hazards: readonly RoadHazard[], settings: PredictionSettings): ForecastInput[] {
  const hour = Number(settings.timeOfDay.slice(0, 2));
  return rawExamples.flatMap((example) => {
    const road = city.roads.find((item) => item.id === example.roadId);
    if (!road || !city.nodes.some((node) => node.id === example.areaId)) return [];
    const relevant = hazards.filter((hazard) => hazard.active && getHazardAffectedRoadIds(city, hazard).has(road.id));
    const rain = relevant.find((hazard) => hazard.type === 'rain' || hazard.type === 'heavy-rain');
    const weather = rain ? 'rain' : settings.weather;
    const rainIntensity = rain ? rain.severity === 'high' ? 'heavy' : rain.severity === 'medium' ? 'moderate' : 'light'
      : settings.weather === 'heavy-rain' ? 'heavy' : settings.weather === 'rain' ? 'moderate' : 'none';
    const activeIncidents = [...new Set(relevant.map((hazard) => hazard.type).filter((type): type is ForecastInput['activeIncidents'][number] => type === 'accident' || type === 'construction' || type === 'flood' || type === 'congestion' || type === 'blockage'))].sort();
    return [{
      areaId: example.areaId,
      roadId: road.id,
      timeOfDay: settings.timeOfDay,
      dayType: settings.dayType,
      weather,
      rainIntensity,
      isHoliday: settings.isHoliday,
      officePeak: settings.dayType === 'weekday' && (hour >= 8 && hour <= 10 || hour >= 17 && hour <= 19),
      schoolPeak: hour >= 7 && hour <= 8 || hour >= 14 && hour <= 15,
      activeIncidents,
      roadConstruction: relevant.some((hazard) => hazard.type === 'construction'),
      floodRisk: relevant.some((hazard) => hazard.type === 'flood'),
      currentCongestion: road.congestion,
      eventNearby: settings.eventNearby,
      emergencyPriorityActive: city.signals.some((signal) => signal.mode === 'emergency' && (signal.nodeId === road.from || signal.nodeId === road.to)),
    } satisfies ForecastInput];
  });
}

export function predictLocally(input: ForecastInput): TrafficForecast {
  let risk = { low: 8, medium: 24, high: 45 }[input.currentCongestion] + (areaBaseline[input.areaId] ?? 3);
  const factors = [`${input.currentCongestion} current congestion`, `${areaName(input.areaId)} corridor baseline`];
  if (input.officePeak && input.dayType === 'weekday' && !input.isHoliday) { risk += 16; factors.push('weekday office peak'); }
  if (input.schoolPeak && !input.isHoliday) { risk += 7; factors.push('school travel period'); }
  if (input.isHoliday) { risk -= 8; factors.push('holiday reduces regular commute'); }
  if (input.weather !== 'clear') { risk += { none: 6, light: 6, moderate: 11, heavy: 18 }[input.rainIntensity]; factors.push(`${input.rainIntensity === 'none' ? 'light' : input.rainIntensity} rain`); }
  for (const incident of [...new Set(input.activeIncidents)].sort()) { risk += incidentWeight[incident]; factors.push(`active ${incident}`); }
  if (input.roadConstruction && !input.activeIncidents.includes('construction')) { risk += 14; factors.push('road construction'); }
  if (input.floodRisk && !input.activeIncidents.includes('flood')) { risk += 16; factors.push('flood risk'); }
  if (input.eventNearby) { risk += 16; factors.push('nearby event or festival'); }
  risk = Math.max(0, Math.min(100, risk));
  const predictedCongestion = risk >= 75 ? 'severe' : risk >= 50 ? 'high' : risk >= 25 ? 'medium' : 'low';
  let etaImpactMinutes = Math.max(0, Math.round((risk - 15) / 10));
  if (input.emergencyPriorityActive && etaImpactMinutes > 0) { etaImpactMinutes -= 1; factors.push('emergency signal priority reduces ETA impact'); }
  const [hour, minute] = input.timeOfDay.split(':').map(Number);
  const end = (hour * 60 + minute + 30) % 1440;
  const area = areaName(input.areaId);
  return {
    areaId: input.areaId, roadId: input.roadId, predictedCongestion, riskScore: risk, etaImpactMinutes,
    confidence: factors.length >= 6 ? 'high' : factors.length >= 3 ? 'medium' : 'low',
    predictionWindow: `${input.timeOfDay}–${String(Math.floor(end / 60)).padStart(2, '0')}:${String(end % 60).padStart(2, '0')}`,
    factors,
    operatorRecommendation: predictedCongestion === 'high' || predictedCongestion === 'severe'
      ? `Monitor ${area} and prepare simulated signal priority for approaching emergency vehicles.`
      : `Continue monitoring ${area}; no pre-action is needed in this demo.`,
    routingRecommendation: predictedCongestion === 'high' || predictedCongestion === 'severe'
      ? `Apply a forecast penalty to ${input.roadId}; prefer an alternate corridor if it is safer.`
      : `Keep ${input.roadId} available; monitor the next forecast window.`,
    disclaimer, demo: true, model: 'explainable-rules-v1',
  };
}

export function forecastCostMultipliers(predictions: readonly TrafficForecast[], enabled: boolean): Readonly<Record<string, number>> {
  if (!enabled) return {};
  return Object.fromEntries(predictions.filter((item) => item.predictedCongestion === 'high' || item.predictedCongestion === 'severe')
    .map((item) => [item.roadId, item.predictedCongestion === 'severe' ? 1.3 : 1.15]));
}

export function combineCostMultipliers(...layers: Readonly<Record<string, number>>[]): Readonly<Record<string, number>> {
  const result: Record<string, number> = {};
  for (const layer of layers) for (const [roadId, multiplier] of Object.entries(layer)) result[roadId] = (result[roadId] ?? 1) * multiplier;
  return result;
}

export function explainForecastRouteEffect(city: CityData, before: RoutePlan | null, after: RoutePlan | null, predictions: readonly TrafficForecast[], enabled: boolean): string {
  if (!enabled || !before || !after) return '';
  const forecast = predictions.find((item) => (item.predictedCongestion === 'high' || item.predictedCongestion === 'severe') && before.roadIds.includes(item.roadId));
  if (!forecast) return '';
  const roadName = city.roads.find((road) => road.id === forecast.roadId)?.name ?? forecast.roadId;
  const minutes = Math.max(0, Math.round((after.etaSeconds - before.etaSeconds) / 60));
  return before.roadIds.join('|') === after.roadIds.join('|')
    ? `Forecast ${forecast.predictedCongestion} risk on ${roadName} adds about ${minutes} min to the demo route.`
    : `Forecast ${forecast.predictedCongestion} risk on ${roadName} selected an alternate corridor; demo ETA changed by ${minutes} min.`;
}
