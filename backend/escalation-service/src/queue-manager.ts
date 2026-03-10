import { query } from './db';

export type PriorityLevel = 'low' | 'medium' | 'high' | 'urgent';
export type EscalationStatus = 'pending' | 'assigned' | 'in_progress' | 'resolved' | 'cancelled';

interface QueueItem {
  id: number;
  session_id: string;
  priority: PriorityLevel;
  status: EscalationStatus;
  created_at: string;
  wait_time_minutes?: number;
}

export class QueueManager {
  /**
   * Get priority weight for sorting
   */
  private getPriorityWeight(priority: PriorityLevel): number {
    const weights = {
      urgent: 4,
      high: 3,
      medium: 2,
      low: 1,
    };
    return weights[priority] || 2;
  }

  /**
   * Calculate priority score based on priority level and wait time
   */
  private calculatePriorityScore(priority: PriorityLevel, createdAt: string): number {
    const priorityWeight = this.getPriorityWeight(priority);
    const waitTimeMinutes = this.getWaitTimeMinutes(createdAt);

    // Increase score based on wait time (age decay factor)
    const ageBonus = Math.floor(waitTimeMinutes / 5) * 0.1; // +0.1 per 5 minutes

    return priorityWeight + ageBonus;
  }

  /**
   * Get wait time in minutes
   */
  private getWaitTimeMinutes(createdAt: string): number {
    const created = new Date(createdAt).getTime();
    const now = Date.now();
    return Math.floor((now - created) / (1000 * 60));
  }

  /**
   * Get current queue (pending escalations)
   */
  async getQueue(): Promise<QueueItem[]> {
    const result = await query(
      `SELECT
        id,
        session_id,
        priority,
        status,
        created_at,
        summary,
        assigned_to
      FROM escalations
      WHERE status = 'pending'
      ORDER BY
        CASE priority
          WHEN 'urgent' THEN 4
          WHEN 'high' THEN 3
          WHEN 'medium' THEN 2
          WHEN 'low' THEN 1
          ELSE 2
        END DESC,
        created_at ASC`
    );

    return result.rows.map((row) => ({
      ...row,
      wait_time_minutes: this.getWaitTimeMinutes(row.created_at),
    }));
  }

  /**
   * Get next escalation from queue (highest priority)
   */
  async getNextInQueue(): Promise<QueueItem | null> {
    const queue = await this.getQueue();
    return queue.length > 0 ? queue[0] : null;
  }

  /**
   * Assign escalation to consultant
   */
  async assignEscalation(escalationId: number, consultantId: string): Promise<any> {
    const result = await query(
      `UPDATE escalations
      SET
        status = 'assigned',
        assigned_to = $1,
        assigned_at = CURRENT_TIMESTAMP
      WHERE id = $2 AND status = 'pending'
      RETURNING *`,
      [consultantId, escalationId]
    );

    if (result.rows.length === 0) {
      throw new Error('Escalation not found or already assigned');
    }

    return result.rows[0];
  }

  /**
   * Auto-assign next escalation to available consultant
   */
  async autoAssign(consultantId: string): Promise<any | null> {
    const next = await this.getNextInQueue();

    if (!next) {
      return null;
    }

    return await this.assignEscalation(next.id, consultantId);
  }

  /**
   * Update escalation status
   */
  async updateStatus(escalationId: number, status: EscalationStatus): Promise<any> {
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
    const result = await query(
      `UPDATE escalations
      SET
        status = 'resolved',
        resolved_at = CURRENT_TIMESTAMP,
        resolution_notes = $1
      WHERE id = $2
      RETURNING *`,
      [resolutionNotes || null, escalationId]
    );

    if (result.rows.length === 0) {
      throw new Error('Escalation not found');
    }

    return result.rows[0];
  }

  /**
   * Get escalations assigned to a consultant
   */
  async getConsultantEscalations(consultantId: string): Promise<any[]> {
    const result = await query(
      `SELECT * FROM escalations
      WHERE assigned_to = $1
      AND status IN ('assigned', 'in_progress')
      ORDER BY created_at ASC`,
      [consultantId]
    );

    return result.rows.map((row) => ({
      ...row,
      wait_time_minutes: this.getWaitTimeMinutes(row.created_at),
    }));
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(): Promise<any> {
    const result = await query(`
      SELECT
        COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
        COUNT(*) FILTER (WHERE status = 'assigned') as assigned_count,
        COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress_count,
        COUNT(*) FILTER (WHERE status = 'resolved') as resolved_count,
        COUNT(*) FILTER (WHERE priority = 'urgent') as urgent_count,
        COUNT(*) FILTER (WHERE priority = 'high') as high_count,
        COUNT(*) FILTER (WHERE priority = 'medium') as medium_count,
        COUNT(*) FILTER (WHERE priority = 'low') as low_count,
        AVG(EXTRACT(EPOCH FROM (resolved_at - created_at)) / 60)
          FILTER (WHERE resolved_at IS NOT NULL) as avg_resolution_time_minutes
      FROM escalations
      WHERE created_at > CURRENT_TIMESTAMP - INTERVAL '24 hours'
    `);

    return result.rows[0];
  }
}

export default new QueueManager();
