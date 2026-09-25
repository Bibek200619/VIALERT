import { describe, expect, it } from 'vitest';
import { requestWithFallback } from './apiClient';

describe('API demo fallback', () => {
  it('returns the service response when the Node API request succeeds', async () => {
    const result = await requestWithFallback(async () => ({ city: 'Bengaluru' }), { city: 'fallback' });
    expect(result).toEqual({ data: { city: 'Bengaluru' }, source: 'service' });
  });

  it('keeps the dashboard usable and labels the fallback after a request failure', async () => {
    const fallback = { city: 'Bengaluru demo graph' };
    const result = await requestWithFallback(async () => { throw new Error('offline'); }, fallback);
    expect(result.data).toBe(fallback);
    expect(result.source).toBe('demo-fallback');
    expect(result.error?.message).toBe('offline');
  });
});
