import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Zap, Gift, RotateCw, X } from 'lucide-react';
import { SpinEffectsManager } from '../utils/spinEffects';

const COLORS = {
  violet: '#7C3AED',
  cyan: '#06B6D4',
  rose: '#F43F5E',
  emerald: '#10B981',
  goldLight: '#FCD34D',
  gold: '#F59E0B',
  goldDark: '#D97706',
  silver: '#C0C0C0',
  silverDark: '#A8A8A8',
  blue: '#3B82F6',
  blueDark: '#1D4ED8',
  green: '#10B981',
  greenDark: '#059669',
  purple: '#8B5CF6',
  purpleDark: '#7C3AED',
  white: '#FFFFFF',
  slate100: '#F1F5F9',
  slate200: '#E2E8F0',
  slate400: '#94A3B8',
  slate600: '#475569',
  slate800: '#1E293B',
  slate900: '#0F172A',
};

const V99_SEGMENTS = [
  { id: 0, tier: 'COMMON', name: 'Better Luck', label: 'TRY AGAIN', emoji: '🔄', color: COLORS.silver, isGold: false, weight: 8 },
  { id: 1, tier: 'COMMON', name: '+25 Points', label: '25 PTS', emoji: null, color: COLORS.blue, isGold: false, weight: 10 },
  { id: 2, tier: 'LEGENDARY', name: 'Bluetooth Speaker', label: 'SPEAKER', emoji: null, color: 'gold', isGold: true, weight: 4 },
  { id: 3, tier: 'COMMON', name: 'Better Luck', label: 'TRY AGAIN', emoji: '🔄', color: COLORS.silverDark, isGold: false, weight: 9 },
  { id: 4, tier: 'RARE', name: '$5 Cash', label: '$5', emoji: null, color: COLORS.emerald, isGold: false, weight: 6 },
  { id: 5, tier: 'COMMON', name: 'Better Luck', label: 'TRY AGAIN', emoji: '🔄', color: COLORS.silver, isGold: false, weight: 8 },
  { id: 6, tier: 'EPIC', name: '$25 Cash', label: '$25', emoji: null, color: COLORS.purple, isGold: false, weight: 4 },
  { id: 7, tier: 'COMMON', name: 'Better Luck', label: 'TRY AGAIN', emoji: '🔄', color: COLORS.silverDark, isGold: false, weight: 8 },
  { id: 8, tier: 'COMMON', name: '+50 Points', label: '50 PTS', emoji: null, color: COLORS.blueDark, isGold: false, weight: 8 },
  { id: 9, tier: 'LEGENDARY', name: 'Kindle', label: 'KINDLE', emoji: null, color: 'gold', isGold: true, weight: 4 },
  { id: 10, tier: 'COMMON', name: 'Better Luck', label: 'TRY AGAIN', emoji: '🔄', color: COLORS.silver, isGold: false, weight: 8 },
  { id: 11, tier: 'RARE', name: '$10 Cash', label: '$10', emoji: null, color: COLORS.greenDark, isGold: false, weight: 5 },
  { id: 12, tier: 'EPIC', name: '$50 Cash', label: '$50', emoji: null, color: COLORS.purpleDark, isGold: false, weight: 3 },
  { id: 13, tier: 'COMMON', name: 'Better Luck', label: 'TRY AGAIN', emoji: '🔄', color: COLORS.silverDark, isGold: false, weight: 8 },
  { id: 14, tier: 'LEGENDARY', name: 'AirPods', label: 'AIRPODS', emoji: null, color: 'gold', isGold: true, weight: 4 },
  { id: 15, tier: 'COMMON', name: 'Better Luck', label: 'TRY AGAIN', emoji: '🔄', color: COLORS.silver, isGold: false, weight: 8 },
  { id: 16, tier: 'COMMON', name: '+100 Points', label: '100 PTS', emoji: null, color: COLORS.violet, isGold: false, weight: 6 },
  { id: 17, tier: 'LEGENDARY', name: '55" Smart TV', label: 'TV', emoji: null, color: 'gold', isGold: true, weight: 5 },
];

const buildAuthHeaders = (user, fallbackRole = 'technician') => {
  const userId = user?.id || user?.technician_id || user?.userId || user?.displayName || user?.driverId || 'tech-001';
  const role = (user?.role || user?.userRole || fallbackRole).toString().toLowerCase();
  return {
    'x-user-id': String(userId),
    'x-user-role': role
  };
};

