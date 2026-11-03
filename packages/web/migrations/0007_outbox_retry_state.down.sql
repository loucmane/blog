-- Without the retry state there is no dead-letter status, so a dead letter goes back to being a
-- failed event. Its reason stays in last_error.
UPDATE outbox_events SET status = 'failed' WHERE status = 'dead_letter';

ALTER TABLE outbox_events DROP CONSTRAINT IF EXISTS outbox_events_status_check;
ALTER TABLE outbox_events ADD CONSTRAINT outbox_events_status_check
  CHECK (status IN ('completed', 'failed', 'pending'));
ALTER TABLE outbox_events DROP COLUMN IF EXISTS dead_lettered_at;
ALTER TABLE outbox_events DROP COLUMN IF EXISTS next_attempt_at;

DELETE FROM content_schema_migrations WHERE id = '0007_outbox_retry_state';
