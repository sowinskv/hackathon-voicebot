-- Auto-Generator Service Database Schema
-- Run this to set up the required database tables

-- Transcripts table
CREATE TABLE IF NOT EXISTS transcripts (
  id SERIAL PRIMARY KEY,
  project_id INTEGER,
  file_name VARCHAR(255),
  file_path TEXT,
  transcript TEXT NOT NULL,
  description TEXT,
  source VARCHAR(50) DEFAULT 'upload',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_transcripts_project_id ON transcripts(project_id);
CREATE INDEX idx_transcripts_created_at ON transcripts(created_at DESC);

-- Analysis table
CREATE TABLE IF NOT EXISTS transcript_analysis (
  id SERIAL PRIMARY KEY,
  transcript_id INTEGER REFERENCES transcripts(id) ON DELETE CASCADE,
  pattern JSONB NOT NULL,
  insights JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT unique_transcript_analysis UNIQUE(transcript_id)
);

CREATE INDEX idx_transcript_analysis_transcript_id ON transcript_analysis(transcript_id);

-- Generated flows table
CREATE TABLE IF NOT EXISTS generated_flows (
  id SERIAL PRIMARY KEY,
  transcript_id INTEGER REFERENCES transcripts(id) ON DELETE CASCADE,
  flow_data JSONB NOT NULL,
  visualization TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_generated_flows_transcript_id ON generated_flows(transcript_id);
CREATE INDEX idx_generated_flows_created_at ON generated_flows(created_at DESC);

-- Generated prompts table
CREATE TABLE IF NOT EXISTS generated_prompts (
  id SERIAL PRIMARY KEY,
  transcript_id INTEGER REFERENCES transcripts(id) ON DELETE CASCADE,
  prompt_data JSONB NOT NULL,
  formatted_prompt TEXT,
  validation_rules JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_generated_prompts_transcript_id ON generated_prompts(transcript_id);
CREATE INDEX idx_generated_prompts_created_at ON generated_prompts(created_at DESC);

-- Improvement suggestions table
CREATE TABLE IF NOT EXISTS improvement_suggestions (
  id SERIAL PRIMARY KEY,
  project_id INTEGER,
  analytics JSONB,
  suggestions JSONB NOT NULL,
  next_steps JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_improvement_suggestions_project_id ON improvement_suggestions(project_id);
CREATE INDEX idx_improvement_suggestions_created_at ON improvement_suggestions(created_at DESC);

-- Supporting tables for analytics

-- Conversation errors table
CREATE TABLE IF NOT EXISTS conversation_errors (
  id SERIAL PRIMARY KEY,
  project_id INTEGER,
  conversation_id INTEGER,
  error_type VARCHAR(255),
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_conversation_errors_project_id ON conversation_errors(project_id);
CREATE INDEX idx_conversation_errors_conversation_id ON conversation_errors(conversation_id);
CREATE INDEX idx_conversation_errors_error_type ON conversation_errors(error_type);

-- Conversation feedback table
CREATE TABLE IF NOT EXISTS conversation_feedback (
  id SERIAL PRIMARY KEY,
  project_id INTEGER,
  conversation_id INTEGER,
  sentiment VARCHAR(50),
  feedback TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_conversation_feedback_project_id ON conversation_feedback(project_id);
CREATE INDEX idx_conversation_feedback_conversation_id ON conversation_feedback(conversation_id);
CREATE INDEX idx_conversation_feedback_sentiment ON conversation_feedback(sentiment);

-- Conversations table (if not already exists in main database)
-- This is needed for the analytics queries
CREATE TABLE IF NOT EXISTS conversations (
  id SERIAL PRIMARY KEY,
  project_id INTEGER,
  status VARCHAR(50),
  started_at TIMESTAMP,
  ended_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_conversations_project_id ON conversations(project_id);
CREATE INDEX idx_conversations_status ON conversations(status);

-- Messages table (if not already exists in main database)
CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  conversation_id INTEGER REFERENCES conversations(id) ON DELETE CASCADE,
  role VARCHAR(50),
  content TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);

-- Insert sample data for testing (optional)
-- Uncomment to add test data

/*
INSERT INTO transcripts (transcript, description, source) VALUES
('Agent: Hello, thank you for calling ABC Company. My name is Sarah, how can I help you today?
Customer: Hi, I need to schedule a service appointment.
Agent: I''d be happy to help with that. Can I get your name please?
Customer: It''s John Smith.
Agent: Thank you, John. And what is your phone number?
Customer: It''s 555-0123.
Agent: Perfect. What day works best for you?
Customer: How about next Tuesday?
Agent: Tuesday works great. What time would you prefer?
Customer: Morning, around 10 AM?
Agent: 10 AM on Tuesday it is. Let me confirm: John Smith, 555-0123, Tuesday at 10 AM. Is that correct?
Customer: Yes, that''s right.
Agent: Perfect! You''re all set. We''ll see you on Tuesday at 10 AM. Have a great day!
Customer: Thank you, you too!',
'Sample appointment scheduling call',
'manual');
*/

-- Grant permissions (adjust as needed)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_app_user;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO your_app_user;
