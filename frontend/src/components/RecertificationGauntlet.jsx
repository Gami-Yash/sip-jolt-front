import React, { useState, useEffect } from 'react';
import { X, PlayCircle, CheckCircle, XCircle, AlertTriangle, Lock, Video } from 'lucide-react';

const RECERT_QUIZ = [
  {
    id: 1,
    question: "Your photo is dark (ProofAssist says Luma < 30). What do you do?",
    options: [
      { text: "Turn on lights/flash and retake", correct: true },
      { text: "Force capture anyway", correct: false }
    ]
  },
  {
    id: 2,
    question: "You are 100m from the site. Can you submit a POD (Proof of Delivery)?",
    options: [
      { text: "No, must be within 50m", correct: true },
      { text: "Yes, override it", correct: false }
    ]
  },
  {
    id: 3,
    question: "Where do you enter package weights?",
    options: [
      { text: "Hub is truth - weights come from scale photos", correct: true },
      { text: "Type it manually in the app", correct: false }
    ]
  }
];

export const RecertificationGauntlet = ({ user, onRecertified, onClose }) => {
  const [step, setStep] = useState('intro');
  const [videoWatched, setVideoWatched] = useState(false);
  const [videoTimer, setVideoTimer] = useState(30);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [quizPassed, setQuizPassed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  
  const reliabilityScore = user?.reliabilityScore ?? user?.reliability_score ?? 85;
  const recertAttempts = user?.recertAttemptsLast30Days ?? user?.recert_attempts_last_30_days ?? 0;
  
  const isRedBadge = reliabilityScore < 80;
  const isHardLocked = recertAttempts >= 3;
  
  useEffect(() => {
    if (step === 'video' && videoTimer > 0) {
      const timer = setInterval(() => {
        setVideoTimer(prev => {
          if (prev <= 1) {
            setVideoWatched(true);
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [step, videoTimer]);
  
  const handleAnswer = (questionId, optionIndex) => {
    const question = RECERT_QUIZ.find(q => q.id === questionId);
    const isCorrect = question.options[optionIndex].correct;
    
    setAnswers(prev => ({
      ...prev,
      [questionId]: { optionIndex, isCorrect }
    }));
  };
  
  const handleNextQuestion = () => {
    if (currentQuestion < RECERT_QUIZ.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      const allCorrect = RECERT_QUIZ.every(q => answers[q.id]?.isCorrect);
      if (allCorrect) {
        setQuizPassed(true);
        setStep('success');
      } else {
        setStep('failed');
      }
    }
  };
  
  const handleSubmitRecert = async () => {
    setSubmitting(true);
    setError(null);
    
    try {
      const response = await fetch('/api/user/recertify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user?.uid || user?.id || 'anonymous',
          passed_at: new Date().toISOString(),
          quiz_score: '3/3'
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to submit recertification');
      }
      
      if (onRecertified) {
        onRecertified({ reliabilityScore: 80, badge: 'yellow' });
      }
    } catch (e) {
      console.error('[Recertification] Error:', e);
      setError('Failed to complete recertification. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };
  
  const handleRetry = () => {
    setStep('video');
    setVideoTimer(30);
    setVideoWatched(false);
    setCurrentQuestion(0);
    setAnswers({});
    setQuizPassed(false);
  };
  
  if (!isRedBadge) {
    return null;
  }
  
  if (isHardLocked) {
    return (
      <div className="fixed inset-0 bg-black/80 z-[200] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock size={32} className="text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-red-800 mb-2">Account Under Review</h2>
          <p className="text-gray-600 mb-6">
            You've reached the maximum recertification attempts (3) in the last 30 days. 
            Your account requires manual review by Operations.
          </p>
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <p className="text-sm text-red-700">
              <strong>Reliability Score:</strong> {reliabilityScore}/100
              <br />
              <strong>Status:</strong> Locked
            </p>
          </div>
          <p className="text-sm text-gray-500">
            Contact your Ops Manager or wait for review to continue using the app.
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="fixed inset-0 bg-black/80 z-[200] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        {step === 'intro' && (
          <div className="p-6 text-center">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={32} className="text-yellow-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Maintenance Paused</h2>
            <p className="text-gray-600 mb-4">
              Your reliability score has dropped below 80. To continue servicing machines, 
              you must complete a quick recertification.
            </p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
              <p className="text-sm text-yellow-800">
                <strong>Current Score:</strong> {reliabilityScore}/100
                <br />
                <strong>Required:</strong> 80+
                <br />
                <strong>Attempts Remaining:</strong> {3 - recertAttempts}
              </p>
            </div>
            <button
              onClick={() => setStep('video')}
              className="w-full py-3 px-6 bg-slate-600 hover:bg-slate-700 text-white rounded-xl font-medium transition-colors"
            >
              Start Recertification
            </button>
          </div>
        )}
        
        {step === 'video' && (
          <div className="p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Video size={20} className="text-slate-600" />
              Step 1: Watch Training Video
            </h2>
            <div className="bg-gray-900 rounded-xl aspect-video flex items-center justify-center mb-4 relative overflow-hidden">
              <div className="text-center text-white">
                <PlayCircle size={48} className="mx-auto mb-2 opacity-60" />
                <p className="text-sm opacity-80">Training Video</p>
                <p className="text-xs opacity-60 mt-1">Best practices for field operations</p>
              </div>
              {!videoWatched && (
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-2">
                  <div className="flex items-center justify-between text-white text-sm">
                    <span>Time remaining: {videoTimer}s</span>
                    <div className="w-32 bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all"
                        style={{ width: `${((30 - videoTimer) / 30) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
            <button
              onClick={() => setStep('quiz')}
              disabled={!videoWatched}
              className={`w-full py-3 px-6 rounded-xl font-medium transition-colors ${
                videoWatched 
                  ? 'bg-slate-600 hover:bg-slate-700 text-white' 
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              {videoWatched ? 'Continue to Quiz' : `Watch video (${videoTimer}s remaining)`}
            </button>
          </div>
        )}
        
        {step === 'quiz' && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Step 2: Knowledge Check</h2>
              <span className="text-sm text-gray-500">
                {currentQuestion + 1} of {RECERT_QUIZ.length}
              </span>
            </div>
            
            <div className="mb-6">
              <div className="flex gap-1 mb-4">
                {RECERT_QUIZ.map((_, idx) => (
                  <div 
                    key={idx}
                    className={`flex-1 h-1 rounded-full ${
                      idx < currentQuestion ? 'bg-green-500' :
                      idx === currentQuestion ? 'bg-slate-600' : 'bg-gray-200'
                    }`}
                  />
                ))}
              </div>
              
              <p className="text-gray-900 font-medium mb-4">
                {RECERT_QUIZ[currentQuestion].question}
              </p>
              
              <div className="space-y-2">
                {RECERT_QUIZ[currentQuestion].options.map((option, idx) => {
                  const isSelected = answers[RECERT_QUIZ[currentQuestion].id]?.optionIndex === idx;
                  return (
                    <button
                      key={idx}
                      onClick={() => handleAnswer(RECERT_QUIZ[currentQuestion].id, idx)}
                      className={`w-full p-4 text-left rounded-xl border-2 transition-all ${
                        isSelected 
                          ? 'border-slate-600 bg-slate-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <span className={isSelected ? 'text-slate-800 font-medium' : 'text-gray-700'}>
                        {option.text}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
            
            <button
              onClick={handleNextQuestion}
              disabled={!answers[RECERT_QUIZ[currentQuestion].id]}
              className={`w-full py-3 px-6 rounded-xl font-medium transition-colors ${
                answers[RECERT_QUIZ[currentQuestion].id]
                  ? 'bg-slate-600 hover:bg-slate-700 text-white' 
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              {currentQuestion < RECERT_QUIZ.length - 1 ? 'Next Question' : 'Submit Answers'}
            </button>
          </div>
        )}
        
        {step === 'success' && (
          <div className="p-6 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={32} className="text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-green-800 mb-2">Recertification Complete!</h2>
            <p className="text-gray-600 mb-6">
              You've passed all questions. Your reliability score has been reset to 80 (Yellow Badge).
            </p>
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}
            <button
              onClick={handleSubmitRecert}
              disabled={submitting}
              className="w-full py-3 px-6 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
            >
              {submitting ? 'Processing...' : 'Continue to App'}
            </button>
          </div>
        )}
        
        {step === 'failed' && (
          <div className="p-6 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle size={32} className="text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-red-800 mb-2">Quiz Not Passed</h2>
            <p className="text-gray-600 mb-6">
              Some answers were incorrect. Please re-watch the training video and try again.
            </p>
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
              <p className="text-sm text-red-700">
                <strong>Attempts Remaining:</strong> {3 - recertAttempts - 1}
              </p>
            </div>
            <button
              onClick={handleRetry}
              className="w-full py-3 px-6 bg-slate-600 hover:bg-slate-700 text-white rounded-xl font-medium transition-colors"
            >
              Retry Recertification
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
