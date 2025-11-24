-- Phase 9: Create missing database tables

-- 1. Phase9 Settings Table
CREATE TABLE IF NOT EXISTS public.phase9_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  collaborative_intelligence_enabled BOOLEAN NOT NULL DEFAULT false,
  temporal_decay_enabled BOOLEAN NOT NULL DEFAULT true,
  temporal_decay_rate NUMERIC NOT NULL DEFAULT 0.1,
  freshness_check_seconds INTEGER NOT NULL DEFAULT 60,
  staleness_threshold_days INTEGER NOT NULL DEFAULT 7,
  market_integration_mode TEXT NOT NULL DEFAULT 'test',
  market_api_key TEXT,
  cross_league_enabled BOOLEAN NOT NULL DEFAULT true,
  cross_league_league_count INTEGER NOT NULL DEFAULT 5,
  cross_league_depth TEXT NOT NULL DEFAULT 'medium',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT phase9_settings_single_row CHECK (id = 1),
  CONSTRAINT phase9_settings_market_mode_check CHECK (market_integration_mode IN ('off', 'test', 'prod')),
  CONSTRAINT phase9_settings_cross_depth_check CHECK (cross_league_depth IN ('low', 'medium', 'high'))
);

-- 2. Information Freshness Table (for Temporal Decay)
CREATE TABLE IF NOT EXISTS public.information_freshness (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  record_id TEXT NOT NULL,
  data_type TEXT NOT NULL,
  last_updated TIMESTAMPTZ NOT NULL DEFAULT now(),
  decay_rate NUMERIC NOT NULL DEFAULT 0.1,
  freshness_score NUMERIC NOT NULL DEFAULT 1.0,
  is_stale BOOLEAN NOT NULL DEFAULT false,
  stale_threshold_days INTEGER NOT NULL DEFAULT 7,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT information_freshness_data_type_check CHECK (data_type IN ('match', 'team_stats', 'pattern', 'odds', 'user_prediction'))
);

-- 3. Feature Experiments Table (for Self-Improving System)
CREATE TABLE IF NOT EXISTS public.feature_experiments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  experiment_name TEXT NOT NULL,
  feature_type TEXT NOT NULL,
  base_features JSONB NOT NULL DEFAULT '{}',
  generated_feature JSONB NOT NULL DEFAULT '{}',
  feature_expression TEXT NOT NULL,
  test_start_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  test_end_date TIMESTAMPTZ,
  sample_size INTEGER NOT NULL DEFAULT 0,
  control_accuracy NUMERIC,
  test_accuracy NUMERIC,
  improvement_delta NUMERIC,
  statistical_significance BOOLEAN NOT NULL DEFAULT false,
  p_value NUMERIC,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_approved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT feature_experiments_feature_type_check CHECK (feature_type IN ('polynomial', 'interaction', 'ratio', 'temporal', 'aggregate'))
);

-- 4. Crowd Wisdom Table (for Collaborative Intelligence)
CREATE TABLE IF NOT EXISTS public.crowd_wisdom (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID REFERENCES public.matches(id) ON DELETE CASCADE,
  total_predictions INTEGER NOT NULL DEFAULT 0,
  home_win_predictions INTEGER NOT NULL DEFAULT 0,
  draw_predictions INTEGER NOT NULL DEFAULT 0,
  away_win_predictions INTEGER NOT NULL DEFAULT 0,
  average_confidence NUMERIC NOT NULL DEFAULT 0,
  consensus_prediction TEXT,
  consensus_confidence NUMERIC NOT NULL DEFAULT 0,
  model_vs_crowd_divergence NUMERIC NOT NULL DEFAULT 0,
  last_calculated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT crowd_wisdom_consensus_check CHECK (consensus_prediction IN ('home_win', 'draw', 'away_win'))
);

-- 5. Market Odds Table (for Market Integration)
CREATE TABLE IF NOT EXISTS public.market_odds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID REFERENCES public.matches(id) ON DELETE CASCADE,
  bookmaker TEXT NOT NULL,
  home_win_odds NUMERIC NOT NULL,
  draw_odds NUMERIC NOT NULL,
  away_win_odds NUMERIC NOT NULL,
  over_2_5_odds NUMERIC,
  under_2_5_odds NUMERIC,
  btts_yes_odds NUMERIC,
  btts_no_odds NUMERIC,
  last_updated TIMESTAMPTZ NOT NULL DEFAULT now(),
  api_source TEXT NOT NULL,
  raw_response JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Value Bets Table (for Market Integration)
