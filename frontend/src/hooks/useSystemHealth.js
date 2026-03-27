import { useState, useEffect, useCallback, useRef } from 'react';

const SLA_HOURS = 6;
const DRIFT_THRESHOLD_MINUTES = 30;

export const useSystemHealth = () => {
  const [serverTime, setServerTime] = useState(null);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [clockDrift, setClockDrift] = useState(0);
  const [hasDrift, setHasDrift] = useState(false);
  const [slaRemaining, setSlaRemaining] = useState(SLA_HOURS * 60 * 60 * 1000);
  const [slaBreached, setSlaBreached] = useState(false);
  const [healthStatus, setHealthStatus] = useState('green');
  const intervalRef = useRef(null);

  const fetchServerTime = useCallback(async () => {
    try {
      const response = await fetch('/api/health');
      const data = await response.json();
      
      const serverUtcNow = data.server_utc_now ? new Date(data.server_utc_now).getTime() : Date.now();
      const clientNow = Date.now();
      const driftMs = Math.abs(serverUtcNow - clientNow);
      const driftMinutes = driftMs / (1000 * 60);
      
      setServerTime(serverUtcNow);
      setClockDrift(driftMinutes);
      setHasDrift(driftMinutes > DRIFT_THRESHOLD_MINUTES);
      setLastSyncTime(Date.now());
      
      return { serverTime: serverUtcNow, driftMinutes };
    } catch (error) {
      console.warn('Failed to fetch server time:', error);
      return null;
    }
  }, []);

  const updateSlaCountdown = useCallback(() => {
    if (!lastSyncTime) {
      setSlaRemaining(SLA_HOURS * 60 * 60 * 1000);
      return;
    }

    const elapsed = Date.now() - lastSyncTime;
    const remaining = Math.max(0, (SLA_HOURS * 60 * 60 * 1000) - elapsed);
    
    setSlaRemaining(remaining);
    setSlaBreached(remaining === 0);

    if (remaining === 0 || hasDrift) {
      setHealthStatus('red');
    } else if (remaining < 30 * 60 * 1000 || hasDrift) {
      setHealthStatus('yellow');
    } else {
      setHealthStatus('green');
    }
  }, [lastSyncTime, hasDrift]);

  useEffect(() => {
    fetchServerTime();
    
    const syncInterval = setInterval(fetchServerTime, 5 * 60 * 1000);
    
    return () => clearInterval(syncInterval);
  }, [fetchServerTime]);

  useEffect(() => {
    updateSlaCountdown();
    intervalRef.current = setInterval(updateSlaCountdown, 1000);
    
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [updateSlaCountdown]);

  const formatSlaRemaining = () => {
    const hours = Math.floor(slaRemaining / (1000 * 60 * 60));
    const minutes = Math.floor((slaRemaining % (1000 * 60 * 60)) / (1000 * 60));
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  };

  const sync = async () => {
    const result = await fetchServerTime();
    if (result) {
      setLastSyncTime(Date.now());
    }
    return result;
  };

  return {
    serverTime,
    lastSyncTime,
    clockDrift,
    hasDrift,
    slaRemaining,
    slaBreached,
    healthStatus,
    formatSlaRemaining,
    sync
  };
};
