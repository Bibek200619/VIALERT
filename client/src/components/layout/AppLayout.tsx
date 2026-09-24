import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router';
import { Icon } from '../Icon';
import { WorkspaceNavigation } from '../navigation/WorkspaceNavigation';

export function AppLayout() {
  const { pathname } = useLocation();
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
        <span className="phase-mini">02</span>
        <div><strong>Ambulance navigation</strong><p>A focused driver workspace<br />for the Phase 2 demo.</p></div>
      </div>
      <span className="rail-version">Hackathon MVP <span>Phase 2</span></span>
    </aside>

    <div className="app-body">
      <header className="topbar">
        <div className="city-label"><Icon name="location" /><span>Bengaluru <span className="city-label-detail">/ Demo city graph</span></span></div>
        <span className="phase-badge"><span aria-hidden="true" />Phase 2 · Ambulance navigation</span>
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
