import React, { useState, useEffect } from 'react';
import { 
  ChevronRight, ChevronLeft, CheckCircle, Camera, MapPin, Clock, 
  Smartphone, Shield, X, BookOpen, Scale, Package, Truck, AlertTriangle,
  Eye, Droplet, Video, Target
} from 'lucide-react';
import { triggerHaptic } from '../utils/mobileGestures';

const COMMON_STEPS = [
  {
    id: 'welcome',
    title: 'Welcome to SIPJOLT',
    subtitle: 'Your Field Operations Guide',
    icon: BookOpen,
    type: 'info'
  },
  {
    id: 'pwa_install',
    title: 'Install the App',
    subtitle: 'Add to Your Home Screen',
    icon: Smartphone,
    type: 'info'
  },
  {
    id: 'permissions',
    title: 'Enable Permissions',
    subtitle: 'GPS & Camera Required',
    icon: Camera,
    type: 'info'
  }
];

const OPS_MANAGER_STEPS = [
  {
    id: 'tare_scale',
    title: 'The Zero-Check Gate',
    subtitle: 'Always Calibrate First',
    icon: Scale,
    type: 'interactive_tare'
  },
  {
    id: 'weight_law',
    title: 'The 47lb Weight Law',
    subtitle: 'Hard Limit - No Exceptions',
    icon: Package,
    type: 'interactive_weight'
  },
  {
    id: 'rack_zones',
    title: '5-Zone Rack Mapping',
    subtitle: 'Color-Coded Storage',
    icon: Target,
    type: 'interactive_zones'
  },
  {
    id: 'hardware',
    title: 'Hardware Standards',
    subtitle: 'Labels & Safety Caps',
    icon: Package,
    type: 'info'
  }
];

const DRIVER_STEPS = [
  {
    id: 'gps_rule',
    title: 'The 50-Meter Rule',
    subtitle: 'Geofenced Evidence',
    icon: MapPin,
    type: 'info'
  },
  {
    id: 'photo_quality',
    title: 'ProofAssist Standards',
    subtitle: 'Pick the Good Photo',
    icon: Camera,
    type: 'interactive_photo'
  }
];

const TECHNICIAN_STEPS = [
  {
    id: 'deadline',
    title: 'The 24-Hour Window',
    subtitle: 'Accept or Refuse Quickly',
    icon: Clock,
    type: 'interactive_countdown'
  },
  {
    id: 'spot_leak',
    title: 'Refusal Protocol',
    subtitle: 'Spot the Damage',
    icon: Droplet,
    type: 'interactive_leak'
  },
  {
    id: 'recovery',
    title: '2-Point Recovery',
    subtitle: 'SAFE_MODE Exit',
    icon: Shield,
    type: 'info'
  }
];

const FINAL_STEP = {
  id: 'complete',
  title: "You're Certified!",
  subtitle: 'Training Complete',
  icon: CheckCircle,
  type: 'complete'
};

const WelcomeContent = ({ userRole }) => {
  const roleLabels = {
    'ops_manager': 'Operations Manager',
    'driver': 'Delivery Driver',
    'partner_technician': 'Site Technician',
    'technician': 'Site Technician'
  };
  const roleLabel = roleLabels[userRole] || 'Team Member';
  
  return (
    <div className="space-y-4">
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 text-center">
        <p className="text-blue-400 text-sm font-medium">Your Role</p>
        <p className="text-white text-lg font-bold">{roleLabel}</p>
      </div>
      <p className="text-gray-300 leading-relaxed">
        This training is customized for your role. You'll learn the specific rules 
        and procedures that apply to your work.
      </p>
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
        <p className="text-amber-400 text-sm font-medium mb-1">Important</p>
        <p className="text-gray-400 text-xs">
          You must complete this training before using the app. It takes about 3 minutes.
        </p>
      </div>
    </div>
  );
};

