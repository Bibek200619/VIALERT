# Demo Script

## Opening

VIALERT is an emergency mobility demo. A hardcoded city graph and one mock ambulance show routing, simulated operator decisions, and explainable future traffic risk. Nothing here operates real infrastructure.

## Step 1: Ambulance Dashboard

Show the ambulance driver dashboard. Point out the base location, hospital, route, ambulance marker, and traffic signals.

## Step 2: Start the demo journey

Start the ambulance trip. Its marker advances through graph nodes; the driver sees upcoming simulated signal states, not actual light control.

## Step 3: Traffic In-charge Dashboard

Switch to Traffic Operations. Show the demo fleet, route, signal awareness, and operator alerts.

## Step 4: Manual Signal Control

Change a mock signal manually. Explain that only in-memory demo state changes.

## Step 5: Phase 6 traffic forecast

In the Traffic Prediction desk, show severe Silk Board risk at the default weekday 18:00. Select the card for factors and an operator suggestion. Switch to **Heavy rain**: five corridors become high/severe, Koramangala's R3 forecast raises the ambulance ETA, and an alert explains the change. The dashed map overlay marks future risk. This is a deterministic heuristic with mock inputs, not trained AI or a live traffic feed.

## Step 6: Rerouting

On `/ambulance`, show the R3 forecast cost and written ETA warning. In `/simulation`, activate a high-severity accident on R3; its incident-only A* movement reroutes, the timeline logs why, and the forecast insight highlights the affected corridor. Return to `/traffic`, select Koramangala, and show the accident factor. Deactivate the scenario and set weather back to Clear.

## Step 7: Simulation Summary

Show the route, mocked signal/incident decisions, alert, forecast risk, and reroute event. Simulation replay retains incident-only timing; driver/operator route previews can include optional forecast cost.

## Closing

The MVP demonstrates route visibility, simulated operator control, and explainable future-risk scoring. It does not use real GPS, traffic feeds, or a trained production prediction model.
