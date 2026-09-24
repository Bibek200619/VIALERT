# Simulation Scenarios

## Scenario 1: Normal Emergency Route

The ambulance starts from the selected base and travels to the selected hospital using the fastest route.

Expected result:

- User selects start and destination.
- Route appears on ambulance dashboard.
- Ambulance enters navigation mode.
- Signals ahead turn green.
- Voice guidance announces upcoming turns.
- Traffic in-charge receives signal alerts.
- Ambulance reaches hospital.

## Scenario 2: Road Blockage and Rerouting

An accident blocks one road on the ambulance route.

Expected result:

- User presses `Accident` and places it on a road.
- Accident marker appears on map and 3D view.
- Blocked road appears on traffic in-charge dashboard.
- A* calculates an alternate route.
- Driver dashboard shows rerouting alert.
- Voice prompt says: "Accident detected ahead. Rerouting now."
- Traffic in-charge dashboard logs the event.

## Scenario 3: Manual Signal Control

The traffic in-charge manually changes a signal state.

Expected result:

- Signal changes on both dashboards.
- Green corridor updates visually.
- Event log records operator action.
- Ambulance dashboard reflects updated green/red signal.

## Scenario 4: AI Traffic Prediction

The simulation changes context to office exit time with rain.

Expected result:

- AI predicts high traffic near office district.
- Prediction appears on traffic in-charge dashboard.
- Driver dashboard warns about predicted congestion ahead.
- Route cost increases for the predicted zone.
- Route may change if predicted congestion is severe.

## Scenario 5: Multiple Ambulance Alerts

Two ambulance markers are active in different areas.

Expected result:

- Traffic in-charge receives separate alerts.
- Dashboard shows which ambulance is approaching which signal.
- Conflict can be shown if both need the same corridor.

## Scenario 6: Road Construction

A road construction scenario is placed on the route.

Expected result:

- Construction marker appears.
- Route cost increases or road becomes unavailable.
- Traffic in-charge dashboard shows construction alert.
- Ambulance dashboard either slows the route or reroutes.

## Scenario 7: Heavy Rain

Heavy rain is toggled for a city zone.

Expected result:

- Rain zone appears on the map.
- AI prediction increases congestion risk.
- Ambulance dashboard shows weather warning.
- Traffic in-charge dashboard shows affected roads.

## Scenario 8: Flood

Flood is placed near an underpass or low-lying road.

Expected result:

- Flood marker appears.
- Affected road becomes blocked or high-risk.
- Route updates to avoid the flood zone.
- Voice prompt says: "Flood warning ahead. Taking alternate route."

## Scenario 9: 3D Driving View

The user switches from map view to third-person or driver view.

Expected result:

- Ambulance appears in a stylized Bengaluru road scene.
- Green route strip appears on the lane.
- Nearby vehicles and road markers appear.
- Accident/construction/flood markers are visible in the 3D scene.
- User can switch back to map view anytime.
