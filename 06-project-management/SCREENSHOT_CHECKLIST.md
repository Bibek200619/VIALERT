# Judge screenshot checklist

Use this checklist if browser capture is unavailable or flaky. Run `npm run dev`,
open Chrome at a laptop-size viewport (about 1440 × 900), select **Reset demo**,
and capture the visible browser viewport. Keep the “demo only” labels in frame.
Do not crop away the route/forecast explanation or imply real data.

| File to save under `06-project-management/screenshots/` | Page and setup | Must show |
| --- | --- | --- |
| `01-ambulance-baseline.png` | `/ambulance`, baseline South Care route | Map/graph, ETA, next turn, signal awareness |
| `02-traffic-operations.png` | `/traffic`, default weekday 18:00, Clear | Fleet, map, prediction desk, Silk Board risk |
| `03-simulation-accident.png` | `/simulation`, high accident on R3, step once | New green route, incident, ETA, event timeline |
| `04-prediction-heavy-rain.png` | `/traffic`, Weather → Heavy rain, select Koramangala | High risk, factors, recommendation, route alert |
| `05-reroute-or-no-route.png` | `/simulation`, block R3; optionally close R10 + R12 in Traffic for no-route | Clear cause, route change/blocked-road message, recovery action |
| `06-demo-reset.png` | `/demo`, select Reset demo | Reset confirmation, workflow steps, service/fallback labels |

Before sharing, check text is readable, browser URL or workspace title is
visible, no developer error overlay is present, and the screenshot matches the
documented mock-only claims. If no images are committed, this checklist is the
capture handoff; screenshot capture must not block the Phase 7 PR.
