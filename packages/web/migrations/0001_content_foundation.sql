CREATE TABLE publication_settings (
  id text PRIMARY KEY,
  owner_time_zone text NOT NULL,
  default_locale text NOT NULL,
  version integer NOT NULL DEFAULT 1 CHECK (version > 0),
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL
);

CREATE TABLE authors (
  id text PRIMARY KEY,
  slug text NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  display_name text NOT NULL,
  bio text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL
);

CREATE TABLE articles (
  id text PRIMARY KEY,
  slug text NOT NULL CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  title text NOT NULL,
  dek text NOT NULL DEFAULT '',
  status text NOT NULL CHECK (status IN ('draft', 'scheduled', 'published', 'unpublished')),
  current_draft_revision_id text NOT NULL,
  published_revision_id text,
  scheduled_revision_id text,
  version integer NOT NULL DEFAULT 1 CHECK (version > 0),
  scheduled_at timestamptz,
  published_at timestamptz,
  deleted_at timestamptz,
  pre_delete_status text CHECK (pre_delete_status IS NULL OR pre_delete_status IN ('draft', 'scheduled', 'published', 'unpublished')),
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  CHECK (
    status <> 'published'
    OR (published_revision_id IS NOT NULL AND published_at IS NOT NULL)
  ),
  CHECK (
    status <> 'scheduled'
    OR (scheduled_revision_id IS NOT NULL AND scheduled_at IS NOT NULL)
  ),
  CHECK (
    deleted_at IS NULL
    OR pre_delete_status IS NOT NULL
  )
);

CREATE UNIQUE INDEX articles_active_slug_key ON articles (slug) WHERE deleted_at IS NULL;
CREATE INDEX articles_status_publication_idx ON articles (status, scheduled_at, published_at);

CREATE TABLE article_revisions (
  id text PRIMARY KEY,
  article_id text NOT NULL,
  revision_number integer NOT NULL CHECK (revision_number > 0),
  document_schema_version integer NOT NULL CHECK (document_schema_version > 0),
  document jsonb NOT NULL CHECK (jsonb_typeof(document) = 'object'),
  created_at timestamptz NOT NULL,
  CONSTRAINT article_revisions_article_fk
    FOREIGN KEY (article_id) REFERENCES articles(id)
    ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED,
  UNIQUE (article_id, revision_number),
  UNIQUE (article_id, id)
);

ALTER TABLE articles
  ADD CONSTRAINT articles_current_draft_revision_fk
    FOREIGN KEY (id, current_draft_revision_id)
    REFERENCES article_revisions(article_id, id)
    DEFERRABLE INITIALLY DEFERRED,
  ADD CONSTRAINT articles_published_revision_fk
    FOREIGN KEY (id, published_revision_id)
    REFERENCES article_revisions(article_id, id)
    DEFERRABLE INITIALLY DEFERRED,
  ADD CONSTRAINT articles_scheduled_revision_fk
    FOREIGN KEY (id, scheduled_revision_id)
    REFERENCES article_revisions(article_id, id)
    DEFERRABLE INITIALLY DEFERRED;

CREATE TABLE article_autosaves (
  id text PRIMARY KEY,
  article_id text NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  revision_id text NOT NULL REFERENCES article_revisions(id) ON DELETE RESTRICT,
  article_version integer NOT NULL CHECK (article_version > 0),
  idempotency_key text NOT NULL,
  created_at timestamptz NOT NULL,
  UNIQUE (article_id, idempotency_key)
);

CREATE TABLE taxonomies (
  id text PRIMARY KEY,
  kind text NOT NULL CHECK (kind IN ('category', 'section', 'tag')),
  slug text NOT NULL CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  name text NOT NULL,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  UNIQUE (kind, slug)
);

CREATE TABLE article_taxonomies (
  article_id text NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  taxonomy_id text NOT NULL REFERENCES taxonomies(id) ON DELETE RESTRICT,
  position integer NOT NULL DEFAULT 0 CHECK (position >= 0),
  PRIMARY KEY (article_id, taxonomy_id)
);

