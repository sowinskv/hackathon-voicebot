import WebSocket from 'ws';
import { Server } from 'http';

let wss: WebSocket.Server;
const clients = new Set<WebSocket>();

export const initWebSocket = (server: Server) => {
  wss = new WebSocket.Server({ server, path: '/ws' });

  wss.on('connection', (ws: WebSocket) => {
    console.log('New WebSocket client connected');
    clients.add(ws);

    // Send welcome message
    ws.send(
      JSON.stringify({
        type: 'connected',
        message: 'Connected to API Gateway WebSocket',
        timestamp: new Date().toISOString(),
      })
    );

    // Handle incoming messages
    ws.on('message', (message: string) => {
      try {
        const data = JSON.parse(message.toString());
        console.log('Received WebSocket message:', data);

        // Handle ping/pong
        if (data.type === 'ping') {
          ws.send(
            JSON.stringify({
              type: 'pong',
              timestamp: new Date().toISOString(),
            })
          );
          return;
        }

        // Handle subscription requests
        if (data.type === 'subscribe') {
          const { channels } = data;
          // Store subscription preferences on the WebSocket instance
          (ws as any).subscriptions = channels || ['all'];
          ws.send(
            JSON.stringify({
              type: 'subscribed',
              channels: (ws as any).subscriptions,
              timestamp: new Date().toISOString(),
            })
          );
          return;
        }

        // Echo back unhandled messages
        ws.send(
          JSON.stringify({
            type: 'echo',
            data,
            timestamp: new Date().toISOString(),
          })
        );
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
        ws.send(
          JSON.stringify({
            type: 'error',
            message: 'Invalid message format',
            timestamp: new Date().toISOString(),
          })
        );
      }
    });

    // Handle client disconnect
    ws.on('close', () => {
      console.log('WebSocket client disconnected');
      clients.delete(ws);
    });

    // Handle errors
    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      clients.delete(ws);
    });

    // Send periodic heartbeat
    const heartbeat = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(
          JSON.stringify({
            type: 'heartbeat',
            timestamp: new Date().toISOString(),
          })
        );
      } else {
        clearInterval(heartbeat);
      }
    }, 30000); // Every 30 seconds
  });

  console.log('WebSocket server initialized on path /ws');
};

// Broadcast message to all connected clients
export const broadcast = (message: any, channel: string = 'all') => {
  const messageStr = JSON.stringify({
    ...message,
    timestamp: new Date().toISOString(),
  });

  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      const subscriptions = (client as any).subscriptions || ['all'];

      // Send if client is subscribed to this channel or 'all'
      if (subscriptions.includes(channel) || subscriptions.includes('all')) {
        client.send(messageStr);
      }
    }
  });
};

// Broadcast session-related updates
export const broadcastSessionUpdate = (data: any) => {
  broadcast(
    {
      channel: 'sessions',
      ...data,
    },
    'sessions'
  );
};

// Broadcast flow-related updates
export const broadcastFlowUpdate = (data: any) => {
  broadcast(
    {
      channel: 'flows',
      ...data,
    },
    'flows'
  );
};

// Broadcast analytics updates
export const broadcastAnalyticsUpdate = (data: any) => {
  broadcast(
    {
      channel: 'analytics',
      ...data,
    },
    'analytics'
  );
};

// Get connected client count
export const getConnectedClientsCount = (): number => {
  return clients.size;
};

export default {
  initWebSocket,
  broadcast,
  broadcastSessionUpdate,
  broadcastFlowUpdate,
  broadcastAnalyticsUpdate,
  getConnectedClientsCount,
};
