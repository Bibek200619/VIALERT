# WebSocket Events

## Server To Client

### `ambulance:update`

Sends current ambulance location, route progress, and ETA.

### `signal:update`

Sends changed traffic-light state.

### `alert:new`

Sends a new alert for traffic in-charge dashboard.

### `route:update`

Sends updated route after rerouting.

### `prediction:update`

Sends updated predicted congestion areas.

## Client To Server

### `emergency:start`

Starts ambulance movement.

### `signal:change`

Traffic in-charge manually changes a signal.

### `incident:add`

Adds roadblock or congestion event.

### `simulation:reset`

Resets demo state.

## Event Payload Example

```json
{
  "type": "alert:new",
  "message": "AMB-07 approaching Signal S3",
  "priority": "high",
  "timestamp": "2026-09-24T00:00:00Z"
}
```

