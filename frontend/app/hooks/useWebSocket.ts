'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { getRelayServerUrl } from '@/app/lib/config';

export interface Message {
  id: string;
  type: 'prompt' | 'assistant';
  text: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

export interface UseWebSocketOptions {
  sessionId: string;
  serverUrl?: string;
  onMessage?: (message: Message) => void;
  onError?: (error: Error) => void;
  reconnectInterval?: number;
}

export interface UseWebSocketReturn {
  messages: Message[];
  sendMessage: (text: string, metadata?: Record<string, any>) => Promise<void>;
  isConnected: boolean;
  error: Error | null;
  clearMessages: () => void;
  pendingPrompts: Set<string>; // Track prompts waiting for responses
}

export function useWebSocket({
  sessionId,
  serverUrl,
  onMessage,
  onError,
  reconnectInterval = 3000,
}: UseWebSocketOptions): UseWebSocketReturn {
  // Get the server URL dynamically if not explicitly provided
  const resolvedServerUrl = serverUrl || getRelayServerUrl();
  
  // Load messages from localStorage on mount
  const loadMessagesFromStorage = useCallback((): Message[] => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(`messages_${sessionId}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        console.log('📦 Restored messages from storage:', parsed.length);
        return parsed;
      }
    } catch (error) {
      console.error('❌ Error loading messages from storage:', error);
    }
    return [];
  }, [sessionId]);

  const [messages, setMessages] = useState<Message[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(`messages_${sessionId}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        console.log('📦 Restored messages from storage on mount:', parsed.length);
        return parsed;
      }
    } catch (error) {
      console.error('❌ Error loading messages from storage:', error);
    }
    return [];
  });
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [pendingPrompts, setPendingPrompts] = useState<Set<string>>(new Set());
  
  // Save messages to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== 'undefined' && messages.length > 0) {
      try {
        localStorage.setItem(`messages_${sessionId}`, JSON.stringify(messages));
      } catch (error) {
        console.error('❌ Error saving messages to storage:', error);
      }
    }
  }, [messages, sessionId]);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const shouldReconnectRef = useRef(true);
  // Use refs to avoid recreating WebSocket connection when callbacks change
  const onMessageRef = useRef(onMessage);
  const onErrorRef = useRef(onError);

  // Update refs when callbacks change
  useEffect(() => {
    onMessageRef.current = onMessage;
    onErrorRef.current = onError;
  }, [onMessage, onError]);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      const wsUrl = `${resolvedServerUrl}/ws/${sessionId}`;
      console.log('🔌 Connecting to WebSocket:', wsUrl);

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('✅ WebSocket connected');
        setIsConnected(true);
        setError(null);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('📨 WebSocket message received:', data);
          
          // Forward message to service worker for background processing
          // This ensures notifications work even when app is backgrounded
          if ('serviceWorker' in navigator && data.type === 'message' && data.data?.text) {
            navigator.serviceWorker.ready.then((registration) => {
              if (registration.active) {
                registration.active.postMessage({
                  type: 'WEBSOCKET_MESSAGE',
                  text: data.data.text,
                  timestamp: Date.now(),
                });
              }
            }).catch((err) => {
              // Silently fail - service worker might not be ready
            });
          }

          if (data.type === 'message') {
            // Check if this is an error message (from injection payload timeouts, etc)
            const isError = data.data.metadata?.error === true;
            
            if (isError) {
              // Log error messages but don't display them in chat
              console.warn('⚠️ Error message received:', data.data.text);
              
              // Still remove from pending prompts since it's a response (even if error)
              setPendingPrompts((prev) => {
                const newSet = new Set(prev);
                newSet.delete(data.data.client_msg_id);
                return newSet;
              });
              
              return; // Don't add to messages
            }
            
            // Assistant response
            const assistantMsg: Message = {
              id: data.data.assistant_msg_id,
              type: 'assistant',
              text: data.data.text,
              timestamp: data.data.ts,
              metadata: data.data.metadata,
            };

            setMessages((prev) => {
              // Avoid duplicates by checking if message with same ID already exists
              if (prev.some(m => m.id === assistantMsg.id)) {
                console.log('⚠️ Duplicate assistant message ignored:', assistantMsg.id);
                return prev;
              }
              const newMessages = [...prev, assistantMsg];
              
              // Check if message contains [TASK COMPLETE] and trigger notification
              // Do this after adding to state so we have the full message
              if (data.data.text && data.data.text.includes('[TASK COMPLETE]')) {
                console.log('✅ [TASK COMPLETE] detected in message!');
                
                // Always use service worker for notifications (works in background)
                // Send message to service worker which can show notification even when app is backgrounded
                if ('serviceWorker' in navigator) {
                  // Method 1: Send message to service worker (most reliable for background)
                  navigator.serviceWorker.ready.then((registration) => {
                    // Send message to service worker
                    if (registration.active) {
                      registration.active.postMessage({
                        type: 'TASK_COMPLETE',
                        timestamp: Date.now(),
                      });
                    }
                    
                    // Also show notification directly via service worker
                    registration.showNotification('Task Complete! 🎉', {
                      body: 'Your Cursor task has been completed!',
                      tag: 'task-complete',
                      data: {
                        url: '/chat',
                        timestamp: Date.now(),
                      },
                      requireInteraction: false,
                    }).catch((err) => {
                      console.error('Error showing notification:', err);
                    });
                  }).catch((err) => {
                    console.error('Service worker not ready:', err);
                  });
                  
                  // Method 2: Also try direct notification (fallback for foreground)
                  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
                    try {
                      new Notification('Task Complete! 🎉', {
                        body: 'Your Cursor task has been completed!',
                        tag: 'task-complete',
                      });
                    } catch (err) {
                      console.error('Error showing direct notification:', err);
                    }
                  }
                }
              }
              
              return newMessages;
            });
            
            // Remove from pending prompts when we receive a response
            setPendingPrompts((prev) => {
              const newSet = new Set(prev);
              newSet.delete(data.data.client_msg_id);
              return newSet;
            });
            
            onMessageRef.current?.(assistantMsg);
          } else if (data.type === 'prompt') {
            // Prompt from server (for sync)
            // Note: We ignore prompts we sent ourselves (they're already optimistically added)
            const promptMsg: Message = {
              id: data.client_msg_id,
              type: 'prompt',
              text: data.prompt,
              timestamp: data.ts,
              metadata: data.metadata,
            };

            setMessages((prev) => {
              // Avoid duplicates - check by ID
              if (prev.some(m => m.id === promptMsg.id)) {
                console.log('⚠️ Duplicate prompt ignored:', promptMsg.id);
                return prev;
              }
              return [...prev, promptMsg];
            });
          } else if (data.type === 'ping') {
            // Respond to ping
            ws.send(JSON.stringify({ type: 'pong', ts: data.ts }));
          } else if (data.type === 'error') {
            console.error('❌ WebSocket error:', data.error, data.details);
            const err = new Error(data.error);
            setError(err);
            onErrorRef.current?.(err);
          }
        } catch (err) {
          console.error('❌ Error parsing WebSocket message:', err);
        }
      };

      ws.onerror = (event) => {
        console.error('❌ WebSocket error:', event);
        // Try to get more error details
        let errorMessage = 'WebSocket connection error';
        if (ws.readyState === WebSocket.CLOSED) {
          errorMessage = 'Failed to connect to WebSocket server. Check if backend is running and accessible.';
        } else if (ws.readyState === WebSocket.CONNECTING) {
          errorMessage = 'Connection attempt failed. Server may be unreachable or firewall blocking.';
        }
        const err = new Error(errorMessage);
        setError(err);
        onErrorRef.current?.(err);
      };

      ws.onclose = (event) => {
        console.log('🔌 WebSocket disconnected', { code: event.code, reason: event.reason, wasClean: event.wasClean });
        setIsConnected(false);
        wsRef.current = null;

        // Create more detailed error message based on close code
        if (event.code !== 1000 && event.code !== 1001) {
          let errorMessage = 'WebSocket connection closed';
          if (event.code === 1006) {
            errorMessage = `Connection closed abnormally (code ${event.code}). Backend may be unreachable, firewall blocking port 8000, or iOS blocking mixed content (HTTPS→ws://).`;
          } else if (event.code === 1002) {
            errorMessage = `Protocol error (code ${event.code}). Check backend WebSocket implementation.`;
          } else if (event.code === 1003) {
            errorMessage = `Invalid data received (code ${event.code}). Backend may have rejected the connection.`;
          } else if (event.code === 1011) {
            errorMessage = `Server error (code ${event.code}). Backend may have crashed or rejected the connection.`;
          } else if (event.code === 1015) {
            errorMessage = `TLS handshake failed (code ${event.code}). Check SSL/TLS configuration.`;
          } else {
            errorMessage = `WebSocket connection closed (code ${event.code}${event.reason ? `: ${event.reason}` : ''})`;
          }
          
          const err = new Error(errorMessage);
          setError(err);
          onErrorRef.current?.(err);
        }

        // Attempt to reconnect
        if (shouldReconnectRef.current) {
          console.log(`🔄 Reconnecting in ${reconnectInterval}ms...`);
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectInterval);
        }
      };
    } catch (err) {
      console.error('❌ Error creating WebSocket:', err);
      const error = err instanceof Error ? err : new Error('Failed to create WebSocket');
      setError(error);
      onErrorRef.current?.(error);
    }
  }, [sessionId, resolvedServerUrl, reconnectInterval]);

  const sendMessage = useCallback(async (text: string, metadata?: Record<string, any>) => {
    if (!text.trim()) {
      return;
    }

    const clientMsgId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Optimistically add the message to the UI
    const promptMsg: Message = {
      id: clientMsgId,
      type: 'prompt',
      text: text.trim(),
      timestamp: Date.now(),
      metadata,
    };

    setMessages((prev) => [...prev, promptMsg]);
    
    // Add to pending prompts
    setPendingPrompts((prev) => new Set(prev).add(clientMsgId));

    try {
      // Send via HTTP POST to /prompt endpoint
      const response = await fetch(`${resolvedServerUrl.replace('ws://', 'http://').replace('wss://', 'https://')}/prompt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: sessionId,
          client_msg_id: clientMsgId,
          prompt: text.trim(),
          metadata,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send message');
      }

      const result = await response.json();
      console.log('📤 Message sent:', result);
    } catch (err) {
      console.error('❌ Error sending message:', err);
      const error = err instanceof Error ? err : new Error('Failed to send message');
      setError(error);
      onErrorRef.current?.(error);

      // Remove the optimistic message on error
      setMessages((prev) => prev.filter(m => m.id !== clientMsgId));
      
      // Remove from pending prompts on error
      setPendingPrompts((prev) => {
        const newSet = new Set(prev);
        newSet.delete(clientMsgId);
        return newSet;
      });
    }
  }, [sessionId, resolvedServerUrl]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(`messages_${sessionId}`);
    }
  }, [sessionId]);
  
  // Check for [TASK COMPLETE] in restored messages on mount
  useEffect(() => {
    if (messages.length > 0) {
      // Check if any message contains [TASK COMPLETE]
      const hasTaskComplete = messages.some(msg => 
        msg.type === 'assistant' && msg.text && msg.text.includes('[TASK COMPLETE]')
      );
      
      if (hasTaskComplete) {
        console.log('✅ [TASK COMPLETE] found in messages');
        // Check if we've already notified for this session
        const lastNotified = localStorage.getItem(`task_complete_notified_${sessionId}`);
        const now = Date.now();
        if (!lastNotified || (now - parseInt(lastNotified)) > 60000) { // Don't notify if notified in last minute
          // Trigger notification for restored task complete
          if ('serviceWorker' in navigator) {
            navigator.serviceWorker.ready.then((registration) => {
              registration.showNotification('Task Complete! 🎉', {
                body: 'Your Cursor task has been completed!',
                tag: 'task-complete',
                data: {
                  url: '/chat',
                  timestamp: Date.now(),
                },
                requireInteraction: false,
              }).catch((err) => {
                console.error('Error showing notification:', err);
              });
            });
          }
          
          // Also try direct notification
          if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
            try {
              new Notification('Task Complete! 🎉', {
                body: 'Your Cursor task has been completed!',
                tag: 'task-complete',
              });
              localStorage.setItem(`task_complete_notified_${sessionId}`, now.toString());
            } catch (err) {
              console.error('Error showing direct notification:', err);
            }
          }
        }
      }
    }
  }, []); // Only run on mount - check initial messages
  
  useEffect(() => {
    shouldReconnectRef.current = true;
    connect();
    
    // Handle page visibility changes (app going to background/foreground)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log('📱 App went to background - saving state');
        // Save current state when going to background
        if (typeof window !== 'undefined' && messages.length > 0) {
          try {
            localStorage.setItem(`messages_${sessionId}`, JSON.stringify(messages));
          } catch (error) {
            console.error('❌ Error saving messages on background:', error);
          }
        }
      } else {
        console.log('📱 App came to foreground - restoring state');
        // Restore messages when coming back to foreground if they're empty
        if (messages.length === 0) {
          const restored = loadMessagesFromStorage();
          if (restored.length > 0) {
            console.log('📦 Restoring messages from storage:', restored.length);
            setMessages(restored);
            
            // Check for [TASK COMPLETE] in restored messages
            const hasTaskComplete = restored.some(msg => 
              msg.type === 'assistant' && msg.text && msg.text.includes('[TASK COMPLETE]')
            );
            
            if (hasTaskComplete && typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
              // Only notify if we haven't already (check if notification was shown recently)
              const lastNotified = localStorage.getItem(`task_complete_notified_${sessionId}`);
              const now = Date.now();
              if (!lastNotified || (now - parseInt(lastNotified)) > 60000) { // Don't notify if notified in last minute
                try {
                  new Notification('Task Complete! 🎉', {
                    body: 'Your Cursor task has been completed!',
                    tag: 'task-complete',
                  });
                  localStorage.setItem(`task_complete_notified_${sessionId}`, now.toString());
                } catch (err) {
                  console.error('Error showing notification:', err);
                }
              }
            }
          }
        }
        
        // Reconnect if disconnected
        if (!isConnected && wsRef.current?.readyState !== WebSocket.OPEN) {
          console.log('🔄 Reconnecting WebSocket after coming to foreground');
          connect();
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      shouldReconnectRef.current = false;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [connect, messages, isConnected, sessionId, loadMessagesFromStorage]);

  return {
    messages,
    sendMessage,
    isConnected,
    error,
    clearMessages,
    pendingPrompts,
  };
}
