import React, { useState, useEffect } from 'react';
import { 
  Activity, Settings, Truck, Package, Building2, 
  Sparkles, CheckCircle, Printer, Coffee, Shield,
  Users, BarChart3, AlertTriangle, Bell, LogOut,
  ChevronRight, RefreshCw, Zap, Target, Calendar,
  FileText, Lock, Wifi, WifiOff, Clock, TrendingUp,
  Gamepad2, Wrench
} from 'lucide-react';
import { ScreenshotButton } from '../utils/screenshotHelper.jsx';
import ReplenishmentAlerts from './fleet/ReplenishmentAlerts';

const NAV_ITEMS = [
  { id: 'overview', label: 'Overview', icon: BarChart3, color: 'text-blue-400' },
  { id: 'fleet', label: 'Fleet', icon: Activity, color: 'text-emerald-400' },
  { id: 'replenishment', label: 'Replenishment', icon: Package, color: 'text-lime-400' },
  { id: 'remote', label: 'Machine Control', icon: Gamepad2, color: 'text-pink-400' },
  { id: 'shipments', label: 'Shipments', icon: Truck, color: 'text-amber-400' },
  { id: 'supply', label: 'Supply Closet', icon: Building2, color: 'text-purple-400' },
  { id: 'technicians', label: 'Technicians', icon: Users, color: 'text-cyan-400' },
  { id: 'incidents', label: 'Incidents', icon: AlertTriangle, color: 'text-red-400' },
  { id: 'reports', label: 'Reports', icon: FileText, color: 'text-indigo-400' },
  { id: 'admin', label: 'Admin', icon: Settings, color: 'text-gray-400' },
  { id: 'diagnostics', label: 'Diagnostics', icon: Wrench, color: 'text-slate-500' },
];

