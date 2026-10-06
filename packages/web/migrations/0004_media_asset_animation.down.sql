ALTER TABLE media_assets DROP COLUMN IF EXISTS animated;

DELETE FROM content_schema_migrations WHERE id = '0004_media_asset_animation';
