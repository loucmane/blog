-- Newsletter subscribers, the consent each gave, the history of each subscription, and the tokens
-- their emailed links carry. The application owns all of it: an email provider is only ever handed
-- an address to write to, and no provider identifier keys anything here.
CREATE TABLE subscribers (
  id text PRIMARY KEY,
  email_canonical text UNIQUE,
  status text NOT NULL CHECK (status IN ('confirmed', 'pending', 'unsubscribed')),
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  confirmed_at timestamptz,
  unsubscribed_at timestamptz,
  -- Erasure removes the address of someone no longer subscribed and keeps the anonymized row;
  -- every live subscription has an address.
  CHECK (email_canonical IS NOT NULL OR status = 'unsubscribed'),
  CHECK (email_canonical IS NULL OR (char_length(email_canonical) <= 254 AND email_canonical = lower(email_canonical))),
  CHECK (status <> 'confirmed' OR confirmed_at IS NOT NULL),
  CHECK (status <> 'unsubscribed' OR unsubscribed_at IS NOT NULL)
);

-- An unsubscription sets withdrawn_at; a consent record is never deleted.
CREATE TABLE subscriber_consents (
  id text PRIMARY KEY,
  subscriber_id text NOT NULL REFERENCES subscribers(id) ON DELETE RESTRICT,
  consent_text_version text NOT NULL CHECK (consent_text_version ~ '^[a-z0-9]+(?:[.-][a-z0-9]+)*$'),
  source text NOT NULL CHECK (source ~ '^[a-z0-9]+(?:[-/][a-z0-9]+)*$'),
  granted_at timestamptz NOT NULL,
  withdrawn_at timestamptz
);

CREATE INDEX subscriber_consents_subscriber_idx ON subscriber_consents (subscriber_id, granted_at);

CREATE TABLE subscription_events (
  id text PRIMARY KEY,
  subscriber_id text NOT NULL REFERENCES subscribers(id) ON DELETE RESTRICT,
  type text NOT NULL CHECK (type IN ('confirmation-requested', 'confirmed', 'unsubscribed')),
  consent_id text REFERENCES subscriber_consents(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL,
  CHECK ((type = 'unsubscribed') = (consent_id IS NULL))
);

CREATE INDEX subscription_events_subscriber_idx ON subscription_events (subscriber_id, created_at);

-- The subscription history is append-only: changing or deleting a recorded event is refused.
CREATE FUNCTION subscription_events_append_only() RETURNS trigger
LANGUAGE plpgsql AS $append_only$
BEGIN
  RAISE EXCEPTION 'The subscription history is append-only; % of event % is refused.', TG_OP, OLD.id
    USING ERRCODE = 'restrict_violation';
END
$append_only$;

CREATE TRIGGER subscription_events_append_only
  BEFORE UPDATE OR DELETE ON subscription_events
  FOR EACH ROW EXECUTE FUNCTION subscription_events_append_only();

-- Only a token's SHA-256 is kept, under a label naming its purpose; the token itself goes into one
-- email and nowhere else. A token is used once: using it sets consumed_at.
CREATE TABLE subscription_tokens (
  token_hash text PRIMARY KEY CHECK (token_hash ~ '^[0-9a-f]{64}$'),
  subscriber_id text NOT NULL REFERENCES subscribers(id) ON DELETE CASCADE,
  purpose text NOT NULL CHECK (purpose IN ('confirm', 'unsubscribe')),
  consent_id text REFERENCES subscriber_consents(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL,
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz,
  CHECK ((purpose = 'confirm') = (consent_id IS NOT NULL)),
  CHECK (expires_at > created_at)
);

CREATE INDEX subscription_tokens_unused_idx
  ON subscription_tokens (subscriber_id, purpose) WHERE consumed_at IS NULL;
