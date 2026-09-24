import { Link } from 'react-router';

export function TrafficControlPlaceholder() {
  return <section className="placeholder-page">
    <div className="page-heading">
      <div><span className="eyebrow">Operations workspace</span><h1>Traffic-Control Dashboard</h1><p>Coordinate the demo city response from a future traffic in-charge workspace.</p></div>
      <span className="outline-label">Planned for Phase 4</span>
    </div>
    <div className="placeholder-hero">
      <span className="placeholder-symbol" aria-hidden="true">⌁</span>
      <div><span className="eyebrow">Phase 2 · Route reserved</span><h2>Operator tools are planned next.</h2><p>This page will bring approaching ambulance alerts, city signal status, incident review, and a mock event log into one operator view.</p></div>
      <span className="planned-badge">PLANNED · PHASE 4</span>
    </div>
    <div className="placeholder-grid">
      <article><span>01</span><h3>Ambulance monitoring</h3><p>See demo journeys approaching key junctions.</p></article>
      <article><span>02</span><h3>Signal overview</h3><p>Review mock signal states along the city graph.</p></article>
      <article><span>03</span><h3>Operator event log</h3><p>Follow demo alerts and operator actions.</p></article>
    </div>
    <div className="workspace-links"><span>Continue exploring</span><Link className="text-link" to="/ambulance">Open ambulance dashboard <span aria-hidden="true">→</span></Link><Link className="text-link" to="/simulation">Open simulation workspace <span aria-hidden="true">→</span></Link></div>
  </section>;
}
