-- Search falls back to trigram similarity on titles when its words match nothing (BR-06), which
-- needs the pg_trgm extension (OQ-06). This preflight stops the migration with a reason someone
-- can act on when the extension is not offered, cannot be created, or sits in another schema,
-- rather than leaving search without its typo fallback. An extension is installed once per
-- database; pg_trgm goes in public, and every schema names its operator class and functions
-- there, whatever the session's search_path.
DO $preflight$
DECLARE
  installed_schema text;
BEGIN
  SELECT extnamespace::regnamespace::text INTO installed_schema
  FROM pg_extension
  WHERE extname = 'pg_trgm';

  IF installed_schema = 'public' THEN
    RETURN;
  END IF;
  IF installed_schema IS NOT NULL THEN
    RAISE EXCEPTION 'Search needs the PostgreSQL extension pg_trgm in schema public, but it is installed in schema %.', installed_schema
      USING HINT = 'Move it with ALTER EXTENSION pg_trgm SET SCHEMA public, then run the migrations again.';
  END IF;
  IF NOT EXISTS (SELECT FROM pg_available_extensions WHERE name = 'pg_trgm') THEN
    RAISE EXCEPTION 'Search needs the PostgreSQL extension pg_trgm, and this PostgreSQL server does not provide it.'
      USING HINT = 'Install the PostgreSQL contrib modules, or use a managed PostgreSQL that offers pg_trgm, then run the migrations again.';
  END IF;

  BEGIN
    CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA public;
  EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Search needs the PostgreSQL extension pg_trgm, and this migration could not create it: %', SQLERRM
      USING ERRCODE = SQLSTATE,
        HINT = 'Ask a database administrator to run CREATE EXTENSION pg_trgm WITH SCHEMA public in this database, then run the migrations again.';
  END;
END
$preflight$;

CREATE INDEX article_search_documents_title_trgm_idx
  ON article_search_documents USING gin (title public.gin_trgm_ops);

-- Newest-first reads of the search documents come from this index alone.
CREATE INDEX article_search_documents_published_at_idx
  ON article_search_documents (published_at DESC)
  INCLUDE (article_id, slug, title);
