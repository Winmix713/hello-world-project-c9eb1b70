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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      adjust_template_confidence: {
        Args: { p_adjustment: number; p_template_id: string }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
