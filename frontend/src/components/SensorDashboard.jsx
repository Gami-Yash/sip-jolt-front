import React, { useState, useEffect } from 'react';
import { AlertTriangle, Battery, Wifi, WifiOff, Droplets, Package } from 'lucide-react';

const INGREDIENT_ICONS = {
  syrups_left: '🍯',
  syrups_right: '🍯',
  oat: '🌾',
  dairy: '🥛',
  coffee: '☕',
  matcha: '🍵',
  chai: '🍂',
  cocoa: '🍫',
  sugar: '🍬',
  cleaning: '🧹',
  lids: '🥤'
};

const INGREDIENT_LABELS = {
  syrups_left: 'Syrups (L)',
  syrups_right: 'Syrups (R)',
  oat: 'Oat Powder',
  dairy: 'Dairy Powder',
  coffee: 'Coffee',
  matcha: 'Matcha',
  chai: 'Chai',
  cocoa: 'Cocoa',
  sugar: 'Sugar',
  cleaning: 'Cleaning Kit',
  lids: 'Lids & Cups'
};

const SensorDashboard = ({ siteId, compact = false }) => {
  const [bins, setBins] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (siteId) {
      fetchSensorData();
      fetchAlerts();
      const interval = setInterval(() => {
        fetchSensorData();
        fetchAlerts();
      }, 60000);
      return () => clearInterval(interval);
    }
  }, [siteId]);

  const fetchSensorData = async () => {
    try {
      const response = await fetch(`/api/v1.01/sensors/site/${siteId}`);
      if (response.ok) {
        const data = await response.json();
        setBins(data.bins || []);
        setLastUpdated(new Date(data.last_updated));
        setError(null);
      }
    } catch (err) {
      console.error('Failed to fetch sensor data:', err);
      setError('Failed to load sensor data');
    } finally {
      setLoading(false);
    }
  };

  const fetchAlerts = async () => {
    try {
      const response = await fetch(`/api/v1.01/sensors/alerts?site_id=${siteId}&unresolved_only=true`);
      if (response.ok) {
        const data = await response.json();
        setAlerts(data.alerts || []);
      }
    } catch (err) {
      console.error('Failed to fetch alerts:', err);
    }
  };

  const getBinColor = (percentFull) => {
    if (percentFull >= 50) return { bg: 'bg-green-100', bar: 'bg-green-500', text: 'text-green-700' };
    if (percentFull >= 20) return { bg: 'bg-amber-100', bar: 'bg-amber-500', text: 'text-amber-700' };
    return { bg: 'bg-red-100', bar: 'bg-red-500', text: 'text-red-700' };
  };

  const getBatteryColor = (voltage) => {
    if (!voltage) return 'text-gray-400';
    if (voltage >= 3.7) return 'text-green-500';
    if (voltage >= 3.5) return 'text-amber-500';
    return 'text-red-500';
  };

  if (loading) {
    return (
      <div className="p-4 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-sm text-gray-500 mt-2">Loading sensor data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-center">
        <WifiOff className="mx-auto text-red-500 mb-2" size={24} />
        <p className="text-sm text-red-600">{error}</p>
      </div>
    );
  }

  if (bins.length === 0) {
    return (
      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-center">
        <Package className="mx-auto text-gray-400 mb-2" size={24} />
        <p className="text-sm text-gray-500">No sensor data available for this site</p>
        <p className="text-xs text-gray-400 mt-1">Sensors will appear when connected</p>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
          <span className="flex items-center gap-1">
            <Wifi size={12} className="text-green-500" />
            {bins.length} sensors online
          </span>
          <span>{lastUpdated?.toLocaleTimeString()}</span>
        </div>
        
        <div className="grid grid-cols-6 gap-1">
          {bins.map(bin => {
            const colors = getBinColor(bin.percent_full);
            return (
              <div 
                key={bin.bin_id} 
                className={`${colors.bg} p-1 rounded text-center`}
                title={`${INGREDIENT_LABELS[bin.ingredient]}: ${bin.percent_full?.toFixed(0)}%`}
              >
                <span className="text-lg">{INGREDIENT_ICONS[bin.ingredient]}</span>
                <p className={`text-[10px] font-bold ${colors.text}`}>{bin.percent_full?.toFixed(0)}%</p>
              </div>
            );
          })}
        </div>
        
        {alerts.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded p-2 text-xs text-red-700 flex items-center gap-2">
            <AlertTriangle size={14} />
            {alerts.length} low inventory alert{alerts.length > 1 ? 's' : ''}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold">Real-Time Inventory</h2>
          <p className="text-xs text-gray-500">Site {siteId} - 11-Bin System</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Wifi size={14} className="text-green-500" />
          <span>Last update: {lastUpdated?.toLocaleTimeString()}</span>
        </div>
      </div>

      {alerts.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <h3 className="font-bold text-red-800 text-sm flex items-center gap-2 mb-2">
            <AlertTriangle size={16} />
            Active Alerts ({alerts.length})
          </h3>
          <div className="space-y-2">
            {alerts.slice(0, 3).map(alert => (
              <div key={alert.id} className="text-sm text-red-700 flex items-center justify-between">
                <span>
                  Bin {alert.bin_id} ({alert.ingredient}): {alert.percent_full?.toFixed(0)}% - 
                  {alert.estimated_days_remaining} days remaining
                </span>
                <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                  alert.severity === 'critical' ? 'bg-red-600 text-white' : 'bg-amber-500 text-white'
                }`}>
                  {alert.severity?.toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {bins.map(bin => {
          const colors = getBinColor(bin.percent_full);
          return (
            <div key={bin.bin_id} className={`${colors.bg} rounded-xl p-4 border`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl">{INGREDIENT_ICONS[bin.ingredient]}</span>
                <div className="flex items-center gap-1">
                  <Battery size={14} className={getBatteryColor(bin.battery_voltage)} />
                  {bin.status === 'low_battery' && (
                    <span className="text-[10px] text-red-600 font-bold">LOW</span>
                  )}
                </div>
              </div>
              
              <h3 className="font-bold text-sm">{INGREDIENT_LABELS[bin.ingredient]}</h3>
              <p className="text-xs text-gray-500">Bin {bin.bin_id} - Shelf {bin.shelf}</p>
              
              <div className="mt-3 h-2 bg-white rounded-full overflow-hidden">
                <div 
                  className={`h-full ${colors.bar} transition-all duration-500`}
                  style={{ width: `${Math.min(bin.percent_full, 100)}%` }}
                />
              </div>
              
              <div className="flex justify-between mt-2 text-xs">
                <span className={`font-bold ${colors.text}`}>{bin.percent_full?.toFixed(1)}%</span>
                <span className="text-gray-500">{bin.weight_lbs?.toFixed(1)} lbs</span>
              </div>
              
              {bin.percent_full < 20 && (
                <div className="mt-2 bg-red-600 text-white text-[10px] font-bold uppercase px-2 py-1 rounded text-center">
                  Low Inventory
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SensorDashboard;
