import { useState } from 'react';
import { resetDemo } from './demoReset';

export function DemoResetButton({ destination, label, className = 'button button-secondary' }: { destination: '/demo' | '/ambulance'; label: string; className?: string }) {
  const [busy, setBusy] = useState(false);

  async function handleReset() {
    if (busy) return;
    setBusy(true);
    const result = await resetDemo();
    const query = new URLSearchParams({ reset: result.backend, browser: result.browser });
    window.location.assign(`${destination}?${query}`);
  }

  return <button type="button" className={className} onClick={() => void handleReset()} disabled={busy} aria-label={label}>
    {busy ? 'Resetting demo…' : label}
  </button>;
}
