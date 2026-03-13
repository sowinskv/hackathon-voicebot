-- Add JSONB field to store multi-dimensional satisfaction ratings
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS satisfaction_details JSONB DEFAULT '{}';

-- Example structure:
-- {
--   "response_quality": 4,
--   "bot_helpfulness": 5,
--   "conversation_flow": 3,
--   "speed_efficiency": 4,
--   "overall_satisfaction": 5
-- }
