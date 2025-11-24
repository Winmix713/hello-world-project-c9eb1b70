// Sportradar API Types

export interface EnsembleBreakdown {
  votes: {
    full_time?: {
      prediction: string;
      confidence: number;
    };
    half_time?: {
      prediction: string;
      confidence: number;
    };
    pattern?: {
      prediction: string;
      confidence: number;
    };
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
