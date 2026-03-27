import React from 'react';
import { Droplets, Coffee, Package, AlertTriangle } from 'lucide-react';

const IngredientBinGauge = ({ 
  name, 
  currentGrams, 
  maxGrams, 
  dailyUsage = 0,
  containerType = 'bag',
  isDark = true 
}) => {
  const percentage = maxGrams > 0 ? Math.round((currentGrams / maxGrams) * 100) : 0;
  const daysRemaining = dailyUsage > 0 ? Math.floor(currentGrams / dailyUsage) : null;
  
  const getColor = (pct) => {
    if (pct > 50) return { bg: 'bg-emerald-500', text: 'text-emerald-400', border: 'border-emerald-500/30' };
    if (pct >= 20) return { bg: 'bg-amber-500', text: 'text-amber-400', border: 'border-amber-500/30' };
    return { bg: 'bg-red-500', text: 'text-red-400', border: 'border-red-500/30' };
  };
  
  const colors = getColor(percentage);
  
  const getIcon = () => {
    if (name.toLowerCase().includes('milk') || name.toLowerCase().includes('syrup') || name.toLowerCase().includes('water')) {
      return <Droplets className="w-5 h-5" />;
    }
    if (name.toLowerCase().includes('coffee') || name.toLowerCase().includes('bean')) {
      return <Coffee className="w-5 h-5" />;
    }
    return <Package className="w-5 h-5" />;
  };
  
  const getRefillInstruction = () => {
    if (percentage > 50) return null;
    const containersNeeded = Math.ceil((maxGrams * 0.9 - currentGrams) / 1000);
    if (percentage < 20) {
      return `URGENT: Add ${containersNeeded} ${containerType}(s) immediately`;
    }
    return `Refill soon: ${containersNeeded} ${containerType}(s) needed`;
  };
  
  const refillInstruction = getRefillInstruction();
  
  const themeClasses = isDark
    ? { card: 'bg-slate-800/60 border-slate-700', text: 'text-white', sub: 'text-slate-400' }
    : { card: 'bg-white border-gray-200', text: 'text-gray-900', sub: 'text-gray-500' };

  return (
    <div className={`rounded-xl border p-4 ${themeClasses.card} ${colors.border} flex flex-col items-center`}>
      <div className={`flex items-center gap-2 mb-3 ${colors.text}`}>
        {getIcon()}
        <span className={`font-semibold text-sm ${themeClasses.text}`}>{name}</span>
      </div>
      
      <div className="relative w-16 h-32 bg-slate-900/50 rounded-lg border border-slate-600 overflow-hidden mb-3">
        <div className="absolute inset-x-0 bottom-0 w-full h-2 bg-slate-700 rounded-b-lg" />
        
        <div 
          className={`absolute inset-x-1 bottom-1 ${colors.bg} rounded-md transition-all duration-1000 ease-out`}
          style={{ 
            height: `${Math.max(2, percentage)}%`,
            animation: 'fillUp 1s ease-out'
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/20 rounded-md" />
          <div className="absolute top-1 left-1 right-1 h-1 bg-white/30 rounded-full" />
        </div>
        
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-lg font-bold ${themeClasses.text} drop-shadow-lg`}>
            {percentage}%
          </span>
        </div>
      </div>
      
      <div className="text-center space-y-1 w-full">
        <div className={`text-xs ${themeClasses.sub}`}>
          {currentGrams.toLocaleString()}g / {maxGrams.toLocaleString()}g
        </div>
        
        {daysRemaining !== null && (
          <div className={`text-xs font-medium ${daysRemaining <= 3 ? 'text-red-400' : daysRemaining <= 7 ? 'text-amber-400' : 'text-emerald-400'}`}>
            ~{daysRemaining} days remaining
          </div>
        )}
        
        {refillInstruction && (
          <div className={`text-xs mt-2 px-2 py-1 rounded ${percentage < 20 ? 'bg-red-500/20 text-red-300' : 'bg-amber-500/20 text-amber-300'} flex items-center gap-1 justify-center`}>
            <AlertTriangle className="w-3 h-3" />
            <span className="truncate">{refillInstruction}</span>
          </div>
        )}
      </div>
      
      <style>{`
        @keyframes fillUp {
          from { height: 0%; }
          to { height: ${Math.max(2, percentage)}%; }
        }
      `}</style>
    </div>
  );
};

export default IngredientBinGauge;