CREATE TABLE slug_redirects (
  id text PRIMARY KEY,
  article_id text NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  from_slug text NOT NULL UNIQUE CHECK (from_slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  to_slug text NOT NULL CHECK (to_slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  created_at timestamptz NOT NULL,
  CHECK (from_slug <> to_slug)
);

CREATE TABLE media_assets (
  id text PRIMARY KEY,
  original_key text NOT NULL UNIQUE,
  original_sha256 text NOT NULL CHECK (original_sha256 ~ '^[0-9a-f]{64}$'),
  bytes bigint NOT NULL CHECK (bytes >= 0),
  content_type text NOT NULL,
  width integer CHECK (width IS NULL OR width > 0),
  height integer CHECK (height IS NULL OR height > 0),
  alt text NOT NULL,
  caption text NOT NULL DEFAULT '',
  credit_name text NOT NULL,
  credit_url text,
  focal_x double precision NOT NULL CHECK (focal_x >= 0 AND focal_x <= 1),
  focal_y double precision NOT NULL CHECK (focal_y >= 0 AND focal_y <= 1),
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL
);

CREATE TABLE media_renditions (
  id text PRIMARY KEY,
  media_id text NOT NULL REFERENCES media_assets(id) ON DELETE CASCADE,
  object_key text NOT NULL UNIQUE,
  sha256 text NOT NULL CHECK (sha256 ~ '^[0-9a-f]{64}$'),
  bytes bigint NOT NULL CHECK (bytes >= 0),
  content_type text NOT NULL,
  width integer NOT NULL CHECK (width > 0),
  height integer NOT NULL CHECK (height > 0),
  created_at timestamptz NOT NULL,
  UNIQUE (media_id, width, height, content_type)
);

CREATE TABLE reusable_blocks (
  id text PRIMARY KEY,
  name text NOT NULL,
  kind text NOT NULL,
  current_revision_id text NOT NULL,
  version integer NOT NULL DEFAULT 1 CHECK (version > 0),
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL
);

CREATE TABLE reusable_block_revisions (
  id text PRIMARY KEY,
  block_id text NOT NULL,
  revision_number integer NOT NULL CHECK (revision_number > 0),
  document_schema_version integer NOT NULL CHECK (document_schema_version > 0),
  document jsonb NOT NULL CHECK (jsonb_typeof(document) = 'object'),
  created_at timestamptz NOT NULL,
  CONSTRAINT reusable_block_revisions_block_fk
    FOREIGN KEY (block_id) REFERENCES reusable_blocks(id)
    ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED,
  UNIQUE (block_id, revision_number),
  UNIQUE (block_id, id)
);

ALTER TABLE reusable_blocks
  ADD CONSTRAINT reusable_blocks_current_revision_fk
  FOREIGN KEY (id, current_revision_id)
  REFERENCES reusable_block_revisions(block_id, id)
  DEFERRABLE INITIALLY DEFERRED;

CREATE TABLE publishing_jobs (
  id text PRIMARY KEY,
  article_id text NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  revision_id text NOT NULL REFERENCES article_revisions(id) ON DELETE RESTRICT,
  run_at timestamptz NOT NULL,
  status text NOT NULL CHECK (status IN ('cancelled', 'claimed', 'completed', 'pending', 'superseded')),
  idempotency_key text NOT NULL,
  attempt integer NOT NULL DEFAULT 0 CHECK (attempt >= 0),
  claimed_by text,
  lease_until timestamptz,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  UNIQUE (article_id, idempotency_key),
  CHECK (
    status <> 'claimed'
    OR (claimed_by IS NOT NULL AND lease_until IS NOT NULL)
  )
);

CREATE INDEX publishing_jobs_due_idx ON publishing_jobs (run_at, status, lease_until);

CREATE TABLE outbox_events (
  id text PRIMARY KEY,
  aggregate_id text NOT NULL,
  type text NOT NULL,
  payload jsonb NOT NULL CHECK (jsonb_typeof(payload) = 'object'),
  status text NOT NULL CHECK (status IN ('completed', 'failed', 'pending')),
  attempts integer NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  last_error text,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL
);

CREATE INDEX outbox_events_delivery_idx ON outbox_events (status, created_at);

CREATE TABLE audit_events (
  id text PRIMARY KEY,
  article_id text NOT NULL REFERENCES articles(id) ON DELETE RESTRICT,
  actor_id text,
  action text NOT NULL,
  metadata jsonb NOT NULL CHECK (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz NOT NULL
);

CREATE INDEX audit_events_article_time_idx ON audit_events (article_id, created_at);

CREATE TABLE idempotency_records (
  operation text NOT NULL,
  key text NOT NULL,
  result jsonb NOT NULL,
  created_at timestamptz NOT NULL,
  PRIMARY KEY (operation, key)
);

CREATE TABLE article_search_documents (
  article_id text PRIMARY KEY REFERENCES articles(id) ON DELETE CASCADE,
  slug text NOT NULL,
  title text NOT NULL,
  search_text text NOT NULL,
  published_at timestamptz NOT NULL,
  document tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(search_text, '')), 'B')
  ) STORED,
  updated_at timestamptz NOT NULL
);

CREATE INDEX article_search_documents_document_idx
  ON article_search_documents USING gin (document);
