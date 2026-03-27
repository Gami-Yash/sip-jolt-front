import React from 'react';
import { Activity, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';

const FleetStats = ({ data, isDark = false }) => {
  if (!data) return null;

  const stats = [
    {
      label: 'Total Machines',
      value: data.total,
      icon: Activity,
      color: 'text-blue-500',
      darkColor: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/20'
    },
    {
      label: 'Online',
      value: data.online,
      icon: CheckCircle,
      color: 'text-emerald-500',
      darkColor: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/20'
    },
    {
      label: 'Faulted',
      value: data.faulted,
      icon: AlertTriangle,
      color: 'text-red-500',
      darkColor: 'text-red-400',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/20'
    },
    {
      label: 'Offline',
      value: data.offline,
      icon: XCircle,
      color: 'text-slate-500',
      darkColor: 'text-slate-400',
      bgColor: 'bg-slate-500/10',
      borderColor: 'border-slate-500/20'
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map(stat => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.label}
            className={`${stat.bgColor} rounded-xl p-4 border ${stat.borderColor} shadow-sm backdrop-blur-sm`}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className={`text-xs font-medium uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{stat.label}</div>
                <div className={`text-2xl font-bold mt-1 ${isDark ? stat.darkColor : stat.color}`}>
                  {stat.value}
                </div>
              </div>
              <Icon className={`w-8 h-8 ${isDark ? stat.darkColor : stat.color} opacity-80`} />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default FleetStats;
