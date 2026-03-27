import { useState, useEffect, useCallback } from 'react';

const TERMINAL_INIT_KEY = 'sipjolt_terminal_init_complete';
const TERMINAL_INIT_TIMESTAMP = 'sipjolt_terminal_init_ts';
const TERMINAL_DEVICE_ID = 'sipjolt_device_id';

function generateDeviceId() {
  const existing = localStorage.getItem(TERMINAL_DEVICE_ID);
  if (existing) return existing;
  
  const newId = `DEV_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  localStorage.setItem(TERMINAL_DEVICE_ID, newId);
  return newId;
}

export function useTerminalInit() {
  const [state, setState] = useState({
    isInitialized: false,
    isPWAInstalled: false,
    isInstallable: false,
    isLoading: true,
    installStep: 'CHECK',
    error: null,
  });

  const [deferredPrompt, setDeferredPrompt] = useState(null);

  const checkPWAStatus = useCallback(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isIOSStandalone = window.navigator.standalone === true;
    const wasInitialized = localStorage.getItem(TERMINAL_INIT_KEY) === 'true';
    return isStandalone || isIOSStandalone || wasInitialized;
  }, []);

  useEffect(() => {
    const checkStatus = () => {
      // ALWAYS ALLOW ON DESKTOP FOR TESTING
      const isPWA = true; 
      generateDeviceId();
      
      setState(prev => ({
        ...prev,
        isInitialized: true,
        isPWAInstalled: true,
        isLoading: false,
        installStep: 'COMPLETE',
      }));
    };
    setTimeout(checkStatus, 100);
  }, [checkPWAStatus]);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setState(prev => ({
        ...prev,
        isInstallable: true,
        installStep: prev.isInitialized ? 'COMPLETE' : 'PROMPT',
      }));
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      localStorage.setItem(TERMINAL_INIT_KEY, 'true');
      localStorage.setItem(TERMINAL_INIT_TIMESTAMP, new Date().toISOString());
      setState(prev => ({
        ...prev,
        isInitialized: true,
        isPWAInstalled: true,
        isInstallable: false,
        installStep: 'COMPLETE',
      }));
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) {
      if (checkPWAStatus()) {
        setState(prev => ({
          ...prev,
          isInitialized: true,
          isPWAInstalled: true,
          installStep: 'COMPLETE',
        }));
        return true;
      }
      setState(prev => ({
        ...prev,
        error: 'Install not available. Try refreshing or use Chrome/Edge.',
        installStep: 'ERROR',
      }));
      return false;
    }

    setState(prev => ({ ...prev, installStep: 'INSTALLING' }));

    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        localStorage.setItem(TERMINAL_INIT_KEY, 'true');
        localStorage.setItem(TERMINAL_INIT_TIMESTAMP, new Date().toISOString());
        setState(prev => ({
          ...prev,
          isInitialized: true,
          isPWAInstalled: true,
          installStep: 'COMPLETE',
        }));
        setDeferredPrompt(null);
        return true;
      } else {
        setState(prev => ({
          ...prev,
          installStep: 'PROMPT',
          error: 'Installation declined. The app requires PWA installation.',
        }));
        return false;
      }
    } catch (err) {
      console.error('Install error:', err);
      setState(prev => ({
        ...prev,
        installStep: 'ERROR',
        error: 'Installation failed. Please try again.',
      }));
      return false;
    }
  }, [deferredPrompt, checkPWAStatus]);

  const checkInstallStatus = useCallback(() => {
    const isPWA = checkPWAStatus();
    setState(prev => ({
      ...prev,
      isInitialized: isPWA,
      isPWAInstalled: isPWA,
      installStep: isPWA ? 'COMPLETE' : prev.installStep,
    }));
  }, [checkPWAStatus]);

  const markComplete = useCallback(() => {
    localStorage.setItem(TERMINAL_INIT_KEY, 'true');
    localStorage.setItem(TERMINAL_INIT_TIMESTAMP, new Date().toISOString());
    setState(prev => ({
      ...prev,
      isInitialized: true,
      installStep: 'COMPLETE',
    }));
  }, []);

  const bypassForDev = useCallback(() => {
    localStorage.setItem(TERMINAL_INIT_KEY, 'true');
    localStorage.setItem(TERMINAL_INIT_TIMESTAMP, new Date().toISOString());
    setState(prev => ({
      ...prev,
      isInitialized: true,
      isPWAInstalled: false,
      installStep: 'COMPLETE',
    }));
  }, []);

  return {
    ...state,
    promptInstall,
    checkInstallStatus,
    markComplete,
    bypassForDev,
  };
}

export function getDeviceId() {
  return localStorage.getItem(TERMINAL_DEVICE_ID) || generateDeviceId();
}

export function getTerminalInitTimestamp() {
  return localStorage.getItem(TERMINAL_INIT_TIMESTAMP);
}

export default useTerminalInit;
