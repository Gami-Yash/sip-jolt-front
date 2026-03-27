import React, { useState } from 'react';

// v1.00 CORRECTED Box Configurations
const BOX_CONFIGS = {
  BOX_A: { color: 'RED', shelf: 'SHELF 1 (BOTTOM)', requiresOxygenAbsorbers: false, requiresRedCaps: true, contents: 'Syrup Jugs' },
  BOX_B1: { color: 'GREEN', shelf: 'SHELF 2+3', requiresOxygenAbsorbers: true, requiresRedCaps: false, contents: '9 Oat Powder + 1 Cleaning Kit' },
  BOX_B2: { color: 'GREEN', shelf: 'SHELF 2', requiresOxygenAbsorbers: true, requiresRedCaps: false, contents: '7 Dairy Powder + 6 Cocoa Powder' },
  BOX_C: { color: 'GRAY', shelf: 'SHELF 4 (TOP)', requiresOxygenAbsorbers: false, requiresRedCaps: false, contents: '10 Coffee + 3 Sugar + 4 Chai' },
  CARTON_E: { color: 'BLUE', shelf: 'FLOOR', requiresOxygenAbsorbers: false, requiresRedCaps: false, contents: '4 Cup Boxes + Lids' },
};

// Backward compatibility: BOX_CD → BOX_C alias for legacy data
BOX_CONFIGS.BOX_CD = BOX_CONFIGS.BOX_C;

const WEIGHT_LIMITS = { SCALE_LOCK: 46.5, HARD_LIMIT: 47.0 };
const GATE_4_LIMITS = { COMPRESSION_MAX: 0.25, LID_BOUNCE_MAX: 0.5 };

