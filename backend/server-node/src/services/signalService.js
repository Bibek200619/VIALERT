import { ApiError, requireEntity, requireEnum, requireRecord } from './validation.js';
import { addOperationsAlert, addOperationsEvent } from './operationsService.js';

export function updateSignal(store, signalId, body) {
  requireRecord(body, ['state', 'mode']);
  if (!Object.hasOwn(body, 'state') && !Object.hasOwn(body, 'mode')) {
    throw new ApiError(400, 'INVALID_INPUT', 'Provide at least one of state or mode.');
  }
  // Validate every supplied value before changing any state.
  if (Object.hasOwn(body, 'state')) requireEnum(body.state, 'state', ['red', 'yellow', 'green']);
  if (Object.hasOwn(body, 'mode')) requireEnum(body.mode, 'mode', ['normal', 'manual', 'emergency']);
  const signal = requireEntity(store.city.signals.find((item) => item.id === signalId), 'Signal', signalId);
  const previousMode = signal.mode;
  const nextState = body.state ?? signal.state;
  const nextMode = body.mode ?? signal.mode;
  if (signal.state === nextState && signal.mode === nextMode) return signal;
  if (Object.hasOwn(body, 'state')) signal.state = body.state;
  if (Object.hasOwn(body, 'mode')) signal.mode = body.mode;
  addOperationsEvent(store, 'signal', signal.id, `${signal.id} set to ${signal.state.toUpperCase()} · ${signal.mode} mode`, 'info');
  if (signal.mode === 'emergency' && previousMode !== 'emergency') {
    addOperationsAlert(store, { severity: 'warning', type: 'signal', title: 'Emergency priority enabled', message: `${signal.id} is in simulated emergency priority mode.`, nodeId: signal.nodeId, signalId: signal.id });
  } else if (previousMode === 'emergency' && signal.mode !== 'emergency') {
    for (const alert of store.alerts) {
      if (alert.type === 'signal' && alert.signalId === signal.id) alert.acknowledged = true;
    }
  }
  return signal;
}
