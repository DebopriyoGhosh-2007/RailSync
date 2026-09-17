import { Routes, Route, Navigate } from 'react-router-dom';
import StyleGuide from './dev/StyleGuide';
import { AppShell } from './components/shell/AppShell';
import { ProtectedRoute } from './auth/ProtectedRoute';
import { PublicRoute } from './auth/PublicRoute';
import RaiseRequestPage from './features/raise-token/RaiseRequestPage';
import LoginPage from './features/auth/LoginPage';
import RegisterPage from './features/auth/RegisterPage';
import OverviewPage from './features/overview/OverviewPage';
import CockpitPage from './features/cockpit/CockpitPage';
import IntakePage from './features/intake/IntakePage';
import OperationsDataPage from './features/operations-data/OperationsDataPage';
import FeasibilityPage from './features/feasibility/FeasibilityPage';
import PriorityPage from './features/priority/PriorityPage';
import PlannerPage from './features/planner/PlannerPage';
import WhatIfPage from './features/what-if/WhatIfPage';
import LiveMonitorPage from './features/live-monitor/LiveMonitorPage';

export default function App() {
  return (
    <Routes>
      <Route element={<PublicRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>
      
      {/* Protected Routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route path="/" element={<OverviewPage />} />
          <Route path="/intake" element={<IntakePage />} />
          <Route path="/feasibility" element={<FeasibilityPage />} />
          <Route path="/priority" element={<PriorityPage />} />
          <Route path="/planner" element={<PlannerPage />} />
          <Route path="/operations-data" element={<OperationsDataPage />} />
          <Route path="/what-if" element={<WhatIfPage />} />
          <Route path="/live-monitor" element={<LiveMonitorPage />} />
          <Route path="/cockpit" element={<CockpitPage />} />
          
          <Route path="/raise-token" element={<RaiseRequestPage />} />
          <Route path="/dev/styleguide" element={<StyleGuide />} />
          
          {/* Fallback to Overview instead of styleguide */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Route>
    </Routes>
  );
}
