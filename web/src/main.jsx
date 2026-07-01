import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';

import { queryClient } from '@/lib/queryClient';
import App from './App';

import '@/styles/index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/*
     * Provider order matters:
     * 1. QueryClientProvider — outermost, makes server state available everywhere
     * 2. BrowserRouter      — routing context for all components
     * 3. App                — renders the route tree
     *
     * Auth state and theme providers will wrap App in future chunks.
     */}
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);
