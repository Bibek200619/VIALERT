import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { demoCityData, findRoute } from '../ambulance/ambulanceData';
import { buildDynamicGraph, type RoadHazard } from '../routing/dynamicRouting';
import { PredictionInsight, PredictionPanel } from './PredictionPanel';
import { buildForecastInputs, combineCostMultipliers, DEFAULT_PREDICTION_SETTINGS, explainForecastRouteEffect, forecastCostMultipliers, predictLocally, readPredictionSettings } from './predictionModel';

const inputs = buildForecastInputs(demoCityData, [], DEFAULT_PREDICTION_SETTINGS);
const silkBoard = inputs.find((input) => input.areaId === 'SILK-BOARD')!;

describe('Phase 6 prediction model and presentation', () => {
  it('uses six existing graph roads and preserves safe settings defaults', () => {
    expect(inputs).toHaveLength(6);
    expect(new Set(inputs.map((input) => input.roadId)).size).toBe(6);
    expect(readPredictionSettings({ getItem: () => '{invalid' })).toEqual(DEFAULT_PREDICTION_SETTINGS);
    expect(readPredictionSettings({ getItem: () => { throw new Error('Storage disabled'); } })).toEqual(DEFAULT_PREDICTION_SETTINGS);
    expect(readPredictionSettings({ getItem: () => JSON.stringify({ weather: 'heavy-rain', routingEnabled: false }) }).weather).toBe('heavy-rain');
  });

  it('raises risk for office peak, rain, accidents and flood, while priority lowers ETA', () => {
    const offPeak = predictLocally({ ...silkBoard, officePeak: false });
    const peak = predictLocally(silkBoard);
    const rain = predictLocally({ ...silkBoard, weather: 'rain', rainIntensity: 'heavy' });
    const accident = predictLocally({ ...silkBoard, activeIncidents: ['accident'] });
    const flood = predictLocally({ ...silkBoard, activeIncidents: ['flood'] });
    expect(peak.riskScore).toBeGreaterThan(offPeak.riskScore);
    expect(rain.riskScore).toBeGreaterThan(peak.riskScore);
    expect(accident.predictedCongestion).toBe('severe');
    expect(flood.predictedCongestion).toBe('severe');
    expect(predictLocally({ ...silkBoard, emergencyPriorityActive: true }).etaImpactMinutes).toBe(peak.etaImpactMinutes - 1);
    expect(accident.factors).toContain('active accident');
  });

  it('uses the same active incident and derived congestion in dashboard inputs', () => {
    const hazard: RoadHazard = { id: 'test-accident', name: 'Accident on R3', type: 'accident', roadId: 'R3', severity: 'high', active: true };
    const affectedCity = buildDynamicGraph(demoCityData, [hazard]).city;
    const input = buildForecastInputs(affectedCity, [hazard], DEFAULT_PREDICTION_SETTINGS).find((item) => item.roadId === 'R3')!;
    expect(input.currentCongestion).toBe('high');
    expect(input.activeIncidents).toEqual(['accident']);
    expect(predictLocally(input).predictedCongestion).toBe('severe');
  });

  it('applies transparent route penalties and explains affected corridors', () => {
    const road = inputs.find((input) => input.roadId === 'R3')!;
    const forecast = predictLocally({ ...road, weather: 'rain', rainIntensity: 'heavy' });
    expect(['high', 'severe']).toContain(forecast.predictedCongestion);
    const baseline = findRoute(demoCityData, 'BASE-1', 'HOSP-2');
    const multipliers = forecastCostMultipliers([forecast], true);
    const adjusted = findRoute(demoCityData, 'BASE-1', 'HOSP-2', { roadCostMultipliers: combineCostMultipliers(multipliers) });
    expect(baseline?.roadIds).toContain('R3');
    expect(adjusted?.etaSeconds).toBeGreaterThan(baseline!.etaSeconds);
    expect(explainForecastRouteEffect(demoCityData, baseline, adjusted, [forecast], true)).toContain('Forecast');
    expect(forecastCostMultipliers([forecast], false)).toEqual({});
  });

  it('renders six risk cards, recommendation, and honest fallback/empty states', () => {
    const predictions = inputs.map(predictLocally);
    const markup = renderToStaticMarkup(<PredictionPanel predictions={predictions} source="local-fallback" settings={DEFAULT_PREDICTION_SETTINGS} onSettings={() => undefined} onRefresh={() => undefined} onFocus={() => undefined} />);
    expect((markup.match(/class="forecast-card /g) ?? [])).toHaveLength(6);
    expect(markup).toContain('Local rule fallback · AI service offline');
    expect(markup).toContain('Operator pre-action');
    expect(markup).toContain('not a live forecast');
    const empty = renderToStaticMarkup(<PredictionPanel predictions={[]} source="loading" settings={DEFAULT_PREDICTION_SETTINGS} onSettings={() => undefined} onRefresh={() => undefined} onFocus={() => undefined} />);
    expect(empty).toContain('No graph roads are available');
    const insight = renderToStaticMarkup(<PredictionInsight predictions={predictions} source="service" routeRoadIds={['R5']} routeMessage="Forecast route adjusted" />);
    expect(insight).toContain('Forecast route adjusted');
  });
});
