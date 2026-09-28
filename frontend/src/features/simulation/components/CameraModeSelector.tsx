import type { CameraMode } from '../simulationTypes';
const modes: { id: CameraMode; label: string }[] = [
  { id: 'third-person', label: 'Orbit' }, { id: 'driver', label: 'Driver' },
  { id: 'rear-view', label: 'Rear' }, { id: 'map', label: 'Map' }, { id: 'follow', label: 'Follow' },
];
export function CameraModeSelector({ mode, onChange }: { mode: CameraMode; onChange: (mode: CameraMode) => void }) {
  return <div className="camera-mode-selector" role="group" aria-label="Camera views">{modes.map((option) => <button key={option.id} type="button" className={mode === option.id ? 'selected' : ''} onClick={() => onChange(option.id)} aria-pressed={mode === option.id}>{option.label}</button>)}</div>;
}
