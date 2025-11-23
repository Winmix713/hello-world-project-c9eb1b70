-- =====================================================
-- SECURITY FIX: Enable RLS on all remaining tables
-- =====================================================

-- Enable RLS on all public tables that may not have it enabled
DO $$ 
DECLARE
  tbl record;
BEGIN
  FOR tbl IN 
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename NOT IN ('spatial_ref_sys')
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl.tablename);
    RAISE NOTICE 'Enabled RLS on table: %', tbl.tablename;
  END LOOP;
END $$;

-- Fix function search_path for adjust_template_confidence
CREATE OR REPLACE FUNCTION public.adjust_template_confidence(p_template_id uuid, p_adjustment numeric)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  UPDATE public.pattern_templates
  SET base_confidence_boost = GREATEST(1.0, base_confidence_boost + p_adjustment)
  WHERE id = p_template_id;
END;
$function$;

-- Fix function search_path for touch_updated_at
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;