import { Link } from 'react-router';

export function SimulationPlaceholder() {
  return <section className="placeholder-page">
    <div className="page-heading">
      <div><span className="eyebrow">Demo environment</span><h1>Simulation Dashboard</h1><p>Replay a predictable emergency journey through the Bengaluru-inspired demo graph.</p></div>
      <span className="outline-label">Planned for Phase 3</span>
    </div>
    <div className="placeholder-hero simulation-hero">
      <span className="placeholder-symbol" aria-hidden="true">◷</span>
      <div><span className="eyebrow">Phase 2 · Driver journey included</span><h2>Scenario controls are planned next.</h2><p>The current ambulance page includes a single deterministic route replay. A multi-scenario simulation workspace will follow in Phase 3.</p></div>
      <span className="planned-badge">PLANNED · PHASE 3</span>
    </div>
    <div className="placeholder-grid">
      <article><span>01</span><h3>Scenario selection</h3><p>Replay accident, construction, rain, flood, or congestion presets.</p></article>
      <article><span>02</span><h3>City-wide timeline</h3><p>Review timed movement and changes across the demo city.</p></article>
      <article><span>03</span><h3>Replay controls</h3><p>Configure a repeatable judge demo across future workspaces.</p></article>
    </div>
    <div className="workspace-links"><span>Continue exploring</span><Link className="text-link" to="/ambulance">Open ambulance dashboard <span aria-hidden="true">→</span></Link><Link className="text-link" to="/traffic">Open traffic-control workspace <span aria-hidden="true">→</span></Link></div>
  </section>;
}
