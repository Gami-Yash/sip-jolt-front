import React, { useState, useEffect } from 'react';
import { AlertTriangle, Clock, ChevronRight, Package, CheckCircle, Camera, Smartphone, Lock, X, Bell } from 'lucide-react';
import { triggerHaptic } from '../utils/mobileGestures';

// Utility: Detect if running on desktop
export const isDesktop = () => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth >= 1024 && !(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
};

// v1.00+: UILockOverlay is now a SOFT WARNING BANNER, not a hard block
// The user can dismiss it and continue working. Ops Manager gets notified.
export const UILockOverlay = ({ isActive, message, subtitle, showSyncButton, onSyncRetry }) => {
  const [dismissed, setDismissed] = useState(false);

  // Don't show if not active or already dismissed
  if (!isActive || dismissed) return null;

  const isAirlock = message?.includes('AIRLOCK') || message?.includes('SYNC');
  const isRecovery = message?.includes('RECOVERY') || message?.includes('Safe');
  const isTerminal = message?.includes('TERMINAL') || message?.includes('INIT');

  // Notify Ops Manager (fire-and-forget)
  useEffect(() => {
    if (isActive) {
      const warningType = isAirlock ? 'SYNC_WARNING' : 
                          isRecovery ? 'RECOVERY_DEFERRED' : 
                          isTerminal ? 'TERMINAL_INIT_DEFERRED' : 'BLOCKER_DEFERRED';
      
      fetch('/api/v1.00/ops-warning', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: warningType,
          message: message,
          timestamp: new Date().toISOString()
        })
      }).catch(() => {}); // Silent fail
    }
  }, [isActive, message, isAirlock, isRecovery, isTerminal]);

  return (
    <div className="fixed top-4 left-4 right-4 z-50 animate-in slide-in-from-top duration-300">
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 shadow-lg max-w-lg mx-auto">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-amber-100 rounded-lg flex-shrink-0">
            <Bell size={20} className="text-amber-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-amber-800 text-sm">Sync Warning</p>
            <p className="text-xs text-amber-600 mt-1">{subtitle || 'Data sync is delayed. Your work is saved locally.'}</p>
            {showSyncButton && onSyncRetry && (
              <button
                onClick={() => {
                  triggerHaptic('light');
                  onSyncRetry();
                }}
                className="mt-2 text-xs font-semibold text-amber-700 underline"
              >
                Retry Sync
              </button>
            )}
          </div>
          <button
            onClick={() => setDismissed(true)}
            className="p-1 text-amber-400 hover:text-amber-600 transition-colors"
          >
            <X size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export const ActionRail = ({
  userRole,
  pendingTasks = [],
  onStartTask,
  blockerActive = false,
  terminalInitRequired = false,
  onInitializeTerminal = null,
  recoveryRequired = false,
  onStartRecovery = null
}) => {
  const [timeLeft, setTimeLeft] = useState(null);
  const [recoveryDismissed, setRecoveryDismissed] = useState(false);
  const [terminalDismissed, setTerminalDismissed] = useState(false);

  // Desktop users skip terminal init entirely
  const desktop = isDesktop();

  // v1.00+: Recovery is a WARNING banner, not a blocker
  // User can dismiss and continue working. Ops gets notified.
  if (recoveryRequired && onStartRecovery && !recoveryDismissed) {
    return (
      <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <AlertTriangle size={22} className="text-amber-600" />
            </div>
            <div>
              <div className="font-semibold text-amber-800">Site Needs Attention</div>
              <div className="text-sm text-amber-600">Recovery recommended when possible</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                // Notify Ops Manager that recovery was deferred
                fetch('/api/v1.00/ops-warning', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    type: 'RECOVERY_DEFERRED',
                    message: 'User deferred recovery to later',
                    timestamp: new Date().toISOString()
                  })
                }).catch(() => {});
                setRecoveryDismissed(true);
              }}
              className="text-xs text-amber-500 underline"
            >
              Later
            </button>
            <button
              onClick={() => {
                triggerHaptic('medium');
                onStartRecovery();
              }}
              className="flex items-center gap-2 bg-amber-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors"
            >
              Start Recovery
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  // v1.00+: Terminal init is OPTIONAL on desktop, soft prompt on mobile
  if (terminalInitRequired && onInitializeTerminal && !terminalDismissed && !desktop) {
    return (
      <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Smartphone size={22} className="text-blue-600" />
            </div>
            <div>
              <div className="font-semibold text-blue-800">Install App (Recommended)</div>
              <div className="text-sm text-blue-600">Better offline support & faster access</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                // Notify Ops Manager that app install was skipped
                fetch('/api/v1.00/ops-warning', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    type: 'APP_INSTALL_SKIPPED',
                    message: 'User skipped app installation prompt',
                    timestamp: new Date().toISOString()
                  })
                }).catch(() => {});
                setTerminalDismissed(true);
              }}
              className="text-xs text-blue-500 underline"
            >
              Skip
            </button>
            <button
              onClick={() => {
                triggerHaptic('medium');
                onInitializeTerminal();
              }}
              className="flex items-center gap-2 bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Install
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  const priorityOrder = [
    'PENDING_ACCEPTANCE',
    'PENDING_POD', 
    'PENDING_STORAGE',
    'PENDING_REFILL',
    'WEEKLY_DUE',
    'INCIDENT_CRITICAL'
  ];
  
  const sortedTasks = [...pendingTasks].sort((a, b) => {
    const aIndex = priorityOrder.indexOf(a.type);
    const bIndex = priorityOrder.indexOf(b.type);
    return aIndex - bIndex;
  });
  
  const blockerTask = sortedTasks.find(t => 
    t.type === 'PENDING_ACCEPTANCE' || t.type === 'PENDING_POD'
  );
  
  const nextTask = blockerTask || sortedTasks[0];
  
  useEffect(() => {
    if (!nextTask?.deadline) return;
    
    const updateTimer = () => {
      const now = Date.now();
      const deadline = new Date(nextTask.deadline).getTime();
      const diff = deadline - now;
      
      if (diff <= 0) {
        setTimeLeft('OVERDUE');
      } else {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        setTimeLeft(`${hours}h ${minutes}m`);
      }
    };
    
    updateTimer();
    const interval = setInterval(updateTimer, 60000);
    return () => clearInterval(interval);
  }, [nextTask?.deadline]);
  
  if (!nextTask) return null;
  
  const getTaskConfig = (type) => {
    switch (type) {
      case 'PENDING_ACCEPTANCE':
        return {
          title: 'Accept Delivery',
          subtitle: 'Review and confirm your delivery',
          icon: Package,
          color: 'bg-red-600',
          urgent: true
        };
      case 'PENDING_POD':
        return {
          title: 'Capture POD',
          subtitle: 'Take proof of delivery photo',
          icon: Camera,
          color: 'bg-orange-600',
          urgent: true
        };
      case 'PENDING_STORAGE':
        return {
          title: 'Store Inventory',
          subtitle: 'Place items in zones',
          icon: Package,
          color: 'bg-blue-600',
          urgent: false
        };
      case 'PENDING_REFILL':
        return {
          title: 'Complete Refill',
          subtitle: 'Refill supply closet',
          icon: CheckCircle,
          color: 'bg-green-600',
          urgent: false
        };
      case 'WEEKLY_DUE':
        return {
          title: 'Weekly Visit Due',
          subtitle: 'Complete your weekly check',
          icon: Clock,
          color: 'bg-purple-600',
          urgent: false
        };
      case 'INCIDENT_CRITICAL':
        return {
          title: 'Critical Incident',
          subtitle: 'Requires immediate attention',
          icon: AlertTriangle,
          color: 'bg-red-700',
          urgent: true
        };
      default:
        return {
          title: 'Task Required',
          subtitle: 'Complete this task',
          icon: CheckCircle,
          color: 'bg-gray-600',
          urgent: false
        };
    }
  };
  
  const config = getTaskConfig(nextTask.type);
  const IconComponent = config.icon;
  const isBlocker = nextTask.type === 'PENDING_ACCEPTANCE' || nextTask.type === 'PENDING_POD';
  
  const colorMap = {
    'bg-red-600': 'bg-red-50 border-red-200 text-red-800',
    'bg-red-700': 'bg-red-50 border-red-200 text-red-800',
    'bg-orange-600': 'bg-orange-50 border-orange-200 text-orange-800',
    'bg-blue-600': 'bg-blue-50 border-blue-200 text-blue-800',
    'bg-green-600': 'bg-green-50 border-green-200 text-green-800',
    'bg-purple-600': 'bg-purple-50 border-purple-200 text-purple-800',
    'bg-gray-600': 'bg-gray-50 border-gray-200 text-gray-800',
  };
  
  const lightStyle = colorMap[config.color] || 'bg-gray-50 border-gray-200 text-gray-800';
  
  return (
    <div className={`${lightStyle} border p-4 rounded-xl shadow-sm ${isBlocker ? '' : ''}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white rounded-lg border border-current/20">
            <IconComponent size={22} />
          </div>
          <div>
            <div className="font-bold text-base">{config.title}</div>
            <div className="text-sm opacity-80">{config.subtitle}</div>
            {nextTask.siteName && (
              <div className="text-xs opacity-60 mt-1">Site: {nextTask.siteName}</div>
            )}
          </div>
        </div>
        
        <div className="flex flex-col items-end gap-2">
          {timeLeft && (
            <div className={`text-xs font-semibold px-2 py-1 rounded ${
              timeLeft === 'OVERDUE' ? 'bg-red-100 text-red-700' : 'bg-white/60'
            }`}>
              {timeLeft === 'OVERDUE' ? 'OVERDUE!' : `${timeLeft} left`}
            </div>
          )}
          
          <button
            onClick={() => {
              triggerHaptic('medium');
              onStartTask(nextTask);
            }}
            className="flex items-center gap-2 bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors active:scale-[0.98] shadow-sm"
          >
            Start Now
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
      
      {/* v1.00: Positive framing - show what they GET based on actual bonus tier */}
      {nextTask.bonusTier && nextTask.bonusTier !== 'MISSED' && (
        <div className="mt-3 pt-3 border-t border-current/10 text-xs text-center">
          {nextTask.bonusTier === 'TIER_1' && (
            <span className="text-green-600 font-semibold">⚡ Complete now for 3x bonus spins! ({nextTask.timeToNextTier?.toFixed(1)}h left)</span>
          )}
          {nextTask.bonusTier === 'TIER_2' && (
            <span className="text-blue-600 font-semibold">⚡ Complete now for 2x bonus spins! ({nextTask.timeToNextTier?.toFixed(1)}h left)</span>
          )}
          {nextTask.bonusTier === 'TIER_3' && (
            <span className="text-purple-600 font-semibold">✨ Complete now for 1x bonus spin! ({nextTask.timeToNextTier?.toFixed(1)}h left)</span>
          )}
          {nextTask.bonusTier === 'STANDARD' && (
            <span className="text-gray-500">{nextTask.hoursRemaining?.toFixed(0)}h remaining to complete</span>
          )}
        </div>
      )}
      {nextTask.bonusTier === 'MISSED' && (
        <div className="mt-3 pt-3 border-t border-current/10 text-xs text-center text-gray-500">
          Bonus window passed — complete to unlock coffee ☕
        </div>
      )}
      {/* Fallback for tasks without bonus tier info */}
      {!nextTask.bonusTier && nextTask.hoursRemaining !== undefined && nextTask.hoursRemaining > 0 && (
        <div className="mt-3 pt-3 border-t border-current/10 text-xs text-center text-gray-500">
          {Math.floor(nextTask.hoursRemaining)}h remaining
        </div>
      )}
    </div>
  );
};

export const useBlockerMode = (pendingTasks) => {
  const blockerTask = pendingTasks.find(t => 
    t.type === 'PENDING_ACCEPTANCE' || t.type === 'PENDING_POD'
  );
  
  return {
    isBlocked: !!blockerTask,
    blockerTask,
    canInteract: !blockerTask
  };
};

export default ActionRail;
