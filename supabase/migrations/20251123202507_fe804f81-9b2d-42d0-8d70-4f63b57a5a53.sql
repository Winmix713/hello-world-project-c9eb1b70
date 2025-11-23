-- ====================================
-- WINMIX DATABASE MIGRATION PART 1: Core Schema & Foundation
-- Consolidates 15 migrations into one
-- ====================================

-- 1) CORE SCHEMA (20251031233306)
CREATE TABLE IF NOT EXISTS public.leagues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  country TEXT NOT NULL,
  season TEXT NOT NULL,
  avg_goals_per_match DECIMAL(3,2) DEFAULT 2.5,
  home_win_percentage DECIMAL(5,2) DEFAULT 45.0,
  btts_percentage DECIMAL(5,2) DEFAULT 50.0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_league_season UNIQUE (name, season)
);

CREATE TABLE IF NOT EXISTS public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  league_id UUID REFERENCES public.leagues(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id UUID REFERENCES public.leagues(id) ON DELETE CASCADE,
  home_team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
  away_team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
  match_date TIMESTAMPTZ NOT NULL,
  home_score INTEGER,
  away_score INTEGER,
  status TEXT DEFAULT 'scheduled',
  halftime_home_score INTEGER,
  halftime_away_score INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_matches_date ON public.matches(match_date);
CREATE INDEX IF NOT EXISTS idx_matches_status ON public.matches(status);
CREATE INDEX IF NOT EXISTS idx_matches_home_team ON public.matches(home_team_id);
CREATE INDEX IF NOT EXISTS idx_matches_away_team ON public.matches(away_team_id);

CREATE TABLE IF NOT EXISTS public.pattern_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  category TEXT NOT NULL,
  base_confidence_boost DECIMAL(5,2) DEFAULT 5.0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.detected_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID REFERENCES public.matches(id) ON DELETE CASCADE,
  template_id UUID REFERENCES public.pattern_templates(id) ON DELETE CASCADE,
  confidence_contribution DECIMAL(5,2) NOT NULL,
  pattern_data JSONB,
  detected_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  CONSTRAINT unique_match_template UNIQUE (match_id, template_id)
);

CREATE INDEX IF NOT EXISTS idx_detected_patterns_match ON public.detected_patterns(match_id);

CREATE TABLE IF NOT EXISTS public.predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID REFERENCES public.matches(id) ON DELETE CASCADE,
  predicted_outcome TEXT NOT NULL,
  confidence_score DECIMAL(5,2) NOT NULL,
  predicted_home_score INTEGER,
  predicted_away_score INTEGER,
  btts_prediction BOOLEAN,
  over_under_prediction TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  actual_outcome TEXT,
  was_correct BOOLEAN,
  evaluated_at TIMESTAMPTZ,
  css_score DECIMAL(5,2),
  prediction_factors JSONB DEFAULT '{}'::jsonb,
  calibration_error DECIMAL(6,4),
  explanation JSONB,
  decision_path JSONB,
  prediction_status TEXT DEFAULT 'active',
  overconfidence_flag BOOLEAN DEFAULT false,
  blocked_reason TEXT,
  alternate_outcome TEXT,
  downgraded_from_confidence NUMERIC(5,4),
  blocked_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id),
  prediction_id TEXT UNIQUE,
  model_version TEXT DEFAULT 'v1.0',
  ensemble_breakdown JSONB,
  CONSTRAINT unique_match_prediction UNIQUE (match_id)
);

CREATE INDEX IF NOT EXISTS idx_predictions_match ON public.predictions(match_id);
CREATE INDEX IF NOT EXISTS idx_predictions_evaluated ON public.predictions(evaluated_at) WHERE evaluated_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_predictions_status ON public.predictions(prediction_status);
CREATE INDEX IF NOT EXISTS idx_predictions_overconfidence ON public.predictions(overconfidence_flag) WHERE overconfidence_flag = true;
CREATE INDEX IF NOT EXISTS idx_predictions_confidence_score ON public.predictions(confidence_score DESC);
CREATE INDEX IF NOT EXISTS idx_predictions_created_recent ON public.predictions(created_at DESC) WHERE confidence_score > 0.95 AND prediction_status IN ('active', 'uncertain');
CREATE INDEX IF NOT EXISTS idx_predictions_prediction_id ON public.predictions(prediction_id);
CREATE INDEX IF NOT EXISTS idx_predictions_ensemble_breakdown ON public.predictions USING gin(ensemble_breakdown);
CREATE INDEX IF NOT EXISTS idx_predictions_created_at ON public.predictions(created_at DESC);

CREATE TABLE IF NOT EXISTS public.pattern_accuracy (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES public.pattern_templates(id) ON DELETE CASCADE,
  total_predictions INTEGER DEFAULT 0,
  correct_predictions INTEGER DEFAULT 0,
  accuracy_rate DECIMAL(5,2) DEFAULT 50.0,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_template_accuracy UNIQUE (template_id)
);