const PWAInstallContent = () => (
  <div className="space-y-4">
    <p className="text-gray-300 leading-relaxed">
      Install SIPJOLT on your phone's home screen for the best experience.
    </p>
    <div className="space-y-3">
      <div className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg">
        <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-400 font-bold text-sm">1</div>
        <p className="text-white text-sm">Tap the Share or Menu button</p>
      </div>
      <div className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg">
        <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-400 font-bold text-sm">2</div>
        <p className="text-white text-sm">Tap "Add to Home Screen"</p>
      </div>
      <div className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg">
        <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-400 font-bold text-sm">3</div>
        <p className="text-white text-sm">Open from your home screen</p>
      </div>
    </div>
  </div>
);

const PermissionsContent = () => {
  const handleRequestPermissions = () => {
    // Mock for desktop testing
    if (typeof window !== 'undefined' && navigator.mediaDevices) {
      navigator.mediaDevices.getUserMedia({ video: true }).catch(() => {});
      navigator.geolocation.getCurrentPosition(() => {}, () => {});
    }
    triggerHaptic('success');
  };

  return (
    <div className="space-y-4">
      <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
        <p className="text-red-400 text-sm font-bold mb-2">THE BOTTOM LINE</p>
        <p className="text-gray-300 text-sm">
          You must enable GPS and Camera. Without them, you cannot physically complete your job.
        </p>
      </div>
      <div className="space-y-3">
        <div className="flex items-center gap-3 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
          <MapPin size={24} className="text-green-400" />
          <div>
            <p className="text-white text-sm font-medium">Location Services</p>
            <p className="text-gray-400 text-xs">Required for proof of presence</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
          <Camera size={24} className="text-green-400" />
          <div>
            <p className="text-white text-sm font-medium">Camera Access</p>
            <p className="text-gray-400 text-xs">Required for evidence photos</p>
          </div>
        </div>
      </div>
      <button
        onClick={handleRequestPermissions}
        className="w-full py-3 bg-blue-600 text-white font-bold rounded-lg mt-2"
      >
        Test Permissions on Desktop
      </button>
    </div>
  );
};

const TareScaleChallenge = ({ onPass }) => {
  const [tared, setTared] = useState(false);
  const [scaleReading, setScaleReading] = useState(0.3);

  const handleTare = () => {
    triggerHaptic('heavy');
    setScaleReading(0.0);
    setTared(true);
    setTimeout(() => onPass(), 500);
  };

  return (
    <div className="space-y-4">
      <p className="text-gray-300 leading-relaxed">
        Before packing any box, you must zero the scale. This ensures accurate weights.
      </p>
      <div className="bg-gray-800 rounded-xl p-6 text-center">
        <p className="text-gray-500 text-xs mb-2">SCALE READING</p>
        <p className={`text-5xl font-mono font-bold ${tared ? 'text-green-400' : 'text-amber-400'}`}>
          {scaleReading.toFixed(1)} lb
        </p>
        <p className="text-gray-500 text-xs mt-2">10 lb calibration weight</p>
      </div>
      {!tared ? (
        <button
          onClick={handleTare}
          className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-all active:scale-[0.98]"
        >
          TAP TO TARE SCALE
        </button>
      ) : (
        <div className="flex items-center justify-center gap-2 py-4 bg-green-500/20 rounded-lg">
          <CheckCircle size={24} className="text-green-400" />
          <p className="text-green-400 font-bold">Scale Zeroed!</p>
        </div>
      )}
    </div>
  );
};

