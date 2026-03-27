// Notification utility for managing push notifications
// V2: Added comprehensive safety checks for mobile browsers

// Safe check if notifications are supported
const isNotificationSupported = () => {
  try {
    return typeof window !== 'undefined' && 'Notification' in window;
  } catch (e) {
    return false;
  }
};

// Safe check if service worker is supported
const isServiceWorkerSupported = () => {
  try {
    return typeof navigator !== 'undefined' && 'serviceWorker' in navigator;
  } catch (e) {
    return false;
  }
};

// Notification types for different alerts
export const NOTIFICATION_TYPES = {
  STREAK_WARNING: 'streak_warning',
  OPS_NOTE: 'ops_note',
  PRIZE_WON: 'prize_won',
  SERVICE_DUE: 'service_due'
};

export const notificationService = {
  // Request notification permission
  async requestPermission() {
    if (!isNotificationSupported()) {
      console.log('Notifications not supported');
      return false;
    }

    try {
      if (window.Notification.permission === 'granted') {
        return true;
      }

      if (window.Notification.permission !== 'denied') {
        const permission = await window.Notification.requestPermission();
        return permission === 'granted';
      }
    } catch (error) {
      console.error('Failed to request notification permission:', error);
    }

    return false;
  },

  // Register service worker
  async registerServiceWorker() {
    if (!isServiceWorkerSupported()) {
      return null;
    }
    
    try {
      const reg = await navigator.serviceWorker.register('/service-worker.js');
      console.log('✅ Service Worker registered:', reg);
      return reg;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return null;
    }
  },

  // Send local notification
  async sendNotification(title, options = {}) {
    if (!isNotificationSupported()) {
      return;
    }
    
    try {
      if (window.Notification.permission !== 'granted') {
        console.log('Notification permission not granted');
        return;
      }
      
      if (!isServiceWorkerSupported()) {
        // Fallback to basic notification
        new window.Notification(title, options);
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(title, {
        icon: '/jolt-icon.png',
        badge: '/jolt-badge.png',
        ...options
      });
    } catch (error) {
      console.error('Notification error:', error);
    }
  },

  // Save notification preference
  async savePreference(technicianId, prefs) {
    try {
      const response = await fetch(`/api/notifications/preferences/${technicianId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prefs)
      });
      return await response.json();
    } catch (error) {
      console.error('Failed to save notification preferences:', error);
    }
  },

  // Get notifications
  async getNotifications(technicianId, limit = 50) {
    try {
      const response = await fetch(`/api/notifications/${technicianId}?limit=${limit}`);
      return await response.json();
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  },

  // Mark as read
  async markAsRead(notificationId) {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'POST'
      });
      return await response.json();
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  },

  // Send streak warning notification
  async sendStreakWarning(technicianName, currentStreak, daysUntilExpiry) {
    const granted = await this.requestPermission();
    if (!granted) return;

    const title = `Streak at Risk!`;
    const body = daysUntilExpiry <= 1 
      ? `Your ${currentStreak}-week streak expires tomorrow! Complete a visit to keep it going.`
      : `Your ${currentStreak}-week streak expires in ${daysUntilExpiry} days.`;

    await this.sendNotification(title, {
      body,
      tag: 'streak-warning',
      vibrate: [200, 100, 200],
      data: { type: NOTIFICATION_TYPES.STREAK_WARNING }
    });
  },

  // Send ops note notification
  async sendOpsNoteAlert(machineName, note) {
    const granted = await this.requestPermission();
    if (!granted) return;

    await this.sendNotification(`New Note: ${machineName}`, {
      body: note.length > 100 ? note.substring(0, 100) + '...' : note,
      tag: `ops-note-${Date.now()}`,
      vibrate: [100, 50, 100],
      data: { type: NOTIFICATION_TYPES.OPS_NOTE }
    });
  },

  // Send prize won notification
  async sendPrizeWonAlert(prizeName) {
    const granted = await this.requestPermission();
    if (!granted) return;

    await this.sendNotification(`You Won a Prize!`, {
      body: `Congratulations! You won: ${prizeName}`,
      tag: 'prize-won',
      vibrate: [100, 50, 100, 50, 100],
      data: { type: NOTIFICATION_TYPES.PRIZE_WON }
    });
  },

  // Check streak status and schedule warning
  scheduleStreakCheck(technicianName, lastVisitDate, currentStreak) {
    try {
      if (!lastVisitDate || currentStreak === 0) return;

      const lastVisit = new Date(lastVisitDate);
      const now = new Date();
      const daysSinceVisit = Math.floor((now - lastVisit) / (1000 * 60 * 60 * 24));
      const daysUntilExpiry = 7 - daysSinceVisit;

      if (daysUntilExpiry <= 2 && daysUntilExpiry > 0) {
        this.sendStreakWarning(technicianName, currentStreak, daysUntilExpiry);
      }
    } catch (e) {
      console.error('Streak check failed:', e);
    }
  }
};
