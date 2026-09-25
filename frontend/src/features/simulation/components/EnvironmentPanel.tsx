import { applyScenarioEffects } from '../simulationEngine';
import type { CityData } from '../../ambulance/types';
import type { Scenario, SimulationState } from '../simulationTypes';

interface EnvironmentPanelProps {
  city: CityData;
  state: SimulationState;
}

const displayNames: Record<Scenario['type'], string> = {
  accident: 'Accident', construction: 'Construction', rain: 'Heavy rain', flood: 'Flood warning', congestion: 'Congestion', blockage: 'Road blockage',
};

export function EnvironmentPanel({ city, state }: EnvironmentPanelProps) {
  const active = [...state.scenarios, ...state.externalScenarios].filter((scenario) => scenario.active);
  const effects = applyScenarioEffects(city, active);
  const blockedCount = effects.city.roads.filter((road) => road.blocked).length;
  const slowCount = effects.affectedRoadIds.size - blockedCount;
  const hasRain = active.some((scenario) => scenario.type === 'rain');
  const hasFlood = active.some((scenario) => scenario.type === 'flood');

  return <section className="panel environment-panel" aria-labelledby="environment-panel-title">
    <div className="panel-heading-row"><div><span className="eyebrow">City conditions · mock</span><h2 id="environment-panel-title">Environment &amp; roads</h2></div><span className={`environment-state ${active.length ? 'warning' : ''}`}><i aria-hidden="true" />{active.length ? 'Condition active' : 'Clear demo baseline'}</span></div>
    <div className="environment-metrics">
      <div><span>Weather</span><strong>{hasRain ? 'Heavy rain' : 'Clear'}</strong><small>Simulated conditions</small></div>
      <div><span>Affected roads</span><strong>{effects.affectedRoadIds.size}</strong><small>{blockedCount} blocked · {Math.max(0, slowCount)} slowed</small></div>
    </div>
    {hasFlood && <p className="environment-alert" role="status">Flood warning active. Affected segments are unavailable to the route planner.</p>}
    {active.length > 0
      ? <ul className="environment-scenario-list">{active.map((scenario) => <li key={scenario.id}><span className={`severity-mark severity-${scenario.severity}`} aria-hidden="true">{scenario.severity === 'high' ? '!' : '•'}</span><div><strong>{displayNames[scenario.type]} · {scenario.severity}</strong><span>{scenario.name}</span></div></li>)}</ul>
      : <p className="environment-empty">Activate a scenario or operator incident to see its local roadway effect here.</p>}
    <p className="panel-footnote">Every condition and road-cost change is deterministic mock data.</p>
  </section>;
}
