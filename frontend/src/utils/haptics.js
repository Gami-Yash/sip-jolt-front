import { useCallback, useMemo } from 'react';

export const HAPTIC_PATTERNS = {
  light: { pattern: [10], description: 'Quick tap - button press, selection' },
  medium: { pattern: [30], description: 'Standard feedback - confirmation, toggle' },
  heavy: { pattern: [50, 30, 50], description: 'Strong feedback - blocked action, UILockOverlay tap' },
  success: { pattern: [30, 50, 30], description: 'Success pattern - task complete, sync done' },
  warning: { pattern: [50, 30, 50, 30, 50], description: 'Warning pattern - SLA warning, drift detected' },
  error: { pattern: [100, 50, 100], description: 'Error pattern - failed action, SAFE_MODE trigger' },
};

function supportsVibration() {
  return typeof navigator !== 'undefined' && 'vibrate' in navigator;
}

function supportsHapticFeedback() {
  const hasWebkitHaptic = typeof window?.webkit?.messageHandlers?.haptic !== 'undefined';
  const hasVibration = supportsVibration();
  return hasWebkitHaptic || hasVibration;
}

export function triggerHaptic(intensity = 'medium') {
  const pattern = HAPTIC_PATTERNS[intensity];
  if (!pattern) {
    console.warn(`[HAPTIC] Unknown intensity: ${intensity}`);
    return false;
  }

  try {
    const webkit = window?.webkit;
    if (webkit?.messageHandlers?.haptic) {
      webkit.messageHandlers.haptic.postMessage({ type: intensity, pattern: pattern.pattern });
      return true;
    }
  } catch {}

  if (supportsVibration()) {
    try {
      navigator.vibrate(pattern.pattern);
      return true;
    } catch (err) {
      console.warn('[HAPTIC] Vibration failed:', err);
      return false;
    }
  }
  return false;
}

export function triggerCustomHaptic(pattern) {
  if (!supportsVibration()) return false;
  try {
    navigator.vibrate(pattern);
    return true;
  } catch {
    return false;
  }
}

export function stopHaptic() {
  if (!supportsVibration()) return false;
  try {
    navigator.vibrate(0);
    return true;
  } catch {
    return false;
  }
}

export function hapticButtonPress() { triggerHaptic('light'); }
export function hapticBlocked() { triggerHaptic('heavy'); }
export function hapticSuccess() { triggerHaptic('success'); }
export function hapticWarning() { triggerHaptic('warning'); }
export function hapticError() { triggerHaptic('error'); }
export function hapticMessageSent() { triggerHaptic('medium'); }
export function hapticMessageReceived() { triggerHaptic('light'); }
export function hapticSafeMode() { triggerHaptic('error'); }
export function hapticRecoveryComplete() { triggerHaptic('success'); }

export function useHaptic() {
  const isSupported = useMemo(() => supportsHapticFeedback(), []);
  const trigger = useCallback((intensity = 'medium') => triggerHaptic(intensity), []);
  const button = useCallback(() => hapticButtonPress(), []);
  const blocked = useCallback(() => hapticBlocked(), []);
  const success = useCallback(() => hapticSuccess(), []);
  const warning = useCallback(() => hapticWarning(), []);
  const error = useCallback(() => hapticError(), []);
  const messageSent = useCallback(() => hapticMessageSent(), []);
  const messageReceived = useCallback(() => hapticMessageReceived(), []);
  const safeMode = useCallback(() => hapticSafeMode(), []);
  const recoveryComplete = useCallback(() => hapticRecoveryComplete(), []);
  const stop = useCallback(() => stopHaptic(), []);

  return {
    isSupported,
    trigger,
    button,
    blocked,
    success,
    warning,
    error,
    messageSent,
    messageReceived,
    safeMode,
    recoveryComplete,
    stop,
  };
}

export default {
  triggerHaptic,
  triggerCustomHaptic,
  stopHaptic,
  hapticButtonPress,
  hapticBlocked,
  hapticSuccess,
  hapticWarning,
  hapticError,
  hapticMessageSent,
  hapticMessageReceived,
  hapticSafeMode,
  hapticRecoveryComplete,
  supportsHapticFeedback,
  HAPTIC_PATTERNS,
  useHaptic,
};
