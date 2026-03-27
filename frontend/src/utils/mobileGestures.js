// Mobile gesture utilities for swipe navigation, pull-to-refresh, and haptic feedback

export const useSwipeBack = (onBack, options = {}) => {
  const { threshold = 80, edgeWidth = 30 } = options;
  let startX = 0;
  let startY = 0;
  let currentX = 0;
  let isTracking = false;
  let indicator = null;

  const createIndicator = () => {
    if (typeof document === 'undefined') return null;
    const el = document.createElement('div');
    el.id = 'swipe-back-indicator';
    el.style.cssText = `
      position: fixed;
      left: 0;
      top: 50%;
      transform: translateY(-50%);
      width: 8px;
      height: 60px;
      background: linear-gradient(to right, rgba(59, 130, 246, 0.6), transparent);
      border-radius: 0 8px 8px 0;
      opacity: 0;
      transition: opacity 0.15s, width 0.15s;
      z-index: 9998;
      pointer-events: none;
    `;
    document.body.appendChild(el);
    return el;
  };

  const handleTouchStart = (e) => {
    const touch = e.touches[0];
    if (touch.clientX <= edgeWidth) {
      startX = touch.clientX;
      startY = touch.clientY;
      currentX = startX;
      isTracking = true;
      if (!indicator) indicator = createIndicator();
      if (indicator) indicator.style.opacity = '1';
    }
  };

  const handleTouchMove = (e) => {
    if (!isTracking) return;
    const touch = e.touches[0];
    currentX = touch.clientX;
    const deltaX = currentX - startX;
    const deltaY = Math.abs(touch.clientY - startY);
    
    if (deltaY > 50) {
      isTracking = false;
      if (indicator) indicator.style.opacity = '0';
      return;
    }

    if (deltaX > 0 && indicator) {
      const progress = Math.min(deltaX / threshold, 1);
      indicator.style.width = `${8 + progress * 40}px`;
      indicator.style.background = progress >= 1 
        ? 'linear-gradient(to right, rgba(34, 197, 94, 0.8), transparent)'
        : 'linear-gradient(to right, rgba(59, 130, 246, 0.6), transparent)';
    }
  };

  const handleTouchEnd = () => {
    if (!isTracking) return;
    const deltaX = currentX - startX;
    
    if (deltaX >= threshold && onBack) {
      triggerHaptic('light');
      onBack();
    }
    
    isTracking = false;
    if (indicator) {
      indicator.style.opacity = '0';
      indicator.style.width = '8px';
    }
  };

  const cleanup = () => {
    if (indicator && indicator.parentNode) {
      indicator.parentNode.removeChild(indicator);
      indicator = null;
    }
  };

  return { handleTouchStart, handleTouchMove, handleTouchEnd, cleanup };
};

export const usePullToRefresh = (onRefresh, options = {}) => {
  const { threshold = 80, resistance = 2.5 } = options;
  let startY = 0;
  let currentY = 0;
  let isAtTop = false;
  let isPulling = false;
  let indicator = null;

  const createIndicator = () => {
    if (typeof document === 'undefined') return null;
    const el = document.createElement('div');
    el.id = 'pull-refresh-indicator';
    el.innerHTML = `
      <div style="width: 32px; height: 32px; border: 3px solid #e5e7eb; border-top-color: #3b82f6; border-radius: 50%; animation: none;"></div>
      <span style="margin-left: 12px; color: #6b7280; font-size: 14px;">Pull to refresh</span>
    `;
    el.style.cssText = `
      position: fixed;
      top: 0;
      left: 50%;
      transform: translateX(-50%) translateY(-60px);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 12px 20px;
      background: white;
      border-radius: 24px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 9999;
      transition: transform 0.2s;
    `;
    document.body.appendChild(el);
    return el;
  };

  const handleTouchStart = (e) => {
    if (typeof window === 'undefined') return;
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    isAtTop = scrollTop <= 0;
    if (isAtTop) {
      startY = e.touches[0].clientY;
      isPulling = false;
      if (!indicator) indicator = createIndicator();
    }
  };

  const handleTouchMove = (e) => {
    if (!isAtTop) return;
    currentY = e.touches[0].clientY;
    const deltaY = (currentY - startY) / resistance;
    
    if (deltaY > 0) {
      isPulling = true;
      const translateY = Math.min(deltaY, threshold + 20) - 60;
      if (indicator) {
        indicator.style.transform = `translateX(-50%) translateY(${translateY}px)`;
        const spinner = indicator.querySelector('div');
        const text = indicator.querySelector('span');
        if (deltaY >= threshold) {
          if (spinner) spinner.style.animation = 'spin 1s linear infinite';
          if (text) text.textContent = 'Release to refresh';
        } else {
          if (spinner) spinner.style.animation = 'none';
          if (text) text.textContent = 'Pull to refresh';
        }
      }
    }
  };

  const handleTouchEnd = async () => {
    if (!isPulling) return;
    const deltaY = (currentY - startY) / resistance;
    
    if (deltaY >= threshold && onRefresh) {
      triggerHaptic('medium');
      if (indicator) {
        const text = indicator.querySelector('span');
        if (text) text.textContent = 'Refreshing...';
      }
      await onRefresh();
    }
    
    isPulling = false;
    if (indicator) {
      indicator.style.transform = 'translateX(-50%) translateY(-60px)';
    }
  };

  const cleanup = () => {
    if (indicator && indicator.parentNode) {
      indicator.parentNode.removeChild(indicator);
      indicator = null;
    }
  };

  return { handleTouchStart, handleTouchMove, handleTouchEnd, cleanup };
};

export const triggerHaptic = (style = 'light') => {
  try {
    if (typeof window === 'undefined') return;
    if (!('vibrate' in navigator)) return;
    
    const patterns = {
      light: [10],
      medium: [20],
      heavy: [30],
      success: [10, 50, 20],
      error: [50, 30, 50],
      warning: [20, 20, 20]
    };
    
    navigator.vibrate(patterns[style] || patterns.light);
  } catch (e) {
    // Haptics not available - fail silently
  }
};

export const addSpinKeyframes = () => {
  if (typeof document === 'undefined') return;
  if (document.getElementById('mobile-gesture-styles')) return;
  
  const style = document.createElement('style');
  style.id = 'mobile-gesture-styles';
  style.textContent = `
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);
};
