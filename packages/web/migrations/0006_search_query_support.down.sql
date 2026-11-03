DROP INDEX IF EXISTS article_search_documents_published_at_idx;
DROP INDEX IF EXISTS article_search_documents_title_trgm_idx;

-- pg_trgm belongs to the whole database, so another schema may still use it. It is dropped when
-- nothing else depends on it and this role may drop it; otherwise it stays, with a notice.
DO $reverse$
BEGIN
  DROP EXTENSION IF EXISTS pg_trgm;
EXCEPTION WHEN dependent_objects_still_exist OR insufficient_privilege THEN
  RAISE NOTICE 'pg_trgm stays installed: %', SQLERRM;
END
$reverse$;

DELETE FROM content_schema_migrations WHERE id = '0006_search_query_support';
