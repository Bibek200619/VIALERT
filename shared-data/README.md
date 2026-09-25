# Bengaluru-inspired demo fixtures

These nine approximate locations and twelve **bidirectional fictional road links**
are editable hackathon data, not a street map or usable emergency route. The base
and two hospitals are fictional. Distances, travel times, signal states, and
congestion levels are invented demo values; no real traffic source is connected.

- `nodes.json`: location IDs, names, latitude/longitude, and node types.
- `roads.json`: endpoints, positive distance in meters and time in seconds,
  `low | medium | high` congestion, and boolean blockage.
- `signals.json`: junction references; `red | yellow | green` state and
  `normal | manual | emergency` demo mode. Phase 4 mock changes are in memory.
- `bases.json`, `hospitals.json`: entities referencing node IDs. Their IDs match
  their node IDs in this small dataset, so the documented API examples work.
- `adjacency.json`: every road listed at both endpoints, for future routing.
- `scenarios.json`: six editable, inactive simulation presets (`accident`,
  `construction`, `rain`, `flood`, `congestion`, and `blockage`). Each references
  a known road and includes severity/duration metadata. The browser simulation
  applies local route and map overlays; fixture files stay unchanged. To create
  a Node mock incident, send `roadId`, `type`, `severity`, and boolean `blocked`
  to `POST /api/incidents`.
- `vehicles.json`: one ambulance and one bus for the Phase 4 traffic operations
  view. Each vehicle references origin, current, and destination node IDs and
  supplies a fictional number, crew, speed, status, and priority. Only the
  ambulance follows Phase 3 movement, through a browser-local snapshot.
- `prediction_inputs.json`: six Phase 6 forecast examples, each referencing an
  existing road and nearby graph area (Silk Board, Koramangala, Indiranagar,
  MG Road, Electronic City, Whitefield). The browser combines them with active
  mock conditions before requesting FastAPI. These are not historical samples.

When adding a road, update both adjacency entries. When renaming an ID, update all
references. Run `npm run test:data` to check graph integrity. Restart Node (or call
`POST /api/simulation/reset`) after changing fixtures. Restart the AI service after
changing node IDs. Each Node process owns its in-memory state; edits via the API
never write these files.
