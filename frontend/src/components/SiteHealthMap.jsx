import React, { useState, useEffect } from 'react';
import { MapPin, Shield, AlertTriangle, CheckCircle, Download, RefreshCw, Building2, Eye } from 'lucide-react';

const STATUS_COLORS = {
  ACTIVE: { bg: 'bg-green-100', border: 'border-green-400', text: 'text-green-700', dot: 'bg-green-500' },
  SAFE_MODE: { bg: 'bg-red-100', border: 'border-red-400', text: 'text-red-700', dot: 'bg-red-500' },
  LOCKED: { bg: 'bg-gray-100', border: 'border-gray-400', text: 'text-gray-700', dot: 'bg-gray-500' },
  HOLD: { bg: 'bg-amber-100', border: 'border-amber-400', text: 'text-amber-700', dot: 'bg-amber-500' }
};

export const SiteHealthMap = ({ sites = [], onSelectSite, onDownloadEvidence }) => {
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(false);

  const filteredSites = sites.filter(site => {
    if (filter === 'all') return true;
    if (filter === 'safe_mode') return site.status === 'SAFE_MODE';
    if (filter === 'active') return site.status === 'ACTIVE';
    if (filter === 'issues') return site.status === 'SAFE_MODE' || site.status === 'LOCKED';
    return true;
  });

  const statusCounts = {
    active: sites.filter(s => s.status === 'ACTIVE').length,
    safe_mode: sites.filter(s => s.status === 'SAFE_MODE').length,
    locked: sites.filter(s => s.status === 'LOCKED').length,
    total: sites.length
  };

  const getStatusConfig = (status) => {
    return STATUS_COLORS[status] || STATUS_COLORS.ACTIVE;
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <MapPin size={20} className="text-blue-600" />
            Site Health Status
          </h2>
          <button
            onClick={() => setLoading(true)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={loading}
          >
            <RefreshCw size={18} className={loading ? 'animate-spin text-gray-400' : 'text-gray-600'} />
          </button>
        </div>
        
        <div className="grid grid-cols-4 gap-2 mb-4">
          <div className="text-center p-2 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-800">{statusCounts.total}</div>
            <div className="text-xs text-gray-500">Total</div>
          </div>
          <div className="text-center p-2 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{statusCounts.active}</div>
            <div className="text-xs text-green-600">Active</div>
          </div>
          <div className="text-center p-2 bg-red-50 rounded-lg">
            <div className="text-2xl font-bold text-red-600">{statusCounts.safe_mode}</div>
            <div className="text-xs text-red-600">Safe Mode</div>
          </div>
          <div className="text-center p-2 bg-gray-100 rounded-lg">
            <div className="text-2xl font-bold text-gray-600">{statusCounts.locked}</div>
            <div className="text-xs text-gray-600">Locked</div>
          </div>
        </div>
        
        <div className="flex gap-2 overflow-x-auto pb-2">
          {[
            { id: 'all', label: 'All Sites' },
            { id: 'active', label: 'Active' },
            { id: 'safe_mode', label: 'Safe Mode' },
            { id: 'issues', label: 'Issues' }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                filter === f.id 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>
      
      <div className="max-h-96 overflow-y-auto">
        {filteredSites.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Building2 size={48} className="mx-auto mb-3 opacity-50" />
            <p>No sites match the current filter</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredSites.map(site => {
              const config = getStatusConfig(site.status);
              
              return (
                <div 
                  key={site.site_id}
                  className={`p-4 ${config.bg} hover:brightness-95 transition-all cursor-pointer`}
                  onClick={() => onSelectSite?.(site)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className={`w-3 h-3 rounded-full mt-1.5 ${config.dot}`} />
                      <div>
                        <h3 className="font-bold text-gray-900">{site.venue_name || site.name}</h3>
                        <p className="text-sm text-gray-600">{site.site_id}</p>
                        {site.lat && site.lng && (
                          <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                            <MapPin size={12} />
                            {parseFloat(site.lat).toFixed(4)}, {parseFloat(site.lng).toFixed(4)}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${config.bg} ${config.text} border ${config.border}`}>
                        {site.status === 'SAFE_MODE' && <Shield size={12} className="inline mr-1" />}
                        {site.status || 'ACTIVE'}
                      </span>
                      
                      {site.status === 'SAFE_MODE' && onDownloadEvidence && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDownloadEvidence(site);
                          }}
                          className="flex items-center gap-1 text-xs text-red-600 hover:text-red-700 font-medium"
                        >
                          <Download size={12} />
                          Evidence
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {site.status === 'SAFE_MODE' && (
                    <div className="mt-3 p-2 bg-red-200/50 rounded-lg text-xs text-red-800 flex items-center gap-2">
                      <AlertTriangle size={14} />
                      <span>Recovery required: 3-Point Evidence Package</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export const SiteStatusBadge = ({ status }) => {
  const config = STATUS_COLORS[status] || STATUS_COLORS.ACTIVE;
  
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${config.bg} ${config.text} border ${config.border}`}>
      {status === 'SAFE_MODE' && <Shield size={12} />}
      {status === 'ACTIVE' && <CheckCircle size={12} />}
      {status === 'LOCKED' && <AlertTriangle size={12} />}
      {status}
    </span>
  );
};

export default SiteHealthMap;
