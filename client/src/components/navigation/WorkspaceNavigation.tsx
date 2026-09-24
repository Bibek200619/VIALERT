import { NavLink } from 'react-router';
import { Icon } from '../Icon';

const workspaces = [
  { to: '/ambulance', label: 'Ambulance driver', icon: 'ambulance' },
  { to: '/traffic', label: 'Traffic control', icon: 'control' },
  { to: '/simulation', label: 'Simulation demo', icon: 'simulation' },
] as const;

export function WorkspaceNavigation() {
  return <div className="navigation-group">
    <span className="eyebrow navigation-label">Workspaces</span>
    <nav aria-label="Main navigation">
      {workspaces.map(({ to, label, icon }) => <NavLink
        key={to}
        to={to}
        end
        className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
      >
        <Icon name={icon} /><span>{label}</span><span className="nav-active-dot" aria-hidden="true" />
      </NavLink>)}
    </nav>
  </div>;
}
