// Phase 9: Advanced Features Integration Page

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  DollarSign, 
  Brain, 
  TrendingUp,
  Activity
} from 'lucide-react';

// Import Phase 9 components
import { UserPredictionForm } from './collaborative-intelligence';
import { CrowdWisdomDisplay } from './CrowdWisdomDisplay';
import { MarketOddsDisplay, ValueBetHighlights } from './market-integration';
import { SystemStatusCard } from './SystemStatusCard';
import { QuickActionCard } from './QuickActionCard';
import { HealthMetric } from './HealthMetric';

interface Phase9DashboardProps {
  matchId?: string;
}

export const Phase9Dashboard: React.FC<Phase9DashboardProps> = ({ matchId }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const demoMatchId = matchId || 'demo-match-123';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Phase 9: Advanced Features</h1>
          <p className="text-muted-foreground mt-2">
            Collaborative Intelligence & Market Integration
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="collaborative">Crowd Wisdom</TabsTrigger>
          <TabsTrigger value="market">Market Integration</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <SystemStatusCard
              title="Collaborative Intelligence"
              icon={<Users className="h-5 w-5" />}
              status="active"
              description="User predictions & crowd wisdom"
              color="blue"
            />
            <SystemStatusCard
              title="Market Integration"
              icon={<DollarSign className="h-5 w-5" />}
              status="active"
              description="Odds API & value bets"
              color="green"
            />
            <SystemStatusCard
              title="Self-Improving"
              icon={<Brain className="h-5 w-5" />}
              status="active"
              description="Continuous learning"
              color="purple"
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <QuickActionCard
                  title="Submit Prediction"
                  description="Add your prediction to crowd wisdom"
                  icon={<Users className="h-8 w-8" />}
                  onClick={() => setActiveTab('collaborative')}
                />
                <QuickActionCard
                  title="Check Value Bets"
                  description="Find profitable opportunities"
                  icon={<DollarSign className="h-8 w-8" />}
                  onClick={() => setActiveTab('market')}
                />
                <QuickActionCard
                  title="View Analytics"
                  description="System performance metrics"
                  icon={<TrendingUp className="h-8 w-8" />}
                  onClick={() => setActiveTab('overview')}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                System Health Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <HealthMetric
                  title="Crowd Participation"
                  value="87%"
                  status="good"
                  description="Active user predictions"
                />
                <HealthMetric
                  title="Market Data Freshness"
                  value="94%"
                  status="excellent"
                  description="Odds data recency"
                />
                <HealthMetric
                  title="Prediction Accuracy"
                  value="73%"
                  status="excellent"
                  description="Overall system performance"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="collaborative" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <UserPredictionForm
              matchId={demoMatchId}
              onSubmit={(data) => {
                console.log('Prediction submitted:', data);
              }}
            />
            <CrowdWisdomDisplay
              matchId={demoMatchId}
              showDivergence={true}
              refreshInterval={30000}
            />
          </div>
        </TabsContent>

        <TabsContent value="market" className="space-y-6">
          <MarketOddsDisplay
            matchId={demoMatchId}
            showValueBets={true}
            autoRefresh={true}
          />

          <ValueBetHighlights
            maxResults={10}
            minExpectedValue={0.05}
            showKellyCalculator={true}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};
