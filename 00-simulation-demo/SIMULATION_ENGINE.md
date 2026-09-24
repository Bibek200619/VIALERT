# Simulation Engine

## Purpose

The simulation engine creates fake but realistic events so judges can see how VIALERT works without real city data.

## Engine Responsibilities

- Move ambulance along route nodes.
- Update ambulance position every few seconds.
- Trigger signal changes when ambulance approaches.
- Create traffic alerts.
- Add or remove incidents.
- Trigger rerouting.
- Send prediction updates.
- End the trip when ambulance reaches hospital.

## Simulation State

```json
{
  "activeEmergency": true,
  "ambulanceId": "AMB-07",
  "currentNodeId": "N2",
  "route": ["BASE-1", "N2", "N4", "HOSP-1"],
  "activeSignalId": "S2",
  "etaSeconds": 360,
  "scenario": "road-blockage"
}
```

## Tick-Based Updates

The easiest MVP approach is a timed tick.

Every tick:

1. Move ambulance forward.
2. Check nearest signal.
3. Turn upcoming signal green.
4. Send dashboard update.
5. Check for scenario event.
6. Recalculate route if needed.

## Suggested Tick Speed

Use 1 tick every 1 or 2 seconds. This makes the demo visible and easy to explain.

## Demo Controls

- Start simulation
- Pause simulation
- Reset simulation
- Add accident
- Add rain
- Toggle office time
- Add second ambulance
- Force reroute

