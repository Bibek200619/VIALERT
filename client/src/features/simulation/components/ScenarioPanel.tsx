import { useEffect, useState } from 'react';
import type { CityData } from '../../ambulance/types';
import type { Scenario, ScenarioSeverity, SimulationState } from '../simulationTypes';

interface ScenarioPanelProps {
  city: CityData;
  templates: Scenario[];
  state: SimulationState;
  onSelect: (scenarioId: string | null) => void;
  onActivate: (template: Scenario, roadId?: string, nodeId?: string, severity?: ScenarioSeverity) => void;
  onDeactivate: (scenarioId: string) => void;
  onRemove: (scenarioId: string) => void;
}

const typeLabels: Record<Scenario['type'], string> = {
  accident: 'Accident', construction: 'Road construction', rain: 'Heavy rain', flood: 'Flood', congestion: 'Traffic congestion', blockage: 'Road blockage',
};

export function ScenarioPanel({ city, templates, state, onSelect, onActivate, onDeactivate, onRemove }: ScenarioPanelProps) {
  const [selectedTemplateId, setSelectedTemplateId] = useState(templates[0]?.id ?? '');
  const [targetType, setTargetType] = useState<'road' | 'node'>('road');
  const [targetId, setTargetId] = useState(templates[0]?.roadId ?? city.roads[0]?.id ?? '');
  const [severity, setSeverity] = useState<ScenarioSeverity>(templates[0]?.severity ?? 'medium');
  const selectedTemplate = templates.find((scenario) => scenario.id === selectedTemplateId) ?? templates[0];
  const disabled = state.status === 'running';
  const activeScenarios = state.scenarios.filter((scenario) => scenario.active);

  useEffect(() => {
    if (!selectedTemplate) return;
    setSeverity(selectedTemplate.severity);
    setTargetType(selectedTemplate.nodeId && !selectedTemplate.roadId ? 'node' : 'road');
    setTargetId(selectedTemplate.roadId ?? selectedTemplate.nodeId ?? city.roads[0]?.id ?? '');
  }, [selectedTemplateId, city.nodes, city.roads, selectedTemplate]);

  useEffect(() => {
    const validIds = targetType === 'road' ? city.roads.map((road) => road.id) : city.nodes.map((node) => node.id);
    if (!validIds.includes(targetId)) setTargetId(validIds[0] ?? '');
  }, [city.nodes, city.roads, targetId, targetType]);

  function selectTemplate(id: string) {
    setSelectedTemplateId(id);
    onSelect(id);
  }

  function activateSelected() {
    if (!selectedTemplate) return;
    onActivate(selectedTemplate, targetType === 'road' ? targetId : undefined, targetType === 'node' ? targetId : undefined, severity);
  }

  return <section className="panel scenario-panel" aria-labelledby="scenario-panel-title">
    <div className="panel-heading-row"><div><span className="eyebrow">Incident studio · simulated only</span><h2 id="scenario-panel-title">Scenario controls</h2></div><span className="scenario-count">{activeScenarios.length} active</span></div>
    <p className="panel-description">Apply a local mock condition to a shared road or junction. No real traffic or signal systems are affected.</p>
    <div className="scenario-form">
      <label>Scenario preset<select value={selectedTemplate?.id ?? ''} disabled={disabled || templates.length === 0} onChange={(event) => selectTemplate(event.target.value)}>
        {templates.map((scenario) => <option key={scenario.id} value={scenario.id}>{typeLabels[scenario.type]} · {scenario.name}</option>)}
      </select></label>
      <div className="scenario-location-row">
        <label>Location type<select value={targetType} disabled={disabled} onChange={(event) => {
          const nextType = event.target.value as 'road' | 'node';
          setTargetType(nextType);
          setTargetId(nextType === 'road' ? city.roads[0]?.id ?? '' : city.nodes[0]?.id ?? '');
        }}><option value="road">Road segment</option><option value="node">Map junction</option></select></label>
        <label>{targetType === 'road' ? 'Affected road' : 'Affected junction'}<select value={targetId} disabled={disabled} onChange={(event) => setTargetId(event.target.value)}>
          {targetType === 'road'
            ? city.roads.map((road) => <option key={road.id} value={road.id}>{road.name}</option>)
            : city.nodes.map((node) => <option key={node.id} value={node.id}>{node.name.replace(' (demo)', '')}</option>)}
        </select></label>
      </div>
      <div className="scenario-activate-row">
        <label>Severity<select value={severity} disabled={disabled} onChange={(event) => setSeverity(event.target.value as ScenarioSeverity)}>
          <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
        </select></label>
        <button className="button button-primary" type="button" onClick={activateSelected} disabled={disabled || !selectedTemplate || !targetId}>Activate scenario</button>
      </div>
    </div>
    <div className={`route-impact impact-${state.routeStatus}`} role={state.routeStatus === 'unavailable' ? 'alert' : 'status'}>
      <span className="eyebrow">Route impact · {state.routeStatus}</span><p>{state.routeMessage}</p>
    </div>
    <div className="scenario-list-heading"><span>Scenario ledger</span><span>{state.scenarios.length} configured</span></div>
    {state.scenarios.length === 0
      ? <p className="scenario-empty">No scenarios are configured. Choose a preset above to add one.</p>
      : <ul className="scenario-list">
        {state.scenarios.map((scenario) => {
          const road = city.roads.find((candidate) => candidate.id === scenario.roadId);
          const node = city.nodes.find((candidate) => candidate.id === scenario.nodeId);
          return <li key={scenario.id} className={scenario.active ? 'active' : ''}>
            <div className="scenario-list-copy">
              <span className={`severity-mark severity-${scenario.severity}`} aria-hidden="true">{scenario.severity === 'high' ? '!' : scenario.severity === 'medium' ? '•' : 'i'}</span>
              <div><strong>{scenario.name}</strong><span>{typeLabels[scenario.type]} · {scenario.severity} severity · {road?.name ?? node?.name.replace(' (demo)', '') ?? 'demo area'}</span></div>
            </div>
            <div className="scenario-row-actions">
              {scenario.active
                ? <button className="text-button" type="button" onClick={() => onDeactivate(scenario.id)} disabled={disabled} aria-label={`Deactivate ${scenario.name}`}>Deactivate</button>
                : <button className="text-button" type="button" onClick={() => onActivate(scenario, scenario.roadId, scenario.nodeId, scenario.severity)} disabled={disabled} aria-label={`Activate ${scenario.name}`}>Activate</button>}
              <button className="text-button remove" type="button" onClick={() => onRemove(scenario.id)} disabled={disabled} aria-label={`Remove ${scenario.name}`}>Remove</button>
            </div>
          </li>;
        })}
      </ul>}
  </section>;
}