CREATE TABLE IF NOT EXISTS public.value_bets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID REFERENCES public.matches(id) ON DELETE CASCADE,
  bookmaker TEXT NOT NULL,
  bet_type TEXT NOT NULL,
  bookmaker_odds NUMERIC NOT NULL,
  model_probability NUMERIC NOT NULL,
  implied_probability NUMERIC NOT NULL,
  expected_value NUMERIC NOT NULL,
  kelly_fraction NUMERIC NOT NULL,
  confidence_level TEXT NOT NULL DEFAULT 'medium',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT value_bets_bet_type_check CHECK (bet_type IN ('home_win', 'draw', 'away_win', 'over_2_5', 'under_2_5', 'btts_yes', 'btts_no')),
  CONSTRAINT value_bets_confidence_check CHECK (confidence_level IN ('low', 'medium', 'high'))
);

-- Enable RLS on all Phase9 tables
ALTER TABLE public.phase9_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.information_freshness ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_experiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crowd_wisdom ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_odds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.value_bets ENABLE ROW LEVEL SECURITY;

-- RLS Policies for phase9_settings
CREATE POLICY "Admins can manage phase9_settings"
  ON public.phase9_settings
  FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Analysts can read phase9_settings"
  ON public.phase9_settings
  FOR SELECT
  USING (is_analyst());

-- RLS Policies for information_freshness
CREATE POLICY "Service role can manage information_freshness"
  ON public.information_freshness
  FOR ALL
  USING (is_service_role())
  WITH CHECK (is_service_role());

CREATE POLICY "Analysts can read information_freshness"
  ON public.information_freshness
  FOR SELECT
  USING (is_analyst());

-- RLS Policies for feature_experiments
CREATE POLICY "Service role can manage feature_experiments"
  ON public.feature_experiments
  FOR ALL
  USING (is_service_role())
  WITH CHECK (is_service_role());

CREATE POLICY "Analysts can read feature_experiments"
  ON public.feature_experiments
  FOR SELECT
  USING (is_analyst());

CREATE POLICY "Admins can approve feature_experiments"
  ON public.feature_experiments
  FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());

-- RLS Policies for crowd_wisdom
CREATE POLICY "Public can read crowd_wisdom"
  ON public.crowd_wisdom
  FOR SELECT
  USING (true);

CREATE POLICY "Service role can manage crowd_wisdom"
  ON public.crowd_wisdom
  FOR ALL
  USING (is_service_role())
  WITH CHECK (is_service_role());

-- RLS Policies for market_odds
CREATE POLICY "Public can read market_odds"
  ON public.market_odds
  FOR SELECT
  USING (true);

CREATE POLICY "Service role can manage market_odds"
  ON public.market_odds
  FOR ALL
  USING (is_service_role())
  WITH CHECK (is_service_role());

-- RLS Policies for value_bets
CREATE POLICY "Public can read value_bets"
  ON public.value_bets
  FOR SELECT
  USING (true);

CREATE POLICY "Service role can manage value_bets"
  ON public.value_bets
  FOR ALL
  USING (is_service_role())
  WITH CHECK (is_service_role());

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_information_freshness_table_record ON public.information_freshness(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_information_freshness_is_stale ON public.information_freshness(is_stale);
CREATE INDEX IF NOT EXISTS idx_feature_experiments_is_active ON public.feature_experiments(is_active);
CREATE INDEX IF NOT EXISTS idx_feature_experiments_is_approved ON public.feature_experiments(is_approved);
CREATE INDEX IF NOT EXISTS idx_crowd_wisdom_match_id ON public.crowd_wisdom(match_id);
CREATE INDEX IF NOT EXISTS idx_market_odds_match_id ON public.market_odds(match_id);
CREATE INDEX IF NOT EXISTS idx_value_bets_match_id ON public.value_bets(match_id);
CREATE INDEX IF NOT EXISTS idx_value_bets_is_active ON public.value_bets(is_active);

-- Insert default Phase9 settings
INSERT INTO public.phase9_settings (id) VALUES (1)
ON CONFLICT (id) DO NOTHING;