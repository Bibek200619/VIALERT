import { useEffect, useState } from 'react';
import { apiClient } from '../../services/apiClient';
import type { CityData, HealthResponse } from '../../services/apiClient';
import { Icon } from '../Icon';

type Status = 'checking' | 'online' | 'offline';
type Snapshot = { node: Status; ai: Status; city: CityData | null; cityStatus: Status };
const initialSnapshot: Snapshot = { node: 'checking', ai: 'checking', city: null, cityStatus: 'checking' };

function healthStatus(result: PromiseSettledResult<HealthResponse>, service: HealthResponse['service']): Status {
  return result.status === 'fulfilled' && result.value.status === 'ok' && result.value.service === service
    ? 'online'
    : 'offline';
}

function StatusRow({ label, description, status }: { label: string; description: string; status: Status }) {
  return <li className="service-row">
    <span className={`status-dot ${status}`} aria-hidden="true" />
    <div><span className="service-name">{label}</span><span className="service-description">{description}</span></div>
    <span className={`status-label ${status}`}>{status === 'checking' ? 'Checking' : status === 'online' ? 'Online' : 'Offline'}</span>
  </li>;
}

export function FoundationStatus() {
  const [snapshot, setSnapshot] = useState<Snapshot>(initialSnapshot);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    async function checkServices() {
      const [node, ai, city] = await Promise.allSettled([
        apiClient.getNodeHealth(controller.signal),
        apiClient.getAiHealth(controller.signal),
        apiClient.getCity(controller.signal),
      ]);
      if (!controller.signal.aborted) {
        setSnapshot({
          node: healthStatus(node, 'vialert-node'),
          ai: healthStatus(ai, 'vialert-ai'),
          city: city.status === 'fulfilled' ? city.value : null,
          cityStatus: city.status === 'fulfilled' ? 'online' : 'offline',
        });
      }
    }
    void checkServices();
    return () => controller.abort();
  }, [refresh]);

  const checking = snapshot.node === 'checking';
  const offline = snapshot.node === 'offline' || snapshot.ai === 'offline' || snapshot.cityStatus === 'offline';

  return <aside className="foundation-sidebar" aria-label="Foundation information">
    <section className="status-panel" aria-labelledby="services-heading">
      <div className="panel-header"><h2 id="services-heading">Foundation status</h2><Icon name="layers" /></div>
      <p className="panel-description">Local services for the next build phase.</p>
      <div aria-live="polite" aria-atomic="true">
        <ul className="service-list">
          <StatusRow label="Frontend" description="React + Vite" status="online" />
          <StatusRow label="Node API" description="Mock city & emergency data" status={snapshot.node} />
          <StatusRow label="AI service" description="Rule-based demo predictions" status={snapshot.ai} />
        </ul>
        {offline ? <p className="offline-note">Some services are unavailable. Start the backends using the README, then check again.</p> : null}
      </div>
      <button className="secondary-button" disabled={checking} onClick={() => { setSnapshot(initialSnapshot); setRefresh((value) => value + 1); }}>
        {checking ? 'Checking services…' : 'Check services'}<Icon name="arrow" />
      </button>
    </section>
    <section className="city-panel" aria-labelledby="city-heading">
      <span className="eyebrow">The demo city</span>
      <h2 id="city-heading">Built around Bengaluru.</h2>
      <p>A small, editable city graph inspired by familiar neighbourhoods.</p>
      <dl className="dataset-counts">
        <div><dt>Roads</dt><dd>{snapshot.city?.roads.length ?? '—'}</dd></div>
        <div><dt>Hospitals</dt><dd>{snapshot.city?.hospitals.length ?? '—'}</dd></div>
        <div><dt>Scenarios</dt><dd>{snapshot.city?.scenarios.length ?? '—'}</dd></div>
      </dl>
      <div className="data-note"><Icon name="location" /><span>{snapshot.cityStatus === 'online' ? 'Shared demo dataset loaded' : snapshot.cityStatus === 'checking' ? 'Loading shared demo dataset…' : 'Demo dataset unavailable'}</span></div>
    </section>
  </aside>;
}
