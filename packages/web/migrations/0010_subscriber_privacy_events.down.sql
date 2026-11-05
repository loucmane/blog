BEGIN;
-- Refuse rollback once privacy events exist: audit history must never be discarded.
-- The table lock also prevents a concurrent privacy event from racing this check.
LOCK TABLE subscription_events IN ACCESS EXCLUSIVE MODE;
DO $privacy_rollback$
BEGIN
  IF EXISTS (SELECT FROM subscription_events WHERE type IN ('exported', 'erased')) THEN
    RAISE EXCEPTION 'Cannot reverse subscriber privacy events while privacy history exists.';
  END IF;
END
$privacy_rollback$;
ALTER TABLE subscription_events DROP CONSTRAINT subscription_events_type_check;
ALTER TABLE subscription_events DROP CONSTRAINT subscription_events_check;
ALTER TABLE subscription_events ADD CONSTRAINT subscription_events_type_check
  CHECK (type IN ('confirmation-requested', 'confirmed', 'unsubscribed'));
ALTER TABLE subscription_events ADD CONSTRAINT subscription_events_check
  CHECK ((type = 'unsubscribed') = (consent_id IS NULL));
DELETE FROM content_schema_migrations WHERE id = '0010_subscriber_privacy_events';
COMMIT;
