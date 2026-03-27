import React from 'react';
import { Camera, Clock, ChevronRight, CheckCircle, AlertCircle, Calendar } from 'lucide-react';

export const SmartActionTile = ({
  title,
  siteName,
  siteId,
  proofRequired = 0,
  estimatedDuration,
  outcome,
  status = 'pending',
  dueDate,
  onClick,
  disabled = false
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'overdue':
        return {
          badge: 'OVERDUE',
          badgeColor: 'bg-red-100 text-red-700',
          borderColor: 'border-red-200',
          bgColor: 'bg-red-50'
        };
      case 'due':
        return {
          badge: 'DUE TODAY',
          badgeColor: 'bg-orange-100 text-orange-700',
          borderColor: 'border-orange-200',
          bgColor: 'bg-orange-50'
        };
      case 'completed':
        return {
          badge: 'COMPLETED',
          badgeColor: 'bg-green-100 text-green-700',
          borderColor: 'border-green-200',
          bgColor: 'bg-green-50'
        };
      default:
        return {
          badge: null,
          badgeColor: '',
          borderColor: 'border-gray-200',
          bgColor: 'bg-white'
        };
    }
  };

  const statusConfig = getStatusConfig();

  return (
    <button
      onClick={onClick}
      disabled={disabled || status === 'completed'}
      className={`w-full p-4 rounded-xl border ${statusConfig.borderColor} ${statusConfig.bgColor} text-left transition-all ${
        disabled || status === 'completed' 
          ? 'opacity-60 cursor-not-allowed' 
          : 'hover:shadow-md active:scale-[0.98]'
      }`}
    >
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-bold text-gray-900">{title}</h3>
          {siteName && (
            <p className="text-sm text-gray-600">
              {siteName}
              {siteId && <span className="text-gray-400 ml-1">({siteId})</span>}
            </p>
          )}
        </div>
        
        {statusConfig.badge && (
          <span className={`text-xs font-bold px-2 py-1 rounded ${statusConfig.badgeColor}`}>
            {statusConfig.badge}
          </span>
        )}
      </div>
      
      <div className="flex flex-wrap gap-3 text-xs text-gray-500 mb-3">
        {proofRequired > 0 && (
          <div className="flex items-center gap-1">
            <Camera size={14} />
            <span>{proofRequired} photo{proofRequired > 1 ? 's' : ''} required</span>
          </div>
        )}
        
        {estimatedDuration && (
          <div className="flex items-center gap-1">
            <Clock size={14} />
            <span>~{estimatedDuration}</span>
          </div>
        )}
        
        {dueDate && (
          <div className="flex items-center gap-1">
            <Calendar size={14} />
            <span>{new Date(dueDate).toLocaleDateString()}</span>
          </div>
        )}
      </div>
      
      {outcome && (
        <div className="flex items-center gap-2 text-xs text-gray-600 bg-gray-100 rounded-lg p-2 mb-3">
          <CheckCircle size={14} className="text-green-600 flex-shrink-0" />
          <span>{outcome}</span>
        </div>
      )}
      
      <div className="flex justify-end">
        <div className={`flex items-center gap-1 text-sm font-medium ${
          status === 'completed' ? 'text-green-600' : 'text-blue-600'
        }`}>
          {status === 'completed' ? (
            <>
              <CheckCircle size={16} />
              Done
            </>
          ) : (
            <>
              Start
              <ChevronRight size={16} />
            </>
          )}
        </div>
      </div>
    </button>
  );
};

export const SmartActionGrid = ({ actions = [], onStartAction, blockedByRail = false }) => {
  if (actions.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <CheckCircle size={48} className="mx-auto mb-3 text-green-500" />
        <p className="font-medium">All caught up!</p>
        <p className="text-sm">No pending tasks right now.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {actions.map((action, index) => (
        <SmartActionTile
          key={action.id || index}
          {...action}
          onClick={() => onStartAction(action)}
          disabled={blockedByRail && index > 0}
        />
      ))}
    </div>
  );
};

export default SmartActionTile;
