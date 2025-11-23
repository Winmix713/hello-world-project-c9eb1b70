import React, { Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { usePhaseFlags } from '@/hooks/usePhaseFlags';
import AuthGate from '@/components/AuthGate';
import PageLoading from '@/components/ui/page-loading';
import Index from '@/pages/Index';
import Login from '@/pages/Auth/Login';
import Signup from '@/pages/Auth/Signup';
import NewPredictions from '@/pages/NewPredictions';
import Teams from '@/pages/Teams';
import Matches from '@/pages/Matches';
import Leagues from '@/pages/Leagues';
import Dashboard from '@/pages/Dashboard';
import PredictionsView from '@/pages/PredictionsView';
 
import Phase9 from '@/pages/Phase9';
import NotFound from '@/pages/NotFound';
import Unauthorized from '@/pages/Unauthorized';
import FeatureFlagsDemo from '@/pages/FeatureFlagsDemo';

// Lazy load heavy components
const TeamDetail = React.lazy(() => import('@/pages/TeamDetail'));
const CrossLeague = React.lazy(() => import('@/pages/CrossLeague'));
const Analytics = React.lazy(() => import('@/pages/Analytics'));
const Monitoring = React.lazy(() => import('@/pages/Monitoring'));
const MatchesPage = React.lazy(() => import('@/pages/MatchesPage'));
const MatchDetail = React.lazy(() => import('@/pages/MatchDetail'));
const ScheduledJobsPage = React.lazy(() => import('@/pages/ScheduledJobsPage'));
const AIChat = React.lazy(() => import('@/pages/AIChat'));

// Lazy load admin components
const AdminDashboard = React.lazy(() => import('@/pages/admin/AdminDashboard'));
const UsersPage = React.lazy(() => import('@/pages/admin/users/UsersPage'));
const RunningJobsPage = React.lazy(() => import('@/pages/admin/jobs/RunningJobsPage'));
const Phase9SettingsPage = React.lazy(() => import('@/pages/admin/phase9/Phase9SettingsPage'));
const HealthDashboard = React.lazy(() => import('@/pages/admin/HealthDashboard'));
const IntegrationsPage = React.lazy(() => import('@/pages/admin/IntegrationsPage'));
const StatsPage = React.lazy(() => import('@/pages/admin/StatsPage'));
const ModelStatusDashboard = React.lazy(() => import('@/pages/admin/ModelStatusDashboard'));
const FeedbackInboxPage = React.lazy(() => import('@/pages/admin/FeedbackInboxPage'));
// const PredictionReviewPage = React.lazy(() => import('@/pages/admin/PredictionReviewPage'));

// Import admin components when needed
import RoleGate from '@/components/admin/RoleGate';

const AppRoutes: React.FC = () => {
  const { isPhase5Enabled, isPhase6Enabled, isPhase7Enabled, isPhase8Enabled, isPhase9Enabled } = usePhaseFlags();

  return (
    <Routes>
      {/* Public routes - no auth required */}
      <Route path="/" element={<AuthGate requireAuth={false}><Index /></AuthGate>} />
      <Route path="/login" element={<AuthGate requireAuth={false}><Login /></AuthGate>} />
       <Route path="/signup" element={<AuthGate requireAuth={false}><Signup /></AuthGate>} />
       <Route path="/unauthorized" element={<AuthGate requireAuth={false}><Unauthorized /></AuthGate>} />
       <Route path="/feature-flags" element={<AuthGate requireAuth={false}><FeatureFlagsDemo /></AuthGate>} />

       {/* Demo routes - accessible to all (read-only for unauthenticated) */}
      <Route path="/predictions" element={<AuthGate requireAuth={false}><PredictionsView /></AuthGate>} />
      <Route path="/matches" element={<AuthGate requireAuth={false}><Matches /></AuthGate>} />
      <Route 
        path="/match/:id" 
        element={
          <AuthGate requireAuth={false}>
            <Suspense fallback={<PageLoading message="Loading match details..." />}>
              <MatchDetail />
            </Suspense>
          </AuthGate>
        } 
      />
      <Route path="/teams" element={<AuthGate requireAuth={false}><Teams /></AuthGate>} />
      <Route 
        path="/teams/:teamName" 
        element={
          <AuthGate requireAuth={false}>
            <Suspense fallback={<PageLoading message="Loading team details..." />}>
              <TeamDetail />
            </Suspense>
          </AuthGate>
        } 
      />
      <Route path="/leagues" element={<AuthGate requireAuth={false}><Leagues /></AuthGate>} />

      {/* AI Chat - accessible to all */}
      <Route
        path="/ai-chat"
        element={
          <AuthGate requireAuth={false}>
            <Suspense fallback={<PageLoading message="Loading AI Chat..." />}>
              <AIChat />
            </Suspense>
          </AuthGate>
        }
      />

      {/* Protected routes - require authentication */}
      <Route path="/predictions/new" element={<AuthGate><NewPredictions /></AuthGate>} />
      <Route path="/dashboard" element={<AuthGate><Dashboard /></AuthGate>} />
      
      {/* Phase 5: Advanced pattern detection */}
      {isPhase5Enabled && (
        <Route path="/patterns" element={<AuthGate><div>Phase 5 Pattern Detection</div></AuthGate>} />
      )}
      
      {/* Phase 6: Model evaluation & feedback loop */}
      {isPhase6Enabled && (
        <Route 
          path="/models" 
          element={
            <AuthGate>
              <Suspense fallback={<PageLoading message="Loading models..." />}>
                <Models />
              </Suspense>
            </AuthGate>
          } 
        />
      )}
      
      {/* Phase 7: Cross-league intelligence */}
      {isPhase7Enabled && (
        <Route 
          path="/crossleague" 
          element={
            <AuthGate>
              <Suspense fallback={<PageLoading message="Loading cross-league intelligence..." />}>
                <CrossLeague />
              </Suspense>
            </AuthGate>
          } 
        />
      )}
      
      {/* Phase 8: Monitoring & visualization */}
      {isPhase8Enabled && (
        <>
          <Route 
            path="/analytics" 
            element={
              <AuthGate>
                <Suspense fallback={<PageLoading message="Loading analytics..." />}>
                  <Analytics />
                </Suspense>
              </AuthGate>
            } 
          />
          <Route 
            path="/monitoring" 
            element={
              <AuthGate>
                <Suspense fallback={<PageLoading message="Loading monitoring..." />}>
                  <Monitoring />
                </Suspense>
              </AuthGate>
            } 
          />
        </>
      )}
      
      {/* Phase 9: Collaborative market intelligence */}
      {isPhase9Enabled && (
        <Route path="/phase9" element={<AuthGate><Phase9 /></AuthGate>} />
      )}

      {/* Admin routes */}
      <Route
        path="/admin"
        element={
          <AuthGate>
            <RoleGate allowedRoles={["admin", "analyst"]}>
              <Suspense fallback={<PageLoading message="Loading admin dashboard..." />}>
                <AdminDashboard />
              </Suspense>
            </RoleGate>
          </AuthGate>
        }
      />
      <Route
        path="/admin/users"
        element={
          <AuthGate>
            <RoleGate allowedRoles={["admin"]}>
              <Suspense fallback={<PageLoading message="Loading user management..." />}>
                <UsersPage />
              </Suspense>
            </RoleGate>
          </AuthGate>
        }
      />
      <Route
        path="/admin/jobs"
        element={
          <AuthGate>
            <RoleGate allowedRoles={["admin", "analyst"]}>
              <Suspense fallback={<PageLoading message="Loading job management..." />}>
                <RunningJobsPage />
              </Suspense>
            </RoleGate>
          </AuthGate>
        }
      />
      <Route
        path="/admin/phase9"
        element={
          <AuthGate>
            <RoleGate allowedRoles={["admin", "analyst"]}>
              <Suspense fallback={<PageLoading message="Loading Phase 9 settings..." />}>
                <Phase9SettingsPage />
              </Suspense>
            </RoleGate>
          </AuthGate>
        }
      />
      <Route
        path="/admin/health"
        element={
          <AuthGate>
            <RoleGate allowedRoles={["admin", "analyst"]}>
              <Suspense fallback={<PageLoading message="Loading health dashboard..." />}>
                <HealthDashboard />
              </Suspense>
            </RoleGate>
          </AuthGate>
        }
      />
      <Route
        path="/admin/stats"
        element={
          <AuthGate>
            <RoleGate allowedRoles={["admin", "analyst"]}>
              <Suspense fallback={<PageLoading message="Loading stats..." />}>
                <StatsPage />
              </Suspense>
            </RoleGate>
          </AuthGate>
        }
      />
      <Route
        path="/admin/integrations"
        element={
          <AuthGate>
            <RoleGate allowedRoles={["admin", "analyst"]}>
              <Suspense fallback={<PageLoading message="Loading integrations..." />}>
                <IntegrationsPage />
              </Suspense>
            </RoleGate>
          </AuthGate>
        }
      />
      <Route
        path="/admin/model-status"
        element={
          <AuthGate>
            <RoleGate allowedRoles={["admin", "analyst"]}>
              <Suspense fallback={<PageLoading message="Loading model status..." />}>
                <ModelStatusDashboard />
              </Suspense>
            </RoleGate>
          </AuthGate>
        }
      />
      <Route
        path="/admin/feedback"
        element={
          <AuthGate>
            <RoleGate allowedRoles={["admin", "analyst"]}>
              <Suspense fallback={<PageLoading message="Loading feedback inbox..." />}>
                <FeedbackInboxPage />
              </Suspense>
            </RoleGate>
          </AuthGate>
        }
      />
      
      {/* Legacy routes for backward compatibility */}
      {(isPhase5Enabled || isPhase6Enabled || isPhase7Enabled || isPhase8Enabled) && (
        <Route 
          path="/jobs" 
          element={
            <AuthGate allowedRoles={['admin', 'analyst']}>
              <Suspense fallback={<PageLoading message="Loading scheduled jobs..." />}>
                <ScheduledJobsPage />
              </Suspense>
            </AuthGate>
          } 
        />
      )}
      
      {(isPhase6Enabled || isPhase8Enabled) && (
        <Route 
          path="/admin/models" 
          element={
            <AuthGate allowedRoles={['admin', 'analyst']}>
              <Suspense fallback={<PageLoading message="Loading models..." />}>
                <ModelsPage />
              </Suspense>
            </AuthGate>
          } 
        />
      )}
      
      {isPhase8Enabled && (
        <>
          <Route 
            path="/admin/matches" 
            element={
              <AuthGate allowedRoles={['admin', 'analyst']}>
                <Suspense fallback={<PageLoading message="Loading matches..." />}>
                  <MatchesPage />
                </Suspense>
              </AuthGate>
            } 
          />
          <Route 
            path="/admin/monitoring" 
            element={
              <AuthGate allowedRoles={['admin', 'analyst']}>
                <Suspense fallback={<PageLoading message="Loading monitoring..." />}>
                  <MonitoringPage />
                </Suspense>
              </AuthGate>
            } 
          />
        </>
      )}
      
      <Route 
        path="/admin/environment" 
        element={
          <AuthGate allowedRoles={['admin']}>
            <Suspense fallback={<PageLoading message="Loading environment variables..." />}>
              <EnvVariables />
            </Suspense>
          </AuthGate>
        } 
      />
      
      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;