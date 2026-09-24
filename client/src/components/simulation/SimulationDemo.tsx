import { WorkspacePlaceholder } from '../WorkspacePlaceholder';

export function SimulationDemo() {
  return <WorkspacePlaceholder
    icon="simulation"
    label="Simulation workspace"
    title="A small city. A bigger possibility."
    description="An environment for demonstrating the emergency journey. The scenario data is ready; vehicle movement and demo controls arrive in Phase 3."
    phase="Planned · Phase 3"
    capabilities={[
      { title: 'Repeatable journeys', description: 'Start, pause, and reset a demo.' },
      { title: 'City scenarios', description: 'Explore rain, roadworks, and incidents.' },
      { title: 'Connected views', description: 'Follow the same trip across roles.' },
    ]}
  />;
}
