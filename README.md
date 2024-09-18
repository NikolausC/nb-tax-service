# NB Tax Service
This service exposes a single-user web API to calculate the user's tax position at any point in time, based on the provided sales (and amendments) and tax transactions. Data persistence is achieved with a single-table SQLite database, which will be created as `transactions.db` in the project root. The actions of each request are logged to the terminal output, and all transactions are saved in the database, with amendments being new entries.

## Setup
This app was built and tested with NodeJS v20, which can be downloaded [here](https://nodejs.org/en/download/package-manager).

### Usage
1. Clone this repo and enter its root directory, then run `npm install` to install its dependencies.
1. Run `npm run build` to generate the JavaScript files for the project.
1. Start the webserver with `npm start`.

### Development
1. Clone this repo and enter its root directory, then run `npm install` to install its dependencies.
1. Run `npm run build-watch` to generate the JavaScript files for the project, and automatically regenerate them when changes are made to the TypeScript source.
1. With `build-watch` still running, start the webserver in another terminal with `npm run dev`. This will automatically reload when the JS files are rebuilt.

## Testing
The 'bruno_tests' directory includes a collection of requests for use with [Bruno](https://github.com/usebruno/bruno). These were used to test the service.

With more time, tests could be added into to the project to provide broader coverage and support for automated testing, e.g [Fastify Testing docs](https://fastify.dev/docs/v4.28.x/Guides/Testing/).

## Assumptions
- The two supported values of eventType (SALES and TAX_PAYMENT) must be uppercase strings. Any other casing will be rejected.
- Item amendments are treated the same as a sale transaction containing a single item, aside from being stored with event type "ITEM_AMENDMENT".

## Known Issues
- If data is sent to the transaction endpoint, but it doesn't match either schema (Sales or Tax Payment), the error message may contain information about both schemas.
- This is my first time working with TypeScript, though I've been using JavaScript and Fastify for years.