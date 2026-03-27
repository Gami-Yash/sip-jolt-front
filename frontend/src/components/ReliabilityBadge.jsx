import React from 'react';
import { Shield, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

export const ReliabilityBadge = ({ 
  rejectionRate = 0, 
  lateAcceptances = 0,
  showDetails = false,
  onRestrictedModeInfo 
}) => {
  const getStatus = () => {
    if (rejectionRate > 20 || lateAcceptances >= 3) {
      return {
        level: 'red',
        label: 'Needs Improvement',
        color: 'bg-red-100 text-red-700 border-red-300',
        icon: XCircle,
        iconColor: 'text-red-600',
        restricted: true
      };
    }
    if (rejectionRate > 5 || lateAcceptances >= 1) {
      return {
        level: 'yellow',
        label: 'Fair',
        color: 'bg-yellow-100 text-yellow-700 border-yellow-300',
        icon: AlertTriangle,
        iconColor: 'text-yellow-600',
        restricted: false
      };
    }
    return {
      level: 'green',
      label: 'Excellent',
      color: 'bg-green-100 text-green-700 border-green-300',
      icon: CheckCircle,
      iconColor: 'text-green-600',
      restricted: false
    };
  };

  const status = getStatus();
  const IconComponent = status.icon;

  return (
    <div className={`rounded-xl border p-4 ${status.color}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${status.level === 'green' ? 'bg-green-200' : status.level === 'yellow' ? 'bg-yellow-200' : 'bg-red-200'}`}>
            <Shield size={24} className={status.iconColor} />
          </div>
          <div>
            <div className="font-bold flex items-center gap-2">
              Reliability Badge
              <IconComponent size={18} className={status.iconColor} />
            </div>
            <div className="text-sm font-medium">{status.label}</div>
          </div>
        </div>
        
        {showDetails && (
          <div className="text-right text-sm">
            <div>Rejection: {rejectionRate.toFixed(1)}%</div>
            <div>Late: {lateAcceptances}</div>
          </div>
        )}
      </div>
      
      {status.restricted && (
        <div className="mt-3 pt-3 border-t border-red-300">
          <div className="flex items-center gap-2 text-sm">
            <AlertTriangle size={16} />
            <span className="font-medium">Restricted Mode Active</span>
          </div>
          <p className="text-xs mt-1 opacity-80">
            Complete tasks with first-pass proof to improve your rating.
          </p>
          {onRestrictedModeInfo && (
            <button
              onClick={onRestrictedModeInfo}
              className="text-xs underline mt-2"
            >
              What does this mean?
            </button>
          )}
        </div>
      )}
      
      {!status.restricted && status.level === 'green' && (
        <div className="mt-3 pt-3 border-t border-green-300">
          <p className="text-xs opacity-80">
            Great work! You're eligible for reduced audits and priority support.
          </p>
        </div>
      )}
    </div>
  );
};

export const calculateReliabilityStats = (events = []) => {
  const last30Days = Date.now() - (30 * 24 * 60 * 60 * 1000);
  const recentEvents = events.filter(e => new Date(e.timestamp).getTime() > last30Days);
  
  const proofSubmissions = recentEvents.filter(e => 
    e.type === 'PROOF_SUBMITTED' || e.type === 'PHOTO_SYNCED'
  ).length;
  
  const proofRejections = recentEvents.filter(e => 
    e.type === 'PROOF_REJECTED'
  ).length;
  
  const lateAcceptances = recentEvents.filter(e => 
    e.type === 'ACCEPTANCE_OVERDUE' || e.type === 'SYNC_SLA_BREACH'
  ).length;
  
  const rejectionRate = proofSubmissions > 0 
    ? (proofRejections / proofSubmissions) * 100 
    : 0;
  
  return {
    rejectionRate,
    lateAcceptances,
    proofSubmissions,
    proofRejections
  };
};

export default ReliabilityBadge;
