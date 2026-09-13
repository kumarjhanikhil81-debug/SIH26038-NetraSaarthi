import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// PWA Service Worker management: active in production, unregistered in development to prevent HMR interference
if ('serviceWorker' in navigator) {
  if (import.meta.env.PROD) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          console.log('[NetraSaarthi PWA] Service Worker registered with scope:', reg.scope);
        })
        .catch((err) => {
          console.warn('[NetraSaarthi PWA] Service Worker registration failed:', err);
        });
    });
  } else {
    // In development mode, unregister any existing service worker to prevent stale module caching
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const reg of registrations) {
        reg.unregister().then((success) => {
          if (success) {
            console.log('[NetraSaarthi PWA] Dev mode: unregistered stale Service Worker:', reg.scope);
          }
        });
      }
    }).catch((err) => {
      console.warn('[NetraSaarthi PWA] Error checking service worker registrations:', err);
    });
  }
}

const rootEl = document.getElementById('root');

if (rootEl) {
  try {
    ReactDOM.createRoot(rootEl).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  } catch (renderErr) {
    console.error('[NetraSaarthi] Root render error:', renderErr);
    rootEl.innerHTML = `
      <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; background-color: #F0F9FA; font-family: system-ui, sans-serif; padding: 24px; text-align: center;">
        <div style="background: white; border-radius: 24px; padding: 32px; box-shadow: 0 10px 25px rgba(0,0,0,0.08); max-width: 480px; width: 100%;">
          <div style="width: 48px; height: 48px; border-radius: 16px; background: #fee2e2; color: #dc2626; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 20px; margin: 0 auto 16px;">!</div>
          <h2 style="font-size: 18px; font-weight: 800; color: #0f172a; margin-bottom: 8px;">NetraSaarthi Clinical Application</h2>
          <p style="font-size: 13px; color: #475569; margin-bottom: 20px; line-height: 1.5;">${renderErr.message || 'An error occurred during application initialization.'}</p>
          <button onclick="window.location.reload()" style="background: #0f766e; color: white; border: none; border-radius: 12px; font-weight: 700; font-size: 13px; padding: 10px 20px; cursor: pointer;">Refresh Application</button>
        </div>
      </div>
    `;
  }
}

