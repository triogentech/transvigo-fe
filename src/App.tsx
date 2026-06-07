// ── SECTION: App Root, Providers & Router (real auth) ──
import React from 'react';
import { Routes, Route, Outlet } from 'react-router-dom';
import * as Tooltip from '@radix-ui/react-tooltip';
import { AuthProvider } from './context/AuthContext';
import { PermissionsProvider } from './context/PermissionsContext';
import { ToastProvider } from './context/ToastContext';
import { RequireAuth, RequirePermission, RequireRole } from './components/guards';

import Layout, { LiveMapPlaceholder } from './components/Layout.jsx';
import LoginPage from './pages/auth/LoginPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import ChangePasswordPage from './pages/auth/ChangePasswordPage';
import NotFoundPage from './pages/NotFoundPage';

// ── God Mode ──
import { PlatformAuthProvider } from './context/PlatformAuthContext';
import { RequirePlatformAuth } from './components/god/RequirePlatformAuth';
import { RequirePlatformRole } from './components/god/RequirePlatformRole';
import GodModeShell from './layouts/GodModeShell';
import GodLoginPage from './pages/god/GodLoginPage';
import GodDashboard from './pages/god/GodDashboard';
import OrgsListPage from './pages/god/OrgsListPage';
import CreateOrgPage from './pages/god/CreateOrgPage';
import OrgDetailPage from './pages/god/OrgDetailPage';
import ActiveImpersonationsPage from './pages/god/ActiveImpersonationsPage';
import PlatformAdminsPage from './pages/god/PlatformAdminsPage';
import OnboardingRequestsPage from './pages/god/OnboardingRequestsPage';
import PlatformAuditPage from './pages/god/PlatformAuditPage';

import Dashboard from './pages/Dashboard.jsx';
import Trips from './pages/Trips.jsx';
import Vehicles from './pages/Vehicles.jsx';
import Drivers from './pages/Drivers.jsx';
import Transactions from './pages/Transactions.jsx';
import Roles from './pages/Roles.jsx';
import Audit from './pages/Audit.jsx';
import FuelLogsPage from './pages/FuelLogsPage';
import TollLogsPage from './pages/TollLogsPage';
import TicketsPage from './pages/TicketsPage';
import JobCardsPage from './pages/JobCardsPage';
import SparePartsPage from './pages/SparePartsPage';
import TyreHubPage from './pages/TyreHubPage';
import InvoicesPage from './pages/InvoicesPage';
import AnalyticsPage from './pages/AnalyticsPage';
import MaintenancePage from './pages/MaintenancePage';
import CitiesPage from './pages/CitiesPage';
import LoadProvidersPage from './pages/LoadProvidersPage';
import FuelStationsPage from './pages/FuelStationsPage';
import GaragesPage from './pages/GaragesPage';
import TeamPage from './pages/TeamPage';

export default function App() {
  return (
    <AuthProvider>
      <PermissionsProvider>
        <ToastProvider>
          <Tooltip.Provider delayDuration={200}>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/change-password" element={<RequireAuth><ChangePasswordPage /></RequireAuth>} />

              <Route element={<RequireAuth><Layout /></RequireAuth>}>
                <Route index element={<Dashboard />} />
                <Route path="trips" element={<RequirePermission module="trips" action="canRead"><Trips /></RequirePermission>} />
                <Route path="tickets" element={<RequirePermission module="tickets" action="canRead"><TicketsPage /></RequirePermission>} />
                <Route path="job-cards" element={<RequirePermission module="job-cards" action="canRead"><JobCardsPage /></RequirePermission>} />
                <Route path="spare-parts" element={<RequirePermission module="spare-parts" action="canRead"><SparePartsPage /></RequirePermission>} />
                <Route path="tyres" element={<RequirePermission module="tyre-management" action="canRead"><TyreHubPage /></RequirePermission>} />
                <Route path="invoices" element={<RequirePermission module="invoices" action="canRead"><InvoicesPage /></RequirePermission>} />
                <Route path="analytics" element={<RequirePermission module="vehicles" action="canRead"><AnalyticsPage /></RequirePermission>} />
                <Route path="vehicles" element={<RequirePermission module="vehicles" action="canRead"><Vehicles /></RequirePermission>} />
                <Route path="drivers" element={<RequirePermission module="drivers" action="canRead"><Drivers /></RequirePermission>} />
                <Route path="transactions" element={<RequirePermission module="transactions" action="canRead"><Transactions /></RequirePermission>} />
                <Route path="fuel-logs" element={<RequirePermission module="fuel-logs" action="canRead"><FuelLogsPage /></RequirePermission>} />
                <Route path="toll-logs" element={<RequirePermission module="toll-logs" action="canRead"><TollLogsPage /></RequirePermission>} />
                <Route path="maintenance" element={<RequirePermission module="garage-logs" action="canRead"><MaintenancePage /></RequirePermission>} />
                <Route path="cities" element={<RequirePermission module="cities" action="canRead"><CitiesPage /></RequirePermission>} />
                <Route path="load-providers" element={<RequirePermission module="load-providers" action="canRead"><LoadProvidersPage /></RequirePermission>} />
                <Route path="fuel-stations" element={<RequirePermission module="fuel-stations" action="canRead"><FuelStationsPage /></RequirePermission>} />
                <Route path="garages" element={<RequirePermission module="garages" action="canRead"><GaragesPage /></RequirePermission>} />
                <Route path="map" element={<LiveMapPlaceholder />} />
                <Route path="admin/roles" element={<RequireRole roles={['Admin']}><Roles /></RequireRole>} />
                <Route path="admin/users" element={<RequireRole roles={['Admin']}><TeamPage /></RequireRole>} />
                <Route path="admin/audit" element={<RequirePermission module="activity-logs" action="canRead"><Audit /></RequirePermission>} />
              </Route>

              {/* ── God Mode (separate auth + shell) ── */}
              <Route path="/god" element={<PlatformAuthProvider><Outlet /></PlatformAuthProvider>}>
                <Route path="login" element={<GodLoginPage />} />
                <Route element={<RequirePlatformAuth><GodModeShell /></RequirePlatformAuth>}>
                  <Route index element={<GodDashboard />} />
                  <Route path="organisations" element={<OrgsListPage />} />
                  <Route path="organisations/new" element={<CreateOrgPage />} />
                  <Route path="organisations/:orgId" element={<OrgDetailPage />} />
                  <Route path="onboarding-requests" element={<OnboardingRequestsPage />} />
                  <Route path="audit-log" element={<PlatformAuditPage />} />
                  <Route path="impersonation" element={
                    <RequirePlatformRole roles={['SUPER_ADMIN', 'SUPPORT_ADMIN']}><ActiveImpersonationsPage /></RequirePlatformRole>
                  } />
                  <Route path="platform-admins" element={
                    <RequirePlatformRole roles={['SUPER_ADMIN']}><PlatformAdminsPage /></RequirePlatformRole>
                  } />
                  <Route path="settings" element={
                    <RequirePlatformRole roles={['SUPER_ADMIN']}><div className="text-center py-24" style={{ color: 'var(--text-secondary)' }}>Platform settings — coming soon</div></RequirePlatformRole>
                  } />
                </Route>
              </Route>

              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Tooltip.Provider>
        </ToastProvider>
      </PermissionsProvider>
    </AuthProvider>
  );
}
