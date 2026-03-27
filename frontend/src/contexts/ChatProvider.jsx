import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { useChatSession, getOrCreateSession, clearSession as clearStoredSession } from '../hooks/useChatSession';
import { useOfflineQueue, enqueue } from '../hooks/useOfflineQueue';
import { useClockDrift } from '../hooks/useClockDrift';
import { useTerminalInit } from '../hooks/useTerminalInit';

const ChatContext = createContext(null);

export function ChatProvider({ children, userId, userRole, siteId }) {
  const [messages, setMessages] = useState([]);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState(null);
  
  const { session, addUserMessage, addAIMessage, clearChat, getHistory } = useChatSession(userId, userRole, siteId);
  const { isOnline, pendingCount, sync } = useOfflineQueue();
  const { driftMinutes, isDriftDetected, checkNow: checkClockDrift } = useClockDrift(true);
  const { isInitialized, isPWAInstalled, promptInstall, bypassForDev } = useTerminalInit();

  const sendMessage = useCallback(async (content, context = {}) => {
    if (!content?.trim()) return null;
    
    setIsSending(true);
    setError(null);
    
    const userMsgId = addUserMessage(content);
    setMessages(prev => [...prev, {
      id: userMsgId || `msg_${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date(),
      status: isOnline ? 'sending' : 'queued',
    }]);

    if (!isOnline) {
      await enqueue('CHAT_MESSAGE', { content, context });
      const offlineResponse = {
        id: `msg_${Date.now()}_offline`,
        role: 'assistant',
        content: '📡 **OFFLINE MODE**\n\nYour message has been queued and will be processed when connection is restored.',
        timestamp: new Date(),
        status: 'sent',
      };
      setMessages(prev => [...prev, offlineResponse]);
      setIsSending(false);
      return offlineResponse;
    }

    try {
      const conversationHistory = getHistory(10);
      
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content,
          conversationHistory,
          context: {
            userRole,
            siteId,
            ...context,
          },
        }),
      });

      const data = await response.json();

      if (data.success && data.response) {
        const aiMsgId = addAIMessage(data.response);
        const aiMessage = {
          id: aiMsgId || `msg_${Date.now()}_ai`,
          role: 'assistant',
          content: data.response,
          timestamp: new Date(),
          status: 'sent',
        };
        setMessages(prev => {
          const updated = prev.map(m => 
            m.id === userMsgId ? { ...m, status: 'sent' } : m
          );
          return [...updated, aiMessage];
        });
        setIsSending(false);
        return aiMessage;
      } else {
        throw new Error(data.error || 'Unknown error');
      }
    } catch (err) {
      console.error('Chat error:', err);
      setError(err.message);
      setMessages(prev => prev.map(m => 
        m.id === userMsgId ? { ...m, status: 'error' } : m
      ));
      
      const errorMessage = {
        id: `msg_${Date.now()}_error`,
        role: 'assistant',
        content: '⚠️ **TRANSMISSION ERROR**\n\nFailed to connect to Neural Core. Please retry or contact Ops.',
        timestamp: new Date(),
        status: 'sent',
      };
      setMessages(prev => [...prev, errorMessage]);
      setIsSending(false);
      return null;
    }
  }, [isOnline, userRole, siteId, addUserMessage, addAIMessage, getHistory]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    clearChat();
  }, [clearChat]);

  const value = useMemo(() => ({
    messages,
    isSending,
    error,
    isOnline,
    pendingCount,
    driftMinutes,
    isDriftDetected,
    isInitialized,
    isPWAInstalled,
    sendMessage,
    clearMessages,
    sync,
    checkClockDrift,
    promptInstall,
    bypassForDev,
  }), [
    messages, isSending, error, isOnline, pendingCount,
    driftMinutes, isDriftDetected, isInitialized, isPWAInstalled,
    sendMessage, clearMessages, sync, checkClockDrift, promptInstall, bypassForDev,
  ]);

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}

export default ChatProvider;
