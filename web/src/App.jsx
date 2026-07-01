import { Routes, Route, Navigate } from 'react-router-dom';

/**
 * App — Root route tree.
 *
 * Routes are registered here as features are built in subsequent chunks.
 * The architecture document defines the full routing structure:
 *
 *   /                    → redirect to /dashboard
 *   /login               → Login page
 *   /register            → Register page
 *   /dashboard           → Storage overview
 *   /explorer            → Root cloud storage
 *   /explorer/:folderId  → Folder contents
 *   /trash               → Recycle Bin
 *   /favorites           → Starred files
 *   /search              → Search results
 *   /settings/*          → Settings pages
 *
 * See: docs/ARCHITECTURE.md §3.2
 */
function App() {
  return (
    <Routes>
      {/* Temporary placeholder — routes will be wired in feature chunks */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route
        path="*"
        element={
          <div style={{ padding: '2rem', fontFamily: 'system-ui' }}>
            <h1>Fileex</h1>
            <p>Foundation ready. Routes will be registered in the next chunk.</p>
          </div>
        }
      />
    </Routes>
  );
}

export default App;
