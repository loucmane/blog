# Signed-in Reader Lab Lighthouse

From the repository root, run `node scripts/lab-lighthouse.mjs --direction quiet-monograph`.
The command seeds North House in a running local server, creates an owner fixture session,
and measures home, the long-table article, and the Interiors section. Use a production **build**
served with `NODE_ENV=test`, just like the Playwright suite: the fixture endpoints are deliberately
unavailable in a production runtime. Do not use `next dev` for performance evidence.

## Set up the host

Use the project's Node 24.18.0 / pnpm 11.11.0 toolchain. Install the optional audit tool separately
from the application, then use its absolute module path. Lighthouse's own `puppeteer-core`
dependency supplies the compatible browser API; it does not download a browser.

```sh
npm install --prefix /tmp/reader-lab-audit --no-save --ignore-scripts lighthouse@13.5.0
export LIGHTHOUSE_MODULE=/tmp/reader-lab-audit/node_modules/lighthouse/core/index.js
pnpm exec playwright install chromium
```

The harness uses Playwright's installed Chromium by default. Set `CHROME_PATH` to use an existing
Chromium executable instead. It accepts a normal local `lighthouse` installation too when
`LIGHTHOUSE_MODULE` is unset. No project dependency or lockfile edit is needed for this optional tool.

Build, then start the local fixture server in terminal A:

```sh
env -u MAGAZINE_OWNER_TEST_MODE -u MAGAZINE_OWNER_TEST_TOKEN \
  NEXT_PUBLIC_SITE_URL=https://canonical.magazine.invalid pnpm --filter web build

NODE_ENV=test \
  MAGAZINE_OWNER_TEST_MODE=1 \
  MAGAZINE_OWNER_TEST_TOKEN=task43-owner-test-token-with-more-than-thirty-two-bytes \
  MAGAZINE_LAB_SEED_TOKEN=task44-lab-seed-token-with-more-than-32-bytes \
  MAGAZINE_OWNER_EMAIL=owner@example.test \
  MAGAZINE_OWNER_NAME='Editorial owner' \
  MAGAZINE_RUNTIME_SITE_URL=http://localhost:3100 \
  BETTER_AUTH_URL=http://localhost:3100 \
  PORT=3100 pnpm --filter web start
```

In terminal B, with `LIGHTHOUSE_MODULE` exported as above:

```sh
MAGAZINE_OWNER_TEST_TOKEN=task43-owner-test-token-with-more-than-thirty-two-bytes \
  MAGAZINE_LAB_SEED_TOKEN=task44-lab-seed-token-with-more-than-32-bytes \
  node scripts/lab-lighthouse.mjs --direction quiet-monograph --url http://localhost:3100
```

Both tokens must match the server. Use a dedicated local fixture server: each run invokes the
idempotent North House seed endpoint in its content store. The URL must be a plain `localhost`
or `127.0.0.1` origin; keep its hostname consistent with the server's runtime and auth URLs.
The script uses the existing server and leaves its lifecycle to the caller.

## Results and failure behavior

Each route gets a fresh browser context with the owner cookie from the fixture response and the
`reader_lab_direction` cookie. Lighthouse receives that exact context's page, with storage reset
disabled, following its [authenticated-page recipe](https://github.com/GoogleChrome/lighthouse/blob/main/docs/recipes/auth/README.md).
Cookies use Puppeteer's [browser-context cookie API](https://pptr.dev/api/puppeteer.browsercontext.setcookie).
No Cookie request-header workaround or separate browser connection is used.

After each audit, the harness requires HTTP 200, the requested URL, exactly one root with the
requested `data-reader-direction`, and the authenticated Reader Lab bar on the audited document.
An unknown direction, lost session, baseline fallback, redirect, Lighthouse runtime error, or
missing metric fails the command. Every context and the browser close on success or failure.
The identity check never revisits the page, so it cannot accidentally validate a different navigation.

Only after all three routes pass, the script prints a table and writes a new `run-*` folder under
`ci-artifacts/lab-lighthouse/<direction>/` containing:

- `home`, `article`, and `section` reports, each in HTML and Lighthouse JSON.
- `summary.json`: verified direction/URL/status, performance and accessibility scores (0–100),
  LCP and TBT in milliseconds, unitless CLS, Lighthouse version, timestamp, settings, and warnings.

The profile is Lighthouse's default simulated mobile profile. Browser caches start cold for every
route; server-side generated image variants can remain warm between runs. Record whether the
server was fresh, and compare repeated runs with the same tool/browser versions and server state.
Scores are measurements, not enforced budgets. The lab bar is included in the audit.

Use `--article <slug>` / `--section <slug>` for other seeded pages and `--output <directory>` for
another report root. `--help` needs neither tokens nor Lighthouse. A failed run returns a nonzero
exit code and publishes no summary; an older run directory is never reused.

## Checks without Chromium

```sh
pnpm exec vitest run packages/web/tests/tooling/lab-lighthouse.test.mjs packages/web/tests/reader/reader-routes.test.ts
```

The harness tests are also included in the normal `pnpm test` suite. They exercise DOM verification,
fixture cookies, the page handoff, invalid results, cleanup, and report output through fakes.
The real browser run remains necessary to validate Lighthouse/CDP integration and obtain scores.
