# Deploy a private Reader Lab Preview

For the technical helper preparing the magazine for its owner. This creates an
isolated Vercel Preview with Neon PostgreSQL and a private Cloudflare R2 bucket,
following the [target platform](target-platform.md). This is a procedure, not
proof of an executed hosted deployment. Provider references were checked on
**2026-10-08**; see the partial Neon verification in [Costs](#costs).

Follow the numbered sections in order. Record the reviewed commit, Neon
project/branch/database, bucket name, Vercel project and final Preview URL without
recording secrets or invitation links. Use separate lab resources and credentials;
`preview` is a declaration, not a check that the database or bucket is isolated.
Purchases, publishing, credential changes and deletion remain operator actions.

## 1. Create accounts and prepare the checkout

1. Sign up or sign in to [GitHub](https://github.com/),
   [Cloudflare](https://dash.cloudflare.com/sign-up),
   [Neon](https://console.neon.tech/signup) and [Vercel](https://vercel.com/signup).
   Confirm access to this magazine's repository and use recoverable operator accounts.
2. Budget for **Vercel Pro** for this owner/client magazine evaluation. Hobby is
   for personal, non-commercial projects. Being private, unfinished or without
   revenue does not establish that a client/business project qualifies. A wholly
   personal, non-commercial experiment may qualify; this runbook does not assume
   that exception. See [Vercel pricing](https://vercel.com/pricing).
3. Open a reviewed checkout locally. Use **Node 24.18.0** from `.nvmrc` and
   **pnpm 11.11.0** from `package.json`. With Corepack available, run at the root:

   ```sh
   node --version
   corepack enable
   corepack pnpm --version
   corepack pnpm install --frozen-lockfile
   ```

   Expect `v24.18.0` and `11.11.0`. Keep secrets in a password/secret manager.
   Examples below are placeholders, not usable values.

## 2. Create the R2 bucket and scoped token

1. In Cloudflare, select the intended account → **R2 Object Storage**. Complete
   activation/billing if prompted, after reviewing [Costs](#costs).
2. Choose **Create bucket**, name it `magazine-reader-lab-preview`, select
   **Standard** storage and an appropriate location hint near the application
   (Europe for this walkthrough). Keep public development URLs and public custom
   domains disabled.
3. Open **Manage R2 API Tokens → Create Account API Token**. Choose **Object Read
   & Write → Apply to specific buckets only**, selecting only this Preview bucket.
   Do not grant account-wide bucket administration. Store the **Access Key ID**
   and **Secret Access Key** securely. The S3 client uses this pair, not the
   dashboard bearer-token value.
4. Copy the displayed **S3 API endpoint**. For an ordinary bucket its format is
   `https://<ACCOUNT_ID>.r2.cloudflarestorage.com`; copy the console's actual value
   for a jurisdiction-specific bucket. The SDK region setting is `auto`.

See [R2 S3 setup](https://developers.cloudflare.com/r2/get-started/s3/).
The server-side adapter stores originals and variants and serves media through
`/api/media/…`. This flow needs neither a public bucket nor browser CORS.

## 3. Create Neon and copy the direct connection

1. In Neon Console choose **New project**, name it `magazine-reader-lab-preview`,
   select PostgreSQL **18** (the target-platform candidate), and select an AWS
   region near Vercel's functions: **Frankfurt** for this walkthrough. Keep
   scale-to-zero for a lightly used lab. Create an empty project, not a branch
   copied from production owner/subscriber data.
2. Select the initial branch. Under **Tables / Databases**, create
   `magazine_preview` if absent. Use its generated database owner role for
   migrations and this isolated lab. A default branch named `main` does not by
   itself make the database production.
3. Click **Connect** to open **Connection Details**. Select the branch, database
   and role. Turn **Connection pooling OFF** to display the **direct/unpooled**
   string. With pooling ON the hostname contains `-pooler`; do not use that URL.
4. Store the direct string as `DATABASE_URL`. Preserve `sslmode=require` and any
   additional TLS parameters Neon supplies. Its placeholder format is
   `postgres://USER:PASSWORD@HOST/DB?sslmode=require`.

**Use the direct connection because seeding holds a session advisory lock for its
whole run, which transaction pooling cannot preserve.** Both the application and
migration command use this Preview URL. Never disable TLS to fix a connection
failure. Consult Neon's [connection guide](https://neon.com/docs/connect/connect-from-any-app)
if console labels differ. This application uses standard `pg`, not Neon Auth or
Neon's serverless driver. Its owner pool allows eight connections per instance;
a seed opens one additional dedicated connection. Watch usage if instances scale.

## 4. Migrate the Preview database

Have the secret manager inject `DATABASE_URL` into the helper's process environment.
The script does **not** load `.env` files. Do not put the URL in command arguments,
shell history, screenshots or logs. From the repository root under pinned Node:

```sh
node packages/web/scripts/migrate.mjs
```

This is a dry run. It prints the effective host, port and database with credentials
redacted, and lists pending migrations. It uses a read-only transaction, leaving
even an empty database unchanged. Check the target against Neon Console, then run:

```sh
node packages/web/scripts/migrate.mjs --apply --environment preview
node packages/web/scripts/migrate.mjs
```

The final dry run must report `Pending migrations (0)`. From `packages/web`, the
same command is `node scripts/migrate.mjs` with the same flags. Builds and app
startup do not migrate. Applies use a transaction, advisory lock and checksum
ledger: concurrent applies serialize and matching repeats are idempotent.
Unknown IDs, checksum changes or history gaps require checking the reviewed
release, not editing SQL history or the ledger.

Every apply requires both `--apply` and `--environment`; the latter does not select
or change the URL. If the helper process has `NODE_ENV=production`,
`VERCEL_ENV=production` or `VERCEL_TARGET_ENV=production`, a Preview apply is refused.
Use the intended local migration session, not a Vercel function. Production apply
requires the separate `--environment production` confirmation and is outside this
procedure. `--environment production` alone is still a dry run.

Failed SQL rolls the apply transaction back. A connection drop during commit can
leave the outcome uncertain: rerun the dry run before retrying. Check connection,
TLS, role and network settings for connection failures.

## 5. Create the Vercel project and configure Preview

### Import and build settings

1. Select **Add New → Project → Import Git Repository**, connect GitHub, authorize
   this repository and name the project `magazine-reader-lab`.
2. Choose **Next.js**, Root Directory **`packages/web`**, and enable **Include
   source files outside of the Root Directory in the Build Step** so workspace
   files and the root lockfile/package-manager pin are available.
3. Set Install Command to `cd ../.. && corepack pnpm install --frozen-lockfile`.
   Set Build Command to `node --version && corepack pnpm --version && corepack pnpm build`.
   The build runs inside `packages/web`, where `build` is `next build`. Leave Output
   Directory at the Next.js default (`.next`). Add build environment variable
   `ENABLE_EXPERIMENTAL_COREPACK=1`. See [Vercel build settings](https://vercel.com/docs/builds/configure-a-build).
4. In **Settings → Build and Deployment → Node.js Version**, select **24.x**.
   Vercel manages minor/patch versions and cannot pin exactly 24.18.0 in the
   dropdown. Check the build log against the repository engine range
   `>=24.18.0 <25`, record the actual version, and stop if it is older. See
   [Vercel Node versions](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions).
5. In **Settings → Functions**, select Frankfurt (`fra1`) to match Neon and keep
   Fluid Compute enabled. Under **Function Max Duration**, set **Default Max
   Duration** to **360 seconds** on Pro and Save. This leaves cleanup time beyond
   the seed's 300-second application deadline. The seed route has no `maxDuration`
   override. See [duration settings](https://vercel.com/docs/functions/configuring-functions/duration).

Import may start a deployment of the default Production branch. Keep **lab
credentials out of Production**; that initial deployment is not the lab. Finish
configuration, then deploy an approved **non-production branch** as Preview in
step 6. Do not promote the lab to Production or use its production domain for seed.

### Generate independent secrets

Run `openssl rand -base64 48` separately for each required generated value and
save the result securely. Remove the terminal newline when pasting. Each result
is 64 printable characters; application secrets accept 32–512 UTF-8 bytes. Never
reuse values. Preview-token, preview-cookie and revalidation routes explicitly
refuse shared secrets. Do not use a secret generator website.

| Generated value                                                    | Generate / obtain         | When needed                                                              |
| ------------------------------------------------------------------ | ------------------------- | ------------------------------------------------------------------------ |
| `MAGAZINE_OWNER_SETUP_TOKEN`                                       | `openssl rand -base64 48` | First invitation only; remove after setup.                               |
| `BETTER_AUTH_SECRET`                                               | `openssl rand -base64 48` | Persistent auth.                                                         |
| `MAGAZINE_LAB_SEED_TOKEN`                                          | `openssl rand -base64 48` | Server/helper must match; no whitespace; remove after seed verification. |
| `MAGAZINE_PREVIEW_TOKEN_SECRET`                                    | `openssl rand -base64 48` | Draft authorization.                                                     |
| `MAGAZINE_PREVIEW_COOKIE_SECRET`                                   | `openssl rand -base64 48` | Draft cookie signing.                                                    |
| `MAGAZINE_REVALIDATION_SECRET`                                     | `openssl rand -base64 48` | Authenticated cache invalidation.                                        |
| `MAGAZINE_PUBLICATION_WORKER_TOKEN`                                | `openssl rand -base64 48` | If a publication-job caller is configured.                               |
| `MAGAZINE_OWNER_RECOVERY_WEBHOOK_SECRET`                           | `openssl rand -base64 48` | If a recovery delivery service is configured; share with that service.   |
| `MAGAZINE_OWNER_TEST_TOKEN`                                        | `openssl rand -base64 48` | Local tests only; never configure on hosted deployments.                 |
| `MAGAZINE_MEDIA_ACCESS_KEY_ID`, `MAGAZINE_MEDIA_SECRET_ACCESS_KEY` | R2 token screen           | Provider-issued pair; do not generate locally.                           |
| `DATABASE_URL` password                                            | Neon connection screen    | Provider-issued; retain inside the secret URL.                           |

### Complete environment table

Open **Settings → Environment Variables**, select **Preview only**, optionally
restrict to the lab branch, and set the required values below. Production entries
refer to a future separate deployment: never copy lab values there. Redeploy after
changes. All secret values are server-only; never prefix them with `NEXT_PUBLIC_`.

Inventory sources, relative to `packages/web`: `src/server/owner/config.ts`,
`runtime.ts`, `setup.ts`, preview/revalidation routes, `src/lib/site-url.ts`,
`src/server/lab/environment.mjs` and the migration/seed scripts. The docs test scans
application and command source rather than maintaining a second manual list.

<!-- reader-lab-environment:start -->

| Name                                     | Purpose                                     | Where to get it / example format                                              | Preview                                                 | Production                                    | Secret?                   |
| ---------------------------------------- | ------------------------------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------- | --------------------------------------------- | ------------------------- |
| `DATABASE_URL`                           | Auth, content and migrations                | Neon Connect, pooling OFF: `postgres://USER:PASSWORD@HOST/DB?sslmode=require` | Required; isolated direct database                      | Separate reviewed database                    | Yes                       |
| `BETTER_AUTH_SECRET`                     | Auth signing/encryption                     | Generated above: `<AUTH_SECRET>`                                              | Required                                                | Separate required secret                      | Yes                       |
| `BETTER_AUTH_URL`                        | Trusted auth origin / passkey host          | Final protected branch URL: `https://<PREVIEW_HOST>`                          | Exact origin owner will use                             | Canonical production HTTPS origin             | No                        |
| `MAGAZINE_RUNTIME_SITE_URL`              | Server reader/preview origin; auth fallback | Same origin: `https://<PREVIEW_HOST>`                                         | Required for working reader/preview links               | Canonical production origin                   | No                        |
| `MAGAZINE_OWNER_EMAIL`                   | Sole owner identity                         | Ask owner: `owner@example.com`                                                | Required actual email                                   | Actual production owner email                 | Private personal data     |
| `MAGAZINE_OWNER_NAME`                    | Display name                                | Ask owner: `Magazine owner`                                                   | Optional; that default, max 120 characters              | Optional                                      | Private personal data     |
| `MAGAZINE_OWNER_TIME_ZONE`               | Scheduling timezone                         | Owner's IANA zone: `Europe/Stockholm`                                         | Optional; defaults to that zone                         | Owner's chosen zone                           | No                        |
| `MAGAZINE_OWNER_SETUP_TOKEN`             | First password/account                      | Generated above: `<SETUP_TOKEN>`                                              | Until first setup completes                             | Separate one-time setup if approved           | Yes                       |
| `MAGAZINE_MEDIA_BUCKET`                  | Originals and variants                      | R2 name: `magazine-reader-lab-preview`                                        | Required for seed/media                                 | Separate production bucket                    | No                        |
| `MAGAZINE_MEDIA_REGION`                  | S3 SDK region                               | R2 value: `auto`                                                              | Required with bucket                                    | `auto` for R2                                 | No                        |
| `MAGAZINE_MEDIA_ENDPOINT`                | S3 API origin                               | R2 console: `https://<ACCOUNT_ID>.r2.cloudflarestorage.com`                   | Required for R2                                         | Production provider endpoint                  | No                        |
| `MAGAZINE_MEDIA_ACCESS_KEY_ID`           | S3 credential ID                            | R2 token screen: `<R2_ACCESS_KEY_ID>`                                         | Required with paired secret                             | Separate scoped credential                    | Yes; protect pair         |
| `MAGAZINE_MEDIA_SECRET_ACCESS_KEY`       | S3 credential secret                        | R2 token screen: `<R2_SECRET_ACCESS_KEY>`                                     | Required with ID                                        | Separate scoped secret                        | Yes                       |
| `MAGAZINE_PREVIEW_TOKEN_SECRET`          | Draft preview tokens                        | Generated above: `<PREVIEW_TOKEN_SECRET>`                                     | Required for draft preview                              | Separate secret                               | Yes                       |
| `MAGAZINE_PREVIEW_COOKIE_SECRET`         | Draft cookie signature                      | Generated above: `<PREVIEW_COOKIE_SECRET>`                                    | Required for draft preview                              | Separate secret                               | Yes                       |
| `MAGAZINE_REVALIDATION_SECRET`           | Authenticates `/api/revalidate`             | Generated above: `<REVALIDATION_SECRET>`                                      | Configure independently                                 | Separate secret                               | Yes                       |
| `MAGAZINE_DEPLOYMENT_ENVIRONMENT`        | Hosted seed gate                            | Literal lowercase `preview`                                                   | Required: `preview`                                     | `production`, never `preview`                 | No                        |
| `MAGAZINE_LAB_SEED_TOKEN`                | Seed bearer token                           | Generated above: `<SEED_TOKEN>`                                               | Temporary; identical server/helper values               | Omit                                          | Yes                       |
| `MAGAZINE_LAB_SEED_URL`                  | Seed command target override                | Final origin: `https://<PREVIEW_HOST>`                                        | Helper shell only; no path/query/fragment               | Omit                                          | No                        |
| `MAGAZINE_PUBLICATION_WORKER_TOKEN`      | Publication-job POST auth                   | Generated above: `<WORKER_TOKEN>`                                             | Optional unless testing scheduled jobs                  | Required for separately configured job caller | Yes                       |
| `MAGAZINE_OWNER_RECOVERY_WEBHOOK_URL`    | Service delivering reset links              | Your service's HTTPS origin: `https://<RECOVERY_HOST>`                        | Optional; no recovery delivery if absent                | Configure/verify before relying on recovery   | No; no credentials in URL |
| `MAGAZINE_OWNER_RECOVERY_WEBHOOK_SECRET` | Recovery service bearer auth                | Generated above: `<RECOVERY_SECRET>`                                          | Required if webhook URL is set                          | Separate shared secret                        | Yes                       |
| `MAGAZINE_CONTENT_BACKEND`               | Setup refuses `framework-fixture`           | Leave unset; optional `postgres`                                              | Never `framework-fixture`; runtime uses database URL    | Same                                          | No                        |
| `MAGAZINE_OWNER_TEST_MODE`               | In-memory owner fixture                     | Local test harness: `1`                                                       | Omit; hosted runtime refuses it                         | Omit                                          | No                        |
| `MAGAZINE_OWNER_TEST_TOKEN`              | Local fixture auth                          | Local harness: `<LOCAL_TEST_TOKEN>`                                           | Omit                                                    | Omit                                          | Yes                       |
| `NEXT_PUBLIC_SITE_URL`                   | Public metadata URL                         | Same origin: `https://<PREVIEW_HOST>`                                         | Set before build                                        | Canonical production origin                   | No; public                |
| `ENABLE_EXPERIMENTAL_COREPACK`           | Vercel pinned-pnpm selection                | Literal `1`                                                                   | Set for build                                           | Same build setting if used                    | No                        |
| `NODE_ENV`                               | Runtime mode, not deployment classification | Next/Vercel sets `production`                                                 | Leave provider-managed                                  | Leave provider-managed                        | No                        |
| `VERCEL`                                 | Hosted signal read by seed gate             | Vercel supplies `1`                                                           | Leave provider-managed                                  | Leave provider-managed                        | No                        |
| `VERCEL_ENV`                             | Provider deployment classification          | Provider supplies environment name                                            | Must be `preview` if present                            | `production` vetoes seed                      | No                        |
| `VERCEL_TARGET_ENV`                      | Provider target signal                      | Provider supplies target name                                                 | Must be `preview` if present                            | Non-Preview value vetoes seed                 | No                        |
| `VERCEL_AUTOMATION_BYPASS_SECRET`        | Protection credential for helper below      | Vercel Protection Bypass for Automation: `<PROTECTION_SECRET>`                | Helper shell only; seed CLI does not read automatically | Outside this procedure                        | Yes                       |

<!-- reader-lab-environment:end -->

Hosted Preview correctly runs with `NODE_ENV=production`. Do not set it to `test`
or `development`. Hosted seed needs explicit Preview intent and a matching token;
non-Preview provider signals veto it. Unpaired storage settings fail rather than
activating a fixture.

The recovery URL parser retains only the origin, so a path-specific webhook will
not work as expected. Its service must accept a root-path POST with bearer auth
and JSON `{ email, resetUrl }`, then deliver privately to the owner. This repository
does not provision that service. A publication worker token also does not install
a scheduler: scheduled publishing needs a separate caller of
`POST /api/internal/publication-jobs`.

### Keep the entire lab private

Open **Deployment Protection** under Security or Settings in the current dashboard.
Enable **Vercel Authentication** for **All Deployments**, covering aliases and any
initial Production deployment. Give the owner authorized access, or use
plan-supported **Password Protection** and share that password privately. Test
from a browser without a Vercel session. See [Deployment Protection](https://vercel.com/docs/deployment-protection)
and [Vercel Authentication](https://vercel.com/docs/deployment-protection/methods-to-protect-deployments/vercel-authentication).

Owner sign-in protects editing, not all published reader pages. `noindex` asks
search engines not to index; it is not access control. Use the generated Preview
`.vercel.app` branch URL: Vercel adds `X-Robots-Tag: noindex`. A custom domain
assigned to a branch is an exception, so this procedure does not use one. See
[Vercel indexing behavior](https://vercel.com/kb/guide/are-vercel-preview-deployment-indexed-by-search-engines).

The code adds `noindex, nofollow, noarchive` on owner routes and reader responses
carrying the lab-direction cookie. It does not globally noindex ordinary reader
pages just because `MAGAZINE_DEPLOYMENT_ENVIRONMENT=preview`. Verify the provider
header on `/` without the lab cookie too.

## 6. Deploy the Preview branch

1. Deploy the reviewed non-production branch through Git (a push/PR), or choose
   **Deployments → Create Deployment** with that branch. Confirm environment
   **Preview**, not Production or a custom environment.
2. Copy the branch Preview URL from the deployment's Domains list. Set
   `BETTER_AUTH_URL`, `MAGAZINE_RUNTIME_SITE_URL` and `NEXT_PUBLIC_SITE_URL` to that
   same stable HTTPS origin. If import did not yet show a URL, use this first
   deployment to discover it, set the values, then **Redeploy** before continuing.
3. Confirm Ready status, intended commit, Preview-scoped variables and the runtime
   versions printed in the build log. Use the configured branch origin for all
   owner activity; another immutable deployment URL is a different auth/passkey
   origin. Do not promote this deployment to Production.

## 7. Smoke-check before seed

1. In a fresh private browser, open the lab and a reader/API URL. Deployment
   Protection must deny access or require login/password. Repeat for aliases;
   your already authenticated browser alone cannot prove privacy.
2. Pass the provider gate, then open `/`. Empty content before seed is expected;
   an unavailable-store message or database exception is not. Open `/owner/setup`
   without a token: it must not reveal the email. Do not create the owner's
   password yourself. `/owner` must require magazine sign-in.
3. In developer tools → Network, inspect the application response for `/` and
   confirm `X-Robots-Tag` includes `noindex`. Inspect `/owner/setup` for private,
   no-store caching and owner privacy headers. Check application responses, not
   just the Vercel login redirect.
4. Confirm the migration dry run still reports zero pending migrations. Inspect
   function logs for configuration failures without copying secrets or request
   bodies. Use the exact deployment intended for handoff.

## 8. Seed North House

Inject the deployed `MAGAZINE_LAB_SEED_TOKEN` into the helper environment from the
secret manager. From the repository root, replacing `<PREVIEW_HOST>` first:

```sh
MAGAZINE_DEPLOYMENT_ENVIRONMENT=preview \
MAGAZINE_LAB_SEED_URL='https://<PREVIEW_HOST>' \
node packages/web/scripts/lab-seed.mjs
```

`pnpm --filter web lab:seed` is the same entry point. It does not load `.env` files,
migrate or create an owner. It sends one bearer-authenticated POST to
`/api/internal/lab-seed`, refuses redirects, waits up to 120 seconds and prints JSON.

**Deployment Protection intercepts the plain command on the protected lab.** The
CLI has no option for a protection header and does not use browser cookies. Keep
protection enabled. In Vercel's Deployment Protection screen, create an approved
**Protection Bypass for Automation** secret. Inject it only into the helper shell
as `VERCEL_AUTOMATION_BYPASS_SECRET` and use the seed client's existing `fetcher`
injection point:

```sh
MAGAZINE_DEPLOYMENT_ENVIRONMENT=preview \
MAGAZINE_LAB_SEED_URL='https://<PREVIEW_HOST>' \
node --input-type=module <<'NODE'
import { runLabSeed } from './packages/web/scripts/lab-seed.mjs'

const protectionSecret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET
if (!protectionSecret) throw new Error('Missing helper protection credential.')
try {
  const report = await runLabSeed({
    fetcher: (url, options) => fetch(url, {
      ...options,
      headers: { ...options.headers, 'x-vercel-protection-bypass': protectionSecret },
    }),
  })
  console.log(JSON.stringify(report, null, 2))
} catch (error) {
  console.error(error.message)
  process.exitCode = 1
}
NODE
```

This preserves the application token check and redirect refusal. The protection
secret grants project-wide bypass: never put it in a query, source file or shared
URL. Revoke it and remove it from the helper environment after use. See
[Vercel automation bypass](https://vercel.com/docs/deployment-protection/methods-to-bypass-deployment-protection/protection-bypass-automation).

Allow **about 30 seconds** for a fresh seed: an estimate, not a measured hosted
guarantee. A fresh database receives **eight published stories, three sections and
nine PNG originals**. Check `stories.created`, `stories.existing`,
`stories.slugInUse`, `images.created`, `images.existing` and `images.skipped` in the
report. Open the actual stories, sections and images before declaring success.

| Result                                           | Meaning / action                                                                                                              |
| ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| App HTTP 409                                     | Another seed holds the database lock, including on another instance. Wait, inspect the lab and retry; do not force-unlock it. |
| App HTTP 404                                     | Seed disabled or token rejected. Check deployed token, explicit `preview` declaration and provider signals.                   |
| App HTTP 503                                     | Invalid/missing content or media configuration, including forbidden fixture mode. Correct configuration and redeploy.         |
| Redirect, provider 401/403, HTML instead of JSON | Protection intercepted the request. Use the protected helper; do not disable protection or create a public exception.         |
| Timeout / other failure                          | A partial seed may remain. Inspect logs/data/pages, wait for the active run to end, then retry.                               |

Seeding is incremental, not one transaction. Retry preserves existing sample IDs,
owner edits, unpublished status, section choices and media metadata/originals.
A sample slug owned by another article is skipped. `existing` lists sample
identifiers, not proof the owner retained a slug or kept the story published.
An uploaded but unverified object can remain for retry. Existing drafts are not
repaired or republished.

The server has a five-minute run deadline. Storage PUT/verification, SQL statement,
lock and idle-transaction waits are capped at 30 seconds and shortened to remaining
time. Startup has a ten-second connection timeout; rollback, unlock and shutdown
each have five-second cleanup bounds. Failed cleanup destroys the dedicated
connection to release its lock. A caller timeout does not cancel work while the
host keeps it alive; platform termination can interrupt it. The application's
deadline does not override Vercel's limit.

After checking the sample, remove `MAGAZINE_LAB_SEED_TOKEN` from Preview and
redeploy. Verify a seed POST through the provider gate now returns the app's 404,
then revoke the temporary protection credential and remove both helper secrets.
Do not enable seeding in Production.

## 9. Invite the owner

1. Confirm the protected branch origin still matches the three URL settings and
   that the setup token is deployed. Give the owner access through the provider
   gate first.
2. Privately send `https://<PREVIEW_HOST>/owner/setup#<URL-encoded-setup-token>`.
   Encode the token locally with a trusted tool (`encodeURIComponent` works);
   base64 may contain `+` and `/`. Use the fragment after `#`, never `?token=`.
   Never paste the invitation into an issue or external encoder.
3. After the link is checked, the owner sees their email and **Create your
   password**. They choose **14–128 characters**, select **Create account**, and
   are signed in to `/owner/reader-lab`. Spaces are allowed; **Show password**
   helps check typing. The fragment disappears on load; refresh before completion
   means reopening the original link.
4. After confirmed first sign-in, remove `MAGAZINE_OWNER_SETUP_TOKEN` and redeploy.
   Later visits use `/owner/sign-in`. The owner can add a passkey from their
   account page on the same origin.

Anyone holding an unused invitation can create the first account. Fragments are
not sent in HTTP requests or Referer headers, but the form POST includes the
secret: exclude request bodies from external logging/tracing.

### Setup recovery

Five failed attempts within 15 minutes pause all attempts for that link, including
correct ones. Wait 15 minutes and reopen it. Before account creation, the operator
can generate a fresh setup token, update Preview, redeploy and send a new private
fragment link; its attempt allowance is fresh.

Setup permanently disables after completion or observing an existing account or
credential, including partial provisioning. Changing token/email cannot reopen
it. Do not delete the owner or completion record to reset setup. If creation
succeeded but the connection dropped, try normal sign-in with the chosen password.
Lost-password delivery requires the optional recovery service; if omitted, the
operator must arrange recovery support before that feature can work.

### What the owner sees

The Reader Lab tour introduces five presentations of the same sample magazine:
Quiet Monograph, Literary Long-read, Swiss Index, Cinematic Feature and Expressive
Colour. The owner can compare them, read stories and try the publishing workspace.
Provider access and magazine sign-in are separate steps. Send the
[Reader Lab owner guide](../reader-lab-owner-guide.md) alongside the invitation.
**Coordinator handoff:** that companion guide is to be written at this path;
verify it exists before sending its link to the owner.

## Costs

Checked **2026-10-08**, USD before tax. These are allowances/rates, not a bill
forecast or hard spending cap. Review usage/billing screens and configure available
budget alerts before handoff.

| Service     | Free allowance                                                                                                                                          | Paid rates / relevant limits                                                                                                                                                                                                             | Verification                                                                                                                                                                                                                                                                         |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Vercel      | Hobby $0, personal non-commercial only: 100 GB transfer, 1M CDN requests and 1M function invocations/month; 4 active CPU hours and 360 GB-hours memory. | Pro starts at $20/month with $20 usage credit; developer seats $20/month. Password Protection listed at $20/project/month extra. Compute examples start at $0.128/CPU-hour and $0.0106/GB-hour, region-dependent.                        | [Official pricing](https://vercel.com/pricing), read today. Pro is this client/owner lab's budget assumption.                                                                                                                                                                        |
| Neon        | Free $0: 100 projects, 1 GB PostgreSQL storage/project, 100 CU-hours/project/month, up to 2 CU, 10 branches/project, six-hour restore window.           | Historical Nov 2025 announcement (current paid terms unverified): Launch $0.106/CU-hour, Scale $0.222/CU-hour. That announcement also lists a $5/month minimum and $0.35/GB-month storage; current paid limits and rates **unverified**. | [Oct 2 Free update](https://neon.com/blog/neon-free-plan-1-gb-per-project) and [compute announcement](https://neon.com/blog/major-compute-price-reduction-on-neon) read today. [Pricing page](https://neon.com/pricing) fetch failed; confirm all paid terms there before upgrading. |
| R2 Standard | 10 GB-month storage, 1M Class A and 10M Class B operations/month; Internet egress free.                                                                 | Above allowances: $0.015/GB-month, $4.50/million Class A and $0.36/million Class B. Usage rounds up to billing units. Infrequent Access has different rates and no Standard free allowance.                                              | [Official R2 pricing](https://developers.cloudflare.com/r2/pricing/), read today; choose Standard.                                                                                                                                                                                   |

The web reader reached Vercel/R2 and Neon's announcements. Neon's pricing page
returned an unsupported-content error; shell access could not resolve `neon.com`.
**Neon paid pricing is only partially verified**, not a current confirmed quote.
The October 2 announcement supersedes old references to 0.5 GB Free storage.

Budget at least Vercel Pro's base cost plus protection add-ons, taxes and usage.
Neon Free and R2 allowances may cover a light trial; image generation, sustained
connections and repeated previews affect usage. Fluid Compute caps Hobby functions
at 300 seconds, whereas Pro permits up to 800 seconds; the 360-second setting needs
Pro. See [function limits](https://vercel.com/docs/functions/configuring-functions/duration).
Email/recovery delivery, domains, backups and a scheduler are not included in this
estimate. The app does not use Neon's managed Better Auth offering.

## Rollback and teardown

**Application rollback:** keep Deployment Protection enabled. Redeploy the last
known-good reviewed commit to the same **Preview branch** with current correct
Preview variables. Recheck privacy, origins, sign-in, pages and media. Do not
promote it to Production. Old immutable deployments can retain old environment
snapshots, including seed tokens; do not share them. Redeploy without retired
tokens before restoring an old version.

**Data rollback:** app rollback does not undo migrations, seed content or R2
objects. Before later migrations/destructive experiments, retain a database backup
and media copy using the [backup/restore runbook](backup-restore.md). Restore into
separate isolated resources, verify them, then deliberately change Preview
configuration and redeploy. A short Neon restore window is not a durable backup.
Do not delete migration records or blindly reset data to run an older app; prefer
compatible forward repair.

**Teardown requires operator confirmation that the owner is finished and useful
edits are exported:**

1. Keep protection active, stop any configured job caller, remove temporary
   seed/setup secrets and revoke automation bypass. Redeploy if keeping the app
   available during export.
2. Verify required database/media backups outside these disposable resources.
   Record resource names without credentials.
3. In Vercel, disconnect the lab Git integration or remove the dedicated lab
   project/deployments/aliases so a future push cannot revive it. Verify lab URLs
   stop serving the app.
4. Revoke the bucket-scoped R2 token; empty/delete only the Preview bucket after
   verifying exports. In Neon, delete only the isolated lab project or deliberately
   selected disposable branch/database.
5. Remove retained lab secrets and unnecessary helper access. Check all three
   billing screens for surviving resources/add-ons and the next invoice. Project
   deletion does not necessarily cancel a team subscription.

## Source checks and maintenance

Application claims were checked against these sources:

- [Owner config](../../packages/web/src/server/owner/config.ts),
  [runtime](../../packages/web/src/server/owner/runtime.ts),
  [auth](../../packages/web/src/server/owner/auth.ts) and
  [setup](../../packages/web/src/server/owner/setup.ts): identity, storage,
  recovery and one-time account creation.
- [Migration command](../../packages/web/scripts/migrate.mjs): dry-run/apply
  guards and checksum history.
- [Seed client](../../packages/web/scripts/lab-seed.mjs),
  [deployment gate](../../packages/web/src/server/lab/environment.mjs),
  [timeouts](../../packages/web/src/server/lab/limits.ts) and
  [seed route](../../packages/web/src/app/api/internal/lab-seed/route.ts):
  transport, authorization, duration and response meanings.
- [Next config](../../packages/web/next.config.ts) and
  [request security](../../packages/web/src/lib/request-security.ts): privacy
  headers and distinct signing secrets.

Run `pnpm exec vitest run packages/web/tests/docs/reader-lab-preview.test.ts` when
configuration changes. Existing `pnpm test:content:integration` exercises migration,
setup and seed against real PostgreSQL/S3 fixtures; it does not replace the hosted
Vercel/Neon/R2 smoke checks above.
