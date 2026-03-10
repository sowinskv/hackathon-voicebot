-- Mock Session Data for Agent Console
-- This script adds 5 example voice call sessions to the database

-- First, get the flows IDs
DO $$
DECLARE
    english_flow_id UUID;
    polish_flow_id UUID;
BEGIN
    -- Get flow IDs from the database
    SELECT id INTO english_flow_id FROM flows WHERE name = 'OC Damage Report - English' AND status = 'published' LIMIT 1;
    SELECT id INTO polish_flow_id FROM flows WHERE name = 'OC Damage Report - Polish' AND status = 'published' LIMIT 1;

    -- If no flow IDs found, raise notice
    IF english_flow_id IS NULL AND polish_flow_id IS NULL THEN
        RAISE NOTICE 'No valid flows found in the database. Using random UUIDs instead.';
        english_flow_id := uuid_generate_v4();
        polish_flow_id := uuid_generate_v4();
    END IF;

    -- 1. Active insurance inquiry session
    INSERT INTO sessions (
        id,
        room_id,
        status,
        language,
        flow_id,
        started_at,
        ended_at,
        duration_seconds,
        escalated,
        escalated_at,
        escalation_reason,
        client_metadata,
        cost_data,
        tags,
        satisfaction_score,
        first_try_completion,
        customer_extremely_angry,
        legal_threat_detected
    ) VALUES (
        uuid_generate_v4(),
        'room_ins_' || floor(random() * 10000000)::text,
        'active',
        'en',
        english_flow_id,
        NOW() - interval '15 minutes',
        NULL, -- Still active
        900, -- 15 minutes
        FALSE,
        NULL,
        NULL,
        '{"name": "John Smith", "phone": "+1 555-123-4567", "email": "john.smith@example.com", "device_type": "mobile"}',
        '{"total_usd": 1.24, "input_tokens": 450, "output_tokens": 327, "audio_minutes": 3.5}',
        ARRAY['insurance', 'policy_update'],
        NULL, -- No satisfaction score yet
        TRUE, -- First try completion success
        FALSE, -- Customer not extremely angry
        FALSE -- No legal threats
    );

    -- Get the ID of the session we just inserted
    WITH last_session AS (
        SELECT id FROM sessions ORDER BY created_at DESC LIMIT 1
    )
    INSERT INTO transcripts (session_id, speaker, text, timestamp, sentiment, contains_legal_threat)
    SELECT
        id,
        'client',
        'Hi, I''m calling about my car insurance policy.',
        (NOW() - interval '14 minutes'),
        'neutral',
        FALSE -- No legal threat
    FROM last_session
    UNION ALL
    SELECT
        id,
        'bot',
        'Hello! I''d be happy to help with your car insurance policy. Could you please provide your policy number?',
        (NOW() - interval '13 minutes 45 seconds'),
        'positive',
        FALSE -- No legal threat
    FROM last_session
    UNION ALL
    SELECT
        id,
        'client',
        'Yes, it''s ABC123456.',
        (NOW() - interval '13 minutes 20 seconds'),
        'neutral',
        FALSE -- No legal threat
    FROM last_session
    UNION ALL
    SELECT
        id,
        'bot',
        'Thank you. I''ve found your policy. What specific information do you need today?',
        (NOW() - interval '13 minutes'),
        'positive',
        FALSE -- No legal threat
    FROM last_session
    UNION ALL
    SELECT
        id,
        'client',
        'I''d like to update my coverage limits and add roadside assistance.',
        (NOW() - interval '12 minutes 30 seconds'),
        'neutral',
        FALSE -- No legal threat
    FROM last_session;

    -- Add session data for the insurance session
    WITH last_session AS (
        SELECT id FROM sessions ORDER BY created_at DESC LIMIT 1
    )
    INSERT INTO session_data (session_id, field_name, field_value, field_type, is_confirmed)
    SELECT
        id,
        'policy_number',
        'ABC123456',
        'text',
        TRUE
    FROM last_session
    UNION ALL
    SELECT
        id,
        'coverage_type',
        'comprehensive',
        'text',
        TRUE
    FROM last_session;

    -- 2. Completed banking session
    INSERT INTO sessions (
        id,
        room_id,
        status,
        language,
        flow_id,
        started_at,
        ended_at,
        duration_seconds,
        escalated,
        escalated_at,
        escalation_reason,
        client_metadata,
        cost_data,
        tags,
        satisfaction_score,
        first_try_completion,
        customer_extremely_angry,
        legal_threat_detected
    ) VALUES (
        uuid_generate_v4(),
        'room_bnk_' || floor(random() * 10000000)::text,
        'completed',
        'en',
        english_flow_id,
        NOW() - interval '2 days 3 hours',
        NOW() - interval '2 days 2 hours 30 minutes',
        1800, -- 30 minutes
        FALSE,
        NULL,
        NULL,
        '{"name": "Emily Johnson", "phone": "+1 555-234-5678", "email": "emily.johnson@example.com", "device_type": "desktop"}',
        '{"total_usd": 2.75, "input_tokens": 950, "output_tokens": 827, "audio_minutes": 7.2}',
        ARRAY['banking', 'account_services'],
        4, -- Good satisfaction score
        TRUE, -- First try completion success
        FALSE, -- Customer not extremely angry
        FALSE -- No legal threats
    );

    -- Get the ID of the session we just inserted
    WITH last_session AS (
        SELECT id FROM sessions ORDER BY created_at DESC LIMIT 1
    )
    INSERT INTO transcripts (session_id, speaker, text, timestamp, sentiment, contains_legal_threat)
    SELECT
        id,
        'client',
        'Hi, I need to check my account balance and recent transactions.',
        (NOW() - interval '2 days 3 hours'),
        'neutral',
        FALSE -- No legal threat
    FROM last_session
    UNION ALL
    SELECT
        id,
        'bot',
        'I''d be happy to assist you. For security purposes, could you please verify your account information?',
        (NOW() - interval '2 days 2 hours 55 minutes'),
        'positive',
        FALSE -- No legal threat
    FROM last_session
    UNION ALL
    SELECT
        id,
        'client',
        'Sure, my account number is 987654321.',
        (NOW() - interval '2 days 2 hours 53 minutes'),
        'neutral',
        FALSE -- No legal threat
    FROM last_session
    UNION ALL
    SELECT
        id,
        'bot',
        'Thank you. I''ll need to verify one more piece of information. Could you please provide your date of birth?',
        (NOW() - interval '2 days 2 hours 52 minutes'),
        'positive',
        FALSE -- No legal threat
    FROM last_session;

    -- Add session data for the banking session
    WITH last_session AS (
        SELECT id FROM sessions ORDER BY created_at DESC LIMIT 1
    )
    INSERT INTO session_data (session_id, field_name, field_value, field_type, is_confirmed)
    SELECT
        id,
        'account_number',
        '987654321',
        'text',
        TRUE
    FROM last_session
    UNION ALL
    SELECT
        id,
        'transaction_type',
        'wire_transfer',
        'text',
        TRUE
    FROM last_session
    UNION ALL
    SELECT
        id,
        'amount',
        '5000',
        'number',
        TRUE
    FROM last_session;

    -- 3. Escalated technical support issue
    INSERT INTO sessions (
        id,
        room_id,
        status,
        language,
        flow_id,
        started_at,
        ended_at,
        duration_seconds,
        escalated,
        escalated_at,
        escalation_reason,
        client_metadata,
        cost_data,
        tags,
        satisfaction_score,
        first_try_completion,
        customer_extremely_angry,
        legal_threat_detected
    ) VALUES (
        uuid_generate_v4(),
        'room_sup_' || floor(random() * 10000000)::text,
        'escalated',
        'en',
        english_flow_id,
        NOW() - interval '5 hours',
        NULL, -- Not ended yet
        1200, -- 20 minutes so far
        TRUE,
        NOW() - interval '4 hours 40 minutes',
        'Complex technical issue requiring specialized support',
        '{"name": "Michael Brown", "phone": "+1 555-345-6789", "email": "michael.brown@example.com", "device_type": "tablet"}',
        '{"total_usd": 3.15, "input_tokens": 1250, "output_tokens": 1127, "audio_minutes": 10.5}',
        ARRAY['support', 'technical', 'mobile_app'],
        2, -- Poor satisfaction score
        FALSE, -- Failed first try completion
        TRUE, -- Customer extremely angry
        FALSE -- No legal threats
    );

    -- Get the ID of the session we just inserted
    WITH last_session AS (
        SELECT id FROM sessions ORDER BY created_at DESC LIMIT 1
    )
    INSERT INTO transcripts (session_id, speaker, text, timestamp, sentiment, contains_legal_threat)
    SELECT
        id,
        'client',
        'Hello, I''m having trouble with your mobile app. It keeps crashing when I try to log in.',
        (NOW() - interval '5 hours'),
        'negative',
        FALSE -- No legal threat
    FROM last_session
    UNION ALL
    SELECT
        id,
        'bot',
        'I''m sorry to hear you''re experiencing issues with our app. Let''s troubleshoot this together. What type of device are you using?',
        (NOW() - interval '4 hours 59 minutes'),
        'neutral',
        FALSE -- No legal threat
    FROM last_session
    UNION ALL
    SELECT
        id,
        'client',
        'I''m using an iPhone 13 with the latest iOS.',
        (NOW() - interval '4 hours 58 minutes'),
        'neutral',
        FALSE -- No legal threat
    FROM last_session
    UNION ALL
    SELECT
        id,
        'bot',
        'Thank you for that information. Have you tried reinstalling the app?',
        (NOW() - interval '4 hours 57 minutes'),
        'neutral',
        FALSE -- No legal threat
    FROM last_session
    UNION ALL
    SELECT
        id,
        'client',
        'Yes, twice. It still crashes right after I enter my password.',
        (NOW() - interval '4 hours 56 minutes'),
        'negative',
        FALSE -- No legal threat
    FROM last_session
    UNION ALL
    SELECT
        id,
        'bot',
        'I understand how frustrating this must be. Let''s try a few more troubleshooting steps.',
        (NOW() - interval '4 hours 55 minutes'),
        'positive',
        FALSE -- No legal threat
    FROM last_session
    UNION ALL
    SELECT
        id,
        'client',
        'I''ve already tried everything! This is ridiculous. Can I please speak to a real person?',
        (NOW() - interval '4 hours 50 minutes'),
        'negative',
        FALSE -- No legal threat
    FROM last_session
    UNION ALL
    SELECT
        id,
        'bot',
        'I understand your frustration. I''ll connect you with a specialist who can help resolve this issue.',
        (NOW() - interval '4 hours 45 minutes'),
        'neutral',
        FALSE -- No legal threat
    FROM last_session
    UNION ALL
    SELECT
        id,
        'agent',
        'Hello Mr. Brown, this is Sarah from technical support. I understand you''re having issues with our mobile app. Let me help you with that.',
        (NOW() - interval '4 hours 40 minutes'),
        'positive',
        FALSE -- No legal threat
    FROM last_session;

    -- Add session data for the technical support session
    WITH last_session AS (
        SELECT id FROM sessions ORDER BY created_at DESC LIMIT 1
    )
    INSERT INTO session_data (session_id, field_name, field_value, field_type, is_confirmed)
    SELECT
        id,
        'device_model',
        'iPhone 13',
        'text',
        TRUE
    FROM last_session
    UNION ALL
    SELECT
        id,
        'os_version',
        'iOS 16.3',
        'text',
        TRUE
    FROM last_session
    UNION ALL
    SELECT
        id,
        'app_version',
        '2.1.4',
        'text',
        TRUE
    FROM last_session;

    -- Add an escalation record
    WITH last_session AS (
        SELECT id FROM sessions ORDER BY created_at DESC LIMIT 1
    )
    INSERT INTO escalations (
        session_id,
        status,
        priority,
        summary,
        assigned_to
    )
    SELECT
        id,
        'assigned',
        'high',
        'Customer unable to log in to mobile app after multiple reinstall attempts. Issue requires technical investigation.',
        'Sarah Wilson'
    FROM last_session;

    -- 4. Completed appointment scheduling
    INSERT INTO sessions (
        id,
        room_id,
        status,
        language,
        flow_id,
        started_at,
        ended_at,
        duration_seconds,
        escalated,
        escalated_at,
        escalation_reason,
        client_metadata,
        cost_data,
        tags,
        satisfaction_score,
        first_try_completion,
        customer_extremely_angry,
        legal_threat_detected
    ) VALUES (
        uuid_generate_v4(),
        'room_apt_' || floor(random() * 10000000)::text,
        'completed',
        'pl',
        polish_flow_id,
        NOW() - interval '3 days 8 hours',
        NOW() - interval '3 days 7 hours 45 minutes',
        900, -- 15 minutes
        FALSE,
        NULL,
        NULL,
        '{"name": "Sarah Wilson", "phone": "+1 555-456-7890", "email": "sarah.wilson@example.com", "device_type": "desktop"}',
        '{"total_usd": 1.85, "input_tokens": 650, "output_tokens": 527, "audio_minutes": 5.8}',
        ARRAY['appointment', 'scheduling', 'healthcare'],
        5, -- Excellent satisfaction score
        TRUE, -- First try completion success
        FALSE, -- Customer not extremely angry
        FALSE -- No legal threats
    );

    -- Get the ID of the session we just inserted
    WITH last_session AS (
        SELECT id FROM sessions ORDER BY created_at DESC LIMIT 1
    )
    INSERT INTO transcripts (session_id, speaker, text, timestamp, sentiment, contains_legal_threat)
    SELECT
        id,
        'client',
        'Hi, I''d like to schedule a consultation with Dr. Smith.',
        (NOW() - interval '3 days 8 hours'),
        'neutral',
        FALSE -- No legal threat
    FROM last_session
    UNION ALL
    SELECT
        id,
        'bot',
        'Hello! I''d be happy to help you schedule an appointment. Do you have a preferred date and time?',
        (NOW() - interval '3 days 7 hours 59 minutes'),
        'positive',
        FALSE -- No legal threat
    FROM last_session
    UNION ALL
    SELECT
        id,
        'client',
        'I was hoping for next Tuesday afternoon if possible.',
        (NOW() - interval '3 days 7 hours 58 minutes'),
        'neutral',
        FALSE -- No legal threat
    FROM last_session
    UNION ALL
    SELECT
        id,
        'bot',
        'Let me check Dr. Smith''s availability for next Tuesday. I see he has openings at 2:00 PM and 4:30 PM. Which would you prefer?',
        (NOW() - interval '3 days 7 hours 57 minutes'),
        'neutral',
        FALSE -- No legal threat
    FROM last_session
    UNION ALL
    SELECT
        id,
        'client',
        '2:00 PM would be perfect.',
        (NOW() - interval '3 days 7 hours 56 minutes'),
        'positive',
        FALSE -- No legal threat
    FROM last_session
    UNION ALL
    SELECT
        id,
        'bot',
        'Great! I''ve scheduled your appointment with Dr. Smith for next Tuesday at 2:00 PM. Is there anything else you need help with today?',
        (NOW() - interval '3 days 7 hours 55 minutes'),
        'positive',
        FALSE -- No legal threat
    FROM last_session
    UNION ALL
    SELECT
        id,
        'client',
        'No, that''s all. Thank you so much for your help!',
        (NOW() - interval '3 days 7 hours 54 minutes'),
        'positive',
        FALSE -- No legal threat
    FROM last_session
    UNION ALL
    SELECT
        id,
        'bot',
        'You''re welcome! A confirmation will be sent to your email. Have a wonderful day!',
        (NOW() - interval '3 days 7 hours 53 minutes'),
        'positive',
        FALSE -- No legal threat
    FROM last_session;

    -- Add session data for the appointment session
    WITH last_session AS (
        SELECT id FROM sessions ORDER BY created_at DESC LIMIT 1
    )
    INSERT INTO session_data (session_id, field_name, field_value, field_type, is_confirmed)
    SELECT
        id,
        'appointment_date',
        '2026-03-17',
        'date',
        TRUE
    FROM last_session
    UNION ALL
    SELECT
        id,
        'appointment_time',
        '14:00',
        'text',
        TRUE
    FROM last_session
    UNION ALL
    SELECT
        id,
        'doctor_name',
        'Dr. Smith',
        'text',
        TRUE
    FROM last_session
    UNION ALL
    SELECT
        id,
        'service_type',
        'Annual Checkup',
        'text',
        TRUE
    FROM last_session;

    -- 5. Customer complaint (escalated and resolved)
    INSERT INTO sessions (
        id,
        room_id,
        status,
        language,
        flow_id,
        started_at,
        ended_at,
        duration_seconds,
        escalated,
        escalated_at,
        escalation_reason,
        client_metadata,
        cost_data,
        tags,
        satisfaction_score,
        first_try_completion,
        customer_extremely_angry,
        legal_threat_detected
    ) VALUES (
        uuid_generate_v4(),
        'room_cpl_' || floor(random() * 10000000)::text,
        'completed',
        'en',
        english_flow_id,
        NOW() - interval '1 day 5 hours',
        NOW() - interval '1 day 4 hours 15 minutes',
        2700, -- 45 minutes
        TRUE,
        NOW() - interval '1 day 4 hours 45 minutes',
        'Customer dissatisfaction requiring manager intervention',
        '{"name": "David Martinez", "phone": "+1 555-567-8901", "email": "david.martinez@example.com", "device_type": "mobile"}',
        '{"total_usd": 4.35, "input_tokens": 1850, "output_tokens": 1627, "audio_minutes": 15.2}',
        ARRAY['complaint', 'customer_service', 'refund'],
        1, -- Poor satisfaction score
        FALSE, -- Failed first try completion
        TRUE, -- Customer extremely angry
        TRUE -- Legal threats detected
    );

    -- Get the ID of the session we just inserted
    WITH last_session AS (
        SELECT id FROM sessions ORDER BY created_at DESC LIMIT 1
    )
    INSERT INTO transcripts (session_id, speaker, text, timestamp, sentiment, contains_legal_threat)
    SELECT
        id,
        'client',
        'I want to file a complaint about the service I received yesterday.',
        (NOW() - interval '1 day 5 hours'),
        'negative',
        FALSE -- No legal threat
    FROM last_session
    UNION ALL
    SELECT
        id,
        'bot',
        'I''m sorry to hear you had a negative experience. I''d like to help resolve this issue. Could you please provide more details about what happened?',
        (NOW() - interval '1 day 4 hours 59 minutes'),
        'neutral',
        FALSE -- No legal threat
    FROM last_session
    UNION ALL
    SELECT
        id,
        'client',
        'I waited on hold for over an hour, and then the representative was extremely rude and unhelpful. I will be contacting my lawyer about this!',
        (NOW() - interval '1 day 4 hours 58 minutes'),
        'extreme_anger',
        TRUE -- Contains legal threat
    FROM last_session
    UNION ALL
    SELECT
        id,
        'bot',
        'I sincerely apologize for that experience. That''s not the level of service we aim to provide. I''ll need to escalate this to our customer relations team.',
        (NOW() - interval '1 day 4 hours 57 minutes'),
        'neutral',
        FALSE -- No legal threat
    FROM last_session
    UNION ALL
    SELECT
        id,
        'client',
        'Yes, please do. I''m really upset about this.',
        (NOW() - interval '1 day 4 hours 56 minutes'),
        'negative',
        FALSE -- No legal threat
    FROM last_session
    UNION ALL
    SELECT
        id,
        'agent',
        'Hello Mr. Martinez, I''m Jennifer, the customer relations manager. I understand you had a negative experience yesterday. I want to personally apologize and make this right for you.',
        (NOW() - interval '1 day 4 hours 45 minutes'),
        'positive',
        FALSE -- No legal threat
    FROM last_session
    UNION ALL
    SELECT
        id,
        'client',
        'I appreciate that, but I''m still very upset about how I was treated.',
        (NOW() - interval '1 day 4 hours 44 minutes'),
        'negative',
        FALSE -- No legal threat
    FROM last_session
    UNION ALL
    SELECT
        id,
        'agent',
        'I completely understand your frustration. This is not the service standard we aim to provide. I''d like to offer you a $50 credit to your account as a gesture of goodwill.',
        (NOW() - interval '1 day 4 hours 40 minutes'),
        'positive',
        FALSE -- No legal threat
    FROM last_session
    UNION ALL
    SELECT
        id,
        'client',
        'I appreciate the gesture. I hope your company will improve its customer service.',
        (NOW() - interval '1 day 4 hours 35 minutes'),
        'neutral',
        FALSE -- No legal threat
    FROM last_session
    UNION ALL
    SELECT
        id,
        'agent',
        'We will definitely use your feedback to improve our service. I''ve applied the credit to your account, and I''ll personally follow up with you next week.',
        (NOW() - interval '1 day 4 hours 30 minutes'),
        'positive',
        FALSE -- No legal threat
    FROM last_session;

    -- Add session data for the complaint session
    WITH last_session AS (
        SELECT id FROM sessions ORDER BY created_at DESC LIMIT 1
    )
    INSERT INTO session_data (session_id, field_name, field_value, field_type, is_confirmed)
    SELECT
        id,
        'complaint_category',
        'Customer Service',
        'text',
        TRUE
    FROM last_session
    UNION ALL
    SELECT
        id,
        'previous_contact_date',
        '2026-03-09',
        'date',
        TRUE
    FROM last_session
    UNION ALL
    SELECT
        id,
        'resolution_request',
        'Apology and refund',
        'text',
        TRUE
    FROM last_session;

    -- Add an escalation record with resolved status
    WITH last_session AS (
        SELECT id FROM sessions ORDER BY created_at DESC LIMIT 1
    )
    INSERT INTO escalations (
        session_id,
        status,
        priority,
        summary,
        assigned_to,
        assigned_at,
        resolved_at,
        agent_notes
    )
    SELECT
        id,
        'resolved',
        'normal',
        'Customer complaint about wait times and previous service.',
        'Jennifer Johnson',
        NOW() - interval '1 day 4 hours 45 minutes',
        NOW() - interval '1 day 4 hours 15 minutes',
        'Customer was extremely upset about wait times and previous service. Offered a $50 credit to account and escalated feedback to operations team. Follow-up scheduled for next week.'
    FROM last_session;

    -- Add a safety event for demonstration purposes
    WITH last_session AS (
        SELECT id FROM sessions ORDER BY created_at DESC LIMIT 1
    )
    INSERT INTO safety_events (
        session_id,
        event_type,
        severity,
        details,
        action_taken
    )
    SELECT
        id,
        'profanity',
        'warning',
        'Customer used minor profanity due to frustration with previous service',
        'Customer was gently reminded to use respectful language'
    FROM last_session;

END $$;

-- Update the daily metrics to reflect our new sessions
INSERT INTO daily_metrics (
    date,
    total_sessions,
    completed_sessions,
    escalated_sessions,
    abandoned_sessions,
    avg_duration_seconds,
    avg_satisfaction_score,
    total_cost_usd,
    completeness_rate
)
VALUES
    (CURRENT_DATE, 143, 25, 3, 2, 283, 3.7, 452.18, 89.5)
ON CONFLICT (date)
DO UPDATE SET
    total_sessions = daily_metrics.total_sessions + 5,
    completed_sessions = daily_metrics.completed_sessions + 3,
    escalated_sessions = daily_metrics.escalated_sessions + 2,
    avg_duration_seconds =
        (daily_metrics.avg_duration_seconds * daily_metrics.total_sessions + 1500) /
        (daily_metrics.total_sessions + 5),
    avg_satisfaction_score =
        (daily_metrics.avg_satisfaction_score * daily_metrics.total_sessions + 12) /
        (daily_metrics.total_sessions + 5),
    total_cost_usd = daily_metrics.total_cost_usd + 13.34;