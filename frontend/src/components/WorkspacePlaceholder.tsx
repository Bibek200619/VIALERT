import { Icon } from './Icon';
import type { IconName } from './Icon';

interface WorkspacePlaceholderProps {
  icon: IconName;
  label: string;
  title: string;
  description: string;
  phase: string;
  capabilities: { title: string; description: string }[];
}

export function WorkspacePlaceholder({ icon, label, title, description, phase, capabilities }: WorkspacePlaceholderProps) {
  return (
    <section className="workspace-panel" aria-labelledby="workspace-heading">
      <div className="panel-header">
        <span className="eyebrow">{label}</span>
        <span className="quiet-badge">Placeholder</span>
      </div>
      <div className="workspace-empty">
        <div className="workspace-symbol"><Icon name={icon} /></div>
        <span className="eyebrow green-text">{phase}</span>
        <h2 id="workspace-heading">{title}</h2>
        <p>{description}</p>
        <span className="coming-soon">Coming in a later phase <Icon name="arrow" /></span>
      </div>
      <div className="capabilities">
        {capabilities.map((capability, index) => (
          <div className="capability" key={capability.title}>
            <span className="capability-number">0{index + 1}</span>
            <div><h3>{capability.title}</h3><p>{capability.description}</p></div>
          </div>
        ))}
      </div>
    </section>
  );
}
