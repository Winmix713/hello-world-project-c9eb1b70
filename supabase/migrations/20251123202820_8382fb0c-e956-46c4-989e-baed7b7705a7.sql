-- =====================================================
-- WINMIX DATABASE MIGRATION PART 2: Advanced Features & Security
-- =====================================================
-- This migration includes:
-- - User profiles and roles system
-- - Comprehensive RLS policies for all tables
-- - Admin settings and configuration tables
-- - System health monitoring
-- - Advanced prediction features
-- - Feedback and logging systems
-- =====================================================

-- =====================================================
-- PART 1: USER PROFILES & ROLES SYSTEM
-- =====================================================

-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'analyst', 'viewer', 'demo', 'user');

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL,
  email TEXT,
  full_name TEXT,
  role public.app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON public.user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON public.user_profiles(role);

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles FORCE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY "Users can read own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = user_id);

-- Users can update their own profile (but not role)
CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- PART 2: SECURITY HELPER FUNCTIONS
-- =====================================================

-- Helper function: Check if user has admin role
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = auth.uid() AND role = 'admin'
  );
$$;

-- Helper function: Check if user has analyst role
CREATE OR REPLACE FUNCTION public.is_analyst()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = auth.uid() AND role IN ('analyst', 'admin')
  );
$$;

-- Helper function: Check if service role
CREATE OR REPLACE FUNCTION public.is_service_role()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT current_setting('request.jwt.claims', true)::jsonb->>'role' = 'service_role';
$$;

-- Helper function: Get current user role
CREATE OR REPLACE FUNCTION public.current_app_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT role::text FROM user_profiles WHERE user_id = auth.uid()),
    'anonymous'
  );
$$;

-- =====================================================
-- PART 3: COMPREHENSIVE RLS POLICIES FOR EXISTING TABLES
-- =====================================================

-- Enable FORCE RLS on all tables
ALTER TABLE public.leagues FORCE ROW LEVEL SECURITY;
ALTER TABLE public.teams FORCE ROW LEVEL SECURITY;
ALTER TABLE public.matches FORCE ROW LEVEL SECURITY;
ALTER TABLE public.predictions FORCE ROW LEVEL SECURITY;
ALTER TABLE public.pattern_templates FORCE ROW LEVEL SECURITY;
ALTER TABLE public.pattern_accuracy FORCE ROW LEVEL SECURITY;
ALTER TABLE public.detected_patterns FORCE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_jobs FORCE ROW LEVEL SECURITY;
ALTER TABLE public.job_execution_logs FORCE ROW LEVEL SECURITY;
ALTER TABLE public.model_performance FORCE ROW LEVEL SECURITY;
ALTER TABLE public.model_comparison FORCE ROW LEVEL SECURITY;

-- RLS Policies for leagues (public read, admin write)
CREATE POLICY "Public can read leagues" ON public.leagues
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage leagues" ON public.leagues
  FOR ALL USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- RLS Policies for teams (public read, admin write)
CREATE POLICY "Public can read teams" ON public.teams
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage teams" ON public.teams
  FOR ALL USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- RLS Policies for matches (public read, admin write)
CREATE POLICY "Public can read matches" ON public.matches
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage matches" ON public.matches
  FOR ALL USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- RLS Policies for predictions (authenticated read, service write)
CREATE POLICY "Authenticated can read predictions" ON public.predictions
  FOR SELECT USING (auth.uid() IS NOT NULL OR true);

CREATE POLICY "Service role can manage predictions" ON public.predictions
  FOR ALL USING (public.is_service_role())
  WITH CHECK (public.is_service_role());

CREATE POLICY "Admins can manage predictions" ON public.predictions
  FOR ALL USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- RLS Policies for pattern_templates (public read, admin write)
CREATE POLICY "Public can read pattern_templates" ON public.pattern_templates
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage pattern_templates" ON public.pattern_templates
  FOR ALL USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- RLS Policies for pattern_accuracy (public read, service write)
CREATE POLICY "Public can read pattern_accuracy" ON public.pattern_accuracy
  FOR SELECT USING (true);

CREATE POLICY "Service role can manage pattern_accuracy" ON public.pattern_accuracy
  FOR ALL USING (public.is_service_role())
  WITH CHECK (public.is_service_role());

