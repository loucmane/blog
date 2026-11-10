-- Privacy operations share the subscriber transaction and append-only history.
ALTER TABLE subscription_events DROP CONSTRAINT subscription_events_type_check;
ALTER TABLE subscription_events DROP CONSTRAINT subscription_events_check;
ALTER TABLE subscription_events ADD CONSTRAINT subscription_events_type_check
  CHECK (type IN ('confirmation-requested', 'confirmed', 'unsubscribed', 'exported', 'erased'));
ALTER TABLE subscription_events ADD CONSTRAINT subscription_events_check
  CHECK ((type IN ('unsubscribed', 'exported', 'erased')) = (consent_id IS NULL));