function computeSegmentLayout(segments) {
  const totalWeight = segments.reduce((sum, s) => sum + s.weight, 0);
  let cumulative = 0;
  return segments.map((segment, index) => {
    const normalizedSize = (segment.weight / totalWeight) * 360;
    const startAngle = cumulative;
    const endAngle = cumulative + normalizedSize;
    const midAngle = startAngle + normalizedSize / 2;
    cumulative = endAngle;
    return { ...segment, index, startAngle, endAngle, midAngle, normalizedSize };
  });
}

function selectWinner(segments) {
  const totalWeight = segments.reduce((sum, s) => sum + s.weight, 0);
  let random = Math.random() * totalWeight;
  for (let i = 0; i < segments.length; i++) {
    random -= segments[i].weight;
    if (random <= 0) return i;
  }
  return 0;
}

function computeWinningRotation(segmentLayout, winnerIndex, fullSpins = 9) {
  const winner = segmentLayout[winnerIndex];
  if (!winner) return fullSpins * 360;
  const targetAngle = 360 - winner.midAngle;
  const jitter = (Math.random() - 0.5) * winner.normalizedSize * 0.5;
  return (fullSpins * 360) + targetAngle + jitter;
}

function WheelSVG({ segmentLayout, size = 320 }) {
  const cx = size / 2;
  const cy = size / 2;
  const radius = (size / 2) - 12;
  
  const polarToCartesian = (angle, r = radius) => {
    const rad = (angle - 90) * (Math.PI / 180);
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  };
  
  const createArcPath = (startAngle, endAngle) => {
    const start = polarToCartesian(startAngle);
    const end = polarToCartesian(endAngle);
    const largeArc = (endAngle - startAngle) > 180 ? 1 : 0;
    return `M ${cx} ${cy} L ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y} Z`;
  };
  
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <defs>
        <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={COLORS.goldLight}/>
          <stop offset="40%" stopColor={COLORS.gold}/>
          <stop offset="100%" stopColor={COLORS.goldDark}/>
        </linearGradient>
        <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#E2E8F0"/>
          <stop offset="30%" stopColor="#FFFFFF"/>
          <stop offset="70%" stopColor="#F1F5F9"/>
          <stop offset="100%" stopColor="#CBD5E1"/>
        </linearGradient>
        <filter id="wheelShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="6" stdDeviation="10" floodOpacity="0.2"/>
        </filter>
        <filter id="goldGlow">
          <feGaussianBlur stdDeviation="2" result="blur"/>
          <feComposite in="SourceGraphic" in2="blur" operator="over"/>
        </filter>
      </defs>
      
      <circle cx={cx} cy={cy} r={radius + 10} fill="url(#ringGradient)" filter="url(#wheelShadow)"/>
      
      {Array.from({ length: 48 }, (_, i) => {
        const angle = (i * 7.5 - 90) * (Math.PI / 180);
        const inner = radius + 4;
        const outer = radius + 9;
        return (
          <line
            key={i}
            x1={cx + inner * Math.cos(angle)}
            y1={cy + inner * Math.sin(angle)}
            x2={cx + outer * Math.cos(angle)}
            y2={cy + outer * Math.sin(angle)}
            stroke={i % 6 === 0 ? COLORS.slate600 : COLORS.slate400}
            strokeWidth={i % 6 === 0 ? 2 : 1}
          />
        );
      })}
      
      {segmentLayout.map((segment) => {
        const isGold = segment.isGold;
        const fill = isGold ? 'url(#goldGradient)' : segment.color;
        
        return (
          <g key={segment.id}>
            <path
              d={createArcPath(segment.startAngle, segment.endAngle)}
              fill={fill}
              stroke={COLORS.white}
              strokeWidth="2.5"
              filter={isGold ? 'url(#goldGlow)' : undefined}
            />
            
            {(() => {
              const contentRadius = radius * 0.62;
              const pos = polarToCartesian(segment.midAngle, contentRadius);
              let textAngle = segment.midAngle - 90;
              if (segment.midAngle > 90 && segment.midAngle < 270) textAngle += 180;
              
              if (segment.label === 'TRY AGAIN') {
                return (
                  <text
                    x={pos.x}
                    y={pos.y}
                    fill={COLORS.white}
                    fontSize="10"
                    fontWeight="900"
                    fontFamily="'Inter', 'SF Pro Display', system-ui, sans-serif"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    transform={`rotate(${textAngle}, ${pos.x}, ${pos.y})`}
                    style={{ letterSpacing: '0.02em' }}
                  >
                    TRY AGAIN
                  </text>
                );
              } else if (segment.emoji && !segment.label.includes('PTS') && !segment.label.includes('$')) {
                // Keep emoji only for non-TRY AGAIN segments with emojis
                return (
                  <text
                    x={pos.x}
                    y={pos.y}
                    fontSize="22"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    transform={`rotate(${textAngle}, ${pos.x}, ${pos.y})`}
                  >
                    {segment.emoji}
                  </text>
                );
              } else {
                // Words only for all prize segments
                return (
                  <text
                    x={pos.x}
                    y={pos.y}
                    fill={isGold ? COLORS.slate900 : COLORS.white}
                    fontSize={isGold ? '10' : '12'}
                    fontWeight="900"
                    fontFamily="'Inter', 'SF Pro Display', system-ui, sans-serif"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    transform={`rotate(${textAngle}, ${pos.x}, ${pos.y})`}
                    style={{ letterSpacing: '0.02em' }}
                  >
                    {segment.label}
                  </text>
                );
              }
            })()}
          </g>
        );
      })}
      
      <circle cx={cx} cy={cy} r={radius * 0.24} fill={COLORS.white} stroke={COLORS.slate200} strokeWidth="3"/>
      <circle cx={cx} cy={cy} r={radius * 0.18} fill={COLORS.slate800}/>
      <text
        x={cx}
        y={cy}
        fill={COLORS.white}
        fontSize="12"
        fontWeight="800"
        fontFamily="'Inter', sans-serif"
        textAnchor="middle"
        dominantBaseline="middle"
        style={{ letterSpacing: '0.1em' }}
      >
        SPIN
      </text>
    </svg>
  );
}

