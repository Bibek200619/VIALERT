import { ApiError, requireEntity, requireEnum, requireRecord } from './validation.js';

export function updateSignal(store, signalId, body) {
  requireRecord(body, ['state', 'mode']);
  if (!Object.hasOwn(body, 'state') && !Object.hasOwn(body, 'mode')) {
    throw new ApiError(400, 'INVALID_INPUT', 'Provide at least one of state or mode.');
  }
  // Validate every supplied value before changing any state.
  if (Object.hasOwn(body, 'state')) requireEnum(body.state, 'state', ['red', 'yellow', 'green']);
  if (Object.hasOwn(body, 'mode')) requireEnum(body.mode, 'mode', ['normal', 'manual', 'emergency']);
  const signal = requireEntity(store.city.signals.find((item) => item.id === signalId), 'Signal', signalId);
  if (Object.hasOwn(body, 'state')) signal.state = body.state;
  if (Object.hasOwn(body, 'mode')) signal.mode = body.mode;
  return signal;
}
