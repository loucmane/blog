-- One row per finished run of the backup or restore-drill command, read by the health check and
-- the owner job view: what ran, whether it worked and, from a fixed list, why not, when it started
-- and finished, and for a drill the recovery point and time it measured. No path, key, host, URL,
-- set name or payload is stored.
CREATE TABLE operation_runs (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  kind text NOT NULL CHECK (kind IN ('backup', 'restore-drill')),
  outcome text NOT NULL CHECK (outcome IN ('succeeded', 'failed')),
  failure_reason text CHECK (failure_reason IN (
    'invalid_configuration', 'invalid_key_file', 'tls_required', 'invalid_manifest',
    'authentication_failed', 'truncated_file', 'checksum_mismatch', 'missing_object',
    'operation_failed', 'unsupported_version', 'target_exists', 'migration_identity_mismatch',
    'row_count_mismatch', 'invariant_changed', 'orphaned_object', 'export_invalid',
    'rpo_exceeded', 'rto_exceeded', 'invalid_clock'
  )),
  started_at timestamptz NOT NULL,
  finished_at timestamptz NOT NULL,
  rpo_ms bigint CHECK (rpo_ms >= 0),
  rto_ms bigint CHECK (rto_ms >= 0),
  CHECK (finished_at >= started_at),
  CHECK ((outcome = 'failed') = (failure_reason IS NOT NULL)),
  -- A backup measures no recovery; a drill that worked measured both.
  CHECK (kind = 'restore-drill' OR (rpo_ms IS NULL AND rto_ms IS NULL)),
  CHECK (kind = 'backup' OR outcome = 'failed' OR (rpo_ms IS NOT NULL AND rto_ms IS NOT NULL))
);

-- The latest run of each kind, by when it finished.
CREATE INDEX operation_runs_latest_idx ON operation_runs (kind, finished_at DESC, id DESC);
