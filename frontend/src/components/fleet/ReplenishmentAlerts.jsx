import React, { useState, useEffect } from 'react';
import { Package, AlertTriangle, AlertCircle, CheckCircle, RefreshCw, BarChart3, Columns } from 'lucide-react';
import IngredientBinGauge from '../inventory/IngredientBinGauge';

const ReplenishmentAlerts = ({ deviceId, isDark = true }) => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('bars');

  const themeClasses = isDark
    ? {
        card: "bg-slate-800 border-slate-700",
        text: "text-white",
        textSub: "text-slate-400",
        badge: "bg-slate-700"
      }
    : {
        card: "bg-white border-gray-200",
        text: "text-gray-900",
        textSub: "text-gray-500",
        badge: "bg-gray-100"
      };

  const fetchReplenishmentStatus = async () => {
    if (!deviceId) return;
    
    try {
      setLoading(true);
      const response = await fetch(`/api/v1.01/replenishment/status/${deviceId}`);
      const result = await response.json();
      
      if (result.success) {
        setStatus(result.data);
        setError(null);
      } else {
        setError(result.error || 'Failed to fetch replenishment status');
      }
    } catch (err) {
      console.error('Replenishment fetch error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReplenishmentStatus();
    const interval = setInterval(fetchReplenishmentStatus, 120000);
    return () => clearInterval(interval);
  }, [deviceId]);

  const getLevelColor = (level, warning, critical) => {
    if (level <= critical) return 'text-red-500';
    if (level <= warning) return 'text-amber-500';
    return 'text-emerald-500';
  };

  const getLevelIcon = (level, warning, critical) => {
    if (level <= critical) return <AlertCircle className="w-4 h-4 text-red-500" />;
    if (level <= warning) return <AlertTriangle className="w-4 h-4 text-amber-500" />;
    return <CheckCircle className="w-4 h-4 text-emerald-500" />;
  };

  if (loading) {
    return (
      <div className={`rounded-lg border p-4 ${themeClasses.card}`}>
        <div className="flex items-center justify-center py-4">
          <RefreshCw className={`w-5 h-5 animate-spin ${themeClasses.textSub}`} />
          <span className={`ml-2 ${themeClasses.textSub}`}>Loading inventory...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`rounded-lg border p-4 ${themeClasses.card}`}>
        <div className="flex items-center gap-2 text-amber-500">
          <AlertTriangle className="w-5 h-5" />
          <span className="text-sm">Unable to load inventory data</span>
        </div>
      </div>
    );
  }

  if (!status || !status.ingredients || status.ingredients.length === 0) {
    return (
      <div className={`rounded-lg border p-4 ${themeClasses.card}`}>
        <div className="flex items-center gap-2">
          <Package className={`w-5 h-5 ${themeClasses.textSub}`} />
          <span className={themeClasses.textSub}>No inventory data available</span>
        </div>
      </div>
    );
  }

  const criticalCount = status.ingredients.filter(i => 
    i.currentLevel <= (i.criticalThreshold || 15)
  ).length;

  const warningCount = status.ingredients.filter(i => 
    i.currentLevel > (i.criticalThreshold || 15) && 
    i.currentLevel <= (i.warningThreshold || 30)
  ).length;

  return (
    <div className={`rounded-lg border ${themeClasses.card}`}>
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-500" />
            <h3 className={`font-semibold ${themeClasses.text}`}>Inventory Levels</h3>
          </div>
          <div className="flex items-center gap-2">
            {criticalCount > 0 && (
              <span className="px-2 py-1 text-xs font-medium bg-red-500/20 text-red-400 rounded-full">
                {criticalCount} Critical
              </span>
            )}
            {warningCount > 0 && (
              <span className="px-2 py-1 text-xs font-medium bg-amber-500/20 text-amber-400 rounded-full">
                {warningCount} Low
              </span>
            )}
            <div className="flex items-center border border-slate-600 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('bars')}
                className={`p-1.5 transition ${viewMode === 'bars' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-400 hover:text-white'}`}
                title="Bar View"
              >
                <BarChart3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('gauges')}
                className={`p-1.5 transition ${viewMode === 'gauges' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-400 hover:text-white'}`}
                title="Gauge View"
              >
                <Columns className="w-4 h-4" />
              </button>
            </div>
            <button
              onClick={fetchReplenishmentStatus}
              className={`p-1 rounded hover:bg-slate-700 transition ${themeClasses.textSub}`}
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {viewMode === 'bars' ? (
        <div className="p-4 space-y-3">
          {status.ingredients.map((ingredient, idx) => {
            const warning = ingredient.warningThreshold || 30;
            const critical = ingredient.criticalThreshold || 15;
            const levelColor = getLevelColor(ingredient.currentLevel, warning, critical);
            
            return (
              <div key={idx} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getLevelIcon(ingredient.currentLevel, warning, critical)}
                  <span className={themeClasses.text}>{ingredient.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-24 h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all ${
                        ingredient.currentLevel <= critical ? 'bg-red-500' :
                        ingredient.currentLevel <= warning ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, ingredient.currentLevel)}%` }}
                    />
                  </div>
                  <span className={`text-sm font-medium w-12 text-right ${levelColor}`}>
                    {ingredient.currentLevel}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {status.ingredients.map((ingredient, idx) => {
              const level = ingredient.currentLevel || 0;
              const maxGrams = ingredient.maxGrams || 5000;
              return (
                <IngredientBinGauge
                  key={idx}
                  name={ingredient.name || 'Unknown'}
                  currentGrams={Math.round((level / 100) * maxGrams)}
                  maxGrams={maxGrams}
                  dailyUsage={ingredient.dailyUsage || 150}
                  containerType="bag"
                  isDark={isDark}
                />
              );
            })}
          </div>
        </div>
      )}

      {status.lastUpdated && (
        <div className={`px-4 py-2 text-xs ${themeClasses.textSub} border-t border-slate-700`}>
          Last synced: {new Date(status.lastUpdated).toLocaleString()}
        </div>
      )}
    </div>
  );
};

export default ReplenishmentAlerts;
