# Reader Lab preview

## Load the North House sample

After preparing the database below, the deployer can seed the private hosted
Preview once. Use an isolated Preview PostgreSQL database and media bucket;
the environment declaration does not select or verify those resources. Keep the
Preview behind the hosting provider's private access controls.

Configure these **only in the Preview deployment**, then deploy that configuration:

- `MAGAZINE_DEPLOYMENT_ENVIRONMENT=preview` (exact, lowercase value).
- `MAGAZINE_LAB_SEED_TOKEN`: a separate random secret, 32–512 bytes without
  whitespace. Inject it from your secret manager into the server and command
  environment; do not put it in a URL, command argument, source file or log.
- The existing `DATABASE_URL`, pointing to the migrated Preview database.
- The existing S3-compatible media settings: `MAGAZINE_MEDIA_BUCKET`,
  `MAGAZINE_MEDIA_REGION` (`auto` for R2), `MAGAZINE_MEDIA_ENDPOINT` (the R2 S3
  endpoint), and the paired `MAGAZINE_MEDIA_ACCESS_KEY_ID` and
  `MAGAZINE_MEDIA_SECRET_ACCESS_KEY` for that Preview bucket.

Hosted Preview runs with `NODE_ENV=production`; leave it that way. The exact
Preview declaration and matching bearer token are both required. Unset, blank,
`production` or any other declaration refuses hosted seeding. If `VERCEL_ENV` or
`VERCEL_TARGET_ENV` is present, it must also be `preview`; a production value
vetoes the explicit Preview declaration. Never set `MAGAZINE_OWNER_TEST_MODE` on
a hosted deployment: its production refusal remains active. No in-memory
fixture is used, and Preview without media storage refuses before content writes.

With the token already injected into the deployer's shell, run from the repository
root using the installed dependencies and pinned Node runtime:

```sh
MAGAZINE_DEPLOYMENT_ENVIRONMENT=preview \
MAGAZINE_LAB_SEED_URL=https://YOUR-PREVIEW-HOST \
node packages/web/scripts/lab-seed.mjs
```

The existing `pnpm --filter web lab:seed` command also accepts these environment
variables. The command reads process environment, not `.env` files. Remote targets
require HTTPS and the explicit Preview declaration even when called from a local
shell. Use a plain origin without credentials, path, query or fragment. It sends
one authenticated POST to `/api/internal/lab-seed`, refuses redirects, and prints
the seed report. It does not run migrations or create an owner account. If hosting
protection intercepts the request, use an operator-approved way to reach the private
Preview directly; the command does not bypass protection or follow sign-in redirects.

The report lists created and existing stories/images, and story slugs already used
by another article. A fresh database receives eight published stories in three
sections and nine PNG originals in the configured bucket. Re-running keeps existing
article IDs (including owner edits, unpublished status and section choices), section
names and media metadata/originals untouched. A conflicting story slug is skipped.
The report's `existing` story slugs are sample identifiers, not proof that an owner
has kept that story published or retained its original slug.

A 404 means seeding is unavailable or the token is rejected; check the server's
deployment declaration, provider signals and token. A 503 indicates missing or
invalid content/media configuration, including forbidden owner fixture mode. Other
failures or a timeout may leave a partial seed: inspect the Preview and report
before retrying, since seeding is incremental, not one transaction. Existing IDs
are left untouched on retry; it does not republish or repair an existing draft.
After verifying the sample, remove `MAGAZINE_LAB_SEED_TOKEN` from the Preview
environment and redeploy to disable the endpoint. Do not enable seeding in production.

Local development/test labs retain their existing token-protected flow without a
deployment declaration when no hosted deployment signals are present. This does
not loosen the separate owner fixture guard.

The existing `pnpm test:content:integration` Docker runner includes hosted seed
refusals and a real PostgreSQL/S3 run with original-byte checks, repeated seeding,
owner edits, unpublishing, section removal and a colliding owner slug.

## Prepare the hosted database

For the person preparing the preview: run migrations deliberately from the reviewed
repository checkout, before first sign-in. Use the repository's pinned Node 24 and
installed dependencies. The command reads the existing reviewed SQL files; it does
not generate migrations or run automatically during application startup or builds.

Have your secret manager or hosting environment supply `DATABASE_URL` to the shell
running the command. Use the isolated Preview database, with the provider's required
TLS connection settings. The script reads the process environment; it does not load
`.env` files. Do not paste the connection URL into a command argument, log, screenshot
or this document. No package script or package change is needed.

From the repository root, first inspect the target and pending migrations:

```sh
node packages/web/scripts/migrate.mjs
```

This is a dry run. It prints the effective host, port and database with credentials
redacted, then lists pending migration IDs in order. It uses a read-only transaction
and leaves even an empty database unchanged. Check the printed target against the
intended database before applying:

```sh
node packages/web/scripts/migrate.mjs --apply --environment preview
```

Every apply requires both flags. For an operator-approved production migration, use
the production database's environment and type the production confirmation:

