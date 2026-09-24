# Simulation Demo

The Simulation Demo is the main way to present VIALERT to judges. Since the team cannot drive a real ambulance through a city, the MVP will simulate ambulance movement, traffic signals, congestion, alerts, AI traffic prediction, and a navigation-style driving experience.

## Goal

Show how all three parts of VIALERT work together in one controlled demo:

1. Ambulance driver sees route, turn guidance, voice prompts, and green lights.
2. Traffic in-charge receives alerts, tracks vehicles, and controls signals.
3. AI prediction warns about future congestion and scenario impact.

## Visual Direction

The simulation should feel more like a live emergency navigation product than a static map.

Use these design goals:

- Bengaluru-inspired city environment
- real map layer for location context
- optional stylized 3D road view for driving simulation
- green emergency corridor
- animated ambulance movement
- accident, rain, flood, and construction scenario markers
- traffic police control dashboard connected to the same simulation state

## What The Simulation Shows

- User chooses ambulance start location.
- User chooses destination hospital or target location.
- Ambulance starts from the selected base/location.
- Ambulance receives a route to the destination.
- Traffic lights on the route turn green ahead of the ambulance.
- Traffic in-charge dashboard receives alerts.
- Operator can manually change traffic lights.
- AI predicts congestion in a future area.
- Route can update if a road becomes blocked or congested.
- Driver dashboard shows turn-by-turn navigation and voice-style prompts.

## Why Simulation Is Needed

The real system would need live GPS, actual traffic signals, government data, weather data, city permissions, and a real ambulance route test. The MVP uses simulation to prove the product workflow without needing real-world deployment.

## Simulation Inputs

- Selected ambulance start point
- Selected destination point
- Hardcoded Bengaluru city graph
- Hardcoded hospitals and ambulance bases
- Hardcoded traffic signals
- Simulated ambulance movement
- Simulated traffic congestion
- Simulated weather and office-hour conditions
- Simulated AI prediction output
- User-added scenarios: accident, construction, rain, flood, congestion

## Simulation Output

- Moving ambulance marker
- Live route line
- Green-light corridor
- Turn-by-turn navigation
- Voice-style guidance prompts
- Traffic alerts
- Manual signal changes
- Predicted congestion zones
- 3D/third-person vehicle view option
- Trip summary

## View Modes

The simulation should support multiple presentation views:

| View | Purpose |
| --- | --- |
| Map view | Clear route, markers, incidents, and signals |
| Driver view | Front-facing navigation experience |
| Third-person view | Shows ambulance moving through a 3D road scene |
| Rear-view mirror | Optional small rear camera/mirror UI |

For the short hackathon, the minimum polished version should include map view and one animated vehicle view. The other views can be documented as future-ready toggles if time is short.
