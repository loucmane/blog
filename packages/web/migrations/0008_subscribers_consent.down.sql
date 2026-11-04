-- Nothing canonical references the subscription tables, so reverting costs the subscriber data
-- alone, which an export (blog-0045.12) can keep first. Confirmation emails still queued name
-- subscribers that no longer exist, so they go too; every other outbox event stays.
DROP TABLE IF EXISTS subscription_tokens;
DROP TABLE IF EXISTS subscription_events;
DROP FUNCTION IF EXISTS subscription_events_append_only();
DROP TABLE IF EXISTS subscriber_consents;
DROP TABLE IF EXISTS subscribers;
DELETE FROM outbox_events WHERE type = 'email.subscription-confirm';

DELETE FROM content_schema_migrations WHERE id = '0008_subscribers_consent';
