// src/components/SpeedBonus.jsx
// v1.00 Pull-Based Incentive System - Speed Bonus Celebration Modal

import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';

export function SpeedBonusModal({ speedBonus, onClose }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (speedBonus && speedBonus.spinsAwarded > 0) {
      setIsVisible(true);
      
      // Trigger confetti for bonus!
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  }, [speedBonus]);

  if (!isVisible || !speedBonus) return null;

  const getTierEmoji = (tier) => {
    switch (tier) {
      case 'TIER_1': return '🏆';
      case 'TIER_2': return '⚡';
      case 'TIER_3': return '✨';
      default: return '✅';
    }
  };

  const getTierColor = (tier) => {
    switch (tier) {
      case 'TIER_1': return 'from-yellow-400 to-amber-500';
      case 'TIER_2': return 'from-blue-400 to-indigo-500';
      case 'TIER_3': return 'from-green-400 to-emerald-500';
      default: return 'from-gray-400 to-gray-500';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-sm w-full p-6 text-center shadow-2xl animate-bounce-in">
        {/* Tier Badge */}
        <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br ${getTierColor(speedBonus.tier)} text-white text-4xl mb-4 shadow-lg`}>
          {getTierEmoji(speedBonus.tier)}
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          {speedBonus.label}
        </h2>

        {/* Time info */}
        <p className="text-gray-500 mb-4">
          Accepted in {speedBonus.hoursElapsed} hours
        </p>

        {/* Spins awarded */}
        {speedBonus.spinsAwarded > 0 && (
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-4 mb-4">
            <div className="flex items-center justify-center space-x-2">
              <span className="text-3xl">🎰</span>
              <span className="text-2xl font-bold text-purple-700">
                +{speedBonus.spinsAwarded} Lucky Spin{speedBonus.spinsAwarded > 1 ? 's' : ''}
              </span>
            </div>
            <p className="text-sm text-purple-600 mt-1">Added to your balance</p>
          </div>
        )}

        {/* Coffee status */}
        <div className="bg-green-50 border border-green-200 rounded-xl p-3 mb-4">
          <div className="flex items-center justify-center space-x-2">
            <span className="text-xl">☕</span>
            <span className="text-green-700 font-semibold">Coffee Unlocked!</span>
          </div>
        </div>

        {/* Close button */}
        <button
          onClick={() => {
            setIsVisible(false);
            onClose?.();
          }}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
        >
          Awesome!
        </button>
      </div>
    </div>
  );
}

// Inline speed bonus indicator for action rail
// Uses bonus tier info from API instead of calculating locally
export function SpeedBonusIndicator({ bonusTier, spinsAvailable, timeToNextTier, hoursRemaining }) {
  // Use proper tier info if available
  if (bonusTier) {
    switch (bonusTier) {
      case 'TIER_1':
        return (
          <span className="text-green-600 font-bold text-xs">
            🏆 3x spins available! {timeToNextTier?.toFixed(1)}h left
          </span>
        );
      case 'TIER_2':
        return (
          <span className="text-blue-600 font-bold text-xs">
            ⚡ 2x spins available! {timeToNextTier?.toFixed(1)}h left
          </span>
        );
      case 'TIER_3':
        return (
          <span className="text-purple-600 font-bold text-xs">
            ✨ 1x spin available! {timeToNextTier?.toFixed(1)}h left
          </span>
        );
      case 'STANDARD':
        return (
          <span className="text-gray-500 text-xs">
            {hoursRemaining?.toFixed(0)}h remaining
          </span>
        );
      case 'MISSED':
        return (
          <span className="text-gray-500 text-xs">Bonus window closed</span>
        );
      default:
        return null;
    }
  }

  // Fallback for old data
  if (hoursRemaining <= 0) {
    return <span className="text-gray-500 text-xs">Bonus window closed</span>;
  }

  return (
    <span className="text-gray-500 text-xs">
      {hoursRemaining?.toFixed(0)}h remaining
    </span>
  );
}

export default SpeedBonusModal;