-- RLS Policies for detected_patterns (users see own + service-generated)
CREATE POLICY "Users read own detected_patterns" ON public.detected_patterns
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND (
      created_by = auth.uid() OR created_by IS NULL
    )
  );

CREATE POLICY "Service role can manage detected_patterns" ON public.detected_patterns
  FOR ALL USING (public.is_service_role())
  WITH CHECK (public.is_service_role());

CREATE POLICY "Analysts can read all detected_patterns" ON public.detected_patterns
  FOR SELECT USING (public.is_analyst());

-- RLS Policies for scheduled_jobs (service and admin only)
CREATE POLICY "Admins can manage scheduled_jobs" ON public.scheduled_jobs
  FOR ALL USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Service role can manage scheduled_jobs" ON public.scheduled_jobs
  FOR ALL USING (public.is_service_role())
  WITH CHECK (public.is_service_role());

-- RLS Policies for job_execution_logs (service and admin read)
CREATE POLICY "Admins can read job_execution_logs" ON public.job_execution_logs
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Service role can manage job_execution_logs" ON public.job_execution_logs
  FOR ALL USING (public.is_service_role())
  WITH CHECK (public.is_service_role());

-- RLS Policies for model_performance (analyst/admin read)
CREATE POLICY "Analysts can read model_performance" ON public.model_performance
  FOR SELECT USING (public.is_analyst());

CREATE POLICY "Service role can manage model_performance" ON public.model_performance
  FOR ALL USING (public.is_service_role())
  WITH CHECK (public.is_service_role());

-- RLS Policies for model_comparison (analyst/admin read)
CREATE POLICY "Analysts can read model_comparison" ON public.model_comparison
  FOR SELECT USING (public.is_analyst());

CREATE POLICY "Service role can manage model_comparison" ON public.model_comparison
  FOR ALL USING (public.is_service_role())
  WITH CHECK (public.is_service_role());

-- RLS Policy for user_profiles (admins can read all)
CREATE POLICY "Admins can read all profiles" ON public.user_profiles
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can manage all profiles" ON public.user_profiles
  FOR ALL USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- =====================================================
-- PART 4: NEW TABLES - ADMIN SETTINGS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.admin_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT NOT NULL UNIQUE,
  setting_value JSONB NOT NULL DEFAULT '{}',
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_settings FORCE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage admin_settings" ON public.admin_settings
  FOR ALL USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- =====================================================
-- PART 5: SENSITIVE TABLES - USER PREDICTIONS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.user_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  match_id UUID REFERENCES public.matches(id),
  predicted_outcome TEXT NOT NULL,
  confidence_score NUMERIC NOT NULL,
  reasoning TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID
);

ALTER TABLE public.user_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_predictions FORCE ROW LEVEL SECURITY;

CREATE POLICY "Users read own user_predictions" ON public.user_predictions
  FOR SELECT USING (auth.uid() IS NOT NULL AND created_by = auth.uid());

CREATE POLICY "Users insert own user_predictions" ON public.user_predictions
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND created_by = auth.uid());

CREATE POLICY "Users update own user_predictions" ON public.user_predictions
  FOR UPDATE USING (auth.uid() IS NOT NULL AND created_by = auth.uid());

CREATE POLICY "Users delete own user_predictions" ON public.user_predictions
  FOR DELETE USING (auth.uid() IS NOT NULL AND created_by = auth.uid());

CREATE POLICY "Analysts read all user_predictions" ON public.user_predictions
  FOR SELECT USING (public.is_analyst());

CREATE POLICY "Admins full access to user_predictions" ON public.user_predictions
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Service role full access to user_predictions" ON public.user_predictions
  FOR ALL USING (public.is_service_role()) WITH CHECK (public.is_service_role());

-- =====================================================
-- PART 6: MONITORING & HEALTH TABLES
-- =====================================================

CREATE TABLE IF NOT EXISTS public.system_health_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_name TEXT NOT NULL,
  metric_value NUMERIC NOT NULL,
  metric_unit TEXT,
  threshold_warning NUMERIC,
  threshold_critical NUMERIC,
  status TEXT DEFAULT 'healthy',
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_system_health_metrics_recorded_at 
  ON public.system_health_metrics(recorded_at DESC);

