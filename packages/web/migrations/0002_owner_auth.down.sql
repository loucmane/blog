ALTER TABLE publishing_jobs
  DROP CONSTRAINT IF EXISTS publishing_jobs_previous_status_check,
  DROP COLUMN IF EXISTS previous_status,
  DROP COLUMN IF EXISTS time_zone;

ALTER TABLE article_revisions
  DROP COLUMN IF EXISTS title,
  DROP COLUMN IF EXISTS dek;

DROP TABLE IF EXISTS owner_passkeys;
DROP TABLE IF EXISTS owner_verifications;
DROP TABLE IF EXISTS owner_accounts;
DROP TABLE IF EXISTS owner_sessions;
DROP TABLE IF EXISTS owner_users;

DELETE FROM content_schema_migrations WHERE id = '0002_owner_auth';
