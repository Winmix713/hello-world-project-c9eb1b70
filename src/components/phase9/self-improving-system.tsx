// Phase 9.4: Self-Improving System Components

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Brain, TrendingUp, CheckCircle, XCircle, Clock, Play } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { ExperimentDashboardProps } from '@/types/phase9';

interface FeatureExperiment {
  id: string;
  experiment_name: string;
  feature_type: string;
  base_features: Record<string, unknown>;
  generated_feature: Record<string, unknown>;
  feature_expression: string;
  test_start_date: string;
  test_end_date: string | null;
  sample_size: number;
  control_accuracy: number | null;
  test_accuracy: number | null;
  improvement_delta: number | null;
  statistical_significance: boolean;
  p_value: number | null;
  is_active: boolean;
  is_approved: boolean;
  created_at: string;
  updated_at: string;
}

export const ExperimentDashboard: React.FC<ExperimentDashboardProps> = ({
  showActiveOnly = false,
  autoRefresh = true
}) => {
  const [experiments, setExperiments] = useState<FeatureExperiment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchExperiments = async () => {
    setLoading(true);
    let query = supabase
      .from('feature_experiments')
      .select('*')
      .order('created_at', { ascending: false });

    if (showActiveOnly) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;

    if (!error && data) {
      setExperiments(data as FeatureExperiment[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchExperiments();

    if (autoRefresh) {
      const interval = setInterval(fetchExperiments, 30000);
      return () => clearInterval(interval);
    }
  }, [showActiveOnly, autoRefresh]);

  const getStatusBadge = (experiment: FeatureExperiment) => {
    if (experiment.is_approved) {
      return (
        <Badge variant="default" className="bg-green-600">
          <CheckCircle className="h-3 w-3 mr-1" />
          Approved
        </Badge>
      );
    }
    if (!experiment.is_active) {
      return (
        <Badge variant="destructive">
          <XCircle className="h-3 w-3 mr-1" />
          Rejected
        </Badge>
      );
    }
    if (experiment.test_end_date) {
      return (
        <Badge variant="secondary">
          <Clock className="h-3 w-3 mr-1" />
          Completed
        </Badge>
      );
    }
    return (
      <Badge variant="outline">
        <Play className="h-3 w-3 mr-1" />
        Running
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          Feature Engineering Experiments
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : experiments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No experiments found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {experiments.map((experiment) => (
              <div
                key={experiment.id}
                className="p-4 border rounded-lg space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium">{experiment.experiment_name}</h3>
                      {getStatusBadge(experiment)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Type: {experiment.feature_type}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Sample Size</p>
                    <p className="font-medium">{experiment.sample_size.toLocaleString()}</p>
                  </div>
                  {experiment.control_accuracy && (
                    <div>
                      <p className="text-muted-foreground">Control Accuracy</p>
                      <p className="font-medium">{(experiment.control_accuracy * 100).toFixed(2)}%</p>
                    </div>
                  )}
                  {experiment.test_accuracy && (
                    <div>
                      <p className="text-muted-foreground">Test Accuracy</p>
                      <p className="font-medium">{(experiment.test_accuracy * 100).toFixed(2)}%</p>
                    </div>
                  )}
                  {experiment.improvement_delta && (
                    <div>
                      <p className="text-muted-foreground">Improvement</p>
                      <p className={`font-medium flex items-center gap-1 ${
                        experiment.improvement_delta > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        <TrendingUp className="h-4 w-4" />
                        {(experiment.improvement_delta * 100).toFixed(2)}%
                      </p>
                    </div>
                  )}
                </div>

                {experiment.p_value && (
                  <div className="text-xs text-muted-foreground">
                    <p>
                      Statistical Significance: {experiment.statistical_significance ? 'Yes' : 'No'}
                      {' '}(p = {experiment.p_value.toFixed(4)})
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

interface FeatureGenerationWizardProps {
  onGenerationComplete?: () => void;
}

export const FeatureGenerationWizard: React.FC<FeatureGenerationWizardProps> = ({
  onGenerationComplete
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          Feature Generation Wizard
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8 text-muted-foreground">
          <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="mb-2">Automated Feature Generation</p>
          <p className="text-sm">
            This wizard will help you create and test new features automatically.
          </p>
          <Button onClick={onGenerationComplete} className="mt-4">
            Start Generation
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
