import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Camera, X, Check, AlertTriangle, RefreshCw, Zap, MapPin } from 'lucide-react';

const LUMA_THRESHOLD = 30;
const MIN_FILE_SIZE_MB = 1;
const BLUR_THRESHOLD = 100;

export const ProofAssist = ({
  onCapture,
  onCancel,
  overlayType = 'box',
  requiredProofCode,
  siteId,
  requireGPS = true
}) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [quality, setQuality] = useState({ status: 'unknown', message: 'Initializing...' });
  const [gpsLocation, setGpsLocation] = useState(null);
  const [captureEnabled, setCaptureEnabled] = useState(false);
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);

  useEffect(() => {
    startCamera();
    if (requireGPS) getGPSLocation();
    
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });
      
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          setCameraReady(true);
          startQualityCheck();
        };
      }
    } catch (err) {
      console.error('Camera error:', err);
      setQuality({ status: 'error', message: 'Camera access denied' });
    }
  };

  const getGPSLocation = () => {
    if (!navigator.geolocation) {
      setQuality({ status: 'warning', message: 'GPS not available' });
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy
        });
      },
      (err) => {
        console.error('GPS error:', err);
        if (requireGPS) {
          setQuality({ status: 'error', message: 'GPS required - enable location' });
        }
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const calculateLuma = (imageData) => {
    const data = imageData.data;
    let totalLuma = 0;
    const pixelCount = data.length / 4;
    
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      totalLuma += (0.299 * r + 0.587 * g + 0.114 * b);
    }
    
    return totalLuma / pixelCount;
  };

  const detectBlur = (imageData) => {
    const data = imageData.data;
    const width = imageData.width;
    let laplacianSum = 0;
    let count = 0;
    
    for (let y = 1; y < imageData.height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;
        const center = data[idx];
        const top = data[((y - 1) * width + x) * 4];
        const bottom = data[((y + 1) * width + x) * 4];
        const left = data[(y * width + (x - 1)) * 4];
        const right = data[(y * width + (x + 1)) * 4];
        
        const laplacian = Math.abs(4 * center - top - bottom - left - right);
        laplacianSum += laplacian;
        count++;
      }
    }
    
    return laplacianSum / count;
  };

  const startQualityCheck = () => {
    const checkInterval = setInterval(() => {
      if (!videoRef.current || !canvasRef.current) return;
      
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      canvas.width = 320;
      canvas.height = 240;
      ctx.drawImage(video, 0, 0, 320, 240);
      
      const imageData = ctx.getImageData(0, 0, 320, 240);
      const luma = calculateLuma(imageData);
      const blur = detectBlur(imageData);
      
      let status = 'good';
      let message = 'Ready to capture';
      let canCapture = true;
      
      if (luma < LUMA_THRESHOLD) {
        status = 'error';
        message = 'Too dark - turn on flash or find better lighting';
        canCapture = false;
      } else if (luma < 50) {
        status = 'warning';
        message = 'Low light - consider using flash';
      }
      
      if (blur < BLUR_THRESHOLD && status !== 'error') {
        status = 'error';
        message = 'Image blurry - hold steady';
        canCapture = false;
      }
      
      if (requireGPS && !gpsLocation && status !== 'error') {
        status = 'warning';
        message = 'Waiting for GPS...';
        canCapture = false;
      }
      
      setQuality({ status, message, luma: Math.round(luma), blur: Math.round(blur) });
      setCaptureEnabled(canCapture);
      
    }, 500);
    
    return () => clearInterval(checkInterval);
  };

  const capturePhoto = useCallback(async () => {
    if (!captureEnabled || isCapturing) return;
    
    setIsCapturing(true);
    
    try {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0);
      
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.92));
      const fileSizeMB = blob.size / (1024 * 1024);
      
      if (fileSizeMB < MIN_FILE_SIZE_MB) {
        setQuality({ status: 'error', message: `Photo too small (${fileSizeMB.toFixed(1)}MB). Move closer.` });
        setIsCapturing(false);
        return;
      }
      
      const proofData = {
        blob,
        dataUrl: canvas.toDataURL('image/jpeg', 0.92),
        timestamp: new Date().toISOString(),
        clientTimestamp: Date.now(),
        gps: gpsLocation,
        proofCode: requiredProofCode,
        siteId,
        fileSizeMB: fileSizeMB.toFixed(2),
        quality: {
          luma: quality.luma,
          blur: quality.blur
        }
      };
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      
      onCapture(proofData);
    } catch (err) {
      console.error('Capture error:', err);
      setQuality({ status: 'error', message: 'Capture failed - try again' });
      setIsCapturing(false);
    }
  }, [captureEnabled, isCapturing, gpsLocation, requiredProofCode, siteId, quality, onCapture]);

  const getOverlayGuide = () => {
    switch (overlayType) {
      case 'box':
        return 'Center the box label in the frame';
      case 'wide':
        return 'Capture the full supply closet';
      case 'zone':
        return 'Show all zone markers clearly';
      case 'squeeze':
        return 'Focus on the powder bag';
      default:
        return 'Align subject in the center';
    }
  };

  const statusColors = {
    good: 'bg-green-500',
    warning: 'bg-yellow-500',
    error: 'bg-red-500',
    unknown: 'bg-gray-500'
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      <div className="relative flex-1">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />
        
        <canvas ref={canvasRef} className="hidden" />
        
        <div className="absolute inset-0 pointer-events-none">
          {/* Alignment Overlay - Non-blocking guide */}
          <div className="absolute inset-0 flex items-center justify-center opacity-30">
            <div className="w-64 h-80 border-4 border-white/50 rounded-2xl relative">
              <div className="absolute top-4 left-1/2 -translate-x-1/2 w-24 h-24 border-2 border-white/40 rounded-full" />
              <div className="absolute bottom-12 left-1/2 -translate-x-1/2 w-48 h-12 border-2 border-white/40 rounded-lg" />
            </div>
          </div>
          <div className="absolute inset-8 border-2 border-white/50 rounded-lg" />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 h-4 border-2 border-white rounded-full" />
        </div>
        
        <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
          <button
            onClick={onCancel}
            className="p-2 bg-black/50 rounded-full text-white"
          >
            <X size={24} />
          </button>
          
          <div className="flex gap-2">
            {gpsLocation && (
              <div className="flex items-center gap-1 bg-green-600/80 text-white text-xs px-2 py-1 rounded">
                <MapPin size={12} />
                GPS
              </div>
            )}
            <button
              onClick={() => setFlashEnabled(!flashEnabled)}
              className={`p-2 rounded-full ${flashEnabled ? 'bg-yellow-500' : 'bg-black/50'} text-white`}
            >
              <Zap size={20} />
            </button>
          </div>
        </div>
        
        <div className="absolute bottom-24 left-4 right-4">
          <div className={`${statusColors[quality.status]} text-white text-center py-2 px-4 rounded-lg text-sm font-medium`}>
            {quality.status === 'good' && <Check size={16} className="inline mr-2" />}
            {quality.status === 'warning' && <AlertTriangle size={16} className="inline mr-2" />}
            {quality.status === 'error' && <X size={16} className="inline mr-2" />}
            {quality.message}
          </div>
          
          <div className="text-white/70 text-xs text-center mt-2">
            {getOverlayGuide()}
          </div>
        </div>
      </div>
      
      <div className="bg-black p-6 flex justify-center">
        <button
          onClick={capturePhoto}
          disabled={!captureEnabled || isCapturing}
          className={`w-20 h-20 rounded-full border-4 flex items-center justify-center transition-all ${
            captureEnabled && !isCapturing
              ? 'border-white bg-white/20 active:scale-95'
              : 'border-gray-600 bg-gray-800 opacity-50 cursor-not-allowed'
          }`}
        >
          {isCapturing ? (
            <RefreshCw size={32} className="text-white animate-spin" />
          ) : (
            <Camera size={32} className={captureEnabled ? 'text-white' : 'text-gray-500'} />
          )}
        </button>
      </div>
    </div>
  );
};

export default ProofAssist;
