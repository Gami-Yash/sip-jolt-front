import { safeStorage } from './safeStorage';

const QUEUE_KEY = 'jolt_offline_queue';
const SYNC_SLA_HOURS = 6;
const SYNC_CHECK_KEY = 'jolt_last_sync_check';

export const offlineQueue = {
  SYNC_SLA_HOURS,

  isOnline: () => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  },

  add: (type, data, deviceId = null) => {
    const queue = safeStorage.getJSON(QUEUE_KEY, []);
    const idempotencyKey = `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    queue.push({
      id: Date.now(),
      idempotencyKey,
      type,
      data,
      deviceId: deviceId || safeStorage.get('jolt_device_id') || 'unknown',
      createdAt: new Date().toISOString(),
      retries: 0,
      lastRetryAt: null
    });
    safeStorage.setJSON(QUEUE_KEY, queue);
    return queue.length;
  },

  getAll: () => {
    return safeStorage.getJSON(QUEUE_KEY, []);
  },

  remove: (id) => {
    const queue = safeStorage.getJSON(QUEUE_KEY, []);
    const filtered = queue.filter(item => item.id !== id);
    safeStorage.setJSON(QUEUE_KEY, filtered);
    return filtered;
  },

  clear: () => {
    safeStorage.setJSON(QUEUE_KEY, []);
  },

  count: () => {
    return safeStorage.getJSON(QUEUE_KEY, []).length;
  },

  processQueue: async (api) => {
    if (!offlineQueue.isOnline()) {
      return { processed: 0, failed: 0, breaches: [] };
    }

    const queue = offlineQueue.getAll();
    let processed = 0;
    let failed = 0;
    const breaches = [];

    for (const item of queue) {
      const hoursSinceCreation = (Date.now() - new Date(item.createdAt).getTime()) / (1000 * 60 * 60);
      if (hoursSinceCreation > SYNC_SLA_HOURS) {
        breaches.push({
          itemId: item.id,
          type: item.type,
          hoursPending: Math.round(hoursSinceCreation * 10) / 10,
          createdAt: item.createdAt
        });
      }

      try {
        if (item.type === 'visit') {
          await api.visits.submit(item.data, item.idempotencyKey);
        } else if (item.type === 'prize') {
          await api.prizes.submit(item.data, item.idempotencyKey);
        } else if (item.type === 'photo') {
          await api.photos.submit(item.data, item.idempotencyKey);
        } else if (item.type === 'pod') {
          await api.pods.submit(item.data, item.idempotencyKey);
        } else if (item.type === 'acceptance') {
          await api.acceptances.submit(item.data, item.idempotencyKey);
        } else if (item.type === 'refusal') {
          await api.refusals.submit(item.data, item.idempotencyKey);
        }
        offlineQueue.remove(item.id);
        processed++;
      } catch (error) {
        item.retries = (item.retries || 0) + 1;
        item.lastRetryAt = new Date().toISOString();
        item.lastError = error.message;
        if (item.retries >= 5) {
          breaches.push({
            itemId: item.id,
            type: item.type,
            reason: 'max_retries_exceeded',
            error: error.message
          });
          offlineQueue.remove(item.id);
        }
        failed++;
      }
    }

    safeStorage.set(SYNC_CHECK_KEY, new Date().toISOString());
    return { processed, failed, breaches };
  },

  checkSLABreaches: () => {
    const queue = offlineQueue.getAll();
    const now = Date.now();
    const breaches = [];

    for (const item of queue) {
      const createdAt = new Date(item.createdAt).getTime();
      const hoursSinceCreation = (now - createdAt) / (1000 * 60 * 60);
      
      if (hoursSinceCreation > SYNC_SLA_HOURS) {
        breaches.push({
          itemId: item.id,
          type: item.type,
          hoursPending: Math.round(hoursSinceCreation * 10) / 10,
          createdAt: item.createdAt
        });
      }
    }

    return breaches;
  },

  getOldestItemAge: () => {
    const queue = offlineQueue.getAll();
    if (queue.length === 0) return 0;
    
    const oldest = queue.reduce((min, item) => {
      const age = new Date(item.createdAt).getTime();
      return age < min ? age : min;
    }, Date.now());
    
    return (Date.now() - oldest) / (1000 * 60 * 60);
  },

  hasSLABreach: () => {
    return offlineQueue.getOldestItemAge() > SYNC_SLA_HOURS;
  }
};

export const wizardProgress = {
  WEEKLY_KEY: 'jolt_weekly_progress',
  MONTHLY_KEY: 'jolt_monthly_progress',

  saveWeekly: (data) => {
    safeStorage.setJSON(wizardProgress.WEEKLY_KEY, {
      ...data,
      savedAt: new Date().toISOString()
    });
  },

  loadWeekly: () => {
    return safeStorage.getJSON(wizardProgress.WEEKLY_KEY, null);
  },

  clearWeekly: () => {
    safeStorage.removeItem(wizardProgress.WEEKLY_KEY);
  },

  saveMonthly: (data) => {
    safeStorage.setJSON(wizardProgress.MONTHLY_KEY, {
      ...data,
      savedAt: new Date().toISOString()
    });
  },

  loadMonthly: () => {
    return safeStorage.getJSON(wizardProgress.MONTHLY_KEY, null);
  },

  clearMonthly: () => {
    safeStorage.removeItem(wizardProgress.MONTHLY_KEY);
  }
};
