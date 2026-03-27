// INITIALIZATION TRACKING - helps debug production crashes

import React, { useState, useEffect, useRef, Component, createElement } from 'react';
import { VideoPlayer } from './components/VideoPlayer';
import { VideoManager } from './components/VideoManager';
import { SupplyClosetApp, QRVerificationPage } from './components/SupplyCloset';
import { ActionRail, UILockOverlay } from './components/ActionRail';
import { RecoveryWizard } from './components/RecoveryWizard';
import { ConsolidatedStatusBar } from './components/ConsolidatedStatusBar';
import { OnboardingWizard } from './components/OnboardingWizard';
import { RecertificationGauntlet } from './components/RecertificationGauntlet';
import NeuralCoreChatFab from './components/NeuralCoreChatFab';
import { CoffeeStatus } from './components/CoffeeStatus';
import RewardsHub from './components/RewardsHub';
import HomeDashboard from './components/HomeDashboard';
import TechnicianMissionPanel from './components/TechnicianMissionPanel';
import AdminDiagnosticPanel from './components/AdminDiagnosticPanel';
import OpsCommandCenter from './components/OpsCommandCenter';
import TestModeBanner from './components/TestModeBanner';
import LabelStation from './screens/LabelStation';
import LabelGeneratorAdmin from './screens/LabelGeneratorAdmin';
import { usePWAInstall } from './hooks/usePWAInstall';
import { useSystemHealth } from './hooks/useSystemHealth';

// Dynamic confetti loader - prevents mobile crashes on import
let confettiModule = null;
const getConfetti = async () => {
  if (!confettiModule) {
    try {
      const mod = await import('canvas-confetti');
      confettiModule = mod.default;
    } catch (e) {
      console.warn('Confetti library not available');
      confettiModule = () => {}; // no-op fallback
    }
  }
  return confettiModule;
};

import { collectibles } from '../../backend/shared/collectibles.js';

import { 
  AlertTriangle, CheckCircle, XCircle, Camera, ChevronRight, 
  ChevronLeft, LogOut, Settings, Activity, 
  Droplet, Search, Wrench, ShieldAlert,
  Info, List, Lock, PlayCircle, MapPin, Clock, FileText, CheckSquare, Smile, ThumbsUp, Plus, Mic, Wifi, WifiOff, MessageCircle, X, Send, Image as ImageIcon, Sparkles, Bell, BellOff, BellRing, Package, Coffee, Trophy, Gift,
  Users, Calendar, DollarSign, Power, Download, Video,
  Truck, Building2, BarChart3, RefreshCw, BookOpen, Target, Printer, Zap
} from 'lucide-react';

import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  onAuthStateChanged
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  onSnapshot
} from 'firebase/firestore';

import { QRCodeSVG } from 'qrcode.react';
import { api } from './utils/api';
import { safeStorage } from './utils/safeStorage';
import { offlineQueue, wizardProgress } from './utils/offlineQueue';
import { voiceInput } from './utils/voiceInput';
import { notificationService } from './utils/notifications';
import { useSwipeBack, usePullToRefresh, triggerHaptic, addSpinKeyframes } from './utils/mobileGestures';
import { getImageKitVideoCandidates, isImageKitConfigured, resolveVideoUrl } from './utils/imagekit';

const buildGamificationHeaders = (user, fallbackRole = 'technician') => {
  const userId = user?.id || user?.technician_id || user?.userId || user?.displayName || user?.driverId || 'tech-001';
  const role = (user?.role || user?.userRole || fallbackRole).toString().toLowerCase();
  return {
    'x-user-id': String(userId),
    'x-user-role': role
  };
};

// GEMINI API KEY (from environment)
let GEMINI_API_KEY = '';
let HAS_GEMINI_KEY = false;

try {
  GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
  HAS_GEMINI_KEY = !!GEMINI_API_KEY && GEMINI_API_KEY.length > 10;
} catch (e) {
  console.warn('Failed to load Gemini API key:', e);
  GEMINI_API_KEY = '';
  HAS_GEMINI_KEY = false;
}

// Intro Guide Component (3 simple steps)
const IntroGuide = ({ onComplete }) => {
  const [step, setStep] = useState(0);
  
  const steps = [
    {
      title: "Welcome!",
      description: "This app helps you take care of coffee machines step by step.",
      icon: "☕"
    },
    {
      title: "Two Types of Visits",
      description: "Weekly visits take about 20 minutes. Monthly deep cleans take about 90 minutes.",
      icon: "📋"
    },
    {
      title: "Performance Dividends",
      description: "Complete visits correctly to earn deterministic payouts and performance comp rewards!",
      icon: "💰"
    }
  ];
  
  const currentStep = steps[step];
  const isLastStep = step === steps.length - 1;
  
  return (
    <div className="fixed inset-0 bg-white/80 z-50 flex items-center justify-center p-4 backdrop-blur-xl">
      <div className="bg-white rounded-[2rem] max-w-sm w-full shadow-2xl border border-[#d2d2d7]">
        <div className="p-8 text-center">
          <div className="text-6xl mb-6">{currentStep.icon}</div>
          
          <h2 className="text-2xl font-bold text-[#1d1d1f] mb-3 tracking-tight">{currentStep.title}</h2>
          <p className="text-[#86868b] mb-8 text-[15px] leading-relaxed px-2">{currentStep.description}</p>
          
          <div className="flex justify-center gap-2 mb-6">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`h-2 rounded-full transition-all ${
                  i === step ? 'bg-blue-600 w-6' : 'bg-gray-300 w-2'
                }`}
              />
            ))}
          </div>
          
          <button
            onClick={isLastStep ? onComplete : () => setStep(step + 1)}
            className="w-full px-6 py-4 bg-[#0071e3] text-white font-bold rounded-2xl hover:bg-[#0077ed] transition-apple shadow-lg active:scale-[0.98]"
          >
            {isLastStep ? "Let's Go!" : 'Next'}
          </button>
          
          {step > 0 && (
            <button
              onClick={() => setStep(step - 1)}
              className="mt-4 text-sm font-semibold text-[#86868b] hover:text-[#1d1d1f] transition-colors"
            >
              Back
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Home Screen Reminder Component (Separate popup)
const HomeScreenReminder = ({ onDismiss }) => {
  const isIOS = typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent || '');
  
  return (
    <div className="fixed inset-0 bg-white/80 z-50 flex items-center justify-center p-4 backdrop-blur-xl">
      <div className="bg-white rounded-[2rem] max-w-md w-full shadow-2xl border border-[#d2d2d7]">
        <div className="p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-[#1d1d1f] tracking-tight">💡 Pro Tip</h2>
            <button onClick={onDismiss} className="text-[#86868b] hover:text-[#1d1d1f] transition-colors">
              <X size={28} />
            </button>
          </div>
          
          <p className="text-[#86868b] mb-8 text-[15px]">Save this app to your home screen for instant access anytime!</p>
          
          {isIOS ? (
            <div className="bg-[#f5f5f7] border border-[#d2d2d7] rounded-3xl p-6 mb-8">
              <p className="text-sm font-bold text-[#1d1d1f] mb-4 flex items-center gap-2">📱 iOS (Safari)</p>
              <ol className="text-sm text-[#86868b] space-y-3">
                <li className="flex items-start gap-2"><span>1.</span><span>Tap <strong>Share</strong> (arrow up icon)</span></li>
                <li className="flex items-start gap-2"><span>2.</span><span>Scroll down and tap <strong>Add to Home Screen</strong></span></li>
                <li className="flex items-start gap-2"><span>3.</span><span>Confirm and tap <strong>Add</strong></span></li>
              </ol>
            </div>
          ) : (
            <div className="bg-[#f5f5f7] border border-[#d2d2d7] rounded-3xl p-6 mb-8">
              <p className="text-sm font-bold text-[#1d1d1f] mb-4 flex items-center gap-2">🤖 Android (Chrome)</p>
              <ol className="text-sm text-[#86868b] space-y-3">
                <li className="flex items-start gap-2"><span>1.</span><span>Tap <strong>Menu</strong> (three dots icon)</span></li>
                <li className="flex items-start gap-2"><span>2.</span><span>Tap <strong>Install app</strong></span></li>
                <li className="flex items-start gap-2"><span>3.</span><span>Confirm installation</span></li>
              </ol>
            </div>
          )}
          
          <div className="flex gap-4">
            <button
              onClick={onDismiss}
              className="flex-1 px-6 py-4 bg-[#f5f5f7] text-[#1d1d1f] font-bold rounded-2xl hover:bg-[#e8e8ed] transition-apple active:scale-[0.98]"
            >
              Later
            </button>
            <button
              onClick={onDismiss}
              className="flex-1 px-6 py-4 bg-[#0071e3] text-white font-bold rounded-2xl hover:bg-[#0077ed] transition-apple shadow-lg active:scale-[0.98]"
            >
              Got It!
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Firebase Config (Optional - for future data persistence)
let auth = null;
let db = null;

try {
  if (import.meta.env.VITE_FIREBASE_API_KEY && import.meta.env.VITE_FIREBASE_API_KEY !== "demo") {
    const firebaseConfig = {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: "jolt-service-app.firebaseapp.com",
      projectId: "jolt-service-app",
      storageBucket: "jolt-service-app.appspot.com",
      messagingSenderId: "123456789",
      appId: "1:123456789:web:abcdef123456"
    };
    
    const app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
  } else {
  }
} catch (error) {
  console.error("[JOLT] 9d. Firebase initialization failed:", error);
}


// GEMINI SYSTEM PROMPT - Visual Recognition Training
const JOLT_SYSTEM_PROMPT = `
You are the expert AI Assistant for SIPJOLT Automated Barista technicians.

**SECURITY PROTOCOL (TOP PRIORITY):**
- **NEVER** mention factory model numbers, original equipment manufacturers (OEM), or sourcing information.
- Always refer to the machine ONLY as the "SIPJOLT Automated Barista".

**YOUR KNOWLEDGE BASE (VISUAL IDENTIFIERS):**
- **Power Switch:** Located on the INSIDE on the TOP LEFT, looks like a breaker switch.
- **Waste Buckets:** Two BEIGE rectangular buckets labeled "12L". (Not blue jugs).
- **Syrup Lines:** Maroon/Red colored plastic tubing with white tags.
- **Error Screen:** Errors appear as a bright RED/ORANGE banner across the center of the screen.
- **Canisters:** 7 Clear plastic vertical containers for powders.
- **Baffle/Gate:** A plastic slide tab located at the bottom of the Bean Hopper.
- **Splashguard:** A vertical plastic shield located directly behind the dispensing nozzles.
- **Grind Bin:** Black rectangular removable container under the Cup Holder.

**MAINTENANCE PROTOCOLS:**
- **Weekly:** Clean-While-Low Rule (if powder <50%, wash canister). Check grind bin. Pull Baffle OUT after bean refill.
- **Monthly:** Descaling with Citric Acid. Remove and wash brewer. Clean mixer system.

**TROUBLESHOOTING (ERROR CODES):**
- **Grinder Timeout:** Baffle closed? Beans stuck? -> Fix: Pull baffle, shake hopper.
- **Cup Drop Timeout:** Cups stuck? Sensor dirty? -> Fix: Rotate stack, wipe sensors.
- **No Water:** Tank empty? Wall valve closed? -> Fix: Check valve & refill beige buckets.
- **Door Blockage:** Trash blocking door? -> Fix: Clear obstruction.
- **Mouth Move Timeout:** Nozzle stuck with syrup? -> Fix: Wiggle nozzle gently.

**RESPONSE RULES:**
1. Keep it Short: Max 2-3 sentences per reply.
2. Ask Back: Always end with a clarifying question.
3. ELI5: Use "Trash" not "Refuse", "Dirty Water" not "Wastewater".
4. Visual Analysis: If user sends photo, identify parts using VISUAL IDENTIFIERS above.
`;


// --- 1. HELPER COMPONENTS (DEFINED FIRST) ---

// SwipeBackWrapper - enables swipe-from-left-edge to go back
const SwipeBackWrapper = ({ children, onBack, className = '' }) => {
  const containerRef = useRef(null);
  const startX = useRef(0);
  const startY = useRef(0);
  const currentX = useRef(0);
  const isTracking = useRef(false);
  const indicatorRef = useRef(null);
  
  useEffect(() => {
    const container = containerRef.current;
    if (!container || typeof window === 'undefined') return;
    
    const edgeWidth = 30;
    const threshold = 80;
    
    const handleTouchStart = (e) => {
      const touch = e.touches[0];
      if (touch.clientX <= edgeWidth) {
        startX.current = touch.clientX;
        startY.current = touch.clientY;
        currentX.current = touch.clientX;
        isTracking.current = true;
        if (indicatorRef.current) indicatorRef.current.style.opacity = '1';
      }
    };
    
    const handleTouchMove = (e) => {
      if (!isTracking.current) return;
      const touch = e.touches[0];
      currentX.current = touch.clientX;
      const deltaX = currentX.current - startX.current;
      const deltaY = Math.abs(touch.clientY - startY.current);
      
      if (deltaY > 60) {
        isTracking.current = false;
        if (indicatorRef.current) indicatorRef.current.style.opacity = '0';
        return;
      }
      
      if (deltaX > 0 && indicatorRef.current) {
        const progress = Math.min(deltaX / threshold, 1);
        indicatorRef.current.style.width = `${6 + progress * 30}px`;
        indicatorRef.current.style.background = progress >= 1 
          ? 'linear-gradient(to right, rgba(34, 197, 94, 0.8), transparent)'
          : 'linear-gradient(to right, rgba(59, 130, 246, 0.5), transparent)';
      }
    };
    
    const handleTouchEnd = () => {
      if (!isTracking.current) return;
      const deltaX = currentX.current - startX.current;
      
      if (deltaX >= threshold && onBack) {
        triggerHaptic('light');
        onBack();
      }
      
      isTracking.current = false;
      if (indicatorRef.current) {
        indicatorRef.current.style.opacity = '0';
        indicatorRef.current.style.width = '6px';
      }
    };
    
    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: true });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });
    
    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [onBack]);
  
  return (
    <div ref={containerRef} className={`min-h-screen w-full flex flex-col ${className}`}>
      <div 
        ref={indicatorRef}
        className="fixed left-0 top-1/2 -translate-y-1/2 w-1.5 h-16 rounded-r-full opacity-0 z-50 pointer-events-none transition-opacity"
        style={{ background: 'linear-gradient(to right, rgba(59, 130, 246, 0.5), transparent)' }}
      />
      {children}
    </div>
  );
};

// PullToRefreshWrapper - pull down at top of page to refresh
const PullToRefreshWrapper = ({ children, onRefresh, className = '' }) => {
  const containerRef = useRef(null);
  const indicatorRef = useRef(null);
  const startY = useRef(0);
  const isPulling = useRef(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  useEffect(() => {
    const container = containerRef.current;
    if (!container || typeof window === 'undefined') return;
    
    // Detect if this is a mobile device to prevent accidental refreshes on desktop
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (!isMobile) return;

    const threshold = 80;
    const resistance = 2.5;
    
    const handleTouchStart = (e) => {
      const scrollTop = container.scrollTop || 0;
      if (scrollTop <= 0) {
        startY.current = e.touches[0].clientY;
        isPulling.current = false;
      }
    };
    
    const handleTouchMove = (e) => {
      const scrollTop = container.scrollTop || 0;
      if (scrollTop > 0 || isRefreshing) return;
      
      const currentY = e.touches[0].clientY;
      const deltaY = (currentY - startY.current) / resistance;
      
      if (deltaY > 0) {
        isPulling.current = true;
        if (indicatorRef.current) {
          indicatorRef.current.style.transform = `translateY(${Math.min(deltaY, threshold + 20)}px)`;
          indicatorRef.current.style.opacity = Math.min(deltaY / threshold, 1);
        }
      }
    };
    
    const handleTouchEnd = async () => {
      if (!isPulling.current || isRefreshing) return;
      const scrollTop = container.scrollTop || 0;
      if (scrollTop > 0) return;
      
      if (indicatorRef.current) {
        const currentTransform = indicatorRef.current.style.transform;
        const match = currentTransform.match(/translateY\(([0-9.]+)px\)/);
        const currentY = match ? parseFloat(match[1]) : 0;
        
        if (currentY >= threshold && onRefresh) {
          setIsRefreshing(true);
          triggerHaptic('medium');
          await onRefresh();
          setIsRefreshing(false);
        }
        
        indicatorRef.current.style.transform = 'translateY(0)';
        indicatorRef.current.style.opacity = '0';
      }
      isPulling.current = false;
    };
    
    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: true });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });
    
    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [onRefresh, isRefreshing]);
  
  return (
    <div ref={containerRef} className={`min-h-screen w-full flex flex-col ${className}`}>
      <div 
        ref={indicatorRef}
        className="fixed top-0 left-1/2 -translate-x-1/2 -translate-y-12 flex items-center gap-2 bg-white border border-[#d2d2d7] px-4 py-2 rounded-full shadow-2xl z-50 opacity-0 transition-opacity"
      >
        <div className={`w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full ${isRefreshing ? 'animate-spin' : ''}`} />
        <span className="text-xs font-semibold uppercase tracking-wider text-blue-600">{isRefreshing ? 'Syncing...' : 'Pull to Sync'}</span>
      </div>
      {children}
    </div>
  );
};

// Skeleton loading components for faster perceived load
const SkeletonCard = ({ className = '' }) => (
  <div className={`skeleton bg-white border border-[#d2d2d7] ${className} rounded-3xl`} />
);

const SkeletonText = ({ width = '100%', className = '' }) => (
  <div className={`skeleton bg-gray-100 h-4 mb-2 ${className} rounded-full`} style={{ width }} />
);

const Card = ({ children, className = '', onClick = null }) => (
  <div onClick={onClick} className={`bg-white border border-[#d2d2d7] rounded-3xl shadow-sm transition-all duration-200 ${onClick ? 'cursor-pointer active:scale-[0.99] hover:shadow-md' : ''} ${className}`}>
    {children}
  </div>
);

const Button = ({ children, onClick, variant = 'primary', className = '', disabled = false, completed = false }) => {
  const handleClick = (e) => {
    if (disabled) return;
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(5);
    }
    if (onClick) onClick(e);
  };
  
  const base = "px-5 py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 active:scale-[0.98]";
  
  const styles = {
    primary: completed 
      ? "bg-green-100 text-green-700 border border-green-200" 
      : "bg-blue-600 hover:bg-blue-700 text-white shadow-sm",
    secondary: completed 
      ? "bg-green-50 text-green-700 border border-green-100" 
      : "bg-white text-[#1d1d1f] hover:bg-gray-50 border border-[#d2d2d7] shadow-sm",
    danger: "bg-red-50 text-red-700 border border-red-100 hover:bg-red-100",
    success: "bg-green-600 text-white shadow-sm hover:bg-green-700",
  };
  
  return (
    <button 
      onClick={handleClick} 
      disabled={disabled} 
      className={`${base} ${styles[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

const StatusBadge = ({ status }) => {
  const styles = {
    active: "bg-green-100 text-green-800",
    service_due: "bg-yellow-100 text-yellow-800",
    repair: "bg-red-100 text-red-800",
    offline: "bg-gray-100 text-gray-800"
  };
  const safeStatus = (typeof status === 'string') ? status : 'offline';
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${styles[safeStatus] || styles.offline}`}>
      {safeStatus.replace('_', ' ')}
    </span>
  );
};

const VoiceInputButton = ({ onTranscript, disabled = false }) => {
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState('');
  const recognitionRef = useRef(null);

  const toggleListening = () => {
    if (!voiceInput.isSupported()) {
      alert('Voice input is not supported on this device. Try Chrome on Android or Safari on iOS.');
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(10);
    setIsListening(true);
    setInterimText('');

    recognitionRef.current = voiceInput.start(
      (finalText, interim) => {
        setInterimText(interim);
        if (finalText) onTranscript?.(finalText);
      },
      (error) => {
        setIsListening(false);
        setInterimText('');
        alert(error);
      },
      (finalText) => {
        setIsListening(false);
        setInterimText('');
        if (finalText) onTranscript?.(finalText);
      }
    );
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={toggleListening}
        disabled={disabled}
        className={`p-2.5 rounded-xl transition-all duration-200 ${
          isListening 
            ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-200' 
            : 'bg-blue-100 text-blue-600 hover:bg-blue-200 active:bg-blue-300'
        } disabled:opacity-50`}
        title={isListening ? 'Stop recording' : 'Tap to speak'}
      >
        <Mic size={20} />
      </button>
      {isListening && interimText && (
        <div className="absolute left-12 top-0 bg-gray-900 text-white text-xs px-3 py-1.5 rounded-lg shadow-lg max-w-48 truncate">
          {interimText}...
        </div>
      )}
    </div>
  );
};


// --- 1B. GAMIFICATION COMPONENTS ---

const Confetti = ({ trigger }) => {
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    if (trigger) {
      playWhooshSound();
      const newParticles = Array.from({ length: 30 }).map((_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 0.3
      }));
      setParticles(newParticles);
      const timer = setTimeout(() => setParticles([]), 2000);
      return () => clearTimeout(timer);
    }
  }, [trigger]);

  const playWhooshSound = () => {
    try {
      const AudioCtx = typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext);
      if (!AudioCtx) return;
      const audioContext = new AudioCtx();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(100, audioContext.currentTime + 0.2);
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.2);
    } catch (e) {
      // Audio not supported, silently fail
    }
  };

  return (
    <>
      {particles.map(c => (
        <div
          key={c.id}
          className="fixed pointer-events-none animate-pulse"
          style={{
            left: `${c.left}%`,
            top: '-20px',
            animation: `fall 2s ease-in forwards`,
            animationDelay: `${c.delay}s`
          }}
        >
          ✨
        </div>
      ))}
      <style>{`
        @keyframes fall {
          to {
            transform: translateY(100vh) rotate(360deg);
            opacity: 0;
          }
        }
      `}</style>
    </>
  );
};

