import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, HashRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

import { queryClient } from '@/lib/queryClient';
import App from './App';

import '@/styles/index.css';

const Router = typeof window !== 'undefined' && window.location.protocol === 'file:'
  ? HashRouter
  : BrowserRouter;

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/*
     * Provider order matters:
     * 1. QueryClientProvider — outermost, makes server state available everywhere
     * 2. Router             — routing context (HashRouter for Electron file://, BrowserRouter for web)
     * 3. App                — renders the route tree
     *
     * Auth state and theme providers will wrap App in future chunks.
     */}
    <QueryClientProvider client={queryClient}>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <App />
      </Router>
      {/* Devtools panel — stripped from production builds automatically */}
      <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-right" />
    </QueryClientProvider>
  </StrictMode>,
);
