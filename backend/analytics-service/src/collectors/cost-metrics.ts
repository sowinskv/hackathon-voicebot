import { query } from '../db';

export interface CostMetric {
  session_id: string;
  stt_cost: number;
  tts_cost: number;
  llm_cost: number;
  total_cost: number;
  stt_duration_seconds: number;
  tts_characters: number;
  llm_tokens: number;
  created_at: Date;
}

// Pricing constants (can be moved to environment variables)
const PRICING = {
  STT_PER_SECOND: 0.0001, // $0.0001 per second
  TTS_PER_1K_CHARS: 0.015, // $0.015 per 1000 characters
  LLM_PER_1K_TOKENS: 0.002, // $0.002 per 1000 tokens (average input/output)
};

/**
 * Calculate and record API costs for a session
 */
export async function calculateSessionCosts(sessionId: string): Promise<CostMetric> {
  try {
    // Get STT usage
    const sttResult = await query({
      text: `
        SELECT
          COALESCE(SUM(duration_seconds), 0) as total_duration
        FROM stt_usage
        WHERE session_id = $1
      `,
      values: [sessionId]
    });

    // Get TTS usage
    const ttsResult = await query({
      text: `
        SELECT
          COALESCE(SUM(character_count), 0) as total_characters
        FROM tts_usage
        WHERE session_id = $1
      `,
      values: [sessionId]
    });

    // Get LLM usage
    const llmResult = await query({
      text: `
        SELECT
          COALESCE(SUM(input_tokens + output_tokens), 0) as total_tokens
        FROM llm_usage
        WHERE session_id = $1
      `,
      values: [sessionId]
    });

    const sttDuration = parseFloat(sttResult.rows[0].total_duration);
    const ttsCharacters = parseInt(ttsResult.rows[0].total_characters);
    const llmTokens = parseInt(llmResult.rows[0].total_tokens);

    const sttCost = sttDuration * PRICING.STT_PER_SECOND;
    const ttsCost = (ttsCharacters / 1000) * PRICING.TTS_PER_1K_CHARS;
    const llmCost = (llmTokens / 1000) * PRICING.LLM_PER_1K_TOKENS;
    const totalCost = sttCost + ttsCost + llmCost;

    // Store the calculated costs
    await query({
      text: `
        INSERT INTO session_costs (
          session_id, stt_cost, tts_cost, llm_cost, total_cost,
          stt_duration_seconds, tts_characters, llm_tokens, created_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
        ON CONFLICT (session_id)
        DO UPDATE SET
          stt_cost = EXCLUDED.stt_cost,
          tts_cost = EXCLUDED.tts_cost,
          llm_cost = EXCLUDED.llm_cost,
          total_cost = EXCLUDED.total_cost,
          stt_duration_seconds = EXCLUDED.stt_duration_seconds,
          tts_characters = EXCLUDED.tts_characters,
          llm_tokens = EXCLUDED.llm_tokens,
          updated_at = NOW()
      `,
      values: [sessionId, sttCost, ttsCost, llmCost, totalCost, sttDuration, ttsCharacters, llmTokens]
    });

    return {
      session_id: sessionId,
      stt_cost: sttCost,
      tts_cost: ttsCost,
      llm_cost: llmCost,
      total_cost: totalCost,
      stt_duration_seconds: sttDuration,
      tts_characters: ttsCharacters,
      llm_tokens: llmTokens,
      created_at: new Date()
    };
  } catch (error) {
    console.error('Error calculating session costs:', error);
    throw error;
  }
}

/**
 * Get cost statistics for a date range
 */
export async function getCostStatistics(
  startDate?: Date,
  endDate?: Date
): Promise<{
  total_cost: number;
  avg_cost_per_session: number;
  total_sessions: number;
  stt_total_cost: number;
  tts_total_cost: number;
  llm_total_cost: number;
  cost_breakdown: {
    stt_percentage: number;
    tts_percentage: number;
    llm_percentage: number;
  };
}> {
  try {
    const conditions = [];
    const values: any[] = [];

    if (startDate) {
      values.push(startDate);
      conditions.push(`sc.created_at >= $${values.length}`);
    }

    if (endDate) {
      values.push(endDate);
      conditions.push(`sc.created_at <= $${values.length}`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const result = await query({
      text: `
        SELECT
          COALESCE(SUM(sc.total_cost), 0) as total_cost,
          COALESCE(AVG(sc.total_cost), 0) as avg_cost_per_session,
          COUNT(*) as total_sessions,
          COALESCE(SUM(sc.stt_cost), 0) as stt_total_cost,
          COALESCE(SUM(sc.tts_cost), 0) as tts_total_cost,
          COALESCE(SUM(sc.llm_cost), 0) as llm_total_cost
        FROM session_costs sc
        ${whereClause}
      `,
      values
    });

    const row = result.rows[0];
    const totalCost = parseFloat(row.total_cost);

    return {
      total_cost: totalCost,
      avg_cost_per_session: parseFloat(row.avg_cost_per_session),
      total_sessions: parseInt(row.total_sessions),
      stt_total_cost: parseFloat(row.stt_total_cost),
      tts_total_cost: parseFloat(row.tts_total_cost),
      llm_total_cost: parseFloat(row.llm_total_cost),
      cost_breakdown: {
        stt_percentage: totalCost > 0 ? (parseFloat(row.stt_total_cost) / totalCost) * 100 : 0,
        tts_percentage: totalCost > 0 ? (parseFloat(row.tts_total_cost) / totalCost) * 100 : 0,
        llm_percentage: totalCost > 0 ? (parseFloat(row.llm_total_cost) / totalCost) * 100 : 0,
      }
    };
  } catch (error) {
    console.error('Error getting cost statistics:', error);
    throw error;
  }
}

/**
 * Get top cost-generating sessions
 */
export async function getTopCostSessions(limit: number = 10): Promise<CostMetric[]> {
  try {
    const result = await query({
      text: `
        SELECT
          session_id,
          stt_cost,
          tts_cost,
          llm_cost,
          total_cost,
          stt_duration_seconds,
          tts_characters,
          llm_tokens,
          created_at
        FROM session_costs
        ORDER BY total_cost DESC
        LIMIT $1
      `,
      values: [limit]
    });

    return result.rows as CostMetric[];
  } catch (error) {
    console.error('Error getting top cost sessions:', error);
    throw error;
  }
}
