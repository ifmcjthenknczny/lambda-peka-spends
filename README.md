# PEKA Transit Expense Tracker

> Do you want to know how much do you spend on transit in Poznań?

A Node.js script that scrapes Poznan public transport journeys paid by PEKA card.
The project is AWS Lambda ready, it utilizes schedulers to save journeys from two days ago everyday and to summarize monthly costs of public transport on 3rd day of every month.
A key feature of its configuration is that it is free — it does not use AWS Secrets Manager, as it injects environment variables from GitHub Actions Secrets at deployment.

## Features

* Fetches transaction data from PEKA API.
* Automatically gets bearer token for session using provided username and password.
* Serverless ready - automatically fetches journey data and saves them into db, to periodically generate monthly summaries.
* Action to compute total transit expenses in current month.
* Possibility of migration to DB of existing journeys and monthly summaries (with deduplication)
* Logs warning if prematurely reached end of available data.

## Prerequisites

* A PEKA account

* For local development:
    - Node.js (>=22 recommended)
    - Yarn installed globally

* For serverless just AWS account is needed.

## Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/lambda-peka-spends.git
cd lambda-peka-spends
```

2. Rename `.env_example` to `.env` and fill it according to the schema below:

```ts
DATABASE_NAME=name_of_your_mongo_database
MONGO_URI=uri_to_your_mongo
EMAIL=your_email_in_peka_system
PASSWORD=your_password_to_account
```

## Local usage

Before using script locally, change the action at `start-local.ts` to desired value. You may also need to adjust some action parameters in `lambda-app.ts`. Then, (and only then to avoid unwanted effects) run:

```bash
cd lambda-app && yarn build && yarn start
```

## Serverless usage
Fork the repo. Add secrets to Github Actions Secrets, namely: `AWS_ACCESS_KEY`, `AWS_SECRET_ACCESS_KEY`, `DATABASE_NAME`, `EMAIL`, `MONGO_URI`, `PASSWORD`. Also add Github Actions Variables: `AWS_PROJECT_TAG`, `AWS_REGION`, `AWS_STACK_NAME`. You can now deploy the app on your AWS.  

This might also be a good time to migrate existing PEKA data into database, running `MIGRATE_EXISTING_PEKA_DATA` action, either serverless or locally.

## Database

Database type for this project is NOSQL MongoDB. I recommend downloading MongoDB Compass (from [here](https://www.mongodb.com/try/download/compass)) and feed it with your database `MONGO_URI` (free tier is available by signing up [here](https://www.mongodb.com/cloud/atlas/register)) to view raw data in your DB in a comfortable way.

### Collections
* **MonthlySummaries** - stores montly summarized costs of your journeys.
* **PekaJourneys** - stores informations about all your journeys and their costs.

## Lambda Actions
* **PING** - Simple ping to test if the function is alive. Logs ```PONG```.
* **PEKA_EVERYDAY** - Scrapes and saves public transport journeys from two days ago (based on PEKA card usage). Scheduled to run daily.
* **SUMMARY_MONTHLY** - Generates and stores a summary of public transport costs for the previous month. Runs automatically on the 3rd day of each month.
* **SUM_CURRENT_MONTH_PRICES** - Calculates and logs the total cost of journeys in the ongoing month. For manual use or debugging.
* **SUMMARY_MONTHLY_MIGRATION** - Same as SUMMARY_MONTHLY, but allows specifying for which month back the summary should be generated. Useful for backfilling older data.
* **MIGRATION** - Imports public transport journey data for a specified date range (hardcoded). Used for one-off data recovery or batch imports.
* **MIGRATE_EXISTING_PEKA_DATA** - Full migration mode — imports 12 months of available historical PEKA data and generates monthly summaries for each month in parallel.

## Roadmap

- Add captcha solver
- Add possibility for multiple users
- Sending monthly summarizing email 

## License

This work is licensed under a [Creative Commons Attribution-NonCommercial 4.0 International License](https://creativecommons.org/licenses/by-nc/4.0/).

## Disclaimer

This project is not affiliated with PEKA or ZTM Poznań.

## Contact

For questions or feedback, please reach out via GitHub.
[ifmcjthenknczny](https://github.com/ifmcjthenknczny)