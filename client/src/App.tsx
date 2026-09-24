import { useEffect, useState } from 'react';
import { Icon } from './components/Icon';
import type { IconName } from './components/Icon';
import { FoundationStatus } from './components/metrics/FoundationStatus';
import { SimulationDemo } from './components/simulation/SimulationDemo';
import { AmbulanceDashboard } from './dashboards/ambulance/AmbulanceDashboard';
import { TrafficDashboard } from './dashboards/traffic-incharge/TrafficDashboard';

const pages = {
  ambulance: { title: 'Ambulance Driver Dashboard', navigation: 'Ambulance driver', icon: 'ambulance', description: 'The foundation for a faster, more informed emergency journey.' },
  traffic: { title: 'Traffic In-charge Dashboard', navigation: 'Traffic in-charge', icon: 'control', description: 'The foundation for coordinated decisions across the demo city.' },
  simulation: { title: 'Simulation Demo', navigation: 'Simulation demo', icon: 'simulation', description: 'A shared starting point for the complete VIALERT demo.' },
} satisfies Record<string, { title: string; navigation: string; icon: IconName; description: string }>;

type Page = keyof typeof pages;
function readPage(): Page {
  const hash = window.location.hash.slice(1);
  return hash === 'traffic' || hash === 'simulation' ? hash : 'ambulance';
}

export default function App() {
  const [page, setPage] = useState<Page>(readPage);
  useEffect(() => {
    const onHashChange = () => setPage(readPage());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);
  useEffect(() => { document.title = `${pages[page].title} · VIALERT`; }, [page]);

  return <div className="app-shell">
    <a className="skip-link" href="#main-content">Skip to content</a>
    <aside className="navigation-rail">
      <a className="brand" href="#ambulance" aria-label="VIALERT home">
        <span className="brand-mark" aria-hidden="true">V<span>+</span></span>
        <span>VIALERT<small>Every second matters.</small></span>
      </a>
      <div className="navigation-group">
        <span className="eyebrow navigation-label">Workspaces</span>
        <nav aria-label="Main navigation">
          {(Object.keys(pages) as Page[]).map((key) => <a key={key} href={`#${key}`} className={`nav-link ${page === key ? 'active' : ''}`} aria-current={page === key ? 'page' : undefined}>
            <Icon name={pages[key].icon} /><span>{pages[key].navigation}</span><span className="nav-active-dot" aria-hidden="true" />
          </a>)}
        </nav>
      </div>
      <div className="rail-footer">
        <span className="phase-mini">01</span>
        <div><strong>Foundation first.</strong><p>One connected system,<br />built one phase at a time.</p></div>
      </div>
      <span className="rail-version">Hackathon MVP <span>v0.1</span></span>
    </aside>

    <div className="app-body">
      <header className="topbar">
        <div className="city-label"><Icon name="location" /><span>Bengaluru <span className="city-label-detail">/ Demo environment</span></span></div>
        <span className="phase-badge"><span aria-hidden="true" />Phase 1 · Foundation</span>
      </header>
      <main id="main-content" tabIndex={-1}>
        <div className="page-heading">
          <div><span className="eyebrow">Emergency mobility, connected</span><h1>{pages[page].title}</h1><p>{pages[page].description}</p></div>
          <span className="outline-label">Workspace preview</span>
        </div>

        <div className="foundation-banner"><span className="banner-icon"><Icon name="check" /></span><p><strong>The project foundation is in place.</strong> Explore the workspaces and check your local services below.</p><span className="banner-tag">Phase 1</span></div>

        <div className="workspace-grid">
          {page === 'ambulance' ? <AmbulanceDashboard /> : page === 'traffic' ? <TrafficDashboard /> : <SimulationDemo />}
          <FoundationStatus />
        </div>

        <footer className="main-footer"><span><span className="footer-dot" aria-hidden="true" />Demo data only. No real emergency dispatch or traffic control.</span><span>Designed for the journey ahead.</span></footer>
      </main>
    </div>
  </div>;
}
