# AI Features and Data

## Input Features

| Feature | Example |
| --- | --- |
| Area ID | office-district |
| Road ID | R4 |
| Hour of day | 9, 18 |
| Day of week | Monday |
| Is office start time | true |
| Is office end time | true |
| Is holiday/vacation | false |
| Weather | clear, rain |
| Rain intensity | low, medium, high |
| Event nearby | true/false |
| Previous congestion | low, medium, high |

## Target Output

The model predicts congestion level:

- low
- medium
- high

## MVP Data Strategy

Use a small CSV or JSON file with manually generated sample rows. The goal is to prove the pipeline and prediction UI, not to claim real-world accuracy.

## Suggested First Model

Start with one of these:

- Rule-based predictor for fastest demo
- Decision tree classifier
- Random forest classifier

For the hackathon, a rule-based model may be enough if the UI and API are clear.

