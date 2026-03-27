import React from 'react';
import { Activity, AlertTriangle, Clock } from 'lucide-react';

export const HeartbeatIndicator = ({ 
  healthStatus = 'green', 
  slaRemaining, 
  hasDrift, 
  clockDrift,
  formatSlaRemaining 
}) => {
  const statusConfig = {
    green: {
      bgColor: 'bg-green-500/20',
      textColor: 'text-green-400',
      borderColor: 'border-green-500/30',
      pulseColor: 'bg-green-500',
      label: 'System Synced'
    },
    yellow: {
      bgColor: 'bg-amber-500/20',
      textColor: 'text-amber-400',
      borderColor: 'border-amber-500/30',
      pulseColor: 'bg-amber-500',
      label: hasDrift ? 'Time-Drift Detected' : 'SLA Warning'
    },
    red: {
      bgColor: 'bg-red-500/20',
      textColor: 'text-red-400',
      borderColor: 'border-red-500/30',
      pulseColor: 'bg-red-500',
      label: hasDrift ? 'Clock Anomaly' : 'SLA Breach'
    }
  };

  const config = statusConfig[healthStatus] || statusConfig.green;

  return (
    <div className={`${config.bgColor} border ${config.borderColor} rounded-lg px-3 py-2 mb-3`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="relative">
            <div className={`w-2.5 h-2.5 ${config.pulseColor} rounded-full`} />
            <div className={`absolute inset-0 w-2.5 h-2.5 ${config.pulseColor} rounded-full animate-ping opacity-75`} />
          </div>
          <span className={`${config.textColor} font-mono text-xs font-medium`}>
            {config.label}
          </span>
        </div>
        
        <div className="flex items-center gap-3">
          {hasDrift && (
            <div className="flex items-center gap-1 text-amber-400">
              <AlertTriangle size={12} />
              <span className="font-mono text-xs">
                Drift: {Math.round(clockDrift)}m
              </span>
            </div>
          )}
          
          <div className="flex items-center gap-1.5">
            <Clock size={12} className={config.textColor} />
            <span className={`font-mono text-xs font-semibold ${config.textColor}`}>
              SLA: {formatSlaRemaining ? formatSlaRemaining() : '--:--'}
            </span>
          </div>
        </div>
      </div>
      
      {hasDrift && (
        <p className="text-amber-300/80 text-xs font-mono mt-1.5 pl-4">
          Verify Phone Settings: Date & Time should be Automatic
        </p>
      )}
    </div>
  );
};
