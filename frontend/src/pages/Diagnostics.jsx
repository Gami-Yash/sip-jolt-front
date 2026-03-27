import React, { useState, useEffect } from 'react';
import { Activity, Database, Server, CheckCircle, XCircle, Loader2, RefreshCw, Zap } from 'lucide-react';

const Diagnostics = ({ isDark = true }) => {
  const [status, setStatus] = useState({
    yileApi: { status: 'unknown', lastCheck: null },
    database: { status: 'unknown', lastCheck: null },
    lastCalls: []
  });
  const [testing, setTesting] = useState({});
  const [testResults, setTestResults] = useState({});

  const themeClasses = isDark
    ? { bg: 'bg-slate-900', card: 'bg-slate-800 border-slate-700', text: 'text-white', sub: 'text-slate-400' }
    : { bg: 'bg-gray-50', card: 'bg-white border-gray-200', text: 'text-gray-900', sub: 'text-gray-500' };

  useEffect(() => {
    checkAllStatus();
    const interval = setInterval(checkAllStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const checkAllStatus = async () => {
    try {
      const response = await fetch('/api/v1.01/fleet/dashboard');
      const yileOk = response.ok;
      
      setStatus(prev => ({
        ...prev,
        yileApi: { status: yileOk ? 'healthy' : 'error', lastCheck: new Date().toISOString() }
      }));
    } catch (error) {
      setStatus(prev => ({
        ...prev,
        yileApi: { status: 'error', lastCheck: new Date().toISOString(), error: error.message }
      }));
    }

    try {
      const response = await fetch('/api/v1.01/replenishment/alerts');
      const dbOk = response.ok;
      
      setStatus(prev => ({
        ...prev,
        database: { status: dbOk ? 'healthy' : 'error', lastCheck: new Date().toISOString() }
      }));
    } catch (error) {
      setStatus(prev => ({
        ...prev,
        database: { status: 'error', lastCheck: new Date().toISOString(), error: error.message }
      }));
    }
  };

  const runTest = async (testName, testFn) => {
    setTesting(prev => ({ ...prev, [testName]: true }));
    setTestResults(prev => ({ ...prev, [testName]: null }));
    
    const startTime = Date.now();
    try {
      const result = await testFn();
      const duration = Date.now() - startTime;
      setTestResults(prev => ({
        ...prev,
        [testName]: { success: true, duration, data: result }
      }));
    } catch (error) {
      const duration = Date.now() - startTime;
      setTestResults(prev => ({
        ...prev,
        [testName]: { success: false, duration, error: error.message }
      }));
    } finally {
      setTesting(prev => ({ ...prev, [testName]: false }));
    }
  };

  const tests = [
    {
      name: 'yileToken',
      label: 'Test Yile Token',
      icon: Zap,
      fn: async () => {
        const res = await fetch('/api/v1.01/fleet/dashboard');
        if (!res.ok) throw new Error('Token test failed');
        return 'Token valid';
      }
    },
    {
      name: 'deviceList',
      label: 'Test Device List',
      icon: Server,
      fn: async () => {
        const res = await fetch('/api/v1.01/remote/devices');
        const data = await res.json();
        if (!data.success) throw new Error(data.error);
        return `Found ${data.data.length} devices`;
      }
    },
    {
      name: 'inventory',
      label: 'Test Inventory Fetch',
      icon: Database,
      fn: async () => {
        const res = await fetch('/api/v1.01/replenishment/status/00000020868');
        const data = await res.json();
        if (!data.success) throw new Error(data.error);
        return `${data.data.ingredients.length} ingredients`;
      }
    },
    {
      name: 'sales',
      label: 'Test Sales Query',
      icon: Activity,
      fn: async () => {
        const res = await fetch('/api/v1.01/fleet/00000020868/sales?days=7');
        const data = await res.json();
        return data.success ? 'Sales data retrieved' : 'No sales data';
      }
    }
  ];

  const StatusBadge = ({ status }) => {
    const colors = {
      healthy: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      error: 'bg-red-500/20 text-red-400 border-red-500/30',
      unknown: 'bg-slate-500/20 text-slate-400 border-slate-500/30'
    };
    
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase border ${colors[status] || colors.unknown}`}>
        {status}
      </span>
    );
  };

  return (
    <div className={`min-h-screen ${themeClasses.bg} p-4 md:p-8`}>
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Activity className="w-8 h-8 text-blue-500" />
            <h1 className={`text-2xl font-bold ${themeClasses.text}`}>Diagnostics</h1>
          </div>
          <button
            onClick={checkAllStatus}
            className="p-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className={`rounded-xl border p-6 ${themeClasses.card}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Server className="w-5 h-5 text-blue-500" />
                <span className={`font-semibold ${themeClasses.text}`}>Yile API</span>
              </div>
              <StatusBadge status={status.yileApi.status} />
            </div>
            {status.yileApi.lastCheck && (
              <p className={`text-xs ${themeClasses.sub}`}>
                Last checked: {new Date(status.yileApi.lastCheck).toLocaleTimeString()}
              </p>
            )}
          </div>

          <div className={`rounded-xl border p-6 ${themeClasses.card}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-emerald-500" />
                <span className={`font-semibold ${themeClasses.text}`}>Database</span>
              </div>
              <StatusBadge status={status.database.status} />
            </div>
            {status.database.lastCheck && (
              <p className={`text-xs ${themeClasses.sub}`}>
                Last checked: {new Date(status.database.lastCheck).toLocaleTimeString()}
              </p>
            )}
          </div>
        </div>

        <div className={`rounded-xl border p-6 ${themeClasses.card}`}>
          <h2 className={`text-sm font-semibold uppercase tracking-wider ${themeClasses.sub} mb-4`}>
            Quick Tests
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {tests.map(test => {
              const Icon = test.icon;
              const result = testResults[test.name];
              const isLoading = testing[test.name];
              
              return (
                <button
                  key={test.name}
                  onClick={() => runTest(test.name, test.fn)}
                  disabled={isLoading}
                  className={`p-4 rounded-lg border ${themeClasses.card} hover:border-blue-500/50 transition-all text-left`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4 text-blue-500" />
                      <span className={`font-medium text-sm ${themeClasses.text}`}>{test.label}</span>
                    </div>
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                    ) : result ? (
                      result.success ? (
                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-500" />
                      )
                    ) : null}
                  </div>
                  
                  {result && (
                    <div className={`text-xs ${result.success ? 'text-emerald-400' : 'text-red-400'}`}>
                      {result.success ? result.data : result.error}
                      <span className={themeClasses.sub}> ({result.duration}ms)</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className={`rounded-xl border p-6 ${themeClasses.card} mt-6`}>
          <h2 className={`text-sm font-semibold uppercase tracking-wider ${themeClasses.sub} mb-4`}>
            System Info
          </h2>
          <div className={`text-sm ${themeClasses.sub} space-y-2`}>
            <div className="flex justify-between">
              <span>Version</span>
              <span className={themeClasses.text}>SIPJOLT v1.01</span>
            </div>
            <div className="flex justify-between">
              <span>Environment</span>
              <span className={themeClasses.text}>{import.meta.env.MODE || 'development'}</span>
            </div>
            <div className="flex justify-between">
              <span>Build Time</span>
              <span className={themeClasses.text}>{new Date().toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Diagnostics;
