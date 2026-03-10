# Database Schema Changes for Enhanced Metrics

This document describes the database schema changes required to support the enhanced metrics in the agent console dashboard.

## Required Schema Changes

### Sessions Table

Add the following fields to the `sessions` table:

```sql
-- Add to sessions table
ALTER TABLE sessions
ADD COLUMN first_try_completion BOOLEAN DEFAULT FALSE,
ADD COLUMN customer_extremely_angry BOOLEAN DEFAULT FALSE,
ADD COLUMN legal_threat_detected BOOLEAN DEFAULT FALSE;
```

### Session Data Table

Add the following fields to the `session_data` table to track form field completion attempts:

```sql
-- Add to session_data table
ALTER TABLE session_data
ADD COLUMN attempt_count INTEGER DEFAULT 1,
ADD COLUMN completed_on_first_try BOOLEAN DEFAULT FALSE;
```

### Transcripts Table

Enhance the `transcripts` table to support sentiment analysis and legal threat detection:

```sql
-- Update the sentiment check constraint to include additional sentiment levels
ALTER TABLE transcripts
DROP CONSTRAINT IF EXISTS transcripts_sentiment_check;

ALTER TABLE transcripts
ADD CONSTRAINT transcripts_sentiment_check
CHECK (sentiment IN ('positive', 'neutral', 'negative', 'very_negative', 'extreme_anger'));

-- Add legal threat detection column
ALTER TABLE transcripts
ADD COLUMN contains_legal_threat BOOLEAN DEFAULT FALSE;
```

## Triggers for Automatic Metrics Calculation

Create the following triggers to automatically update the session metrics:

```sql
-- Trigger to update first_try_completion when all session fields are completed on first try
CREATE OR REPLACE FUNCTION update_first_try_completion()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if this is a new session_data record with completed_on_first_try = true
  IF (NEW.completed_on_first_try = true) THEN
    -- Check if all required fields for this session are completed on first try
    IF NOT EXISTS (
      SELECT 1
      FROM flows f
      JOIN sessions s ON s.flow_id = f.id
      LEFT JOIN session_data sd ON sd.session_id = s.id
      WHERE s.id = NEW.session_id
      AND sd.session_id IS NULL -- Missing required field
    ) AND NOT EXISTS (
      SELECT 1
      FROM session_data
      WHERE session_id = NEW.session_id
      AND completed_on_first_try = false
    ) THEN
      -- All fields completed on first try, update the session
      UPDATE sessions
      SET first_try_completion = true
      WHERE id = NEW.session_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_session_first_try_completion
AFTER INSERT OR UPDATE ON session_data
FOR EACH ROW
EXECUTE FUNCTION update_first_try_completion();

-- Trigger to update customer_extremely_angry flag based on transcripts
CREATE OR REPLACE FUNCTION update_customer_anger()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if this is a transcript with extreme anger
  IF (NEW.speaker = 'client' AND NEW.sentiment = 'extreme_anger') THEN
    -- Update the session
    UPDATE sessions
    SET customer_extremely_angry = true
    WHERE id = NEW.session_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_session_customer_anger
AFTER INSERT OR UPDATE ON transcripts
FOR EACH ROW
EXECUTE FUNCTION update_customer_anger();

-- Trigger to update legal_threat_detected flag based on transcripts
CREATE OR REPLACE FUNCTION update_legal_threat()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if this is a transcript with a legal threat
  IF (NEW.speaker = 'client' AND NEW.contains_legal_threat = true) THEN
    -- Update the session
    UPDATE sessions
    SET legal_threat_detected = true
    WHERE id = NEW.session_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_session_legal_threat
AFTER INSERT OR UPDATE ON transcripts
FOR EACH ROW
EXECUTE FUNCTION update_legal_threat();
```

## Implementation Notes

1. For a running system, these changes should be applied as migration scripts.
2. Ensure you backup your database before applying these changes.
3. The new columns have defaults, so existing records will automatically get values.
4. For historical data, you may want to run a one-time job that:
   - Sets `first_try_completion` for sessions where all fields were completed on first try
   - Uses NLP to analyze historical transcripts for extreme anger or legal threats

## Integration with Agent Console

After applying these schema changes:

1. The metrics API endpoint will return actual calculated metrics rather than placeholders
2. The "First-try Form Completion" rate will be calculated from actual session data
3. The "Extremely Angry Customers" rate will be based on detected sentiment in transcripts
4. The "Legal Threats" rate will be determined by transcript analysis

## Enhanced Sentiment Analysis

To improve the accuracy of the "Extremely Angry Customers" metric:

1. Update the transcription processing pipeline to use more sophisticated sentiment analysis
2. Train a model to recognize extreme anger specifically in the context of customer support
3. Implement automatic detection of threatening language for the legal threats metric

---

**Important:** If the system is running in Docker, the volume for the PostgreSQL database needs to be recreated or these schema changes need to be applied as migrations to the running database.