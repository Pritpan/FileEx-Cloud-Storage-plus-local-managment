import { Routes, Route, Navigate } from 'react-router-dom';

import PublicRoute    from './PublicRoute';
import ProtectedRoute from './ProtectedRoute';
import AuthLayout      from '@/layouts/AuthLayout';
import DashboardLayout from '@/layouts/DashboardLayout';

import LoginPage from '@/features/auth/pages/LoginPage';
import RegisterPage from '@/features/auth/pages/RegisterPage';
import { VerifyEmailPage } from '@/features/auth/pages/VerifyEmailPage';
import { ForgotPasswordPage } from '@/features/auth/pages/ForgotPasswordPage';
import { ResetPasswordPage } from '@/features/auth/pages/ResetPasswordPage';
import { ExplorerPage } from '@/features/explorer/pages/ExplorerPage';
import { TrashPage } from '@/features/trash/pages/TrashPage';
import { StoragePage } from '@/features/storage/pages/StoragePage';
import { SettingsPage } from '@/features/profile/pages/SettingsPage';
import { RecentPage } from '@/features/recent/pages/RecentPage';
import { LocalExplorerPage } from '@/features/local';

/**
 * AppRouter — Central route tree.
 */
function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      {/* ── Public zone ─────────────────────────────────────────── */}
      <Route element={<PublicRoute />}>
        <Route element={<AuthLayout />}>
          <Route path="/login"        element={<LoginPage />} />
          <Route path="/register"        element={<RegisterPage />} />
          <Route path="/verify-email"    element={<VerifyEmailPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password"  element={<ResetPasswordPage />} />
        </Route>
      </Route>

      {/* ── Protected zone ──────────────────────────────────────── */}
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          {/* Feature pages registered here as implemented */}
          <Route path="/explorer"              element={<ExplorerPage />} />
          <Route path="/explorer/:folderId"    element={<ExplorerPage />} />
          <Route path="/recent"                element={<RecentPage />} />
          <Route path="/trash"                 element={<TrashPage />} />
          <Route path="/storage"               element={<StoragePage />} />
          <Route path="/settings"              element={<SettingsPage />} />
          <Route path="/local"                 element={<LocalExplorerPage />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default AppRouter;