export default function FiveGatesWizard({ boxId, boxType, onComplete, onCancel }) {
  const [currentGate, setCurrentGate] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [calibrationWeight, setCalibrationWeight] = useState('');
  const [absorberCount, setAbsorberCount] = useState('');
  const [absorbersConfirmed, setAbsorbersConfirmed] = useState(false);
  const [tareWeight, setTareWeight] = useState('');
  const [finalWeight, setFinalWeight] = useState('');
  const [shakePassed, setShakePassed] = useState(false);
  const [compressionSink, setCompressionSink] = useState('');
  const [lidBounce, setLidBounce] = useState('');
  const [stickerColor, setStickerColor] = useState('');
  const [stickerOnTop, setStickerOnTop] = useState(true);
  const [redCapsVerified, setRedCapsVerified] = useState(false);

  const config = BOX_CONFIGS[boxType] || BOX_CONFIGS.BOX_C;
  const expectedColor = config.color;

  const apiCall = async (endpoint, method, data) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/v1.00' + endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: data ? JSON.stringify(data) : undefined,
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || 'Request failed');
      return result;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const handleGate1 = async () => {
    const weight = parseFloat(calibrationWeight);
    if (isNaN(weight)) { setError('Enter calibration weight'); return; }
    const result = await apiCall('/boxes/' + boxId + '/gate/1', 'PATCH', { calibrationWeightLbs: weight });
    if (result && result.gateResult && result.gateResult.passed) setCurrentGate(2);
  };

  const handleGate2 = async () => {
    const result = await apiCall('/boxes/' + boxId + '/gate/2', 'PATCH', {
      absorberCount: parseInt(absorberCount) || 0,
      confirmed: absorbersConfirmed || !config.requiresOxygenAbsorbers,
    });
    if (result && result.gateResult && result.gateResult.passed) setCurrentGate(3);
  };

  const handleGate3 = async () => {
    const weight = parseFloat(finalWeight);
    if (isNaN(weight)) { setError('Enter final weight'); return; }
    if (weight > WEIGHT_LIMITS.HARD_LIMIT) { setError('Exceeds ' + WEIGHT_LIMITS.HARD_LIMIT + ' lb limit'); return; }
    const result = await apiCall('/boxes/' + boxId + '/gate/3', 'PATCH', {
      tareWeightLbs: parseFloat(tareWeight) || 0,
      finalWeightLbs: weight,
    });
    if (result && result.gateResult && result.gateResult.passed) {
      setCurrentGate(4);
    } else if (result && result.gateResult && result.gateResult.splitRequired) {
      setError('Split required: exceeds ' + WEIGHT_LIMITS.SCALE_LOCK + ' lbs');
    }
  };

  const handleGate4 = async () => {
    const comp = parseFloat(compressionSink);
    const bounce = parseFloat(lidBounce);
    if (isNaN(comp) || isNaN(bounce)) { setError('Enter all measurements'); return; }
    if (comp > GATE_4_LIMITS.COMPRESSION_MAX) { setError('Compression exceeds ' + GATE_4_LIMITS.COMPRESSION_MAX + '"'); return; }
    if (bounce > GATE_4_LIMITS.LID_BOUNCE_MAX) { setError('Lid bounce exceeds ' + GATE_4_LIMITS.LID_BOUNCE_MAX + '"'); return; }
    const result = await apiCall('/boxes/' + boxId + '/gate/4', 'PATCH', {
      shakePassed: shakePassed,
      compressionSinkInches: comp,
      lidBounceInches: bounce,
    });
    if (result && result.gateResult && result.gateResult.passed) setCurrentGate(5);
  };

  const handleGate5 = async () => {
    if (stickerColor !== expectedColor) { setError('Wrong sticker color. Expected: ' + expectedColor); return; }
    const result = await apiCall('/boxes/' + boxId + '/gate/5', 'PATCH', {
      stickerColor: stickerColor,
      stickerPosition: stickerOnTop ? 'TOP' : 'SIDE',
      redCapsVerified: config.requiresRedCaps ? redCapsVerified : null,
    });
    if (result && result.gateResult && result.gateResult.passed) {
      const finalResult = await apiCall('/boxes/' + boxId + '/finalize', 'POST', {});
      if (finalResult && onComplete) onComplete(finalResult);
    }
  };

  const weightStatus = () => {
    const w = parseFloat(finalWeight) || 0;
    if (w > WEIGHT_LIMITS.SCALE_LOCK) return 'border-red-500';
    if (w > WEIGHT_LIMITS.SCALE_LOCK - 5) return 'border-yellow-500';
    if (w > 0) return 'border-green-500';
    return 'border-gray-300';
  };

  const colorBg = (c) => {
    const map = { RED: 'bg-red-500', GREEN: 'bg-green-500', YELLOW: 'bg-yellow-400', BLUE: 'bg-blue-500', WHITE: 'bg-gray-200' };
    return map[c] || 'bg-gray-400';
  };

  return (
    <div className="max-w-xl mx-auto p-4 bg-white rounded-xl shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold text-gray-900">5-Gate QC Wizard</h1>
        <span className={`px-3 py-1 rounded text-sm font-bold text-white ${colorBg(expectedColor)}`}>{boxType}</span>
      </div>

      <div className="flex justify-between mb-6">
        {[1,2,3,4,5].map((g) => (
          <div key={g} className="flex flex-col items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-semibold text-white ${
              currentGate === g ? 'bg-blue-500' : currentGate > g ? 'bg-green-500' : 'bg-gray-300'
            }`}>
              {currentGate > g ? '✓' : g}
            </div>
            <span className="text-xs mt-1 text-gray-500">
              {['Zero','Fresh','Weight','Move','Sticker'][g-1]}
            </span>
          </div>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg mb-4 flex justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">×</button>
        </div>
      )}

      <div className="bg-gray-50 p-4 rounded-lg mb-4 min-h-[220px]">
        {currentGate === 1 && (
          <div>
            <h2 className="text-lg font-bold text-gray-800 mb-2">GATE 1: Zero Check</h2>
            <p className="text-gray-600 text-sm mb-4">Tare scale with 10 lb calibration weight.</p>
            <label className="block text-sm text-gray-500 mb-1">Calibration Weight (lbs)</label>
            <input type="number" step="0.1" placeholder="10.0" value={calibrationWeight}
              onChange={(e) => setCalibrationWeight(e.target.value)}
              className="w-full p-3 bg-white border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            <button onClick={handleGate1} disabled={loading || !calibrationWeight}
              className="w-full py-3 bg-blue-500 text-white rounded-lg font-bold disabled:bg-gray-300">
              {loading ? 'Checking...' : 'Confirm Zero Check →'}
            </button>
          </div>
        )}

        {currentGate === 2 && (
          <div>
            <h2 className="text-lg font-bold text-gray-800 mb-2">GATE 2: Freshness Lock</h2>
            {config.requiresOxygenAbsorbers ? (
              <div>
                <p className="text-gray-600 text-sm mb-4">Add oxygen absorbers to each bag.</p>
                <label className="block text-sm text-gray-500 mb-1">Absorber Count</label>
                <input type="number" min="0" placeholder="0" value={absorberCount}
                  onChange={(e) => setAbsorberCount(e.target.value)}
                  className="w-full p-3 bg-white border border-gray-300 rounded-lg mb-3" />
                <label className="flex items-center gap-2 mb-4 cursor-pointer">
                  <input type="checkbox" checked={absorbersConfirmed} 
                    onChange={(e) => setAbsorbersConfirmed(e.target.checked)}
                    className="w-5 h-5 text-blue-500" />
                  <span className="text-gray-700">Confirmed absorbers in all bags</span>
                </label>
              </div>
            ) : (
              <p className="text-gray-500 mb-4">N/A for {boxType}. Click Next.</p>
            )}
            <button onClick={handleGate2} disabled={loading || (config.requiresOxygenAbsorbers && !absorbersConfirmed)}
              className="w-full py-3 bg-blue-500 text-white rounded-lg font-bold disabled:bg-gray-300">
              {loading ? 'Processing...' : 'Next: Weight Law →'}
            </button>
          </div>
        )}

        {currentGate === 3 && (
          <div>
            <h2 className="text-lg font-bold text-gray-800 mb-2">GATE 3: Weight Law</h2>
            <p className="text-gray-600 text-sm mb-2">Scale lock: {WEIGHT_LIMITS.SCALE_LOCK} lbs | Hard limit: {WEIGHT_LIMITS.HARD_LIMIT} lbs</p>
            <label className="block text-sm text-gray-500 mb-1">Tare Weight (empty box)</label>
            <input type="number" step="0.1" placeholder="0.0" value={tareWeight}
              onChange={(e) => setTareWeight(e.target.value)}
              className="w-full p-3 bg-white border border-gray-300 rounded-lg mb-3" />
            <label className="block text-sm text-gray-500 mb-1">Final Weight (sealed)</label>
            <input type="number" step="0.1" placeholder="0.0" value={finalWeight}
              onChange={(e) => setFinalWeight(e.target.value)}
              className={`w-full p-3 bg-white border-2 rounded-lg mb-4 ${weightStatus()}`} />
            <button onClick={handleGate3} disabled={loading || !finalWeight}
              className="w-full py-3 bg-blue-500 text-white rounded-lg font-bold disabled:bg-gray-300">
              {loading ? 'Validating...' : 'Next: Movement Tests →'}
            </button>
          </div>
        )}

        {currentGate === 4 && (
          <div>
            <h2 className="text-lg font-bold text-gray-800 mb-2">GATE 4: Movement Tests</h2>
            <div className="bg-white p-3 rounded-lg border border-gray-200 mb-3">
              <h3 className="font-bold text-gray-700 mb-1">Shake Test</h3>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={shakePassed} 
                  onChange={(e) => setShakePassed(e.target.checked)} className="w-5 h-5" />
                <span className="text-gray-600">Zero rattles - contents secure</span>
              </label>
            </div>
            <div className="bg-white p-3 rounded-lg border border-gray-200 mb-3">
              <h3 className="font-bold text-gray-700 mb-1">Compression (10 lb block)</h3>
              <p className="text-xs text-gray-500 mb-2">Max: {GATE_4_LIMITS.COMPRESSION_MAX}"</p>
              <input type="number" step="0.01" placeholder="0.00" value={compressionSink}
                onChange={(e) => setCompressionSink(e.target.value)}
                className="w-full p-2 bg-gray-50 border border-gray-300 rounded-lg" />
            </div>
            <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg mb-4">
              <h3 className="font-bold text-gray-700 mb-1">Lid Bounce <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded ml-1">v1.00 NEW</span></h3>
              <p className="text-xs text-gray-600 mb-2">Press lid and release. Max: {GATE_4_LIMITS.LID_BOUNCE_MAX}"</p>
              <input type="number" step="0.01" placeholder="0.00" value={lidBounce}
                onChange={(e) => setLidBounce(e.target.value)}
                className="w-full p-2 bg-white border border-gray-300 rounded-lg" />
            </div>
            <button onClick={handleGate4} disabled={loading || !shakePassed || !compressionSink || !lidBounce}
              className="w-full py-3 bg-blue-500 text-white rounded-lg font-bold disabled:bg-gray-300">
              {loading ? 'Processing...' : 'Next: Sticker →'}
            </button>
          </div>
        )}

        {currentGate === 5 && (
          <div>
            <h2 className="text-lg font-bold text-gray-800 mb-2">GATE 5: Envelope Sticker</h2>
            <p className="text-gray-600 text-sm mb-3">Apply <span className={`px-2 py-0.5 rounded font-bold text-white ${colorBg(expectedColor)}`}>{expectedColor}</span> sticker to TOP</p>
            <div className="flex flex-wrap gap-2 mb-3">
              {['RED','GREEN','YELLOW','BLUE','WHITE'].map((c) => (
                <button key={c} onClick={() => setStickerColor(c)}
                  className={`px-4 py-2 rounded-lg font-bold text-white ${colorBg(c)} ${stickerColor === c ? 'ring-2 ring-offset-2 ring-blue-500' : 'opacity-70 hover:opacity-100'}`}>
                  {c}
                </button>
              ))}
            </div>
            <label className="flex items-center gap-2 mb-3 cursor-pointer">
              <input type="checkbox" checked={stickerOnTop} 
                onChange={(e) => setStickerOnTop(e.target.checked)} className="w-5 h-5" />
              <span className="text-gray-700">Sticker placed on TOP</span>
            </label>
            {config.requiresRedCaps && (
              <label className="flex items-center gap-2 mb-4 cursor-pointer">
                <input type="checkbox" checked={redCapsVerified} 
                  onChange={(e) => setRedCapsVerified(e.target.checked)} className="w-5 h-5" />
                <span className="text-gray-700">Safety Red Caps verified</span>
              </label>
            )}
            <button onClick={handleGate5} disabled={loading || !stickerColor || !stickerOnTop || (config.requiresRedCaps && !redCapsVerified)}
              className="w-full py-3 bg-green-500 text-white rounded-lg font-bold disabled:bg-gray-300">
              {loading ? 'Finalizing...' : '✓ Complete & Lock Label'}
            </button>
          </div>
        )}
      </div>

      {onCancel && (
        <button onClick={onCancel} className="w-full py-2 text-gray-500 hover:text-gray-700">
          Cancel
        </button>
      )}
    </div>
  );
}
