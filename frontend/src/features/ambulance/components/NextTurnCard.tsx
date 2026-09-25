import { formatDistance, formatDuration } from '../ambulanceData';
import type { TurnGuidance } from '../types';

interface NextTurnCardProps {
  turn: TurnGuidance | null;
  instruction: string;
}

const arrows: Record<TurnGuidance['direction'], string> = { left: '↰', right: '↱', straight: '↑', arrive: '◎' };

export function NextTurnCard({ turn, instruction }: NextTurnCardProps) {
  if (!turn) return <section className="panel next-turn-card" aria-labelledby="next-turn-title"><span className="eyebrow">Next instruction</span><h2 id="next-turn-title">Route guidance unavailable</h2><p>Choose a connected destination to see turn-by-turn guidance.</p></section>;
  const heading = turn.direction === 'arrive' ? 'Arrive at destination' : turn.direction === 'straight' ? 'Continue straight' : `Turn ${turn.direction}`;

  return <section className="panel next-turn-card" aria-labelledby="next-turn-title">
    <div className="turn-icon" aria-hidden="true">{arrows[turn.direction]}</div>
    <div className="turn-copy">
      <span className="eyebrow">Next instruction</span>
      <h2 id="next-turn-title">{turn.distanceMeters > 0 ? `${heading} in ${formatDistance(turn.distanceMeters)}` : heading}</h2>
      <p>{turn.direction === 'arrive' ? turn.targetName : `${turn.roadName} · ${turn.targetName}`}</p>
      <span className="turn-eta">About {formatDuration(turn.secondsToTurn)} to next junction</span>
      <p className="voice-transcript" aria-live="polite">“{instruction}”</p>
    </div>
  </section>;
}
