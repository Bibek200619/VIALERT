# Components

## Frontend Components

| Component | Responsibility |
| --- | --- |
| `Dashboard` | Main layout and state orchestration |
| `MapView` | Road network, route, ambulance, incidents, signals |
| `EmergencyPanel` | Start/reset emergency controls |
| `RoutePanel` | ETA, route nodes, distance, reroute reason |
| `SignalPanel` | Active and upcoming signal priority |
| `IncidentPanel` | Add/remove accident or congestion |
| `MetricsPanel` | Time, delay, reroutes, coordinated signals |
| `EventLog` | Human-readable simulation events |

## Backend Modules

| Module | Responsibility |
| --- | --- |
| `networkStore` | Road graph, signals, hospitals |
| `routingService` | Dijkstra/A* route calculation |
| `trafficService` | Congestion and incident updates |
| `emergencyService` | Emergency lifecycle |
| `signalService` | Signal-priority simulation |
| `metricsService` | ETA and demo metrics |

## Component Priority

For the hackathon, build `MapView`, `EmergencyPanel`, `routingService`, and `signalService` first. These create the main visual proof of the idea.

