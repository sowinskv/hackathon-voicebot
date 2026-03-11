-- Voice Recognition Tables
-- Adds speaker recognition/voice biometrics capability

-- Customer voice profiles
CREATE TABLE customer_voice_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id VARCHAR(255) UNIQUE NOT NULL,  -- External customer identifier
    customer_name VARCHAR(255),
    phone_number VARCHAR(50),
    email VARCHAR(255),
    policy_number VARCHAR(100),
    azure_profile_id VARCHAR(255) UNIQUE NOT NULL,  -- Azure Speaker Recognition profile ID
    enrollment_status VARCHAR(50) NOT NULL CHECK (enrollment_status IN ('enrolling', 'enrolled', 'failed', 'expired')),
    enrollment_audio_duration_seconds INTEGER,
    enrolled_at TIMESTAMP,
    last_recognized_at TIMESTAMP,
    recognition_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Voice recognition events (tracking all identification attempts)
CREATE TABLE voice_recognition_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
    customer_id VARCHAR(255),  -- Recognized customer (if successful)
    voice_profile_id UUID REFERENCES customer_voice_profiles(id) ON DELETE SET NULL,
    recognized BOOLEAN NOT NULL,
    confidence_score NUMERIC(5, 4),  -- 0.0000 to 1.0000
    audio_duration_seconds INTEGER,
    recognition_time_ms INTEGER,  -- How long the recognition took
    fallback_to_manual_auth BOOLEAN DEFAULT FALSE,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_voice_profiles_customer_id ON customer_voice_profiles(customer_id);
CREATE INDEX idx_voice_profiles_azure_profile_id ON customer_voice_profiles(azure_profile_id);
CREATE INDEX idx_voice_profiles_enrollment_status ON customer_voice_profiles(enrollment_status);
CREATE INDEX idx_voice_recognition_events_session ON voice_recognition_events(session_id);
CREATE INDEX idx_voice_recognition_events_customer ON voice_recognition_events(customer_id);
CREATE INDEX idx_voice_recognition_events_recognized ON voice_recognition_events(recognized, created_at);

-- Update trigger for voice profiles
CREATE TRIGGER update_voice_profiles_updated_at
    BEFORE UPDATE ON customer_voice_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add voice recognition metadata to sessions table
ALTER TABLE sessions
    ADD COLUMN voice_recognized BOOLEAN DEFAULT FALSE,
    ADD COLUMN recognized_customer_id VARCHAR(255),
    ADD COLUMN recognition_confidence NUMERIC(5, 4);

-- Create index on sessions for voice recognition
CREATE INDEX idx_sessions_voice_recognized ON sessions(voice_recognized);
CREATE INDEX idx_sessions_recognized_customer ON sessions(recognized_customer_id);

-- Insert some mock voice profiles for demo
INSERT INTO customer_voice_profiles (
    customer_id,
    customer_name,
    phone_number,
    email,
    policy_number,
    azure_profile_id,
    enrollment_status,
    enrollment_audio_duration_seconds,
    enrolled_at,
    recognition_count
) VALUES
    (
        'sarah_johnson_001',
        'Sarah Johnson',
        '+1-555-123-4567',
        'sarah.j@example.com',
        'POL-2024-8371',
        'azure-profile-sarah-001',
        'enrolled',
        32,
        NOW() - INTERVAL '15 days',
        12
    ),
    (
        'michael_chen_002',
        'Michael Chen',
        '+1-555-987-6543',
        'mchen@techcorp.com',
        'POL-2024-5492',
        'azure-profile-michael-002',
        'enrolled',
        35,
        NOW() - INTERVAL '8 days',
        5
    ),
    (
        'emily_rodriguez_003',
        'Emily Rodriguez',
        '+1-555-246-8135',
        'emily.r@gmail.com',
        'POL-2024-7821',
        'azure-profile-emily-003',
        'enrolled',
        31,
        NOW() - INTERVAL '3 days',
        2
    );

-- View for voice recognition analytics
CREATE OR REPLACE VIEW voice_recognition_analytics AS
SELECT
    DATE(created_at) as date,
    COUNT(*) as total_attempts,
    COUNT(*) FILTER (WHERE recognized = true) as successful_recognitions,
    ROUND(100.0 * COUNT(*) FILTER (WHERE recognized = true) / NULLIF(COUNT(*), 0), 2) as success_rate,
    ROUND(AVG(confidence_score) FILTER (WHERE recognized = true), 4) as avg_confidence,
    ROUND(AVG(recognition_time_ms), 0) as avg_recognition_time_ms,
    COUNT(*) FILTER (WHERE fallback_to_manual_auth = true) as fallback_count
FROM voice_recognition_events
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Grant permissions (adjust as needed)
-- GRANT SELECT, INSERT, UPDATE ON customer_voice_profiles TO callcenter_app;
-- GRANT SELECT, INSERT ON voice_recognition_events TO callcenter_app;
