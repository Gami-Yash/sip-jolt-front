import { useState, useEffect } from 'react';
import { safeStorage } from '../utils/safeStorage';

export const usePWAInstall = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    const checkInstalled = () => {
      if (typeof window === 'undefined') return false;
      
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isIOSStandalone = window.navigator?.standalone === true;
      const wasInstalled = safeStorage.getItem('pwa_installed') === 'true';
      
      return isStandalone || isIOSStandalone || wasInstalled;
    };

    setIsInstalled(checkInstalled());

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
      safeStorage.setItem('pwa_installed', 'true');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleChange = (e) => {
      if (e.matches) {
        setIsInstalled(true);
        safeStorage.setItem('pwa_installed', 'true');
      }
    };
    mediaQuery.addEventListener('change', handleChange);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  const promptInstall = async () => {
    if (!deferredPrompt) return false;
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setIsInstalled(true);
      safeStorage.setItem('pwa_installed', 'true');
    }
    
    setDeferredPrompt(null);
    setIsInstallable(false);
    
    return outcome === 'accepted';
  };

  return {
    isInstalled,
    isInstallable,
    promptInstall
  };
};
