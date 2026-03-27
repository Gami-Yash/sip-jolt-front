import React, { useState } from 'react';
import { Shield, Camera, Video, CheckCircle, ChevronRight, X, AlertTriangle, Loader } from 'lucide-react';
import ProofAssist from './ProofAssist';
import VideoRecorder from './VideoRecorder';

const RECOVERY_STEPS = [
  {
    id: 'token',
    title: 'Daily Token Photo',
    description: 'Take a photo showing today\'s 3-digit token displayed on the machine screen',
    icon: Camera,
    type: 'photo'
  },
  {
    id: 'squeeze',
    title: 'Squeeze Test Video',
    description: 'Record a 3-second video of the powder squeeze test',
    icon: Video,
    type: 'video'
  }
];

export const RecoveryWizard = ({
  siteId,
  siteName,
  onComplete,
  onCancel
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [capturedItems, setCapturedItems] = useState({
    token: null,
    squeeze: null
  });
  const [showCamera, setShowCamera] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const step = RECOVERY_STEPS[currentStep];
  const allComplete = Object.values(capturedItems).every(v => v !== null);

  const handlePhotoCapture = (data) => {
    setCapturedItems(prev => ({
      ...prev,
      [step.id]: data
    }));
    setShowCamera(false);
    
    if (currentStep < RECOVERY_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleVideoCapture = (data) => {
    setCapturedItems(prev => ({
      ...prev,
      [step.id]: data
    }));
    setShowVideo(false);
    
    if (currentStep < RECOVERY_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      const response = await fetch('/api/v1.00/recovery/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siteId,
          tokenPhotoUrl: capturedItems.token?.dataUrl || 'captured',
          squeezeVideoUrl: capturedItems.squeeze ? 'captured' : null
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        onComplete(result);
      } else {
        setError(result.error || 'Recovery submission failed');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const startCapture = () => {
    if (step.type === 'video') {
      setShowVideo(true);
    } else {
      setShowCamera(true);
    }
  };

  if (showCamera) {
    return (
      <ProofAssist
        onCapture={handlePhotoCapture}
        onCancel={() => setShowCamera(false)}
        overlayType="box"
        siteId={siteId}
        requireGPS={true}
      />
    );
  }

  if (showVideo) {
    return (
      <VideoRecorder
        onCapture={handleVideoCapture}
        onCancel={() => setShowVideo(false)}
        duration={3}
        overlayText="Squeeze the powder bag now"
        siteId={siteId}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-100 z-40">
      <div className="h-full flex flex-col">
        <div className="bg-red-600 text-white p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Shield size={24} />
              <span className="font-bold">SAFE MODE Recovery</span>
            </div>
            <button onClick={onCancel} className="p-1">
              <X size={24} />
            </button>
          </div>
          <p className="text-sm opacity-90">
            Complete 2 verification steps to unlock {siteName || siteId}
          </p>
        </div>
        
        <div className="flex gap-1 p-4 bg-white border-b">
          {RECOVERY_STEPS.map((s, idx) => (
            <div 
              key={s.id}
              className={`flex-1 h-2 rounded-full ${
                capturedItems[s.id] ? 'bg-green-500' : 
                idx === currentStep ? 'bg-blue-500' : 'bg-gray-300'
              }`}
            />
          ))}
        </div>
        
        <div className="flex-1 p-4 overflow-auto">
          <div className="max-w-md mx-auto">
            {RECOVERY_STEPS.map((s, idx) => {
              const StepIcon = s.icon;
              const isComplete = capturedItems[s.id] !== null;
              const isCurrent = idx === currentStep;
              
              return (
                <div 
                  key={s.id}
                  className={`mb-4 p-4 rounded-xl border-2 transition-all ${
                    isComplete ? 'bg-green-50 border-green-300' :
                    isCurrent ? 'bg-blue-50 border-blue-400' : 'bg-white border-gray-200'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${
                      isComplete ? 'bg-green-500' :
                      isCurrent ? 'bg-blue-500' : 'bg-gray-300'
                    }`}>
                      {isComplete ? (
                        <CheckCircle size={20} className="text-white" />
                      ) : (
                        <StepIcon size={20} className="text-white" />
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <h3 className={`font-bold ${
                        isComplete ? 'text-green-700' :
                        isCurrent ? 'text-blue-700' : 'text-gray-500'
                      }`}>
                        Step {idx + 1}: {s.title}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">{s.description}</p>
                      
                      {isCurrent && !isComplete && (
                        <button
                          onClick={startCapture}
                          className="mt-3 w-full py-3 bg-blue-600 text-white font-bold rounded-lg flex items-center justify-center gap-2"
                        >
                          {s.type === 'video' ? 'Start Recording' : 'Take Photo'}
                          <ChevronRight size={18} />
                        </button>
                      )}
                      
                      {isComplete && (
                        <div className="mt-2 text-sm text-green-600 flex items-center gap-1">
                          <CheckCircle size={14} />
                          Captured successfully
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        {error && (
          <div className="mx-4 mb-4 p-3 bg-red-100 border border-red-300 rounded-lg flex items-center gap-2 text-red-700">
            <AlertTriangle size={18} />
            <span className="text-sm">{error}</span>
          </div>
        )}
        
        <div className="p-4 bg-white border-t">
          <button
            onClick={handleSubmit}
            disabled={!allComplete || isSubmitting}
            className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 ${
              allComplete && !isSubmitting
                ? 'bg-green-600 text-white'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isSubmitting ? (
              <>
                <Loader size={20} className="animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Shield size={20} />
                Exit SAFE MODE
              </>
            )}
          </button>
          
          {!allComplete && (
            <p className="text-center text-gray-500 text-sm mt-2">
              Complete both steps to unlock
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecoveryWizard;
