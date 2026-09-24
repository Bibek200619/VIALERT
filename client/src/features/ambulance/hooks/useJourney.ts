import { useCallback, useEffect, useState } from 'react';
import { advanceJourney, createInitialJourney, pauseJourney, resetJourney, startJourney } from '../ambulanceData';
import type { JourneyState, RoutePlan } from '../types';

const DEMO_TICK_SECONDS = 30;
const REAL_TICK_MILLISECONDS = 1000;

export function useJourney(route: RoutePlan | null) {
  const routeKey = route ? `${route.roadIds.join('|')}:${Math.round(route.etaSeconds)}` : 'no-route';
  const [session, setSession] = useState(() => ({ routeKey, route, journey: createInitialJourney() }));
  if (session.routeKey !== routeKey) {
    const progress = session.route?.totalDistanceMeters ? session.journey.distanceTravelledMeters / session.route.totalDistanceMeters : 0;
    const journey = route && session.journey.status !== 'ready'
      ? { ...session.journey, distanceTravelledMeters: Math.min(route.totalDistanceMeters, progress * route.totalDistanceMeters), elapsedSeconds: Math.min(route.etaSeconds, progress * route.etaSeconds) }
      : session.journey;
    setSession({ routeKey, route, journey: route ? journey : { ...journey, status: 'paused' } });
  }
  const journey = session.routeKey === routeKey ? session.journey : route && session.journey.status !== 'ready'
    ? { ...session.journey, distanceTravelledMeters: Math.min(route.totalDistanceMeters, (session.route?.totalDistanceMeters ? session.journey.distanceTravelledMeters / session.route.totalDistanceMeters : 0) * route.totalDistanceMeters), elapsedSeconds: Math.min(route.etaSeconds, (session.route?.totalDistanceMeters ? session.journey.distanceTravelledMeters / session.route.totalDistanceMeters : 0) * route.etaSeconds) }
    : session.journey;

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
  const reset = useCallback(() => setSession({ routeKey, route, journey: resetJourney() }), [routeKey, route]);

  return { journey, start, pause, reset };
}
