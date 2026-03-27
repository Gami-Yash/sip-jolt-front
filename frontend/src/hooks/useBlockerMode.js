import { useState, useEffect, useCallback } from 'react';
import { safeStorage } from '../utils/safeStorage';

export const BLOCKER_TYPES = {
  PENDING_ACCEPTANCE: 'PENDING_ACCEPTANCE',
  PENDING_POD: 'PENDING_POD',
  TERMINAL_INIT: 'TERMINAL_INIT',
  RECOVERY_REQUIRED: 'RECOVERY_REQUIRED'
};

// v1.00+: App lockdowns are removed in favor of Soft Warnings.
// This hook now only returns status for notifications, never blocks the UI.
export const useBlockerMode = (options = {}) => {
  return {
    blockers: [],
    isBlocked: false,
    currentBlocker: null,
    checkBlockers: () => [],
    markFirstLoginComplete: () => {}
  };
};
