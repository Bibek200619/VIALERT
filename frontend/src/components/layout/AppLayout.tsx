import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router';
import { Icon } from '../Icon';
import { WorkspaceNavigation } from '../navigation/WorkspaceNavigation';
import { DemoResetButton } from '../../features/demo/DemoResetButton';
import { DEMO_RESET_EVENT_KEY } from '../../features/demo/demoReset';

export function AppLayout() {
  const { pathname } = useLocation();
  const workspace = pathname === '/demo'
    ? { phase: 'GO', name: 'Judge demo', description: 'A repeatable three-minute product story.', badge: 'Demo ready' }
    : pathname === '/simulation'
    ? { phase: '03', name: 'Simulation control', description: 'A replayable route and local scenario workspace.', badge: 'Scenario lab · simulated' }
    : pathname === '/traffic'
      ? { phase: '06', name: 'Traffic operations', description: 'Demo fleet, signals, incidents, and traffic forecasts.', badge: 'Forecast-enabled · simulated' }
      : { phase: '02', name: 'Ambulance navigation', description: 'A focused simulated driver workspace.', badge: 'Driver view · simulated' };
  useEffect(() => {
    const title = pathname === '/demo' ? 'Judge Demo Guide'
      : pathname === '/traffic' ? 'Traffic-Control Dashboard'
      : pathname === '/simulation' ? 'Simulation Dashboard'
        : 'Ambulance Driver Dashboard';
    document.title = `${title} · VIALERT`;
  }, [pathname]);
  useEffect(() => {
    const onReset = (event: StorageEvent) => {
      if (event.key === DEMO_RESET_EVENT_KEY && event.newValue) window.location.reload();
    };
    window.addEventListener('storage', onReset);
    return () => window.removeEventListener('storage', onReset);
  }, []);

  return <div className={`app-shell${pathname === '/traffic' ? ' traffic-app-shell' : ''}`}>
    <a className="skip-link" href="#main-content">Skip to content</a>
    <aside className="navigation-rail">
      <a className="brand" href="/demo" aria-label="VIALERT home">
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
        <div className="topbar-actions"><span className="phase-badge"><span aria-hidden="true" />{workspace.badge}</span>{pathname !== '/demo' && <DemoResetButton destination="/demo" label="Reset demo" className="button button-secondary topbar-reset" />}</div>
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