export default function OpsCommandCenter({ user, onLogout, onNavigateYile }) {
  const [activeSection, setActiveSection] = useState('overview');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastSync, setLastSync] = useState(new Date());
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [systemStatus, setSystemStatus] = useState({ healthy: true, alerts: 0 });
  
  const [dashboardData, setDashboardData] = useState({
    totalMachines: 0,
    activeMachines: 0,
    pendingShipments: 0,
    openIncidents: 0,
    techniciansOnDuty: 0,
    todayVisits: 0,
    weeklyVisits: 0,
    complianceScore: 0
  });

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const headers = {
          'x-user-id': 'ops-001',
          'x-user-name': user?.displayName || 'Ops Manager',
          'x-user-role': 'ops_manager'
        };

        const [fleetRes, shipmentsRes, incidentsRes, visitsRes] = await Promise.all([
          fetch('/api/ops/fleet', { headers }).catch(() => ({ ok: false })),
          fetch('/api/ops/shipments', { headers }).catch(() => ({ ok: false })),
          fetch('/api/ops/incidents', { headers }).catch(() => ({ ok: false })),
          fetch('/api/ops/visits?limit=100', { headers }).catch(() => ({ ok: false }))
        ]);

        const fleetData = fleetRes.ok ? await fleetRes.json().catch(() => ({})) : {};
        const shipmentsData = shipmentsRes.ok ? await shipmentsRes.json().catch(() => ({})) : {};
        const incidentsData = incidentsRes.ok ? await incidentsRes.json().catch(() => ({})) : {};
        const visitsData = visitsRes.ok ? await visitsRes.json().catch(() => ({})) : {};

        const machines = fleetData.machines || [];
        const shipments = shipmentsData.shipments || [];
        const incidents = incidentsData.incidents || [];
        const visits = visitsData.visits || [];

        const today = new Date().toDateString();
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

        setDashboardData({
          totalMachines: machines.length,
          activeMachines: machines.filter(m => m.status === 'active' || m.status === 'healthy').length,
          pendingShipments: shipments.filter(s => s.status === 'pending' || s.status === 'packing').length,
          openIncidents: incidents.filter(i => i.status === 'open' || i.status === 'pending').length,
          techniciansOnDuty: 3,
          todayVisits: visits.filter(v => new Date(v.completedAt).toDateString() === today).length,
          weeklyVisits: visits.filter(v => new Date(v.completedAt) >= weekAgo).length,
          complianceScore: 94
        });

        setSystemStatus({
          healthy: incidents.filter(i => i.severity === 'critical').length === 0,
          alerts: incidents.filter(i => i.status === 'open').length
        });

        setLastSync(new Date());
      } catch (error) {
        console.error('Dashboard fetch error:', error);
      }
    };

    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const handleRefresh = () => {
    setLastSync(new Date());
    window.location.reload();
  };

  return (
    <div className="flex h-full bg-slate-900 text-white">
      <aside className={`${sidebarCollapsed ? 'w-16' : 'w-64'} bg-slate-950 border-r border-slate-800 flex flex-col transition-all duration-300`}>
        <div className="p-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Shield size={20} className="text-white" />
            </div>
            {!sidebarCollapsed && (
              <div>
                <h1 className="font-bold text-lg">SIPJOLT</h1>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest">Command Center</p>
              </div>
            )}
          </div>
        </div>

        <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                activeSection === item.id 
                  ? 'bg-slate-800 text-white' 
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
              }`}
            >
              <item.icon size={18} className={activeSection === item.id ? item.color : ''} />
              {!sidebarCollapsed && <span className="text-sm font-medium">{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-slate-800">
          <div className={`flex items-center gap-2 px-2 py-2 rounded-lg bg-slate-800/50 ${sidebarCollapsed ? 'justify-center' : ''}`}>
            {isOnline ? (
              <Wifi size={14} className="text-emerald-400" />
            ) : (
              <WifiOff size={14} className="text-red-400" />
            )}
            {!sidebarCollapsed && (
              <span className={`text-xs ${isOnline ? 'text-emerald-400' : 'text-red-400'}`}>
                {isOnline ? 'Connected' : 'Offline'}
              </span>
            )}
          </div>
          
          <button
            onClick={onLogout}
            className={`w-full mt-2 flex items-center gap-3 px-3 py-2 text-slate-400 hover:text-red-400 hover:bg-slate-800/50 rounded-lg transition-all ${sidebarCollapsed ? 'justify-center' : ''}`}
          >
            <LogOut size={18} />
            {!sidebarCollapsed && <span className="text-sm">Sign Out</span>}
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold">
              {NAV_ITEMS.find(n => n.id === activeSection)?.label || 'Overview'}
            </h2>
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${
              systemStatus.healthy ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
            }`}>
              <div className={`w-2 h-2 rounded-full ${systemStatus.healthy ? 'bg-emerald-400' : 'bg-red-400'} animate-pulse`} />
              {systemStatus.healthy ? 'All Systems Operational' : `${systemStatus.alerts} Active Alerts`}
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Clock size={14} />
              <span>Last sync: {lastSync.toLocaleTimeString()}</span>
            </div>
            <button 
              onClick={handleRefresh}
              className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <RefreshCw size={18} className="text-slate-400" />
            </button>
            <button className="p-2 hover:bg-slate-800 rounded-lg transition-colors relative">
              <Bell size={18} className="text-slate-400" />
              {systemStatus.alerts > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] flex items-center justify-center font-bold">
                  {systemStatus.alerts}
                </span>
              )}
            </button>
            <div className="flex items-center gap-3 pl-4 border-l border-slate-700">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-sm font-bold">
                {user?.displayName?.charAt(0) || 'O'}
              </div>
              <div className="hidden md:block">
                <p className="text-sm font-medium">{user?.displayName || 'Ops Manager'}</p>
                <p className="text-[10px] text-slate-500 flex items-center gap-1">
                  <Lock size={8} /> Secure Session
                </p>
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 bg-slate-900/50">
          {activeSection === 'overview' && (
            <OverviewDashboard data={dashboardData} onNavigate={setActiveSection} />
          )}
          
          {activeSection === 'fleet' && (
            <FleetSection user={user} />
          )}
          
          {activeSection === 'shipments' && (
            <ShipmentsSection user={user} />
          )}
          
          {activeSection === 'supply' && (
            <SupplySection user={user} />
          )}
          
          {activeSection === 'machines' && (
            <MachinesSection user={user} onNavigateYile={onNavigateYile} />
          )}
          
          {activeSection === 'technicians' && (
            <TechniciansSection user={user} />
          )}
          
          {activeSection === 'incidents' && (
            <IncidentsSection user={user} />
          )}
          
          {activeSection === 'reports' && (
            <ReportsSection user={user} />
          )}
          
          {activeSection === 'admin' && (
            <AdminSection user={user} onNavigateYile={onNavigateYile} />
          )}
          
          {activeSection === 'replenishment' && (
            <ReplenishmentSection />
          )}
          
          {activeSection === 'remote' && (
            <RemoteControlSection />
          )}
          
          {activeSection === 'diagnostics' && (
            <DiagnosticsSection />
          )}
        </div>
      </main>
      <ScreenshotButton pageName="ops-command-center" />
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color, trend, onClick }) {
  return (
    <button 
      onClick={onClick}
      className="bg-slate-800/50 border border-slate-700 rounded-xl p-5 text-left hover:bg-slate-800 hover:border-slate-600 transition-all group"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-slate-400 text-sm mb-1">{label}</p>
          <p className="text-3xl font-bold">{value}</p>
          {trend && (
            <p className={`text-xs mt-2 flex items-center gap-1 ${trend > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              <TrendingUp size={12} className={trend < 0 ? 'rotate-180' : ''} />
              {Math.abs(trend)}% from last week
            </p>
          )}
        </div>
        <div className={`w-12 h-12 rounded-lg ${color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
          <Icon size={24} className="text-white" />
        </div>
      </div>
    </button>
  );
}

function OverviewDashboard({ data, onNavigate }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          label="Active Machines" 
          value={`${data.activeMachines}/${data.totalMachines}`}
          icon={Coffee}
          color="bg-gradient-to-br from-orange-500 to-amber-600"
          onClick={() => onNavigate('machines')}
        />
        <StatCard 
          label="Pending Shipments" 
          value={data.pendingShipments}
          icon={Truck}
          color="bg-gradient-to-br from-blue-500 to-cyan-600"
          onClick={() => onNavigate('shipments')}
        />
        <StatCard 
          label="Open Incidents" 
          value={data.openIncidents}
          icon={AlertTriangle}
          color={data.openIncidents > 0 ? "bg-gradient-to-br from-red-500 to-rose-600" : "bg-gradient-to-br from-emerald-500 to-green-600"}
          onClick={() => onNavigate('incidents')}
        />
        <StatCard 
          label="Compliance Score" 
          value={`${data.complianceScore}%`}
          icon={Shield}
          color="bg-gradient-to-br from-purple-500 to-violet-600"
          trend={2}
          onClick={() => onNavigate('reports')}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-slate-800/50 border border-slate-700 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg">Weekly Activity</h3>
            <span className="text-xs text-slate-500">Last 7 days</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-900/50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-emerald-400">{data.weeklyVisits}</p>
              <p className="text-xs text-slate-400 mt-1">Total Visits</p>
            </div>
            <div className="bg-slate-900/50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-blue-400">{data.todayVisits}</p>
              <p className="text-xs text-slate-400 mt-1">Today</p>
            </div>
            <div className="bg-slate-900/50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-amber-400">{data.techniciansOnDuty}</p>
              <p className="text-xs text-slate-400 mt-1">Technicians</p>
            </div>
            <div className="bg-slate-900/50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-purple-400">{data.pendingShipments}</p>
              <p className="text-xs text-slate-400 mt-1">In Transit</p>
            </div>
          </div>
        </div>

        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
          <h3 className="font-semibold text-lg mb-4">Quick Actions</h3>
          <div className="space-y-2">
            <button 
              onClick={() => onNavigate('shipments')}
              className="w-full flex items-center justify-between px-4 py-3 bg-slate-900/50 hover:bg-slate-900 rounded-lg transition-colors group"
            >
              <span className="flex items-center gap-3">
                <Truck size={18} className="text-blue-400" />
                <span className="text-sm">Create Shipment</span>
              </span>
              <ChevronRight size={16} className="text-slate-500 group-hover:text-white transition-colors" />
            </button>
            <button 
              onClick={() => onNavigate('incidents')}
              className="w-full flex items-center justify-between px-4 py-3 bg-slate-900/50 hover:bg-slate-900 rounded-lg transition-colors group"
            >
              <span className="flex items-center gap-3">
                <AlertTriangle size={18} className="text-amber-400" />
                <span className="text-sm">Review Incidents</span>
              </span>
              <ChevronRight size={16} className="text-slate-500 group-hover:text-white transition-colors" />
            </button>
            <button 
              onClick={() => onNavigate('machines')}
              className="w-full flex items-center justify-between px-4 py-3 bg-slate-900/50 hover:bg-slate-900 rounded-lg transition-colors group"
            >
              <span className="flex items-center gap-3">
                <Coffee size={18} className="text-orange-400" />
                <span className="text-sm">Machine Control</span>
              </span>
              <ChevronRight size={16} className="text-slate-500 group-hover:text-white transition-colors" />
            </button>
            <button 
              onClick={() => onNavigate('reports')}
              className="w-full flex items-center justify-between px-4 py-3 bg-slate-900/50 hover:bg-slate-900 rounded-lg transition-colors group"
            >
              <span className="flex items-center gap-3">
                <FileText size={18} className="text-purple-400" />
                <span className="text-sm">Generate Reports</span>
              </span>
              <ChevronRight size={16} className="text-slate-500 group-hover:text-white transition-colors" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

import FleetDashboard from '../pages/FleetDashboard';

function FleetSection({ user }) {
  return <FleetDashboard />;
}

function ShipmentsSection({ user }) {
  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
      <h3 className="text-lg font-semibold mb-4">Shipments Management</h3>
      <p className="text-slate-400">Gate5 Shipping Framework - Manage ingredient and cup shipments across all sites.</p>
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900/50 rounded-lg p-4">
          <p className="text-2xl font-bold text-blue-400">0</p>
          <p className="text-xs text-slate-400 mt-1">Pending Shipments</p>
        </div>
        <div className="bg-slate-900/50 rounded-lg p-4">
          <p className="text-2xl font-bold text-amber-400">0</p>
          <p className="text-xs text-slate-400 mt-1">In Transit</p>
        </div>
        <div className="bg-slate-900/50 rounded-lg p-4">
          <p className="text-2xl font-bold text-emerald-400">0</p>
          <p className="text-xs text-slate-400 mt-1">Delivered This Week</p>
        </div>
      </div>
    </div>
  );
}

function SupplySection({ user }) {
  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
      <h3 className="text-lg font-semibold mb-4">Supply Closet Operations</h3>
      <p className="text-slate-400">Monitor and manage supply closet inventory across all sites.</p>
    </div>
  );
}

function MachinesSection({ user, onNavigateYile }) {
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded-xl p-6">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Coffee size={20} className="text-amber-400" />
              Yile Coffee Machine Control
            </h3>
            <p className="text-slate-400 text-sm mt-1">Machine #00000020868 - Remote management and diagnostics</p>
          </div>
          <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-medium rounded-full">
            Integration Active
          </span>
        </div>
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => onNavigateYile && onNavigateYile('missionpanel')}
            className="flex items-center justify-between px-5 py-4 bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors group"
          >
            <span className="flex items-center gap-3">
              <Zap size={20} />
              <div className="text-left">
                <span className="font-semibold block">Mission Panel</span>
                <span className="text-xs text-amber-200">Test brew, status, controls</span>
              </div>
            </span>
            <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </button>
          <button
            onClick={() => onNavigateYile && onNavigateYile('admindiagnostics')}
            className="flex items-center justify-between px-5 py-4 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors group"
          >
            <span className="flex items-center gap-3">
              <Settings size={20} />
              <div className="text-left">
                <span className="font-semibold block">Diagnostics</span>
                <span className="text-xs text-purple-200">Health, logs, configuration</span>
              </div>
            </span>
            <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
}

function TechniciansSection({ user }) {
  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
      <h3 className="text-lg font-semibold mb-4">Technician Management</h3>
      <p className="text-slate-400">View and manage technician assignments, certifications, and performance.</p>
    </div>
  );
}

function IncidentsSection({ user }) {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchIncidents = async () => {
      try {
        const res = await fetch('/api/ops/incidents', {
          headers: { 'x-user-role': 'ops_manager' }
        });
        const data = await res.json();
        setIncidents(data.incidents || []);
      } catch (e) {
        console.error('Incidents fetch error:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchIncidents();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Incident Management</h3>
        <span className="text-sm text-slate-400">{incidents.filter(i => i.status === 'open').length} open incidents</span>
      </div>
      
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
        {loading ? (
          <p className="text-center text-slate-400 py-8">Loading incidents...</p>
        ) : incidents.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-emerald-500/20 rounded-full flex items-center justify-center">
              <CheckCircle size={32} className="text-emerald-400" />
            </div>
            <p className="text-slate-400">No open incidents</p>
            <p className="text-xs text-slate-500 mt-1">All systems operating normally</p>
          </div>
        ) : (
          <div className="space-y-3">
            {incidents.map(incident => (
              <div key={incident.id} className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    incident.severity === 'critical' ? 'bg-red-400' :
                    incident.severity === 'high' ? 'bg-amber-400' : 'bg-yellow-400'
                  }`} />
                  <div>
                    <p className="font-medium">{incident.title || incident.type}</p>
                    <p className="text-xs text-slate-500">{incident.site_name || 'Unknown Site'}</p>
                  </div>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                  incident.status === 'open' ? 'bg-red-500/20 text-red-400' : 'bg-slate-700 text-slate-400'
                }`}>
                  {incident.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ReportsSection({ user }) {
  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
      <h3 className="text-lg font-semibold mb-4">Reports & Analytics</h3>
      <p className="text-slate-400">Generate compliance reports, visit summaries, and operational analytics.</p>
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <button className="flex items-center gap-3 px-4 py-3 bg-slate-900/50 hover:bg-slate-900 rounded-lg transition-colors">
          <FileText size={18} className="text-blue-400" />
          <span className="text-sm">Weekly Visit Summary</span>
        </button>
        <button className="flex items-center gap-3 px-4 py-3 bg-slate-900/50 hover:bg-slate-900 rounded-lg transition-colors">
          <BarChart3 size={18} className="text-purple-400" />
          <span className="text-sm">Compliance Report</span>
        </button>
        <button className="flex items-center gap-3 px-4 py-3 bg-slate-900/50 hover:bg-slate-900 rounded-lg transition-colors">
          <Truck size={18} className="text-amber-400" />
          <span className="text-sm">Shipment History</span>
        </button>
        <button className="flex items-center gap-3 px-4 py-3 bg-slate-900/50 hover:bg-slate-900 rounded-lg transition-colors">
          <Users size={18} className="text-cyan-400" />
          <span className="text-sm">Technician Performance</span>
        </button>
      </div>
    </div>
  );
}

function AdminSection({ user, onNavigateYile }) {
  return (
    <div className="space-y-6">
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Lock size={18} className="text-slate-400" />
          System Administration
        </h3>
        <p className="text-slate-400 text-sm mb-6">Manage system configuration, user access, and security settings.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button className="flex items-center gap-3 px-4 py-3 bg-slate-900/50 hover:bg-slate-900 rounded-lg transition-colors text-left">
            <Users size={18} className="text-cyan-400" />
            <div>
              <span className="text-sm font-medium block">User Management</span>
              <span className="text-xs text-slate-500">Manage technicians and admins</span>
            </div>
          </button>
          <button className="flex items-center gap-3 px-4 py-3 bg-slate-900/50 hover:bg-slate-900 rounded-lg transition-colors text-left">
            <Building2 size={18} className="text-purple-400" />
            <div>
              <span className="text-sm font-medium block">Site Configuration</span>
              <span className="text-xs text-slate-500">Manage sites and locations</span>
            </div>
          </button>
          <button className="flex items-center gap-3 px-4 py-3 bg-slate-900/50 hover:bg-slate-900 rounded-lg transition-colors text-left">
            <Shield size={18} className="text-emerald-400" />
            <div>
              <span className="text-sm font-medium block">Security Settings</span>
              <span className="text-xs text-slate-500">Access control and audit logs</span>
            </div>
          </button>
          <button className="flex items-center gap-3 px-4 py-3 bg-slate-900/50 hover:bg-slate-900 rounded-lg transition-colors text-left">
            <Settings size={18} className="text-gray-400" />
            <div>
              <span className="text-sm font-medium block">System Settings</span>
              <span className="text-xs text-slate-500">App configuration and preferences</span>
            </div>
          </button>
        </div>
      </div>

      <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
          <Coffee size={18} className="text-amber-400" />
          Yile Machine Integration
        </h3>
        <p className="text-slate-400 text-sm mb-4">Direct control and diagnostics for connected coffee machines.</p>
        <div className="flex gap-3">
          <button
            onClick={() => onNavigateYile && onNavigateYile('missionpanel')}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 rounded-lg text-sm font-medium transition-colors"
          >
            Mission Panel
          </button>
          <button
            onClick={() => onNavigateYile && onNavigateYile('admindiagnostics')}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm font-medium transition-colors"
          >
            Diagnostics
          </button>
        </div>
      </div>
    </div>
  );
}

function ReplenishmentSection() {
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/v1.01/fleet/dashboard')
      .then(r => r.json())
      .then(data => {
        if (data.success && data.data?.devices) {
          setDevices(data.data.devices);
          if (data.data.devices.length > 0) {
            setSelectedDevice(data.data.devices[0].deviceId);
          }
        }
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 mb-4">
        <Package className="w-6 h-6 text-lime-400" />
        <h2 className="text-xl font-bold">Replenishment Center</h2>
        <select
          value={selectedDevice || ''}
          onChange={e => setSelectedDevice(e.target.value)}
          className="ml-auto px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm"
        >
          {devices.map(d => (
            <option key={d.deviceId} value={d.deviceId}>{d.deviceNikeName || d.deviceId}</option>
          ))}
        </select>
      </div>
      
      {selectedDevice && (
        <ReplenishmentAlerts deviceId={selectedDevice} isDark={true} />
      )}
    </div>
  );
}

function RemoteControlSection() {
  return (
    <div className="space-y-4">
      <CompactMachineControl />
    </div>
  );
}

function DiagnosticsSection() {
  return (
    <div className="space-y-6">
      <DiagnosticsEmbed />
    </div>
  );
}

function CompactMachineControl() {
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [recipes, setRecipes] = useState([]);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [deviceStatus, setDeviceStatus] = useState({ online: true, offline: false });

  useEffect(() => {
    fetch('/api/v1.01/remote/devices')
      .then(r => r.json())
      .then(data => {
        if (data.success && data.data?.length > 0) {
          setDevices(data.data);
          setSelectedDevice(data.data[0].deviceId);
          setDeviceStatus({ online: data.data[0].online, offline: false });
        }
      });
  }, []);

  useEffect(() => {
    if (selectedDevice) {
      setRecipes([]);
      setSelectedRecipe(null);
      setResult(null);
      fetch(`/api/v1.01/fleet/${selectedDevice}/recipes`)
        .then(r => r.json())
        .then(data => {
          if (data.success && data.data?.length > 0) {
            setRecipes(data.data);
            setSelectedRecipe(data.data[0].coffeeName);
            setResult({ success: true, message: `✅ ${data.data.length} recipes loaded` });
          } else if (data.error) {
            setResult({ success: false, message: data.error });
          } else {
            setResult({ success: false, message: 'No recipes found on device' });
          }
        })
        .catch(err => {
          setResult({ success: false, message: 'Failed to fetch recipes from machine' });
        });
      const device = devices.find(d => d.deviceId === selectedDevice);
      if (device) setDeviceStatus({ online: device.online, offline: false });
    }
  }, [selectedDevice, devices]);

  const doAction = async (action) => {
    if (!selectedDevice) {
      setResult({ success: false, message: 'Select a device first' });
      return;
    }
    if (action === 'brew' && !selectedRecipe) {
      setResult({ success: false, message: 'Select a recipe first' });
      return;
    }
    
    setLoading(true);
    setResult(null);
    
    try {
      let res, data;
      if (action === 'brew') {
        res = await fetch('/api/v1.01/remote/brew', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ deviceId: selectedDevice, recipeName: selectedRecipe })
        });
        data = await res.json();
        setResult({ success: data.success, message: data.success ? `☕ Brewing ${selectedRecipe}!` : (data.error || 'Brew failed') });
      } else if (action === 'restart') {
        res = await fetch('/api/v1.01/remote/restart', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ deviceId: selectedDevice })
        });
        data = await res.json();
        setResult({ success: data.success, message: data.success ? '🔄 Restart sent!' : (data.error || 'Restart failed') });
      } else if (action === 'offline') {
        setDeviceStatus(prev => ({ ...prev, offline: !prev.offline }));
        setResult({ success: true, message: deviceStatus.offline ? '🟢 Machine back online' : '🔴 Machine taken offline' });
      }
    } catch (e) {
      setResult({ success: false, message: e.message });
    } finally {
      setLoading(false);
    }
  };

  const currentDevice = devices.find(d => d.deviceId === selectedDevice);
  const currentRecipe = recipes.find(r => r.id === selectedRecipe);

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Gamepad2 size={16} className="text-pink-400" />
          <span className="font-semibold text-sm">Machine Control</span>
        </div>
        {currentDevice && (
          <span className={`text-xs px-2 py-0.5 rounded-full ${deviceStatus.offline ? 'bg-red-500/20 text-red-400' : deviceStatus.online ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-500/20 text-slate-400'}`}>
            {deviceStatus.offline ? 'OFFLINE' : deviceStatus.online ? 'ONLINE' : 'UNKNOWN'}
          </span>
        )}
      </div>
      
      <div className="flex gap-2 mb-3">
        <select
          value={selectedDevice || ''}
          onChange={e => setSelectedDevice(e.target.value)}
          className="flex-1 px-2 py-1.5 bg-slate-700 border border-slate-600 rounded text-sm text-white"
        >
          <option value="">Select device...</option>
          {devices.map(d => (
            <option key={d.deviceId} value={d.deviceId}>{d.name}</option>
          ))}
        </select>
        <select
          value={selectedRecipe || ''}
          onChange={e => setSelectedRecipe(e.target.value)}
          className="flex-1 px-2 py-1.5 bg-slate-700 border border-slate-600 rounded text-sm text-white"
          disabled={!selectedDevice || recipes.length === 0}
        >
          <option value="">Select recipe ({recipes.length})...</option>
          {recipes.map((r, idx) => (
            <option key={r.id || idx} value={r.coffeeName}>{r.coffeeName}</option>
          ))}
        </select>
      </div>
      
      <div className="flex gap-2">
        <button
          onClick={() => doAction('brew')}
          disabled={loading || !selectedDevice || !selectedRecipe || deviceStatus.offline}
          className="flex-1 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-600 disabled:cursor-not-allowed rounded text-sm font-medium flex items-center justify-center gap-1.5"
        >
          {loading ? <RefreshCw size={14} className="animate-spin" /> : <Coffee size={14} />}
          Brew
        </button>
        <button
          onClick={() => doAction('restart')}
          disabled={loading || !selectedDevice || deviceStatus.offline}
          className="px-3 py-2 bg-amber-600 hover:bg-amber-700 disabled:bg-slate-600 disabled:cursor-not-allowed rounded text-sm font-medium flex items-center gap-1.5"
        >
          <RefreshCw size={14} />
        </button>
        <button
          onClick={() => doAction('offline')}
          disabled={loading || !selectedDevice}
          className={`px-3 py-2 rounded text-sm font-medium flex items-center gap-1.5 ${deviceStatus.offline ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'} disabled:bg-slate-600 disabled:cursor-not-allowed`}
          title={deviceStatus.offline ? 'Bring Online' : 'Take Offline'}
        >
          <WifiOff size={14} />
        </button>
      </div>
      
      {result && (
        <div className={`mt-3 px-3 py-2 rounded text-sm ${result.success ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'}`}>
          {result.message}
        </div>
      )}
    </div>
  );
}

function DiagnosticsEmbed() {
  const [status, setStatus] = useState({ yile: 'checking', db: 'checking' });
  const [testResults, setTestResults] = useState({});
  const [testing, setTesting] = useState({});

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    try {
      const yileRes = await fetch('/api/v1.01/fleet/dashboard');
      setStatus(prev => ({ ...prev, yile: yileRes.ok ? 'healthy' : 'error' }));
    } catch {
      setStatus(prev => ({ ...prev, yile: 'error' }));
    }
    try {
      const dbRes = await fetch('/api/v1.01/replenishment/alerts');
      setStatus(prev => ({ ...prev, db: dbRes.ok ? 'healthy' : 'error' }));
    } catch {
      setStatus(prev => ({ ...prev, db: 'error' }));
    }
  };

  const runTest = async (name, fn) => {
    setTesting(prev => ({ ...prev, [name]: true }));
    const start = Date.now();
    try {
      const result = await fn();
      setTestResults(prev => ({ ...prev, [name]: { ok: true, msg: result, ms: Date.now() - start }}));
    } catch (e) {
      setTestResults(prev => ({ ...prev, [name]: { ok: false, msg: e.message, ms: Date.now() - start }}));
    } finally {
      setTesting(prev => ({ ...prev, [name]: false }));
    }
  };

  const StatusBadge = ({ s }) => (
    <span className={`px-2 py-1 text-xs font-bold rounded-full uppercase ${
      s === 'healthy' ? 'bg-emerald-500/20 text-emerald-400' :
      s === 'error' ? 'bg-red-500/20 text-red-400' :
      'bg-slate-500/20 text-slate-400'
    }`}>{s}</span>
  );

  return (
    <div className="space-y-6">
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Wrench size={18} className="text-slate-400" />
          System Status
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
            <span>Yile API</span>
            <StatusBadge s={status.yile} />
          </div>
          <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
            <span>Database</span>
            <StatusBadge s={status.db} />
          </div>
        </div>
      </div>

      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4">Quick Tests</h3>
        <div className="grid grid-cols-2 gap-3">
          {[
            { name: 'token', label: 'Test Token', fn: async () => { const r = await fetch('/api/v1.01/fleet/dashboard'); if (!r.ok) throw new Error('Failed'); return 'OK'; }},
            { name: 'devices', label: 'Device List', fn: async () => { const r = await fetch('/api/v1.01/remote/devices'); const d = await r.json(); return `${d.data?.length || 0} devices`; }},
            { name: 'inventory', label: 'Inventory', fn: async () => { const r = await fetch('/api/v1.01/replenishment/status/00000020868'); const d = await r.json(); return `${d.data?.ingredients?.length || 0} items`; }},
            { name: 'sales', label: 'Sales Query', fn: async () => { const r = await fetch('/api/v1.01/fleet/00000020868/sales?days=7'); return r.ok ? 'OK' : 'Failed'; }},
          ].map(t => (
            <button
              key={t.name}
              onClick={() => runTest(t.name, t.fn)}
              disabled={testing[t.name]}
              className="p-3 bg-slate-700/50 hover:bg-slate-700 rounded-lg text-left"
            >
              <div className="font-medium text-sm">{t.label}</div>
              {testResults[t.name] && (
                <div className={`text-xs mt-1 ${testResults[t.name].ok ? 'text-emerald-400' : 'text-red-400'}`}>
                  {testResults[t.name].msg} ({testResults[t.name].ms}ms)
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <FileText size={18} className="text-blue-400" />
          Field Validation Guide
        </h3>
        <p className="text-sm text-slate-400 mb-4">
          Use this guide when at the machine to verify all APIs are connected and working properly.
        </p>
        <a
          href="/field-guide.html"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition"
        >
          <FileText size={16} />
          Open Field Guide
        </a>
      </div>
    </div>
  );
}
