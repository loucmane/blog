-- Select the no-op sink before rolling back. Aggregate history is lost.
DROP TABLE IF EXISTS web_vitals_daily;
DROP FUNCTION IF EXISTS telemetry_histogram_p75(jsonb);
DROP TABLE IF EXISTS analytics_page_views_daily;
DELETE FROM content_schema_migrations WHERE id = '0009_distribution_telemetry';