const WeightLawChallenge = ({ onPass }) => {
  const [selectedWeight, setSelectedWeight] = useState(null);

  const handleSelect = (weight) => {
    triggerHaptic(weight === 'good' ? 'success' : 'error');
    setSelectedWeight(weight);
    if (weight === 'good') {
      setTimeout(() => onPass(), 800);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
        <p className="text-red-400 text-sm font-bold mb-2">THE BOTTOM LINE</p>
        <p className="text-gray-300 text-sm">
          Any box over 47.0 lbs is a hard-fail. Labels will not print.
        </p>
      </div>
      <p className="text-gray-400 text-sm text-center">Which box can ship?</p>
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => handleSelect('good')}
          disabled={selectedWeight !== null}
          className={`p-6 rounded-xl border-2 transition-all ${
            selectedWeight === 'good' 
              ? 'border-green-500 bg-green-500/20' 
              : selectedWeight === 'bad'
                ? 'border-gray-700 opacity-50'
                : 'border-gray-700 hover:border-gray-500'
          }`}
        >
          <p className="text-4xl font-mono font-bold text-green-400">46.5</p>
          <p className="text-gray-500 text-xs mt-1">pounds</p>
          {selectedWeight === 'good' && (
            <CheckCircle size={24} className="text-green-400 mx-auto mt-2" />
          )}
        </button>
        <button
          onClick={() => handleSelect('bad')}
          disabled={selectedWeight !== null}
          className={`p-6 rounded-xl border-2 transition-all ${
            selectedWeight === 'bad' 
              ? 'border-red-500 bg-red-500/20 animate-pulse' 
              : selectedWeight === 'good'
                ? 'border-gray-700 opacity-50'
                : 'border-gray-700 hover:border-gray-500'
          }`}
        >
          <p className="text-4xl font-mono font-bold text-red-400">47.1</p>
          <p className="text-gray-500 text-xs mt-1">pounds</p>
          {selectedWeight === 'bad' && (
            <X size={24} className="text-red-400 mx-auto mt-2" />
          )}
        </button>
      </div>
      {selectedWeight === 'bad' && (
        <p className="text-red-400 text-sm text-center animate-pulse">
          Too heavy! Try again.
        </p>
      )}
    </div>
  );
};

