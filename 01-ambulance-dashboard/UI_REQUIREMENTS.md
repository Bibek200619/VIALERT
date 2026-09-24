# Ambulance Dashboard UI Requirements

The Ambulance Driver Dashboard should feel like a premium navigation screen. It should use a dark map style, a bright green emergency corridor, a large vehicle marker, turn-by-turn instructions, voice guidance, ETA, speed, and incident warnings.

## Design Reference Direction

Use the uploaded dark navigation dashboard references as the UI direction.

The driver view should feel close to a Google Maps / EV navigation experience:

- dark map background,
- glowing green active route,
- centered ambulance marker,
- zoomed navigation mode,
- next-turn instruction card,
- speed and ETA widgets,
- incident markers,
- smooth vehicle movement animation.

## Main Screen Layout

| Area | Content |
| --- | --- |
| Top bar | Ambulance ID, emergency status, destination hospital, ETA |
| Main map | Real map or simulated Bengaluru map, ambulance marker, route, signals, incidents |
| Next instruction card | Turn direction, distance to turn, road name, voice prompt text |
| Route progress card | Distance left, time left, arrival time, green corridor status |
| Signal panel | Upcoming traffic lights and current green/red state |
| Alert panel | Accident, roadblock, rain, flood, construction, rerouting alerts |
| Navigation controls | Start navigation, pause demo, recenter, zoom, switch view mode |

## Navigation Mode

When the driver presses the navigation button:

1. The map should zoom toward the ambulance.
2. The ambulance marker should become centered.
3. The route should animate slowly as the vehicle moves.
4. The next turn card should become large and readable.
5. The current road and upcoming signal should be highlighted.
6. The dashboard should feel like live driving navigation.

## Voice Guidance

The MVP should include voice-style navigation prompts. If browser speech is available, use text-to-speech. If not, show the prompt as text and simulate the voice event in the log.

Example prompts:

- "In 30 meters, turn right toward MG Road."
- "In 10 meters, turn left toward the hospital corridor."
- "Accident detected ahead. Rerouting now."
- "Green signal active at the next junction."
- "Heavy rain predicted ahead. Drive carefully."

## Map Elements

- Ambulance marker
- Base location marker
- Hospital marker
- Active route polyline
- Green corridor highlight
- Green signal markers
- Red/yellow signal markers
- Accident marker
- Construction marker
- Rain/flood zone marker
- Predicted congestion zone

## Suggested UI States

### Idle

No active emergency. Driver can see base location, hospital options, and available demo route.

### Route Preview

Driver selects source and destination. The route appears before simulation starts.

### Active Navigation

Route is visible, ambulance moves smoothly, ETA updates, green lights appear ahead, and voice prompts are triggered.

### Incident Ahead

Accident, construction, rain, flood, or heavy congestion appears on the route. The dashboard shows an alert and prepares rerouting.

### Rerouting

Current route changes because of congestion, blockage, or AI prediction. The new route should animate clearly.

### Completed

Ambulance reaches destination and trip summary is shown.

## View Modes

The ambulance dashboard should support these view modes for the simulation:

- Map view: top-down navigation map
- Driver view: front-facing route perspective
- Third-person view: vehicle visible from behind
- Rear-view mirror: optional small rear camera/mirror view

For the 24-hour MVP, map view and one animated 3D/third-person view are enough. The other views can be shown as toggles or future-ready UI.

## UI Priority

The driver screen must be simple, cinematic, and readable. The driver needs route, turn, green signal, incident, and ETA information without clutter.
