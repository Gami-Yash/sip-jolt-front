import React, { useState, useEffect } from 'react';
import { Trophy, Gift, Target, ArrowRight, Zap, Sparkles } from 'lucide-react';
import LuckySpinWheelPremium from './LuckySpinWheelPremium';
import LeaderboardPremium from './LeaderboardPremium';
import VacationJackpotPremium from './VacationJackpotPremium';

const buildAuthHeaders = (user, fallbackRole = 'technician') => {
  const userId = user?.id || user?.technician_id || user?.userId || user?.displayName || user?.driverId || 'tech-001';
  const role = (user?.role || user?.userRole || fallbackRole).toString().toLowerCase();
  return {
    'x-user-id': String(userId),
    'x-user-role': role
  };
};

const RewardsHub = ({ user, onClose }) => {
  const [activeTab, setActiveTab] = useState('spin');
  const [spins, setSpins] = useState(0);

  useEffect(() => {
    const fetchSpins = async () => {
      try {
        const userId = user?.id || user?.technician_id || user?.displayName;
        if (!userId) return;
        const response = await fetch(`/api/v1.00/gamification/lucky-spin/available/${userId}`, {
          headers: buildAuthHeaders(user)
        });
        if (!response.ok) {
          setSpins(0);
          return;
        }
        const data = await response.json();
        setSpins(data.spins_available || 0);
      } catch (err) {
        console.error('Error fetching spins:', err);
        setSpins(0);
      }
    };
    fetchSpins();
  }, [user?.id, user?.technician_id, user?.displayName]);

  return (
    <div className="fixed inset-0 bg-[#f5f5f7] z-50 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-[#d2d2d7] px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="bg-blue-100 p-2 rounded-xl">
            <Gift className="text-blue-600" size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#1d1d1f]">Rewards Hub</h1>
            <p className="text-xs text-[#86868b] font-medium uppercase tracking-wider">v1.00 Premium</p>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ArrowRight className="text-[#86868b]" size={24} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#d2d2d7] bg-white">
        <button
          onClick={() => setActiveTab('spin')}
          className={`flex-1 py-4 text-sm font-semibold transition-all border-b-2 ${
            activeTab === 'spin' ? 'border-blue-600 text-blue-600' : 'border-transparent text-[#86868b]'
          }`}
        >
          Lucky Spin
        </button>
        <button
          onClick={() => setActiveTab('leaderboard')}
          className={`flex-1 py-4 text-sm font-semibold transition-all border-b-2 ${
            activeTab === 'leaderboard' ? 'border-blue-600 text-blue-600' : 'border-transparent text-[#86868b]'
          }`}
        >
          Leaderboard
        </button>
        <button
          onClick={() => setActiveTab('jackpot')}
          className={`flex-1 py-4 text-sm font-semibold transition-all border-b-2 ${
            activeTab === 'jackpot' ? 'border-blue-600 text-blue-600' : 'border-transparent text-[#86868b]'
          }`}
        >
          Vacation
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 pb-24">
        {activeTab === 'spin' && (
          <div className="space-y-6">
            <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-[#d2d2d7] text-center">
              <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-bold mb-4">
                <Zap size={16} fill="currentColor" />
                {spins} SPINS AVAILABLE
              </div>
              <LuckySpinWheelPremium 
                user={user} 
                onSpinComplete={() => setSpins(prev => Math.max(0, prev - 1))} 
              />
            </div>
            
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-[2rem] p-6 text-white shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <Sparkles size={24} />
                <h3 className="text-lg font-bold">How to Earn Spins</h3>
              </div>
              <ul className="space-y-3 text-blue-50">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-white opacity-60" />
                  <span>Accept delivery within 2 hours: <span className="text-white font-bold">+2 spins</span></span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-white opacity-60" />
                  <span>Accept delivery within 6 hours: <span className="text-white font-bold">+1 spin</span></span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-white opacity-60" />
                  <span>Complete Weekly Refill + Clean: <span className="text-white font-bold">+1 spin</span></span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-white opacity-60" />
                  <span>Complete Monthly Deep Clean: <span className="text-white font-bold">+2 spins</span></span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-white opacity-60" />
                  <span>Accumulate 500 points: <span className="text-white font-bold">+1 bonus spin</span></span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-white opacity-60" />
                  <span>Monthly Perfection (all criteria): <span className="text-white font-bold">+3 bonus spins</span></span>
                </li>
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'leaderboard' && (
          <LeaderboardPremium user={user} />
        )}

        {activeTab === 'jackpot' && (
          <VacationJackpotPremium user={user} />
        )}
      </div>
    </div>
  );
};

export default RewardsHub;
