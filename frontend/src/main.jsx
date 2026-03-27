import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Debug logging for mobile crash diagnosis
console.log('[JOLT] 1. main.jsx loaded successfully');

// Hide the loading spinner when React is ready
const hideLoader = () => {
  try {
    const loader = document.getElementById('app-loader');
    if (loader) loader.classList.add('hidden');
  } catch (e) {
    console.error('[JOLT] Failed to hide loader:', e);
  }
};

// Crash loop detection - prevents infinite refresh loops on mobile
const CRASH_KEY = '__jolt_crash_count__';
const CRASH_TIME_KEY = '__jolt_crash_time__';
const MAX_CRASHES = 3;
const CRASH_WINDOW_MS = 10000; // 10 seconds

let shouldShowRecovery = false;

try {
  if (typeof window !== 'undefined' && window.sessionStorage) {
    const now = Date.now();
    const lastCrashTime = parseInt(sessionStorage.getItem(CRASH_TIME_KEY) || '0', 10);
    let crashCount = parseInt(sessionStorage.getItem(CRASH_KEY) || '0', 10);
    
    // Reset crash count if outside the time window
    if (now - lastCrashTime > CRASH_WINDOW_MS) {
      crashCount = 0;
    }
    
    crashCount++;
    sessionStorage.setItem(CRASH_KEY, crashCount.toString());
    sessionStorage.setItem(CRASH_TIME_KEY, now.toString());
    
    if (crashCount >= MAX_CRASHES) {
      shouldShowRecovery = true;
    }
  }
} catch (e) {
  // sessionStorage might not be available - continue anyway
}

// Safe window check for mobile compatibility
if (typeof window !== 'undefined') {
  // Global error handler for unhandled rejections
  window.addEventListener('unhandledrejection', event => {
    console.error('Unhandled rejection:', event.reason);
    // Prevent app from crashing - just log the error
    event.preventDefault();
  });

  // Global error handler for runtime errors
  window.addEventListener('error', event => {
    console.error('Runtime error:', event.error);
    // Don't prevent default for other errors, but log them
  });
}

// Show recovery UI if crash loop detected
if (shouldShowRecovery) {
  try {
    document.addEventListener('DOMContentLoaded', () => {
      const root = document.getElementById('root');
      if (root) {
        root.innerHTML = `
          <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; font-family: system-ui; background: #f8fafc;">
            <div style="text-align: center; padding: 40px; max-width: 400px;">
              <h1 style="color: #dc2626; margin-bottom: 10px; font-size: 24px;">⚠️ App Having Trouble</h1>
              <p style="color: #666; margin-bottom: 20px; line-height: 1.5;">The app crashed multiple times. This might be caused by cached data. Try clearing the cache below.</p>
              <button onclick="(function(){try{localStorage.clear();sessionStorage.clear();if('caches' in window){caches.keys().then(function(names){names.forEach(function(name){caches.delete(name)})})}}catch(e){}alert('Cache cleared! Tap OK to reload.');window.location.reload()})()" style="padding: 14px 28px; background: #dc2626; color: white; border: none; border-radius: 12px; cursor: pointer; font-size: 16px; font-weight: 600; margin-bottom: 12px; width: 100%;">
                Clear Cache & Reload
              </button>
              <button onclick="try{sessionStorage.clear()}catch(e){};window.location.reload()" style="padding: 14px 28px; background: #2563eb; color: white; border: none; border-radius: 12px; cursor: pointer; font-size: 16px; font-weight: 600; width: 100%;">
                Try Again
              </button>
            </div>
          </div>
        `;
      }
    });
  } catch (e) {
    console.error('Failed to show recovery UI:', e);
  }
} else {
  // Normal app loading
  console.log('[JOLT] 2. Starting React initialization');
  try {
    const rootElement = document.getElementById('root');
    if (!rootElement) {
      throw new Error('Root element not found');
    }
    
    console.log('[JOLT] 3. Root element found, rendering app');
    
    // Clear crash count on successful render start
    if (typeof window !== 'undefined' && window.sessionStorage) {
      try {
        // Will be cleared after successful render in App component
      } catch (e) {}
    }
    
    ReactDOM.createRoot(rootElement).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    
    console.log('[JOLT] 4. React render called successfully');
    hideLoader();
  } catch (error) {
    console.error('Failed to render app:', error);
    // Display minimal error UI
    setTimeout(() => {
      try {
        document.body.innerHTML = `
          <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; font-family: system-ui;">
            <div style="text-align: center; padding: 40px;">
              <h1 style="color: #dc2626; margin-bottom: 10px;">⚠️ App Failed to Load</h1>
              <p style="color: #666; margin-bottom: 20px;">The app encountered an error during startup.</p>
              <button onclick="window.location.reload()" style="padding: 10px 20px; background: #2563eb; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 16px;">
                Reload Page
              </button>
            </div>
          </div>
        `;
      } catch (e) {
        console.error('Failed to display error UI:', e);
      }
    }, 100);
  }
}
