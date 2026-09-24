import { formatSimulationTime } from '../../ambulance/ambulanceData';
import type { SimulationEvent, SimulationEventType } from '../simulationTypes';

interface EventTimelineProps {
  events: SimulationEvent[];
}

const labels: Record<SimulationEventType, string> = {
  simulation_started: 'Simulation started',
  simulation_paused: 'Simulation paused',
  simulation_resumed: 'Simulation resumed',
  simulation_reset: 'Simulation reset',
  scenario_restarted: 'Scenario restarted',
  default_route_restored: 'Default route restored',
  vehicle_configuration_changed: 'Vehicle updated',
  junction_passed: 'Junction passed',
  accident_activated: 'Accident activated',
  construction_activated: 'Construction activated',
  rain_activated: 'Heavy rain activated',
  flood_activated: 'Flood activated',
  congestion_activated: 'Congestion activated',
  blockage_activated: 'Road blockage activated',
  scenario_deactivated: 'Scenario deactivated',
  scenario_removed: 'Scenario removed',
  scenario_expired: 'Scenario expired',
  route_recalculated: 'Route recalculated',
  route_unavailable: 'No route available',
  signal_encountered: 'Signal encountered',
  hospital_reached: 'Hospital reached',
};

export function EventTimeline({ events }: EventTimelineProps) {
  const visibleEvents = events.slice(-80).reverse();
  return <section className="panel event-timeline" aria-labelledby="event-timeline-title">
    <div className="panel-heading-row"><div><span className="eyebrow">Replay log · local time</span><h2 id="event-timeline-title">Event timeline</h2></div><span className="timeline-count">{events.length} events</span></div>
    {visibleEvents.length === 0
      ? <div className="timeline-empty"><span aria-hidden="true">◷</span><p>Nothing logged yet.</p><span>Start the simulation or activate a scenario to populate the replay timeline.</span></div>
      : <ol className="timeline-list" aria-label="Simulation event timeline">
        {visibleEvents.map((event) => <li key={event.id} className={`timeline-event ${event.severity ? `severity-${event.severity}` : ''}`}>
          <time dateTime={`PT${event.timestampSeconds}S`}>{formatSimulationTime(event.timestampSeconds)}</time>
          <span className="timeline-marker" aria-hidden="true" />
          <div className="timeline-event-copy"><div><strong>{labels[event.type]}</strong>{event.severity && <span className={`event-severity severity-${event.severity}`}>{event.severity}</span>}</div><p>{event.message}</p></div>
        </li>)}
      </ol>}
  </section>;
}
