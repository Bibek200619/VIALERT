import { useState } from 'react';
import { formatSimulationTime } from '../../ambulance/ambulanceData';
import type { OperationsEvent } from '../trafficTypes';

export function EventLog({ events, onClear }: { events: OperationsEvent[]; onClear: () => void }) {
  const [filter, setFilter] = useState('all');
  const visible = events.filter((event) => filter === 'all' || event.category === filter);
  return <section className="panel traffic-event-panel" aria-labelledby="traffic-event-title">
    <div className="traffic-panel-heading"><span className="eyebrow">Demo activity</span><h2 id="traffic-event-title">Event log</h2><p>Node operator actions and same-browser simulation events.</p></div>
    <div className="traffic-event-tools"><label>Category<select value={filter} onChange={(event) => setFilter(event.target.value)}><option value="all">All events</option>{['vehicle', 'signal', 'incident', 'route', 'alert'].map((category) => <option key={category} value={category}>{category}</option>)}</select></label><button type="button" onClick={onClear} disabled={events.length === 0}>Clear demo log</button></div>
    <ol className="traffic-event-list">{visible.length === 0 ? <li className="traffic-empty">No events in this view.</li> : visible.map((event) => <li key={event.id} className={`traffic-event-item ${event.severity}`}><time>{event.simulationTimeSeconds === undefined ? new Date(event.timestamp).toLocaleTimeString() : `T+${formatSimulationTime(event.simulationTimeSeconds)}`}</time><span>{event.subject}</span><p>{event.message}</p></li>)}</ol>
  </section>;
}
