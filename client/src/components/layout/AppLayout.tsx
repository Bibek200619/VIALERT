import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router';
import { Icon } from '../Icon';
import { WorkspaceNavigation } from '../navigation/WorkspaceNavigation';

export function AppLayout() {
  const { pathname } = useLocation();
  const workspace = pathname === '/simulation'
    ? { phase: '03', name: 'Simulation control', description: 'A replayable route and local scenario workspace.', badge: 'Phase 3 · simulation engine' }
    : pathname === '/traffic'
      ? { phase: '06', name: 'Traffic operations', description: 'Demo fleet, signals, incidents, and traffic forecasts.', badge: 'Phase 6 · traffic prediction' }
      : { phase: '02', name: 'Ambulance navigation', description: 'A focused driver workspace for the Phase 2 demo.', badge: 'Phase 2 · ambulance navigation' };
  useEffect(() => {
    const title = pathname === '/traffic' ? 'Traffic-Control Dashboard'
      : pathname === '/simulation' ? 'Simulation Dashboard'
        : 'Ambulance Driver Dashboard';
    document.title = `${title} · VIALERT`;
  }, [pathname]);

  return <div className="app-shell">
    <a className="skip-link" href="#main-content">Skip to content</a>
    <aside className="navigation-rail">
      <a className="brand" href="/ambulance" aria-label="VIALERT home">
        <span className="brand-mark" aria-hidden="true">V<span>+</span></span>
        <span>VIALERT<small>Every second matters.</small></span>
      </a>
      <WorkspaceNavigation />
      <div className="rail-footer">
        <span className="phase-mini">{workspace.phase}</span>
        <div><strong>{workspace.name}</strong><p>{workspace.description}</p></div>
      </div>
      <span className="rail-version">Hackathon MVP <span>{workspace.badge}</span></span>
    </aside>

    <div className="app-body">
      <header className="topbar">
        <div className="city-label"><Icon name="location" /><span>Bengaluru <span className="city-label-detail">/ Demo city graph</span></span></div>
        <span className="phase-badge"><span aria-hidden="true" />{workspace.badge}</span>
      </header>
      <main className="page-main" id="main-content" tabIndex={-1}>
        <Outlet />
        <footer className="main-footer">
          <span><span className="footer-dot" aria-hidden="true" />Demo data only. No real dispatch or live traffic control.</span>
          <span>Navigation and signal states are simulated.</span>
        </footer>
      </main>
    </div>
  </div>;
}
