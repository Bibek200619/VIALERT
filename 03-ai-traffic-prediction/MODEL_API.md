# AI Model API

The AI model can run as a Python FastAPI service.

## Predict Traffic

`POST /predict-traffic`

Request:

```json
{
  "areaId": "office-district",
  "roadId": "R4",
  "hour": 18,
  "dayOfWeek": "Monday",
  "weather": "rain",
  "isOfficeTime": true,
  "isVacation": false,
  "previousCongestion": "medium"
}
```

Response:

```json
{
  "areaId": "office-district",
  "roadId": "R4",
  "predictedCongestion": "high",
  "confidence": 0.82,
  "reason": "weekday office exit time with rain"
}
```

## Get All Predictions

`GET /predictions`

Returns predicted congestion for all areas in the city graph.

## Update Prediction Factors

`POST /prediction-context`

Used in demo to change weather, office time, or holiday mode.

