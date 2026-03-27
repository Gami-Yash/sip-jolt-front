const DB_NAME = 'SipjoltOfflineDB';
const DB_VERSION = 1;
const STORE_NAME = 'sync_queue';
const SYNC_SLA_HOURS = 6;

let dbInstance = null;

const openDB = () => {
  return new Promise((resolve, reject) => {
    if (dbInstance) {
      resolve(dbInstance);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    
    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
        store.createIndex('type', 'type', { unique: false });
        store.createIndex('clientTimestamp', 'clientTimestamp', { unique: false });
        store.createIndex('isSynced', 'isSynced', { unique: false });
        store.createIndex('siteId', 'siteId', { unique: false });
      }
    };
  });
};

export const indexedDBQueue = {
  SYNC_SLA_HOURS,

  async add(type, data, mediaBlob = null) {
    const db = await openDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      
      const item = {
        type,
        data,
        mediaBlob,
        clientTimestamp: Date.now(),
        createdAt: new Date().toISOString(),
        isSynced: false,
        retries: 0,
        lastRetryAt: null,
        deviceId: localStorage.getItem('jolt_device_id') || 'unknown',
        idempotencyKey: `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 8)}`
      };
      
      const request = store.add(item);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  async getAll() {
    const db = await openDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  async getPending() {
    const db = await openDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('isSynced');
      const request = index.getAll(IDBKeyRange.only(false));
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  async markSynced(id) {
    const db = await openDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      
      const getRequest = store.get(id);
      getRequest.onsuccess = () => {
        const item = getRequest.result;
        if (item) {
          item.isSynced = true;
          item.syncedAt = new Date().toISOString();
          const updateRequest = store.put(item);
          updateRequest.onsuccess = () => resolve(true);
          updateRequest.onerror = () => reject(updateRequest.error);
        } else {
          resolve(false);
        }
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  },

  async remove(id) {
    const db = await openDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);
      
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  },

  async incrementRetry(id) {
    const db = await openDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      
      const getRequest = store.get(id);
      getRequest.onsuccess = () => {
        const item = getRequest.result;
        if (item) {
          item.retries = (item.retries || 0) + 1;
          item.lastRetryAt = new Date().toISOString();
          const updateRequest = store.put(item);
          updateRequest.onsuccess = () => resolve(item.retries);
          updateRequest.onerror = () => reject(updateRequest.error);
        } else {
          resolve(0);
        }
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  },

  async checkSLABreaches() {
    const pending = await this.getPending();
    const now = Date.now();
    const breaches = [];
    
    for (const item of pending) {
      const hoursSinceCreation = (now - item.clientTimestamp) / (1000 * 60 * 60);
      
      if (hoursSinceCreation > SYNC_SLA_HOURS) {
        breaches.push({
          id: item.id,
          type: item.type,
          hoursPending: Math.round(hoursSinceCreation * 10) / 10,
          clientTimestamp: item.clientTimestamp,
          siteId: item.data?.siteId
        });
      }
    }
    
    return breaches;
  },

  async processQueue(syncFn) {
    const pending = await this.getPending();
    const results = { processed: 0, failed: 0, breaches: [] };
    
    if (!navigator.onLine) {
      return results;
    }
    
    for (const item of pending) {
      const hoursSinceCreation = (Date.now() - item.clientTimestamp) / (1000 * 60 * 60);
      
      if (hoursSinceCreation > SYNC_SLA_HOURS) {
        results.breaches.push({
          id: item.id,
          type: item.type,
          hoursPending: Math.round(hoursSinceCreation * 10) / 10
        });
      }
      
      try {
        await syncFn(item);
        await this.markSynced(item.id);
        results.processed++;
      } catch (error) {
        const retries = await this.incrementRetry(item.id);
        
        if (retries >= 5) {
          results.breaches.push({
            id: item.id,
            type: item.type,
            reason: 'max_retries_exceeded',
            error: error.message
          });
        }
        
        results.failed++;
      }
    }
    
    return results;
  },

  async getQueueStatus() {
    const pending = await this.getPending();
    const breaches = await this.checkSLABreaches();
    
    let oldestAge = 0;
    if (pending.length > 0) {
      const oldest = Math.min(...pending.map(p => p.clientTimestamp));
      oldestAge = (Date.now() - oldest) / (1000 * 60 * 60);
    }
    
    return {
      pendingCount: pending.length,
      breachCount: breaches.length,
      oldestItemAgeHours: Math.round(oldestAge * 10) / 10,
      hasSLABreach: breaches.length > 0,
      items: pending.map(p => ({
        id: p.id,
        type: p.type,
        createdAt: p.createdAt,
        retries: p.retries
      }))
    };
  },

  async clear() {
    const db = await openDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();
      
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  }
};

export default indexedDBQueue;
