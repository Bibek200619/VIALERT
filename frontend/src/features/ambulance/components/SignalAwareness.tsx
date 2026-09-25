import { formatDistance } from '../ambulanceData';
import type { UpcomingSignal } from '../types';

interface SignalAwarenessProps {
  signals: UpcomingSignal[];
}

export function SignalAwareness({ signals }: SignalAwarenessProps) {
  return <section className="panel signal-awareness" aria-labelledby="signal-awareness-title">
    <div className="panel-heading-row"><div><span className="eyebrow">On this route</span><h2 id="signal-awareness-title">Signal awareness</h2></div><span className="quiet-badge">Status only</span></div>
    <p className="panel-description">Mock signal state from the shared city data. No signal controls are connected.</p>
    {signals.length ? <ul className="signal-list">
      {signals.slice(0, 4).map(({ signal, name, distanceMeters }) => <li className="signal-row" key={signal.id}>
        <span className={`signal-icon ${signal.state}`} aria-hidden="true"><i /><i /><i /></span>
        <div className="signal-name"><strong>{name}</strong><span>{formatDistance(distanceMeters)} ahead · {signal.id}</span></div>
        <div className="signal-state"><strong className={`signal-state-text ${signal.state}`}>{signal.state.toUpperCase()}</strong><span>{signal.state === 'green' ? 'Green expected' : 'Not green now'}</span></div>
        <span className="priority-awareness">Priority<br />demo</span>
      </li>)}
    </ul> : <div className="signal-empty"><strong>No signals on the selected route</strong><p>Signal awareness appears when a route passes a signal node in the demo graph.</p></div>}
    <p className="signal-footnote">“Priority” describes dashboard awareness only; no signal is changed.</p>
  </section>;
}
