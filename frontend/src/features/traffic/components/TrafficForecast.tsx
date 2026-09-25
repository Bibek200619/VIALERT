import { useState } from 'react';
import type { TrafficForecast as TrafficForecastRecord } from '../../../services/apiClient';
import type { PredictionSource } from '../../prediction/usePredictions';
import type { PredictionSettings } from '../../prediction/predictionModel';

const areaName = (id: string) => id === 'MG-ROAD' ? 'MG Road' : id.replaceAll('-', ' ').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());

export function TrafficForecast({ id, predictions, source, settings, routeRoadIds, onSettings, onRefresh, onFocus }: {
  id?: string;
  predictions: TrafficForecastRecord[];
  source: PredictionSource;
  settings: PredictionSettings;
  routeRoadIds: string[];
  onSettings: (patch: Partial<PredictionSettings>) => void;
  onRefresh: () => void;
  onFocus: (areaId: string) => void;
}) {
  const [selectedRoadId, setSelectedRoadId] = useState<string>();
  const selected = predictions.find((item) => item.roadId === selectedRoadId) ?? predictions.find((item) => routeRoadIds.includes(item.roadId)) ?? predictions[0];
  const highRiskCount = predictions.filter((item) => item.predictedCongestion === 'high' || item.predictedCongestion === 'severe').length;
  const riskLabel = selected?.predictedCongestion === 'severe' ? 'Critical' : selected?.predictedCongestion === 'high' ? 'High' : selected?.predictedCongestion === 'medium' ? 'Moderate' : 'Low';
  return <section className="panel traffic-forecast-panel" id={id} aria-labelledby="traffic-forecast-title">
    <div className="traffic-section-heading"><div><span className="eyebrow">Next 30 demo minutes</span><h2 id="traffic-forecast-title">Traffic risk</h2></div><button className="traffic-icon-button" type="button" onClick={onRefresh} aria-label="Recalculate traffic forecast" title="Recalculate forecast">↻</button></div>
    {!selected ? <p className="traffic-empty">No forecast corridors are available.</p> : <>
      <div className="traffic-risk-summary"><div><strong>{selected.riskScore}</strong><span>/100</span></div><span className={`traffic-risk-label ${selected.predictedCongestion}`}>{riskLabel}</span><small>{selected.predictionWindow} · {areaName(selected.areaId)}</small></div>
      <div className="traffic-risk-bar" aria-label={`Traffic risk ${selected.riskScore} out of 100`}><span style={{ width: `${Math.min(100, Math.max(0, selected.riskScore))}%` }} /></div>
      <div className="traffic-forecast-factors"><div><span>Factors</span><p>{selected.factors.slice(0, 3).join(' · ') || 'Baseline corridor conditions'}</p></div><div><span>Recommendation</span><p>{selected.operatorRecommendation}</p></div></div>
      <div className="traffic-forecast-corridors" aria-label="Forecast corridors">{predictions.slice(0, 6).map((item) => <button key={item.roadId} type="button" className={selected.roadId === item.roadId ? 'selected' : ''} onClick={() => { setSelectedRoadId(item.roadId); onFocus(item.areaId); }} aria-pressed={selected.roadId === item.roadId}><span>{areaName(item.areaId)}</span><strong>{item.riskScore}</strong></button>)}</div>
      <details className="traffic-forecast-settings"><summary>Forecast assumptions · {highRiskCount} high risk corridors</summary><div className="traffic-forecast-settings-grid"><label>Time<input type="time" value={settings.timeOfDay} onChange={(event) => onSettings({ timeOfDay: event.target.value || '18:00' })} /></label><label>Weather<select value={settings.weather} onChange={(event) => onSettings({ weather: event.target.value as PredictionSettings['weather'] })}><option value="clear">Clear</option><option value="rain">Rain</option><option value="heavy-rain">Heavy rain</option></select></label><label className="forecast-check"><input type="checkbox" checked={settings.routingEnabled} onChange={(event) => onSettings({ routingEnabled: event.target.checked })} />Apply to route</label></div></details>
      <small className="traffic-forecast-source">{source === 'service' ? 'FastAPI rule engine' : source === 'loading' ? 'Updating forecast…' : 'Local rule fallback · simulated'}</small>
    </>}
  </section>;
}
