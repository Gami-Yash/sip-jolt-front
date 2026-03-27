import { useState, useEffect } from 'react';
import { ChevronLeft, Video, Upload, Check, Clock, AlertCircle, Play, Trash2, X } from 'lucide-react';
import { VideoPlayer } from './VideoPlayer';
import { resolveVideoUrl } from '../utils/imagekit';

export function VideoManager({ onClose, opsToken }) {
  const [steps, setSteps] = useState({ weekly: [], monthly: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [activeTab, setActiveTab] = useState('weekly');
  const [previewVideo, setPreviewVideo] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetchSteps();
  }, []);

  const fetchSteps = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/videos', {
        headers: { 'x-ops-token': opsToken }
      });
      const data = await res.json();
      if (data.success) {
        setSteps({ weekly: data.weekly, monthly: data.monthly });
      } else {
        setError(data.error || 'Failed to load videos');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleFileSelect = async (stepId, file) => {
    if (!file) return;
    
    if (!file.type.startsWith('video/')) {
      showToast('Please select a video file', 'error');
      return;
    }

    const maxSize = 200 * 1024 * 1024;
    if (file.size > maxSize) {
      showToast('Video must be under 200MB', 'error');
      return;
    }

    setUploading(stepId);
    setUploadProgress(0);

    try {
      const urlRes = await fetch('/api/uploads/request-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: file.name,
          size: file.size,
          contentType: file.type
        })
      });
      const urlData = await urlRes.json();
      
      if (!urlData.uploadURL) {
        throw new Error('Failed to get upload URL');
      }

      setUploadProgress(20);

      const xhr = new XMLHttpRequest();
      
      await new Promise((resolve, reject) => {
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const percent = 20 + (e.loaded / e.total) * 70;
            setUploadProgress(Math.round(percent));
          }
        };
        
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error('Upload failed'));
          }
        };
        
        xhr.onerror = () => reject(new Error('Network error during upload'));
        
        xhr.open('PUT', urlData.uploadURL);
        xhr.setRequestHeader('Content-Type', file.type);
        xhr.send(file);
      });

      setUploadProgress(95);

      const saveRes = await fetch(`/api/videos/${stepId}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-ops-token': opsToken
        },
        body: JSON.stringify({
          videoUrl: urlData.objectPath,
          objectPath: urlData.objectPath,
          fileSize: file.size,
          uploadedBy: 'ops_manager'
        })
      });
      
      const saveData = await saveRes.json();
      if (!saveData.success) {
        throw new Error(saveData.error || 'Failed to save video');
      }

      setUploadProgress(100);
      showToast('Video uploaded successfully!');
      
      await fetchSteps();
      
    } catch (err) {
      console.error('Upload error:', err);
      showToast(err.message || 'Upload failed. Please try again.', 'error');
    } finally {
      setUploading(null);
      setUploadProgress(0);
    }
  };

  const handleDelete = async (stepId) => {
    if (!confirm('Remove this video?')) return;
    
    try {
      const res = await fetch(`/api/videos/${stepId}`, {
        method: 'DELETE',
        headers: { 'x-ops-token': opsToken }
      });
      
      if (res.ok) {
        showToast('Video removed');
        await fetchSteps();
      } else {
        showToast('Failed to remove video', 'error');
      }
    } catch (err) {
      showToast('Network error', 'error');
    }
  };

  const currentSteps = activeTab === 'weekly' ? steps.weekly : steps.monthly;
  const uploadedCount = currentSteps.filter(s => s.hasVideo).length;
  const totalCount = currentSteps.length;

  return (
    <div className="fixed inset-0 bg-slate-50 z-[60] flex flex-col overflow-hidden">
      <div className="bg-white border-b border-gray-200 p-4 pt-[max(1rem,var(--safe-area-top))] z-10">
        <div className="flex items-center gap-3 mb-4">
          <button 
            onClick={onClose}
            className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors touch-target flex items-center justify-center"
          >
            <ChevronLeft size={28} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Video Manager</h1>
            <p className="text-sm text-gray-500">Instructional videos for each step</p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('weekly')}
            className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all ${
              activeTab === 'weekly' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Weekly ({steps.weekly.filter(s => s.hasVideo).length}/{steps.weekly.length})
          </button>
          <button
            onClick={() => setActiveTab('monthly')}
            className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all ${
              activeTab === 'monthly' 
                ? 'bg-slate-700 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Monthly ({steps.monthly.filter(s => s.hasVideo).length}/{steps.monthly.length})
          </button>
        </div>

        <div className="mt-3 bg-gray-100 rounded-full h-2 overflow-hidden">
          <div 
            className={`h-full transition-all ${activeTab === 'weekly' ? 'bg-blue-600' : 'bg-slate-700'}`}
            style={{ width: `${totalCount > 0 ? (uploadedCount / totalCount) * 100 : 0}%` }}
          />
        </div>
        <p className="text-xs text-gray-500 mt-1 text-center">
          {uploadedCount} of {totalCount} videos uploaded
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-[max(6rem,var(--safe-area-bottom))]">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <AlertCircle size={48} className="mx-auto text-red-400 mb-4" />
            <p className="text-gray-600">{error}</p>
            <button 
              onClick={fetchSteps}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-xl font-semibold"
            >
              Try Again
            </button>
          </div>
        ) : (
          currentSteps.map((step, index) => (
            <div 
              key={step.stepId}
              className={`bg-white rounded-2xl border-2 p-4 transition-all ${
                step.hasVideo ? 'border-green-300' : 'border-gray-200'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  step.hasVideo 
                    ? 'bg-green-100 text-green-600' 
                    : 'bg-gray-100 text-gray-400'
                }`}>
                  {step.hasVideo ? <Check size={20} /> : <Video size={20} />}
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900">{step.title}</h3>
                  <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{step.description}</p>
                  
                  {step.hasVideo && step.uploadedAt && (
                    <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                      <Clock size={12} />
                      Uploaded {new Date(step.uploadedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>

              {uploading === step.stepId ? (
                <div className="mt-4">
                  <div className="bg-blue-100 rounded-full h-3 overflow-hidden">
                    <div 
                      className="h-full bg-blue-600 transition-all"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="text-xs text-blue-600 mt-1 text-center">
                    Uploading... {uploadProgress}%
                  </p>
                </div>
              ) : (
                <div className="flex gap-2 mt-4">
                  {step.hasVideo && (
                    <>
                      <button
                        onClick={() => setPreviewVideo({ url: step.videoUrl, title: step.title })}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-50 text-blue-600 rounded-xl font-semibold hover:bg-blue-100 transition-colors"
                      >
                        <Play size={18} />
                        Preview
                      </button>
                      <button
                        onClick={() => handleDelete(step.stepId)}
                        className="p-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </>
                  )}
                  
                  <label className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-semibold cursor-pointer transition-colors ${
                    step.hasVideo 
                      ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' 
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}>
                    <Upload size={18} />
                    {step.hasVideo ? 'Replace' : 'Upload Video'}
                    <input
                      type="file"
                      accept="video/*"
                      className="hidden"
                      onChange={(e) => handleFileSelect(step.stepId, e.target.files?.[0])}
                    />
                  </label>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {toast && (
        <div className={`fixed bottom-20 left-4 right-4 p-4 rounded-xl shadow-lg z-50 flex items-center gap-3 ${
          toast.type === 'error' ? 'bg-red-600' : 'bg-green-600'
        } text-white`}>
          {toast.type === 'error' ? <AlertCircle size={20} /> : <Check size={20} />}
          {toast.message}
        </div>
      )}

      {previewVideo && (
        <VideoPlayer 
          videoUrl={resolveVideoUrl(previewVideo.url)}
          title={previewVideo.title}
          onClose={() => setPreviewVideo(null)}
        />
      )}
    </div>
  );
}

export default VideoManager;