```sh
node packages/web/scripts/migrate.mjs --apply --environment production
```

`--environment production` alone still performs a dry run. A production value in
`NODE_ENV`, `VERCEL_ENV` or `VERCEL_TARGET_ENV` refuses a Preview apply. A URL cannot
identify whether a database is production: `--environment` is your explicit
declaration and does not select or change `DATABASE_URL`. A Preview deployment
running with `NODE_ENV=production` therefore also requires the production confirmation.
The command can also run from `packages/web` as `node scripts/migrate.mjs` with the
same flags; SQL paths resolve from the script, independently of the working directory.

Applies reuse the existing transaction, advisory lock and checksum ledger. Concurrent
applies serialize; re-running skips migrations whose recorded checksums match, without
changing their timestamps. The pending list is a snapshot: the apply rechecks the
ledger under the lock. The command refuses unknown migration IDs, ordering gaps and
changed checksums. Do not edit previously applied SQL or the migration ledger to
force a match.

On failure the command exits non-zero and prints a safe diagnostic without raw
database errors or connection strings. Check connection/TLS settings and permissions,
or investigate a mismatched release/history as indicated. Failed SQL rolls the apply
transaction back. A dropped connection during commit can leave the outcome uncertain;
rerun the dry run to inspect the ledger before retrying. After a successful apply,
another dry run should show `Pending migrations (0)`. The first-sign-in setup below
can then use the prepared tables.

The command's real PostgreSQL checks run through the existing
`pnpm test:content:integration` Docker setup, including dry-run preservation, partial
history, production confirmation, concurrent applies, lock contention, idempotence,
checksum refusal, read-only connections and failure rollback.

## First sign-in

The person helping you set up the magazine will send you a private setup link. Open it on the device where you want to try your magazine. The page checks your link, then shows **Create your password** and your email address. Your email is hidden until the link has been checked.

Choose a password with 14–128 characters. Several unrelated words make a stronger password that is easier to remember. Spaces are welcome. Use **Show password** to check what you typed, then choose **Create account**. You will be signed in and taken to your Reader Lab, where the tour begins.

Keep the link private: anyone with it can create the first account. The private part disappears from the address bar when the page opens. If you refresh before finishing, reopen the original link. After setup, the link no longer creates accounts. Use **Sign in** with your email and password next time. You can add a passkey from your account page after signing in.

If the link does not work, ask the person helping you for a new one. After too many attempts, wait 15 minutes before trying again. If setup finished but the connection dropped, try signing in with the password you chose.

### For the person preparing the preview

Use the isolated Preview database and the existing Better Auth settings described in the deployment plan. Configure `MAGAZINE_OWNER_EMAIL` and, optionally, `MAGAZINE_OWNER_NAME`. Configure `MAGAZINE_OWNER_SETUP_TOKEN` with a fresh secret from a cryptographically secure random generator, for example `openssl rand -base64 48`. The configured value must contain at least 32 bytes (at most 512 bytes); length alone does not make a chosen phrase random. Keep it separate from `BETTER_AUTH_SECRET` and other credentials.

Share `https://<preview-host>/owner/setup#<URL-encoded-setup-token>` through a private channel. Use the fragment after `#`, never `?token=`: fragments are not sent in HTTP requests or Referer headers. The form sends the secret in its POST body; exclude request bodies from any external request logging or tracing. The application never logs or returns the setup secret.

Setup requires the existing owner-auth and content tables and works only while no owner or credential exists. It uses the existing idempotency table for an attempt limit shared by all instances and a separate permanent completion record. Five failed attempts in 15 minutes pause all attempts for that link, including the correct link. While paused, requests do not check the submitted secret or write another failure. The limit reduces abuse and database work; the random secret protects against guessing. The attempt allowance is associated with a digest of the configured secret, so a new secret starts a fresh allowance. Observing an existing account, including a partially provisioned one, permanently disables setup even if that account is later removed. No additional migration is needed. Changing the configured token or email will not reopen permanently disabled setup. Remove the setup token from the environment after the first sign-in. Do not delete the owner or completion record to reset an account; use account recovery.

### If the owner is locked out of setup

If the owner sees **Too many attempts**, they can wait 15 minutes and reopen their invitation. If the message keeps returning before they have created an account, the person preparing the preview can restore access:

1. Generate a new secret with `openssl rand -base64 48` and set it as `MAGAZINE_OWNER_SETUP_TOKEN` in the Preview environment.
2. Redeploy the preview so it uses the new secret.
3. Send the owner a new private link: `https://<preview-host>/owner/setup#<URL-encoded-new-secret>`.

The new link has a fresh attempt allowance. If an account already exists or setup has been permanently disabled, use sign-in or account recovery; changing the setup secret cannot reopen it.

The setup link does not enable public registration. Local Reader Lab and owner fixture/test mode keep their existing sign-in flow. A complete hosted setup check needs PostgreSQL and the production authentication runtime; the main browser suite deliberately uses owner fixture mode.
