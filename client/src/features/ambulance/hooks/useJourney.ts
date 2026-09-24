import { useCallback, useEffect, useState } from 'react';
import { advanceJourney, createInitialJourney, pauseJourney, resetJourney, startJourney } from '../ambulanceData';
import type { JourneyState, RoutePlan } from '../types';

const DEMO_TICK_SECONDS = 30;
const REAL_TICK_MILLISECONDS = 1000;

export function useJourney(route: RoutePlan | null) {
  const routeKey = route?.nodeIds.join('|') ?? 'no-route';
  const [session, setSession] = useState(() => ({ routeKey, journey: createInitialJourney() }));
  if (session.routeKey !== routeKey) setSession({ routeKey, journey: createInitialJourney() });
  const journey = session.routeKey === routeKey ? session.journey : createInitialJourney();

  const updateJourney = useCallback((update: (previous: JourneyState) => JourneyState) => {
    setSession((previous) => previous.routeKey === routeKey
      ? { ...previous, journey: update(previous.journey) }
      : previous);
  }, [routeKey]);

  useEffect(() => {
    if (!route || journey.status !== 'active') return undefined;
    const interval = window.setInterval(() => {
      updateJourney((previous) => advanceJourney(previous, route, DEMO_TICK_SECONDS));
    }, REAL_TICK_MILLISECONDS);
    return () => window.clearInterval(interval);
  }, [journey.status, route, updateJourney]);

  const start = useCallback(() => updateJourney(startJourney), [updateJourney]);
  const pause = useCallback(() => updateJourney(pauseJourney), [updateJourney]);
  const reset = useCallback(() => setSession({ routeKey, journey: resetJourney() }), [routeKey]);

  return { journey, start, pause, reset };
}
