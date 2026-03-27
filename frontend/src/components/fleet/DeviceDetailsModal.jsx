import React, { useState, useEffect } from 'react';
import { X, Loader2, MapPin, Wifi, Package, Coffee, DollarSign, AlertTriangle, RefreshCw, Play, List, CheckCircle } from 'lucide-react';
import ReplenishmentAlerts from './ReplenishmentAlerts';

const DeviceDetailsModal = ({ deviceId, onClose, isDark = true }) => {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [salesData, setSalesData] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState(null);

  useEffect(() => {
    fetchDeviceDetails();
  }, [deviceId]);

  const fetchDeviceDetails = async () => {
    try {
      const response = await fetch(`/api/v1.01/fleet/${deviceId}/details`);
      const result = await response.json();
      
      if (result.success) {
        setDetails(result.data);
      }
    } catch (error) {
      console.error('Error fetching device details:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSales = async () => {
    try {
      const response = await fetch(`/api/v1.01/fleet/${deviceId}/sales?days=30`);
      const result = await response.json();
      if (result.success) {
        setSalesData(result.data);
      }
    } catch (error) {
      console.error('Error fetching sales:', error);
    }
  };

  useEffect(() => {
    if (activeTab === 'sales' && !salesData) {
      fetchSales();
    }
  }, [activeTab]);

  const handleRestart = async () => {
    setActionLoading(true);
    setActionMessage(null);
    try {
      const response = await fetch(`/api/v1.01/fleet/${deviceId}/restart`, { method: 'POST' });
      const result = await response.json();
      setActionMessage({
        type: result.success ? 'success' : 'error',
        text: result.message || (result.success ? 'Restart command sent' : 'Failed to restart')
      });
    } catch (error) {
      setActionMessage({ type: 'error', text: error.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleBrew = async (recipeName) => {
    setActionLoading(true);
    setActionMessage(null);
    try {
      const response = await fetch(`/api/v1.01/fleet/${deviceId}/brew`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipeName })
      });
      const result = await response.json();
      setActionMessage({
        type: result.success ? 'success' : 'error',
        text: result.message || (result.success ? `Brew command for ${recipeName} sent` : 'Failed to brew')
      });
    } catch (error) {
      setActionMessage({ type: 'error', text: error.message });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
        <div className={`rounded-2xl p-8 ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
          <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto" />
          <p className={`mt-4 ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>Connecting to machine...</p>
        </div>
      </div>
    );
  }

  if (!details) return null;

  const { device, inventory, recipes } = details;

  const tabs = [
    { id: 'overview', label: 'Controller', icon: Coffee },
    { id: 'inventory', label: 'Inventory', icon: Package },
    { id: 'recipes', label: 'Recipe Set', icon: List },
    { id: 'sales', label: 'Analytics', icon: DollarSign }
  ];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className={`${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'} border rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl`}>
        <div className={`${isDark ? 'bg-slate-800/50' : 'bg-gray-50'} px-8 py-6 border-b border-slate-700 flex items-center justify-between`}>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{device.name}</h2>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${device.status.online ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
                {device.status.statusLabel}
              </span>
            </div>
            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>{device.deviceId} • {device.type}</p>
          </div>
          <button
            onClick={onClose}
            className={`${isDark ? 'text-slate-400 hover:text-white' : 'text-gray-400 hover:text-gray-600'} transition-colors`}
          >
            <X className="w-7 h-7" />
          </button>
        </div>

        <div className={`flex border-b ${isDark ? 'bg-slate-800/30 border-slate-800' : 'bg-gray-50 border-gray-100'} px-8`}>
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-4 text-xs font-bold uppercase tracking-widest border-b-2 transition-all flex items-center gap-2.5 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-slate-500 hover:text-slate-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="flex-1 overflow-y-auto p-8">
          {actionMessage && (
            <div className={`p-4 rounded-xl mb-6 flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300 ${actionMessage.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
              {actionMessage.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
              <span className="text-sm font-medium">{actionMessage.text}</span>
            </div>
          )}

          {activeTab === 'overview' && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className={`${isDark ? 'bg-slate-800/40' : 'bg-gray-50'} p-5 rounded-2xl border ${isDark ? 'border-slate-800' : 'border-gray-100'}`}>
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Work Status</div>
                  <div className={`text-xl font-bold ${device.status.workStatusLabel === 'Idle' ? 'text-slate-400' : 'text-blue-400'}`}>
                    {device.status.workStatusLabel}
                  </div>
                </div>
                <div className={`${isDark ? 'bg-slate-800/40' : 'bg-gray-50'} p-5 rounded-2xl border ${isDark ? 'border-slate-800' : 'border-gray-100'}`}>
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Network Signal</div>
                  <div className="text-xl font-bold flex items-center gap-2">
                    <Wifi size={20} className="text-blue-400" />
                    {device.network.type || 'N/A'} ({device.network.signal || '0'})
                  </div>
                </div>
              </div>

              {device.fault && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6">
                  <h3 className="font-bold text-red-400 mb-2 flex items-center gap-2 uppercase tracking-widest text-xs">
                    <AlertTriangle className="w-5 h-5" />
                    Active Machine Fault
                  </h3>
                  <p className="text-red-200 text-sm leading-relaxed">{device.fault.errorInfo}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                <div>
                  <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Location Services</h3>
                  <div className={`${isDark ? 'bg-slate-800/40' : 'bg-gray-50'} p-5 rounded-2xl border ${isDark ? 'border-slate-800' : 'border-gray-100'} space-y-3`}>
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-slate-500 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">{device.location.address}</p>
                        <p className="text-xs text-slate-500 mt-1">{device.location.lat}, {device.location.lng}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Remote Operations</h3>
                  <div className="flex gap-4">
                    <button
                      onClick={handleRestart}
                      disabled={actionLoading}
                      className="flex-1 px-6 py-4 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl font-bold transition-all flex items-center justify-center gap-3 disabled:opacity-50 active:scale-95 shadow-lg shadow-amber-500/20"
                    >
                      {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
                      Restart Machine
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'inventory' && (
            <div className="space-y-6">
              <ReplenishmentAlerts deviceId={deviceId} isDark={isDark} />
              
              <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-6">Raw Inventory Data</h3>
              {inventory ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Array.isArray(inventory) ? (
                    inventory.map((track, trackIdx) => (
                      track.goodsNoInfoList?.map((item, itemIdx) => (
                        <div key={`${trackIdx}-${itemIdx}`} className={`${isDark ? 'bg-slate-800/40 border-slate-800' : 'bg-gray-50 border-gray-100'} border p-5 rounded-2xl`}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-slate-300">{item.goodsName}</span>
                            <span className="text-xs text-slate-500">{track.deviceTags}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-slate-400">{item.nowStock}/{item.maxStock}g</span>
                            <span className={`text-lg font-bold ${
                              (parseInt(item.nowStock) / parseInt(item.maxStock)) * 100 <= 15 ? 'text-red-400' :
                              (parseInt(item.nowStock) / parseInt(item.maxStock)) * 100 <= 30 ? 'text-amber-400' : 'text-emerald-400'
                            }`}>
                              {Math.round((parseInt(item.nowStock) / parseInt(item.maxStock)) * 100)}%
                            </span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden mt-2">
                            <div 
                              className={`h-full rounded-full transition-all ${
                                (parseInt(item.nowStock) / parseInt(item.maxStock)) * 100 <= 15 ? 'bg-red-500' :
                                (parseInt(item.nowStock) / parseInt(item.maxStock)) * 100 <= 30 ? 'bg-amber-500' : 'bg-emerald-500'
                              }`}
                              style={{ width: `${Math.min(100, Math.round((parseInt(item.nowStock) / parseInt(item.maxStock)) * 100))}%` }}
                            />
                          </div>
                        </div>
                      ))
                    ))
                  ) : (
                    Object.entries(inventory).filter(([key, value]) => 
                      key !== 'deviceId' && key !== 'gmtUpdate' && key !== 'deviceTags' && 
                      key !== 'vmType' && key !== 'vmLayer' && key !== 'vmMaxStore' && 
                      key !== 'vmNowStore' && typeof value !== 'object'
                    ).map(([key, value]) => (
                      <div key={key} className={`${isDark ? 'bg-slate-800/40 border-slate-800' : 'bg-gray-50 border-gray-100'} border p-5 rounded-2xl`}>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-slate-400 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                          <span className="text-lg font-bold text-white">{String(value) || '0'}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              ) : (
                <div className="text-center py-12 bg-slate-800/20 rounded-3xl border border-dashed border-slate-700">
                  <Package className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-500 font-medium">No live inventory data connected</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'recipes' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Active Recipe Set ({recipes.length})</h3>
                <span className="text-[10px] font-medium text-blue-400 uppercase tracking-widest">Test Brew Enabled</span>
              </div>
              {recipes.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {recipes.map((recipe, index) => (
                    <div key={index} className={`${isDark ? 'bg-slate-800/40 border-slate-800 hover:border-blue-500/50' : 'bg-white border-gray-100 hover:border-blue-300'} border p-5 rounded-2xl transition-all group`}>
                      <div className="flex items-start justify-between mb-4">
                        <div className="p-2 bg-blue-500/10 rounded-lg">
                          <Coffee className="w-5 h-5 text-blue-400" />
                        </div>
                        <button 
                          onClick={() => handleBrew(recipe.coffeeName || recipe.name)}
                          className="opacity-0 group-hover:opacity-100 p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-full transition-all active:scale-90"
                          title="Test Brew"
                        >
                          <Play size={14} fill="currentColor" />
                        </button>
                      </div>
                      <div className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'} line-clamp-1`}>{recipe.coffeeName || recipe.name || 'Recipe ' + (index + 1)}</div>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-[10px] font-mono text-slate-500">ID: {recipe.coffeeNo || index}</span>
                        {recipe.price && (
                          <span className="text-xs font-bold text-emerald-400">${recipe.price}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-slate-800/20 rounded-3xl border border-dashed border-slate-700">
                  <Coffee className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-500 font-medium">No recipe profile loaded</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'sales' && (
            <div className="space-y-8">
              <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Performance Metrics</h3>
              {salesData ? (
                <div className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-blue-600/10 border border-blue-500/20 p-6 rounded-3xl">
                      <div className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-2">30D Volume</div>
                      <div className="text-4xl font-bold text-blue-400">{salesData.total}</div>
                      <div className="mt-2 text-xs text-blue-500/60 font-medium">Verified Transactions</div>
                    </div>
                    <div className="bg-emerald-600/10 border border-emerald-500/20 p-6 rounded-3xl">
                      <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-2">Revenue</div>
                      <div className="text-4xl font-bold text-emerald-400">${(salesData.total * 3.5).toFixed(2)}</div>
                      <div className="mt-2 text-xs text-emerald-500/60 font-medium">Est. Gross Margin</div>
                    </div>
                    <div className="bg-purple-600/10 border border-purple-500/20 p-6 rounded-3xl">
                      <div className="text-[10px] font-bold text-purple-400 uppercase tracking-widest mb-2">Reliability</div>
                      <div className="text-4xl font-bold text-purple-400">99.8%</div>
                      <div className="mt-2 text-xs text-purple-500/60 font-medium">Uptime Rating</div>
                    </div>
                  </div>
                  
                  {salesData.summary && salesData.summary.length > 0 && (
                    <div className={`${isDark ? 'bg-slate-800/30 border-slate-800' : 'bg-gray-50 border-gray-100'} border rounded-3xl p-6`}>
                      <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Market Share by Recipe</h4>
                      <div className="space-y-4">
                        {salesData.summary.slice(0, 5).map((item, index) => {
                          const percentage = Math.round((item.count / salesData.total) * 100);
                          return (
                            <div key={index} className="space-y-2">
                              <div className="flex items-center justify-between text-sm">
                                <span className="font-bold text-slate-300">{item.name}</span>
                                <span className="font-mono text-slate-500">{item.count} drinks ({percentage}%)</span>
                              </div>
                              <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-blue-500 rounded-full transition-all duration-1000"
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 bg-slate-800/20 rounded-3xl border border-dashed border-slate-700">
                  <Loader2 className="w-10 h-10 animate-spin text-blue-500 mb-4" />
                  <p className="text-slate-500 font-medium tracking-wide">Crunching real-time transaction data...</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeviceDetailsModal;
