-- Job Analytics Events Table
-- For internal analysis of Job Creation funnel
-- Privacy: No candidate data, no content text, aggregate analysis only

CREATE TABLE IF NOT EXISTS job_analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Event info
  event_name VARCHAR(50) NOT NULL,
  event_timestamp TIMESTAMPTZ DEFAULT NOW(),

  -- Entity references (no PII)
  job_id UUID REFERENCES job_ads(id) ON DELETE SET NULL,
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,

  -- Event-specific payload (JSONB for flexibility)
  payload JSONB DEFAULT '{}',

  -- Denormalized flags for fast querying
  is_improved BOOLEAN DEFAULT FALSE,
  module VARCHAR(30), -- For module_saved events

  -- Session info (optional, for funnel analysis)
  session_id VARCHAR(100)
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_job_analytics_event_name ON job_analytics_events(event_name);
CREATE INDEX IF NOT EXISTS idx_job_analytics_job ON job_analytics_events(job_id);
CREATE INDEX IF NOT EXISTS idx_job_analytics_company ON job_analytics_events(company_id);
CREATE INDEX IF NOT EXISTS idx_job_analytics_timestamp ON job_analytics_events(event_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_job_analytics_improved ON job_analytics_events(is_improved) WHERE event_name IN ('job_viewed', 'apply_clicked', 'application_started');

-- Materialized view for daily KPIs (refresh periodically)
CREATE MATERIALIZED VIEW IF NOT EXISTS job_analytics_daily_kpis AS
SELECT
  DATE(event_timestamp) as date,

  -- Publish Success: job_published / job_creation_started
  COUNT(*) FILTER (WHERE event_name = 'job_creation_started') as creation_started,
  COUNT(*) FILTER (WHERE event_name = 'job_published') as published,

  -- Improvement Adoption: improved / published
  COUNT(DISTINCT job_id) FILTER (WHERE event_name = 'job_module_saved') as jobs_improved,

  -- Module breakdown
  COUNT(*) FILTER (WHERE event_name = 'job_module_saved' AND module = 'skills') as skills_saved,
  COUNT(*) FILTER (WHERE event_name = 'job_module_saved' AND module = 'experience') as experience_saved,
  COUNT(*) FILTER (WHERE event_name = 'job_module_saved' AND module = 'work_style') as work_style_saved,
  COUNT(*) FILTER (WHERE event_name = 'job_module_saved' AND module = 'team_snapshot') as team_snapshot_saved,
  COUNT(*) FILTER (WHERE event_name = 'job_module_saved' AND module = 'hiring_preferences') as hiring_prefs_saved,

  -- Apply metrics
  COUNT(*) FILTER (WHERE event_name = 'job_viewed') as job_views,
  COUNT(*) FILTER (WHERE event_name = 'job_viewed' AND is_improved = TRUE) as improved_job_views,
  COUNT(*) FILTER (WHERE event_name = 'apply_clicked') as apply_clicks,
  COUNT(*) FILTER (WHERE event_name = 'apply_clicked' AND is_improved = TRUE) as improved_apply_clicks,
  COUNT(*) FILTER (WHERE event_name = 'application_started') as applications,
  COUNT(*) FILTER (WHERE event_name = 'application_started' AND is_improved = TRUE) as improved_applications

FROM job_analytics_events
GROUP BY DATE(event_timestamp);

-- Index on materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_job_analytics_daily_date ON job_analytics_daily_kpis(date);

-- Comments
COMMENT ON TABLE job_analytics_events IS 'Job creation funnel events for product analytics';
COMMENT ON COLUMN job_analytics_events.payload IS 'Event-specific data in JSONB format';
COMMENT ON COLUMN job_analytics_events.is_improved IS 'Whether the job has Phase 2 data at event time';
COMMENT ON MATERIALIZED VIEW job_analytics_daily_kpis IS 'Daily aggregated KPIs - refresh with: REFRESH MATERIALIZED VIEW job_analytics_daily_kpis';
