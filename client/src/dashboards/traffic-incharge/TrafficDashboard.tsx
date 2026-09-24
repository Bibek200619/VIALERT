import { WorkspacePlaceholder } from '../../components/WorkspacePlaceholder';

export function TrafficDashboard() {
  return <WorkspacePlaceholder
    icon="control"
    label="Traffic control workspace"
    title="One view. Better coordination."
    description="A shared workspace for traffic operators. Emergency visibility, simulated signal controls, and incident alerts will be added in Phase 4."
    phase="Planned · Phase 4"
    capabilities={[
      { title: 'Emergency visibility', description: 'See approaching demo ambulances.' },
      { title: 'Signal coordination', description: 'Manage simulated signal states.' },
      { title: 'Incident awareness', description: 'Understand changes on the road.' },
    ]}
  />;
}
