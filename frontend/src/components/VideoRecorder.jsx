import React, { useState, useRef, useEffect } from 'react';
import { Video, Square, RefreshCw, Check, X, AlertTriangle } from 'lucide-react';

const SQUEEZE_DURATION_SECONDS = 3;

export const VideoRecorder = ({
  onCapture,
  onCancel,
  duration = SQUEEZE_DURATION_SECONDS,
  overlayText = 'Recording Squeeze Test',
  siteId
}) => {
  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);
  
  const [cameraReady, setCameraReady] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const [timeLeft, setTimeLeft] = useState(duration);
  const [recordedBlob, setRecordedBlob] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });
      
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => setCameraReady(true);
      }
    } catch (err) {
      console.error('Camera error:', err);
      setError('Camera access denied. Please enable camera permissions.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
  };

  const startRecording = () => {
    if (!streamRef.current) return;
    
    setCountdown(3);
    
    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          beginRecording();
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const beginRecording = () => {
    chunksRef.current = [];
    
    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
      ? 'video/webm;codecs=vp9'
      : MediaRecorder.isTypeSupported('video/webm')
        ? 'video/webm'
        : 'video/mp4';
    
    const mediaRecorder = new MediaRecorder(streamRef.current, { mimeType });
    mediaRecorderRef.current = mediaRecorder;
    
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunksRef.current.push(e.data);
      }
    };
    
    mediaRecorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mimeType });
      setRecordedBlob(blob);
    };
    
    setIsRecording(true);
    setTimeLeft(duration);
    mediaRecorder.start(100);
    
    const timerInterval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerInterval);
          stopRecording();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const handleConfirm = () => {
    if (recordedBlob) {
      stopCamera();
      onCapture({
        blob: recordedBlob,
        timestamp: new Date().toISOString(),
        clientTimestamp: Date.now(),
        duration,
        siteId,
        mimeType: recordedBlob.type
      });
    }
  };

  const handleRetake = () => {
    setRecordedBlob(null);
    setTimeLeft(duration);
  };

  const handleCancel = () => {
    stopCamera();
    onCancel();
  };

  if (error) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl p-6 max-w-sm text-center">
          <AlertTriangle size={48} className="text-red-500 mx-auto mb-4" />
          <p className="text-gray-800 mb-4">{error}</p>
          <button
            onClick={handleCancel}
            className="px-6 py-2 bg-gray-200 rounded-lg font-medium"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

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
        
        {countdown !== null && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="text-8xl font-bold text-white animate-pulse">
              {countdown}
            </div>
          </div>
        )}
        
        {isRecording && (
          <>
            <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-600 text-white px-3 py-2 rounded-lg">
              <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
              <span className="font-bold">REC</span>
              <span>{timeLeft}s</span>
            </div>
            
            <div className="absolute bottom-24 left-4 right-4 text-center">
              <div className="bg-black/70 text-white py-2 px-4 rounded-lg inline-block">
                {overlayText}
              </div>
            </div>
            
            <div className="absolute top-4 right-4 bg-white/20 rounded-full overflow-hidden w-20 h-2">
              <div 
                className="h-full bg-red-500 transition-all duration-1000"
                style={{ width: `${((duration - timeLeft) / duration) * 100}%` }}
              />
            </div>
          </>
        )}
        
        {recordedBlob && !isRecording && (
          <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
            <div className="bg-white rounded-xl p-6 max-w-sm text-center">
              <Check size={48} className="text-green-500 mx-auto mb-4" />
              <p className="text-gray-800 font-medium mb-2">Video Captured!</p>
              <p className="text-gray-500 text-sm mb-6">
                {(recordedBlob.size / 1024 / 1024).toFixed(2)} MB recorded
              </p>
              
              <div className="flex gap-3">
                <button
                  onClick={handleRetake}
                  className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium flex items-center justify-center gap-2"
                >
                  <RefreshCw size={18} />
                  Retake
                </button>
                <button
                  onClick={handleConfirm}
                  className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg font-medium flex items-center justify-center gap-2"
                >
                  <Check size={18} />
                  Use Video
                </button>
              </div>
            </div>
          </div>
        )}
        
        <button
          onClick={handleCancel}
          className="absolute top-4 left-4 p-2 bg-black/50 rounded-full text-white"
          style={{ display: isRecording ? 'none' : 'block' }}
        >
          <X size={24} />
        </button>
      </div>
      
      {!recordedBlob && !isRecording && countdown === null && cameraReady && (
        <div className="bg-black p-6 flex flex-col items-center gap-4">
          <p className="text-white/70 text-sm text-center">
            Record a {duration}-second video of the squeeze test
          </p>
          <button
            onClick={startRecording}
            className="w-20 h-20 rounded-full bg-red-600 flex items-center justify-center active:scale-95 transition-transform"
          >
            <Video size={32} className="text-white" />
          </button>
        </div>
      )}
    </div>
  );
};

export default VideoRecorder;
