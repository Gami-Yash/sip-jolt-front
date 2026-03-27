import { useState, useEffect, useCallback } from 'react';
import { getDeviceId } from './useTerminalInit';

const DB_NAME = 'sipjolt_offline_queue';
const DB_VERSION = 1;
const STORE_NAME = 'queue';
const SLA_HOURS = 6;
const MAX_RETRY_ATTEMPTS = 3;
const SYNC_INTERVAL_MS = 30000;

let dbInstance = null;

async function getDB() {
  if (dbInstance) return dbInstance;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('status', 'status', { unique: false });
        store.createIndex('createdAt', 'createdAt', { unique: false });
        store.createIndex('idempotencyKey', 'idempotencyKey', { unique: true });
        store.createIndex('expiresAt', 'expiresAt', { unique: false });
      }
    };
  });
}

function generateIdempotencyKey(type, payload) {
  const hash = JSON.stringify({ type, payload, ts: Math.floor(Date.now() / 1000) });
  let hashCode = 0;
  for (let i = 0; i < hash.length; i++) {
    const char = hash.charCodeAt(i);
    hashCode = ((hashCode << 5) - hashCode) + char;
    hashCode = hashCode & hashCode;
  }
  return `IDEM_${Math.abs(hashCode).toString(36)}_${Date.now()}`;
}

export async function enqueue(type, payload) {
  const db = await getDB();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SLA_HOURS * 60 * 60 * 1000);

  const message = {
    id: `Q_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    idempotencyKey: generateIdempotencyKey(type, payload),
    deviceId: getDeviceId(),
    type,
    payload,
    createdAt: now.toISOString(),
    attempts: 0,
    lastAttempt: null,
    status: 'PENDING',
    expiresAt: expiresAt.toISOString(),
  };

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.add(message);
    request.onsuccess = () => resolve(message);
    request.onerror = () => reject(request.error);
  });
}

export async function getPendingMessages() {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('status');
    const request = index.getAll('PENDING');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function updateMessageStatus(id, status, incrementAttempts = false) {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const getRequest = store.get(id);
    getRequest.onsuccess = () => {
      const message = getRequest.result;
      if (!message) {
        reject(new Error('Message not found'));
        return;
      }
      message.status = status;
      message.lastAttempt = new Date().toISOString();
      if (incrementAttempts) message.attempts += 1;
      const putRequest = store.put(message);
      putRequest.onsuccess = () => resolve();
      putRequest.onerror = () => reject(putRequest.error);
    };
    getRequest.onerror = () => reject(getRequest.error);
  });
}

export async function checkSLABreaches() {
  const db = await getDB();
  const now = new Date().toISOString();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();
    request.onsuccess = () => {
      const all = request.result;
      const breaches = all.filter(msg => msg.status === 'PENDING' && msg.expiresAt < now);
      breaches.forEach(msg => {
        msg.status = 'EXPIRED';
        store.put(msg);
      });
      resolve(breaches);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function getQueueStats() {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();
    request.onsuccess = () => {
      const all = request.result;
      const stats = { pending: 0, syncing: 0, synced: 0, failed: 0, expired: 0, total: all.length };
      all.forEach(msg => {
        switch (msg.status) {
          case 'PENDING': stats.pending++; break;
          case 'SYNCING': stats.syncing++; break;
          case 'SYNCED': stats.synced++; break;
          case 'FAILED': stats.failed++; break;
          case 'EXPIRED': stats.expired++; break;
        }
      });
      resolve(stats);
    };
    request.onerror = () => reject(request.error);
  });
}

const syncHandlers = new Map();

export function registerSyncHandler(type, handler) {
  syncHandlers.set(type, handler);
}

export async function processQueue() {
  const results = { synced: 0, failed: 0, expired: 0 };
  const breaches = await checkSLABreaches();
  results.expired = breaches.length;
  if (breaches.length > 0) {
    console.error(`[OFFLINE_QUEUE] SLA BREACH: ${breaches.length} messages expired`);
  }

  const pending = await getPendingMessages();
  for (const message of pending) {
    if (message.attempts >= MAX_RETRY_ATTEMPTS) {
      await updateMessageStatus(message.id, 'FAILED');
      results.failed++;
      continue;
    }
    const handler = syncHandlers.get(message.type);
    if (!handler) continue;
    await updateMessageStatus(message.id, 'SYNCING', true);
    try {
      const success = await handler(message);
      if (success) {
        await updateMessageStatus(message.id, 'SYNCED');
        results.synced++;
      } else {
        await updateMessageStatus(message.id, 'PENDING');
        results.failed++;
      }
    } catch (err) {
      console.error(`[OFFLINE_QUEUE] Sync failed for ${message.id}:`, err);
      await updateMessageStatus(message.id, 'PENDING');
      results.failed++;
    }
  }
  return results;
}

let isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
let syncIntervalId = null;

export function getOnlineStatus() {
  return isOnline;
}

export function startAutoSync() {
  if (typeof window === 'undefined') return;
  const handleOnline = () => {
    isOnline = true;
    console.log('[OFFLINE_QUEUE] Online - starting sync');
    processQueue();
  };
  const handleOffline = () => {
    isOnline = false;
    console.log('[OFFLINE_QUEUE] Offline - queuing enabled');
  };
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
  syncIntervalId = setInterval(() => {
    if (isOnline) processQueue();
  }, SYNC_INTERVAL_MS);
  if (isOnline) processQueue();
}

export function stopAutoSync() {
  if (syncIntervalId) {
    clearInterval(syncIntervalId);
    syncIntervalId = null;
  }
}

export function useOfflineQueue() {
  const [state, setState] = useState({
    isOnline: true,
    pendingCount: 0,
    isSyncing: false,
    lastSyncAt: null,
    slaBreachCount: 0,
  });

  const refreshStats = useCallback(async () => {
    try {
      const stats = await getQueueStats();
      setState(prev => ({
        ...prev,
        pendingCount: stats.pending + stats.syncing,
        slaBreachCount: stats.expired,
      }));
    } catch (err) {
      console.error('[OFFLINE_QUEUE] Failed to get stats:', err);
    }
  }, []);

  const sync = useCallback(async () => {
    if (!isOnline) return;
    setState(prev => ({ ...prev, isSyncing: true }));
    try {
      await processQueue();
      setState(prev => ({
        ...prev,
        isSyncing: false,
        lastSyncAt: new Date().toISOString(),
      }));
      await refreshStats();
    } catch (err) {
      console.error('[OFFLINE_QUEUE] Sync error:', err);
      setState(prev => ({ ...prev, isSyncing: false }));
    }
  }, [refreshStats]);

  useEffect(() => {
    const updateOnlineStatus = () => {
      setState(prev => ({ ...prev, isOnline: navigator.onLine }));
    };
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    refreshStats();
    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, [refreshStats]);

  return { ...state, sync, refreshStats, enqueue };
}

export default useOfflineQueue;
