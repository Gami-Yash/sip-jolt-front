// src/components/CoffeeStatus.jsx
// v1.00 Pull-Based Incentive System - Coffee Perk Status Component

import React from 'react';
import { useCoffeeStatus } from '../hooks/useCoffeeStatus';

export function CoffeeStatus({ partnerId, siteId }) {
  const { status, message, blockingTask, loading, error } = useCoffeeStatus(partnerId, siteId);
  
  if (loading) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 animate-pulse mb-4">
        <div className="flex items-center">
          <div className="w-12 h-12 bg-gray-200 rounded-full mr-3"></div>
          <div className="flex-1">
            <div className="h-5 bg-gray-200 rounded w-32 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-48"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return null;
  }

  // UNLOCKED STATE - All tasks current
  if (status === 'UNLOCKED') {
    return (
      <div className="bg-gradient-to-r from-green-100 to-emerald-100 border-2 border-green-300 rounded-2xl p-5 shadow-md mb-4">
        <div className="flex items-center">
          <div className="text-5xl mr-4">☕</div>
          <div className="flex-1">
            <p className="font-bold text-green-800 text-xl">Daily Coffee Perk: Ready!</p>
            <p className="text-sm text-green-700 mt-1">Everything is under control. Enjoy your daily coffee!</p>
          </div>
        </div>
        <div className="mt-4 pt-3 border-t border-green-200">
          <p className="text-xs text-green-600 flex items-center gap-2">
            <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            Unlocked because your alerts are clear
          </p>
        </div>
      </div>
    );
  }

  // LOCKED STATE - Has overdue tasks
  return (
    <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-300 rounded-2xl p-5 shadow-md mb-4">
      <div className="flex items-center">
        <div className="text-5xl mr-4">🔒</div>
        <div className="flex-1">
          <p className="font-bold text-amber-800 text-xl">Coffee Locked</p>
          <p className="text-sm text-amber-700 mt-1">
            Stay on top of app alerts and keep everything under control to unlock your daily coffee.
          </p>
        </div>
      </div>
      
      {blockingTask && (
        <div className="mt-4 pt-3 border-t border-amber-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-amber-800">Task: {blockingTask.name}</p>
              {blockingTask.hoursOverdue > 0 && (
                <p className="text-xs text-amber-600 mt-1">
                  {Math.floor(blockingTask.hoursOverdue)}h overdue
                </p>
              )}
            </div>
            <button 
              className="bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold px-4 py-2 rounded-lg transition-colors"
              onClick={() => window.location.href = blockingTask.url || '/tasks'}
            >
              Do Now
            </button>
          </div>
        </div>
      )}
      
      <div className="mt-3 bg-white/50 rounded-lg p-3">
        <p className="text-xs text-amber-700">
          <strong>How to unlock:</strong> Complete pending deliveries and visits within 24 hours to keep your free daily coffee perk active.
        </p>
      </div>
    </div>
  );
}

// Mini version for header/nav
export function CoffeeStatusMini({ partnerId, siteId }) {
  const { status } = useCoffeeStatus(partnerId, siteId);
  
  if (status === 'UNLOCKED') {
    return (
      <div className="flex items-center text-green-600">
        <span className="text-lg mr-1">☕</span>
        <span className="text-xs font-medium">Ready</span>
      </div>
    );
  }
  
  return (
    <div className="flex items-center text-amber-600">
      <span className="text-lg mr-1">🔒</span>
      <span className="text-xs font-medium">Locked</span>
    </div>
  );
}

export default CoffeeStatus;
