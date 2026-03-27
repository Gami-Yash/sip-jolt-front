/**
 * SIPJOLT v1.00.0 Neural Core - Global Chat FAB
 * ============================================
 * Floating Action Button for AI Assistant
 * 
 * Features:
 * - Terminal aesthetic with HeartbeatIndicator colors
 * - Context-aware (injects current route)
 * - Dark mode, industrial styling
 * - Conversation history
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';

const StatusIndicator = ({ status }) => {
  const colors = {
    ready: { bg: 'bg-green-500', pulse: 'animate-pulse', label: 'ONLINE' },
    thinking: { bg: 'bg-yellow-500', pulse: 'animate-ping', label: 'PROCESSING' },
    error: { bg: 'bg-red-500', pulse: '', label: 'ERROR' },
    offline: { bg: 'bg-gray-500', pulse: '', label: 'OFFLINE' },
  };
  
  const { bg, pulse, label } = colors[status] || colors.offline;
  
  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <div className={`w-2 h-2 rounded-full ${bg}`} />
        {pulse && (
          <div className={`absolute inset-0 w-2 h-2 rounded-full ${bg} ${pulse} opacity-75`} />
        )}
      </div>
      <span className="text-[10px] font-mono text-gray-400 tracking-wider">{label}</span>
    </div>
  );
};

const ChatMessageBubble = ({ message }) => {
  const isUser = message.role === 'user';
  
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
      <div
        className={`max-w-[85%] rounded-lg px-4 py-3 ${
          isUser
            ? 'bg-blue-600 text-white'
            : 'bg-white text-gray-900 border border-gray-200 shadow-sm'
        }`}
      >
        <div className={`text-[10px] font-mono mb-1 ${isUser ? 'text-blue-100' : 'text-green-700'}`}>
          {isUser ? '> USER' : '> SIPJOLT_AI'}
        </div>
        
        <div className="text-sm whitespace-pre-wrap break-words leading-relaxed">
          {message.content.split('\n').map((line, i) => {
            if (line.startsWith('`') && line.endsWith('`')) {
              return (
                <code key={i} className="bg-gray-900 px-1 py-0.5 rounded text-green-400 font-mono text-xs">
                  {line.slice(1, -1)}
                </code>
              );
            }
            if (line.includes('**')) {
              const parts = line.split('**');
              return (
                <span key={i}>
                  {parts.map((part, j) => 
                    j % 2 === 1 ? <strong key={j} className="text-yellow-400">{part}</strong> : part
                  )}
                  {i < message.content.split('\n').length - 1 && <br />}
                </span>
              );
            }
            return <span key={i}>{line}{i < message.content.split('\n').length - 1 && <br />}</span>;
          })}
        </div>
        
        <div className={`text-[9px] font-mono mt-2 ${isUser ? 'text-blue-300' : 'text-gray-500'}`}>
          {message.timestamp instanceof Date ? message.timestamp.toISOString().slice(11, 19) : '--:--:--'}Z
        </div>
        
        {isUser && message.status === 'sending' && (
          <div className="text-[9px] text-blue-300 mt-1">Transmitting...</div>
        )}
        {isUser && message.status === 'error' && (
          <div className="text-[9px] text-red-400 mt-1">Failed to send</div>
        )}
      </div>
    </div>
  );
};

const NeuralCoreChatFab = ({
  userRole,
  siteId,
  siteStatus,
  pendingTasks = [],
  currentView = 'dashboard',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [botStatus, setBotStatus] = useState('ready');
  const [isMinimized, setIsMinimized] = useState(false);
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, isMinimized]);
  
  const formatRouteName = (view) => {
    const routeMap = {
      'dashboard': 'Tech Hub Dashboard',
      'weekly': 'Weekly Inspection Wizard',
      'monthly': 'Monthly Deep Clean Wizard',
      'helpsafety': 'Help & Safety Center',
      'supplycloset': 'Supply Closet',
      'performancecomp': 'Performance Compensation',
      'trophycase': 'Trophy Case',
      'notifications': 'Notifications',
      'ownerops': 'Ops Admin Panel',
      'driver_dashboard': 'Driver Dashboard',
      'quickfix': 'Quick Fix Tool',
      'onboarding': 'Onboarding Wizard',
    };
    return routeMap[view] || `App Screen: ${view}`;
  };
  
  const generateMessageId = () => {
    return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  };
  
  const handleSendMessage = useCallback(async () => {
    const trimmedInput = inputValue.trim();
    if (!trimmedInput || botStatus === 'thinking') return;
    
    const userMessage = {
      id: generateMessageId(),
      role: 'user',
      content: trimmedInput,
      timestamp: new Date(),
      status: 'sending',
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setBotStatus('thinking');
    
    try {
      const context = {
        currentRoute: formatRouteName(currentView),
        userRole,
        siteId,
        siteStatus,
        pendingTasks,
      };
      
      const conversationHistory = messages.map(m => ({
        role: m.role,
        content: m.content,
      }));
      
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmedInput,
          conversationHistory,
          context,
        }),
      });
      
      const data = await response.json();
      
      setMessages(prev => prev.map(m => 
        m.id === userMessage.id ? { ...m, status: 'sent' } : m
      ));
      
      if (data.success && data.response) {
        const aiMessage = {
          id: generateMessageId(),
          role: 'assistant',
          content: data.response,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, aiMessage]);
        setBotStatus('ready');
      } else {
        throw new Error(data.error || 'Unknown error');
      }
    } catch (error) {
      console.error('Neural Core error:', error);
      setBotStatus('error');
      
      setMessages(prev => prev.map(m => 
        m.id === userMessage.id ? { ...m, status: 'error' } : m
      ));
      
      const errorMessage = {
        id: generateMessageId(),
        role: 'assistant',
        content: '**TRANSMISSION ERROR**\n\nFailed to connect to Neural Core. Please retry or contact Ops if issue persists.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
      
      setTimeout(() => setBotStatus('ready'), 3000);
    }
  }, [inputValue, botStatus, currentView, userRole, siteId, siteStatus, pendingTasks, messages]);
  
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  const handleClearChat = () => {
    setMessages([]);
    setBotStatus('ready');
  };
  
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMessage = {
        id: generateMessageId(),
        role: 'assistant',
        content: `**SIPJOLT v1.00 NEURAL CORE ONLINE**

I am the Sovereign Enforcer for SIPJOLT Operations.

**Current Context:**
• Screen: ${formatRouteName(currentView)}
${userRole ? `• Role: \`${userRole}\`` : ''}
${siteStatus ? `• Site Status: ${siteStatus === 'ACTIVE' ? '🟢' : siteStatus === 'SAFE_MODE' ? '🔴' : '⚫'} ${siteStatus}` : ''}

How can I assist with your operational query?`,
        timestamp: new Date(),
      };
      setMessages([welcomeMessage]);
    }
  }, [isOpen, messages.length, currentView, userRole, siteStatus]);

  // Proactive "Bubble" tooltip for important states
  const showTooltip = !isOpen && (siteStatus === 'SAFE_MODE' || pendingTasks.length > 0);

  return (
    <>
      {/* Proactive Tooltip */}
      {showTooltip && (
        <div className="fixed bottom-36 right-4 z-[60] animate-bounce">
          <div className="bg-blue-600 text-white text-[10px] font-mono px-3 py-1.5 rounded-lg shadow-xl relative">
            {siteStatus === 'SAFE_MODE' ? 'NEED RECOVERY HELP?' : 'BLOCKER DETECTED. ASSIST?'}
            <div className="absolute bottom-[-4px] right-6 w-2 h-2 bg-blue-600 rotate-45"></div>
          </div>
        </div>
      )}

      <button
        onClick={() => setIsOpen(true)}
        className={`
          fixed bottom-20 right-4 z-[60]
          w-14 h-14 rounded-full
          bg-gradient-to-br from-gray-900 to-gray-800
          border-2 border-green-500/50
          shadow-lg shadow-green-500/20
          flex items-center justify-center
          transition-all duration-300
          hover:scale-110 hover:border-green-400
          hover:shadow-green-400/40
          active:scale-95
          ${isOpen ? 'scale-0 opacity-0 pointer-events-none' : 'scale-100 opacity-100'}
        `}
        aria-label="Open SIPJOLT AI Assistant"
      >
        <svg
          className="w-7 h-7 text-green-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
        
        <span className="absolute top-0 right-0 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
      </button>
      
      {isOpen && (
        <div
          className={`
            fixed z-[70] bg-white/80 rounded-3xl shadow-2xl
            border border-[#d2d2d7] overflow-hidden
            transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1)
            backdrop-blur-xl saturate-150
            ${isMinimized 
              ? 'bottom-20 right-4 w-72 h-14' 
              : 'bottom-4 right-4 left-4 h-[80vh] max-h-[650px] md:left-auto md:w-[400px]'
            }
          `}
        >
          <div className="bg-[#f5f5f7]/50 border-b border-[#d2d2d7] px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white border border-[#d2d2d7] shadow-sm flex items-center justify-center">
                <span className="text-[#0071e3] font-mono text-sm">{'>'}_</span>
              </div>
              <div>
                <div className="text-[15px] font-semibold text-[#1d1d1f]">Neural Core v1.00</div>
                <StatusIndicator status={botStatus} />
              </div>
            </div>
            
            <div className="flex items-center gap-1">
              {!isMinimized && messages.length > 1 && (
                <button
                  onClick={handleClearChat}
                  className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                  title="Clear conversation"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
              
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-2 text-gray-400 hover:text-white transition-colors"
                title={isMinimized ? 'Expand' : 'Minimize'}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {isMinimized ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  )}
                </svg>
              </button>
              
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                title="Close"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          
          {!isMinimized && (
            <>
              <div className="flex-1 overflow-y-auto p-5 h-[calc(100%-8.5rem)] bg-white/40">
                {messages.map(message => (
                  <ChatMessageBubble key={message.id} message={message} />
                ))}
                
                {botStatus === 'thinking' && (
                  <div className="flex justify-start mb-4">
                    <div className="bg-[#f5f5f7] border border-[#d2d2d7] rounded-2xl px-5 py-3 shadow-sm">
                      <div className="text-[10px] font-semibold text-[#0071e3] mb-1 tracking-wider uppercase">{'>'} SIPJOLT_AI</div>
                      <div className="flex gap-1.5">
                        <span className="w-1.5 h-1.5 bg-[#0071e3] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1.5 h-1.5 bg-[#0071e3] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1.5 h-1.5 bg-[#0071e3] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
              
              <div className="border-t border-[#d2d2d7] p-4 bg-[#f5f5f7]/80 backdrop-blur-md">
                <div className="flex items-center gap-2 mb-3 text-[10px] font-semibold text-[#86868b] tracking-tight">
                  <span className="px-2.5 py-1 bg-white border border-[#d2d2d7] rounded-full shadow-sm">
                    {formatRouteName(currentView)}
                  </span>
                  {userRole && (
                    <span className="px-2.5 py-1 bg-white border border-[#d2d2d7] rounded-full shadow-sm">
                      {userRole}
                    </span>
                  )}
                </div>
                
                <div className="flex gap-3">
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Enter operational query..."
                    disabled={botStatus === 'thinking'}
                    className="
                      flex-1 px-4 py-3
                      bg-white border border-[#d2d2d7] rounded-2xl
                      text-[15px] text-[#1d1d1f] placeholder-[#86868b]
                      focus:outline-none focus:ring-2 focus:ring-[#0071e3]/30 focus:border-[#0071e3]
                      transition-all duration-200
                      disabled:opacity-50 disabled:cursor-not-allowed
                    "
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!inputValue.trim() || botStatus === 'thinking'}
                    className="
                      px-5 py-3 
                      bg-[#0071e3] hover:bg-[#0077ed] 
                      disabled:bg-[#d2d2d7] disabled:cursor-not-allowed
                      text-white text-sm font-bold uppercase tracking-widest
                      rounded-2xl shadow-sm transition-all duration-300 active:scale-95
                    "
                  >
                    {botStatus === 'thinking' ? '...' : 'TX'}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
};

export default NeuralCoreChatFab;
