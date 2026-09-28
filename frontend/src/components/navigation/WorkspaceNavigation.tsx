import { NavLink } from 'react-router';
const workspaces = [
  { to: '/demo', label: 'Overview' }, { to: '/simulation', label: 'Simulation' },
  { to: '/ambulance', label: 'Driver' }, { to: '/traffic', label: 'Traffic operations' },
];
export function WorkspaceNavigation() {
  return <nav className="workspace-navigation" aria-label="Main navigation">{workspaces.map(({ to, label }) => <NavLink key={to} to={to} end className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>{label}</NavLink>)}</nav>;
}
