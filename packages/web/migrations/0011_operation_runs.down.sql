BEGIN;
-- Refuse rollback once a run is recorded: backup and restore-drill history is recovery evidence.
-- The table lock also prevents a run recorded concurrently from racing this check.
LOCK TABLE operation_runs IN ACCESS EXCLUSIVE MODE;
DO $operation_runs_rollback$
BEGIN
  IF EXISTS (SELECT FROM operation_runs) THEN
    RAISE EXCEPTION 'Cannot reverse operation runs while recorded backup or restore-drill runs exist.';
  END IF;
END
$operation_runs_rollback$;
DROP TABLE operation_runs;
DELETE FROM content_schema_migrations WHERE id = '0011_operation_runs';
COMMIT;
