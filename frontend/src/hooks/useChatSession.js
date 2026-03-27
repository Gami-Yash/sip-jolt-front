import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'sipjolt_chat_session';
const SESSION_EXPIRY_HOURS = 24;
const MAX_MESSAGES = 100;

function isLocalStorageAvailable() {
  try {
    const test = '__storage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
}

export function createSession(userId, userRole, siteId) {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_EXPIRY_HOURS * 60 * 60 * 1000);
  const session = {
    id: `SESSION_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    userId,
    userRole,
    siteId,
    messages: [],
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
  };
  saveSession(session);
  return session;
}

export function getOrCreateSession(userId, userRole, siteId) {
  const existing = loadSession();
  if (existing) {
    const now = new Date();
    const expiresAt = new Date(existing.expiresAt);
    if (expiresAt > now && existing.userId === userId) {
      if (siteId && existing.siteId !== siteId) {
        existing.siteId = siteId;
        saveSession(existing);
      }
      return existing;
    }
  }
  return createSession(userId, userRole, siteId);
}

export function saveSession(session) {
  if (!isLocalStorageAvailable()) return false;
  try {
    session.updatedAt = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    return true;
  } catch (err) {
    console.error('[SESSION] Failed to save:', err);
    return false;
  }
}

export function loadSession() {
  if (!isLocalStorageAvailable()) return null;
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return null;
    const session = JSON.parse(data);
    if (!session.id || !session.userId || !Array.isArray(session.messages)) {
      clearSession();
      return null;
    }
    return session;
  } catch (err) {
    console.error('[SESSION] Failed to load:', err);
    return null;
  }
}

export function clearSession() {
  if (isLocalStorageAvailable()) {
    localStorage.removeItem(STORAGE_KEY);
  }
}

export function addMessage(session, role, content, status = 'sent') {
  const message = {
    id: `MSG_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    role,
    content,
    timestamp: new Date().toISOString(),
    status,
  };
  session.messages.push(message);
  if (session.messages.length > MAX_MESSAGES) {
    session.messages = session.messages.slice(-MAX_MESSAGES);
  }
  saveSession(session);
  return session;
}

export function getConversationHistory(session, maxMessages = 10) {
  return session.messages
    .filter(m => m.status === 'sent')
    .slice(-maxMessages)
    .map(m => ({ role: m.role, content: m.content }));
}

export function useChatSession(userId, userRole, siteId) {
  const [session, setSession] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadedSession = getOrCreateSession(userId, userRole, siteId);
    setSession(loadedSession);
    setIsLoading(false);
  }, [userId, userRole, siteId]);

  const addUserMessage = useCallback((content) => {
    if (!session) return null;
    const updated = addMessage(session, 'user', content);
    setSession({ ...updated });
    return updated.messages[updated.messages.length - 1].id;
  }, [session]);

  const addAIMessage = useCallback((content) => {
    if (!session) return null;
    const updated = addMessage(session, 'assistant', content);
    setSession({ ...updated });
    return updated.messages[updated.messages.length - 1].id;
  }, [session]);

  const clearChat = useCallback(() => {
    if (!session) return;
    session.messages = [];
    saveSession(session);
    setSession({ ...session });
  }, [session]);

  const getHistory = useCallback((maxMessages = 10) => {
    if (!session) return [];
    return getConversationHistory(session, maxMessages);
  }, [session]);

  return {
    session,
    isLoading,
    messages: session?.messages || [],
    addUserMessage,
    addAIMessage,
    clearChat,
    getHistory,
  };
}

export default useChatSession;
