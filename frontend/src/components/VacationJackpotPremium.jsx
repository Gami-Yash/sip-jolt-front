import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const buildAuthHeaders = (user, fallbackRole = 'technician') => {
  const userId = user?.id || user?.technician_id || user?.userId || user?.displayName || user?.driverId || 'tech-001';
  const role = (user?.role || user?.userRole || fallbackRole).toString().toLowerCase();
  return {
    'x-user-id': String(userId),
    'x-user-role': role
  };
};

const VacationJackpotPremium = ({ user, userId: userIdProp }) => {
  const resolvedUserId = userIdProp || user?.id || user?.technician_id || user?.userId || user?.displayName || user?.driverId || 'tech-001';
  const [raceData, setRaceData] = useState(null);
  const [userStats, setUserStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  useEffect(() => {
    fetchRaceData();
    const interval = setInterval(() => {
      fetchRaceData();
    }, 30000);

    return () => clearInterval(interval);
  }, [resolvedUserId]);

  const fetchRaceData = async () => {
    try {
      const headers = buildAuthHeaders(user);
      const [contestRes, entriesRes] = await Promise.all([
        fetch('/api/v1.00/gamification/jackpot/current', { headers }),
        fetch(`/api/v1.00/gamification/jackpot/entries/${resolvedUserId}`, { headers })
      ]);

      const contestData = await contestRes.json();
      const entriesData = await entriesRes.json();

      setRaceData(contestData);
      setUserStats(entriesData);
      setLastUpdate(new Date());
      setLoading(false);
    } catch (error) {
      console.error('Error fetching vacation race data:', error);
      setLoading(false);
    }
  };

  const getTimeRemaining = () => {
    const now = new Date();
    const endOfYear = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
    const diff = endOfYear - now;
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    return { days, hours };
  };

  const getRankMessage = (rank) => {
    if (rank === 1) return "You're in the lead! Keep up the amazing work!";
    if (rank <= 3) return "You're on the podium! Push harder to take #1!";
    if (rank <= 5) return "Top 5! You're a serious contender for the vacation!";
    if (rank <= 10) return "Top 10! Great performance - keep climbing!";
    return "Keep improving your metrics to climb the leaderboard!";
  };

  const getRankColor = (rank) => {
    if (rank === 1) return 'from-yellow-500 to-amber-600';
    if (rank <= 3) return 'from-gray-400 to-gray-500';
    if (rank <= 5) return 'from-orange-600 to-red-600';
    if (rank <= 10) return 'from-blue-600 to-indigo-600';
    return 'from-gray-600 to-gray-700';
  };

  const timeRemaining = getTimeRemaining();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] bg-gradient-to-br from-gray-900 via-blue-900 to-cyan-900 rounded-2xl">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-cyan-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-gray-900 via-blue-900 to-cyan-900 text-white p-6 rounded-2xl">
      <div className="max-w-6xl mx-auto mb-6 relative z-10">
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl font-bold text-center mb-3 bg-gradient-to-r from-cyan-300 via-blue-300 to-purple-300 bg-clip-text text-transparent">
            Annual Vacation Race
          </h1>
          <p className="text-center text-lg text-cyan-200">
            Best Performer of the Year wins an all-expenses paid vacation!
          </p>
          <p className="text-center text-xs text-cyan-300 mt-1">
            Updated: {lastUpdate.toLocaleTimeString()}
          </p>
        </motion.div>
      </div>

      <div className="max-w-6xl mx-auto mb-6 relative z-10">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="bg-gradient-to-br from-cyan-500 via-blue-500 to-purple-600 rounded-3xl p-6 shadow-2xl"
        >
          <div className="text-center">
            <div className="text-5xl mb-3">🏆</div>
            <h2 className="text-3xl font-bold mb-2">ALL EXPENSES PAID BEACH GETAWAY</h2>
            <h3 className="text-xl font-bold mb-4">{raceData?.contest?.prize_name || 'All-Inclusive Resort Trip'}</h3>
            
            <div className="bg-black/30 rounded-xl p-4 backdrop-blur-sm mb-4">
              <p className="text-sm leading-relaxed">
                Round-trip airfare for 2, 5-night stay at an <strong>all-inclusive beach resort</strong>. 
                The technician with the highest annual performance score wins!
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/20 rounded-xl p-3">
                <p className="text-3xl font-bold">{timeRemaining.days}</p>
                <p className="text-xs opacity-75">Days Left</p>
              </div>
              <div className="bg-white/20 rounded-xl p-3">
                <p className="text-3xl font-bold">{raceData?.contest?.unique_participants || 0}</p>
                <p className="text-xs opacity-75">Competitors</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {userStats && (
        <div className="max-w-6xl mx-auto mb-6 relative z-10">
          <motion.div
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className={`bg-gradient-to-r ${getRankColor(userStats.rank || 99)} rounded-2xl p-5 shadow-2xl`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs opacity-75 mb-1">Your Rank</p>
                <p className="text-4xl font-bold">#{userStats.rank || '--'}</p>
              </div>
              <div className="text-right">
                <p className="text-xs opacity-75 mb-1">Performance Score</p>
                <p className="text-4xl font-bold">{userStats.vacation_score || 0}</p>
              </div>
            </div>
            <div className="mt-3 p-3 bg-black/30 rounded-xl">
              <p className="text-sm">{getRankMessage(userStats.rank || 99)}</p>
            </div>
            
            <div className="mt-4 grid grid-cols-4 gap-2">
              <div className="bg-white/20 rounded-lg p-2 text-center">
                <p className="text-lg font-bold">{userStats.on_time_rate || 0}%</p>
                <p className="text-xs opacity-75">On-Time</p>
              </div>
              <div className="bg-white/20 rounded-lg p-2 text-center">
                <p className="text-lg font-bold">{userStats.quality_score || 0}</p>
                <p className="text-xs opacity-75">Quality</p>
              </div>
              <div className="bg-white/20 rounded-lg p-2 text-center">
                <p className="text-lg font-bold">{userStats.visits_completed || 0}</p>
                <p className="text-xs opacity-75">Visits</p>
              </div>
              <div className="bg-white/20 rounded-lg p-2 text-center">
                <p className="text-lg font-bold">{userStats.streak_days || 0}</p>
                <p className="text-xs opacity-75">Streak</p>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {raceData?.top_contenders && raceData.top_contenders.length > 0 && (
        <div className="max-w-6xl mx-auto mb-6 relative z-10">
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <h2 className="text-2xl font-bold mb-4 text-center">Current Leaderboard</h2>
            <div className="bg-gray-800/80 backdrop-blur-md rounded-2xl overflow-hidden shadow-2xl">
              <div className="bg-gradient-to-r from-blue-900 to-cyan-900 p-3 border-b border-blue-700">
                <div className="grid grid-cols-12 gap-4 font-bold text-xs">
                  <div className="col-span-1 text-center">Rank</div>
                  <div className="col-span-5">Technician</div>
                  <div className="col-span-2 text-center">Score</div>
                  <div className="col-span-2 text-center">On-Time</div>
                  <div className="col-span-2 text-center">Visits</div>
                </div>
              </div>

              <div className="divide-y divide-gray-700">
                {raceData.top_contenders.map((contender, index) => {
                  const isCurrentUser = contender.id === resolvedUserId;
                  const medals = ['🥇', '🥈', '🥉'];
                  
                  return (
                    <motion.div
                      key={contender.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 + 0.5 }}
                      className={`grid grid-cols-12 gap-4 p-3 items-center ${
                        isCurrentUser ? 'bg-cyan-900/50 border-l-4 border-cyan-400' : 'hover:bg-gray-700/30'
                      } transition-colors`}
                    >
                      <div className="col-span-1 text-center text-xl font-bold">
                        {index < 3 ? medals[index] : `#${index + 1}`}
                      </div>

                      <div className="col-span-5">
                        <p className={`font-bold text-sm ${isCurrentUser ? 'text-cyan-300' : 'text-white'}`}>
                          {contender.name} {isCurrentUser && '(You)'}
                        </p>
                      </div>

                      <div className="col-span-2 text-center">
                        <p className="text-lg font-bold text-yellow-400">
                          {contender.vacation_score}
                        </p>
                      </div>

                      <div className="col-span-2 text-center">
                        <p className="text-lg font-bold text-green-400">
                          {contender.on_time_rate || 0}%
                        </p>
                      </div>

                      <div className="col-span-2 text-center">
                        <p className="text-lg font-bold text-blue-400">
                          {contender.visits_completed || 0}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </div>
      )}

      <div className="max-w-6xl mx-auto relative z-10">
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="bg-gray-800/80 backdrop-blur-md rounded-2xl p-5 border border-cyan-700"
        >
          <h3 className="text-xl font-bold mb-3 text-center text-cyan-300">
            How to Improve Your Score
          </h3>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-green-900/50 to-emerald-900/50 rounded-xl p-4 border border-green-700">
              <div className="text-3xl mb-2">⏰</div>
              <h4 className="text-lg font-bold mb-1">On-Time Performance</h4>
              <p className="text-gray-300 text-sm">
                Complete all visits on schedule. Every on-time visit adds +10 points.
              </p>
            </div>

            <div className="bg-gradient-to-br from-blue-900/50 to-cyan-900/50 rounded-xl p-4 border border-blue-700">
              <div className="text-3xl mb-2">✨</div>
              <h4 className="text-lg font-bold mb-1">Quality Scores</h4>
              <p className="text-gray-300 text-sm">
                Pass QC checks perfectly. High quality = higher score multiplier.
              </p>
            </div>

            <div className="bg-gradient-to-br from-orange-900/50 to-red-900/50 rounded-xl p-4 border border-orange-700">
              <div className="text-3xl mb-2">🔥</div>
              <h4 className="text-lg font-bold mb-1">Consistency Streak</h4>
              <p className="text-gray-300 text-sm">
                Build and maintain visit streaks. Longer streaks = bonus multipliers.
              </p>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-cyan-900/30 rounded-xl border border-cyan-700">
            <p className="text-sm text-center text-cyan-200">
              <strong>Winner announced December 31st</strong> — The technician with the highest cumulative score wins the vacation!
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default VacationJackpotPremium;
