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
  const [messages, setMessages] = useState<Message[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [pendingPrompts, setPendingPrompts] = useState<Set<string>>(new Set());

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

          if (data.type === 'message') {
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
              return [...prev, assistantMsg];
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
        const err = new Error('WebSocket connection error');
        setError(err);
        onErrorRef.current?.(err);
      };

      ws.onclose = (event) => {
        console.log('🔌 WebSocket disconnected', event.code, event.reason);
        setIsConnected(false);
        wsRef.current = null;

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
  }, []);

  useEffect(() => {
    shouldReconnectRef.current = true;
    connect();

    return () => {
      shouldReconnectRef.current = false;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [connect]);

  return {
    messages,
    sendMessage,
    isConnected,
    error,
    clearMessages,
    pendingPrompts,
  };
}
