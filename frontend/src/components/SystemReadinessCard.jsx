import React, { useState, useEffect } from 'react';
import { Smartphone, CheckCircle, Download, Share, PlusSquare, MoreVertical, X, BookOpen } from 'lucide-react';
import { triggerHaptic } from '../utils/mobileGestures';

const detectPlatform = () => {
  const ua = navigator.userAgent || navigator.vendor || window.opera;
  if (/iPad|iPhone|iPod/.test(ua) && !window.MSStream) return 'ios';
  if (/android/i.test(ua)) return 'android';
  return 'desktop';
};

const IOSInstructions = () => (
  <div className="space-y-3 mt-4">
    <p className="text-gray-300 text-sm mb-3">Follow these steps to install:</p>
    <div className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg">
      <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-400 font-bold text-sm">1</div>
      <div className="flex-1">
        <p className="text-white text-sm">Tap the Share button</p>
        <p className="text-gray-500 text-xs">At the bottom of Safari</p>
      </div>
      <Share size={20} className="text-blue-400" />
    </div>
    <div className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg">
      <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-400 font-bold text-sm">2</div>
      <div className="flex-1">
        <p className="text-white text-sm">Scroll and tap "Add to Home Screen"</p>
        <p className="text-gray-500 text-xs">Look for the + icon</p>
      </div>
      <PlusSquare size={20} className="text-blue-400" />
    </div>
    <div className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg">
      <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-400 font-bold text-sm">3</div>
      <div className="flex-1">
        <p className="text-white text-sm">Tap "Add" in the top right</p>
        <p className="text-gray-500 text-xs">Then open from your home screen</p>
      </div>
      <CheckCircle size={20} className="text-green-400" />
    </div>
  </div>
);

const AndroidInstructions = () => (
  <div className="space-y-3 mt-4">
    <p className="text-gray-300 text-sm mb-3">Follow these steps to install:</p>
    <div className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg">
      <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-400 font-bold text-sm">1</div>
      <div className="flex-1">
        <p className="text-white text-sm">Tap the menu button</p>
        <p className="text-gray-500 text-xs">Three dots in Chrome's top right</p>
      </div>
      <MoreVertical size={20} className="text-blue-400" />
    </div>
    <div className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg">
      <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-400 font-bold text-sm">2</div>
      <div className="flex-1">
        <p className="text-white text-sm">Tap "Add to Home screen"</p>
        <p className="text-gray-500 text-xs">Or "Install app" if shown</p>
      </div>
      <PlusSquare size={20} className="text-blue-400" />
    </div>
    <div className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg">
      <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-400 font-bold text-sm">3</div>
      <div className="flex-1">
        <p className="text-white text-sm">Tap "Add" to confirm</p>
        <p className="text-gray-500 text-xs">Then open from your home screen</p>
      </div>
      <CheckCircle size={20} className="text-green-400" />
    </div>
  </div>
);

const DesktopMessage = () => (
  <div className="mt-4 p-4 bg-gray-800/50 rounded-lg border border-amber-500/20">
    <div className="flex items-start gap-3">
      <Smartphone size={24} className="text-amber-400 mt-0.5" />
      <div>
        <p className="text-white text-sm font-medium mb-1">Mobile Device Required</p>
        <p className="text-gray-400 text-xs leading-relaxed">
          SIPJOLT needs to be installed on your phone for GPS location, camera access, and offline support. 
          Open this page on your iPhone or Android phone to continue.
        </p>
      </div>
    </div>
  </div>
);

export const SystemReadinessCard = ({ isInstalled, isInstallable, onInstall }) => {
  const [showInstructions, setShowInstructions] = useState(false);
  const [platform, setPlatform] = useState('desktop');

  useEffect(() => {
    setPlatform(detectPlatform());
  }, []);

  const handleInstall = async () => {
    triggerHaptic('medium');
    if (onInstall) {
      await onInstall();
    }
  };

  const toggleInstructions = () => {
    triggerHaptic('light');
    setShowInstructions(!showInstructions);
  };

  if (true) { // Forced true for desktop testing
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
            <CheckCircle size={20} className="text-green-600" />
          </div>
          <div className="flex-1">
            <p className="text-green-800 font-semibold text-sm">System Ready</p>
            <p className="text-green-600 text-xs">SIPJOLT v1.00 Verified</p>
          </div>
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 border border-amber-500/30 rounded-xl p-4 mb-4">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center">
          <Download size={20} className="text-amber-400" />
        </div>
        <div className="flex-1">
          <p className="text-amber-400 text-sm font-semibold">Install SIPJOLT</p>
          <p className="text-gray-500 text-xs">Add to your phone's home screen</p>
        </div>
      </div>
      
      <div className="bg-gray-800/50 rounded-lg p-3 mb-3">
        <p className="text-gray-300 text-xs leading-relaxed">
          Installing the app lets you work offline, take photos with GPS, and get the best experience. It takes 30 seconds.
        </p>
      </div>
      
      {isInstallable ? (
        <button
          onClick={handleInstall}
          className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold rounded-lg flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
        >
          <Download size={18} />
          Install App
        </button>
      ) : (
        <>
          {platform === 'desktop' ? (
            <DesktopMessage />
          ) : (
            <>
              <button
                onClick={toggleInstructions}
                className="w-full py-3 px-4 bg-gray-800 hover:bg-gray-700 text-white font-semibold rounded-lg flex items-center justify-center gap-2 transition-all"
              >
                {showInstructions ? (
                  <>
                    <X size={18} />
                    Hide Instructions
                  </>
                ) : (
                  <>
                    <BookOpen size={18} />
                    Show Me How
                  </>
                )}
              </button>
              
              {showInstructions && (
                platform === 'ios' ? <IOSInstructions /> : <AndroidInstructions />
              )}
            </>
          )}
        </>
      )}
      
    </div>
  );
};
