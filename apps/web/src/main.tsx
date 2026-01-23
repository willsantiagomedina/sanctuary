import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { TooltipProvider } from '@sanctuary/ui';
import { ConvexProviderWithAuth } from './lib/auth';
import { convexClient } from './lib/convex/client';
import App from './App';
import './styles/globals.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ConvexProviderWithAuth client={convexClient}>
      <BrowserRouter>
        <TooltipProvider>
          <App />
        </TooltipProvider>
      </BrowserRouter>
    </ConvexProviderWithAuth>
  </React.StrictMode>
);
