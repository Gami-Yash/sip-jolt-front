// src/hooks/useLuckySpins.js
// v1.00 Pull-Based Incentive System - Lucky Spins Hook

import { useState, useEffect, useCallback } from 'react';

export function useLuckySpins(partnerId) {
  const [balance, setBalance] = useState(0);
  const [lifetimeEarned, setLifetimeEarned] = useState(0);
  const [lastSpinAt, setLastSpinAt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSpins = useCallback(async () => {
    if (!partnerId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/v1.00/lucky-spins/${partnerId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch spins');
      }

      const data = await response.json();
      setBalance(data.balance || 0);
      setLifetimeEarned(data.lifetimeEarned || 0);
      setLastSpinAt(data.lastSpinAt);
      setError(null);
    } catch (err) {
      console.error('Lucky spins error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [partnerId]);

  useEffect(() => {
    fetchSpins();
  }, [fetchSpins]);

  return {
    balance,
    lifetimeEarned,
    lastSpinAt,
    hasSpins: balance > 0,
    loading,
    error,
    refresh: fetchSpins
  };
}

export default useLuckySpins;