// Machine Health Status - Simple Traffic Light Display
const MachineHealthStatus = ({ machineId, completionPercentage = 75, hasError = false, lowSupplies = false, lastVisitDays = 3 }) => {
  const [showErrors, setShowErrors] = React.useState(false);

  // Determine status and color
  let status = 'GREEN';
  let statusColor = 'bg-green-50 border-green-200';
  let statusDot = '🟢';
  let statusText = 'Running Normally';
  let statusDetail = "Machine is healthy. No action needed.";
  let actionText = "You're all set.";
  let dotColor = 'bg-green-500';

  if (hasError) {
    status = 'RED';
    statusColor = 'bg-red-50 border-red-200';
    statusDot = '🔴';
    statusText = 'Service Required Now';
    statusDetail = "Machine cannot serve drinks. Needs immediate service.";
    actionText = "Restart → If still red, open Error Guide.";
    dotColor = 'bg-red-500';
  } else if (lowSupplies || completionPercentage < 50) {
    status = 'YELLOW';
    statusColor = 'bg-yellow-50 border-yellow-200';
    statusDot = '🟡';
    statusText = 'Needs Attention Soon';
    statusDetail = "Machine can serve but something is low or trending off.";
    actionText = "Check powders, syrups, cups.";
    dotColor = 'bg-yellow-500';
  } else if (lastVisitDays > 7) {
    status = 'YELLOW';
    statusColor = 'bg-yellow-50 border-yellow-200';
    statusDot = '🟡';
    statusText = 'Needs Attention Soon';
    statusDetail = "Machine can serve but needs maintenance soon.";
    actionText = "Schedule a visit soon.";
    dotColor = 'bg-yellow-500';
  }

  // Common machine errors
  const commonErrors = [
    { error: "Grinder Jammed", solution: "Open door → Clear beans → Close → Restart" },
    { error: "No Cups", solution: "Refill cups → Press Resume" },
    { error: "Mix Bowl Blocked", solution: "Wipe bowl area → Run quick clean" },
    { error: "Water Leak", solution: "Turn off machine → Check connections → Dry area → Restart" },
    { error: "No Powder", solution: "Refill powder canister → Close → Restart" },
    { error: "Error Code E-01", solution: "Check manual in app → Restart → Contact supervisor if persists" }
  ];

  return (
    <div className={`border rounded-2xl p-4 md:p-6 transition-all ${statusColor}`}>
      {/* Header with Status */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">{statusDot}</span>
            <h3 className="font-bold text-base md:text-lg text-gray-900">{statusText}</h3>
          </div>
          <p className="text-sm text-gray-700 mb-1">{statusDetail}</p>
          <p className="text-xs text-gray-600 font-medium">→ {actionText}</p>
        </div>
      </div>

      {/* Health Percentage */}
      <div className="mb-4 pb-4 border-t border-gray-300">
        <div className="flex items-center justify-between mt-4">
          <span className="text-sm font-semibold text-gray-700">Health Status</span>
          <span className="text-lg font-bold text-gray-900">{completionPercentage}%</span>
        </div>
        <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all ${
              completionPercentage >= 70 ? 'bg-green-500' :
              completionPercentage >= 40 ? 'bg-yellow-500' :
              'bg-red-500'
            }`}
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
        <p className="text-xs text-gray-600 mt-1">
          {completionPercentage >= 70 ? "Running perfectly." :
           completionPercentage >= 40 ? "Check supplies soon." :
           "Machine stopped."}
        </p>
      </div>

      {/* Error Helper - Collapsible */}
      <div className="border-t border-gray-300 pt-4">
        <button
          onClick={() => setShowErrors(!showErrors)}
          className="w-full flex items-center justify-between p-3 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
        >
          <span className="text-sm font-semibold text-gray-800">📖 Error Helper (Common Fixes)</span>
          <span className="text-lg">{showErrors ? '▼' : '▶'}</span>
        </button>
        
        {showErrors && (
          <div className="mt-3 space-y-2 bg-gray-50 p-3 rounded-lg">
            {commonErrors.map((item, idx) => (
              <div key={idx} className="text-xs">
                <p className="font-semibold text-gray-800">🔧 {item.error}</p>
                <p className="text-gray-700 ml-4 mt-1">→ {item.solution}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const StreakTracker = ({ streakWeeks = 2, maxStreak = 4 }) => {
  let fireOpacity = 'opacity-50';
  let badgeEarned = null;
  let progressColor = 'bg-slate-600';

  if (streakWeeks >= 4) {
    fireOpacity = 'opacity-100';
    badgeEarned = '🔧 Golden Wrench';
    progressColor = 'bg-yellow-600';
  } else if (streakWeeks >= 3) {
    fireOpacity = 'opacity-80';
    progressColor = 'bg-slate-600';
  } else if (streakWeeks >= 1) {
    fireOpacity = 'opacity-60';
    progressColor = 'bg-slate-500';
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-3">
      <div className="flex items-center justify-between mb-1.5">
        <h3 className="font-semibold text-gray-900 text-xs md:text-sm">Perfect Visit Streak</h3>
        <div className={`text-lg ${fireOpacity}`}>🔥</div>
      </div>
      <div className="flex items-baseline gap-1.5 mb-2">
        <span className="text-xl font-semibold text-gray-900">{streakWeeks}</span>
        <span className="text-xs text-gray-500 font-light">weeks in a row</span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-1.5">
        <div 
          className={`h-1.5 rounded-full transition-all ${progressColor}`}
          style={{ width: `${(streakWeeks / maxStreak) * 100}%` }}
        />
      </div>
      {badgeEarned && (
        <div className="mt-1.5 px-2 py-1 bg-gray-50 border border-gray-200 rounded-lg text-center">
          <p className="text-xs font-medium text-gray-700">{badgeEarned} Unlocked</p>
        </div>
      )}
    </div>
  );
};

const HistoryAtGlance = ({ lastVisitNotes = [] }) => {
  if (lastVisitNotes.length === 0) return null;
  
  return (
    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-2.5 md:p-3 rounded-lg mb-2 md:mb-3">
      <div className="flex items-start gap-2">
        <AlertTriangle className="text-yellow-600 mt-0.5 flex-shrink-0" size={16} />
        <div className="flex-1">
          <h3 className="font-bold text-gray-800 mb-1 text-xs md:text-sm">Last Week's Summary</h3>
          <div className="space-y-0.5">
            {lastVisitNotes.map((note, idx) => (
              <p key={idx} className="text-xs text-gray-700">
                {note.icon} {note.text}
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// --- 1A. TOAST NOTIFICATION COMPONENT ---

const ToastNotification = ({ notification, onClose }) => {
  const styles = {
    error: { bg: 'bg-red-500', icon: '🚨' },
    success: { bg: 'bg-green-500', icon: '✅' },
    warning: { bg: 'bg-yellow-500', icon: '⚠️' },
    info: { bg: 'bg-blue-500', icon: 'ℹ️' }
  };

  const style = styles[notification.type] || styles.info;

  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`${style.bg} text-white p-4 rounded-lg shadow-lg animate-in slide-in-from-top-2 flex items-center gap-3 min-w-80`}>
      <span className="text-xl">{style.icon}</span>
      <div className="flex-1">
        <p className="font-bold text-sm">{notification.title}</p>
        <p className="text-xs opacity-90">{notification.message}</p>
      </div>
      <button onClick={onClose} className="text-white hover:opacity-75">
        <X size={16} />
      </button>
    </div>
  );
};

// --- 2. PUSH NOTIFICATION SYSTEM ---

const NotificationManager = ({ onClose }) => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [permission, setPermission] = useState('default');
  const [settings, setSettings] = useState({
    machineErrors: true,
    supplyAlerts: true,
    maintenanceReminders: true,
    scheduledVisits: true
  });
  const [recentNotifications, setRecentNotifications] = useState([]);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(window.Notification.permission);
      setNotificationsEnabled(window.Notification.permission === 'granted');
    }
  }, []); // Empty deps array - safe initialization only

  const requestPermission = async () => {
    if (!('Notification' in window)) {
      alert('This browser does not support notifications');
      return;
    }

    try {
      const result = await window.Notification.requestPermission();
      setPermission(result);
      setNotificationsEnabled(result === 'granted');
      
      if (result === 'granted') {
        sendTestNotification();
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
    }
  };

  const sendTestNotification = () => {
    if (typeof window !== 'undefined' && 'Notification' in window && window.Notification.permission === 'granted') {
      const notification = new window.Notification('JOLT Service Alert', {
        body: 'Notifications enabled! You\'ll receive important alerts about your machines.',
        icon: '🔔',
        badge: '🔔',
        tag: 'test-notification',
        requireInteraction: false
      });

      notification.onclick = () => {
        try {
          window.focus();
          notification.close();
        } catch (e) {
          // Ignore focus errors on mobile
        }
      };

      addToRecent('Test Notification', 'Notifications successfully enabled');
    }
  };

  const addToRecent = (title, body) => {
    const newNotification = {
      id: Date.now(),
      title,
      body,
      timestamp: new Date().toLocaleTimeString()
    };
    setRecentNotifications(prev => [newNotification, ...prev].slice(0, 5));
  };

  const simulateAlert = (type) => {
    if (typeof window === 'undefined' || !('Notification' in window) || window.Notification.permission !== 'granted') {
      alert('Please enable notifications first');
      return;
    }

    const alerts = {
      error: {
        title: '🚨 Machine Error - Grinder Timeout',
        body: 'Machine #42 at Main St location needs immediate attention',
        tag: 'machine-error'
      },
      supply: {
        title: '📦 Low Supplies Alert',
        body: 'Oat Milk and Brown Sugar Syrup running low at Downtown location',
        tag: 'supply-alert'
      },
      maintenance: {
        title: '🔧 Maintenance Due',
        body: 'Monthly deep clean scheduled for Machine #15 tomorrow at 9 AM',
        tag: 'maintenance-reminder'
      },
      visit: {
        title: '📅 Visit Reminder',
        body: 'You have 3 scheduled visits today. Next: Airport location in 45 mins',
        tag: 'visit-reminder'
      }
    };

    const alert = alerts[type];
    if (alert) {
      const notification = new window.Notification(alert.title, {
        body: alert.body,
        tag: alert.tag,
        requireInteraction: true,
        icon: '🔔'
      });

      notification.onclick = () => {
        try {
          window.focus();
          notification.close();
        } catch (e) {
          // Ignore focus errors on mobile
        }
      };

      addToRecent(alert.title, alert.body);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-slate-700 text-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {notificationsEnabled ? <BellRing size={28} /> : <BellOff size={28} />}
            <div>
              <h1 className="text-2xl font-semibold">Notification Settings</h1>
              <p className="text-gray-200 text-sm font-light">Manage alerts and updates</p>
            </div>
          </div>
          <button 
            onClick={() => {
              if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(10);
              onClose();
            }} 
            className="text-white hover:bg-white/10 p-2 rounded-lg active:scale-90 transition-all"
          >
            <X size={24} />
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-6 space-y-6">
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Bell size={20} className="text-blue-600" />
            Enable Notifications
          </h2>
          
          {permission === 'denied' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-3">
                <AlertTriangle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-red-800 mb-1">Notifications Blocked</p>
                  <p className="text-sm text-red-700">
                    Please enable notifications in your browser settings to receive important alerts.
                  </p>
                </div>
              </div>
            </div>
          )}

          {permission === 'granted' ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <CheckCircle size={24} className="text-green-600" />
                <div>
                  <p className="font-bold text-green-800">Notifications Enabled</p>
                  <p className="text-sm text-gray-600">You'll receive alerts for important updates</p>
                </div>
              </div>
            </div>
          ) : (
            <Button onClick={requestPermission} variant="primary" className="w-full">
              <Bell size={18} />
              Enable Push Notifications
            </Button>
          )}
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">Notification Types</h2>
          <div className="space-y-4">
            {[
              { key: 'machineErrors', label: 'Machine Errors', desc: 'Get notified when machines need immediate attention', icon: AlertTriangle, bgClass: 'bg-red-100', textClass: 'text-red-600' },
              { key: 'supplyAlerts', label: 'Supply Alerts', desc: 'Alerts when supplies are running low', icon: Droplet, bgClass: 'bg-blue-100', textClass: 'text-blue-600' },
              { key: 'maintenanceReminders', label: 'Maintenance Reminders', desc: 'Scheduled maintenance and service due dates', icon: Wrench, bgClass: 'bg-slate-100', textClass: 'text-slate-700' },
              { key: 'scheduledVisits', label: 'Visit Reminders', desc: 'Upcoming scheduled visits and appointments', icon: Clock, bgClass: 'bg-green-100', textClass: 'text-green-600' }
            ].map(({ key, label, desc, icon: Icon, bgClass, textClass }) => (
              <div key={key} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-start gap-3 flex-1">
                  <div className={`${bgClass} ${textClass} p-2 rounded-lg`}>
                    <Icon size={20} />
                  </div>
                  <div>
                    <p className="font-bold">{label}</p>
                    <p className="text-sm text-gray-600">{desc}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(10);
                    setSettings({...settings, [key]: !settings[key]});
                  }}
                  className={`ml-4 w-12 h-6 rounded-full transition-all active:scale-95 ${
                    settings[key] ? 'bg-slate-600' : 'bg-gray-300'
                  }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                    settings[key] ? 'translate-x-6' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>
            ))}
          </div>
        </Card>

        {notificationsEnabled && (
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">Test Notifications</h2>
            <p className="text-sm text-gray-600 mb-4">
              Try out different notification types to see how they look
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Button onClick={() => simulateAlert('error')} variant="danger">
                <AlertTriangle size={18} />
                Test Error Alert
              </Button>
              <Button onClick={() => simulateAlert('supply')} variant="secondary">
                <Droplet size={18} />
                Test Supply Alert
              </Button>
              <Button onClick={() => simulateAlert('maintenance')} variant="secondary">
                <Wrench size={18} />
                Test Maintenance
              </Button>
              <Button onClick={() => simulateAlert('visit')} variant="secondary">
                <Clock size={18} />
                Test Visit Reminder
              </Button>
            </div>
          </Card>
        )}

        {recentNotifications.length > 0 && (
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">Recent Notifications</h2>
            <div className="space-y-3">
              {recentNotifications.map(notif => (
                <div key={notif.id} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-bold text-sm">{notif.title}</p>
                      <p className="text-xs text-gray-600 mt-1">{notif.body}</p>
                    </div>
                    <span className="text-xs text-gray-500 ml-2">{notif.timestamp}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

// --- ERROR BOUNDARY ---

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error Boundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-lg">
            <h1 className="text-2xl font-bold text-red-600 mb-4">⚠️ Something went wrong</h1>
            <p className="text-gray-600 mb-6">The app encountered an error. Please refresh the page and try again.</p>
            <button 
              onClick={() => window.location.reload()}
              className="w-full px-4 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700"
            >
              Reload App
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// --- 3. GEMINI AI CHATBOT COMPONENT ---

const GeminiAssistant = ({ isOpen = false, onClose = () => {} }) => {
  const [messages, setMessages] = useState(() => {
    const defaultMessage = [
      { role: 'model', text: "Hi! 👋 I'm the Jolt AI. I can see what your machine looks like. Send me a photo or ask for help!" }
    ];
    return safeStorage.getJSON('aiConversationHistory', defaultMessage);
  });
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [attachedImage, setAttachedImage] = useState(null);
  const [issueHistory, setIssueHistory] = useState(() => {
    return safeStorage.getJSON('machineIssueHistory', []);
  });
  const [solutionLibrary, setSolutionLibrary] = useState(() => {
    return safeStorage.getJSON('solutionLibrary', []);
  });
  const messagesEndRef = useRef(null);
  const [showFollowUp, setShowFollowUp] = useState(false);
  const [lastIssue, setLastIssue] = useState(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  // Save conversation history
  useEffect(() => {
    safeStorage.setJSON('aiConversationHistory', messages);
  }, [messages]);

  // Detect recurring issues from conversation
  const detectIssuePattern = (userMessage) => {
    const issueKeywords = {
      'grinder': ['grinder', 'grinding', 'jam', 'jammed', 'stuck', 'beans'],
      'leak': ['leak', 'leaking', 'water', 'wet', 'drip'],
      'cup': ['cup', 'cups', 'drop', 'dispense'],
      'syrup': ['syrup', 'flavor', 'sticky'],
      'error': ['error', 'code', 'red', 'screen']
    };

    for (const [issueType, keywords] of Object.entries(issueKeywords)) {
      if (keywords.some(keyword => userMessage.toLowerCase().includes(keyword))) {
        return issueType;
      }
    }
    return null;
  };

  // Check for recurring patterns
  const checkRecurringIssue = (issueType) => {
    const recentIssues = issueHistory.filter(issue => 
      issue.type === issueType && 
      (Date.now() - new Date(issue.timestamp).getTime()) < 30 * 24 * 60 * 60 * 1000 // Last 30 days
    );
    return recentIssues.length;
  };

  // Find similar past solutions
  const findSimilarSolution = (issueType) => {
    return solutionLibrary.find(solution => solution.issueType === issueType);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result.split(',')[1]; 
        const mimeType = file.type;
        setAttachedImage({ data: base64String, mimeType: mimeType, preview: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() && !attachedImage) return;

    const userMsg = { role: 'user', text: input, image: attachedImage?.preview };
    setMessages(prev => [...prev, userMsg]);
    const userInput = input;
    setInput("");
    const currentImage = attachedImage;
    setAttachedImage(null);
    setIsLoading(true);

    try {
      // Detect issue pattern
      const issueType = detectIssuePattern(userInput);
      let enhancedPrompt = userInput || "What do you see in this image?";
      
      // Check for recurring issues and add context
      if (issueType) {
        const occurrenceCount = checkRecurringIssue(issueType);
        const similarSolution = findSimilarSolution(issueType);
        
        if (occurrenceCount > 0) {
          enhancedPrompt += `\n\n[SYSTEM CONTEXT: This ${issueType} issue has occurred ${occurrenceCount} time(s) in the last 30 days. Consider mentioning this pattern to the user.]`;
        }
        
        if (similarSolution) {
          enhancedPrompt += `\n\n[PAST SOLUTION: Similar issue was resolved with: "${similarSolution.solution}". Reference this if relevant.]`;
        }
        
        // Track this issue
        const newIssue = {
          type: issueType,
          timestamp: new Date().toISOString(),
          description: userInput,
          imageIncluded: !!currentImage
        };
        const updatedHistory = [...issueHistory, newIssue];
        setIssueHistory(updatedHistory);
        safeStorage.setJSON('machineIssueHistory', updatedHistory);
        setLastIssue(newIssue);
      }

      // Store image with issue if applicable
      if (issueType && currentImage) {
        const imageData = {
          issueType,
          timestamp: new Date().toISOString(),
          imagePreview: currentImage.preview,
          description: userInput
        };
        const savedImages = safeStorage.getJSON('issueImages', []);
        savedImages.push(imageData);
        safeStorage.setJSON('issueImages', savedImages.slice(-20)); // Keep last 20
      }

      if (!HAS_GEMINI_KEY) {
        // Don't crash - just disable AI feature
        console.warn('AI service not configured - feature will be disabled');
        return;
      }

      let response;
      try {
        response = await fetch('/api/ai/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: enhancedPrompt,
            image: currentImage ? {
              mimeType: currentImage.mimeType,
              data: currentImage.data
            } : null,
            systemPrompt: JOLT_SYSTEM_PROMPT
          })
        });
      } catch (fetchError) {
        console.error('Network error:', fetchError);
        setMessages(prev => [...prev, { role: 'model', text: 'Network error - please check your connection.' }]);
        setIsLoading(false);
        return;
      }

      if (!response.ok) {
        throw new Error(`API returned ${response.status}`);
      }

      const data = await response.json();
      const aiText = data.text || "I'm having trouble connecting. Please try again.";
      
      setMessages(prev => [...prev, { role: 'model', text: aiText }]);
      
      // Show follow-up if this looks like a solution
      if (issueType && (aiText.toLowerCase().includes('try') || aiText.toLowerCase().includes('fix') || aiText.toLowerCase().includes('check'))) {
        setTimeout(() => setShowFollowUp(true), 3000);
      }

    } catch (error) {
      console.error("Gemini Error:", error);
      const errorMsg = error.message || "Network error. Please check your connection.";
      setMessages(prev => [...prev, { role: 'model', text: `⚠️ ${errorMsg}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle follow-up response
  const handleFollowUpResponse = (response) => {
    setShowFollowUp(false);
    if (response && lastIssue) {
      const newSolution = {
        issueType: lastIssue.type,
        solution: response,
        timestamp: new Date().toISOString()
      };
      const updatedLibrary = [...solutionLibrary, newSolution];
      setSolutionLibrary(updatedLibrary);
      safeStorage.setJSON('solutionLibrary', updatedLibrary);
      
      setMessages(prev => [...prev, 
        { role: 'user', text: `What fixed it: ${response}` },
        { role: 'model', text: "Thanks! I've saved this solution. I'll remember it for next time! 📝✨" }
      ]);
    }
    setLastIssue(null);
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
    <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 bg-white rounded-3xl shadow-2xl border border-gray-200 z-50 overflow-hidden flex flex-col max-h-[80vh] animate-fade-in" onClick={(e) => e.stopPropagation()}>
      <div className="bg-gradient-to-r from-slate-600 to-slate-700 p-4 flex justify-between items-center text-white flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="bg-white/10 p-2 rounded-xl backdrop-blur-sm"><Sparkles size={16} /></div>
          <div className="flex flex-col">
             <span className="font-semibold text-sm leading-tight">Jolt AI</span>
             <span className="text-[11px] opacity-75 font-light">Visual Assistant</span>
          </div>
        </div>
        <button 
          onClick={() => {
            if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(10);
            onClose();
          }}
          className="hover:bg-white/10 rounded-full p-1.5 transition-all active:scale-90"
        >
          <X size={18}/>
        </button>
      </div>

      <div className="flex-1 bg-gray-50/50 p-4 overflow-y-auto flex flex-col gap-3 min-h-[300px]">
          {messages.map((msg, idx) => (
              <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  {msg.image && (
                      <img src={msg.image} alt="Upload" className="w-32 h-32 object-cover rounded-xl mb-2 border border-gray-200 shadow-sm" />
                  )}
                  <div className={`max-w-[85%] px-4 py-2.5 text-sm ${
                    msg.role === 'user' 
                      ? 'bg-slate-600 text-white rounded-2xl rounded-tr-md shadow-sm' 
                      : 'bg-white text-gray-700 border border-gray-200 rounded-2xl rounded-tl-md shadow-sm'
                  }`}>
                      {msg.text}
                  </div>
              </div>
          ))}
          {isLoading && (
              <div className="flex items-center gap-2.5 text-gray-500 text-xs ml-2">
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.15s'}}></div>
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.3s'}}></div>
                  </div>
                  <span className="font-light">Thinking</span>
              </div>
          )}
          {showFollowUp && (
            <div className="bg-green-50 border border-green-200 rounded-2xl p-4 animate-in fade-in shadow-sm">
              <p className="text-sm font-semibold text-green-900 mb-1.5">Did that fix it?</p>
              <p className="text-xs text-green-700 mb-3 font-light">Help me learn what solved the problem</p>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(10);
                    const solution = prompt("What fixed it? (e.g., 'Pulled baffle tab out', 'Cleaned sensor', etc.)");
                    if (solution) handleFollowUpResponse(solution);
                  }}
                  className="flex-1 bg-green-600 text-white text-xs py-2.5 px-4 rounded-xl hover:bg-green-700 active:scale-95 transition-all font-medium"
                >
                  Yes, tell you how
                </button>
                <button
                  onClick={() => {
                    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(10);
                    setShowFollowUp(false);
                  }}
                  className="px-3 text-xs text-gray-500 hover:text-gray-700 active:scale-95 transition-all font-light"
                >
                  Not yet
                </button>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-white border-t border-gray-200 flex-shrink-0 space-y-2.5">
        {attachedImage && (
            <div className="flex items-center gap-2.5 bg-gray-50 p-2.5 rounded-xl border border-gray-200">
                <img src={attachedImage.preview} alt="Preview" className="w-10 h-10 rounded-lg object-cover" />
                <span className="text-xs text-gray-600 flex-1 truncate font-light">Image attached</span>
                <button 
                  onClick={() => {
                    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(10);
                    setAttachedImage(null);
                  }}
                  className="hover:bg-gray-200 rounded-full p-1 active:scale-90 transition-all"
                >
                  <X size={14} className="text-gray-500"/>
                </button>
            </div>
        )}
        <div className="flex items-center gap-2.5">
            <label className="cursor-pointer p-2 text-gray-500 hover:text-slate-600 hover:bg-gray-100 rounded-full transition-all active:scale-90 flex-shrink-0">
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                <ImageIcon size={20} />
            </label>
            <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Ask a question..." 
                className="flex-1 bg-gray-50 border border-gray-200 rounded-full px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent text-gray-700 transition-all placeholder:text-gray-400"
            />
            <button 
                onClick={() => {
                  if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(10);
                  sendMessage();
                }}
                disabled={isLoading || (!input.trim() && !attachedImage)}
                className="p-2.5 bg-slate-600 text-white rounded-full hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed active:scale-90 transition-all flex-shrink-0"
                title="Send message"
            >
                <Send size={18} />
            </button>
        </div>
      </div>
    </div>
    </div>
  );
};

// --- 3. MOCK PHOTO UPLOAD WITH GPS/TIME ---

const MockPhotoUpload = ({ onUpload, label, hasPhoto, required = true }) => {
  const [uploading, setUploading] = useState(false);
  const [photos, setPhotos] = useState([]);
  const fileInputRef = useRef(null);

  const handleSimulateUpload = (file) => {
    setUploading(true);
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setTimeout(() => {
        const now = new Date();
        const mockPhoto = {
          url: reader.result,
          timestamp: now.toLocaleString(),
          gps: `${(37.7749 + Math.random() * 0.1).toFixed(6)}, ${(-122.4194 + Math.random() * 0.1).toFixed(6)}`,
          verified: true
        };
        const newPhotos = [...photos, mockPhoto];
        setPhotos(newPhotos);
        onUpload(newPhotos);
        setUploading(false);
      }, 1200);
    };
    reader.readAsDataURL(file);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleSimulateUpload(file);
    }
  };

  return (
    <div className="mt-3 md:mt-4 w-full">
      {photos.length > 0 && (
         <div className="mb-2 md:mb-3 flex flex-col gap-2">
            {photos.map((photo, idx) => (
              <div key={idx} className="flex items-start gap-2 md:gap-3 text-green-600 bg-green-50 p-2 md:p-3 rounded-lg text-xs border border-green-200">
                <img src={photo.url} alt={`Photo ${idx + 1}`} className="w-12 h-12 md:w-16 md:h-16 object-cover rounded" />
                <div className="flex-1">
                  <div className="flex items-center gap-1.5 md:gap-2 mb-0.5 md:mb-1">
                    <CheckCircle size={12} className="md:hidden" />
                    <CheckCircle size={14} className="hidden md:block" />
                    <span className="font-bold text-xs md:text-sm">Photo {idx + 1} Verified</span>
                  </div>
                  <div className="flex items-center gap-1 text-gray-600 text-xs">
                    <Clock size={10} className="md:hidden" />
                    <Clock size={12} className="hidden md:block" />
                    <span>{photo.timestamp}</span>
                  </div>
                  <div className="flex items-center gap-1 text-gray-600 text-xs">
                    <MapPin size={10} className="md:hidden" />
                    <MapPin size={12} className="hidden md:block" />
                    <span className="truncate">{photo.gps}</span>
                  </div>
                </div>
              </div>
            ))}
         </div>
      )}
      
      <input 
        type="file" 
        accept="image/*" 
        capture="environment"
        ref={fileInputRef}
        onChange={handleFileSelect}
        className="hidden"
      />
      
      <Button 
        onClick={() => fileInputRef.current?.click()}
        variant="secondary"
        disabled={uploading}
        className="w-full"
      >
        {uploading ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-400 border-t-transparent"></div>
            Uploading & Verifying...
          </>
        ) : (
          <>
            <Camera size={18} />
            {photos.length > 0 ? '+ Add Another Photo' : `Upload Photo`}
          </>
        )}
      </Button>
    </div>
  );
};

// --- 4. WATCH VIDEO BUTTON ---

const USE_IMAGEKIT_VIDEOS = true;
const toVideoSlug = (value) => {
  if (!value) return null;
  return value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
};

const getImageKitCandidates = ({ stepId, videoSlug, videoTitle }) => {
  const slug = videoSlug || toVideoSlug(videoTitle) || toVideoSlug(stepId);
  return slug ? getImageKitVideoCandidates(slug) : [];
};

const WatchVideoButton = ({ videoTitle, stepId, videoSlug }) => {
  const [showPlayer, setShowPlayer] = useState(false);
  const [videoData, setVideoData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [noVideo, setNoVideo] = useState(false);

  const handleWatch = async () => {
    if (videoData) {
      setShowPlayer(true);
      return;
    }
    
    if (!stepId) {
      alert(`📹 Video: "${videoTitle}"\n\nNo video uploaded yet for this step.`);
      return;
    }

    setLoading(true);
    try {
      const imagekitUrls = USE_IMAGEKIT_VIDEOS && isImageKitConfigured()
        ? getImageKitCandidates({ stepId, videoSlug, videoTitle })
        : [];

      if (imagekitUrls.length > 0) {
        let selectedUrl = null;
        for (const url of imagekitUrls) {
          try {
            const headRes = await fetch(url, { method: 'HEAD' });
            if (headRes.ok) {
              selectedUrl = url;
              break;
            }
          } catch (err) {
            // Fall through to default candidate if HEAD fails
          }
        }

        if (!selectedUrl) {
          selectedUrl = imagekitUrls[0];
        }

        setVideoData({ url: selectedUrl, title: videoTitle });
        setShowPlayer(true);
        return;
      }

      const res = await fetch(`/api/videos/${stepId}`);
      const data = await res.json();
      
      if (data.success && data.video?.videoUrl) {
        const url = resolveVideoUrl(data.video.videoUrl);
        setVideoData({ url, title: videoTitle });
        setShowPlayer(true);
      } else {
        setNoVideo(true);
        alert(`📹 Video: "${videoTitle}"\n\nNo video uploaded yet for this step.\n\nAsk your manager to upload an instructional video!`);
      }
    } catch (err) {
      console.error('Error fetching video:', err);
      alert('Unable to load video. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button 
        onClick={handleWatch}
        disabled={loading}
        title={videoTitle}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all hover:shadow-sm ${
          noVideo 
            ? 'text-gray-500 bg-gray-100 hover:bg-gray-200'
            : 'text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100'
        }`}
      >
        {loading ? (
          <div className="w-3.5 h-3.5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
        ) : (
          <PlayCircle size={14} />
        )}
        {noVideo ? 'Coming Soon' : 'Watch'}
      </button>
      
      {showPlayer && videoData && (
        <VideoPlayer 
          videoUrl={videoData.url}
          title={videoData.title}
          onClose={() => setShowPlayer(false)}
        />
      )}
    </>
  );
};

// --- 4B. SWIPE TO CLEAN COMPONENT ---

const SwipeToClean = ({ onComplete, isComplete, stepTitle, disabled = false }) => {
  const [cleanProgress, setCleanProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [lastVibration, setLastVibration] = useState(0);
  const containerRef = useRef(null);

  const triggerHaptic = (intensity) => {
    
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      const now = Date.now();
      if (now - lastVibration > 50) {
        const pattern = intensity < 30 ? [10, 5, 10, 5, 10] : intensity < 70 ? [8, 3, 8] : [5];
        navigator.vibrate(pattern);
        setLastVibration(now);
      }
    }
  };

  const handleMove = (clientX, clientY) => {
    if (!isDragging || !containerRef.current || isComplete || disabled) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    
    if (x >= 0 && x <= rect.width && y >= 0 && y <= rect.height) {
      const progress = Math.min(100, cleanProgress + 3);
      setCleanProgress(progress);
      triggerHaptic(progress);
      
      if (progress >= 100 && !isComplete) {
        onComplete();
        if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
          navigator.vibrate([50, 30, 50]);
        }
      }
    }
  };

  const handleTouchMove = (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    handleMove(touch.clientX, touch.clientY);
  };

  const handleMouseMove = (e) => {
    handleMove(e.clientX, e.clientY);
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    if (isDragging) {
      const handleMouseUp = () => setIsDragging(false);
      const handleTouchEnd = () => setIsDragging(false);
      
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchend', handleTouchEnd);
      window.addEventListener('mousemove', handleMouseMove);
      
      return () => {
        window.removeEventListener('mouseup', handleMouseUp);
        window.removeEventListener('touchend', handleTouchEnd);
        window.removeEventListener('mousemove', handleMouseMove);
      };
    }
  }, [isDragging]);

  if (isComplete) {
    return (
      <div className="mt-4 p-6 bg-gradient-to-br from-green-50 to-blue-50 border-2 border-green-300 rounded-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-green-100/50 to-blue-100/50 animate-pulse"></div>
        <div className="relative flex items-center justify-center gap-3">
          <Sparkles size={32} className="text-green-600 animate-bounce" />
          <div className="text-center">
            <p className="text-lg font-bold text-green-800">✨ Sparkling Clean!</p>
            <p className="text-sm text-green-600">Great work on cleaning this step</p>
          </div>
          <Smile size={32} className="text-green-600 animate-bounce" />
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4">
      <div className="mb-3 text-center">
        <p className="text-sm font-bold text-gray-700 mb-1">👆 Swipe to Clean</p>
        <p className="text-xs text-gray-500">{disabled ? 'Complete photo upload first' : 'Drag your finger across to clean this step'}</p>
      </div>
      
      <div 
        ref={containerRef}
        className={`relative h-32 bg-gradient-to-br from-gray-400 to-gray-500 rounded-2xl overflow-hidden select-none border-4 border-gray-600 shadow-lg ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        onMouseDown={() => !disabled && setIsDragging(true)}
        onTouchStart={() => !disabled && setIsDragging(true)}
        onTouchMove={handleTouchMove}
        style={{ touchAction: 'none' }}
      >
        <div 
          className="absolute inset-0 bg-gradient-to-br from-green-200 via-blue-200 to-green-300 flex items-center justify-center"
          style={{
            clipPath: `inset(0 ${100 - cleanProgress}% 0 0)`,
            transition: 'clip-path 0.1s ease-out'
          }}
        >
          <Sparkles size={48} className="text-white drop-shadow-lg animate-pulse" />
        </div>
        
        <div 
          className="absolute inset-0 flex items-center justify-center"
          style={{
            opacity: 1 - (cleanProgress / 100)
          }}
        >
          <div className="text-center">
            <div className="text-4xl mb-2">🧽</div>
            <p className="text-white text-sm font-bold drop-shadow-md">Dirty</p>
          </div>
        </div>
        
        <div className="absolute top-2 right-2 bg-white/80 px-3 py-1 rounded-full text-xs font-bold text-gray-700">
          {Math.floor(cleanProgress)}%
        </div>
        
        <div className="absolute bottom-0 left-0 right-0 h-2 bg-gray-700/50">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-100"
            style={{ width: `${cleanProgress}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};

// --- 5. INVENTORY TRACKING COMPONENT ---

const InventoryTracker = ({ onComplete }) => {
  const [inventory, setInventory] = useState({
    beanHopper: null,
    powderCanisters: {
      'Oat Milk': null,
      'Dairy Milk': null,
      'Chai': null,
      'Cocoa': null,
      'Empty': null,
      'Cane Sugar': null,
      'Oat Matcha': null
    },
    syrups: {
      'Brown Sugar': null,
      'Vanilla': null,
      'Strawberry': null,
      'Coconut': null,
      'Lavender': null
    }
  });

  const allCompleted = 
    inventory.beanHopper !== null &&
    Object.values(inventory.powderCanisters).every(val => val !== null) &&
    Object.values(inventory.syrups).every(val => val !== null);

  useEffect(() => {
    if (allCompleted) {
      onComplete(inventory);
    }
  }, [allCompleted, inventory, onComplete]);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
          <CheckSquare size={20} className="text-blue-600" />
          Bean Hopper (1)
        </h3>
        <Card className="p-4">
          <div className="flex gap-2">
            <Button 
              variant={inventory.beanHopper === 'refilled' ? 'success' : 'secondary'}
              onClick={() => setInventory({...inventory, beanHopper: 'refilled'})}
              className="flex-1"
            >
              Refilled
            </Button>
            <Button 
              variant={inventory.beanHopper === 'no_need' ? 'success' : 'secondary'}
              onClick={() => setInventory({...inventory, beanHopper: 'no_need'})}
              className="flex-1"
            >
              No Need (&gt;50%)
            </Button>
          </div>
        </Card>
      </div>

      <div>
        <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
          <Droplet size={20} className="text-blue-600" />
          Powder Canisters (7)
        </h3>
        <div className="space-y-2">
          {Object.keys(inventory.powderCanisters).map(canister => (
            <Card key={canister} className="p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium text-sm flex-1">{canister}</span>
                <div className="flex gap-2">
                  <Button 
                    variant={inventory.powderCanisters[canister] === 'refilled' ? 'success' : 'secondary'}
                    onClick={() => setInventory({
                      ...inventory, 
                      powderCanisters: {...inventory.powderCanisters, [canister]: 'refilled'}
                    })}
                    className="text-xs px-3 py-2"
                  >
                    Refilled
                  </Button>
                  <Button 
                    variant={inventory.powderCanisters[canister] === 'no_need' ? 'success' : 'secondary'}
                    onClick={() => setInventory({
                      ...inventory, 
                      powderCanisters: {...inventory.powderCanisters, [canister]: 'no_need'}
                    })}
                    className="text-xs px-3 py-2"
                  >
                    No Need
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
          <Droplet size={20} className="text-slate-600" />
          Syrups (5)
        </h3>
        <div className="space-y-2">
          {Object.keys(inventory.syrups).map(syrup => (
            <Card key={syrup} className="p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium text-sm flex-1">{syrup}</span>
                <div className="flex gap-2">
                  <Button 
                    variant={inventory.syrups[syrup] === 'refilled' ? 'success' : 'secondary'}
                    onClick={() => setInventory({
                      ...inventory, 
                      syrups: {...inventory.syrups, [syrup]: 'refilled'}
                    })}
                    className="text-xs px-3 py-2"
                  >
                    Refilled
                  </Button>
                  <Button 
                    variant={inventory.syrups[syrup] === 'no_need' ? 'success' : 'secondary'}
                    onClick={() => setInventory({
                      ...inventory, 
                      syrups: {...inventory.syrups, [syrup]: 'no_need'}
                    })}
                    className="text-xs px-3 py-2"
                  >
                    No Need
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {allCompleted && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3 animate-in fade-in">
          <CheckCircle size={24} className="text-green-600" />
          <span className="font-bold text-green-800">All Supplies Checked!</span>
        </div>
      )}
    </div>
  );
};

// --- 6. WEEKLY VISIT WIZARD (20 MIN) ---

const WeeklyVisitWizard = ({ onComplete, user, onAskAI }) => {
  const [currentPage, setCurrentPage] = useState(0);
  const [completedQuestions, setCompletedQuestions] = useState({});
  const [photos, setPhotos] = useState({});
  const isTestUser = user?.displayName === 'test';
  const [questionProblems, setQuestionProblems] = useState({});
  const [optionSelections, setOptionSelections] = useState({});
  const [textInputs, setTextInputs] = useState({});

  // Auto-scroll to top when page changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentPage]);

  const pages = [
    {
      title: "Safety & Leaks Check",
      description: "Make sure the area is clean and safe, then check for leaks.",
      section: true,
      questions: [
        {
          section: "Safety",
          id: "ARRIVAL_SAFETY",
          title: "Check the Area",
          description: "Is trash touching the machine? Are the vents blocked? Clear it away.",
          hasVideo: true,
          videoTitle: "Safety & Perimeter Check"
        },
        {
          id: "SCREEN_CHECK",
          title: "Clean the Screen",
          description: "Wipe the touch screen with a cloth to remove fingerprints.",
          hasVideo: true,
          videoTitle: "How to Clean the Touch Screen"
        },
        {
          section: "Leaks",
          id: "LEAK_BEHIND",
          title: "Check the Floor",
          description: "Look behind the machine. Is the floor wet?",
          hasVideo: true,
          videoTitle: "Checking for Floor Leaks Behind Machine"
        },
        {
          id: "LEAK_FLOOR_MACHINE",
          title: "Check Inside",
          description: "Open the bottom door. Shine your light inside. Is it dry?",
          hasVideo: true,
          videoTitle: "Checking for Internal Leaks",
          requiresPhoto: true
        }
      ]
    },
    {
      title: "Clean & Restock",
      description: "Empty waste and refill cups, lids, and beans.",
      section: true,
      questions: [
        {
          section: "Empty Trash",
          id: "WASTE_BUCKETS",
          title: "Dirty Water Buckets",
          description: "Empty them. Rinse them. Put them back with the correct tubes inside the bins and the sensor in place.",
          hasVideo: true,
          videoTitle: "How to Empty and Rinse Dirty Water Buckets"
        },
        {
          id: "GRIND_BIN",
          title: "Coffee Grounds Bin",
          description: "Unlock cup holder. SWING IT OPEN like a door. Take out bin. Wash it.",
          hasVideo: true,
          videoTitle: "Waste: Accessing & Cleaning Grind Bin"
        },
        {
          id: "SPLASHGUARD_WIPE",
          title: "Splashguard",
          description: "Wipe the plastic wall behind the coffee nozzles.",
          hasVideo: true,
          videoTitle: "How to Clean the Splashguard"
        },
        {
          id: "DRIP_TRAY_WIPE",
          title: "Drip Tray",
          description: "Wipe the tray clean (Don't take it off today).",
          hasVideo: true,
          videoTitle: "How to Wipe the Drip Tray"
        },
        {
          section: "Restock",
          id: "PHOTO_SUPPLIES_INITIAL",
          title: "📸 Photo: Hopper & Canisters",
          description: "Take ONE photo showing the bean hopper and all 7 powder canisters.",
          requiresPhoto: true
        },
        {
          id: "CUPS_LIDS",
          title: "Cups & Lids",
          description: "Are cup stacks low? Fill them. Are lids low? Add more.",
          hasVideo: true,
          videoTitle: "How to Refill Cups and Lids"
        },
        {
          id: "BEAN_HOPPER",
          title: "☕ Bean Hopper",
          description: "Is it low? Refill it. *Important:* Pull the plastic tab OUT after.",
          hasOptions: true,
          options: ["Refilled", "No need (>50%)"],
          hasVideo: true,
          videoTitle: "Supplies: Bean Hopper & Baffle"
        }
      ]
    },
    {
      title: "Powders & Syrups",
      description: "Check 7 powder boxes and 5 syrup bottles.",
      section: true,
      questions: [
        {
          section: "Powders",
          id: "POWDER_INTRO",
          title: "7 Powder Boxes",
          description: "Look at each box. Only refill if less than half full.",
          hasVideo: true,
          videoTitle: "How to Refill Powder Canisters",
          isInfo: true
        },
        {
          id: "CANISTER_1_OAT",
          title: "🌾 1. Oat Milk",
          description: "",
          hasOptions: true,
          options: ["Refilled", "No need (>50%)"],
          hasVideo: false
        },
        {
          id: "CANISTER_2_DAIRY",
          title: "🥛 2. Dairy Milk",
          description: "",
          hasOptions: true,
          options: ["Refilled", "No need (>50%)"],
          hasVideo: false
        },
        {
          id: "CANISTER_3_CHAI",
          title: "🍂 3. Chai",
          description: "",
          hasOptions: true,
          options: ["Refilled", "No need (>50%)"],
          hasVideo: false
        },
        {
          id: "CANISTER_4_COCOA",
          title: "🍫 4. Cocoa Powder",
          description: "",
          hasOptions: true,
          options: ["Refilled", "No need (>50%)"],
          hasVideo: false
        },
        {
          id: "CANISTER_5_EMPTY",
          title: "🚫 5. (Empty)",
          description: "",
          hasOptions: true,
          options: ["Refilled", "No need (>50%)"],
          hasVideo: false
        },
        {
          id: "CANISTER_6_SUGAR",
          title: "🍬 6. Cane Sugar",
          description: "",
          hasOptions: true,
          options: ["Refilled", "No need (>50%)"],
          hasVideo: false
        },
        {
          id: "CANISTER_7_MATCHA",
          title: "🍵 7. Oat Matcha Mix",
          description: "",
          hasOptions: true,
          options: ["Refilled", "No need (>50%)"],
          hasVideo: false
        },
        {
          id: "POWDER_WIPE",
          title: "Mixing Bowl Check",
          description: "Is there any powder on the mixing bowls? Wipe off clean.",
          hasVideo: true,
          videoTitle: "How to Clean the Mixing Bowls"
        },
        {
          section: "Syrups",
          id: "SYRUP_INTRO",
          title: "5 Syrup Bottles",
          description: "Check all bottles: Brown Sugar, Vanilla, Strawberry, Coconut, Lavender. Are any empty? Swap them.",
          hasVideo: true,
          videoTitle: "How to Check and Swap Syrup Bottles",
          isInfo: true
        },
        {
          id: "SYRUP_1_BROWN_SUGAR",
          title: "🧋 1. Brown Sugar",
          description: "",
          hasOptions: true,
          options: ["Replaced", "No need (>50%)"],
          hasVideo: false
        },
        {
          id: "SYRUP_2_VANILLA",
          title: "🍦 2. Vanilla",
          description: "",
          hasOptions: true,
          options: ["Replaced", "No need (>50%)"],
          hasVideo: false
        },
        {
          id: "SYRUP_3_STRAWBERRY",
          title: "🍓 3. Strawberry",
          description: "",
          hasOptions: true,
          options: ["Replaced", "No need (>50%)"],
          hasVideo: false
        },
        {
          id: "SYRUP_4_COCONUT",
          title: "🥥 4. Coconut",
          description: "",
          hasOptions: true,
          options: ["Replaced", "No need (>50%)"],
          hasVideo: false
        },
        {
          id: "SYRUP_5_LAVENDER",
          title: "🌸 5. Lavender",
          description: "",
          hasOptions: true,
          options: ["Replaced", "No need (>50%)"],
          hasVideo: false
        },
        {
          id: "PHOTO_SYRUPS",
          title: "📸 Photo: All Syrup Bottles",
          description: "Take a photo showing all 5 syrup bottles.",
          requiresPhoto: true
        },
        {
          id: "DIGITAL_LOG",
          title: "📸 Photo: Replenishment Screen",
          description: "1) Press 'Mode Key' button > 'Replenishment' > Press all 'FILLED' buttons > Save. 2) Take a photo of the final screen showing everything saved.",
          requiresPhoto: true
        }
      ]
    },
    {
      title: "Final Test",
      description: "Make sure everything works.",
      section: true,
      questions: [
        {
          id: "ERROR_CHECK",
          title: "Screen Status",
          description: "Is the screen showing any red error codes?",
          hasVideo: true,
          videoTitle: "How to Check for Machine Error Codes"
        },
        {
          id: "TEST_DRINK",
          title: "Make a Latte",
          description: "Go to Coffee Test > Latte. Does it work?",
          hasVideo: true,
          videoTitle: "Test: Making a Test Drink"
        },
        {
          id: "VISIT_NOTES",
          title: "Visit Notes",
          description: "Anything broken or weird? Leave a note.",
          hasVideo: true,
          videoTitle: "How to Write Visit Notes",
          isTextInput: true
        }
      ]
    }
  ];

  const currentPageData = pages[currentPage];
  const allQuestionsComplete = currentPageData.questions.every(q => {
    // Skip info-only questions
    if (q.isInfo) return true;
    
    // Text inputs are optional, always consider complete
    if (q.isTextInput) return true;
    
    const isComplete = completedQuestions[q.id];
    const needsPhoto = q.requiresPhoto && !isTestUser;
    const hasPhoto = photos[q.id]?.length > 0;
    const hasOptions = q.hasOptions && q.options;
    const hasOptionSelected = hasOptions ? optionSelections[q.id] !== undefined : true;
    
    // Must be marked complete, photo if needed, and option selected if has options
    return isComplete && (!needsPhoto || hasPhoto) && hasOptionSelected;
  });

  const handleOptionSelect = (questionId, selectedOption) => {
    setOptionSelections({...optionSelections, [questionId]: selectedOption});
    setCompletedQuestions({...completedQuestions, [questionId]: true});
  };

  const handleQuestionComplete = (questionId) => {
    setCompletedQuestions({...completedQuestions, [questionId]: true});
  };

  const handleQuestionUndo = (questionId) => {
    const newCompleted = {...completedQuestions};
    delete newCompleted[questionId];
    setCompletedQuestions(newCompleted);
    
    // Also clear option selection if exists
    if (optionSelections[questionId]) {
      const newSelections = {...optionSelections};
      delete newSelections[questionId];
      setOptionSelections(newSelections);
    }
  };

  const handleReportProblem = (questionId) => {
    const problem = prompt("Describe the problem (e.g., 'Not dry yet', 'Needs replacement', etc.):");
    if (problem) {
      setQuestionProblems({...questionProblems, [questionId]: problem});
    }
  };

  const handlePhotoUpload = (photoArray) => {
    setPhotos({...photos, [currentPageData.questions[0].id]: photoArray});
  };

  const handleNext = () => {
    if (currentPage < pages.length - 1) {
      window.scrollTo(0, 0);
      setCurrentPage(currentPage + 1);
    }
  };

  const handleFinalComplete = () => {
    triggerHaptic('success');
    const visitData = {
      type: 'weekly', 
      completedQuestions, 
      photos, 
      problems: questionProblems,
      optionSelections,
      textInputs,
      timestamp: new Date().toISOString() 
    };
    
    onComplete(visitData);
  };

  const overallProgress = (currentPage / pages.length) * 100;
  
  const handleSwipeBack = () => {
    if (currentPage > 0) {
      window.scrollTo(0, 0);
      setCurrentPage(currentPage - 1);
    } else {
      onComplete(null);
    }
  };

  return (
    <SwipeBackWrapper onBack={handleSwipeBack}>
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Premium Header */}
      <div className="bg-white border-b border-gray-200 sticky-header">
        <div className="max-w-2xl mx-auto px-4 md:px-6 py-4 md:py-5 sticky-header-safe">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-2.5 rounded-xl">
                <Activity size={22} className="text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-semibold text-gray-900">Weekly Visit</h1>
                <p className="text-sm text-gray-500">~20 minutes</p>
              </div>
            </div>
            <button 
              onClick={() => onComplete(null)} 
              className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 p-2 rounded-xl transition-all active:scale-95 touch-target"
            >
              <X size={22} />
            </button>
          </div>
          
          {/* Premium Progress Bar */}
          <div className="bg-gray-200 rounded-full h-1.5 overflow-hidden">
            <div 
              className="bg-blue-600 h-full transition-all duration-500"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
          <div className="flex justify-between items-center mt-2">
            <span className="text-xs text-gray-600">Step {currentPage + 1} of {pages.length}</span>
            <span className="text-xs font-semibold text-gray-900">{Math.round(overallProgress)}%</span>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 md:p-6">
        <div className="bg-white p-5 md:p-6 mb-5 rounded-3xl border border-gray-200 shadow-sm">
          <div className="flex items-start gap-4 mb-5">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl w-11 h-11 flex items-center justify-center font-bold text-lg flex-shrink-0 shadow-sm">
              {currentPage + 1}
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-semibold text-gray-900 mb-1">{currentPageData.title}</h2>
              <p className="text-gray-600">{currentPageData.description}</p>
            </div>
          </div>

          <div className="space-y-4 mt-6">
            {currentPageData.questions.map((question, idx) => (
              <div key={question.id}>
                {question.section && (idx === 0 || currentPageData.questions[idx-1]?.section !== question.section) && (
                  <h3 className="text-lg font-bold text-gray-900 mt-5 mb-3 px-2">{question.section}</h3>
                )}
                <Card className="p-4 bg-gray-50">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900">{question.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">{question.description}</p>
                  </div>
                  {completedQuestions[question.id] && (
                    <CheckCircle size={20} className="text-green-600 flex-shrink-0 ml-2" />
                  )}
                </div>
                
                {question.hasVideo && question.videoTitle && (
                  <div className="mt-3 mb-3">
                    <WatchVideoButton
                      videoTitle={question.videoTitle}
                      stepId={question.id}
                      videoSlug={toVideoSlug(question.title)}
                    />
                  </div>
                )}
                
                {question.hasOptions && question.options && (
                  <div className="mt-3 mb-3">
                    <div className="flex gap-2">
                      {question.options.map((option) => {
                        const isSelected = optionSelections[question.id] === option;
                        return (
                          <Button
                            key={option}
                            onClick={() => handleOptionSelect(question.id, option)}
                            variant={isSelected ? "primary" : "secondary"}
                            completed={isSelected}
                            className="flex-1"
                          >
                            {option}
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                )}
                
                {question.requiresPhoto && (
                  <div className="mt-3 mb-3">
                    <MockPhotoUpload 
                      label={question.title}
                      onUpload={(photoArray) => setPhotos({...photos, [question.id]: photoArray})}
                      hasPhoto={photos[question.id]?.length > 0}
                      required={!isTestUser}
                    />
                  </div>
                )}

                {question.isTextInput && (
                  <div className="mt-3 mb-3">
                    <div className="flex gap-2 items-start">
                      <textarea
                        value={textInputs[question.id] || ''}
                        onChange={(e) => {
                          setTextInputs({...textInputs, [question.id]: e.target.value});
                          if (e.target.value.trim()) {
                            setCompletedQuestions({...completedQuestions, [question.id]: true});
                          }
                        }}
                        placeholder="Write or speak your notes... (optional)"
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[100px]"
                      />
                      <VoiceInputButton 
                        onTranscript={(text) => {
                          const current = textInputs[question.id] || '';
                          const newText = current ? `${current} ${text}` : text;
                          setTextInputs({...textInputs, [question.id]: newText});
                          if (newText.trim()) {
                            setCompletedQuestions({...completedQuestions, [question.id]: true});
                          }
                        }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                      <Mic size={12} /> Tap mic to speak instead of typing
                    </p>
                  </div>
                )}

                {questionProblems[question.id] && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-800">
                      <strong>⚠️ Problem Reported:</strong> {questionProblems[question.id]}
                    </p>
                  </div>
                )}

                {!question.hasOptions && !question.isInfo && !question.isTextInput && (
                  <div className="flex gap-2 mt-3">
                    <Button 
                      onClick={() => handleReportProblem(question.id)}
                      variant="danger"
                      className="flex-shrink-0"
                    >
                      <AlertTriangle size={16} />
                    </Button>

                    {completedQuestions[question.id] ? (
                      <Button 
                        onClick={() => handleQuestionUndo(question.id)}
                        variant="primary"
                        completed={true}
                        className="flex-1"
                      >
                        <CheckCircle size={16} />
                        Done
                      </Button>
                    ) : (
                      <Button 
                        onClick={() => handleQuestionComplete(question.id)}
                        variant="primary"
                        className="flex-1"
                        disabled={question.requiresPhoto && !isTestUser && (!photos[question.id] || photos[question.id].length === 0)}
                      >
                        <CheckCircle size={16} />
                        Mark Done
                      </Button>
                    )}
                  </div>
                )}

                {question.hasOptions && (
                  <div className="flex gap-2 mt-3">
                    <Button 
                      onClick={() => handleReportProblem(question.id)}
                      variant="danger"
                      className="flex-shrink-0"
                    >
                      <AlertTriangle size={16} />
                    </Button>
                    {completedQuestions[question.id] && (
                      <Button 
                        onClick={() => handleQuestionUndo(question.id)}
                        variant="secondary"
                        className="flex-1"
                        size="sm"
                      >
                        <X size={14} />
                        Reset
                      </Button>
                    )}
                  </div>
                )}
              </Card>
              </div>
            ))}
          </div>

        <button 
          onClick={onAskAI}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg shadow-md hover:shadow-lg active:scale-95 transition-all font-semibold flex items-center justify-center gap-2 mb-3"
        >
          <Sparkles size={18} />
          <span>Ask AI</span>
        </button>

          <div className="flex gap-3 mt-3">
            {currentPage > 0 && (
              <Button 
                onClick={() => {window.scrollTo(0, 0); setCurrentPage(currentPage - 1);}}
                variant="secondary"
                className="flex-1"
              >
                <ChevronLeft size={18} />
                Back
              </Button>
            )}
            {currentPage < pages.length - 1 ? (
              <Button 
                onClick={handleNext}
                variant="success"
                className="flex-1"
                disabled={!allQuestionsComplete}
              >
                Next Step
                <ChevronRight size={18} />
              </Button>
            ) : null}
          </div>

          {currentPage === pages.length - 1 && allQuestionsComplete && (
            <div className="mt-6">
              <Button 
                onClick={handleFinalComplete}
                variant="success"
                className="w-full"
              >
                <CheckCircle size={18} />
                Complete Weekly Visit
              </Button>
            </div>
          )}
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm mt-5">
          <h3 className="font-bold text-sm mb-3 text-gray-600">PAGES</h3>
          <div className="grid grid-cols-6 gap-2">
            {pages.map((_, idx) => (
              <div 
                key={idx}
                className={`h-2 rounded-full transition-all cursor-pointer ${
                  idx === currentPage 
                    ? 'bg-blue-600' 
                    : idx < currentPage
                      ? 'bg-green-500' 
                      : 'bg-gray-200'
                }`}
                onClick={() => setCurrentPage(idx)}
              />
            ))}
          </div>
        </div>
      </div>

    </div>
    </SwipeBackWrapper>
  );
};

// --- 7. MONTHLY DEEP CLEAN WIZARD (45 MIN) ---

const MonthlyDeepCleanWizard = ({ onComplete, user, onAskAI }) => {
  const [currentPage, setCurrentPage] = useState(0);
  const [completedQuestions, setCompletedQuestions] = useState({});
  const [photos, setPhotos] = useState({});
  const isTestUser = user?.displayName === 'test';
  const [questionProblems, setQuestionProblems] = useState({});
  const [optionSelections, setOptionSelections] = useState({});
  const [textInputs, setTextInputs] = useState({});

  // Auto-scroll to top when page changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentPage]);

  const pages = [
    // PAGE 1: SAFETY & LEAKS
    {
      title: "Safety & Leaks Check",
      description: "Check the area and look for water.",
      section: true,
      questions: [
        {
          section: "Safety",
          id: "ARRIVAL_SAFETY",
          title: "Check the Area",
          description: "Is trash touching the machine? Are the vents blocked? Clear it away.",
          hasVideo: true,
          videoTitle: "Safety & Perimeter Check"
        },
        {
          id: "SCREEN_CHECK",
          title: "Clean the Screen",
          description: "Wipe the touch screen with a cloth to remove fingerprints.",
          hasVideo: true,
          videoTitle: "How to Clean the Touch Screen"
        },
        {
          section: "Leaks",
          id: "LEAK_BEHIND",
          title: "Check the Floor",
          description: "Look behind the machine. Is the floor wet?",
          hasVideo: true,
          videoTitle: "Checking for Floor Leaks Behind Machine"
        },
        {
          id: "LEAK_FLOOR_MACHINE",
          title: "Check Inside",
          description: "Open the bottom door. Shine your light inside. Is it dry?",
          hasVideo: true,
          videoTitle: "Checking for Internal Leaks",
          requiresPhoto: true
        }
      ]
    },
    {
      title: "Clean & Disassemble",
      description: "Empty waste and remove all canisters for deep cleaning.",
      section: true,
      questions: [
        {
          section: "Empty Trash",
          id: "WASTE_BUCKETS_MONTHLY",
          title: "Dirty Water Buckets",
          description: "Empty them. Rinse them. Put them back with the correct tubes inside the bins and the sensor in place.",
          hasVideo: true,
          videoTitle: "How to Empty and Rinse Dirty Water Buckets"
        },
        {
          id: "GRIND_BIN_MONTHLY",
          title: "Coffee Grounds Bin",
          description: "Unlock cup holder. SWING IT OPEN like a door. Take out bin. Wash it.",
          hasVideo: true,
          videoTitle: "Waste: Accessing & Cleaning Grind Bin"
        },
        {
          section: "Disassemble",
          id: "CANISTER_DISASSEMBLY",
          title: "Remove All Canisters",
          description: "For each canister: Rotate spout up. Remove canister. Pull out auger/wheel from inside. Set parts aside for later reassembly.",
          hasVideo: true,
          videoTitle: "Deep Clean: Canister Disassembly",
          requiresPhoto: true
        }
      ]
    },
    {
      title: "Grinder, Drip & Mixer",
      description: "Deep clean internal components.",
      section: true,
      questions: [
        {
          section: "Grinder",
          id: "GRINDER_DEEP_CLEAN",
          title: "Grinder Baffles & Dust Cover",
          description: "Remove grinder dust cover. Remove residue baffle. Brush away all hidden coffee grounds. Reinstall everything in reverse order.",
          hasVideo: true,
          videoTitle: "Deep Clean: Grinder Baffles",
          requiresPhoto: true
        },
        {
          section: "Drip Tray",
          id: "DRIP_TRAY_REMOVAL",
          title: "Internal Drip Tray Removal",
          description: "Open front door. Find wing nut. Unscrew it. Slide tray out carefully (keep level). Wash with soap and water. Dry completely. Reinstall and tighten wing nut.",
          hasVideo: true,
          videoTitle: "Deep Clean: Removing Internal Drip Tray",
          requiresPhoto: true
        },
        {
          section: "Mixer",
          id: "MIXER_SYSTEM",
          title: "Mixer Disassembly",
          description: "Lift green tab. Twist to unlock mixing bowl and bucket. Remove both parts. Wash with soap. Dry completely. Lock back into place.",
          hasVideo: true,
          videoTitle: "Deep Clean: Mixer System",
          requiresPhoto: true
        }
      ]
    },
    {
      title: "Cup Path, Descaling & Brewer",
      description: "Final maintenance and deep cleaning.",
      section: true,
      questions: [
        {
          section: "Cup Path",
          id: "CUP_PATH_CLEAN",
          title: "Cup Slide Path",
          description: "Wipe the entire sliding ramp with damp cloth. Remove all sticky residue. Test that cups slide freely.",
          hasVideo: true,
          videoTitle: "Hardware: Cleaning the Cup Path"
        },
        {
          section: "Descaling",
          id: "DESCALING_PROGRAM",
          title: "Descaling with Citric Acid",
          description: "Mix citric acid solution (1:20 ratio). Place water tube into bucket with solution. Go to Settings → Cleaning → Clean All. Run complete program. Flush with 1/2 gallon clean water after.",
          hasVideo: true,
          videoTitle: "Maintenance: Descaling Program",
          requiresPhoto: true
        },
        {
          section: "Brewer",
          id: "BREWER_REMOVAL",
          title: "Brewer Deep Clean",
          description: "⚠️ CAREFUL: Disconnect silicone tubes. Remove two fixing screws. Slide brewer unit out. Clean filters and gaskets thoroughly. Reinstall in reverse order.",
          hasVideo: true,
          videoTitle: "Deep Clean: Brewer Removal",
          requiresPhoto: true
        }
      ]
    },
    {
      title: "Restock & Reassemble",
      description: "Refill supplies and reassemble all canisters.",
      section: true,
      questions: [
        {
          section: "Refill",
          id: "PHOTO_SUPPLIES_INITIAL",
          title: "📸 Photo: Hopper & Canisters",
          description: "Take ONE photo showing the bean hopper and all 7 powder canisters.",
          requiresPhoto: true
        },
        {
          id: "CUPS_LIDS",
          title: "Cups & Lids",
          description: "Are cup stacks low? Fill them. Are lids low? Add more.",
          hasVideo: true,
          videoTitle: "How to Refill Cups and Lids"
        },
        {
          id: "BEAN_HOPPER",
          title: "☕ Bean Hopper",
          description: "Is it low? Refill it. *Important:* Pull the plastic tab OUT after.",
          hasOptions: true,
          options: ["Refilled", "No need (>50%)"],
          hasVideo: true,
          videoTitle: "Supplies: Bean Hopper & Baffle"
        },
        {
          section: "Reassemble Powders",
          id: "POWDER_INTRO",
          title: "7 Powder Boxes",
          description: "Reassemble and refill all 7 canisters.",
          hasVideo: true,
          videoTitle: "How to Refill Powder Canisters",
          isInfo: true
        },
        {
          id: "CANISTER_1_OAT",
          title: "🌾 1. Oat Milk",
          description: "",
          hasOptions: true,
          options: ["Refilled & Reinstalled", "No need (>50%)"],
          hasVideo: false
        },
        {
          id: "CANISTER_2_DAIRY",
          title: "🥛 2. Dairy Milk",
          description: "",
          hasOptions: true,
          options: ["Refilled & Reinstalled", "No need (>50%)"],
          hasVideo: false
        },
        {
          id: "CANISTER_3_CHAI",
          title: "🍂 3. Chai",
          description: "",
          hasOptions: true,
          options: ["Refilled & Reinstalled", "No need (>50%)"],
          hasVideo: false
        },
        {
          id: "CANISTER_4_COCOA",
          title: "🍫 4. Cocoa Powder",
          description: "",
          hasOptions: true,
          options: ["Refilled & Reinstalled", "No need (>50%)"],
          hasVideo: false
        },
        {
          id: "CANISTER_5_EMPTY",
          title: "🚫 5. (Empty)",
          description: "",
          hasOptions: true,
          options: ["Refilled & Reinstalled", "No need (>50%)"],
          hasVideo: false
        },
        {
          id: "CANISTER_6_SUGAR",
          title: "🍬 6. Cane Sugar",
          description: "",
          hasOptions: true,
          options: ["Refilled & Reinstalled", "No need (>50%)"],
          hasVideo: false
        },
        {
          id: "CANISTER_7_MATCHA",
          title: "🍵 7. Oat Matcha Mix",
          description: "",
          hasOptions: true,
          options: ["Refilled & Reinstalled", "No need (>50%)"],
          hasVideo: false
        },
        {
          id: "POWDER_WIPE",
          title: "Mixing Bowl Check",
          description: "Is there any powder on the mixing bowls? Wipe off clean.",
          hasVideo: true,
          videoTitle: "How to Clean the Mixing Bowls"
        }
      ]
    },
    {
      title: "Syrups & Final Test",
      description: "Restock syrups and make sure everything works.",
      section: true,
      questions: [
        {
          section: "Syrups",
          id: "SYRUP_INTRO",
          title: "5 Syrup Bottles",
          description: "Check all bottles: Brown Sugar, Vanilla, Strawberry, Coconut, Lavender. Are any empty? Swap them.",
          hasVideo: true,
          videoTitle: "How to Check and Swap Syrup Bottles",
          isInfo: true
        },
        {
          id: "SYRUP_1_BROWN_SUGAR",
          title: "🧋 1. Brown Sugar",
          description: "",
          hasOptions: true,
          options: ["Replaced", "No need (>50%)"],
          hasVideo: false
        },
        {
          id: "SYRUP_2_VANILLA",
          title: "🍦 2. Vanilla",
          description: "",
          hasOptions: true,
          options: ["Replaced", "No need (>50%)"],
          hasVideo: false
        },
        {
          id: "SYRUP_3_STRAWBERRY",
          title: "🍓 3. Strawberry",
          description: "",
          hasOptions: true,
          options: ["Replaced", "No need (>50%)"],
          hasVideo: false
        },
        {
          id: "SYRUP_4_COCONUT",
          title: "🥥 4. Coconut",
          description: "",
          hasOptions: true,
          options: ["Replaced", "No need (>50%)"],
          hasVideo: false
        },
        {
          id: "SYRUP_5_LAVENDER",
          title: "🌸 5. Lavender",
          description: "",
          hasOptions: true,
          options: ["Replaced", "No need (>50%)"],
          hasVideo: false
        },
        {
          id: "PHOTO_SYRUPS",
          title: "📸 Photo: All Syrup Bottles",
          description: "Take a photo showing all 5 syrup bottles.",
          requiresPhoto: true
        },
        {
          id: "DIGITAL_LOG",
          title: "📸 Photo: Replenishment Screen",
          description: "1) Press 'Mode Key' button > 'Replenishment' > Press all 'FILLED' buttons > Save. 2) Take a photo of the final screen showing everything saved.",
          requiresPhoto: true
        },
        {
          section: "Final Test",
          id: "ERROR_CHECK",
          title: "Screen Status",
          description: "Is the screen showing any red error codes?",
          hasVideo: true,
          videoTitle: "How to Check for Machine Error Codes"
        },
        {
          id: "TEST_DRINK",
          title: "Make a Latte",
          description: "Go to Coffee Test > Latte. Does it work?",
          hasVideo: true,
          videoTitle: "Test: Making a Test Drink"
        },
        {
          id: "VISIT_NOTES",
          title: "Visit Notes",
          description: "Anything broken or weird? Leave a note.",
          hasVideo: true,
          videoTitle: "How to Write Visit Notes",
          isTextInput: true
        }
      ]
    }
  ];

  const currentPageData = pages[currentPage];
  const allQuestionsComplete = currentPageData.questions.every(q => {
    if (q.isInfo) return true;
    if (q.isTextInput) return true;
    
    const isComplete = completedQuestions[q.id];
    const needsPhoto = q.requiresPhoto && !isTestUser;
    const hasPhoto = photos[q.id]?.length > 0;
    const hasOptions = q.hasOptions && q.options;
    const hasOptionSelected = hasOptions ? optionSelections[q.id] !== undefined : true;
    
    return isComplete && (!needsPhoto || hasPhoto) && hasOptionSelected;
  });

  const handleOptionSelect = (questionId, selectedOption) => {
    setOptionSelections({...optionSelections, [questionId]: selectedOption});
    setCompletedQuestions({...completedQuestions, [questionId]: true});
  };

  const handleQuestionComplete = (questionId) => {
    setCompletedQuestions({...completedQuestions, [questionId]: true});
  };

  const handleQuestionUndo = (questionId) => {
    const newCompleted = {...completedQuestions};
    delete newCompleted[questionId];
    setCompletedQuestions(newCompleted);
    
    if (optionSelections[questionId]) {
      const newSelections = {...optionSelections};
      delete newSelections[questionId];
      setOptionSelections(newSelections);
    }
  };

  const handleReportProblem = (questionId) => {
    const problem = prompt("Describe the problem (e.g., 'Not dry yet', 'Needs replacement', etc.):");
    if (problem) {
      setQuestionProblems({...questionProblems, [questionId]: problem});
    }
  };

  const handlePhotoUpload = (photoArray) => {
    const currentQuestion = currentPageData.questions.find(q => q.requiresPhoto && !photos[q.id]);
    if (currentQuestion) {
      setPhotos({...photos, [currentQuestion.id]: photoArray});
    }
  };

  const handleTextInput = (questionId, text) => {
    setTextInputs({...textInputs, [questionId]: text});
  };

  const handleFinalComplete = async () => {
    // Grant spin
    try {
      await fetch('/api/v1.00/gamification/lucky-spin/grant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...buildGamificationHeaders(user)
        },
        body: JSON.stringify({ 
          partnerId: user?.id,
          reason: 'WEEKLY_VISIT_COMPLETE',
          spins: 1
        })
      });
    } catch (err) {
      console.error('Failed to grant spin:', err);
    }
    
    setCurrentView('rewards');
    setWeeklyVisitCount(prev => prev + 1);
    triggerHaptic('success');
  };

  const progress = ((Object.keys(completedQuestions).length) / (pages.flatMap(p => p.questions.filter(q => !q.isInfo && !q.isTextInput)).length)) * 100;
  
  const handleSwipeBack = () => {
    if (currentPage > 0) {
      window.scrollTo(0, 0);
      setCurrentPage(currentPage - 1);
    } else {
      onComplete(null);
    }
  };

  return (
    <SwipeBackWrapper onBack={handleSwipeBack}>
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white pb-24">
      <div className="bg-slate-700 text-white p-6 shadow-lg sticky-header">
        <div className="flex items-center justify-between mb-4 sticky-header-safe">
          <div className="flex items-center gap-3">
            <Wrench size={28} />
            <div>
              <h1 className="text-2xl font-bold">Monthly Deep Clean</h1>
              <p className="text-slate-100 text-sm">~90 minutes (includes all Weekly steps + Deep clean)</p>
            </div>
          </div>
          <button onClick={() => onComplete(null)} className="text-white hover:bg-slate-600 p-2 rounded-lg touch-target">
            <X size={24} />
          </button>
        </div>
        
        <div className="bg-slate-400/30 rounded-full h-3 overflow-hidden">
          <div 
            className="bg-white h-full transition-all duration-500 rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between items-center mt-2">
          <span className="text-sm text-slate-100">Step {currentPage + 1} of {pages.length}</span>
          <span className="text-sm font-bold">{Math.round(progress)}% Complete</span>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-6">
        <div className="space-y-4">
          {currentPageData.questions.map(question => {
            const isComplete = completedQuestions[question.id];
            const hasPhoto = photos[question.id]?.length > 0;
            const selectedOption = optionSelections[question.id];
            const problemText = questionProblems[question.id];

            if (question.isInfo) {
              return (
                <Card key={question.id} className="p-4 bg-blue-50 border border-blue-200">
                  <div className="flex items-start gap-3">
                    <Info size={20} className="text-blue-600 flex-shrink-0 mt-1" />
                    <div className="flex-1">
                      <h3 className="font-bold text-blue-900">{question.title}</h3>
                      <p className="text-blue-800 text-sm mt-1">{question.description}</p>
                      {question.hasVideo && (
                        <div className="mt-3">
                          <WatchVideoButton
                            videoTitle={question.videoTitle}
                            stepId={question.id}
                            videoSlug={toVideoSlug(question.title)}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              );
            }

            return (
              <Card 
                key={question.id} 
                className={`p-4 border-2 transition-all ${
                  isComplete 
                    ? 'bg-green-50 border-green-300' 
                    : 'bg-white border-gray-200'
                }`}
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-white text-sm ${
                    isComplete 
                      ? 'bg-green-500' 
                      : 'bg-slate-700'
                  }`}>
                    {isComplete ? <CheckCircle size={16} /> : question.hasOptions ? '◆' : '✓'}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900">{question.title}</h3>
                    {question.description && (
                      <p className="text-sm text-gray-600 mt-1">{question.description}</p>
                    )}
                  </div>
                </div>

                {question.hasVideo && (
                  <div className="mb-3 ml-9">
                    <WatchVideoButton
                      videoTitle={question.videoTitle}
                      stepId={question.id}
                      videoSlug={toVideoSlug(question.title)}
                    />
                  </div>
                )}

                {question.hasOptions && (
                  <div className="ml-9 space-y-2 mb-3">
                    {question.options.map(option => (
                      <Button
                        key={option}
                        onClick={() => handleOptionSelect(question.id, option)}
                        variant={selectedOption === option ? "primary" : "secondary"}
                        className="w-full justify-start"
                      >
                        <CheckCircle size={16} />
                        {option}
                      </Button>
                    ))}
                  </div>
                )}

                {question.requiresPhoto && (
                  <div className="ml-9 mb-3">
                    <MockPhotoUpload 
                      label={question.title}
                      onUpload={handlePhotoUpload}
                      hasPhoto={hasPhoto}
                      required={!isTestUser}
                    />
                  </div>
                )}

                {question.isTextInput && (
                  <div className="ml-9 mb-3">
                    <input
                      type="text"
                      placeholder="Leave a note..."
                      value={textInputs[question.id] || ''}
                      onChange={(e) => handleTextInput(question.id, e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                )}

                <div className="flex gap-2 ml-9 mt-3 items-center">
                  {!isComplete && (
                    <Button
                      onClick={() => handleQuestionComplete(question.id)}
                      variant="primary"
                      className="flex-1"
                      size="sm"
                      disabled={question.requiresPhoto && !isTestUser && !hasPhoto}
                    >
                      <CheckCircle size={14} />
                      Done
                    </Button>
                  )}
                  {isComplete && (
                    <Button
                      onClick={() => handleQuestionUndo(question.id)}
                      variant="secondary"
                      className="flex-1"
                      size="sm"
                    >
                      <X size={14} />
                      Undo
                    </Button>
                  )}
                  
                  {/* Small Hazard Icon for Problem Reporting */}
                  <button
                    onClick={() => {
                      const problem = prompt("Describe the problem:");
                      if (problem) {
                        setQuestionProblems({...questionProblems, [question.id]: problem});
                      }
                    }}
                    className={`p-2 rounded-lg transition-all ${
                      problemText 
                        ? 'bg-red-100 text-red-600' 
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                    title="Report a problem"
                  >
                    <AlertTriangle size={16} />
                  </button>
                </div>

                {problemText && (
                  <div className="ml-9 mt-2 p-2 bg-red-50 border-l-2 border-red-400 rounded">
                    <p className="text-xs text-red-700">
                      <strong>Problem:</strong> {problemText}
                    </p>
                  </div>
                )}
              </Card>
            );
          })}
        </div>

        <button 
          onClick={onAskAI}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg shadow-md hover:shadow-lg active:scale-95 transition-all font-semibold flex items-center justify-center gap-2 mb-3"
        >
          <Sparkles size={18} />
          <span>Ask AI</span>
        </button>

        <div className="mt-3 flex gap-3">
          {currentPage > 0 && (
            <Button 
              onClick={() => setCurrentPage(currentPage - 1)}
              variant="secondary"
              className="flex-1"
            >
              <ChevronLeft size={18} />
              Back
            </Button>
          )}
          
          {currentPage < pages.length - 1 && allQuestionsComplete && (
            <Button 
              onClick={() => setCurrentPage(currentPage + 1)}
              variant="primary"
              className="flex-1"
            >
              Next
              <ChevronRight size={18} />
            </Button>
          )}

          {currentPage === pages.length - 1 && allQuestionsComplete && (
            <Button 
              onClick={handleFinalComplete}
              variant="success"
              className="w-full"
            >
              <CheckCircle size={18} />
              Complete Monthly Deep Clean!
            </Button>
          )}
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm mt-5">
          <h3 className="font-semibold text-sm mb-3 text-gray-600">PROGRESS</h3>
          <div className="grid grid-cols-7 gap-2">
            {pages.map((_, idx) => (
              <div 
                key={idx}
                className={`h-2 rounded-full transition-all cursor-pointer ${
                  idx === currentPage 
                    ? 'bg-blue-600' 
                    : idx < currentPage
                      ? 'bg-green-500' 
                      : 'bg-gray-200'
                }`}
                onClick={() => setCurrentPage(idx)}
              />
            ))}
          </div>
        </div>
      </div>

    </div>
    </SwipeBackWrapper>
  );
};

// --- 8. QUICK FIX DIAGNOSTIC TOOL ---

const QuickFixTool = ({ onClose }) => {
  const [selectedError, setSelectedError] = useState(null);

  const errors = [
    {
      id: 'power_failure',
      name: 'Power Failure / Trip',
      icon: Power,
      color: 'red',
      symptoms: 'Machine won\'t turn on, no lights, or power shuts off suddenly',
      causes: [
        'Power plug not fully inserted',
        'Water leaked inside and caused a short',
        'Safety breaker tripped'
      ],
      fixes: [
        'Check wall outlet - is it working? Try plugging in your phone',
        'Check power cord is fully plugged into machine',
        'Look inside - is anything wet? If yes, call support immediately',
        'Check breaker panel - flip breaker off then back on',
        'If power box light is off, fuse may be blown - call support'
      ],
      videoTitle: 'Fix: Power Failure Troubleshooting'
    },
    {
      id: 'water_shortage',
      name: 'No Water / Water Shortage',
      icon: Droplet,
      color: 'blue',
      symptoms: 'Machine says "No Water" or drinks come out without water',
      causes: [
        'Water buckets are empty',
        'Wall water valve is turned off',
        'Water sensor is stuck or broken'
      ],
      fixes: [
        'Check water buckets - are they full?',
        'Look behind machine - is water valve open? (Turn handle parallel to pipe)',
        'Check water level switch - is it floating? Give it a gentle tap',
        'Look for kinked or bent water tubes',
        'Run test: Mode → Coffee Test → Pump'
      ],
      videoTitle: 'Fix: No Water Error'
    },
    {
      id: 'pump_timeout',
      name: 'Pump Timeout',
      icon: AlertTriangle,
      color: 'blue',
      symptoms: 'Machine says "Pump Timeout" or water pump runs but nothing happens',
      causes: [
        'Water pump is broken',
        'Water tube is crushed or bent',
        'No water in bucket'
      ],
      fixes: [
        'Check water buckets have water in them',
        'Listen - does pump make noise when it tries? If silent, pump may be dead',
        'Look for bent or kinked tubes - straighten them out',
        'If pump hums but no water, it might be broken - call support'
      ],
      videoTitle: 'Fix: Pump Timeout'
    },
    {
      id: 'grinder_timeout',
      name: 'Grinder Timeout / Grinding Failure',
      icon: AlertTriangle,
      color: 'red',
      symptoms: 'Machine says "Bean Grinding Timeout" or grinder makes noise but no coffee comes out',
      causes: [
        'Baffle is closed (blocking beans from falling)',
        'Bean hopper is empty',
        'Grinder motor is jammed or broken',
        'Grinder is set too fine and coffee is stuck'
      ],
      fixes: [
        'Check bean hopper - is it full of beans?',
        'Find the BAFFLE TAB and PULL IT ALL THE WAY OUT (it slides like a drawer)',
        'Shake bean hopper gently to loosen stuck beans',
        'Try running: Mode → Coffee Test → Grinder',
        'Check wires to grinder motor - are they loose?',
        'If grinder doesn\'t spin at all, motor may be dead - call support'
      ],
      videoTitle: 'Fix: Grinder Timeout and Baffle'
    },
    {
      id: 'powder_failure',
      name: 'Powder Failure',
      icon: Package,
      color: 'yellow',
      symptoms: 'Machine says "Powder Failure" or powder doesn\'t dispense',
      causes: [
        'Powder sensor switch is broken',
        'Powder is clumped or stuck'
      ],
      fixes: [
        'Check powder test switch - is it clicking when you press it?',
        'Look inside powder canister - is powder clumped? Break it up',
        'Check if sensor wire is loose or disconnected',
        'Clean powder sensor with dry cloth',
        'If switch doesn\'t click, it may be dead - call support'
      ],
      videoTitle: 'Fix: Powder Sensor Issues'
    },
    {
      id: 'brew_timeout',
      name: 'Brew Timeout',
      icon: Coffee,
      color: 'red',
      symptoms: 'Machine says "Brew Timeout" or brewing takes forever',
      causes: [
        'Too much coffee powder in the brewer',
        'Brewing motor is stuck or broken',
        'Upper/lower sensor switches are bad',
        'Coffee grounds fell into cartridge'
      ],
      fixes: [
        'Open brewer - is there excess powder built up? Clean it out',
        'Check for coffee grounds that fell into the brewing cartridge',
        'Test brewing motor - does it move when you run Coffee Test → Brew?',
        'Check power wires to brewing motor - are they connected?',
        'If motor doesn\'t move, it may be broken - call support'
      ],
      videoTitle: 'Fix: Brew Timeout'
    },
    {
      id: 'cup_drop_timeout',
      name: 'Cup Drop Timeout',
      icon: XCircle,
      color: 'orange',
      symptoms: 'Machine says "Cup Drop Timeout" or cups don\'t drop',
      causes: [
        'Cups are stuck together',
        'Cup path is dirty and sticky',
        'Infrared sensors (the little black eyes) are dirty or broken',
        'Cup stopper is squeezingcups too tight'
      ],
      fixes: [
        'Rotate the cup stack to loosen stuck cups',
        'CLEAN THE CUP PATH - this is the most common fix! Wipe the slide path with wet cloth',
        'Wipe the black infrared sensor eyes with clean cloth',
        'Check cup stopper screws - adjust if cups are getting crushed',
        'Make sure all cups are the same size',
        'Test: Mode → Coffee Test → Cup Drop',
        'Check sensor wires - are they plugged in?'
      ],
      videoTitle: 'Fix: Cup Drop Timeout'
    },
    {
      id: 'mouth_timeout',
      name: 'Mouth Move Timeout',
      icon: AlertTriangle,
      color: 'yellow',
      symptoms: 'Machine says "Mouth Move Timeout" or nozzle won\'t move',
      causes: [
        'Nozzle is stuck with dried syrup',
        'Nozzle motor is broken',
        'Something is blocking the nozzle path'
      ],
      fixes: [
        'Gently wiggle the dispensing nozzle by hand',
        'Wipe away sticky syrup residue with wet cloth',
        'Check nothing is blocking the nozzle (like a cup or ice cube)',
        'Check voltage to nozzle motor - are wires connected?',
        'Test: Mode → Coffee Test → Mouth Movement',
        'If motor doesn\'t move at all, it may be dead - call support'
      ],
      videoTitle: 'Fix: Mouth Move Timeout'
    },
    {
      id: 'door_failure',
      name: 'Electric Door Fail',
      icon: ShieldAlert,
      color: 'red',
      symptoms: 'Machine says "Electric Door Fail" or door won\'t open/close',
      causes: [
        'Door motor is broken',
        'Trash or object is blocking the door',
        'Electromagnet isn\'t getting power',
        'Door is stuck and interfering with motor'
      ],
      fixes: [
        'Clear any trash near the door path',
        'Check if door motor turns on - listen for sound',
        'Check if electromagnet clicks when machine tries to open door',
        'Check door wires - are they connected?',
        'Gently help door close by hand to see if it\'s stuck',
        'Power off, wait 30 seconds, power on to reset',
        'If motor doesn\'t work, may be broken - call support'
      ],
      videoTitle: 'Fix: Electric Door Issues'
    },
    {
      id: 'temperature_sensor',
      name: 'Temperature Sensor Failure',
      icon: AlertTriangle,
      color: 'orange',
      symptoms: 'Machine shows wrong temperature or says "Temperature Sensor Failure"',
      causes: [
        'Temperature sensor is broken or disconnected',
        'Sensor wires are loose',
        'Overheat protector is triggered'
      ],
      fixes: [
        'Check displayed temperature - is it obviously wrong (like 0° or 999°)?',
        'Check sensor wires - are they connected tight?',
        'Check for overheat protector - it may have clicked off',
        'Let machine cool down for 30 minutes if it was running hot',
        'If sensor reading is crazy, it may be broken - call support'
      ],
      videoTitle: 'Fix: Temperature Sensor'
    },
    {
      id: 'flowmeter_failure',
      name: 'Flowmeter Failure',
      icon: Droplet,
      color: 'blue',
      symptoms: 'Water amount is wrong or machine says "Flowmeter Failure"',
      causes: [
        'Flowmeter is clogged with sediment',
        'Flowmeter is broken'
      ],
      fixes: [
        'Check flowmeter power supply - is it getting electricity?',
        'Remove flowmeter and look inside - is it clogged? Rinse it out',
        'Check flowmeter wires - are they connected?',
        'If cleaning doesn\'t help, flowmeter may be dead - replace it'
      ],
      videoTitle: 'Fix: Flowmeter Issues'
    },
    {
      id: 'too_little_coffee',
      name: 'Too Little Coffee / Weak Drinks',
      icon: Coffee,
      color: 'yellow',
      symptoms: 'Drinks are weak, watery, or have very little coffee',
      causes: [
        'Flowmeter is clogged',
        'Brewer is clogged',
        'Pressure relief valve is leaking'
      ],
      fixes: [
        'Clean flowmeter - remove and rinse out sediment',
        'Check brewer back pressure spring - is it clean?',
        'Check pressure relief valve - if it leaks, replace it',
        'Run descaling program to clear clogs'
      ],
      videoTitle: 'Fix: Weak Coffee Output'
    },
    {
      id: 'communication_fail',
      name: 'Communication Failure',
      icon: WifiOff,
      color: 'red',
      symptoms: 'Machine says "Communication Fail" or screens are frozen',
      causes: [
        'Serial cable is unplugged or loose',
        'Cable is damaged'
      ],
      fixes: [
        'Check serial cable (looks like old computer cable) - is it plugged in tight?',
        'Unplug and re-plug both ends of serial cable',
        'Look for bent pins in cable connector',
        'If cable looks damaged, replace it',
        'Power cycle machine to reset communication'
      ],
      videoTitle: 'Fix: Communication Errors'
    },
    {
      id: 'ice_machine_water',
      name: 'Ice Machine: No Water',
      icon: Droplet,
      color: 'blue',
      symptoms: 'Ice machine says "No Water" or won\'t make ice',
      causes: [
        'Water pump wires are disconnected',
        'Water tubes are bent or blocked',
        'Water tank float switch is broken'
      ],
      fixes: [
        'Check water pump wires - are they connected?',
        'Straighten any bent or kinked water tubes',
        'Clean water inlet nozzles',
        'Check water tank float switch - is it moving freely?',
        'If float is stuck, replace it'
      ],
      videoTitle: 'Fix: Ice Machine Water Issues'
    },
    {
      id: 'ice_outlet_blocked',
      name: 'Ice Machine: Ice Outlet Blocked',
      icon: AlertTriangle,
      color: 'blue',
      symptoms: 'Ice won\'t dispense or ice is stuck in the chute',
      causes: [
        'Ice cubes are stuck in the outlet',
        'Too much ice built up'
      ],
      fixes: [
        'Clear ice outlet manually - break up stuck ice',
        'Run hot water through ice chute to melt blockage',
        'Check ice bucket - is it overflowing?'
      ],
      videoTitle: 'Fix: Ice Outlet Blockage'
    }
  ];

  const handleSwipeBack = () => {
    if (selectedError) {
      setSelectedError(null);
    } else {
      onClose();
    }
  };

  return (
    <SwipeBackWrapper onBack={handleSwipeBack}>
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-white pb-24">
      <div className="bg-red-600 text-white p-6 shadow-lg sticky-header">
        <div className="flex items-center justify-between sticky-header-safe">
          <div className="flex items-center gap-3">
            <AlertTriangle size={28} />
            <div>
              <h1 className="text-2xl font-bold">Quick Fix Tool</h1>
              <p className="text-red-100 text-sm">Fix common errors fast</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white hover:bg-red-500 p-2 rounded-lg touch-target">
            <X size={24} />
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-6">
        {!selectedError ? (
          <div className="space-y-3">
            <h2 className="text-lg font-bold mb-4">What error are you seeing?</h2>
            {errors.map(error => {
              const IconComponent = error.icon;
              return (
                <Card 
                  key={error.id}
                  className="p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => setSelectedError(error)}
                >
                  <div className="flex items-center gap-3">
                    <div className={`bg-${error.color}-100 text-${error.color}-600 p-3 rounded-lg`}>
                      <IconComponent size={24} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold">{error.name}</h3>
                      <p className="text-sm text-gray-600">{error.symptoms}</p>
                    </div>
                    <ChevronRight size={20} className="text-gray-400" />
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <div>
            <Button 
              onClick={() => setSelectedError(null)}
              variant="secondary"
              className="mb-4"
            >
              <ChevronLeft size={18} />
              Back to Error List
            </Button>

            <Card className="p-6">
              <div className="flex items-start gap-4 mb-4">
                <div className={`bg-${selectedError.color}-100 text-${selectedError.color}-600 p-4 rounded-lg`}>
                  {React.createElement(selectedError.icon, { size: 32 })}
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold mb-2">{selectedError.name}</h2>
                  <p className="text-gray-600">{selectedError.symptoms}</p>
                </div>
              </div>

              <WatchVideoButton videoTitle={selectedError.videoTitle} />

              <div className="mt-6">
                <h3 className="font-bold mb-3 flex items-center gap-2">
                  <Info size={18} />
                  Why This Happens
                </h3>
                <ul className="space-y-2 mb-6">
                  {selectedError.causes.map((cause, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-gray-700">
                      <span className="text-red-500 font-bold">•</span>
                      <span>{cause}</span>
                    </li>
                  ))}
                </ul>

                <h3 className="font-bold mb-3 flex items-center gap-2">
                  <Wrench size={18} />
                  How to Fix It
                </h3>
                <div className="space-y-3">
                  {selectedError.fixes.map((fix, idx) => (
                    <div 
                      key={idx} 
                      className="flex items-start gap-3 p-3 rounded-lg bg-green-50 border border-green-200"
                    >
                      <div className="bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0">
                        {idx + 1}
                      </div>
                      <span className="text-gray-800">{fix}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
    </SwipeBackWrapper>
  );
};

// --- 8. INSTALL APP GUIDE (PWA Instructions) ---

// Helper to detect if app is already installed (running in standalone mode)
const isAppInstalled = () => {
  if (typeof window === 'undefined') return false;
  // iOS: Check navigator.standalone
  if (window.navigator.standalone === true) return true;
  // Android: Check display-mode media query
  if (typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches) return true;
  return false;
};

const InstallAppGuide = ({ onClose }) => {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  
  return (
    <div className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 text-center">
          <div className="text-4xl mb-3">📲</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Save App to Home Screen</h2>
          <p className="text-gray-500 text-sm mb-6">Open it like a regular app - no browser needed!</p>
          
          {isIOS ? (
            <div className="bg-blue-50 rounded-2xl p-4 mb-6 text-left">
              <p className="font-bold text-blue-900 mb-3">3 Simple Steps:</p>
              <ol className="space-y-3 text-sm text-blue-800">
                <li className="flex items-center gap-2">
                  <span className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">1</span>
                  Tap the <strong>Share</strong> button (square with arrow)
                </li>
                <li className="flex items-center gap-2">
                  <span className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">2</span>
                  Tap <strong>Add to Home Screen</strong>
                </li>
                <li className="flex items-center gap-2">
                  <span className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">3</span>
                  Tap <strong>Add</strong> - Done!
                </li>
              </ol>
            </div>
          ) : (
            <div className="bg-green-50 rounded-2xl p-4 mb-6 text-left">
              <p className="font-bold text-green-900 mb-3">3 Simple Steps:</p>
              <ol className="space-y-3 text-sm text-green-800">
                <li className="flex items-center gap-2">
                  <span className="bg-green-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">1</span>
                  Tap the <strong>Menu</strong> (3 dots at top)
                </li>
                <li className="flex items-center gap-2">
                  <span className="bg-green-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">2</span>
                  Tap <strong>Install app</strong> or <strong>Add to Home</strong>
                </li>
                <li className="flex items-center gap-2">
                  <span className="bg-green-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">3</span>
                  Tap <strong>Install</strong> - Done!
                </li>
              </ol>
            </div>
          )}
          
          <button 
            onClick={onClose}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-colors"
          >
            Got it!
          </button>
          
          <button 
            onClick={onClose}
            className="mt-2 text-sm text-gray-400 hover:text-gray-600"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
};

// --- 8A. HELP & SAFETY CENTER (Videos 22-26) ---

const CONTENT_MAP_VERSION = '1.0.0';

const WORKFLOW_CONTENT_MAP = {
  weekly_visit: {
    displayName: 'Weekly Visit',
    duration: '~20 minutes',
    steps: [
      { title: 'Select Site', required: true },
      { title: 'Take Initial Photo', required: true, proof: true },
      { title: 'Check for Leaks', required: true },
      { title: 'Machine Status', required: true },
      { title: 'Verify Cleaning', required: true },
      { title: 'Take Syrups Photo', required: true, proof: true },
      { title: 'Report Problems', required: false },
      { title: 'Review & Submit', required: true }
    ]
  },
  monthly_deep_clean: {
    displayName: 'Monthly Deep Clean',
    duration: '~90 minutes',
    steps: [
      { title: 'Select Site', required: true },
      { title: 'Initial Inspection', required: true, proof: true },
      { title: 'Begin Disassembly', required: true },
      { title: 'Canister Deep Clean', required: true, proof: true },
      { title: 'Grinder Deep Clean', required: true, proof: true },
      { title: 'Sanitization', required: true },
      { title: 'Reassembly', required: true },
      { title: 'Test Run', required: true },
      { title: 'Final Photos', required: true, proof: true },
      { title: 'Review & Submit', required: true }
    ]
  },
  refill: {
    displayName: 'Refill',
    duration: '~10 minutes',
    steps: [
      { title: 'Select Closet', required: true },
      { title: 'Before Photo', required: true, proof: true },
      { title: 'Complete Refill', required: true },
      { title: 'Matcha Condition', required: true },
      { title: 'After Photo', required: true, proof: true },
      { title: 'Report Issues', required: false },
      { title: 'Submit', required: true }
    ]
  },
  delivery_acceptance: {
    displayName: 'Delivery Acceptance',
    duration: '~5 minutes',
    steps: [
      { title: 'Review Delivery', required: true },
      { title: 'Inspect Each Box', required: true },
      { title: 'Accept or Refuse', required: true },
      { title: 'Refusal Reason', required: 'conditional' },
      { title: 'Refusal Photo', required: 'conditional', proof: true },
      { title: 'Confirm Decision', required: true }
    ]
  }
};

const HelpSafetyCenter = ({ onClose, onStartOnboarding }) => {
  const [selectedItem, setSelectedItem] = useState(null);
  const [showInstallGuide, setShowInstallGuide] = useState(false);
  const [showContentMap, setShowContentMap] = useState(false);

  const helpItems = [
    {
      id: 'emergency',
      icon: AlertTriangle,
      title: 'Emergency: Smoke / Burning Smell / Sparks',
      description: 'What to do in an emergency situation',
      videoTitle: 'Emergency: Smoke / Burning Smell / Sparks',
      details: '1. Power off at wall or breaker immediately\n2. Unplug the machine\n3. Mark "Out of Service" on the machine\n4. Log an emergency ticket in the app\n5. Wait for support guidance'
    },
    {
      id: 'power_reboot',
      icon: Settings,
      title: 'Power: Safe Power-Off and Reboot',
      description: 'How to safely shut down and restart the machine',
      videoTitle: 'Power: Safe Power-Off and Reboot Sequence',
      details: '1. From the main screen, navigate to Power\n2. Select "Shutdown"\n3. Wait 30 seconds after power off\n4. Turn power back on\n5. Machine will reboot automatically'
    },
    {
      id: 'mode_menu',
      icon: Lock,
      title: 'Entering "Mode" / Technician Menu',
      description: 'Access the technician settings and menus',
      videoTitle: 'Entering "Mode" / Technician Menu',
      details: '1. From main screen, press physical Mode button\n2. You may be asked for a PIN\n3. Browse menus: Coffee Test, Settings, etc.\n4. Press Mode again to exit\n5. Common: Settings → Cleaning, Replenishment'
    },
    {
      id: 'make_latte',
      icon: Coffee,
      title: 'Make a Latte (Coffee Test)',
      description: 'Run a test drink to verify the machine works',
      videoTitle: 'Make a Latte (Coffee Test)',
      details: '1. Enter MODE menu (press physical Mode button)\n2. Find "Coffee Test" or "Test Drink"\n3. Select "Latte" from drink options\n4. Place cup under spout\n5. Press Start/OK button\n6. Machine makes a test latte\n7. Check quality and flavor\n8. Press Mode to exit when done'
    },
    {
      id: 'clean_all',
      icon: FileText,
      title: 'Running the "Clean All" Program',
      description: 'How to run the full cleaning and descaling cycle',
      videoTitle: 'Running the "Clean All" Program',
      details: '1. Place collection bucket under drain\n2. Enter Mode menu\n3. Navigate to Cleaning → Clean All\n4. Confirm start\n5. Program runs ~20 mins. Do NOT interrupt.\n6. Follow prompts to finish'
    },
    {
      id: 'app_visit',
      icon: CheckCircle,
      title: 'App: Starting and Completing a Visit',
      description: 'How to use the app for weekly and monthly visits',
      videoTitle: 'App: Starting and Completing a Visit',
      details: '1. Open JOLT app on your phone\n2. Tap "Start Visit" (Weekly or Monthly)\n3. Follow each step in order\n4. Watch videos for guidance\n5. Add photos when prompted\n6. Answer all questions\n7. Tap "Complete Visit" at the end'
    },
    {
      id: 'content_map',
      icon: FileText,
      title: 'View Workflow Content Map',
      description: 'See all workflows, steps, and proof requirements',
      isContentMap: true
    },
    {
      id: 'training',
      icon: BookOpen,
      title: 'New to SIPJOLT? Start Training',
      description: 'Learn the basics: photos, GPS, deadlines, and recovery',
      isTraining: true
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white pb-24">
      <div className="bg-slate-700 text-white p-6 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Info size={28} />
            <div>
              <h1 className="text-2xl font-bold">Help & Safety Center</h1>
              <p className="text-slate-100 text-sm">Emergency procedures and app guide</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white hover:bg-slate-600 p-2 rounded-lg">
            <X size={24} />
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-6">
        {!selectedItem ? (
          <div className="space-y-3">
            <h2 className="text-lg font-bold mb-4">Select a topic:</h2>
            {helpItems.map(item => {
              const IconComponent = item.icon;
              return (
                <Card 
                  key={item.id}
                  className="p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => item.isTraining ? onStartOnboarding() : (item.isContentMap ? setShowContentMap(true) : setSelectedItem(item))}
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-50 text-blue-600 p-3 rounded-lg">
                      <IconComponent size={24} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold">{item.title}</h3>
                      <p className="text-sm text-gray-600">{item.description}</p>
                    </div>
                    <ChevronRight size={20} className="text-gray-400" />
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <div>
            <Button 
              onClick={() => setSelectedItem(null)}
              variant="secondary"
              className="mb-4"
            >
              <ChevronLeft size={18} />
              Back
            </Button>

            <Card className="p-6">
              <div className="flex items-start gap-4 mb-4">
                <div className="bg-blue-50 text-blue-600 p-4 rounded-lg">
                  {React.createElement(selectedItem.icon, { size: 32 })}
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold mb-2">{selectedItem.title}</h2>
                  <p className="text-gray-600">{selectedItem.description}</p>
                </div>
              </div>

              <WatchVideoButton videoTitle={selectedItem.videoTitle} />

              <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-bold mb-3 flex items-center gap-2">
                  <FileText size={18} className="text-blue-600" />
                  Steps
                </h3>
                <div className="whitespace-pre-wrap text-gray-800 text-sm leading-relaxed">
                  {selectedItem.details}
                </div>
              </div>

              {/* Install App Button */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <button 
                  onClick={() => setShowInstallGuide(true)}
                  className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  <span>📱</span>
                  <span>Add App to Home Screen</span>
                </button>
              </div>
            </Card>
          </div>
        )}

        {showInstallGuide && <InstallAppGuide onClose={() => setShowInstallGuide(false)} />}
        
        {showContentMap && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[85vh] overflow-hidden flex flex-col">
              <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-blue-600 to-blue-700">
                <div className="flex items-center gap-3">
                  <FileText className="w-6 h-6 text-white" />
                  <div>
                    <h2 className="text-lg font-semibold text-white">Content Map</h2>
                    <p className="text-xs text-blue-100">Version {CONTENT_MAP_VERSION} - Read Only</p>
                  </div>
                </div>
                <button onClick={() => setShowContentMap(false)} className="p-2 hover:bg-white/10 rounded-lg">
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-sm text-yellow-800 font-medium">Content is locked and versioned</p>
                  <p className="text-xs text-yellow-600 mt-1">These workflows cannot be modified by end-users</p>
                </div>
                
                {Object.entries(WORKFLOW_CONTENT_MAP).map(([id, workflow]) => (
                  <div key={id} className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-gray-50 p-3 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-gray-900">{workflow.displayName}</h3>
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">{workflow.duration}</span>
                      </div>
                    </div>
                    <div className="p-3 space-y-2">
                      {workflow.steps.map((step, index) => (
                        <div key={index} className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step.required === true ? 'bg-blue-600 text-white' : step.required === 'conditional' ? 'bg-yellow-500 text-white' : 'bg-gray-300 text-gray-700'}`}>
                            {index + 1}
                          </div>
                          <span className="flex-1 text-sm text-gray-800">{step.title}</span>
                          {step.proof && <Camera className="w-4 h-4 text-gray-500" />}
                          {step.required === 'conditional' && <span className="text-xs text-yellow-600">If refusing</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <h4 className="font-medium text-blue-800 mb-2">Photo Requirements</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4" /> Photos capture GPS location</li>
                    <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4" /> Timestamps are embedded</li>
                    <li className="flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-red-500" /> Refusal photos are mandatory</li>
                  </ul>
                </div>
              </div>
              
              <div className="p-3 border-t border-gray-200 bg-gray-50 text-center">
                <p className="text-xs text-gray-500">Contact your manager for workflow questions</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// --- 7D. DELIVERY ACCEPTANCE MODAL ---

const DeliveryAcceptanceModal = ({ delivery, user, onAccept, onRefuse, onClose }) => {
  const [mode, setMode] = useState('review'); // review, refuse
  const [refusalReason, setRefusalReason] = useState(null);
  const [refusalPhoto, setRefusalPhoto] = useState(null);
  const [refusalNotes, setRefusalNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const refusalReasons = [
    { id: 'wet_leak', label: 'Wet / Leaking', icon: '💧', requiresPhoto: true },
    { id: 'missing_box', label: 'Missing Box', icon: '📦', requiresPhoto: false },
    { id: 'access_issue', label: 'Access Issue', icon: '🚪', requiresPhoto: false },
    { id: 'other', label: 'Other', icon: '❓', requiresPhoto: false }
  ];

  const selectedReason = refusalReasons.find(r => r.id === refusalReason);

  const handlePhotoCapture = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setRefusalPhoto(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleAccept = async () => {
    setSubmitting(true);
    try {
      const response = await fetch(`/api/ops/deliveries/${delivery.delivery_id}/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.displayName || 'tech-001',
          'x-user-name': user?.displayName || 'Technician',
          'x-user-role': 'technician'
        }
      });
      
      if (response.ok) {
        onAccept?.();
      } else {
        const data = await response.json();
        alert('Error: ' + (data.error || 'Failed to accept'));
      }
    } catch (error) {
      console.error('Failed to accept:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRefuse = async () => {
    if (!refusalReason) return;
    if (selectedReason?.requiresPhoto && !refusalPhoto) {
      alert('Photo required for this refusal reason');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`/api/ops/deliveries/${delivery.delivery_id}/refuse`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.displayName || 'tech-001',
          'x-user-name': user?.displayName || 'Technician',
          'x-user-role': 'technician'
        },
        body: JSON.stringify({
          reason: refusalReason,
          photo: refusalPhoto,
          notes: refusalNotes
        })
      });
      
      if (response.ok) {
        onRefuse?.();
      } else {
        const data = await response.json();
        alert('Error: ' + (data.error || 'Failed to refuse'));
      }
    } catch (error) {
      console.error('Failed to refuse:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl max-h-[80vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">
            {mode === 'review' ? 'Review Delivery' : 'Refuse Delivery'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X size={20} />
          </button>
        </div>

        <div className="p-4">
          {mode === 'review' && (
            <>
              <div className="bg-blue-50 rounded-xl p-4 mb-4">
                <div className="flex items-center gap-3 mb-2">
                  <Truck size={24} className="text-blue-600" />
                  <div>
                    <p className="font-bold text-gray-900">Shipment #{delivery.shipment_id}</p>
                    <p className="text-sm text-gray-500">
                      Delivered {new Date(delivery.delivered_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                {delivery.pod_photo_url && (
                  <img src={delivery.pod_photo_url} alt="Proof of delivery" className="w-full rounded-lg mt-3" />
                )}
              </div>

              <p className="text-gray-600 mb-6 text-center">
                Did you receive this delivery in good condition?
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setMode('refuse')}
                  className="flex-1 py-4 rounded-xl border-2 border-red-300 bg-red-50 text-red-700 font-semibold"
                >
                  Refuse
                </button>
                <button
                  onClick={handleAccept}
                  disabled={submitting}
                  className="flex-1 py-4 rounded-xl bg-green-600 text-white font-semibold"
                >
                  {submitting ? 'Accepting...' : 'Accept'}
                </button>
              </div>
            </>
          )}

          {mode === 'refuse' && (
            <>
              <p className="text-gray-600 mb-4">Why are you refusing this delivery?</p>
              
              <div className="space-y-2 mb-4">
                {refusalReasons.map(reason => (
                  <button
                    key={reason.id}
                    onClick={() => setRefusalReason(reason.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                      refusalReason === reason.id ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <span className="text-xl">{reason.icon}</span>
                    <span className="font-medium">{reason.label}</span>
                    {refusalReason === reason.id && <Check size={20} className="ml-auto text-red-500" />}
                  </button>
                ))}
              </div>

              {selectedReason?.requiresPhoto && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Photo required:</p>
                  {refusalPhoto ? (
                    <div className="relative">
                      <img src={refusalPhoto} alt="Refusal" className="w-full rounded-xl" />
                      <button onClick={() => setRefusalPhoto(null)} className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full">
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <label className="block w-full py-8 border-2 border-dashed border-red-300 rounded-xl text-center cursor-pointer hover:bg-red-50">
                      <Camera size={32} className="mx-auto text-red-500 mb-2" />
                      <p className="font-medium text-red-600">Take photo of issue</p>
                      <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhotoCapture} />
                    </label>
                  )}
                </div>
              )}

              <textarea
                value={refusalNotes}
                onChange={(e) => setRefusalNotes(e.target.value)}
                placeholder="Additional notes (optional)..."
                className="w-full p-3 border border-gray-200 rounded-lg resize-none mb-4"
                rows={3}
              />

              <div className="flex gap-3">
                <button
                  onClick={() => setMode('review')}
                  className="flex-1 py-3 rounded-xl border border-gray-300 font-semibold text-gray-700"
                >
                  Back
                </button>
                <button
                  onClick={handleRefuse}
                  disabled={!refusalReason || (selectedReason?.requiresPhoto && !refusalPhoto) || submitting}
                  className={`flex-1 py-3 rounded-xl font-semibold ${
                    refusalReason && (!selectedReason?.requiresPhoto || refusalPhoto) && !submitting
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-200 text-gray-400'
                  }`}
                >
                  {submitting ? 'Submitting...' : 'Confirm Refusal'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// --- 7E. DRIVER DASHBOARD ---

const DriverDashboard = ({ user, onLogout }) => {
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [podPhoto, setPodPhoto] = useState(null);

  useEffect(() => {
    loadShipments();
  }, []);

  const loadShipments = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/ops/shipments', {
        headers: {
          'x-user-id': user?.driverId || 'driver-001',
          'x-user-name': user?.displayName || 'Driver',
          'x-user-role': 'driver'
        }
      });
      if (response.ok) {
        const data = await response.json();
        setShipments(data.shipments || []);
      }
    } catch (error) {
      console.error('Failed to load shipments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteDelivery = async (shipment) => {
    try {
      const response = await fetch(`/api/ops/shipments/${shipment.shipment_id}/deliver`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.driverId || 'driver-001',
          'x-user-name': user?.displayName || 'Driver',
          'x-user-role': 'driver'
        },
        body: JSON.stringify({ 
          pod_photo_url: podPhoto || 'https://example.com/pod.jpg',
          notes: 'Delivered successfully'
        })
      });
      if (response.ok) {
        alert('Delivery completed!');
        setSelectedShipment(null);
        setPodPhoto(null);
        loadShipments();
      } else {
        alert('Failed to complete delivery');
      }
    } catch (error) {
      console.error('Delivery error:', error);
      alert('Failed to complete delivery');
    }
  };

  const pendingDeliveries = shipments.filter(s => s.status === 'shipped');
  const completedToday = shipments.filter(s => s.status === 'delivered');

  if (selectedShipment) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-green-600 pt-12 pb-6 px-4">
          <button 
            onClick={() => setSelectedShipment(null)}
            className="flex items-center gap-2 text-white/90 hover:text-white mb-4"
          >
            <ChevronLeft className="w-5 h-5" />
            Back to Deliveries
          </button>
          <h1 className="text-xl font-bold text-white">Delivery Details</h1>
        </div>

        <div className="p-4 space-y-4">
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-2">{selectedShipment.venue_name}</h2>
            <p className="text-sm text-gray-600 mb-4">{selectedShipment.total_boxes} boxes to deliver</p>
            
            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-3 text-gray-700">
                <MapPin className="w-5 h-5 text-gray-400" />
                <span className="text-sm">Address details here</span>
              </div>
              <div className="flex items-center gap-3 text-gray-700">
                <Package className="w-5 h-5 text-gray-400" />
                <span className="text-sm">{selectedShipment.total_boxes} boxes</span>
              </div>
            </div>

            <div className="border-t pt-4">
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Proof of Delivery Photo
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center">
                <Camera className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Tap to capture POD photo</p>
              </div>
            </div>

            <button 
              onClick={() => handleCompleteDelivery(selectedShipment)}
              className="w-full mt-6 py-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors"
            >
              <CheckCircle className="w-5 h-5" />
              Complete Delivery
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-green-600 pt-12 pb-6 px-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-white">Driver Dashboard</h1>
          <button 
            onClick={onLogout}
            className="flex items-center gap-2 text-white/80 hover:text-white text-sm bg-white/20 px-3 py-1.5 rounded-full"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
        <p className="text-green-100 text-sm">Welcome, {user?.displayName || 'Driver'}</p>
      </div>

      <div className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <p className="text-2xl font-bold text-green-600">{pendingDeliveries.length}</p>
            <p className="text-sm text-gray-500">Pending</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <p className="text-2xl font-bold text-gray-600">{completedToday.length}</p>
            <p className="text-sm text-gray-500">Completed</p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Pending Deliveries</h2>
          <button 
            onClick={loadShipments}
            className="p-2 rounded-lg hover:bg-gray-100"
            disabled={loading}
          >
            <RefreshCw className={`w-5 h-5 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {loading ? (
          <div className="bg-white rounded-2xl p-8 text-center">
            <RefreshCw className="w-8 h-8 text-gray-300 mx-auto mb-2 animate-spin" />
            <p className="text-gray-500">Loading deliveries...</p>
          </div>
        ) : pendingDeliveries.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center">
            <Truck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No pending deliveries</p>
            <p className="text-sm text-gray-400 mt-1">Check back later for new assignments</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingDeliveries.map(shipment => (
              <button
                key={shipment.shipment_id}
                onClick={() => setSelectedShipment(shipment)}
                className="w-full bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-4 hover:border-green-200 transition-colors"
              >
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <Package className="w-6 h-6 text-green-600" />
                </div>
                <div className="text-left flex-1">
                  <h3 className="font-bold text-gray-900">{shipment.venue_name || `Site ${shipment.site_id}`}</h3>
                  <p className="text-sm text-gray-500">{shipment.total_boxes} boxes</p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// --- 7D. OPS MANAGER CONSOLE ---

const OpsManagerConsole = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [sites, setSites] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [shipments, setShipments] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchWithRole = async (url) => {
    const response = await fetch(url, {
      headers: {
        'x-user-id': 'ops-001',
        'x-user-name': user?.displayName || 'Ops Manager',
        'x-user-role': 'ops_manager'
      }
    });
    if (!response.ok) throw new Error('Request failed');
    return response.json();
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [sitesRes, incidentsRes, shipmentsRes, tasksRes] = await Promise.all([
        fetchWithRole('/api/ops/sites'),
        fetchWithRole('/api/ops/incidents'),
        fetchWithRole('/api/ops/shipments'),
        fetchWithRole('/api/ops/tasks')
      ]);
      setSites(sitesRes.sites || []);
      setIncidents(incidentsRes.incidents || []);
      setShipments(shipmentsRes.shipments || []);
      setTasks(tasksRes.tasks || []);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    totalSites: sites.length,
    openIncidents: incidents.filter(i => i.status === 'open' || i.status === 'escalated').length,
    pendingShipments: shipments.filter(s => s.status === 'pending' || s.status === 'shipped').length,
    overdueTasks: tasks.filter(t => t.status === 'pending' && new Date(t.due_date) < new Date()).length
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'sites', label: 'Sites', icon: Building2 },
    { id: 'incidents', label: 'Incidents', icon: AlertTriangle },
    { id: 'shipments', label: 'Shipments', icon: Truck },
    { id: 'audit', label: 'Audit Log', icon: FileText }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-purple-600 pt-12 pb-4 px-4">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-bold text-white">Ops Console</h1>
          <button 
            onClick={onLogout}
            className="flex items-center gap-2 text-white/80 hover:text-white text-sm bg-white/20 px-3 py-1.5 rounded-full"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
        <p className="text-purple-200 text-sm mb-4">Supply Closet Operations Management</p>
        
        <div className="flex gap-1 overflow-x-auto pb-2 -mx-4 px-4">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.id 
                  ? 'bg-white text-purple-600' 
                  : 'bg-purple-500/30 text-white/90 hover:bg-purple-500/50'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4">
        {loading ? (
          <div className="bg-white rounded-2xl p-8 text-center">
            <RefreshCw className="w-8 h-8 text-gray-300 mx-auto mb-2 animate-spin" />
            <p className="text-gray-500">Loading data...</p>
          </div>
        ) : (
          <>
            {activeTab === 'overview' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white rounded-2xl p-4 shadow-sm">
                    <p className="text-2xl font-bold text-purple-600">{stats.totalSites}</p>
                    <p className="text-sm text-gray-500">Total Sites</p>
                  </div>
                  <div className="bg-white rounded-2xl p-4 shadow-sm">
                    <p className="text-2xl font-bold text-amber-600">{stats.openIncidents}</p>
                    <p className="text-sm text-gray-500">Open Incidents</p>
                  </div>
                  <div className="bg-white rounded-2xl p-4 shadow-sm">
                    <p className="text-2xl font-bold text-blue-600">{stats.pendingShipments}</p>
                    <p className="text-sm text-gray-500">Pending Shipments</p>
                  </div>
                  <div className="bg-white rounded-2xl p-4 shadow-sm">
                    <p className="text-2xl font-bold text-red-600">{stats.overdueTasks}</p>
                    <p className="text-sm text-gray-500">Overdue Tasks</p>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-4 shadow-sm">
                  <h3 className="font-bold text-gray-900 mb-3">Recent Incidents</h3>
                  {incidents.slice(0, 5).map(incident => (
                    <div key={incident.incident_id} className="flex items-center gap-3 py-2 border-b last:border-0">
                      <div className={`w-2 h-2 rounded-full ${
                        incident.severity === 'critical' ? 'bg-red-500' :
                        incident.severity === 'high' ? 'bg-amber-500' : 'bg-blue-500'
                      }`} />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{incident.type}</p>
                        <p className="text-xs text-gray-500">Site {incident.site_id}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        incident.status === 'open' ? 'bg-amber-100 text-amber-700' :
                        incident.status === 'escalated' ? 'bg-red-100 text-red-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {incident.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'sites' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-lg font-bold text-gray-900">All Sites</h2>
                  <button 
                    onClick={loadAllData}
                    className="p-2 rounded-lg hover:bg-gray-100"
                  >
                    <RefreshCw className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
                {sites.length === 0 ? (
                  <div className="bg-white rounded-2xl p-8 text-center">
                    <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No sites configured</p>
                  </div>
                ) : (
                  sites.map(site => (
                    <div key={site.site_id} className="bg-white rounded-2xl p-4 shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                          <Building2 className="w-5 h-5 text-purple-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-900">{site.venue_name}</h3>
                          <p className="text-sm text-gray-500">Technician: {site.partner_id}</p>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          site.status === 'active' ? 'bg-green-100 text-green-700' :
                          site.status === 'hold' ? 'bg-amber-100 text-amber-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {site.status}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'incidents' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-lg font-bold text-gray-900">Incidents</h2>
                </div>
                {incidents.length === 0 ? (
                  <div className="bg-white rounded-2xl p-8 text-center">
                    <AlertTriangle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No incidents reported</p>
                  </div>
                ) : (
                  incidents.map(incident => (
                    <div key={incident.incident_id} className="bg-white rounded-2xl p-4 shadow-sm">
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          incident.severity === 'critical' ? 'bg-red-100' :
                          incident.severity === 'high' ? 'bg-amber-100' : 'bg-blue-100'
                        }`}>
                          <AlertTriangle className={`w-5 h-5 ${
                            incident.severity === 'critical' ? 'text-red-600' :
                            incident.severity === 'high' ? 'text-amber-600' : 'text-blue-600'
                          }`} />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-900">{incident.type}</h3>
                          <p className="text-sm text-gray-500">Site {incident.site_id} · {incident.severity}</p>
                          {incident.notes && <p className="text-sm text-gray-600 mt-1">{incident.notes}</p>}
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          incident.status === 'open' ? 'bg-amber-100 text-amber-700' :
                          incident.status === 'escalated' ? 'bg-red-100 text-red-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {incident.status}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'shipments' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-lg font-bold text-gray-900">Shipments</h2>
                </div>
                {shipments.length === 0 ? (
                  <div className="bg-white rounded-2xl p-8 text-center">
                    <Truck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No shipments</p>
                  </div>
                ) : (
                  shipments.map(shipment => (
                    <div key={shipment.shipment_id} className="bg-white rounded-2xl p-4 shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                          <Package className="w-5 h-5 text-green-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-900">Shipment #{shipment.shipment_id}</h3>
                          <p className="text-sm text-gray-500">{shipment.total_boxes} boxes · Site {shipment.site_id}</p>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          shipment.status === 'pending' ? 'bg-gray-100 text-gray-700' :
                          shipment.status === 'shipped' ? 'bg-blue-100 text-blue-700' :
                          shipment.status === 'delivered' ? 'bg-green-100 text-green-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {shipment.status}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'audit' && (
              <div className="space-y-3">
                <div className="bg-white rounded-2xl p-8 text-center">
                  <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">Audit Log</p>
                  <p className="text-sm text-gray-400 mt-1">All actions are logged for compliance</p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

const LoginPage = ({ onLogin }) => {
  const [userType, setUserType] = useState(null);
  const [technicianId, setTechnicianId] = useState('');
  const [driverId, setDriverId] = useState('');
  const [opsManagerCode, setOpsManagerCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleTechLogin = async () => {
    if (!technicianId.trim()) return;
    if (technicianId.toLowerCase() !== 'test' && !technicianId.startsWith('tech-')) {
      alert('Invalid Technician ID. Use "test" or "tech-xxx".');
      return;
    }
    setIsLoading(true);
    try {
      const result = await api.technicians.createOrGet(technicianId, 'Test');
      if (!result || !result.technician) {
        throw new Error('Invalid response from server: missing technician data');
      }
      onLogin({ 
        displayName: technicianId,
        technicianData: result.technician,
        role: 'technician' 
      });
    } catch (error) {
      console.error('Login error:', error);
      alert(error?.message || 'Failed to sign in. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDriverLogin = async () => {
    if (!driverId.trim()) return;
    if (driverId.toLowerCase() !== 'test' && !driverId.startsWith('driver-')) {
      alert('Invalid Driver ID. Use "test" or "driver-xxx".');
      return;
    }
    setIsLoading(true);
    try {
      onLogin({ 
        displayName: driverId,
        driverId: driverId,
        role: 'driver' 
      });
    } catch (error) {
      console.error('Driver login error:', error);
      alert(error?.message || 'Failed to sign in. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpsLogin = async () => {
    if (!opsManagerCode.trim()) return;
    if (opsManagerCode !== '4782') {
      alert('Invalid Ops Manager Code');
      setOpsManagerCode('');
      return;
    }
    setIsLoading(true);
    try {
      onLogin({ 
        displayName: 'Operations Manager', 
        role: 'ops_manager',
        opsToken: '4782'
      });
    } catch (error) {
      console.error('Ops login error:', error);
      alert(error?.message || 'Failed to verify code. Please try again.');
      setOpsManagerCode('');
    } finally {
      setIsLoading(false);
    }
  };

  if (!userType) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4 md:p-6">
        <Card className="p-6 md:p-8 max-w-md w-full bg-white border-[#d2d2d7]">
          <div className="text-center mb-6 md:mb-8">
            <div className="flex justify-center mb-4">
              <img src="/jolt-machine.png" alt="SIPJOLT Machine" className="h-48 md:h-56 w-48 md:w-56 object-contain" loading="eager" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-[#1d1d1f] mb-2">SIPJOLT Hub</h1>
            <p className="text-sm text-[#86868b]">Select your role to continue</p>
          </div>

          <div className="space-y-3">
            <button 
              onClick={() => setUserType('technician')}
              className="w-full px-5 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center gap-4 transition-colors"
            >
              <div className="bg-white/20 p-2.5 rounded-lg">
                <Wrench size={22} />
              </div>
              <div className="text-left flex-1">
                <div className="font-bold">Partner/Technician</div>
                <div className="text-sm text-blue-200">Machine service & supply closet</div>
              </div>
              <ChevronRight size={20} className="text-blue-300" />
            </button>

            <button 
              onClick={() => setUserType('driver')}
              className="w-full px-5 py-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl flex items-center gap-4 transition-colors"
            >
              <div className="bg-white/20 p-2.5 rounded-lg">
                <Truck size={22} />
              </div>
              <div className="text-left flex-1">
                <div className="font-bold">Driver</div>
                <div className="text-sm text-green-200">Deliveries & proof of delivery</div>
              </div>
              <ChevronRight size={20} className="text-green-300" />
            </button>

            <button 
              onClick={() => setUserType('ops_manager')}
              className="w-full px-5 py-4 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl flex items-center gap-4 transition-colors"
            >
              <div className="bg-white/20 p-2.5 rounded-lg">
                <Settings size={22} />
              </div>
              <div className="text-left flex-1">
                <div className="font-bold">Ops Manager</div>
                <div className="text-sm text-purple-200">Fleet & supply operations</div>
              </div>
              <ChevronRight size={20} className="text-purple-300" />
            </button>
          </div>

          <div className="mt-6 text-center text-xs text-gray-500">
            <p>Authorized personnel only</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4 md:p-6">
      <Card className="p-6 md:p-8 max-w-md w-full bg-white border-[#d2d2d7]">
        <button 
          onClick={() => setUserType(null)} 
          className="flex items-center gap-2 text-[#86868b] hover:text-[#1d1d1f] mb-4 text-sm font-medium transition-colors"
        >
          <ChevronLeft size={18} />
          Back to role selection
        </button>

        <div className="text-center mb-6">
          <div className={`inline-flex p-3 rounded-xl mb-3 ${
            userType === 'technician' ? 'bg-blue-600/20 text-blue-600' :
            userType === 'driver' ? 'bg-green-600/20 text-green-600' :
            'bg-purple-600/20 text-purple-600'
          } border border-blue-100`}>
            {userType === 'technician' && <Wrench size={28} />}
            {userType === 'driver' && <Truck size={28} />}
            {userType === 'ops_manager' && <Settings size={28} />}
          </div>
          <h2 className="text-xl font-bold text-gray-900">
            {userType === 'technician' && 'Partner/Technician Login'}
            {userType === 'driver' && 'Driver Login'}
            {userType === 'ops_manager' && 'Ops Manager Login'}
          </h2>
        </div>

        {userType === 'technician' && (
          <form onSubmit={(e) => { e.preventDefault(); handleTechLogin(); }} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-[#86868b] mb-2">
                Technician ID
              </label>
              <input
                type="text"
                value={technicianId}
                onChange={(e) => setTechnicianId(e.target.value)}
                disabled={isLoading}
                placeholder="Enter your tech ID"
                className="w-full px-4 py-3 bg-[#f5f5f7] border border-[#d2d2d7] text-[#1d1d1f] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none disabled:opacity-50"
                autoFocus
              />
            </div>
            <button type="submit" disabled={isLoading || !technicianId.trim()} className="w-full px-4 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-all active:scale-95">
              <Lock size={18} />
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        )}

        {userType === 'driver' && (
          <form onSubmit={(e) => { e.preventDefault(); handleDriverLogin(); }} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-[#86868b] mb-2">
                Driver ID
              </label>
              <input
                type="text"
                value={driverId}
                onChange={(e) => setDriverId(e.target.value)}
                disabled={isLoading}
                placeholder="Enter your driver ID"
                className="w-full px-4 py-3 bg-[#f5f5f7] border border-[#d2d2d7] text-[#1d1d1f] rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none disabled:opacity-50"
                autoFocus
              />
            </div>
            <button type="submit" disabled={isLoading || !driverId.trim()} className="w-full px-4 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-all active:scale-95">
              <Truck size={18} />
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        )}

        {userType === 'ops_manager' && (
          <form onSubmit={(e) => { e.preventDefault(); handleOpsLogin(); }} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-[#86868b] mb-2">
                Ops Manager Code
              </label>
              <input
                type="password"
                value={opsManagerCode}
                onChange={(e) => setOpsManagerCode(e.target.value)}
                disabled={isLoading}
                placeholder="Enter 4-digit code"
                maxLength={4}
                className="w-full px-4 py-3 bg-[#f5f5f7] border border-[#d2d2d7] text-[#1d1d1f] rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none disabled:opacity-50"
                autoFocus
              />
            </div>
            <button type="submit" disabled={isLoading || !opsManagerCode.trim()} className="w-full px-4 py-3 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-all active:scale-95">
              <Settings size={18} />
              {isLoading ? 'Verifying...' : 'Sign In'}
            </button>
          </form>
        )}
      </Card>
    </div>
  );
};

// --- 8B. SHIPMENTS TAB COMPONENT ---

const BOX_DESCRIPTORS = {
  'A': 'LIQUIDS (SYRUP)',
  'B1': 'POWDERS (MATCHA MIX + DAIRY)',
  'B2': 'POWDERS (OAT)',
  'CD': 'CUPS + DAIRY KITS',
  'E': 'CUPS ONLY'
};

const SHIPMENT_TYPE_BOXES = {
  'ingredients': ['A', 'B1', 'B2', 'CD'],
  'cups': ['E'],
  'emergency': []
};

const BOX_STATUS_COLORS = {
  pending: 'bg-gray-100 text-gray-600',
  packed: 'bg-blue-100 text-blue-700',
  labeled: 'bg-purple-100 text-purple-700',
  shipped: 'bg-green-100 text-green-700'
};

const PackingLogFormModal = ({ box, shipment, user, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    packDate: new Date().toISOString().split('T')[0],
    batchId: '',
    weightLb: '',
    shakeTestPass: false,
    zeroRattleConfirmed: false,
    notes: ''
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  
  const isValid = formData.packDate && formData.batchId && formData.shakeTestPass && formData.zeroRattleConfirmed;
  const isOverweight = formData.weightLb && parseFloat(formData.weightLb) > 46.5;
  const isHeavy = formData.weightLb && parseFloat(formData.weightLb) > 40;
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValid || isOverweight) return;
    
    setSaving(true);
    setError('');
    
    try {
      const response = await fetch(`/api/ops/boxes/${box.box_record_id}/packing-log`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'ops-001',
          'x-user-name': user?.displayName || 'Ops Manager',
          'x-user-role': 'ops_manager'
        },
        body: JSON.stringify({
          packDate: new Date(formData.packDate),
          batchId: formData.batchId,
          weightLb: formData.weightLb ? parseFloat(formData.weightLb) : null,
          shakeTestPass: formData.shakeTestPass,
          zeroRattleConfirmed: formData.zeroRattleConfirmed,
          notes: formData.notes
        })
      });
      
      if (response.ok) {
        onSuccess();
        onClose();
      } else {
        const result = await response.json();
        setError(result.error || 'Failed to save packing log');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <Card className="max-w-lg w-full p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-xl font-bold">Complete Packing</h2>
            <p className="text-gray-500">Box {box.box_id} - {box.descriptor}</p>
          </div>
          <button onClick={onClose} className="text-2xl font-bold text-gray-500 hover:text-gray-700">×</button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Pack Date *</label>
              <input
                type="date"
                value={formData.packDate}
                onChange={(e) => setFormData(prev => ({ ...prev, packDate: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Batch ID *</label>
              <input
                type="text"
                value={formData.batchId}
                onChange={(e) => setFormData(prev => ({ ...prev, batchId: e.target.value.toUpperCase() }))}
                placeholder="B-2026-001"
                className="w-full px-3 py-2 border rounded-lg font-mono"
                required
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Weight (lb)</label>
            <input
              type="number"
              step="0.1"
              value={formData.weightLb}
              onChange={(e) => setFormData(prev => ({ ...prev, weightLb: e.target.value }))}
              className={`w-full px-3 py-2 border rounded-lg ${isOverweight ? 'border-red-500 bg-red-50' : ''}`}
            />
            {isOverweight && (
              <p className="text-red-600 text-sm mt-1 font-medium">Weight exceeds 46.5 lb limit! Remove contents.</p>
            )}
            {isHeavy && !isOverweight && (
              <p className="text-amber-600 text-sm mt-1">This box will be marked as HEAVY LIFT (&gt;40 lb)</p>
            )}
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg space-y-3">
            <p className="font-semibold text-sm text-blue-800">Quality Checks (Both Required)</p>
            
            <label className="flex items-start gap-3 p-3 bg-white rounded-lg border cursor-pointer">
              <input
                type="checkbox"
                checked={formData.shakeTestPass}
                onChange={(e) => setFormData(prev => ({ ...prev, shakeTestPass: e.target.checked }))}
                className="w-5 h-5 mt-0.5"
              />
              <div>
                <p className="font-medium">Shake Test Pass</p>
                <p className="text-xs text-gray-500">I shook the box gently and contents did not shift excessively</p>
              </div>
            </label>
            
            <label className="flex items-start gap-3 p-3 bg-white rounded-lg border cursor-pointer">
              <input
                type="checkbox"
                checked={formData.zeroRattleConfirmed}
                onChange={(e) => setFormData(prev => ({ ...prev, zeroRattleConfirmed: e.target.checked }))}
                className="w-5 h-5 mt-0.5"
              />
              <div>
                <p className="font-medium">Zero Rattle Confirmed</p>
                <p className="text-xs text-gray-500">Box has adequate void fill and produces no rattling sounds</p>
              </div>
            </label>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Notes (optional)</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Any special packing notes..."
              className="w-full px-3 py-2 border rounded-lg h-20 resize-none"
            />
          </div>
          
          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}
          
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
            <Button 
              type="submit" 
              disabled={!isValid || isOverweight || saving} 
              className="flex-1 bg-blue-600"
            >
              {saving ? 'Saving...' : 'Complete Packing'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

const LabelPreviewModal = ({ box, shipment, user, onClose, onSuccess }) => {
  const [labelData, setLabelData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  
  const appBaseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const qrUrl = `${appBaseUrl}/ops/boxes/${box.box_record_id}`;
  
  useEffect(() => {
    fetchLabelData();
  }, [box.box_record_id]);
  
  const fetchLabelData = async () => {
    try {
      const response = await fetch(`/api/ops/boxes/${box.box_record_id}/label-data`, {
        headers: {
          'x-user-id': 'ops-001',
          'x-user-name': user?.displayName || 'Ops Manager',
          'x-user-role': 'ops_manager'
        }
      });
      if (response.ok) {
        const result = await response.json();
        setLabelData(result.labelData);
      } else {
        setError('Failed to fetch label data');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };
  
  const handleGenerateLabel = async () => {
    setGenerating(true);
    setError('');
    
    try {
      const response = await fetch(`/api/ops/boxes/${box.box_record_id}/generate-label`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'ops-001',
          'x-user-name': user?.displayName || 'Ops Manager',
          'x-user-role': 'ops_manager'
        },
        body: JSON.stringify({
          labelType: shipment.carrier_type === 'ups' ? 'ups_addon' : 'milk_run'
        })
      });
      
      if (response.ok) {
        onSuccess();
        window.print();
      } else {
        const result = await response.json();
        setError(result.error || 'Failed to generate label');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setGenerating(false);
    }
  };
  
  const isReprint = box.label_generated_at !== null;
  const isHeavy = labelData?.weight && parseFloat(labelData.weight) > 40;
  const packDateStr = labelData?.packDate ? new Date(labelData.packDate).toLocaleDateString() : '-';
  
  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
        <Card className="p-8 text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" />
          <p>Loading label data...</p>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-start justify-center p-4 overflow-y-auto" onClick={onClose}>
      <div className="my-4 space-y-4" onClick={(e) => e.stopPropagation()}>
        <Card className="p-6 print:hidden">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-xl font-bold">{isReprint ? 'Reprint Label' : 'Generate Label'}</h2>
              <p className="text-gray-500">Box {box.box_id} - {box.descriptor}</p>
            </div>
            <button onClick={onClose} className="text-2xl font-bold text-gray-500 hover:text-gray-700">×</button>
          </div>
          
          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm mb-4">
              {error}
            </div>
          )}
          
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
            <Button 
              onClick={handleGenerateLabel}
              disabled={generating}
              className="flex-1 bg-black text-white"
            >
              {generating ? 'Generating...' : isReprint ? 'Reprint Label' : 'Generate & Print'}
            </Button>
          </div>
        </Card>
        
        <div className="print:m-0 print:p-0 shadow-2xl">
          <div className="w-[4in] h-[6in] bg-white border-[12px] border-black p-4 flex flex-col justify-between overflow-hidden print:border-0 select-none relative">
            <div className="absolute left-0 top-0 bottom-0 w-[20px] bg-black flex items-center justify-center">
              <p className="text-white font-black text-[9px] uppercase tracking-[0.4em] origin-center -rotate-90 whitespace-nowrap">
                Sipjolt Logistics Protocol v81.7
              </p>
            </div>

            <div className="pl-4 h-full flex flex-col justify-between">
              <div className="border-b-[4px] border-black pb-2">
                <div className="flex justify-between items-start mb-1">
                  <div className="bg-black text-white px-3 py-1 text-lg font-[1000] leading-none tracking-tight">
                    {labelData?.siteId}
                  </div>
                  <div className="flex flex-col items-end">
                    <svg viewBox="0 0 200 40" className="w-24 h-auto">
                      <text x="0" y="30" fontWeight="1000" fontSize="32" fontFamily="Arial, sans-serif" letterSpacing="-1" fill="black">SIPJOLT</text>
                      <rect x="0" y="34" width="125" height="4" fill="black" />
                    </svg>
                    <div className="border-[2px] border-black px-1.5 py-0.5 text-[8px] font-black mt-1 uppercase tracking-widest">
                      {shipment.carrier_type === 'ups' ? 'UPS ADD-ON' : 'MILK RUN LOGISTICS'}
                    </div>
                  </div>
                </div>
                <h1 className="text-[30px] font-[1000] leading-[0.85] uppercase tracking-tighter mb-1 mt-1">
                  {labelData?.venueName || 'VENUE'}
                </h1>
                <div className="space-y-0.5">
                  <p className="text-[11px] font-[1000] uppercase leading-[1.1] flex items-start gap-1">
                    <MapPin size={10} strokeWidth={3} className="mt-0.5 flex-shrink-0" />
                    {labelData?.address || 'ADDRESS'}
                  </p>
                  <p className="text-[11px] font-[1000] uppercase tracking-tight flex items-center gap-1 pt-1 mt-0.5 border-t-[1.5px] border-black">
                    <Users size={10} className="flex-shrink-0" strokeWidth={3} />
                    ATTN: {labelData?.attn || 'SITE MANAGER'}
                  </p>
                </div>
              </div>

              <div className="flex-grow flex flex-col items-center justify-center relative py-1">
                <div className="w-full h-[1.5px] bg-black absolute top-1/2"></div>
                <div className="bg-white px-1 z-10 flex items-center justify-between w-full">
                  <div className="flex-1 flex flex-col items-center">
                    <h2 className="text-[110px] font-[1000] leading-none tracking-tighter uppercase">
                      {labelData?.boxId?.replace('BOX ', '')}
                    </h2>
                  </div>
                  <div className="h-24 w-[10px] bg-black mx-1"></div>
                  <div className="flex-1 flex flex-col items-start pl-2">
                    <p className="text-[14px] font-black uppercase tracking-[0.2em] leading-none mb-1">BOX COUNT</p>
                    <h2 className="text-[75px] font-[1000] leading-none tracking-tighter">
                      {labelData?.boxNumber}/{labelData?.totalInSet}
                    </h2>
                  </div>
                </div>
                <div className="mt-2 flex gap-2 font-black text-[10px] tracking-widest uppercase">
                  {labelData?.hasLiquids && <span className="border-[2.5px] border-black px-3 py-1 font-black">LIQUIDS</span>}
                  {labelData?.hasInnerKits && <span className="bg-black text-white px-3 py-1 font-black">INNER KITS REQUIRED</span>}
                  {isHeavy && <span className="bg-black text-white px-3 py-1 font-black italic">HEAVY LIFT</span>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 border-t-[4px] border-black pt-2 mb-2">
                <div className="flex flex-col justify-between py-0.5">
                  <div>
                    <p className="text-[9px] font-[1000] uppercase tracking-widest leading-none mb-1">Net Weight</p>
                    <div className="flex items-baseline gap-1">
                      <h3 className="text-[52px] font-[1000] leading-none tracking-tighter">{labelData?.weight || '--'}</h3>
                      <span className="text-[14px] font-[1000]">LB</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-1 mt-1 border-t-[2.5px] border-black pt-1">
                    <div>
                      <p className="text-[7px] font-[1000] uppercase mb-0.5">Batch</p>
                      <p className="text-[10px] font-black truncate uppercase tracking-tighter">{labelData?.batchId || '--'}</p>
                    </div>
                    <div>
                      <p className="text-[7px] font-[1000] uppercase mb-0.5 tracking-tighter">Date</p>
                      <p className="text-[10px] font-black truncate">{packDateStr}</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col items-end">
                  <div className="border-[3px] border-black p-0.5 bg-white">
                    <QRCodeSVG value={qrUrl} size={85} level="M" />
                  </div>
                  <p className="text-[7px] font-[1000] uppercase mt-1 tracking-[0.2em] border-t-2 border-black w-full text-center pt-0.5">
                    BOX {labelData?.boxId} VERIFIED
                  </p>
                </div>
              </div>

              <div className="bg-black text-white p-2 rounded-sm mb-0">
                <div className="flex justify-between items-center border-b border-white pb-0.5 mb-1 font-[1000]">
                  <p className="text-[10px] tracking-[0.2em] uppercase flex items-center gap-1.5">
                    <Truck size={12} strokeWidth={3} /> Driver SOP
                  </p>
                  <p className="text-[9px] flex items-center gap-1">
                    800-555-0199
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 text-[8px] font-[1000] uppercase leading-tight">
                  <div className="flex gap-1.5 items-start">
                    <div className="bg-white text-black w-3 h-3 flex items-center justify-center rounded-full text-[7px] shrink-0 font-[1000]">1</div>
                    <span>CLOSET ACCESS ONLY</span>
                  </div>
                  <div className="flex gap-1.5 items-start">
                    <div className="bg-white text-black w-3 h-3 flex items-center justify-center rounded-full text-[7px] shrink-0 font-[1000]">2</div>
                    <span>MATCH LETTER TO ZONE</span>
                  </div>
                  <div className="flex gap-1.5 items-start">
                    <div className="bg-white text-black w-3 h-3 flex items-center justify-center rounded-full text-[7px] shrink-0 font-[1000]">3</div>
                    <span>UPLOAD RACK PHOTO</span>
                  </div>
                  <div className="flex gap-1.5 items-start bg-white text-black px-1 py-0.5 rounded-sm">
                    <div className="bg-black text-white w-3 h-3 flex items-center justify-center rounded-full text-[7px] shrink-0 font-[1000]">4</div>
                    <span className="font-[1000]">WET BOX = REFUSAL</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <style>{`
          @media print {
            @page { size: 4in 6in; margin: 0; }
            body { background: white; margin: 0; padding: 0; }
            .print\\:hidden { display: none !important; }
            * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
        `}</style>
      </div>
    </div>
  );
};

const ShipmentsTab = ({ supplyClosetData, setSupplyClosetData, supplyLoading, user }) => {
  const [showCreateWizard, setShowCreateWizard] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [filters, setFilters] = useState({ status: '', type: '', siteId: '' });
  const [wizardStep, setWizardStep] = useState(1);
  const [wizardData, setWizardData] = useState({
    siteId: '',
    shipmentType: 'ingredients',
    carrierType: 'milk_run',
    trackingNumber: '',
    boxes: [],
    batchId: ''
  });
  const [boxCounts, setBoxCounts] = useState({ A: 1, B1: 1, B2: 1, CD: 1, E: 1 });
  const [emergencyBoxes, setEmergencyBoxes] = useState({ A: false, B1: false, B2: false, CD: false, E: false });
  const [creating, setCreating] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [packingBox, setPackingBox] = useState(null);
  const [labelBox, setLabelBox] = useState(null);

  const filteredShipments = supplyClosetData.shipments.filter(s => {
    if (filters.status && s.status !== filters.status) return false;
    if (filters.type && s.shipment_type !== filters.type) return false;
    if (filters.siteId && s.site_id !== filters.siteId) return false;
    return true;
  });

  const [boxWeights, setBoxWeights] = useState({ A: '42.5', B1: '38.0', B2: '35.5', CD: '28.0', E: '25.0' });

  const handleCreateShipment = async () => {
    setCreating(true);
    try {
      let boxes = [];
      const batchId = wizardData.batchId || `B-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 900) + 100)}`;
      
      if (wizardData.shipmentType === 'ingredients') {
        boxes = ['A', 'B1', 'B2', 'CD'].map(boxId => ({ 
          boxId, 
          total: boxCounts[boxId] || 1,
          weight: boxWeights[boxId] || '40.0',
          batchId: batchId
        }));
      } else if (wizardData.shipmentType === 'cups') {
        boxes = [{ 
          boxId: 'E', 
          total: boxCounts.E || 1,
          weight: boxWeights.E || '25.0',
          batchId: batchId
        }];
      } else if (wizardData.shipmentType === 'emergency') {
        boxes = Object.entries(emergencyBoxes)
          .filter(([_, selected]) => selected)
          .map(([boxId]) => ({ 
            boxId, 
            total: boxCounts[boxId] || 1,
            weight: boxWeights[boxId] || '40.0',
            batchId: batchId
          }));
      }

      const response = await fetch('/api/ops/shipments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'ops-001',
          'x-user-name': user?.displayName || 'Ops Manager',
          'x-user-role': 'ops_manager'
        },
        body: JSON.stringify({
          siteId: wizardData.siteId,
          shipmentType: wizardData.shipmentType,
          carrierType: wizardData.carrierType,
          trackingNumber: wizardData.carrierType === 'ups' ? wizardData.trackingNumber : null,
          boxes
        })
      });

      if (response.ok) {
        const result = await response.json();
        setSupplyClosetData(prev => ({
          ...prev,
          shipments: [result.shipment, ...prev.shipments]
        }));
        setShowCreateWizard(false);
        setWizardStep(1);
        
        // Auto-download all labels as PNG
        if (result.shipment && result.shipment.boxes && result.shipment.boxes.length > 0) {
          const site = supplyClosetData.sites.find(s => s.site_id === wizardData.siteId);
          result.shipment.boxes.forEach(async (box, index) => {
            setTimeout(async () => {
              try {
                // Handle both naming conventions from backend
                const boxId = box.box_id || box.boxId || 'A';
                const boxNumber = box.box_number || box.boxNumber || (index + 1);
                const totalInSet = box.total_in_set || box.totalInSet || result.shipment.boxes.length;
                const boxWeight = box.weight || boxWeights[boxId] || '40.0';
                const boxBatchId = box.batch_id || box.batchId || batchId;
                
                const labelRes = await fetch('/api/label-generator/generate', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    siteId: wizardData.siteId,
                    siteName: site?.venue_name || site?.venueName || 'SITE',
                    addressLine: site?.address || '',
                    attnName: site?.primary_contact || site?.primaryContact || 'Manager',
                    zoneCode: boxId,
                    boxIndex: `${boxNumber}/${totalInSet}`,
                    category: BOX_DESCRIPTORS[boxId] || '',
                    netWeightLb: boxWeight,
                    batch: boxBatchId,
                    date: new Date().toLocaleDateString(),
                    phone: '800-555-0199',
                    spineText: 'SIPJOLT V1.00',
                    format: 'png'
                  })
                });
                if (labelRes.ok) {
                  const blob = await labelRes.blob();
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `LABEL_${wizardData.siteId}_${boxId}_${boxNumber}.png`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                }
              } catch (e) {
                console.error('Batch download failed', e);
              }
            }, index * 800);
          });
        }
        
        setWizardData({ siteId: '', shipmentType: 'ingredients', carrierType: 'milk_run', trackingNumber: '', boxes: [], batchId: '' });
        setBoxCounts({ A: 1, B1: 1, B2: 1, CD: 1, E: 1 });
        setBoxWeights({ A: '42.5', B1: '38.0', B2: '35.5', CD: '28.0', E: '25.0' });
        setEmergencyBoxes({ A: false, B1: false, B2: false, CD: false, E: false });
      } else {
        const errorData = await response.json();
        alert('Failed: ' + (errorData.error || 'Unknown error'));
      }
    } catch (error) {
      alert('Network error');
    } finally {
      setCreating(false);
    }
  };

  const handleViewShipment = async (shipmentId) => {
    setDetailLoading(true);
    try {
      const response = await fetch(`/api/ops/shipments/${shipmentId}`, {
        headers: {
          'x-user-id': 'ops-001',
          'x-user-name': user?.displayName || 'Ops Manager',
          'x-user-role': 'ops_manager'
        }
      });
      if (response.ok) {
        const result = await response.json();
        setSelectedShipment(result.shipment);
      }
    } catch (error) {
      console.error('Error fetching shipment:', error);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleUpdateStatus = async (newStatus) => {
    if (!selectedShipment) return;
    try {
      const response = await fetch(`/api/ops/shipments/${selectedShipment.shipment_id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'ops-001',
          'x-user-name': user?.displayName || 'Ops Manager',
          'x-user-role': 'ops_manager'
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (response.ok) {
        const result = await response.json();
        setSelectedShipment(prev => ({ ...prev, ...result.shipment }));
        setSupplyClosetData(prev => ({
          ...prev,
          shipments: prev.shipments.map(s => 
            s.shipment_id === selectedShipment.shipment_id ? { ...s, status: newStatus } : s
          )
        }));
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'created': return 'bg-gray-100 text-gray-700';
      case 'packed': return 'bg-blue-100 text-blue-700';
      case 'shipped': return 'bg-purple-100 text-purple-700';
      case 'delivered': return 'bg-green-100 text-green-700';
      case 'refused': return 'bg-red-100 text-red-700';
      case 'cancelled': return 'bg-gray-300 text-gray-600';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'ingredients': return 'Ingredients';
      case 'cups': return 'Cups';
      case 'emergency': return 'Emergency';
      default: return type;
    }
  };

  return (
    <div className="space-y-4">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Truck size={20} className="text-green-600" />
            Shipments Management
          </h2>
          <Button onClick={() => setShowCreateWizard(true)} className="flex items-center gap-2">
            <Plus size={16} /> Create Shipment
          </Button>
        </div>

        <div className="flex gap-2 mb-4 flex-wrap">
          <select
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
            className="px-3 py-2 border rounded-lg text-sm"
          >
            <option value="">All Status</option>
            <option value="created">Created</option>
            <option value="packed">Packed</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="refused">Refused</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <select
            value={filters.type}
            onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
            className="px-3 py-2 border rounded-lg text-sm"
          >
            <option value="">All Types</option>
            <option value="ingredients">Ingredients</option>
            <option value="cups">Cups</option>
            <option value="emergency">Emergency</option>
          </select>
          <select
            value={filters.siteId}
            onChange={(e) => setFilters(prev => ({ ...prev, siteId: e.target.value }))}
            className="px-3 py-2 border rounded-lg text-sm"
          >
            <option value="">All Sites</option>
            {supplyClosetData.sites.map(site => (
              <option key={site.site_id} value={site.site_id}>{site.venue_name}</option>
            ))}
          </select>
        </div>

        {supplyLoading ? (
          <div className="text-center py-8">
            <RefreshCw className="w-8 h-8 text-gray-300 mx-auto animate-spin" />
          </div>
        ) : filteredShipments.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-8">No shipments found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="pb-2 font-semibold">ID</th>
                  <th className="pb-2 font-semibold">Site</th>
                  <th className="pb-2 font-semibold">Type</th>
                  <th className="pb-2 font-semibold">Status</th>
                  <th className="pb-2 font-semibold">Carrier</th>
                  <th className="pb-2 font-semibold">Boxes</th>
                  <th className="pb-2 font-semibold">Created</th>
                  <th className="pb-2"></th>
                </tr>
              </thead>
              <tbody>
                {filteredShipments.map(shipment => (
                  <tr key={shipment.shipment_id} className="border-b hover:bg-gray-50">
                    <td className="py-3 font-mono text-xs">{shipment.shipment_id}</td>
                    <td className="py-3">{shipment.venue_name || shipment.site_id}</td>
                    <td className="py-3">{getTypeLabel(shipment.shipment_type)}</td>
                    <td className="py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(shipment.status)}`}>
                        {shipment.status}
                      </span>
                    </td>
                    <td className="py-3">{shipment.carrier_type === 'ups' ? 'UPS' : 'Milk Run'}</td>
                    <td className="py-3">{shipment.total_boxes || shipment.boxes?.length || 0}</td>
                    <td className="py-3 text-gray-500">{shipment.created_at ? new Date(shipment.created_at).toLocaleDateString() : 'N/A'}</td>
                    <td className="py-3">
                      <button
                        onClick={() => handleViewShipment(shipment.shipment_id)}
                        className="text-blue-600 hover:underline text-xs"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {showCreateWizard && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setShowCreateWizard(false)}>
          <Card className="max-w-lg w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Create Shipment</h2>
              <button onClick={() => setShowCreateWizard(false)} className="text-gray-500 hover:text-gray-700 text-xl">×</button>
            </div>

            <div className="flex gap-2 mb-6">
              {[1, 2, 3, 4].map(step => (
                <div key={step} className={`flex-1 h-2 rounded ${wizardStep >= step ? 'bg-blue-600' : 'bg-gray-200'}`} />
              ))}
            </div>

            {wizardStep === 1 && (
              <div className="space-y-4">
                <h3 className="font-semibold">Step 1: Select Site</h3>
                <select
                  value={wizardData.siteId}
                  onChange={(e) => setWizardData(prev => ({ ...prev, siteId: e.target.value }))}
                  className="w-full px-4 py-3 border rounded-lg"
                >
                  <option value="">Choose a site...</option>
                  {supplyClosetData.sites.map(site => (
                    <option key={site.site_id} value={site.site_id}>{site.venue_name} - {site.address}</option>
                  ))}
                </select>
                <div className="flex justify-end">
                  <Button onClick={() => setWizardStep(2)} disabled={!wizardData.siteId}>Next</Button>
                </div>
              </div>
            )}

            {wizardStep === 2 && (
              <div className="space-y-4">
                <h3 className="font-semibold">Step 2: Shipment Type</h3>
                <div className="space-y-2">
                  {[
                    { id: 'ingredients', label: 'Ingredients', desc: 'Boxes A, B1, B2, CD', icon: '📦' },
                    { id: 'cups', label: 'Cups', desc: 'Box E only', icon: '🥤' },
                    { id: 'emergency', label: 'Emergency', desc: 'Select specific boxes', icon: '🚨' }
                  ].map(type => (
                    <button
                      key={type.id}
                      onClick={() => setWizardData(prev => ({ ...prev, shipmentType: type.id }))}
                      className={`w-full p-4 border-2 rounded-lg text-left flex items-center gap-3 ${
                        wizardData.shipmentType === type.id ? 'border-blue-600 bg-blue-50' : 'border-gray-200'
                      }`}
                    >
                      <span className="text-2xl">{type.icon}</span>
                      <div>
                        <p className="font-bold">{type.label}</p>
                        <p className="text-sm text-gray-500">{type.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setWizardStep(1)}>Back</Button>
                  <Button onClick={() => setWizardStep(3)}>Next</Button>
                </div>
              </div>
            )}

            {wizardStep === 3 && (
              <div className="space-y-4">
                <h3 className="font-semibold">Step 3: Carrier & Tracking</h3>
                <div className="space-y-2">
                  {[
                    { id: 'milk_run', label: 'Milk Run', desc: 'Internal delivery route' },
                    { id: 'ups', label: 'UPS', desc: 'External carrier with tracking' }
                  ].map(carrier => (
                    <button
                      key={carrier.id}
                      onClick={() => setWizardData(prev => ({ ...prev, carrierType: carrier.id }))}
                      className={`w-full p-4 border-2 rounded-lg text-left ${
                        wizardData.carrierType === carrier.id ? 'border-blue-600 bg-blue-50' : 'border-gray-200'
                      }`}
                    >
                      <p className="font-bold">{carrier.label}</p>
                      <p className="text-sm text-gray-500">{carrier.desc}</p>
                    </button>
                  ))}
                </div>
                {wizardData.carrierType === 'ups' && (
                  <div>
                    <label className="block text-sm font-medium mb-1">Tracking Number</label>
                    <input
                      type="text"
                      value={wizardData.trackingNumber}
                      onChange={(e) => setWizardData(prev => ({ ...prev, trackingNumber: e.target.value }))}
                      placeholder="1Z999AA10123456784"
                      className="w-full px-4 py-2 border rounded-lg"
                    />
                  </div>
                )}
                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setWizardStep(2)}>Back</Button>
                  <Button onClick={() => setWizardStep(4)}>Next</Button>
                </div>
              </div>
            )}

            {wizardStep === 4 && (
              <div className="space-y-4">
                <h3 className="font-semibold">Step 4: Configure Boxes & Weights</h3>
                
                <div className="bg-blue-50 p-3 rounded-lg">
                  <label className="block text-xs font-bold text-blue-800 uppercase mb-1">Batch ID</label>
                  <input
                    type="text"
                    value={wizardData.batchId || ''}
                    onChange={(e) => setWizardData(prev => ({ ...prev, batchId: e.target.value.toUpperCase() }))}
                    placeholder={`B-${new Date().getFullYear()}-001`}
                    className="w-full px-3 py-2 border rounded-lg font-mono text-sm"
                  />
                </div>

                {wizardData.shipmentType === 'emergency' ? (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">Select boxes, set quantity and weights:</p>
                    {['A', 'B1', 'B2', 'CD', 'E'].map(boxId => (
                      <label key={boxId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={emergencyBoxes[boxId]}
                            onChange={(e) => setEmergencyBoxes(prev => ({ ...prev, [boxId]: e.target.checked }))}
                            className="w-5 h-5"
                          />
                          <div>
                            <p className="font-medium">Box {boxId}</p>
                            <p className="text-xs text-gray-500">{BOX_DESCRIPTORS[boxId]}</p>
                          </div>
                        </div>
                        {emergencyBoxes[boxId] && (
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min="1"
                              max="5"
                              value={boxCounts[boxId] || 1}
                              onChange={(e) => setBoxCounts(prev => ({ ...prev, [boxId]: parseInt(e.target.value) || 1 }))}
                              className="w-12 px-2 py-1 border rounded text-center text-sm"
                            />
                            <span className="text-xs text-gray-400">qty</span>
                            <input
                              type="number"
                              step="0.1"
                              value={boxWeights[boxId] || '40.0'}
                              onChange={(e) => setBoxWeights(prev => ({ ...prev, [boxId]: e.target.value }))}
                              className={`w-16 px-2 py-1 border rounded text-center text-sm ${parseFloat(boxWeights[boxId]) > 46.5 ? 'border-red-500 bg-red-50' : ''}`}
                            />
                            <span className="text-xs text-gray-400">lb</span>
                          </div>
                        )}
                      </label>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">Set weight for each box (in pounds):</p>
                    {(wizardData.shipmentType === 'ingredients' ? ['A', 'B1', 'B2', 'CD'] : ['E']).map(boxId => (
                      <div key={boxId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center font-bold text-xs">{boxId}</span>
                          <div>
                            <p className="font-medium text-sm">{BOX_DESCRIPTORS[boxId]}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            step="0.1"
                            value={boxWeights[boxId] || '40.0'}
                            onChange={(e) => setBoxWeights(prev => ({ ...prev, [boxId]: e.target.value }))}
                            className={`w-20 px-2 py-1 border rounded text-right font-bold ${parseFloat(boxWeights[boxId]) > 46.5 ? 'border-red-500 bg-red-50' : ''}`}
                          />
                          <span className="text-xs text-gray-500 w-4">lb</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="bg-amber-50 p-3 rounded-lg border border-amber-200">
                  <p className="text-xs font-bold text-amber-800">
                    Labels will auto-download as PNG files after creating the shipment.
                  </p>
                </div>

                <div className="bg-gray-50 p-3 rounded-lg text-xs space-y-1">
                  <p><strong>Site:</strong> {supplyClosetData.sites.find(s => s.site_id === wizardData.siteId)?.venue_name}</p>
                  <p><strong>Type:</strong> {getTypeLabel(wizardData.shipmentType)} | <strong>Carrier:</strong> {wizardData.carrierType === 'ups' ? 'UPS' : 'Milk Run'}</p>
                </div>

                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setWizardStep(3)}>Back</Button>
                  <Button 
                    onClick={handleCreateShipment} 
                    disabled={creating || (wizardData.shipmentType === 'ingredients' ? ['A', 'B1', 'B2', 'CD'] : wizardData.shipmentType === 'cups' ? ['E'] : Object.entries(emergencyBoxes).filter(([_, s]) => s).map(([id]) => id)).some(id => parseFloat(boxWeights[id]) > 46.5)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {creating ? 'Creating...' : 'Finalize & Download Labels'}
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}

      {selectedShipment && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 overflow-y-auto" onClick={() => setSelectedShipment(null)}>
          <Card className="max-w-2xl w-full p-6 my-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-bold">Shipment {selectedShipment.shipment_id}</h2>
                <p className="text-gray-500">{selectedShipment.venue_name || selectedShipment.site_id}</p>
              </div>
              <button onClick={() => setSelectedShipment(null)} className="text-2xl font-bold text-gray-500 hover:text-gray-700">×</button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-xs text-gray-500 uppercase font-bold mb-1">Status</p>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedShipment.status)}`}>
                    {selectedShipment.status}
                  </span>
                </div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-xs text-gray-500 uppercase font-bold mb-1">Carrier</p>
                <p className="text-sm font-medium">
                  {selectedShipment.carrier_type === "ups" ? "UPS" : "Milk Run"}
                  {selectedShipment.tracking_number && ` (${selectedShipment.tracking_number})`}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-bold border-b pb-2">Boxes ({selectedShipment.boxes?.length || 0})</h3>
              <div className="space-y-2">
                {selectedShipment.boxes?.map((box, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center font-bold text-xs">
                        {box.box_id || box.boxId}
                      </span>
                      <div>
                        <p className="font-bold text-sm">Box {box.box_number || box.boxNumber} of {box.total_in_set || box.totalInSet}</p>
                        <p className="text-xs text-gray-500">{BOX_DESCRIPTORS[box.box_id || box.boxId]}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-sm">{box.weight} LB</p>
                      <p className="text-[10px] font-mono text-gray-400">BATCH: {box.batch_id || box.batchId}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setSelectedShipment(null)}>Close</Button>
            </div>
          </Card>
        </div>
      )}

      {packingBox && selectedShipment && (
        <PackingLogFormModal
          box={packingBox}
          shipment={selectedShipment}
          user={user}
          onClose={() => setPackingBox(null)}
          onSuccess={() => {
            handleViewShipment(selectedShipment.shipment_id);
          }}
        />
      )}
      
      {labelBox && selectedShipment && (
        <LabelPreviewModal
          box={labelBox}
          shipment={selectedShipment}
          user={user}
          onClose={() => setLabelBox(null)}
          onSuccess={() => {
            handleViewShipment(selectedShipment.shipment_id);
          }}
        />
      )}
    </div>
  );
};

// --- 8C. OWNER OPS MANAGEMENT PAGE ---

// Seed mock data for ops dashboard - TECHNICIAN-REPORTED DATA ONLY
const seedOpsData = () => {
  return {
    technicians: [
      { id: 'Tech-042', name: 'Sarah Chen', xp: 4200, streak: 12, onTimeRate: 98, badges: ['🥇 Clean Freak', '⚡ Fast Fixer'] },
      { id: 'Tech-017', name: 'Mike Johnson', xp: 3400, streak: 8, onTimeRate: 95, badges: ['🔧 Troubleshooter'] },
      { id: 'Tech-029', name: 'Emma Davis', xp: 2800, streak: 5, onTimeRate: 92, badges: [] }
    ],
    recentVisits: [
      { 
        id: 1, machineId: 'M-001', machineName: 'Lobby Latte', location: 'Main Lobby',
        techId: 'Tech-042', techName: 'Sarah Chen', visitType: 'weekly', 
        completedAt: new Date(Date.now() - 2*24*60*60*1000), 
        problems: {}, notes: 'Everything running smoothly', 
        photos: 3, syncedToMachineApp: true
      },
      { 
        id: 2, machineId: 'M-002', machineName: 'Cafe Central', location: 'Cafeteria',
        techId: 'Tech-017', techName: 'Mike Johnson', visitType: 'repair', 
        completedAt: new Date(Date.now() - 8*24*60*60*1000), 
        problems: { 'Grinder Timeout': true, 'Brew Pressure Low': true }, 
        notes: 'Grinder issues persist - may need replacement',
        photos: 5, syncedToMachineApp: false
      },
      { 
        id: 3, machineId: 'M-003', machineName: 'Building B Express', location: 'Building B',
        techId: 'Tech-042', techName: 'Sarah Chen', visitType: 'weekly', 
        completedAt: new Date(Date.now() - 1*24*60*60*1000), 
        problems: {}, notes: 'Cleaned and restocked',
        photos: 2, syncedToMachineApp: true
      },
      { 
        id: 4, machineId: 'M-004', machineName: 'North Wing Wonder', location: 'North Wing',
        techId: 'Tech-029', techName: 'Emma Davis', visitType: 'weekly', 
        completedAt: new Date(Date.now() - 7*24*60*60*1000), 
        problems: {}, notes: 'Routine maintenance completed',
        photos: 1, syncedToMachineApp: true
      },
      { 
        id: 5, machineId: 'M-005', machineName: 'Rooftop Refresher', location: 'Rooftop Lounge',
        techId: 'Tech-017', techName: 'Mike Johnson', visitType: 'repair', 
        completedAt: new Date(Date.now() - 10*24*60*60*1000), 
        problems: { 'Power Loss': true, 'Water Line Disconnected': true }, 
        notes: 'Critical - water line disconnected, machine offline',
        photos: 4, syncedToMachineApp: false
      }
    ],
    reportedProblems: [
      { id: 1, machineId: 'M-002', machineName: 'Cafe Central', severity: 'high', problem: 'Grinder Timeout', reportedBy: 'Mike Johnson', count: 3, lastReported: '8 days ago' },
      { id: 2, machineId: 'M-005', machineName: 'Rooftop Refresher', severity: 'critical', problem: 'Water Line Disconnected', reportedBy: 'Mike Johnson', count: 1, lastReported: '10 days ago' },
      { id: 3, machineId: 'M-002', machineName: 'Cafe Central', severity: 'high', problem: 'Brew Pressure Low', reportedBy: 'Mike Johnson', count: 2, lastReported: '8 days ago' }
    ]
  };
};

const OwnerOpsPage = ({ user, onClose, onNavigateYile }) => {
  const [activeTab, setActiveTab] = useState('fleet');
  const [opsData, setOpsData] = useState(seedOpsData());
  const [selectedMachine, setSelectedMachine] = useState(null);
  const [selectedVisitDetail, setSelectedVisitDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showMachineModal, setShowMachineModal] = useState(false);
  const [showVideoManager, setShowVideoManager] = useState(false);
  const [editingMachine, setEditingMachine] = useState(null);
  const [machineForm, setMachineForm] = useState({
    machineId: '',
    nickname: '',
    location: '',
    status: 'active'
  });
  
  const [supplyClosetData, setSupplyClosetData] = useState({
    sites: [],
    shipments: [],
    incidents: [],
    tasks: []
  });
  const [supplyLoading, setSupplyLoading] = useState(false);
  
  // Fetch real data from backend
  useEffect(() => {
    const fetchOpsData = async () => {
      setLoading(true);
      try {
        const opsToken = user?.opsToken || '';
        const headers = opsToken ? { 'x-ops-token': opsToken } : {};
        
        const [fleetRes, techsRes, visitsRes, prizesRes] = await Promise.all([
          fetch('/api/ops/fleet', { headers }).catch(e => ({ ok: false, error: e })),
          fetch('/api/ops/technicians', { headers }).catch(e => ({ ok: false, error: e })),
          fetch('/api/ops/visits?limit=50', { headers }).catch(e => ({ ok: false, error: e })),
          fetch('/api/ops/prizes', { headers }).catch(e => ({ ok: false, error: e }))
        ]);
        
        // Only parse JSON if response is OK
        const fleetData = fleetRes.ok ? await fleetRes.json().catch(() => ({})) : {};
        const techsData = techsRes.ok ? await techsRes.json().catch(() => ({})) : {};
        const visitsData = visitsRes.ok ? await visitsRes.json().catch(() => ({})) : {};
        const prizesData = prizesRes.ok ? await prizesRes.json().catch(() => ({})) : {};
        
        // Process and combine data
        setOpsData({
          machines: fleetData.machines || [],
          technicians: techsData.technicians || [],
          recentVisits: visitsData.visits || [],
          recentPrizes: prizesData.prizes || [],
          recentPhotos: [], // TODO: Implement photo audit
          aiAlerts: [
            { id: 1, machineId: 'M-002', severity: 'high', message: 'Machine #002 has had "Grinder Timeout" errors. Recommend service check.' },
            { id: 2, machineId: 'M-004', severity: 'medium', message: 'Machine #004 service is due. Schedule maintenance.' }
          ]
        });
      } catch (error) {
        console.error('Failed to fetch ops data:', error);
        // Keep using seed data on error
      } finally {
        setLoading(false);
      }
    };
    
    fetchOpsData().catch(err => console.error('fetchOpsData error:', err));
    // Refresh data every 30 seconds
    const interval = setInterval(() => fetchOpsData().catch(err => console.error('fetchOpsData refresh error:', err)), 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchSupplyClosetData = async () => {
      setSupplyLoading(true);
      try {
        const supplyHeaders = {
          'x-user-id': 'ops-001',
          'x-user-name': user?.displayName || 'Ops Manager',
          'x-user-role': 'ops_manager'
        };
        
        const [sitesRes, shipmentsRes, incidentsRes, tasksRes] = await Promise.all([
          fetch('/api/ops/sites', { headers: supplyHeaders }).catch(() => ({ ok: false })),
          fetch('/api/ops/shipments', { headers: supplyHeaders }).catch(() => ({ ok: false })),
          fetch('/api/ops/incidents', { headers: supplyHeaders }).catch(() => ({ ok: false })),
          fetch('/api/ops/tasks', { headers: supplyHeaders }).catch(() => ({ ok: false }))
        ]);
        
        const sitesData = sitesRes.ok ? await sitesRes.json().catch(() => ({})) : {};
        const shipmentsData = shipmentsRes.ok ? await shipmentsRes.json().catch(() => ({})) : {};
        const incidentsData = incidentsRes.ok ? await incidentsRes.json().catch(() => ({})) : {};
        const tasksData = tasksRes.ok ? await tasksRes.json().catch(() => ({})) : {};
        
        setSupplyClosetData({
          sites: sitesData.sites || [],
          shipments: shipmentsData.shipments || [],
          incidents: incidentsData.incidents || [],
          tasks: tasksData.tasks || []
        });
      } catch (error) {
        console.error('Failed to fetch supply closet data:', error);
      } finally {
        setSupplyLoading(false);
      }
    };
    
    fetchSupplyClosetData();
  }, []);

  const [techForm, setTechForm] = useState({ technicianId: '', name: '' });
  const [recipes, setRecipes] = useState({
    powders: [
      { id: 'oat_milk', emoji: '🌾', name: 'Oat Milk' },
      { id: 'dairy_milk', emoji: '🥛', name: 'Dairy Milk' },
      { id: 'chai', emoji: '🍂', name: 'Chai' },
      { id: 'cocoa', emoji: '🍫', name: 'Cocoa Powder' },
      { id: 'empty', emoji: '🚫', name: '(Empty)' },
      { id: 'sugar', emoji: '🍬', name: 'Cane Sugar' },
      { id: 'matcha', emoji: '🍵', name: 'Oat Matcha Mix' }
    ],
    syrups: [
      { id: 'brown_sugar', emoji: '🧋', name: 'Brown Sugar' },
      { id: 'vanilla', emoji: '🍦', name: 'Vanilla' },
      { id: 'strawberry', emoji: '🍓', name: 'Strawberry' },
      { id: 'coconut', emoji: '🥥', name: 'Coconut' },
      { id: 'lavender', emoji: '🌸', name: 'Lavender' }
    ]
  });

  const tabs = [
    { id: 'fleet', label: 'Fleet Command', icon: Activity },
    { id: 'cleanings', label: 'Cleaning & Submission', icon: CheckCircle },
    { id: 'supply', label: 'Supply Closet', icon: Building2 },
    { id: 'shipments', label: 'Shipments', icon: Truck },
    { id: 'labels', label: 'Label Station', icon: Printer },
    { id: 'ai', label: 'AI Insights', icon: Sparkles },
    { id: 'inventory', label: 'Inventory', icon: Package },
    { id: 'admin', label: 'Admin', icon: Settings }
  ];

  const handleViewCleaningProfile = (machine) => {
    alert(`📋 Cleaning Profile for ${machine.nickname}\n\nLast Visit: ${machine.lastVisit}\nStatus: ${machine.status}\n\nThis would open the detailed cleaning profile in the tech app.`);
  };

  const handleViewVisitDetail = async (visitId) => {
    try {
      const opsToken = user?.opsToken || '';
      if (!opsToken) {
        alert('❌ Authentication required. Please log in again.');
        return;
      }
      
      const response = await fetch(`/api/ops/visits/${visitId}`, {
        headers: { 'x-ops-token': opsToken }
      });
      const result = await response.json();
      
      if (result.success) {
        setSelectedVisitDetail(result);
      } else {
        alert('❌ Failed to load cleaning details: ' + result.error);
      }
    } catch (error) {
      console.error('Failed to load visit details:', error);
      alert('❌ Failed to load cleaning details');
    }
  };

  const handlePhotoApprove = (photoId) => {
    alert(`✓ Photo approved! +50 XP awarded to technician`);
  };

  const handlePhotoReject = (photoId) => {
    alert(`✗ Photo flagged for review`);
  };
  
  
  const convertToCSV = (data, type) => {
    if (!data || data.length === 0) return '';
    
    // Helper to extract value from optionSelections (handles nested objects)
    const getOptionValue = (optionSelections, key) => {
      if (!optionSelections || !optionSelections[key]) return 'N/A';
      const option = optionSelections[key];
      // Handle nested object structure: { label, value } or just string
      return typeof option === 'object' ? (option.value || option.label || 'N/A') : option;
    };
    
    if (type === 'visits') {
      const headers = ['Date', 'Technician', 'Machine', 'Type', 'Bean Hopper', 'Oat Milk', 'Dairy', 'Chai', 'Cocoa', 'Sugar', 'Matcha', 'Cups', 'Problems', 'Notes'];
      const rows = data.map(v => [
        new Date(v.completedAt).toLocaleDateString(),
        v.technicianId,
        v.machineId,
        v.visitType,
        getOptionValue(v.optionSelections, 'BEAN_HOPPER'),
        getOptionValue(v.optionSelections, 'CANISTER_1_OAT'),
        getOptionValue(v.optionSelections, 'CANISTER_2_DAIRY'),
        getOptionValue(v.optionSelections, 'CANISTER_3_CHAI'),
        getOptionValue(v.optionSelections, 'CANISTER_4_COCOA'),
        getOptionValue(v.optionSelections, 'CANISTER_6_SUGAR'),
        getOptionValue(v.optionSelections, 'CANISTER_7_MATCHA'),
        getOptionValue(v.optionSelections, 'CUPS_LIDS'),
        Object.values(v.problems || {}).join('; '),
        v.textInputs?.VISIT_NOTES || ''
      ]);
      return [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    }
    
    const headers = Object.keys(data[0]);
    const rows = data.map(row => headers.map(h => JSON.stringify(row[h] || '')));
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  };

  const handleExportData = async (type) => {
    try {
      const opsToken = user?.opsToken || '';
      if (!opsToken) {
        alert('❌ Authentication required. Please log in again.');
        return;
      }
      
      const response = await fetch(`/api/ops/export/${type}`, {
        headers: { 'x-ops-token': opsToken }
      });
      const result = await response.json();
      
      if (result.success) {
        const csvData = convertToCSV(result.data, type);
        const blob = new Blob([csvData], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `jolt-${type}-export-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        alert(`✓ ${type.toUpperCase()} CSV exported successfully!`);
      }
    } catch (error) {
      console.error('Export failed:', error);
      alert('❌ Export failed. Please try again.');
    }
  };

  const handleAddMachine = () => {
    setEditingMachine(null);
    setMachineForm({ machineId: '', nickname: '', location: '', status: 'active', notes: '' });
    setShowMachineModal(true);
  };

  const handleEditMachine = (machine) => {
    setEditingMachine(machine);
    setMachineForm({ 
      machineId: machine.id, 
      nickname: machine.nickname, 
      location: machine.location, 
      status: machine.status,
      notes: machine.notes || ''
    });
    setShowMachineModal(true);
  };

  const handleSaveMachine = async () => {
    try {
      const opsToken = user?.opsToken || '';
      if (!opsToken) {
        alert('❌ Authentication required. Please log in again.');
        return;
      }
      
      const result = await api.ops.machines[editingMachine ? 'update' : 'create'](
        editingMachine ? machineForm.machineId : null,
        machineForm,
        opsToken
      );
      alert(`✓ Machine ${editingMachine ? 'updated' : 'created'} successfully!`);
      setShowMachineModal(false);
      
      setOpsData(prev => ({
        ...prev,
        machines: editingMachine
          ? prev.machines.map(m => m.id === machineForm.machineId ? { ...m, ...machineForm } : m)
          : [...prev.machines, { id: machineForm.machineId, ...machineForm }]
      }));
    } catch (error) {
      console.error('Save machine failed:', error);
      alert('❌ Save failed: ' + error.message);
    }
  };

  const handleDeleteMachine = async (machineId) => {
    if (!confirm(`Delete machine ${machineId}? This cannot be undone.`)) return;
    try {
      const opsToken = user?.opsToken || '';
      if (!opsToken) {
        alert('❌ Authentication required. Please log in again.');
        return;
      }
      
      await api.ops.machines.delete(machineId, opsToken);
      alert('✓ Machine deleted successfully!');
      
      setOpsData(prev => ({
        ...prev,
        machines: prev.machines.filter(m => m.id !== machineId)
      }));
    } catch (error) {
      console.error('Delete failed:', error);
      alert('❌ Delete failed: ' + error.message);
    }
  };

  const totalTechs = opsData.technicians.length;
  const recentVisitsCount = opsData.recentVisits ? opsData.recentVisits.length : 0;
  const reportedIssuesCount = opsData.reportedProblems ? opsData.reportedProblems.length : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-slate-700 to-slate-900 text-white p-4 md:p-6 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:mb-6 mb-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Ops Manager</h1>
              <p className="text-xs md:text-sm text-slate-300">Technician Reports & Service Tracking</p>
            </div>
            <Button onClick={onClose} variant="secondary" className="w-full md:w-auto">
              <X size={18} />
              Logout
            </Button>
          </div>
          
          <div className="overflow-x-auto -mx-4 md:mx-0 px-4 md:px-0">
            <div className="flex gap-2 md:flex-wrap min-w-max md:min-w-0">
              {tabs.map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-1 md:gap-2 px-3 md:px-4 py-2 rounded-lg font-semibold text-xs md:text-sm transition-all whitespace-nowrap md:whitespace-normal ${
                      activeTab === tab.id 
                        ? 'bg-white text-slate-900' 
                        : 'bg-slate-800/50 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <Icon size={16} className="md:block" />
                    <span className="hidden md:inline">{tab.label}</span>
                    <span className="md:hidden">{tab.label.split(' ')[0]}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 md:p-6">
        {activeTab === 'fleet' && (
          <>
            <Card className="p-4 md:p-6">
              <h2 className="text-lg md:text-xl font-bold mb-4 flex items-center gap-2">
                <Activity size={20} />
                Fleet Status
              </h2>
              <div className="space-y-3">
                {opsData.machines && opsData.machines.length > 0 ? opsData.machines.map((machine, idx) => {
                  const lastVisit = opsData.recentVisits?.find(v => v.machineId === machine.machineId);
                  const daysAgo = lastVisit ? Math.floor((Date.now() - new Date(lastVisit.completedAt)) / (1000 * 60 * 60 * 24)) : 999;
                  let statusIcon = '🟢';
                  if (daysAgo > 30) statusIcon = '🔴';
                  else if (daysAgo > 7) statusIcon = '🟡';
                  
                  return (
                    <div key={idx} className="bg-gray-50 rounded-lg p-4 border border-gray-200 cursor-pointer hover:bg-gray-100 transition">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xl">{statusIcon}</span>
                            <p className="font-bold text-gray-900">{machine.machineId}</p>
                          </div>
                          <p className="text-xs text-gray-500">{machine.nickname || machine.location}</p>
                        </div>
                        <span className="text-xs font-semibold px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                          {daysAgo <= 7 ? 'OK' : daysAgo <= 30 ? 'WARNING' : 'DOWN'}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 mt-3 pt-3 border-t border-gray-200">
                        <div>
                          <p className="text-gray-500 text-xs">Last Service</p>
                          <p className="font-semibold text-gray-900">{lastVisit ? `${daysAgo}d ago` : 'Never'}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs">Technician</p>
                          <p className="font-semibold text-gray-900">{lastVisit?.technicianId || 'N/A'}</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-gray-500 text-xs">Refilled</p>
                          <p className="font-semibold text-gray-900">
                            {lastVisit?.optionSelections ? Object.entries(lastVisit.optionSelections)
                              .filter(([k, v]) => k.includes('CANISTER') || k.includes('CUPS') || k.includes('BEANS'))
                              .slice(0, 2)
                              .map(([k, v]) => v?.value || v?.label || 'Refilled')
                              .join(', ') : 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                }) : (
                  <div className="py-8 text-center text-gray-500">
                    <p className="text-sm">No machines created yet. Use the form below to add machines.</p>
                  </div>
                )}
              </div>
            </Card>

            <Card className="p-6 mt-6">
              <h2 className="text-lg font-bold mb-4">Add New Machine</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Machine ID (e.g., MAIN-01)"
                  value={machineForm.machineId}
                  onChange={(e) => setMachineForm({...machineForm, machineId: e.target.value})}
                  className="px-4 py-2 border border-gray-300 rounded-lg"
                />
                <input
                  type="text"
                  placeholder="Nickname/Location"
                  value={machineForm.nickname}
                  onChange={(e) => setMachineForm({...machineForm, nickname: e.target.value})}
                  className="px-4 py-2 border border-gray-300 rounded-lg"
                />
                <input
                  type="text"
                  placeholder="Full Location/Address"
                  value={machineForm.location}
                  onChange={(e) => setMachineForm({...machineForm, location: e.target.value})}
                  className="px-4 py-2 border border-gray-300 rounded-lg"
                />
                <select
                  value={machineForm.status}
                  onChange={(e) => setMachineForm({...machineForm, status: e.target.value})}
                  className="px-4 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="active">Active</option>
                  <option value="service_due">Service Due</option>
                  <option value="offline">Offline</option>
                </select>
              </div>
              <textarea
                placeholder="Notes for technicians (e.g., 'Check grinder alignment' or 'Water line has slow leak')"
                value={machineForm.notes}
                onChange={(e) => setMachineForm({...machineForm, notes: e.target.value})}
                className="mt-4 w-full px-4 py-2 border border-gray-300 rounded-lg min-h-24"
              />
              <button
                onClick={handleSaveMachine}
                className="mt-4 w-full px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700"
              >
                + Add Machine
              </button>
            </Card>
          </>
        )}

        {activeTab === 'inventory' && (
          <>
            <Card className="p-6 mb-6 bg-gradient-to-r from-blue-50 to-cyan-50">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Package size={20} />
                Monday Pick List
              </h2>
              <div className="bg-white rounded-lg p-4 mb-4">
                <h3 className="font-bold text-gray-900 mb-3">To Ship This Week:</h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li>• 45 Bags Oat Milk Powder</li>
                  <li>• 12 Bottles Vanilla Syrup</li>
                  <li>• 8 Bottles Mocha Syrup</li>
                  <li>• 500 Paper Cups (16oz)</li>
                  <li>• 25 lbs Coffee Beans (Colombian Blend)</li>
                </ul>
              </div>
              <Button className="w-full">
                <Download size={18} />
                Export PDF
              </Button>
            </Card>

            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <AlertTriangle size={20} className="text-yellow-600" />
                Consumption Variance
              </h2>
              <div className="space-y-3">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="font-bold text-gray-900 mb-1">Machine #004: Inventory Mismatch</p>
                  <p className="text-sm text-gray-700">Sold 50 lattes but no Oat Milk refill logged in last 7 days</p>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="font-bold text-gray-900 mb-1">Machine #002: Low Stock Alert</p>
                  <p className="text-sm text-gray-700">Bean hopper at 25% capacity, recommend immediate refill</p>
                </div>
              </div>
            </Card>
          </>
        )}

        {activeTab === 'admin' && (
          <div className="space-y-6">
            <Card className="p-6 bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200">
              <h2 className="text-xl font-bold mb-3 flex items-center gap-2">
                <Coffee size={20} className="text-amber-600" />
                Yile Coffee Machine Control
              </h2>
              <p className="text-gray-600 text-sm mb-4">
                Manage coffee machine #00000020868 - test brew, view status, and run diagnostics.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => onNavigateYile && onNavigateYile('missionpanel')}
                  className="px-4 py-3 bg-amber-600 text-white font-bold rounded-lg hover:bg-amber-700 flex items-center justify-center gap-2"
                >
                  <Zap size={18} />
                  Mission Panel
                </button>
                <button
                  onClick={() => onNavigateYile && onNavigateYile('admindiagnostics')}
                  className="px-4 py-3 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700 flex items-center justify-center gap-2"
                >
                  <Settings size={18} />
                  Diagnostics
                </button>
              </div>
            </Card>

            <Card className="p-6 bg-gradient-to-r from-purple-50 to-blue-50">
              <h2 className="text-xl font-bold mb-3 flex items-center gap-2">
                <PlayCircle size={20} className="text-purple-600" />
                Instructional Videos
              </h2>
              <p className="text-gray-600 text-sm mb-4">
                Upload how-to videos for each maintenance step. Technicians can watch these during their visits.
              </p>
              <button
                onClick={() => setShowVideoManager(true)}
                className="w-full px-4 py-3 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700 flex items-center justify-center gap-2"
              >
                <Video size={18} />
                Manage Videos
              </button>
            </Card>

            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Users size={20} />
                Technician Management
              </h2>
              <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                <h3 className="font-bold text-gray-900 mb-3">Add New Technician</h3>
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Tech ID (e.g., TECH-001)"
                    value={techForm.technicianId}
                    onChange={(e) => setTechForm({...techForm, technicianId: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={techForm.name}
                    onChange={(e) => setTechForm({...techForm, name: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                  <button
                    onClick={() => {
                      alert(`✓ Technician "${techForm.name}" (${techForm.technicianId}) added!`);
                      setTechForm({ technicianId: '', name: '' });
                    }}
                    className="w-full px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700"
                  >
                    + Add Technician
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="font-bold text-gray-900 mb-2">Active Technicians</h3>
                {opsData.technicians.length > 0 ? (
                  opsData.technicians.map((tech, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                      <div>
                        <p className="font-bold text-gray-900">{tech.name}</p>
                        <p className="text-xs text-gray-500">{tech.technicianId || tech.id} • {tech.totalVisits || 0} visits</p>
                      </div>
                      <button
                        onClick={() => alert(`❌ Remove ${tech.name}?`)}
                        className="px-3 py-1 bg-red-100 text-red-700 text-sm rounded hover:bg-red-200"
                      >
                        Remove
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm">No technicians yet</p>
                )}
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Coffee size={20} />
                Manage Recipes & Ingredients
              </h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="font-bold text-gray-900 mb-3">Powder Canisters (7)</h3>
                  <div className="space-y-2">
                    {recipes.powders.map((powder, idx) => (
                      <div key={powder.id} className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg">
                        <span className="text-xl">{powder.emoji}</span>
                        <div className="flex-1">
                          <input
                            type="text"
                            value={powder.name}
                            onChange={(e) => {
                              const updated = [...recipes.powders];
                              updated[idx].name = e.target.value;
                              setRecipes({...recipes, powders: updated});
                            }}
                            className="px-2 py-1 border border-gray-300 rounded text-sm w-full"
                          />
                        </div>
                        <button
                          onClick={() => {
                            setRecipes({
                              ...recipes,
                              powders: recipes.powders.filter((_, i) => i !== idx)
                            });
                          }}
                          className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded hover:bg-red-200"
                        >
                          Delete
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-gray-900 mb-3">Syrups</h3>
                  <div className="space-y-2">
                    {recipes.syrups.map((syrup, idx) => (
                      <div key={syrup.id} className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg">
                        <span className="text-xl">{syrup.emoji}</span>
                        <div className="flex-1">
                          <input
                            type="text"
                            value={syrup.name}
                            onChange={(e) => {
                              const updated = [...recipes.syrups];
                              updated[idx].name = e.target.value;
                              setRecipes({...recipes, syrups: updated});
                            }}
                            className="px-2 py-1 border border-gray-300 rounded text-sm w-full"
                          />
                        </div>
                        <button
                          onClick={() => {
                            setRecipes({
                              ...recipes,
                              syrups: recipes.syrups.filter((_, i) => i !== idx)
                            });
                          }}
                          className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded hover:bg-red-200"
                        >
                          Delete
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => alert('✓ Recipes saved! (Local demo only - update src/App.jsx lines 4169-4188 to persist)')}
                  className="w-full px-4 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700"
                >
                  Save Recipe Changes
                </button>
              </div>
            </Card>
          </div>
        )}


        {activeTab === 'cleanings' && (
          <div className="space-y-4">
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <CheckCircle size={20} className="text-blue-600" />
                Recent Visits & Cleanings
              </h2>
              <div className="space-y-3">
                {opsData.recentVisits && opsData.recentVisits.length > 0 ? (
                  opsData.recentVisits.map((visit, idx) => (
                    <div key={idx} className="bg-gray-50 rounded-lg p-4 border border-gray-200 cursor-pointer hover:bg-gray-100 hover:border-blue-400 transition" onClick={() => handleViewVisitDetail(visit.id)}>
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-bold text-gray-900">
                            {visit.visitType === 'weekly' ? '📅 Weekly Visit' : '🧹 Monthly Deep Clean'}
                          </p>
                          <p className="text-xs text-gray-500">Tech: {visit.technicianId} • Machine: {visit.machineId}</p>
                        </div>
                      </div>
                      <p className="text-xs text-gray-600 mb-2">{new Date(visit.completedAt).toLocaleDateString()}</p>
                      <p className="text-xs text-gray-700 mt-2">📋 Click to view full cleaning report with photos and details</p>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm">No visits recorded yet. Visits will appear here as technicians complete them.</p>
                )}
              </div>
            </Card>

          </div>
        )}

        {activeTab === 'supply' && (
          <div className="space-y-4">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Building2 size={20} className="text-teal-600" />
                  Technician Sites
                </h2>
                <span className="text-sm text-gray-500">{supplyClosetData.sites.length} sites</span>
              </div>
              {supplyLoading ? (
                <div className="text-center py-8">
                  <RefreshCw className="w-8 h-8 text-gray-300 mx-auto animate-spin" />
                </div>
              ) : supplyClosetData.sites.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-8">No technician sites configured yet.</p>
              ) : (
                <div className="space-y-3">
                  {supplyClosetData.sites.map(site => (
                    <div key={site.site_id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-bold text-gray-900">{site.venue_name}</p>
                          <p className="text-xs text-gray-500">Technician: {site.partner_id}</p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          site.status === 'active' ? 'bg-green-100 text-green-700' :
                          site.status === 'hold' ? 'bg-amber-100 text-amber-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {site.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <AlertTriangle size={20} className="text-amber-600" />
                Open Incidents
              </h2>
              {supplyClosetData.incidents.filter(i => i.status === 'open' || i.status === 'escalated').length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-4">No open incidents</p>
              ) : (
                <div className="space-y-3">
                  {supplyClosetData.incidents.filter(i => i.status === 'open' || i.status === 'escalated').map(incident => (
                    <div key={incident.incident_id} className={`rounded-lg p-4 border-2 ${
                      incident.severity === 'critical' ? 'bg-red-50 border-red-300' :
                      incident.severity === 'high' ? 'bg-amber-50 border-amber-300' :
                      'bg-blue-50 border-blue-300'
                    }`}>
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-bold">{incident.type}</p>
                          <p className="text-xs text-gray-600">Site {incident.site_id} - {incident.severity}</p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          incident.status === 'escalated' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {incident.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        )}

        {activeTab === 'shipments' && (
          <ShipmentsTab 
            supplyClosetData={supplyClosetData}
            setSupplyClosetData={setSupplyClosetData}
            supplyLoading={supplyLoading}
            user={user}
          />
        )}

        {activeTab === 'labels' && (
          <LabelStation onBack={() => setActiveTab('fleet')} />
        )}

        {activeTab === 'label-generator' && (
          <LabelGeneratorAdmin onBack={() => setActiveTab('fleet')} />
        )}

        {activeTab === 'ai' && (
          <div className="space-y-4">
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Sparkles size={20} className="text-blue-600" />
                Predictive Maintenance Alerts
              </h2>
              <div className="space-y-3">
                {opsData.aiAlerts.map(alert => {
                  const colors = {
                    critical: 'bg-red-50 border-red-300 text-red-900',
                    high: 'bg-orange-50 border-orange-300 text-orange-900',
                    medium: 'bg-yellow-50 border-yellow-300 text-yellow-900'
                  };
                  return (
                    <div key={alert.id} className={`border-2 rounded-lg p-4 ${colors[alert.severity]}`}>
                      <div className="flex items-start gap-3">
                        <AlertTriangle size={20} className="mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-bold mb-1">{alert.severity.toUpperCase()} ALERT</p>
                          <p className="text-sm">{alert.message}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <MessageCircle size={20} />
                Recent AI Chat Logs
              </h2>
              <div className="space-y-3">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Tech #042 asked:</p>
                  <p className="font-semibold text-gray-900">"How do I remove the brewer assembly?"</p>
                  <p className="text-xs text-blue-600 mt-2">✓ AI provided step-by-step video guide</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Tech #017 asked:</p>
                  <p className="font-semibold text-gray-900">"Grinder making loud noise - what's wrong?"</p>
                  <p className="text-xs text-blue-600 mt-2">✓ AI diagnosed: Foreign object in grinder, recommended disassembly</p>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>

      {selectedMachine && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setSelectedMachine(null)}>
          <Card className="max-w-2xl w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-2xl font-bold mb-4">{selectedMachine.nickname}</h2>
            <p className="text-gray-600 mb-4">{selectedMachine.id} • {selectedMachine.location}</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Beans</p>
                <p className="text-2xl font-bold">{selectedMachine.inventory.beans}%</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Oat Milk</p>
                <p className="text-2xl font-bold">{selectedMachine.inventory.oat}%</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Vanilla</p>
                <p className="text-2xl font-bold">{selectedMachine.inventory.vanilla}%</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Mocha</p>
                <p className="text-2xl font-bold">{selectedMachine.inventory.mocha}%</p>
              </div>
            </div>
            <Button onClick={() => setSelectedMachine(null)} className="w-full mt-4">Close</Button>
          </Card>
        </div>
      )}

      {selectedVisitDetail && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 overflow-y-auto" onClick={() => setSelectedVisitDetail(null)}>
          <Card className="max-w-4xl w-full p-6 my-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-2xl font-bold">{selectedVisitDetail.visit?.visitType === 'weekly' ? '📅 Weekly Visit' : '🧹 Monthly Deep Clean'}</h2>
                <p className="text-gray-600">Completed: {new Date(selectedVisitDetail.visit?.completedAt).toLocaleString()}</p>
              </div>
              <button onClick={() => setSelectedVisitDetail(null)} className="text-2xl font-bold text-gray-500 hover:text-gray-700">✕</button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-xs text-gray-600">Technician</p>
                <p className="font-bold">{selectedVisitDetail.technician?.name || selectedVisitDetail.visit?.technicianId}</p>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-xs text-gray-600">Machine</p>
                <p className="font-bold">{selectedVisitDetail.machine?.nickname || selectedVisitDetail.visit?.machineId}</p>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-xs text-gray-600">Duration</p>
                <p className="font-bold">{selectedVisitDetail.visit?.durationMinutes || 0} minutes</p>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-xs text-gray-600">Synced to Machine</p>
                <p className="font-bold">{selectedVisitDetail.visit?.syncedToMachineApp ? '✓ Yes' : '✗ No'}</p>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-bold mb-3">Form Answers & Inventory</h3>
              <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
                {selectedVisitDetail.visit?.optionSelections && Object.keys(selectedVisitDetail.visit.optionSelections).length > 0 ? (
                  <div className="space-y-2 text-sm">
                    {Object.entries(selectedVisitDetail.visit.optionSelections).map(([key, value]) => (
                      <div key={key} className="flex justify-between border-b border-gray-200 pb-2">
                        <span className="font-medium text-gray-700">{key}:</span>
                        <span className="text-gray-900">{typeof value === 'object' ? (value.value || value.label || 'N/A') : value}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No form data recorded</p>
                )}
              </div>
            </div>

            {selectedVisitDetail.visit?.textInputs && Object.keys(selectedVisitDetail.visit.textInputs).length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-bold mb-3">Notes & Comments</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  {Object.entries(selectedVisitDetail.visit.textInputs).map(([key, value]) => (
                    <div key={key} className="mb-3">
                      <p className="text-xs font-semibold text-gray-600 mb-1">{key}</p>
                      <p className="text-gray-900">{value || 'No entry'}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedVisitDetail.visit?.problems && Object.keys(selectedVisitDetail.visit.problems).length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-bold mb-3 text-red-700">Issues Reported</h3>
                <div className="bg-red-50 rounded-lg p-4">
                  <ul className="space-y-1">
                    {Object.entries(selectedVisitDetail.visit.problems)
                      .filter(([_, checked]) => checked)
                      .map(([problem]) => (
                        <li key={problem} className="text-red-800">• {problem}</li>
                      ))}
                  </ul>
                </div>
              </div>
            )}

            {selectedVisitDetail.photos && selectedVisitDetail.photos.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-bold mb-3">📸 Photos Submitted ({selectedVisitDetail.photos.length})</h3>
                <div className="grid grid-cols-3 gap-3">
                  {selectedVisitDetail.photos.map((photo, idx) => (
                    <div key={idx} className="bg-gray-100 rounded-lg p-3 text-center">
                      <div className="text-4xl mb-2">📷</div>
                      <p className="text-xs font-semibold text-gray-700">{photo.questionId}</p>
                      <p className="text-xs text-gray-500 mt-1">{new Date(photo.createdAt).toLocaleDateString()}</p>
                      {photo.approved !== null && (
                        <p className="text-xs mt-2 font-bold">{photo.approved ? '✓ Approved' : '⏳ Pending'}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Button onClick={() => setSelectedVisitDetail(null)} className="w-full">Close Report</Button>
          </Card>
        </div>
      )}

      {showVideoManager && (
        <VideoManager 
          onClose={() => setShowVideoManager(false)} 
          opsToken={user?.opsToken || ''}
        />
      )}
    </div>
  );
};

// --- 8C. REFILLS PAGE ---

const RefillsPage = ({ onClose, user }) => {
  const [powders, setPowders] = useState({});
  const [syrups, setSyrups] = useState({});
  const [photos, setPhotos] = useState({});
  const isTestUser = user?.displayName === 'test';

  const powderList = [
    { id: 'oat_milk', emoji: '🌾', name: 'Oat Milk' },
    { id: 'dairy_milk', emoji: '🥛', name: 'Dairy Milk' },
    { id: 'chai', emoji: '🍂', name: 'Chai' },
    { id: 'cocoa', emoji: '🍫', name: 'Cocoa Powder' },
    { id: 'empty', emoji: '🚫', name: '(Empty)' },
    { id: 'sugar', emoji: '🍬', name: 'Cane Sugar' },
    { id: 'matcha', emoji: '🍵', name: 'Oat Matcha Mix' }
  ];

  const syrupList = [
    { id: 'brown_sugar', emoji: '🧋', name: 'Brown Sugar' },
    { id: 'vanilla', emoji: '🍦', name: 'Vanilla' },
    { id: 'strawberry', emoji: '🍓', name: 'Strawberry' },
    { id: 'coconut', emoji: '🥥', name: 'Coconut' },
    { id: 'lavender', emoji: '🌸', name: 'Lavender' }
  ];

  const allPowdersCompleted = powderList.every(p => powders[p.id]);
  const allSyrupsCompleted = syrupList.every(s => syrups[s.id]);
  const hasRequiredPhotos = isTestUser || (
    photos.hopper_before?.length > 0 && 
    photos.hopper_after?.length > 0 && 
    photos.canisters_before?.length > 0 && 
    photos.canisters_after?.length > 0 && 
    photos.syrups?.length > 0 && 
    photos.replenishment?.length > 0
  );
  const allCompleted = allPowdersCompleted && allSyrupsCompleted && hasRequiredPhotos;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white pb-24">
      <div className="bg-slate-700 text-white p-6 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Package size={28} />
            <div>
              <h1 className="text-2xl font-bold">Refills</h1>
              <p className="text-slate-100 text-sm">Check and refill all supplies</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white hover:bg-slate-600 p-2 rounded-lg">
            <X size={24} />
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-6 space-y-6">
        <Card className="p-6">
          <div className="mb-4">
            <h2 className="text-xl font-bold mb-2">1 Bean Hopper</h2>
            <p className="text-gray-600 text-sm mb-3">Is it low? Refill it. *Important:* Pull the plastic tab OUT after.</p>
            <WatchVideoButton videoTitle="Supplies: Bean Hopper & Baffle" />
          </div>
        </Card>

        <Card className="p-6 bg-blue-50 border-2 border-blue-200">
          <MockPhotoUpload 
            label="📸 BEFORE: Bean Hopper Level"
            onUpload={(photoArray) => setPhotos({...photos, hopper_before: photoArray})}
            hasPhoto={photos.hopper_before}
            required={!isTestUser}
          />
          <p className="text-xs text-gray-600 mt-2">Take a clear photo showing the current bean level before refilling</p>
        </Card>

        <Card className="p-6 bg-green-50 border-2 border-green-200">
          <MockPhotoUpload 
            label="📸 AFTER: Bean Hopper Level"
            onUpload={(photoArray) => setPhotos({...photos, hopper_after: photoArray})}
            hasPhoto={photos.hopper_after}
            required={!isTestUser}
          />
          <p className="text-xs text-gray-600 mt-2">Take a photo after refilling to show the full hopper</p>
        </Card>

        <Card className="p-6">
          <div className="mb-4">
            <h2 className="text-xl font-bold mb-2">7 Powder Boxes</h2>
            <p className="text-gray-600 text-sm mb-3">Look at each box. Only refill if less than half full.</p>
            <WatchVideoButton videoTitle="Supplies: Powder Canisters" />
          </div>
        </Card>

        <Card className="p-6 bg-blue-50 border-2 border-blue-200">
          <MockPhotoUpload 
            label="📸 BEFORE: All 7 Powder Canisters"
            onUpload={(photoArray) => setPhotos({...photos, canisters_before: photoArray})}
            hasPhoto={photos.canisters_before}
            required={!isTestUser}
          />
          <p className="text-xs text-gray-600 mt-2">Take a wide photo showing all canister levels before refilling</p>
        </Card>

        <Card className="p-6">
          <div className="space-y-3">
            {powderList.map((powder, idx) => (
              <div key={powder.id} className="bg-white rounded-lg p-4 border border-gray-100">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">{powder.emoji}</span>
                  <h3 className="font-bold text-gray-900">{idx + 1}. {powder.name}</h3>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setPowders({...powders, [powder.id]: 'refilled'})}
                    className={`flex-1 py-2.5 px-4 rounded-lg font-medium transition-all ${
                      powders[powder.id] === 'refilled'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white border border-gray-300 text-gray-700 hover:border-gray-400'
                    }`}
                  >
                    Refilled
                  </button>
                  <button
                    onClick={() => setPowders({...powders, [powder.id]: 'no_need'})}
                    className={`flex-1 py-2.5 px-4 rounded-lg font-medium transition-all ${
                      powders[powder.id] === 'no_need'
                        ? 'bg-green-600 text-white'
                        : 'bg-white border border-gray-300 text-gray-700 hover:border-gray-400'
                    }`}
                  >
                    No need (≥50%)
                  </button>
                </div>
              </div>
            ))}

            {allPowdersCompleted && (
              <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3 animate-in fade-in">
                <CheckCircle size={24} className="text-green-600" />
                <span className="font-bold text-green-800">All Powders Checked!</span>
              </div>
            )}
          </div>
        </Card>

        <Card className="p-6 bg-green-50 border-2 border-green-200">
          <MockPhotoUpload 
            label="📸 AFTER: All 7 Powder Canisters"
            onUpload={(photoArray) => setPhotos({...photos, canisters_after: photoArray})}
            hasPhoto={photos.canisters_after}
            required={!isTestUser}
          />
          <p className="text-xs text-gray-600 mt-2">Take a wide photo showing all canisters after refilling</p>
        </Card>

        <Card className="p-6">
          <div className="mb-4">
            <h2 className="text-xl font-bold mb-2">5 Syrup Bottles</h2>
            <p className="text-gray-600 text-sm mb-3">Are bottles empty? Swap them. Do tubes look dirty/moldy?</p>
            <WatchVideoButton videoTitle="How to Check and Swap Syrup Bottles" />
          </div>

          <div className="space-y-3 mt-4">
            {syrupList.map((syrup, idx) => (
              <div key={syrup.id} className="bg-white rounded-lg p-4 border border-gray-100">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">{syrup.emoji}</span>
                  <h3 className="font-bold text-gray-900">{idx + 1}. {syrup.name}</h3>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setSyrups({...syrups, [syrup.id]: 'refilled'})}
                    className={`flex-1 py-2.5 px-4 rounded-lg font-medium transition-all ${
                      syrups[syrup.id] === 'refilled'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white border border-gray-300 text-gray-700 hover:border-gray-400'
                    }`}
                  >
                    Refilled
                  </button>
                  <button
                    onClick={() => setSyrups({...syrups, [syrup.id]: 'no_need'})}
                    className={`flex-1 py-2.5 px-4 rounded-lg font-medium transition-all ${
                      syrups[syrup.id] === 'no_need'
                        ? 'bg-green-600 text-white'
                        : 'bg-white border border-gray-300 text-gray-700 hover:border-gray-400'
                    }`}
                  >
                    No need (≥50%)
                  </button>
                </div>
              </div>
            ))}
          </div>

          {allSyrupsCompleted && (
            <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3 animate-in fade-in">
              <CheckCircle size={24} className="text-green-600" />
              <span className="font-bold text-green-800">All Syrups Checked!</span>
            </div>
          )}
        </Card>

        <Card className="p-6">
          <MockPhotoUpload 
            label="Photo: Syrups"
            onUpload={(photoArray) => setPhotos({...photos, syrups: photoArray})}
            hasPhoto={photos.syrups}
            required={!isTestUser}
          />
        </Card>

        <Card className="p-6">
          <div className="mb-4">
            <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
              <Lock size={20} className="text-yellow-600" />
              Photo: Replenishment Screen
            </h2>
            <p className="text-gray-600 text-sm mb-3">Press 'Mode Key' → 'Replenishment'. Take a picture of you hitting the buttons.</p>
          </div>
          <MockPhotoUpload 
            label="Replenishment Screen"
            onUpload={(photoArray) => setPhotos({...photos, replenishment: photoArray})}
            hasPhoto={photos.replenishment}
            required={!isTestUser}
          />
        </Card>

        {allCompleted && (
          <Button onClick={onClose} variant="success" className="w-full">
            <CheckCircle size={18} />
            All Supplies Complete
          </Button>
        )}
      </div>
    </div>
  );
};

// --- 9A. PERFORMANCE COMP (v1.00.0 Sovereign Upgrade) ---

const calculateDividend = (userData) => {
  const gates = {
    uptime: { passed: false, value: 0, target: 99, reason: '' },
    reliability: { passed: false, value: 0, target: 90, reason: '' },
    acceptance: { passed: false, value: 0, target: 24, reason: '' }
  };
  
  const uptime = userData?.machineUptime ?? 98.5;
  gates.uptime.value = uptime;
  gates.uptime.passed = uptime >= 99;
  gates.uptime.reason = gates.uptime.passed ? 'Machine uptime excellent' : `Low Uptime (${uptime.toFixed(1)}%)`;
  
  const reliability = userData?.reliabilityScore ?? 85;
  gates.reliability.value = reliability;
  gates.reliability.passed = reliability >= 90;
  gates.reliability.reason = gates.reliability.passed ? 'Green Badge status' : `Reliability below 90 (${reliability})`;
  
  const avgLatency = userData?.avgAcceptanceLatency ?? 18;
  gates.acceptance.value = avgLatency;
  gates.acceptance.passed = avgLatency <= 24;
  gates.acceptance.reason = gates.acceptance.passed ? 'Fast acceptance' : `Slow Acceptance (${avgLatency}h avg)`;
  
  const allPassed = gates.uptime.passed && gates.reliability.passed && gates.acceptance.passed;
  const passedCount = [gates.uptime.passed, gates.reliability.passed, gates.acceptance.passed].filter(Boolean).length;
  
  let dividendAmount = 0;
  if (allPassed) {
    dividendAmount = 50;
  } else if (passedCount === 2) {
    dividendAmount = 25;
  }
  
  const failReasons = [];
  if (!gates.uptime.passed) failReasons.push(gates.uptime.reason);
  if (!gates.reliability.passed) failReasons.push(gates.reliability.reason);
  if (!gates.acceptance.passed) failReasons.push(gates.acceptance.reason);
  
  return {
    eligible: allPassed,
    amount: dividendAmount,
    gates,
    passedCount,
    failReasons,
    message: allPassed 
      ? `Weekly Dividend Earned: $${dividendAmount}` 
      : `Dividend Missed: ${failReasons[0]}`
  };
};

const PerformanceCompPage = ({ userData, payoutHistory, onClose }) => {
  const dividend = calculateDividend(userData);
  
  const GateIndicator = ({ label, passed, value, target, unit, inverse }) => (
    <div className={`p-4 rounded-xl border-2 ${passed ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium text-gray-900">{label}</span>
        <span className={`text-lg font-bold ${passed ? 'text-green-600' : 'text-gray-500'}`}>
          {passed ? '✓' : '○'}
        </span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className={`text-2xl font-bold ${passed ? 'text-green-700' : 'text-gray-600'}`}>
          {typeof value === 'number' ? (inverse ? value.toFixed(0) : value.toFixed(1)) : value}
        </span>
        <span className="text-sm text-gray-500">{unit}</span>
      </div>
      <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
        <div 
          className={`h-2 rounded-full transition-all ${passed ? 'bg-green-500' : 'bg-gray-400'}`}
          style={{ width: `${Math.min(100, inverse ? (target / value * 100) : (value / target * 100))}%` }}
        />
      </div>
      <p className="text-xs text-gray-500 mt-1">
        Target: {inverse ? `< ${target}` : `> ${target}`}{unit}
      </p>
    </div>
  );
  
  return (
    <SwipeBackWrapper onBack={onClose}>
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6 sticky-header-safe">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 mb-1">Performance Comp</h1>
            <p className="text-sm text-gray-500 font-light">Your weekly dividend tracker</p>
          </div>
          <button 
            onClick={() => {
              triggerHaptic('light');
              onClose();
            }}
            className="text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-full p-2 transition-all active:scale-90 touch-target"
          >
            <X size={22} />
          </button>
        </div>
        
        <div className={`p-6 rounded-2xl border-2 mb-6 ${dividend.eligible ? 'border-green-300 bg-gradient-to-br from-green-50 to-emerald-50' : 'border-gray-200 bg-white'}`}>
          <div className="text-center">
            <div className="text-4xl mb-2">{dividend.eligible ? '💵' : '📊'}</div>
            <h2 className={`text-xl font-bold mb-1 ${dividend.eligible ? 'text-green-800' : 'text-gray-700'}`}>
              {dividend.eligible ? 'Dividend Earned!' : 'Keep Going!'}
            </h2>
            <p className={`text-3xl font-bold mb-2 ${dividend.eligible ? 'text-green-600' : 'text-gray-400'}`}>
              ${dividend.amount}
            </p>
            <p className="text-sm text-gray-600">
              {dividend.eligible 
                ? 'All 3 performance gates passed this week' 
                : `${dividend.passedCount}/3 gates passed`}
            </p>
          </div>
        </div>
        
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm mb-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Target size={18} className="text-slate-600" />
            Weekly Performance Gates
          </h3>
          <div className="space-y-3">
            <GateIndicator 
              label="Machine Uptime" 
              passed={dividend.gates.uptime.passed}
              value={dividend.gates.uptime.value}
              target={99}
              unit="%"
            />
            <GateIndicator 
              label="Reliability Score" 
              passed={dividend.gates.reliability.passed}
              value={dividend.gates.reliability.value}
              target={90}
              unit=" pts"
            />
            <GateIndicator 
              label="Avg Acceptance Time" 
              passed={dividend.gates.acceptance.passed}
              value={dividend.gates.acceptance.value}
              target={24}
              unit="h"
              inverse={true}
            />
          </div>
        </div>
        
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <DollarSign size={18} className="text-slate-600" />
            Payout History
            <span className="text-xs font-normal text-gray-500 ml-auto">{payoutHistory?.length || 0} payouts</span>
          </h3>
          {(!payoutHistory || payoutHistory.length === 0) ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-2 opacity-40">📈</div>
              <p className="text-sm text-gray-500 font-light">No payouts yet. Hit all 3 gates to earn your first dividend!</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {payoutHistory.map((payout, idx) => (
                <div key={idx} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">💵</div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 text-sm">${payout.amount} Dividend</p>
                      <p className="text-xs text-gray-500 font-light mt-0.5">
                        Week of {payout.weekOf ? new Date(payout.weekOf).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Recently'}
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${payout.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {payout.status === 'paid' ? 'Paid' : 'Pending'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="mt-6 bg-slate-50 p-4 rounded-xl border border-slate-200">
          <h4 className="font-medium text-slate-800 mb-2">How Dividends Work</h4>
          <ul className="text-sm text-slate-600 space-y-1">
            <li>• Pass all 3 gates = <strong>$50 weekly dividend</strong></li>
            <li>• Pass 2 gates = <strong>$25 partial dividend</strong></li>
            <li>• Dividends paid via direct deposit each Monday</li>
            <li>• Consistent performance builds your track record</li>
          </ul>
        </div>
      </div>
    </div>
    </SwipeBackWrapper>
  );
};

// --- 9B. TUTORIAL/ONBOARDING SYSTEM ---

const TutorialOverlay = ({ onComplete, onSkip }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const tutorialSteps = [
    {
      title: "Welcome to SIPJOLT",
      subtitle: "Service App",
      description: "Your all-in-one tool for maintaining SIPJOLT Automated Barista machines.",
      icon: "🎉",
      position: "center",
      direction: null
    },
    {
      title: "Machine Health",
      subtitle: "Track Status & Streaks",
      description: "Monitor your machine's health and maintain perfect visit streaks to earn rewards.",
      icon: "💚",
      position: "top",
      direction: "above"
    },
    {
      title: "Service Workflows",
      subtitle: "Weekly & Monthly",
      description: "Follow step-by-step guided workflows with instructional videos for every maintenance task.",
      icon: "🔧",
      position: "middle",
      direction: "below"
    },
    {
      title: "Quick Tools",
      subtitle: "Fix & Refill",
      description: "Diagnose errors instantly with Quick Fix or manage supplies between scheduled visits.",
      icon: "⚡",
      position: "middle",
      direction: "below"
    },
    {
      title: "Performance Comp",
      subtitle: "Earn Dividends",
      description: "Hit your weekly targets to earn guaranteed cash dividends—no luck required.",
      icon: "💵",
      position: "middle",
      direction: "below"
    },
    {
      title: "AI Assistant",
      subtitle: "Get Help Anytime",
      description: "Chat with AI for troubleshooting help. It can analyze photos and guide you through repairs.",
      icon: "💬",
      position: "bottom",
      direction: "corner"
    }
  ];

  const step = tutorialSteps[currentStep];

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const getPosition = () => {
    if (step.position === 'top') return 'items-start pt-20';
    if (step.position === 'bottom') return 'items-end pb-20';
    if (step.position === 'middle') return 'items-center';
    return 'items-center justify-center';
  };

  const getDirectionIndicator = () => {
    if (!step.direction) return null;
    
    const indicators = {
      above: (
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-70">
          <div className="text-sm font-medium text-white">Look above</div>
          <div className="text-2xl">↑</div>
        </div>
      ),
      below: (
        <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-70">
          <div className="text-2xl">↓</div>
          <div className="text-sm font-medium text-white">Scroll down</div>
        </div>
      ),
      corner: (
        <div className="absolute -bottom-8 -right-8 flex items-center gap-2 opacity-70">
          <div className="text-sm font-medium text-white">Bottom-right</div>
          <div className="text-2xl">↘</div>
        </div>
      )
    };
    
    return indicators[step.direction];
  };

  return (
    <div className={`fixed inset-0 z-[100] flex p-4 ${getPosition()}`} style={{ backdropFilter: 'blur(8px)', backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-8 relative border border-gray-200 transition-all duration-500 ease-out">
        {getDirectionIndicator()}
        
        <button 
          onClick={() => {
            if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(10);
            onSkip();
          }}
          className="absolute top-5 right-5 text-gray-400 hover:text-gray-700 transition-all p-1.5 hover:bg-gray-100 rounded-full active:scale-90"
        >
          <X size={20} />
        </button>

        <div className="text-center mb-8">
          <div className="text-5xl mb-5 transition-transform duration-300 opacity-80">
            {step.icon}
          </div>
          <div className="space-y-1.5 mb-4">
            <h2 className="text-2xl font-semibold text-gray-900">{step.title}</h2>
            <p className="text-base font-medium text-slate-600">{step.subtitle}</p>
          </div>
          <p className="text-gray-600 leading-relaxed text-sm max-w-md mx-auto font-light">{step.description}</p>
        </div>

        <div className="mb-8">
          <div className="flex gap-2 justify-center mb-3">
            {tutorialSteps.map((_, idx) => (
              <div 
                key={idx}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  idx === currentStep 
                    ? 'bg-slate-600 w-8' 
                    : idx < currentStep 
                      ? 'bg-slate-400 w-1.5' 
                      : 'bg-gray-300 w-1.5'
                }`}
              />
            ))}
          </div>
          <div className="text-center text-xs font-light text-gray-500">
            {currentStep + 1} of {tutorialSteps.length}
          </div>
        </div>

        <div className="flex gap-3">
          {currentStep > 0 && (
            <button
              onClick={() => {
                if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(10);
                setCurrentStep(currentStep - 1);
              }}
              className="flex-1 py-3 px-6 rounded-xl font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 active:scale-95 transition-all"
            >
              Back
            </button>
          )}
          <button
            onClick={() => {
              if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(10);
              handleNext();
            }}
            className="flex-1 py-3 px-6 rounded-xl font-medium text-white bg-slate-600 hover:bg-slate-700 active:scale-95 transition-all shadow-sm"
          >
            {currentStep === tutorialSteps.length - 1 ? "Get Started" : 'Continue'}
          </button>
        </div>

        <button 
          onClick={() => {
            if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(10);
            onSkip();
          }}
          className="w-full mt-4 text-sm font-light text-gray-500 hover:text-gray-700 active:scale-95 transition-all py-2"
        >
          Skip for now
        </button>
      </div>
    </div>
  );
};

// --- 9. MAIN APP COMPONENT ---
// Legacy prize system removed - now using v1.00 Premium Gamification (RewardsHub)
// Components: LuckySpinWheelPremium, LeaderboardPremium, VacationJackpotPremium


import FleetDashboard from './pages/FleetDashboard';

function App() {
  const [user, setUser] = useState(null);
  const [currentView, setCurrentView] = useState('dashboard'); // dashboard, weekly, monthly, history, profile, techhub, closet, labelstation, rewards
  const [showVideoManager, setShowVideoManager] = useState(false);
  const [visitData, setVisitData] = useState(null);
  const [toast, setToast] = useState(null);
  const [activeAlerts, setActiveAlerts] = useState([]);
  const [streakWeeks, setStreakWeeks] = useState(2);
  const [cupsServed, setCupsServed] = useState(450);
  const [machineCompletionPercentage, setMachineCompletionPercentage] = useState(75);
  const [lastVisitNotes, setLastVisitNotes] = useState([
    { icon: '⚠️', text: 'Last week, the grinder jammed. Please double-check the SIPJOLT baffle today.' },
    { icon: '✅', text: 'Chocolate syrup line was replaced - monitor for leaks.' }
  ]);
  
  
  // Tutorial state
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialCompleted, setTutorialCompleted] = useState(() => {
    return safeStorage.getItem('tutorialCompleted') === 'true';
  });
  
  
  // Legacy prize system state - kept for compatibility
  const [prizeHistory, setPrizeHistory] = useState([]);
  const [spins, setSpins] = useState(0);
  const [weeklyVisitCount, setWeeklyVisitCount] = useState(0);

  // AI intro bubble state
  const [showAIIntro, setShowAIIntro] = useState(() => {
    return safeStorage.getItem('aiIntroShown') !== 'true';
  });

  // Rewards explanation state
  const [showRewardsExplainer, setShowRewardsExplainer] = useState(false);

  // Intro guide state (disabled - no pop-ups on login)
  const [showIntroGuide, setShowIntroGuide] = useState(false);

  // Home screen reminder state (disabled - no pop-ups on login)
  const [showHomeScreenReminder, setShowHomeScreenReminder] = useState(false);

  // AI Chat state
  const [showAIChat, setShowAIChat] = useState(false);
  const [showVideoTest, setShowVideoTest] = useState(false);

  // Added a little secret button to test video uploads
  const VideoTestButton = () => (
    <button 
      onClick={() => setShowVideoTest(true)}
      className="fixed bottom-24 right-4 p-3 bg-blue-600/20 text-blue-600/40 rounded-full hover:bg-blue-600 hover:text-white transition-all z-[60] text-xs font-bold shadow-lg"
    >
      LAB
    </button>
  );

  if (showVideoTest) {
    return (
      <div className="min-h-screen bg-slate-50 p-4">
        <button 
          onClick={() => setShowVideoTest(false)}
          className="mb-4 text-blue-600 flex items-center gap-1 font-bold"
        >
          <ChevronLeft size={20} /> Back to App
        </button>
        <VideoUploadTest />
      </div>
    );
  }

  // Install app guide state - show on first login unless dismissed AND app not already installed
  const [showInstallGuide, setShowInstallGuide] = useState(() => {
    const isDismissed = safeStorage.getItem('installGuideDismissed') === 'true';
    const installed = isAppInstalled();
    return !isDismissed && !installed;
  });

  // Network status for offline support
  const [isOnline, setIsOnline] = useState(() => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });
  const [pendingSync, setPendingSync] = useState(() => offlineQueue.count());

  // Supply Closet state for technicians (accountability)
  const [supplyClosetTask, setSupplyClosetTask] = useState(null);
  const [pendingDeliveries, setPendingDeliveries] = useState([]);
  const [siteIncidents, setSiteIncidents] = useState([]);
  const [supplyClosetLoading, setSupplyClosetLoading] = useState(false);
  const [showDeliveryModal, setShowDeliveryModal] = useState(null);
  const [spinEarnedPopup, setSpinEarnedPopup] = useState({ show: false, spins: 0, reason: '' });
  
  // QR Verification state
  const [qrVerifyBoxId, setQrVerifyBoxId] = useState(null);

  // Gate5 OS v1.01 - PWA & System Health
  const { isInstalled: pwaInstalled, isInstallable: pwaInstallable, promptInstall: pwaPromptInstall } = usePWAInstall();
  const { healthStatus, hasDrift, clockDrift, formatSlaRemaining, sync: syncHealth } = useSystemHealth();
  
  const handleStartOnboarding = () => {
    setCurrentView('onboarding');
  };

  const handleCompleteOnboarding = async () => {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('sipjolt_onboarding_complete', 'true');
    }
    try {
      const payload = {
        user_id: user?.uid || 'anonymous',
        user_role: user?.role || 'barista_specialist',
        completed_at: new Date().toISOString(),
        logic_test_passed: true
      };
      const payloadStr = JSON.stringify(payload);
      const encoder = new TextEncoder();
      const data = encoder.encode(payloadStr);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      
      await fetch('/api/v1.00/onboarding-complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...payload,
          evidence_hash: hashHex
        })
      }).catch(() => {});
    } catch (e) {
      console.warn('[Onboarding] Could not log completion:', e);
    }
    
    // Finalize onboarding view
    setCurrentView('dashboard');
  };

  // Recovery wizard state
  const [showRecoveryWizard, setShowRecoveryWizard] = useState(false);
  const [machineConfig, setMachineConfig] = useState(null);
  const [dailyToken, setDailyToken] = useState(null);
  const [pendingBlockerTasks, setPendingBlockerTasks] = useState([]);
  
  // Terminal Init logic
  const isFirstLogin = safeStorage.getItem('first_login_complete') !== 'true';
  const isDesktop = !/iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  const needsTerminalInit = !pwaInstalled && isFirstLogin && pwaInstallable && !isDesktop;
  
  // Safe machineConfig access with default values
  const safeMachineConfig = machineConfig || { status: 'INITIALIZING', recovery_required: false };
  const needsRecovery = safeMachineConfig.recovery_required || safeMachineConfig.status === 'SAFE_MODE';
  
  const isAirlockActive = false; // Airgap/Airlock lockout removed in v1.00
  const hasBlockerTask = (pendingBlockerTasks || []).length > 0 || needsRecovery || needsTerminalInit;

  // Sync Warning check (v1.00)
  useEffect(() => {
    const checkSyncSLA = () => {
      try {
        const oldestAge = offlineQueue.getOldestItemAge();
        if (oldestAge > 6) { // 6 hours
          console.warn('Sync SLA Breach: Data older than 6 hours pending sync');
        }
      } catch (e) {
        console.warn('Sync check skipped:', e.message);
      }
    };
    checkSyncSLA();
    const interval = setInterval(checkSyncSLA, 300000);
    return () => clearInterval(interval);
  }, []);

  // Fetch Supply Closet data for technicians (accountability)
  useEffect(() => {
    const fetchSupplyClosetData = async () => {
      if (!user || user.role === 'owner' || user.role === 'ops_manager' || user.role === 'driver') return;
      
      setSupplyClosetLoading(true);
      try {
        const techId = user.displayName || 'tech-001';
        const siteId = user.siteId || 'site-001'; // Default site for demo
        const headers = {
          'x-user-id': techId,
          'x-user-name': user.displayName || 'Technician',
          'x-user-role': 'technician'
        };
        
        const [taskRes, deliveriesRes, incidentsRes] = await Promise.all([
          fetch(`/api/ops/sites/${siteId}/pending-task`, { headers }).catch(() => ({ ok: false })),
          fetch(`/api/ops/deliveries?siteId=${siteId}`, { headers }).catch(() => ({ ok: false })),
          fetch(`/api/ops/incidents?siteId=${siteId}&status=open`, { headers }).catch(() => ({ ok: false }))
        ]);
        
        const taskData = taskRes.ok ? await taskRes.json().catch(() => ({})) : {};
        const deliveriesData = deliveriesRes.ok ? await deliveriesRes.json().catch(() => ({})) : {};
        const incidentsData = incidentsRes.ok ? await incidentsRes.json().catch(() => ({})) : {};
        
        setSupplyClosetTask(taskData.task || null);
        setPendingDeliveries((deliveriesData.deliveries || []).filter(d => d.partner_accepted_at === null && d.partner_refused_at === null));
        setSiteIncidents(incidentsData.incidents || []);
      } catch (error) {
        console.error('Failed to fetch supply closet data:', error);
      } finally {
        setSupplyClosetLoading(false);
      }
    };
    
    fetchSupplyClosetData();
  }, [user]);

  // Gate5 OS v1.01 - Fetch machine config and daily token
  useEffect(() => {
    const fetchMachineConfig = async () => {
      if (!user || user.role === 'owner' || user.role === 'ops_manager' || user.role === 'driver') return;
      
      try {
        const siteId = user.siteId || 'site-001';
        const [configRes, tokenRes] = await Promise.all([
          fetch(`/api/v1.00/machine/${siteId}/config`).catch(() => ({ ok: false })),
          fetch('/api/v1.00/daily-token').catch(() => ({ ok: false }))
        ]);
        
        if (configRes.ok) {
          const config = await configRes.json();
          setMachineConfig(config);
          
          // Auto-show recovery wizard if in safe mode
          if (config.recovery_required || config.status === 'SAFE_MODE') {
            setShowRecoveryWizard(true);
          }
        }
        
        if (tokenRes.ok) {
          const tokenData = await tokenRes.json();
          setDailyToken(tokenData.code);
        }
      } catch (error) {
        console.error('Failed to fetch machine config:', error);
      }
    };
    
    fetchMachineConfig();
    
    // Refresh config every 5 minutes
    const interval = setInterval(fetchMachineConfig, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [user]);

  // Handle terminal initialization
  const handleTerminalInit = async () => {
    const success = await pwaPromptInstall();
    if (success) {
      safeStorage.setItem('first_login_complete', 'true');
      triggerHaptic('success');
      showNotification('success', 'Terminal Initialized', 'SIPJOLT Terminal is now synchronized with your device.');
    }
  };

  // Handle recovery completion
  const handleRecoveryComplete = async (result) => {
    setShowRecoveryWizard(false);
    setMachineConfig(prev => ({ ...prev, recovery_required: false, status: 'ACTIVE' }));
    triggerHaptic('success');
    showNotification('success', 'Recovery Complete', 'Machine is now unlocked and operational.');
    
    // Refresh machine config
    try {
      const siteId = user?.siteId || 'site-001';
      const res = await fetch(`/api/v1.00/machine/${siteId}/config`);
      if (res.ok) {
        setMachineConfig(await res.json());
      }
    } catch (e) {
      console.error('Failed to refresh config after recovery:', e);
    }
  };

  const showNotification = (type, title, message) => {
    const notification = { type, title, message, id: Date.now() };
    setToast(notification);
    
    // Also add to active alerts list
    const alert = { ...notification, timestamp: new Date().toLocaleString() };
    setActiveAlerts(prev => [alert, ...prev].slice(0, 10));
    
    // Send browser notification if enabled
    if (typeof window !== 'undefined' && 'Notification' in window && window.Notification.permission === 'granted') {
      new window.Notification(title, {
        body: message,
        icon: '🔔',
        tag: `alert-${Date.now()}`
      });
    }
  };

  const videoCount = {
    weekly: 10,
    monthly: 7,
    quickfix: 4,
    helpsafety: 5,
    total: 26
  };

  const handleLogin = async (userData) => {
    try {
      // Loading indicator - prevents users from thinking app is frozen
      const loader = document.getElementById('app-loader');
      if (loader) {
        loader.classList.remove('hidden');
        loader.innerHTML = '<div class="text-white text-center"><div class="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div><p class="font-bold tracking-widest text-white">INITIALIZING TERMINAL...</p></div>';
      }

      setUser(userData);
      
      // Delay slightly to allow loader to show and state to settle
      setTimeout(() => {
        if (loader) loader.classList.add('hidden');

        if (userData?.role === 'owner' || userData?.role === 'ops_manager') {
          setCurrentView('ownerops');
        } else if (userData?.role === 'driver') {
          setCurrentView('driver_dashboard');
        } else {
          setCurrentView('dashboard');
        }
      }, 800);
      
      // Load technician data safely
      if (userData?.technicianData) {
        try {
          setStreakWeeks(userData.technicianData.streak || 0);
          setWeeklyVisitCount(userData.technicianData.weeklyVisits || 0);
        } catch (e) {
          console.error('Failed to set streak/visit data:', e);
        }
        
        // Load prize history and spins
        try {
          const prizesResult = await api.technicians.getPrizes(userData.displayName);
          setPrizeHistory(prizesResult?.prizes || []);
        } catch (error) {
          console.error('Failed to load prize history:', error);
        }
        
        // Load spins balance from gamification API
        try {
          const techId = userData.technicianData?.id || userData.displayName;
          const spinResponse = await fetch(`/api/v1.00/gamification/lucky-spin/available/${techId}`, {
            headers: buildGamificationHeaders(userData)
          });
          if (spinResponse.ok) {
            const spinData = await spinResponse.json();
            setSpins(spinData.spins_available || 0);
          }
        } catch (error) {
          // Silently fail - spins will show 0
        }

        // Check streak status and send push notification if at risk
        if (userData.technicianData.streak > 0 && userData.technicianData.lastVisitDate) {
          try {
            notificationService.scheduleStreakCheck(
              userData.displayName,
              userData.technicianData.lastVisitDate,
              userData.technicianData.streak
            );
          } catch (e) {
            console.error('Failed to schedule streak check:', e);
          }
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      // Set user anyway to allow them in
      setUser(userData);
      setCurrentView('dashboard');
    }
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentView('dashboard');
  };
  
  const handleTutorialComplete = () => {
    setShowTutorial(false);
    setTutorialCompleted(true);
    safeStorage.setItem('tutorialCompleted', 'true');
  };
  
  const handleTutorialSkip = () => {
    setShowTutorial(false);
    setTutorialCompleted(true);
    safeStorage.setItem('tutorialCompleted', 'true');
  };
  
  // Legacy checkForPrize and handleScratchComplete REMOVED - now using v1.00 Premium Gamification

  const handleVisitComplete = async (data) => {
    if (data) {
      setVisitData(data);
      const visitType = data.type === 'weekly' ? 'Weekly Visit' : 'Monthly Deep Clean';
      
      setMachineCompletionPercentage(100);
      setCupsServed(prev => prev + (data.type === 'weekly' ? 75 : 150));
      setStreakWeeks(prev => prev + 1);
      
      const visitPayload = {
        technicianId: user?.displayName || 'unknown',
        machineId: 'DEFAULT-001',
        visitType: data.type,
        completedQuestions: data.completedQuestions,
        photos: data.photos,
        problems: data.problems,
        optionSelections: data.optionSelections,
        textInputs: data.textInputs,
        durationMinutes: 0
      };
      
      // Grant spins for completing visit: Weekly = +1, Monthly = +2
      const spinsEarned = data.type === 'weekly' ? 1 : 2;
      try {
        await fetch('/api/v1.00/gamification/lucky-spin/grant', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...buildGamificationHeaders(user)
          },
          body: JSON.stringify({ 
            partnerId: user?.id,
            reason: data.type === 'weekly' ? 'WEEKLY_VISIT_COMPLETE' : 'MONTHLY_VISIT_COMPLETE',
            spins: spinsEarned
          })
        });
        // Show spin earned celebration popup
        setSpinEarnedPopup({ show: true, spins: spinsEarned, reason: visitType });
        setTimeout(() => setSpinEarnedPopup({ show: false, spins: 0, reason: '' }), 4000);
      } catch (err) {
        console.error('Failed to grant spin:', err);
      }

      if (!offlineQueue.isOnline()) {
        offlineQueue.add('visit', visitPayload);
        showNotification('warning', 'Saved Offline', `${visitType} saved locally. It will sync when you're back online.`);
        if (data.type === 'weekly') wizardProgress.clearWeekly();
        else wizardProgress.clearMonthly();
      } else {
        try {
          await api.visits.submit(visitPayload);
          showNotification('success', `${visitType} Complete!`, `Successfully completed and saved. +${data.type === 'weekly' ? 75 : 150} cups served! 🎉`);
          if (data.type === 'weekly') wizardProgress.clearWeekly();
          else wizardProgress.clearMonthly();
        } catch (error) {
          console.error('Failed to save visit to backend:', error);
          offlineQueue.add('visit', visitPayload);
          showNotification('warning', 'Saved Offline', `${visitType} saved locally. It will sync automatically.`);
        }
      }
    }
    // Switch to Rewards Hub after completion to encourage engagement
    setCurrentView('rewards');
    triggerHaptic('success');
  };

  // Auto-dismiss AI intro after 8 seconds, then show install guide (if not already installed)
  useEffect(() => {
    if (showAIIntro && currentView === 'dashboard') {
      const timer = setTimeout(() => {
        setShowAIIntro(false);
        safeStorage.setItem('aiIntroShown', 'true');
        // Only show install guide if app is not already installed
        if (!isAppInstalled()) {
          setShowInstallGuide(true);
        }
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [showAIIntro, currentView]);

  const dismissAIIntro = () => {
    setShowAIIntro(false);
    safeStorage.setItem('aiIntroShown', 'true');
    // Only show install guide if app is not already installed
    if (!isAppInstalled()) {
      setShowInstallGuide(true);
    }
  };

  const completeIntroGuide = () => {
    setShowIntroGuide(false);
    safeStorage.setItem('introGuideCompleted', 'true');
    // Show home screen reminder as a separate popup after intro completes
    setShowHomeScreenReminder(true);
  };

  const dismissHomeScreenReminder = () => {
    setShowHomeScreenReminder(false);
    // Track how many times reminder was shown
    const reminderCount = parseInt(safeStorage.getItem('homeScreenReminderCount', '0'));
    safeStorage.setItem('homeScreenReminderCount', Math.min(reminderCount + 1, 3).toString());
  };

  const handleBack = () => {
    if (showVideoManager) {
      setShowVideoManager(false);
      return;
    }
    
    // Ops Managers should stay in command center - back from sub-views returns to ownerops
    const isOpsManager = user?.role === 'ops_manager' || user?.role === 'owner';
    
    if (currentView === 'missionpanel' || currentView === 'admindiagnostics') {
      // Return to ownerops from Yile panels
      setCurrentView('ownerops');
      return;
    }
    
    if (currentView === 'ownerops') {
      // Ops Managers: clicking back from command center logs them out
      if (isOpsManager) {
        if (confirm('Sign out of Operations Manager?')) {
          handleLogout();
        }
        return;
      }
      setCurrentView('dashboard');
      return;
    }
    
    if (currentView === 'quickfix' || currentView === 'helpsafety' || currentView === 'rewards' || currentView === 'onboarding') {
      // For Ops Managers, return to ownerops; for technicians, return to dashboard
      setCurrentView(isOpsManager ? 'ownerops' : 'dashboard');
      return;
    }
    
    if (currentView === 'weekly' || currentView === 'monthly') {
      if (confirm('Exit maintenance wizard? Your progress will be saved.')) {
        setCurrentView(isOpsManager ? 'ownerops' : 'dashboard');
      }
      return;
    }
  };

  if (!user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <SwipeBackWrapper onBack={handleBack} className="h-full w-full bg-white overflow-x-hidden selection:bg-blue-500/30">
      <PullToRefreshWrapper onRefresh={async () => window.location.reload()} className="h-full w-full flex flex-col">
        
        {/* v1.01 Test Mode Banner */}
        <TestModeBanner userName={user?.displayName || user?.name || 'Unknown'} />
        
        {/* Gate5 OS v1.01 - Recovery Wizard (Full Screen Takeover) */}
        {showRecoveryWizard && needsRecovery && (
          <RecoveryWizard 
            siteId={user?.siteId || 'site-001'}
            siteName={user?.siteName || 'Your Site'}
            onComplete={handleRecoveryComplete}
            onCancel={() => setShowRecoveryWizard(false)}
          />
        )}

        {/* Gate5 OS v1.01 - UI Lock Overlay for Blocker Tasks */}
        <UILockOverlay 
          isActive={hasBlockerTask && currentView === 'dashboard' && !showRecoveryWizard}
          message={
            needsTerminalInit ? 'TERMINAL_INIT_REQUIRED' : 
            needsRecovery ? 'RECOVERY_REQUIRED' :
            pendingBlockerTasks[0]?.type || 'BLOCKER_TASK'
          }
          onAction={needsTerminalInit ? handleTerminalInit : null}
          showSyncButton={false}
        />

        {/* Premium Header - Hidden for Ops Manager in Command Center (has its own header) */}
        {!(currentView === 'ownerops' && (user?.role === 'ops_manager' || user?.role === 'owner')) && (
        <div className="bg-white border-b border-[#d2d2d7] sticky top-0 z-40 safe-area-top">
          <div className="w-full max-w-4xl mx-auto px-4 md:px-6 py-2 md:py-3">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                {(currentView !== 'dashboard' && currentView !== 'ownerops') && (
                  <button 
                    onClick={handleBack}
                    className="p-2 -ml-2 hover:bg-white/5 rounded-full transition-colors text-gray-400"
                  >
                    <ChevronLeft size={24} />
                  </button>
                )}
                <div>
                  <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">
                    {currentView === 'dashboard' ? 'Tech Hub' : 
                     currentView === 'weekly' ? 'Weekly Visit' :
                     currentView === 'monthly' ? 'Deep Clean' :
                     currentView === 'ownerops' ? 'Command Center' :
                     currentView === 'missionpanel' ? 'Machine Control' :
                     currentView === 'admindiagnostics' ? 'Diagnostics' :
                     currentView === 'helpsafety' ? 'Help' : 'Tech Hub'}
                  </h1>
                  <p className="text-[10px] font-mono text-blue-500 uppercase tracking-widest">
                    {currentView === 'ownerops' || currentView === 'missionpanel' || currentView === 'admindiagnostics' 
                      ? 'SIPJOLT Operations Platform' 
                      : currentView === 'dashboard' ? 'Gate5 OS v1.01' : 'Automated Barista'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setCurrentView('notifications')}
                className="bg-white/5 hover:bg-white/10 active:bg-white/20 p-2 md:p-2.5 rounded-xl transition-all duration-200 active:scale-95 relative flex-shrink-0 border border-white/10"
              >
                <Bell size={18} className="text-gray-400" />
                {typeof window !== 'undefined' && 'Notification' in window && window.Notification.permission === 'granted' && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)]"></span>
                )}
              </button>
            </div>
            <div className="mt-2 flex items-center justify-between text-[10px] font-mono">
              <div className="flex items-center gap-2 text-gray-500">
                <div className="w-6 h-6 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold">
                  {user?.displayName?.charAt(0).toUpperCase() || 'U'}
                </div>
                <span className="uppercase tracking-wider">{user?.displayName || 'User'}</span>
                {!isOnline && (
                  <span className="flex items-center gap-1 px-2 py-0.5 bg-red-500/20 text-red-400 rounded-full font-bold animate-pulse">
                    <WifiOff size={10} />
                    OFFLINE
                  </span>
                )}
              </div>
              <button 
                onClick={handleLogout}
                className="text-gray-500 hover:text-red-400 transition-colors uppercase tracking-widest font-bold"
              >
                [ Sign out ]
              </button>
            </div>
          </div>
        </div>
        )}

        <main className="flex-1 pb-24 overflow-y-auto terminal-grid">
          {currentView === 'ownerops' && (user?.role === 'ops_manager' || user?.role === 'owner') && (
            <OpsCommandCenter user={user} onLogout={handleLogout} onNavigateYile={(view) => setCurrentView(view)} />
          )}
          {currentView === 'ownerops' && !(user?.role === 'ops_manager' || user?.role === 'owner') && (
            <OwnerOpsPage user={user} onClose={handleLogout} onManageVideos={() => setShowVideoManager(true)} onNavigateYile={(view) => setCurrentView(view)} />
          )}
          {currentView === 'driver_dashboard' && <DriverDashboard user={user} onLogout={handleLogout} />}
          {currentView === 'weekly' && <WeeklyVisitWizard onComplete={handleVisitComplete} user={user} onAskAI={() => setShowAIChat(true)} />}
          {currentView === 'monthly' && <MonthlyDeepCleanWizard onComplete={handleVisitComplete} user={user} onAskAI={() => setShowAIChat(true)} />}
          {currentView === 'quickfix' && <QuickFixTool onClose={() => setCurrentView((user?.role === 'ops_manager' || user?.role === 'owner') ? 'ownerops' : 'dashboard')} />}
          {currentView === 'notifications' && <NotificationManager onClose={() => setCurrentView((user?.role === 'ops_manager' || user?.role === 'owner') ? 'ownerops' : 'dashboard')} />}
          {currentView === 'helpsafety' && <HelpSafetyCenter onClose={() => setCurrentView((user?.role === 'ops_manager' || user?.role === 'owner') ? 'ownerops' : 'dashboard')} onStartOnboarding={handleStartOnboarding} />}
          {currentView === 'rewards' && <RewardsHub user={user} onClose={() => setCurrentView((user?.role === 'ops_manager' || user?.role === 'owner') ? 'ownerops' : 'dashboard')} />}
          {currentView === 'supplycloset' && <SupplyClosetApp onClose={() => setCurrentView((user?.role === 'ops_manager' || user?.role === 'owner') ? 'ownerops' : 'dashboard')} />}
          {currentView === 'missionpanel' && <TechnicianMissionPanel siteId={2} onClose={() => setCurrentView('ownerops')} />}
          {currentView === 'admindiagnostics' && <AdminDiagnosticPanel siteId={2} onClose={() => setCurrentView('ownerops')} />}
          {currentView === 'onboarding' && <OnboardingWizard onComplete={handleCompleteOnboarding} onClose={() => setCurrentView((user?.role === 'ops_manager' || user?.role === 'owner') ? 'ownerops' : 'dashboard')} userRole={user?.role} />}
          {qrVerifyBoxId && (
            <QRVerificationPage 
              boxId={qrVerifyBoxId} 
              onClose={() => { setQrVerifyBoxId(null); window.history.pushState({}, '', '/'); }} 
            />
          )}
          
          {currentView === 'dashboard' && (
            <HomeDashboard 
              spins={spins}
              user={user}
              supplyClosetTask={supplyClosetTask}
              visitData={visitData}
              siteIncidents={siteIncidents}
              machineStatus={healthStatus === 'green' ? 'green' : healthStatus === 'red' ? 'red' : 'yellow'}
              coffeeEligible={true}
              streakWeeks={streakWeeks}
              onNavigate={(view) => {
                if (view === 'rewards') setCurrentView('rewards');
                else if (view === 'monthly') setCurrentView('monthly');
                else if (view === 'quickfix') setCurrentView('quickfix');
                else if (view === 'helpsafety') setCurrentView('helpsafety');
              }}
              onStartWeeklyVisit={() => setCurrentView('weekly')}
              onOpenAIChat={() => setShowAIChat(true)}
            />
          )}
        </main>

        {showTutorial && (
          <TutorialOverlay 
            onComplete={handleTutorialComplete}
            onSkip={handleTutorialSkip}
          />
        )}
        
        <RecertificationGauntlet 
          user={user}
          onRecertified={(data) => {
            setUser(prev => ({ ...prev, reliabilityScore: data.reliabilityScore }));
          }}
          onClose={() => {}}
        />
        
        {/* Legacy FlipCard/PrizeRevealModal/PrizeShowcaseModal REMOVED - using RewardsHub */}

        {showRewardsExplainer && (
          <div className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center p-4" onClick={() => setShowRewardsExplainer(false)}>
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
              <div className="text-center mb-4">
                <div className="text-6xl mb-3">🎁</div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">How Lucky Drops Works</h2>
              </div>
              <div className="space-y-3 text-sm text-gray-700">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="font-bold text-blue-900 mb-1">✨ Every Visit = Free Spin!</p>
                  <p>Complete any visit to get a guaranteed prize spin</p>
                </div>
                <div className="bg-purple-50 p-3 rounded-lg">
                  <p className="font-bold text-purple-900 mb-1">🏆 Win Digital Collectibles</p>
                  <p>Badges, trophies, and achievements for your collection</p>
                </div>
                <div className="bg-yellow-50 p-3 rounded-lg">
                  <p className="font-bold text-yellow-900 mb-1">💰 Win Gift Cards</p>
                  <p>$5-$50 Amazon & JOLT gift cards</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="font-bold text-gray-900 mb-1">🎯 Better Luck Next Time</p>
                  <p>Keep spinning - you'll win eventually!</p>
                </div>
              </div>
              <Button onClick={() => setShowRewardsExplainer(false)} className="w-full mt-4">
                Got it!
              </Button>
            </div>
          </div>
        )}

        {showAIIntro && (
          <div className="fixed bottom-24 right-6 z-40 animate-in slide-in-from-bottom-4 fade-in duration-500">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-3 rounded-2xl shadow-2xl max-w-xs relative">
              <button 
                onClick={dismissAIIntro}
                className="absolute -top-2 -right-2 bg-white text-blue-600 rounded-full p-1 shadow-lg hover:scale-110 transition-transform"
              >
                <X size={14} />
              </button>
              <div className="flex items-start gap-3">
                <div className="bg-white/20 p-2 rounded-lg flex-shrink-0">
                  <Sparkles size={20} />
                </div>
                <div>
                  <p className="font-bold text-sm mb-1">Hi! I'm SIPJOLT AI 👋</p>
                  <p className="text-xs text-blue-100">Send me a photo or ask me anything. I learn from every conversation!</p>
                </div>
              </div>
              <div className="absolute bottom-0 right-8 w-4 h-4 bg-blue-700 transform rotate-45 translate-y-2"></div>
            </div>
          </div>
        )}

        {showInstallGuide && (
          <InstallAppGuide onClose={() => {
            setShowInstallGuide(false);
            safeStorage.setItem('installGuideDismissed', 'true');
          }} />
        )}


        {/* Spin Earned Celebration Popup */}
        {spinEarnedPopup.show && (
          <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4">
            <div className="bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 rounded-3xl p-8 text-center text-white shadow-2xl animate-bounce-in max-w-sm">
              <div className="text-6xl mb-4">🎰</div>
              <h2 className="text-3xl font-bold mb-2">Spins Earned!</h2>
              <p className="text-5xl font-black mb-4">+{spinEarnedPopup.spins}</p>
              <p className="text-lg opacity-90 mb-6">{spinEarnedPopup.reason} completed</p>
              <button 
                onClick={() => setSpinEarnedPopup({ show: false, spins: 0, reason: '' })}
                className="bg-white text-orange-600 font-bold py-3 px-8 rounded-xl hover:bg-yellow-100 transition-all"
              >
                Awesome!
              </button>
            </div>
          </div>
        )}

        {showDeliveryModal && (
          <DeliveryAcceptanceModal
            delivery={showDeliveryModal}
            user={user}
            onAccept={async () => {
              const deliveredAt = new Date(showDeliveryModal.delivered_at);
              const hoursElapsed = (Date.now() - deliveredAt.getTime()) / (1000 * 60 * 60);
              
              // Calculate spins earned based on response time
              let spinsEarned = 0;
              let speedTier = '';
              if (hoursElapsed <= 2) {
                spinsEarned = 2;
                speedTier = 'LIGHTNING FAST';
              } else if (hoursElapsed <= 6) {
                spinsEarned = 1;
                speedTier = 'QUICK';
              }
              
              setShowDeliveryModal(null);
              setPendingDeliveries(prev => prev.filter(d => d.delivery_id !== showDeliveryModal.delivery_id));
              showNotification('success', 'Delivery Accepted', 'The delivery has been accepted.');
              
              // Grant spins for fast acceptance
              if (spinsEarned > 0) {
                try {
                  await fetch('/api/v1.00/gamification/lucky-spin/grant', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      ...buildGamificationHeaders(user)
                    },
                    body: JSON.stringify({ 
                      partnerId: user?.id || user?.displayName, 
                      reason: `DELIVERY_ACCEPT_${speedTier}`, 
                      spins: spinsEarned 
                    })
                  });
                  setSpinEarnedPopup({ show: true, spins: spinsEarned, reason: `${speedTier} Delivery` });
                  setTimeout(() => setSpinEarnedPopup({ show: false, spins: 0, reason: '' }), 4000);
                } catch (err) {
                  console.error('Failed to grant delivery spin:', err);
                }
              }
            }}
            onRefuse={() => {
              setShowDeliveryModal(null);
              setPendingDeliveries(prev => prev.filter(d => d.delivery_id !== showDeliveryModal.delivery_id));
              showNotification('warning', 'Delivery Refused', 'An incident has been created for review.');
            }}
            onClose={() => setShowDeliveryModal(null)}
          />
        )}

        {/* Neural Core Chat temporarily disabled for UI simplification */}
        
        {showVideoManager && (
          <VideoManager 
            onClose={() => setShowVideoManager(false)} 
            opsToken={user?.opsToken || (typeof OPS_AUTH_TOKEN !== 'undefined' ? OPS_AUTH_TOKEN : '')}
          />
        )}
      </PullToRefreshWrapper>
    </SwipeBackWrapper>
  );
}


export default function AppWithErrorBoundary() {
  return (
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
}
