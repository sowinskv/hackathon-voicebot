-- Migration to seed metrics data for existing sessions

-- Update existing sessions with some sample values to make metrics interesting
UPDATE sessions
SET first_try_completion = TRUE
WHERE id IN (
  SELECT id FROM sessions
  WHERE status = 'completed'
  LIMIT (SELECT COUNT(*) * 0.8 FROM sessions WHERE status = 'completed')
);

UPDATE sessions
SET customer_extremely_angry = TRUE
WHERE id IN (
  SELECT id FROM sessions
  WHERE status = 'escalated'
  LIMIT (SELECT COUNT(*) * 0.5 FROM sessions WHERE status = 'escalated')
);

UPDATE sessions
SET legal_threat_detected = TRUE
WHERE id IN (
  SELECT id FROM sessions
  WHERE status = 'escalated'
  LIMIT (SELECT COUNT(*) * 0.2 FROM sessions WHERE status = 'escalated')
);

-- Update session_data for first-try completion stats
UPDATE session_data
SET completed_on_first_try = TRUE
WHERE session_id IN (
  SELECT id FROM sessions
  WHERE first_try_completion = TRUE
);

-- Update transcripts for sentiment analysis
UPDATE transcripts
SET sentiment = 'extreme_anger'
WHERE session_id IN (
  SELECT id FROM sessions
  WHERE customer_extremely_angry = TRUE
)
AND speaker = 'client'
LIMIT (SELECT COUNT(*) FROM sessions WHERE customer_extremely_angry = TRUE);

-- Update transcripts for legal threats
UPDATE transcripts
SET contains_legal_threat = TRUE
WHERE session_id IN (
  SELECT id FROM sessions
  WHERE legal_threat_detected = TRUE
)
AND speaker = 'client'
LIMIT (SELECT COUNT(*) FROM sessions WHERE legal_threat_detected = TRUE);