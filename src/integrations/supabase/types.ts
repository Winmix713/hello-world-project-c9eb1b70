export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      admin_settings: {
        Row: {
          created_at: string
          description: string | null
          id: string
          setting_key: string
          setting_value: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          setting_key: string
          setting_value?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          setting_key?: string
          setting_value?: Json
          updated_at?: string
        }
        Relationships: []
      }
      auto_reinforcement_model_retraining: {
        Row: {
          completed_at: string | null
          error_message: string | null
          id: string
          model_version_after: string | null
          model_version_before: string
          started_at: string
          status: string | null
          training_metrics: Json | null
          trigger_reason: string
        }
        Insert: {
          completed_at?: string | null
          error_message?: string | null
          id?: string
          model_version_after?: string | null
          model_version_before: string
          started_at?: string
          status?: string | null
          training_metrics?: Json | null
          trigger_reason: string
        }
        Update: {
          completed_at?: string | null
          error_message?: string | null
          id?: string
          model_version_after?: string | null
          model_version_before?: string
          started_at?: string
          status?: string | null
          training_metrics?: Json | null
          trigger_reason?: string
        }
        Relationships: []
      }
      detected_patterns: {
        Row: {
          confidence_contribution: number
          created_by: string | null
          detected_at: string | null
          id: string
          match_id: string | null
          pattern_data: Json | null
          template_id: string | null
        }
        Insert: {
          confidence_contribution: number
          created_by?: string | null
          detected_at?: string | null
          id?: string
          match_id?: string | null
          pattern_data?: Json | null
          template_id?: string | null
        }
        Update: {
          confidence_contribution?: number
          created_by?: string | null
          detected_at?: string | null
          id?: string
          match_id?: string | null
          pattern_data?: Json | null
          template_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "detected_patterns_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "detected_patterns_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "pattern_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      ensemble_predictor_runs: {
        Row: {
          confidence_score: number
          created_at: string
          ensemble_prediction: Json
          id: string
          match_id: string | null
          model_weights: Json
        }
        Insert: {
          confidence_score: number
          created_at?: string
          ensemble_prediction: Json
          id?: string
          match_id?: string | null
          model_weights: Json
        }
        Update: {
          confidence_score?: number
          created_at?: string
          ensemble_prediction?: Json
          id?: string
          match_id?: string | null
          model_weights?: Json
        }
        Relationships: [
          {
            foreignKeyName: "ensemble_predictor_runs_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback_inbox: {
        Row: {
          created_at: string
          feedback_type: string
          id: string
          message: string
          priority: string | null
          responded_at: string | null
          responded_by: string | null
          response: string | null
          status: string | null
          subject: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          feedback_type: string
          id?: string
          message: string
          priority?: string | null
          responded_at?: string | null
          responded_by?: string | null
          response?: string | null
          status?: string | null
          subject: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          feedback_type?: string
          id?: string
          message?: string
          priority?: string | null
          responded_at?: string | null
          responded_by?: string | null
          response?: string | null
          status?: string | null
          subject?: string
          user_id?: string | null
        }
        Relationships: []
      }
      job_execution_logs: {
        Row: {
          completed_at: string | null
          created_at: string | null
          duration_ms: number | null
          error_message: string | null
          error_stack: string | null
          id: string
          job_id: string
          records_processed: number | null
          started_at: string | null
          status: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          duration_ms?: number | null
          error_message?: string | null
          error_stack?: string | null
          id?: string
          job_id: string
          records_processed?: number | null
          started_at?: string | null
          status: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          duration_ms?: number | null
          error_message?: string | null
          error_stack?: string | null
          id?: string
          job_id?: string
          records_processed?: number | null
          started_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_execution_logs_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "scheduled_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      leagues: {
        Row: {
          avg_goals_per_match: number | null
          btts_percentage: number | null
          country: string
          created_at: string | null
          home_win_percentage: number | null
          id: string
          name: string
          season: string
        }
        Insert: {
          avg_goals_per_match?: number | null
          btts_percentage?: number | null
          country: string
          created_at?: string | null
          home_win_percentage?: number | null
          id?: string
          name: string
          season: string
        }
        Update: {
          avg_goals_per_match?: number | null
          btts_percentage?: number | null
          country?: string
          created_at?: string | null
          home_win_percentage?: number | null
          id?: string
          name?: string
          season?: string
        }
        Relationships: []
      }
      matches: {
        Row: {
          away_score: number | null
          away_team_id: string | null
          created_at: string | null
          halftime_away_score: number | null
          halftime_home_score: number | null
          home_score: number | null
          home_team_id: string | null
          id: string
          league_id: string | null
          match_date: string
          status: string | null
        }
        Insert: {
          away_score?: number | null
          away_team_id?: string | null
          created_at?: string | null
          halftime_away_score?: number | null
          halftime_home_score?: number | null
          home_score?: number | null
          home_team_id?: string | null
          id?: string
          league_id?: string | null
          match_date: string
          status?: string | null
        }
        Update: {
          away_score?: number | null
          away_team_id?: string | null
          created_at?: string | null
          halftime_away_score?: number | null
          halftime_home_score?: number | null
          home_score?: number | null
          home_team_id?: string | null
          id?: string
          league_id?: string | null
          match_date?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "matches_away_team_id_fkey"
            columns: ["away_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_home_team_id_fkey"
            columns: ["home_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: false
            referencedRelation: "leagues"
            referencedColumns: ["id"]
          },
        ]
      }
      model_comparison: {
        Row: {
          accuracy_diff: number | null
          comparison_date: string | null
          created_at: string | null
          id: string
          model_a_id: string
          model_b_id: string
          p_value: number | null
          sample_size: number
          winning_model: string | null
        }
        Insert: {
          accuracy_diff?: number | null
          comparison_date?: string | null
          created_at?: string | null
          id?: string
          model_a_id: string
          model_b_id: string
          p_value?: number | null
          sample_size?: number
          winning_model?: string | null
        }
        Update: {
          accuracy_diff?: number | null
          comparison_date?: string | null
          created_at?: string | null
          id?: string
          model_a_id?: string
          model_b_id?: string
          p_value?: number | null
          sample_size?: number
          winning_model?: string | null
        }
        Relationships: []
      }
      model_override_log: {
        Row: {
          id: string
          original_prediction: Json
          overridden_at: string
          overridden_by: string
          override_prediction: Json
          override_reason: string
          prediction_id: string | null
        }
        Insert: {
          id?: string
          original_prediction: Json
          overridden_at?: string
          overridden_by: string
          override_prediction: Json
          override_reason: string
          prediction_id?: string | null
        }
        Update: {
          id?: string
          original_prediction?: Json
          overridden_at?: string
          overridden_by?: string
          override_prediction?: Json
          override_reason?: string
          prediction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "model_override_log_prediction_id_fkey"
            columns: ["prediction_id"]
            isOneToOne: false
            referencedRelation: "predictions"
            referencedColumns: ["id"]
          },
        ]
      }
      model_performance: {
        Row: {
          accuracy_btts: number | null
          accuracy_overall: number | null
          accuracy_winner: number | null
          confidence_calibration_score: number | null
          created_at: string | null
          id: string
          league_breakdown: Json | null
          model_version: string
          period_end: string
          period_start: string
          total_predictions: number
        }
        Insert: {
          accuracy_btts?: number | null
          accuracy_overall?: number | null
          accuracy_winner?: number | null
          confidence_calibration_score?: number | null
          created_at?: string | null
          id?: string
          league_breakdown?: Json | null
          model_version: string
          period_end: string
          period_start: string
          total_predictions?: number
        }
        Update: {
          accuracy_btts?: number | null
          accuracy_overall?: number | null
          accuracy_winner?: number | null
          confidence_calibration_score?: number | null
          created_at?: string | null
          id?: string
          league_breakdown?: Json | null
          model_version?: string
          period_end?: string
          period_start?: string
          total_predictions?: number
        }
        Relationships: []
      }
      pattern_accuracy: {
        Row: {
          accuracy_rate: number | null
          correct_predictions: number | null
          id: string
          last_updated: string | null
          template_id: string | null
          total_predictions: number | null
        }
        Insert: {
          accuracy_rate?: number | null
          correct_predictions?: number | null
          id?: string
          last_updated?: string | null
          template_id?: string | null
          total_predictions?: number | null
        }
        Update: {
          accuracy_rate?: number | null
          correct_predictions?: number | null
          id?: string
          last_updated?: string | null
          template_id?: string | null
          total_predictions?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pattern_accuracy_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: true
            referencedRelation: "pattern_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      pattern_templates: {
        Row: {
          base_confidence_boost: number | null
          category: string
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
        }
        Insert: {
          base_confidence_boost?: number | null
          category: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
        }
        Update: {
          base_confidence_boost?: number | null
          category?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
        }
        Relationships: []
      }
      prediction_decay_alerts: {
        Row: {
          acknowledged_at: string | null
          acknowledged_by: string | null
          alert_level: string
          created_at: string
          decay_rate: number
          id: string
          message: string
          model_version: string
        }
        Insert: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          alert_level: string
          created_at?: string
          decay_rate: number
          id?: string
          message: string
          model_version: string
        }
        Update: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          alert_level?: string
          created_at?: string
          decay_rate?: number
          id?: string
          message?: string
          model_version?: string
        }
        Relationships: []
      }
      prediction_review_log: {
        Row: {
          id: string
          prediction_id: string | null
          review_action: string
          review_notes: string | null
          reviewed_at: string
          reviewer_id: string
        }
        Insert: {
          id?: string
          prediction_id?: string | null
          review_action: string
          review_notes?: string | null
          reviewed_at?: string
          reviewer_id: string
        }
        Update: {
          id?: string
          prediction_id?: string | null
          review_action?: string
          review_notes?: string | null
          reviewed_at?: string
          reviewer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "prediction_review_log_prediction_id_fkey"
            columns: ["prediction_id"]
            isOneToOne: false
            referencedRelation: "predictions"
            referencedColumns: ["id"]
          },
        ]
      }
      predictions: {
        Row: {
          actual_outcome: string | null
          alternate_outcome: string | null
          blocked_at: string | null
          blocked_reason: string | null
          btts_prediction: boolean | null
          calibration_error: number | null
          confidence_score: number
          created_at: string | null
          css_score: number | null
          decision_path: Json | null
          downgraded_from_confidence: number | null
          ensemble_breakdown: Json | null
          evaluated_at: string | null
          explanation: Json | null
          id: string
          match_id: string | null
          model_version: string | null
          over_under_prediction: string | null
          overconfidence_flag: boolean | null
          predicted_away_score: number | null
          predicted_home_score: number | null
          predicted_outcome: string
          prediction_factors: Json | null
          prediction_id: string | null
          prediction_status: string | null
          reviewed_by: string | null
          was_correct: boolean | null
        }
        Insert: {
          actual_outcome?: string | null
          alternate_outcome?: string | null
          blocked_at?: string | null
          blocked_reason?: string | null
          btts_prediction?: boolean | null
          calibration_error?: number | null
          confidence_score: number
          created_at?: string | null
          css_score?: number | null
          decision_path?: Json | null
          downgraded_from_confidence?: number | null
          ensemble_breakdown?: Json | null
          evaluated_at?: string | null
          explanation?: Json | null
          id?: string
          match_id?: string | null
          model_version?: string | null
          over_under_prediction?: string | null
          overconfidence_flag?: boolean | null
          predicted_away_score?: number | null
          predicted_home_score?: number | null
          predicted_outcome: string
          prediction_factors?: Json | null
          prediction_id?: string | null
          prediction_status?: string | null
          reviewed_by?: string | null
          was_correct?: boolean | null
        }
        Update: {
          actual_outcome?: string | null
          alternate_outcome?: string | null
          blocked_at?: string | null
          blocked_reason?: string | null
          btts_prediction?: boolean | null
          calibration_error?: number | null
          confidence_score?: number
          created_at?: string | null
          css_score?: number | null
          decision_path?: Json | null
          downgraded_from_confidence?: number | null
          ensemble_breakdown?: Json | null
          evaluated_at?: string | null
          explanation?: Json | null
          id?: string
          match_id?: string | null
          model_version?: string | null
          over_under_prediction?: string | null
          overconfidence_flag?: boolean | null
          predicted_away_score?: number | null
          predicted_home_score?: number | null
          predicted_outcome?: string
          prediction_factors?: Json | null
          prediction_id?: string | null
          prediction_status?: string | null
          reviewed_by?: string | null
          was_correct?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "predictions_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: true
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
        ]
      }
      retrain_suggestion_log: {
        Row: {
          accuracy_threshold: number
          action_taken: string | null
          actioned_at: string | null
          current_accuracy: number
          id: string
          model_version: string
          suggested_at: string
          suggestion_reason: string
        }
        Insert: {
          accuracy_threshold: number
          action_taken?: string | null
          actioned_at?: string | null
          current_accuracy: number
          id?: string
          model_version: string
          suggested_at?: string
          suggestion_reason: string
        }
        Update: {
          accuracy_threshold?: number
          action_taken?: string | null
          actioned_at?: string | null
          current_accuracy?: number
          id?: string
          model_version?: string
          suggested_at?: string
          suggestion_reason?: string
        }
        Relationships: []
      }
      scheduled_jobs: {
        Row: {
          config: Json | null
          created_at: string | null
          cron_schedule: string
          enabled: boolean | null
          id: string
          job_name: string
          job_type: string
          last_run_at: string | null
          next_run_at: string | null
          updated_at: string | null
        }
        Insert: {
          config?: Json | null
          created_at?: string | null
          cron_schedule: string
          enabled?: boolean | null
          id?: string
          job_name: string
          job_type: string
          last_run_at?: string | null
          next_run_at?: string | null
          updated_at?: string | null
        }
        Update: {
          config?: Json | null
          created_at?: string | null
          cron_schedule?: string
          enabled?: boolean | null
          id?: string
          job_name?: string
          job_type?: string
          last_run_at?: string | null
          next_run_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      system_health_metrics: {
        Row: {
          id: string
          metadata: Json | null
          metric_name: string
          metric_unit: string | null
          metric_value: number
          recorded_at: string
          status: string | null
          threshold_critical: number | null
          threshold_warning: number | null
        }
        Insert: {
          id?: string
          metadata?: Json | null
          metric_name: string
          metric_unit?: string | null
          metric_value: number
          recorded_at?: string
          status?: string | null
          threshold_critical?: number | null
          threshold_warning?: number | null
        }
        Update: {
          id?: string
          metadata?: Json | null
          metric_name?: string
          metric_unit?: string | null
          metric_value?: number
          recorded_at?: string
          status?: string | null
          threshold_critical?: number | null
          threshold_warning?: number | null
        }
        Relationships: []
      }
      system_logs: {
        Row: {
          component: string
          created_at: string
          details: Json | null
          id: string
          log_level: string
          message: string
          user_id: string | null
        }
        Insert: {
          component: string
          created_at?: string
          details?: Json | null
          id?: string
          log_level: string
          message: string
          user_id?: string | null
        }
        Update: {
          component?: string
          created_at?: string
          details?: Json | null
          id?: string
          log_level?: string
          message?: string
          user_id?: string | null
        }
        Relationships: []
      }
      team_patterns: {
        Row: {
          confidence_score: number
          created_by: string | null
          detected_at: string
          id: string
          pattern_data: Json
          pattern_type: string
          team_id: string | null
        }
        Insert: {
          confidence_score: number
          created_by?: string | null
          detected_at?: string
          id?: string
          pattern_data: Json
          pattern_type: string
          team_id?: string | null
        }
        Update: {
          confidence_score?: number
          created_by?: string | null
          detected_at?: string
          id?: string
          pattern_data?: Json
          pattern_type?: string
          team_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_patterns_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string | null
          id: string
          league_id: string | null
          name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          league_id?: string | null
          name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          league_id?: string | null
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "teams_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: false
            referencedRelation: "leagues"
            referencedColumns: ["id"]
          },
        ]
      }
      user_predictions: {
        Row: {
          confidence_score: number
          created_at: string
          created_by: string | null
          id: string
          match_id: string | null
          predicted_outcome: string
          reasoning: string | null
          user_id: string
        }
        Insert: {
          confidence_score: number
          created_at?: string
          created_by?: string | null
          id?: string
          match_id?: string | null
          predicted_outcome: string
          reasoning?: string | null
          user_id: string
        }
        Update: {
          confidence_score?: number
          created_at?: string
          created_by?: string | null
          id?: string
          match_id?: string | null
          predicted_outcome?: string
          reasoning?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_predictions_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      adjust_template_confidence: {
        Args: { p_adjustment: number; p_template_id: string }
        Returns: undefined
      }
      current_app_role: { Args: never; Returns: string }
      is_admin: { Args: never; Returns: boolean }
      is_analyst: { Args: never; Returns: boolean }
      is_service_role: { Args: never; Returns: boolean }
      verify_rls_all_tables: {
        Args: never
        Returns: {
          policy_count: number
          rls_enabled: boolean
          rls_forced: boolean
          table_name: string
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "analyst" | "viewer" | "demo" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "analyst", "viewer", "demo", "user"],
    },
  },
} as const