function Pointer() {
  return (
    <div className="absolute top-0 left-1/2 -translate-x-1/2 z-20" style={{ marginTop: '-4px' }}>
      <svg width="32" height="36" viewBox="0 0 32 36">
        <defs>
          <linearGradient id="redTickerGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#EF4444"/>
            <stop offset="50%" stopColor="#DC2626"/>
            <stop offset="100%" stopColor="#B91C1C"/>
          </linearGradient>
          <filter id="tickerShadow">
            <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.4"/>
          </filter>
        </defs>
        <path d="M16 36 L4 8 L16 0 L28 8 Z" fill="url(#redTickerGrad)" filter="url(#tickerShadow)"/>
        <path d="M16 32 L7 10 L16 4 Z" fill="rgba(255,255,255,0.15)"/>
        <circle cx="16" cy="12" r="3" fill="white" opacity="0.9"/>
      </svg>
    </div>
  );
}

function Confetti({ active }) {
  const particles = useMemo(() => {
    return Array.from({ length: 60 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 0.6,
      duration: 1.8 + Math.random() * 1.2,
      color: [COLORS.violet, COLORS.cyan, COLORS.rose, COLORS.emerald, COLORS.gold][Math.floor(Math.random() * 5)],
      size: 5 + Math.random() * 7,
      rotation: Math.random() * 360
    }));
  }, []);
  
  if (!active) return null;
  
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl">
      {particles.map(p => (
        <div
          key={p.id}
          className="absolute"
          style={{
            left: `${p.x}%`,
            top: '-12px',
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            borderRadius: Math.random() > 0.5 ? '50%' : '2px',
            transform: `rotate(${p.rotation}deg)`,
            animation: `confettiFall ${p.duration}s ease-out ${p.delay}s forwards`
          }}
        />
      ))}
    </div>
  );
}

