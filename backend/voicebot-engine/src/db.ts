import { Pool } from 'pg';

let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
    });
  }

  return pool;
}

export interface Flow {
  id: string;
  name: string;
  description: string;
  system_prompt: string;
  slots: FlowSlot[];
  created_at: Date;
  updated_at: Date;
}

export interface FlowSlot {
  name: string;
  type: string;
  description: string;
  required: boolean;
  validation?: string;
  prompt?: string;
}

export async function loadFlow(flowId: string): Promise<Flow | null> {
  const pool = getPool();
  const result = await pool.query(
    'SELECT * FROM flows WHERE id = $1',
    [flowId]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return result.rows[0] as Flow;
}

export interface TranscriptEntry {
  session_id: string;
  speaker: 'user' | 'bot';
  text: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export async function saveTranscript(entry: TranscriptEntry): Promise<void> {
  const pool = getPool();
  await pool.query(
    `INSERT INTO transcripts (session_id, speaker, text, timestamp, metadata)
     VALUES ($1, $2, $3, $4, $5)`,
    [entry.session_id, entry.speaker, entry.text, entry.timestamp, entry.metadata || {}]
  );
}

export async function updateSessionStatus(
  sessionId: string,
  status: string,
  metadata?: Record<string, any>
): Promise<void> {
  const pool = getPool();
  await pool.query(
    `UPDATE sessions
     SET status = $1, metadata = $2, updated_at = NOW()
     WHERE id = $3`,
    [status, metadata || {}, sessionId]
  );
}

export async function updateSessionCollectedData(
  sessionId: string,
  collectedData: Record<string, any>
): Promise<void> {
  const pool = getPool();
  await pool.query(
    `UPDATE sessions
     SET collected_data = $1, updated_at = NOW()
     WHERE id = $2`,
    [collectedData, sessionId]
  );
}
