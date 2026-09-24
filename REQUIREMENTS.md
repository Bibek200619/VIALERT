# Requirements

## Functional Requirements

### Emergency Request

- User can create an emergency request.
- Request includes ambulance ID, source, destination, and priority.
- System marks the request as active.

### Routing

- System calculates a route from source to hospital.
- Route cost changes based on congestion, road closures, and incidents.
- System recalculates route when conditions change.

### Traffic Simulation

- Roads can have low, medium, or high congestion.
- A road can be blocked by an incident.
- Congestion affects estimated travel time.

### Signal Priority

- Traffic lights exist at selected junctions.
- Signals on the ambulance route can be marked as priority green.
- Priority moves as the ambulance moves.
- Signals return to normal after the ambulance passes.

### Dashboard

- Dashboard shows ambulance location.
- Dashboard shows selected route.
- Dashboard shows incidents and congestion.
- Dashboard shows active traffic signal state.
- Dashboard shows ETA and route status.

## Non-Functional Requirements

- The MVP should run locally with one command.
- The demo should work without internet if a custom map is used.
- UI should be readable on a projector.
- Simulation should be deterministic for judging.
- Demo should recover gracefully if no route is available.

## Out Of Scope For 24 Hours

- Real traffic-signal hardware integration
- Real CCTV computer vision
- Real government dispatch integration
- Production authentication
- Mobile driver app
- City-scale deployment

