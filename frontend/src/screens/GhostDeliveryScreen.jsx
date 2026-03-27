import React, { useState, useEffect } from 'react';

// Real site coordinates for geofencing
const SITE_LOCATION = { lat: 40.7128, lng: -74.0060 }; // Default: NYC, would be site-specific in production

const buildAuthHeaders = (userId, userRole) => ({
  'x-user-id': String(userId || 'driver-001'),
  'x-user-role': (userRole || 'driver').toString().toLowerCase()
});

export default function GhostDeliveryScreen({
  deliveryId,
  siteId,
  siteName,
  expectedBoxCount,
  onComplete,
  onCancel,
  userId,
  userRole
}) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const checkGeofence = (lat, lng) => {
    // Real implementation of Haversine formula
    const R = 6371e3; // metres
    const φ1 = lat * Math.PI/180;
    const φ2 = SITE_LOCATION.lat * Math.PI/180;
    const Δφ = (SITE_LOCATION.lat-lat) * Math.PI/180;
    const Δλ = (SITE_LOCATION.lng-lng) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    const distance = R * c;
    return distance <= 50;
  };

  const [accessCode, setAccessCode] = useState('');
  const [codeRequired, setCodeRequired] = useState(false);
  const [scannedBarcodes, setScannedBarcodes] = useState([]);
  const [currentScan, setCurrentScan] = useState('');
  const [closetPhotoUrl, setClosetPhotoUrl] = useState('');
  const [gpsLat, setGpsLat] = useState(null);
  const [gpsLng, setGpsLng] = useState(null);
  const [gpsError, setGpsError] = useState(null);
  const [gpsLoading, setGpsLoading] = useState(false);

  useEffect(() => {
    checkEligibility();
  }, [siteId]);

  const checkEligibility = async () => {
    try {
      const res = await fetch('/api/v1.00/ghost/eligibility/' + siteId, {
        headers: buildAuthHeaders(userId, userRole)
      });
      const data = await res.json();
      if (!data.eligible) {
        setError('Ghost delivery not enabled for this site');
      }
      setCodeRequired(data.requiresAccessCode);
    } catch (err) {
      setError('Failed to check eligibility');
    }
  };

  const getGPS = () => {
    setGpsLoading(true);
    setGpsError(null);
    if (!navigator.geolocation) {
      setGpsError('GPS not supported');
      setGpsLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsLat(pos.coords.latitude);
        setGpsLng(pos.coords.longitude);
        setGpsLoading(false);
      },
      (err) => {
        setGpsError('GPS failed: ' + err.message);
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const addBarcode = () => {
    if (currentScan && !scannedBarcodes.includes(currentScan)) {
      setScannedBarcodes([...scannedBarcodes, currentScan]);
      setCurrentScan('');
    }
  };

  const removeBarcode = (code) => {
    setScannedBarcodes(scannedBarcodes.filter(b => b !== code));
  };

  const handleSubmit = async () => {
    if (!gpsLat || !gpsLng) {
      setError('GPS required');
      return;
    }
    
    if (!checkGeofence(gpsLat, gpsLng)) {
      setError('LOCATION_ANOMALY: You must be within 50m of the site to complete delivery.');
      triggerHaptic('error');
      return;
    }

    if (!closetPhotoUrl) {
      setError('Photo required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/v1.00/ghost/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...buildAuthHeaders(userId, userRole)
        },
        body: JSON.stringify({
          deliveryId,
          siteId,
          accessCodeUsed: accessCode || null,
          scannedBarcodes,
          closetPhotoUrl,
          gpsLatitude: gpsLat,
          gpsLongitude: gpsLng,
          clientTimestamp: new Date().toISOString(),
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.message || 'Submission failed');
      }

      if (onComplete) {
        onComplete(result);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const canProceed = () => {
    if (step === 1) return !codeRequired || accessCode.length > 0;
    if (step === 2) return scannedBarcodes.length > 0;
    if (step === 3) return closetPhotoUrl.length > 0;
    if (step === 4) return gpsLat && gpsLng;
    return false;
  };

  return (
    <div className="max-w-md mx-auto p-4 bg-white rounded-xl shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold text-gray-900">Ghost Delivery</h1>
        <span className="text-sm text-gray-500">{siteName}</span>
      </div>

      <div className="flex justify-between mb-6">
        {['Code', 'Scan', 'Photo', 'GPS'].map((label, i) => (
          <div key={i} className="flex flex-col items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold text-white ${
              step === i + 1 ? 'bg-blue-500' : step > i + 1 ? 'bg-green-500' : 'bg-gray-300'
            }`}>
              {step > i + 1 ? '✓' : i + 1}
            </div>
            <span className="text-xs mt-1 text-gray-500">{label}</span>
          </div>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg mb-4">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="float-right text-red-500">×</button>
        </div>
      )}

      <div className="bg-gray-50 p-4 rounded-lg mb-4 min-h-[200px]">
        {step === 1 && (
          <div>
            <h2 className="text-lg font-bold text-gray-800 mb-2">Step 1: Access Code</h2>
            {codeRequired ? (
              <>
                <p className="text-gray-600 text-sm mb-4">Enter the closet access code for this site.</p>
                <input
                  type="text"
                  placeholder="Enter code"
                  value={accessCode}
                  onChange={e => setAccessCode(e.target.value)}
                  className="w-full p-3 bg-white border border-gray-300 rounded-lg text-center text-2xl tracking-widest"
                  autoFocus
                />
              </>
            ) : (
              <div className="text-center py-8">
                <span className="text-4xl">🔓</span>
                <p className="text-gray-500 mt-2">No access code required for this site.</p>
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 className="text-lg font-bold text-gray-800 mb-2">Step 2: Scan Boxes</h2>
            <p className="text-gray-600 text-sm mb-2">
              Scanned: {scannedBarcodes.length} / {expectedBoxCount || '?'}
            </p>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                placeholder="Scan or enter barcode"
                value={currentScan}
                onChange={e => setCurrentScan(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && addBarcode()}
                className="flex-1 p-2 bg-white border border-gray-300 rounded-lg"
              />
              <button onClick={addBarcode} className="px-4 py-2 bg-blue-500 text-white rounded-lg">Add</button>
            </div>
            <div className="max-h-32 overflow-y-auto">
              {scannedBarcodes.map((code, i) => (
                <div key={i} className="flex justify-between items-center p-2 bg-white border border-gray-200 rounded-lg mb-1">
                  <span className="text-sm text-gray-700 font-mono">{code}</span>
                  <button onClick={() => removeBarcode(code)} className="text-red-500 text-sm">Remove</button>
                </div>
              ))}
            </div>
            {scannedBarcodes.length === 0 && (
              <p className="text-gray-400 text-center py-4">No boxes scanned yet</p>
            )}
          </div>
        )}

        {step === 3 && (
          <div>
            <h2 className="text-lg font-bold text-gray-800 mb-2">Step 3: Closet Photo</h2>
            <p className="text-gray-600 text-sm mb-4">Take a photo of boxes in the closet.</p>
            {closetPhotoUrl ? (
              <div className="text-center">
                <div className="bg-green-50 border border-green-200 p-4 rounded-lg mb-3">
                  <span className="text-2xl">📸</span>
                  <p className="text-green-700 mt-2">Photo captured</p>
                </div>
                <button onClick={() => setClosetPhotoUrl('')} className="text-sm text-gray-500">Retake</button>
              </div>
            ) : (
              <div className="text-center py-4">
                <input
                  type="text"
                  placeholder="Enter photo URL (for testing)"
                  value={closetPhotoUrl}
                  onChange={e => setClosetPhotoUrl(e.target.value)}
                  className="w-full p-2 bg-white border border-gray-300 rounded-lg mb-3"
                />
                <p className="text-xs text-gray-400">In production, this would open camera</p>
              </div>
            )}
          </div>
        )}

        {step === 4 && (
          <div>
            <h2 className="text-lg font-bold text-gray-800 mb-2">Step 4: Confirm Location</h2>
            <p className="text-gray-600 text-sm mb-4">GPS must be within 50m of site.</p>
            
            {gpsLat && gpsLng ? (
              <div className="bg-green-50 border border-green-200 p-4 rounded-lg mb-3 text-center">
                <span className="text-2xl">📍</span>
                <p className="text-green-700 mt-2">Location captured</p>
                <p className="text-xs text-gray-500 mt-1">{gpsLat.toFixed(6)}, {gpsLng.toFixed(6)}</p>
              </div>
            ) : (
              <div className="text-center py-4">
                {gpsLoading ? (
                  <p className="text-gray-500">Getting location...</p>
                ) : (
                  <button onClick={getGPS} className="px-6 py-3 bg-blue-500 text-white rounded-lg font-bold">
                    📍 Get GPS Location
                  </button>
                )}
                {gpsError && <p className="text-red-500 text-sm mt-2">{gpsError}</p>}
              </div>
            )}

            {gpsLat && gpsLng && (
              <div className="bg-gray-100 p-3 rounded-lg mt-4">
                <h3 className="font-bold text-gray-700 mb-2">Summary</h3>
                <p className="text-sm text-gray-600">Boxes: {scannedBarcodes.length}</p>
                <p className="text-sm text-gray-600">Photo: {closetPhotoUrl ? '✓' : '✗'}</p>
                <p className="text-sm text-gray-600">GPS: ✓</p>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex justify-between">
        {step > 1 ? (
          <button onClick={() => setStep(step - 1)} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg">
            ← Back
          </button>
        ) : (
          <div></div>
        )}

        {step < 4 ? (
          <button
            onClick={() => setStep(step + 1)}
            disabled={!canProceed()}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg font-bold disabled:bg-gray-300"
          >
            Next →
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={loading || !canProceed()}
            className="px-6 py-2 bg-green-500 text-white rounded-lg font-bold disabled:bg-gray-300"
          >
            {loading ? 'Submitting...' : '✓ Complete Delivery'}
          </button>
        )}
      </div>

      {onCancel && (
        <button onClick={onCancel} className="w-full mt-4 py-2 text-gray-500 hover:text-gray-700">
          Cancel
        </button>
      )}
    </div>
  );
}
