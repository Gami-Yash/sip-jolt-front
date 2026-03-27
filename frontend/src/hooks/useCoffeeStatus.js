// src/hooks/useCoffeeStatus.js
// v1.00 Pull-Based Incentive System - Coffee Status Hook

import { useState, useEffect, useCallback } from 'react';

export function useCoffeeStatus(partnerId, siteId) {
  const [status, setStatus] = useState('UNLOCKED');
  const [message, setMessage] = useState('');
  const [blockingTask, setBlockingTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStatus = useCallback(async () => {
    if (!partnerId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const params = siteId ? `?siteId=${siteId}` : '';
      const response = await fetch(`/api/v1.00/coffee-status/${partnerId}${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch coffee status');
      }

      const data = await response.json();
      setStatus(data.status);
      setMessage(data.message);
      setBlockingTask(data.blockingTask || null);
      setError(null);
    } catch (err) {
      console.error('Coffee status error:', err);
      setError(err.message);
      // Default to unlocked on error to not punish user
      setStatus('UNLOCKED');
    } finally {
      setLoading(false);
    }
  }, [partnerId, siteId]);

  useEffect(() => {
    fetchStatus();
    
    // Refresh every 5 minutes
    const interval = setInterval(fetchStatus, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  const claimCoffee = useCallback(async () => {
    if (status !== 'UNLOCKED') {
      return { success: false, error: 'Coffee is locked' };
    }

    try {
      const response = await fetch('/api/v1.00/coffee-claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partnerId,
          siteId,
          timestamp: new Date().toISOString()
        })
      });

      const data = await response.json();
      return data;
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, [partnerId, siteId, status]);

  return {
    status,
    isUnlocked: status === 'UNLOCKED',
    isLocked: status === 'LOCKED',
    message,
    blockingTask,
    loading,
    error,
    claimCoffee,
    refresh: fetchStatus
  };
}

export default useCoffeeStatus;
