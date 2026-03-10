-- Migration to add fields for enhanced metrics

-- Add columns to sessions table
ALTER TABLE sessions
ADD COLUMN IF NOT EXISTS first_try_completion BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS customer_extremely_angry BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS legal_threat_detected BOOLEAN DEFAULT FALSE;

-- Add columns to session_data table
ALTER TABLE session_data
ADD COLUMN IF NOT EXISTS attempt_count INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS completed_on_first_try BOOLEAN DEFAULT FALSE;

-- Update the sentiment check constraint to include additional sentiment levels
ALTER TABLE transcripts
DROP CONSTRAINT IF EXISTS transcripts_sentiment_check;

ALTER TABLE transcripts
ADD CONSTRAINT transcripts_sentiment_check
CHECK (sentiment IS NULL OR sentiment IN ('positive', 'neutral', 'negative', 'very_negative', 'extreme_anger'));

-- Add legal threat detection column
ALTER TABLE transcripts
ADD COLUMN IF NOT EXISTS contains_legal_threat BOOLEAN DEFAULT FALSE;