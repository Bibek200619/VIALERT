import { WorkspacePlaceholder } from '../../components/WorkspacePlaceholder';

export function AmbulanceDashboard() {
  return <WorkspacePlaceholder
    icon="ambulance"
    label="Driver workspace"
    title="A clearer path to care."
    description="A dedicated space for the ambulance crew. Route guidance, hospital destinations, and signal awareness will come together here."
    phase="Next up · Phase 2"
    capabilities={[
      { title: 'Route overview', description: 'Base, destination, and city map.' },
      { title: 'Signal awareness', description: 'Upcoming junctions at a glance.' },
      { title: 'Driver guidance', description: 'A focused view of the journey.' },
    ]}
  />;
}
