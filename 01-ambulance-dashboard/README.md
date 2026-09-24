# Ambulance Driver Dashboard · Phase 2

The Ambulance Driver Dashboard is the driver-facing part of VIALERT. In Phase 2,
it shows a route from the shared Bengaluru-inspired city graph, the current
simulated ambulance position, the destination hospital, upcoming mock signal
states, and the next navigation instruction.

## Run and replay

Start the services from the repository root with `npm run dev` after the setup
steps in the root README. Open `http://localhost:5173/ambulance`.

Choose Central Care Hospital or South Care Hospital, then use **Start journey**,
**Pause journey**, and **Reset journey**. Movement follows the weighted A* route
deterministically. Simulated time advances in fixed steps, updating progress,
ETA, the current route segment, turn guidance, and the upcoming signal list. Start
posts a mock emergency record; reset clears local movement and asks the Node API
to reset its in-memory mock state.

## Map and offline fallback

The map uses Leaflet and OpenStreetMap tiles with visible attribution. Street tiles
require an internet connection and may be unavailable. In that case, or by
choosing **Use route graph**, the page shows the shared node/road graph in an SVG
panel with the same route and markers. The graph is the route-data source; the
OSM street layer is only a visual map.

## Voice-guidance limits

Browser voice guidance uses the Web Speech API when available. Drivers can turn
it on and test the next instruction; browsers may lack speech synthesis or require
user interaction. Written guidance remains visible, and no real emergency system
is connected.

## What Phase 2 includes

- Shared-data A* route selection between the ambulance base and either demo hospital.
- Leaflet/OSM street map and an SVG city-graph fallback.
- Simulated ambulance marker, route progress, distance remaining, ETA, and speed.
- Next-turn guidance and on-route mock signal status.
- Start, pause, resume, and reset controls with mock API integration.
- Optional browser-based voice guidance with a text-only fallback.

## Later work

Dynamic rerouting, incident/scenario playback, signal control, multi-ambulance
monitoring, live GPS, and real emergency dispatch remain outside Phase 2.

## Driver sees

- Current simulated ambulance location
- Base/start point and selected hospital destination
- Recommended route and estimated arrival time
- Mock signal states ahead, including readable state labels
- High-congestion or blocked-road markers present in shared fixtures
- A next instruction and optional browser speech

## Important note

Live GPS is not integrated. Ambulance movement is simulated with browser timers
along the selected route. The map, signal, journey, and emergency API data are
demo-only; the dashboard does not change real traffic signals or contact dispatch.
