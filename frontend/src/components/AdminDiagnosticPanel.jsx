/**
 * SIPJOLT OS - Admin/Diagnostic Panel
 * Priority 1: Complete diagnostic suite for Yile integration
 */

import React, { useState, useEffect } from 'react';

export default function AdminDiagnosticPanel({ siteId = 2, onClose }) {
  const [activeTab, setActiveTab] = useState('health');
  const [tokenInfo, setTokenInfo] = useState(null);
  const [healthStatus, setHealthStatus] = useState({});
  const [rateLimit, setRateLimit] = useState(null);
  const [cache, setCache] = useState(null);
  const [auditLog, setAuditLog] = useState([]);
  const [testResults, setTestResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getAuthHeaders = () => ({
    'x-user-id': localStorage.getItem('userId') || '1',
    'x-user-role': localStorage.getItem('userRole') || 'OPS_MANAGER',
    'x-tenant-id': localStorage.getItem('tenantId') || '',
  });

  // API Health Check
  const runHealthCheck = async () => {
    setLoading(true);
    setError(null);
    const results = {};

    const endpoints = [
      { name: 'Mission Panel', path: `/api/v1.01/yile-tech/sites/${siteId}/mission-panel`, method: 'GET' },
      { name: 'Refresh Status', path: `/api/v1.01/yile-tech/sites/${siteId}/refresh-status`, method: 'POST' },
      { name: 'Available Recipes', path: `/api/v1.01/yile-tech/sites/${siteId}/available-recipes`, method: 'GET' },
    ];

    for (const endpoint of endpoints) {
      const startTime = Date.now();
      try {
        const response = await fetch(endpoint.path, {
          method: endpoint.method,
          headers: getAuthHeaders(),
        });
        const data = await response.json();
        
        results[endpoint.name] = {
          status: data.success ? 'healthy' : 'degraded',
          responseTime: Date.now() - startTime,
          message: data.success ? 'OK' : data.error,
        };
      } catch (err) {
        results[endpoint.name] = {
          status: 'down',
          responseTime: null,
          message: err.message,
        };
      }
    }

    setHealthStatus(results);
    setLoading(false);
  };

  // Get Token Info
  const fetchTokenInfo = async () => {
    try {
      const response = await fetch('/api/v1.01/yile-admin/token/status', {
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      if (data.success) {
        setTokenInfo(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch token info:', err);
    }
  };

  // Force Token Refresh
  const forceTokenRefresh = async () => {
    if (!confirm('Force token refresh? This will invalidate the current token.')) return;

    setLoading(true);
    try {
      const response = await fetch('/api/v1.01/yile-admin/token/refresh', {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      const data = await response.json();

      if (data.success) {
        alert('Token refreshed successfully');
        await fetchTokenInfo();
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Token refresh failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Get Rate Limit Status
  const fetchRateLimit = async () => {
    try {
      const response = await fetch('/api/v1.01/yile-admin/rate-limit', {
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      if (data.success) {
        setRateLimit(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch rate limit:', err);
    }
  };

  // Get Cache Status
  const fetchCache = async () => {
    try {
      const response = await fetch('/api/v1.01/yile-admin/cache/status', {
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      if (data.success) {
        setCache(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch cache:', err);
    }
  };

  // Clear Cache
  const clearCache = async (type) => {
    if (!confirm(`Clear ${type} cache? Machine will query Yile API on next request.`)) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/v1.01/yile-admin/cache/${type}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      const data = await response.json();

      if (data.success) {
        alert(`${type} cache cleared`);
        await fetchCache();
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Cache clear failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Soft Reset
  const softReset = async () => {
    if (!confirm('Soft Reset: Clear cache + force token refresh. Continue?')) return;

    setLoading(true);
    try {
      const response = await fetch('/api/v1.01/yile-admin/soft-reset', {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      const data = await response.json();

      if (data.success) {
        alert('Soft reset complete');
        await runHealthCheck();
        await fetchTokenInfo();
        await fetchCache();
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Soft reset failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Hard Reset
  const hardReset = async () => {
    if (!confirm('Hard Reset: Delete token + clear cache + force new token. This is aggressive. Continue?')) return;

    setLoading(true);
    try {
      const response = await fetch('/api/v1.01/yile-admin/hard-reset', {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      const data = await response.json();

      if (data.success) {
        alert('Hard reset complete. Integration restarted.');
        await runHealthCheck();
        await fetchTokenInfo();
        await fetchCache();
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Hard reset failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Run Full API Test Suite
  const runFullTest = async () => {
    setLoading(true);
    setTestResults(null);
    
    const results = {
      startTime: new Date().toISOString(),
      tests: [],
      summary: { passed: 0, failed: 0 },
    };

    const tests = [
      { name: 'Get Device Info', endpoint: 'refresh-status', method: 'POST' },
      { name: 'Get Recipes', endpoint: 'available-recipes', method: 'GET' },
      { name: 'Get Mission Panel', endpoint: 'mission-panel', method: 'GET' },
    ];

    for (const test of tests) {
      const startTime = Date.now();
      try {
        const response = await fetch(`/api/v1.01/yile-tech/sites/${siteId}/${test.endpoint}`, {
          method: test.method,
          headers: getAuthHeaders(),
        });
        const data = await response.json();
        const duration = Date.now() - startTime;

        if (data.success) {
          results.tests.push({
            name: test.name,
            status: 'PASS',
            duration: `${duration}ms`,
            message: 'OK',
          });
          results.summary.passed++;
        } else {
          results.tests.push({
            name: test.name,
            status: 'FAIL',
            duration: `${duration}ms`,
            message: data.error,
          });
          results.summary.failed++;
        }
      } catch (err) {
        results.tests.push({
          name: test.name,
          status: 'ERROR',
          duration: 'N/A',
          message: err.message,
        });
        results.summary.failed++;
      }
    }

    results.endTime = new Date().toISOString();
    setTestResults(results);
    setLoading(false);
  };

  // Fetch Audit Log
  const fetchAuditLog = async () => {
    try {
      const response = await fetch('/api/v1.01/yile-admin/audit-log', {
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      if (data.success) {
        setAuditLog(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch audit log:', err);
    }
  };

  useEffect(() => {
    runHealthCheck();
    fetchTokenInfo();
    fetchRateLimit();
    fetchCache();
    fetchAuditLog();

    const interval = setInterval(() => {
      fetchRateLimit();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>🎖️ Admin Diagnostic Panel</h2>
        <div style={styles.headerRight}>
          <div style={styles.badge}>Site {siteId}</div>
          {onClose && (
            <button onClick={onClose} style={styles.closeButton}>✕ Close</button>
          )}
        </div>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      {/* Tabs */}
      <div style={styles.tabs}>
        {['health', 'token', 'ratelimit', 'cache', 'reset', 'test', 'audit'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              ...styles.tab,
              ...(activeTab === tab ? styles.tabActive : {}),
            }}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div style={styles.content}>
        {activeTab === 'health' && (
          <div>
            <div style={styles.sectionHeader}>
              <h3>API Health Check</h3>
              <button onClick={runHealthCheck} style={styles.button} disabled={loading}>
                🔄 Refresh
              </button>
            </div>
            <div style={styles.healthGrid}>
              {Object.entries(healthStatus).map(([name, status]) => (
                <div key={name} style={styles.healthCard}>
                  <div style={styles.healthName}>{name}</div>
                  <div style={{
                    ...styles.healthStatus,
                    ...(status.status === 'healthy' ? styles.healthy : status.status === 'degraded' ? styles.degraded : styles.down),
                  }}>
                    {status.status.toUpperCase()}
                  </div>
                  {status.responseTime && <div style={styles.healthTime}>{status.responseTime}ms</div>}
                  {status.message && <div style={styles.healthMessage}>{status.message}</div>}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'token' && (
          <div>
            <div style={styles.sectionHeader}>
              <h3>🎫 Token Status</h3>
              <button onClick={forceTokenRefresh} style={styles.button} disabled={loading}>
                Force Refresh
              </button>
            </div>
            {tokenInfo ? (
              <div style={styles.card}>
                <div style={styles.infoRow}>
                  <span style={styles.label}>Vendor:</span>
                  <span style={styles.value}>{tokenInfo.vendor}</span>
                </div>
                <div style={styles.infoRow}>
                  <span style={styles.label}>Status:</span>
                  <span style={{ ...styles.value, color: tokenInfo.exists ? '#22c55e' : '#ef4444' }}>
                    {tokenInfo.exists ? '✓ Valid' : '✗ No token'}
                  </span>
                </div>
                {tokenInfo.exists && (
                  <>
                    <div style={styles.infoRow}>
                      <span style={styles.label}>Expires At:</span>
                      <span style={styles.value}>{new Date(tokenInfo.expiresAt).toLocaleString()}</span>
                    </div>
                    <div style={styles.infoRow}>
                      <span style={styles.label}>Time Until Expiry:</span>
                      <span style={styles.value}>{tokenInfo.timeUntilExpiry}</span>
                    </div>
                    <div style={styles.infoRow}>
                      <span style={styles.label}>Last Refreshed:</span>
                      <span style={styles.value}>{new Date(tokenInfo.refreshedAt).toLocaleString()}</span>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div style={styles.loading}>Loading token info...</div>
            )}
          </div>
        )}

        {activeTab === 'ratelimit' && (
          <div>
            <h3>📊 Rate Limit Monitor</h3>
            {rateLimit ? (
              <div style={styles.card}>
                <div style={styles.rateLimitBar}>
                  <div
                    style={{
                      ...styles.rateLimitFill,
                      width: `${rateLimit.percentage}%`,
                      backgroundColor: rateLimit.percentage > 80 ? '#ef4444' : rateLimit.percentage > 50 ? '#f59e0b' : '#22c55e',
                    }}
                  />
                </div>
                <div style={styles.infoRow}>
                  <span style={styles.label}>Current Minute:</span>
                  <span style={styles.value}>{rateLimit.currentMinute} / {rateLimit.maxPerMinute} calls</span>
                </div>
                <div style={styles.infoRow}>
                  <span style={styles.label}>Usage:</span>
                  <span style={styles.value}>{rateLimit.percentage}%</span>
                </div>
                <div style={styles.infoRow}>
                  <span style={styles.label}>Reset In:</span>
                  <span style={styles.value}>{rateLimit.resetIn} seconds</span>
                </div>
              </div>
            ) : (
              <div style={styles.loading}>Loading rate limit...</div>
            )}
          </div>
        )}

        {activeTab === 'cache' && (
          <div>
            <h3>🗄️ Cache Inspector</h3>
            {cache ? (
              <>
                <div style={styles.card}>
                  <h4>Machine Status Cache</h4>
                  {cache.machineStatus.length > 0 ? (
                    cache.machineStatus.map((item, idx) => (
                      <div key={idx} style={styles.infoRow}>
                        <span style={styles.label}>{item.deviceId}:</span>
                        <span style={styles.value}>{item.age}</span>
                      </div>
                    ))
                  ) : (
                    <div style={styles.value}>No cached status</div>
                  )}
                  <button onClick={() => clearCache('status')} style={styles.dangerButton}>
                    Clear Status Cache
                  </button>
                </div>

                <div style={{ ...styles.card, marginTop: '16px' }}>
                  <h4>Inventory Cache</h4>
                  <div style={styles.infoRow}>
                    <span style={styles.label}>Items:</span>
                    <span style={styles.value}>{cache.inventory.items}</span>
                  </div>
                  <div style={styles.infoRow}>
                    <span style={styles.label}>Age:</span>
                    <span style={styles.value}>{cache.inventory.age}</span>
                  </div>
                  <button onClick={() => clearCache('inventory')} style={styles.dangerButton}>
                    Clear Inventory Cache
                  </button>
                </div>

                <button onClick={() => clearCache('all')} style={{ ...styles.dangerButton, marginTop: '16px', width: '100%' }}>
                  Clear All Cache
                </button>
              </>
            ) : (
              <div style={styles.loading}>Loading cache info...</div>
            )}
          </div>
        )}

        {activeTab === 'reset' && (
          <div>
            <h3>🔄 Reset Options</h3>
            
            <div style={styles.card}>
              <h4>Soft Reset</h4>
              <p style={styles.resetDescription}>
                • Clear cached data<br />
                • Force token refresh<br />
                • Reload machine status<br />
                • Keep database records
              </p>
              <button onClick={softReset} style={styles.warningButton} disabled={loading}>
                Run Soft Reset
              </button>
            </div>

            <div style={{ ...styles.card, marginTop: '16px' }}>
              <h4>Hard Reset</h4>
              <p style={styles.resetDescription}>
                • Clear all cache<br />
                • Delete current token<br />
                • Force new token fetch<br />
                • Clear command queue<br />
                • Keep audit trail
              </p>
              <button onClick={hardReset} style={styles.dangerButton} disabled={loading}>
                Run Hard Reset
              </button>
            </div>
          </div>
        )}

        {activeTab === 'test' && (
          <div>
            <div style={styles.sectionHeader}>
              <h3>🧪 Full API Test Suite</h3>
              <button onClick={runFullTest} style={styles.button} disabled={loading}>
                {loading ? 'Running...' : 'Run All Tests'}
              </button>
            </div>

            {testResults && (
              <div>
                <div style={styles.testSummary}>
                  <div style={styles.testStat}>
                    <span style={{ color: '#22c55e', fontSize: '32px', fontWeight: 'bold' }}>
                      {testResults.summary.passed}
                    </span>
                    <span>Passed</span>
                  </div>
                  <div style={styles.testStat}>
                    <span style={{ color: '#ef4444', fontSize: '32px', fontWeight: 'bold' }}>
                      {testResults.summary.failed}
                    </span>
                    <span>Failed</span>
                  </div>
                </div>

                <div style={styles.testList}>
                  {testResults.tests.map((test, idx) => (
                    <div key={idx} style={styles.testItem}>
                      <span style={styles.testName}>{test.name}</span>
                      <span style={{
                        ...styles.testStatus,
                        color: test.status === 'PASS' ? '#22c55e' : '#ef4444',
                      }}>
                        {test.status}
                      </span>
                      <span style={styles.testDuration}>{test.duration}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'audit' && (
          <div>
            <div style={styles.sectionHeader}>
              <h3>📜 Audit Log (Last 50)</h3>
              <button onClick={fetchAuditLog} style={styles.button}>
                Refresh
              </button>
            </div>
            <div style={styles.auditList}>
              {auditLog.length > 0 ? (
                auditLog.map(event => (
                  <div key={event.id} style={styles.auditItem}>
                    <span style={styles.auditType}>{event.eventType}</span>
                    <span style={styles.auditDevice}>Device: {event.deviceId || 'N/A'}</span>
                    <span style={styles.auditTime}>{new Date(event.createdAt).toLocaleString()}</span>
                  </div>
                ))
              ) : (
                <div style={styles.value}>No audit events yet</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
  },
  headerRight: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
  },
  title: {
    fontSize: '28px',
    fontWeight: 'bold',
    margin: 0,
  },
  badge: {
    padding: '8px 16px',
    backgroundColor: '#3b82f6',
    color: 'white',
    borderRadius: '20px',
    fontSize: '14px',
    fontWeight: '600',
  },
  closeButton: {
    padding: '8px 16px',
    backgroundColor: '#6b7280',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  tabs: {
    display: 'flex',
    gap: '8px',
    marginBottom: '24px',
    borderBottom: '2px solid #e5e7eb',
    overflowX: 'auto',
  },
  tab: {
    padding: '12px 24px',
    backgroundColor: 'transparent',
    border: 'none',
    borderBottom: '2px solid transparent',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    color: '#6b7280',
    whiteSpace: 'nowrap',
  },
  tabActive: {
    color: '#3b82f6',
    borderBottomColor: '#3b82f6',
  },
  content: {
    backgroundColor: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    padding: '24px',
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  button: {
    padding: '8px 16px',
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
  },
  warningButton: {
    padding: '12px 24px',
    backgroundColor: '#f59e0b',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    width: '100%',
  },
  dangerButton: {
    padding: '12px 24px',
    backgroundColor: '#ef4444',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#f9fafb',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    padding: '20px',
  },
  healthGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '16px',
  },
  healthCard: {
    padding: '16px',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    backgroundColor: '#f9fafb',
  },
  healthName: {
    fontSize: '16px',
    fontWeight: '600',
    marginBottom: '8px',
  },
  healthStatus: {
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '700',
    display: 'inline-block',
    marginBottom: '8px',
  },
  healthy: {
    backgroundColor: '#dcfce7',
    color: '#15803d',
  },
  degraded: {
    backgroundColor: '#fef3c7',
    color: '#92400e',
  },
  down: {
    backgroundColor: '#fee2e2',
    color: '#b91c1c',
  },
  healthTime: {
    fontSize: '14px',
    color: '#6b7280',
  },
  healthMessage: {
    fontSize: '12px',
    color: '#6b7280',
    marginTop: '4px',
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px 0',
    borderBottom: '1px solid #e5e7eb',
  },
  label: {
    fontWeight: '600',
    color: '#374151',
  },
  value: {
    color: '#6b7280',
  },
  rateLimitBar: {
    height: '20px',
    backgroundColor: '#e5e7eb',
    borderRadius: '10px',
    marginBottom: '16px',
    overflow: 'hidden',
  },
  rateLimitFill: {
    height: '100%',
    borderRadius: '10px',
    transition: 'width 0.3s ease',
  },
  resetDescription: {
    fontSize: '14px',
    color: '#6b7280',
    lineHeight: '1.6',
    marginBottom: '16px',
  },
  testSummary: {
    display: 'flex',
    gap: '32px',
    justifyContent: 'center',
    marginBottom: '24px',
  },
  testStat: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  testList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  testItem: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '12px',
    backgroundColor: '#f9fafb',
    borderRadius: '6px',
  },
  testName: {
    fontWeight: '600',
    flex: 1,
  },
  testStatus: {
    fontWeight: '700',
    width: '80px',
    textAlign: 'center',
  },
  testDuration: {
    color: '#6b7280',
    width: '80px',
    textAlign: 'right',
  },
  auditList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    maxHeight: '400px',
    overflowY: 'auto',
  },
  auditItem: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '12px',
    backgroundColor: '#f9fafb',
    borderRadius: '6px',
    fontSize: '14px',
  },
  auditType: {
    fontWeight: '600',
    flex: 1,
  },
  auditDevice: {
    color: '#6b7280',
    flex: 1,
  },
  auditTime: {
    color: '#6b7280',
  },
  error: {
    padding: '12px',
    backgroundColor: '#fee2e2',
    color: '#b91c1c',
    borderRadius: '6px',
    marginBottom: '16px',
  },
  loading: {
    textAlign: 'center',
    padding: '20px',
    color: '#6b7280',
  },
};
