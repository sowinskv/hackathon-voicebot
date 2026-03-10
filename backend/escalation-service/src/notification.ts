import WebSocket from 'ws';

interface Notification {
  type: string;
  data: any;
  timestamp: string;
}

export class NotificationService {
  private wss: WebSocket.Server | null = null;
  private clients: Set<WebSocket> = new Set();

  /**
   * Initialize WebSocket server
   */
  initialize(server: any) {
    this.wss = new WebSocket.Server({ server, path: '/ws/notifications' });

    this.wss.on('connection', (ws: WebSocket, req) => {
      console.log('New WebSocket connection established');
      this.clients.add(ws);

      // Send welcome message
      this.sendToClient(ws, {
        type: 'connected',
        data: { message: 'Connected to escalation notification service' },
        timestamp: new Date().toISOString(),
      });

      // Handle client messages
      ws.on('message', (message: string) => {
        try {
          const data = JSON.parse(message.toString());
          console.log('Received message from client:', data);

          // Handle subscription/authentication here if needed
          if (data.type === 'subscribe') {
            ws.send(JSON.stringify({
              type: 'subscribed',
              data: { consultantId: data.consultantId },
              timestamp: new Date().toISOString(),
            }));
          }
        } catch (error) {
          console.error('Error processing client message:', error);
        }
      });

      // Handle client disconnect
      ws.on('close', () => {
        console.log('WebSocket connection closed');
        this.clients.delete(ws);
      });

      // Handle errors
      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        this.clients.delete(ws);
      });
    });

    console.log('WebSocket notification service initialized');
  }

  /**
   * Send notification to a specific client
   */
  private sendToClient(client: WebSocket, notification: Notification) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(notification));
    }
  }

  /**
   * Broadcast notification to all connected clients
   */
  broadcast(notification: Notification) {
    console.log(`Broadcasting notification to ${this.clients.size} clients:`, notification.type);

    this.clients.forEach((client) => {
      this.sendToClient(client, notification);
    });
  }

  /**
   * Send escalation notification
   */
  notifyNewEscalation(escalation: any) {
    this.broadcast({
      type: 'new_escalation',
      data: {
        escalationId: escalation.id,
        sessionId: escalation.session_id,
        priority: escalation.priority,
        summary: escalation.summary,
        createdAt: escalation.created_at,
      },
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Send escalation assignment notification
   */
  notifyEscalationAssigned(escalation: any) {
    this.broadcast({
      type: 'escalation_assigned',
      data: {
        escalationId: escalation.id,
        assignedTo: escalation.assigned_to,
        assignedAt: escalation.assigned_at,
      },
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Send escalation resolution notification
   */
  notifyEscalationResolved(escalation: any) {
    this.broadcast({
      type: 'escalation_resolved',
      data: {
        escalationId: escalation.id,
        resolvedAt: escalation.resolved_at,
        resolutionNotes: escalation.resolution_notes,
      },
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Get count of connected clients
   */
  getConnectedClientsCount(): number {
    return this.clients.size;
  }
}

export default new NotificationService();
