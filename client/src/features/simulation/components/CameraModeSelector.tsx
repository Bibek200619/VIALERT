import type { CameraMode } from '../simulationTypes';

interface CameraModeSelectorProps {
  mode: CameraMode;
  onChange: (mode: CameraMode) => void;
}

const modes: { id: CameraMode; label: string; status: 'available' | 'planned' }[] = [
  { id: 'map', label: 'Map view', status: 'available' },
  { id: 'follow', label: 'Follow ambulance', status: 'available' },
  { id: 'driver', label: 'Driver view', status: 'planned' },
  { id: 'third-person', label: 'Third-person', status: 'planned' },
  { id: 'rear-view', label: 'Rear-view mirror', status: 'planned' },
];

export function CameraModeSelector({ mode, onChange }: CameraModeSelectorProps) {
  return <div className="camera-mode-selector" role="group" aria-label="Map and camera modes">
    {modes.map((option) => <button
      key={option.id}
      className={mode === option.id ? 'selected' : ''}
      type="button"
      onClick={() => onChange(option.id)}
      aria-pressed={mode === option.id}
      aria-label={`${option.label}, ${option.status === 'available' ? 'implemented' : 'planned'}`}
    >
      <span>{option.label}</span><small className={option.status}>{option.status === 'available' ? 'Live' : 'Planned'}</small>
    </button>)}
  </div>;
}
