import { useState, useEffect, useCallback } from 'react';

const DRIFT_THRESHOLD_MINUTES = 30;
const CHECK_INTERVAL_MS = 60000;

const CLOCK_DRIFT_KEY = 'sipjolt_clock_drift_detected';
const CLOCK_DRIFT_EVENT_KEY = 'sipjolt_clock_drift_events';

function logClockDriftEvent(driftMinutes) {
  const events = JSON.parse(localStorage.getItem(CLOCK_DRIFT_EVENT_KEY) || '[]');
  events.push({
    timestamp: new Date().toISOString(),
    driftMinutes,
    event: 'CLOCK_TAMPER_SUSPECTED',
  });
  if (events.length > 100) events.shift();
  localStorage.setItem(CLOCK_DRIFT_EVENT_KEY, JSON.stringify(events));
  localStorage.setItem(CLOCK_DRIFT_KEY, 'true');
}

async function fetchServerTime() {
  try {
    const response = await fetch('/api/health', {
      method: 'GET',
      cache: 'no-store',
    });
    
    if (response.ok) {
      const data = await response.json();
      return new Date(data.server_utc_now || data.serverTime || data.timestamp);
    }
  } catch {
    // Ignore fetch errors
  }

  try {
    const response = await fetch('/api/health', {
      method: 'HEAD',
      cache: 'no-store',
    });
    
    const dateHeader = response.headers.get('Date');
    if (dateHeader) {
      return new Date(dateHeader);
    }
  } catch {
    // Ignore
  }

  throw new Error('Unable to fetch server time');
}

export function calculateDrift(serverTime, clientTime) {
  const diffMs = Math.abs(serverTime.getTime() - clientTime.getTime());
  return Math.round(diffMs / 60000);
}

export async function checkClockDrift() {
  const clientTime = new Date();
  const serverTime = await fetchServerTime();
  const driftMinutes = calculateDrift(serverTime, clientTime);
  const isDriftDetected = driftMinutes > DRIFT_THRESHOLD_MINUTES;

  if (isDriftDetected) {
    logClockDriftEvent(driftMinutes);
    console.warn(
      `[CLOCK_DRIFT] CLOCK_TAMPER_SUSPECTED: Drift of ${driftMinutes} minutes detected`
    );
  }

  return {
    driftMinutes,
    isDriftDetected,
    serverTime: serverTime.toISOString(),
    clientTime: clientTime.toISOString(),
  };
}

export function useClockDrift(autoCheck = true) {
  const [state, setState] = useState({
    serverTime: null,
    clientTime: new Date(),
    driftMinutes: 0,
    isDriftDetected: false,
    lastChecked: null,
    isChecking: false,
    error: null,
  });

  const checkNow = useCallback(async () => {
    setState((prev) => ({ ...prev, isChecking: true, error: null }));

    try {
      const result = await checkClockDrift();
      setState({
        serverTime: new Date(result.serverTime),
        clientTime: new Date(result.clientTime),
        driftMinutes: result.driftMinutes,
        isDriftDetected: result.isDriftDetected,
        lastChecked: new Date(),
        isChecking: false,
        error: null,
      });
    } catch (err) {
      console.error('[CLOCK_DRIFT] Check failed:', err);
      setState((prev) => ({
        ...prev,
        isChecking: false,
        error: 'Failed to verify clock sync',
      }));
    }
  }, []);

  const clearDriftFlag = useCallback(() => {
    localStorage.removeItem(CLOCK_DRIFT_KEY);
    setState((prev) => ({ ...prev, isDriftDetected: false }));
  }, []);

  useEffect(() => {
    if (!autoCheck) return;
    checkNow();
    const intervalId = setInterval(checkNow, CHECK_INTERVAL_MS);
    return () => clearInterval(intervalId);
  }, [autoCheck, checkNow]);

  useEffect(() => {
    const wasDriftDetected = localStorage.getItem(CLOCK_DRIFT_KEY) === 'true';
    if (wasDriftDetected) {
      setState((prev) => ({ ...prev, isDriftDetected: true }));
    }
  }, []);

  return {
    ...state,
    checkNow,
    clearDriftFlag,
  };
}

export default useClockDrift;
