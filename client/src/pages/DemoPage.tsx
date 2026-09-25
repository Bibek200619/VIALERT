import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router';
import { DemoResetButton } from '../features/demo/DemoResetButton';
import { resetMessage, type DemoResetResult } from '../features/demo/demoReset';
import { apiClient } from '../services/apiClient';

type ServiceStatus = 'checking' | 'online' | 'offline';

const steps = [
  { number: '01', title: 'Driver baseline', page: '/ambulance', link: 'Open Ambulance', description: 'Show the base-to-hospital route, ETA, next turn, and upcoming mock signals.' },
  { number: '02', title: 'City + forecast', page: '/traffic', link: 'Open Traffic', description: 'Select Silk Board risk; choose Heavy rain to raise the R3 forecast and ETA.' },
  { number: '03', title: 'Incident + reroute', page: '/simulation', link: 'Open Simulation', description: 'Activate a high accident on R3 and step once. A* and the event log explain the change.' },
  { number: '04', title: 'Operator response', page: '/traffic', link: 'Return to Traffic', description: 'Inspect the route alert, incident overlay, accident factor, and operator advice.' },
] as const;

export function DemoPage() {
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  const resetResult: DemoResetResult | null = params.get('reset') === 'reset' || params.get('reset') === 'offline'
    ? { backend: params.get('reset') as DemoResetResult['backend'], browser: params.get('browser') === 'cleared' ? 'cleared' : params.get('browser') === 'partial' ? 'partial' : 'unavailable' }
    : null;
  const [node, setNode] = useState<ServiceStatus>('checking');
  const [ai, setAi] = useState<ServiceStatus>('checking');

  useEffect(() => {
    const controller = new AbortController();
    void Promise.allSettled([apiClient.getNodeHealth(controller.signal), apiClient.getAiHealth(controller.signal)]).then(([nodeResult, aiResult]) => {
      if (controller.signal.aborted) return;
      setNode(nodeResult.status === 'fulfilled' ? 'online' : 'offline');
      setAi(aiResult.status === 'fulfilled' ? 'online' : 'offline');
    });
    return () => controller.abort();
  }, []);

  return <section className="demo-page">
    <header className="demo-hero panel">
      <div className="demo-hero-copy"><span className="eyebrow">VIALERT · JUDGE DEMO</span><h1>One emergency. Three coordinated views.</h1><p>Follow a simulated Bengaluru ambulance from baseline route to predicted congestion, incident-aware reroute, and operator response—in under three minutes.</p>
        <div className="demo-hero-actions"><DemoResetButton destination="/ambulance" label="Start judge demo" className="button button-primary" /><DemoResetButton destination="/demo" label="Reset demo" /></div>
      </div>
      <div className="demo-proof" aria-label="Demo capabilities"><strong>01 <span>AMBULANCE</span></strong><strong>02 <span>TRAFFIC OPS</span></strong><strong>03 <span>SIMULATION</span></strong><p>Hardcoded graph · mock signals · heuristic forecast</p></div>
    </header>

    {resetResult && <p className={`demo-reset-result ${resetResult.backend === 'reset' && resetResult.browser === 'cleared' ? 'complete' : 'partial'}`} role="status">{resetMessage(resetResult)}</p>}

    <div className="demo-status-line panel" aria-label="Demo service status">
      <div><span className="eyebrow">Demo readiness</span><strong>Run locally, replay safely.</strong></div>
      <span className={`demo-service ${node}`}>Node API: {node === 'online' ? 'available' : node === 'checking' ? 'checking…' : 'offline · local graph fallback'}</span>
      <span className={`demo-service ${ai}`}>FastAPI: {ai === 'online' ? 'available' : ai === 'checking' ? 'checking…' : 'offline · local forecast fallback'}</span>
    </div>

    <section className="demo-runbook" aria-labelledby="demo-runbook-title">
      <div className="demo-section-heading"><div><span className="eyebrow">The 3-minute path</span><h2 id="demo-runbook-title">Guide the story</h2></div><span>Use one browser profile for shared demo state</span></div>
      <ol className="demo-steps">{steps.map((step) => <li key={step.number} className="panel demo-step"><span className="demo-step-number">{step.number}</span><div><h3>{step.title}</h3><p>{step.description}</p></div><Link className="demo-step-link" to={step.page}>{step.link} →</Link></li>)}</ol>
    </section>

    <footer className="demo-end panel"><div><span className="eyebrow">Finish clean</span><h2>Reset. Replay. Explain.</h2><p>Reset clears known browser demo state and asks Node to restore its in-memory fixtures. The simulation and driver tabs reload to their baseline if open in the same browser.</p></div><DemoResetButton destination="/demo" label="Reset demo" /></footer>
    <p className="demo-disclaimer">Demo-only city graph, vehicle positions, incidents, signal state, and rule-based future risk. No live GPS, government feed, physical signal control, or trained production model.</p>
  </section>;
}
