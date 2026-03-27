import React, { useState, useEffect } from 'react';
import { Gamepad2, Coffee, RefreshCw, DollarSign, Loader2, CheckCircle, XCircle, Wifi } from 'lucide-react';

const RemoteControl = ({ isDark = true }) => {
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [recipes, setRecipes] = useState([]);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [loading, setLoading] = useState({ devices: true, recipes: false, action: false });
  const [actionResult, setActionResult] = useState(null);
  const [pollInterval, setPollInterval] = useState(null);

  const themeClasses = isDark
    ? { bg: 'bg-slate-900', card: 'bg-slate-800 border-slate-700', text: 'text-white', sub: 'text-slate-400', input: 'bg-slate-700 border-slate-600 text-white' }
    : { bg: 'bg-gray-50', card: 'bg-white border-gray-200', text: 'text-gray-900', sub: 'text-gray-500', input: 'bg-white border-gray-300 text-gray-900' };

  useEffect(() => {
    fetchDevices();
    return () => { if (pollInterval) clearInterval(pollInterval); };
  }, []);

  useEffect(() => {
    if (selectedDevice) {
      fetchRecipes(selectedDevice);
    }
  }, [selectedDevice]);

  const fetchDevices = async () => {
    try {
      const response = await fetch('/api/v1.01/remote/devices');
      const result = await response.json();
      if (result.success) {
        setDevices(result.data);
        if (result.data.length > 0) {
          setSelectedDevice(result.data[0].deviceId);
        }
      }
    } catch (error) {
      console.error('Failed to fetch devices:', error);
    } finally {
      setLoading(prev => ({ ...prev, devices: false }));
    }
  };

  const fetchRecipes = async (deviceId) => {
    setLoading(prev => ({ ...prev, recipes: true }));
    try {
      const response = await fetch(`/api/v1.01/remote/recipes/${deviceId}`);
      const result = await response.json();
      if (result.success) {
        setRecipes(result.data);
        if (result.data.length > 0) {
          setSelectedRecipe(result.data[0].id);
        }
      }
    } catch (error) {
      console.error('Failed to fetch recipes:', error);
    } finally {
      setLoading(prev => ({ ...prev, recipes: false }));
    }
  };

  const pollForResult = (pushId) => {
    let attempts = 0;
    const maxAttempts = 10;
    
    const interval = setInterval(async () => {
      attempts++;
      try {
        const response = await fetch(`/api/v1.01/remote/result/${pushId}`);
        const result = await response.json();
        
        if (result.data?.completed || attempts >= maxAttempts) {
          clearInterval(interval);
          setPollInterval(null);
          setLoading(prev => ({ ...prev, action: false }));
          setActionResult({
            success: result.data?.completed,
            message: result.data?.completed ? 'Operation completed successfully!' : 'Operation timed out or failed'
          });
        }
      } catch (error) {
        console.error('Poll error:', error);
      }
    }, 3000);
    
    setPollInterval(interval);
  };

  const handleBrew = async () => {
    if (!selectedDevice || !selectedRecipe) return;
    
    setLoading(prev => ({ ...prev, action: true }));
    setActionResult(null);
    
    try {
      const response = await fetch('/api/v1.01/remote/brew', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId: selectedDevice, recipeId: selectedRecipe })
      });
      const result = await response.json();
      
      if (result.success && result.data?.pushId) {
        setActionResult({ success: true, message: 'Brew command sent! Waiting for result...' });
        pollForResult(result.data.pushId);
      } else {
        setLoading(prev => ({ ...prev, action: false }));
        setActionResult({ success: false, message: result.error || 'Failed to send brew command' });
      }
    } catch (error) {
      setLoading(prev => ({ ...prev, action: false }));
      setActionResult({ success: false, message: error.message });
    }
  };

  const handleRestart = async () => {
    if (!selectedDevice) return;
    
    setLoading(prev => ({ ...prev, action: true }));
    setActionResult(null);
    
    try {
      const response = await fetch('/api/v1.01/remote/restart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId: selectedDevice })
      });
      const result = await response.json();
      
      setActionResult({
        success: result.success,
        message: result.success ? 'Restart command sent!' : result.error
      });
    } catch (error) {
      setActionResult({ success: false, message: error.message });
    } finally {
      setLoading(prev => ({ ...prev, action: false }));
    }
  };

  const selectedDeviceInfo = devices.find(d => d.deviceId === selectedDevice);

  return (
    <div className={`min-h-screen ${themeClasses.bg} p-4 md:p-8`}>
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Gamepad2 className="w-8 h-8 text-blue-500" />
          <h1 className={`text-2xl font-bold ${themeClasses.text}`}>Remote Control</h1>
        </div>

        <div className={`rounded-xl border p-6 ${themeClasses.card} mb-6`}>
          <h2 className={`text-sm font-semibold uppercase tracking-wider ${themeClasses.sub} mb-4`}>
            Select Device
          </h2>
          
          {loading.devices ? (
            <div className="flex items-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
              <span className={themeClasses.sub}>Loading devices...</span>
            </div>
          ) : (
            <select
              value={selectedDevice || ''}
              onChange={(e) => setSelectedDevice(e.target.value)}
              className={`w-full p-3 rounded-lg border ${themeClasses.input} focus:ring-2 focus:ring-blue-500 outline-none`}
            >
              {devices.map(device => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.name} ({device.deviceId}) {device.online ? '🟢' : '🔴'}
                </option>
              ))}
            </select>
          )}

          {selectedDeviceInfo && (
            <div className={`mt-3 flex items-center gap-2 text-sm ${themeClasses.sub}`}>
              <Wifi className={`w-4 h-4 ${selectedDeviceInfo.online ? 'text-emerald-500' : 'text-red-500'}`} />
              <span>{selectedDeviceInfo.online ? 'Online' : 'Offline'}</span>
            </div>
          )}
        </div>

        <div className={`rounded-xl border p-6 ${themeClasses.card} mb-6`}>
          <h2 className={`text-sm font-semibold uppercase tracking-wider ${themeClasses.sub} mb-4`}>
            Brew Coffee
          </h2>
          
          {loading.recipes ? (
            <div className="flex items-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
              <span className={themeClasses.sub}>Loading recipes...</span>
            </div>
          ) : (
            <>
              <select
                value={selectedRecipe || ''}
                onChange={(e) => setSelectedRecipe(e.target.value)}
                className={`w-full p-3 rounded-lg border ${themeClasses.input} focus:ring-2 focus:ring-blue-500 outline-none mb-4`}
              >
                {recipes.map(recipe => (
                  <option key={recipe.id} value={recipe.id}>
                    {recipe.name} {recipe.price ? `($${recipe.price})` : ''}
                  </option>
                ))}
              </select>
              
              <button
                onClick={handleBrew}
                disabled={loading.action || !selectedDevice || !selectedRecipe}
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                {loading.action ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Coffee className="w-5 h-5" />
                )}
                {loading.action ? 'Brewing...' : 'Start Brew'}
              </button>
            </>
          )}
        </div>

        <div className={`rounded-xl border p-6 ${themeClasses.card} mb-6`}>
          <h2 className={`text-sm font-semibold uppercase tracking-wider ${themeClasses.sub} mb-4`}>
            Machine Control
          </h2>
          
          <button
            onClick={handleRestart}
            disabled={loading.action || !selectedDevice}
            className="w-full py-3 px-4 bg-amber-600 hover:bg-amber-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors"
          >
            {loading.action ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <RefreshCw className="w-5 h-5" />
            )}
            Restart Machine
          </button>
        </div>

        {actionResult && (
          <div className={`rounded-xl border p-4 ${actionResult.success ? 'bg-emerald-500/20 border-emerald-500/30' : 'bg-red-500/20 border-red-500/30'} flex items-center gap-3`}>
            {actionResult.success ? (
              <CheckCircle className="w-6 h-6 text-emerald-400" />
            ) : (
              <XCircle className="w-6 h-6 text-red-400" />
            )}
            <span className={actionResult.success ? 'text-emerald-300' : 'text-red-300'}>
              {actionResult.message}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default RemoteControl;
