-- The outbox dispatcher retries a failed event after a backoff and sets aside, as a dead letter, an
-- event it cannot deliver: one whose type no handler supports, or one whose retries are spent.
-- next_attempt_at is when a failed event is due again; a pending event is due at once.
-- dead_lettered_at is when an event was set aside. A dead letter is never tried again.
ALTER TABLE outbox_events ADD COLUMN next_attempt_at timestamptz;
ALTER TABLE outbox_events ADD COLUMN dead_lettered_at timestamptz;

ALTER TABLE outbox_events DROP CONSTRAINT outbox_events_status_check;
ALTER TABLE outbox_events ADD CONSTRAINT outbox_events_status_check
  CHECK (status IN ('completed', 'dead_letter', 'failed', 'pending'));
