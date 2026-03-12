import { useEffect, useRef, useCallback, useState } from 'react';
import { api, Session } from '../services/api';

export interface WebSocketMessage {
  type: 'session_update' | 'new_escalation' | 'session_completed';
  data: Session;
}

/**
 * WebSocket hook for real-time updates
 *
 * This hook provides real-time updates for the agent console by connecting
 * to the WebSocket endpoint provided by the API.
 *
 * @param onMessage Callback function that handles incoming WebSocket messages
 */
export function useWebSocket(
  onMessage?: (message: WebSocketMessage) => void
) {
  const ws = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const onMessageRef = useRef(onMessage);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 3;

  // Update the ref when callback changes
  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  const connect = useCallback(() => {
    // Don't reconnect if we've tried too many times
    if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
      console.log('Max WebSocket reconnection attempts reached, giving up');
      return;
    }

    try {
      const wsUrl = api.getWebSocketUrl();
      ws.current = new WebSocket(wsUrl);

      ws.current.onopen = () => {
        console.log('WebSocket connected');
        setConnected(true);
        reconnectAttemptsRef.current = 0; // Reset on successful connection
      };

      ws.current.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          onMessageRef.current?.(message);
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err);
        }
      };

      ws.current.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      ws.current.onclose = () => {
        console.log('WebSocket disconnected');
        setConnected(false);

        // Only attempt to reconnect if we haven't exceeded max attempts
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current++;
          const delay = Math.min(5000 * reconnectAttemptsRef.current, 30000); // Exponential backoff, max 30s

          reconnectTimeoutRef.current = setTimeout(() => {
            console.log(`Attempting to reconnect... (attempt ${reconnectAttemptsRef.current})`);
            connect();
          }, delay);
        }
      };
    } catch (err) {
      console.error('Failed to connect WebSocket:', err);
    }
  }, []); // Empty dependencies - uses refs instead

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [connect]);

  return { connected };
}