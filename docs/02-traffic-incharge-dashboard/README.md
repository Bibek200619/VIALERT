# Traffic Operations Center · Phase 4

Open `/traffic` after `npm run dev` from the repository root. The page is a demo
operator workspace for a fictional Bengaluru-inspired city graph. It displays
one ambulance and one bus, route previews, signal states, incidents, alerts,
metrics, and an event log. No government feed, real GPS, or traffic hardware is
connected.

## Operator flow

1. Choose **All vehicles**, **Ambulances**, **Buses**, **Active only**, **Critical**, or **Alerts** in Fleet watch. Select a unit to update the profile and map route.
2. Use **Fit all vehicles** or **Focus selected**. Signals, incidents, and routes can be hidden individually. The map switches to the shared SVG graph when OSM tiles fail, or with **Use graph fallback**.
3. In Signal controls, select a signal and set a simulated red, yellow, or green state. **Enable emergency priority** opens a confirmation card; confirming sets the demo signal green and enters emergency mode. Disable it to return to normal mode.
4. Filter the alert inbox, focus a related vehicle or location, and acknowledge alerts. Filter or clear the visible event log.
5. Keep `/simulation` open in another tab of the same browser. Start or step its ambulance, then observe the location, ETA, route status, alerts, and simulation events here. The browser-local snapshot is polled once per second; Node state is polled every four seconds.
6. In **Change road conditions**, select a graph road and one of accident, construction, heavy rain, flood, congestion, or manual road block. Choose severity and optional closure, then activate the simulated incident. The selected ambulance route, ETA, detail explanation, map, alert, and event log update. Clear the incident to restore the corridor. Flood and manual block always close the road. The same mock operator incident is polled into `/simulation` and `/ambulance`.

The vehicle data model is stored in `shared-data/vehicles.json`. It includes ID,
type, number, status, priority, origin/current/destination graph nodes, emergency
type, crew label, and demo speed. The traffic feature adds calculated A* route,
ETA, next junction/signal, alert count, and update time. Alerts have ID,
severity, type, title, message, optional vehicle or node, timestamp, and
acknowledged state. Node keeps signal changes, incidents, alerts, and events in
memory. Resetting its simulation endpoint clears those records.

The page can load with Node offline using the checked-in graph and vehicles.
Offline signal changes and derived alert acknowledgements remain local to that
page. Phase 5 operator incidents fall back to same-browser local storage when
Node is unavailable; they can still reroute the demo but are not sent to other
browsers. API failures retain the previous visible state and show feedback. Browser
snapshots do not synchronize different devices or browsers, and closing the
simulation tab stops its movement. The Phase 6 prediction desk is integrated
here as a deterministic heuristic with a labeled FastAPI/local fallback; it is
not a live or trained forecast. Real dispatch, physical signals, production
WebSockets, and authentication remain future work.
