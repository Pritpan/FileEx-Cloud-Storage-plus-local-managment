import { Routes, Route, Navigate } from 'react-router-dom';

import PublicRoute    from './PublicRoute';
import ProtectedRoute from './ProtectedRoute';
import AuthLayout      from '@/layouts/AuthLayout';
import DashboardLayout from '@/layouts/DashboardLayout';

import LoginPage from '@/features/auth/pages/LoginPage';
import RegisterPage from '@/features/auth/pages/RegisterPage';
import { ExplorerPage } from '@/features/explorer/pages/ExplorerPage';
import { TrashPage } from '@/features/trash/pages/TrashPage';
import { StoragePage } from '@/features/storage/pages/StoragePage';

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
          <Route path="/login"    element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>
      </Route>

      {/* ── Protected zone ──────────────────────────────────────── */}
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          {/* Feature pages registered here as implemented */}
          <Route path="/explorer"              element={<ExplorerPage />} />
          <Route path="/explorer/:folderId"    element={<ExplorerPage />} />
          <Route path="/trash"                 element={<TrashPage />} />
          <Route path="/storage"               element={<StoragePage />} />
          {/* <Route path="/settings/*"            element={<SettingsPage />} /> */}
        </Route>
      </Route>
    </Routes>
  );
}

export default AppRouter;
