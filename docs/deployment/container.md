# Deploy the magazine on Node or in a container

The fallback runs Next.js on Node 24.18.0 with standard PostgreSQL and S3-compatible storage. Use the [central environment table](reader-lab-preview.md#complete-environment-table) to configure the app, database and media store. Supply runtime secrets through the host's secret manager. Keep any runtime environment file outside the checkout and restrict who can read it. Use the canonical HTTPS origin for owner authentication and public links.

## Build the image

From a clean checkout of the reviewed commit, build with Docker BuildKit. The build uses the workspace-pinned pnpm through Corepack and a frozen lockfile. The `REVISION` build argument contains the full source commit. The image records it as the OCI revision label and serves it at `/build-revision.txt`.

```sh
revision=$(git rev-parse HEAD)
image="magazine:$revision"
docker build --build-arg REVISION="$revision" --tag "$image" .
```

The build checks the filtered context for local configuration, credential filenames, symlinks and generated worktree files. It takes no application secrets. Keep the approved tag immutable and record the image digest when one is available. Retain the last known-good image for rollback.

## Migrate and start

Use an approved deployment environment with a reachable PostgreSQL database and S3 bucket. Create or verify the backup and review the migration and schema compatibility first. See the [backup and restore procedure](backup-restore.md). Use the same image for the database migration and the application. In the examples, replace the network and environment-file paths with the values provisioned on the host.

Run the existing migration command in a one-off container. Inject the migration role's connection via the migration environment file. First inspect the pending migration IDs, then apply the reviewed set and repeat the dry run to verify zero pending migrations.

```sh
docker run --rm --read-only --network magazine \
  --env-file /secure/path/migration.env "$image" node scripts/migrate.mjs

docker run --rm --read-only --network magazine \
  --env-file /secure/path/migration.env "$image" \
  node scripts/migrate.mjs --apply --environment production
```

The image uses a production Node runtime, so its migration command requires the explicit `--environment production` flag on apply. The same guard applies when rehearsing this image with an isolated database. Confirm the database target before applying.

Start the application separately. The image starts Next.js as the `node` user. Use a read-only container filesystem and mount `/tmp` as writable tmpfs for Next's disposable cache. Terminate HTTPS at the host proxy and bind the app port to loopback if the proxy runs on that host.

```sh
docker run --detach --name magazine --read-only --network magazine \
  --tmpfs /tmp:rw,noexec,nosuid,nodev,size=256m,mode=1777 \
  --publish 127.0.0.1:3000:3000 \
  --env-file /secure/path/application.env "$image"
```

The image health check calls `/api/health`. Before directing traffic, check the same endpoint through the proxy, verify the revision file against the release, and verify published content, RSS, sitemap, owner access and the scheduler using the settings for that environment.

## Run the local portability smoke

Use Docker on the local host with the repository's disposable Compose fixtures. Run this separately from content integration because the fixtures use the same loopback service ports. Use a fresh `blog-container-smoke` Compose project with synthetic data. The smoke applies migrations, prepares the S3 fixture bucket, starts the image read-only, and seeds North House through the local app. It removes its own containers and reports each check without printing Docker subprocess logs or configured values.

```sh
docker compose --file packages/web/tests/content/docker-compose.yml \
  --project-name blog-container-smoke up --detach --wait postgres s3-primary

node packages/web/scripts/container-smoke.mjs "$image" "$revision"

docker compose --file packages/web/tests/content/docker-compose.yml \
  --project-name blog-container-smoke down --volumes
```

The last command removes the disposable database and S3 volumes. Run it even if the smoke exits with a failure. Keep the image ID, source commit and smoke summary with the acceptance evidence.

## Run directly on Node

On a separate host using the pinned Node version, use a clean release checkout with Corepack available. Build before injecting runtime secrets, run the separate migration command with the reviewed database target, and start Next.js under the service manager with runtime configuration from the central table.

```sh
corepack pnpm install --frozen-lockfile
corepack pnpm build
node packages/web/scripts/migrate.mjs
node packages/web/scripts/migrate.mjs --apply --environment production
corepack pnpm --filter web start --hostname 127.0.0.1 --port 3000
```

## Roll back an image

Confirm the previous release is compatible with the current schema. Start the last known-good image by its retained immutable tag or digest with the same runtime configuration and read-only settings. Verify its health and revision and rerun the reader, owner and scheduler checks before shifting traffic. A database recovery uses the verified restore or forward-repair procedure in the [backup and restore runbook](backup-restore.md).

## Remaining managed-host checks

The local smoke covers the Node/container entry point with synthetic PostgreSQL and S3 services. The [target platform acceptance](target-platform.md#acceptance-evidence) also calls for the protected managed preview and a production-like deployment, isolated environment and media verification, scheduler timing and failure evidence, the cost envelope and a rollback rehearsal. Record managed-host smoke and recovery evidence against the exact reviewed revision before promotion.
