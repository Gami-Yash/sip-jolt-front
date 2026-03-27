import React, { useState } from 'react';
import { CheckCircle, Coffee, AlertTriangle, Clock, ChevronDown, ChevronUp, X } from 'lucide-react';
import { useCoffeeStatus } from '../hooks/useCoffeeStatus';

export const ConsolidatedStatusBar = ({ 
  healthStatus = 'green',
  hasDrift = false,
  clockDrift = 0,
  formatSlaRemaining,
  partnerId,
  siteId,
  lastVisitNotes = []
}) => {
  const [showAlerts, setShowAlerts] = useState(false);
  const { status: coffeeStatus, blockingTask } = useCoffeeStatus(partnerId, siteId);
  
  const statusColors = {
    green: { bg: 'bg-green-500', text: 'text-green-600', label: 'Synced' },
    yellow: { bg: 'bg-amber-500', text: 'text-amber-600', label: 'Warning' },
    red: { bg: 'bg-red-500', text: 'text-red-600', label: 'Issue' }
  };
  
  const currentStatus = statusColors[healthStatus] || statusColors.green;
  const alertCount = lastVisitNotes.length;
  const coffeeReady = coffeeStatus === 'UNLOCKED';

  return (
    <div className="mb-4">
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="relative">
                <div className={`w-2.5 h-2.5 ${currentStatus.bg} rounded-full`} />
                <div className={`absolute inset-0 w-2.5 h-2.5 ${currentStatus.bg} rounded-full animate-ping opacity-50`} />
              </div>
              <span className={`text-xs font-semibold ${currentStatus.text}`}>
                {currentStatus.label}
              </span>
            </div>
            
            <div className="h-4 w-px bg-gray-200" />
            
            <div className="flex items-center gap-1.5">
              <CheckCircle size={14} className="text-green-500" />
              <span className="text-xs font-medium text-gray-600">v1.00</span>
            </div>
            
            <div className="h-4 w-px bg-gray-200" />
            
            <div className="flex items-center gap-1.5">
              {coffeeReady ? (
                <>
                  <span className="text-base">☕</span>
                  <span className="text-xs font-semibold text-green-600">Ready</span>
                </>
              ) : (
                <>
                  <span className="text-base">🔒</span>
                  <span className="text-xs font-semibold text-amber-600">Locked</span>
                </>
              )}
            </div>
            
            {alertCount > 0 && (
              <>
                <div className="h-4 w-px bg-gray-200" />
                <button 
                  onClick={() => setShowAlerts(!showAlerts)}
                  className="flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-amber-50 transition-colors"
                >
                  <AlertTriangle size={14} className="text-amber-500" />
                  <span className="text-xs font-semibold text-amber-600">{alertCount}</span>
                  {showAlerts ? (
                    <ChevronUp size={12} className="text-amber-500" />
                  ) : (
                    <ChevronDown size={12} className="text-amber-500" />
                  )}
                </button>
              </>
            )}
          </div>
          
          <div className="flex items-center gap-1.5 text-gray-500">
            <Clock size={12} />
            <span className="text-xs font-mono font-medium">
              SLA: {formatSlaRemaining ? formatSlaRemaining() : '--:--'}
            </span>
          </div>
        </div>
        
        {coffeeReady && (
          <div className="px-4 py-2 bg-gradient-to-r from-green-50 to-emerald-50 border-t border-green-100">
            <div className="flex items-center gap-2">
              <span className="text-lg">☕</span>
              <span className="text-sm font-semibold text-green-700">Your Free Coffee is Ready!</span>
              <span className="text-xs text-green-600 ml-auto">1 cup/day</span>
            </div>
          </div>
        )}
        
        {!coffeeReady && blockingTask && (
          <div className="px-4 py-2 bg-gradient-to-r from-amber-50 to-yellow-50 border-t border-amber-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">🔒</span>
                <div>
                  <span className="text-sm font-semibold text-amber-700">Coffee Locked</span>
                  <span className="text-xs text-amber-600 ml-2">Complete: {blockingTask.name}</span>
                </div>
              </div>
              <button 
                onClick={() => window.location.href = blockingTask.url || '/tasks'}
                className="text-xs font-bold text-amber-700 bg-amber-200 hover:bg-amber-300 px-3 py-1 rounded-lg transition-colors"
              >
                Do Now
              </button>
            </div>
          </div>
        )}
        
        {showAlerts && alertCount > 0 && (
          <div className="px-4 py-3 bg-amber-50 border-t border-amber-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">Last Week's Summary</span>
              <button 
                onClick={() => setShowAlerts(false)}
                className="p-1 hover:bg-amber-100 rounded transition-colors"
              >
                <X size={14} className="text-amber-600" />
              </button>
            </div>
            <div className="space-y-1.5">
              {lastVisitNotes.map((note, i) => (
                <div key={i} className="flex items-start gap-2 text-xs">
                  <span className={note.type === 'warning' ? 'text-amber-500' : 'text-green-500'}>
                    {note.type === 'warning' ? '⚠️' : '✅'}
                  </span>
                  <span className="text-gray-700">{note.text}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {hasDrift && (
        <div className="mt-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-xs text-amber-700">
            ⚠️ Clock drift detected ({Math.round(clockDrift)}m). Check Phone Settings → Date & Time → Set Automatically
          </p>
        </div>
      )}
    </div>
  );
};

export default ConsolidatedStatusBar;
