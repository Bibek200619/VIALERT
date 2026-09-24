# Bengaluru-inspired demo fixtures

These nine approximate locations and twelve **bidirectional fictional road links**
are editable hackathon data, not a street map or usable emergency route. The base
and two hospitals are fictional. Distances, travel times, signal states, and
congestion levels are invented demo values; no real traffic source is connected.

- `nodes.json`: location IDs, names, latitude/longitude, and node types.
- `roads.json`: endpoints, positive distance in meters and time in seconds,
  `low | medium | high` congestion, and boolean blockage.
- `signals.json`: junction references; `red | yellow | green` state and
  `normal | manual | emergency` mode. Mode is metadata only in Phase 1.
- `bases.json`, `hospitals.json`: entities referencing node IDs. Their IDs match
  their node IDs in this small dataset, so the documented API examples work.
- `adjacency.json`: every road listed at both endpoints, for future routing.
- `scenarios.json`: six editable, inactive simulation presets (`accident`,
  `construction`, `rain`, `flood`, `congestion`, and `blockage`). Each references
  a known road and includes severity/duration metadata. The browser simulation
  applies local route and map overlays; fixture files stay unchanged. To create
  a Node mock incident, send `roadId`, `type`, `severity`, and boolean `blocked`
  to `POST /api/incidents`.

When adding a road, update both adjacency entries. When renaming an ID, update all
references. Run `npm run test:data` to check graph integrity. Restart Node (or call
`POST /api/simulation/reset`) after changing fixtures. Restart the AI service after
changing node IDs. Each Node process owns its in-memory state; edits via the API
never write these files.
