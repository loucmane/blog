-- Only aggregate public route patterns. No identifiers, paths, headers or per-visit rows.
CREATE TABLE analytics_page_views_daily (
  day date NOT NULL,
  route_pattern text NOT NULL CHECK (route_pattern IN ('/', '/stories/[slug]', '/sections/[slug]', '/topics/[slug]', '/authors/[slug]')),
  views bigint NOT NULL CHECK (views > 0),
  PRIMARY KEY (day, route_pattern)
);

-- Equivalent to percentile_cont(0.75) over the weighted, rounded observations. This walks
-- buckets, never expands counts into individual samples. Counts and values sort numerically.
CREATE FUNCTION telemetry_histogram_p75(histogram jsonb) RETURNS double precision
LANGUAGE sql IMMUTABLE STRICT PARALLEL SAFE AS $$
  WITH buckets AS (
    SELECT key::integer AS bucket, value::bigint AS n FROM jsonb_each_text(histogram)
  ), ranked AS (
    SELECT bucket, sum(n) OVER (ORDER BY bucket) AS cumulative,
      1 + 0.75 * (sum(n) OVER () - 1) AS rank
    FROM buckets
  ), bounds AS (
    SELECT min(bucket) FILTER (WHERE cumulative >= floor(rank)) AS low,
      min(bucket) FILTER (WHERE cumulative >= ceil(rank)) AS high,
      max(rank - floor(rank)) AS fraction
    FROM ranked
  )
  SELECT (low + (high - low) * fraction)::double precision FROM bounds
$$;

CREATE TABLE web_vitals_daily (
  day date NOT NULL,
  route_pattern text NOT NULL CHECK (route_pattern IN ('/', '/stories/[slug]', '/sections/[slug]', '/topics/[slug]', '/authors/[slug]')),
  metric text NOT NULL CHECK (metric IN ('LCP', 'INP', 'CLS')),
  sample_count bigint NOT NULL CHECK (sample_count > 0),
  histogram jsonb NOT NULL CHECK (jsonb_typeof(histogram) = 'object' AND histogram <> '{}'::jsonb),
  p75 double precision GENERATED ALWAYS AS (
    telemetry_histogram_p75(histogram) / CASE WHEN metric = 'CLS' THEN 1000.0 ELSE 1.0 END
  ) STORED,
  PRIMARY KEY (day, route_pattern, metric)
);
