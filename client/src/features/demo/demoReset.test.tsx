import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import { DemoPage } from '../../pages/DemoPage';
import { DEMO_RESET_EVENT_KEY, DEMO_STORAGE_KEYS, clearDemoStorage, resetDemo, resetMessage, type DemoStorage } from './demoReset';

function demoStorage() {
  const values = new Map<string, string>(DEMO_STORAGE_KEYS.map((key) => [key, 'changed demo state']));
  const storage: DemoStorage = {
    removeItem: (key) => { values.delete(key); },
    setItem: (key, value) => { values.set(key, value); },
  };
  return { values, storage };
}

describe('judge demo reset and guide', () => {
  it('clears each known browser state and publishes a new cross-tab reset token on every replay', async () => {
    const { values, storage } = demoStorage();
    let backendCalls = 0;
    const first = await resetDemo(storage, async () => { backendCalls += 1; });
    expect(first).toEqual({ backend: 'reset', browser: 'cleared' });
    expect(DEMO_STORAGE_KEYS.every((key) => !values.has(key))).toBe(true);
    const firstToken = values.get(DEMO_RESET_EVENT_KEY);
    expect(firstToken).toBeTruthy();

    for (const key of DEMO_STORAGE_KEYS) values.set(key, 'new run');
    const second = await resetDemo(storage, async () => { backendCalls += 1; });
    expect(second).toEqual(first);
    expect(DEMO_STORAGE_KEYS.every((key) => !values.has(key))).toBe(true);
    expect(values.get(DEMO_RESET_EVENT_KEY)).not.toBe(firstToken);
    expect(backendCalls).toBe(2);
  });

  it('resets browser state and reports a partial service reset when Node is offline', async () => {
    const { values, storage } = demoStorage();
    const result = await resetDemo(storage, async () => { throw new Error('Node offline'); });
    expect(result).toEqual({ backend: 'offline', browser: 'cleared' });
    expect(DEMO_STORAGE_KEYS.every((key) => !values.has(key))).toBe(true);
    expect(resetMessage(result)).toContain('Node API is offline');
    expect(clearDemoStorage(null)).toBe('unavailable');
  });

  it('renders a compact cross-workspace script and honest service boundaries', () => {
    const markup = renderToStaticMarkup(<MemoryRouter initialEntries={['/demo']}><DemoPage /></MemoryRouter>);
    expect(markup).toContain('One emergency. Three coordinated views.');
    expect(markup).toContain('Start judge demo');
    expect(markup).toContain('Reset demo');
    expect(markup).toContain('Node API: checking');
    expect(markup).toContain('FastAPI: checking');
    expect(markup).toContain('No live GPS');
    expect((markup.match(/class="panel demo-step"/g) ?? [])).toHaveLength(4);
  });
});
