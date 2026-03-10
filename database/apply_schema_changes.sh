#!/bin/bash

# Script to apply schema changes for enhanced metrics to a running database

echo "Applying schema changes for enhanced metrics..."

# Use the environment variable for password if available, or use the default
DB_PASSWORD=${DB_PASSWORD:-devpassword123}

# Create a temporary SQL file with the changes
cat > temp_schema_changes.sql << 'EOF'
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

DROP TRIGGER IF EXISTS update_session_first_try_completion ON session_data;
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

DROP TRIGGER IF EXISTS update_session_customer_anger ON transcripts;
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

DROP TRIGGER IF EXISTS update_session_legal_threat ON transcripts;
CREATE TRIGGER update_session_legal_threat
AFTER INSERT OR UPDATE ON transcripts
FOR EACH ROW
EXECUTE FUNCTION update_legal_threat();

-- Update existing mock data
UPDATE sessions
SET first_try_completion = TRUE
WHERE id IN (
  SELECT id FROM sessions
  ORDER BY created_at
  LIMIT 2
);

UPDATE sessions
SET customer_extremely_angry = TRUE
WHERE id IN (
  SELECT id FROM sessions
  WHERE status = 'escalated'
);

UPDATE sessions
SET legal_threat_detected = TRUE
WHERE id IN (
  SELECT id FROM sessions
  ORDER BY created_at DESC
  LIMIT 1
);
EOF

# Connect to the PostgreSQL database and execute the SQL script
# Using port 5433 as specified in the docker-compose.yml
PGPASSWORD="$DB_PASSWORD" psql -h localhost -p 5433 -U callcenter -d callcenter -f temp_schema_changes.sql

# Check the result
if [ $? -eq 0 ]; then
  echo "✅ Schema changes successfully applied to the database!"
  echo "The dashboard should now show actual metrics instead of placeholders."
else
  echo "❌ Error applying schema changes to the database."
  echo "Please check your database connection settings."
fi

# Clean up
rm temp_schema_changes.sql

echo ""
echo "Note: You may need to restart the API gateway service for changes to take effect."
echo "Run: docker restart callcenter-api"