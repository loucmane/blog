# Review-result contract

Classification: internal project documentation.

`schemas/agent-skills/review-result.schema.json` and `validateReviewResult` in
`scripts/agent-skills/lib.mjs` describe the same JSON envelope. The CLI calls
that runtime validator. Ingestion calls it before any command or worklog write;
blocking-category checks now belong to this shared boundary.

## Structural checks

- All ten envelope fields and all declared finding/evidence fields are required.
  Unknown properties are rejected at each of these object levels.
- Version is `1`; mode is `advisory`. Review/finding IDs use lowercase identifier
  characters; skill IDs use lowercase hyphenated identifiers. A head SHA is
  exactly 40 lowercase hexadecimal characters.
- Summary, finding category and finding message contain non-whitespace text.
  Finding severities and envelope verdicts use the declared enums. Subjective
  and blocking fields are JSON booleans.
- Subjective findings cannot block. Blocking categories must be in the
  deterministic `blockingEligibleCategories` list exported by `routing.mjs`.
  The schema repeats that list; a parity test detects divergence. Other
  nonempty categories remain valid when non-blocking.
- `not-applicable` requires an empty findings array. For compatibility,
  `pass`, `warn` and `fail` do not determine severity, finding count or blocking
  eligibility. Existing reviews use `pass` with informational findings;
  existing ingestion behavior allows `warn` with a blocking error. A verdict
  does not grant enforcement or workflow authority.
- Envelope evidence contains at least one `{kind, path}` item, where kind is
  `command`, `file` or `url` and path is a nonempty string. Per-finding evidence
  arrays may be empty; their individual references must be nonempty strings.
  Compatibility preserves whitespace-only evidence references/paths. These
  length checks are not assertions that the reference is useful or resolvable.

## Timestamp profile

`generatedAt` uses a four-digit Gregorian calendar date, `T`/`t`, hours,
minutes, seconds, optional fractional seconds, and a mandatory `Z`/`z` or
`+HH:MM`/`-HH:MM` offset. Hours range from 00 to 23; minutes and seconds from
00 to 59. The full-format check rejects impossible dates, including invalid
leap days. Leap seconds remain excluded, matching the original runtime.

Date-only, local-time, space-separated, natural-language and rollover inputs
previously accepted by `Date.parse` are rejected. Fractional precision is not
limited to milliseconds. Numeric offsets include `-00:00` and range through
23:59 as permitted by the format grammar; this does not attest a real civil
timezone or the timestamp's truth.

Consumers must enable **full `date-time` format assertions**. Draft 2020-12
permits annotation-only format handling; ignoring the format or using only a
fast regex does not implement this contract. The schema's pattern narrows the
timestamp profile, while `format` verifies calendar validity. The runtime
checks the calendar directly without JavaScript date normalization.

## Evidence truth and ingestion

Neither validator proves that a SHA exists or is the reviewed head, a command
ran, a file/URL exists, an artifact is authentic/current, or a finding's category
and blocking claim are justified. Neither proves a result's completeness,
reviewer authority, or absence of sensitive content. Those checks require
separate, inspected evidence and coordinator acceptance; schema acceptance is
not a release decision.

Ingestion separately enforces destination paths, receipt identity, duplicate
handling and command success. It hashes the result bytes and records a receipt;
the hash proves byte identity, not the truth of referenced evidence. See
`docs/agent-skills/ingestion.md` for the remaining ingestion controls. Its older
wording that ingestion adds the category restriction is superseded by the
shared validator behavior described here.

## Verification and current compatibility hold

Each JSON file in `tests/agent-skills/review-result-corpus/` contains `result`,
the expected boolean `valid`, and a short `reason`. Tests run every case through
the runtime and the actual published schema. An independent Ajv 6 validator
already installed by ESLint uses full formats and strict keyword checking.
Only meta-schema lookup is disabled because the URI is draft 2020-12; all
assertions currently used have the same meaning in the draft-7 subset Ajv
supports. There is no new dependency, custom format replacing the runtime,
remote resolution, or reuse of runtime validation in the schema oracle.

The same corpus exercises ingestion, including rejection before commands or
worklog writes. Compatibility tests cover existing fixture envelopes,
deterministic examples, scope-abstention examples and advice-v2 envelopes.
The historical forward blind bundle is a container of partial advice, not
complete envelopes. Test-only wrappers give its findings synthetic IDs and
severity where absent, preserving the original fields and evidence. No
historical source artifact is rewritten or claimed to be an ingestible result.

The implementation is **held for coordinator reconciliation**: eleven
existing deterministic examples use blocking categories outside the existing
allowlist. The stricter validator rejects them and the tests deliberately
remain red. Exact paths and proposed category corrections are recorded in
`docs/worklog/blog-n4y6.7.md`. The fixture-owning lane must resolve these before
this change can satisfy compatibility acceptance; the allowlist was not widened.
