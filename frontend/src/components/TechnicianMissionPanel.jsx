/**
 * SIPJOLT OS - Technician Mission Panel
 * Production-ready React component for machine 00000020868
 * 
 * FEATURES:
 * - Live machine status
 * - Test brew with recipe selection
 * - Command history
 * - Machine controls (restart, offline/online)
 */

import React, { useState, useEffect } from 'react';

export default function TechnicianMissionPanel({ siteId = 2, onClose }) {
  const [missionData, setMissionData] = useState(null);
  const [recipes, setRecipes] = useState([]);
  const [selectedRecipe, setSelectedRecipe] = useState('');
  const [brewCommandId, setBrewCommandId] = useState(null);
  const [pollingStatus, setPollingStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Get auth headers from your existing auth system
  const getAuthHeaders = () => ({
    'x-user-id': localStorage.getItem('userId') || '1',
    'x-user-role': localStorage.getItem('userRole') || 'PARTNER_TECHNICIAN',
    'x-tenant-id': localStorage.getItem('tenantId') || '',
  });

  // Load mission panel data
  const loadMissionPanel = async () => {
    try {
      const response = await fetch(`/api/v1.01/yile-tech/sites/${siteId}/mission-panel`, {
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      
      if (data.success) {
        setMissionData(data.data);
        setError(null);
      } else {
        setError(data.error || 'Failed to load mission panel');
      }
    } catch (err) {
      setError('Network error: ' + err.message);
    }
  };

  // Load available recipes
  const loadRecipes = async () => {
    try {
      const response = await fetch(`/api/v1.01/yile-tech/sites/${siteId}/available-recipes`, {
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      
      if (data.success) {
        setRecipes(data.data.recipes || []);
        if (data.data.recipes.length > 0) {
          setSelectedRecipe(data.data.recipes[0].name);
        }
      }
    } catch (err) {
      console.error('Failed to load recipes:', err);
    }
  };

  // Refresh machine status
  const handleRefreshStatus = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/v1.01/yile-tech/sites/${siteId}/refresh-status`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      
      if (data.success) {
        await loadMissionPanel();
        setError(null);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Refresh failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Test brew
  const handleTestBrew = async () => {
    if (!selectedRecipe) {
      setError('Please select a recipe');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/v1.01/yile-tech/sites/${siteId}/test-brew`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ recipeName: selectedRecipe }),
      });
      const data = await response.json();
      
      if (data.success) {
        setBrewCommandId(data.commandId);
        setPollingStatus('Brew initiated...');
        pollCommandStatus(data.commandId);
      } else {
        setError(data.error || 'Brew failed');
      }
    } catch (err) {
      setError('Brew failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Poll command status
  const pollCommandStatus = async (commandId) => {
    const maxAttempts = 30; // 60 seconds max
    let attempts = 0;

    const poll = async () => {
      if (attempts >= maxAttempts) {
        setPollingStatus('Brew timeout - check machine');
        return;
      }

      try {
        const response = await fetch(`/api/v1.01/yile-tech/commands/${commandId}`, {
          headers: getAuthHeaders(),
        });
        const data = await response.json();

        if (data.success) {
          const status = data.data.status;
          
          if (status === 'SUCCESS') {
            setPollingStatus('✅ Brew completed!');
            setTimeout(() => {
              setBrewCommandId(null);
              setPollingStatus(null);
              loadMissionPanel();
            }, 3000);
            return;
          } else if (status === 'FAIL') {
            setPollingStatus('❌ Brew failed: ' + data.data.errorMessage);
            setTimeout(() => {
              setBrewCommandId(null);
              setPollingStatus(null);
            }, 5000);
            return;
          } else if (status === 'RUNNING') {
            setPollingStatus('☕ Brewing...');
          } else if (status === 'QUEUED') {
            setPollingStatus('⏳ Queued...');
          }

          attempts++;
          setTimeout(poll, 2000);
        }
      } catch (err) {
        console.error('Poll error:', err);
        attempts++;
        setTimeout(poll, 2000);
      }
    };

    poll();
  };

  // Restart machine
  const handleRestart = async () => {
    if (!confirm('Restart machine? This will interrupt any brewing in progress.')) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/v1.01/yile-tech/sites/${siteId}/restart`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      
      if (data.success) {
        alert('Restart initiated');
        setTimeout(() => loadMissionPanel(), 5000);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Restart failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Take offline
  const handleTakeOffline = async () => {
    const reason = prompt('Reason for taking machine offline:');
    if (!reason) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/v1.01/yile-tech/sites/${siteId}/take-offline`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ reason }),
      });
      const data = await response.json();
      
      if (data.success) {
        await loadMissionPanel();
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Bring online
  const handleBringOnline = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/v1.01/yile-tech/sites/${siteId}/bring-online`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      
      if (data.success) {
        await loadMissionPanel();
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh every 10 seconds
  useEffect(() => {
    loadMissionPanel();
    loadRecipes();
    
    const interval = setInterval(() => {
      if (!brewCommandId) {
        loadMissionPanel();
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [siteId, brewCommandId]);

  if (!missionData && !error) {
    return <div style={styles.loading}>Loading mission panel...</div>;
  }

  if (!missionData && error) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <h2 style={styles.title}>Technician Mission Panel</h2>
          {onClose && (
            <button onClick={onClose} style={styles.closeButton}>
              ✕ Close
            </button>
          )}
        </div>
        <div style={styles.error}>{error}</div>
        <button onClick={loadMissionPanel} style={styles.refreshButton}>
          🔄 Retry
        </button>
      </div>
    );
  }

  const { device, status, recentCommands, openIncidents } = missionData;
  const isOnline = status?.online;
  const isOffline = device.softLockState === 'OFFLINE';

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>Technician Mission Panel</h2>
        <div style={styles.headerButtons}>
          <button onClick={handleRefreshStatus} style={styles.refreshButton} disabled={loading}>
            🔄 Refresh
          </button>
          {onClose && (
            <button onClick={onClose} style={styles.closeButton}>
              ✕ Close
            </button>
          )}
        </div>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      {/* Device Info */}
      <div style={styles.card}>
        <h3 style={styles.cardTitle}>Machine: {device.siteName}</h3>
        <div style={styles.statusRow}>
          <span style={{ ...styles.statusBadge, ...(isOnline ? styles.online : styles.offline) }}>
            {isOnline ? '🟢 Online' : '🔴 Offline'}
          </span>
          {isOffline && (
            <span style={styles.lockBadge}>🔒 Software Lock: {device.softLockReason}</span>
          )}
        </div>
        <p style={styles.info}>Status: {status?.workStatusText || 'Unknown'}</p>
        <p style={styles.info}>Device ID: {device.yileDeviceId}</p>
        <p style={styles.info}>Signal: {'📶'.repeat(status?.signalStrength || 0)}</p>
        {status?.lastUpdate && (
          <p style={styles.info}>Last Update: {new Date(status.lastUpdate).toLocaleString()}</p>
        )}
      </div>

      {/* Test Brew */}
      <div style={styles.card}>
        <h3 style={styles.cardTitle}>Test Brew</h3>
        <div style={styles.brewControls}>
          <select 
            value={selectedRecipe} 
            onChange={(e) => setSelectedRecipe(e.target.value)}
            style={styles.select}
            disabled={loading || isOffline}
          >
            {recipes.map(recipe => (
              <option key={recipe.id} value={recipe.name}>
                {recipe.name} (${recipe.price})
              </option>
            ))}
          </select>
          <button 
            onClick={handleTestBrew} 
            style={{
              ...styles.brewButton,
              ...(loading || isOffline || !isOnline || brewCommandId ? { opacity: 0.5, cursor: 'not-allowed' } : {})
            }}
            disabled={loading || isOffline || !isOnline || brewCommandId}
            title={!isOnline ? "Machine is offline - cannot brew" : ""}
          >
            ☕ Brew Test
          </button>
        </div>
        {pollingStatus && <div style={styles.pollingStatus}>{pollingStatus}</div>}
      </div>

      {/* Machine Controls */}
      <div style={styles.card}>
        <h3 style={styles.cardTitle}>Machine Controls</h3>
        <div style={styles.controlButtons}>
          <button onClick={handleRestart} style={styles.controlButton} disabled={loading}>
            🔄 Restart
          </button>
          {isOffline ? (
            <button onClick={handleBringOnline} style={styles.controlButton} disabled={loading}>
              🟢 Bring Online
            </button>
          ) : (
            <button onClick={handleTakeOffline} style={styles.controlButton} disabled={loading}>
              🔴 Take Offline
            </button>
          )}
        </div>
      </div>

      {/* Recent Commands */}
      <div style={styles.card}>
        <h3 style={styles.cardTitle}>Recent Commands ({recentCommands?.length || 0})</h3>
        <div style={styles.commandList}>
          {recentCommands?.slice(0, 5).map(cmd => (
            <div key={cmd.commandId} style={styles.commandItem}>
              <span style={styles.commandType}>{cmd.type}</span>
              <span style={{ ...styles.commandStatus, ...(getStatusStyle(cmd.status)) }}>
                {cmd.status}
              </span>
              <span style={styles.commandTime}>
                {new Date(cmd.createdAt).toLocaleTimeString()}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Open Incidents */}
      {openIncidents > 0 && (
        <div style={styles.warning}>
          ⚠️ {openIncidents} open incident{openIncidents > 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}

function getStatusStyle(status) {
  switch (status) {
    case 'SUCCESS': return { color: '#22c55e' };
    case 'FAIL': return { color: '#ef4444' };
    case 'RUNNING': return { color: '#3b82f6' };
    case 'QUEUED': return { color: '#f59e0b' };
    case 'BLOCKED': return { color: '#ef4444' };
    default: return { color: '#6b7280' };
  }
}

const styles = {
  container: {
    maxWidth: '900px',
    margin: '0 auto',
    padding: '20px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  headerButtons: {
    display: 'flex',
    gap: '8px',
  },
  title: {
    fontSize: '24px',
    fontWeight: 'bold',
    margin: 0,
  },
  refreshButton: {
    padding: '8px 16px',
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
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
  card: {
    backgroundColor: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    padding: '20px',
    marginBottom: '16px',
  },
  cardTitle: {
    fontSize: '18px',
    fontWeight: '600',
    marginTop: 0,
    marginBottom: '12px',
  },
  statusRow: {
    display: 'flex',
    gap: '12px',
    marginBottom: '12px',
  },
  statusBadge: {
    padding: '6px 12px',
    borderRadius: '20px',
    fontSize: '14px',
    fontWeight: '600',
  },
  online: {
    backgroundColor: '#dcfce7',
    color: '#15803d',
  },
  offline: {
    backgroundColor: '#fee2e2',
    color: '#b91c1c',
  },
  lockBadge: {
    padding: '6px 12px',
    borderRadius: '20px',
    fontSize: '14px',
    backgroundColor: '#fef3c7',
    color: '#92400e',
  },
  info: {
    margin: '8px 0',
    fontSize: '14px',
    color: '#4b5563',
  },
  brewControls: {
    display: 'flex',
    gap: '12px',
  },
  select: {
    flex: 1,
    padding: '10px',
    fontSize: '14px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
  },
  brewButton: {
    padding: '10px 24px',
    backgroundColor: '#059669',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
  },
  pollingStatus: {
    marginTop: '12px',
    padding: '12px',
    backgroundColor: '#f3f4f6',
    borderRadius: '6px',
    fontSize: '14px',
    textAlign: 'center',
  },
  controlButtons: {
    display: 'flex',
    gap: '12px',
  },
  controlButton: {
    flex: 1,
    padding: '10px',
    backgroundColor: '#6b7280',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  commandList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  commandItem: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '12px',
    backgroundColor: '#f9fafb',
    borderRadius: '6px',
    fontSize: '14px',
  },
  commandType: {
    fontWeight: '600',
  },
  commandStatus: {
    fontWeight: '600',
  },
  commandTime: {
    color: '#6b7280',
  },
  error: {
    padding: '12px',
    backgroundColor: '#fee2e2',
    color: '#b91c1c',
    borderRadius: '6px',
    marginBottom: '16px',
  },
  warning: {
    padding: '12px',
    backgroundColor: '#fef3c7',
    color: '#92400e',
    borderRadius: '6px',
    fontWeight: '600',
  },
  loading: {
    textAlign: 'center',
    padding: '40px',
    fontSize: '18px',
    color: '#6b7280',
  },
};
