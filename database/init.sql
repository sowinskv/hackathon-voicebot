-- Next-Generation Call Center Database Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For text search

-- Sessions table
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id VARCHAR(255) UNIQUE NOT NULL,
    status VARCHAR(50) NOT NULL CHECK (status IN ('active', 'completed', 'escalated', 'abandoned')),
    language VARCHAR(10) NOT NULL CHECK (language IN ('pl', 'en')),
    flow_id UUID,
    started_at TIMESTAMP NOT NULL DEFAULT NOW(),
    ended_at TIMESTAMP,
    duration_seconds INTEGER,
    escalated BOOLEAN DEFAULT FALSE,
    escalated_at TIMESTAMP,
    escalation_reason TEXT,
    client_metadata JSONB DEFAULT '{}',
    cost_data JSONB DEFAULT '{}',
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    satisfaction_score INTEGER CHECK (satisfaction_score >= 1 AND satisfaction_score <= 5),
    first_try_completion BOOLEAN DEFAULT FALSE, -- Whether all form fields were completed on first try
    customer_extremely_angry BOOLEAN DEFAULT FALSE, -- Whether customer showed extreme anger
    legal_threat_detected BOOLEAN DEFAULT FALSE, -- Whether customer threatened legal action
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Transcripts table
CREATE TABLE transcripts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
    speaker VARCHAR(20) NOT NULL CHECK (speaker IN ('client', 'bot', 'agent')),
    text TEXT NOT NULL,
    timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
    audio_url TEXT,
    sentiment VARCHAR(20) CHECK (sentiment IN ('positive', 'neutral', 'negative', 'very_negative', 'extreme_anger')),
    contains_legal_threat BOOLEAN DEFAULT FALSE, -- Flag if message contains legal threat
    language VARCHAR(10),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Collected data table (slot values)
CREATE TABLE session_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
    field_name VARCHAR(100) NOT NULL,
    field_value TEXT,
    field_type VARCHAR(50) CHECK (field_type IN ('text', 'date', 'number', 'phone', 'email', 'policy_number')),
    is_confirmed BOOLEAN DEFAULT FALSE,
    confirmed_at TIMESTAMP,
    validation_status VARCHAR(20) CHECK (validation_status IN ('valid', 'invalid', 'pending')),
    collected_at TIMESTAMP DEFAULT NOW(),
    attempt_count INTEGER DEFAULT 1, -- Number of attempts to collect this field
    completed_on_first_try BOOLEAN DEFAULT FALSE, -- Whether field was correctly collected on first try
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(session_id, field_name)
);

-- Flows table (bot configurations)
CREATE TABLE flows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    version INTEGER NOT NULL DEFAULT 1,
    status VARCHAR(20) NOT NULL CHECK (status IN ('draft', 'published', 'archived')),
    language VARCHAR(10) NOT NULL CHECK (language IN ('pl', 'en')),
    system_prompt TEXT NOT NULL,
    flow_definition JSONB NOT NULL DEFAULT '{}',
    required_fields JSONB NOT NULL DEFAULT '[]',
    validation_rules JSONB DEFAULT '{}',
    created_by VARCHAR(100) DEFAULT 'system',
    published_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Escalations table
CREATE TABLE escalations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
    status VARCHAR(50) NOT NULL CHECK (status IN ('pending', 'assigned', 'resolved')),
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    summary TEXT NOT NULL,
    assigned_to VARCHAR(100),
    assigned_at TIMESTAMP,
    resolved_at TIMESTAMP,
    agent_notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Session events (audit log)
CREATE TABLE session_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL,
    event_data JSONB DEFAULT '{}',
    timestamp TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Analytics aggregates (for performance)
CREATE TABLE daily_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL UNIQUE,
    total_sessions INTEGER DEFAULT 0,
    completed_sessions INTEGER DEFAULT 0,
    escalated_sessions INTEGER DEFAULT 0,
    abandoned_sessions INTEGER DEFAULT 0,
    avg_duration_seconds NUMERIC(10, 2),
    avg_satisfaction_score NUMERIC(3, 2),
    total_cost_usd NUMERIC(10, 4),
    completeness_rate NUMERIC(5, 2),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Safety events (abuse tracking)
CREATE TABLE safety_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
    event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('profanity', 'off_topic', 'prompt_injection', 'loop_detected', 'timeout', 'abuse')),
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('warning', 'critical')),
    details TEXT,
    action_taken VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_sessions_status ON sessions(status);
CREATE INDEX idx_sessions_started_at ON sessions(started_at DESC);
CREATE INDEX idx_sessions_flow_id ON sessions(flow_id);
CREATE INDEX idx_transcripts_session ON transcripts(session_id, timestamp);
CREATE INDEX idx_session_data_session ON session_data(session_id);
CREATE INDEX idx_escalations_status ON escalations(status);
CREATE INDEX idx_escalations_session ON escalations(session_id);
CREATE INDEX idx_flows_status ON flows(status, language);
CREATE INDEX idx_session_events_session ON session_events(session_id, timestamp);
CREATE INDEX idx_safety_events_session ON safety_events(session_id);

-- Add foreign key for flow_id after flows table is created
ALTER TABLE sessions ADD CONSTRAINT fk_sessions_flow FOREIGN KEY (flow_id) REFERENCES flows(id) ON DELETE SET NULL;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_session_data_updated_at BEFORE UPDATE ON session_data FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_flows_updated_at BEFORE UPDATE ON flows FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_escalations_updated_at BEFORE UPDATE ON escalations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Include additional triggers from triggers.sql
\i 'triggers.sql';