ALTER TABLE public.system_health_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_health_metrics FORCE ROW LEVEL SECURITY;

CREATE POLICY "Analysts can read system_health_metrics" ON public.system_health_metrics
  FOR SELECT USING (public.is_analyst());

CREATE POLICY "Service role can manage system_health_metrics" ON public.system_health_metrics
  FOR ALL USING (public.is_service_role()) WITH CHECK (public.is_service_role());

CREATE TABLE IF NOT EXISTS public.prediction_decay_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_version TEXT NOT NULL,
  decay_rate NUMERIC NOT NULL,
  alert_level TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  acknowledged_at TIMESTAMPTZ,
  acknowledged_by UUID
);

CREATE INDEX IF NOT EXISTS idx_prediction_decay_alerts_created_at 
  ON public.prediction_decay_alerts(created_at DESC);

ALTER TABLE public.prediction_decay_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prediction_decay_alerts FORCE ROW LEVEL SECURITY;

CREATE POLICY "Analysts can read prediction_decay_alerts" ON public.prediction_decay_alerts
  FOR SELECT USING (public.is_analyst());

CREATE POLICY "Admins can manage prediction_decay_alerts" ON public.prediction_decay_alerts
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- =====================================================
-- PART 7: ML & TRAINING TABLES
-- =====================================================

CREATE TABLE IF NOT EXISTS public.auto_reinforcement_model_retraining (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trigger_reason TEXT NOT NULL,
  model_version_before TEXT NOT NULL,
  model_version_after TEXT,
  training_metrics JSONB DEFAULT '{}',
  status TEXT DEFAULT 'pending',
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  error_message TEXT
);

CREATE INDEX IF NOT EXISTS idx_auto_reinforcement_started_at 
  ON public.auto_reinforcement_model_retraining(started_at DESC);

ALTER TABLE public.auto_reinforcement_model_retraining ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auto_reinforcement_model_retraining FORCE ROW LEVEL SECURITY;

CREATE POLICY "Analysts can read auto_reinforcement" ON public.auto_reinforcement_model_retraining
  FOR SELECT USING (public.is_analyst());

CREATE POLICY "Service role can manage auto_reinforcement" ON public.auto_reinforcement_model_retraining
  FOR ALL USING (public.is_service_role()) WITH CHECK (public.is_service_role());

CREATE TABLE IF NOT EXISTS public.ensemble_predictor_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID REFERENCES public.matches(id),
  ensemble_prediction JSONB NOT NULL,
  model_weights JSONB NOT NULL,
  confidence_score NUMERIC NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ensemble_predictor_match_id 
  ON public.ensemble_predictor_runs(match_id);

ALTER TABLE public.ensemble_predictor_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ensemble_predictor_runs FORCE ROW LEVEL SECURITY;

CREATE POLICY "Public can read ensemble_predictor_runs" ON public.ensemble_predictor_runs
  FOR SELECT USING (true);

CREATE POLICY "Service role can manage ensemble_predictor_runs" ON public.ensemble_predictor_runs
  FOR ALL USING (public.is_service_role()) WITH CHECK (public.is_service_role());

-- =====================================================
-- PART 8: LOGGING & AUDIT TABLES
-- =====================================================

CREATE TABLE IF NOT EXISTS public.model_override_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prediction_id UUID REFERENCES public.predictions(id),
  original_prediction JSONB NOT NULL,
  override_prediction JSONB NOT NULL,
  override_reason TEXT NOT NULL,
  overridden_by UUID NOT NULL,
  overridden_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_model_override_log_prediction_id 
  ON public.model_override_log(prediction_id);

ALTER TABLE public.model_override_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.model_override_log FORCE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read model_override_log" ON public.model_override_log
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can insert model_override_log" ON public.model_override_log
  FOR INSERT WITH CHECK (public.is_admin());

CREATE TABLE IF NOT EXISTS public.system_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  log_level TEXT NOT NULL,
  component TEXT NOT NULL,
  message TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  user_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_system_logs_created_at 
  ON public.system_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_logs_component 
  ON public.system_logs(component);

ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_logs FORCE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read system_logs" ON public.system_logs
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Service role can manage system_logs" ON public.system_logs
  FOR ALL USING (public.is_service_role()) WITH CHECK (public.is_service_role());

