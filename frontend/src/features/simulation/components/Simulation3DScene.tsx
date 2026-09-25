import type { CityData } from '../../ambulance/types';
import type { CameraMode, Scenario, SimulationState } from '../simulationTypes';

interface Simulation3DSceneProps {
  city: CityData;
  state: SimulationState;
  cameraMode: Exclude<CameraMode, 'map' | 'follow'>;
}

function cleanName(value: string | undefined): string {
  return value?.replace(' (demo)', '') ?? 'Unknown location';
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function scenarioLetter(scenario: Scenario): string {
  const letters: Record<Scenario['type'], string> = {
    accident: 'A', construction: 'C', rain: 'R', flood: 'F', congestion: 'T', blockage: 'X',
  };
  return letters[scenario.type];
}

function MiniRoute({ progress, destinationName }: { progress: number; destinationName: string }) {
  return <div className="simulation-3d-mini-map" aria-label={`Route progress ${Math.round(progress * 100)} percent to ${destinationName}`}>
    <svg viewBox="0 0 108 76" role="img" aria-hidden="true">
      <path d="M12 63 C19 45 29 55 36 39 S55 30 62 39 S77 19 96 15" className="mini-route-base" />
      <path d="M12 63 C19 45 29 55 36 39 S55 30 62 39 S77 19 96 15" className="mini-route-active" style={{ strokeDashoffset: `${80 - progress * 80}` }} />
      <circle cx="12" cy="63" r="3" className="mini-route-start" />
      <circle cx="96" cy="15" r="4" className="mini-route-destination" />
      <circle cx={12 + progress * 84} cy={63 - progress * 48} r="3.5" className="mini-route-vehicle" />
    </svg>
    <span>Live corridor</span>
  </div>;
}

function PerspectiveVehicle({ x, y, scale, color, label, ambulance = false }: { x: number; y: number; scale: number; color: string; label: string; ambulance?: boolean }) {
  return <g className={`simulation-3d-vehicle ${ambulance ? 'ambulance' : ''}`} transform={`translate(${x} ${y}) scale(${scale})`}>
    <ellipse cx="0" cy="21" rx="34" ry="10" className="simulation-3d-vehicle-shadow" />
    <rect x="-24" y="-7" width="48" height="33" rx="8" fill={color} className="simulation-3d-vehicle-body" />
    <path d="M-17 -7 L-10 -21 Q0 -27 10 -21 L17 -7Z" fill={ambulance ? '#d7e4e8' : '#9ba8b5'} className="simulation-3d-vehicle-cabin" />
    <path d="M-9 -17 Q0 -22 9 -17 L11 -9 H-11Z" fill="#273746" className="simulation-3d-vehicle-window" />
    <rect x="-19" y="9" width="38" height="6" rx="2" fill="#eef5f7" opacity=".82" />
    {ambulance && <>
      <rect x="-4" y="-4" width="8" height="18" rx="1" fill="#dd3f48" />
      <rect x="-9" y="1" width="18" height="8" rx="1" fill="#dd3f48" />
      <rect x="-8" y="-25" width="16" height="4" rx="2" fill="#ff5d60" className="simulation-3d-beacon" />
    </>}
    <circle cx="-17" cy="23" r="4" fill="#101722" /><circle cx="17" cy="23" r="4" fill="#101722" />
    <text x="0" y="-34" textAnchor="middle" className="simulation-3d-vehicle-label">{label}</text>
  </g>;
}

export function Simulation3DScene({ city, state, cameraMode }: Simulation3DSceneProps) {
  const currentNode = city.nodes.find((node) => node.id === state.currentNodeId);
  const nextRoad = city.roads.find((road) => road.id === state.routeRoadIds[0]);
  const destination = city.hospitals.find((hospital) => hospital.id === state.vehicle.destinationId);
  const destinationNode = destination ? city.nodes.find((node) => node.id === destination.nodeId) : undefined;
  const currentIndex = Math.max(0, state.routeNodeIds.indexOf(state.currentNodeId));
  const totalDistance = state.distanceTravelledMeters + state.distanceRemainingMeters;
  const progress = totalDistance > 0 ? clamp(state.distanceTravelledMeters / totalDistance, 0, 1) : 0;
  const routeSignals = city.signals.filter((signal) => state.routeNodeIds.slice(currentIndex).includes(signal.nodeId));
  const nextSignal = routeSignals[0];
  const signalNode = nextSignal ? city.nodes.find((node) => node.id === nextSignal.nodeId) : undefined;
  const activeScenarios = [...state.scenarios, ...state.externalScenarios].filter((scenario) => scenario.active);
  const speed = state.status === 'running' ? clamp(27 + state.speedMultiplier * 4, 30, 48) : 0;
  const distanceToSignal = nextSignal ? clamp(Math.round(state.distanceRemainingMeters * .32), 300, 3200) : 0;
  const sceneId = `simulation-3d-${cameraMode}`;
  const cameraLabel = cameraMode === 'driver' ? 'Driver view' : cameraMode === 'third-person' ? 'Third-person view' : 'Rear-view mirror';
  const turnLabel = nextRoad?.name.replace(' Link', '') ?? 'Continue on route';

  return <div className={`simulation-3d-scene camera-${cameraMode} ${state.status === 'running' ? 'is-running' : ''}`} role="img" aria-label={`${cameraLabel} of the simulated ambulance route to ${cleanName(destination?.name)}`}>
    <div className="simulation-3d-sky-glow" aria-hidden="true" />
    <div className="simulation-3d-hud simulation-3d-turn-hud">
      <span className="simulation-3d-turn-arrow" aria-hidden="true">↑</span>
      <div><strong>{turnLabel}</strong><small>{distanceToSignal > 0 ? `${(distanceToSignal / 1000).toFixed(1)} km ahead` : 'Route continues ahead'}</small></div>
    </div>
    <div className="simulation-3d-hud simulation-3d-speed-hud"><strong>{speed || '—'}</strong><span>km/h</span></div>
    <div className="simulation-3d-speed-limit"><span>80</span><small>LIMIT</small></div>
    <MiniRoute progress={progress} destinationName={cleanName(destination?.name)} />

    <svg className="simulation-3d-world" viewBox="0 0 1200 680" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id={`${sceneId}-sky`} x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#071126" /><stop offset=".58" stopColor="#10182a" /><stop offset="1" stopColor="#23333e" /></linearGradient>
        <linearGradient id={`${sceneId}-road`} x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#293540" /><stop offset=".7" stopColor="#111b27" /><stop offset="1" stopColor="#0b121c" /></linearGradient>
        <linearGradient id={`${sceneId}-corridor`} x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#1dc978" stopOpacity=".3" /><stop offset=".8" stopColor="#10ad6a" stopOpacity=".65" /><stop offset="1" stopColor="#07855b" stopOpacity=".48" /></linearGradient>
        <linearGradient id={`${sceneId}-building`} x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#1b2734" /><stop offset="1" stopColor="#0c1420" /></linearGradient>
        <filter id={`${sceneId}-glow`} x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
      </defs>
      <rect width="1200" height="680" fill={`url(#${sceneId}-sky)`} />
      <circle cx="610" cy="155" r="92" fill="#1d90a2" opacity=".1" filter={`url(#${sceneId}-glow)`} />
      <g className="simulation-3d-cityline">
        <path d="M0 260 L0 160 70 160 70 190 145 190 145 120 205 120 205 176 275 176 275 102 320 102 320 210 382 210 382 145 430 145 430 248Z" fill={`url(#${sceneId}-building)`} />
        <path d="M1200 260 L1200 148 1132 148 1132 188 1070 188 1070 102 1010 102 1010 170 930 170 930 130 870 130 870 220 810 220 810 145 750 145 750 255Z" fill={`url(#${sceneId}-building)`} />
        <g className="simulation-3d-building-lights"><path d="M70 175h42m-42 15h42m95-55h32m-32 16h32m80-29h25m-25 16h25m690 11h38m-38 16h38m-106-80h34m-34 17h34m-88 53h44m-44 17h44" /></g>
      </g>
      <path d="M0 275 Q280 224 480 214 Q600 208 720 214 Q930 224 1200 275 V680 H0Z" fill="#0c151f" opacity=".75" />
      <path d="M170 680 L1030 680 L705 185 L495 185 Z" fill={`url(#${sceneId}-road)`} className="simulation-3d-road-surface" />
      <path d="M452 680 L748 680 L637 185 L563 185 Z" fill={`url(#${sceneId}-corridor)`} className="simulation-3d-emergency-corridor" />
      <path d="M169 680 L495 185 M1031 680 L705 185" className="simulation-3d-road-edge" />
      <path d="M452 680 L563 185 M748 680 L637 185" className="simulation-3d-lane-line" />
      <path d="M316 680 L529 185 M884 680 L671 185" className="simulation-3d-lane-line outer" />
      <g className="simulation-3d-road-dashes"><path d="M600 660 L600 610 M600 560 L600 530 M600 480 L600 455 M600 405 L600 385 M600 342 L600 325 M600 289 L600 276 M600 242 L600 232" /></g>
      <g className="simulation-3d-crosswalk"><path d="M430 323 L770 323 M438 336 L762 336 M446 349 L754 349" /><path d="M470 312 L474 358 M530 312 L534 358 M590 312 L594 358 M650 312 L646 358 M710 312 L706 358" /></g>
      <g className="simulation-3d-signal-gantry">
        <path d="M420 232 L780 232" /><path d="M452 232 L452 286 M748 232 L748 286" />
        <rect x="552" y="219" width="96" height="33" rx="4" /><circle cx="575" cy="235" r="7" className={nextSignal?.state === 'red' ? 'on-red' : ''} /><circle cx="600" cy="235" r="7" className={nextSignal?.state === 'yellow' ? 'on-yellow' : ''} /><circle cx="625" cy="235" r="7" className={nextSignal?.state === 'green' ? 'on-green' : ''} />
      </g>
      <g className="simulation-3d-route-arrow" transform="translate(600 300)"><circle r="28" /><path d="M0 14V-14M-11-3 0-15 11-3" /></g>
      {destinationNode && <g className="simulation-3d-destination-pin" transform="translate(840 150)"><path d="M0 0 C-23-31 0-50 0-50s23 19 0 50Z" /><circle cy="-35" r="7" /><text x="18" y="-24">{cleanName(destination?.name)}</text><text x="18" y="-10">DESTINATION</text></g>}
      <g className="simulation-3d-scenario-markers">
        {activeScenarios.slice(0, 3).map((scenario, index) => <g key={scenario.id} transform={`translate(${index === 0 ? 905 : index === 1 ? 295 : 1040} ${index === 0 ? 240 : index === 1 ? 275 : 315})`}><circle r="17" /><text y="6" textAnchor="middle">{scenarioLetter(scenario)}</text></g>)}
      </g>
      <PerspectiveVehicle x={390} y={475} scale={.68} color="#708293" label="" />
      <PerspectiveVehicle x={810} y={445} scale={.58} color="#526879" label="" />
      <PerspectiveVehicle x={490} y={365} scale={.42} color="#9ba6af" label="" />
      <PerspectiveVehicle x={720} y={350} scale={.4} color="#7f8f9a" label="" />
      <PerspectiveVehicle x={600} y={530} scale={cameraMode === 'driver' ? .78 : .92} color="#e7eef1" label={state.vehicle.vehicleNumber} ambulance />
      {signalNode && <text x="650" y="205" className="simulation-3d-signal-label">{nextSignal.id} · {cleanName(signalNode.name)}</text>}
    </svg>
    <div className="simulation-3d-bottom-hud"><span className="simulation-3d-camera-chip">{cameraMode === 'rear-view' ? 'REAR VIEW' : cameraMode === 'third-person' ? 'THIRD PERSON' : 'DRIVER CAMERA'}</span><strong>{cleanName(currentNode?.name)}</strong><span>to {cleanName(destination?.name)}</span></div>
    <div className="simulation-3d-action-bar"><span className="simulation-3d-live-dot" />{state.status === 'running' ? 'Simulation running' : state.status === 'paused' ? 'Simulation paused' : 'Press Start or Step to move the ambulance'}</div>
    <div className="simulation-3d-safety-note">3D presentation · route, signal, incident, and vehicle positions use the shared demo simulation.</div>
  </div>;
}
