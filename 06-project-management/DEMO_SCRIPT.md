# Judge demo script · Phase 7

Start `npm run dev`, open **http://localhost:5173/demo**, and use one browser
profile. Keep `/simulation` open in a second tab when showing its movement in
Traffic. Use the same graph fallback if street tiles are slow. All data is
invented and simulated; no vehicle, traffic authority, or signal hardware is
connected.

## Three-minute version

| Time | Page and exact action | Expected visible result and talking point |
| --- | --- | --- |
| 0:00–0:20 | `/demo` → **Start judge demo** | Reset clears scenarios, incidents, forecast settings, and mock Node state, then opens `/ambulance`. “One ambulance, one city graph, three coordinated views.” |
| 0:20–0:45 | `/ambulance` → point to South Care Hospital, route, ETA, next turn, and signal list. Select **Start journey**, then **Pause journey**. | The marker/progress and route guidance advance deterministically. “This is a simulated driver view, not GPS or dispatch.” |
| 0:45–1:15 | `/traffic` → point to fleet/map and **Prediction desk**. Select **Silk Board**. | Severe future risk, score, contributing factors, and operator suggestion appear. “Explainable heuristic, next 30 demo minutes—not trained or live AI.” |
| 1:15–1:35 | Prediction desk → **Weather: Heavy rain**. | Koramangala R3 becomes high risk; an operator route alert and ETA impact appear. Open `/ambulance` briefly to show the named-road forecast warning. |
| 1:35–2:15 | `/simulation` → choose **Accident near Koramangala**, **Affected road: Central–Koramangala Link (R3)**, **Severity: High**, then **Activate scenario**. | A* reroutes, ETA and the green route change, and the timeline records the accident and reason. Use **Step 1 tick** once to show movement. |
| 2:15–2:45 | Return to `/traffic` (same browser; allow the 4-second poll), select **Koramangala** forecast card. | Operator sees incident/route context, accident factor, recommendation, and alert. “The operator can prepare a simulated corridor before the ambulance arrives.” |
| 2:45–3:00 | Select **Reset demo** in the app header. | `/demo` confirms reset; return to `/ambulance` for the baseline ETA and `/traffic` for Clear weather/no incidents. |

## Five-minute extension

Follow the first four rows above, then spend an extra 60 seconds in Simulation:
choose **Road blockage at Koramangala** on R3 and activate it, show the route
comparison, pause/resume or step, and point to the event timeline. In Traffic,
select S1 in **Signal controls**, choose **Enable emergency priority**, and
confirm the simulated-only action; explain that no real light changes. Show the
alert inbox and forecast recommendation. For the no-route recovery story, use
Traffic **Change road conditions** to close both R10 (South Hospital Access)
and R12 (Silk Board–South Hospital Link); the route card names the closures.
Finish with **Reset demo** and replay the baseline.

## Recovery and boundaries

- If FastAPI is down, the Prediction desk says **Local rule fallback** and
  still displays all six deterministic forecasts. Do not describe this as a
  live or trained model.
- If Node is down, the three workspaces use local graph/mock data. **Reset demo**
  clears browser state but reports that the backend could not be reset. Restart
  Node, select **Reset demo** again, and continue.
- If tiles fail, select **Use graph fallback** (Traffic/Simulation) or **Use
  route graph** (Ambulance). Routing never depends on the tile server.
- If a scenario is on the wrong road, deactivate it and choose R3 explicitly.
  If no route is available, remove a closure or select **Reset demo**.
- If Traffic has not picked up the Simulation tab, wait one polling interval
  (up to four seconds), then refresh Traffic. Both tabs must share a browser
  profile; there is no cross-device sync.
- If browser speech is unavailable, the written turn card and timeline are the
  source of truth. No production GPS, government feed, live signal control,
  database, or trained prediction model is included.

Close with: “VIALERT shows how a driver, city operator, and explainable traffic
forecast can coordinate on one replayable emergency route. The next round
would validate the model and integrate authorized live data.”
