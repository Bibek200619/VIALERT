import type { JourneyStatus } from '../types';

interface EmergencyStatusProps {
  journeyStatus: JourneyStatus;
  pendingDispatches: number;
}

export function EmergencyStatus({ journeyStatus, pendingDispatches }: EmergencyStatusProps) {
  const statusText = journeyStatus === 'active' ? 'Journey in progress' : journeyStatus === 'paused' ? 'Journey paused' : journeyStatus === 'completed' ? 'Destination reached' : 'Ready for demo dispatch';
  return <section className="panel emergency-status" aria-labelledby="emergency-status-title">
    <div className="panel-heading-row"><div><span className="eyebrow">Emergency status</span><h2 id="emergency-status-title">Priority response</h2></div><span className="priority-pill">P1</span></div>
    <div className="emergency-state"><span className="emergency-pulse" aria-hidden="true" /><strong>{statusText}</strong></div>
    <p>This is a local demo journey. It does not contact emergency dispatch or a real ambulance.</p>
    <div className="dispatch-count"><span>Mock dispatch records</span><strong>{pendingDispatches}</strong></div>
  </section>;
}