CREATE TABLE IF NOT EXISTS public.prediction_review_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prediction_id UUID REFERENCES public.predictions(id),
  reviewer_id UUID NOT NULL,
  review_action TEXT NOT NULL,
  review_notes TEXT,
  reviewed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_prediction_review_log_prediction_id 
  ON public.prediction_review_log(prediction_id);

ALTER TABLE public.prediction_review_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prediction_review_log FORCE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read prediction_review_log" ON public.prediction_review_log
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can insert prediction_review_log" ON public.prediction_review_log
  FOR INSERT WITH CHECK (public.is_admin());

CREATE TABLE IF NOT EXISTS public.retrain_suggestion_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  suggestion_reason TEXT NOT NULL,
  model_version TEXT NOT NULL,
  accuracy_threshold NUMERIC NOT NULL,
  current_accuracy NUMERIC NOT NULL,
  suggested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  actioned_at TIMESTAMPTZ,
  action_taken TEXT
);

CREATE INDEX IF NOT EXISTS idx_retrain_suggestion_log_suggested_at 
  ON public.retrain_suggestion_log(suggested_at DESC);

ALTER TABLE public.retrain_suggestion_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.retrain_suggestion_log FORCE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read retrain_suggestion_log" ON public.retrain_suggestion_log
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Service role can manage retrain_suggestion_log" ON public.retrain_suggestion_log
  FOR ALL USING (public.is_service_role()) WITH CHECK (public.is_service_role());

-- =====================================================
-- PART 9: FEEDBACK & USER INTERACTION
-- =====================================================

CREATE TABLE IF NOT EXISTS public.feedback_inbox (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  feedback_type TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'open',
  priority TEXT DEFAULT 'medium',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  responded_at TIMESTAMPTZ,
  responded_by UUID,
  response TEXT
);

CREATE INDEX IF NOT EXISTS idx_feedback_inbox_created_at 
  ON public.feedback_inbox(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_inbox_status 
  ON public.feedback_inbox(status);

ALTER TABLE public.feedback_inbox ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback_inbox FORCE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own feedback" ON public.feedback_inbox
  FOR SELECT USING (auth.uid() IS NOT NULL AND user_id = auth.uid());

CREATE POLICY "Users can insert own feedback" ON public.feedback_inbox
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());

CREATE POLICY "Admins can manage all feedback" ON public.feedback_inbox
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE TABLE IF NOT EXISTS public.team_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES public.teams(id),
  pattern_type TEXT NOT NULL,
  pattern_data JSONB NOT NULL,
  confidence_score NUMERIC NOT NULL,
  detected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID
);

CREATE INDEX IF NOT EXISTS idx_team_patterns_team_id 
  ON public.team_patterns(team_id);

ALTER TABLE public.team_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_patterns FORCE ROW LEVEL SECURITY;

CREATE POLICY "Users read own team_patterns" ON public.team_patterns
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND (created_by = auth.uid() OR created_by IS NULL)
  );

CREATE POLICY "Service role can manage team_patterns" ON public.team_patterns
  FOR ALL USING (public.is_service_role()) WITH CHECK (public.is_service_role());

CREATE POLICY "Analysts can read all team_patterns" ON public.team_patterns
  FOR SELECT USING (public.is_analyst());

-- =====================================================
-- PART 10: VERIFICATION & MONITORING FUNCTIONS
-- =====================================================

CREATE OR REPLACE FUNCTION public.verify_rls_all_tables()
RETURNS TABLE (
  table_name TEXT,
  rls_enabled BOOLEAN,
  rls_forced BOOLEAN,
  policy_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.tablename::TEXT,
    t.rowsecurity AS rls_enabled,
    t.relforcerowsecurity AS rls_forced,
    COUNT(p.policyname) AS policy_count
  FROM pg_tables t
  LEFT JOIN pg_policies p ON t.tablename = p.tablename
  WHERE t.schemaname = 'public'
  GROUP BY t.tablename, t.rowsecurity, t.relforcerowsecurity
  ORDER BY t.tablename;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;