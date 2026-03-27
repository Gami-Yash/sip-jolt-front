import React, { useState, useEffect } from 'react';
import { 
  ChevronRight, Package, Wrench, AlertTriangle, 
  Sparkles, Info, Gift, CheckCircle, Trophy, Coffee
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════════
// SIPJOLT HOME DASHBOARD - Production Design v3
// Updated: Rewards Hub uses dark blue → light green gradient
// ═══════════════════════════════════════════════════════════════════════════════

export default function HomeDashboard({ 
  spins = 0,
  user = { name: 'Alex', reliabilityScore: 94 },
  supplyClosetTask = { status: 'pending', due_date: new Date().toISOString() },
  visitData = null,
  siteIncidents = [],
  machineStatus = 'green',
  coffeeEligible = true,
  streakWeeks = 3,
  onNavigate = () => {},
  onStartWeeklyVisit = () => {},
  onOpenAIChat = () => {}
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hoveredCard, setHoveredCard] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const getMachineStatusInfo = () => {
    switch (machineStatus) {
      case 'red':
        return {
          bg: 'bg-red-50 border-red-200',
          title: 'Service Required',
          subtitle: 'Machine needs immediate attention',
          icon: '🔴'
        };
      case 'yellow':
        return {
          bg: 'bg-amber-50 border-amber-200',
          title: 'Needs Attention Soon',
          subtitle: 'Check supplies or schedule maintenance',
          icon: '🟡'
        };
      default:
        return {
          bg: 'bg-emerald-50 border-emerald-200',
          title: 'Running Smoothly',
          subtitle: 'All systems healthy — no action needed',
          icon: '🟢'
        };
    }
  };

  const statusInfo = getMachineStatusInfo();

  return (
    <div className="min-h-screen bg-[#f8f9fb]">
      {/* Background Pattern */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-teal-100/30 to-cyan-100/20 blur-3xl transform translate-x-1/3 -translate-y-1/3" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-gradient-to-tr from-slate-100/40 to-slate-100/20 blur-3xl transform -translate-x-1/3 translate-y-1/3" />
      </div>

      <div className="relative z-10 max-w-lg mx-auto px-4 pb-8">
        
        {/* HEADER + REWARDS NOTIFICATION BUBBLE */}
        <header 
          className={`pt-8 pb-4 transition-all duration-700 ${
            isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
          }`}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 tracking-wide mb-1">
                {getGreeting()}
              </p>
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                {user?.name || user?.displayName || 'Operator'}
              </h1>
            </div>
            
            {/* Rewards Notification Bubble - Dark Blue to Green Gradient */}
            {spins > 0 && (
              <button
                onClick={() => onNavigate('rewards')}
                className="relative group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-emerald-500 rounded-2xl blur-lg opacity-40 group-hover:opacity-60 transition-opacity" />
                <div className="relative flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 via-teal-500 to-emerald-500 rounded-2xl shadow-lg shadow-teal-200/50 group-hover:shadow-teal-300/60 transition-all group-active:scale-95">
                  <Gift size={18} className="text-white" />
                  <span className="text-sm font-bold text-white">
                    {spins} {spins === 1 ? 'Spin' : 'Spins'}
                  </span>
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full animate-ping" />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full" />
                </div>
              </button>
            )}
          </div>
        </header>

        {/* MACHINE STATUS + COFFEE PERK CARD */}
        <section 
          className={`mb-6 transition-all duration-700 delay-100 ${
            isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <div className={`rounded-2xl border p-5 ${statusInfo.bg}`}>
            <div className="flex items-start gap-4 mb-4">
              <div className="text-3xl">{statusInfo.icon}</div>
              <div className="flex-1">
                <h2 className="font-bold text-slate-900 text-lg">{statusInfo.title}</h2>
                <p className="text-sm text-slate-600">{statusInfo.subtitle}</p>
              </div>
            </div>
            <div className="h-px bg-black/5 my-4" />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/80 flex items-center justify-center shadow-sm">
                  <Coffee size={20} className="text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {coffeeEligible ? 'Free Coffee Today ✓' : 'Complete a visit for free coffee'}
                  </p>
                  <p className="text-xs text-slate-500">
                    {streakWeeks > 0 ? `${streakWeeks}-week streak 🔥` : 'Start your streak!'}
                  </p>
                </div>
              </div>
              {coffeeEligible && (
                <div className="px-3 py-1 bg-emerald-100 rounded-full">
                  <span className="text-xs font-bold text-emerald-700">EARNED</span>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ALERTS */}
        {siteIncidents.length > 0 && (
          <section 
            className={`mb-6 transition-all duration-700 delay-150 ${
              isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                  <AlertTriangle size={20} className="text-amber-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">Open Issues</h3>
                  <p className="text-xs text-amber-700">{siteIncidents.length} requiring attention</p>
                </div>
              </div>
              <div className="space-y-2">
                {siteIncidents.slice(0, 2).map((incident, i) => (
                  <div 
                    key={incident.incident_id || i}
                    className="flex items-center justify-between p-3 bg-white rounded-xl border border-amber-100"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-800">{incident.type}</p>
                      <p className="text-xs text-slate-500 capitalize">{incident.severity} priority</p>
                    </div>
                    <ChevronRight size={16} className="text-slate-400" />
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* SERVICE TASKS */}
        <section 
          className={`mb-6 transition-all duration-700 delay-200 ${
            isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
            Service Tasks
          </h2>

          <div className="space-y-3">
            <button
              onClick={onStartWeeklyVisit}
              onMouseEnter={() => setHoveredCard('weekly')}
              onMouseLeave={() => setHoveredCard(null)}
              className="w-full text-left bg-white rounded-2xl p-5 border border-slate-200 transition-all duration-300 active:scale-[0.99] group"
              style={{
                boxShadow: hoveredCard === 'weekly'
                  ? '0 12px 40px -8px rgba(20, 184, 166, 0.2), 0 4px 12px -4px rgba(0,0,0,0.06)'
                  : '0 4px 20px -4px rgba(0,0,0,0.04), 0 2px 8px -2px rgba(0,0,0,0.04)'
              }}
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-teal-200/50">
                  <Package size={22} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-slate-900">Weekly Visit + Supply Check</h3>
                    {supplyClosetTask?.status === 'overdue' && (
                      <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-bold rounded-full">
                        Overdue
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-500 mb-2">
                    Refill, clean, and check supply closet · ~20 min
                  </p>
                  {supplyClosetTask && supplyClosetTask.status !== 'completed' && (
                    <div className="flex items-center gap-1.5 text-xs text-teal-600 font-medium">
                      <div className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                      Due: {new Date(supplyClosetTask.due_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </div>
                  )}
                  {supplyClosetTask?.status === 'completed' && (
                    <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
                      <CheckCircle size={12} />
                      Completed this week
                    </div>
                  )}
                </div>
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-teal-100 transition-colors">
                  <ChevronRight size={16} className="text-slate-400 group-hover:text-teal-600 transition-colors" />
                </div>
              </div>
            </button>

            <button
              onClick={() => onNavigate('monthly')}
              onMouseEnter={() => setHoveredCard('monthly')}
              onMouseLeave={() => setHoveredCard(null)}
              className="w-full text-left bg-white rounded-2xl p-5 border border-slate-200 transition-all duration-300 active:scale-[0.99] group"
              style={{
                boxShadow: hoveredCard === 'monthly'
                  ? '0 12px 40px -8px rgba(100, 116, 139, 0.15), 0 4px 12px -4px rgba(0,0,0,0.06)'
                  : '0 4px 20px -4px rgba(0,0,0,0.04), 0 2px 8px -2px rgba(0,0,0,0.04)'
              }}
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-500 to-slate-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-slate-200/50">
                  <Wrench size={22} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-900 mb-1">Monthly Deep Clean</h3>
                  <p className="text-sm text-slate-500">
                    Full service and descaling · ~45 min
                  </p>
                </div>
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-slate-200 transition-colors">
                  <ChevronRight size={16} className="text-slate-400 group-hover:text-slate-600 transition-colors" />
                </div>
              </div>
            </button>
          </div>
        </section>

        {/* AI ASSISTANT */}
        <section 
          className={`mb-6 transition-all duration-700 ${
            isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
          style={{ transitionDelay: '250ms' }}
        >
          <button
            onClick={onOpenAIChat}
            onMouseEnter={() => setHoveredCard('ai')}
            onMouseLeave={() => setHoveredCard(null)}
            className="w-full text-left bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-5 transition-all duration-300 active:scale-[0.99] group"
            style={{
              boxShadow: hoveredCard === 'ai'
                ? '0 16px 50px -8px rgba(30, 41, 59, 0.5), 0 6px 16px -6px rgba(0,0,0,0.2)'
                : '0 8px 30px -8px rgba(30, 41, 59, 0.4), 0 4px 12px -4px rgba(0,0,0,0.1)'
            }}
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-purple-500/30">
                <Sparkles size={22} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-white mb-1">Ask AI Assistant</h3>
                <p className="text-sm text-slate-400">
                  Visual diagnostics & machine help
                </p>
              </div>
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                <ChevronRight size={16} className="text-white/70" />
              </div>
            </div>
          </button>
        </section>

        {/* REWARDS HUB - Dark Blue to Green Gradient */}
        <section 
          className={`mb-6 transition-all duration-700 ${
            isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
          style={{ transitionDelay: '300ms' }}
        >
          <button
            onClick={() => onNavigate('rewards')}
            onMouseEnter={() => setHoveredCard('rewards')}
            onMouseLeave={() => setHoveredCard(null)}
            className="w-full text-left relative overflow-hidden rounded-2xl transition-all duration-300 active:scale-[0.98] group"
            style={{
              boxShadow: hoveredCard === 'rewards' 
                ? '0 20px 50px -12px rgba(16, 185, 129, 0.3), 0 8px 20px -8px rgba(37, 99, 235, 0.15)'
                : '0 12px 35px -12px rgba(16, 185, 129, 0.2), 0 4px 12px -4px rgba(37, 99, 235, 0.1)'
            }}
          >
            {/* Gradient Background - Dark Blue to Green */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-700 via-teal-600 to-emerald-500" />
            
            {/* Subtle pattern overlay */}
            <div className="absolute inset-0 opacity-10" style={{
              backgroundImage: `radial-gradient(circle at 20% 50%, white 1px, transparent 1px)`,
              backgroundSize: '24px 24px'
            }} />
            
            {/* Decorative Element */}
            <div className="absolute top-2 right-2 opacity-10">
              <Trophy size={60} strokeWidth={1} />
            </div>
            
            {/* Content */}
            <div className="relative z-10 p-5">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0 border border-white/30">
                  <Gift size={22} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-white">Rewards Hub</h3>
                    {spins > 0 && (
                      <span className="px-2 py-0.5 bg-white rounded-full text-xs font-bold text-emerald-600">
                        {spins} {spins === 1 ? 'SPIN' : 'SPINS'}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-white/80">
                    Lucky Spin, Leaderboard & Jackpot
                  </p>
                </div>
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white/30 transition-colors">
                  <ChevronRight size={16} className="text-white" />
                </div>
              </div>
            </div>
          </button>
        </section>

        {/* TOOLS & FEATURES */}
        <section 
          className={`mb-6 transition-all duration-700 ${
            isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
          style={{ transitionDelay: '350ms' }}
        >
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
            Tools & Features
          </h2>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => onNavigate('quickfix')}
              className="bg-white rounded-2xl p-4 border border-slate-200 transition-all duration-200 hover:shadow-lg hover:shadow-slate-200/50 active:scale-[0.98] group text-left"
            >
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center mb-3 group-hover:bg-red-100 transition-colors">
                <AlertTriangle size={20} className="text-red-500" />
              </div>
              <h3 className="font-semibold text-slate-900 text-sm mb-0.5">Quick Fix</h3>
              <p className="text-xs text-slate-500">Fix common errors</p>
            </button>

            <button
              onClick={() => onNavigate('helpsafety')}
              className="bg-white rounded-2xl p-4 border border-slate-200 transition-all duration-200 hover:shadow-lg hover:shadow-slate-200/50 active:scale-[0.98] group text-left"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center mb-3 group-hover:bg-blue-100 transition-colors">
                <Info size={20} className="text-blue-500" />
              </div>
              <h3 className="font-semibold text-slate-900 text-sm mb-0.5">Help & Safety</h3>
              <p className="text-xs text-slate-500">Emergency guide</p>
            </button>
          </div>
        </section>

        {/* LAST VISIT SUCCESS */}
        {visitData && (
          <section 
            className={`transition-all duration-700 ${
              isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
            style={{ transitionDelay: '400ms' }}
          >
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                  <CheckCircle size={20} className="text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-emerald-900">Last Visit Completed</h3>
                  <p className="text-sm text-emerald-700">
                    {visitData.type === 'weekly' ? 'Weekly Visit' : 'Monthly Deep Clean'} · {new Date(visitData.timestamp).toLocaleString('en-US', { 
                      weekday: 'short', 
                      month: 'short', 
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

      </div>
    </div>
  );
}
