/**
 * Sportradar API Type Definitions
 * Placeholder types for future Sportradar integration
 */

export interface SportradarMatch {
  id: string;
  homeTeam: string;
  awayTeam: string;
  date: string;
  venue?: string;
  status: 'scheduled' | 'live' | 'completed';
}

export interface SportradarPrediction {
  matchId: string;
  predictedOutcome: string;
  confidence: number;
  odds?: {
    home: number;
    draw: number;
    away: number;
  };
}

export interface EnsembleBreakdown {
  votes: {
    full_time?: { prediction: string; confidence: number };
    half_time?: { prediction: string; confidence: number };
    pattern?: { prediction: string; confidence: number };
  };
  weights_used: {
    ft: number;
    ht: number;
    pt: number;
  };
  scores: {
    HOME: number;
    DRAW: number;
    AWAY: number;
  };
  winner: string;
  final_confidence: number;
  conflict_detected?: boolean;
  conflict_margin?: number;
}
