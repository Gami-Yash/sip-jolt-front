// src/hooks/usePendingTasks.js
// v1.00 Pull-Based Incentive System - Pending Tasks Hook

import { useState, useEffect, useCallback } from 'react';

export function usePendingTasks(partnerId, siteId) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTasks = useCallback(async () => {
    if (!partnerId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/v1.00/pending-tasks/${partnerId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch pending tasks');
      }

      const data = await response.json();
      setTasks(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      console.error('Pending tasks error:', err);
      setError(err.message);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, [partnerId]);

  useEffect(() => {
    fetchTasks();
    
    // Refresh every 2 minutes
    const interval = setInterval(fetchTasks, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchTasks]);

  return {
    tasks,
    hasTasks: tasks.length > 0,
    nextTask: tasks[0] || null,
    taskCount: tasks.length,
    loading,
    error,
    refresh: fetchTasks
  };
}

export default usePendingTasks;