const RackZonesChallenge = ({ onPass }) => {
  const [boxPlaced, setBoxPlaced] = useState(null);
  const zones = [
    { id: 'red', label: 'RED Shelf', color: 'bg-red-500', correct: true },
    { id: 'blue', label: 'BLUE Floor', color: 'bg-blue-500', correct: false },
    { id: 'green', label: 'GREEN Rack', color: 'bg-green-500', correct: false }
  ];

  const handleZoneClick = (zone) => {
    triggerHaptic(zone.correct ? 'success' : 'error');
    setBoxPlaced(zone.id);
    if (zone.correct) {
      setTimeout(() => onPass(), 800);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-gray-300 leading-relaxed">
        Each box type goes to a specific zone. Tap where <span className="text-amber-400 font-bold">Box A (Powder)</span> belongs:
      </p>
      <div className="space-y-3">
        {zones.map(zone => (
          <button
            key={zone.id}
            onClick={() => handleZoneClick(zone)}
            disabled={boxPlaced !== null}
            className={`w-full p-4 rounded-lg border-2 flex items-center gap-3 transition-all ${
              boxPlaced === zone.id
                ? zone.correct 
                  ? 'border-green-500 bg-green-500/20'
                  : 'border-red-500 bg-red-500/20'
                : 'border-gray-700 hover:border-gray-500'
            }`}
          >
            <div className={`w-6 h-6 rounded ${zone.color}`} />
            <span className="text-white font-medium">{zone.label}</span>
            {boxPlaced === zone.id && (
              zone.correct 
                ? <CheckCircle size={20} className="text-green-400 ml-auto" />
                : <X size={20} className="text-red-400 ml-auto" />
            )}
          </button>
        ))}
      </div>
      {boxPlaced && !zones.find(z => z.id === boxPlaced)?.correct && (
        <p className="text-red-400 text-sm text-center">Powder boxes go to RED Shelf. Try again!</p>
      )}
    </div>
  );
};

const HardwareContent = () => (
  <div className="space-y-4">
    <p className="text-gray-300 leading-relaxed">
      Each shipment requires proper labeling and safety equipment.
    </p>
    <div className="space-y-3">
      <div className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg">
        <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
          <Package size={20} className="text-blue-400" />
        </div>
        <div>
          <p className="text-white text-sm font-medium">12-inch Double-Wide Labels</p>
          <p className="text-gray-400 text-xs">Required on all outbound boxes</p>
        </div>
      </div>
      <div className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg">
        <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
          <Shield size={20} className="text-red-400" />
        </div>
        <div>
          <p className="text-white text-sm font-medium">Safety Red Shipping Caps</p>
          <p className="text-gray-400 text-xs">Protects powder containers in transit</p>
        </div>
      </div>
    </div>
  </div>
);

const GPSRuleContent = () => (
  <div className="space-y-4">
    <div className="bg-gray-800 rounded-xl p-6">
      <div className="relative w-full h-40 bg-gray-700 rounded-lg overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-32 h-32 rounded-full border-4 border-dashed border-blue-500/50 flex items-center justify-center">
            <div className="w-4 h-4 bg-blue-500 rounded-full animate-pulse" />
          </div>
          <p className="absolute bottom-2 text-blue-400 text-xs font-mono">50m radius</p>
        </div>
      </div>
    </div>
    <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
      <p className="text-red-400 text-sm font-bold mb-2">THE BOTTOM LINE</p>
      <p className="text-gray-300 text-sm">
        If you are not inside the circle, the "Take Photo" button will not activate.
      </p>
    </div>
  </div>
);

const PhotoQualityChallenge = ({ onPass }) => {
  const [selected, setSelected] = useState(null);
  const photos = [
    { id: 'blurry', label: 'Photo A', quality: 'Blurry', good: false },
    { id: 'dark', label: 'Photo B', quality: 'Too Dark', good: false },
    { id: 'good', label: 'Photo C', quality: 'Clear & Bright', good: true }
  ];

  const handleSelect = (photo) => {
    triggerHaptic(photo.good ? 'success' : 'error');
    setSelected(photo.id);
    if (photo.good) {
      setTimeout(() => onPass(), 800);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-gray-300 leading-relaxed">
        ProofAssist checks photo quality automatically. Tap the photo that would PASS:
      </p>
      <div className="grid grid-cols-3 gap-3">
        {photos.map(photo => (
          <button
            key={photo.id}
            onClick={() => handleSelect(photo)}
            disabled={selected !== null}
            className={`p-3 rounded-lg border-2 transition-all ${
              selected === photo.id
                ? photo.good 
                  ? 'border-green-500 bg-green-500/20'
                  : 'border-red-500 bg-red-500/20'
                : 'border-gray-700 hover:border-gray-500'
            }`}
          >
            <div className={`w-full h-16 rounded mb-2 ${
              photo.id === 'blurry' ? 'bg-gray-600 blur-sm' :
              photo.id === 'dark' ? 'bg-gray-900' :
              'bg-gradient-to-br from-blue-400 to-blue-600'
            }`} />
            <p className="text-white text-xs font-medium">{photo.label}</p>
            <p className={`text-xs ${photo.good ? 'text-green-400' : 'text-gray-500'}`}>
              {photo.quality}
            </p>
            {selected === photo.id && (
              photo.good 
                ? <CheckCircle size={16} className="text-green-400 mx-auto mt-1" />
                : <X size={16} className="text-red-400 mx-auto mt-1" />
            )}
          </button>
        ))}
      </div>
      {selected && !photos.find(p => p.id === selected)?.good && (
        <p className="text-red-400 text-sm text-center">That photo would fail. Try again!</p>
      )}
    </div>
  );
};

const CountdownChallenge = ({ onPass }) => {
  const [countdown, setCountdown] = useState(24);
  const [started, setStarted] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (started && countdown > 0) {
      const timer = setTimeout(() => setCountdown(c => c - 1), 100);
      return () => clearTimeout(timer);
    }
    if (started && countdown === 0) {
      triggerHaptic('error');
      setFailed(true);
    }
  }, [started, countdown]);

  const handleStart = () => {
    setStarted(true);
    setCountdown(24);
    setFailed(false);
  };

  const handleAccept = () => {
    if (countdown > 0 && !failed) {
      triggerHaptic('success');
      onPass();
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-gray-300 leading-relaxed">
        When a delivery arrives, you have 24 hours to accept or refuse. Watch what happens if you wait too long:
      </p>
      <div className={`rounded-xl p-6 text-center transition-all ${
        failed ? 'bg-red-900/50 border-2 border-red-500' : 'bg-gray-800'
      }`}>
        <p className="text-gray-500 text-xs mb-2">{failed ? 'SAFE_MODE ACTIVATED' : 'TIME REMAINING'}</p>
        <p className={`text-5xl font-mono font-bold ${
          failed ? 'text-red-400' : countdown < 10 ? 'text-amber-400' : 'text-white'
        }`}>
          {failed ? '00:00' : `${countdown}:00`}
        </p>
        <p className="text-gray-500 text-xs mt-2">hours</p>
      </div>
      {!started ? (
        <button
          onClick={handleStart}
          className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg"
        >
          Start Demo
        </button>
      ) : failed ? (
        <div className="space-y-3">
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
            <p className="text-red-400 text-sm font-bold">Machine Locked!</p>
            <p className="text-gray-400 text-xs">Powder dispensing disabled until recovery.</p>
          </div>
          <button
            onClick={handleStart}
            className="w-full py-3 bg-gray-700 text-white font-medium rounded-lg"
          >
            Try Again
          </button>
        </div>
      ) : (
        <button
          onClick={handleAccept}
          className="w-full py-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg animate-pulse"
        >
          Accept Delivery Now!
        </button>
      )}
      <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
        <p className="text-red-400 text-sm font-bold mb-2">THE BOTTOM LINE</p>
        <p className="text-gray-300 text-sm">
          Ignoring a delivery for 24 hours bricks the machine automatically.
        </p>
      </div>
    </div>
  );
};

const SpotLeakChallenge = ({ onPass }) => {
  const [clicked, setClicked] = useState(null);
  const spots = [
    { id: 'topleft', x: '10%', y: '10%', isLeak: false },
    { id: 'center', x: '45%', y: '40%', isLeak: false },
    { id: 'bottomright', x: '75%', y: '70%', isLeak: true }
  ];

  const handleClick = (spot) => {
    triggerHaptic(spot.isLeak ? 'success' : 'error');
    setClicked(spot.id);
    if (spot.isLeak) {
      setTimeout(() => onPass(), 800);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-gray-300 leading-relaxed">
        If a box arrives damaged, you must refuse it. Find the damp corner on this box:
      </p>
      <div className="relative bg-amber-900/30 border-2 border-amber-700 rounded-xl h-48">
        <div className="absolute inset-0 flex items-center justify-center">
          <Package size={48} className="text-amber-700/50" />
        </div>
        {spots.map(spot => (
          <button
            key={spot.id}
            onClick={() => handleClick(spot)}
            disabled={clicked !== null}
            className={`absolute w-12 h-12 rounded-full transition-all ${
              clicked === spot.id
                ? spot.isLeak 
                  ? 'bg-green-500/50 border-2 border-green-400'
                  : 'bg-red-500/50 border-2 border-red-400'
                : spot.isLeak
                  ? 'bg-blue-800/30 hover:bg-blue-700/40'
                  : 'bg-gray-700/30 hover:bg-gray-600/40'
            }`}
            style={{ left: spot.x, top: spot.y }}
          >
            {clicked === spot.id && (
              spot.isLeak 
                ? <Droplet size={20} className="text-green-400 mx-auto" />
                : <X size={20} className="text-red-400 mx-auto" />
            )}
          </button>
        ))}
        <div 
          className="absolute w-14 h-14 rounded-lg opacity-30"
          style={{ right: '10%', bottom: '15%', background: 'linear-gradient(135deg, transparent 40%, #3b82f6 100%)' }}
        />
      </div>
      {clicked && !spots.find(s => s.id === clicked)?.isLeak && (
        <p className="text-red-400 text-sm text-center">That's not damaged. Look for the wet corner!</p>
      )}
      {clicked && spots.find(s => s.id === clicked)?.isLeak && (
        <div className="flex items-center justify-center gap-2 py-3 bg-green-500/20 rounded-lg">
          <CheckCircle size={20} className="text-green-400" />
          <p className="text-green-400 font-medium">Leak Found! Refusal triggered.</p>
        </div>
      )}
    </div>
  );
};

const RecoveryContent = () => (
  <div className="space-y-4">
    <p className="text-gray-300 leading-relaxed">
      If a machine enters SAFE_MODE, here's how to unlock it:
    </p>
    <div className="space-y-3">
      <div className="flex items-center gap-3 p-4 bg-gray-800/50 rounded-lg border-l-4 border-blue-500">
        <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-400 font-bold">1</div>
        <div>
          <p className="text-white font-medium">Daily Token Photo</p>
          <p className="text-gray-400 text-xs">Photo of 3-digit code on machine screen</p>
        </div>
        <Camera size={20} className="text-blue-400 ml-auto" />
      </div>
      <div className="flex items-center justify-center">
        <ChevronRight size={20} className="text-gray-600 rotate-90" />
      </div>
      <div className="flex items-center gap-3 p-4 bg-gray-800/50 rounded-lg border-l-4 border-green-500">
        <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center text-green-400 font-bold">2</div>
        <div>
          <p className="text-white font-medium">3-Second Squeeze Video</p>
          <p className="text-gray-400 text-xs">Video of powder squeeze test</p>
        </div>
        <Video size={20} className="text-green-400 ml-auto" />
      </div>
    </div>
    <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 text-center">
      <p className="text-green-400 text-sm font-bold mb-1">THE BOTTOM LINE</p>
      <p className="text-gray-300 text-sm">
        This is the only way to turn the machine back to "ACTIVE."
      </p>
    </div>
  </div>
);

const CompleteContent = ({ userRole }) => {
  const roleLabels = {
    'ops_manager': 'Operations Manager',
    'driver': 'Delivery Driver',
    'partner_technician': 'Site Technician',
    'technician': 'Site Technician'
  };
  
  return (
    <div className="space-y-4">
      <div className="text-center py-6">
        <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle size={40} className="text-green-400" />
        </div>
        <p className="text-green-400 text-lg font-semibold mb-2">Training Complete!</p>
        <p className="text-gray-400 text-sm">
          You're now certified as a {roleLabels[userRole] || 'Team Member'}.
        </p>
      </div>
      <div className="bg-gray-800/50 rounded-lg p-4">
        <p className="text-white text-sm font-medium mb-2">Your training is logged:</p>
        <ul className="text-gray-400 text-xs space-y-1">
          <li>• Completion timestamp recorded</li>
          <li>• SHA-256 hash created for audit trail</li>
          <li>• You can now access all app features</li>
        </ul>
      </div>
    </div>
  );
};

const getStepsForRole = (role) => {
  const normalizedRole = role?.toLowerCase() || 'partner_technician';
  
  let roleSteps = [];
  if (normalizedRole === 'ops_manager') {
    roleSteps = OPS_MANAGER_STEPS;
  } else if (normalizedRole === 'driver') {
    roleSteps = DRIVER_STEPS;
  } else {
    roleSteps = TECHNICIAN_STEPS;
  }
  
  return [...COMMON_STEPS, ...roleSteps, FINAL_STEP];
};

export const OnboardingWizard = ({ onComplete, onClose, userRole = 'partner_technician' }) => {
  const steps = getStepsForRole(userRole);
  const [currentStep, setCurrentStep] = useState(0);
  const [challengePassed, setChallengePassed] = useState({});
  
  const step = steps[currentStep];
  const Icon = step.icon;
  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;
  
  const isInteractive = step.type?.startsWith('interactive_');
  const hasPassed = challengePassed[step.id];
  const canProceed = !isInteractive || hasPassed;

  const handleChallengePass = () => {
    setChallengePassed(prev => ({ ...prev, [step.id]: true }));
  };

  const handleNext = () => {
    if (!canProceed) {
      triggerHaptic('error');
      return;
    }
    triggerHaptic('light');
    if (isLastStep) {
      triggerHaptic('success');
      onComplete();
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    triggerHaptic('light');
    if (!isFirstStep) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderContent = () => {
    switch (step.type) {
      case 'info':
        if (step.id === 'welcome') return <WelcomeContent userRole={userRole} />;
        if (step.id === 'pwa_install') return <PWAInstallContent />;
        if (step.id === 'permissions') return <PermissionsContent />;
        if (step.id === 'hardware') return <HardwareContent />;
        if (step.id === 'gps_rule') return <GPSRuleContent />;
        if (step.id === 'recovery') return <RecoveryContent />;
        return null;
      case 'interactive_tare':
        return <TareScaleChallenge onPass={handleChallengePass} />;
      case 'interactive_weight':
        return <WeightLawChallenge onPass={handleChallengePass} />;
      case 'interactive_zones':
        return <RackZonesChallenge onPass={handleChallengePass} />;
      case 'interactive_photo':
        return <PhotoQualityChallenge onPass={handleChallengePass} />;
      case 'interactive_countdown':
        return <CountdownChallenge onPass={handleChallengePass} />;
      case 'interactive_leak':
        return <SpotLeakChallenge onPass={handleChallengePass} />;
      case 'complete':
        return <CompleteContent userRole={userRole} />;
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-950 z-50 flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <button
          onClick={onClose}
          className="p-2 text-gray-400 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>
        <div className="flex items-center gap-1">
          {steps.map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentStep 
                  ? 'bg-blue-500' 
                  : index < currentStep 
                    ? 'bg-green-500' 
                    : 'bg-gray-700'
              }`}
            />
          ))}
        </div>
        <div className="w-10" />
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-6">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 ${
              step.type === 'complete' ? 'bg-green-500/20' : 'bg-blue-500/20'
            }`}>
              <Icon size={32} className={step.type === 'complete' ? 'text-green-400' : 'text-blue-400'} />
            </div>
            <h1 className="text-xl font-bold text-white mb-1">{step.title}</h1>
            <p className="text-gray-400 text-sm">{step.subtitle}</p>
          </div>

          {renderContent()}
        </div>
      </div>

      <div className="p-4 border-t border-gray-800">
        <div className="max-w-md mx-auto space-y-3">
          <div className="flex items-center gap-3">
            {!isFirstStep && (
              <button
                onClick={handlePrev}
                className="flex-1 py-3 px-4 bg-gray-800 hover:bg-gray-700 text-white font-semibold rounded-lg flex items-center justify-center gap-2 transition-all"
              >
                <ChevronLeft size={18} />
                Back
              </button>
            )}
            <button
              onClick={handleNext}
              disabled={!canProceed}
              className={`flex-1 py-3 px-4 ${
                !canProceed
                  ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  : isLastStep 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : 'bg-blue-600 hover:bg-blue-700'
              } text-white font-semibold rounded-lg flex items-center justify-center gap-2 transition-all active:scale-[0.98]`}
            >
              {isLastStep ? (
                <>
                  <CheckCircle size={18} />
                  Start Using App
                </>
              ) : !canProceed ? (
                'Complete Challenge Above'
              ) : (
                <>
                  Next
                  <ChevronRight size={18} />
                </>
              )}
            </button>
          </div>
          {/* v1.00: Skip option - training can be completed later */}
          <button
            onClick={() => {
              // Notify Ops Manager that training was skipped
              fetch('/api/v1.00/ops-warning', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  type: 'TRAINING_SKIPPED',
                  message: `User skipped onboarding at step ${currentStep + 1}/${steps.length}`,
                  timestamp: new Date().toISOString()
                })
              }).catch(() => {});
              onClose();
            }}
            className="w-full text-center text-sm text-gray-500 hover:text-gray-300 transition-colors py-2"
          >
            Skip for now — I'll complete training later
          </button>
        </div>
      </div>
    </div>
  );
};
