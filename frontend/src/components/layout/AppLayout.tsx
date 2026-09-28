import { useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router';
import { Icon } from '../Icon';
import { WorkspaceNavigation } from '../navigation/WorkspaceNavigation';
import { DemoResetButton } from '../../features/demo/DemoResetButton';
import { DEMO_RESET_EVENT_KEY } from '../../features/demo/demoReset';

export function AppLayout() {
  const { pathname } = useLocation();
  useEffect(() => {
    const titles: Record<string, string> = { '/demo': 'Overview', '/simulation': 'Simulation', '/traffic': 'Traffic operations', '/ambulance': 'Driver navigation' };
    document.title = `${titles[pathname] ?? 'Emergency mobility'} · VIALERT`;
  }, [pathname]);
  useEffect(() => {
    const onReset = (event: StorageEvent) => {
      if (event.key === DEMO_RESET_EVENT_KEY && event.newValue) window.location.reload();
    };
    window.addEventListener('storage', onReset);
    return () => window.removeEventListener('storage', onReset);
  }, []);
  return <div className="app-shell">
    <a className="skip-link" href="#main-content">Skip to content</a>
    <header className="app-header">
      <Link className="brand" to="/demo" aria-label="VIALERT home"><span className="brand-mark" aria-hidden="true">v<span>↗</span></span><span>vialert<span className="brand-period">.</span></span></Link>
      <WorkspaceNavigation />
      <div className="header-location"><Icon name="location" /><span>Bengaluru</span></div>
      <span className="demo-badge"><i />Simulation mode</span>
    </header>
    <main className="page-main" id="main-content" tabIndex={-1}><Outlet /></main>
    <footer className="main-footer"><span>VIALERT <span className="footer-divider">/</span> Every second matters.</span><span>Simulated vehicles, roads & signals</span>{pathname !== '/demo' && <DemoResetButton destination="/demo" label="Reset workspace" className="text-button" />}</footer>
  </div>;
}
