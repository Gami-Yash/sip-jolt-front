import React, { useState, useEffect } from 'react';
import { Users, Plus, Edit2, Shield, Truck, Wrench, Eye, CheckCircle, AlertTriangle, X, Save, RefreshCw } from 'lucide-react';
import { ReliabilityBadge } from './ReliabilityBadge';

const ROLES = [
  { id: 'PARTNER_TECHNICIAN', label: 'Partner/Technician', icon: Wrench, color: 'blue' },
  { id: 'DRIVER', label: 'Driver', icon: Truck, color: 'green' },
  { id: 'OPS_MANAGER', label: 'Ops Manager', icon: Shield, color: 'purple' },
  { id: 'LANDLORD_VIEWER', label: 'Landlord (Read-only)', icon: Eye, color: 'gray' }
];

const getReliabilityBadgeColor = (score) => {
  if (score >= 95) return 'green';
  if (score >= 80) return 'yellow';
  return 'red';
};

export const AdminUserPanel = ({ onClose }) => {
  const [users, setUsers] = useState([]);
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [error, setError] = useState(null);
  
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    employeeCode: '',
    role: 'PARTNER_TECHNICIAN',
    assignedSites: []
  });

  useEffect(() => {
    fetchUsers();
    fetchSites();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/users', {
        headers: { 'x-user-role': 'ops_manager' }
      });
      const data = await response.json();
      setUsers(data.users || []);
    } catch (err) {
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const fetchSites = async () => {
    try {
      const response = await fetch('/api/ops/sites', {
        headers: { 'x-user-role': 'ops_manager' }
      });
      const data = await response.json();
      setSites(data.sites || []);
    } catch (err) {
      console.error('Failed to load sites:', err);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setError(null);
    
    try {
      const response = await fetch('/api/auth/admin/users', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-role': 'ops_manager'
        },
        body: JSON.stringify({
          name: newUser.name,
          email: newUser.email,
          employeeCode: newUser.employeeCode || undefined,
          role: newUser.role
        })
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to create user');
      }
      
      if (newUser.assignedSites.length > 0 && result.user) {
        for (const siteId of newUser.assignedSites) {
          await fetch('/api/admin/assign-site', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'x-user-role': 'ops_manager'
            },
            body: JSON.stringify({
              userId: result.user.id,
              siteId,
              role: newUser.role
            })
          });
        }
      }
      
      setNewUser({ name: '', email: '', employeeCode: '', role: 'PARTNER_TECHNICIAN', assignedSites: [] });
      setShowCreateForm(false);
      fetchUsers();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleUpdateRole = async (userId, newRole) => {
    try {
      await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-role': 'ops_manager'
        },
        body: JSON.stringify({ role: newRole })
      });
      fetchUsers();
    } catch (err) {
      setError('Failed to update role');
    }
  };

  const handleAssignSite = async (userId, siteId, action) => {
    try {
      await fetch(`/api/admin/${action}-site`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-role': 'ops_manager'
        },
        body: JSON.stringify({ userId, siteId })
      });
      fetchUsers();
    } catch (err) {
      setError(`Failed to ${action} site`);
    }
  };

  const getRoleConfig = (role) => {
    return ROLES.find(r => r.id === role) || ROLES[0];
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-gray-100 z-50 flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-100 z-50 overflow-auto">
      <div className="bg-purple-600 text-white p-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users size={24} />
            <span className="font-bold text-lg">User Management</span>
          </div>
          <button onClick={onClose} className="p-1">
            <X size={24} />
          </button>
        </div>
      </div>
      
      <div className="p-4 max-w-4xl mx-auto">
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-lg flex items-center gap-2 text-red-700">
            <AlertTriangle size={18} />
            <span>{error}</span>
            <button onClick={() => setError(null)} className="ml-auto">
              <X size={16} />
            </button>
          </div>
        )}
        
        <div className="bg-white rounded-xl border border-gray-200 mb-4">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="font-bold text-gray-900">All Users ({users.length})</h2>
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg font-medium"
            >
              <Plus size={18} />
              Add User
            </button>
          </div>
          
          {showCreateForm && (
            <form onSubmit={handleCreateUser} className="p-4 bg-purple-50 border-b border-purple-200">
              <h3 className="font-bold text-purple-900 mb-3">Create New User</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input
                    type="text"
                    value={newUser.name}
                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Employee Code</label>
                  <input
                    type="text"
                    value={newUser.employeeCode}
                    onChange={(e) => setNewUser({ ...newUser, employeeCode: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="Auto-generated if empty"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    {ROLES.map(role => (
                      <option key={role.id} value={role.id}>{role.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              {newUser.role === 'TECHNICIAN' && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Assign Sites</label>
                  <div className="flex flex-wrap gap-2">
                    {sites.map(site => (
                      <label key={site.site_id} className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border">
                        <input
                          type="checkbox"
                          checked={newUser.assignedSites.includes(site.site_id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewUser({ ...newUser, assignedSites: [...newUser.assignedSites, site.site_id] });
                            } else {
                              setNewUser({ ...newUser, assignedSites: newUser.assignedSites.filter(s => s !== site.site_id) });
                            }
                          }}
                        />
                        <span className="text-sm">{site.venue_name || site.site_id}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="mt-4 flex gap-2">
                <button
                  type="submit"
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg font-medium"
                >
                  <Save size={16} />
                  Create User
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
          
          <div className="divide-y divide-gray-100">
            {users.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Users size={48} className="mx-auto mb-3 opacity-50" />
                <p>No users found</p>
              </div>
            ) : (
              users.map(user => {
                const roleConfig = getRoleConfig(user.role);
                const RoleIcon = roleConfig.icon;
                const badgeColor = getReliabilityBadgeColor(user.reliability_score || 100);
                
                return (
                  <div key={user.id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg bg-${roleConfig.color}-100`}>
                          <RoleIcon size={20} className={`text-${roleConfig.color}-600`} />
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900">{user.name}</h3>
                          <p className="text-sm text-gray-500">{user.email || user.employee_code}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium bg-${roleConfig.color}-100 text-${roleConfig.color}-700`}>
                              {roleConfig.label}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              badgeColor === 'green' ? 'bg-green-100 text-green-700' :
                              badgeColor === 'yellow' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {(user.reliability_score || 100).toFixed(0)}% Reliable
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <select
                          value={user.role || 'TECHNICIAN'}
                          onChange={(e) => handleUpdateRole(user.id, e.target.value)}
                          className="text-sm border rounded-lg px-2 py-1"
                        >
                          {ROLES.map(role => (
                            <option key={role.id} value={role.id}>{role.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    
                    {user.site_assignments && user.site_assignments.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className="text-xs text-gray-500">Sites:</span>
                        {user.site_assignments.map(site => (
                          <span key={site} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                            {site}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
        
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="font-bold text-gray-900 mb-3">Role Permissions</h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
              <Wrench size={20} className="text-blue-600 mt-0.5" />
              <div>
                <div className="font-bold text-blue-900">Technician</div>
                <p className="text-blue-700">Access to Refill Wizard, Weekly Visit, and Site Details for assigned sites only.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
              <Truck size={20} className="text-green-600 mt-0.5" />
              <div>
                <div className="font-bold text-green-900">Driver</div>
                <p className="text-green-700">Access to Route Planner and POD Capture only.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg">
              <Shield size={20} className="text-purple-600 mt-0.5" />
              <div>
                <div className="font-bold text-purple-900">Ops Manager</div>
                <p className="text-purple-700">Full read/write access to all Sites, Shipments, and User data.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <Eye size={20} className="text-gray-600 mt-0.5" />
              <div>
                <div className="font-bold text-gray-900">Landlord Viewer</div>
                <p className="text-gray-700">Read-only access to specific dashboards. No visibility into other landlords' data.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminUserPanel;
