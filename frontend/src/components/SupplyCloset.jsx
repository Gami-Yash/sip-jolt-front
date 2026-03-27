import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Building2, Package, Truck, AlertTriangle, CheckCircle, 
  Camera, Clock, Calendar, ChevronRight, MapPin, Phone, User, Box,
  RefreshCw, Settings, FileText, XCircle, ShoppingBag, Layers, ClipboardCheck,
  LogOut, X, Home, Bell, Upload, AlertCircle, Droplets, Shield, Trophy
} from 'lucide-react';
import OpsManagerPerfectionDashboard from './ops/OpsManagerPerfectionDashboard';

const API_BASE = '/api/ops';

const fetchWithRole = async (url, userId, userName, role) => {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      'X-User-Id': userId,
      'X-User-Name': userName,
      'X-User-Role': role
    }
  });
  return response.json();
};

const postWithRole = async (url, userId, userName, role, data) => {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-User-Id': userId,
      'X-User-Name': userName,
      'X-User-Role': role
    },
    body: JSON.stringify(data)
  });
  return response.json();
};

const RoleSelectorScreen = ({ onSelectRole, onClose }) => {
  const roles = [
    { id: 'partner', label: 'Partner', icon: Building2, color: 'bg-blue-600', desc: 'Site owners who manage supply closets' },
    { id: 'driver', label: 'Driver', icon: Truck, color: 'bg-green-600', desc: 'Delivery drivers with POD capture' },
    { id: 'ops_manager', label: 'Ops Manager', icon: Settings, color: 'bg-purple-600', desc: 'Full access to all sites and tools' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-teal-600 pt-12 pb-6 px-4">
        <div className="flex items-center justify-between">
          <button 
            onClick={onClose}
            className="flex items-center gap-2 text-white/90 hover:text-white font-medium"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to App</span>
          </button>
        </div>
        <h1 className="text-xl font-bold text-white mt-4">Supply Closet Ops</h1>
        <p className="text-teal-100 text-sm">Select your role to continue</p>
      </div>

      <div className="p-4 max-w-md mx-auto">
        <div className="space-y-4">
          {roles.map(role => (
            <button
              key={role.id}
              onClick={() => onSelectRole(role.id)}
              className="w-full bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center gap-4 hover:border-teal-300 transition-all active:scale-98"
            >
              <div className={`w-12 h-12 ${role.color} rounded-xl flex items-center justify-center`}>
                <role.icon className="w-6 h-6 text-white" />
              </div>
              <div className="text-left flex-1">
                <h3 className="font-bold text-gray-900">{role.label}</h3>
                <p className="text-sm text-gray-500">{role.desc}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

const PartnerHome = ({ user, sites, onSelectSite, onRefresh, loading, onClose, onChangeRole }) => {
  const assignedSites = sites.filter(s => s.status === 'ready');
  const pendingSetupSites = sites.filter(s => s.status === 'pending_setup');

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-blue-600 pt-12 pb-6 px-4">
        <div className="flex items-center justify-between mb-3">
          <button 
            onClick={onClose}
            className="flex items-center gap-2 text-white/90 hover:text-white font-medium text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Exit
          </button>
          <button 
            onClick={onChangeRole}
            className="flex items-center gap-2 text-white/90 hover:text-white font-medium text-sm bg-white/20 px-3 py-1.5 rounded-full"
          >
            <LogOut className="w-4 h-4" />
            Change Role
          </button>
        </div>
        <h1 className="text-xl font-bold text-white mb-1">Welcome, {user.name}</h1>
        <p className="text-blue-100 text-sm">Partner Dashboard</p>
      </div>

      <div className="p-4 space-y-4">
        {pendingSetupSites.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
            <div className="flex items-center gap-3 mb-3">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              <span className="font-bold text-amber-800">Setup Required</span>
            </div>
            {pendingSetupSites.map(site => (
              <button
                key={site.site_id}
                onClick={() => onSelectSite(site, 'setup')}
                className="w-full bg-white rounded-xl p-4 flex items-center gap-3 mt-2 border border-amber-200"
              >
                <Building2 className="w-5 h-5 text-amber-600" />
                <div className="text-left flex-1">
                  <p className="font-medium text-gray-900">{site.venue_name}</p>
                  <p className="text-xs text-amber-600">Complete Day-1 setup</p>
                </div>
                <ChevronRight className="w-5 h-5 text-amber-400" />
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Your Sites</h2>
          <button 
            onClick={onRefresh}
            className="p-2 rounded-lg hover:bg-gray-100"
            disabled={loading}
          >
            <RefreshCw className={`w-5 h-5 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {assignedSites.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center">
            <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No active sites assigned yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {assignedSites.map(site => (
              <button
                key={site.site_id}
                onClick={() => onSelectSite(site, 'weekly')}
                className="w-full bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-4"
              >
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-blue-600" />
                </div>
                <div className="text-left flex-1">
                  <h3 className="font-bold text-gray-900">{site.venue_name}</h3>
                  <p className="text-sm text-gray-500 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {site.address}
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const PartnerSiteDetail = ({ site, task, deliveries, onBack, onStartWeekly, onAcceptDelivery, onRefuseDelivery }) => {
  const [activeTab, setActiveTab] = useState('weekly');
  
  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-blue-600 pt-12 pb-4 px-4 flex items-center gap-3">
        <button onClick={onBack} className="p-2 -ml-2 rounded-lg hover:bg-blue-500">
          <ArrowLeft className="w-6 h-6 text-white" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-white">{site.venue_name}</h1>
          <p className="text-blue-100 text-sm">{site.address}</p>
        </div>
      </div>

      <div className="flex bg-white border-b">
        <button 
          onClick={() => setActiveTab('weekly')}
          className={`flex-1 py-3 text-sm font-medium ${activeTab === 'weekly' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
        >
          Weekly Task
        </button>
        <button 
          onClick={() => setActiveTab('deliveries')}
          className={`flex-1 py-3 text-sm font-medium relative ${activeTab === 'deliveries' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
        >
          Deliveries
          {deliveries.length > 0 && (
            <span className="absolute top-2 right-4 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
              {deliveries.length}
            </span>
          )}
        </button>
      </div>

      <div className="p-4">
        {activeTab === 'weekly' && (
          <div>
            {task ? (
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${task.status === 'pending' ? 'bg-amber-100' : 'bg-blue-100'}`}>
                    <Clock className={`w-5 h-5 ${task.status === 'pending' ? 'text-amber-600' : 'text-blue-600'}`} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">Weekly Refill & Clean</h3>
                    <p className="text-sm text-gray-500">Due: {new Date(task.due_date).toLocaleDateString()}</p>
                  </div>
                </div>
                <button
                  onClick={() => onStartWeekly(task)}
                  className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl"
                >
                  {task.status === 'in_progress' ? 'Continue Task' : 'Start Weekly Task'}
                </button>
              </div>
            ) : (
              <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-center">
                <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-3" />
                <h3 className="font-bold text-green-800 mb-1">All Caught Up!</h3>
                <p className="text-sm text-green-600">No pending weekly tasks</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'deliveries' && (
          <div>
            {deliveries.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center">
                <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No pending deliveries</p>
              </div>
            ) : (
              <div className="space-y-3">
                {deliveries.map(del => (
                  <div key={del.delivery_id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3 mb-3">
                      <Truck className="w-5 h-5 text-green-600" />
                      <span className="font-medium">Delivered {new Date(del.delivered_at).toLocaleDateString()}</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => onAcceptDelivery(del)}
                        className="flex-1 py-2 bg-green-600 text-white font-medium rounded-lg text-sm"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => onRefuseDelivery(del)}
                        className="flex-1 py-2 bg-red-100 text-red-600 font-medium rounded-lg text-sm"
                      >
                        Refuse
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const DriverHome = ({ user, shipments, onSelectShipment, onRefresh, loading, onClose, onChangeRole }) => {
  const pendingDeliveries = shipments.filter(s => s.status === 'shipped');

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-green-600 pt-12 pb-6 px-4">
        <div className="flex items-center justify-between mb-3">
          <button 
            onClick={onClose}
            className="flex items-center gap-2 text-white/90 hover:text-white font-medium text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Exit
          </button>
          <button 
            onClick={onChangeRole}
            className="flex items-center gap-2 text-white/90 hover:text-white font-medium text-sm bg-white/20 px-3 py-1.5 rounded-full"
          >
            <LogOut className="w-4 h-4" />
            Change Role
          </button>
        </div>
        <h1 className="text-xl font-bold text-white mb-1">Welcome, {user.name}</h1>
        <p className="text-green-100 text-sm">Driver Dashboard</p>
      </div>

      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Pending Deliveries</h2>
          <button 
            onClick={onRefresh}
            className="p-2 rounded-lg hover:bg-gray-100"
            disabled={loading}
          >
            <RefreshCw className={`w-5 h-5 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {pendingDeliveries.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center">
            <Truck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No pending deliveries</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingDeliveries.map(shipment => (
              <button
                key={shipment.shipment_id}
                onClick={() => onSelectShipment(shipment)}
                className="w-full bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-4"
              >
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <Package className="w-6 h-6 text-green-600" />
                </div>
                <div className="text-left flex-1">
                  <h3 className="font-bold text-gray-900">{shipment.venue_name}</h3>
                  <p className="text-sm text-gray-500">{shipment.total_boxes} boxes</p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const DriverPODFlow = ({ shipment, user, onComplete, onCancel }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    closetPhotos: [],
    accessDenied: false,
    siteFailMessy: false,
    wetLeakSeen: false,
    notes: '',
    trackingNumber: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const handlePhotoUpload = () => {
    const url = prompt('Enter photo URL (simulated upload):');
    if (url) {
      setFormData(prev => ({ ...prev, closetPhotos: [...prev.closetPhotos, url] }));
    }
  };

  const handleSubmit = async () => {
    if (formData.closetPhotos.length === 0) {
      alert('At least one closet photo is required');
      return;
    }
    
    if (shipment.carrier_type === 'ups' && !formData.trackingNumber) {
      alert('Tracking number is required for UPS deliveries');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`${API_BASE}/deliveries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': user.id,
          'X-User-Name': user.name,
          'X-User-Role': 'driver'
        },
        body: JSON.stringify({
          shipmentId: shipment.shipment_id,
          siteId: shipment.site_id,
          carrierType: shipment.carrier_type || 'milk_run',
          trackingNumber: formData.trackingNumber || null,
          closetPhotos: formData.closetPhotos,
          flags: {
            accessDenied: formData.accessDenied,
            siteFailMessy: formData.siteFailMessy,
            wetLeakSeen: formData.wetLeakSeen
          },
          notes: formData.notes
        })
      });

      if (response.ok) {
        alert('Proof of Delivery recorded successfully!');
        onComplete();
      } else {
        const err = await response.json();
        alert(err.error || 'Failed to submit POD');
      }
    } catch (error) {
      console.error('POD submission error:', error);
      alert('Failed to submit POD');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-green-600 pt-12 pb-6 px-4">
        <div className="flex items-center gap-3">
          <button onClick={onCancel} className="p-2 -ml-2 rounded-lg hover:bg-green-500">
            <ArrowLeft className="w-6 h-6 text-white" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white">Proof of Delivery</h1>
            <p className="text-green-100 text-sm">{shipment.venue_name}</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <Package className="w-6 h-6 text-green-600" />
            <div>
              <h3 className="font-bold text-gray-900">{shipment.shipment_id}</h3>
              <p className="text-sm text-gray-500">{shipment.total_boxes} boxes · {shipment.shipment_type}</p>
            </div>
          </div>
          
          {shipment.carrier_type === 'ups' && (
            <div className="mb-4">
              <label className="text-sm font-medium text-gray-700 mb-1 block">UPS Tracking Number *</label>
              <input
                type="text"
                value={formData.trackingNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, trackingNumber: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl"
                placeholder="Enter UPS tracking number"
              />
            </div>
          )}

          <div className="border-t border-gray-100 pt-4">
            <h4 className="font-medium text-gray-900 mb-3">Closet Placement Photos *</h4>
            <div className="flex flex-wrap gap-2 mb-3">
              {formData.closetPhotos.map((photo, idx) => (
                <div key={idx} className="w-20 h-20 bg-green-100 rounded-xl flex items-center justify-center text-green-600 text-xs">
                  Photo {idx + 1}
                </div>
              ))}
              <button
                onClick={handlePhotoUpload}
                className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center text-gray-400 hover:border-green-400 hover:text-green-500"
              >
                <Camera className="w-6 h-6" />
                <span className="text-xs mt-1">Add</span>
              </button>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-4 space-y-3">
            <h4 className="font-medium text-gray-900 mb-2">Issue Flags (if any)</h4>
            
            <label className="flex items-center gap-3 p-3 bg-red-50 rounded-xl border border-red-100 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.accessDenied}
                onChange={(e) => setFormData(prev => ({ ...prev, accessDenied: e.target.checked }))}
                className="w-5 h-5 text-red-600"
              />
              <div className="flex-1">
                <span className="font-medium text-red-700">Access Denied</span>
                <p className="text-xs text-red-600">Could not access the closet</p>
              </div>
              <Shield className="w-5 h-5 text-red-400" />
            </label>

            <label className="flex items-center gap-3 p-3 bg-amber-50 rounded-xl border border-amber-100 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.siteFailMessy}
                onChange={(e) => setFormData(prev => ({ ...prev, siteFailMessy: e.target.checked }))}
                className="w-5 h-5 text-amber-600"
              />
              <div className="flex-1">
                <span className="font-medium text-amber-700">SITE FAIL - Disorganized</span>
                <p className="text-xs text-amber-600">Closet is messy/disorganized</p>
              </div>
              <AlertTriangle className="w-5 h-5 text-amber-400" />
            </label>

            <label className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl border border-blue-100 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.wetLeakSeen}
                onChange={(e) => setFormData(prev => ({ ...prev, wetLeakSeen: e.target.checked }))}
                className="w-5 h-5 text-blue-600"
              />
              <div className="flex-1">
                <span className="font-medium text-blue-700">Wet/Leak Observed</span>
                <p className="text-xs text-blue-600">Partner must refuse delivery</p>
              </div>
              <Droplets className="w-5 h-5 text-blue-400" />
            </label>
          </div>

          <div className="border-t border-gray-100 pt-4 mt-4">
            <label className="text-sm font-medium text-gray-700 mb-1 block">Notes (optional)</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl"
              rows={3}
              placeholder="Any additional notes..."
            />
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={submitting || formData.closetPhotos.length === 0}
          className={`w-full py-4 rounded-2xl font-bold text-lg ${
            submitting || formData.closetPhotos.length === 0 
              ? 'bg-gray-300 text-gray-500' 
              : 'bg-green-600 text-white'
          }`}
        >
          {submitting ? 'Submitting...' : 'Submit Proof of Delivery'}
        </button>
      </div>
    </div>
  );
};

const DeliveryRefusalModal = ({ delivery, onRefuse, onCancel }) => {
  const [reason, setReason] = useState('');
  const [photo, setPhoto] = useState('');
  const [notes, setNotes] = useState('');

  const reasons = [
    { id: 'box_leaking_external', label: 'Box Leaking (External)', icon: Droplets, critical: false, safeMode: false, description: 'Box damaged during shipping - machine unaffected' },
    { id: 'machine_leaking_internal', label: 'Machine Leaking (Internal)', icon: Droplets, critical: true, safeMode: true, description: 'Internal leak detected - machine must be disabled' },
    { id: 'damaged', label: 'Damaged', icon: AlertCircle, critical: false, safeMode: false },
    { id: 'missing_box', label: 'Missing Box', icon: Package, critical: false, safeMode: false },
    { id: 'wrong_items', label: 'Wrong Items', icon: XCircle, critical: false, safeMode: false },
    { id: 'other', label: 'Other', icon: FileText, critical: false, safeMode: false }
  ];

  const handlePhotoUpload = () => {
    const url = prompt('Enter photo URL (simulated upload):');
    if (url) setPhoto(url);
  };

  const handleSubmit = () => {
    if (!reason) {
      alert('Please select a reason');
      return;
    }
    if (!photo) {
      alert('Photo evidence is required for all refusals');
      return;
    }
    if (reason === 'other' && !notes) {
      alert('Notes are required when selecting "Other"');
      return;
    }
    const selectedReason = reasons.find(r => r.id === reason);
    const triggerSafeMode = selectedReason?.safeMode === true;
    const incidentType = triggerSafeMode ? 'WET_LEAK_CRITICAL' : 'SUPPLY_CRITICAL';
    onRefuse({ reason, photo, notes, triggerSafeMode, incidentType });
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-bold text-lg text-gray-900">Refuse Delivery</h2>
          <button onClick={onCancel} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {delivery.wet_leak_flagged && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <div>
                <p className="font-medium text-red-800">Wet/Leak Flagged by Driver</p>
                <p className="text-sm text-red-600">You must refuse this delivery</p>
              </div>
            </div>
          )}

          <div>
            <h3 className="font-medium text-gray-900 mb-2">Reason *</h3>
            <div className="space-y-2">
              {reasons.map(r => (
                <label
                  key={r.id}
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    reason === r.id 
                      ? r.critical ? 'bg-red-50 border-red-300' : 'bg-blue-50 border-blue-300'
                      : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="reason"
                    value={r.id}
                    checked={reason === r.id}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-4 h-4"
                  />
                  <r.icon className={`w-5 h-5 ${r.critical ? 'text-red-500' : 'text-gray-500'}`} />
                  <div className="flex-1">
                    <span className={`font-medium ${r.critical ? 'text-red-700' : 'text-gray-700'}`}>{r.label}</span>
                    {r.description && <p className="text-xs text-gray-500 mt-0.5">{r.description}</p>}
                  </div>
                  {r.safeMode && <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">SAFE MODE</span>}
                  {!r.safeMode && r.id.includes('leak') && <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">Reship</span>}
                </label>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-medium text-gray-900 mb-2">Photo Evidence *</h3>
            {photo ? (
              <div className="bg-green-50 rounded-xl p-3 flex items-center gap-3">
                <Camera className="w-6 h-6 text-green-600" />
                <span className="text-green-700 flex-1">Photo uploaded</span>
                <button onClick={() => setPhoto('')} className="text-red-500 text-sm">Remove</button>
              </div>
            ) : (
              <button
                onClick={handlePhotoUpload}
                className="w-full py-4 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center text-gray-500 hover:border-blue-400 hover:text-blue-500"
              >
                <Camera className="w-8 h-8 mb-2" />
                <span>Tap to add photo</span>
              </button>
            )}
          </div>

          {reason === 'other' && (
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Notes *</h3>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl"
                rows={3}
                placeholder="Describe the issue..."
              />
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-100 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 bg-gray-100 text-gray-700 font-medium rounded-xl"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 py-3 bg-red-600 text-white font-medium rounded-xl"
          >
            Confirm Refusal
          </button>
        </div>
      </div>
    </div>
  );
};

const OpsManagerHome = ({ stats, incidents, tasks, onViewIncidents, onViewSites, onViewShipments, onViewPerfection, onRefresh, loading, onClose, onChangeRole }) => {
  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-purple-600 pt-12 pb-6 px-4">
        <div className="flex items-center justify-between mb-3">
          <button 
            onClick={onClose}
            className="flex items-center gap-2 text-white/90 hover:text-white font-medium text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Exit
          </button>
          <button 
            onClick={onChangeRole}
            className="flex items-center gap-2 text-white/90 hover:text-white font-medium text-sm bg-white/20 px-3 py-1.5 rounded-full"
          >
            <LogOut className="w-4 h-4" />
            Change Role
          </button>
        </div>
        <h1 className="text-xl font-bold text-white mb-1">Ops Dashboard</h1>
        <p className="text-purple-100 text-sm">Supply Closet Operations</p>
      </div>

      <div className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <p className="text-2xl font-bold text-gray-900">{stats?.totalSites || 0}</p>
            <p className="text-sm text-gray-500">Total Sites</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <p className="text-2xl font-bold text-amber-600">{stats?.openIncidents || 0}</p>
            <p className="text-sm text-gray-500">Open Incidents</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <p className="text-2xl font-bold text-blue-600">{stats?.pendingTasks || 0}</p>
            <p className="text-sm text-gray-500">Pending Tasks</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <p className="text-2xl font-bold text-red-600">{stats?.criticalIncidents || 0}</p>
            <p className="text-sm text-gray-500">Critical</p>
          </div>
        </div>

        <div className="flex items-center justify-between mt-6">
          <h2 className="text-lg font-bold text-gray-900">Quick Actions</h2>
          <button 
            onClick={onRefresh}
            className="p-2 rounded-lg hover:bg-gray-100"
            disabled={loading}
          >
            <RefreshCw className={`w-5 h-5 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="grid grid-cols-4 gap-3">
          <button onClick={onViewSites} className="bg-white rounded-2xl p-4 shadow-sm text-center">
            <Building2 className="w-6 h-6 text-blue-600 mx-auto mb-2" />
            <p className="text-sm font-medium">Sites</p>
          </button>
          <button onClick={onViewIncidents} className="bg-white rounded-2xl p-4 shadow-sm text-center">
            <AlertTriangle className="w-6 h-6 text-amber-600 mx-auto mb-2" />
            <p className="text-sm font-medium">Incidents</p>
          </button>
          <button onClick={onViewShipments} className="bg-white rounded-2xl p-4 shadow-sm text-center">
            <Truck className="w-6 h-6 text-green-600 mx-auto mb-2" />
            <p className="text-sm font-medium">Shipments</p>
          </button>
          <button onClick={onViewPerfection} className="bg-white rounded-2xl p-4 shadow-sm text-center">
            <Trophy className="w-6 h-6 text-purple-600 mx-auto mb-2" />
            <p className="text-sm font-medium">Perfection</p>
          </button>
        </div>

        {incidents && incidents.length > 0 && (
          <div className="mt-6">
            <h3 className="font-bold text-gray-900 mb-3">Recent Incidents</h3>
            <div className="space-y-2">
              {incidents.slice(0, 3).map(inc => (
                <div key={inc.incident_id} className={`bg-white rounded-xl p-3 border-l-4 ${
                  inc.severity === 'critical' ? 'border-red-500' : 
                  inc.severity === 'high' ? 'border-amber-500' : 'border-blue-500'
                }`}>
                  <p className="font-medium text-gray-900 text-sm">{inc.title}</p>
                  <p className="text-xs text-gray-500">{inc.venue_name}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const QRVerificationPage = ({ boxId, onClose }) => {
  const [boxData, setBoxData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBoxDetails = async () => {
      try {
        const response = await fetch(`${API_BASE}/boxes/${boxId}/verify`);
        if (!response.ok) throw new Error('Box not found');
        const data = await response.json();
        setBoxData(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchBoxDetails();
  }, [boxId]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'packed': return 'bg-amber-100 text-amber-700';
      case 'labeled': return 'bg-blue-100 text-blue-700';
      case 'shipped': return 'bg-purple-100 text-purple-700';
      case 'delivered': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Verifying box...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center shadow-lg">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Box Not Found</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={onClose}
            className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-medium"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-br from-teal-600 to-teal-700 pt-10 pb-8 px-4">
        <button
          onClick={onClose}
          className="flex items-center gap-2 text-white/90 hover:text-white font-medium mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
            <CheckCircle className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Box Verified</h1>
            <p className="text-teal-100 text-sm">QR Code Scan Successful</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900">Box Details</h2>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(boxData.status)}`}>
              {boxData.status?.charAt(0).toUpperCase() + boxData.status?.slice(1)}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-500 uppercase mb-1">Box ID</p>
              <p className="font-bold text-gray-900">{boxData.boxId}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-500 uppercase mb-1">Box Type</p>
              <p className="font-bold text-gray-900">{boxData.boxType || 'Standard'}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-500 uppercase mb-1">Weight</p>
              <p className="font-bold text-gray-900">{boxData.weight || '--'} lb</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-500 uppercase mb-1">Pack Date</p>
              <p className="font-bold text-gray-900">{boxData.packDate ? new Date(boxData.packDate).toLocaleDateString() : '--'}</p>
            </div>
          </div>
        </div>

        {boxData.isOverweight && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-amber-800">Heavy Box Warning</p>
              <p className="text-sm text-amber-700">This box weighs over 46.5 lb - use proper lifting technique</p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-3">Shipment Info</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Building2 className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Destination</p>
                <p className="font-medium text-gray-900">{boxData.siteName || 'Unknown Site'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Package className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Shipment ID</p>
                <p className="font-medium text-gray-900">{boxData.shipmentId || '--'}</p>
              </div>
            </div>
            {boxData.shipmentStatus && (
              <div className="flex items-center gap-3">
                <Truck className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Shipment Status</p>
                  <p className="font-medium text-gray-900">{boxData.shipmentStatus}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {boxData.contents && boxData.contents.length > 0 && (
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-3">Contents</h3>
            <div className="space-y-2">
              {boxData.contents.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <span className="text-gray-700">{item.name}</span>
                  <span className="text-gray-500">{item.quantity} × {item.unit}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-blue-600" />
            <div>
              <p className="font-medium text-blue-800">Authenticity Verified</p>
              <p className="text-sm text-blue-700">This box is tracked by JOLT Supply Chain</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const BottomNav = ({ role, activeView, onChangeView }) => {
  const navItems = role === 'partner' ? [
    { id: 'home', icon: Building2, label: 'Sites' },
    { id: 'tasks', icon: ClipboardCheck, label: 'Tasks' },
    { id: 'deliveries', icon: Package, label: 'Deliveries' }
  ] : role === 'driver' ? [
    { id: 'home', icon: Truck, label: 'Deliveries' },
    { id: 'history', icon: FileText, label: 'History' }
  ] : [
    { id: 'home', icon: Layers, label: 'Dashboard' },
    { id: 'sites', icon: Building2, label: 'Sites' },
    { id: 'incidents', icon: AlertTriangle, label: 'Incidents' },
    { id: 'shipments', icon: Truck, label: 'Shipments' }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-area-pb">
      <div className="flex justify-around py-2">
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => onChangeView(item.id)}
            className={`flex flex-col items-center py-2 px-4 ${
              activeView === item.id ? 'text-blue-600' : 'text-gray-400'
            }`}
          >
            <item.icon className="w-6 h-6" />
            <span className="text-xs mt-1">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export const SupplyClosetApp = ({ onClose }) => {
  const [role, setRole] = useState(null);
  const [user, setUser] = useState({ id: '', name: '' });
  const [activeView, setActiveView] = useState('home');
  const [loading, setLoading] = useState(false);
  
  const [sites, setSites] = useState([]);
  const [shipments, setShipments] = useState([]);
  const [stats, setStats] = useState(null);
  const [incidents, setIncidents] = useState([]);
  const [selectedSite, setSelectedSite] = useState(null);
  const [pendingTask, setPendingTask] = useState(null);
  const [pendingDeliveries, setPendingDeliveries] = useState([]);
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [showPODFlow, setShowPODFlow] = useState(false);
  const [showRefusalModal, setShowRefusalModal] = useState(false);
  const [selectedDeliveryForRefusal, setSelectedDeliveryForRefusal] = useState(null);

  const loadPartnerData = async () => {
    setLoading(true);
    try {
      const data = await fetchWithRole(`${API_BASE}/sites`, user.id, user.name, 'partner');
      setSites(data.sites || []);
    } catch (error) {
      console.error('Failed to load partner data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDriverData = async () => {
    setLoading(true);
    try {
      const data = await fetchWithRole(`${API_BASE}/shipments?status=shipped`, user.id, user.name, 'driver');
      setShipments(data.shipments || []);
    } catch (error) {
      console.error('Failed to load driver data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadOpsData = async () => {
    setLoading(true);
    try {
      const data = await fetchWithRole(`${API_BASE}/dashboard/stats`, user.id, user.name, 'ops_manager');
      setStats(data.stats || {});
      setIncidents(data.openIncidents || []);
    } catch (error) {
      console.error('Failed to load ops data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectRole = (selectedRole) => {
    const mockUser = {
      partner: { id: 'partner-001', name: 'Site Partner' },
      driver: { id: 'driver-001', name: 'Delivery Driver' },
      ops_manager: { id: 'ops-001', name: 'Ops Manager' }
    };
    setRole(selectedRole);
    setUser(mockUser[selectedRole]);
  };

  useEffect(() => {
    if (!role || !user.id) return;
    
    if (role === 'partner') {
      loadPartnerData();
    } else if (role === 'driver') {
      loadDriverData();
    } else if (role === 'ops_manager') {
      loadOpsData();
    }
  }, [role, user.id]);

  const handleSelectSite = async (site, mode) => {
    setSelectedSite(site);
    
    if (mode === 'weekly') {
      try {
        const taskData = await fetchWithRole(`${API_BASE}/sites/${site.site_id}/pending-task`, user.id, user.name, role);
        setPendingTask(taskData.task);
        
        const delData = await fetchWithRole(`${API_BASE}/deliveries?siteId=${site.site_id}`, user.id, user.name, role);
        setPendingDeliveries(delData.deliveries || []);
      } catch (error) {
        console.error('Failed to load site details:', error);
      }
    }
    
    setActiveView('site-detail');
  };

  const handleBack = () => {
    setSelectedSite(null);
    setPendingTask(null);
    setPendingDeliveries([]);
    setActiveView('home');
  };

  const handleStartWeekly = (task) => {
    alert('Weekly wizard will open here - Coming soon!');
  };

  const handleAcceptDelivery = async (delivery) => {
    try {
      await postWithRole(`${API_BASE}/deliveries/${delivery.delivery_id}/accept`, user.id, user.name, role, {});
      setPendingDeliveries(prev => prev.filter(d => d.delivery_id !== delivery.delivery_id));
      alert('Delivery accepted!');
    } catch (error) {
      console.error('Failed to accept delivery:', error);
      alert('Failed to accept delivery');
    }
  };

  const handleRefuseDelivery = (delivery) => {
    setSelectedDeliveryForRefusal(delivery);
    setShowRefusalModal(true);
  };

  const handleConfirmRefusal = async ({ reason, photo, notes }) => {
    if (!selectedDeliveryForRefusal) return;
    
    try {
      await postWithRole(`${API_BASE}/deliveries/${selectedDeliveryForRefusal.delivery_id}/refuse`, user.id, user.name, role, { 
        reason,
        photo,
        notes
      });
      setPendingDeliveries(prev => prev.filter(d => d.delivery_id !== selectedDeliveryForRefusal.delivery_id));
      setShowRefusalModal(false);
      setSelectedDeliveryForRefusal(null);
      alert('Delivery refused. Incident created.');
    } catch (error) {
      console.error('Failed to refuse delivery:', error);
      alert('Failed to refuse delivery');
    }
  };

  const handleSelectShipment = (shipment) => {
    setSelectedShipment(shipment);
    setShowPODFlow(true);
  };

  const handlePODComplete = () => {
    setShowPODFlow(false);
    setSelectedShipment(null);
    loadDriverData();
  };

  const handleChangeRole = () => {
    setRole(null);
    setUser({ id: '', name: '' });
    setActiveView('home');
    setSites([]);
    setShipments([]);
    setStats(null);
    setIncidents([]);
    setSelectedSite(null);
    setPendingTask(null);
    setPendingDeliveries([]);
  };

  if (!role) {
    return (
      <div className="fixed inset-0 bg-white z-50 overflow-auto">
        <RoleSelectorScreen onSelectRole={handleSelectRole} onClose={onClose} />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-white z-50 overflow-auto">
      {role === 'partner' && activeView === 'home' && (
        <PartnerHome 
          user={user}
          sites={sites}
          onSelectSite={handleSelectSite}
          onRefresh={loadPartnerData}
          loading={loading}
          onClose={onClose}
          onChangeRole={handleChangeRole}
        />
      )}

      {role === 'partner' && activeView === 'site-detail' && selectedSite && (
        <PartnerSiteDetail
          site={selectedSite}
          task={pendingTask}
          deliveries={pendingDeliveries}
          onBack={handleBack}
          onStartWeekly={handleStartWeekly}
          onAcceptDelivery={handleAcceptDelivery}
          onRefuseDelivery={handleRefuseDelivery}
        />
      )}

      {role === 'driver' && activeView === 'home' && !showPODFlow && (
        <DriverHome
          user={user}
          shipments={shipments}
          onSelectShipment={handleSelectShipment}
          onRefresh={loadDriverData}
          loading={loading}
          onClose={onClose}
          onChangeRole={handleChangeRole}
        />
      )}

      {role === 'driver' && showPODFlow && selectedShipment && (
        <DriverPODFlow
          shipment={selectedShipment}
          user={user}
          onComplete={handlePODComplete}
          onCancel={() => { setShowPODFlow(false); setSelectedShipment(null); }}
        />
      )}

      {role === 'ops_manager' && activeView === 'home' && (
        <OpsManagerHome
          stats={stats}
          incidents={incidents}
          onViewIncidents={() => setActiveView('incidents')}
          onViewSites={() => setActiveView('sites')}
          onViewShipments={() => setActiveView('shipments')}
          onViewPerfection={() => setActiveView('perfection')}
          onRefresh={loadOpsData}
          loading={loading}
          onClose={onClose}
          onChangeRole={handleChangeRole}
        />
      )}

      {role === 'ops_manager' && activeView === 'perfection' && (
        <div className="min-h-screen bg-gray-50 pb-24">
          <div className="bg-purple-600 pt-12 pb-6 px-4">
            <button 
              onClick={() => setActiveView('home')}
              className="flex items-center gap-2 text-white/90 hover:text-white font-medium text-sm mb-3"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <h1 className="text-xl font-bold text-white">Perfection Leaderboard</h1>
          </div>
          <div className="p-4">
            <OpsManagerPerfectionDashboard />
          </div>
        </div>
      )}

      <BottomNav 
        role={role}
        activeView={activeView}
        onChangeView={setActiveView}
      />

      {showRefusalModal && selectedDeliveryForRefusal && (
        <DeliveryRefusalModal
          delivery={selectedDeliveryForRefusal}
          onRefuse={handleConfirmRefusal}
          onCancel={() => { setShowRefusalModal(false); setSelectedDeliveryForRefusal(null); }}
        />
      )}
    </div>
  );
};

export { QRVerificationPage };
export default SupplyClosetApp;
