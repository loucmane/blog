# Outbox drain scheduler

The maintainer configures a scheduler to call `POST /api/internal/outbox/drain`.
Each call handles one bounded batch of due outbox events: search projection
updates, reader cache invalidation (including feeds and sitemap), and registered
email events. Scheduled publication itself remains the separate
`/api/internal/publication-jobs` worker.

| Environment variable           | Purpose                                                                                                                                                          | Provisioning                                                                                                                                                                                                                                                                                                |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `MAGAZINE_OUTBOX_DRAIN_SECRET` | Server-only shared bearer credential for this route. Missing, empty, shorter than 32 UTF-8 bytes, or longer than 512 bytes keeps the route closed with HTTP 503. | The operator generates at least 32 random bytes, encodes them as hex or base64url, and provisions the same value in the application deployment and scheduler secret store. Use a distinct value from owner, preview, publication-worker, and revalidation credentials. Never use a `NEXT_PUBLIC_` variable. |

Provisioning and rotation require the operator. This code change creates no
credential or schedule. Do not put the value in source, a URL, shell history,
command arguments, scheduler output, or request-header logging. Keep authorization
headers redacted in the proxy and scheduler as well as the application.

The deployment needs the owner's PostgreSQL runtime (`DATABASE_URL`) and the
existing content, search, and outbox retry migrations. The in-memory owner test
runtime is deliberately refused: completing an event against a disposable search
projection would lose its effect. The route reuses the owner repository and pool;
it does not create them until authorization and batch validation pass.

## Schedule and request

Start with **one POST every minute**, `?limit=1`, and prevent overlapping runs in
the scheduler. The default when `limit` is absent is 25 events; the allowed range
is 1–100. Raise the batch size only after measuring event duration and backlog.
Handlers have a 30-second timeout per event and run sequentially, so 25 slow
handlers alone can consume 12.5 minutes, plus database work. Match the batch size
to the hosting platform's request-duration limit. A client timeout does not prove
the server stopped working; do not immediately loop on a timeout.

Configure the platform scheduler with:

- Method: `POST` (no request body).
- URL: `https://<deployment-host>/api/internal/outbox/drain?limit=1`.
- Header: `Authorization: Bearer <value supplied by the scheduler secret store>`.
- Optional header: `X-Correlation-ID: <unique run reference, 8–128 letters,
digits, underscores, dots, colons, or hyphens>`.
- Frequency: every minute; limit concurrency to one and retain status/counts only.

For cron, the operator can install a small wrapper at
`/usr/local/bin/magazine-outbox-drain` and schedule it as:

```cron
* * * * * /usr/bin/flock -n /run/magazine-outbox/drain.lock /usr/local/bin/magazine-outbox-drain
```

The operator creates the private lock directory and a scheduler-readable,
mode-0600 `/etc/magazine/outbox-drain.headers` containing the authorization header
from the secret store. The wrapper can execute the following command, with the
actual deployment hostname substituted. Only the header file path is in argv:

```sh
curl --silent --show-error --fail-with-body \
  --connect-timeout 5 --max-time 50 \
  --request POST \
  --header @/etc/magazine/outbox-drain.headers \
  'https://<deployment-host>/api/internal/outbox/drain?limit=1'
```

Do not enable verbose curl output, shell tracing, redirects, or immediate retry
loops. Use HTTPS. The application accepts the credential only in the bearer
header, never in a query parameter. No `outbox:drain` package script is added in
this slice; the scheduler calls HTTP directly.

## Results and recovery

All responses prohibit caching and carry `X-Correlation-ID`. A successful
response reports counts, for example:

```json
{ "completed": 1, "deadLettered": 0, "retrying": 0 }
```

Zero counts mean no events were due. A 200 can still contain retries or dead
letters: monitor those counts and the owner's job view. The dispatcher retains
its existing retry backoff, attempt budget, transaction/claim rules, and event
idempotency keys. It never resets dead letters automatically. Delivery remains
at least once if a process is interrupted after an external effect but before
recording completion.

| HTTP status | Meaning and maintainer action                                                                                                                           |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 200         | One batch finished. Track counts and queue age; investigate dead letters in the owner job view.                                                         |
| 400         | Invalid `limit`; use a whole number from 1 to 100.                                                                                                      |
| 401         | Missing, malformed, or wrong bearer credential. Verify the scheduler and application secret references without displaying their values.                 |
| 503         | The drain secret is not configured or is outside its length bounds. Have the operator provision it.                                                     |
| 500         | Runtime construction or draining failed. Inspect redacted logs using the correlation id; verify PostgreSQL configuration, migrations, and availability. |

Current email handlers use the development console sender. A completed email
event is a simulated delivery, not proof of production email delivery. Provisioning
a real provider is separate work.

After deployment, the maintainer checks missing and wrong credentials return 401,
then calls once with the scheduler credential and verifies counts, correlation id,
and the relevant search/cache/job outcome. No secret should appear in the response
or logs. Repeat these checks after a secret rotation.

To pause draining, disable the schedule first. Pending and retryable events remain
in PostgreSQL for a later authorized run. To rotate, pause the scheduler, have the
operator update both secret stores and reload the deployment, verify a single
call, then resume. To roll back the route, stop the scheduler and deploy the prior
application revision; this change has no migration and requires no data rollback.