-- 2) HELPER FUNCTIONS
CREATE OR REPLACE FUNCTION public.adjust_template_confidence(
  p_template_id UUID,
  p_adjustment DECIMAL(5,2)
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.pattern_templates
  SET base_confidence_boost = GREATEST(1.0, base_confidence_boost + p_adjustment)
  WHERE id = p_template_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- 3) SEED DATA
INSERT INTO public.pattern_templates (name, description, category, base_confidence_boost) VALUES
('home_winning_streak', 'Home team won last 3+ home matches', 'form', 8.0),
('away_winning_streak', 'Away team won last 3+ away matches', 'form', 7.0),
('h2h_dominance', 'One team won 3+ of last 5 H2H matches', 'h2h', 10.0),
('recent_form_advantage', 'Team has 2+ more wins in last 5 matches', 'form', 6.0),
('high_scoring_league', 'League avg goals > 3.0 per match', 'league', 3.0)
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.pattern_accuracy (template_id, total_predictions, correct_predictions, accuracy_rate)
SELECT id, 0, 0, 50.0 FROM public.pattern_templates
ON CONFLICT (template_id) DO NOTHING;

INSERT INTO public.leagues (name, country, season, avg_goals_per_match, home_win_percentage, btts_percentage) VALUES
('Premier League', 'England', '2024/25', 2.8, 46.5, 52.0),
('La Liga', 'Spain', '2024/25', 2.6, 44.0, 48.0)
ON CONFLICT (name, season) DO NOTHING;

WITH premier_league AS (SELECT id FROM public.leagues WHERE name = 'Premier League' LIMIT 1),
     la_liga AS (SELECT id FROM public.leagues WHERE name = 'La Liga' LIMIT 1)
INSERT INTO public.teams (name, league_id) 
SELECT name, league_id FROM (
  SELECT 'Manchester City' AS name, (SELECT id FROM premier_league) AS league_id UNION ALL
  SELECT 'Arsenal', (SELECT id FROM premier_league) UNION ALL
  SELECT 'Liverpool', (SELECT id FROM premier_league) UNION ALL
  SELECT 'Chelsea', (SELECT id FROM premier_league) UNION ALL
  SELECT 'Real Madrid', (SELECT id FROM la_liga) UNION ALL
  SELECT 'Barcelona', (SELECT id FROM la_liga) UNION ALL
  SELECT 'Atletico Madrid', (SELECT id FROM la_liga) UNION ALL
  SELECT 'Sevilla', (SELECT id FROM la_liga)
) AS teams
ON CONFLICT DO NOTHING;

-- 4) SCHEDULED JOBS (Phase 3)
CREATE TABLE IF NOT EXISTS public.scheduled_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_name TEXT NOT NULL UNIQUE,
  job_type TEXT NOT NULL,
  cron_schedule TEXT NOT NULL,
  enabled BOOLEAN DEFAULT true,
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,
  config JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scheduled_jobs_enabled ON public.scheduled_jobs(enabled);
CREATE INDEX IF NOT EXISTS idx_scheduled_jobs_next_run_at ON public.scheduled_jobs(next_run_at);

CREATE TABLE IF NOT EXISTS public.job_execution_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.scheduled_jobs(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  status TEXT NOT NULL,
  duration_ms INTEGER,
  records_processed INTEGER DEFAULT 0,
  error_message TEXT,
  error_stack TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_job_execution_logs_job_id ON public.job_execution_logs(job_id);
CREATE INDEX IF NOT EXISTS idx_job_execution_logs_started_at ON public.job_execution_logs(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_job_execution_logs_status ON public.job_execution_logs(status);

CREATE TRIGGER trg_touch_scheduled_jobs_updated_at
BEFORE UPDATE ON public.scheduled_jobs
FOR EACH ROW
EXECUTE FUNCTION public.touch_updated_at();

-- 5) MODEL PERFORMANCE (Phase 4)
CREATE TABLE IF NOT EXISTS public.model_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_version TEXT NOT NULL,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  total_predictions INTEGER NOT NULL DEFAULT 0,
  accuracy_overall DECIMAL(5,2),
  accuracy_winner DECIMAL(5,2),
  accuracy_btts DECIMAL(5,2),
  confidence_calibration_score DECIMAL(6,4),
  league_breakdown JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_model_period UNIQUE (model_version, period_start, period_end)
);

CREATE INDEX IF NOT EXISTS idx_model_performance_version ON public.model_performance(model_version);
CREATE INDEX IF NOT EXISTS idx_model_performance_period ON public.model_performance(period_start, period_end);

CREATE TABLE IF NOT EXISTS public.model_comparison (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_a_id TEXT NOT NULL,
  model_b_id TEXT NOT NULL,
  comparison_date TIMESTAMPTZ DEFAULT NOW(),
  accuracy_diff DECIMAL(5,2),
  p_value DECIMAL(6,5),
  winning_model TEXT,
  sample_size INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Continue in Part 2...