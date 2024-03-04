# Google Cloud Functions with JavaScript

This repository contains JavaScript functions deployed on Google Cloud Functions. These functions serve as webhooks, retrieving data from a third-party platform and processing it through a series of checks in MySQL. The processed data is then sent to Airtable.

## Functionality

- **Webhooks**: Functions act as webhooks to fetch data from a third-party platform when triggered by specific events.

- **MySQL Integration**: Processed data undergoes checks in MySQL to ensure data integrity and accuracy.

- **Airtable Integration**: The verified data is sent to Airtable for further storage and quality assurance.

- **Scheduler Cron Jobs**: Functions utilize scheduler cron jobs for executing tasks at specified intervals.

- **Firebase Functions**: Some functions are implemented using Firebase Functions, extending the capabilities of serverless execution.

## Technologies Used

- **Google Cloud Functions**: Serverless functions for event-driven development.

- **JavaScript**: Language used for writing the functions.

- **Firebase Functions**: Additional functions are implemented using Firebase Functions.

## Getting Started

1. **Deploy Functions:**
   ```bash
   gcloud functions deploy yourFunctionName --runtime nodejs14  --trigger-http

