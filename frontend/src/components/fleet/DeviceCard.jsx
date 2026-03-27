import React from 'react';
import { MapPin, Clock, Wifi, ChevronRight, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

const DeviceCard = ({ device, onClick, isDark = false }) => {
  const statusConfig = {
    online: {
      color: isDark ? 'text-emerald-400' : 'text-emerald-600',
      bgColor: isDark ? 'bg-emerald-500/10' : 'bg-emerald-50',
      borderColor: isDark ? 'border-emerald-500/20' : 'border-emerald-100',
      icon: CheckCircle
    },
    faulted: {
      color: isDark ? 'text-red-400' : 'text-red-600',
      bgColor: isDark ? 'bg-red-500/10' : 'bg-red-50',
      borderColor: isDark ? 'border-red-500/20' : 'border-red-100',
      icon: AlertTriangle
    },
    offline: {
      color: isDark ? 'text-slate-400' : 'text-slate-600',
      bgColor: isDark ? 'bg-slate-500/10' : 'bg-slate-50',
      borderColor: isDark ? 'border-slate-500/20' : 'border-slate-100',
      icon: XCircle
    }
  };

  const status = device.fault ? 'faulted' : device.status.online ? 'online' : 'offline';
  const config = statusConfig[status];
  const StatusIcon = config.icon;

  return (
    <div
      onClick={onClick}
      className={`${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'} border rounded-xl p-5 cursor-pointer hover:border-blue-500/50 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300 group`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-4">
            <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${config.bgColor} ${config.color} border ${config.borderColor} flex items-center gap-1.5`}>
              <StatusIcon size={12} />
              {device.status.statusLabel}
            </div>
            <div className={`text-[10px] font-medium uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              {device.type}
            </div>
          </div>

          <div className="space-y-1">
            <h4 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'} group-hover:text-blue-400 transition-colors`}>{device.name}</h4>
            <div className={`text-xs font-mono ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{device.deviceId}</div>
          </div>

          <div className={`mt-4 py-2 border-y ${isDark ? 'border-slate-700' : 'border-slate-100'}`}>
            <div className="flex items-center justify-between">
              <span className={`text-[11px] font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Work Status</span>
              <span className={`text-[11px] font-bold ${device.status.workStatusLabel === 'Idle' ? (isDark ? 'text-slate-400' : 'text-slate-500') : 'text-blue-400'}`}>
                {device.status.workStatusLabel}
              </span>
            </div>
          </div>

          {device.fault && (
            <div className="mt-4 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
              <div className="font-bold mb-1 flex items-center gap-1.5 uppercase tracking-wider">
                <AlertTriangle size={12} />
                Fault Detected
              </div>
              {device.fault.errorInfo}
            </div>
          )}

          <div className="mt-5 space-y-2">
            <div className={`flex items-start gap-2 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              <MapPin size={14} className="text-slate-500 mt-0.5 shrink-0" />
              <span className="line-clamp-1">{device.location.address}</span>
            </div>
            <div className={`flex items-center justify-between text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              <div className="flex items-center gap-1.5">
                <Clock size={12} />
                {device.lastSeen ? new Date(device.lastSeen).toLocaleTimeString() : 'N/A'}
              </div>
              {device.network.type && (
                <div className="flex items-center gap-1.5">
                  <Wifi size={12} />
                  {device.network.type} ({device.network.signal})
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className={`mt-6 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest ${isDark ? 'text-slate-400' : 'text-slate-500'} group-hover:text-blue-400 transition-colors`}>
        Open Controller
        <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
      </div>
    </div>
  );
};

export default DeviceCard;
