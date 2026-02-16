# Text Box Generator

This project includes local development startup commands and a lightweight test setup for both unit and end-to-end checks.

## Local development

```bash
npm install
npm run dev
```

The Fastify server runs on `http://localhost:3000` by default and serves the static app files.

## Test commands

- `npm run test:unit` - Runs unit tests with Vitest in a jsdom environment.
- `npm run test:e2e` - Runs Playwright end-to-end tests against a locally served static build.
- `npm test` - Runs both suites in order (unit first, then e2e).

## Run all tests in one step

```bash
npm test
```

Playwright uses a local static server configured via `playwright.config.js`.
