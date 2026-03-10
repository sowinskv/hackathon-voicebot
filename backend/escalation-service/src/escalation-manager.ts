import { query } from './db';
import summaryGenerator from './summary-generator';
import notificationService from './notification';
import queueManager, { PriorityLevel } from './queue-manager';

interface CreateEscalationParams {
  sessionId: string;
  userId?: string;
  messages: Array<{
    role: string;
    content: string;
    timestamp: string;
  }>;
  collectedData?: Record<string, any>;
  reason?: string;
  priority?: PriorityLevel;
}

export class EscalationManager {
  /**
   * Create a new escalation
   */
  async createEscalation(params: CreateEscalationParams): Promise<any> {
    const { sessionId, userId, messages, collectedData, reason, priority = 'medium' } = params;

    try {
      console.log(`Creating escalation for session ${sessionId}`);

      // Generate conversation summary using AI
      const summary = await summaryGenerator.generateSummary({
        messages,
        collectedData,
        reason,
      });

      // Format transcript
      const transcript = messages
        .map((msg) => `[${msg.timestamp}] ${msg.role}: ${msg.content}`)
        .join('\n');

      // Extract additional key information
      const extractedInfo = await summaryGenerator.extractKeyInfo(messages);

      // Merge collected data with extracted info
      const finalCollectedData = {
        ...collectedData,
        ...extractedInfo,
        escalation_reason: reason,
      };

      // Insert escalation into database
      const result = await query(
        `INSERT INTO escalations
        (session_id, user_id, priority, status, summary, transcript, collected_data)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *`,
        [
          sessionId,
          userId || null,
          priority,
          'pending',
          summary,
          transcript,
          JSON.stringify(finalCollectedData),
        ]
      );

      const escalation = result.rows[0];

      // Mark session as escalated
      await this.markSessionEscalated(sessionId);

      // Send notification to agent console
      notificationService.notifyNewEscalation(escalation);

      console.log(`Escalation created successfully: ${escalation.id}`);

      return escalation;
    } catch (error) {
      console.error('Error creating escalation:', error);
      throw error;
    }
  }

  /**
   * Mark session as escalated
   */
  private async markSessionEscalated(sessionId: string): Promise<void> {
    try {
      await query(
        `UPDATE chat_sessions
        SET
          escalated = true,
          escalated_at = CURRENT_TIMESTAMP
        WHERE id = $1`,
        [sessionId]
      );
      console.log(`Session ${sessionId} marked as escalated`);
    } catch (error) {
      console.error('Error marking session as escalated:', error);
      // Don't throw - this is not critical
    }
  }

  /**
   * Get escalation by ID
   */
  async getEscalation(escalationId: number): Promise<any> {
    const result = await query(
      'SELECT * FROM escalations WHERE id = $1',
      [escalationId]
    );

    if (result.rows.length === 0) {
      throw new Error('Escalation not found');
    }

    return result.rows[0];
  }

  /**
   * Get escalation by session ID
   */
  async getEscalationBySession(sessionId: string): Promise<any> {
    const result = await query(
      'SELECT * FROM escalations WHERE session_id = $1 ORDER BY created_at DESC LIMIT 1',
      [sessionId]
    );

    if (result.rows.length === 0) {
      throw new Error('Escalation not found for session');
    }

    return result.rows[0];
  }

  /**
   * Assign escalation to consultant
   */
  async assignToConsultant(escalationId: number, consultantId: string): Promise<any> {
    const escalation = await queueManager.assignEscalation(escalationId, consultantId);

    // Send notification
    notificationService.notifyEscalationAssigned(escalation);

    return escalation;
  }

  /**
   * Update escalation status
   */
  async updateStatus(escalationId: number, status: string): Promise<any> {
    const result = await query(
      `UPDATE escalations
      SET status = $1
      WHERE id = $2
      RETURNING *`,
      [status, escalationId]
    );

    if (result.rows.length === 0) {
      throw new Error('Escalation not found');
    }

    return result.rows[0];
  }

  /**
   * Resolve escalation
   */
  async resolveEscalation(escalationId: number, resolutionNotes?: string): Promise<any> {
    const escalation = await queueManager.resolveEscalation(escalationId, resolutionNotes);

    // Send notification
    notificationService.notifyEscalationResolved(escalation);

    return escalation;
  }

  /**
   * Get all escalations with filters
   */
  async getEscalations(filters: {
    status?: string;
    priority?: string;
    assignedTo?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ escalations: any[]; total: number }> {
    const { status, priority, assignedTo, limit = 50, offset = 0 } = filters;

    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (status) {
      conditions.push(`status = $${paramIndex++}`);
      params.push(status);
    }

    if (priority) {
      conditions.push(`priority = $${paramIndex++}`);
      params.push(priority);
    }

    if (assignedTo) {
      conditions.push(`assigned_to = $${paramIndex++}`);
      params.push(assignedTo);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) as total FROM escalations ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].total);

    // Get escalations
    params.push(limit, offset);
    const result = await query(
      `SELECT * FROM escalations
      ${whereClause}
      ORDER BY
        CASE priority
          WHEN 'urgent' THEN 4
          WHEN 'high' THEN 3
          WHEN 'medium' THEN 2
          WHEN 'low' THEN 1
          ELSE 2
        END DESC,
        created_at DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
      params
    );

    return {
      escalations: result.rows,
      total,
    };
  }

  /**
   * Add note to escalation
   */
  async addNote(escalationId: number, note: string, author: string): Promise<any> {
    const escalation = await this.getEscalation(escalationId);

    const collectedData = escalation.collected_data || {};
    if (!collectedData.notes) {
      collectedData.notes = [];
    }

    collectedData.notes.push({
      author,
      note,
      timestamp: new Date().toISOString(),
    });

    const result = await query(
      `UPDATE escalations
      SET collected_data = $1
      WHERE id = $2
      RETURNING *`,
      [JSON.stringify(collectedData), escalationId]
    );

    return result.rows[0];
  }
}

export default new EscalationManager();
