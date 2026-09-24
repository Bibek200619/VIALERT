# Simulation Engine

## Purpose

The simulation engine creates fake but realistic events so judges can see how VIALERT works without real city data. It should power both dashboards and the 2D/3D ambulance navigation experience.

## Engine Responsibilities

- Let user choose start and destination.
- Calculate route using A*.
- Move ambulance along route nodes.
- Update ambulance position every few seconds.
- Trigger signal changes when ambulance approaches.
- Generate turn-by-turn instructions.
- Trigger voice-style navigation prompts.
- Create traffic alerts for the traffic in-charge dashboard.
- Add or remove incidents.
- Support accident, road construction, heavy rain, flood, congestion, and signal failure scenarios.
- Trigger rerouting when a scenario affects the active route.
- Send prediction updates.
- End the trip when ambulance reaches hospital or selected destination.

## Simulation State

```json
{
  "activeEmergency": true,
  "ambulanceId": "AMB-07",
  "vehicleNumber": "KA-01-EM-2047",
  "currentNodeId": "N2",
  "startNodeId": "BASE-1",
  "destinationNodeId": "HOSP-1",
  "route": ["BASE-1", "N2", "N4", "HOSP-1"],
  "activeSignalId": "S2",
  "etaSeconds": 360,
  "speedKmph": 42,
  "viewMode": "map",
  "scenario": "road-blockage",
  "nextInstruction": {
    "type": "turn-right",
    "distanceMeters": 30,
    "roadName": "MG Road",
    "voicePrompt": "In 30 meters, turn right toward MG Road."
  }
}
```

## Tick-Based Updates

The easiest MVP approach is a timed tick.

Every tick:

1. Move ambulance forward.
2. Update map/3D vehicle position.
3. Check nearest signal.
4. Turn upcoming signal green.
5. Generate next turn instruction.
6. Trigger voice prompt when a turn is near.
7. Send ambulance dashboard update.
8. Send traffic in-charge dashboard update.
9. Check for scenario event.
10. Recalculate route if needed.

## Suggested Tick Speed

Use 1 tick every 1 or 2 seconds. This makes the demo visible and easy to explain.

## Demo Controls

- Start simulation
- Pause simulation
- Reset simulation
- Choose start location
- Choose destination
- Add accident
- Add road construction
- Add heavy rain
- Add flood
- Toggle office time
- Add second ambulance
- Force reroute
- Switch map view
- Switch driver view
- Switch third-person view
- Toggle rear-view mirror

## Scenario Placement

The demo should allow the user to place a scenario on the map or select from preset Bengaluru locations.

Example scenario object:

```json
{
  "scenarioId": "SCN-ACC-01",
  "type": "accident",
  "roadId": "R4",
  "severity": "high",
  "blocksRoad": true,
  "lat": 12.9716,
  "lng": 77.5946,
  "predictionImpact": "high-congestion-risk"
}
```

## Voice Guidance

Voice guidance can be implemented using browser text-to-speech for the MVP. If that is not available, show the prompt text and record the event in the simulation log.

Example prompt timing:

- 100 meters before turn: prepare instruction
- 30 meters before turn: speak instruction
- 10 meters before turn: repeat short instruction

## 3D Simulation Scope

The target experience is a Bengaluru-inspired 3D road world where the ambulance moves through lanes and the green corridor is visible. For a short hackathon, the 3D world can be stylized rather than a perfect city reconstruction.

Minimum 3D MVP:

- road plane with lanes,
- ambulance model or simple emergency vehicle mesh,
- surrounding block/building shapes,
- green route strip,
- incident marker,
- camera modes for driver and third-person view.
