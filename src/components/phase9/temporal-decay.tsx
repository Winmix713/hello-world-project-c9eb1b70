// Phase 9.3: Temporal Decay Components

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { FreshnessIndicatorProps } from '@/types/phase9';

interface InformationFreshness {
  id: string;
  table_name: string;
  record_id: string;
  data_type: string;
  last_updated: string;
  decay_rate: number;
  freshness_score: number;
  is_stale: boolean;
  stale_threshold_days: number;
  created_at: string;
  updated_at: string;
}

export const FreshnessIndicator: React.FC<FreshnessIndicatorProps> = ({
  tableName,
  recordId,
  dataType,
  showDetails = false
}) => {
  const [freshness, setFreshness] = useState<InformationFreshness | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFreshness = async () => {
      const { data, error } = await supabase
        .from('information_freshness')
        .select('*')
        .eq('table_name', tableName)
        .eq('record_id', recordId)
        .maybeSingle();

      if (!error && data) {
        setFreshness(data as InformationFreshness);
      }
      setLoading(false);
    };

    fetchFreshness();
  }, [tableName, recordId]);

  if (loading) {
    return (
      <Badge variant="outline">
        <RefreshCw className="h-3 w-3 animate-spin mr-1" />
        Loading...
      </Badge>
    );
  }

  if (!freshness) {
    return (
      <Badge variant="secondary">
        <Clock className="h-3 w-3 mr-1" />
        No data
      </Badge>
    );
  }

  const getStatusBadge = () => {
    if (freshness.is_stale) {
      return (
        <Badge variant="destructive">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Stale
        </Badge>
      );
    }
    if (freshness.freshness_score > 0.7) {
      return (
        <Badge variant="default" className="bg-green-600">
          <CheckCircle className="h-3 w-3 mr-1" />
          Fresh
        </Badge>
      );
    }
    return (
      <Badge variant="secondary">
        <Clock className="h-3 w-3 mr-1" />
        Aging
      </Badge>
    );
  };

  if (!showDetails) {
    return getStatusBadge();
  }

  return (
    <div className="space-y-2">
      {getStatusBadge()}
      <div className="text-xs text-muted-foreground">
        <p>Score: {(freshness.freshness_score * 100).toFixed(1)}%</p>
        <p>Last updated: {new Date(freshness.last_updated).toLocaleString()}</p>
        <p>Decay rate: {(freshness.decay_rate * 100).toFixed(1)}%/day</p>
      </div>
    </div>
  );
};

interface TemporalDecayDashboardProps {
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export const TemporalDecayDashboard: React.FC<TemporalDecayDashboardProps> = ({
  autoRefresh = true,
  refreshInterval = 60000
}) => {
  const [staleRecords, setStaleRecords] = useState<InformationFreshness[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStaleRecords = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('information_freshness')
      .select('*')
      .eq('is_stale', true)
      .order('freshness_score', { ascending: true })
      .limit(10);

    if (!error && data) {
      setStaleRecords(data as InformationFreshness[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchStaleRecords();

    if (autoRefresh) {
      const interval = setInterval(fetchStaleRecords, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Temporal Decay Monitor
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin" />
          </div>
        ) : staleRecords.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-600" />
            <p>No stale data detected</p>
          </div>
        ) : (
          <div className="space-y-4">
            {staleRecords.map((record) => (
              <div
                key={record.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex-1">
                  <p className="font-medium">{record.data_type}</p>
                  <p className="text-sm text-muted-foreground">
                    {record.table_name} - {record.record_id.substring(0, 8)}...
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Last updated: {new Date(record.last_updated).toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <Badge variant="destructive">
                    {(record.freshness_score * 100).toFixed(0)}%
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
