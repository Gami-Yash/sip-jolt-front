import React, { useState, useEffect } from 'react';
import { RefreshCw, Map, List, Loader2, AlertTriangle } from 'lucide-react';
import DeviceCard from '../components/fleet/DeviceCard';
import DeviceDetailsModal from '../components/fleet/DeviceDetailsModal';
import FleetStats from '../components/fleet/FleetStats';

const FleetDashboard = ({ isDark = true }) => {
  const [fleetData, setFleetData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [viewMode, setViewMode] = useState('list');
  const [filterStatus, setFilterStatus] = useState('all');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  const themeClasses = isDark 
    ? {
        container: "h-full flex flex-col bg-slate-900 text-white",
        header: "bg-slate-900 border-slate-800 border-b px-6 py-4",
        textMain: "text-white",
        textSub: "text-slate-400",
        buttonInactive: "bg-slate-800 text-slate-400 hover:bg-slate-700",
        content: "flex-1 overflow-y-auto p-6 bg-slate-900/50",
        statsContainer: "bg-slate-800/50 border-slate-700"
      }
    : {
        container: "h-full flex flex-col bg-gray-50 text-gray-900",
        header: "bg-white border-b px-6 py-4",
        textMain: "text-gray-900",
        textSub: "text-gray-500",
        buttonInactive: "bg-gray-100 text-gray-700 hover:bg-gray-200",
        content: "flex-1 overflow-y-auto p-6 bg-gray-50",
        statsContainer: ""
      };

  const fetchFleetData = async () => {
    try {
      const response = await fetch('/api/v1.01/fleet/dashboard');
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch fleet data');
      }
      
      setFleetData(result.data);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      console.error('Fleet fetch error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFleetData();

    let interval;
    if (autoRefresh) {
      interval = setInterval(fetchFleetData, 60000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  const getFilteredDevices = () => {
    if (!fleetData) return [];
    
    switch (filterStatus) {
      case 'online':
        return fleetData.devices.filter(d => d.status.online && !d.fault);
      case 'faulted':
        return fleetData.devices.filter(d => d.fault !== null);
      case 'offline':
        return fleetData.devices.filter(d => !d.status.online && !d.fault);
      default:
        return fleetData.devices;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto" />
          <p className={`mt-4 ${themeClasses.textSub}`}>Loading fleet data from Yile API...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto" />
          <p className={`mt-4 ${themeClasses.textSub}`}>{error}</p>
          <button
            onClick={fetchFleetData}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const filteredDevices = getFilteredDevices();

  return (
    <div className={themeClasses.container}>
      <div className={themeClasses.header}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className={`text-2xl font-bold ${themeClasses.textMain}`}>Fleet Overview</h1>
            <p className={`text-sm ${themeClasses.textSub} mt-1`}>
              Live machine status • Last updated: {lastUpdated?.toLocaleTimeString() || 'Never'}
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded bg-slate-800 border-slate-700"
              />
              <span className={`text-sm ${themeClasses.textSub}`}>Auto-refresh (60s)</span>
            </label>

            <button
              onClick={fetchFleetData}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2 text-sm font-medium"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>

        <div className="mt-6">
          <FleetStats data={fleetData} isDark={isDark} />
        </div>

        <div className="flex space-x-2 mt-6">
          {['all', 'online', 'faulted', 'offline'].map(status => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 rounded-lg capitalize transition text-sm font-medium ${
                filterStatus === status
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                  : themeClasses.buttonInactive
              }`}
            >
              {status} ({
                status === 'all' ? fleetData.devices.length :
                status === 'online' ? fleetData.online :
                status === 'faulted' ? fleetData.faulted :
                fleetData.offline
              })
            </button>
          ))}
        </div>
      </div>

      <div className={themeClasses.content}>
        {filteredDevices.length === 0 ? (
          <div className={`text-center py-12 ${themeClasses.textSub}`}>
            No devices found matching the filter criteria
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDevices.map(device => (
              <DeviceCard
                key={device.deviceId}
                device={device}
                isDark={isDark}
                onClick={() => setSelectedDevice(device.deviceId)}
              />
            ))}
          </div>
        )}
      </div>

      {selectedDevice && (
        <DeviceDetailsModal
          deviceId={selectedDevice}
          isDark={isDark}
          onClose={() => setSelectedDevice(null)}
        />
      )}
    </div>
  );
};

export default FleetDashboard;
