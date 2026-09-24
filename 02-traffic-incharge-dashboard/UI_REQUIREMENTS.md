# Traffic In-charge Dashboard UI Requirements

The traffic in-charge dashboard should feel like a professional fleet-control dashboard. It should borrow the structure of a vehicle profile system: a left-side list of active vehicles, a large selected-vehicle detail area, route preview, alerts, signal controls, and operational statistics.

## Design Reference Direction

Use the uploaded fleet/car dashboard reference as the design inspiration.

The screen should show:

- a vertical navigation rail,
- searchable vehicle list,
- active ambulance cards,
- selected ambulance profile,
- vehicle number and driver/operator details,
- route preview map,
- signal-control actions,
- current trip status,
- incident and prediction alerts.

## Main Screen Layout

| Area | Content |
| --- | --- |
| Left rail | Dashboard, map, vehicles, alerts, reports, settings |
| Vehicle list | Active ambulances, waiting vehicles, completed vehicles, search/filter |
| Selected vehicle header | Ambulance ID, vehicle number, driver name, emergency priority, status |
| Vehicle detail card | Ambulance image/icon, plate number, current speed, distance, ETA, route status |
| Route preview | Origin, destination, current road, hospital, active route mini-map |
| Alert feed | Ambulance approaching, road blocked, traffic predicted, signal changed |
| Signal control panel | Selected signal, current state, manual green/yellow/red, emergency priority toggle |
| Statistics panel | Active vehicles, average delay, signals coordinated, reroutes triggered |

## Selected Ambulance Details

Show these fields when a vehicle is selected:

- Ambulance ID: `AMB-07`
- Vehicle number: example `KA-01-EM-2047`
- Driver name or crew label
- Emergency type: cardiac, accident, fire support, transfer
- Priority: normal, urgent, critical
- Current location
- Destination hospital
- ETA
- Current route status: clear, rerouting, blocked, signal-priority active
- Upcoming signal ID
- Last operator action

## Map Elements

- Ambulance markers
- Hospital marker
- Base marker
- Active route line
- Green corridor segment
- Traffic signal markers
- Incident markers
- AI-predicted congestion zones
- Road closure or construction marker
- Rain/flood affected zone marker

## Alerts

Examples:

- Ambulance AMB-07 approaching Signal S3
- Signal S3 switched to green
- Road R4 has high congestion
- AI predicts heavy traffic near Office District at 6 PM
- Ambulance AMB-11 needs route priority
- Accident reported on Outer Ring Road
- Heavy rain may slow route near Silk Board
- Flood warning near underpass route

## Signal Controls

Each signal should support:

- Green
- Yellow
- Red
- Emergency priority mode
- Normal mode
- Lock signal for emergency corridor
- Release signal after ambulance passes

## Scenario Controls

Traffic in-charge should be able to add or trigger scenarios during the demo:

- Accident
- Road construction
- Heavy rain
- Flood
- Heavy congestion
- Signal failure
- Second ambulance

## UI Priority

This screen should look like a command center dashboard. The operator should understand three things quickly:

1. Which emergency vehicle is coming.
2. Where it is coming from and where it is going.
3. Which signal or road action is needed now.
