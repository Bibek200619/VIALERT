import { useEffect, useMemo, useState } from 'react';
import { apiClient, type CityData, type TrafficForecast } from '../../services/apiClient';
import type { RoadHazard } from '../routing/dynamicRouting';
import { buildForecastInputs, DEFAULT_PREDICTION_SETTINGS, forecastCostMultipliers, predictLocally, PREDICTION_SETTINGS_KEY, readPredictionSettings, type PredictionSettings } from './predictionModel';

export type PredictionSource = 'loading' | 'service' | 'local-fallback';

function initialSettings() {
  if (typeof window === 'undefined') return DEFAULT_PREDICTION_SETTINGS;
  try { return readPredictionSettings(window.localStorage); }
  catch { return DEFAULT_PREDICTION_SETTINGS; }
}

export function usePredictions(city: CityData, hazards: readonly RoadHazard[]) {
  const [settings, setSettings] = useState<PredictionSettings>(initialSettings);
  const [source, setSource] = useState<PredictionSource>('loading');
  const [refreshIndex, setRefreshIndex] = useState(0);
  const inputKey = JSON.stringify(buildForecastInputs(city, hazards, settings));
  const inputs = useMemo(() => JSON.parse(inputKey) as ReturnType<typeof buildForecastInputs>, [inputKey]);
  const fallback = useMemo(() => inputs.map(predictLocally), [inputs]);
  const [predictions, setPredictions] = useState<TrafficForecast[]>(fallback);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === PREDICTION_SETTINGS_KEY) {
        try { setSettings(readPredictionSettings(window.localStorage)); }
        catch { setSettings(DEFAULT_PREDICTION_SETTINGS); }
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setPredictions(fallback);
    setSource('loading');
    void apiClient.predictBatch(inputs, controller.signal).then((response) => {
      if (controller.signal.aborted) return;
      const valid = response.predictions.length === inputs.length && response.predictions.every((item, index) => item.roadId === inputs[index].roadId && Number.isFinite(item.riskScore));
      if (valid) { setPredictions(response.predictions); setSource('service'); }
      else { setPredictions(fallback); setSource('local-fallback'); }
    }).catch(() => {
      if (!controller.signal.aborted) { setPredictions(fallback); setSource('local-fallback'); }
    });
    return () => controller.abort();
  }, [inputKey, refreshIndex]);

  function updateSettings(patch: Partial<PredictionSettings>) {
    setSettings((previous) => {
      const next = { ...previous, ...patch };
      try { window.localStorage.setItem(PREDICTION_SETTINGS_KEY, JSON.stringify(next)); } catch { /* Local view still works. */ }
      return next;
    });
  }

  const costMultipliers = useMemo(() => forecastCostMultipliers(predictions, settings.routingEnabled), [predictions, settings.routingEnabled]);
  return { settings, updateSettings, predictions, source, costMultipliers, refresh: () => setRefreshIndex((value) => value + 1) };
}
