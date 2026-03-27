import React, { useState, useEffect, useRef } from 'react';
import { CheckCircle, Clock, MapPin, Camera, AlertTriangle, X, Bell, BellOff, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

export const Card = ({ children, className = '', onClick = null }) => (
  <div 
    className={`bg-white rounded-2xl shadow-sm border border-gray-200 ${onClick ? 'cursor-pointer hover:shadow-md transition-all duration-200 active:scale-[0.99]' : ''} ${className}`}
    onClick={onClick}
  >
    {children}
  </div>
);

export const Button = ({ children, onClick, variant = 'primary', className = '', disabled = false, completed = false }) => {
  const baseStyles = 'px-5 py-3 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm disabled:bg-gray-300',
    secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-200',
    danger: 'bg-red-100 hover:bg-red-200 text-red-700 border border-red-200',
    success: 'bg-green-600 hover:bg-green-700 text-white shadow-sm',
    outline: 'border border-blue-600 text-blue-600 hover:bg-blue-50',
    ghost: 'bg-transparent hover:bg-gray-100 text-gray-700'
  };
  
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variants[variant] || variants.primary} ${className} ${completed ? 'bg-green-500 hover:bg-green-600' : ''}`}
    >
      {children}
    </button>
  );
};

export const StatusBadge = ({ status }) => {
  const styles = {
    active: 'bg-green-100 text-green-800 border-green-300',
    service_due: 'bg-amber-100 text-amber-800 border-amber-300',
    repair: 'bg-red-100 text-red-800 border-red-300',
    offline: 'bg-gray-100 text-gray-600 border-gray-300'
  };
  
  const labels = {
    active: 'Active',
    service_due: 'Service Due',
    repair: 'Needs Repair',
    offline: 'Offline'
  };
  
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${styles[status] || styles.active}`}>
      {labels[status] || status}
    </span>
  );
};

export const Confetti = ({ trigger }) => {
  useEffect(() => {
    if (trigger) {
      const duration = 1500;
      const end = Date.now() + duration;
      
      const colors = ['#3B82F6', '#10B981', '#F59E0B'];
      
      const frame = () => {
        confetti({
          particleCount: 2,
          angle: 60,
          spread: 45,
          origin: { x: 0, y: 0.8 },
          colors: colors,
          disableForReducedMotion: true
        });
        confetti({
          particleCount: 2,
          angle: 120,
          spread: 45,
          origin: { x: 1, y: 0.8 },
          colors: colors,
          disableForReducedMotion: true
        });
        
        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      
      frame();
    }
  }, [trigger]);
  
  return null;
};

export const ToastNotification = ({ notification, onClose }) => {
  const [visible, setVisible] = useState(true);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 300);
    }, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);
  
  const typeStyles = {
    success: 'bg-green-600',
    error: 'bg-red-600',
    warning: 'bg-amber-500',
    info: 'bg-blue-600'
  };
  
  return (
    <div className={`${typeStyles[notification?.type] || typeStyles.info} text-white px-4 py-3 rounded-2xl shadow-lg flex items-center gap-3 min-w-[280px] transition-all duration-300 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
      <div className="flex-1">
        <p className="font-semibold text-sm">{notification?.title}</p>
        <p className="text-xs opacity-90">{notification?.message}</p>
      </div>
      <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-lg transition-colors">
        <X size={16} />
      </button>
    </div>
  );
};

export const MockPhotoUpload = ({ onUpload, label, hasPhoto, required = true }) => {
  const [uploading, setUploading] = useState(false);
  const [photos, setPhotos] = useState([]);
  const fileInputRef = useRef(null);

  const handleSimulateUpload = (file) => {
    setUploading(true);
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setTimeout(() => {
        const now = new Date();
        const mockPhoto = {
          url: reader.result,
          timestamp: now.toLocaleString(),
          gps: `${(37.7749 + Math.random() * 0.1).toFixed(6)}, ${(-122.4194 + Math.random() * 0.1).toFixed(6)}`,
          verified: true
        };
        const newPhotos = [...photos, mockPhoto];
        setPhotos(newPhotos);
        onUpload(newPhotos);
        setUploading(false);
      }, 1200);
    };
    reader.readAsDataURL(file);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleSimulateUpload(file);
    }
  };

  return (
    <div className="mt-3 md:mt-4 w-full">
      {photos.length > 0 && (
         <div className="mb-2 md:mb-3 flex flex-col gap-2">
            {photos.map((photo, idx) => (
              <div key={idx} className="flex items-start gap-2 md:gap-3 text-green-600 bg-green-50 p-2 md:p-3 rounded-lg text-xs border border-green-200">
                <img src={photo.url} alt={`Photo ${idx + 1}`} className="w-12 h-12 md:w-16 md:h-16 object-cover rounded" />
                <div className="flex-1">
                  <div className="flex items-center gap-1.5 md:gap-2 mb-0.5 md:mb-1">
                    <CheckCircle size={12} className="md:hidden" />
                    <CheckCircle size={14} className="hidden md:block" />
                    <span className="font-bold text-xs md:text-sm">Photo {idx + 1} Verified</span>
                  </div>
                  <div className="flex items-center gap-1 text-gray-600 text-xs">
                    <Clock size={10} className="md:hidden" />
                    <Clock size={12} className="hidden md:block" />
                    <span>{photo.timestamp}</span>
                  </div>
                  <div className="flex items-center gap-1 text-gray-600 text-xs">
                    <MapPin size={10} className="md:hidden" />
                    <MapPin size={12} className="hidden md:block" />
                    <span className="truncate">{photo.gps}</span>
                  </div>
                </div>
              </div>
            ))}
         </div>
      )}
      
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
      />
      
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className={`w-full p-3 md:p-4 border-2 border-dashed rounded-xl flex flex-col items-center gap-1.5 md:gap-2 transition-all ${
          photos.length > 0 
            ? 'border-green-300 bg-green-50 hover:border-green-400' 
            : required 
              ? 'border-blue-300 bg-blue-50 hover:border-blue-400' 
              : 'border-gray-300 bg-gray-50 hover:border-gray-400'
        } ${uploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-[0.99]'}`}
      >
        {uploading ? (
          <>
            <div className="w-6 h-6 md:w-8 md:h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-xs md:text-sm text-gray-600 font-medium">Verifying photo...</span>
          </>
        ) : (
          <>
            <Camera size={20} className={`md:hidden ${photos.length > 0 ? 'text-green-600' : 'text-blue-600'}`} />
            <Camera size={24} className={`hidden md:block ${photos.length > 0 ? 'text-green-600' : 'text-blue-600'}`} />
            <span className={`text-xs md:text-sm font-medium ${photos.length > 0 ? 'text-green-700' : 'text-gray-700'}`}>
              {photos.length > 0 ? `Add Another Photo (${photos.length} taken)` : (label || 'Tap to Take Photo')}
            </span>
            {required && photos.length === 0 && (
              <span className="text-xs text-red-500 font-medium flex items-center gap-1">
                <AlertTriangle size={10} className="md:hidden" />
                <AlertTriangle size={12} className="hidden md:block" />
                Required
              </span>
            )}
          </>
        )}
      </button>
    </div>
  );
};
