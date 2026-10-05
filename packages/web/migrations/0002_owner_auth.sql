CREATE TABLE owner_users (
  id text PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  email_verified boolean NOT NULL DEFAULT false,
  image text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE owner_sessions (
  id text PRIMARY KEY,
  expires_at timestamptz NOT NULL,
  token text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  ip_address text,
  user_agent text,
  user_id text NOT NULL REFERENCES owner_users(id) ON DELETE CASCADE
);

CREATE INDEX owner_sessions_user_id_idx ON owner_sessions (user_id);

CREATE TABLE owner_accounts (
  id text PRIMARY KEY,
  account_id text NOT NULL,
  provider_id text NOT NULL,
  user_id text NOT NULL REFERENCES owner_users(id) ON DELETE CASCADE,
  access_token text,
  refresh_token text,
  id_token text,
  access_token_expires_at timestamptz,
  refresh_token_expires_at timestamptz,
  scope text,
  password text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX owner_accounts_user_id_idx ON owner_accounts (user_id);

CREATE TABLE owner_verifications (
  id text PRIMARY KEY,
  identifier text NOT NULL,
  value text NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX owner_verifications_identifier_idx ON owner_verifications (identifier);

CREATE TABLE owner_passkeys (
  id text PRIMARY KEY,
  name text,
  public_key text NOT NULL,
  user_id text NOT NULL REFERENCES owner_users(id) ON DELETE CASCADE,
  credential_id text NOT NULL UNIQUE,
  counter integer NOT NULL CHECK (counter >= 0),
  device_type text NOT NULL,
  backed_up boolean NOT NULL,
  transports text,
  created_at timestamptz NOT NULL DEFAULT now(),
  aaguid text
);

CREATE INDEX owner_passkeys_user_id_idx ON owner_passkeys (user_id);

ALTER TABLE publishing_jobs
  ADD COLUMN previous_status text,
  ADD COLUMN time_zone text NOT NULL DEFAULT 'UTC';

UPDATE publishing_jobs AS job
SET previous_status = CASE
  WHEN article.status = 'published' THEN 'published'
  WHEN article.status = 'unpublished' THEN 'unpublished'
  ELSE 'draft'
END
FROM articles AS article
WHERE article.id = job.article_id;

ALTER TABLE publishing_jobs
  ALTER COLUMN previous_status SET NOT NULL,
  ADD CONSTRAINT publishing_jobs_previous_status_check
    CHECK (previous_status IN ('draft', 'published', 'unpublished'));

ALTER TABLE article_revisions
  ADD COLUMN title text,
  ADD COLUMN dek text;
