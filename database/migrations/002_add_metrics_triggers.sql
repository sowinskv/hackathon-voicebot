-- Migration to add triggers for enhanced metrics calculation

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