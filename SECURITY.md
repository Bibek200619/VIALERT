# Security and Safety

## MVP Safety Principle

VIALERT should recommend and simulate traffic actions. Real-world traffic control must remain under authorized city systems and operators.

## Emergency Verification

For the MVP, emergency requests can be simulated. In a production version, every request should be verified using:

- official dispatch ID,
- ambulance ID,
- driver or operator authentication,
- hospital destination verification,
- audit logs.

## Access Control

Suggested roles:

| Role | Permission |
| --- | --- |
| Viewer | Can view dashboard |
| Dispatcher | Can create emergency requests |
| Traffic Operator | Can approve or reject signal priority |
| Admin | Can manage users, roads, and configuration |

## Data Protection

- Avoid storing sensitive patient data.
- Store only ambulance and routing information needed for operations.
- Keep logs for accountability.
- Do not expose emergency routes publicly.

## Failure Handling

- If traffic data is stale, show reduced confidence.
- If no route is available, alert the operator.
- If signal priority fails, continue navigation without priority.
- If system disconnects, local traffic controllers continue normal operation.

