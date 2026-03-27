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

const LeaderboardPremium = ({ user, userId: userIdProp }) => {
  const resolvedUserId = userIdProp || user?.id || user?.technician_id || user?.userId || user?.displayName || user?.driverId || 'tech-001';
  const [period, setPeriod] = useState('daily');
  const [leaderboardData, setLeaderboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  useEffect(() => {
    fetchLeaderboard();
    const interval = setInterval(() => {
      fetchLeaderboard();
    }, 30000);

    return () => clearInterval(interval);
  }, [period, resolvedUserId]);

  const fetchLeaderboard = async () => {
    try {
      const response = await fetch(`/api/v1.00/gamification/leaderboard/${period}?userId=${resolvedUserId}`, {
        headers: buildAuthHeaders(user)
      });
      const data = await response.json();
      setLeaderboardData(data);
      setLastUpdate(new Date());
      setLoading(false);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      setLoading(false);
    }
  };

  const getMedalEmoji = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return '';
  };

  const getPerformanceGrade = (points) => {
    if (points >= 200) return { grade: 'S', color: 'text-yellow-400', bg: 'bg-yellow-400/10' };
    if (points >= 150) return { grade: 'A', color: 'text-green-400', bg: 'bg-green-400/10' };
    if (points >= 100) return { grade: 'B', color: 'text-blue-400', bg: 'bg-blue-400/10' };
    if (points >= 50) return { grade: 'C', color: 'text-orange-400', bg: 'bg-orange-400/10' };
    return { grade: 'D', color: 'text-red-400', bg: 'bg-red-400/10' };
  };

  const getRankBadgeColor = (rank) => {
    if (rank <= 3) return 'from-yellow-400 to-orange-500';
    if (rank <= 10) return 'from-blue-500 to-cyan-500';
    if (rank <= 20) return 'from-green-500 to-emerald-500';
    return 'from-gray-600 to-gray-700';
  };

  const getPointsLabel = (period) => {
    switch (period) {
      case 'daily': return 'Today';
      case 'weekly': return 'This Week';
      case 'alltime': return 'All Time';
      default: return 'Points';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] bg-gradient-to-br from-gray-900 via-gray-800 to-black rounded-2xl">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white p-6 rounded-2xl">
      <div className="max-w-6xl mx-auto mb-6">
        <h1 className="text-3xl font-bold text-center mb-2 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
          Performance Leaderboard
        </h1>
        <p className="text-center text-gray-400 text-sm">
          Top performers ranked by speed, quality, and consistency
        </p>
        <p className="text-center text-xs text-gray-500 mt-1">
          Last updated: {lastUpdate.toLocaleTimeString()}
        </p>
      </div>

      <div className="max-w-6xl mx-auto mb-6">
        <div className="flex gap-3 justify-center">
          {['daily', 'weekly', 'alltime'].map((p) => (
            <motion.button
              key={p}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setPeriod(p)}
              className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
                period === p
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg shadow-blue-500/50'
                  : 'bg-gray-800 hover:bg-gray-700'
              }`}
            >
              {p === 'alltime' ? 'All-Time' : p.charAt(0).toUpperCase() + p.slice(1)}
            </motion.button>
          ))}
        </div>
      </div>

      {leaderboardData?.user_rank && (
        <div className="max-w-6xl mx-auto mb-6">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`bg-gradient-to-r ${getRankBadgeColor(leaderboardData.user_rank.rank)} rounded-2xl p-5 shadow-2xl`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="text-5xl font-bold">
                  #{leaderboardData.user_rank.rank}
                </div>
                <div>
                  <p className="text-xl font-bold">{leaderboardData.user_rank.name}</p>
                  <p className="text-sm opacity-75">Your Current Ranking</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold">
                  {period === 'daily' ? leaderboardData.user_rank.points_earned_today :
                   period === 'weekly' ? leaderboardData.user_rank.points_week :
                   leaderboardData.user_rank.total_points}
                </p>
                <p className="text-sm opacity-75">{getPointsLabel(period)} Points</p>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      <div className="max-w-6xl mx-auto">
        <div className="bg-gray-800 rounded-2xl overflow-hidden shadow-2xl">
          <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-4 border-b border-gray-700">
            <div className="grid grid-cols-12 gap-4 font-bold text-xs text-gray-400">
              <div className="col-span-1 text-center">Rank</div>
              <div className="col-span-4">Technician</div>
              <div className="col-span-2 text-center">Points</div>
              <div className="col-span-2 text-center">Fast Accept</div>
              <div className="col-span-2 text-center">Streak</div>
              <div className="col-span-1 text-center">Grade</div>
            </div>
          </div>

          <div className="divide-y divide-gray-700">
            {leaderboardData?.top_performers?.map((performer, index) => {
              const gradeInfo = getPerformanceGrade(
                period === 'daily' ? performer.points_earned_today :
                period === 'weekly' ? performer.points_week :
                performer.total_points
              );
              const isCurrentUser = performer.id === resolvedUserId;

              return (
                <motion.div
                  key={performer.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`grid grid-cols-12 gap-4 p-4 items-center ${
                    isCurrentUser ? 'bg-blue-900/30 border-l-4 border-blue-500' : 'hover:bg-gray-700/50'
                  } transition-colors`}
                >
                  <div className="col-span-1 text-center">
                    <div className={`text-xl font-bold ${
                      performer.rank <= 3 ? 'text-yellow-400' : 'text-gray-400'
                    }`}>
                      {getMedalEmoji(performer.rank) || `#${performer.rank}`}
                    </div>
                  </div>

                  <div className="col-span-4">
                    <p className={`font-bold text-sm ${isCurrentUser ? 'text-blue-300' : 'text-white'}`}>
                      {performer.name} {isCurrentUser && '(You)'}
                    </p>
                    <p className="text-xs text-gray-400 truncate">{performer.email}</p>
                  </div>

                  <div className="col-span-2 text-center">
                    <p className="text-lg font-bold">
                      {period === 'daily' ? performer.points_earned_today :
                       period === 'weekly' ? performer.points_week :
                       performer.total_points}
                    </p>
                    <p className="text-xs text-gray-400">pts</p>
                  </div>

                  <div className="col-span-2 text-center">
                    <p className="text-lg font-bold text-green-400">
                      {period === 'daily' ? performer.acceptances_under_2h :
                       period === 'weekly' ? performer.speed_acceptances :
                       performer.total_speed_acceptances}
                    </p>
                    <p className="text-xs text-gray-400">&lt;2h</p>
                  </div>

                  <div className="col-span-2 text-center">
                    <p className="text-lg font-bold text-orange-400">
                      {period === 'daily' ? performer.current_streak_days :
                       period === 'weekly' ? performer.best_streak :
                       performer.best_streak}
                    </p>
                    <p className="text-xs text-gray-400">days</p>
                  </div>

                  <div className="col-span-1 text-center">
                    <div className={`${gradeInfo.bg} ${gradeInfo.color} rounded-lg p-2 font-bold text-sm`}>
                      {gradeInfo.grade}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto mt-6">
        <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
          <h3 className="text-lg font-bold mb-3">Performance Grades</h3>
          <div className="grid grid-cols-5 gap-3">
            <div className="text-center">
              <div className="bg-yellow-400/10 text-yellow-400 rounded-lg p-2 font-bold text-xl mb-1">S</div>
              <p className="text-xs text-gray-400">200+ pts</p>
            </div>
            <div className="text-center">
              <div className="bg-green-400/10 text-green-400 rounded-lg p-2 font-bold text-xl mb-1">A</div>
              <p className="text-xs text-gray-400">150-199</p>
            </div>
            <div className="text-center">
              <div className="bg-blue-400/10 text-blue-400 rounded-lg p-2 font-bold text-xl mb-1">B</div>
              <p className="text-xs text-gray-400">100-149</p>
            </div>
            <div className="text-center">
              <div className="bg-orange-400/10 text-orange-400 rounded-lg p-2 font-bold text-xl mb-1">C</div>
              <p className="text-xs text-gray-400">50-99</p>
            </div>
            <div className="text-center">
              <div className="bg-red-400/10 text-red-400 rounded-lg p-2 font-bold text-xl mb-1">D</div>
              <p className="text-xs text-gray-400">0-49</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeaderboardPremium;
