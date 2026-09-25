import { useState } from 'react';
import type { TrafficForecast } from '../../services/apiClient';
import type { PredictionSource } from './usePredictions';
import type { PredictionSettings } from './predictionModel';

interface PredictionPanelProps {
  predictions: TrafficForecast[];
  source: PredictionSource;
  settings: PredictionSettings;
  onSettings: (patch: Partial<PredictionSettings>) => void;
  onRefresh: () => void;
  onFocus: (areaId: string) => void;
}

const areaName = (id: string) => id === 'MG-ROAD' ? 'MG Road' : id.replaceAll('-', ' ').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());

export function PredictionPanel({ predictions, source, settings, onSettings, onRefresh, onFocus }: PredictionPanelProps) {
  const [selectedRoadId, setSelectedRoadId] = useState('R5');
  const selected = predictions.find((item) => item.roadId === selectedRoadId) ?? predictions[0];
  const highRiskCount = predictions.filter((item) => item.predictedCongestion === 'high' || item.predictedCongestion === 'severe').length;
  return <section className="panel forecast-panel" aria-labelledby="forecast-title">
    <div className="forecast-heading">
      <div><span className="eyebrow">Future traffic · next 30 demo minutes</span><h2 id="forecast-title">Prediction desk</h2><p>Six graph corridors, scored from selected demo time, weather, congestion, and active incidents.</p></div>
      <div className="forecast-heading-side"><span className="forecast-source" role="status">{source === 'service' ? 'FastAPI rule engine' : source === 'loading' ? 'Updating forecast…' : 'Local rule fallback · AI service offline'}</span><button className="button button-secondary" type="button" onClick={onRefresh} aria-label="Recalculate traffic forecasts">Recalculate</button></div>
    </div>
    <div className="forecast-controls" aria-label="Forecast demo assumptions">
      <label>Demo time<input type="time" value={settings.timeOfDay} onChange={(event) => onSettings({ timeOfDay: event.target.value || '18:00' })} /></label>
      <label>Day<select value={settings.dayType} onChange={(event) => onSettings({ dayType: event.target.value as PredictionSettings['dayType'] })}><option value="weekday">Weekday</option><option value="weekend">Weekend</option></select></label>
      <label>Weather<select value={settings.weather} onChange={(event) => onSettings({ weather: event.target.value as PredictionSettings['weather'] })}><option value="clear">Clear</option><option value="rain">Rain</option><option value="heavy-rain">Heavy rain</option></select></label>
      <label className="forecast-check"><input type="checkbox" checked={settings.isHoliday} onChange={(event) => onSettings({ isHoliday: event.target.checked })} /> Holiday</label>
      <label className="forecast-check"><input type="checkbox" checked={settings.eventNearby} onChange={(event) => onSettings({ eventNearby: event.target.checked })} /> Event nearby</label>
      <label className="forecast-check forecast-route-check"><input type="checkbox" checked={settings.routingEnabled} onChange={(event) => onSettings({ routingEnabled: event.target.checked })} /> Apply forecast cost to demo routes</label>
    </div>
    {predictions.length === 0 ? <p className="forecast-empty" role="status">No graph roads are available for forecasting. Restore the shared demo city data to retry.</p> : <>
      <div className="forecast-summary"><strong>{highRiskCount} of {predictions.length}</strong><span>corridors have high or severe future risk</span><small>Risk overlay appears on the operations map · all values are heuristic</small></div>
      <div className="forecast-card-grid" aria-label="Predicted road risk">
        {predictions.map((item) => <button key={item.roadId} type="button" className={`forecast-card ${item.predictedCongestion}${selected?.roadId === item.roadId ? ' selected' : ''}`} aria-pressed={selected?.roadId === item.roadId} onClick={() => { setSelectedRoadId(item.roadId); onFocus(item.areaId); }}>
          <span className="forecast-card-top"><span>{areaName(item.areaId)}</span><span className={`forecast-risk ${item.predictedCongestion}`}>{item.predictedCongestion}</span></span>
          <strong>{item.riskScore}<small>/100 risk</small></strong>
          <span className="forecast-card-foot">{item.roadId} · +{item.etaImpactMinutes} min area impact</span>
        </button>)}
      </div>
      {selected && <div className="forecast-detail" aria-live="polite">
        <div className="forecast-detail-main"><span className="eyebrow">Selected corridor · {selected.predictionWindow}</span><h3>{areaName(selected.areaId)} <span>{selected.roadId}</span></h3><p><strong>{selected.predictedCongestion.toUpperCase()}</strong> future risk · {selected.confidence} heuristic confidence · +{selected.etaImpactMinutes} min area estimate</p><div className="forecast-factors">{selected.factors.map((factor) => <span key={factor}>{factor}</span>)}</div></div>
        <div className="forecast-recommendations"><p><span>Operator pre-action</span>{selected.operatorRecommendation}</p><p><span>Route guidance</span>{selected.routingRecommendation}</p></div>
      </div>}
    </>}
    <p className="forecast-disclaimer">Demo-only heuristic prediction from mock city data. It is not a live forecast or a trained ML model. Route penalties apply only in this browser demo.</p>
  </section>;
}

export function PredictionInsight({ predictions, source, routeRoadIds, highlightedRoadIds = [], routeMessage }: { predictions: TrafficForecast[]; source: PredictionSource; routeRoadIds: string[]; highlightedRoadIds?: string[]; routeMessage?: string }) {
  const upcoming = predictions.find((item) => routeRoadIds.includes(item.roadId) && (item.predictedCongestion === 'high' || item.predictedCongestion === 'severe'));
  const highlighted = predictions.filter((item) => highlightedRoadIds.includes(item.roadId)).sort((left, right) => right.riskScore - left.riskScore)[0];
  const leading = highlighted ?? upcoming ?? predictions.find((item) => item.predictedCongestion === 'severe') ?? predictions[0];
  return <section className="panel prediction-insight" aria-labelledby="prediction-insight-title">
    <div className="panel-heading-row"><div><span className="eyebrow">Next 30 demo minutes · heuristic</span><h2 id="prediction-insight-title">Traffic outlook</h2></div><span className="forecast-source">{source === 'service' ? 'FastAPI' : source === 'loading' ? 'Updating…' : 'Local fallback'}</span></div>
    {leading ? <><p className="prediction-insight-line"><span className={`forecast-risk ${leading.predictedCongestion}`}>{leading.predictedCongestion}</span><strong>{areaName(leading.areaId)}</strong><span>{leading.riskScore}/100 risk</span></p><p>{routeRoadIds.includes(leading.roadId) ? `Ahead on ${leading.roadId}: ${leading.factors.join(', ')}.` : `${leading.factors.join(', ')}. This risk is outside the current corridor.`}</p>{routeMessage && <p className="prediction-route-note">{routeMessage}</p>}</> : <p>No forecast areas are available in the demo graph.</p>}
    <small>Mock prediction only · no live traffic feed</small>
  </section>;
}