function ResultModal({ prize, onClose, onSpinAgain, canSpinAgain }) {
  if (!prize) return null;
  
  const isJackpot = prize.isGold;
  const isLoss = prize.name.includes('Better Luck');
  
  const tierConfig = {
    LEGENDARY: { bg: 'bg-gradient-to-br from-amber-100 via-yellow-100 to-orange-100', border: 'border-amber-400', text: 'text-amber-700', title: 'JACKPOT!' },
    EPIC: { bg: 'bg-gradient-to-br from-purple-100 to-pink-100', border: 'border-purple-400', text: 'text-purple-700', title: 'Epic Win!' },
    RARE: { bg: 'bg-gradient-to-br from-blue-100 to-cyan-100', border: 'border-blue-400', text: 'text-blue-700', title: 'Nice Win!' },
    COMMON: { bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-600', title: isLoss ? 'Try Again!' : 'Points Earned!' }
  };
  
  const tier = tierConfig[prize.tier] || tierConfig.COMMON;
  
  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(10px)' }}
      onClick={onClose}
    >
      <div 
        className={`${tier.bg} ${tier.border} border-2 rounded-3xl max-w-sm w-full overflow-hidden shadow-2xl`}
        onClick={e => e.stopPropagation()}
        style={{ animation: 'modalPop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
      >
        <div className="px-8 pt-10 pb-4 text-center">
          {isJackpot && <div className="text-6xl mb-4">🏆</div>}
          {!isJackpot && prize.emoji && <div className="text-6xl mb-4">{prize.emoji}</div>}
          <h2 className={`text-2xl font-black ${tier.text}`}>{tier.title}</h2>
        </div>
        
        <div className="px-8 pb-8 text-center">
          <div className={`text-xl font-bold ${isJackpot ? 'text-amber-800' : 'text-slate-800'}`}>
            {prize.name}
          </div>
        </div>
        
        <div className="px-6 pb-6 space-y-3">
          {canSpinAgain && (
            <button
              onClick={onSpinAgain}
              className="w-full py-4 px-6 bg-gradient-to-r from-violet-600 to-cyan-500 text-white font-bold rounded-2xl shadow-lg shadow-violet-300/40 hover:shadow-violet-400/50 transition-all active:scale-[0.98]"
            >
              <span className="flex items-center justify-center gap-2">
                <RotateCw size={18} />
                Spin Again
              </span>
            </button>
          )}
          <button
            onClick={onClose}
            className="w-full py-4 px-6 bg-slate-100 text-slate-600 font-semibold rounded-2xl hover:bg-slate-200 transition-colors active:scale-[0.98]"
          >
            {canSpinAgain ? 'Done' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function LuckySpinWheelPremium({ user, userId: userIdProp, onSpinComplete }) {
  const [state, setState] = useState('idle');
  const [rotation, setRotation] = useState(0);
  const [prize, setPrize] = useState(null);
  const [spinsAvailable, setSpinsAvailable] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [loading, setLoading] = useState(true);
  const effectsRef = useRef(null);
  
  const userId = userIdProp || user?.id || user?.technician_id || user?.userId || user?.displayName || '';
  const userIdLower = (typeof userId === 'string' ? userId : '').toLowerCase();
  const isTestUser = userIdLower.includes('test') || userIdLower.includes('demo') || userIdLower === 'admin' || userIdLower === 'dev' || userIdLower === 'test phase';
  
  const segmentLayout = useMemo(() => computeSegmentLayout(V99_SEGMENTS), []);
  
  useEffect(() => {
    effectsRef.current = new SpinEffectsManager({ enableHaptic: true, enableAudio: false });
    return () => effectsRef.current?.dispose();
  }, []);
  
  useEffect(() => {
    fetchSpinData();
  }, [userId]);
  
  const fetchSpinData = async () => {
    try {
      if (isTestUser) {
        setSpinsAvailable(100);
        setLoading(false);
        return;
      }
      const res = await fetch(`/api/v1.00/gamification/lucky-spin/available/${userId}`, {
        headers: buildAuthHeaders(user)
      });
      const data = await res.json();
      setSpinsAvailable(data.spins_available || 0);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching spin data:', error);
      if (isTestUser) setSpinsAvailable(100);
      setLoading(false);
    }
  };
  
  const handleSpin = useCallback(async () => {
    if (state !== 'idle' || spinsAvailable <= 0) return;
    
    setState('spinning');
    setPrize(null);
    setShowConfetti(false);
    
    let winnerIndex = 0;
    
    try {
      const response = await fetch('/api/v1.00/gamification/lucky-spin/spin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...buildAuthHeaders(user)
        },
        body: JSON.stringify({ userId })
      });
      
      if (!response.ok) throw new Error('Spin failed');
      const data = await response.json();
      
      // v1.01: Use exact prizeIndex from server to sync wheel animation
      if (data.prizeIndex !== undefined && data.prizeIndex >= 0 && data.prizeIndex < V99_SEGMENTS.length) {
        winnerIndex = data.prizeIndex;
      } else {
        // Fallback: match by name
        const matchedIndex = V99_SEGMENTS.findIndex(s => s.name === data.prize.name);
        winnerIndex = matchedIndex !== -1 ? matchedIndex : 0;
      }
      
      if (!isTestUser) {
        setSpinsAvailable(prev => Math.max(0, prev - 1));
        onSpinComplete?.();
      }
    } catch (error) {
      console.error('Error executing spin:', error);
      // Fallback for demo/error purposes if server fails but we want to show something
      if (isTestUser) {
        winnerIndex = selectWinner(V99_SEGMENTS);
      } else {
        setState('idle');
        return;
      }
    }
    
    const spinRotation = computeWinningRotation(segmentLayout, winnerIndex, 9);
    setRotation(prev => prev + spinRotation);
    
    setTimeout(() => {
      effectsRef.current?.onLanding();
      setState('won');
      setPrize(segmentLayout[winnerIndex]);
      
      if (!segmentLayout[winnerIndex].name.includes('Better Luck')) {
        setShowConfetti(true);
        effectsRef.current?.onWin();
      }
    }, 4500);
    
  }, [state, spinsAvailable, userId, segmentLayout, isTestUser, onSpinComplete]);
  
  const handleCloseModal = () => {
    setState('idle');
    setPrize(null);
    setShowConfetti(false);
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] bg-white rounded-3xl">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-violet-500"></div>
      </div>
    );
  }
  
  return (
    <div className="relative w-full max-w-md mx-auto">
      <div 
        className="bg-white rounded-3xl p-6"
        style={{ boxShadow: '0 4px 24px -4px rgba(0,0,0,0.1), 0 8px 40px -8px rgba(124, 58, 237, 0.1)' }}
      >
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 mb-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center shadow-lg shadow-violet-200">
              <Gift size={18} className="text-white" />
            </div>
            <h2 className="text-xl font-bold text-slate-800">Lucky Spin</h2>
          </div>
          
          <div 
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${
              spinsAvailable > 0 
                ? 'bg-gradient-to-r from-violet-100 to-cyan-100 text-violet-700' 
                : 'bg-slate-100 text-slate-400'
            }`}
          >
            <Zap size={14} />
            {spinsAvailable > 0 
              ? `${spinsAvailable} spin${spinsAvailable !== 1 ? 's' : ''} available`
              : 'No spins left'
            }
          </div>
        </div>
        
        <div className="relative flex justify-center mb-6">
          <Confetti active={showConfetti} />
          <Pointer />
          
          <div
            className="pointer-events-none"
            style={{
              transform: `rotate(${rotation}deg)`,
              transition: state === 'spinning' 
                ? 'transform 4.5s cubic-bezier(0.1, 0.7, 0.1, 1)' 
                : 'none'
            }}
          >
            <WheelSVG segmentLayout={segmentLayout} size={320} />
          </div>
        </div>
        
        <button
          onClick={handleSpin}
          disabled={state !== 'idle' || spinsAvailable <= 0}
          className={`w-full py-4 px-6 rounded-2xl font-bold text-lg transition-all duration-200 ${
            state !== 'idle' || spinsAvailable <= 0
              ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-violet-600 via-purple-600 to-cyan-500 text-white shadow-xl shadow-violet-300/40 hover:shadow-violet-400/50 hover:scale-[1.01] active:scale-[0.98]'
          }`}
        >
          {state === 'spinning' ? (
            <span className="flex items-center justify-center gap-2">
              <RotateCw size={20} className="animate-spin" />
              Spinning...
            </span>
          ) : spinsAvailable <= 0 ? (
            'No Spins Available'
          ) : (
            <span className="flex items-center justify-center gap-2">
              <Zap size={20} />
              SPIN TO WIN
            </span>
          )}
        </button>
        
        <div className="mt-5 pt-4 border-t border-slate-100">
          <div className="flex items-center justify-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-2 rounded-sm bg-gradient-to-r from-amber-300 to-amber-500" />
              <span className="text-slate-500 font-medium">Jackpot</span>
            </div>
            <span className="text-slate-300">|</span>
            <div className="flex items-center gap-1">
              <span className="text-lg">🏆</span>
              <span className="text-slate-500">Speaker • Kindle • AirPods • TV</span>
            </div>
          </div>
        </div>
      </div>
      
      {state === 'won' && (
        <ResultModal 
          prize={prize}
          onClose={handleCloseModal}
          onSpinAgain={() => {
            handleCloseModal();
            if (spinsAvailable > 0) {
              setTimeout(() => {
                handleSpin();
              }, 300);
            }
          }}
          canSpinAgain={spinsAvailable > 1} // After this spin result, we check if another is possible
        />
      )}
      
      <style>{`
        @keyframes confettiFall {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(450px) rotate(720deg); opacity: 0; }
        }
        @keyframes modalPop {
          0% { opacity: 0; transform: scale(0.85); }
          100% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
