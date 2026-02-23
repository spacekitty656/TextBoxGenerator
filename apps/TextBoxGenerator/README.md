# Text Box Generator

This app is hosted under `/TextBoxGenerator/` and keeps its runtime code, assets, and tests scoped within `apps/TextBoxGenerator/`.

## Runtime entrypoint and source layout

- The browser runtime entrypoint is `apps/TextBoxGenerator/index.html` loading `<script type="module" src="src/app.js"></script>`.
- `apps/TextBoxGenerator/src/app.js` is the canonical app bootstrap and wiring layer.
- Reusable logic is split into focused modules under `apps/TextBoxGenerator/src/`.

## Local development

```bash
npm install
npm run dev
```

The Fastify server runs on `http://localhost:3000` by default.

- Root (`/`) serves a minimal landing page.
- Text Box Generator is available at `/TextBoxGenerator/`.

## App test commands

- `npm run test:textbox:unit` - Runs Text Box Generator unit tests with Vitest.
- `npm run test:textbox:e2e` - Runs Text Box Generator Playwright tests.
- `npm run test:textbox` - Runs both Text Box Generator test suites in order.
