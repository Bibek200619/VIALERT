# Backend and Realtime Architecture

The backend connects the dashboards, routing engine, traffic signals, and AI prediction module.

## Backend Split

| Service | Responsibility |
| --- | --- |
| Node.js API | Main app API, WebSocket, dashboard state |
| Python FastAPI | AI prediction service |
| Shared data files | Road graph, adjacency list, signals, hospitals |

## Why Two Backends

Node.js is useful for realtime dashboard updates. Python FastAPI is useful for AI/ML prediction work.

## Realtime Approach

Use either:

- WebSocket / Socket.IO for live updates
- Simple timer-based polling for faster implementation

For the 24-hour MVP, WebSocket is better if the team can implement it quickly. Timed polling is acceptable if time is short.

