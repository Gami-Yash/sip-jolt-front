// src/components/ops/OpsManagerPerfectionDashboard.jsx
// OPS Manager view of all technician perfection status

import React, { useState, useEffect } from 'react';
import { Trophy, TrendingUp, Award, Users, Target } from 'lucide-react';

const buildOpsHeaders = () => ({
  'x-user-id': 'ops-001',
  'x-user-role': 'ops_manager'
});

export default function OpsManagerPerfectionDashboard() {
  const [leaderboard, setLeaderboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(null);

  useEffect(() => {
    fetchLeaderboard();
    const interval = setInterval(fetchLeaderboard, 300000);
    return () => clearInterval(interval);
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const response = await fetch('/api/v1.00/gamification/ops/perfection-leaderboard', {
        headers: buildOpsHeaders()
      });
      const data = await response.json();
      setLeaderboard(data);
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Error fetching perfection leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="animate-pulse flex items-center gap-3">
          <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
          <div className="h-6 w-48 bg-gray-200 rounded"></div>
        </div>
        <div className="mt-6 space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-100 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!leaderboard) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-8">
        <p className="text-gray-600">Unable to load perfection leaderboard</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg">
      <div className="bg-gradient-to-r from-purple-600 to-purple-800 text-white p-6 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Trophy className="w-8 h-8" />
              <h2 className="text-2xl font-bold">Monthly Perfection Leaderboard</h2>
            </div>
            <p className="text-purple-100">
              {leaderboard.month} - {leaderboard.summary?.perfection_achieved_count || 0} of {leaderboard.summary?.total_technicians || 0} achieved perfection ({leaderboard.summary?.perfection_rate || 0}%)
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-purple-200">Last Updated</div>
            <div className="text-lg font-semibold">
              {lastRefresh?.toLocaleTimeString()}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 p-6 bg-gray-50 border-b border-gray-200">
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="flex items-center gap-2 text-gray-600 text-sm mb-1">
            <Users className="w-4 h-4" />
            Total Technicians
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {leaderboard.summary?.total_technicians || 0}
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="flex items-center gap-2 text-green-600 text-sm mb-1">
            <Award className="w-4 h-4" />
            Achieved Perfection
          </div>
          <div className="text-2xl font-bold text-green-600">
            {leaderboard.summary?.perfection_achieved_count || 0}
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="flex items-center gap-2 text-blue-600 text-sm mb-1">
            <Target className="w-4 h-4" />
            Success Rate
          </div>
          <div className="text-2xl font-bold text-blue-600">
            {leaderboard.summary?.perfection_rate || 0}%
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="flex items-center gap-2 text-purple-600 text-sm mb-1">
            <TrendingUp className="w-4 h-4" />
            Spins Awarded
          </div>
          <div className="text-2xl font-bold text-purple-600">
            {(leaderboard.summary?.perfection_achieved_count || 0) * 3}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-100 border-b-2 border-gray-300">
            <tr>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Rank</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Technician</th>
              <th className="text-center py-3 px-4 font-semibold text-gray-700">Deliveries</th>
              <th className="text-center py-3 px-4 font-semibold text-gray-700">Speed %</th>
              <th className="text-center py-3 px-4 font-semibold text-gray-700">QC Issues</th>
              <th className="text-center py-3 px-4 font-semibold text-gray-700">Late Refills</th>
              <th className="text-center py-3 px-4 font-semibold text-gray-700">Late Tasks</th>
              <th className="text-center py-3 px-4 font-semibold text-gray-700">Status</th>
            </tr>
          </thead>
          <tbody>
            {(leaderboard.leaderboard || []).map((tech, index) => {
              const isPerfect = tech.perfection_achieved;
              const isTop3 = index < 3 && isPerfect;
              
              return (
                <tr
                  key={tech.user_id}
                  className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                    isPerfect ? 'bg-green-50' : ''
                  }`}
                >
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-semibold text-gray-700">
                        {index + 1}
                      </span>
                      {isTop3 && (
                        <span className="text-xl">
                          {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                        </span>
                      )}
                    </div>
                  </td>
                  
                  <td className="py-4 px-4">
                    <div className="font-semibold text-gray-900">
                      {tech.employee_name}
                    </div>
                  </td>
                  
                  <td className="py-4 px-4 text-center">
                    <div className={`font-mono font-semibold ${
                      tech.total_deliveries >= 20 ? 'text-green-600' : 'text-gray-600'
                    }`}>
                      {tech.total_deliveries}
                    </div>
                    <div className="text-xs text-gray-500">/ 20 required</div>
                  </td>
                  
                  <td className="py-4 px-4 text-center">
                    <div className={`font-mono font-semibold ${
                      parseFloat(tech.speed_rate) >= 80 ? 'text-green-600' : 'text-gray-600'
                    }`}>
                      {parseFloat(tech.speed_rate || 0).toFixed(1)}%
                    </div>
                    <div className="text-xs text-gray-500">80% required</div>
                  </td>
                  
                  <td className="py-4 px-4 text-center">
                    <div className={`font-mono font-bold ${
                      tech.qc_issues === 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {tech.qc_issues || 0}
                    </div>
                  </td>
                  
                  <td className="py-4 px-4 text-center">
                    <div className={`font-mono font-bold ${
                      tech.late_refills === 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {tech.late_refills || 0}
                    </div>
                  </td>
                  
                  <td className="py-4 px-4 text-center">
                    <div className={`font-mono font-bold ${
                      tech.overdue_24h === 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {tech.overdue_24h || 0}
                    </div>
                  </td>
                  
                  <td className="py-4 px-4 text-center">
                    {isPerfect ? (
                      <span className="inline-flex items-center gap-1 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
                        PERFECT
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm">
                        In Progress
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="p-6 bg-gray-50 border-t border-gray-200">
        <div className="text-sm text-gray-700">
          <strong className="text-gray-900">Monthly Perfection Criteria (ALL Required):</strong>
          <div className="grid grid-cols-3 gap-3 mt-2">
            <div>20+ deliveries</div>
            <div>80%+ within 6 hours</div>
            <div>Zero QC issues</div>
            <div>All refills on time</div>
            <div>No tasks 24h+ overdue</div>
            <div>No urgent alerts</div>
          </div>
          <div className="mt-3 text-purple-600 font-semibold">
            Reward: +3 Lucky Spins per technician who achieves perfection
          </div>
        </div>
      </div>
    </div>
  );
}
