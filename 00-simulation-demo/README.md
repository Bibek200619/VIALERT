# Simulation Demo

The Simulation Demo is the main way to present VIALERT to judges. Since the team cannot drive a real ambulance through a city, the MVP will simulate ambulance movement, traffic signals, congestion, alerts, and AI traffic prediction.

## Goal

Show how all three parts of VIALERT work together in one controlled demo:

1. Ambulance driver sees route and green lights.
2. Traffic in-charge receives alerts and controls signals.
3. AI prediction warns about future congestion.

## What The Simulation Shows

- Ambulance starts from a base location.
- Ambulance receives a route to a hospital.
- Traffic lights on the route turn green ahead of the ambulance.
- Traffic in-charge dashboard receives alerts.
- Operator can manually change traffic lights.
- AI predicts congestion in a future area.
- Route can update if a road becomes blocked or congested.

## Why Simulation Is Needed

The real system would need live GPS, actual traffic signals, government data, weather data, and city permissions. The MVP uses simulation to prove the product workflow without needing real-world deployment.

## Simulation Inputs

- Hardcoded ambulance base
- Hardcoded hospital
- Hardcoded city road graph
- Hardcoded traffic signals
- Simulated ambulance movement
- Simulated traffic congestion
- Simulated weather and office-hour conditions
- Simulated AI prediction output

## Simulation Output

- Moving ambulance marker
- Live route line
- Green-light corridor
- Traffic alerts
- Manual signal changes
- Predicted congestion zones
- Trip summary

